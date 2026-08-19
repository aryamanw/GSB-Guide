import React from 'react';
import { BookOpen, CheckSquare, Search, Sun, Moon, Globe, HelpCircle, Book, Home, Menu, Bookmark } from 'lucide-react';
import GsbTrailMark from './icons/GsbTrailMark';

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
            <div className="w-10 h-10 rounded-xl bg-cardinal-600 flex items-center justify-center text-white">
              <GsbTrailMark className="w-6 h-6" dotColor="#dcad5c" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-stone-900 dark:text-white leading-tight">
                  Stanford GSB
                </span>
                <span className="bg-cardinal-100 text-cardinal-600 dark:bg-cardinal-950 dark:text-cardinal-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-cardinal-200 dark:border-cardinal-800">
                  Unofficial Guide
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">Class of 2026 & Beyond</p>
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
                      ? 'bg-cardinal-600 text-white'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm transition-all"
              title="Search Guide (Cmd+K)"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded text-stone-400">
                ⌘K
              </kbd>
            </button>

            {/* Bookmarks Toggle */}
            <button
              onClick={onOpenBookmarks}
              className="relative size-11 flex items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all"
              title="Saved Bookmarks"
              aria-label="Saved bookmarks"
            >
              <Bookmark size={18} />
              {bookmarkedCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-cardinal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="size-11 flex items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={18} className="text-gold-400" /> : <Moon size={18} />}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden size-11 flex items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 space-y-1">
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
                className={`w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cardinal-600 text-white'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
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
