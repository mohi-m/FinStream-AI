from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

from airflow.sdk import DAG
from airflow.providers.standard.operators.python import PythonOperator

try:
    import sec_10k_chunk_load  # type: ignore
    import sec_10k_download  # type: ignore
    import sec_10k_extract  # type: ignore
except ImportError as exc:  # pragma: no cover
    raise ImportError(f"Could not import SEC 10-K plugin modules: {exc}")


def _run_download(batch_csv_path: str, save_directory: str) -> None:
    Path(save_directory).mkdir(parents=True, exist_ok=True)
    sec_10k_download.download_latest_10k_for_tickers(
        ticker_csv=batch_csv_path,
        save_directory=save_directory,
    )


def _run_extract(save_directory: str) -> None:
    sec_10k_extract.extract_10k_payloads_from_downloaded_directory(
        save_directory=save_directory,
    )


def _run_chunk_load(save_directory: str) -> None:
    sec_10k_chunk_load.load_sec_filing_chunks_from_directory(save_directory)


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
    description="Staggered-parallel SEC 10-K download, extract, and chunk load pipeline",
    schedule=None,
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["finstream", "sec", "10k"],
) as dag:
    plugin_dir = Path(__file__).resolve().parents[1] / "plugins"
    base_save_dir = Path("/opt/airflow/tmp")

    batch_files = [
        "tickers_batch_001.csv",
        "tickers_batch_002.csv",
        "tickers_batch_003.csv",
        "tickers_batch_004.csv",
        "tickers_batch_005.csv",
    ]

    download_tasks: list[PythonOperator] = []

    for index, batch_file in enumerate(batch_files, start=1):
        batch_id = f"batch_{index:03d}"
        batch_save_dir = base_save_dir / batch_id

        download_task = PythonOperator(
            task_id=f"download_{batch_id}",
            python_callable=_run_download,
            op_kwargs={
                "batch_csv_path": str(plugin_dir / batch_file),
                "save_directory": str(batch_save_dir),
            },
        )

        extract_task = PythonOperator(
            task_id=f"extract_{batch_id}",
            python_callable=_run_extract,
            op_kwargs={
                "save_directory": str(batch_save_dir),
            },
        )

        chunk_load_task = PythonOperator(
            task_id=f"chunk_load_{batch_id}",
            python_callable=_run_chunk_load,
            op_kwargs={
                "save_directory": str(batch_save_dir),
            },
        )

        download_task.set_downstream(extract_task)
        extract_task.set_downstream(chunk_load_task)
        download_tasks.append(download_task)

    for i in range(len(download_tasks) - 1):
        download_tasks[i].set_downstream(download_tasks[i + 1])
