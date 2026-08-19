import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroLanding from './components/HeroLanding';
import GuideReader from './components/GuideReader';
import ChecklistTracker from './components/ChecklistTracker';
import DictionaryView from './components/DictionaryView';
import FAQView from './components/FAQView';
import HousingExplorer from './components/HousingExplorer';
import GlobalSearchModal from './components/GlobalSearchModal';

// Import pre-parsed datasets
import survivalData from './data/survivalGuideData.json';
import intlData from './data/internationalGuideData.json';
import dictData from './data/dictionaryData.json';
import faqData from './data/faqData.json';
import checklistData from './data/checklistData.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('gsb-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('gsb-bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gsb-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gsb-theme', 'light');
    }
  }, [darkMode]);

  // Persist bookmarks
  useEffect(() => {
    localStorage.setItem('gsb-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Keyboard shortcut: Cmd+K opens search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleBookmark = (id, title) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === id);
      if (exists) {
        return prev.filter((b) => b.id !== id);
      } else {
        return [...prev, { id, title, timestamp: Date.now() }];
      }
    });
  };

  const handleSearchResultSelect = (result) => {
    if (result.type === 'survival') setActiveTab('survival');
    else if (result.type === 'intl') setActiveTab('intl');
    else if (result.type === 'dictionary') setActiveTab('dictionary');
    else if (result.type === 'faq') setActiveTab('faq');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSearch={() => setSearchModalOpen(true)}
        bookmarkedCount={bookmarks.length}
        onOpenBookmarks={() => setBookmarksDrawerOpen(true)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main View Area */}
      <div className="flex-1">

        {activeTab === 'home' && (
          <HeroLanding onNavigate={setActiveTab} />
        )}

        {activeTab === 'survival' && (
          <GuideReader
            data={survivalData}
            isIntl={false}
            bookmarkedIds={bookmarks.map((b) => b.id)}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {activeTab === 'intl' && (
          <GuideReader
            data={intlData}
            isIntl={true}
            bookmarkedIds={bookmarks.map((b) => b.id)}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistTracker initialItems={checklistData} />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView terms={dictData} />
        )}

        {activeTab === 'housing' && (
          <HousingExplorer />
        )}

        {activeTab === 'faq' && (
          <FAQView faqs={faqData} />
        )}
      </div>

      {/* Bookmarks Drawer Overlay */}
      {bookmarksDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-stone-950/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setBookmarksDrawerOpen(false); }}
        >
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 p-6 shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-4">
              <h3 className="font-bold text-lg text-stone-900 dark:text-white">
                Bookmarks {bookmarks.length > 0 && <span className="text-cardinal-600">({bookmarks.length})</span>}
              </h3>
              <button
                onClick={() => setBookmarksDrawerOpen(false)}
                className="size-11 -m-1.5 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 transition-all"
                aria-label="Close bookmarks"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {bookmarks.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <div className="text-4xl mb-3">🔖</div>
                  <p className="text-sm font-medium">No bookmarks yet</p>
                  <p className="text-xs mt-1 text-stone-500">Click the bookmark icon on any chapter or section to save it here.</p>
                </div>
              ) : (
                bookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-cardinal-600 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    onClick={() => {
                      setBookmarksDrawerOpen(false);
                      setActiveTab('survival');
                    }}
                  >
                    <span className="font-medium text-sm text-stone-800 dark:text-stone-200 truncate">
                      {b.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(b.id, b.title);
                      }}
                      className="text-xs text-stone-400 hover:text-cardinal-500 shrink-0 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        survivalData={survivalData}
        intlData={intlData}
        dictData={dictData}
        faqData={faqData}
        onSelectResult={handleSearchResultSelect}
      />

      {/* Footer — only shown on non-home tabs */}
      {activeTab !== 'home' && (
        <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-8 mt-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-500 dark:text-stone-400 space-y-2">
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
              Stanford GSB Unofficial Survival Guide & International Student Handbook
            </p>
            <p>
              Developed by Nikhil Jain (MBA '26) with contributions from dozens of classmates and the GSB SA International Committee.
            </p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500">
              Unofficial student-created field guide. Not published, reviewed, or endorsed by Stanford University or the Graduate School of Business.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
