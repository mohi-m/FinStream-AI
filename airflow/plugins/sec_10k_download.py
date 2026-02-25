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
from pathlib import Path
from typing import Dict, Optional, Set

from sec_edgar_downloader._Downloader import Downloader

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = os.getenv("SEC_EDGAR_USER_AGENT", "TestUser testuser@example.com")
HTML_SUFFIXES = {".htm", ".html"}


class SecDownloadError(RuntimeError):
    """Domain-specific error for SEC 10-K download and discovery failures."""

    pass


def _split_user_agent(user_agent: str) -> tuple[str, str]:
    """Split a User-Agent string into company name and email address.

    Args:
        user_agent: Raw User-Agent string. Expected format is typically
            ``"Company Name email@example.com"``.

    Returns:
        A tuple of ``(company_name, email_address)``.

    Notes:
        - Falls back to defaults when input is empty.
        - If no email is present in ``user_agent``, uses ``SEC_EDGAR_EMAIL``
          (or a built-in fallback).
    """

    value = (user_agent or "").strip()
    if not value:
        return "FinStream-AI", "mohimadhu25@gmail.com"

    parts = value.split()
    if len(parts) >= 2 and "@" in parts[-1]:
        company_name = " ".join(parts[:-1]).strip() or "FinStream-AI"
        email_address = parts[-1].strip()
        return company_name, email_address

    fallback_email = os.getenv("SEC_EDGAR_EMAIL", "mohimadhu25@gmail.com")
    return value, fallback_email


def _create_downloader(save_directory: Path, user_agent: str) -> Downloader:
    """Create and configure an EDGAR downloader instance.

    Args:
        save_directory: Base directory where filing artifacts are stored.
        user_agent: User-Agent string to identify the requester to SEC.

    Returns:
        Configured ``Downloader`` instance.
    """

    save_directory.mkdir(parents=True, exist_ok=True)

    company_name, email_address = _split_user_agent(user_agent)
    return Downloader(company_name, email_address, download_folder=str(save_directory))


def _find_html_files(root: Path) -> Set[Path]:
    """Recursively find HTML files below a directory.

    Args:
        root: Root directory to search.

    Returns:
        Set of absolute file paths ending with supported HTML suffixes.
    """

    if not root.exists():
        return set()
    return {
        path.resolve()
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in HTML_SUFFIXES
    }


def _pick_latest_html(candidate_files: Set[Path], ticker: str) -> Optional[Path]:
    """Select the most recently modified filing HTML file.

    Preference is given to paths containing both the ticker and ``10-K``.
    If none match, this falls back to the latest file in the full candidate set.

    Args:
        candidate_files: Set of discovered HTML files.
        ticker: Ticker symbol used to prioritize matching files.

    Returns:
        Path to the selected file, or ``None`` if no candidates exist.
    """

    ticker_upper = ticker.upper()

    filtered = [
        path
        for path in candidate_files
        if ticker_upper in str(path).upper() and "10-K" in str(path).upper()
    ]
    pool = filtered if filtered else list(candidate_files)
    if not pool:
        return None

    return max(pool, key=lambda path: path.stat().st_mtime)


def download_latest_10k(
    ticker: str,
    save_directory: str,
    user_agent: str = DEFAULT_USER_AGENT,
) -> str:
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

    ticker_upper = ticker.strip().upper()
    if not ticker_upper:
        raise ValueError("Ticker cannot be empty.")

    base_dir = Path(save_directory).expanduser().resolve()
    downloader = _create_downloader(base_dir, user_agent)

    before_files = _find_html_files(base_dir)

    # Create a date object for 2025-01-01
    after_date = datetime.date(2025, 1, 1)

    try:
        downloader.get("10-K", ticker_upper, after=after_date, download_details=True)
    except Exception as exc:
        message = str(exc)
        lowered = message.lower()
        if "404" in lowered or "invalid" in lowered or "not found" in lowered:
            raise SecDownloadError(
                f"Invalid ticker or no 10-K found for '{ticker_upper}'."
            ) from exc
        if "403" in lowered or "forbidden" in lowered:
            raise SecDownloadError(
                "SEC API rejected the request (403). Check SEC_EDGAR_USER_AGENT format."
            ) from exc
        raise SecDownloadError(
            f"SEC EDGAR request failed for '{ticker_upper}'. The API may be unavailable."
        ) from exc

    after_files = _find_html_files(base_dir)
    new_files = after_files - before_files

    target = _pick_latest_html(new_files, ticker_upper)
    if target is None:
        target = _pick_latest_html(after_files, ticker_upper)

    if target is None:
        raise SecDownloadError(
            f"10-K download completed for '{ticker_upper}', but no HTML file was found in '{base_dir}'."
        )

    logger.info("Downloaded latest 10-K for %s to %s", ticker_upper, target)
    return str(target)


