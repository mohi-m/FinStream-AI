# FinStream API

A production-grade Spring Boot 3.x REST API for portfolio management and financial data with PostgreSQL, Spring Data JPA, Flyway migrations, and Swagger/OpenAPI documentation.

## Prerequisites

- Java 21 or higher
- Maven 3.8+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)

## Quick Start

### 1. Start PostgreSQL with Docker

```bash
cd backend
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with database `finstream`.

### 2. Build the Project

```bash
mvn clean package
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

Or:

```bash
java -jar target/finstream-api-1.0.0.jar
```

The API will start on `http://localhost:8080`

### 4. Access Swagger UI

Navigate to:

```
http://localhost:8080/swagger-ui.html
```

## Environment Variables

Set these for production deployments:

```bash
export DB_URL=jdbc:postgresql://postgres-host:5432/finstream
export DB_USER=postgres
export DB_PASSWORD=your-password
```

If not set, defaults are:

- `DB_URL`: `jdbc:postgresql://localhost:5432/finstream`
- `DB_USER`: `postgres`
- `DB_PASSWORD`: `postgres`

## API Endpoints

### Authentication

All requests require the `X-Firebase-UID` header:

```bash
curl -H "X-Firebase-UID: user-123" http://localhost:8080/api/me
```

### User Profile (Scoped by X-Firebase-UID)

**Get Current User**

```bash
curl -H "X-Firebase-UID: user-123" http://localhost:8080/api/me
```

**Update Current User**

```bash
curl -X PUT http://localhost:8080/api/me \
  -H "X-Firebase-UID: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "fullName": "John Doe"
  }'
```

### Portfolios (Scoped by X-Firebase-UID)

**List Portfolios**

```bash
curl -H "X-Firebase-UID: user-123" http://localhost:8080/api/portfolios
```

**Create Portfolio**

```bash
curl -X POST http://localhost:8080/api/portfolios \
  -H "X-Firebase-UID: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioName": "My Stocks",
    "baseCurrency": "USD"
  }'
```

**Get Portfolio Details**

```bash
curl -H "X-Firebase-UID: user-123" http://localhost:8080/api/portfolios/{portfolioId}
```

**Update Portfolio**

```bash
curl -X PUT http://localhost:8080/api/portfolios/{portfolioId} \
  -H "X-Firebase-UID: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioName": "Updated Name",
    "baseCurrency": "EUR"
  }'
```

**Delete Portfolio**

```bash
curl -X DELETE http://localhost:8080/api/portfolios/{portfolioId} \
  -H "X-Firebase-UID: user-123"
```

### Portfolio Holdings (Scoped by X-Firebase-UID through Portfolio Ownership)

**List Holdings**

```bash
curl -H "X-Firebase-UID: user-123" http://localhost:8080/api/portfolios/{portfolioId}/holdings
```

**Add Holding**

```bash
curl -X POST http://localhost:8080/api/portfolios/{portfolioId}/holdings \
  -H "X-Firebase-UID: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "tickerId": "AAPL",
    "quantity": 10.5,
    "cashBalance": 5000.00,
    "notes": "Apple stock holding"
  }'
```

**Update Holding**

```bash
curl -X PUT http://localhost:8080/api/portfolios/{portfolioId}/holdings/AAPL \
  -H "X-Firebase-UID: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 15.5,
    "cashBalance": 3000.00,
    "notes": "Updated quantity"
  }'
```

**Delete Holding**

```bash
curl -X DELETE http://localhost:8080/api/portfolios/{portfolioId}/holdings/AAPL \
  -H "X-Firebase-UID: user-123"
```

### Tickers (Public Read-Only)

**Search Tickers**

```bash
# Search by ticker or company name (query parameter)
curl http://localhost:8080/api/tickers?query=AAPL
```

**Get Ticker Details**

```bash
curl http://localhost:8080/api/tickers/AAPL
```

### Price Data (Public Read-Only)

**Get Daily Prices by Date Range**

```bash
curl 'http://localhost:8080/api/tickers/AAPL/prices?from=2024-01-01&to=2024-12-31'
```

Default date range is last 365 days if not specified.

**Get Latest Price**

```bash
curl http://localhost:8080/api/tickers/AAPL/prices/latest
```

### Financial Data (Public Read-Only)

**Get Financials by Date Range**

```bash
curl 'http://localhost:8080/api/tickers/AAPL/financials?reportType=annual&from=2020-01-01&to=2024-12-31'
```

Report type: `annual` or `quarterly` (default: annual)

**Get Latest Financial**

```bash
curl 'http://localhost:8080/api/tickers/AAPL/financials/latest?reportType=annual'
```

## Security

