# Context for Lmerna (or any AI) — Copy this or say "read CONTEXT_FOR_LMERNA.md"

Use this file when you need to give full project context without re-explaining.

---

## Product in one sentence

**hamrin.ai** is a Stripe Retention OS for founder-led subscription businesses: cancel flows that save customers, payment recovery that catches failed charges, reactivation campaigns that win back churned users, and a proof dashboard that shows every dollar retained — starting at $0 with outcome pricing.

---

## Product identity (March 2026)

**Category:** Retention OS for Stripe subscription businesses
**Comparable to:** Churnkey (validated at $300-990/mo, protecting $500M+ ARR, 17-person team, TinySeed-funded)
**Our edge:** outcome pricing ($0 upfront), simpler setup, payment wall + cancel flows included in every plan — not gated behind $700+/mo tiers

**Why this works in 2026:**
- Churnkey proved the market: cancel flows + payment recovery + reactivation = real revenue
- Up to 48% of SaaS churn is involuntary (failed payments), the rest is voluntary (cancellations)
- Solving only one side leaves money on the table
- CAC rose 14% in 2025 — retaining customers is cheaper than acquiring new ones
- AI-native SaaS tools show 60%+ revenue churn; most are on Stripe monthly billing
- No competitor offers full retention OS at outcome pricing

**ICP:** Founder-led, self-serve Stripe SaaS, $15k-$100k MRR, monthly card billing, US/UK/EU first.

**One-liner:** "Turn your cancel button into a retention engine. Recover every failed payment. Win back churned customers. Pay only on results."

---

## EXISTING — What we already built (code complete)

### Payment Recovery Flows (all working)
- **Stripe Connect OAuth:** `GET /api/auth/stripe?pricing_model=outcome|flat|ltd` → OAuth → callback creates installation → redirect to dashboard
- **Failed payment detection:** Webhook `invoice.payment_failed` → create failed_payments → send recovery email with card update link
- **Card update + recovery:** `/recover?invoice_id=X` → Stripe Elements → attach new card → retry invoice → mark recovered
- **Retry engine:** Hourly cron, decline-code-aware, Visa 15/30d + MC 10/24h compliance, hard-decline abort
- **Pre-dunning:** `invoice.upcoming` → T-30/T-7/T-1 card expiry emails via QStash
- **Churn risk scoring:** Nightly cron, score 0-100, dashboard at-risk list, Send 50% Off button
- **Outcome metering:** Nightly cron, 10% fee tracking for outcome-priced installations
- **GDPR purge:** Nightly cron, 540d EU / 90d US retention
- **LTD flow:** Stripe Payment Link → checkout.session.completed → inventory management (50 spots)
- **Metrics:** Nightly cron → metrics_daily persistence

### Email (4 types in src/services/email.ts)
- sendPaymentFailedEmail, sendRecoverySuccessEmail, sendPreDunningEmail, sendDiscountEmail
- Providers: Brevo / Resend / Postmark (env EMAIL_PROVIDER)

### Pages (existing)
- Landing (src/app/page.tsx), Onboard (src/app/onboard/page.tsx), Dashboard (src/app/dashboard/page.tsx), Recover (src/app/recover/page.tsx)

### API routes (existing)
- Auth: GET /api/auth/stripe, GET /api/auth/stripe/callback, GET /api/auth/stripe/status
- Webhooks: POST /api/webhooks/stripe
- Recovery: POST /api/payment-method/update
- Discount: POST /api/discount/send
- Settings: PATCH /api/settings
- Health: GET /api/status
- LTD: GET /api/ltd/count
- Crons: retry-engine, churn-risk, metrics, outcome-fees, gdpr-purge

### Schema (existing Prisma models)
- Installation (stripeAccountId, accessToken, country, pricingModel, vauEnabled, abuEnabled, smsEnabled)
- FailedPayment (cardFingerprint, churnRiskScore, discountOfferSentAt, invoiceId)
- RetryLog, EventRaw, RecoveredMonthly, UsageTracking, LtdInventory, MetricsDaily

### Compliance & security (existing)
- Visa 15/30d, MC 10/24h, hard decline codes, GDPR retention, CRON_SECRET, security headers middleware, Stripe webhook signature verification

### Stack
- Next.js 15 (App Router), TypeScript, Tailwind 4, Neon Postgres, Prisma, Stripe Connect, Brevo/Resend/Postmark, Twilio (optional), QStash (optional), Vercel + vercel.json crons

### Design
- DESIGN_BRIEF.md: Lora serif headlines, Inter body, warm cream hero, blue CTAs, yellow logo accent
- .cursor/rules/design-system.mdc: short design rules

---

## NEW — What we are building (MVP 2.0)

### Build order — each depends on the previous

