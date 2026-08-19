import React from 'react';

/**
 * Original GSB Guide mark — a switchback trail rising to a waypoint pin.
 * Not derived from Stanford's trademarked Block-S/tree logo; the metaphor
 * (a path through the chaos, marked step by step) is the product itself.
 *
 * Path color follows `currentColor` so it can sit inside any colored chip
 * (see Header.jsx); the waypoint dot stays fixed brand gold.
 */
export default function GsbTrailMark({ className = 'w-6 h-6', dotColor = '#ad7a2c' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path
        d="M11 33 L20 22 L27 28 L37 13"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="37" cy="13" r="4" fill={dotColor} />
    </svg>
  );
}
