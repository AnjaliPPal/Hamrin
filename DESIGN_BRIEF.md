# Hamrin.ai — Master Design Bible

> **RULE: READ THIS FILE BEFORE TOUCHING ANY FRONTEND CODE.**
> This document is the single source of truth for every pixel, color, font, and spacing decision. It covers TWO design systems:
> - **Sections 1–9:** Landing page / marketing pages (light, warm, editorial)
> - **Section 10:** Dashboard / authenticated app pages (dark, data-rich, modern)
>
> **Sources:** Churnkey.co (landing page), ListenUp! on SaaS Landing Page gallery (pricing), Nixtio's "Analytics Dashboard Web App" on Dribbble (dashboard), Getillustrations packs (illustrations), Playground web interaction (cards).

---

## 1. WHO WE ARE — PRODUCT IDENTITY

- **Product:** hamrin.ai — Stripe Connect payment recovery for solo SaaS founders.
- **Positioning:** We are NOT enterprise churn management. We are the solo founder's secret weapon against involuntary churn. Simple, honest, zero-risk.
- **Tone:** Confident but warm. Authoritative but approachable. Data-driven but human. Think "your smartest founder friend built this."
- **Personality Keywords:** Trustworthy, clean, premium-feeling, minimal, editorial.

---

## 2. THE VIBE — WHAT IT SHOULD "FEEL" LIKE

### Landing Page Vibe (Sections 3–9)

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
- **Serif heading for pricing section too** — same editorial serif.
- **Check marks** in feature lists are gray for basic plans, green for highlighted plan.

### Dashboard Vibe (Section 10)

From the Nixtio "Analytics Dashboard Web App" Dribbble shot:

