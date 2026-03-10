# FinStream Airflow (Data + SEC RAG Pipelines)

This module orchestrates scheduled market ingestion and SEC 10-K preprocessing for the backend RAG system.

## Pipelines

### 1) `finstream_pipeline` (Scheduled)

- Schedule: daily at `06:00 UTC`
- Task: incremental price updates into `fact_price_daily`
- Data source: `yfinance`

### 2) `sec_10k_pipeline` (Manual/On-demand)

- Schedule: manual trigger (`schedule=None`)
- Task chain per ticker batch:
  1. download latest SEC 10-K HTML
  2. extract Item 1A, 3, 7, 7A sections
  3. chunk + embed + upsert into `sec_filing_chunks` (pgvector)

## System Design

```text
+--------------------+
| Airflow Scheduler  |
+--------------------+
      |
  +-----+------------------+
  |                        |
  v                        v
+------------------------+  +------------------------+
| finstream_pipeline     |  | sec_10k_pipeline       |
| daily price ingestion  |  | SEC filing RAG prep    |
+------------------------+  +------------------------+
  |                        |
  v                        v
+------------------------+  +------------------------+
| yfinance -> fact_price |  | SEC -> extract -> embed|
| upsert to Postgres     |  | upsert to pgvector     |
+------------------------+  +------------------------+
```

## Prerequisites

- Docker + Docker Compose
- PostgreSQL reachable from containers
- OpenAI API key (for embeddings)

## Environment Variables

Create `airflow/.env` and provide values for:

| Variable                                  | Purpose                                   |
| ----------------------------------------- | ----------------------------------------- |
| `AIRFLOW_UID`                             | container file ownership compatibility    |
| `AIRFLOW__DATABASE__SQL_ALCHEMY_CONN_AWS` | Airflow metadata DB connection            |
| `PG_HOST`                                 | target data DB host                       |
| `PG_PORT`                                 | target data DB port                       |
| `PG_DB`                                   | transactional DB (prices/financials)      |
| `PG_DB_VECTOR`                            | vector DB for embeddings                  |
| `PG_USER`                                 | DB user                                   |
| `PG_PASSWORD`                             | DB password                               |
| `OPENAI_API_KEY`                          | embedding model key                       |
| `ALPHAVANTAGE_API_KEY`                    | optional, for financial seeding workflows |

Optional tuning:

- `SEC_EDGAR_REQUEST_PAUSE_SECONDS`

## Local Setup

```bash
cd airflow
docker compose up airflow-init
docker compose up -d airflow-apiserver airflow-scheduler airflow-dag-processor
```

Airflow UI:

- `http://localhost:8080`

Default credentials are configured in `docker-compose.yaml` (`airflow` / `airflow`) unless overridden.

## Running DAGs

1. Open Airflow UI.
2. Unpause DAG:
   - `finstream_pipeline` for daily prices
   - `sec_10k_pipeline` for SEC ingestion
3. Trigger `sec_10k_pipeline` manually when you need to refresh vector data.

## Data Contracts

- Price ingestion writes into `fact_price_daily`.
- SEC extraction creates JSON payload files in `/opt/airflow/tmp/...`.
- Chunk loader upserts vectors into `sec_filing_chunks` with key:
  - `(ticker, filing_year, filing_type, filing_period, item_code, chunk_index)`

## Important Dependency

`sec_10k_chunk_load.py` expects the vector table to already exist. Create it before running SEC chunk loads (see `backend/README.md` for SQL bootstrap).

## Key Files

- `dags/finstream_pipeline.py`
- `dags/sec_10k_pipeline.py`
- `plugins/fact_price_update.py`
- `plugins/sec_10k_download.py`
- `plugins/sec_10k_extract.py`
- `plugins/sec_10k_chunk_load.py`
- `docker-compose.yaml`
- `requirements.txt`
