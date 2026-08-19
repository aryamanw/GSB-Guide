---
name: Stanford GSB Survival Guide
description: A warm, fast reference hub for incoming GSB MBA students — not a dashboard, not a handbook.
colors:
  cardinal-50: "#fbf3f1"
  cardinal-300: "#e2a08e"
  cardinal-600: "#a0432a"
  cardinal-700: "#833522"
  cardinal-950: "#2e120b"
  gold-400: "#c8933a"
  gold-500: "#ad7a2c"
  stone-50: "#fafaf9"
  stone-100: "#f5f5f4"
  stone-200: "#e7e5e4"
  stone-400: "#a8a29e"
  stone-600: "#57534e"
  stone-900: "#1c1917"
  stone-950: "#0c0a09"
  surface: "#ffffff"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.cardinal-600}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.cardinal-700}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.stone-600}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  badge-cardinal:
    backgroundColor: "{colors.cardinal-600}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Stanford GSB Survival Guide

## 1. Overview

**Creative North Star: "The Trusted Second-Year"**

The voice named in PRODUCT.md: a second-year who's already survived the chaos and is now looking out for you — calm, warm, a little dry-witted about the insider jargon, never bureaucratic and never trying to sell you anything. Restraint carries the personality: one warmed institutional accent used sparingly, one honest sans typeface, quiet responsive motion. The system trusts the content (29 chapters, 28 terms, a checklist someone actually needs to finish) to be the interesting part, not the chrome around it.

It rejects the three anti-references from PRODUCT.md — a generic SaaS dashboard, a stuffy university PDF/handbook, an over-designed marketing site — plus the sharper version of that last one named during implementation: a university portal login page. The original build's dark, tri-color gradient hero and six differently-colored quick-link chips were the concrete example; every banner in the shipped system is now a single flat, bordered, warm-neutral surface with one small accent label instead.

**Key Characteristics:**
- Restrained color: warm stone neutrals carry every surface; Warmed Cardinal appears on ≤10% of any screen
- One warm sans typeface (Inter) for both headline and body — no serif ceremony
- Flat by default: every content banner and card sits on a bordered neutral surface, no gradients, no drop shadow at rest
- Motion is responsive (hover, focus, checklist state) — no orchestrated entrances
- Closer in spirit to Notion and Linear than to a university website or a SaaS marketing site

## 2. Colors

Restrained strategy: warm-tinted stone neutrals do the work of laying out every page; Warmed Cardinal is reserved for the handful of moments that need to be found instantly.

### Primary
- **Warmed Cardinal** (`#a0432a` / `cardinal-600`): the one accent. Primary buttons, active nav/tab state, checklist completion, active TOC row, eyebrow labels on every banner. Darkens to `#833522` (`cardinal-700`) on hover, lightens to `#d07458` (`cardinal-400`) as the dark-mode accent for sufficient contrast on stone-950. Tints (`cardinal-50` `#fbf3f1`, `cardinal-950` `#2e120b`) back light-mode active-row fills and dark-mode active-row fills respectively.

### Secondary
- **Warmed Gold** (`#ad7a2c` / `gold-500`, `#c8933a` / `gold-400` for higher-contrast moments): a narrow supporting role — the checklist's sparkle icon, the "About this guide" star, the off-campus badge. Never a primary button or active-state color; never competes with Warmed Cardinal on the same element.

### Neutral
- **Stone scale** (`stone-50` `#fafaf9` through `stone-950` `#0c0a09`): page background (`stone-50` light / `stone-950` dark), banner and secondary-panel fill (`stone-100` light / `stone-900` dark), borders and dividers (`stone-200` light / `stone-800` dark), body and label text (`stone-600`–`stone-900` light, `stone-300`–`stone-400` dark). This is where the interface actually lives — warm paper, not clinical gray.
- **Surface** (`#ffffff` light, `stone-900` `#1c1917` dark): card and panel fill, sitting one step lighter/darker than the page background it's placed on.

### Named Rules
**The One Accent Rule.** Warmed Cardinal appears on ≤10% of any given screen. Banners use it only for a small uppercase label and an icon, not as a fill.

**The No Second Accent Rule.** Warmed Gold never competes with Warmed Cardinal for the same job — no screen has both a gold and a cardinal "primary" element.

## 3. Typography

**Display Font:** Inter (with system-ui, -apple-system, sans-serif fallback)
**Body Font:** Inter — same family as Display.

**Character:** One typeface at different weights and sizes, not a display/body pairing. The original build's Playfair-Display-for-headlines instinct was dropped entirely; hierarchy comes from weight and size, giving the interface a calmer, less ceremonial read.

### Hierarchy
- **Display** (bold 700, `text-3xl` → `text-5xl` responsive): the home hero headline only.
- **Headline** (bold 700, `text-2xl`/`text-3xl`): page banner titles, chapter titles.
- **Title** (bold 700, `text-lg`/`text-xl`): card titles, dictionary terms, section headers.
- **Body** (regular 400, `text-sm`/`text-base`, 65–75ch max width on prose): guide text, definitions, FAQ answers — what students are actually here to read.
- **Label** (semibold 600, `text-xs`, uppercase, tracking-wider): eyebrow labels, badges, nav items, metadata.

### Named Rules
**The One Voice Rule.** No second typeface for "emphasis" or "editorial flavor." Hierarchy comes entirely from weight and size.

## 4. Elevation

Flat by default. Every banner and card is a bordered neutral surface (`border border-stone-200 dark:border-stone-800`) with no ambient shadow at rest. Shadow appears only as a direct response to interaction: a `hover:shadow-sm` lift on the home quick-link cards, and `shadow-2xl` on the two floating overlays (the global search modal and the bookmarks drawer) that genuinely sit above the page.

