from airflow.sdk import DAG
from airflow.providers.standard.operators.python import PythonOperator
from datetime import datetime, timedelta
import os

# Since 'plugins' is in the PYTHONPATH, we can import directly
try:
    import fact_price_update # type: ignore
except ImportError as e:
    # This prevents the DAG from crashing the Webserver if the plugin is missing
    print(f"Could not import fact_price_update: {e}")
    fact_price_update = None

def run_price_update_wrapper(**context):
    """
    Wrapper to set up environment and run the update script.
    """
    if not fact_price_update:
        raise ImportError("fact_price_update module not found. Check your plugins folder.")

    # Robust way to find the csv: Ask the module where it lives
    plugin_dir = os.path.dirname(fact_price_update.__file__) # type: ignore
    ticker_path = os.path.join(plugin_dir, "tickers.csv")

    # Verify file exists (optional but helpful for debugging)
    if not os.path.exists(ticker_path):
        raise FileNotFoundError(f"Could not find tickers.csv at: {ticker_path}")

    # Set the env var expected by the script
    os.environ["TICKER_FILE"] = ticker_path
    print(f"Setting TICKER_FILE to: {os.environ['TICKER_FILE']}")

    # Execute run
    fact_price_update.run_fact_price_update(ticker_file=ticker_path)

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 0,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="finstream_pipeline",
    default_args=default_args,
    description="Daily financial data pipeline",
    schedule="0 6 * * *",
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["finstream", "price"],
) as dag:

    update_prices = PythonOperator(
        task_id="run_fact_price_update",
        python_callable=run_price_update_wrapper,
    )