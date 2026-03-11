# Hamrin.ai — AI Agent Instructions

---

## 🚨 BEFORE YOU FINISH ANY RESPONSE — RUN THIS CHECKLIST

**Every single response that involves code, a module, or a feature MUST end with ALL of the following. No exceptions. No shortcuts.**

| # | What | If missing |
|---|---|---|
| 1 | **"Your actions"** section — turn-by-turn walkthrough | VIOLATION — go back and add it |
| 2 | **Commit checkpoint** — exact `git add . && git commit -m "..."` command | VIOLATION — go back and add it |
| 3 | **Confidence rating** 1–10, flagged if below 7 | VIOLATION — go back and add it |
| 4 | **Terminal commands** in order, copy-pasteable | VIOLATION — go back and add it |
| 5 | **UI verification** — what to click and what to see on screen | VIOLATION — go back and add it |
| 6 | **One likely failure** — exact error text + exact fix (file, line, what to change) | VIOLATION — go back and add it |

---

## What this product is
Hamrin.ai is a **Stripe Connect payment recovery SaaS**. Merchants connect their Stripe account via OAuth. When their customers' payments fail, hamrin automatically detects it, emails the customer, lets them update their card, and retries — recovering lost revenue. We charge 10% of recovered revenue (outcome pricing), $749 lifetime deal, or $99/month flat.

## Core user journey
1. Merchant connects Stripe -> OAuth -> `installations` table
2. Customer payment fails -> `invoice.payment_failed` webhook fires
3. We create `failed_payments` record
4. Email goes out (Postmark/Brevo) -> customer clicks "Update Card" link
5. `/recover?invoice_id=X` -> Stripe Elements card modal -> `POST /api/payment-method/update`
6. Stripe attaches new card -> immediate retry -> success -> status = "recovered"
7. Merchant sees dashboard -> Big Green $ recovered amount

## Tech stack
- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind 4
- **Database**: Neon Postgres (serverless) + Prisma ORM
- **Payments**: Stripe Connect (OAuth + webhooks + Elements)
- **Email**: Postmark (recommended for deliverability) -- fallback Brevo/Resend
- **SMS**: Twilio (optional)
- **Background jobs**: QStash (Upstash) -- scheduled cron + delayed messages
- **Hosting**: Vercel (planned)

## File structure
```
src/
  app/
    api/
      auth/stripe/          # OAuth flow (GET redirect, GET callback)
      webhooks/stripe/      # Main webhook handler (POST)
      payment-method/update # Card update endpoint (POST)
      cron/
        retry-engine/       # Hourly -- retry failed payments
        pre-dunning/        # Triggered by QStash -- send expiry warning emails
        churn-risk/         # Nightly -- calculate churn scores
        metrics/            # Nightly -- compute recovery rates
        outcome-fees/       # Nightly -- calculate 10% outcome fees
        gdpr-purge/         # Nightly -- delete expired events_raw records
    dashboard/              # Merchant dashboard page
    recover/                # Customer card update page
    page.tsx                # Landing / Connect Stripe CTA
  components/
    card-update-modal.tsx   # Stripe Elements card form
  services/
    email.ts                # Multi-provider email (Postmark/Brevo/Resend)
    retry-engine.ts         # Retry logic with Visa/MC compliance
    pre-dunning.ts          # Card expiry pre-dunning logic
    dashboard.ts            # Dashboard metrics queries
    churn.ts                # Churn risk score calculation
  lib/
    db.ts                   # Prisma installation CRUD
    env.ts                  # Typed env vars
    prisma.ts               # Prisma client singleton
    stripe.ts               # Stripe client + OAuth helpers
    validation.ts           # Zod schemas
  middleware.ts             # Security headers middleware
```

---

## Confidence and sourcing (MANDATORY)

- **Never guess.** If not confident, say "I am not sure" and explain why.
- **Rate confidence 1–10** after every substantive response; **flag** if below 7.
- **Cite verified sources** for all numbers, statistics, claims about people/companies, and quotations (URL, doc, or project file). If no source, do not state as fact.

---

## ⛔ GIT DISCIPLINE — MANDATORY, NO EXCEPTIONS

**Commit after every working unit. Not at end of day. After EVERY unit.**

The AI agent MUST remind you to commit after:
- Any new feature is complete
- Any bug is fixed
- Any new API route, service, or cron job
- Any schema change + `prisma db push`
- Any refactor touching 2+ files
- Any `.env.example` update

