# Interactive Delight Pass — Design

**Date:** 2026-08-20
**Status:** Approved for implementation

## Problem

The Aug 19 redesign established a warm, restrained design language, but
the site still reads like an online book: most views are static prose
panels and card grids you look at rather than tools you use. The
Aug 18 interactive-polish spec proposed a set of micro-interactions and
widgets, but it was written against the pre-redesign language (Stanford
red, serif headers, gradient banners) and was never implemented. This
spec revives that menu, adapts it to the shipped design system, and —
per the design decision recorded in this session — leans into
**playful delight**: the features feel alive and rewarding, not merely
functional.

## Constraints

- No new data files or content authoring. Every feature works with the
  existing JSON shapes (`survivalGuideData.json`,
  `internationalGuideData.json`, `dictionaryData.json`, `faqData.json`,
  `checklistData.json`). The only inline content additions are `tags`
  arrays on `HousingExplorer`'s component-local data literals.
- No backend — anything persisted uses `localStorage`, matching the
  existing keys (`gsb-theme`, `gsb-bookmarks`, `gsb-checklist-state`).
- No new npm dependencies. `canvas-confetti` and `lucide-react` already
  exist; SVG rings are hand-rolled.
- Match the shipped design language (DESIGN.md): stone neutrals carry
  every surface, Warmed Cardinal is the one accent (≤10% of a screen),
  flat bordered cards with no shadow at rest, Inter everywhere, dark
  mode via the `.dark` class.
- **Reduced motion:** all new motion respects `prefers-reduced-motion`.
  Playful moments are *responsive to action* (tap, hover,
  scroll-into-view) — never auto-playing entrances. The one exception,
  count-up stats, bails to the final value immediately when reduced
  motion is set.
- **Tone:** playful delight wins over restraint where they conflict, but
  the existing rules that matter for usability still hold: The One
  Accent Rule, The No Second Accent Rule (gold never competes with
  cardinal on the same element), 44px icon-button hit areas, and the
  flat-by-default elevation rule.
- Each feature is additive and isolated to its own component. No new
  shared state in `App.jsx`.

## Features by Component

### 1. GuideReader.jsx — scroll progress, collapsible subsections, prev/next

- **Scroll progress bar:** a 2px fixed bar at the top of the viewport,
  width driven by scroll position through the active article
  (`scrollTop / (scrollHeight - clientHeight)` against the article's
  bounding box). Resets to 0 on chapter change. Positional, not
  animated — no reduced-motion gating needed.
- **Collapsible subsections:** each subsection in
  `activeChapter.subsections` with a distinct title gets a header that
  is a `<button>` toggling a chevron (up/down) with a max-height +
  opacity transition. Seed state on chapter change: chapters with ≥3
  subsections open only the first; shorter chapters open all — avoids
  the awkward "everything collapsed" first-load moment. International
  guide sections (single-body, no subsections) are unaffected.
- **Prev/Next chapter nav:** bottom-of-article buttons that flatten the
  guide's chapters across all Parts into one ordered list and jump the
  active chapter to the adjacent one, disabled at the very first/last.
  Same pattern applied to the international guide's flat section list.

### 2. HousingExplorer.jsx — priority filter chips

- A `PRIORITIES` array (`Budget-friendly`, `Social`, `Quiet`, `Family`)
  rendered as toggleable chips above the card grid, each with a
  `lucide-react` icon (`DollarSign`, `Users`, `VolumeX`, `Heart`).
- Each on-campus / off-campus option gets a `tags: string[]` field added
  to its inline data literal (not the JSON files) mapping to the
  priority set, e.g. Schwab → `['budget-friendly', 'social']`, EV →
  `['family', 'quiet']`, Mountain View/Sunnyvale → `['budget-friendly']`.
- When priorities are active, matching cards keep full opacity with a
  **gold** ring highlight (`ring-2 ring-gold-400`), non-matching cards
  dim to `opacity-50`. Multiple chips combine as OR (matches any). No
  chips selected = current behavior.
- **Playful touch:** the active chip pops with a scale transition on
  select; the gold ring appears with a short transition so matching
  cards visibly light up as you filter.

