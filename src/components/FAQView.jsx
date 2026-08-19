import React, { useState, useMemo } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare } from 'lucide-react';

export default function FAQView({ faqs }) {
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');

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

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Filter FAQs (e.g. car, Cardinal Care, ID card, pets)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cardinal-600 text-sm"
        />
      </div>

      {/* Grouped Accordion List */}
      <div className="space-y-8">
        {groups.map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400 px-1">
              {category}
            </h2>
            {items.map((faq, idx) => {
              const faqId = `${category}-${idx}`;
              const isOpen = openId === faqId;
              return (
                <div
                  key={faqId}
                  className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : faqId)}
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
