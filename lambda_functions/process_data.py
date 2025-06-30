import pandas as pd
import boto3
import io

s3 = boto3.client('s3')
BUCKET = 'your-bucket-name'

def lambda_handler(event, context):
    key = event['key']  # e.g., 'raw/AAPL/2025-06-28.parquet'
    
    obj = s3.get_object(Bucket=BUCKET, Key=key)
    df = pd.read_parquet(io.BytesIO(obj['Body'].read()))

    df['daily_return'] = df['Close'].pct_change()
    df['MA50'] = df['Close'].rolling(window=50).mean()
    df['MA200'] = df['Close'].rolling(window=200).mean()

    buffer = io.BytesIO()
    df.to_parquet(buffer)
    buffer.seek(0)

    processed_key = key.replace('raw', 'processed')
    s3.put_object(Bucket=BUCKET, Key=processed_key, Body=buffer.getvalue())

    return {'status': 'Processed', 'rows': len(df)}
