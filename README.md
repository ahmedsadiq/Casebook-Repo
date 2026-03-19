# Casebook — Multi-Role Legal Case Management

A production-ready Next.js app for advocates, associates, and clients to manage legal cases.

---

## Roles

| Role | Can Do |
|---|---|
| **Advocate** | Full CRUD on cases, clients, associates, payments. Creates associate + client accounts. |
| **Associate** | View all cases, add progress notes, update hearing dates, upload documents, change case status. |
| **Client** | Read-only portal: see case progress, updates, hearing dates, payment schedule, and legal team contacts. |

---

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project → name it **Casebook**
2. Note your **Project URL** and **Anon Key** (Settings → API)
3. Note your **Service Role Key** (Settings → API → service_role) — keep this secret

### 2. Run the Migration

1. Supabase Dashboard → **SQL Editor** → New Query
2. Paste and run the full contents of `supabase/migrations/001_init.sql`
3. This creates all tables, RLS policies, indexes, triggers, and the storage bucket

### 3. Enable Email Auth

1. Authentication → Providers → Email → **Enable** (on by default)
2. Optional: Authentication → Settings → disable "Confirm email" for local testing

### 4. Create Your Advocate Account

Since advocates must sign up themselves (associates and clients are created by the advocate):

1. Go to your deployed app or `http://localhost:3000/auth`
2. You'll only see a sign-in form (accounts are created by advocates)
3. Instead, go to: Supabase → Authentication → Users → **Add user** → create with email/password
4. The trigger will auto-create the profile with role = 'advocate'
5. Sign in with those credentials — you'll land on the advocate dashboard

> **Tip**: After first launch, you can make sign-up available for the initial advocate by temporarily adding a sign-up toggle to `/app/auth/AuthForm.tsx`.

### 5. Local Development

```bash
cp .env.example .env.local
# Fill in your values
npm install
npm run dev
```

`.env.local` should contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

---

## Routes

### Advocate (`/advocate/*`)
| Route | Description |
|---|---|
| `/advocate/dashboard` | Stats, recent cases |
| `/advocate/cases` | All cases with search + filter |
| `/advocate/cases/new` | Create case |
| `/advocate/cases/[id]` | Case detail (updates, documents, payments) |
| `/advocate/cases/[id]/edit` | Edit case |
| `/advocate/cases/[id]/updates` | Add update / upload doc |
| `/advocate/cases/[id]/payments` | Manage payment schedule |
| `/advocate/clients` | List + add + remove clients |
| `/advocate/associates` | List + add + remove associates |
| `/advocate/profile` | Update name, phone |

### Associate (`/associate/*`)
| Route | Description |
|---|---|
| `/associate/dashboard` | Case overview |
| `/associate/cases` | All cases for the advocate |
| `/associate/cases/[id]` | Case detail + add updates/docs |

### Client (`/client/*`)
| Route | Description |
|---|---|
| `/client/dashboard` | Cases, payments, legal team info |
| `/client/cases/[id]` | Case progress, updates, payments |

---

## Tech Stack

- **Next.js 14** App Router + TypeScript
- **Supabase** Auth + Postgres + Storage + Row Level Security
- **@supabase/ssr** — cookie-based session in App Router
- **Tailwind CSS** — DM Sans font, navy palette
- **Zod** — env validation only

## Scripts

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run start     # Start production
npm run lint      # ESLint
npm run typecheck # TypeScript
```
