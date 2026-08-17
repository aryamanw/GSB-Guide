import React, { useState } from 'react';
import { Book, Search, Copy, Check, Sparkles } from 'lucide-react';

export default function DictionaryView({ terms }) {
  const [search, setSearch] = useState('');
  const [copiedTerm, setCopiedTerm] = useState(null);

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

      {/* Search Input */}
      <div className="relative max-w-xl mx-auto">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter dictionary terms (e.g. Touchy Feely, Arbuckle, MARRS)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8C1515] shadow-sm text-sm"
        />
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((t, idx) => (
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
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {t.definition}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No matching dictionary terms found for "{search}".
        </div>
      )}
    </div>
  );
}