def load_tickers_from_txt(ticker_file: str) -> list[str]:
    """Load ticker symbols from a text file.

    The parser accepts comma-separated and/or newline-separated input, strips
    whitespace, and normalizes symbols to uppercase.

    Args:
        ticker_file: Path to a plain text file containing ticker symbols.

    Returns:
        List of normalized ticker symbols.

    Raises:
        FileNotFoundError: If ``ticker_file`` does not exist.
        ValueError: If the file has no valid symbols.
    """

    path = Path(ticker_file).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(f"Ticker file not found: {path}")

    content = path.read_text(encoding="utf-8").strip()
    if not content:
        raise ValueError(f"Ticker file is empty: {path}")

    tickers: list[str] = []

    if path.suffix.lower() == ".csv":
        reader = csv.reader(content.splitlines())
        first_row = next(reader, [])
        first_row_norm = [cell.strip().lower() for cell in first_row]

        if "ticker" in first_row_norm:
            dict_reader = csv.DictReader(content.splitlines())
            for row in dict_reader:
                symbol = (row.get("ticker") or row.get("Ticker") or "").strip().upper()
                if symbol:
                    tickers.append(symbol)
        else:
            for row in csv.reader(content.splitlines()):
                for cell in row:
                    symbol = cell.strip().upper()
                    if symbol:
                        tickers.append(symbol)
    else:
        tickers = [
            symbol.strip().upper()
            for symbol in content.replace(",", "\n").splitlines()
            if symbol.strip()
        ]

    tickers = list(dict.fromkeys(tickers))
    if not tickers:
        raise ValueError(f"Ticker file is empty: {path}")

    return tickers


def download_latest_10k_for_tickers(
    ticker_file: str,
    save_directory: str,
    user_agent: str = DEFAULT_USER_AGENT,
) -> Dict[str, Optional[str]]:
    """Download latest 10-K filings for all tickers in a text file.

    Args:
        ticker_file: Path to text file with ticker symbols.
        save_directory: Directory where filings are stored.
        user_agent: SEC-compliant User-Agent string.

    Returns:
        Mapping of ticker -> downloaded HTML path, or ``None`` when that ticker
        fails.

    Raises:
        SecDownloadError: If all ticker downloads fail.
        FileNotFoundError: If ticker file is missing.
        ValueError: If ticker file has no valid entries.
    """

    tickers = load_tickers_from_txt(ticker_file)
    results: Dict[str, Optional[str]] = {}

    for ticker in tickers:
        try:
            results[ticker] = download_latest_10k(
                ticker=ticker,
                save_directory=save_directory,
                user_agent=user_agent,
            )
        except Exception as exc:
            logger.error("Failed to download 10-K for %s: %s", ticker, exc)
            results[ticker] = None

    if all(path is None for path in results.values()):
        raise SecDownloadError(
            "No 10-K files were downloaded for the provided ticker list."
        )

    return results


def _build_arg_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser for 10-K download operations.

    Returns:
        Configured ``argparse.ArgumentParser``.
    """

    parser = argparse.ArgumentParser(
        description="Download latest SEC 10-K filing HTML files"
    )
    parser.add_argument("--ticker", type=str, help="Single ticker symbol to download")
    parser.add_argument(
        "--ticker-file",
        type=str,
        help="Path to ticker file (.txt or .csv) containing ticker symbols",
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
        "--user-agent",
        type=str,
        default=DEFAULT_USER_AGENT,
        help="SEC-compliant User-Agent",
    )
    return parser


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
    )
    args = _build_arg_parser().parse_args()

    ticker_file = args.ticker_csv or args.ticker_file

    if args.ticker:
        output_path = download_latest_10k(
            ticker=args.ticker,
            save_directory=args.save_directory,
            user_agent=args.user_agent,
        )
        print(output_path)
    elif ticker_file:
        output_map = download_latest_10k_for_tickers(
            ticker_file=ticker_file,
            save_directory=args.save_directory,
            user_agent=args.user_agent,
        )
        print(output_map)
    else:
        raise ValueError("Provide --ticker or --ticker-file/--ticker-csv.")
