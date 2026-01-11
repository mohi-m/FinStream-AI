# FinStream AI - Intelligent Portfolio and Market Forecasting Platform

A production-ready system for ingesting US equities data, training the best-performing forecasting models, and delivering real-time portfolio analytics through a modern web experience.

<p align="center">
  <img alt="AWS" src="https://img.shields.io/badge/AWS-%20S3%20%7C%20RDS%20%7C%20ECS-orange?logo=amazonaws&logoColor=white" />
  <img alt="Airflow" src="https://img.shields.io/badge/Orchestration-Apache%20Airflow-017CEE?logo=apacheairflow&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?logo=react&logoColor=white" />
  <img alt="Security" src="https://img.shields.io/badge/Auth-OAuth-232F3E?logo=amazonaws&logoColor=white" />
</p>

---

## What this delivers

- Market-aware nightly ingestion, validation, and warehousing of US equities data.
- Automated model selection with walk-forward backtesting and tracked experiment history.
- Rolling N-day forecasts promoted to production and exposed through authenticated APIs.
- React dashboard with shadcn/ui, charts, and portfolio analytics.
- Hardened data quality, idempotent reruns, observability, and secure auth via OAuth2/OIDC.


## Capabilities

- Data platform: extract, validate, and load end-of-day US equities into S3 and warehouse (RDS/Redshift) with schema and freshness checks, reconciliation, and backfill safety.
- ML forecasting: walk-forward backtests with MAE/MAPE/RMSE, automated best-model promotion, and rolling forecasts persisted for serving.
- API and auth: cached, low-latency endpoints behind ECS or Lambda with OAuth2/OIDC via Amazon Cognito.
- Web experience: responsive dashboards, price and forecast charts, portfolio and risk analytics, and micro-interactions built with shadcn/ui and Tailwind.

## Repository layout

- airflow/ - Dockerized Airflow stack for local runs (compose, requirements, config, DAGs, plugins).
  - dags/finstream_pipeline.py - market-aware pipeline orchestrator.
  - plugins/fact_price_update.py - price ingestion and load task.
  - config/airflow.cfg - runtime configuration for the stack.
- data/seed - seed data for dimensions and facts (dim_ticker.py, fact_financials.py, fact_price_daily.py, tickers.csv).
- frontend/website - Vite + React + TypeScript app with Tailwind and shadcn/ui components.
- backend/ - reserved for the serving/API layer (deployed as a containerized service on ECS in production).

## Quickstart (local development)

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker (for the local Airflow stack)
- AWS credentials with access to required buckets/registries if you want to hit cloud resources

### Environment

Create a root .env with values that fit your environment:

```
DB_URL=postgresql://user:pass@localhost:5432/finstream
AWS_REGION=us-east-1
S3_BUCKET=finstream-data
MODEL_REGISTRY_URI=s3://finstream-model-registry
MARKET_DATA_PROVIDER=yfinance
POLYGON_API_KEY=pk_your_polygon_key
VITE_API_BASE_URL=http://localhost:8000
VITE_COGNITO_USER_POOL_ID=your_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id
VITE_COGNITO_DOMAIN=your_domain.auth.us-east-1.amazoncognito.com
```

### Run Airflow locally

- cd airflow
- Review and update airflow/.env if needed (Docker UID/GID, credentials).
- docker compose up -d
- Open Airflow at http://localhost:8080 and enable the finstream_pipeline DAG.
- The DAG will ingest prices via plugins/fact_price_update.py, validate, load to the warehouse, and trigger model/forecast tasks.

### Seed data (optional)

- data/seed contains example dimension and fact data you can load into your Postgres/Redshift instance for a quick start.
- Use your preferred loader (psql, dbt seed, or a simple Python script) to insert the provided records.

### Frontend dev server

- cd frontend/website
- npm install
- npm run dev
- Access the app at http://localhost:5173 with VITE_* variables pointing to your API.

## Operational flow

- Nightly schedule: runs after US market close on trading days; skips weekends and US holidays via a trading calendar.
- Tasks: extract prices, validate schema/freshness, load raw and curated tables, build features, train/backtest candidates, register the best model, generate and publish rolling forecasts, refresh API cache.
- Metrics: MAE, MAPE, RMSE tracked per model version with lineage to source data and hyperparameters.
- Reliability: idempotent tasks, catchup support, and observability through logs and metrics.