# Interactive Delight Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn five existing views (GuideReader, HousingExplorer, FAQView, HeroLanding, ChecklistTracker) from static prose/cards into components with functional widgets and playful, action-responsive micro-interactions, in the shipped warm/restrained design language.

**Architecture:** Each task modifies exactly one existing component file in place (plus small additions to `src/index.css` and one new shared hook). No new shared state in `App.jsx`, no new props between components, no new data files — every feature is self-contained within the component it touches. Task 1 is a shared prerequisite (hook + keyframe); Tasks 2–6 are independent.

**Tech Stack:** React 19 (function components + hooks), Tailwind CSS (utility classes, `dark:` variant), `lucide-react` icons, `canvas-confetti` (existing dep, already used by ChecklistTracker), Vite. No test framework exists in this repo.

**Spec:** [docs/superpowers/specs/2026-08-20-interactive-delight-design.md](../specs/2026-08-20-interactive-delight-design.md)

## Global Constraints

- No new data files or content authoring beyond inline `tags` fields added to `HousingExplorer`'s own component-local JS literals (not the JSON files under `src/data/`).
- No backend. Anything persisted uses `localStorage`, following the existing key pattern (`gsb-theme`, `gsb-bookmarks`, `gsb-checklist-state`) — this plan adds `gsb-faq-votes`.
- Match the shipped design language: stone neutrals carry surfaces, Warmed Cardinal (`cardinal-600` `#a0432a`) is the one accent, Warmed Gold is a narrow supporting role (housing filter ring only), Inter everywhere, flat bordered cards, dark mode via the `.dark` class.
- **Reduced motion:** all new motion respects `prefers-reduced-motion`. The existing gate in `src/index.css` already covers `animate-fade-in` / `animate-slide-in-right` / `.interactive-card`; new additions follow the same pattern.
- **No test framework exists in this codebase.** Every task substitutes: (1) `npx vite build` as a compile-correctness gate, and (2) a manual verification pass via `npm run dev` in both light and dark mode, per the spec's Testing section. Do not invent a test runner.
- No new npm dependencies.

---

### Task 1: Shared foundation — `useCountUp` hook + `pulse-once` keyframe

**Files:**
- Create: `src/hooks/useCountUp.js`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `useCountUp(target, duration = 800)` hook — returns `[ref, value]` where `ref` must be attached to the element that triggers the count-up on first scroll-into-view and `value` is the animated integer. Consumed by Task 5 (HeroLanding). Also produces the `animate-pulse-once` CSS class. Consumed by Task 4 (FAQView).

- [ ] **Step 1: Create the `useCountUp` hook**

Create `src/hooks/useCountUp.js`:

```js
import { useEffect, useRef, useState } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const animate = () => {
      const startTime = performance.now();
      const step = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    const el = ref.current;
    if (!el) {
      animate();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, value];
}
```

- [ ] **Step 2: Add the `pulse-once` keyframe to `index.css`**

Append to the end of `src/index.css`, inside the existing animations block (after the `.animate-slide-in-right` rule at the end of the file, before the final `@media (prefers-reduced-motion: reduce)` block is fine — but the keyframe and class must be added *outside* any reduced-motion block, and the animation must be *disabled* inside the reduced-motion block):

Add these two rules after `.animate-slide-in-right { ... }`:

```css
@keyframes pulse-once {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.animate-pulse-once {
  animation: pulse-once 0.4s ease-out;
}
```

Then add `.animate-pulse-once` to the reduced-motion disable list inside the existing `@media (prefers-reduced-motion: reduce)` block, so it becomes:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-slide-in-right,
  .animate-pulse-once {
    animation: none;
  }

  body {
    transition: none;
  }

  .interactive-card,
  .glass-header {
    transition: none;
  }
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCountUp.js src/index.css
git commit -m "feat: add useCountUp hook and pulse-once animation utility"
```

---

### Task 2: GuideReader — scroll progress, collapsible subsections, prev/next nav

**Files:**
- Modify: `src/components/GuideReader.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/GuideReader.jsx` with:

```jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bookmark, Share2, Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Clock, BookOpen, Layers } from 'lucide-react';

