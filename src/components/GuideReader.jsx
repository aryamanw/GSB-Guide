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
