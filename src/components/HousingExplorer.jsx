import React, { useState } from 'react';
import { Home, MapPin, CheckCircle2, DollarSign, Users, VolumeX, Heart, Filter } from 'lucide-react';

const PRIORITIES = [
  { key: 'budget-friendly', label: 'Budget-friendly', icon: DollarSign },
  { key: 'social', label: 'Social', icon: Users },
  { key: 'quiet', label: 'Quiet', icon: VolumeX },
  { key: 'family', label: 'Family', icon: Heart },
];

export default function HousingExplorer() {
  const [activeTab, setActiveTab] = useState('on-campus');
  const [activePriorities, setActivePriorities] = useState(new Set());

  const togglePriority = (key) => {
    setActivePriorities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const matchesPriorities = (tags) => {
    if (activePriorities.size === 0) return true;
    return (tags || []).some((t) => activePriorities.has(t));
  };

  const onCampusOptions = [
    {
      name: "Schwab Residential Center",
      type: "On-Campus (GSB)",
      img: "https://picsum.photos/seed/gsb-schwab-residence/640/360",
      target: "Single MBA1s",
      vibe: "The primary hub of MBA1 social life. Studio rooms with private bathrooms, shared micro-kitchens per floor.",
      perks: ["Steps from KMC classrooms", "High density of MBA1 classmates", "Front desk package handling"],
      tag: "Top Choice for Single MBA1s",
      tags: ["budget-friendly", "social"]
    },
    {
      name: "Jack McDonald Hall (JMac)",
      type: "On-Campus (GSB)",
      img: "https://picsum.photos/seed/gsb-jmac-hall/640/360",
      target: "Single MBA1s / MBA2s",
      vibe: "Modern residential building adjacent to Schwab with apartment-style layouts and central courtyards.",
      perks: ["Newer construction", "Spacious interior courtyards", "Immediate proximity to Knight Center"],
      tag: "Popular On-Campus Option",
      tags: ["social"]
    },
    {
      name: "Escondido Village (EV Mid-Rises / High-Rises)",
      type: "On-Campus (Stanford)",
      img: "https://picsum.photos/seed/gsb-escondido-village/640/360",
      target: "Couples & Families",
      vibe: "Quiet graduate housing complex with 1-bedroom and 2-bedroom apartments, parks, and family amenities.",
      perks: ["More space for couples & families", "Subsidized Stanford rent rates", "Dedicated community centers & parking"],
      tag: "Best for Couples",
      tags: ["family", "quiet", "budget-friendly"]
    }
  ];

  const offCampusNeighborhoods = [
    {
      name: "Downtown Palo Alto (University Ave)",
      dist: "5-10 min bike / drive",
      img: "https://picsum.photos/seed/gsb-palo-alto-university-ave/640/360",
      vibe: "Vibrant urban strip with top restaurants, coffee shops, boutiques, and Caltrain station access.",
      target: "Students wanting walkable nightlife and dining",
      tag: "Prime Off-Campus",
      tags: ["social"]
    },
    {
      name: "Menlo Park",
      dist: "10-15 min bike",
      img: "https://picsum.photos/seed/gsb-menlo-park/640/360",
      vibe: "Quiet, leafy residential suburb immediately north of campus. Great restaurants on Santa Cruz Ave.",
      target: "Students seeking peaceful residential living",
      tag: "Quiet & Convenient",
      tags: ["quiet", "family"]
    },
    {
      name: "Mountain View / Sunnyvale",
      dist: "15-20 min drive",
      img: "https://picsum.photos/seed/gsb-mountain-view/640/360",
      vibe: "Tech hub neighborhood with diverse dining (Castro St), easy 101/280 access, and cheaper rent.",
      target: "Budget-conscious students or tech partners",
      tag: "Budget Friendly",
      tags: ["budget-friendly"]
    },
    {
      name: "San Francisco (SoMa / Mission)",
      dist: "45-60 min Caltrain / drive",
      img: "https://picsum.photos/seed/gsb-san-francisco/640/360",
      vibe: "Big city energy, tech ecosystem events, world-class dining. Requires commuting for campus classes.",
      target: "MBA2s or students with SF-based partners",
      tag: "City Living",
      tags: ["social"]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Banner */}
      <div className="bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Home size={18} className="text-cardinal-600 dark:text-cardinal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cardinal-600 dark:text-cardinal-400">
              Chapter 3 & International Guide
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white mb-2">
            Stanford GSB Housing & Neighborhood Explorer
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-sm sm:text-base">
            Compare GSB Residences (Schwab, JMac), Stanford Escondido Village (EV), and Palo Alto off-campus neighborhood options.
          </p>
        </div>
      </div>

      {/* Switcher Tabs */}
      <div className="flex justify-center border-b border-stone-200 dark:border-stone-800 pb-4">
        <div className="inline-flex bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl gap-2">
          <button
            onClick={() => setActiveTab('on-campus')}
            className={`px-5 py-3 rounded-lg text-sm font-semibold active:scale-[0.97] transition-all ${
              activeTab === 'on-campus'
                ? 'bg-cardinal-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            On-Campus Residences
          </button>
          <button
            onClick={() => setActiveTab('off-campus')}
            className={`px-5 py-3 rounded-lg text-sm font-semibold active:scale-[0.97] transition-all ${
              activeTab === 'off-campus'
                ? 'bg-cardinal-600 text-white'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Off-Campus Neighborhoods
          </button>
        </div>
      </div>

      {/* Priority Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 mr-1">
          <Filter size={14} />
          Filter by priority
        </span>
        {PRIORITIES.map(({ key, label, icon: Icon }) => {
          const isActive = activePriorities.has(key);
          return (
            <button
              key={key}
              onClick={() => togglePriority(key)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 ${
                isActive
                  ? 'bg-cardinal-600 border-cardinal-600 text-white scale-105 shadow-sm'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-cardinal-600 hover:text-cardinal-600'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {activeTab === 'on-campus' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {onCampusOptions.map((opt, idx) => {
            const matched = matchesPriorities(opt.tags);
            return (
              <div
                key={idx}
                className={`interactive-card bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col justify-between space-y-4 transition-all duration-200 ${
                  activePriorities.size > 0 && !matched ? 'opacity-50' : ''
                } ${activePriorities.size > 0 && matched ? 'ring-2 ring-gold-400' : ''}`}
              >
                <img
                  src={opt.img}
                  alt={`${opt.name} exterior`}
                  loading="lazy"
                  className="w-full aspect-[16/9] object-cover"
                />
                <div className="px-6 pb-6 flex flex-col justify-between gap-4 flex-1">
                  <div>
                    <span className="badge badge-cardinal mb-3">{opt.tag}</span>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white mt-1">
                      {opt.name}
                    </h3>
                    <p className="text-xs text-cardinal-600 dark:text-cardinal-400 font-medium mt-1">
                      Target: {opt.target}
                    </p>
                    <p className="text-stone-600 dark:text-stone-300 text-sm mt-3 leading-relaxed">
                      {opt.vibe}
                    </p>
                  </div>

                  <div className="border-t border-stone-100 dark:border-stone-800/80 pt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Highlights</h4>
                    {opt.perks.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offCampusNeighborhoods.map((n, idx) => {
            const matched = matchesPriorities(n.tags);
            return (
              <div
                key={idx}
                className={`interactive-card bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden space-y-4 transition-all duration-200 ${
                  activePriorities.size > 0 && !matched ? 'opacity-50' : ''
                } ${activePriorities.size > 0 && matched ? 'ring-2 ring-gold-400' : ''}`}
              >
                <img
                  src={n.img}
                  alt={`${n.name} neighborhood`}
                  loading="lazy"
                  className="w-full aspect-[16/9] object-cover"
                />
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-gold">{n.tag}</span>
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                      <MapPin size={14} className="text-cardinal-600 dark:text-cardinal-400" />
                      {n.dist}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                      {n.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
                      Ideal for: {n.target}
                    </p>
                    <p className="text-stone-600 dark:text-stone-300 text-sm mt-3 leading-relaxed">
                      {n.vibe}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
