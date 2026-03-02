# Lamrin.ai — Setup Guide

Quick setup for Stripe webhooks and email. Follow these steps exactly.

---

## 1. Stripe Webhook Secret (`STRIPE_WEBHOOK_SECRET`)

**The signing secret is NOT on the docs page.** It lives in your Stripe Dashboard.

### Where to find it

1. Go to **[https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)**
2. Click **"Add endpoint"** (or open an existing endpoint)
3. Set **Endpoint URL** to:  
   - Local: `http://localhost:3000/api/webhooks/stripe` (use Stripe CLI for local testing)  
   - Production: `https://yourdomain.com/api/webhooks/stripe`
4. Select events: `invoice.payment_failed`, `invoice.upcoming`, `payment_method.automatically_updated`
5. Click **"Add endpoint"**
6. On the endpoint details page, click **"Reveal"** next to **Signing secret**
7. Copy the value (starts with `whsec_`)
8. Add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
   ```

### Local development (Stripe CLI)

For local testing, Stripe can’t reach `localhost`. Use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI prints a **webhook signing secret** (e.g. `whsec_...`). Use that in `.env` for local dev.

---

## 2. Email — Brevo (free), Resend, or Postmark

### Option A: Brevo — free 300 emails/day (best when bootstrapping)

No credit card, no business email required. Sign up with Gmail.

1. Sign up at [https://www.brevo.com](https://www.brevo.com) (ex-Sendinblue)
2. Go to **SMTP & API** → [API Keys](https://app.brevo.com/settings/keys/api) → **Generate a new API key**. Copy the key (starts with `xkeysib-`).
3. In **Senders & IP**, add and verify one sender (e.g. your Gmail). Brevo will send a verification email.
4. Add to `.env`:
   ```env
   EMAIL_PROVIDER=brevo
   BREVO_API_KEY="xkeysib-xxxxxxxxxxxxxxxx"
   BREVO_FROM_EMAIL="your-verified@gmail.com"
   ```
5. Install dependency (run in project root): `npm install`

Free limit: **300 emails/day**; no expiry. [Brevo Free plan limits](https://help.brevo.com/hc/en-us/articles/208580669-What-are-the-limits-of-the-Free-plans)

### Option B: Resend

1. Sign up at [https://resend.com](https://resend.com)
2. Create an API key at [https://resend.com/api-keys](https://resend.com/api-keys)
3. Add to `.env`:
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxxxx"
   RESEND_FROM_EMAIL="onboarding@resend.dev"
   ```

### Option C: Postmark (paid, best deliverability later)

1. Sign up at [https://postmarkapp.com](https://postmarkapp.com)
2. Create a Server, get API Token, add a verified sender.
3. Add to `.env`:
   ```env
   EMAIL_PROVIDER=postmark
   POSTMARK_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   POSTMARK_FROM_EMAIL="noreply@yourdomain.com"
   ```

### Option D: No email (dev only)

If you omit all email API keys, emails are logged to the console. The app still runs.

---

## 3. Quick `.env` checklist

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `DATABASE_URL` | ✅ | Neon, Supabase, or your Postgres |
| `STRIPE_SECRET_KEY` | ✅ | [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | ✅ | Same as above |
| `STRIPE_CLIENT_ID` | ✅ | [Stripe Connect settings](https://dashboard.stripe.com/settings/connect) |
| `STRIPE_WEBHOOK_SECRET` | ✅ (prod) | [Dashboard → Webhooks → Your endpoint → Reveal](https://dashboard.stripe.com/webhooks) |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` (dev) or your production URL |
| `EMAIL_PROVIDER` | Optional | `brevo` \| `resend` \| `postmark`. Default: first valid key found |
| `BREVO_API_KEY` | Optional | [Brevo API keys](https://app.brevo.com/settings/keys/api) — free 300/day |
| `BREVO_FROM_EMAIL` | If Brevo | Your verified sender in Brevo (e.g. your Gmail) |
| `RESEND_API_KEY` | Optional | [resend.com/api-keys](https://resend.com/api-keys) |
| `POSTMARK_API_KEY` | Optional | [postmarkapp.com](https://postmarkapp.com) (if `EMAIL_PROVIDER=postmark`) |

---

## 4. Verify setup

```bash
npm run dev
```

- App starts → env is valid
- Webhooks fail with "Webhook secret not configured" → add `STRIPE_WEBHOOK_SECRET`
- Emails not sending → set `EMAIL_PROVIDER=brevo` and add `BREVO_API_KEY` + `BREVO_FROM_EMAIL` (or Resend/Postmark). Check logs for `[Email disabled]`.
