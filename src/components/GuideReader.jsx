import React, { useState, useEffect } from 'react';
import { Bookmark, Share2, Copy, Check, ChevronRight, ChevronDown, Clock, BookOpen, Layers } from 'lucide-react';

export default function GuideReader({ data, isIntl = false, bookmarkedIds, onToggleBookmark }) {
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [tocOpenMobile, setTocOpenMobile] = useState(false);

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

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <article className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-6">
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
              </article>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Render Survival Guide Layout
  let activeChapter = null;
  let activePart = null;

  for (const p of data || []) {
    for (const c of p.chapters || []) {
      if (c.id === selectedChapterId) {
        activeChapter = c;
        activePart = p;
        break;
      }
    }
  }

  if (!activeChapter && data && data.length > 0 && data[0].chapters.length > 0) {
    activeChapter = data[0].chapters[0];
    activePart = data[0];
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <article className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8">
              
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
                {activeChapter.subsections.map((sub) => (
                  <section key={sub.id} id={sub.id} className="space-y-3">
                    {sub.title && sub.title !== activeChapter.title && (
                      <h3 className="text-xl font-serif font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#8C1515]"></span>
                        {sub.title}
                      </h3>
                    )}
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {sub.body}
                    </div>
                  </section>
                ))}
              </div>

            </article>
          )}
        </main>
      </div>
    </div>
  );
}
