import React from 'react';
import { BookOpen, CheckSquare, Globe, Book, Home, HelpCircle, ArrowRight } from 'lucide-react';

const STATS = [
  { label: 'Chapters', value: '29+' },
  { label: 'Checklist Items', value: '16' },
  { label: 'Dictionary Terms', value: '28' },
  { label: 'FAQs Answered', value: '19+' },
];

const QUICK_LINKS = [
  {
    id: 'survival',
    icon: BookOpen,
    title: 'Survival Guide',
    subtitle: '29 chapters covering every aspect of GSB life',
    badge: 'Main Guide'
  },
  {
    id: 'intl',
    icon: Globe,
    title: 'International Guide',
    subtitle: 'Visas, SSN, CPT, US banking, and settling in',
    badge: 'International'
  },
  {
    id: 'checklist',
    icon: CheckSquare,
    title: 'Pre-Arrival Checklist',
    subtitle: 'Interactive task tracker saved in your browser',
    badge: 'Action List'
  },
  {
    id: 'dictionary',
    icon: Book,
    title: 'GSB Dictionary',
    subtitle: 'TALK, FOAM, MARRS, LPF, Touchy Feely & more',
    badge: '28 Terms'
  },
  {
    id: 'housing',
    icon: Home,
    title: 'Housing Explorer',
    subtitle: 'Compare Schwab, JMac, EV, and neighborhoods',
    badge: 'Neighborhoods'
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Class FAQs',
    subtitle: 'Common WhatsApp & Slack questions answered',
    badge: '19 FAQs'
  }
];

export default function HeroLanding({ onNavigate }) {
  return (
    <div>
      {/* Hero Section - flat, warm, restrained. No gradient theater. */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-14 sm:pt-20 sm:pb-16">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-stone-900 dark:text-white leading-tight mb-5">
            The GSB Survival Guide, in one place
          </h1>

          <p className="text-center text-stone-600 dark:text-stone-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Road-tested advice from a GSB class: housing, packing, academics, careers, social life, and Bay Area living.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => onNavigate('survival')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cardinal-600 hover:bg-cardinal-700 active:scale-[0.97] text-white rounded-lg font-semibold text-sm transition-all"
            >
              <BookOpen size={18} />
              Start Reading the Guide
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('checklist')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-transparent hover:bg-stone-100 dark:hover:bg-stone-900 active:scale-[0.97] text-stone-700 dark:text-stone-300 rounded-lg font-semibold text-sm border border-stone-300 dark:border-stone-700 transition-all"
            >
              <CheckSquare size={18} />
              Open Pre-Arrival Checklist
            </button>
          </div>

          {/* Hero visual: a real photo, bordered and flat like every surface */}
          <img
            src="https://picsum.photos/seed/gsb-campus-quad/1600/760"
            alt="The Stanford campus quad on a sunny morning"
            loading="eager"
            fetchPriority="high"
            className="w-full aspect-[21/9] object-cover rounded-xl border border-stone-200 dark:border-stone-800"
          />
        </div>
      </div>

      {/* Stats - a plain divided row below the hero, not a card grid */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center divide-x divide-stone-200 dark:divide-stone-800">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex-1 text-center px-2">
                <div className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links Grid - one consistent treatment, not six competing colors */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white text-center mb-8">
          What do you need today?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="group text-left p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-cardinal-300 dark:hover:border-cardinal-800 hover:shadow-sm transition-all duration-200"
              >
                <div className="inline-flex p-2.5 rounded-lg bg-cardinal-50 dark:bg-cardinal-950/50 text-cardinal-600 dark:text-cardinal-400 mb-4">
                  <Icon size={22} />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 dark:text-white text-lg group-hover:text-cardinal-600 dark:group-hover:text-cardinal-400 transition-colors">
                    {link.title}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-full">
                    {link.badge}
                  </span>
                </div>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                  {link.subtitle}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cardinal-600 dark:text-cardinal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attribution */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-stone-100 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 text-center">
          <p className="text-stone-700 dark:text-stone-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Developed by <strong>Nikhil Jain (MBA Class of 2026)</strong> with contributions from dozens of classmates, and material drawn from the International Student Handbook by the{' '}
            <strong>GSB Student Association International Committee</strong>.
          </p>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-3">
            Unofficial, student-created resource. Not endorsed by Stanford University or the Graduate School of Business.
          </p>
        </div>
      </div>
    </div>
  );
}
