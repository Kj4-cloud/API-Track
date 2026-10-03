# API Token Tracking & Subscription Management System — Project Blueprint & Architecture

## 1. Executive Summary & Vision
The **API Token Tracking & Subscription Management System** is a production-quality, SaaS-grade developer control center. It enables individual developers, teams, and engineering leads to centrally govern third-party API credentials, track AI/Cloud subscription renewal dates and expenses, log token and request consumption across environments, and receive proactive threshold-based alerts.

Rather than looking like a generic academic CRUD application or an overly-decorated AI template, the system is designed to the standards of world-class developer tools such as Linear, Supabase, Vercel, Stripe, and Resend.

---

## 2. System Architecture & Tech Stack

### 2.1 Technology Stack Matrix
| Domain | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 / Vite | High-performance SPA with client-side routing |
| **Language** | TypeScript (Strict) | End-to-end type safety |
| **Styling** | Tailwind CSS v4 + Vanilla CSS Variables | Precision styling, custom color system, dark mode |
| **UI Primitives** | Radix UI (`dialog`, `dropdown`, `select`, etc.) | Fully accessible, unstyled headless primitives |
| **Icons** | Lucide React | Clean, developer-focused iconography |
| **State & Data Fetching** | TanStack Query (React Query) | Server-state caching, invalidation, optimistic updates |
| **Forms & Validation** | React Hook Form + Zod | Type-safe schema validation and error feedback |
| **Charts & Metrics** | Recharts | Responsive, clean visual representations |
| **Toasts & Feedback** | Sonner | Minimalist, stacked SaaS notification toasts |
| **Motion** | Framer Motion | Subtle micro-interactions, layout transitions |
| **Database & Auth** | Supabase (PostgreSQL 17 + GoTrue Auth) | Managed relational DB, RLS security, JWT auth |
| **Backend Layer** | Node.js + Express + TypeScript | Controller → Service → Repository pattern for orchestration & aggregation |

### 2.2 System Flow Architecture
```text
┌────────────────────────────────────────────────────────┐
│             Web Client (React + Vite + TS)             │
│   Dashboard │ APIs │ Subscriptions │ Usage │ Analytics │
└──────────────┬──────────────────────────┬──────────────┘
               │ Direct Auth & RLS Queries│ API Requests
               ▼                          ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│        Supabase BaaS         │  │     Express API Server       │
│  • GoTrue Auth (JWT)         │  │  Routes → Controllers        │
│  • Postgres 17 (RLS Policies)│  │     ↓ Services               │
│  • Storage & Realtime        │  │     ↓ Repositories           │
└──────────────────────────────┘  └──────────────┬───────────────┘
               ▲                                 │
               └─────────────────────────────────┘
                   Service Role / Admin Queries
```

---

## 3. Database Architecture (Supabase PostgreSQL)

The database is deployed on **Supabase** (`isxwonogwnnnyebsjhem.supabase.co`) with Row Level Security enabled across all tenant tables.

### 3.1 Entity Relationship Diagram
```text
      ┌─────────────────────────┐
      │       auth.users        │
      └────────────┬────────────┘
                   │ 1:1
                   ▼
      ┌─────────────────────────┐
      │        profiles         │
      └────────────┬────────────┘
                   │
         ┌─────────┼─────────────────────┐
     1:N │     1:N │                 1:N │
         ▼         ▼                     ▼
┌──────────────┐ ┌───────────────┐ ┌───────────────┐
│ api_services │ │ subscriptions │ │ notifications │
└──────┬───────┘ └───────┬───────┘ └───────────────┘
       │ 1:N             │ (optional link)
       ▼                 │
┌──────────────┐         │
│  usage_logs  │◄────────┘
└──────────────┘
```

### 3.2 Schema Definitions
1. **`categories`**: Static/extensible lookup for API categorization (`AI`, `Cloud`, `Database`, `Payments`, `Communication`, etc.).
2. **`profiles`**: User preferences, timezone, display name, currency settings.
3. **`api_services`**:
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (Foreign Key to `auth.users`)
   - `provider`: Provider name (e.g. `OpenAI`, `Anthropic`, `AWS`)
   - `name`: Service identifier (e.g. `GPT-4o API`)
   - `category`: Category string
   - `website`: Optional documentation / console URL
   - `api_key_encrypted`: Masked/encrypted API credential
   - `environment`: `'development' | 'staging' | 'production'`
   - `status`: `'active' | 'inactive' | 'expired' | 'revoked'`
   - `token_limit`: BigInt token cap
   - `tokens_used`: BigInt token usage counter
   - `notes`: Markdown or plaintext developer notes
4. **`subscriptions`**:
   - `id`: UUID
   - `user_id`: UUID
   - `api_id`: UUID (Foreign Key to `api_services`, nullable)
   - `plan_name`: String (e.g. `Pro Tier`, `Pay-As-You-Go`, `Team`)
   - `price`: Numeric(10,2)
   - `currency`: String (Default: `'USD'`)
   - `billing_cycle`: `'monthly' | 'quarterly' | 'yearly' | 'one-time'`
   - `start_date`: Date
   - `renewal_date`: Date
   - `auto_renew`: Boolean
   - `status`: `'active' | 'inactive' | 'cancelled' | 'expired'`
   - `payment_method`: String
