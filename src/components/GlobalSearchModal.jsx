import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import Fuse from 'fuse.js';

export default function GlobalSearchModal({ isOpen, onClose, survivalData, intlData, dictData, faqData, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle Esc keyboard shortcut (Cmd+K is handled globally in App.jsx)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Index search corpus
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const corpus = [];

    // Survival guide chapters
    (survivalData || []).forEach((part) => {
      (part.chapters || []).forEach((chap) => {
        (chap.subsections || []).forEach((sub) => {
          corpus.push({
            type: 'survival',
            title: `${chap.title} · ${sub.title}`,
            snippet: sub.body ? sub.body.slice(0, 180) + '...' : '',
            targetId: chap.id,
            category: 'Survival Guide'
          });
        });
      });
    });

    // International guide sections
    (intlData || []).forEach((sec) => {
      corpus.push({
        type: 'intl',
        title: sec.title,
        snippet: sec.body ? sec.body.slice(0, 180) + '...' : '',
        targetId: sec.id,
        category: 'International Guide'
      });
    });

    // Dictionary terms
    (dictData || []).forEach((d) => {
      corpus.push({
        type: 'dictionary',
        title: `Dictionary: ${d.term}`,
        snippet: d.definition,
        targetId: 'dictionary',
        category: 'GSB Dictionary'
      });
    });

    // FAQs
    (faqData || []).forEach((f) => {
      corpus.push({
        type: 'faq',
        title: f.question,
        snippet: f.answer,
        targetId: 'faq',
        category: 'FAQ'
      });
    });

    const fuse = new Fuse(corpus, {
      keys: ['title', 'snippet'],
      threshold: 0.35,
      ignoreLocation: true
    });

    const searchRes = fuse.search(query).slice(0, 12);
    setResults(searchRes.map((r) => r.item));
  }, [query, survivalData, intlData, dictData, faqData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Input Bar */}
        <div className="relative border-b border-stone-200 dark:border-stone-800 p-4 flex items-center gap-3">
          <Search size={20} className="text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search all guides, terms, housing, FAQs (e.g. Cardinal Care, MARRS, TALK)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none text-base sm:text-lg"
          />
          <button
            onClick={onClose}
            className="size-11 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 rounded-lg transition-all"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {query.trim() === '' && (
            <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-sm">
              Type a keyword to instantly search across all 29 chapters, dictionary terms, and FAQs.
            </div>
          )}

          {query.trim() !== '' && results.length === 0 && (
            <div className="text-center py-8 text-stone-500 dark:text-stone-400 text-sm">
              No matching results found for "{query}". Try a different search term.
            </div>
          )}

          {results.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectResult(item);
                onClose();
              }}
              className="p-3.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/70 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 cursor-pointer transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cardinal-50 dark:bg-cardinal-950 text-cardinal-600 dark:text-cardinal-300">
                    {item.category}
                  </span>
                </div>
                <h4 className="font-semibold text-stone-900 dark:text-white text-sm sm:text-base group-hover:text-cardinal-600 dark:group-hover:text-cardinal-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                  {item.snippet}
                </p>
              </div>

              <ArrowRight size={16} className="text-stone-400 group-hover:text-cardinal-600 shrink-0 mt-2 transition-transform group-hover:translate-x-1" />
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
          <span>Press <kbd className="px-1 py-0.5 bg-white dark:bg-stone-800 border rounded text-[10px]">Esc</kbd> to close</span>
          <span>Powered by Fuse.js</span>
        </div>
      </div>
    </div>
  );
}