1. Session auth + route protection
2. Recovery attribution + schema updates
3. Cancel Flow Widget
4. Pause subscription flow (inside cancel flow)
5. Failed Payment Wall + Pause Wall
6. Reactivation campaigns
7. Retention analytics dashboard
8. Test mode + debugger
9. Recover page hardening
10. Landing + onboard messaging update

### Module 1: Session Auth + Route Protection
- Signed HttpOnly cookie (hamrin_session) with SESSION_SECRET
- Session payload: installationId, stripeAccountId, issuedAt
- Set cookie after OAuth callback
- Protect dashboard, settings, discount, debug routes
- POST /api/auth/logout
- No external auth provider

### Module 2: Recovery Attribution + Schema Updates
- FailedPayment gains: recoveredAt, recoverySource (card_update / retry_engine / auto_updater / unknown), abandonedAt, failedEmailSentAt, recoveryEmailSentAt
- All recovery paths set these fields
- Email idempotency guards
- Dashboard data helper computes attribution breakdown

### Module 3: Cancel Flow Widget
This is the biggest new module. It intercepts the merchant's cancel button and shows a retention flow.

**How it works:**
- Merchant embeds a JS snippet or React component in their app
- When customer clicks "Cancel Subscription," instead of immediate cancellation, the widget opens
- The widget shows a multi-step flow:
  - Step 1: "We're sorry to see you go" + collect cancellation reason (dropdown + freeform text)
  - Step 2: Based on reason, show a targeted offer:
    - "Too expensive" → discount offer (configurable % off for N months)
    - "Not using it enough" → pause offer (1/2/3 months)
    - "Missing features" → collect feature request + offer discount
    - "Switching to competitor" → collect competitor name + offer discount
    - "Other" → collect feedback + offer discount
  - Step 3: If customer accepts offer → apply discount/pause via Stripe API → record save
  - Step 3 alt: If customer declines all offers → proceed with cancellation via Stripe API → record churn + feedback
- The widget must be:
  - Embeddable via script tag (any website) or React component
  - Styled with Hamrin brand defaults but customizable by merchant
  - Functional without requiring merchant's backend changes beyond the embed

**Data model additions:**
- CancelFlowSession: installationId, stripeCustomerId, stripeSubscriptionId, reason, reasonText, offerShown, offerType (discount/pause/none), offerAccepted, savedAt/cancelledAt, feedbackText, competitorName
- CancelFlowConfig: installationId, enabled, offers[] (type, discountPercent, discountMonths, pauseMonths), reasonOptions[], brandColor, brandLogo

**API routes:**
- GET /api/cancel-flow/config?installation_id=X — returns the cancel flow config for the widget
- POST /api/cancel-flow/session — creates a new cancel flow session when widget opens
- POST /api/cancel-flow/save — applies offer (discount or pause) via Stripe API, marks session as saved
- POST /api/cancel-flow/cancel — processes cancellation via Stripe API, records feedback, marks session as cancelled
- GET /api/cancel-flow/snippet.js — embeddable JS widget
- PATCH /api/cancel-flow/config — merchant updates their cancel flow settings (offers, reasons, branding)

**Dashboard additions:**
- Cancel Flow section: total sessions, save rate, top reasons, offer acceptance rate, saved revenue
- Cancel Flow settings: configure offers, reasons, enable/disable

### Module 4: Pause Subscription Flow
- Integrated into cancel flow as one of the offer types
- When customer accepts pause: call Stripe API to pause subscription (set pause_collection on subscription)
- Store pause duration, resume date
- Webhook: customer.subscription.updated → detect pause/resume state changes
- When subscription is paused and customer visits merchant's app → show Pause Wall (see Module 5)

**Data model additions:**
- PausedSubscription: installationId, stripeCustomerId, stripeSubscriptionId, pausedAt, resumeAt, resumedAt, pauseSource (cancel_flow / manual)

### Module 5: Failed Payment Wall + Pause Wall
Two embeddable walls:

**Failed Payment Wall (already planned):**
- GET /api/wall/check?customer_email=X&installation_id=X — checks for open failed payments
- GET /api/wall/snippet.js — embeddable JS
- React component: HamrinPaymentWall
- Modes: banner, modal, blocking
- Shows card update flow, disappears on recovery

**Pause Wall (new):**
- GET /api/wall/pause-check?customer_email=X&installation_id=X — checks for paused subscription
- Returns: { isPaused, resumeDate, resumeUrl }
- Same snippet can handle both walls (payment wall takes priority over pause wall)
- Pause Wall shows: "Your subscription is paused until [date]. Resume now?" with one-click resume button
- Resume button calls POST /api/wall/resume → resumes subscription via Stripe API → wall disappears

### Module 6: Reactivation Campaigns
Automated emails to customers who cancelled or whose subscriptions ended.

