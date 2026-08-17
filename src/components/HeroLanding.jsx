import React, { useEffect, useState } from 'react';
import { BookOpen, CheckSquare, Globe, Book, Home, HelpCircle, ArrowRight, ExternalLink, Sparkles, Users, Star } from 'lucide-react';

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
    color: 'from-red-900 to-[#8C1515]',
    badge: 'Main Guide'
  },
  {
    id: 'intl',
    icon: Globe,
    title: 'International Guide',
    subtitle: 'Visas, SSN, CPT, US banking, and settling in',
    color: 'from-slate-800 to-slate-900',
    badge: 'International'
  },
  {
    id: 'checklist',
    icon: CheckSquare,
    title: 'Pre-Arrival Checklist',
    subtitle: 'Interactive task tracker saved in your browser',
    color: 'from-amber-700 to-amber-900',
    badge: 'Action List'
  },
  {
    id: 'dictionary',
    icon: Book,
    title: 'GSB Dictionary',
    subtitle: 'TALK, FOAM, MARRS, LPF, Touchy Feely & more',
    color: 'from-emerald-900 to-emerald-800',
    badge: '28 Terms'
  },
  {
    id: 'housing',
    icon: Home,
    title: 'Housing Explorer',
    subtitle: 'Compare Schwab, JMac, EV, and neighborhoods',
    color: 'from-blue-900 to-blue-800',
    badge: 'Neighborhoods'
  },
  {
    id: 'faq',
    icon: HelpCircle,
    title: 'Class FAQs',
    subtitle: 'Common WhatsApp & Slack questions answered',
    color: 'from-purple-900 to-purple-800',
    badge: '19 FAQs'
  }
];

export default function HeroLanding({ onNavigate }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)]">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-red-950/40 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-800/50 text-red-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles size={12} />
              Stanford GSB · Class of 2026 · Unofficial Guide
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-center text-white leading-tight mb-6">
            The GSB Survival Guide
            <span className="block text-[#E9AB17] mt-1">Interactive Hub</span>
          </h1>

          <p className="text-center text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            The accumulated, road-tested advice of a Stanford GSB class — organized so you don't have to learn everything the hard way. Housing, packing, academics, careers, social life, and Bay Area living.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => onNavigate('survival')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8C1515] hover:bg-red-800 text-white rounded-xl font-semibold text-sm shadow-lg transition-all hover:shadow-red-900/30 hover:shadow-xl hover:-translate-y-0.5"
            >
              <BookOpen size={18} />
              Start Reading the Guide
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate('checklist')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all hover:-translate-y-0.5"
            >
              <CheckSquare size={18} />
              Open Pre-Arrival Checklist
            </button>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#E9AB17]">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-4">
        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white text-center mb-8">
          What do you need today?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className="group text-left p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 hover:border-[#8C1515] dark:hover:border-red-700"
              >
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${link.color} text-white mb-4 shadow-sm`}>
                  <Icon size={22} />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-serif font-bold text-slate-900 dark:text-white text-lg group-hover:text-[#8C1515] dark:group-hover:text-red-400 transition-colors">
                    {link.title}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                    {link.badge}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {link.subtitle}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#8C1515] dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Attribution */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star size={16} className="text-[#E9AB17]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">About this guide</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Developed by <strong>Nikhil Jain (MBA Class of 2026)</strong> with contributions from dozens of classmates, and material drawn from the International Student Handbook by the{' '}
            <strong>GSB Student Association International Committee</strong>.
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs mt-3">
            Unofficial, student-created resource. Not endorsed by Stanford University or the Graduate School of Business.
          </p>
        </div>
      </div>
    </div>
  );
}