- **Deep, dark, immersive.** The dashboard is the polar opposite of the landing page. It wraps you in a dark cocoon of data. Deep navy-black backgrounds (#0F1117) that feel like space.
- **Card-forward layout.** Everything lives inside softly rounded cards floating on the dark background. Cards are slightly lighter than the bg (#1C1F2E), creating a gentle layered depth. No harsh borders — borders are barely visible (#1E2235), just enough to define edges.
- **Blue-purple accent energy.** The primary interactive color is a vivid indigo-blue (#636AFF) that pops against the dark. Charts use a purple-blue-cyan-green spectrum. It feels electric but not neon — refined, not gaming.
- **Spacious despite being data-dense.** Cards have generous internal padding (20-24px). Grid gaps are 20-24px. Nothing touches edges. Even though there's a lot of data, it breathes.
- **Subtle glow effects.** Active elements have a faint blue glow halo. Charts have soft gradient fills that fade to transparent. Area charts glow softly. It creates depth without being flashy.
- **Clean sans-serif everything.** No serif fonts in the dashboard. Everything is Inter. The hierarchy is created through size and weight contrast, not font style. Big KPI numbers (32px bold white) command attention. Labels are small and muted (12-13px gray).
- **Left sidebar navigation.** Dark sidebar (#161922), slightly darker than the main bg. Active nav items have a subtle blue tint. Icons are thin-line style (Lucide).
- **Professional, not playful.** The dashboard says "this is serious business" — it's where you see your money being recovered. The dark theme creates focus and reduces eye strain for daily use.

### From the Getillustrations screenshots:
- **Illustration style reference:** Hand-drawn, dual-tone (black outlines + single accent color fill, primarily green/mint).
- **Playful but professional.** NOT cartoon. NOT flat vector. Slightly rough, organic line work.
- These will be added later when custom illustrations are ready. For now, use emoji or simple SVG icons as placeholders.

### From the Playground/Emote screenshots:
- **Card-based layouts** with tags/labels in the top-left corner.
- **Rounded cards** with generous padding, subtle shadows, muted color backgrounds.
- **Bold, punchy serif headlines.**
- **Email subscription input** at bottom of hero — clean, simple.

---

## 3. COLOR PALETTE — LANDING PAGE

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

## 4. TYPOGRAPHY — LANDING PAGE

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
2. NEVER use sans-serif for hero headlines or section headings on the landing page.
3. Uppercase labels always have `tracking-[0.2em]` letter-spacing.
4. Stat numbers are always Inter Bold, not serif.

---

## 5. SPACING & LAYOUT — LANDING PAGE

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

## 6. PAGE STRUCTURE — LANDING PAGE (SECTION-BY-SECTION)

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

### 6.7 Product Deep Dive Section 1 — Payment Recovery
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

### 6.8 Testimonial Section
- Gray-50 background
- Centered Lora serif quote
- Key phrases have **yellow underline** (`decoration-[#EAB308] decoration-2 underline-offset-4`)
- Attribution: avatar circle + name (bold) + title (gray)

### 6.9 MRR Growth Section
- Light blue background (#E8F4FD)
- Centered serif heading
- Bar chart showing ascending revenue
- "Your MRR on Hamrin" label in yellow
- "Add Hamrin" call to action

### 6.10 Product Deep Dive Section 2 — Churn Metrics
- Same 2-column layout as section 6.7
- Left: icon label, serif heading, body, 3 bullets, green CTA button
- Right: browser-frame mock with churn rate (7%), revenue churned ($2.86k), subscriptions churned (138), mini bar charts, retention heatmap with percentage pills

### 6.11 Pricing Section
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

## 7. COMPONENT PATTERNS — LANDING PAGE

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

- **Style:** Hand-drawn, slightly rough/organic line work
- **Colors:** Black outlines + single accent fill (mint green #22C55E or similar)
- **Subjects:** People interacting with tech (laptops, phones, rockets, charts)
- **Feel:** Playful, startup-y, human
- **Format:** SVG preferred for web
- **Usage:** Feature sections, empty states, about page
- Until custom illustrations are ready, use emoji (🎯📱🔒👁📊🔄) or simple SVG icons as placeholders.

---

## 9. WHAT NOT TO DO — LANDING PAGE

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

---

# ═══════════════════════════════════════════════════════
# SECTION 10: DASHBOARD DESIGN SYSTEM — COMPLETE SPEC
# ═══════════════════════════════════════════════════════

> **SCOPE:** Everything under `/dashboard/*` and all authenticated app pages.
> **RULE:** When building ANY dashboard page, **IGNORE sections 2–9 completely.** Use ONLY this section.
> **References (all three must inform every dashboard decision):**
> - Screenshot 1: Nixtio "Analytics Dashboard Web App" — light cool-white bg, white cards, electric blue + green charts
> - Screenshot 2: Getillustrations — warm cream bg, black-outline illustrations with mint/emerald green `#2ECC88` fill
> - Screenshot 3: Playground by Emote (Taras Migulko) — ultra-bold black sans-serif headlines, pastel card bgs, rounded-2xl cards, clean minimal layout

---

## 10.1 DASHBOARD VIBE — THE FEELING

The dashboard is NOT dark. It is **light, airy, and data-confident.**

- **Light cool-white background.** Main bg is `#F0F4FF` — a very faint cool blue-white. Not stark white, not gray. Like a clear morning sky.
- **White cards float on it.** Pure white cards (`#FFFFFF`) with very soft blue-tinted shadows. They feel clean and elevated, not heavy.
- **Mint/emerald green is the soul.** `#2ECC88` (mint green) is the primary success/positive accent — chart bars, success states, recovered revenue amounts, CTAs. Electric, fresh, confident.
- **Electric blue for data.** `#4361EE` for secondary charts, links, active states. Pairs with mint.
- **Numbers are the hero.** KPI numbers are ultra-bold, black/near-black (`#111827`). Biggest, heaviest element on the page. They command attention.
- **Pastel card accents.** Feature cards and category cards can use soft pastel backgrounds (mint `#ECFDF5`, lavender `#F3F0FF`, sky `#EFF6FF`, yellow `#FEFCE8`) to add color without noise.
- **Ultra-bold headlines.** Page title is bold black Inter, tight letter-spacing. Punchy and direct.
- **Rounded everything.** Cards use `rounded-2xl` (20px). Buttons use `rounded-xl` (12px). Tags/pills use `rounded-full`. The Playground reference sets this tone.
- **Clean, uncluttered.** No dark overlays, no gradients on cards, no glow effects. White space is generous. Every card has ONE job.
- **Illustrations.** When empty states or onboarding appear, use the Getillustrations style: black outlines + single mint/green fill. Never stock photography.

---

## 10.2 DASHBOARD COLOR PALETTE — EVERY COLOR YOU NEED

### Backgrounds
| Token | Hex | Tailwind | Where |
|-------|-----|----------|-------|
| `--dash-bg-primary` | `#F0F4FF` | `bg-[#F0F4FF]` | Main page background. Light cool blue-white. |
| `--dash-bg-sidebar` | `#FFFFFF` | `bg-white` | Sidebar / top nav background. Pure white. |
| `--dash-bg-card` | `#FFFFFF` | `bg-white` | All card surfaces, widget panels, chart containers. |
| `--dash-bg-card-hover` | `#F8FAFF` | `bg-[#F8FAFF]` | Card hover state. Very faint blue tint. |
| `--dash-bg-input` | `#F1F5F9` | `bg-slate-100` | Input fields, search bars, filter pill containers. |
| `--dash-bg-elevated` | `#FFFFFF` | `bg-white` | Dropdowns, tooltips, modals. White with strong shadow. |

### Pastel card accent backgrounds (for feature/category cards)
| Name | Hex | Tailwind | Paired text |
|------|-----|----------|-------------|
| Mint | `#ECFDF5` | `bg-[#ECFDF5]` | `text-emerald-700` |
| Lavender | `#F3F0FF` | `bg-[#F3F0FF]` | `text-violet-700` |
| Sky | `#EFF6FF` | `bg-[#EFF6FF]` | `text-blue-700` |
| Yellow | `#FEFCE8` | `bg-[#FEFCE8]` | `text-yellow-700` |
| Peach | `#FFF7ED` | `bg-[#FFF7ED]` | `text-orange-700` |

### Accent
| Token | Hex | Tailwind | Where |
|-------|-----|----------|-------|
| `--dash-accent-green` | `#2ECC88` | `bg-[#2ECC88]` | **PRIMARY.** Recovered revenue, success states, primary CTAs, chart bar 1, positive trend pills. |
| `--dash-accent-green-hover` | `#25B578` | `bg-[#25B578]` | Hover on green buttons/elements. |
| `--dash-accent-blue` | `#4361EE` | `bg-[#4361EE]` | Active nav, links, chart bar 2, selected tabs, focus rings. |
| `--dash-accent-blue-hover` | `#3451D1` | `bg-[#3451D1]` | Hover on blue elements. |

### Chart Colors (use in this order)
| Token | Hex | When to use |
|-------|-----|-------------|
| `--chart-green` | `#2ECC88` | Bar 1 / primary. Recovered payments. Positive data. |
| `--chart-blue` | `#4361EE` | Bar 2 / secondary. Failed attempts. Comparison data. |
| `--chart-mint-light` | `#A7F3D0` | Area fill (30% opacity base). Chart gradient. |
| `--chart-purple` | `#8B5CF6` | Third series when needed. |
| `--chart-yellow` | `#FACC15` | Callouts, annotations, pending. |
| `--chart-orange` | `#FB923C` | Warning level. |

### Status / Semantic
| Token | Hex | Background | Where |
|-------|-----|------------|-------|
| `--dash-success` | `#2ECC88` | `#ECFDF5` | Recovered, positive, saved. |
| `--dash-danger` | `#EF4444` | `#FEF2F2` | Failed, error, churn. |
| `--dash-warning` | `#F59E0B` | `#FFFBEB` | Pending, caution, retrying. |
| `--dash-info` | `#4361EE` | `#EFF6FF` | Informational, neutral note. |

### Text
| Token | Hex | Tailwind | Where |
|-------|-----|----------|-------|
| `--dash-text-primary` | `#111827` | `text-gray-900` | KPI numbers, headings, important content. Near-black. Ultra-bold. |
| `--dash-text-secondary` | `#4B5563` | `text-gray-600` | Body text, descriptions, table cells, axis labels. |
| `--dash-text-muted` | `#9CA3AF` | `text-gray-400` | Placeholders, disabled text, timestamps, captions. |
| `--dash-text-accent-green` | `#059669` | `text-emerald-600` | Positive labels, recovered amounts, upward arrows. |
| `--dash-text-accent-blue` | `#4361EE` | `text-[#4361EE]` | Clickable links, interactive text. |

### Borders
| Token | Hex | Tailwind | Where |
|-------|-----|----------|-------|
| `--dash-border` | `#E5E7EB` | `border-gray-200` | Card borders, table row dividers. Clean and visible but not heavy. |
| `--dash-border-subtle` | `#F3F4F6` | `border-gray-100` | Inner card separators, chart grid lines. |
| `--dash-border-active` | `#4361EE` | `border-[#4361EE]` | Focused inputs, selected cards. |

---

## 10.3 DASHBOARD TYPOGRAPHY

### Font
- **ONE font for the entire dashboard:** `Inter`
- **Monospace (for IDs, fingerprints):** `font-mono` (system mono)
- **NEVER use Lora or any serif in the dashboard.** Serif is landing-page only.

### Type Scale — Exact Values
| What | Size | Weight | Tracking | Color |
|------|------|--------|----------|-------|
| Page title ("Recovery Dashboard") | 28px | **800** | -0.03em | `--dash-text-primary` |
| Section title ("Total Recovered") | 20px | 700 | -0.02em | `--dash-text-primary` |
| Card title | 15px | 600 | -0.01em | `--dash-text-primary` |
| Label / subtitle | 13px | 500 | 0 | `--dash-text-secondary` |
| Body text | 14px | 400 | 0 | `--dash-text-secondary` |
| Caption / small | 12px | 400 | 0.01em | `--dash-text-muted` |
| **KPI big number** | **36px** | **800** | **-0.03em** | **`--dash-text-primary`** |
| Trend pill | 12px | 600 | 0 | `--dash-success` or `--dash-danger` |
| Table header | 11px | 600 | 0.06em uppercase | `--dash-text-muted` |

**Key rule:** KPI numbers use weight 800 (extrabold). They should feel heavy and punchy like the Playground headlines.

---

## 10.4 DASHBOARD SPACING

4px base unit. Be very generous — white space is the design.

| Token | Value | Where |
|-------|-------|-------|
| `--space-1` | 4px | Icon gaps, tight inline padding |
| `--space-2` | 8px | Badge padding, small gaps |
| `--space-3` | 12px | Compact sections, nav item gap |
| `--space-4` | 16px | Default inner padding |
| `--space-5` | 20px | Card padding (compact), grid gap |
| `--space-6` | 24px | Card padding (standard), grid gap (standard) |
| `--space-8` | 32px | Content area padding, section gaps |
| `--space-10` | 40px | Page top padding |
| `--space-12` | 48px | Major layout gaps |

---

## 10.5 DASHBOARD BORDER RADIUS

| Token | Value | Tailwind | Where |
|-------|-------|----------|-------|
| `--dash-radius-sm` | 6px | `rounded` | Tags, chips, trend pills, badges |
| `--dash-radius-md` | 10px | `rounded-lg` | Buttons, inputs, nav items |
| `--dash-radius-lg` | 16px | `rounded-2xl` | **ALL main cards and panels.** Non-negotiable. |
| `--dash-radius-xl` | 20px | `rounded-[20px]` | Large feature cards, modals, pastel category cards |
| `--dash-radius-full` | 9999px | `rounded-full` | Avatars, status dots, pill tabs |

**KEY RULE:** Every card uses `rounded-2xl` (16px). Feature/pastel cards use `rounded-[20px]` (20px). This is what gives the Playground look.

---

## 10.6 DASHBOARD SHADOWS

```css
/* Standard card — clean white on light bg needs a real shadow */
--dash-shadow-card: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);

/* Elevated (dropdowns, modals, tooltips) */
--dash-shadow-elevated: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);

/* Card hover lift */
--dash-shadow-hover: 0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
```

**No glow effects.** No neon. No coloured drop-shadows. Shadows are always neutral black at very low opacity.

---

## 10.7 DASHBOARD COMPONENT PATTERNS

### KPI Card
```
bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]
border border-gray-100

  <p class="text-sm font-medium text-gray-400 tracking-wide uppercase">Total Recovered</p>
  <p class="text-[36px] font-extrabold text-gray-900 tracking-tight mt-1">$12,480</p>
  <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">↑ 18%</span>
```

### Pastel Feature Card (for onboarding steps, empty states, feature tiles)
```
bg-[#ECFDF5] rounded-[20px] p-6
  — top-left: small rounded-full gray tag pill (e.g. "7–11 years" style from Playground ref)
  — bold card title, 16px 700
  — short 2-line body, 13px text-gray-500
  — optional illustration area at bottom
```

### Tab Pills (filter tabs)
```
bg-gray-100 rounded-full p-1 flex gap-1
  active: bg-white rounded-full shadow-sm text-gray-900 font-semibold
  inactive: text-gray-500 font-medium hover:text-gray-700
```

### Primary Button
```
bg-[#2ECC88] hover:bg-[#25B578] text-white font-semibold rounded-xl px-5 py-2.5
transition-colors duration-150
```

### Danger / Secondary Button
```
bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl px-5 py-2.5
```

### Input
```
bg-gray-50 border border-gray-200 focus:border-[#4361EE] focus:ring-2 focus:ring-[#4361EE]/10
rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400
```

---

## 10.8 ILLUSTRATION STYLE (empty states & onboarding)

Pull from the Getillustrations style (Screenshot 2):
- Black thick outlines, ~3px stroke
- Single fill colour: `#2ECC88` mint/emerald
- Warm off-white/cream background for illustration panels: `#F5F0E8`
- Characters: round, friendly, slightly chunky — NOT corporate
- Usage: empty state in tables, onboarding welcome screen, no-data cards
- NEVER use stock photography in the dashboard

---

## 10.9 LAYOUT STRUCTURE

```
┌──────────────────────────────────────────────────────┐
│  Top Nav (bg-white, h-16, border-b border-gray-100)  │
│  Logo left | Nav links center | User avatar right     │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Page Content (bg-[#F0F4FF] min-h-screen p-8)        │
│                                                       │
│   Page Title (text-3xl font-extrabold text-gray-900) │
│   Subtitle (text-sm text-gray-400 mt-1)              │
│                                                       │
│   KPI Grid (grid-cols-4 gap-6 mt-8)                  │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐                       │
│   │    │ │    │ │    │ │    │  ← white rounded-2xl   │
│   └────┘ └────┘ └────┘ └────┘                       │
│                                                       │
│   Charts + Tables row (grid-cols-3 gap-6 mt-6)       │
│   ┌──────────────┐ ┌────────┐                        │
│   │  Chart card  │ │ List   │  ← white rounded-2xl   │
│   └──────────────┘ └────────┘                        │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**No sidebar.** Top nav only. This matches the Nixtio reference (Screenshot 1).

---

## 10.10 MOTION

- Hover transitions: `transition-all duration-150 ease-in-out`
- Card hover: subtle shadow lift (`--dash-shadow-hover`) + `scale-[1.005]`
- Chart draw-in: 600ms ease-out
- Modal open: 200ms fade + translate-y-1 → translate-y-0
- NO bounces, NO springs, NO looping animations in production UI