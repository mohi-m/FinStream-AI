"""Utilities for downloading latest SEC 10-K filings as HTML.

This module wraps ``sec-edgar-downloader`` with:
- User-Agent normalization for SEC-compliant requests.
- Discovery of newly downloaded filing HTML files.
- Single- and batch-ticker download helpers.
- A CLI entrypoint for local/script execution.
"""

import argparse
import csv
import datetime
import logging
import os
import time
from pathlib import Path

from sec_edgar_downloader._Downloader import Downloader

logger = logging.getLogger(__name__)

DEFAULT_REQUEST_PAUSE_SECONDS = float(
    os.getenv("SEC_EDGAR_REQUEST_PAUSE_SECONDS", "2.0")
)
HTML_SUFFIXES = {".htm", ".html"}


class SecDownloadError(RuntimeError):
    """Domain-specific error for SEC 10-K download and discovery failures."""

    pass


def download_latest_10k(ticker: str, save_directory: str) -> None:
    """Download the latest 10-K filing for a single ticker and return its path.

    Args:
        ticker: Stock ticker symbol (for example, ``AAPL``).
        save_directory: Local directory where files should be downloaded.
        user_agent: SEC-compliant User-Agent string.

    Returns:
        Absolute path (as string) to the selected downloaded HTML filing file.

    Raises:
        ValueError: If ``ticker`` is empty.
        SecDownloadError: If SEC request fails, ticker is invalid, or no HTML file
            can be located after download.
    """
    logger.info("Starting 10-K download for %s", ticker)

    base_dir = Path(save_directory).expanduser().resolve()

    downloader = Downloader(
        "Mohi", "mohimadhu25@gmail.com", download_folder=str(base_dir)
    )

    # ToDo - Make it config driven
    after_date = datetime.date(2025, 6, 1)

    try:
        downloader.get("10-K", ticker, after=after_date, download_details=True)
    except Exception as exc:
        logger.error("Failed to download 10-K for %s: %s", ticker, str(exc))
        

    logger.info("Downloaded latest 10-K for %s", ticker)


def load_tickers_from_csv(ticker_csv: str) -> list[str]:
    """Load ticker symbols from a CSV file.

    Args:
        ticker_csv: Path to a CSV file containing ticker symbols.

    Returns:
        List of normalized ticker symbols.

    Raises:
        FileNotFoundError: If ``ticker_csv`` does not exist.
        ValueError: If the file has no valid symbols.
    """

    path = Path(ticker_csv).expanduser().resolve()

    if not path.exists():
        raise FileNotFoundError(f"Ticker file not found: {path}")

    content = path.read_text(encoding="utf-8").strip()
    if not content:
        raise ValueError(f"Ticker file is empty: {path}")

    tickers: list[str] = []

    reader = csv.reader(content.splitlines())
    for row in reader:
        for cell in row:
            symbol = cell.strip().upper()
            if symbol:
                tickers.append(symbol)

    # Remove duplicates
    tickers = list(dict.fromkeys(tickers))
    if not tickers:
        raise ValueError(f"No valid tickers found in: {path}")

    logger.info("Loaded %d unique tickers from %s", len(tickers), path)

    return tickers


def download_latest_10k_for_tickers(
    ticker_csv: str,
    save_directory: str,
    pause_seconds: float = DEFAULT_REQUEST_PAUSE_SECONDS,
) -> None:
    """Download latest 10-K filings for all tickers in a text file.

    Args:
        ticker_csv: Path to CSV file with ticker symbols.
        save_directory: Directory where filings are stored.
        user_agent: SEC-compliant User-Agent string.
        pause_seconds: Seconds to sleep between SEC API calls.

    Returns:
        Mapping of ticker -> downloaded HTML path, or ``None`` when that ticker
        fails.

    Raises:
        SecDownloadError: If all ticker downloads fail.
        FileNotFoundError: If ticker file is missing.
        ValueError: If ticker file has no valid entries.
    """

    tickers = load_tickers_from_csv(ticker_csv)

    for index, ticker in enumerate(tickers):
        if index > 0 and pause_seconds > 0:
            time.sleep(pause_seconds)

        download_latest_10k(ticker, save_directory)


def _build_arg_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser for 10-K download operations.

    Returns:
        Configured ``argparse.ArgumentParser``.
    """

    parser = argparse.ArgumentParser(
        description="Download latest SEC 10-K filing HTML files"
    )
    parser.add_argument(
        "--ticker-csv",
        type=str,
        help="Path to CSV file containing ticker symbols (alias of --ticker-file)",
    )
    parser.add_argument(
        "--save-directory",
        type=str,
        required=True,
        help="Directory to store downloaded filings",
    )
    parser.add_argument(
        "--pause-seconds",
        type=float,
        default=DEFAULT_REQUEST_PAUSE_SECONDS,
        help="Seconds to wait between SEC API calls in batch mode",
    )
    return parser


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
    )
    args = _build_arg_parser().parse_args()

    logger.info("Save Directory: %s", args.save_directory)

    download_latest_10k_for_tickers(
        ticker_csv=args.ticker_csv,
        save_directory=args.save_directory,
        pause_seconds=args.pause_seconds,
    )
    logger.info(
        "Completed batch 10-K download process for tickers csv in %s", args.ticker_csv
    )