- **Authentication**: Expects Firebase UID in `X-Firebase-UID` header
- **Authorization**: User-scoped resources (portfolio, holdings) are enforced per `firebaseUid`
- **404 on Unauthorized**: Accessing another user's portfolio returns 404 (does not leak existence)
- **No Token Validation**: This service assumes Firebase authentication is handled externally

## Testing

### Run All Tests

```bash
mvn test
```

### Run Integration Tests Only

```bash
mvn test -Dtest=*IntegrationTest
```

Tests use **Testcontainers** to spin up a PostgreSQL instance automatically.

### Example Test: Unauthorized Portfolio Access

The `PortfolioIntegrationTest` includes a test that verifies users cannot access other users' portfolios:

```java
@Test
void testUnauthorizedPortfolioAccess() throws Exception {
    // User 1 creates a portfolio
    UserPortfolio portfolio = new UserPortfolio();
    portfolio.setFirebaseUid(FIREBASE_UID_1);
    portfolio.setPortfolioName("Test Portfolio");
    UserPortfolio savedPortfolio = portfolioRepository.save(portfolio);

    // User 2 tries to access it -> 404 (not 403, to avoid leaking existence)
    mockMvc.perform(get("/api/portfolios/{portfolioId}", savedPortfolio.getPortfolioId())
            .header("X-Firebase-UID", FIREBASE_UID_2))
            .andExpect(status().isNotFound());
}
```

## Database Schema

Flyway automatically handles schema creation and migrations. See `src/main/resources/db/migration/V1__init.sql` for:

- `app_user` – Firebase-linked user profiles
- `dim_ticker` – Stock ticker metadata
- `fact_price_daily` – Daily OHLCV prices
- `fact_financials` – Annual/quarterly financial statements
- `user_portfolio` – User-owned portfolios
- `portfolio_holding` – Portfolio ticker holdings

Includes:

- Indexes on frequently queried columns
- Unique constraints (email per user, portfolio name per user)
- Foreign key constraints
- Check constraints (quantity >= 0, report_type in ['annual', 'quarterly'])

## Architecture

```
controller/          -> HTTP endpoints, validation
  └─ service/        -> Business logic, authorization
      └─ repository/ -> JPA data access
          └─ entity/ -> JPA-mapped domain objects
              └─ dto/ -> Data transfer objects
```

**Key Design Decisions:**

1. **Service Layer Authorization**: User scoping is enforced in services, not just controllers
2. **Composite Keys with @EmbeddedId**: Matches multi-column primary keys (e.g., ticker+date)
3. **Soft 404s for Security**: Unauthorized access returns 404 to avoid leaking resource existence
4. **DTOs for API Contracts**: Entities are not exposed directly; DTOs provide flexibility
5. **Pagination by Default**: List endpoints use `Pageable` for scalability

## Error Handling

Global exception handler returns consistent error format:

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/portfolios",
  "fieldErrors": [
    {
      "field": "portfolioName",
      "message": "Portfolio name cannot be blank"
    }
  ]
}
```

HTTP Status Codes:

- `200` – Success
- `201` – Resource created
- `204` – Success with no content (deletion)
- `400` – Validation error
- `404` – Not found or unauthorized access
- `409` – Conflict (duplicate, constraint violation)
- `500` – Server error

## Performance Considerations

1. **Indexed Queries**: Price and financial queries use composite indexes on (ticker_id, date)
2. **Lazy Loading**: Foreign key relationships use `FetchType.LAZY`
3. **Pagination**: All list endpoints support pagination to avoid large result sets
4. **Batch Settings**: Hibernate batch insert/update configuration in `application.yml`

## Troubleshooting

### Connection Refused (PostgreSQL)

Ensure Docker container is running:

```bash
docker ps | grep finstream-postgres
```

If not, start it:

```bash
docker-compose -f backend/docker-compose.yml up -d
```

### Flyway Migration Errors

Clear database and restart:

```bash
docker-compose down -v
docker-compose up -d
mvn clean package
```

### Missing X-Firebase-UID Header

All endpoints except `/api/tickers`, `/api/tickers/{id}/prices`, `/api/tickers/{id}/financials` require the header:

```bash
curl -H "X-Firebase-UID: your-uid" http://localhost:8080/api/me
```

### Port Already in Use

Change the port in `application.yml` or use environment variable:

```bash
java -jar target/finstream-api-1.0.0.jar --server.port=8081
```

## Monitoring & Logging

Logs are configured in `application.yml`:

- Root level: `INFO`
- `com.finstream` package: `DEBUG`

View logs:

```bash
mvn spring-boot:run | grep "com.finstream"
```

## Next Steps

- Add Firebase token validation if needed
- Implement caching for ticker and price data
- Add rate limiting middleware
- Extend with portfolio analytics endpoints
- Implement soft deletes for audit trails
