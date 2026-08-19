import React, { useState } from 'react';
import { Home, MapPin, DollarSign, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HousingExplorer() {
  const [activeTab, setActiveTab] = useState('on-campus');

  const onCampusOptions = [
    {
      name: "Schwab Residential Center",
      type: "On-Campus (GSB)",
      target: "Single MBA1s",
      vibe: "The primary hub of MBA1 social life. Studio rooms with private bathrooms, shared micro-kitchens per floor.",
      perks: ["Steps from KMC classrooms", "High density of MBA1 classmates", "Front desk package handling"],
      tag: "Top Choice for Single MBA1s"
    },
    {
      name: "Jack McDonald Hall (JMac)",
      type: "On-Campus (GSB)",
      target: "Single MBA1s / MBA2s",
      vibe: "Modern residential building adjacent to Schwab with apartment-style layouts and central courtyards.",
      perks: ["Newer construction", "Spacious interior courtyards", "Immediate proximity to Knight Center"],
      tag: "Popular On-Campus Option"
    },
    {
      name: "Escondido Village (EV Mid-Rises / High-Rises)",
      type: "On-Campus (Stanford)",
      target: "Couples & Families",
      vibe: "Quiet graduate housing complex with 1-bedroom and 2-bedroom apartments, parks, and family amenities.",
      perks: ["More space for couples & families", "Subsidized Stanford rent rates", "Dedicated community centers & parking"],
      tag: "Best for Couples"
    }
  ];

  const offCampusNeighborhoods = [
    {
      name: "Downtown Palo Alto (University Ave)",
      dist: "5-10 min bike / drive",
      vibe: "Vibrant urban strip with top restaurants, coffee shops, boutiques, and Caltrain station access.",
      target: "Students wanting walkable nightlife and dining",
      tag: "Prime Off-Campus"
    },
    {
      name: "Menlo Park",
      dist: "10-15 min bike",
      vibe: "Quiet, leafy residential suburb immediately north of campus. Great restaurants on Santa Cruz Ave.",
      target: "Students seeking peaceful residential living",
      tag: "Quiet & Convenient"
    },
    {
      name: "Mountain View / Sunnyvale",
      dist: "15-20 min drive",
      vibe: "Tech hub neighborhood with diverse dining (Castro St), easy 101/280 access, and cheaper rent.",
      target: "Budget-conscious students or tech partners",
      tag: "Budget Friendly"
    },
    {
      name: "San Francisco (SoMa / Mission)",
      dist: "45-60 min Caltrain / drive",
      vibe: "Big city energy, tech ecosystem events, world-class dining. Requires commuting for campus classes.",
      target: "MBA2s or students with SF-based partners",
      tag: "City Living"
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

      {/* Content Grid */}
      {activeTab === 'on-campus' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {onCampusOptions.map((opt, idx) => (
            <div
              key={idx}
              className="interactive-card bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col justify-between space-y-4"
            >
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Highlights</h4>
                {opt.perks.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offCampusNeighborhoods.map((n, idx) => (
            <div
              key={idx}
              className="interactive-card bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4"
            >
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
          ))}
        </div>
      )}
    </div>
  );
}
