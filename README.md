# Hamrin.ai — Payment Recovery Platform

Recover failed subscription payments automatically. Merchants connect Stripe via OAuth; hamrin handles the dunning, retries, and card updates — compliant with Visa/MC rules and GDPR.

## How it works

```
Payment fails → Webhook → Email to customer → Customer updates card → Auto-retry → Recovered
```

Pricing: `$0 + 10% of recovered revenue` (outcome model) or `$749 LTD` or `$99/month flat`.

## Tech stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Database | Neon Postgres + Prisma |
| Payments | Stripe Connect |
| Email | Brevo (free tier) / Resend / Postmark |
| Jobs | QStash (Upstash) |
| Hosting | Vercel |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill values
cp .env.example .env

# 3. Sync database schema
npx prisma db push

# 4. Start dev server
npm run dev
```

See `SETUP_GUIDE.md` for where to get each env variable (Stripe webhook secret, Brevo API key, etc.).

## Project structure

```
src/
  app/api/          # API routes (webhook, auth, cron, payment-method)
  app/dashboard/    # Merchant dashboard
  app/recover/      # Customer card update page
  components/       # Stripe card modal
  services/         # Business logic (email, retry, churn, dashboard)
  lib/              # Shared utilities (db, env, stripe, validation)
```

## Environment variables

See `.env.example` for the full list. Minimum required:

```env
DATABASE_URL=           # Neon Postgres connection string
STRIPE_SECRET_KEY=      # Stripe test/live secret key
STRIPE_CLIENT_ID=       # Stripe Connect app client ID
STRIPE_WEBHOOK_SECRET=  # From Stripe Dashboard > Webhooks or stripe listen CLI
EMAIL_PROVIDER=brevo    # brevo | resend | postmark
BREVO_API_KEY=          # From https://app.brevo.com/settings/keys/api
BREVO_FROM_EMAIL=       # Verified sender in Brevo
```

## Compliance

- Visa Excessive Retry: tracked at card fingerprint level (15 attempts / 30 days)
- Mastercard: 10 attempts / 24 hours
- GDPR: EU data retained 540 days, US 90 days — auto-purge nightly
- Hard decline codes never retried: `03 04 07 12 57 62`

## Local webhook testing

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` into `.env` as `STRIPE_WEBHOOK_SECRET`.
