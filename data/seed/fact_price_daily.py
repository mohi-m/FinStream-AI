import os
import sys
import argparse
import logging
import time
from datetime import datetime
from typing import Iterable, List, Optional, Sequence, Tuple

import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values
import yfinance as yf
import pandas as pd


# --------------------------
# Utilities / Setup
# --------------------------


def setup_logger(verbose: bool) -> logging.Logger:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    return logging.getLogger("fact_price_daily_seed")


def get_env(name: str, default: Optional[str] = None, required: bool = False) -> str:
    val = os.getenv(name, default)
    if required and (val is None or val == ""):
        raise RuntimeError(f"Missing required environment variable: {name}")
    return val  # type: ignore[return-value]


def read_tickers_from_file(path: str) -> List[str]:
    tickers: List[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            tickers.extend([x.strip().upper() for x in line.split(",") if x.strip()])
    return sorted(set(tickers))


def chunked(iterable: Iterable[str], size: int) -> Iterable[List[str]]:
    batch: List[str] = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


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
		CREATE TABLE IF NOT EXISTS {schema}.fact_price_daily(
			ticker_id varchar(10) NOT NULL,
			"date" date NOT NULL,
			"open" numeric(15,4),
			high numeric(15,4),
			low numeric(15,4),
			close numeric(15,4),
			volume bigint,
			PRIMARY KEY(ticker_id, "date"),
			CONSTRAINT fk_ticker_price FOREIGN KEY(ticker_id) REFERENCES {schema}.dim_ticker(ticker_id)
		);
		"""
    ).format(schema=sql.Identifier(schema))

    with conn.cursor() as cur:
        cur.execute(ddl)
        conn.commit()


# --------------------------
# Data Fetch & Transform
# --------------------------


def parse_dates(
    start: Optional[str], end: Optional[str]
) -> Tuple[Optional[datetime], Optional[datetime]]:
    def _parse(d: Optional[str]) -> Optional[datetime]:
        if not d:
            return None
        return datetime.strptime(d, "%Y-%m-%d")

    return _parse(start), _parse(end)


def fetch_prices_for_batch(
    tickers: Sequence[str],
    start_dt: Optional[datetime],
    end_dt: Optional[datetime],
    period: Optional[str],
    logger: logging.Logger,
) -> List[
    Tuple[
        str,
        datetime,
        Optional[float],
        Optional[float],
        Optional[float],
        Optional[float],
        Optional[int],
    ]
]:
    """
    Returns list of rows matching (ticker_id, date, open, high, low, close, volume)
    """

    if not tickers:
        return []

    rows: List[
        Tuple[
            str,
            datetime,
            Optional[float],
            Optional[float],
            Optional[float],
            Optional[float],
            Optional[int],
        ]
    ] = []

    try:
        # Use yf.download for batch; it returns a MultiIndex columns when multiple tickers provided
        kwargs = {
            "tickers": list(tickers),
            "group_by": "ticker",
            "auto_adjust": False,
            "threads": True,
            "progress": False,
            "actions": True,
        }
        if period:
            kwargs["period"] = period
        else:
            # yfinance expects naive datetimes or strings
            if start_dt:
                kwargs["start"] = start_dt.strftime("%Y-%m-%d")
            if end_dt:
                kwargs["end"] = end_dt.strftime("%Y-%m-%d")

        df = yf.download(**kwargs)

        if df is None or len(df) == 0:
            logger.warning("No data returned for batch: %s", ",".join(tickers))
            return rows

        # Normalize to a dict of single-ticker DataFrames
        per_ticker: dict = {}
        if isinstance(df.columns, tuple) or getattr(df.columns, "nlevels", 1) > 1:
            # MultiIndex: outer level is ticker
            # Columns expected: ('AAPL', 'Open'), ... or similar
            for t in tickers:
                if t in df.columns.get_level_values(0):
                    per_ticker[t] = df[t].copy()
        else:
            # Single ticker requested case; df has columns [Open, High, Low, Close, Adj Close, Volume]
            per_ticker[tickers[0]] = df.copy()

        for t, tdf in per_ticker.items():
            # Some tickers may still be missing
            if tdf is None or len(tdf) == 0:
                logger.debug("No data for ticker %s", t)
                continue

            # Ensure expected columns exist; skip if not
            expected_cols = {"Open", "High", "Low", "Close", "Volume"}
            missing = [c for c in expected_cols if c not in tdf.columns]
            if missing:
                logger.debug(
                    "Skipping %s due to missing columns: %s", t, ", ".join(missing)
                )
                continue

            # Ensure index is sorted ascending by date
            tdf = tdf.sort_index()

            # Iterate over rows (index is date)
            for idx, rec in tdf.iterrows():
                try:
                    dt = idx.to_pydatetime() if hasattr(idx, "to_pydatetime") else idx
                    dt = datetime(
                        dt.year, dt.month, dt.day
                    )  # normalize to date (no tz)

                    o = rec.get("Open")
                    h = rec.get("High")
                    l = rec.get("Low")
                    c = rec.get("Close")
                    v = rec.get("Volume")

                    # Convert NaN to None for DB
                    def as_float(x):
                        try:
                            if x is None:
                                return None
                            try:
                                # NaN check: NaN != NaN evaluates to True
                                if x != x:  # type: ignore[operator]
                                    return None
                            except Exception:
                                pass
                            val = float(x)
                            return round(val, 4)
                        except Exception:
                            return None

                    def as_int(x):
                        try:
                            if x is None:
                                return None
                            try:
                                if x != x:  # type: ignore[operator]
                                    return None
                            except Exception:
                                pass
                            return int(x)
                        except Exception:
                            return None

                    rows.append(
                        (
                            t,
                            dt,
                            as_float(o),
                            as_float(h),
                            as_float(l),
                            as_float(c),
                            as_int(v),
                        )
                    )
                except Exception as e:
                    logger.debug("Row parse error for %s at %s: %s", t, idx, e)
                    continue
    except Exception as e:
        logger.warning("Batch fetch failed for %s: %s", ",".join(tickers), e)

    return rows


# --------------------------
# Persistence
# --------------------------


def upsert_fact_price_daily(
    conn,
    schema: str,
    rows: List[
        Tuple[
            str,
            datetime,
            Optional[float],
            Optional[float],
            Optional[float],
            Optional[float],
            Optional[int],
        ]
    ],
):
    if not rows:
        return

    insert_sql = sql.SQL(
        """
		INSERT INTO {schema}.fact_price_daily
			(ticker_id, "date", "open", high, low, close, volume)
		VALUES %s
		ON CONFLICT (ticker_id, "date") DO UPDATE SET
			"open" = EXCLUDED."open",
			high = EXCLUDED.high,
			low = EXCLUDED.low,
			close = EXCLUDED.close,
			volume = EXCLUDED.volume
		"""
    ).format(schema=sql.Identifier(schema))

    with conn.cursor() as cur:
        execute_values(cur, insert_sql.as_string(cur), rows)


# --------------------------
# CLI
# --------------------------


def main():
    parser = argparse.ArgumentParser(description="Seed fact_price_daily from yfinance")
    parser.add_argument(
        "-f",
        "--from-file",
        dest="tickers_file",
        required=True,
        help="Path to a file containing tickers (one per line or comma-separated)",
    )
    date_group = parser.add_mutually_exclusive_group(required=True)
    date_group.add_argument(
        "--period",
        help="yfinance period, e.g. '1mo', '6mo', '1y', '2y', '5y', '10y', 'max'",
    )
    date_group.add_argument("--start", help="Start date YYYY-MM-DD")
    parser.add_argument(
        "--end", help="End date YYYY-MM-DD (inclusive/exclusive by yfinance)"
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
        "--batch-size", type=int, default=10, help="Tickers per yfinance batch"
    )
    parser.add_argument(
        "--sleep-seconds",
        type=float,
        default=float(os.getenv("YF_SLEEP_SECONDS", "2")),
        help="Pause in seconds between batches to avoid yfinance rate limits",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose logging")

    args = parser.parse_args()
    logger = setup_logger(args.verbose)

    try:
        tickers = read_tickers_from_file(args.tickers_file)
        if not tickers:
            logger.error("Ticker file yielded no symbols: %s", args.tickers_file)
            return 2

        start_dt: Optional[datetime] = None
        end_dt: Optional[datetime] = None
        if args.period:
            period = args.period
        else:
            period = None
            start_dt, end_dt = parse_dates(args.start, args.end)

        conn = connect_pg()
        schema = args.schema
        if args.create_table:
            logger.info("Ensuring table %s.fact_price_daily exists", schema)
            ensure_table(conn, schema)

        total_rows = 0
        for batch in chunked(tickers, args.batch_size):
            logger.info("Fetching batch of %d tickers", len(batch))
            rows = fetch_prices_for_batch(batch, start_dt, end_dt, period, logger)
            if rows:
                upsert_fact_price_daily(conn, schema, rows)
                conn.commit()
                total_rows += len(rows)
                logger.debug("Committed %d rows", len(rows))
            else:
                logger.debug("No rows to insert for this batch")

            if args.sleep_seconds and args.sleep_seconds > 0:
                logger.debug(
                    "Sleeping %.2f seconds to respect rate limits", args.sleep_seconds
                )
                time.sleep(args.sleep_seconds)

        logger.info("Seeding completed: %d rows processed", total_rows)
        return 0
    except Exception as e:
        logger.exception("Seeding failed: %s", e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