function ScrollProgressBar({ percent }) {
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-stone-200/60 dark:bg-stone-800/60" aria-hidden="true">
      <div className="h-full bg-cardinal-600" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function GuideReader({ data, isIntl = false, bookmarkedIds, onToggleBookmark }) {
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [tocOpenMobile, setTocOpenMobile] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expandedSubs, setExpandedSubs] = useState(new Set());
  const articleRef = useRef(null);

  // Set default active chapter
  useEffect(() => {
    if (data && data.length > 0) {
      if (isIntl) {
        setSelectedChapterId(data[0].id);
      } else if (data[0].chapters && data[0].chapters.length > 0) {
        setSelectedChapterId(data[0].chapters[0].id);
      }
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

  // Seed collapsible subsections whenever the active chapter changes.
  // Chapters with 3+ titled subsections open only the first; shorter
  // chapters open all — avoids an awkward fully-collapsed first load.
  useEffect(() => {
    if (isIntl) return;
    const subs = activeChapter?.subsections || [];
    const titled = subs.filter((s) => s.title && s.title !== activeChapter.title);
    if (titled.length >= 3) {
      setExpandedSubs(new Set([titled[0].id]));
    } else {
      setExpandedSubs(new Set(titled.map((s) => s.id)));
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
    navigator.clipboard.writeText(url).catch(() => {});
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
        <div className="bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 mb-8">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400 mb-3">
              GSB Student Association International Committee
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-3">
              International Students Guide
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
              Essential guide on visas, US banking, drivers licenses, tax filings (Form 8843), CPT, SSN, mobile setup, and settling into Palo Alto.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar TOC */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="sticky top-24 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-3">
                <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-cardinal-600" />
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
                          ? 'bg-cardinal-50 dark:bg-cardinal-950/60 text-cardinal-700 dark:text-cardinal-400 font-semibold'
                          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60'
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
              <article ref={articleRef} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                      {activeSection.title}
                    </h2>
                    <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {calculateReadingTime(activeSection.body)} min read
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBookmark(activeSection.id, activeSection.title)}
                      className={`size-11 flex items-center justify-center rounded-lg border active:scale-95 transition-all ${
                        bookmarkedIds.includes(activeSection.id)
                          ? 'bg-cardinal-50 border-cardinal-200 text-cardinal-600 dark:bg-cardinal-950 dark:border-cardinal-800 dark:text-cardinal-300'
                          : 'border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800'
                      }`}
                      title="Bookmark section"
                      aria-label={bookmarkedIds.includes(activeSection.id) ? 'Remove bookmark' : 'Bookmark section'}
                    >
                      <Bookmark size={18} fill={bookmarkedIds.includes(activeSection.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => copyPermalink(activeSection.id)}
                      className="size-11 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800 active:scale-95 transition-all"
                      title="Copy permalink"
                      aria-label="Copy permalink"
                    >
                      {copiedId === activeSection.id ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                    </button>
                  </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {activeSection.body}
                </div>

                {/* Prev/Next Section Nav */}
                <div className="flex items-center justify-between pt-6 border-t border-stone-200 dark:border-stone-800">
                  <button
                    onClick={() => goToAdjacentSection(-1)}
                    disabled={sectionIdx <= 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-[0.97] transition-all"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => goToAdjacentSection(1)}
                    disabled={sectionIdx === -1 || sectionIdx >= data.length - 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-[0.97] transition-all"
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
      <div className="bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 mb-8">
        <div className="max-w-3xl">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400 mb-3">
            Nikhil Jain (MBA '26) & GSB Community
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-3">
            The Stanford GSB Unofficial Survival Guide
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base leading-relaxed">
            The accumulated, road-tested advice of GSB students: housing, packing, academics, MARRS bidding, career playbooks, social traditions, and Bay Area life.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="sticky top-24 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-stone-900 dark:text-white flex items-center gap-2 pb-3 border-b border-stone-200 dark:border-stone-800 mb-3 text-sm">
              <BookOpen size={16} className="text-cardinal-600" />
              Parts & Chapters
            </h3>

            <div className="space-y-4">
              {data.map((part, pIdx) => (
                <div key={part.id || pIdx} className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-2 py-1">
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
                            ? 'bg-cardinal-50 dark:bg-cardinal-950/60 text-cardinal-700 dark:text-cardinal-400 font-semibold'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60'
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
            <article ref={articleRef} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 space-y-8">

              {/* Chapter Header */}
              <div className="border-b border-stone-200 dark:border-stone-800 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-cardinal-600 dark:text-cardinal-400">
                      {activePart?.title}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mt-1">
                      {activeChapter.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleBookmark(activeChapter.id, activeChapter.title)}
                      className={`size-11 flex items-center justify-center rounded-lg border active:scale-95 transition-all ${
                        bookmarkedIds.includes(activeChapter.id)
                          ? 'bg-cardinal-50 border-cardinal-200 text-cardinal-600 dark:bg-cardinal-950 dark:border-cardinal-800 dark:text-cardinal-300'
                          : 'border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800'
                      }`}
                      title="Bookmark chapter"
                      aria-label={bookmarkedIds.includes(activeChapter.id) ? 'Remove bookmark' : 'Bookmark chapter'}
                    >
                      <Bookmark size={18} fill={bookmarkedIds.includes(activeChapter.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => copyPermalink(activeChapter.id)}
                      className="size-11 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-800 active:scale-95 transition-all"
                      title="Copy permalink"
                      aria-label="Copy permalink"
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
                          aria-expanded={isOpen}
                          className="w-full flex items-center justify-between gap-2 text-left group"
                        >
                          <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cardinal-600"></span>
                            {sub.title}
                          </h3>
                          {isOpen ? (
                            <ChevronUp size={18} className="text-stone-400 group-hover:text-cardinal-600 transition-colors shrink-0" />
                          ) : (
                            <ChevronDown size={18} className="text-stone-400 group-hover:text-cardinal-600 transition-colors shrink-0" />
                          )}
                        </button>
                      )}
                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="prose prose-slate dark:prose-invert max-w-none text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                            {sub.body}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* Prev/Next Chapter Nav */}
              <div className="flex items-center justify-between pt-6 border-t border-stone-200 dark:border-stone-800">
                <button
                  onClick={() => goToAdjacentChapter(-1)}
                  disabled={chapterIdx <= 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-[0.97] transition-all"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  onClick={() => goToAdjacentChapter(1)}
                  disabled={chapterIdx === -1 || chapterIdx >= flatChapters.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent active:scale-[0.97] transition-all"
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
- A thin cardinal progress bar should appear fixed at the top of the viewport and fill as you scroll down a long chapter (try a chapter with several subsections, e.g. anything under "Housing"). Switching to a new chapter resets the bar to empty.
- Any chapter with 3+ titled subsections should load with only the first expanded; clicking a collapsed subsection's heading expands it (chevron flips down→up, body slides open); clicking again collapses it. Chapters with fewer than 3 titled subsections load fully expanded.
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
- Modify: `src/index.css` (add `opacity` to the `.interactive-card` transition so dimming animates)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/HousingExplorer.jsx` with:

```jsx
import React, { useState } from 'react';
import { Home, MapPin, CheckCircle2, DollarSign, Users, VolumeX, Heart, Filter } from 'lucide-react';

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
    return (tags || []).some((t) => activePriorities.has(t));
  };

  const onCampusOptions = [
    {
      name: "Schwab Residential Center",
      type: "On-Campus (GSB)",
      img: "https://picsum.photos/seed/gsb-schwab-residence/640/360",
      target: "Single MBA1s",
      vibe: "The primary hub of MBA1 social life. Studio rooms with private bathrooms, shared micro-kitchens per floor.",
      perks: ["Steps from KMC classrooms", "High density of MBA1 classmates", "Front desk package handling"],
      tag: "Top Choice for Single MBA1s",
      tags: ["budget-friendly", "social"]
    },
    {
      name: "Jack McDonald Hall (JMac)",
      type: "On-Campus (GSB)",
      img: "https://picsum.photos/seed/gsb-jmac-hall/640/360",
      target: "Single MBA1s / MBA2s",
      vibe: "Modern residential building adjacent to Schwab with apartment-style layouts and central courtyards.",
      perks: ["Newer construction", "Spacious interior courtyards", "Immediate proximity to Knight Center"],
      tag: "Popular On-Campus Option",
      tags: ["social"]
    },
    {
      name: "Escondido Village (EV Mid-Rises / High-Rises)",
      type: "On-Campus (Stanford)",
      img: "https://picsum.photos/seed/gsb-escondido-village/640/360",
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
      img: "https://picsum.photos/seed/gsb-palo-alto-university-ave/640/360",
      vibe: "Vibrant urban strip with top restaurants, coffee shops, boutiques, and Caltrain station access.",
      target: "Students wanting walkable nightlife and dining",
      tag: "Prime Off-Campus",
      tags: ["social"]
    },
    {
      name: "Menlo Park",
      dist: "10-15 min bike",
      img: "https://picsum.photos/seed/gsb-menlo-park/640/360",
      vibe: "Quiet, leafy residential suburb immediately north of campus. Great restaurants on Santa Cruz Ave.",
      target: "Students seeking peaceful residential living",
      tag: "Quiet & Convenient",
      tags: ["quiet", "family"]
    },
    {
      name: "Mountain View / Sunnyvale",
      dist: "15-20 min drive",
      img: "https://picsum.photos/seed/gsb-mountain-view/640/360",
      vibe: "Tech hub neighborhood with diverse dining (Castro St), easy 101/280 access, and cheaper rent.",
      target: "Budget-conscious students or tech partners",
      tag: "Budget Friendly",
      tags: ["budget-friendly"]
    },
    {
      name: "San Francisco (SoMa / Mission)",
      dist: "45-60 min Caltrain / drive",
      img: "https://picsum.photos/seed/gsb-san-francisco/640/360",
      vibe: "Big city energy, tech ecosystem events, world-class dining. Requires commuting for campus classes.",
      target: "MBA2s or students with SF-based partners",
      tag: "City Living",
      tags: ["social"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Home size={18} className="text-cardinal-600 dark:text-cardinal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400">
              Chapter 3 & International Guide
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-2">
            Stanford GSB Housing & Neighborhood Explorer
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Compare GSB Residences (Schwab, JMac), Stanford Escondido Village (EV), and Palo Alto off-campus neighborhood options.
          </p>
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex justify-center border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="inline-flex bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl gap-2">
          <button
            onClick={() => setActiveTab('on-campus')}
            className={`px-5 py-3 rounded-lg text-sm font-semibold active:scale-[0.97] transition-all ${
              activeTab === 'on-campus'
                ? 'bg-cardinal-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            On-Campus Residences
          </button>
          <button
            onClick={() => setActiveTab('off-campus')}
            className={`px-5 py-3 rounded-lg text-sm font-semibold active:scale-[0.97] transition-all ${
              activeTab === 'off-campus'
                ? 'bg-cardinal-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Off-Campus Neighborhoods
          </button>
        </div>
      </div>

      {/* Priority Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 mr-1">
          <Filter size={14} />
          Filter by priority
        </span>
        {PRIORITIES.map(({ key, label, icon: Icon }) => {
          const isActive = activePriorities.has(key);
          return (
            <button
              key={key}
              onClick={() => togglePriority(key)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                isActive
                  ? 'bg-cardinal-600 border-cardinal-600 text-white scale-105 shadow-sm'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-cardinal-600 hover:text-cardinal-600'
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
                className={`interactive-card bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col justify-between space-y-4 transition-all duration-200 ${
                  activePriorities.size > 0 && !matched ? 'opacity-50' : ''
                } ${activePriorities.size > 0 && matched ? 'ring-2 ring-gold-400' : ''}`}
              >
                <img
                  src={opt.img}
                  alt={`${opt.name} exterior`}
                  loading="lazy"
                  className="w-full aspect-[16/9] object-cover"
                />
                <div className="px-6 pb-6 flex flex-col justify-between gap-4 flex-1">
                  <div>
                    <span className="badge badge-cardinal mb-3">{opt.tag}</span>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white mt-1">
                      {opt.name}
                    </h3>
                    <p className="text-xs text-cardinal-600 dark:text-cardinal-400 font-medium mt-1">
                      Target: {opt.target}
                    </p>
                    <p className="text-stone-600 dark:text-stone-300 text-sm mt-3 leading-relaxed">
                      {opt.vibe}
                    </p>
                  </div>

                  <div className="border-t border-stone-100 dark:border-stone-800/80 pt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Highlights</h4>
                    {opt.perks.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
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
                className={`interactive-card bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden space-y-4 transition-all duration-200 ${
                  activePriorities.size > 0 && !matched ? 'opacity-50' : ''
                } ${activePriorities.size > 0 && matched ? 'ring-2 ring-gold-400' : ''}`}
              >
                <img
                  src={n.img}
                  alt={`${n.name} neighborhood`}
                  loading="lazy"
                  className="w-full aspect-[16/9] object-cover"
                />
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-gold">{n.tag}</span>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                      <MapPin size={14} className="text-cardinal-600 dark:text-cardinal-400" />
                      {n.dist}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                      {n.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
                      Ideal for: {n.target}
                    </p>
                    <p className="text-stone-600 dark:text-stone-300 text-sm mt-3 leading-relaxed">
                      {n.vibe}
                    </p>
                  </div>
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

- [ ] **Step 2: Add `opacity` to the `.interactive-card` transition**

In `src/index.css`, change the `.interactive-card` rule from:

```css
.interactive-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
```

to:

```css
.interactive-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, open the Housing Explorer tab.
- With no priority chip active, all cards are full-opacity, no ring — identical to current behavior.
- Click "Budget-friendly" — Schwab, EV, and Mountain View/Sunnyvale get a gold ring and stay full-opacity; JMac, Downtown Palo Alto, Menlo Park, and SF dim to half-opacity (dimming fades in smoothly).
- Click "Social" in addition — cards matching *either* Budget-friendly or Social now stay highlighted (OR semantics), more cards un-dim.
- Deselect all chips — all cards return to normal.
- Switch between "On-Campus" and "Off-Campus" tabs with a priority active — the filter still applies on the new tab.
- Toggle dark mode and confirm the dim/ring states still read correctly.

- [ ] **Step 5: Commit**

```bash
git add src/components/HousingExplorer.jsx src/index.css
git commit -m "feat: add priority filter chips to HousingExplorer"
```

---

### Task 4: FAQView — helpful votes + expand/collapse all

**Files:**
- Modify: `src/components/FAQView.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: `animate-pulse-once` utility class from Task 1.
- Produces: nothing consumed by other tasks.
- Note: this task changes the accordion from single-open (`openId` string) to multi-open (`openIds` Set) to support "Expand all" — a spec-approved behavior change.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/FAQView.jsx` with:

```jsx
import React, { useState, useMemo, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare, ThumbsUp, ThumbsDown, ChevronsDown, ChevronsUp, Check } from 'lucide-react';

const VOTES_KEY = 'gsb-faq-votes';

export default function FAQView({ faqs }) {
  const [openIds, setOpenIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [votes, setVotes] = useState(() => {
    try {
      const saved = localStorage.getItem(VOTES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [voteAck, setVoteAck] = useState(null);

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

  const allQuestions = useMemo(
    () => groups.flatMap(([, items]) => items.map((f) => f.question)),
    [groups]
  );

  const toggleFaq = (question) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });
  };

  const expandAll = () => setOpenIds(new Set(allQuestions));
  const collapseAll = () => setOpenIds(new Set());

  const castVote = (question, direction) => {
    const current = votes[question];
    const next = { ...votes };
    if (current === direction) {
      delete next[question];
    } else {
      next[question] = direction;
    }
    setVotes(next);
    localStorage.setItem(VOTES_KEY, JSON.stringify(next));
    setVoteAck(current === direction ? null : question);
  };

  useEffect(() => {
    if (!voteAck) return;
    const t = setTimeout(() => setVoteAck(null), 1600);
    return () => clearTimeout(t);
  }, [voteAck]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={18} className="text-cardinal-600 dark:text-cardinal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400">
              Class Chat Quick Answers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-2">
            Classmate FAQs & Quick Answers
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Direct answers to the most frequently asked questions on WhatsApp and Slack: cars, health insurance, student ID, pets, and course bidding.
          </p>
        </div>
      </div>

      {/* Search Bar + Expand/Collapse All */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="relative max-w-xl w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Filter FAQs (e.g. car, Cardinal Care, ID card, pets)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cardinal-600 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-cardinal-600 hover:text-cardinal-600 active:scale-[0.97] transition-all"
            title="Expand all"
          >
            <ChevronsDown size={16} />
            Expand all
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-cardinal-600 hover:text-cardinal-600 active:scale-[0.97] transition-all"
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400 px-1">
              {category}
            </h2>
            {items.map((faq) => {
              const isOpen = openIds.has(faq.question);
              return (
                <div
                  key={faq.question}
                  className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(faq.question)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                  >
                    <span className="font-semibold text-stone-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                      <MessageSquare size={18} className="text-cardinal-600 dark:text-cardinal-400 shrink-0" />
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-stone-400 shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-stone-400 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-stone-600 dark:text-stone-300 text-sm leading-relaxed border-t border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-950/40">
                      {faq.answer}

                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs text-stone-500 dark:text-stone-400">Was this helpful?</span>
                        <button
                          onClick={() => castVote(faq.question, 'up')}
                          aria-pressed={votes[faq.question] === 'up'}
                          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                            votes[faq.question] === 'up'
                              ? 'bg-cardinal-50 border-cardinal-200 text-cardinal-700 dark:bg-cardinal-950 dark:border-cardinal-800 dark:text-cardinal-300'
                              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-cardinal-600'
                          }`}
                        >
                          <ThumbsUp size={14} />
                          Helpful
                        </button>
                        <button
                          onClick={() => castVote(faq.question, 'down')}
                          aria-pressed={votes[faq.question] === 'down'}
                          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                            votes[faq.question] === 'down'
                              ? 'bg-cardinal-50 border-cardinal-200 text-cardinal-700 dark:bg-cardinal-950 dark:border-cardinal-800 dark:text-cardinal-300'
                              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-cardinal-600'
                          }`}
                        >
                          <ThumbsDown size={14} />
                          Not helpful
                        </button>
                        {voteAck === faq.question && (
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-pulse-once">
                            <Check size={14} />
                            Thanks — noted
                          </span>
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

      {groups.length === 0 && (
        <div className="text-center py-12 text-stone-500 dark:text-stone-400">
          No matching FAQs found for "{search}". Try a different keyword.
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

Run: `npm run dev`, open the FAQs tab.
- Open an answer — it stays open while another answer is opened (multi-open).
- Click 👍 on an answer — the button fills with the cardinal tint, the "Thanks — noted" chip pulses once and fades; reload the page and the vote is still applied (localStorage).
- Click 👍 again — the vote clears and the button returns to its unfilled state.
- Click "Expand all" — every visible answer opens; "Collapse all" closes them all; individual toggle still works per-item.
- Type in the search box — filters the list; expand/collapse-all operate on the currently filtered set.
- Toggle dark mode and confirm the vote buttons and acknowledgments read correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/FAQView.jsx
git commit -m "feat: add helpful votes and expand/collapse-all to FAQView"
```

---

### Task 5: HeroLanding — count-up stats + richer card hover

**Files:**
- Modify: `src/components/HeroLanding.jsx` (full-file rewrite)

**Interfaces:**
- Consumes: `useCountUp(target, duration = 800)` from Task 1 — returns `[ref, value]`.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/HeroLanding.jsx` with:

```jsx
import React from 'react';
import { BookOpen, CheckSquare, Globe, Book, Home, HelpCircle, ArrowRight } from 'lucide-react';
import useCountUp from '../hooks/useCountUp';

const STATS = [
  { label: 'Chapters', value: 29, suffix: '+' },
  { label: 'Checklist Items', value: 16, suffix: '' },
  { label: 'Dictionary Terms', value: 28, suffix: '' },
  { label: 'FAQs Answered', value: 19, suffix: '+' },
];

const QUICK_LINKS = [
  {
    id: 'survival',
    icon: BookOpen,
    title: 'Survival Guide',
    subtitle: '29 chapters covering every aspect of GSB life',
    badge: 'Main Guide'
  },
  {
    id: 'intl',
    icon: Globe,
    title: 'International Guide',
    subtitle: 'Visas, SSN, CPT, US banking, and settling in',
    badge: 'International'
  },
  {
    id: 'checklist',
    icon: CheckSquare,
    title: 'Pre-Arrival Checklist',
    subtitle: 'Interactive task tracker saved in your browser',
    badge: 'Action List'
  },
  {
    id: 'dictionary',
    icon: Book,
    title: 'GSB Dictionary',
    subtitle: 'TALK, FOAM, MARRS, LPF, Touchy Feely & more',
    badge: '28 Terms'
  },
  {
    id: 'housing',
    icon: Home,
    title: 'Housing Explorer',
    subtitle: 'Compare Schwab, JMac, EV, and neighborhoods',
    badge: 'Neighborhoods'
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Class FAQs',
    subtitle: 'Common WhatsApp & Slack questions answered',
    badge: '19 FAQs'
  }
];

function StatCounter({ value, suffix, label }) {
  const [ref, count] = useCountUp(value);
  return (
    <div ref={ref} className="flex-1 text-center px-2">
      <div className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
        {count}
        {suffix}
      </div>
      <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function HeroLanding({ onNavigate }) {
  return (
    <div>
      {/* Hero Section - flat, warm, restrained. No gradient theater. */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-14 sm:pt-20 sm:pb-16">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-stone-900 dark:text-white leading-tight mb-5">
            The GSB Survival Guide, in one place
          </h1>

          <p className="text-center text-stone-600 dark:text-stone-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Road-tested advice from a GSB class: housing, packing, academics, careers, social life, and Bay Area living.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => onNavigate('survival')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cardinal-600 hover:bg-cardinal-700 active:scale-[0.97] text-white rounded-lg font-semibold text-sm transition-all"
            >
              <BookOpen size={18} />
              Start Reading the Guide
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('checklist')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-stone-100 dark:hover:bg-stone-900 active:scale-[0.97] text-stone-700 dark:text-stone-300 rounded-lg font-semibold text-sm border border-stone-300 dark:border-stone-700 transition-all"
            >
              <CheckSquare size={18} />
              Open Pre-Arrival Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Stats - a plain divided row below the hero, not a card grid */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center divide-x divide-stone-200 dark:divide-stone-800">
            {STATS.map((stat) => (
              <StatCounter
                key={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links Grid - one consistent treatment, not six competing colors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white text-center mb-8">
          What do you need today?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="group text-left p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-cardinal-300 dark:hover:border-cardinal-800 hover:shadow-sm transition-all duration-200"
              >
                <div className="inline-flex p-2.5 rounded-lg bg-cardinal-50 dark:bg-cardinal-950/50 text-cardinal-600 dark:text-cardinal-400 mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-200">
                  <Icon size={22} />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 dark:text-white text-lg group-hover:text-cardinal-600 dark:group-hover:text-cardinal-400 transition-colors">
                    {link.title}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full">
                    {link.badge}
                  </span>
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                  {link.subtitle}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cardinal-600 dark:text-cardinal-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200">
                  Open <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attribution */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-stone-100 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Developed by <strong>Nikhil Jain (MBA Class of 2026)</strong> with contributions from dozens of classmates, and material drawn from the International Student Handbook by the{' '}
            <strong>GSB Student Association International Committee</strong>.
          </p>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-3">
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

Run: `npm run dev`, open the app's Home tab.
- Scroll down so the stats row enters the viewport — the numbers count up from 0 to their targets over ~800ms with an ease-out curve, `29+` / `19+` keeping their `+` suffix.
- Scroll back up and down repeatedly — the count-up fires exactly once and never re-triggers.
- In macOS System Settings → Accessibility → Display → "Reduce motion" on, reload — the stats render at their final values immediately (no count-up).
- Hover a quick-link card — the icon tile scales up and rotates slightly; the "Open →" affordance fades in and slides right; the card lifts and its border warms.
- Toggle dark mode and confirm stats and hover states read correctly.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroLanding.jsx
git commit -m "feat: add count-up stats and icon hover polish to HeroLanding"
```

---

### Task 6: ChecklistTracker — category progress rings

**Files:**
- Modify: `src/components/ChecklistTracker.jsx` (full-file rewrite)
- Modify: `src/index.css` (add `.progress-ring` transition + reduced-motion override)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Add the progress-ring CSS to `index.css`**

Append to the end of `src/index.css` (after the final reduced-motion block):

```css
/* Category progress rings in the checklist: the stroke animates as items toggle. */
.progress-ring circle {
  transition: stroke-dashoffset 0.5s ease;
}

@media (prefers-reduced-motion: reduce) {
  .progress-ring circle {
    transition: none;
  }
}
```

- [ ] **Step 2: Rewrite the component**

Replace the full contents of `src/components/ChecklistTracker.jsx` with:

```jsx
import React, { useState, useEffect } from 'react';
import { CheckSquare, RotateCcw, Plus, Sparkles, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

function ProgressRing({ percent }) {
  const r = 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="progress-ring shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r={r} fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 10 10)"
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

  const categoryCompletion = {};
  for (const cat of categories) {
    if (cat === 'All') continue;
    const catItems = items.filter((i) => i.category === cat);
    const done = catItems.filter((i) => i.defaultChecked).length;
    categoryCompletion[cat] = catItems.length ? Math.round((done / catItems.length) * 100) : 0;
  }

  const ringPercent = (cat) => (cat === 'All' ? progressPercent : categoryCompletion[cat]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Banner */}
      <div className="bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-gold-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400">
                Action Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
              Before-You-Arrive Checklist
            </h1>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
              Track essential prep tasks before stepping onto campus. Saved in your browser.
            </p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <div className="text-3xl font-bold text-cardinal-600 dark:text-cardinal-400">{progressPercent}%</div>
            <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">{completedCount} of {items.length} completed</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full mt-6 overflow-hidden">
          <div
            className="bg-cardinal-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-6">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-stone-400 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold active:scale-[0.97] transition-all flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-cardinal-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                <ProgressRing percent={ringPercent(cat)} />
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={resetChecklist}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-cardinal-600 dark:text-stone-400 transition-colors"
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
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cardinal-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cardinal-600 text-white text-sm font-medium rounded-lg hover:bg-cardinal-700 active:scale-[0.97] transition-all flex items-center gap-1"
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
                  ? 'bg-cardinal-50/40 dark:bg-cardinal-950/20 border-cardinal-200 dark:border-cardinal-900/40 text-stone-500 line-through'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-cardinal-300 text-stone-800 dark:text-stone-200'
              }`}
            >
              <div
                className={`custom-checkbox mt-0.5 ${item.defaultChecked ? 'checked' : ''}`}
              >
                {item.defaultChecked && <CheckSquare size={14} />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
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

- [ ] **Step 3: Verify the build compiles**

Run: `npx vite build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm run dev`, open the Checklist tab.
- Each category chip shows a small ring; with nothing checked all rings are empty, with everything checked all are full.
- Toggle items in one category — that category's ring fills/empties with a smooth stroke animation; the "All" ring reflects overall progress and matches the big percentage in the banner.
- Custom tasks land in "Personal Tasks" and their ring reflects them too.
- Confirm rings adapt to chip state: on the active (cardinal-filled) chip the ring renders white; on inactive chips it renders stone — both legible in light and dark mode.
- With macOS "Reduce motion" enabled, the rings snap instead of animating.

- [ ] **Step 5: Commit**

```bash
git add src/components/ChecklistTracker.jsx src/index.css
git commit -m "feat: add per-category progress rings to ChecklistTracker"
```