**Commit message format:**
```
feat: add churn risk score cron job
fix: retry engine -- guard against missing card fingerprint
chore: prisma db push -- add churnRiskScore to schema
docs: update ROADMAP day 2 checklist
```

**Branch strategy:**
- `main` = always deployable, always passing `npm run build`
- `dev` = daily work -> merge to main at end of each day

**Never commit:** `.env`, `node_modules/`, `.next/`

**Always commit:** `.env.example`, all `src/`, `prisma/schema.prisma`, `package.json`, `vercel.json`, `.cursor/rules/`, all `.md` docs

---

## How the AI reports progress (module updates)

For every module we work on, the AI MUST end with a **"Your actions"** section.

Every step is a turn-by-turn walkthrough -- written as if guiding someone who has never done this before. No vague bullets. Every step says:
- The exact URL to open (full link, e.g. https://dashboard.stripe.com/test/apikeys)
- Exactly what to click or find on that page
- Exactly what to copy (field name + what the value looks like)
- Exactly which file to open and which line to paste on
- Exactly what terminal command to run after

**Example of required format:**
> Step 1: Go to https://dashboard.stripe.com/test/apikeys
> Click "Reveal test key" next to "Secret key"
> Copy the value -- it starts with `sk_test_`
>
> Step 2: Open `lamrin/.env` in Cursor
> Find the line that says `STRIPE_SECRET_KEY=`
> Replace the value after `=` with what you just copied
>
> Step 3: In your terminal (inside `lamrin/`) run:
> `npm run dev`

**Required sections in every "Your actions":**
1. Env vars: full step-by-step (exact URL -> what to click -> what to copy -> open exact file -> paste at exact line)
2. Terminal commands: listed in order, one per line, exact
3. UI verification: exactly what to click and exactly what you should see on screen when it works
4. One likely failure: the exact error text you will see, and the exact fix (which file, which line, what to change to what)

---

## Coding standards (non-negotiable)
- Every server file starts with `import "server-only"`
- No `as any` -- use proper types or `unknown` with type guards
- Zod validation on every API route input
- All DB calls inside try/catch -- never let a DB error 500 the whole request
- Async operations that aren't critical (e.g. sending emails) use `.catch()` pattern -- fire and forget
- Prisma upsert over create when idempotency matters (webhooks especially)
- Every API route returns `Response.json()` -- never throw unhandled
- No hardcoded secrets -- always `env.X`
- Never log raw card data, PII beyond email, or raw Stripe webhook payloads in production

## Edge cases (always handle these)
- DB call fails -> structured error response, never 500 the request
- Webhook fires twice -> Prisma upsert, idempotency via `stripeEventId`
- Stripe returns unexpected shape -> Zod parse, log and return 200 (don't let Stripe retry forever)
- Email provider is down -> fire-and-forget `.catch()` -- never block the retry engine
- Card fingerprint is missing -> skip Visa guard, log warning, do not crash
- Hard decline code received -> `status = abandoned`, never retry
- Retry window expired (30d) -> `status = abandoned`
- Visa card fingerprint >= 15 attempts in 30d -> skip retry for that card, log compliance block
- EU country detected -> `retentionDays = 540`

## Compliance rules (Visa/MC/GDPR)
- **Visa**: Max 15 retry attempts per card fingerprint per 30 days
- **Mastercard**: Max 10 retry attempts per card per 24 hours
- **Hard decline codes** (never retry): `03, 04, 07, 12, 57, 62`
- **Retry window**: 30 days max (Visa). After that -> `status = abandoned`
- **GDPR retention**: EU countries -> 540 days. US -> 90 days
- `retentionDays` on every `events_raw` insert. GDPR cron deletes expired rows nightly.

## Cron security
All cron routes check `Authorization: Bearer ${CRON_SECRET}` in production. In dev they run unauthenticated. Use `assertCronSecret()` from `lib/env.ts`.

## Email provider priority
Postmark (recommended, ~98% inbox rate for billing emails)
Fallback: `brevo` -> `resend`. If no valid key: logs to console (dev-safe).

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Must pass before every commit to main
npx prisma db push   # Sync schema to Neon (run after schema changes)
npx prisma generate  # Regenerate Prisma client (run after schema changes)
stripe listen --forward-to localhost:3000/api/webhooks/stripe  # Local webhook testing
```

## Before deploy (IMPORTANT -- don't skip)
See `.cursor/rules/cto-behavior.mdc` -> "Before Deploy" section.
Key items: rotate Stripe key, rotate Neon password, set CRON_SECRET, switch to live Stripe keys.
