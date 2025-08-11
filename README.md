# FinStream AI — Intelligent Portfolio & Market Forecasting Platform

A production‑ready, end‑to‑end system for ingesting US equities data, training the best‑performing forecasting models, and delivering real‑time portfolio analytics through a modern web UI.

<p align="center">
  <img alt="AWS" src="https://img.shields.io/badge/AWS-MWAA%20%7C%20S3%20%7C%20RDS%20%7C%20ECS-orange?logo=amazonaws&logoColor=white" />
  <img alt="Airflow" src="https://img.shields.io/badge/Orchestration-Apache%20Airflow-017CEE?logo=apacheairflow&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" />
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20TypeScript-61DAFB?logo=react&logoColor=white" />
  <img alt="Security" src="https://img.shields.io/badge/Auth-OAuth-232F3E?logo=amazonaws&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-All%20Rights%20Reserved-lightgrey" />
</p>

---

## TL;DR

- Nightly, market‑aware Airflow pipelines on AWS ingest, validate, and warehouse US stock market data.
- The pipeline trains and backtests multiple models, promotes the winner, and publishes rolling forecasts.
- A sleek React/TypeScript UI visualizes prices, forecasts, and portfolio risk with secure OAuth login.

## Why it stands out

- Market‑aware scheduling: runs after US market close on trading days only (skips weekends/holidays).
- Best‑model selection: walk‑forward backtesting with automated model selection and versioning.
- Production data guarantees: idempotent tasks, data quality checks, lineage, and observability.
- Modern UX: fast Vite build, shadcn/ui components, responsive charts, and delightful micro‑interactions.

## Architecture

```mermaid
flowchart LR
  subgraph AWS
    A[Airflow (MWAA)]
    S3[(S3 Data Lake)]
    DB[(RDS / Redshift)]
    REG[(Model Registry)]
    ECS[ECS Fargate / Lambda APIs]
    COGNITO[(Amazon Cognito)]
  end

  SRC1[Market Data APIs\n(yfinance / polygon.io)] -->|Extract| A
  A -->|Load Raw| S3
  A -->|Validate & Transform| DB
  A -->|Train & Backtest| REG
  REG -->|Daily Forecasts| DB
  DB -->|Serve| ECS
  ECS -->|OAuth2/OIDC| COGNITO
  FE[React + Vite Web App] -->|HTTPS| ECS
  FE -->|Static Assets| S3
```

## Features

- Data platform
  - Robust ETL: extract, validate, and load end‑of‑day (EOD) US equities data to S3 → RDS/Redshift
  - Quality gates: schema checks, freshness, null thresholds, and reconciliation reports
  - Idempotency + backfills: safe reruns and historical rebuilds
  - Observability: CloudWatch logs/metrics and alerting
- ML forecasting
  - Daily training step with walk‑forward backtesting and error metrics (MAE/MAPE/RMSE)
  - Model selection across candidates (e.g., XGBoost, LSTM/TFT) with tracking and versioning
  - Rolling N‑day forecasts persisted for downstream APIs and UI
- Application layer
  - Portfolio creation and management: positions, transactions, performance attribution
  - Risk analytics: volatility, beta, Sharpe, max drawdown, and historical/parametric VaR
  - Modern UI: shadcn/ui + Tailwind + chart components for interactive dashboards
  - Secure auth: OAuth2/OIDC via Amazon Cognito with role‑based access
  - API layer: low‑latency, cached endpoints hosted on AWS (ECS Fargate or Lambda + API Gateway)

## Monorepo layout

- Backend
  - Python dependencies: `backend/requirements.txt`
  - Ingestion script: `backend/scripts/ingest.py`
  - Prediction script: `backend/scripts/predict.py`
- Orchestration
  - Airflow DAG: `dags/pipeline.py`
- Frontend (Vite + React + TS)
  - HTML entry: `frontend/website/index.html`
  - App entry: `frontend/website/src/main.tsx`
  - Root component: `frontend/website/src/App.tsx`
  - Styles: `frontend/website/src/index.css`, Tailwind config in `frontend/website/tailwind.config.ts`
  - UI components: `frontend/website/src/components/*`

## Pipeline scheduling (market‑aware)

- Runs nightly after US market close, 10:15 PM ET on trading days
- Skips weekends and US market holidays via a trading calendar
- DAG is time‑zone aware and supports safe backfills and catchup

Example cron (ET): `15 22 * * 1-5` with holiday checks inside the DAG

## Getting started (local)

Prereqs

- Node.js 18+
- Python 3.10+
- (Optional) Airflow locally via Docker/WSL2

Frontend (PowerShell)

```
cd frontend/website
npm install
npm run dev
```

Backend (PowerShell)

```
cd backend
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python .\scripts\ingest.py    # Ingest market data
python .\scripts\predict.py   # Generate forecasts
```

Airflow (local, optional)

- Copy `dags/pipeline.py` into your Airflow DAGs folder
- Recommended: run Airflow via Docker/WSL2 on Windows for best compatibility

## Configuration

Environment variables (examples)

Backend

- `DB_URL` — Postgres/Redshift connection string
- `AWS_REGION` — e.g., `us-east-1`
- `S3_BUCKET` — raw/processed storage
- `MODEL_REGISTRY_URI` — model tracking backend
- `MARKET_DATA_PROVIDER` — `yfinance` (default) or `polygon`
- `POLYGON_API_KEY` — if using polygon.io

Frontend

- `VITE_API_BASE_URL` — base URL for the backend APIs
- `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_DOMAIN`

## Dev experience

- TypeScript path alias `@/*` configured in `frontend/website/tsconfig*.json`
- UI system via Tailwind + shadcn/ui in `frontend/website/src/*`
- Reusable chart and dashboard components in `frontend/website/src/components`

## Build & deploy

- Frontend
  - `cd frontend/website && npm run build` → static assets
- Backend & Pipeline
  - Containerized services deployed to AWS (ECS Fargate) and MWAA hosts DAGs
  - Logs/metrics in CloudWatch; secrets in AWS Secrets Manager

## Screenshots

Add your screenshots or GIF demos here to showcase dashboards, forecasts, and portfolio analytics.

## Roadmap

- Options pricing and Greeks for advanced risk
- Factor models (Fama‑French) and style tilts
- Live intraday ingestion and nowcasting

## License

All rights reserved.
