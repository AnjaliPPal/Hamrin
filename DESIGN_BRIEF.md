# Hamrin.ai — Master Design Bible

> **RULE: READ THIS FILE BEFORE TOUCHING ANY FRONTEND CODE.**
> This document is the single source of truth for every pixel, color, font, and spacing decision. It is derived from 22 reference screenshots across 3 sources: Churnkey.co (primary SaaS landing page), ListenUp! on SaaS Landing Page gallery (pricing reference), Dribbble analytics dashboard (dashboard reference), Getillustrations illustration packs (illustration style reference), and Playground web interaction (card layout reference).

---

## 1. WHO WE ARE — PRODUCT IDENTITY

- **Product:** hamrin.ai — Stripe Connect payment recovery for solo SaaS founders.
- **Positioning:** We are NOT enterprise churn management. We are the solo founder's secret weapon against involuntary churn. Simple, honest, zero-risk.
- **Tone:** Confident but warm. Authoritative but approachable. Data-driven but human. Think "your smartest founder friend built this."
- **Personality Keywords:** Trustworthy, clean, premium-feeling, minimal, editorial.

---

## 2. THE VIBE — WHAT IT SHOULD "FEEL" LIKE

From the Churnkey screenshots, the overall feeling is:

- **Light, airy, warm.** NOT dark mode. NOT techy/cold. The page breathes.
- **Cream/warm white hero** that gently transitions to pure white. Feels like opening a premium magazine.
- **Serif headlines create authority.** The big headlines are serif — they feel like newspaper headlines or editorial pieces. This is intentional: it says "we know what we're talking about."
- **Generous whitespace.** Sections have enormous breathing room. Nothing feels cramped. Padding is 80-100px between major sections.
- **Subtle shadows, not borders.** Cards use soft box shadows, not heavy borders. Borders are very faint (gray-100/gray-200 max).
- **Color is used sparingly but purposefully.** The page is mostly white/gray/black. Color pops only for: CTAs (blue), success metrics (green), brand accent (yellow/gold), and feature pills (soft pastels).
- **Mock product screenshots** in browser frames (with the 3 colored dots: green, yellow, red) give social proof and show the product working.
- **Professional but not corporate.** It feels like a YC startup, not like Oracle.

### From the ListenUp! pricing screenshots:
- **Clean 3-column pricing cards** with generous padding, clear hierarchy (plan name, price, description, CTA, feature list).
- **The highlighted plan** has a colored border (green) to draw the eye. NOT background color — border color.
- **Serif heading for pricing section too** ("How much do you value your time?" — same editorial serif).
- **Check marks** in feature lists are gray for basic plans, green for highlighted plan.

### From the Dribbble analytics dashboard:
- **Dashboard aesthetic:** Dark sidebar, white content area, blue/green accent charts.
- **Card-based data layouts:** Stats in cards with mini bar charts. Clean, minimal.
- This is relevant for our /dashboard page, not the landing page.

### From the Getillustrations screenshots:
- **Illustration style reference:** Hand-drawn, dual-tone (black outlines + single accent color fill, primarily green/mint).
- **Playful but professional.** NOT cartoon. NOT flat vector. Slightly rough, organic line work.
- These will be added later when custom illustrations are ready. For now, use emoji or simple SVG icons as placeholders.

### From the Playground/Emote screenshots:
- **Card-based layouts** with tags/labels in the top-left corner (age group badges like "10-16 years").
- **Rounded cards** with generous padding, subtle shadows, muted color backgrounds.
- **Bold, punchy serif headlines** ("Grow Bold. Move Free. Play Hard.").
- **Email subscription input** at bottom of hero — clean, simple.

---

## 3. COLOR PALETTE — EXACT VALUES

### Backgrounds
| Where | Color | Tailwind | Hex |
|-------|-------|----------|-----|
| Hero section | Warm cream gradient to white | `from-[#FDF8EF] via-[#FEFCF7] to-white` | #FDF8EF → #FFFFFF |
| Main body | Pure white | `bg-white` | #FFFFFF |
| Alternating sections | Very light gray | `bg-gray-50` | #F9FAFB |
| MRR growth section | Soft sky blue | `bg-[#E8F4FD]` | #E8F4FD |
| Announcement bar | Deep blue | `bg-[#1E40AF]` | #1E40AF |

