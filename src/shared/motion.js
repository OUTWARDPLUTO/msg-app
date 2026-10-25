// src/shared/motion.js
// Centralized motion system tokens and animation helpers for MSG
// Restrained, premium, mobile-first design with accessibility support.

export const MOTION = {
  // Duration tokens (ms)
  duration: {
    instant: 80,
    fast: 140,      // Button press, small state changes
    normal: 220,    // Card entrance, tab switches, panel transitions
    medium: 300,    // Modals, drawers, sheet appearances
    slow: 500,      // Progress bar transitions, counter increments
  },

  // Easing curves
  easing: {
    // Natural deceleration curve (primary UI transition)
    decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)',
    // Standard acceleration/deceleration
    standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    // Snappy spring-like curve for touch feedback
    touch: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    // Linear for spinners/stopwatches
    linear: 'linear',
  },

  // Suggested subtle distances for enter/exit transforms (px)
  offset: {
    micro: 4,
    small: 8,
    medium: 14,
    modal: 20,
  },
};

// Check if user prefers reduced motion
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Generate CSS style for standard transitions
export function transitionStyle(props = ['transform', 'opacity', 'background-color'], speed = 'fast') {
  if (prefersReducedMotion()) {
    return { transition: 'none' };
  }
  const dur = `${MOTION.duration[speed] || 180}ms`;
  const ease = MOTION.easing.decelerate;
  return {
    transition: props.map(p => `${p} ${dur} ${ease}`).join(', '),
  };
}
