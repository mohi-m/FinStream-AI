import datetime
import pandas as pd
import pyarrow.parquet as pq
import pyarrow as pa
import boto3
from sklearn.linear_model import LinearRegression
import numpy as np
from io import BytesIO

# Initialize S3 client
s3 = boto3.client('s3')
bucket = "mohi-finstream"

def run():
    print("Running prediction...")

    today_str = datetime.datetime.today().strftime("%Y-%m-%d")

    # Load parquet from S3
    print(f"Loading parquet file from S3: data/{today_str}/all_tickers_{today_str}.parquet")
    table = s3.get_object(Bucket=bucket, Key=f"data/{today_str}/all_tickers_{today_str}.parquet")
    parquet_table = pq.read_table(BytesIO(table['Body'].read()))
    df = parquet_table.to_pandas()
    print(f"Loaded DataFrame with columns: {df.columns.tolist()} and shape: {df.shape}")


    tickers = df['Ticker'].unique()
    print(f"Found {len(tickers)} tickers: {tickers}")
    results = []

    for ticker in tickers:
        print(f"\nProcessing ticker: {ticker}")
        df_ticker = df[df['Ticker'] == ticker].copy()
        df_ticker["Prev Close"] = df_ticker["Close"].shift(1)
        df_ticker.dropna(inplace=True)
        print(f"Ticker {ticker}: {len(df_ticker)} rows after dropna")
        if len(df_ticker) < 2:
            print(f"Not enough data for {ticker}, skipping.")
            continue
        X = df_ticker[["Prev Close"]].values
        y = df_ticker["Close"].values
        print(f"Training LinearRegression for {ticker}...")
        model = LinearRegression().fit(X, y)
        last_row = df_ticker.iloc[-1].copy()
        last_close = last_row["Close"]
        last_date = pd.to_datetime(last_row["Date"])
        for i in range(1, 6):  # Predict next 5 business days (1 week)
            next_date = last_date + pd.tseries.offsets.BDay(i)
            next_pred = model.predict([[last_close]])[0]
            print(f"Predicted close for {ticker} on {next_date.strftime('%Y-%m-%d')}: {next_pred}")
            new_row = last_row.copy()
            new_row["Date"] = next_date.strftime("%Y-%m-%d")
            new_row["Close"] = next_pred
            results.append(new_row)
            last_close = next_pred

    # Save all predictions
    pred_df = pd.DataFrame(results)
    print(f"Saving predictions DataFrame with shape: {pred_df.shape}")
    table = pa.Table.from_pandas(pred_df)
    
    buffer = BytesIO()
    buffer.seek(0)

    # Upload to S3 directly
    s3.put_object(Bucket=bucket, Key=f"data/{today_str}/predictions_{today_str}.parquet", Body=buffer.getvalue())
    print("All predictions uploaded to S3.")
