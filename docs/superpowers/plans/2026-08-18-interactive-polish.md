# Interactive Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn six existing views (GuideReader, HousingExplorer, DictionaryView, FAQView, HeroLanding, ChecklistTracker) from static prose/cards into components with playful micro-interactions and small functional widgets, with no new backend, data files, or dependencies.

**Architecture:** Each task modifies exactly one existing component file in place. No new files, no new shared state in `App.jsx`, no new props between components — every feature is self-contained within the component it touches. One small shared prerequisite (Task 1) adds reusable CSS keyframes to `tailwind.config.js`.

**Tech Stack:** React 19 (function components + hooks), Tailwind CSS (utility classes, `dark:` variant), `lucide-react` icons, `canvas-confetti` (already a dependency, used only by the existing ChecklistTracker), Vite. No test framework exists in this repo.

**Spec:** [docs/superpowers/specs/2026-08-18-interactive-polish-design.md](../specs/2026-08-18-interactive-polish-design.md)

## Global Constraints

- No new data files or content authoring beyond inline JS fields added directly in a component's own local data arrays (e.g. `tags` on `HousingExplorer`'s `onCampusOptions`/`offCampusNeighborhoods` — these are JS literals in the component, not the JSON files under `src/data/`).
- No backend. Anything persisted uses `localStorage`, following the existing key naming pattern (`gsb-theme`, `gsb-bookmarks`, `gsb-checklist-state`) — e.g. `gsb-faq-votes`.
- Match existing visual language: Stanford red `#8C1515` / gold `#E9AB17`, `font-serif` headers, the `.interactive-card` hover pattern (already in `src/index.css`), `lucide-react` icons, Tailwind utility classes, dark mode via the `.dark` class.
- No new npm dependencies.
- **No test framework exists in this codebase.** Every task substitutes: (1) `npx vite build` as a compile-correctness gate (catches JSX/import errors — the closest thing to an automated check available), and (2) a manual verification pass via `npm run dev` in both light and dark mode, per the spec's own Testing section. This mirrors how the existing codebase already ships (no `*.test.*` files anywhere in `src/`).
- Each task is independent and can be done in any order, **except Task 1 runs first** — Tasks 5 and 6 use CSS animation utility classes it defines.

---

### Task 1: Shared animation keyframes

Adds `animate-fade-in`, `animate-slide-in-right`, and `animate-pulse-once` as real Tailwind utilities. Two of these class names are already referenced in the codebase today (`App.jsx`'s bookmarks drawer uses `animate-slide-in-right`, `GlobalSearchModal.jsx` uses `animate-fade-in`) but neither is defined anywhere — `grep -rn "@keyframes\|animate-fade-in\|animate-slide-in-right" src/ tailwind.config.js` turns up only the two usage sites, no definition — so today they're silent no-ops. This task defines them (fixing that pre-existing gap as a side effect) and adds the one new keyframe this plan needs for FAQ vote feedback.

**Files:**
- Modify: `tailwind.config.js`

**Interfaces:**
- Consumes: nothing
- Produces: Tailwind utility classes `animate-fade-in`, `animate-slide-in-right`, `animate-pulse-once`. `animate-fade-in` is consumed by Task 4 (DictionaryView); `animate-pulse-once` is consumed by Task 5 (FAQView). `animate-slide-in-right` and `animate-fade-in` are also already referenced by the existing `App.jsx` and `GlobalSearchModal.jsx` (now functional instead of silently inert).

- [ ] **Step 1: Add keyframes and animation utilities**

Replace the full contents of `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'stanford-red': '#8C1515',
        'stanford-gold': '#E9AB17',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-once': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'pulse-once': 'pulse-once 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors (Tailwind config errors surface immediately at build time).

- [ ] **Step 3: Manually verify the two existing animations now play**

Run: `npm run dev`, open the app in a browser.
- Click the bookmark icon in the header to open the Bookmarks drawer — it should now visibly slide in from the right instead of appearing instantly.
- Press `Cmd+K` (or `Ctrl+K`) to open Global Search — it should now visibly fade in instead of appearing instantly.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add shared fade-in/slide-in/pulse animation utilities

Fixes animate-fade-in and animate-slide-in-right, which were already
referenced in App.jsx and GlobalSearchModal.jsx but never defined."
```

---

### Task 2: GuideReader — scroll progress, collapsible subsections, prev/next nav

**Files:**
- Modify: `src/components/GuideReader.jsx` (full-file rewrite — the three features share state introduced at the top of the component)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/GuideReader.jsx` with:

```jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bookmark, Share2, Copy, Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Clock, BookOpen, Layers } from 'lucide-react';

function ScrollProgressBar({ percent }) {
  return <div className="progress-bar" style={{ width: `${percent}%` }} />;
}

