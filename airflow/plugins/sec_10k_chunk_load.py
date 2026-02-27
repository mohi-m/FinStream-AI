"""Find extracted SEC filing JSON files, chunk text, embed, and load into pgvector."""

from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
from typing import Any

import psycopg2
from dotenv import find_dotenv, load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pgvector.psycopg2 import register_vector

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
DEFAULT_MODEL = "text-embedding-3-small"

UPSERT_SQL = """
INSERT INTO sec_filing_chunks
    (ticker, filing_year, filing_type, filing_period, item_code, chunk_index, chunk_text, embedding)
VALUES
    (%s, %s, %s, %s, %s, %s, %s, %s)
ON CONFLICT (ticker, filing_year, filing_type, filing_period, item_code, chunk_index)
DO UPDATE SET
    chunk_text = EXCLUDED.chunk_text,
    embedding = EXCLUDED.embedding,
    processed_at = CURRENT_TIMESTAMP;
"""


def configure_logging() -> None:
    """Configure console logging for script execution."""
    logging.basicConfig(
        level=os.getenv("SEC_CHUNK_LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s | %(levelname)s | %(message)s",
    )


def load_environment() -> None:
    """Load variables from the nearest .env file."""
    env_path = find_dotenv(usecwd=True)
    if env_path:
        load_dotenv(env_path)


def get_db_connection() -> psycopg2.extensions.connection:
    """Create a PostgreSQL connection using .env settings."""
    return psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "password"),
        dbname=os.getenv("PG_DB_VECTOR", "vector_database"),
        connect_timeout=10,
    )


def discover_extract_json_files(data_dir: Path) -> list[Path]:
    """Recursively find extract JSON files under the input data directory."""
    candidates = [path for path in data_dir.rglob("*.json") if path.is_file()]
    files: list[Path] = []

    for path in candidates:
        # Keep only files that look like SEC extract output.
        if "extract_output" in path.name.lower() or "10-k" in str(path).lower():
            files.append(path)

    return files


def load_json_file(path: Path) -> dict[str, Any]:
    """Read one extract JSON file into a dictionary."""
    with path.open("r", encoding="utf-8") as file:
        payload = json.load(file)
    if not isinstance(payload, dict):
        raise ValueError("JSON root must be an object.")
    return payload


def parse_year(payload: dict[str, Any]) -> int:
    """Parse filing year from payload fields."""
    year_value = (
        payload.get("filing_year") or payload.get("period") or payload.get("year")
    )
    if year_value is None:
        raise ValueError("Missing filing year metadata (filing_year/period/year).")
    year = int(str(year_value).strip())
    return year


def parse_filing_type(file_path: Path, payload: dict[str, Any]) -> str:
    """Resolve filing type from payload or file path."""
    from_payload = str(payload.get("filing_type") or payload.get("form") or "").upper()
    if from_payload in {"10-K", "10-Q"}:
        return from_payload

    path_text = str(file_path).upper()
    if "10-Q" in path_text:
        return "10-Q"
    return "10-K"


def parse_filing_period(filing_type: str, payload: dict[str, Any]) -> str:
    """Resolve filing period with simple defaults."""
    if filing_type == "10-K":
        return "FY"

    period = str(payload.get("filing_period") or payload.get("period") or "Q1").upper()
    if period.startswith("Q") and len(period) == 2:
        return period
    return "Q1"


def build_item_texts(payload: dict[str, Any], filing_type: str) -> dict[str, str]:
    """Map extract fields to SEC item codes for chunking."""
    item_texts = {
        "item_1a": str(payload.get("risk_text") or "").strip(),
        "item_3": str(payload.get("legal_text") or "").strip(),
        "item_7": str(payload.get("mda_text") or "").strip(),
        "item_7a": str(payload.get("market_risk_text") or "").strip(),
    }

    # Use 10-Q equivalents when needed.
    if filing_type == "10-Q":
        item_texts = {
            "item_1a": item_texts["item_1a"],
            "item_1": item_texts["item_3"],
            "item_2": item_texts["item_7"],
            "item_3": item_texts["item_7a"],
        }

    return {key: value for key, value in item_texts.items() if value}