**How it works:**
- Webhook: customer.subscription.deleted → create ChurnedCustomer record
- Reactivation campaign: configurable email sequence (e.g., Day 3, Day 7, Day 14, Day 30 after cancellation)
- Each email includes a personalized offer (discount or special deal) and a one-click reactivation link
- Reactivation link: /reactivate?customer_id=X&offer_id=Y → creates new subscription with offer applied via Stripe API
- Track: emails sent, opened (if provider supports), reactivated, revenue recovered

**Data model additions:**
- ChurnedCustomer: installationId, stripeCustomerId, customerEmail, cancelledAt, cancelReason, reactivatedAt, reactivationSource
- ReactivationCampaign: installationId, enabled, emails[] (dayOffset, subject, body, offerType, offerValue)
- ReactivationEmail: churnedCustomerId, campaignId, sentAt, emailIndex, opened, clicked, reactivatedFromThis

**API routes:**
- GET /api/reactivation/config?installation_id=X
- PATCH /api/reactivation/config — update campaign settings
- POST /api/reactivation/send — cron-triggered, sends next email in sequence for eligible churned customers
- GET /api/reactivate?customer_id=X&offer_id=Y — reactivation landing page
- POST /api/reactivate — creates subscription with offer

**Cron:**
- Daily cron: check churned customers, send next email in sequence based on dayOffset

### Module 7: Retention Analytics Dashboard
Unified dashboard showing all retention metrics.

**Layout:**
- TOP: LIVE/TEST badge
- Recovery Audit (first-run) or Retention Summary (returning)
- KPI row: Total Retained Revenue | Cancel Flow Save Rate | Payment Recovery Rate | Reactivation Rate
- Section: Cancel Flow Performance
  - Sessions, saves, cancellations, save rate
  - Top cancellation reasons (pie/bar chart)
  - Offer acceptance by type (discount vs pause)
  - Saved revenue from cancel flows
- Section: Payment Recovery Performance
  - Failed amount, recovered amount, pending
  - Recovery by source (retry, email, wall, auto-updater)
  - Recent activity timeline
- Section: Reactivation Performance
  - Churned customers, emails sent, reactivated, win-back revenue
  - Campaign performance by email step
- Section: Failed Payments Table (with status badges)
- Section: At-risk customers (churn score > 65)
- Section: Installation Health
- Section: Settings (cancel flow config, reactivation config, SMS toggle, wall settings)
- Section: GDPR retention info

### Module 8: Test Mode + Debugger
- Installation.livemode field
- LIVE/TEST badge on dashboard
- Test mode shows: step-by-step test instructions, webhook event viewer, simulate button
- Debug routes protected by session + test-mode check

### Module 9: Recover Page Hardening
- Handle edge cases: already recovered, hard decline, expired link, disconnected account
- Email idempotency
- Friendly UX for every state

### Module 10: Landing + Onboard Messaging Update
- New identity: "Stripe Retention OS"
- Feature sections: Cancel Flows, Payment Recovery, Reactivation, Payment Wall, Analytics
- Pricing: outcome ($0 + 10%), flat ($99/mo), LTD ($749)
- Competitive positioning vs Churnkey ($300-990/mo)

---

## Updated Schema (Prisma) — all models

### Existing (keep)
- Installation (stripeAccountId, accessToken, country, pricingModel, vauEnabled, abuEnabled, smsEnabled)
- FailedPayment (cardFingerprint, churnRiskScore, discountOfferSentAt, invoiceId)
- RetryLog, EventRaw, RecoveredMonthly, UsageTracking, LtdInventory, MetricsDaily

### New fields on existing models
- Installation: + livemode, accountEmail, accountDisplayName, cancelFlowEnabled, reactivationEnabled
- FailedPayment: + recoveredAt, recoverySource, abandonedAt, failedEmailSentAt, recoveryEmailSentAt

### New models
- CancelFlowSession (installationId, stripeCustomerId, stripeSubscriptionId, reason, reasonText, offerShown, offerType, offerAccepted, savedAt, cancelledAt, feedbackText, competitorName, createdAt)
- CancelFlowConfig (installationId, enabled, offers Json, reasonOptions Json, brandColor, brandLogo)
- PausedSubscription (installationId, stripeCustomerId, stripeSubscriptionId, pausedAt, resumeAt, resumedAt, pauseSource)
- ChurnedCustomer (installationId, stripeCustomerId, customerEmail, cancelledAt, cancelReason, reactivatedAt, reactivationSource)
- ReactivationCampaign (installationId, enabled, emails Json)
- ReactivationEmail (churnedCustomerId, campaignId, sentAt, emailIndex, opened, clicked, reactivatedFromThis)

---

## Updated API routes (all)

### Auth
- GET /api/auth/stripe, GET /api/auth/stripe/callback, GET /api/auth/stripe/status
- POST /api/auth/logout [NEW]

