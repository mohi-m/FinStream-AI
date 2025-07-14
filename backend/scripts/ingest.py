import yfinance as yf
import pyarrow as pa
import pyarrow.parquet as pq
import boto3
import pandas as pd
import datetime
import io

def run():
    tickers = ["AAPL", "MSFT", "GOOGL"] 
    print("Ingesting data for the following tickers:", tickers)
    all_hist = []
    for ticker_symbol in tickers:
        ticker = yf.Ticker(ticker_symbol)
        hist = ticker.history(period="1y")
        hist["Ticker"] = ticker_symbol  # Add a column to identify the ticker
        all_hist.append(hist)
        print(f"Ingested {ticker_symbol}")

    combined_hist = pd.concat(all_hist).reset_index()
    table = pa.Table.from_pandas(combined_hist)
    today_str = datetime.datetime.today().strftime("%Y-%m-%d")
    s3_key = f"data/{today_str}/all_tickers_{today_str}.parquet"

    # Save file locally (debug purposes)
    print(f"Writing combined data to {s3_key}")
    pq.write_table(table, s3_key)
    print(f"Combined data written to {s3_key}")


    # # Write Parquet to in-memory buffer
    # buffer = io.BytesIO()
    # pq.write_table(table, buffer)
    # buffer.seek(0)

    # # Upload to S3 directly from buffer
    # s3 = boto3.client('s3')
    # bucket = "mohi-finstream"
    # print(f"Uploading {s3_key} to S3 bucket {bucket}")
    # s3.upload_fileobj(buffer, bucket, s3_key)
    # print("Upload complete.")