// src/components/visuals/AnimatedVisuals.jsx
// Premium micro-animations for MSG Application
import React from 'react';
import './visuals.css';

/**
 * Animated Flame: Multi-layered fire with flickering ember particles
 * Used for: Check-in streaks, PR achievements, come-back nudges, high-intensity workouts
 */
export const AnimatedFlame = ({ size = 24, style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`msg-anim-flame ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
    aria-label="Streak Flame"
    role="img"
  >
    <defs>
      <linearGradient id="msgFlameGrad" x1="12" y1="3" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFA000" />
        <stop offset="45%" stopColor="#FF5722" />
        <stop offset="100%" stopColor="#E53935" />
      </linearGradient>
      <linearGradient id="msgFlameInner" x1="12" y1="10" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF3E0" />
        <stop offset="60%" stopColor="#FFB300" />
        <stop offset="100%" stopColor="#FF6F00" />
      </linearGradient>
    </defs>
    {/* Floating embers */}
    <circle cx="8" cy="7" r="1" fill="#FFA000" className="msg-anim-ember-1" />
    <circle cx="16" cy="5" r="0.9" fill="#FFD54F" className="msg-anim-ember-2" />
    {/* Main Flame Contour */}
    <path
      d="M12 2.5C12 2.5 13.8 6.2 13.8 8.4C13.8 9.9 13.2 10.9 12.3 11.7C15.8 11.2 18.5 13.7 18.5 16.8C18.5 20.2 15.6 22 12 22C8.4 22 5.5 20.2 5.5 16.8C5.5 14.1 7.2 12 9.5 10.9C9.7 7.7 12 2.5 12 2.5Z"
      fill="url(#msgFlameGrad)"
    />
    {/* Inner Core Flame */}
    <path
      d="M12 11C12 11 14.5 14 14.5 16.5C14.5 18.5 13.4 20.2 12 20.2C10.6 20.2 9.5 18.5 9.5 16.5C9.5 14 12 11 12 11Z"
      fill="url(#msgFlameInner)"
      className="msg-anim-flame-inner"
    />
  </svg>
);

/**
 * Animated Trophy: Prestigious championship cup with ambient float & star twinkles
 * Used for: Workout completion, milestone badges, 12-month best plan
 */
export const AnimatedTrophy = ({ size = 32, style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`msg-anim-trophy ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
    aria-label="Trophy"
    role="img"
  >
    <defs>
      <linearGradient id="msgGoldGrad" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF176" />
        <stop offset="35%" stopColor="#FBC02D" />
        <stop offset="70%" stopColor="#F57F17" />
        <stop offset="100%" stopColor="#E65100" />
      </linearGradient>
      <linearGradient id="msgPedestalGrad" x1="10" y1="23" x2="22" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#424242" />
        <stop offset="100%" stopColor="#212121" />
      </linearGradient>
    </defs>
    {/* Star Twinkles */}
    <path
      d="M26 6L26.7 7.5L28.2 8.2L26.7 8.9L26 10.4L25.3 8.9L23.8 8.2L25.3 7.5L26 6Z"
      fill="#FFF9C4"
      className="msg-anim-star-1"
    />
    <path
      d="M5 14L5.6 15.2L6.8 15.8L5.6 16.4L5 17.6L4.4 16.4L3.2 15.8L4.4 15.2L5 14Z"
      fill="#FFF9C4"
      className="msg-anim-star-2"
    />
    {/* Trophy Handles */}
    <path
      d="M9 7H6C4.9 7 4 7.9 4 9C4 12.3 6.7 15 10 15H10.5M23 7H26C27.1 7 28 7.9 28 9C28 12.3 25.3 15 22 15H21.5"
      stroke="url(#msgGoldGrad)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Cup Body */}
    <path
      d="M8.5 5.5H23.5V13C23.5 17.1 20.1 20.5 16 20.5C11.9 20.5 8.5 17.1 8.5 13V5.5Z"
      fill="url(#msgGoldGrad)"
    />
    {/* Cup Stem & Base */}
    <path d="M14 20.5H18V24H14V20.5Z" fill="url(#msgGoldGrad)" />
    <path
      d="M10 24H22L23 28H9L10 24Z"
      fill="url(#msgPedestalGrad)"
      stroke="url(#msgGoldGrad)"
      strokeWidth="1.2"
    />
    {/* Accent Star on Cup */}
    <polygon
      points="16,9.5 17.2,12.2 20.1,12.5 17.9,14.4 18.5,17.2 16,15.7 13.5,17.2 14.1,14.4 11.9,12.5 14.8,12.2"
      fill="#FFFFFF"
      opacity="0.9"
    />
  </svg>
);

/**
 * Animated Medal: Polished medal medallion with hanging ribbons
 * Used for: Achievements, leaderboard rank, high performance
 */
export const AnimatedMedal = ({ size = 32, style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`msg-anim-trophy ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
    aria-label="Medal"
    role="img"
  >
    <defs>
      <linearGradient id="msgMedalRibbonL" x1="8" y1="2" x2="13" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="msgMedalRibbonR" x1="24" y1="2" x2="19" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
      <linearGradient id="msgMedalGrad" x1="9" y1="11" x2="23" y2="27" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
    </defs>
    {/* Ribbons */}
    <polygon points="10,2 14,2 16.5,14 12.5,14" fill="url(#msgMedalRibbonL)" />
    <polygon points="22,2 18,2 15.5,14 19.5,14" fill="url(#msgMedalRibbonR)" />
    {/* Medallion Circle */}
    <circle cx="16" cy="20" r="8.5" fill="url(#msgMedalGrad)" stroke="#FEF08A" strokeWidth="1" />
    <circle cx="16" cy="20" r="6.8" fill="none" stroke="#CA8A04" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
    {/* Center Star */}
    <polygon
      points="16,16 17,18.5 19.5,18.7 17.6,20.4 18.2,22.8 16,21.5 13.8,22.8 14.4,20.4 12.5,18.7 15,18.5"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Animated Water Drop: Fluid droplet with gentle wobble & inner meniscus
 * Used for: Water logging, hydration targets, drink prompts
 */
export const AnimatedWaterDrop = ({ size = 24, style = {}, className = '', filled = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`msg-anim-water ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    aria-label="Water Drop"
    role="img"
  >
    <defs>
      <linearGradient id="msgWaterGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#67E8F9" />
        <stop offset="50%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.8C12 2.8 6.5 10.2 6.5 14.8C6.5 17.9 8.9 20.5 12 20.5C15.1 20.5 17.5 17.9 17.5 14.8C17.5 10.2 12 2.8 12 2.8Z"
      fill={filled ? 'url(#msgWaterGrad)' : 'rgba(6, 182, 212, 0.15)'}
      stroke="#38BDF8"
      strokeWidth={filled ? '0.8' : '1.5'}
    />
    {filled && (
      <>
        {/* Specular Highlight */}
        <ellipse cx="9.8" cy="11.5" rx="1.2" ry="2.2" transform="rotate(-25 9.8 11.5)" fill="#FFFFFF" opacity="0.65" />
        <circle cx="10" cy="16" r="0.8" fill="#FFFFFF" opacity="0.4" />
      </>
    )}
  </svg>
);

/**
 * Animated Stopwatch: Precision chronometer with rotating tick hand
 * Used for: Rest interval timers, workout duration, 1-month plan
 */
export const AnimatedStopwatch = ({ size = 20, running = true, color = '#E53935', style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    className={className}
    aria-label="Stopwatch Timer"
    role="img"
  >
    {/* Bezel & crown */}
    <circle cx="12" cy="13" r="8.5" stroke={color} strokeWidth="2" />
    <path d="M12 4.5V2M10 2H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M18.5 7.5L20 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    {/* Center dial pin */}
    <circle cx="12" cy="13" r="1.5" fill={color} />
    {/* Rotating needle hand */}
    <line
      x1="12"
      y1="13"
      x2="12"
      y2="7.5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      className={running ? 'msg-anim-stopwatch-hand' : ''}
    />
  </svg>
);

/**
 * Animated Warning: Pulsing caution shield for critical errors and alerts
 * Used for: Error boundaries, disconnected states, inactive member warnings
 */
export const AnimatedWarning = ({ size = 48, color = '#E53935', style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`msg-anim-warning ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    aria-label="Warning Alert"
    role="img"
  >
    <defs>
      <linearGradient id="msgWarnGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="100%" stopColor={color} />
      </linearGradient>
    </defs>
    <path
      d="M12 2.8L21.5 19.5C21.8 20.1 21.4 20.8 20.7 20.8H3.3C2.6 20.8 2.2 20.1 2.5 19.5L12 2.8Z"
      fill="url(#msgWarnGrad)"
      opacity="0.18"
    />
    <path
      d="M12 2.8L21.5 19.5C21.8 20.1 21.4 20.8 20.7 20.8H3.3C2.6 20.8 2.2 20.1 2.5 19.5L12 2.8Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line x1="12" y1="9" x2="12" y2="14" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="12" cy="17.2" r="1.2" fill="#FFFFFF" />
  </svg>
);

/**
 * Animated Signal: Radiating radar/satellite waves for network connectivity states
 * Used for: App offline banner, re-establishing socket connection
 */
export const AnimatedSignal = ({ size = 52, color = '#E53935', style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
    className={className}
    aria-label="Network Signal"
    role="img"
  >
    {/* Pulsing Emitter Wave Rings */}
    <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" className="msg-anim-signal-wave-1" />
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1.8" strokeOpacity="0.6" className="msg-anim-signal-wave-2" />
    {/* Dish / Satellite Anchor */}
    <path
      d="M9 22C11 20 14 19 16 19C18 19 21 20 23 22"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M11 25L16 19L21 25"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Signal Node Dot */}
    <circle cx="16" cy="16" r="3.2" fill={color} />
  </svg>
);

/**
 * Animated Search: Optic lens with scanning highlight beam
 * Used for: Database lookups, searching members, searching exercises
 */
export const AnimatedSearch = ({ size = 48, color = '#E53935', style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`msg-anim-search ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    aria-label="Searching Database"
    role="img"
  >
    <circle cx="11.5" cy="11.5" r="7.5" stroke={color} strokeWidth="2.2" fill="rgba(229, 57, 53, 0.08)" />
    <line x1="17" y1="17" x2="24.5" y2="24.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    {/* Glass Refraction Arc */}
    <path
      d="M7.5 11.5C7.5 9.3 9.3 7.5 11.5 7.5"
      stroke="#FFFFFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

/**
 * Animated Lock: Heavy-duty security lock with shackle engagement
 * Used for: Restricted screens, plan locks, locked achievements
 */
export const AnimatedLock = ({ size = 52, color = '#E53935', style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    className={className}
    aria-label="Secure Lock"
    role="img"
  >
    <defs>
      <linearGradient id="msgLockGrad" x1="6" y1="14" x2="26" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#374151" />
        <stop offset="100%" stopColor="#1F2937" />
      </linearGradient>
    </defs>
    {/* Hardened Shackle */}
    <path
      d="M10 14V9.5C10 6.2 12.7 3.5 16 3.5C19.3 3.5 22 6.2 22 9.5V14"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    {/* Padlock Body */}
    <rect x="6" y="14" width="20" height="15" rx="4" fill="url(#msgLockGrad)" stroke={color} strokeWidth="1.8" />
    {/* Keyhole */}
    <circle cx="16" cy="20.5" r="2.2" fill={color} />
    <path d="M15.2 21.5L14.5 25H17.5L16.8 21.5Z" fill={color} />
  </svg>
);

/**
 * Animated Celebration: Confetti and radiant spark explosion
 * Used for: Plan signup success, workout victory, clean followups
 */
export const AnimatedCelebration = ({ size = 56, style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible', ...style }}
    className={className}
    aria-label="Celebration"
    role="img"
  >
    {/* Center Burst Star */}
    <polygon
      points="20,12 22.5,17.5 28.5,18 24,22 25.5,28 20,25 14.5,28 16,22 11.5,18 17.5,17.5"
      fill="#F59E0B"
      className="msg-anim-star-1"
    />
    {/* Confetti Ribbon Sprays */}
    <rect x="6" y="10" width="3" height="7" rx="1.5" fill="#3B82F6" transform="rotate(-30 6 10)" />
    <rect x="30" y="8" width="3" height="7" rx="1.5" fill="#EF4444" transform="rotate(25 30 8)" />
    <rect x="32" y="24" width="3" height="7" rx="1.5" fill="#10B981" transform="rotate(-40 32 24)" />
    <rect x="6" y="26" width="3" height="7" rx="1.5" fill="#A855F7" transform="rotate(35 6 26)" />
    {/* Sparks */}
    <circle cx="20" cy="5" r="2" fill="#FBBF24" />
    <circle cx="35" cy="18" r="1.5" fill="#60A5FA" />
    <circle cx="4" cy="19" r="1.5" fill="#F472B6" />
    <circle cx="20" cy="35" r="2" fill="#34D399" />
  </svg>
);

/**
 * Animated Spinner: Sleek high-tech orbital loader
 * Used for: Async actions, Firebase initialization, loading buttons
 */
export const AnimatedSpinner = ({ size = 20, color = '#E53935', style = {}, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`msg-anim-spin ${className}`}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    aria-label="Loading"
    role="img"
  >
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
    <path
      d="M12 3C16.97 3 21 7.03 21 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Animated Play/Pause: Morphing workout controller
 * Used for: Active workout session and rest timers
 */
export const AnimatedPlayPause = ({ isPlaying = false, size = 22, color = '#FFFFFF', style = {} }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      ...style,
    }}
  >
    {isPlaying ? (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <rect x="6" y="4" width="4" height="16" rx="1.5" />
        <rect x="14" y="4" width="4" height="16" rx="1.5" />
      </svg>
    ) : (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M7 4.5C7 3.6 8 3.1 8.8 3.6L19.2 10.1C19.9 10.5 19.9 11.5 19.2 11.9L8.8 18.4C8 18.9 7 18.4 7 17.5V4.5Z" />
      </svg>
    )}
  </span>
);