### Text
| Where | Color | Tailwind | Hex |
|-------|-------|----------|-----|
| Primary headings | Near black | `text-gray-900` | #111827 |
| Body text | Medium gray | `text-gray-500` | #6B7280 |
| Muted/labels | Light gray | `text-gray-400` | #9CA3AF |
| Section labels (uppercase) | Lighter gray | `text-gray-400` | #9CA3AF |

### Accent Colors
| Purpose | Color | Tailwind | Hex |
|---------|-------|----------|-----|
| Primary CTA / Buttons | Deep blue | `bg-[#1E40AF]` | #1E40AF |
| Primary hover | Darker blue | `hover:bg-[#1E3B96]` | #1E3B96 |
| Brand logo accent dot | Golden yellow | `text-[#EAB308]` | #EAB308 |
| Testimonial underlines | Golden yellow | `decoration-[#EAB308]` | #EAB308 |
| Success / green checks | Vivid green | `text-green-500` / `bg-green-500` | #22C55E |
| Green CTA (explore) | Forest green | `bg-green-600` | #16A34A |
| Chart bars | Blue | `bg-blue-500` / `bg-[#3B82F6]` | #3B82F6 |
| Card update button | Purple | `bg-[#7C3AED]` | #7C3AED |

### Feature Pill Colors (soft pastel bg + darker text)
| Feature | Background | Text | Dot |
|---------|-----------|------|-----|
| Smart Retries | `bg-red-50` | `text-red-600` | `bg-red-500` |
| Pre-Dunning | `bg-orange-50` | `text-orange-600` | `bg-orange-500` |
| Recovery Emails | `bg-green-50` | `text-green-600` | `bg-green-500` |
| Churn Scores | `bg-blue-50` | `text-blue-600` | `bg-blue-500` |
| Card Updater | `bg-purple-50` | `text-purple-600` | `bg-purple-500` |
| Compliance | `bg-pink-50` | `text-pink-600` | `bg-pink-500` |

---

## 4. TYPOGRAPHY — EXACT RULES

### Fonts
- **Serif (headlines only):** `Lora` from Google Fonts. Variable: `--font-lora`. Weights: 400, 500, 600, 700.
- **Sans-serif (everything else):** `Inter` from Google Fonts. Variable: `--font-inter`. Used for body, nav, buttons, labels, stats, cards.

### Hierarchy
| Element | Font | Size (desktop) | Weight | Line Height | Tracking |
|---------|------|---------------|--------|-------------|----------|
| Hero headline | Lora (serif) | 4rem (64px) | Bold (700) | 1.1 | Tight |
| Section headings | Lora (serif) | 2.125rem (34px) | Bold (700) | Tight | Normal |
| Card/Feature titles | Inter (sans) | 1rem (16px) | Semibold (600) | Normal | Normal |
| Body text | Inter (sans) | 1rem (16px) | Regular (400) | Relaxed | Normal |
| Subtitle/subheadline | Inter (sans) | 1.125rem (18px) | Regular (400) | Relaxed | Normal |
| Nav links | Inter (sans) | 15px | Regular (400) | Normal | Normal |
| Buttons | Inter (sans) | 15px | Semibold (600) | Normal | Normal |
| Uppercase labels | Inter (sans) | 12px | Semibold (600) | Normal | 0.2em |
| Small text / muted | Inter (sans) | 14px | Regular (400) | Normal | Normal |
| Stat numbers | Inter (sans) | 1.875rem (30px) | Bold (700) | 1 | Normal |
| Testimonial quote | Lora (serif) | 1.5rem (24px) | Medium (500) | Relaxed | Normal |

### Key typography rules:
1. NEVER use serif for body text, buttons, or navigation.
2. NEVER use sans-serif for hero headlines or section headings.
3. Uppercase labels always have `tracking-[0.2em]` letter-spacing.
4. Stat numbers are always Inter Bold, not serif.

---

## 5. SPACING & LAYOUT

