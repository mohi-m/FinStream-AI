import os
import sys
import argparse
import logging
import time
from datetime import datetime
from typing import Dict, Iterable, List, Optional, Tuple

import requests
import pandas as pd
import psycopg2
from psycopg2 import sql
from psycopg2.extras import execute_values


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
    return logging.getLogger("fact_financials_seed")


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
		CREATE TABLE IF NOT EXISTS {schema}.fact_financials (
			ticker_id varchar(10) NOT NULL,
			report_date date NOT NULL,
			report_type varchar(20) NOT NULL,
			total_revenue numeric(20,2),
			net_income numeric(20,2),
			ebitda numeric(20,2),
			total_assets numeric(20,2),
			total_liabilities numeric(20,2),
			total_equity numeric(20,2),
			cash_and_equivalents numeric(20,2),
			operating_cash_flow numeric(20,2),
			free_cash_flow numeric(20,2),
			PRIMARY KEY(ticker_id, report_date, report_type),
			CONSTRAINT fk_ticker_fin FOREIGN KEY(ticker_id) REFERENCES {schema}.dim_ticker(ticker_id)
		);
		"""
    ).format(schema=sql.Identifier(schema))

    with conn.cursor() as cur:
        cur.execute(ddl)
        conn.commit()


# --------------------------
# Alpha Vantage client with rate limiting
# --------------------------


class RateLimiter:
    def __init__(self, max_calls: int, per_seconds: int):
        self.max_calls = max_calls
        self.per_seconds = per_seconds
        self.calls: List[float] = []

    def wait(self):
        now = time.time()
        # Drop old call timestamps
        self.calls = [t for t in self.calls if now - t < self.per_seconds]
        if len(self.calls) >= self.max_calls:
            sleep_for = self.per_seconds - (now - self.calls[0]) + 0.1
            if sleep_for > 0:
                time.sleep(sleep_for)
        # record call time
        self.calls.append(time.time())


def fetch_alpha_vantage_financials(
    ticker: str,
    statement_type: str,
    api_key: str,
    limiter: RateLimiter,
    logger: logging.Logger,
    max_retries: int = 5,
) -> pd.DataFrame:
    """
    Fetch quarterly financial statement for a ticker.
    statement_type in {'INCOME_STATEMENT','BALANCE_SHEET','CASH_FLOW'}.
    Respects Alpha Vantage's rate limit by using the provided limiter.
    """
    base = "https://www.alphavantage.co/query"
    params = {
        "function": statement_type,
        "symbol": ticker,
        "apikey": api_key,
    }

    for attempt in range(1, max_retries + 1):
        try:
            limiter.wait()
            r = requests.get(base, params=params, timeout=30)
            if r.status_code == 200:
                data: Dict = {}
                try:
                    data = r.json()
                except Exception:
                    data = {}

                # Alpha Vantage returns 'Note' when throttled and 'Information' for errors
                if "Note" in data or "Information" in data:
                    msg = data.get("Note") or data.get("Information") or ""
                    logger.debug(
                        "AV throttle/info for %s %s (attempt %d/%d): %s",
                        ticker,
                        statement_type,
                        attempt,
                        max_retries,
                        msg,
                    )
                    # Exponential backoff then retry
                    time.sleep(min(60, 2**attempt))
                    continue

                if "quarterlyReports" not in data:
                    logger.debug(
                        "No quarterlyReports in response for %s %s",
                        ticker,
                        statement_type,
                    )
                    return pd.DataFrame()

                df = pd.DataFrame(data["quarterlyReports"])  # type: ignore[index]
                return df
            else:
                logger.debug(
                    "HTTP %s from AV for %s %s (attempt %d/%d)",
                    r.status_code,
                    ticker,
                    statement_type,
                    attempt,
                    max_retries,
                )
        except Exception as e:
            logger.debug(
                "Request error for %s %s (attempt %d/%d): %s",
                ticker,
                statement_type,
                attempt,
                max_retries,
                e,
            )

        time.sleep(min(60, 2**attempt))

    logger.warning("Failed to fetch %s for %s after retries", statement_type, ticker)
    return pd.DataFrame()


def build_financials_dataframe(
    inc: pd.DataFrame, bal: pd.DataFrame, cf: pd.DataFrame
) -> pd.DataFrame:
    """
    Merge income, balance sheet, and cash flow quarterly frames on fiscalDateEnding
    and map to our schema columns. Returns an index-free DataFrame.
    """
    dfs: List[pd.DataFrame] = []

    # Income Statement columns
    inc_cols = ["totalRevenue", "netIncome", "ebitda"]
    if inc is not None and not inc.empty and "fiscalDateEnding" in inc.columns:
        df = inc[
            ["fiscalDateEnding"] + [c for c in inc_cols if c in inc.columns]
        ].copy()
        df["fiscalDateEnding"] = pd.to_datetime(df["fiscalDateEnding"], errors="coerce")
        df = df.set_index("fiscalDateEnding")
        dfs.append(df)

    # Balance Sheet columns
    bal_cols = [
        "totalAssets",
        "totalLiabilities",
        "totalShareholderEquity",
        "cashAndCashEquivalentsAtCarryingValue",
    ]
    if bal is not None and not bal.empty and "fiscalDateEnding" in bal.columns:
        df = bal[
            ["fiscalDateEnding"] + [c for c in bal_cols if c in bal.columns]
        ].copy()
        df["fiscalDateEnding"] = pd.to_datetime(df["fiscalDateEnding"], errors="coerce")
        df = df.set_index("fiscalDateEnding")
        dfs.append(df)

    # Cash Flow columns
    cf_cols = ["operatingCashflow", "capitalExpenditures", "freeCashFlow"]
    if cf is not None and not cf.empty and "fiscalDateEnding" in cf.columns:
        df = cf[["fiscalDateEnding"] + [c for c in cf_cols if c in cf.columns]].copy()
        df["fiscalDateEnding"] = pd.to_datetime(df["fiscalDateEnding"], errors="coerce")
        df = df.set_index("fiscalDateEnding")
        dfs.append(df)

    if not dfs:
        return pd.DataFrame()

    full = pd.concat(dfs, axis=1)

    # Normalize potential column name variations
    # Alpha Vantage sometimes uses 'freeCashflow' (lowercase f) in CASH_FLOW
    if "freeCashflow" in full.columns and "freeCashFlow" not in full.columns:
        full["freeCashFlow"] = full["freeCashflow"]

    # Coerce all to numeric where possible
    full = full.apply(pd.to_numeric, errors="coerce")

    # Calculate free cash flow if components are available
    if "operatingCashflow" in full.columns and "capitalExpenditures" in full.columns:
        full["freeCashFlow"] = full["operatingCashflow"] - full["capitalExpenditures"]

    schema_map = {
        "totalRevenue": "total_revenue",
        "netIncome": "net_income",
        "ebitda": "ebitda",
        "totalAssets": "total_assets",
        "totalLiabilities": "total_liabilities",
        "totalShareholderEquity": "total_equity",
        "cashAndCashEquivalentsAtCarryingValue": "cash_and_equivalents",
        "operatingCashflow": "operating_cash_flow",
        "freeCashFlow": "free_cash_flow",
    }

    present = [c for c in schema_map.keys() if c in full.columns]
    if not present:
        return pd.DataFrame()

    fin = full[present].rename(columns=schema_map)
    fin.index.name = "report_date"
    fin = fin.reset_index()

    # Keep only last 5 years
    five_years_ago = pd.Timestamp(datetime.utcnow()) - pd.DateOffset(years=5)
    fin = fin[fin["report_date"] >= five_years_ago]

    return fin


# --------------------------
# Persistence
# --------------------------


def upsert_fact_financials(
    conn,
    schema: str,
    rows: List[
        Tuple[
            str,  # ticker_id
            datetime,  # report_date
            str,  # report_type
            Optional[float],  # total_revenue
            Optional[float],  # net_income
            Optional[float],  # ebitda
            Optional[float],  # total_assets
            Optional[float],  # total_liabilities
            Optional[float],  # total_equity
            Optional[float],  # cash_and_equivalents
            Optional[float],  # operating_cash_flow
            Optional[float],  # free_cash_flow
        ]
    ],
):
    if not rows:
        return

    insert_sql = sql.SQL(
        """
		INSERT INTO {schema}.fact_financials
			(ticker_id, report_date, report_type,
			total_revenue, net_income, ebitda,
			total_assets, total_liabilities, total_equity,
			cash_and_equivalents, operating_cash_flow, free_cash_flow)
		VALUES %s
		ON CONFLICT (ticker_id, report_date, report_type) DO UPDATE SET
			total_revenue = EXCLUDED.total_revenue,
			net_income = EXCLUDED.net_income,
			ebitda = EXCLUDED.ebitda,
			total_assets = EXCLUDED.total_assets,
			total_liabilities = EXCLUDED.total_liabilities,
			total_equity = EXCLUDED.total_equity,
			cash_and_equivalents = EXCLUDED.cash_and_equivalents,
			operating_cash_flow = EXCLUDED.operating_cash_flow,
			free_cash_flow = EXCLUDED.free_cash_flow
		"""
    ).format(schema=sql.Identifier(schema))

    with conn.cursor() as cur:
        execute_values(cur, insert_sql.as_string(cur), rows)


def df_to_rows(ticker: str, df: pd.DataFrame) -> List[Tuple]:
    rows: List[Tuple] = []
    if df is None or df.empty:
        return rows
    for _, rec in df.iterrows():
        dt_val = rec.get("report_date")
        if pd.isna(dt_val):
            continue
        # Normalize to date
        dt = dt_val.to_pydatetime() if hasattr(dt_val, "to_pydatetime") else dt_val
        dt = datetime(dt.year, dt.month, dt.day)

        def as_float(x) -> Optional[float]:
            try:
                if x is None:
                    return None
                if pd.isna(x):
                    return None
                return float(x)
            except Exception:
                return None

        rows.append(
            (
                ticker,
                dt,
                "quarterly",
                as_float(rec.get("total_revenue")),
                as_float(rec.get("net_income")),
                as_float(rec.get("ebitda")),
                as_float(rec.get("total_assets")),
                as_float(rec.get("total_liabilities")),
                as_float(rec.get("total_equity")),
                as_float(rec.get("cash_and_equivalents")),
                as_float(rec.get("operating_cash_flow")),
                as_float(rec.get("free_cash_flow")),
            )
        )
    return rows


# --------------------------
# CLI
# --------------------------


def main():
    parser = argparse.ArgumentParser(
        description="Seed fact_financials (quarterly, last 5 years) from Alpha Vantage"
    )
    parser.add_argument(
        "-f",
        "--from-file",
        dest="tickers_file",
        required=True,
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
        "--max-calls-per-min",
        type=int,
        default=int(os.getenv("ALPHAVANTAGE_MAX_CALLS_PER_MIN", "5")),
        help="Max API calls per minute (default 5)",
    )
    parser.add_argument(
        "--sleep-after-ticker",
        type=float,
        default=float(os.getenv("SLEEP_AFTER_TICKER", "0")),
        help="Optional extra sleep seconds after each ticker",
    )
    parser.add_argument("--verbose", action="store_true", help="Verbose logging")

    args = parser.parse_args()
    logger = setup_logger(args.verbose)

    try:
        api_key = get_env("ALPHAVANTAGE_API_KEY", required=True)
        tickers = read_tickers_from_file(args.tickers_file)
        if not tickers:
            logger.error("Ticker file yielded no symbols: %s", args.tickers_file)
            return 2

        conn = connect_pg()
        schema = args.schema
        if args.create_table:
            logger.info("Ensuring table %s.fact_financials exists", schema)
            ensure_table(conn, schema)

        limiter = RateLimiter(max_calls=args.max_calls_per_min, per_seconds=60)

        total_rows = 0
        for t in tickers:
            logger.info("Processing %s", t)
            inc = fetch_alpha_vantage_financials(
                t, "INCOME_STATEMENT", api_key, limiter, logger
            )
            bal = fetch_alpha_vantage_financials(
                t, "BALANCE_SHEET", api_key, limiter, logger
            )
            cf = fetch_alpha_vantage_financials(
                t, "CASH_FLOW", api_key, limiter, logger
            )

            fin_df = build_financials_dataframe(inc, bal, cf)
            if fin_df is None or fin_df.empty:
                logger.warning("No financial data for %s", t)
                if args.sleep_after_ticker > 0:
                    time.sleep(args.sleep_after_ticker)
                continue

            rows = df_to_rows(t, fin_df)
            if rows:
                upsert_fact_financials(conn, schema, rows)
                conn.commit()
                total_rows += len(rows)
                logger.debug("Committed %d rows for %s", len(rows), t)

            if args.sleep_after_ticker > 0:
                time.sleep(args.sleep_after_ticker)

        logger.info("Seeding completed: %d rows processed", total_rows)
        return 0
    except Exception as e:
        logger.exception("Seeding failed: %s", e)
        return 1


if __name__ == "__main__":
    sys.exit(main())