def chunk_item_texts(item_texts: dict[str, str]) -> list[tuple[str, int, str]]:
    """Split each item into ordered chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    chunks: list[tuple[str, int, str]] = []
    for item_code, text in item_texts.items():
        # Chunk indexes are scoped to item_code.
        for chunk_index, chunk_text in enumerate(splitter.split_text(text)):
            chunks.append((item_code, chunk_index, chunk_text))
    return chunks


def embed_chunks(
    embedder: OpenAIEmbeddings, chunks: list[tuple[str, int, str]]
) -> list[list[float]]:
    """Generate embeddings for chunk text."""
    texts = [chunk_text for _, _, chunk_text in chunks]
    return embedder.embed_documents(texts)


def upsert_chunks(
    conn: psycopg2.extensions.connection,
    ticker: str,
    filing_year: int,
    filing_type: str,
    filing_period: str,
    chunks: list[tuple[str, int, str]],
    embeddings: list[list[float]],
) -> int:
    """Upsert chunk rows into sec_filing_chunks."""
    records = [
        (
            ticker,
            filing_year,
            filing_type,
            filing_period,
            item_code,
            chunk_index,
            chunk_text,
            embedding,
        )
        for (item_code, chunk_index, chunk_text), embedding in zip(chunks, embeddings)
    ]

    with conn.cursor() as cursor:
        cursor.executemany(UPSERT_SQL, records)
    return len(records)


def process_extract_file(
    conn: psycopg2.extensions.connection,
    embedder: OpenAIEmbeddings,
    file_path: Path,
) -> int:
    """Process one JSON extract file end-to-end."""
    payload = load_json_file(file_path)

    ticker = str(payload.get("ticker", "")).strip().upper()
    if not ticker:
        raise ValueError("Missing ticker.")

    filing_year = parse_year(payload)
    filing_type = parse_filing_type(file_path, payload)
    filing_period = parse_filing_period(filing_type, payload)
    item_texts = build_item_texts(payload, filing_type)
    if not item_texts:
        logger.warning("No supported item text found in %s", file_path)
        return 0

    chunks = chunk_item_texts(item_texts)
    if not chunks:
        return 0

    embeddings = embed_chunks(embedder, chunks)
    inserted = upsert_chunks(
        conn=conn,
        ticker=ticker,
        filing_year=filing_year,
        filing_type=filing_type,
        filing_period=filing_period,
        chunks=chunks,
        embeddings=embeddings,
    )
    logger.info("Loaded %s chunks from %s", inserted, file_path)
    return inserted


def load_sec_filing_chunks_from_directory(data_dir: str) -> int:
    """Load all SEC extract JSON files under a data directory."""
    load_environment()

    root = Path(data_dir)
    if not root.exists() or not root.is_dir():
        raise ValueError(f"Invalid data directory: {data_dir}")

    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY is not set in the environment.")

    files = discover_extract_json_files(root)
    if not files:
        logger.warning("No extract JSON files found under %s", data_dir)
        return 0

    model_name = os.getenv("OPENAI_EMBEDDING_MODEL", DEFAULT_MODEL)
    embedder = OpenAIEmbeddings(model=model_name)

    total_chunks = 0
    conn = get_db_connection()
    register_vector(conn)

    try:
        for file_path in files:
            try:
                inserted = process_extract_file(conn, embedder, file_path)
                conn.commit()
                total_chunks += inserted
            except Exception as exc:
                conn.rollback()
                logger.exception("Failed to process %s: %s", file_path, exc)
    finally:
        conn.close()

    logger.info("Completed load. files=%s total_chunks=%s", len(files), total_chunks)
    return total_chunks


def build_argument_parser() -> argparse.ArgumentParser:
    """Build CLI argument parser."""
    parser = argparse.ArgumentParser(
        description="Chunk, embed, and load SEC filing extracts."
    )
    parser.add_argument(
        "--data-dir",
        required=True,
        help="Root directory containing extracted JSON files.",
    )
    return parser


if __name__ == "__main__":
    """CLI entrypoint."""
    configure_logging()
    load_environment()
    args = build_argument_parser().parse_args()
    load_sec_filing_chunks_from_directory(args.data_dir)
