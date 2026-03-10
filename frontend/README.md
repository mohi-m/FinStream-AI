# FinStream Frontend (React + TypeScript)

This module is the user-facing web app for market exploration, portfolio management, and AI-powered portfolio commentary.

## Responsibilities

- Authentication flow with Firebase.
- Portfolio and holdings management UX.
- Market and financial analytics UI.
- AI Insights experience for portfolio commentary and refresh control.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- React Router
- Firebase Auth
- Recharts
- React Markdown (`portfolioOverview` and commentary rendering)

## System Design

```text
+-------------------------------------------------------+
| React Application                                     |
| Router: /, /app/overview, /app/portfolios, /app/profile |
+-------------------------------------------------------+
                         |
                         v
+-------------------------------------------------------+
| Query + API Client Layer                              |
| - attaches X-Firebase-UID and Bearer token            |
| - handles 401/session expiry                           |
+-------------------------------------------------------+
                         |
                         v
+-------------------------------------------------------+
| FinStream Backend API                                 |
| portfolio CRUD, market data, AI commentary endpoints  |
+-------------------------------------------------------+
```

## AI Commentary UX Flow

1. User opens portfolio page.
2. Frontend query hook calls `GET /api/portfolios/{portfolioId}/commentary`.
3. Backend may serve cached commentary.
4. User can force regeneration with refresh button:
   - `POST /api/portfolios/{portfolioId}/commentary/refresh`
5. Fresh payload updates query cache and UI panels (`Overview` and `By Ticker`).

Key files:

- `src/features/portfolios/components/PortfolioCommentary.tsx`
- `src/features/portfolios/hooks/usePortfolios.ts`
- `src/lib/api/endpoints.ts`
- `src/lib/api/client.ts`

## Prerequisites

- Node.js 20+
- npm (or pnpm)

## Environment Configuration

Copy and edit env file:

```bash
# macOS/Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Required variables:

| Variable                            | Description                               |
| ----------------------------------- | ----------------------------------------- |
| `VITE_API_BASE_URL`                 | Backend URL, e.g. `http://localhost:8080` |
| `VITE_FIREBASE_API_KEY`             | Firebase config                           |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase config                           |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase config                           |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase config                           |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase config                           |
| `VITE_FIREBASE_APP_ID`              | Firebase config                           |

Optional demo login:

| Variable                  | Description                  |
| ------------------------- | ---------------------------- |
| `VITE_DEMO_USER_EMAIL`    | Shared demo account email    |
| `VITE_DEMO_USER_PASSWORD` | Shared demo account password |

## Local Development

Using npm:

```bash
cd frontend
npm ci
npm run dev
```

Using pnpm:

```bash
cd frontend
pnpm install
pnpm dev
```

Default URL:

- `http://localhost:5173`

## Build and Validate

```bash
npm run lint
npm run build
npm run preview
```

## Route Map

- `/` -> landing page
- `/app/overview` -> stocks overview
- `/app/portfolios` -> portfolio management + AI insights
- `/app/profile` -> user profile

## Project Structure

```text
frontend/
- src/app/
    - layouts/
    - providers/
    - router.tsx
- src/components/
    - common/
    - ui/
- src/features/
    - auth/
    - landing/
    - portfolios/
    - profile/
    - stocks/
- src/lib/
    - api/
    - firebase/
    - utils/
```

## Deployment Notes

- GitHub Actions workflow builds and deploys to GitHub Pages.
- Build-time env variables are injected from repository secrets.