### Webhooks
- POST /api/webhooks/stripe (existing events + customer.subscription.deleted + customer.subscription.updated for pause/resume)

### Payment Recovery (existing)
- POST /api/payment-method/update
- POST /api/discount/send
- PATCH /api/settings

### Cancel Flow [NEW]
- GET /api/cancel-flow/config
- PATCH /api/cancel-flow/config
- POST /api/cancel-flow/session
- POST /api/cancel-flow/save
- POST /api/cancel-flow/cancel
- GET /api/cancel-flow/snippet.js

### Walls [NEW]
- GET /api/wall/check (failed payment wall)
- GET /api/wall/pause-check (pause wall)
- GET /api/wall/snippet.js (combined wall script)
- POST /api/wall/resume (resume paused subscription)

### Reactivation [NEW]
- GET /api/reactivation/config
- PATCH /api/reactivation/config
- POST /api/reactivation/send (cron-triggered)
- GET /api/reactivate (reactivation landing page)
- POST /api/reactivate (process reactivation)

### Debug [NEW]
- GET /api/debug/events
- POST /api/debug/simulate

### Existing
- GET /api/status, GET /api/ltd/count

### Crons (updated)
- Hourly: retry-engine
- Daily 2:00: churn-risk
- Daily 2:30: metrics
- Daily 3:00: outcome-fees
- Daily 3:30: reactivation-send [NEW]
- Daily 4:00: gdpr-purge
- QStash: pre-dunning

---

## Updated email types

### Existing
- sendPaymentFailedEmail, sendRecoverySuccessEmail, sendPreDunningEmail, sendDiscountEmail

### New
- sendCancelFlowSaveEmail — "Great news, your [offer] has been applied"
- sendPauseConfirmationEmail — "Your subscription is paused until [date]"
- sendResumeConfirmationEmail — "Welcome back! Your subscription is active again"
- sendReactivationEmail — "We miss you! Here's [offer] to come back"
- sendReactivationSuccessEmail — "Welcome back! Your subscription is active"

---

## Env (updated)
- DATABASE_URL, STRIPE_*, NEXT_PUBLIC_APP_URL, EMAIL_PROVIDER + provider keys, CRON_SECRET, SESSION_SECRET [NEW]
- Optional: STRIPE_LTD_PAYMENT_LINK, TWILIO_*, QSTASH_*

---

## Positioning (updated)

- **Product:** Stripe Retention OS for founder-led SaaS
- **Not:** just a dunning tool, not a billing platform, not analytics-only
- **ICP:** SaaS founders (especially AI-native), $15k-$100k MRR, Stripe, US/UK/EU
- **Wedge:** Full retention stack (cancel flows + payment recovery + reactivation + walls + proof) at outcome pricing. Churnkey charges $300-990/mo. We charge $0 upfront + 10% of retained revenue.
- **One-liner:** "Turn your cancel button into a retention engine. Recover every failed payment. Win back churned customers. Pay only on results."

---

## What we do NOT build (deferred)
- Feedback AI / ML analysis (requires volume we don't have)
- Adaptive Offers / AI-powered offer optimization (requires data)
- A/B testing on flows (requires volume for significance)
- Multi-provider support (Stripe only for now)
- Multi-language / AI translations (English only for now)
- SMS sending (toggle exists, sending deferred)
- Stripe Usage-Based billing for outcome fees
- Account Agent / Intelligence Suite
- Session replay
- White-label

---

## Repo layout (updated)

### Existing
- src/app/page.tsx — landing
- src/app/onboard/page.tsx — pricing choice
- src/app/dashboard/page.tsx — merchant dashboard
- src/app/recover/page.tsx — customer card update
- src/app/api/ — all API routes and crons
- src/services/ — email, retry-engine, churn, pre-dunning, dashboard
- src/lib/ — db.ts, stripe.ts, env.ts
- src/components/ — card-update-modal, send-discount-button, sms-toggle, pricing-section
- src/middleware.ts — security headers
- prisma/schema.prisma — data model

### New
- src/lib/session.ts — session helpers
- src/app/api/cancel-flow/ — cancel flow API routes
- src/app/api/wall/ — wall check, snippet, resume routes
- src/app/api/reactivation/ — reactivation config, send, process routes
- src/app/api/reactivate/ — reactivation landing page
- src/app/api/debug/ — test mode routes
- src/app/api/auth/logout/ — logout route
- src/app/reactivate/page.tsx — reactivation landing page for churned customers
- src/services/cancel-flow.ts — cancel flow business logic
- src/services/reactivation.ts — reactivation campaign logic
- src/services/wall.ts — wall check logic
- src/components/cancel-flow/ — cancel flow widget React component
- src/components/payment-wall/ — payment wall React component
- src/components/pause-wall/ — pause wall React component

---

*Last updated: March 2026. Use this file as the single context dump for Lmerna or any prompt.*