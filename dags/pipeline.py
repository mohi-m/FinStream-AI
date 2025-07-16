from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
import boto3
from datetime import datetime

import os

def ingest():
    import sys
    scripts_path = os.environ.get('SCRIPTS_PATH', '/home/mohi-m/projects/FinStream-AI/backend/scripts')
    sys.path.append(scripts_path)
    from backend.scripts import ingest
    ingest.run()

def predict():
    import sys
    scripts_path = os.environ.get('SCRIPTS_PATH', '/home/mohi-m/projects/FinStream-AI/backend/scripts')
    sys.path.append(scripts_path)
    from backend.scripts import predict
    predict.run()

def create_s3_prefix():
    import os
    from datetime import datetime
    bucket = os.environ.get('DATA_BUCKET', 'mohi-finstream')
    prefix = f"data/{datetime.now().strftime('%Y-%m-%d')}/"
    s3 = boto3.client('s3')
    s3.put_object(Bucket=bucket, Key=prefix)

with DAG('stock_pipeline',
         schedule='@daily',
         start_date=datetime(2024, 1, 1),
         catchup=False) as dag:

    create_data_dir = PythonOperator(
        task_id='create_data_dir',
        python_callable=create_s3_prefix
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
