# Supabase setup — database + auth (free tier)

Same rule as Stripe: secrets only go in `.env.local` (git-ignored) and Vercel's
env settings — never in the repo or chat. I build against env vars and never need
to see them.

## 1. Create the project (only you can do this)

1. Sign in at **[supabase.com](https://supabase.com)** → **New project**.
2. Name it `lustre`, pick a region near you, and **set a database password** (save it).
3. Wait ~2 min for it to provision.

## 2. Grab the connection strings — **Settings → Database → Connection string**

Supabase shows several. You need two (replace `[YOUR-PASSWORD]` with the password from step 1):

- **Transaction pooler** (host has `pooler`, port **6543**) → this is your **`DATABASE_URL`** (app runtime, serverless-safe). Append `?pgbouncer=true` if not present.
- **Direct connection** (port **5432**) → this is your **`DIRECT_URL`** (Prisma migrations).

## 3. Grab the API keys — **Settings → API**

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **`anon` `public` key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for the browser)
- **`service_role` key** → `SUPABASE_SERVICE_ROLE_KEY` (**secret** — server only)

## 4. Put them in `lustre/web/.env.local`

Add these lines (keep your existing Stripe keys):

```
DATABASE_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-...supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 5. Create the database tables

From `lustre/web`:

```
npx prisma migrate dev --name init
```

This reads `prisma/schema.prisma` (already written + validated) and creates all the
tables (Customer, Pro, Booking, LedgerEntry, Fulfillment, ProcessedEvent, …) in your
Supabase Postgres. Then **tell me "done"** and I'll wire the app to persist through it.

> The schema is **already written and validated** — `prisma/schema.prisma` +
> `prisma.config.ts`. You only run the migrate command once the URLs are in place.

## For Vercel (later)

Add the same five variables in **Vercel → Settings → Environment Variables**, then
redeploy. (Use the **pooler** `DATABASE_URL` on Vercel — serverless needs it.)

## What unlocks once this is connected (the next build)

- Bookings / customers / pros / ledger **persist** (survive serverless restarts).
- Payment **idempotency** becomes a real DB unique-constraint on `paymentIntentId`.
- Webhook **dedup** via the `ProcessedEvent` table.
- **Supabase Auth**: customer / pro / admin accounts; `customerId` derived from the
  session instead of trusted from the request (closes the Phase-1 security items).
