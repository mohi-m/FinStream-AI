import pandas as pd
import boto3
import io
import pickle
from datetime import datetime

s3 = boto3.client('s3')
BUCKET = 'your-bucket-name'

def lambda_handler(event, context):
    ticker = event.get('ticker', 'AAPL')
    
    # Load processed data
    key = f'processed/{ticker}/latest.parquet'
    obj = s3.get_object(Bucket=BUCKET, Key=key)
    df = pd.read_parquet(io.BytesIO(obj['Body'].read()))

    # Load model
    model_obj = s3.get_object(Bucket=BUCKET, Key='model/stock_model.pkl')
    model = pickle.loads(model_obj['Body'].read())

    # Prepare features
    X = df[['MA50', 'MA200', 'daily_return']].dropna().tail(1)

    prediction = model.predict(X)[0]

    result = {
        'ticker': ticker,
        'date': datetime.utcnow().strftime('%Y-%m-%d'),
        'predicted_close': round(prediction, 2)
    }

    # Save result to S3
    s3.put_object(
        Bucket=BUCKET,
        Key=f'predictions/{ticker}/{result["date"]}.json',
        Body=str(result)
    )

    return result