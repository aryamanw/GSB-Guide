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