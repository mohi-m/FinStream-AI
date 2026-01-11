# FinStream API - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start PostgreSQL

```bash
cd backend
docker-compose up -d
```

### Step 2: Build & Run

```bash
mvn clean package
mvn spring-boot:run
```

### Step 3: Test the API

```bash
# Get current user profile
curl -H "X-Firebase-UID: user-123" http://localhost:8080/api/me

# Create a portfolio
curl -X POST http://localhost:8080/api/portfolios \
  -H "X-Firebase-UID: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioName": "My Stock Portfolio",
    "baseCurrency": "USD"
  }'
```

### Step 4: View Swagger Docs

Open: http://localhost:8080/swagger-ui.html

---

## 📋 Common Tasks

### List All Portfolios

```bash
curl -H "X-Firebase-UID: user-123" \
  http://localhost:8080/api/portfolios?page=0&size=10
```

### Add a Stock Holding (replace UUID with actual portfolio ID)

```bash
curl -X POST http://localhost:8080/api/portfolios/a1b2c3d4-e5f6-7890-abcd-ef1234567890/holdings \
  -H "X-Firebase-UID: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "tickerId": "AAPL",
    "quantity": 100,
    "cashBalance": 5000.00,
    "notes": "Apple shares"
  }'
```

### Search Tickers

```bash
curl http://localhost:8080/api/tickers?query=APPLE
```

### Get Stock Prices (Last 30 Days)

```bash
curl "http://localhost:8080/api/tickers/AAPL/prices?from=2024-12-15&to=2025-01-15"
```

### Get Latest Stock Price

```bash
curl http://localhost:8080/api/tickers/AAPL/prices/latest
```

### Get Financial Data

```bash
curl "http://localhost:8080/api/tickers/AAPL/financials?reportType=annual"
```

---

## 🧪 Run Tests

```bash
# All tests (requires PostgreSQL running)
mvn test

# Specific test
mvn test -Dtest=PortfolioIntegrationTest
```

---

## 📚 Key Features

✅ **User Management** - Scoped by Firebase UID
✅ **Portfolio CRUD** - Create, read, update, delete portfolios
✅ **Holdings** - Track stock positions and cash
✅ **Stock Data** - Public ticker, price, and financial info
✅ **Pagination** - All list endpoints support page/size
✅ **Error Handling** - Consistent error responses
✅ **Swagger Docs** - Full API documentation
✅ **Integration Tests** - Testcontainers + PostgreSQL

---

## 🛠️ Troubleshooting

### PostgreSQL Connection Error?

```bash
# Restart the container
docker-compose down
docker-compose up -d
```

### Port 8080 Already in Use?

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

### Build Failing?

```bash
# Clean everything and rebuild
mvn clean install
```

---

## 📖 Full Documentation

See [README.md](./README.md) for complete API documentation with all endpoints, examples, and configuration details.

---

## 🔑 Headers Required

Most endpoints require the Firebase UID header:

```
X-Firebase-UID: your-firebase-uid-here
```

**Exception**: Ticker, price, and financial endpoints are public (no header needed).

---

## 🌐 All Endpoints at a Glance

| Method | Endpoint                                 | Header Required |
| ------ | ---------------------------------------- | --------------- |
| GET    | `/api/me`                                | ✅ Yes          |
| PUT    | `/api/me`                                | ✅ Yes          |
| GET    | `/api/portfolios`                        | ✅ Yes          |
| POST   | `/api/portfolios`                        | ✅ Yes          |
| GET    | `/api/portfolios/{id}`                   | ✅ Yes          |
| PUT    | `/api/portfolios/{id}`                   | ✅ Yes          |
| DELETE | `/api/portfolios/{id}`                   | ✅ Yes          |
| GET    | `/api/portfolios/{id}/holdings`          | ✅ Yes          |
| POST   | `/api/portfolios/{id}/holdings`          | ✅ Yes          |
| PUT    | `/api/portfolios/{id}/holdings/{ticker}` | ✅ Yes          |
| DELETE | `/api/portfolios/{id}/holdings/{ticker}` | ✅ Yes          |
| GET    | `/api/tickers`                           | ❌ No           |
| GET    | `/api/tickers/{id}`                      | ❌ No           |
| GET    | `/api/tickers/{id}/prices`               | ❌ No           |
| GET    | `/api/tickers/{id}/prices/latest`        | ❌ No           |
| GET    | `/api/tickers/{id}/financials`           | ❌ No           |
| GET    | `/api/tickers/{id}/financials/latest`    | ❌ No           |

---

Happy coding! 🎉