### Shadow Vocabulary
- **Resting surface** (no shadow, border only): banners, TOC panels, article panes, grid cards, badges.
- **Interactive hover** (`box-shadow: 0 3px 10px rgba(28,25,23,0.08)` light / `rgba(0,0,0,0.32)` dark): home quick-link cards and `.interactive-card` elements on hover only.
- **Floating overlay** (`shadow-2xl`): the global search modal and bookmarks drawer, which sit above a backdrop.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow only appears as a direct response to a user action on that element or because the element floats above a backdrop — never as ambient decoration on a card that isn't being interacted with.

## 5. Components

### Buttons
- **Shape:** `rounded-lg` (8px, matches the surrounding card radius).
- **Primary:** `bg-cardinal-600` / white text, `hover:bg-cardinal-700`, no shadow, no colored glow. Used once per view — the hero's "Start Reading the Guide", the checklist's "Add Task".
- **Secondary/Ghost:** transparent fill, `border border-stone-300 dark:border-stone-700`, `text-stone-700`, `hover:bg-stone-100`. Used for the hero's secondary CTA.
- **Tab/Segmented (Housing switcher, checklist category filter):** active state is solid `bg-cardinal-600`; inactive is `bg-stone-100 dark:bg-stone-800` with stone text. No shadow on either state.

### Badges
- **Style:** `rounded-full`, uppercase, `text-xs font-semibold`, `tracking-wider`. `.badge-cardinal` is solid cardinal fill with white text; `.badge-gold` is a muted `gold-50`/`gold-800`-family tint, never solid gold fill.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `bg-white dark:bg-stone-900`, one step lighter/darker than the page it sits on.
- **Shadow Strategy:** none at rest; `hover:shadow-sm` only on the home quick-link cards (see Elevation).
- **Border:** `border border-stone-200 dark:border-stone-800` always present — this is the primary surface-separation device, not shadow.
- **Internal Padding:** `p-5`–`p-8` depending on density (dictionary/housing cards tighter, banners and article panes looser).

### Banners (signature component)
Every content view (Survival Guide, International Guide, Checklist, Dictionary, FAQ, Housing) opens with the same flat pattern: `bg-stone-100 dark:bg-stone-900`, bordered, no gradient, no shadow. Inside: a small uppercase cardinal-colored eyebrow label with an icon, a headline in stone-900/white, and a stone-600/400 description line. This replaced the original build's per-page dark gradient banners (each a different color combination) — one consistent treatment now carries "one voice, many surfaces" across the whole app.

### Inputs / Fields
- **Style:** `rounded-xl`, `border border-stone-200 dark:border-stone-800`, `bg-white dark:bg-stone-900`.
- **Focus:** `focus:ring-2 focus:ring-cardinal-600`, no border-color change, no glow.

### Navigation
- **Style:** near-solid `stone-50`/`stone-950` header at 92% opacity with an 8px backdrop blur and a single `border-b` — reads as flat at rest but visibly floats above content that scrolls beneath it (HIG materials: the nav/toolbar layer gets translucency, content never does). This is deliberately much lighter than the original build's glassmorphism (which was 85% opacity, 12px blur, and applied more decoratively) — functional depth cue, not a decorative effect. Active tab is solid cardinal with white text; inactive tabs are stone text with a stone-100/800 hover fill.
- **Touch targets:** every icon-only control (bookmark toggle, theme toggle, mobile menu, copy/bookmark buttons in the reader, modal close buttons) is sized to a 44×44px hit area, per HIG's minimum tappable target — visual icon size stays 16–20px, padding fills the rest.
- **Focus:** every interactive element gets a 2px solid cardinal `:focus-visible` outline with 2px offset — one consistent keyboard-focus treatment app-wide, not the mismatched browser default.
- **Press feedback:** primary buttons and icon buttons scale to ~97% on `:active` — quick, no bounce, confirms a tap registered before the resulting state change lands.

## 6. Do's and Don'ts

### Do:
- **Do** hold Warmed Cardinal to ≤10% of any screen (The One Accent Rule).
- **Do** use a border plus a one-step surface-tone shift to separate a card from its page — never a shadow at rest (The Flat-By-Default Rule).
- **Do** let motion respond to what the user does — hover, a checklist tap, a theme toggle — and stop there.
- **Do** reuse the one banner pattern across every content view instead of inventing a new treatment per page.
- **Do** size every icon-only control to a 44×44px tap target and give every focusable element the same 2px cardinal `:focus-visible` outline.
- **Do** reserve translucency for the persistent nav chrome that floats above scrolling content — never for content cards (HIG materials).

### Don't:
- **Don't** build anything that could pass for a generic SaaS dashboard — no cold admin-panel chrome (PRODUCT.md anti-reference).
- **Don't** build anything that reads as a stuffy university PDF/handbook — no dense undifferentiated walls of text (PRODUCT.md anti-reference).
- **Don't** build anything that reads as an over-designed marketing site — no gradient hero theater, no per-page gradient banners, no scroll-driven flourish (PRODUCT.md anti-reference).
- **Don't** let this feel like a university portal login page — no bureaucratic form-heavy chrome, no institutional-alert red at full saturation across large areas.
- **Don't** use `border-left`/`border-right` greater than 1px as a colored accent stripe on active list rows — use a background tint and font-weight shift instead (this replaced the original TOC's `border-l-4` active-state treatment).
- **Don't** pair a serif display font with the body sans — this system committed to one typeface, Inter, everywhere.
- **Don't** let Warmed Gold and Warmed Cardinal both try to be the "primary" color on the same screen.
