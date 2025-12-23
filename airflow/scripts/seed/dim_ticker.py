import os
import sys
import argparse
import logging
import time
from typing import Iterable, List, Optional, Tuple

import yfinance as yf
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values


def setup_logger(verbose: bool) -> logging.Logger:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    return logging.getLogger("dim_ticker_seed")


def get_env(name: str, default: Optional[str] = None, required: bool = False) -> str:
    val = os.getenv(name, default)
    if required and (val is None or val == ""):
        raise RuntimeError(f"Missing required environment variable: {name}")
    return val  # type: ignore[return-value]


def parse_tickers(
    arg_tickers: Optional[List[str]], env_tickers: Optional[str]
) -> List[str]:
    candidates: List[str] = []
    if arg_tickers:
        for t in arg_tickers:
            candidates.extend([x.strip() for x in t.split(",") if x.strip()])
    elif env_tickers:
        candidates = [x.strip() for x in env_tickers.split(",") if x.strip()]

    # Deduplicate and normalize to upper-case
    uniq = []
    seen = set()
    for t in candidates:
        u = t.upper()
        if u not in seen:
            uniq.append(u)
            seen.add(u)
    return uniq


def read_tickers_from_file(path: str) -> List[str]:
    tickers: List[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            # support comma-separated per line as well
            tickers.extend([x.strip().upper() for x in line.split(",") if x.strip()])
    # dedupe
    return sorted(set(tickers))


def connect_pg():
    conn = psycopg2.connect(
        host=get_env("PG_HOST", required=True),
        port=int(get_env("PG_PORT", "5432")),
        user=get_env("PG_USER", required=True),
        password=get_env("PG_PASSWORD", required=True),
        dbname=get_env("PG_DB", required=True),
        connect_timeout=10,
    )
    conn.autocommit = False
    return conn


def ensure_table(conn, schema: str):
    ddl = sql.SQL(
        """
		CREATE SCHEMA IF NOT EXISTS {schema};
		CREATE TABLE IF NOT EXISTS {schema}.dim_ticker(
			ticker_id varchar(10) NOT NULL,
			company_name varchar(255),
			sector varchar(100),
			industry varchar(100),
			currency varchar(10),
			last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY(ticker_id)
		);
		"""
    ).format(schema=sql.Identifier(schema))

    with conn.cursor() as cur:
        cur.execute(ddl)
        conn.commit()


def fetch_ticker_metadata(
    ticker: str, logger: logging.Logger
) -> Tuple[str, Optional[str], Optional[str], Optional[str], Optional[str]]:
    t = yf.Ticker(ticker)
    info = {}
    try:
        # yfinance 1.x: info is a dict; fields may be missing
        info = t.info or {}
    except Exception as e:
        logger.warning("Failed to fetch info for %s: %s", ticker, e)

    company_name = (
        info.get("longName") or info.get("shortName") or info.get("displayName") or None
    )
    sector = info.get("sector") or None
    industry = info.get("industry") or info.get("industryKey") or None
    currency = info.get("currency") or None
    return ticker, company_name, sector, industry, currency


def chunked(iterable: Iterable[str], size: int) -> Iterable[List[str]]:
    batch: List[str] = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def upsert_dim_ticker(
    conn,
    schema: str,
    rows: List[Tuple[str, Optional[str], Optional[str], Optional[str], Optional[str]]],
):
    if not rows:
        return
    insert_sql = sql.SQL(
        """
		INSERT INTO {schema}.dim_ticker (ticker_id, company_name, sector, industry, currency)
		VALUES %s
		ON CONFLICT (ticker_id) DO UPDATE SET
			company_name = EXCLUDED.company_name,
			sector = EXCLUDED.sector,
			industry = EXCLUDED.industry,
			currency = EXCLUDED.currency,
			last_updated = CURRENT_TIMESTAMP
		"""
    ).format(schema=sql.Identifier(schema))

    with conn.cursor() as cur:
        execute_values(cur, insert_sql.as_string(cur), rows, template=None)


def main():
    parser = argparse.ArgumentParser(description="Seed dim_ticker table from yfinance")
    parser.add_argument(
        "-t",
        "--tickers",
        nargs="*",
        help="List of tickers or comma-separated groups (e.g., AAPL MSFT or 'AAPL,MSFT')",
    )
    parser.add_argument(
        "-f",
        "--from-file",
        dest="tickers_file",
        help="Path to a file containing tickers (one per line or comma-separated)",
    )
    parser.add_argument(
        "--schema",
        default=os.getenv("PG_SCHEMA", "public"),
        help="Postgres schema name (default: env PG_SCHEMA or 'public')",
    )
    parser.add_argument(
        "--create-table",
        action="store_true",
        help="Create schema/table if not exists before seeding",
    )
    parser.add_argument(
        "--batch-size", type=int, default=25, help="Fetch tickers in batches"
    )
    parser.add_argument(
        "--sleep-seconds",
        type=float,
        default=float(os.getenv("YF_SLEEP_SECONDS", "3")),
        help="Pause in seconds between batches to avoid yfinance rate limits (default 3)",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose logging")

    args = parser.parse_args()
    logger = setup_logger(args.verbose)

    try:
        tickers: List[str] = []
        if args.tickers_file:
            tickers = read_tickers_from_file(args.tickers_file)
        else:
            tickers = parse_tickers(args.tickers, os.getenv("TICKERS"))

        if not tickers:
            logger.error(
                "No tickers provided. Use --tickers, --from-file, or TICKERS env variable."
            )
            return 2

        conn = connect_pg()
        schema = args.schema
        if args.create_table:
            logger.info("Ensuring table %s.dim_ticker exists", schema)
            ensure_table(conn, schema)

        total = 0
        for batch in chunked(tickers, args.batch_size):
            logger.info("Processing batch of %d tickers", len(batch))
            rows = [fetch_ticker_metadata(t, logger) for t in batch]
            upsert_dim_ticker(conn, schema, rows)
            conn.commit()
            total += len(rows)
            if args.sleep_seconds and args.sleep_seconds > 0:
                logger.debug(
                    "Sleeping %.1f seconds to respect rate limits", args.sleep_seconds
                )
                time.sleep(args.sleep_seconds)
        logger.info("Seed completed: %d tickers processed", total)
        return 0
    except Exception as e:
        logger.exception("Seeding failed: %s", e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
