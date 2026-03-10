# FinStream Seed Scripts (Bootstrap + Backfill)

This folder contains standalone Python scripts to initialize and backfill core financial tables.

## What This Module Seeds

- `dim_ticker` from yfinance metadata
- `fact_price_daily` from yfinance historical prices
- `fact_financials` from Alpha Vantage quarterly statements

## Script Inventory

- `dim_ticker.py`
- `fact_price_daily.py`
- `fact_financials.py`
- ticker input files: `tickers.csv`, `index_tickers.csv`

## System Design

```text
+-----------------------------+
| ticker files                |
| tickers.csv / index_...     |
+-----------------------------+
              |
              v
+-----------------------------------------------+
| Python seed scripts                            |
| - dim_ticker.py                                |
| - fact_price_daily.py                          |
| - fact_financials.py                           |
+-----------------------------------------------+
          |                         |
          v                         v
+------------------+        +------------------+
| yfinance         |        | Alpha Vantage    |
+------------------+        +------------------+
          |                         |
          +------------+------------+
                       |
                       v
+------------------------+
| PostgreSQL (upserts)   |
+------------------------+
```

## Prerequisites

- Python 3.11+
- PostgreSQL access
- Alpha Vantage API key (for `fact_financials.py`)

Install dependencies in your virtual environment:

```bash
pip install yfinance pandas requests psycopg2-binary python-dotenv
```

## Environment Variables

Set these variables in your shell or local `.env` file:

| Variable               | Purpose                           |
| ---------------------- | --------------------------------- |
| `PG_HOST`              | PostgreSQL host                   |
| `PG_PORT`              | PostgreSQL port                   |
| `PG_DB`                | target database                   |
| `PG_USER`              | database user                     |
| `PG_PASSWORD`          | database password                 |
| `PG_SCHEMA`            | target schema (default `public`)  |
| `ALPHAVANTAGE_API_KEY` | required for `fact_financials.py` |

Optional tuners:

- `YF_SLEEP_SECONDS`
- `ALPHAVANTAGE_MAX_CALLS_PER_MIN`
- `SLEEP_AFTER_TICKER`

## Recommended Execution Order

1. Seed tickers first.
2. Seed historical prices.
3. Seed quarterly financials.

## Usage

### 1) Seed `dim_ticker`

```bash
python data/seed/dim_ticker.py --from-file data/seed/tickers.csv --create-table
```

### 2) Seed `fact_price_daily`

Using a fixed period:

```bash
python data/seed/fact_price_daily.py --from-file data/seed/tickers.csv --period 5y --create-table
```

Using explicit dates:

```bash
python data/seed/fact_price_daily.py --from-file data/seed/tickers.csv --start 2024-01-01 --end 2026-01-01 --create-table
```

### 3) Seed `fact_financials`

```bash
python data/seed/fact_financials.py --from-file data/seed/tickers.csv --create-table
```

## Behavior Notes

- Scripts use bulk upsert semantics (`ON CONFLICT ... DO UPDATE`).
- Table creation is optional and controlled by `--create-table`.
- `fact_financials.py` includes a rate limiter for Alpha Vantage.
- `fact_price_daily.py` fetches in ticker batches and sleeps between batches.

## Troubleshooting

- If yfinance starts throttling, reduce batch size and increase sleep.
- If Alpha Vantage throttles, lower `--max-calls-per-min`.
- Ensure `dim_ticker` exists before seeding facts (foreign key dependency).
