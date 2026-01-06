import os
import time
import datetime
import logging
from pathlib import Path
from typing import Dict, List, Optional

import pandas as pd
import psycopg2
import psycopg2.extras as extras
import yfinance as yf
from dotenv import find_dotenv, load_dotenv

load_dotenv(find_dotenv())

logger = logging.getLogger(__name__)


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
    logger.info(f"Reading tickers from {ticker_file}")
    content = ticker_file.read_text()
    tickers = [t.strip() for t in content.replace("\n", ",").split(",") if t.strip()]
    logger.info(f"Loaded {len(tickers)} tickers: {', '.join(tickers)}")
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
    logger.info(f"Fetching latest dates for tickers: {', '.join(tickers)}")
    sql = """
        SELECT ticker_id, MAX(date) AS last_date
        FROM fact_price_daily
        WHERE ticker_id = ANY(%s)
        GROUP BY ticker_id
    """
    with conn.cursor() as cur:
        cur.execute(sql, (tickers,))
        rows = cur.fetchall()
    result = {ticker_id: last_date for ticker_id, last_date in rows}
    logger.info(f"Latest dates retrieved: {result}")
    return result


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
    logger.info(f"Fetching history for {ticker_symbol} from {start_date} to {end_date}")
    ticker = yf.Ticker(ticker_symbol)
    hist = ticker.history(start=start_date, end=end_date)
    time.sleep(throttle_seconds)
    if hist.empty:
        logger.warning(f"No price data found for {ticker_symbol} in the requested period")
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
            "Volume": "volume",
        }
    )
    hist["date"] = pd.to_datetime(hist["date"]).dt.date
    numeric_cols = ["open", "high", "low", "close"]
    hist[numeric_cols] = hist[numeric_cols].round(4)
    result = hist[
        ["ticker_id", "date", "open", "high", "low", "close", "volume"]
    ]
    logger.info(f"Retrieved {len(result)} price records for {ticker_symbol}")
    return result


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
        logger.warning("No data to upsert")
        return
    logger.info(f"Upserting {len(frame)} price records to database")
    # Convert numpy types to native Python types for psycopg2 compatibility
    frame = frame.copy()
    frame["volume"] = frame["volume"].astype("Int64").fillna(0).astype(int)
    frame["open"] = frame["open"].astype(float)
    frame["high"] = frame["high"].astype(float)
    frame["low"] = frame["low"].astype(float)
    frame["close"] = frame["close"].astype(float)
    
    # Convert to list of tuples with native Python types
    values = [
        tuple(
            int(val) if col == "volume" else (float(val) if col in ["open", "high", "low", "close"] else val)
            for col, val in zip(frame.columns, row)
        )
        for row in frame.itertuples(index=False, name=None)
    ]
    insert_sql = """
        INSERT INTO fact_price_daily
            (ticker_id, date, open, high, low, close, volume)
        VALUES %s
        ON CONFLICT (ticker_id, date) DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume;
    """
    with conn.cursor() as cur:
        extras.execute_values(cur, insert_sql, values, page_size=page_size)
    logger.info(f"Successfully upserted {len(frame)} price records")


def run_fact_price_update(
    ticker_file: str,
    end_date: Optional[str] = None,
    start_date: Optional[str] = None,
    throttle_seconds: float = 1.0,
) -> None:
    """Main entry: compute date ranges, pull prices per ticker, and upsert to Postgres.

    Args:
        ticker_file: Path to the ticker CSV file.
        end_date: Optional override for inclusive end date in YYYY-MM-DD; defaults to today.
        start_date: Optional override for inclusive start date in YYYY-MM-DD; if not provided,
                   defaults to latest_date_from_db + 1 day for existing tickers, or
                   target_end_date - 1 day for new tickers.
        throttle_seconds: Sleep duration between yfinance calls to reduce rate limit risk.

    Returns:
        None
    """
    logger.info(f"Starting fact_price_update with ticker_file={ticker_file}, start_date={start_date}, end_date={end_date}")
    tickers = _read_tickers(Path(ticker_file))

    target_end_date = (
        datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        if end_date
        else datetime.date.today()
    )
    logger.info(f"Target end date: {target_end_date}")

    override_start_date = (
        datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        if start_date
        else None
    )
    if override_start_date:
        logger.info(f"Override start date: {override_start_date}")

    fallback_start_date = target_end_date - datetime.timedelta(days=1)

    with _get_connection() as conn:
        logger.info("Connected to database")
        conn.autocommit = False
        latest_dates = _latest_dates_by_ticker(conn, tickers)

        ingested_frames: List[pd.DataFrame] = []
        logger.info(f"Processing {len(tickers)} tickers")
        for ticker_symbol in tickers:
            if override_start_date:
                # Use the provided start date for all tickers
                start_date_for_ticker = override_start_date
            else:
                # Use per-ticker logic
                latest_date_from_db = latest_dates.get(ticker_symbol)
                start_date_for_ticker = (
                    (latest_date_from_db + datetime.timedelta(days=1))
                    if latest_date_from_db
                    else fallback_start_date
                )

            if start_date_for_ticker > target_end_date:
                logger.info(f"Skipping {ticker_symbol}: start_date {start_date_for_ticker} > target_end_date {target_end_date}")
                continue

            hist = _fetch_history(
                ticker_symbol=ticker_symbol,
                start_date=start_date_for_ticker,
                end_date=target_end_date,
                throttle_seconds=throttle_seconds,
            )
            if hist.empty:
                logger.info(f"No data retrieved for {ticker_symbol}")
                continue
            ingested_frames.append(hist)

        if ingested_frames:
            combined = pd.concat(ingested_frames, ignore_index=True)
            logger.info(f"Combined {len(ingested_frames)} dataframes with {len(combined)} total records")
            _upsert_prices(conn, combined)
            conn.commit()
            logger.info("Transaction committed successfully")
        else:
            logger.warning("No data to process")
            conn.commit()
    logger.info("fact_price_update completed")