### 3. FAQView.jsx — helpful votes + expand/collapse all

- **Votes:** 👍/👎 buttons appear inside each open answer. Clicking one
  stores a vote in `localStorage` under `gsb-faq-votes`, keyed by the
  **question text** (stable id — `faqData` has no `id` field, and the
  old plan's `${category}-${idx}` key breaks when search re-orders the
  list). No visible vote counts (single-user site; a count would be
  misleading). Clicking the already-active direction clears the vote.
- **Playful touch:** casting a vote triggers a short `pulse-once`
  checkmark + a "Thanks — noted" acknowledgment, then fades.
- **Expand/Collapse all:** controls near the search bar. This changes
  the accordion from single-open (`openId`) to multi-open (`openIds`
  Set) to support multiple open panels — a confirmed behavior change;
  nothing depends on single-open.

### 4. HeroLanding.jsx — count-up stats + richer card hover

- **Stats count-up:** a shared `useCountUp` hook observes the stats
  strip with `IntersectionObserver` and, the first time it scrolls into
  view, animates each number 0 → target over ~800ms with an ease-out
  curve (`requestAnimationFrame`). Numbers with a `+` suffix count up
  the numeric part and append the suffix. Fires once — no re-trigger on
  repeat scrolls. With `prefers-reduced-motion`, renders the final value
  immediately.
- **Quick-link hover polish:** the card's icon tile gains a gentle
  scale/rotate micro-bounce on hover, layered on the existing lift and
  border-color hover. The "Open →" affordance gains a small slide.

### 5. ChecklistTracker.jsx — category progress rings

- Next to each category filter chip, a small inline SVG circular ring
  (no chart library) showing that category's completion percentage,
  purely derived from existing `items` state — no new persisted state.
- **Playful touch:** the ring's `stroke-dashoffset` animates as items
  toggle, so checking a task visibly fills its category ring. Respects
  reduced motion (transition disabled).

## Shared Foundation

- `animate-fade-in` / `animate-slide-in-right` / `.interactive-card`
  already exist in `index.css` with reduced-motion gating — nothing to
  add there.
- **New:** `pulse-once` keyframe in `index.css` (scale 1 → 1.3 → 1 over
  ~0.4s), following the existing keyframe/animation pattern under the
  same reduced-motion gate. Used by FAQ vote feedback.
- **New:** `src/hooks/useCountUp.js` — `IntersectionObserver` +
  `requestAnimationFrame` easing helper, bails to final value under
  reduced motion. Used only by HeroLanding.

## Non-Goals

- No overall "GSB Readiness" score or cross-view progress tracking.
- No quiz/game beyond what's specified (dictionary quiz mode from the
  Aug 18 spec is **explicitly dropped** — out of scope this session).
- No new routes, no new npm dependencies, no backend, no new data files.
- No changes to `App.jsx` shared state or to the header/search/bookmarks
  chrome.

## Testing

No test framework exists in this repo. Each feature is verified with:
1. `npx vite build` as a compile-correctness gate.
2. A manual pass via `npm run dev` in both light and dark mode:

- **GuideReader:** progress bar fills across a long chapter and resets
  on chapter change; subsections expand/collapse with correct default
  seeding (≥3 subs → first only, <3 → all); prev/next lands on the
  correct adjacent chapter, including across Part boundaries, disabled
  at both ends; international guide prev/next works across its flat
  list.
- **HousingExplorer:** chips toggle with a pop; matching cards show a
  gold ring, non-matching dim; multiple chips combine as OR; clearing
  all returns to normal; filter works on both tabs; dark mode reads
  correctly.
- **FAQView:** votes persist across reload; clicking the active
  direction clears the vote; expand/collapse-all opens/closes all;
  individual toggle still works; multi-open no longer closes a panel
  when a different one is opened.
- **HeroLanding:** stats count up once on first scroll-into-view, never
  re-trigger; `+` suffixes render correctly; reduced-motion shows final
  values; icon micro-bounce on hover.
- **ChecklistTracker:** rings reflect correct per-category percentages
  as items are toggled, animate on toggle, and respect reduced motion.