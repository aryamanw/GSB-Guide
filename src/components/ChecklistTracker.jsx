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
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold active:scale-[0.97] transition-all ${
                  activeCategory === cat
                    ? 'bg-cardinal-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
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
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cardinal-600"
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
