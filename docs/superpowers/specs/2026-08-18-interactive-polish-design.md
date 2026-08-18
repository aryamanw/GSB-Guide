# Interactive Polish Pass — Design

**Date:** 2026-08-18
**Status:** Approved for implementation

## Problem

The site works but reads like an online book: content is mostly static
prose panels and card grids you look at rather than tools you use. The
goal is a broad, shallow pass across existing views — playful
micro-interactions plus small functional widgets — without introducing
any new subsystem, backend, or content-authoring burden. No progress/
gamification layer (explicitly out of scope for this pass).

## Constraints

- No new data files or content authoring. Every feature works with the
  existing JSON shapes (`survivalGuideData.json`, `internationalGuideData.json`,
  `dictionaryData.json`, `faqData.json`, `checklistData.json`).
- No backend — anything "saved" uses `localStorage`, matching the existing
  pattern (`gsb-theme`, `gsb-bookmarks`, `gsb-checklist-state`).
- Match existing visual language: Stanford red (`#8C1515`)/gold (`#E9AB17`),
  `font-serif` headers, `.interactive-card` hover pattern, `lucide-react`
  icons, Tailwind utility classes, dark-mode via `.dark` class.
- Each feature is additive and isolated to its own component — no shared
  state additions to `App.jsx` unless explicitly noted below.

## Features by Component

### 1. GuideReader.jsx — scroll progress, collapsible subsections, prev/next

- **Scroll progress bar**: a `<div className="progress-bar">` (CSS already
  defined in `index.css`, currently unused) fixed to the top of the
  viewport, width driven by scroll position within the active
  chapter/section article. Tracked via a `scroll` listener computing
  `(scrollTop) / (scrollHeight - clientHeight)` against the article's
  bounding box, `useState` + `useEffect`, reset to 0 on chapter change.
- **Collapsible subsections**: each subsection in `activeChapter.subsections`
  gets a `useState<Set<id>>` of expanded ids (default: only first
  subsection expanded, or all expanded if fewer than 3 — avoids the
  awkward "user must click to see any content" first-load moment). Header
  becomes a `<button>` toggling a chevron + max-height/opacity transition.
  International guide sections (already single-body, no subsections) are
  unaffected.
- **Prev/Next chapter nav**: bottom-of-article buttons that flatten
  `data` into a single ordered chapter list and jump `selectedChapterId`
  to the adjacent one, disabled at the first/last chapter. Same pattern
  applied to the international guide's flat `data` array.

### 2. HousingExplorer.jsx — priority filter chips

- Add a `PRIORITIES` array (`Budget-friendly`, `Social`, `Quiet`, `Family`)
  as toggleable chips above the card grid, `useState<Set<string>>` for
  active priorities.
- Each housing/neighborhood object gets a `tags: string[]` field added
  inline in the component's existing data arrays (not a new data file —
  these arrays are already component-local JS, not JSON) mapping to the
  priority set, e.g. Schwab → `['budget-friendly', 'social']`, EV →
  `['family', 'quiet']`.
- When priorities are active: matching cards stay full-opacity with a
  gold ring highlight, non-matching cards dim to `opacity-50`. No
  priorities selected = current behavior (all full opacity).

### 3. DictionaryView.jsx — quiz-me reveal mode

- Add a "Quiz Me" toggle button in the header area. When active,
  definitions render behind a "Tap to reveal" overlay per-card instead
  of always visible.
- Per-card `revealed: Set<term>` state; clicking a hidden definition
  reveals it with a flip/fade transition (CSS transform on a card inner
  wrapper, no new dependency).
- Toggling "Quiz Me" off always shows all definitions (current behavior).
- Existing copy-term button still works in both modes.

### 4. FAQView.jsx — helpful votes + expand/collapse all

- Add 👍/👎 buttons inside each opened FAQ answer. Click stores a vote in
  `localStorage` (`gsb-faq-votes`, `{ [faqId]: 'up' | 'down' }`) and shows
  a small thank-you micro-animation (checkmark pulse); no visible vote
  counts (single-user local site, so an aggregate count would be
  misleading) — purely a satisfying local acknowledgment.
- Add "Expand all / Collapse all" control near the search bar, switching
  `openId` (single) to `openIds: Set<string>` to support multiple open
  panels at once — this is a small behavior change (currently accordion
  is single-open); confirmed acceptable since nothing depends on
  single-open behavior.

### 5. HeroLanding.jsx — count-up stats, richer card hover

- Stats strip: use `IntersectionObserver` to trigger a count-up animation
  (0 → target number over ~800ms) the first time the stats strip scrolls
  into view. Numbers with a `+` suffix (e.g. `29+`) count up the numeric
  part and append the suffix at the end.
- Quick-link cards: add an icon micro-bounce (`group-hover:` scale/rotate
  on the icon wrapper) layered on top of the existing lift/border-color
  hover — no new component, just additional Tailwind classes.

### 6. ChecklistTracker.jsx — category progress rings

- Next to each category filter chip, add a small circular progress ring
  (inline SVG `<circle>` with `stroke-dasharray`, no chart library) showing
  that category's completion percentage. Purely derived from existing
  `items` state, no new persisted state.

## Non-Goals

- No overall "GSB Readiness" score or cross-view progress tracking.
- No quiz/matching game beyond the Dictionary reveal toggle.
- No drag-and-drop, no new routes, no new npm dependencies.

## Testing

Manual verification per component (`npm run dev`), in both light and
dark mode:
- GuideReader: progress bar fills across a long chapter; subsections
  expand/collapse; prev/next lands on the correct adjacent chapter at
  both ends of a Part and across Part boundaries; international guide
  prev/next works across its flat list.
- HousingExplorer: toggling priority chips dims/highlights the right
  cards; multiple priorities combine as OR (matches any); clearing all
  priorities returns to normal.
- DictionaryView: Quiz Me hides/reveals correctly per card; turning it
  off restores all definitions; existing search filter still works
  combined with quiz mode.
- FAQView: votes persist across reload via localStorage; expand/collapse
  all works; individual toggle still works per-item.
- HeroLanding: stats count up once on first scroll-into-view, don't
  re-trigger on every scroll.
- ChecklistTracker: rings reflect correct per-category percentage as
  items are toggled.
