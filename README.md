# API Token Tracking & Subscription Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat-square)](https://expressjs.com/)

A production-quality developer SaaS control center for tracking API credentials, AI and cloud subscriptions, token usage, renewal dates, and expense forecasts.

Designed with modern engineering aesthetics inspired by Linear, Supabase, and Stripe Dashboard.

---

## Key Features

1. **Centralized API Credential Vault**:
   - Register API services across OpenAI, Anthropic, AWS, Firebase, Stripe, etc.
   - Credentials masked by default (`sk-proj-••••••••••••••••••••••••`) with security confirmations on reveal.
   - Quick one-click clipboard copying and key rotation workflow.
   - Environment tagging (`Development`, `Staging`, `Production`).

2. **Subscription & Renewal Management**:
   - Track plans, billing cycles (Monthly, Quarterly, Yearly, One-time), and next renewal dates.
   - Automatic 7-day renewal alarms and estimated annual run rate calculations.
   - Auto-renew tracking and linked payment method references.

3. **Usage & Quota Monitoring**:
   - Log daily request volume, token throughput, credits used, and incurred metered cost.
   - Per-service progress bars with configurable warning thresholds:
     - `0–70%`: Normal
     - `70–90%`: Warning
     - `90%+`: Critical capacity alert

4. **Analytics & Cost Intelligence**:
   - Multi-period filters (`7 Days`, `30 Days`, `90 Days`, `1 Year`).
   - Recharts visual graphs:
     - Monthly spending trajectory
     - Stacked cost breakdown by provider
     - Request throughput velocity
     - Categorical and environmental distribution donuts

5. **Notification Stream**:
   - In-app notification center with unread count badges.
   - Alert categories: Subscription Renewal, Usage Warning, Token Limit, System, and Security.

6. **Lightning Navigation (`⌘ K` / `Ctrl+K`)**:
   - Global command palette for instant search across all registered APIs, subscriptions, and views.

7. **SaaS Aesthetic & Dark Mode**:
   - Built on a slate/indigo/teal palette using Inter typography.
   - Complete Light, Dark, and System theme support without color inversions.

---

## Architecture

```text
api-token-tracker/
├── apps/
│   ├── web/               # Frontend (React 19 + Vite + TypeScript + Tailwind v4)
│   │   ├── src/
│   │   │   ├── components/# Layout (Sidebar, TopBar, CommandSearch), UI, Common
│   │   │   ├── features/  # Auth, Dashboard, API Vault, Subscriptions, Usage, Analytics, Settings
│   │   │   ├── hooks/     # useAuth, useTheme
│   │   │   ├── services/  # Supabase CRUD service modules
│   │   │   ├── types/     # Domain TypeScript interfaces
│   │   │   ├── utils/     # Formatting, currency, usage level calculations
│   │   │   └── routes/    # Protected routes & auth guards
│   │   └── package.json
│   └── server/            # Backend API (Node.js + Express + TypeScript)
│       ├── src/
│       │   ├── modules/   # Controller → Service → Repository pattern
│       │   ├── middleware/# Auth token verification, centralized error handling
│       │   ├── routes/    # Endpoint router
│       │   └── server.ts  # HTTP listener
│       └── package.json
├── project.md             # Complete technical architecture blueprint
├── agent.md               # Continuous agent changelog & activity tracking
└── package.json
```

---

## Database Schema (Supabase PostgreSQL)

Deployed on Supabase with Row Level Security (RLS) active on all user-owned tables:
- `categories`: Global API categories (`AI`, `Cloud`, `Database`, `Payments`, etc.)
- `profiles`: User timezone, currency, display name
- `api_services`: Service credentials, environment, token caps, and status
- `subscriptions`: Recurring plans, renewal dates, auto-renew status
- `usage_logs`: Daily historical metrics (`requests`, `tokens_used`, `credits_used`, `cost`)
- `notifications`: Alert notifications with read states
- `user_preferences`: Configurable threshold settings

---

## Quick Start & Running Locally

### 1. Prerequisites
- Node.js 18+
- npm 9+

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd apps/web
npm install

# Install backend dependencies
cd ../server
npm install
```

### 3. Launch Development Servers
From the root workspace:

**Frontend**:
```bash
npm run dev:web
```
Access the application at `http://localhost:5173`.

**Backend**:
```bash
npm run dev:server
```
API server running at `http://localhost:3001` (Health check: `http://localhost:3001/api/health`).

---

## Production Build Verification

Verify that all TypeScript code passes strict compilation and bundles cleanly:
```bash
# Build frontend
npm run build:web

# Build backend
npm run build:server
```
Both builds produce 0 errors.
