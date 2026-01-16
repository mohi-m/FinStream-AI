# 📈 FinStream AI

<div align="center">

![FinStream Banner](https://img.shields.io/badge/FinStream-AI%20Powered%20Portfolio%20Management-00C49F?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMjIgNyAxMy41IDE1LjUgOC41IDEwLjUgMiAxNyI+PC9wb2x5bGluZT48cG9seWxpbmUgcG9pbnRzPSIxNiA3IDIyIDcgMjIgMTMiPjwvcG9seWxpbmU+PC9zdmc+)

**A modern, full-stack financial portfolio management platform with real-time market data and automated data pipelines.**

[🌐 **Live Demo**](https://finstream.mohi-m.com) &nbsp;•&nbsp; [📡 **API Docs**](https://finstream-api.mohi-m.com/swagger-ui.html)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Apache Airflow](https://img.shields.io/badge/Airflow-2.x-017CEE?logo=apacheairflow&logoColor=white)](https://airflow.apache.org/)
[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 **Real-Time Market Data**

Browse stocks from the S&P 500 with live price updates and historical price charts powered by automated data pipelines.

### 💼 **Portfolio Management**

Create multiple portfolios, add holdings, and track your investments with comprehensive allocation analytics.

</td>
<td width="50%">

### 📈 **Financial Analytics**

View company financials including revenue, earnings, and cash flow with interactive visualizations.

### 🔐 **Secure Authentication**

Sign in seamlessly with Google or GitHub via Firebase Authentication.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         GitHub Pages                                      │  │
│  │                   finstream.mohi-m.com                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │   React 19  │  │  TanStack   │  │   Recharts  │  │   Firebase  │       │  │
│  │  │ + TypeScript│  │    Query    │  │   Charts    │  │    Auth     │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                AWS CLOUD                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                       EC2 Instance                                        │  │
│  │                finstream-api.mohi-m.com                                   │  │
│  │                                                                           │  │
│  │  ┌─────────────────────────┐    ┌─────────────────────────────────────┐   │  │
│  │  │     Spring Boot 3.3     │    │          Apache Airflow             │   │  │
│  │  │      REST API           │    │       Scheduled Pipelines           │   │  │
│  │  │  ┌─────────────────┐    │    │  ┌─────────────────────────────┐    │   │  │
│  │  │  │   Java 21       │    │    │  │   Daily Price Updates       │    │   │  │
│  │  │  │   + JPA         │    │    │  │   (yfinance → PostgreSQL)   │    │   │  │
│  │  │  │   + Flyway      │    │    │  └─────────────────────────────┘    │   │  │
│  │  │  │   + OpenAPI     │    │    │                                     │   │  │
│  │  │  └─────────────────┘    │    └─────────────────────────────────────┘   │  │
│  │  └────────────┬────────────┘                    │                         │  │
│  │               │                                 │                         │  │
│  └───────────────┼─────────────────────────────────┼─────────────────────────┘  │
│                  │                                 │                            │
│                  │ JDBC                            │ JDBC                       │
│                  ▼                                 ▼                            │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                          Amazon RDS                                       │  │
│  │                        PostgreSQL 16                                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│  │  │  app_user   │  │ dim_ticker  │  │fact_price_  │  │   fact_     │       │  │
│  │  │             │  │             │  │   daily     │  │ financial   │       │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│  │  ┌─────────────┐  ┌─────────────┐                                         │  │
│  │  │   user_     │  │  portfolio_ │                                         │  │
│  │  │  portfolio  │  │   holding   │                                         │  │
│  │  └─────────────┘  └─────────────┘                                         │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Pipeline

The platform uses **Apache Airflow** to maintain fresh market data with automated daily updates.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         AIRFLOW DAG: finstream_pipeline                       │
│                            Schedule: Daily @ 6:00 AM UTC                      │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌────────────┐     ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │  📄 Read   │    │  🔍 Check  │    │  📥 Fetch  │    │  💾 Upsert│       │
│  │  Tickers   │───▶│   Latest   │───▶│   Missing  │───▶│    Into   │       │
│  │   (CSV)    │     │   Dates    │    │   Prices   │    │  Postgres  │       │
│  └────────────┘     └────────────┘    └────────────┘    └────────────┘       │
│                                                                              │
│  tickers.csv        fact_price_daily    yfinance API    fact_price_daily     │
│  ────────────       ──────────────      ────────────    ──────────────       │
│  AAPL, MSFT         Query max(date)     GET /history    UPSERT rows          │
│  GOOGL, AMZN        per ticker          for each gap    (ON CONFLICT)        │
│  NVDA, ...                                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🖼️ Screenshots

### Landing Page

> Modern, animated landing page with glassmorphism effects

<img src="https://via.placeholder.com/800x450/1a1a2e/00C49F?text=Landing+Page" alt="Landing Page" width="100%"/>

### Stocks Dashboard

> Browse S&P 500 stocks with real-time price cards and watchlist management

<img src="https://via.placeholder.com/800x450/1a1a2e/00C49F?text=Stocks+Dashboard" alt="Stocks Dashboard" width="100%"/>

### Stock Detail View

> Interactive price history charts with financial metrics

<img src="https://via.placeholder.com/800x450/1a1a2e/00C49F?text=Stock+Detail+View" alt="Stock Detail" width="100%"/>

### Portfolio Management

> Create portfolios, add holdings, and visualize allocation with pie charts

<img src="https://via.placeholder.com/800x450/1a1a2e/00C49F?text=Portfolio+Analytics" alt="Portfolio Management" width="100%"/>

---

## 🛠️ Tech Stack

<table>
<tr>
<th>Layer</th>
<th>Technology</th>
<th>Purpose</th>
</tr>
<tr>
<td rowspan="7"><b>Frontend</b></td>
<td>React 19</td>
<td>UI Framework</td>
</tr>
<tr>
<td>TypeScript 5.9</td>
<td>Type Safety</td>
</tr>
<tr>
<td>Vite 7</td>
<td>Build Tool</td>
</tr>
<tr>
<td>Tailwind CSS 4</td>
<td>Styling</td>
</tr>
<tr>
<td>shadcn/ui + Radix</td>
<td>Component Library</td>
</tr>
<tr>
<td>TanStack Query</td>
<td>Server State Management</td>
</tr>
<tr>
<td>Recharts</td>
<td>Data Visualization</td>
</tr>
<tr>
<td rowspan="5"><b>Backend</b></td>
<td>Java 21</td>
<td>Runtime</td>
</tr>
<tr>
<td>Spring Boot 3.3</td>
<td>Application Framework</td>
</tr>
<tr>
<td>Spring Data JPA</td>
<td>ORM</td>
</tr>
<tr>
<td>Flyway</td>
<td>Database Migrations</td>
</tr>
<tr>
<td>SpringDoc OpenAPI</td>
<td>API Documentation</td>
</tr>
<tr>
<td rowspan="2"><b>Data Pipeline</b></td>
<td>Apache Airflow</td>
<td>Workflow Orchestration</td>
</tr>
<tr>
<td>yfinance</td>
<td>Market Data Ingestion</td>
</tr>
<tr>
<td rowspan="3"><b>Infrastructure</b></td>
<td>AWS EC2</td>
<td>Application Hosting</td>
</tr>
<tr>
<td>AWS RDS</td>
<td>Managed PostgreSQL</td>
</tr>
<tr>
<td>GitHub Pages</td>
<td>Static Site Hosting</td>
</tr>
<tr>
<td><b>Auth</b></td>
<td>Firebase Auth</td>
<td>OAuth (Google/GitHub)</td>
</tr>
</table>

---

## 🌐 Live Deployment

| Service         | URL                                                                                          | Hosting      |
| --------------- | -------------------------------------------------------------------------------------------- | ------------ |
| 🖥️ **Web App**  | [finstream.mohi-m.com](https://finstream.mohi-m.com)                                         | GitHub Pages |
| 🔌 **REST API** | [finstream-api.mohi-m.com](https://finstream-api.mohi-m.com)                                 | AWS EC2      |
| 📖 **API Docs** | [finstream-api.mohi-m.com/swagger-ui.html](https://finstream-api.mohi-m.com/swagger-ui.html) | AWS EC2      |

---

## 📁 Project Structure

```
FinStream-AI/
├── 🎨 frontend/                 # React SPA
│   ├── src/
│   │   ├── app/                 # App config, routing, providers
│   │   ├── components/          # UI components (shadcn/ui)
│   │   ├── features/            # Feature modules
│   │   │   ├── auth/            # Firebase authentication
│   │   │   ├── landing/         # Landing page
│   │   │   ├── stocks/          # Stock browsing & watchlist
│   │   │   ├── portfolios/      # Portfolio CRUD & analytics
│   │   │   └── profile/         # User profile
│   │   └── lib/                 # API client, utilities
│   └── package.json
│
├── ⚙️ backend/                   # Spring Boot API
│   ├── src/main/java/com/finstream/api/
│   │   ├── controller/          # REST endpoints
│   │   ├── service/             # Business logic
│   │   ├── repository/          # JPA repositories
│   │   ├── entity/              # Database entities
│   │   ├── dto/                 # Data transfer objects
│   │   └── exception/           # Error handling
│   ├── src/main/resources/
│   │   └── db/migration/        # Flyway migrations
│   └── pom.xml
│
├── 🔄 airflow/                   # Data pipelines
│   ├── dags/
│   │   └── finstream_pipeline.py
│   ├── plugins/
│   │   └── fact_price_update.py
│   └── docker-compose.yaml
│
└── 📊 data/                      # Seed scripts
    └── seed/
```

---

## 🚀 Quick Start (Development)

<details>
<summary><b>Prerequisites</b></summary>

- Node.js 18+
- Java 21+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
</details>

<details>
<summary><b>Frontend</b></summary>

```bash
cd frontend
pnpm install
cp .env.example .env  # Configure Firebase credentials
pnpm dev              # http://localhost:5173
```

</details>

<details>
<summary><b>Backend</b></summary>

```bash
cd backend
# Start PostgreSQL
docker-compose up -d
# Run application
./mvnw spring-boot:run
# API available at http://localhost:8080
```

</details>

<details>
<summary><b>Airflow</b></summary>

```bash
cd airflow
docker-compose up -d
# Airflow UI at http://localhost:8080
```

</details>

---

## 📄 API Endpoints

| Method   | Endpoint                        | Description              |
| -------- | ------------------------------- | ------------------------ |
| `GET`    | `/api/me`                       | Get current user profile |
| `PUT`    | `/api/me`                       | Update user profile      |
| `GET`    | `/api/portfolios`               | List user portfolios     |
| `POST`   | `/api/portfolios`               | Create portfolio         |
| `GET`    | `/api/portfolios/{id}`          | Get portfolio by ID      |
| `PUT`    | `/api/portfolios/{id}`          | Update portfolio         |
| `DELETE` | `/api/portfolios/{id}`          | Delete portfolio         |
| `GET`    | `/api/portfolios/{id}/holdings` | List holdings            |
| `POST`   | `/api/portfolios/{id}/holdings` | Add holding              |
| `GET`    | `/api/tickers`                  | Search tickers           |
| `GET`    | `/api/tickers/{id}`             | Get ticker details       |
| `GET`    | `/api/tickers/{id}/prices`      | Get price history        |
| `GET`    | `/api/tickers/{id}/financials`  | Get financials           |

> 📖 Full API documentation available at [Swagger UI](https://finstream-api.mohi-m.com/swagger-ui.html)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[⬆ Back to Top](#-finstream-ai)**

</div>
