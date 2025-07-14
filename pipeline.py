from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

def ingest():
    import sys
    sys.path.append('/home/mohi-m/projects/FinStream-AI/backend/scripts')
    import ingest
    import os
    os.chdir('/home/mohi-m/projects/FinStream-AI')
    ingest.run()

def predict():
    import sys
    sys.path.append('/home/mohi-m/projects/FinStream-AI/backend/scripts')
    import predict
    import os
    os.chdir('/home/mohi-m/projects/FinStream-AI')
    predict.run()

with DAG('stock_pipeline',
         schedule='@daily',
         start_date=datetime(2024, 1, 1),
         catchup=False) as dag:

    t1 = PythonOperator(
        task_id='ingest_data',
        python_callable=ingest
    )

    t2 = PythonOperator(
        task_id='predict_prices',
        python_callable=predict
    )

    t1 >> t2
