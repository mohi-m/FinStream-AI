from __future__ import annotations

import csv
import os
import re
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

from airflow.providers.standard.operators.python import PythonOperator
from airflow.sdk import DAG

try:
    import sec_10k_chunk_load  # type: ignore
    import sec_10k_download  # type: ignore
    import sec_10k_extract  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise ImportError(f"Failed to import SEC 10-K plugin modules: {exc}")


BATCH_SIZE = 100
DEFAULT_BATCH_TEMP_ROOT = "/opt/airflow/sec_10k_tmp"


def _resolve_paths() -> tuple[str, str]:
    """Resolve ticker CSV and save directory paths within the airflow workspace."""

    airflow_root = Path(__file__).resolve().parents[1]
    ticker_csv = airflow_root / "plugins" / "tickers.csv"
    save_directory = airflow_root / "data"

    if not ticker_csv.exists():
        raise FileNotFoundError(f"Ticker CSV not found: {ticker_csv}")

    return str(ticker_csv), str(save_directory)


def _build_batch_ticker_csv(batch_tickers: list[str]) -> str:
    """Create a temporary CSV file with a single `ticker` column for one batch."""

    temp_file = tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        newline="",
        suffix=".csv",
        delete=False,
    )
    with temp_file as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["ticker"])
        for ticker in batch_tickers:
            writer.writerow([ticker])

    return temp_file.name


def _load_ticker_batches(batch_size: int = BATCH_SIZE) -> list[list[str]]:
    """Load ticker symbols and split them into fixed-size batches."""

    ticker_csv, _ = _resolve_paths()
    tickers = sec_10k_download.load_tickers_from_txt(ticker_csv)
    return [
        tickers[start : start + batch_size]
        for start in range(0, len(tickers), batch_size)
    ]


def _sanitize_path_segment(value: str) -> str:
    """Sanitize dynamic path segments for filesystem safety."""

    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value).strip("._") or "unknown"


def _resolve_batch_save_directory(batch_suffix: str, run_id: str) -> str:
    """Build and create an isolated save directory per run and batch."""

    configured_temp_root = os.getenv("SEC_10K_BATCH_TEMP_ROOT", "").strip()
    base_path = (
        Path(configured_temp_root).expanduser().resolve()
        if configured_temp_root
        else Path(DEFAULT_BATCH_TEMP_ROOT)
    )
    batch_dir = (
        base_path
        / _sanitize_path_segment(run_id)
        / _sanitize_path_segment(batch_suffix)
    )
    batch_dir.mkdir(parents=True, exist_ok=True)
    return str(batch_dir)


def run_download_10k_batch(
    batch_tickers: list[str],
    batch_suffix: str,
    run_id: str,
) -> dict[str, str | None]:
    """Download latest 10-K HTML filings for a single ticker batch."""

    save_directory = _resolve_batch_save_directory(batch_suffix, run_id)
    batch_file = _build_batch_ticker_csv(batch_tickers)
    try:
        return sec_10k_download.download_latest_10k_for_tickers(
            ticker_file=batch_file,
            save_directory=save_directory,
        )
    finally:
        Path(batch_file).unlink(missing_ok=True)


def run_extract_10k_batch(
    batch_tickers: list[str],
    batch_suffix: str,
    run_id: str,
) -> dict[str, object]:
    """Extract 10-K sections for a single ticker batch."""

    save_directory = _resolve_batch_save_directory(batch_suffix, run_id)
    batch_file = _build_batch_ticker_csv(batch_tickers)
    try:
        return sec_10k_extract.extract_10k_payloads_from_downloaded_ticker_csv(
            ticker_csv_file=batch_file,
            save_directory=save_directory,
        )
    finally:
        Path(batch_file).unlink(missing_ok=True)


def run_chunk_embed_load_10k_batch(batch_suffix: str, run_id: str) -> int:
    """Chunk extracted text, generate embeddings, and load into pgvector."""

    save_directory = _resolve_batch_save_directory(batch_suffix, run_id)
    return sec_10k_chunk_load.load_sec_filing_chunks_from_directory(save_directory)


default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 0,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="sec_10k_pipeline",
    default_args=default_args,
    description="Download, extract, chunk/embed and load SEC 10-K filings",
    schedule=None,
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["finstream", "sec", "10k", "pgvector"],
) as dag:
    ticker_batches = _load_ticker_batches(BATCH_SIZE)
    previous_download_task: PythonOperator | None = None

    for batch_number, batch_tickers in enumerate(ticker_batches, start=1):
        batch_suffix = f"batch_{batch_number:03d}"
        batch_op_kwargs = {
            "batch_tickers": batch_tickers,
            "batch_suffix": batch_suffix,
            "run_id": "{{ run_id }}",
        }

        download_latest_10k = PythonOperator(
            task_id=f"download_latest_10k_{batch_suffix}",
            python_callable=run_download_10k_batch,
            op_kwargs=batch_op_kwargs,
        )

        extract_10k_sections = PythonOperator(
            task_id=f"extract_10k_sections_{batch_suffix}",
            python_callable=run_extract_10k_batch,
            op_kwargs=batch_op_kwargs,
        )

        chunk_embed_load_10k = PythonOperator(
            task_id=f"chunk_embed_load_10k_{batch_suffix}",
            python_callable=run_chunk_embed_load_10k_batch,
            op_kwargs={
                "batch_suffix": batch_suffix,
                "run_id": "{{ run_id }}",
            },
        )

        if previous_download_task is not None:
            previous_download_task.set_downstream(download_latest_10k)

        download_latest_10k.set_downstream(extract_10k_sections)
        extract_10k_sections.set_downstream(chunk_embed_load_10k)

        previous_download_task = download_latest_10k