### Max widths
| Element | Max Width |
|---------|----------|
| Nav container | 1200px |
| Hero text block | 800px |
| Stat strip | 700px |
| Feature cards grid | 1100px |
| Product sections (2-col) | 1100px |
| Pricing cards | 1000px |
| Testimonial | 750px |
| CTA block | 600px |
| Footer | 1200px |

### Section vertical padding
- Major sections: `py-20 sm:py-24` (80px / 96px)
- Minor sections (stat strip, trust logos, compliance strip): `py-10` to `py-12` (40-48px)
- Nav: `py-4` (16px)
- Announcement bar: `py-2.5` (10px)

### Card padding
- Large cards (feature deep dives, pricing): `p-7` (28px)
- Stats/dashboard mock cards: `p-6` (24px)
- Small feature pill cards: `p-5` (20px)

### Border radius
- Cards: `rounded-xl` (12px) or `rounded-2xl` (16px)
- Buttons: `rounded-lg` (8px)
- Pills/badges: `rounded-full`
- Avatar: `rounded-full`

---

## 6. PAGE STRUCTURE — SECTION-BY-SECTION

The landing page flows exactly like Churnkey.co, top to bottom:

### 6.1 Announcement Bar
- Full width, deep blue (#1E40AF) background
- White text, centered, 14px semibold
- Arrow (→) at the end
- Single line

### 6.2 Navigation
- Sticky, white bg, thin bottom border (gray-100)
- Left: "hamrin" in bold + ".ai" in yellow (#EAB308)
- Center-right: 3-4 text links (gray-600, hover:gray-900)
- Far right: "Get a Demo" button (deep blue bg, white text, rounded-lg)

### 6.3 Hero Section
- Warm cream gradient background fading to white
- Centered text
- **Massive serif headline** (Lora Bold, 4rem) — two lines
- Gray-500 subtitle underneath (Inter, 18px)
- Two CTAs side by side:
  - Primary: Blue filled button with arrow icon
  - Secondary: White button with gray border

### 6.4 Baseline Stats Strip
- Thin border-top (gray-100)
- Centered uppercase label: "A BASELINE HAMRIN EXPERIENCE" (gray-400, 12px, tracking-[0.2em])
- 3 inline stats with green circle checkmark icons

### 6.5 Feature Cards Row
- 6 cards in a horizontal grid (3-col on tablet, 6-col on desktop, 2-col on mobile)
- Each card: white bg, gray-200 border, rounded-xl, subtle hover shadow
- Inside each card: colored pill badge (rounded-full, colored dot + label), short description text

### 6.6 Trusted By Strip
- Uppercase label: "TRUSTED BY THESE CUSTOMER-OBSESSED TEAMS......"
- Row of grayscale text logos (brand names in bold, grayscale, 60% opacity)

### 6.7 Product Deep Dive Section 1 — Payment Recovery (Churnkey screenshot 115)
- 2-column layout (text left, mock dashboard right)
- Left side:
  - Small colored label with star icon ("Payment Recovery" in amber)
  - Serif heading (Lora Bold)
  - Gray body text
  - 3 feature bullets with circular icon, bold title, description
- Right side:
  - Browser-frame mock (3 colored dots at top)
  - Stats: $201,038 recovered, 38,297 subscriptions, bar chart
  - Card update widget (purple button, form fields)

### 6.8 Testimonial Section (Churnkey screenshot 109)
- Gray-50 background
- Centered Lora serif quote
- Key phrases have **yellow underline** (`decoration-[#EAB308] decoration-2 underline-offset-4`)
- Attribution: avatar circle + name (bold) + title (gray)

### 6.9 MRR Growth Section (Churnkey screenshot 110)
- Light blue background (#E8F4FD)
- Centered serif heading
- Bar chart showing ascending revenue
- "Your MRR on Hamrin" label in yellow
- "Add Hamrin" call to action

### 6.10 Product Deep Dive Section 2 — Churn Metrics (Churnkey screenshot 118)
- Same 2-column layout as section 6.7
- Left: icon label, serif heading, body, 3 bullets, green CTA button
- Right: browser-frame mock with churn rate (7%), revenue churned ($2.86k), subscriptions churned (138), mini bar charts, retention heatmap with percentage pills

### 6.11 Pricing Section (ListenUp! screenshot 78)
- Gray-50 background
- Centered serif heading
- 3 columns:
  - Outcome ($0 + 10%) — white card, gray border
  - Lifetime Deal ($749) — white card, GREEN border-2 (highlighted)
  - Enterprise (Contact us) — white card, gray border
- Each card: plan name, description, big price, CTA button, credit note, feature checklist
- Below: "Quick math" calculation box

### 6.12 CTA / Book a Call
- White background
- Centered serif heading
- Body text
- Blue CTA button
- Small muted disclaimer text

### 6.13 Compliance Strip
- Thin border-top
- Row of green checkmark + compliance items (inline, centered)

### 6.14 Footer
- White bg, border-top (gray-200)
- Left: logo (hamrin.ai in yellow), tagline
- Right: links + built-by credit

---

## 7. COMPONENT PATTERNS

### Buttons
- **Primary:** `bg-[#1E40AF] hover:bg-[#1E3B96] text-white font-semibold px-7 py-3.5 rounded-lg text-[15px] shadow-sm`
- **Secondary:** `bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-7 py-3.5 rounded-lg text-[15px]`
- **Green CTA:** `bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg text-sm`
- **Purple (card update):** `bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-sm py-3 rounded-lg`

### Cards
- **Standard card:** `bg-white border border-gray-200 rounded-xl p-6 shadow-lg`
- **Feature pill card:** `bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow`
- **Pricing card (normal):** `bg-white border border-gray-200 rounded-2xl p-7 shadow-sm hover:shadow-md`
- **Pricing card (highlighted):** `bg-white border-2 border-green-500 rounded-2xl p-7 shadow-sm hover:shadow-md`

### Browser Frame Mock
- Container with rounded-xl, shadow-lg
- Top bar: 3 dots (green, yellow, red) — each `w-2.5 h-2.5 rounded-full`
- Content inside the frame

### Pills / Badges
- `inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full`
- Colored dot: `w-1.5 h-1.5 rounded-full`

### Check Icon (for stats/compliance)
- Green circle (20x20) with white checkmark SVG inside

### Section Labels (uppercase)
- `text-center text-xs font-semibold text-gray-400 tracking-[0.2em] uppercase`

---

## 8. ILLUSTRATION STYLE (FOR FUTURE)

Based on the Getillustrations screenshots (80, 81, 82):
- **Style:** Hand-drawn, slightly rough/organic line work
- **Colors:** Black outlines + single accent fill (mint green #22C55E or similar)
- **Subjects:** People interacting with tech (laptops, phones, rockets, charts)
- **Feel:** Playful, startup-y, human
- **Format:** SVG preferred for web
- **Usage:** Feature sections, empty states, about page
- Until custom illustrations are ready, use emoji (🎯📱🔒👁📊🔄) or simple SVG icons as placeholders.

---

## 9. WHAT NOT TO DO

1. **NO dark mode** on the landing page. The vibe is warm and light.
2. **NO heavy gradients** or neon colors.
3. **NO rounded-full buttons** (use rounded-lg).
4. **NO sans-serif for hero headlines** — serif creates the editorial authority feel.
5. **NO cluttered sections** — every section has max 1 idea, generous whitespace.
6. **NO emerald/teal as primary** — our primary action color is deep blue (#1E40AF). Green is only for success/checks.
7. **NO gray backgrounds for the hero** — the hero must have the warm cream gradient.
8. **NO stock photography** — use illustrated graphics, product mocks, or icons only.
9. **NO more than 3 colors in any single section** — keep it restrained.
10. **NO dark navy/charcoal body backgrounds** — body is always white or gray-50.

---

## 10. DASHBOARD DESIGN (for /dashboard page)

Based on Dribbble analytics dashboard screenshot (123):
- Dark sidebar with white text
- White content area
- Card-based stats with mini charts
- Blue/green accent colors for data visualization
- Team avatars in circles
- Clean data tables
- This is a SEPARATE design system from the landing page — it can be darker/more data-dense.

---

*Last updated: March 2026*
*Sources: churnkey.co, saaslandingpage.com/listenup, dribbble.com/analytics-dashboard, dribbble.com/getillustrations, dribbble.com/playground-web-interaction*
