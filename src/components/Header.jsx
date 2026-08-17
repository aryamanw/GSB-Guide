import React from 'react';
import { BookOpen, CheckSquare, Search, Sun, Moon, Globe, HelpCircle, Book, Home, Menu, Bookmark } from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  setDarkMode, 
  onOpenSearch, 
  bookmarkedCount,
  onOpenBookmarks,
  mobileMenuOpen,
  setMobileMenuOpen 
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'survival', label: 'Survival Guide', icon: BookOpen },
    { id: 'intl', label: 'International', icon: Globe },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'dictionary', label: 'Dictionary', icon: Book },
    { id: 'housing', label: 'Housing', icon: Home },
    { id: 'faq', label: 'FAQs', icon: HelpCircle },
  ];


  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('survival')}>
            <div className="w-10 h-10 rounded-xl bg-[#8C1515] flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-slate-900 dark:text-white leading-tight">
                  Stanford GSB
                </span>
                <span className="bg-red-100 text-[#8C1515] dark:bg-red-950 dark:text-red-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                  Unofficial Guide
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Class of 2026 & Beyond</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#8C1515] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action Buttons: Search, Bookmarks, Theme, Mobile Menu */}
          <div className="flex items-center gap-2">
            
            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm transition-all"
              title="Search Guide (Cmd+K)"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Bookmarks Toggle */}
            <button
              onClick={onOpenBookmarks}
              className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Saved Bookmarks"
            >
              <Bookmark size={18} />
              {bookmarkedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8C1515] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#8C1515] text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
