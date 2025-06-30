import yfinance as yf
import boto3
import io
from datetime import datetime, timezone


s3 = boto3.client('s3')
BUCKET = 'mohi-finstream'

def lambda_handler(event, context):
    ticker = 'AAPL'
    data = yf.download(ticker, period="7d", interval="1h")
    
    buffer = io.BytesIO()
    data.to_parquet(buffer)
    buffer.seek(0)
    
    s3.put_object(
        Bucket=BUCKET,
        Key=f"raw/{ticker}/{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.parquet",
        Body=buffer.getvalue()
    )
    
    return {'status': 'Success', 'rows': len(data)}