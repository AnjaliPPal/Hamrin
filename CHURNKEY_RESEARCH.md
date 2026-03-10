# Churnkey research and multi-provider strategy

Reference for competitor positioning and for filling in after a 14-day Churnkey trial. Use when building Cancel Flow (MVP 2 Module 3) and for positioning/messaging.

---

## 1. What Churnkey does (competitor summary)

**Product:** Retention platform = Cancel Flows + Payment Recovery (dunning) + Reactivation, with analytics.

| Area | What they do |
|------|--------------|
| **Cancel Flow** | Up to 5 steps when user clicks "Cancel": (1) Initial Offer (pause, discount, plan switch, trial extension), (2) Cancellation Survey (multiple-choice reason → targeted offer), (3) Freeform Feedback, (4) Final Offer, (5) Cancellation Confirmation. Embed via script tag + backend HMAC (customerId + API key). |
| **Payment recovery** | Precision retries (ML-optimized, e.g. payday timing), omnichannel campaigns, dunning offers, in-app "payment wall." **Stripe only.** |
| **Reactivation** | Win-back campaigns for churned users. **Stripe only.** |
| **Analytics** | Save rate, reactivation rate, boosted revenue. |
| **Pricing** | ~$250/mo (Starter) to $700+ (Core/Intelligence), yearly. Payment recovery and cancel flows in lower tiers; A/B, AI in higher. |

**Payment providers:** Stripe, Chargebee, Paddle, Braintree, Maxio.

- **Stripe:** Full feature set (cancel flow + payment recovery + reactivation).
- **Others:** Cancel-flow features only. No payment recovery or reactivation on non-Stripe.

---

## 2. Our strategy: Stripe-only for now

- **Current:** Stripe only. Multi-provider is deferred (see CONTEXT_FOR_LMERNA.md).
- **Why:** One integration to ship; full stack (cancel + recovery + reactivation + wall) in one product; Churnkey’s “full” retention is Stripe-only too.
- **Later:** Add Paddle or Chargebee only after Stripe MVP is live and there is demand. Start with cancel flow + “link to update payment” for non-Stripe; keep full retry engine and wall Stripe-only until demand justifies it.
- **Code:** Provider abstraction lives under `src/lib/providers/` so a second provider is an extra module, not a rewrite.

---

## 3. Churnkey trial checklist (fill in after 14-day trial)

Use this when you run a Churnkey trial. Fill in bullets and add screenshots or links. Deliverable: short doc “Churnkey trial – flows, embed, analytics, pricing” for Module 3 and positioning.

### 3.1 Signup and onboarding

- [ ] Steps from signup to “first flow live” (connect Stripe vs others, any wizards).
- [ ] Test vs live mode: how they switch and where it’s configured.

### 3.2 Cancel flow builder

- [ ] Order of steps (Initial Offer → Survey → Feedback → Final Offer → Confirmation).
- [ ] How “cancellation reason” maps to offer (e.g. “Too expensive” → discount).
- [ ] Offer types: pause duration, discount %, plan change, trial extension.
- [ ] Freeform feedback: optional/required, min length.

### 3.3 Embed / integration

- [ ] Script snippet: where it goes (e.g. head), appId, any env (test/live).
- [ ] Backend: what you send (customerId, subscriptionId?, HMAC). Server-side auth required on every open?

### 3.4 Payment recovery (Stripe)

- [ ] Where it appears in dashboard (menu, sections).
- [ ] Retry schedule: “smart”/ML vs fixed steps, how it’s shown.
- [ ] Payment wall: copy, CTA, link to update card.

### 3.5 Reactivation

- [ ] How sequences are configured (e.g. Day 3, 7, 14 emails).
- [ ] Templates and one-click reactivation links.

### 3.6 Analytics

- [ ] Definitions: save rate, reactivation rate, “boosted revenue.”
- [ ] Funnel: sessions → saw offer → accepted → saved (if any).

### 3.7 Pricing and packaging

- [ ] What’s in Starter vs Core vs Intelligence (which features gated).
- [ ] Payment recovery / cancel flow / reactivation on all plans or only higher tiers.

### 3.8 Copy and tone

- [ ] Default survey options and confirmation screen copy.
- [ ] “We’re sorry to see you go” style lines to differentiate from.

---

## 4. Summary

| Question | Answer |
|----------|--------|
| What does Churnkey do? | Cancel flow (5 steps), payment recovery, reactivation; Stripe = full, others = cancel flow only. $250–$700+/mo. |
| How do we handle non-Stripe? | Stripe-only for MVP. Add Paddle/Chargebee later if demand appears; use provider abstraction under `src/lib/providers/`. |
| Churnkey trial? | Use checklist above; output = “Churnkey trial – flows, embed, analytics, pricing” for Module 3 and positioning. |
| No Stripe account? | Stripe test mode (free) is enough to build and demo; live account only when charging real money. |
