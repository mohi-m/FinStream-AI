from __future__ import annotations

import shutil
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


def _resolve_paths() -> tuple[str, str]:
    """Resolve ticker CSV and save directory paths within the airflow workspace."""

    airflow_root = Path(__file__).resolve().parents[1]
    ticker_csv = airflow_root / "plugins" / "tickers.csv"
    save_directory = airflow_root / "data"

    if not ticker_csv.exists():
        raise FileNotFoundError(f"Ticker CSV not found: {ticker_csv}")

    return str(ticker_csv), str(save_directory)


def run_download_10k() -> dict[str, str | None]:
    """Download latest 10-K HTML filings for tickers from plugins/tickers.csv."""

    ticker_csv, save_directory = _resolve_paths()
    return sec_10k_download.download_latest_10k_for_tickers(
        ticker_file=ticker_csv,
        save_directory=save_directory,
    )


def run_extract_10k() -> dict[str, object]:
    """Extract 10-K sections from downloaded HTML files in the save directory."""

    _, save_directory = _resolve_paths()
    return sec_10k_extract.extract_10k_payloads_from_downloaded_directory(
        save_directory=save_directory
    )


def run_chunk_embed_load_10k() -> int:
    """Chunk extracted text, generate embeddings, and load into pgvector."""

    _, save_directory = _resolve_paths()
    return sec_10k_chunk_load.load_sec_filing_chunks_from_directory(save_directory)


def cleanup_temp_10k_data() -> None:
    """Delete temporary SEC 10-K artifacts created during this pipeline run."""

    _, save_directory = _resolve_paths()
    data_root = Path(save_directory)

    sec_download_dir = data_root / "sec-edgar-filings"
    if sec_download_dir.exists() and sec_download_dir.is_dir():
        shutil.rmtree(sec_download_dir, ignore_errors=False)

    for json_file in data_root.rglob("*_10k_extract_output.json"):
        if json_file.is_file():
            json_file.unlink()

    for directory in sorted(data_root.rglob("*"), reverse=True):
        if directory.is_dir() and not any(directory.iterdir()):
            directory.rmdir()


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
    download_latest_10k = PythonOperator(
        task_id="download_latest_10k",
        python_callable=run_download_10k,
    )

    extract_10k_sections = PythonOperator(
        task_id="extract_10k_sections",
        python_callable=run_extract_10k,
    )

    chunk_embed_load_10k = PythonOperator(
        task_id="chunk_embed_load_10k",
        python_callable=run_chunk_embed_load_10k,
    )

    delete_temp_10k_data = PythonOperator(
        task_id="delete_temp_10k_data",
        python_callable=cleanup_temp_10k_data,
    )

    download_latest_10k.set_downstream(extract_10k_sections)
    extract_10k_sections.set_downstream(chunk_embed_load_10k)
    chunk_embed_load_10k.set_downstream(delete_temp_10k_data)

    download_latest_10k >> extract_10k_sections >> chunk_embed_load_10k >> delete_temp_10k_data # type: ignore
