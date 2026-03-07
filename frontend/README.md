# FinStream Frontend

A modern financial dashboard built with React, TypeScript, and Vite.

## Features

- 📈 **Stock Tracking** - Browse stocks, view price history charts, and manage a personal watchlist
- 💼 **Portfolio Management** - Create portfolios, add holdings, and track portfolio value
- 🔐 **Authentication** - Sign in with Google, GitHub, or a shared demo account via Firebase
- 🌓 **Dark/Light Mode** - Toggle between themes with system preference detection
- 📊 **Analytics** - Visualize portfolio allocation with interactive charts

## Tech Stack

- **React 19** with TypeScript
- **Vite** for blazing fast development
- **Tailwind CSS** for styling
- **shadcn/ui** components (Radix UI primitives)
- **TanStack Query** for server state management
- **React Router** for navigation
- **React Hook Form** + **Zod** for form validation
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Firebase** for authentication

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

3. Configure your Firebase project credentials in `.env`

4. Start the development server:
   ```bash
   pnpm dev
   ```

The app will be available at `http://localhost:5173`

## Environment Variables

| Variable                            | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `VITE_API_BASE_URL`                 | Backend API URL (default: `http://localhost:8080`) |
| `VITE_FIREBASE_API_KEY`             | Firebase API key                                   |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                               |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID                                |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Firebase storage bucket                            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID                       |
| `VITE_FIREBASE_APP_ID`              | Firebase app ID                                    |
| `VITE_DEMO_USER_EMAIL`              | Optional shared demo account email                 |
| `VITE_DEMO_USER_PASSWORD`           | Optional shared demo account password              |

## Demo User Setup (Optional)

1. Enable **Email/Password** in Firebase Authentication providers.
2. Create a demo account in Firebase Auth (example: `demo@your-domain.com`).
3. Add `VITE_DEMO_USER_EMAIL` and `VITE_DEMO_USER_PASSWORD` to your `.env`.
4. The landing page will show a **Try Demo** button that signs into the shared demo account.

## Project Structure

```
src/
├── app/                  # App configuration
│   ├── layouts/          # Page layouts (Public, App)
│   ├── providers/        # Context providers (Auth, Theme, Query)
│   └── router.tsx        # Route definitions
├── components/
│   ├── common/           # Shared components
│   └── ui/               # shadcn/ui components
├── features/             # Feature modules
│   ├── auth/             # Authentication
│   ├── landing/          # Landing page
│   ├── portfolios/       # Portfolio management
│   ├── profile/          # User profile
│   └── stocks/           # Stock browsing
└── lib/
    ├── api/              # API client and types
    ├── firebase/         # Firebase configuration
    └── utils/            # Utility functions
```

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `pnpm dev`     | Start development server |
| `pnpm build`   | Build for production     |
| `pnpm preview` | Preview production build |
| `pnpm lint`    | Run ESLint               |

## API Integration

The frontend integrates with the FinStream API. See the backend README for API documentation.

Authentication is handled via Firebase, with the Firebase UID sent in the `X-Firebase-UID` header and the ID token in the `Authorization` header for all API requests.

## License

MIT
