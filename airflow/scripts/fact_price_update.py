import os
import time
import datetime
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import psycopg2
import psycopg2.extras as extras
import yfinance as yf
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())


def _get_connection() -> psycopg2.extensions.connection:
    """Create a Postgres connection using environment variables with sane defaults.

    Returns:
        psycopg2.extensions.connection: Open connection to the target Postgres instance.
    """
    return psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "password"),
        dbname=os.getenv("PG_DB", "database"),
        connect_timeout=10,
    )


def _read_tickers(ticker_file: Path) -> List[str]:
    """Load tickers from a CSV file, tolerating newlines and trimming whitespace.

    Args:
        ticker_file: Path to the CSV file containing ticker symbols separated by commas or newlines.

    Returns:
        List[str]: Cleaned list of ticker symbols.
    """
    content = ticker_file.read_text()
    tickers = [t.strip() for t in content.replace("\n", ",").split(",") if t.strip()]
    return tickers


def _latest_dates_by_ticker(
    conn: psycopg2.extensions.connection, tickers: List[str]
) -> Dict[str, Optional[datetime.date]]:
    """Fetch the most recent loaded date per ticker from fact_price_daily.

    Args:
        conn: Active Postgres connection.
        tickers: Ticker symbols to query.

    Returns:
        Dict[str, Optional[datetime.date]]: Map of ticker to last loaded date (None if absent).
    """
    sql = """
        SELECT ticker_id, MAX(date) AS last_date
        FROM fact_price_daily
        WHERE ticker_id = ANY(%s)
        GROUP BY ticker_id
    """
    with conn.cursor() as cur:
        cur.execute(sql, (tickers,))
        rows = cur.fetchall()
    return {ticker_id: last_date for ticker_id, last_date in rows}


def _fetch_history(
    ticker_symbol: str,
    start_date: datetime.date,
    end_date: datetime.date,
    throttle_seconds: float,
) -> pd.DataFrame:
    """Download historical prices for one ticker and normalize columns for loading.

    Args:
        ticker_symbol: The ticker symbol to pull from yfinance.
        start_date: Inclusive start date for the query.
        end_date: Inclusive end date for the query.
        throttle_seconds: Sleep duration after each request to avoid rate limiting.

    Returns:
        pd.DataFrame: Normalized price data ready for insertion; empty if no rows returned.
    """
    ticker = yf.Ticker(ticker_symbol)
    hist = ticker.history(start=start_date, end=end_date)
    time.sleep(throttle_seconds)
    if hist.empty:
        return hist
    hist = hist.reset_index()
    hist["ticker_id"] = ticker_symbol
    hist = hist.rename(
        columns={
            "Date": "date",
            "Open": "open",
            "High": "high",
            "Low": "low",
            "Close": "close",
            "Adj Close": "adj_close",
            "Volume": "volume",
        }
    )
    hist["date"] = pd.to_datetime(hist["date"]).dt.date
    numeric_cols = ["open", "high", "low", "close", "adj_close"]
    hist[numeric_cols] = hist[numeric_cols].round(4)
    return hist[
        ["ticker_id", "date", "open", "high", "low", "close", "adj_close", "volume"]
    ]


def _upsert_prices(
    conn: psycopg2.extensions.connection, frame: pd.DataFrame, page_size: int = 500
) -> None:
    """Bulk upsert price rows into fact_price_daily with conflict handling.

    Args:
        conn: Active Postgres connection.
        frame: Dataframe of price rows to insert or update.
        page_size: Batch size for execute_values.

    Returns:
        None
    """
    if frame.empty:
        return
    records = frame.to_records(index=False)
    values = [tuple(row) for row in records]
    insert_sql = """
        INSERT INTO fact_price_daily
            (ticker_id, date, open, high, low, close, adj_close, volume)
        VALUES %s
        ON CONFLICT (ticker_id, date) DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            adj_close = EXCLUDED.adj_close,
            volume = EXCLUDED.volume;
    """
    with conn.cursor() as cur:
        extras.execute_values(cur, insert_sql, values, page_size=page_size)


def run(
    end_date: Optional[str] = None,
    throttle_seconds: float = 1.0,
) -> None:
    """Main entry: compute date ranges, pull prices per ticker, and upsert to Postgres.

    Args:
        end_date: Optional override for inclusive end date in YYYY-MM-DD; defaults to today.
        throttle_seconds: Sleep duration between yfinance calls to reduce rate limit risk.

    Environment:
        TICKER_FILE: Optional path to the ticker CSV file; defaults to airflow/tickers.csv.

    Returns:
        None
    """
    base_dir = Path(__file__).resolve().parent.parent
    ticker_file = Path(os.getenv("TICKER_FILE", str(base_dir / "tickers.csv")))
    tickers = _read_tickers(ticker_file)

    target_end_date = (
        datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        if end_date
        else datetime.date.today()
    )

    fallback_start_date = target_end_date - datetime.timedelta(days=1)

    with _get_connection() as conn:
        conn.autocommit = False
        latest_dates = _latest_dates_by_ticker(conn, tickers)

        ingested_frames: List[pd.DataFrame] = []
        for ticker_symbol in tickers:
            latest_date_from_db = latest_dates.get(ticker_symbol)
            start_date = (
                (latest_date_from_db + datetime.timedelta(days=1))
                if latest_date_from_db
                else fallback_start_date
            )

            if start_date > target_end_date:
                continue

            hist = _fetch_history(
                ticker_symbol=ticker_symbol,
                start_date=start_date,
                end_date=target_end_date,
                throttle_seconds=throttle_seconds,
            )
            if hist.empty:
                continue
            ingested_frames.append(hist)

        if ingested_frames:
            combined = pd.concat(ingested_frames, ignore_index=True)
            _upsert_prices(conn, combined)
        conn.commit()


if __name__ == "__main__":
    run()
