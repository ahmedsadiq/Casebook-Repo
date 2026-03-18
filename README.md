# Casebook

Casebook is a multi-role legal case management app built with Next.js and Supabase.

## Roles

| Role | Can Do |
| --- | --- |
| Advocate | Full CRUD on cases, clients, associates, payments. Creates associate and client accounts. |
| Associate | View assigned cases, add updates, upload documents, update hearing dates and status. |
| Client | Read-only portal for case progress, hearing dates, pending payments, and legal team contacts. |

## Setup

### 1. Create a Supabase project

1. Create a new Supabase project.
2. Copy the project URL, anon key, and service role key.

### 2. Run the migrations

Run the SQL files in `supabase/migrations` in order:

1. `001_init.sql`
2. Any later migration files in numeric order, including the profile and advocate subscription migrations

### 3. Enable email auth

Enable the Email provider in Supabase Authentication.

### 4. Configure paid advocate signup

Advocate signup now uses Stripe Checkout and bills monthly in PKR.

1. Set the Stripe environment variables shown below.
2. Create a Stripe webhook endpoint for `/api/stripe/webhook`.
3. Start advocate signup from `/signup/advocate`.
4. Associates and clients are still created by the advocate after signup.

### 5. Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

`.env.local` should contain:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
ADVOCATE_MONTHLY_USD=5
USD_TO_PKR_RATE=280
```

### 6. Deploy

Set the same environment variables in your hosting platform.

## Routes

### Public

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/auth` | Sign in |
| `/signup/advocate` | Paid advocate signup |
| `/billing` | Advocate billing gate for unpaid subscriptions |
| `/billing/success` | Stripe return page after successful checkout |

### Advocate

| Route | Description |
| --- | --- |
| `/advocate/dashboard` | Stats and recent cases |
| `/advocate/cases` | All cases with search and filter |
| `/advocate/cases/new` | Create case |
| `/advocate/cases/[id]` | Case detail |
| `/advocate/cases/[id]/edit` | Edit case |
| `/advocate/cases/[id]/updates` | Add update and upload documents |
| `/advocate/cases/[id]/payments` | Manage payment schedule |
| `/advocate/clients` | List, add, and remove clients |
| `/advocate/associates` | List, add, and remove associates |
| `/advocate/profile` | Update profile |

### Associate

| Route | Description |
| --- | --- |
| `/associate/dashboard` | Case overview |
| `/associate/cases` | Cases for the advocate |
| `/associate/cases/[id]` | Case detail |

### Client

| Route | Description |
| --- | --- |
| `/client/dashboard` | Cases, payments, and legal team info |
| `/client/cases/[id]` | Case progress, updates, and payments |

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