export default function GuideReader({ data, isIntl = false, bookmarkedIds, onToggleBookmark }) {
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [tocOpenMobile, setTocOpenMobile] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expandedSubs, setExpandedSubs] = useState(new Set());
  const articleRef = useRef(null);

  // Set default active chapter
  useEffect(() => {
    if (!isIntl && data && data.length > 0) {
      if (data[0].chapters && data[0].chapters.length > 0) {
        setSelectedChapterId(data[0].chapters[0].id);
      }
    } else if (isIntl && data && data.length > 0) {
      setSelectedChapterId(data[0].id);
    }
  }, [data, isIntl]);

  // Resolve active chapter/part for the survival guide (unused for intl)
  let activeChapter = null;
  let activePart = null;
  if (!isIntl) {
    for (const p of data || []) {
      for (const c of p.chapters || []) {
        if (c.id === selectedChapterId) {
          activeChapter = c;
          activePart = p;
          break;
        }
      }
    }
    if (!activeChapter && data && data.length > 0 && data[0].chapters && data[0].chapters.length > 0) {
      activeChapter = data[0].chapters[0];
      activePart = data[0];
    }
  }

  // Flatten survival guide chapters into an ordered list for prev/next nav
  const flatChapters = useMemo(() => {
    if (isIntl || !data) return [];
    const list = [];
    for (const part of data) {
      for (const chap of part.chapters || []) {
        list.push(chap);
      }
    }
    return list;
  }, [data, isIntl]);

  // Reset & seed collapsible subsections whenever the active chapter changes.
  // Chapters with fewer than 3 subsections open all of them by default so a
  // short chapter never starts fully collapsed; longer chapters open just
  // the first one.
  useEffect(() => {
    if (isIntl) return;
    const subs = activeChapter?.subsections || [];
    if (subs.length === 0) {
      setExpandedSubs(new Set());
    } else if (subs.length < 3) {
      setExpandedSubs(new Set(subs.map((s) => s.id)));
    } else {
      setExpandedSubs(new Set([subs[0].id]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapterId, isIntl]);

  // Track scroll progress through the active article as the page scrolls
  useEffect(() => {
    setScrollProgress(0);
    const handleScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) {
        setScrollProgress(100);
        return;
      }
      const scrolled = -rect.top;
      const pct = Math.min(100, Math.max(0, (scrolled / totalScrollable) * 100));
      setScrollProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedChapterId]);

  const toggleSub = (id) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToAdjacentChapter = (direction) => {
    const idx = flatChapters.findIndex((c) => c.id === selectedChapterId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= flatChapters.length) return;
    setSelectedChapterId(flatChapters[nextIdx].id);
  };

  const goToAdjacentSection = (direction) => {
    if (!data) return;
    const idx = data.findIndex((s) => s.id === selectedChapterId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= data.length) return;
    setSelectedChapterId(data[nextIdx].id);
  };

  const copyPermalink = (id) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Estimate reading time in minutes
  const calculateReadingTime = (text) => {
    if (!text) return 1;
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  if (isIntl) {
    // Render International Student Guide Layout
    const activeSection = data.find((s) => s.id === selectedChapterId) || data[0];
    const sectionIdx = data.findIndex((s) => s.id === activeSection?.id);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ScrollProgressBar percent={scrollProgress} />
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#8C1515] to-red-900 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-md">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              GSB Student Association International Committee
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold mb-3">
              International Students Guide
            </h1>
            <p className="text-red-100 text-sm sm:text-base leading-relaxed">
              Essential guide on visas, US banking, drivers licenses, tax filings (Form 8843), CPT, SSN, mobile setup, and settling into Palo Alto.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar TOC */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <h3 className="font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-[#8C1515]" />
                  Table of Contents
                </h3>
              </div>

              <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
                {data.map((sec) => {
                  const isActive = sec.id === selectedChapterId;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setSelectedChapterId(sec.id);
                        setTocOpenMobile(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-950/60 text-[#8C1515] dark:text-red-400 font-semibold border-l-4 border-[#8C1515]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{sec.title}</span>
                      <ChevronRight size={14} className={`opacity-40 ${isActive ? 'opacity-100' : ''}`} />
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3">
            {activeSection && (
              <article ref={articleRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
                      {activeSection.title}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {calculateReadingTime(activeSection.body)} min read
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBookmark(activeSection.id, activeSection.title)}
                      className={`p-2 rounded-lg border transition-colors ${
                        bookmarkedIds.includes(activeSection.id)
                          ? 'bg-red-50 border-red-200 text-[#8C1515] dark:bg-red-950 dark:border-red-800 dark:text-red-300'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                      title="Bookmark section"
                    >
                      <Bookmark size={18} fill={bookmarkedIds.includes(activeSection.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => copyPermalink(activeSection.id)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
                      title="Copy permalink"
                    >
                      {copiedId === activeSection.id ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                    </button>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {activeSection.body}
                </div>

                {/* Prev/Next Section Nav */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => goToAdjacentSection(-1)}
                    disabled={sectionIdx <= 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => goToAdjacentSection(1)}
                    disabled={sectionIdx === -1 || sectionIdx >= data.length - 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </article>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Render Survival Guide Layout
  const chapterIdx = flatChapters.findIndex((c) => c.id === selectedChapterId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ScrollProgressBar percent={scrollProgress} />
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#8C1515] rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-md">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3 text-red-200">
            Nikhil Jain (MBA '26) & GSB Community
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold mb-3">
            The Stanford GSB Unofficial Survival Guide
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            The accumulated, road-tested advice of GSB students: housing, packing, academics, MARRS bidding, career playbooks, social traditions, and Bay Area life.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm max-h-[80vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3 text-sm">
              <BookOpen size={16} className="text-[#8C1515]" />
              Parts & Chapters
            </h3>

            <div className="space-y-4">
              {data.map((part, pIdx) => (
                <div key={part.id || pIdx} className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                    {part.title}
                  </div>
                  {part.chapters.map((chap) => {
                    const isActive = chap.id === selectedChapterId;
                    return (
                      <button
                        key={chap.id}
                        onClick={() => setSelectedChapterId(chap.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-red-50 dark:bg-red-950/60 text-[#8C1515] dark:text-red-400 font-semibold border-l-4 border-[#8C1515]'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate">
                          {chap.number > 0 ? `${chap.number}. ${chap.title.replace(/^\d+\.\s*/, '')}` : chap.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="lg:col-span-3">
          {activeChapter && (
            <article ref={articleRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8">
              
              {/* Chapter Header */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8C1515] dark:text-red-400">
                      {activePart?.title}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white mt-1">
                      {activeChapter.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBookmark(activeChapter.id, activeChapter.title)}
                      className={`p-2 rounded-lg border transition-colors ${
                        bookmarkedIds.includes(activeChapter.id)
                          ? 'bg-red-50 border-red-200 text-[#8C1515] dark:bg-red-950 dark:border-red-800 dark:text-red-300'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                      title="Bookmark chapter"
                    >
                      <Bookmark size={18} fill={bookmarkedIds.includes(activeChapter.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => copyPermalink(activeChapter.id)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors"
                      title="Copy permalink"
                    >
                      {copiedId === activeChapter.id ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subsections Content */}
              <div className="space-y-8">
                {activeChapter.subsections.map((sub) => {
                  const hasTitle = Boolean(sub.title && sub.title !== activeChapter.title);
                  const isOpen = !hasTitle || expandedSubs.has(sub.id);
                  return (
                    <section key={sub.id} id={sub.id} className="space-y-3">
                      {hasTitle && (
                        <button
                          onClick={() => toggleSub(sub.id)}
                          className="w-full flex items-center justify-between gap-2 text-left group"
                        >
                          <h3 className="text-xl font-serif font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#8C1515]"></span>
                            {sub.title}
                          </h3>
                          {isOpen ? (
                            <ChevronUp size={18} className="text-slate-400 group-hover:text-[#8C1515] transition-colors shrink-0" />
                          ) : (
                            <ChevronDown size={18} className="text-slate-400 group-hover:text-[#8C1515] transition-colors shrink-0" />
                          )}
                        </button>
                      )}
                      {isOpen && (
                        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                          {sub.body}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>

              {/* Prev/Next Chapter Nav */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => goToAdjacentChapter(-1)}
                  disabled={chapterIdx <= 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => goToAdjacentChapter(1)}
                  disabled={chapterIdx === -1 || chapterIdx >= flatChapters.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>

            </article>
          )}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open the Survival Guide tab.
- A thin red-to-gold progress bar should appear fixed at the top of the viewport and fill as you scroll down a long chapter (try a chapter with several subsections, e.g. anything under "Housing").
- Switching to a new chapter resets the bar to empty.
- Any chapter with 3+ subsections should load with only the first subsection expanded; clicking a collapsed subsection's heading expands it (chevron flips down→up); clicking again collapses it. Chapters with fewer than 3 subsections load fully expanded.
- "Previous"/"Next" buttons at the bottom of the chapter move to the adjacent chapter, including across Part boundaries; "Previous" is disabled on the very first chapter, "Next" is disabled on the very last.
- Repeat the progress bar and Previous/Next checks on the International Guide tab (no subsections there, so only progress bar + prev/next apply).
- Toggle dark mode and confirm all of the above still look correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/GuideReader.jsx
git commit -m "feat: add scroll progress, collapsible subsections, prev/next nav to GuideReader"
```

---

### Task 3: HousingExplorer — priority filter chips

**Files:**
- Modify: `src/components/HousingExplorer.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/HousingExplorer.jsx` with:

```jsx
import React, { useState } from 'react';
import { Home, MapPin, DollarSign, Users, VolumeX, Heart, Filter, CheckCircle2 } from 'lucide-react';

const PRIORITIES = [
  { key: 'budget-friendly', label: 'Budget-friendly', icon: DollarSign },
  { key: 'social', label: 'Social', icon: Users },
  { key: 'quiet', label: 'Quiet', icon: VolumeX },
  { key: 'family', label: 'Family', icon: Heart },
];

export default function HousingExplorer() {
  const [activeTab, setActiveTab] = useState('on-campus');
  const [activePriorities, setActivePriorities] = useState(new Set());

  const togglePriority = (key) => {
    setActivePriorities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const matchesPriorities = (tags) => {
    if (activePriorities.size === 0) return true;
    return tags.some((t) => activePriorities.has(t));
  };

  const onCampusOptions = [
    {
      name: "Schwab Residential Center",
      type: "On-Campus (GSB)",
      target: "Single MBA1s",
      vibe: "The primary hub of MBA1 social life. Studio rooms with private bathrooms, shared micro-kitchens per floor.",
      perks: ["Steps from KMC classrooms", "High density of MBA1 classmates", "Front desk package handling"],
      tag: "Top Choice for Single MBA1s",
      tags: ["budget-friendly", "social"]
    },
    {
      name: "Jack McDonald Hall (JMac)",
      type: "On-Campus (GSB)",
      target: "Single MBA1s / MBA2s",
      vibe: "Modern residential building adjacent to Schwab with apartment-style layouts and central courtyards.",
      perks: ["Newer construction", "Spacious interior courtyards", "Immediate proximity to Knight Center"],
      tag: "Popular On-Campus Option",
      tags: ["social"]
    },
    {
      name: "Escondido Village (EV Mid-Rises / High-Rises)",
      type: "On-Campus (Stanford)",
      target: "Couples & Families",
      vibe: "Quiet graduate housing complex with 1-bedroom and 2-bedroom apartments, parks, and family amenities.",
      perks: ["More space for couples & families", "Subsidized Stanford rent rates", "Dedicated community centers & parking"],
      tag: "Best for Couples",
      tags: ["family", "quiet", "budget-friendly"]
    }
  ];

  const offCampusNeighborhoods = [
    {
      name: "Downtown Palo Alto (University Ave)",
      dist: "5-10 min bike / drive",
      vibe: "Vibrant urban strip with top restaurants, coffee shops, boutiques, and Caltrain station access.",
      target: "Students wanting walkable nightlife and dining",
      tag: "Prime Off-Campus",
      tags: ["social"]
    },
    {
      name: "Menlo Park",
      dist: "10-15 min bike",
      vibe: "Quiet, leafy residential suburb immediately north of campus. Great restaurants on Santa Cruz Ave.",
      target: "Students seeking peaceful residential living",
      tag: "Quiet & Convenient",
      tags: ["quiet", "family"]
    },
    {
      name: "Mountain View / Sunnyvale",
      dist: "15-20 min drive",
      vibe: "Tech hub neighborhood with diverse dining (Castro St), easy 101/280 access, and cheaper rent.",
      target: "Budget-conscious students or tech partners",
      tag: "Budget Friendly",
      tags: ["budget-friendly"]
    },
    {
      name: "San Francisco (SoMa / Mission)",
      dist: "45-60 min Caltrain / drive",
      vibe: "Big city energy, tech ecosystem events, world-class dining. Requires commuting for campus classes.",
      target: "MBA2s or students with SF-based partners",
      tag: "City Living",
      tags: ["social"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950 via-[#8C1515] to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Home size={20} className="text-amber-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              Chapter 3 & International Guide
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold mb-2">
            Stanford GSB Housing & Neighborhood Explorer
          </h1>
          <p className="text-slate-200 text-sm sm:text-base">
            Compare GSB Residences (Schwab, JMac), Stanford Escondido Village (EV), and Palo Alto off-campus neighborhood options.
          </p>
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl gap-2">
          <button
            onClick={() => setActiveTab('on-campus')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'on-campus'
                ? 'bg-[#8C1515] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            On-Campus Residences
          </button>
          <button
            onClick={() => setActiveTab('off-campus')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'off-campus'
                ? 'bg-[#8C1515] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Off-Campus Neighborhoods
          </button>
        </div>
      </div>

      {/* Priority Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
          <Filter size={14} />
          Filter by priority
        </span>
        {PRIORITIES.map(({ key, label, icon: Icon }) => {
          const isActive = activePriorities.has(key);
          return (
            <button
              key={key}
              onClick={() => togglePriority(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? 'bg-[#8C1515] border-[#8C1515] text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#8C1515]'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {activeTab === 'on-campus' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {onCampusOptions.map((opt, idx) => {
            const matched = matchesPriorities(opt.tags);
            return (
              <div
                key={idx}
                className={`interactive-card bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4 transition-opacity duration-200 ${
                  activePriorities.size > 0 && !matched ? 'opacity-50' : ''
                } ${activePriorities.size > 0 && matched ? 'ring-2 ring-[#E9AB17]' : ''}`}
              >
                <div>
                  <span className="badge badge-cardinal mb-3">{opt.tag}</span>
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white mt-1">
                    {opt.name}
                  </h3>
                  <p className="text-xs text-[#8C1515] dark:text-red-400 font-medium mt-1">
                    Target: {opt.target}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 leading-relaxed">
                    {opt.vibe}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Highlights</h4>
                  {opt.perks.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offCampusNeighborhoods.map((n, idx) => {
            const matched = matchesPriorities(n.tags);
            return (
              <div
                key={idx}
                className={`interactive-card bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 transition-opacity duration-200 ${
                  activePriorities.size > 0 && !matched ? 'opacity-50' : ''
                } ${activePriorities.size > 0 && matched ? 'ring-2 ring-[#E9AB17]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="badge badge-gold">{n.tag}</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin size={14} className="text-[#8C1515]" />
                    {n.dist}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                    {n.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Ideal for: {n.target}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 leading-relaxed">
                    {n.vibe}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open the Housing Explorer tab.
- With no priority chip active, all cards are full-opacity, no ring — identical to current behavior.
- Click "Budget-friendly" — Schwab, EV, and Mountain View/Sunnyvale get a gold ring and stay full-opacity; JMac, Downtown Palo Alto, Menlo Park, and SF dim to half-opacity.
- Click "Social" in addition — cards matching *either* Budget-friendly or Social now stay highlighted (OR semantics), more cards un-dim.
- Deselect all chips — all cards return to normal.
- Switch between "On-Campus" and "Off-Campus" tabs with a priority active — the filter still applies on the new tab.
- Toggle dark mode and confirm the dim/ring states still read correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/HousingExplorer.jsx
git commit -m "feat: add priority filter chips to HousingExplorer"
```

---

### Task 4: DictionaryView — Quiz Me reveal mode

**Files:**
- Modify: `src/components/DictionaryView.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: `animate-fade-in` utility class from Task 1
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/DictionaryView.jsx` with:

```jsx
import React, { useState } from 'react';
import { Book, Search, Copy, Check, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function DictionaryView({ terms }) {
  const [search, setSearch] = useState('');
  const [copiedTerm, setCopiedTerm] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [revealed, setRevealed] = useState(new Set());

  const filteredTerms = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  const copyTerm = (t) => {
    navigator.clipboard.writeText(`${t.term}: ${t.definition}`);
    setCopiedTerm(t.term);
    setTimeout(() => setCopiedTerm(null), 2000);
  };

  const toggleQuizMode = () => {
    setQuizMode((prev) => !prev);
    setRevealed(new Set());
  };

  const revealTerm = (term) => {
    setRevealed((prev) => new Set(prev).add(term));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Book size={20} className="text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-300">
              Stanford & GSB Jargon
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold mb-2">
            The GSB Dictionary & Lingo
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            From <span className="text-red-300 font-semibold">TALK</span> to <span className="text-red-300 font-semibold">FOAM</span>, decode the terms, places, traditions, and acronyms used daily across Knight Management Center.
          </p>
        </div>
      </div>

      {/* Search + Quiz Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="relative max-w-xl w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter dictionary terms (e.g. Touchy Feely, Arbuckle, MARRS)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8C1515] shadow-sm text-sm"
          />
        </div>
        <button
          onClick={toggleQuizMode}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all shrink-0 ${
            quizMode
              ? 'bg-[#8C1515] border-[#8C1515] text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#8C1515]'
          }`}
        >
          {quizMode ? <EyeOff size={16} /> : <Sparkles size={16} />}
          {quizMode ? 'Quiz Mode: On' : 'Quiz Me'}
        </button>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((t, idx) => {
          const isRevealed = !quizMode || revealed.has(t.term);
          return (
            <div
              key={t.term + idx}
              className="interactive-card bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-serif font-bold text-lg text-[#8C1515] dark:text-red-400">
                    {t.term}
                  </span>
                  <button
                    onClick={() => copyTerm(t)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                    title="Copy term definition"
                  >
                    {copiedTerm === t.term ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
                {isRevealed ? (
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed animate-fade-in">
                    {t.definition}
                  </p>
                ) : (
                  <button
                    onClick={() => revealTerm(t.term)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-[#8C1515] hover:border-[#8C1515] transition-colors flex items-center gap-2"
                  >
                    <Eye size={14} />
                    Tap to reveal definition
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No matching dictionary terms found for "{search}".
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open the Dictionary tab.
- Default state (Quiz Mode off) looks identical to today: all definitions visible.
- Click "Quiz Me" — every definition hides behind a dashed "Tap to reveal definition" button.
- Click one card's reveal button — only that card's definition appears (with a brief fade-in), others stay hidden.
- Type in the search box while in quiz mode — filtering still works, and already-revealed terms stay revealed if they're still in the filtered results.
- Click "Quiz Mode: On" again to turn it off — all definitions become visible again and the hidden/revealed state resets.
- The copy-to-clipboard button still works with quiz mode both on and off.
- Toggle dark mode and confirm both states look correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/DictionaryView.jsx
git commit -m "feat: add Quiz Me reveal mode to DictionaryView"
```

---

### Task 5: FAQView — helpful votes + expand/collapse all

**Files:**
- Modify: `src/components/FAQView.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: `animate-pulse-once` utility class from Task 1
- Produces: nothing consumed by other tasks
- Note: this task changes the accordion from single-open (`openId` string) to multi-open (`openIds` Set) to support "Expand all" — an intentional, spec-approved behavior change from the current single-open accordion.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/FAQView.jsx` with:

```jsx
import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare, ThumbsUp, ThumbsDown, ChevronsDown, ChevronsUp } from 'lucide-react';

const VOTES_KEY = 'gsb-faq-votes';

export default function FAQView({ faqs }) {
  const [openIds, setOpenIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [votes, setVotes] = useState(() => {
    const saved = localStorage.getItem(VOTES_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  // Group into the guide's own categories (Living, Food, Tech, ...) so a
  // 50+ entry list stays scannable instead of one long flat accordion.
  const groups = useMemo(() => {
    const byCategory = new Map();
    for (const f of filteredFaqs) {
      const cat = f.category || 'General';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(f);
    }
    return Array.from(byCategory.entries());
  }, [filteredFaqs]);

  const allFaqIds = useMemo(
    () => groups.flatMap(([category, items]) => items.map((_, idx) => `${category}-${idx}`)),
    [groups]
  );

  const toggleFaq = (faqId) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(faqId)) next.delete(faqId);
      else next.add(faqId);
      return next;
    });
  };

  const expandAll = () => setOpenIds(new Set(allFaqIds));
  const collapseAll = () => setOpenIds(new Set());

  const castVote = (faqId, direction) => {
    setVotes((prev) => {
      const next = { ...prev, [faqId]: direction };
      localStorage.setItem(VOTES_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-900 via-slate-900 to-red-950 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={20} className="text-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-300">
              Class Chat Quick Answers
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold mb-2">
            Classmate FAQs & Quick Answers
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Direct answers to the most frequently asked questions on WhatsApp and Slack: cars, health insurance, student ID, pets, and course bidding.
          </p>
        </div>
      </div>

      {/* Search Bar + Expand/Collapse All */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="relative max-w-xl w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter FAQs (e.g. car, Cardinal Care, ID card, pets)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8C1515] shadow-sm text-sm"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#8C1515] hover:text-[#8C1515] transition-colors"
            title="Expand all"
          >
            <ChevronsDown size={16} />
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[#8C1515] hover:text-[#8C1515] transition-colors"
            title="Collapse all"
          >
            <ChevronsUp size={16} />
            Collapse all
          </button>
        </div>
      </div>

      {/* Grouped Accordion List */}
      <div className="space-y-8">
        {groups.map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C1515] dark:text-red-400 px-1">
              {category}
            </h2>
            {items.map((faq, idx) => {
              const faqId = `${category}-${idx}`;
              const isOpen = openIds.has(faqId);
              const vote = votes[faqId];
              return (
                <div
                  key={faqId}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(faqId)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-serif font-semibold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                      <MessageSquare size={18} className="text-[#8C1515] shrink-0" />
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
                      <p>{faq.answer}</p>
                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-xs text-slate-400">Was this helpful?</span>
                        <button
                          onClick={() => castVote(faqId, 'up')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            vote === 'up'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-800 animate-pulse-once'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:border-emerald-300'
                          }`}
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button
                          onClick={() => castVote(faqId, 'down')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            vote === 'down'
                              ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-950 dark:border-red-800 animate-pulse-once'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-600 hover:border-red-300'
                          }`}
                        >
                          <ThumbsDown size={14} />
                        </button>
                        {vote && (
                          <span className="text-xs text-slate-400">Thanks for the feedback!</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open the FAQ tab.
- Clicking a question opens it; clicking another question now leaves the first one open too (multi-open, unlike the old single-open accordion) — clicking an already-open question still closes just that one.
- "Expand all" opens every FAQ across every category; "Collapse all" closes all of them.
- Inside an open answer, click 👍 — it highlights green with a brief pulse and "Thanks for the feedback!" appears; click 👎 on the same answer — it switches to the red highlight instead (only one vote per FAQ at a time).
- Reload the page — the same vote highlight persists (stored in `localStorage` under `gsb-faq-votes`).
- Filtering via the search box still works and still groups correctly by category.
- Toggle dark mode and confirm all states look correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/FAQView.jsx
git commit -m "feat: add helpful votes and expand/collapse all to FAQView"
```

---

### Task 6: HeroLanding — count-up stats + richer card hover

**Files:**
- Modify: `src/components/HeroLanding.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/HeroLanding.jsx` with:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckSquare, Globe, Book, Home, HelpCircle, ArrowRight, ExternalLink, Sparkles, Users, Star } from 'lucide-react';

const STATS = [
  { label: 'Chapters', value: '29+' },
  { label: 'Checklist Items', value: '16' },
  { label: 'Dictionary Terms', value: '28' },
  { label: 'FAQs Answered', value: '19+' },
];

const QUICK_LINKS = [
  {
    id: 'survival',
    icon: BookOpen,
    title: 'Survival Guide',
    subtitle: '29 chapters covering every aspect of GSB life',
    color: 'from-red-900 to-[#8C1515]',
    badge: 'Main Guide'
  },
  {
    id: 'intl',
    icon: Globe,
    title: 'International Guide',
    subtitle: 'Visas, SSN, CPT, US banking, and settling in',
    color: 'from-slate-800 to-slate-900',
    badge: 'International'
  },
  {
    id: 'checklist',
    icon: CheckSquare,
    title: 'Pre-Arrival Checklist',
    subtitle: 'Interactive task tracker saved in your browser',
    color: 'from-amber-700 to-amber-900',
    badge: 'Action List'
  },
  {
    id: 'dictionary',
    icon: Book,
    title: 'GSB Dictionary',
    subtitle: 'TALK, FOAM, MARRS, LPF, Touchy Feely & more',
    color: 'from-emerald-900 to-emerald-800',
    badge: '28 Terms'
  },
  {
    id: 'housing',
    icon: Home,
    title: 'Housing Explorer',
    subtitle: 'Compare Schwab, JMac, EV, and neighborhoods',
    color: 'from-blue-900 to-blue-800',
    badge: 'Neighborhoods'
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Class FAQs',
    subtitle: 'Common WhatsApp & Slack questions answered',
    color: 'from-purple-900 to-purple-800',
    badge: '19 FAQs'
  }
];

function useCountUp(targetValue, active) {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!active) return;
    const match = String(targetValue).match(/^(\d+)(.*)$/);
    if (!match) {
      setDisplay(targetValue);
      return;
    }
    const [, numStr, suffix] = match;
    const target = parseInt(numStr, 10);
    const duration = 800;
    const startTime = performance.now();
    let frameId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = Math.round(target * progress);
      setDisplay(`${current}${suffix}`);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, targetValue]);

  return display;
}

function StatTile({ stat, active }) {
  const display = useCountUp(stat.value, active);
  return (
    <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="text-2xl sm:text-3xl font-serif font-bold text-[#E9AB17]">{display}</div>
      <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
    </div>
  );
}

export default function HeroLanding({ onNavigate }) {
  const [mounted, setMounted] = useState(false);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)]">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/40 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-800/50 text-red-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles size={12} />
              Stanford GSB · Class of 2026 · Unofficial Guide
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-center text-white leading-tight mb-6">
            The GSB Survival Guide
            <span className="block text-[#E9AB17] mt-1">Interactive Hub</span>
          </h1>

          <p className="text-center text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            The accumulated, road-tested advice of a Stanford GSB class — organized so you don't have to learn everything the hard way. Housing, packing, academics, careers, social life, and Bay Area living.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => onNavigate('survival')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8C1515] hover:bg-red-800 text-white rounded-xl font-semibold text-sm shadow-lg transition-all hover:shadow-red-900/30 hover:shadow-xl hover:-translate-y-0.5"
            >
              <BookOpen size={18} />
              Start Reading the Guide
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('checklist')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all hover:-translate-y-0.5"
            >
              <CheckSquare size={18} />
              Open Pre-Arrival Checklist
            </button>
          </div>

          {/* Stats Strip */}
          <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map((stat) => (
              <StatTile key={stat.label} stat={stat} active={statsInView} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-4">
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white text-center mb-8">
          What do you need today?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="group text-left p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 hover:border-[#8C1515] dark:hover:border-red-700"
              >
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${link.color} text-white mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}>
                  <Icon size={22} />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-serif font-bold text-slate-900 dark:text-white text-lg group-hover:text-[#8C1515] dark:group-hover:text-red-400 transition-colors">
                    {link.title}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                    {link.badge}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {link.subtitle}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#8C1515] dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attribution */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star size={16} className="text-[#E9AB17]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">About this guide</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Developed by <strong>Nikhil Jain (MBA Class of 2026)</strong> with contributions from dozens of classmates, and material drawn from the International Student Handbook by the{' '}
            <strong>GSB Student Association International Committee</strong>.
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-3">
            Unofficial, student-created resource. Not endorsed by Stanford University or the Graduate School of Business.
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open the Home tab (reload the page to reset scroll position first).
- On page load, before scrolling, the stats strip shows `0`, `0`, `0`, `0` (or, if the strip is already in the initial viewport at your screen size, it should count up immediately on load rather than sitting at 0).
- Scroll down until the stats strip enters view — each number counts up from 0 to its target (`29+`, `16`, `28`, `19+`) over well under a second, then holds.
- Scroll away and back — the numbers stay at their final values (no re-triggering).
- Hover a quick-link card — the icon now scales up and rotates slightly in addition to the existing card lift/border-color change.
- Toggle dark mode and confirm everything still looks correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroLanding.jsx
git commit -m "feat: add count-up stats and richer card hover to HeroLanding"
```

---

### Task 7: ChecklistTracker — category progress rings

**Files:**
- Modify: `src/components/ChecklistTracker.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/ChecklistTracker.jsx` with:

```jsx
import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, RotateCcw, Plus, Sparkles, Filter, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

function ProgressRing({ percent, size = 20, trackClassName = 'text-slate-300 dark:text-slate-700', fillClassName = 'text-[#8C1515] dark:text-red-400' }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={trackClassName} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`${fillClassName} transition-all duration-300`}
      />
    </svg>
  );
}

export default function ChecklistTracker({ initialItems }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('gsb-checklist-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialItems;
      }
    }
    return initialItems;
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [newTaskText, setNewTaskText] = useState('');

  useEffect(() => {
    localStorage.setItem('gsb-checklist-state', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, defaultChecked: !item.defaultChecked } : item));
      
      const totalChecked = next.filter((i) => i.defaultChecked).length;
      if (totalChecked === next.length && next.length > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      return next;
    });
  };

  const resetChecklist = () => {
    if (window.confirm('Reset all checklist items to incomplete?')) {
      const reseted = items.map((item) => ({ ...item, defaultChecked: false }));
      setItems(reseted);
    }
  };

  const addCustomTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      category: 'Personal Tasks',
      task: newTaskText.trim(),
      defaultChecked: false
    };
    setItems([newItem, ...items]);
    setNewTaskText('');
  };

  const categories = ['All', ...new Set(items.map((i) => i.category))];
  const filteredItems = activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  const completedCount = items.filter((i) => i.defaultChecked).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const categoryPercent = (cat) => {
    const catItems = cat === 'All' ? items : items.filter((i) => i.category === cat);
    if (catItems.length === 0) return 0;
    const done = catItems.filter((i) => i.defaultChecked).length;
    return Math.round((done / catItems.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-950 via-[#8C1515] to-amber-700 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-amber-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                Action Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold">
              Before-You-Arrive Checklist
            </h1>
            <p className="text-red-100 text-sm mt-1">
              Track essential prep tasks before stepping onto campus. Saved in your browser.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[180px] text-center">
            <div className="text-3xl font-bold font-serif">{progressPercent}%</div>
            <div className="text-xs text-red-200 mt-1">{completedCount} of {items.length} completed</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/30 h-2.5 rounded-full mt-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-amber-200 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-slate-400 mr-1" />
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const pct = categoryPercent(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#8C1515] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <ProgressRing
                    percent={pct}
                    trackClassName={isActive ? 'text-white/30' : 'text-slate-300 dark:text-slate-700'}
                    fillClassName={isActive ? 'text-white' : 'text-[#8C1515] dark:text-red-400'}
                  />
                  {cat}
                </button>
              );
            })}
          </div>

          <button
            onClick={resetChecklist}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 transition-colors"
          >
            <RotateCcw size={14} />
            Reset Progress
          </button>
        </div>

        {/* Add custom task */}
        <form onSubmit={addCustomTask} className="flex gap-2">
          <input
            type="text"
            placeholder="Add your own custom task (e.g., Book flight to SF)..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8C1515]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#8C1515] text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors flex items-center gap-1"
          >
            <Plus size={16} />
            Add Task
          </button>
        </form>

        {/* Checklist items */}
        <div className="space-y-3 pt-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                item.defaultChecked
                  ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-slate-500 line-through'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div
                className={`custom-checkbox mt-0.5 ${item.defaultChecked ? 'checked' : ''}`}
              >
                {item.defaultChecked && <CheckSquare size={14} />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {item.category}
                  </span>
                </div>
                <p className="text-sm font-medium">{item.task}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, open the Checklist tab.
- Each category filter chip (including "All") now shows a small ring next to its label, filled proportionally to that category's completion percentage.
- Check off an item — its category's ring (and "All"'s ring) fills further; the ring on the active (red-background) chip renders in white instead of red so it stays visible against the red background.
- Reset Progress — all rings return to empty.
- Add a custom task — it lands in a new "Personal Tasks" category chip with its own ring, starting empty.
- Toggle dark mode and confirm the rings are visible in both themes.

- [ ] **Step 4: Commit**

```bash
git add src/components/ChecklistTracker.jsx
git commit -m "feat: add category progress rings to ChecklistTracker"
```

---

## Final Integration Check

After all 7 tasks are committed:

- [ ] **Run the full production build** (this also re-runs the markdown-to-JSON parse step, exercising the whole pipeline):

```bash
npm run build
```
Expected: succeeds with no errors, `dist/` is regenerated.

- [ ] **Smoke-test the production build**:

```bash
npm run preview
```
Open the printed local URL and click through all six tabs (Home, Survival Guide, International Guide, Checklist, Dictionary, Housing, FAQ) in both light and dark mode, confirming every feature from Tasks 1–7 still works against the production build, not just the dev server.
