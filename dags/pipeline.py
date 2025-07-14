from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime

def ingest():
    import sys
    sys.path.append('/home/mohi-m/projects/FinStream-AI/backend/scripts')
    import ingest
    ingest.run()

def predict():
    import sys
    sys.path.append('/home/mohi-m/projects/FinStream-AI/backend/scripts')
    import predict
    predict.run()

with DAG('stock_pipeline',
         schedule='@daily',
         start_date=datetime(2024, 1, 1),
         catchup=False) as dag:

    create_data_dir = BashOperator(
        task_id='create_data_dir',
        bash_command="mkdir -p /home/mohi-m/data/$(date +'%Y-%m-%d')"
    )

    t1 = PythonOperator(
        task_id='ingest_data',
        python_callable=ingest
    )

    t2 = PythonOperator(
        task_id='predict_prices',
        python_callable=predict
    )

    create_data_dir >> t1 >> t2
