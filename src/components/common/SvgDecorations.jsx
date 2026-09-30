'use client';

import React from 'react';

/**
 * Luxury Gold Architectural & Engineering Crest SVG for KGN Associates
 */
export const KgnCrest = ({ className = '', size = 56 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ filter: 'drop-shadow(0 4px 12px rgba(212, 176, 122, 0.35))' }}
  >
    <defs>
      <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5E2BE" />
        <stop offset="50%" stopColor="#D4B07A" />
        <stop offset="100%" stopColor="#96703E" />
      </linearGradient>
      <linearGradient id="shieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
      </linearGradient>
    </defs>

    {/* Outer decorative ring */}
    <circle cx="50" cy="50" r="46" stroke="url(#crestGold)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
    <circle cx="50" cy="50" r="42" stroke="url(#crestGold)" strokeWidth="1" opacity="0.3" />

    {/* Shield Base */}
    <path
      d="M50 14 L76 25 V50 C76 68 50 82 50 82 C50 82 24 68 24 50 V25 L50 14 Z"
      fill="url(#shieldBg)"
      stroke="url(#crestGold)"
      strokeWidth="2.5"
    />

    {/* Architectural Compass / Caliper Icon */}
    <path
      d="M50 28 L35 62 M50 28 L65 62"
      stroke="url(#crestGold)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M40 50 H60"
      stroke="url(#crestGold)"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="50" cy="28" r="3.5" fill="url(#crestGold)" />
    
    {/* Central Star */}
    <polygon
      points="50,42 52,47 57,47 53,50 55,55 50,52 45,55 47,50 43,47 48,47"
      fill="#F5E2BE"
    />
  </svg>
);

/**
 * Animated Shield Badge for Government Approved Valuers
 */
export const ApprovedValuerBadge = ({ size = 20, className = '' }) => (
  <span
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(212, 176, 122, 0.12)',
      border: '1px solid rgba(212, 176, 122, 0.4)',
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: 'var(--primary-gold)',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>Govt. Approved Valuers</span>
  </span>
);

/**
 * Animated SVG Valuation Trends Curve
 */
export const ValuationTrendChart = ({ height = 180 }) => (
  <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 500 160"
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D4B07A" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#D4B07A" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#D4B07A" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#96703E" />
          <stop offset="40%" stopColor="#D4B07A" />
          <stop offset="100%" stopColor="#F5E2BE" />
        </linearGradient>
      </defs>

      {/* Grid horizontal lines */}
      <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(212, 176, 122, 0.1)" strokeDasharray="4 4" />
      <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(212, 176, 122, 0.1)" strokeDasharray="4 4" />
      <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(212, 176, 122, 0.1)" strokeDasharray="4 4" />

      {/* Shaded Area */}
      <path
        d="M 0 130 Q 80 110, 140 85 T 280 60 T 400 35 T 500 20 L 500 160 L 0 160 Z"
        fill="url(#chartGradient)"
      />

      {/* Glowing Curve Line */}
      <path
        d="M 0 130 Q 80 110, 140 85 T 280 60 T 400 35 T 500 20"
        fill="none"
        stroke="url(#lineGlow)"
        strokeWidth="3.5"
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 8px rgba(212, 176, 122, 0.6))' }}
      />

      {/* Interactive Dots on Key Data Points */}
      {[{ cx: 140, cy: 85, label: 'Oct' }, { cx: 280, cy: 60, label: 'Nov' }, { cx: 400, cy: 35, label: 'Dec' }, { cx: 490, cy: 22, label: 'Current' }].map((pt, idx) => (
        <g key={idx}>
          <circle cx={pt.cx} cy={pt.cy} r="6" fill="#ffffff" stroke="#B8860B" strokeWidth="2.5" />
          <circle cx={pt.cx} cy={pt.cy} r="2.5" fill="#D4A017" />
        </g>
      ))}
    </svg>
  </div>
);

/**
 * Micro Sparkline for dashboard cards
 */
export const MicroSparkline = ({ color = '#B8860B', isUp = true }) => (
  <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
    <path
      d={isUp ? "M2 18 L15 14 L28 17 L42 8 L58 4" : "M2 6 L15 10 L28 8 L42 16 L58 20"}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Architectural Blueprint Background Grid Pattern
 */
export const ArchitecturalGridSvg = () => (
  <svg
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      opacity: 0.35,
      zIndex: 0,
    }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(184, 134, 11, 0.15)" strokeWidth="0.8" />
        <circle cx="40" cy="40" r="1.5" fill="#B8860B" opacity="0.3" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#archGrid)" />
  </svg>
);
