import yfinance as yf
import pyarrow.parquet as pq
import pyarrow as pa
import boto3
import pandas as pd
import datetime

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

    combined_hist = pd.concat(all_hist)
    table = pa.Table.from_pandas(combined_hist)
    today_str = datetime.datetime.today().strftime("%Y-%m-%d")
    output_path = f"./data/all_tickers_{today_str}.parquet"

    # # Save file locally (debug purposes)
    # print(f"Writing combined data to {output_path}")
    # pq.write_table(table, output_path)
    # print(f"Combined data written to {output_path}")

    # Upload to S3
    s3 = boto3.client('s3')
    bucket = "mohi-finstream"
    print(f"Uploading {output_path} to S3 bucket {bucket}")
    s3.upload_file(output_path, bucket, f"data/all_tickers_{today_str}.parquet")
    print("Upload complete.")