5. **`usage_logs`**:
   - `id`: UUID
   - `api_id`: UUID (Foreign Key to `api_services`)
   - `user_id`: UUID (Foreign Key to `auth.users`)
   - `date`: Date
   - `requests`: Integer
   - `tokens_used`: BigInt
   - `credits_used`: Numeric(10,4)
   - `cost`: Numeric(10,4)
6. **`notifications`**:
   - `id`: UUID
   - `user_id`: UUID
   - `type`: `'renewal' | 'usage_warning' | 'token_limit' | 'system' | 'security'`
   - `title`: String
   - `message`: Text
   - `is_read`: Boolean
   - `link`: Optional routing link
7. **`user_preferences`**:
   - `usage_warning_threshold`: Default 70%
   - `usage_critical_threshold`: Default 90%
   - `renewal_reminder_days`: Default 7 days
   - `email_notifications`: Boolean

---

## 4. UI/UX & Design Philosophy

### 4.1 Visual System Rules
- **Anti-AI-Dashboard Rule**: Zero neon gradients, no random decorative blobs, no giant bubbly cards, no cartoonish emojis.
- **Palette**:
  - Primary Dark Navy: `#1E293B`
  - Electric Indigo Accent: `#6366F1`
  - Secondary Accent (Teal): `#14B8A6`
  - Semantic: Success (`#10B981`), Warning (`#F59E0B`), Danger (`#EF4444`)
  - Surface Light: `#F8FAFC`, Cards `#FFFFFF`, Borders `#E2E8F0`
  - Surface Dark: `#0B1120`, Cards `#111827`, Borders `#1E293B`
- **Typography**: Inter (400, 500, 600, 700) with monospace accents for API keys and numerical counters.
- **Elevation**: 1px subtle borders (`border-slate-200 dark:border-slate-800`) with minimal ambient shadow (`shadow-xs` / `shadow-sm`).
- **Responsive Layout**:
  - Desktop: 240px persistent or collapsible sidebar + sticky header + main content.
  - Mobile: Slide-over drawer with gesture support and compact metric cards.

---

## 5. Application Feature Modules & Routes

| Route | Feature Area | Description |
|---|---|---|
| `/auth/login` | Authentication | Clean split-screen login with email/password & validation |
| `/auth/register` | Authentication | Account registration with automatic profile provisioning |
| `/dashboard` | Executive Dashboard | KPI metrics, spending trends, usage graphs, renewal warnings |
| `/apis` | API Inventory | Comprehensive table of APIs, filters, add/edit modals, key reveal |
| `/apis/:id` | API Service Details | In-depth credential viewer, usage breakdowns, linked plan |
| `/subscriptions` | Subscriptions | Renewal calendars, cost forecasts, cycle management |
| `/usage` | Usage Tracking | Token/Request/Credit tracking, manual log entry, progress bars |
| `/analytics` | Deep Analytics | Historical trends, category distributions, cost breakdowns |
| `/notifications` | Notification Center | Alert stream, mark read/unread, renewal countdowns |
| `/settings` | Settings & Security | Profile editing, thresholds, dark mode toggle, API security |

---

## 6. Implementation Roadmap & Phases

- [x] **Phase 1: Foundation & Supabase Setup**
  - Database schema & RLS policies deployed on Supabase project `isxwonogwnnnyebsjhem`.
  - Frontend scaffolding with Vite + Tailwind CSS v4.
  - Base TypeScript types, constants, utilities, Supabase client.
- [x] **Phase 2: Core Components & Layout**
  - Resolved build configurations and verified zero-error monorepo builds.
  - Sidebar, TopBar, ThemeProvider, and keyboard shortcut integrations.
  - Auth pages (Login, Register) with live Supabase authentication & auto-confirm trigger.
- [x] **Phase 3: Dashboard & KPI Analytics**
  - Real metrics calculations from Supabase tables (Monthly spend, token velocity, upcoming renewals).
  - Recharts integration (Monthly Spending, Usage Trends, Category Donut) formatted in Indian Rupees (₹).
  - Upcoming renewal countdown alert banners.
- [x] **Phase 4: API Inventory & Credential Vault**
  - Add API modal with validation (Zod + React Hook Form).
  - Masked credentials with reveal/copy/rotate security safeguards.
  - Status updates, editing, deletion with real-time feedback.
- [x] **Phase 5: Subscriptions & Usage Tracker**
  - Subscription management with annual cost projection in INR (₹).
  - Token and request consumption logs with live cost calculator and quota threshold progress bars.
- [x] **Phase 6: Notifications, Settings & Express API Server**
  - In-app notification center with read status and alert stream filters.
  - User settings and preferences management defaulted to `Asia/Kolkata` and `INR (₹)`.
  - Express server architecture configured with TypeScript and auto `.env` discovery.
  - Production build passing with 0 errors across web and server.
- [x] **Phase 7: UI Craft Redesign & Currency Localization (`ibelick/ui-skills`)**
  - Micro-interactions, spring active buttons, pulsing status badges, and ambient card glow effects.
  - Subtle radial dot matrix background for dark and light modes.
  - Complete standardization of all currency values, charts, tables, and presets to Indian Rupees (₹ / INR).
