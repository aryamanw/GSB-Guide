import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, RotateCcw, Plus, Sparkles, Filter, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

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
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#8C1515] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
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
