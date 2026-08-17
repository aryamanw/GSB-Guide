import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, MessageSquare } from 'lucide-react';

export default function FAQView({ faqs }) {
  const [openIndex, setOpenIndex] = useState(0);
  const [search, setSearch] = useState('');

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

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

      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter FAQs (e.g. car, Cardinal Care, ID card, pets)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8C1515] shadow-sm text-sm"
        />
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
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
                <div className="px-6 pb-5 pt-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
