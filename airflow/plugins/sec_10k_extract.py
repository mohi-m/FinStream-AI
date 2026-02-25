"""Utilities for extracting key sections from SEC 10-K HTML filings.

This module is designed for use inside Airflow tasks and supports:
- Parsing raw 10-K HTML with BeautifulSoup.
- TOC-aware extraction of:
    - Item 7. Management's Discussion and Analysis
  - Item 1A. Risk Factors
- Text cleaning for downstream NLP/storage.
- JSON-ready payload output with ticker and period metadata.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from html import unescape
from pathlib import Path
from typing import Optional

from bs4 import BeautifulSoup, Tag

from sec_10k_download import download_latest_10k


BLOCK_TAGS = {
    "p",
    "div",
    "li",
    "td",
    "th",
    "section",
    "article",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
}

MDA_HEADER_RE = re.compile(
    r"(?i)\bitem\s*7\b\s*[\.:\-–—]*\s*management['’`s\s]+discussion\s+and\s+analysis"
)
RISK_HEADER_RE = re.compile(r"(?i)\bitem\s*1a\b\s*[\.:\-–—]*\s*risk\s+factors")

GENERIC_ITEM_RE = re.compile(r"(?i)^\s*item\s*\d+[a-z]?\b")
MDA_END_RE = re.compile(
    r"(?i)^\s*(item\s*7a\b|item\s*8\b|item\s*9\b|part\s*iii\b|signatures?\b)"
)
RISK_END_RE = re.compile(r"(?i)^\s*(item\s*1b\b|item\s*2\b|part\s*ii\b)")

PERIOD_RE = re.compile(
    r"(?i)for\s+the\s+fiscal\s+year\s+ended\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})"
)
ALT_PERIOD_RE = re.compile(
    r"(?i)for\s+the\s+(?:annual|year(?:ly)?)\s+period\s+ended\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})"
)


def clean_text(text: str) -> str:
    """Normalize extracted filing text by removing noisy whitespace/special chars."""

    cleaned = unescape(text or "")
    cleaned = cleaned.replace("\xa0", " ")
    cleaned = re.sub(r"[\u200B-\u200F\u2028\u2029]", "", cleaned)
    cleaned = re.sub(r"\r\n?", "\n", cleaned)
    cleaned = re.sub(r"[^\S\n]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def _is_leaf_block(tag: Tag) -> bool:
    """Return True when a tag is a block node without nested block descendants."""

    for child in tag.find_all(BLOCK_TAGS):
        if child is not tag:
            return False
    return True


def _is_bold_like(tag: Tag) -> bool:
    """Detect whether a block likely represents a visual header."""

    if tag.name in {"h1", "h2", "h3", "h4", "h5", "h6", "strong", "b"}:
        return True

    style = (tag.get("style") or "").lower().replace(" ", "")
    if "font-weight:700" in style or "font-weight:bold" in style:
        return True

    return bool(tag.find(["strong", "b"]))


def _build_blocks(soup: BeautifulSoup) -> list[dict[str, object]]:
    """Create an ordered list of leaf text blocks from HTML."""

    blocks: list[dict[str, object]] = []
    for tag in soup.find_all(BLOCK_TAGS):
        if not isinstance(tag, Tag) or not _is_leaf_block(tag):
            continue

        text = clean_text(tag.get_text(" ", strip=True))
        if not text:
            continue

        blocks.append(
            {
                "text": text,
                "is_bold": _is_bold_like(tag),
            }
        )

    return blocks


def _find_toc_index(blocks: list[dict[str, object]]) -> int:
    """Find the last likely TOC index to avoid matching TOC item entries."""

    toc_idx = -1
    for i, block in enumerate(blocks):
        text = str(block["text"])
        if re.search(r"(?i)table\s+of\s+contents", text):
            toc_idx = i

    if toc_idx == -1:
        return -1

    # Extend TOC region through short Item-like lines immediately after TOC heading.
    end_idx = toc_idx
    for j in range(toc_idx + 1, min(len(blocks), toc_idx + 150)):
        text = str(blocks[j]["text"])
        if GENERIC_ITEM_RE.search(text) and len(text) < 220:
            end_idx = j
            continue
        if end_idx > toc_idx:
            break

    return end_idx


def _find_header_index(
    blocks: list[dict[str, object]],
    header_re: re.Pattern[str],
    toc_end_idx: int,
) -> Optional[int]:
    """Find first matching section header after TOC; prefer bold-like blocks."""

    candidates: list[int] = []
    for i, block in enumerate(blocks):
        if i <= toc_end_idx:
            continue
        text = str(block["text"])
        if header_re.search(text):
            candidates.append(i)

    if not candidates:
        return None

    for idx in candidates:
        if bool(blocks[idx]["is_bold"]):
            return idx

    return candidates[0]


def _next_boundary_index(
    blocks: list[dict[str, object]], start_idx: int, end_re: re.Pattern[str]
) -> int:
    """Find index of the next section boundary heading after a start index."""

    for i in range(start_idx + 1, len(blocks)):
        text = str(blocks[i]["text"])
        if bool(blocks[i]["is_bold"]) and end_re.search(text):
            return i
    return len(blocks)


def _slice_section_text(
    blocks: list[dict[str, object]], start: Optional[int], end: int
) -> str:
    """Join block text between two indices and clean final output."""

    if start is None:
        return ""

    segment = [str(block["text"]) for block in blocks[start + 1 : end]]
    return clean_text("\n".join(segment))


def extract_sections(html_content: str) -> dict[str, str]:
    """Extract Item 7 (MD&A) and Item 1A (Risk Factors) text from raw 10-K HTML.

    The extraction is TOC-aware: it first identifies the Table of Contents region
    and then finds the section headers that appear after it, preferring bold-like
    header blocks over plain text matches.

    Args:
        html_content: Raw 10-K HTML as a string.

    Returns:
        Dictionary with keys:
        - ``mda_text``
        - ``risk_text``
    """

    soup = BeautifulSoup(html_content, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    blocks = _build_blocks(soup)
    if not blocks:
        return {"mda_text": "", "risk_text": ""}

    toc_end_idx = _find_toc_index(blocks)

    mda_idx = _find_header_index(blocks, MDA_HEADER_RE, toc_end_idx)
    risk_idx = _find_header_index(blocks, RISK_HEADER_RE, toc_end_idx)

    mda_end = (
        _next_boundary_index(blocks, mda_idx, MDA_END_RE)
        if mda_idx is not None
        else len(blocks)
    )
    risk_end = (
        _next_boundary_index(blocks, risk_idx, RISK_END_RE)
        if risk_idx is not None
        else len(blocks)
    )

    mda_text = _slice_section_text(blocks, mda_idx, mda_end)
    risk_text = _slice_section_text(blocks, risk_idx, risk_end)

    return {
        "mda_text": mda_text,
        "risk_text": risk_text,
    }


def extract_10q_payload(
    html_content: str,
    ticker: str,
    period: Optional[str] = None,
) -> dict[str, str]:
    """Build JSON-ready 10-K extraction payload for Airflow tasks.

    Note:
        Function name is retained for backward compatibility. Prefer
        ``extract_10k_payload`` in new code.
    """

    sections = extract_sections(html_content)
    plain_text = clean_text(BeautifulSoup(html_content, "html.parser").get_text("\n"))
    period_match = PERIOD_RE.search(plain_text) or ALT_PERIOD_RE.search(plain_text)
    resolved_period = period or (period_match.group(1) if period_match else "")

    return {
        "ticker": (ticker or "").upper(),
        "period": resolved_period,
        "mda_text": sections.get("mda_text", ""),
        "risk_text": sections.get("risk_text", ""),
    }


def extract_10q_payload_from_file(
    input_file: str,
    ticker: str,
    period: Optional[str] = None,
) -> dict[str, str]:
    """Read a local raw 10-K HTML file and return extracted payload.

    Note:
        Function name is retained for backward compatibility. Prefer
        ``extract_10k_payload_from_file`` in new code.
    """

    html_path = Path(input_file).expanduser().resolve()
    html_content = html_path.read_text(encoding="utf-8", errors="ignore")
    return extract_10q_payload(html_content=html_content, ticker=ticker, period=period)


def extract_10k_payload(
    html_content: str,
    ticker: str,
    period: Optional[str] = None,
) -> dict[str, str]:
    """Build JSON-ready 10-K extraction payload for Airflow tasks."""

    return extract_10q_payload(html_content=html_content, ticker=ticker, period=period)


def extract_10k_payload_from_file(
    input_file: str,
    ticker: str,
    period: Optional[str] = None,
) -> dict[str, str]:
    """Read a local raw 10-K HTML file and return extracted payload."""

    return extract_10q_payload_from_file(
        input_file=input_file, ticker=ticker, period=period
    )


def load_tickers_from_csv(ticker_csv_file: str) -> list[str]:
    """Load ticker symbols from CSV.

    Supports either:
    - A header row with a ``ticker`` column, or
    - Plain rows/cells containing ticker symbols.
    """

    path = Path(ticker_csv_file).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(f"Ticker CSV file not found: {path}")

    content = path.read_text(encoding="utf-8").strip()
    if not content:
        raise ValueError(f"Ticker CSV file is empty: {path}")

    tickers: list[str] = []

    reader = csv.reader(content.splitlines())
    first_row = next(reader, [])
    first_row_norm = [cell.strip().lower() for cell in first_row]
    has_ticker_header = "ticker" in first_row_norm

    if has_ticker_header:
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

    deduped = list(dict.fromkeys(tickers))
    if not deduped:
        raise ValueError(f"No valid ticker symbols found in CSV: {path}")

    return deduped


def extract_10k_payloads_from_ticker_csv(
    ticker_csv_file: str,
    save_directory: str,
    period: Optional[str] = None,
) -> dict[str, object]:
    """Download latest 10-K for each ticker in CSV and extract target sections."""

    tickers = load_tickers_from_csv(ticker_csv_file)
    results: dict[str, dict[str, str]] = {}
    errors: dict[str, str] = {}

    for ticker in tickers:
        try:
            html_file = download_latest_10k(
                ticker=ticker, save_directory=save_directory
            )
            results[ticker] = extract_10k_payload_from_file(
                input_file=html_file,
                ticker=ticker,
                period=period,
            )
        except Exception as exc:
            errors[ticker] = str(exc)

    return {
        "results": results,
        "errors": errors,
        "total_tickers": len(tickers),
        "success_count": len(results),
        "error_count": len(errors),
    }


def _find_latest_downloaded_10k_html(save_directory: str, ticker: str) -> Path:
    """Find the latest downloaded 10-K HTML file for a ticker under save_directory."""

    base_dir = Path(save_directory).expanduser().resolve()
    ticker_upper = (ticker or "").strip().upper()
    if not ticker_upper:
        raise ValueError("Ticker cannot be empty")

    ticker_dir = base_dir / "sec-edgar-filings" / ticker_upper / "10-K"
    search_roots = [ticker_dir, base_dir]

    candidates: list[Path] = []
    for root in search_roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".htm", ".html"}:
                continue

            upper_path = str(path).upper()
            if ticker_upper in upper_path and "10-K" in upper_path:
                candidates.append(path.resolve())

    if not candidates:
        raise FileNotFoundError(
            f"No downloaded 10-K HTML file found for ticker '{ticker_upper}' under '{base_dir}'"
        )

    return max(candidates, key=lambda file_path: file_path.stat().st_mtime)


def extract_10k_payloads_from_downloaded_ticker_csv(
    ticker_csv_file: str,
    save_directory: str,
    period: Optional[str] = None,
) -> dict[str, object]:
    """Extract sections for each ticker using already downloaded 10-K HTML files."""

    tickers = load_tickers_from_csv(ticker_csv_file)
    results: dict[str, dict[str, str]] = {}
    errors: dict[str, str] = {}

    for ticker in tickers:
        try:
            html_file = _find_latest_downloaded_10k_html(
                save_directory=save_directory,
                ticker=ticker,
            )
            results[ticker] = extract_10k_payload_from_file(
                input_file=str(html_file),
                ticker=ticker,
                period=period,
            )
        except Exception as exc:
            errors[ticker] = str(exc)

    return {
        "results": results,
        "errors": errors,
        "total_tickers": len(tickers),
        "success_count": len(results),
        "error_count": len(errors),
    }


def _build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extract Item 7 MD&A and Item 1A Risk Factors from SEC 10-K HTML filings."
    )
    parser.add_argument(
        "--input-file", required=False, help="Path to raw 10-K HTML file"
    )
    parser.add_argument("--ticker", required=False, help="Single ticker symbol")
    parser.add_argument(
        "--ticker-csv",
        required=False,
        help="Path to CSV file containing ticker list for batch extraction",
    )
    parser.add_argument(
        "--save-directory",
        required=False,
        help="Directory used to download 10-K files in batch mode",
    )
    parser.add_argument(
        "--use-downloaded-only",
        action="store_true",
        help="In batch mode, use existing downloaded files in --save-directory instead of downloading again",
    )
    parser.add_argument(
        "--period", default=None, help="Optional period override, e.g. 'June 29, 2025'"
    )
    parser.add_argument(
        "--output-json",
        default=None,
        help="Optional output file path for JSON payload; prints to stdout when omitted",
    )
    return parser


if __name__ == "__main__":
    args = _build_arg_parser().parse_args()

    if args.ticker_csv:
        if not args.save_directory:
            raise ValueError("--save-directory is required when using --ticker-csv")

        if args.use_downloaded_only:
            payload = extract_10k_payloads_from_downloaded_ticker_csv(
                ticker_csv_file=args.ticker_csv,
                save_directory=args.save_directory,
                period=args.period,
            )
        else:
            payload = extract_10k_payloads_from_ticker_csv(
                ticker_csv_file=args.ticker_csv,
                save_directory=args.save_directory,
                period=args.period,
            )
    else:
        if not args.input_file or not args.ticker:
            raise ValueError(
                "Single mode requires both --input-file and --ticker, or use --ticker-csv with --save-directory"
            )

        payload = extract_10k_payload_from_file(
            input_file=args.input_file,
            ticker=args.ticker,
            period=args.period,
        )

    output = json.dumps(payload, ensure_ascii=False, indent=2)
    if args.output_json:
        output_path = Path(args.output_json).expanduser().resolve()
        if output_path.suffix.lower() != ".json" and not output_path.is_file():
            output_path.mkdir(parents=True, exist_ok=True)
            output_path = output_path / "10k_extract_output.json"
        output_path.write_text(output, encoding="utf-8")
    else:
        print(output)
