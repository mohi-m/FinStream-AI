# FinStream Backend (Spring Boot + Agentic RAG)

This module provides the REST API, portfolio domain logic, and AI commentary orchestration.

## Responsibilities

- Portfolio, holdings, ticker, price, and financial REST endpoints.
- Firebase UID-based user scoping for private resources.
- Agentic commentary generation via LangGraph4j.
- Retrieval-augmented generation (RAG) over SEC filing chunks stored in pgvector.
- In-memory caching for expensive AI and market endpoints.

## Tech Stack

- Java 21
- Spring Boot 3.5.x
- Spring Data JPA + Flyway
- PostgreSQL (transactional DB)
- pgvector-compatible PostgreSQL (vector DB)
- LangChain4j + LangGraph4j
- OpenAI chat and embedding models

## System Design

```text
+----------------------------------+
| REST Controllers                 |
| /api/me, /api/tickers, ...       |
+----------------------------------+
         |
         v
+----------------------------------+
| Service Layer                    |
| domain logic + auth scoping      |
+----------------------------------+
         |
  +----------+----------+
  |                     |
  v                     v
+---------------------------+   +---------------------------+
| Primary Postgres (JPA)    |   | Vector Postgres (JDBC)    |
| app_user, portfolios, ... |   | sec_filing_chunks         |
+---------------------------+   +---------------------------+
                 |
                 v
         +----------------------------------+
         | SecFilingRetrieverService        |
         | embed query + cosine similarity  |
         +----------------------------------+
                 |
                 v
         +----------------------------------+
         | PortfolioCommentaryGraphService  |
         | load -> parallel -> summarize    |
         +----------------------------------+
```

## Commentary Pipeline (Agentic Flow)

`PortfolioCommentaryGraphService` uses a graph workflow:

1. `loadPortfolio`: validates ownership and collects ticker IDs.
2. `generateTickerCommentariesParallel`: fan-out per ticker on worker pool.
3. `buildPortfolioOverview`: summarizes per-ticker outputs into portfolio-level insight.

Per ticker:

1. Build analysis query.
2. Retrieve top chunks from `sec_filing_chunks` using pgvector cosine distance.
3. Send formatted context to `TickerCommentaryAiService` (LangChain4j AI service).
4. Return structured commentary plus metadata (`filingYear`, `chunksUsed`).

Key files:

- `src/main/java/com/finstream/api/service/PortfolioCommentaryGraphService.java`
- `src/main/java/com/finstream/api/service/SecFilingRetrieverService.java`
- `src/main/java/com/finstream/api/service/TickerCommentaryAiService.java`
- `src/main/java/com/finstream/api/config/LangChainConfig.java`

## API Surface (Core)

- User: `GET /api/me`, `PUT /api/me`
- Portfolios: `GET/POST /api/portfolios`, `GET/PUT/DELETE /api/portfolios/{id}`
- Holdings: `GET/POST /api/portfolios/{id}/holdings`, `PUT/DELETE /api/portfolios/{id}/holdings/{tickerId}`
- Tickers: `GET /api/tickers`, `GET /api/tickers/top`, `GET /api/tickers/sectors`, `GET /api/tickers/{id}`
- Prices: `GET /api/tickers/{id}/prices`, `GET /api/tickers/{id}/prices/latest`
- Financials: `GET /api/tickers/{id}/financials`, `GET /api/tickers/{id}/financials/latest`
- AI Commentary:
  - `GET /api/portfolios/{portfolioId}/commentary`
  - `POST /api/portfolios/{portfolioId}/commentary/refresh`

Swagger:

- `http://localhost:8080/swagger-ui.html`

## Environment Variables

Create a local env file (or export variables in your shell):

| Variable               | Purpose                              | Default                                               |
| ---------------------- | ------------------------------------ | ----------------------------------------------------- |
| `DB_URL`               | Main transactional database JDBC URL | `jdbc:postgresql://localhost:5432/finstream`          |
| `DB_USER`              | Main/vector DB username              | `postgres`                                            |
| `DB_PASSWORD`          | Main/vector DB password              | `postgres`                                            |
| `VECTOR_DB_URL`        | Vector database JDBC URL             | `jdbc:postgresql://localhost:5432/finstream-pgvector` |
| `OPENAI_API_KEY`       | OpenAI key for chat + embeddings     | empty                                                 |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins             | `http://localhost:3000,http://localhost:5173`         |

## Database Setup

### 1) Main DB (OLTP)

Create DB:

```bash
createdb finstream
```

Run app once and Flyway will apply `V1__init.sql` automatically.

### 2) Vector DB (RAG)

Create DB:

```bash
createdb finstream-pgvector
```

Initialize pgvector schema:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS sec_filing_chunks (
  ticker VARCHAR(10) NOT NULL,
  filing_year INT NOT NULL,
  filing_type VARCHAR(16) NOT NULL,
  filing_period VARCHAR(16) NOT NULL,
  item_code VARCHAR(32) NOT NULL,
  chunk_index INT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  processed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ticker, filing_year, filing_type, filing_period, item_code, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_sec_filing_chunks_ticker
  ON sec_filing_chunks (ticker);

CREATE INDEX IF NOT EXISTS idx_sec_filing_chunks_embedding_ivfflat
  ON sec_filing_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

After loading a meaningful volume of vectors, run:

```sql
ANALYZE sec_filing_chunks;
```

## Run Locally

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

API base URL:

- `http://localhost:8080`

## Quick Verification

```bash
curl -H "X-Firebase-UID: demo-user" http://localhost:8080/api/me
```

Commentary endpoint example:

```bash
curl -H "X-Firebase-UID: demo-user" http://localhost:8080/api/portfolios/<portfolio-uuid>/commentary
```

## Project Layout

```text
backend/
- pom.xml
- src/main/java/com/finstream/api/
  - config/
  - controller/
  - dto/
  - entity/
  - exception/
  - repository/
  - service/
- src/main/resources/
  - application.yml
  - db/migration/V1__init.sql
- src/test/resources/application.yml
```

## Operational Notes

- Commentary responses are cached (`portfolioCommentary`) and refreshed via explicit refresh endpoint.
- The API relies on `X-Firebase-UID` for user identity scoping.
- Frontend may also send `Authorization: Bearer <id-token>`; backend currently scopes by UID header.
