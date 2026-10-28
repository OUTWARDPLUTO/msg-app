// ─── Theme System ─────────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    isLight: false,
    bg: '#080808', s1: '#141414', s2: '#1A1A1A', s3: '#141414', s4: '#1A1A1A',
    accent: '#E53935', accentD: 'rgba(229,57,53,0.15)', darkAccent: '#C62828',
    orange: '#FF5C33', blue: '#3388FF', purple: '#9966FF', teal: '#2DD4BF', pink: '#FF4D94',
    green: '#22C55E', red: '#E53935',
    text: '#FFFFFF', sub: '#A3A3A3', muted: '#A3A3A3', border: 'rgba(255, 255, 255, 0.05)',
    cardShadow: '0 4px 20px rgba(0,0,0,0.5)', 
    elevShadow: '0 12px 40px rgba(0,0,0,0.8)',
    accentShadow: '0 0 16px rgba(229,57,53,0.3)',
  },
  light: {
    isLight: true,
    bg: '#F7F7F5', s1: '#FFFFFF', s2: '#F1F1EF', s3: '#FFFFFF', s4: '#F1F1EF',
    accent: '#E53935', accentD: 'rgba(229,57,53,0.1)', darkAccent: '#C62828',
    orange: '#E55A3C', blue: '#2E7FDF', purple: '#7C5CDB', teal: '#1AAD9B', pink: '#D45494',
    green: '#2DB562', red: '#E53935',
    text: '#111111', sub: '#6B6B6B', muted: '#6B6B6B', border: 'rgba(0, 0, 0, 0.06)',
    cardShadow: '0 4px 16px rgba(0, 0, 0, 0.04)', 
    elevShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
    accentShadow: '0 4px 16px rgba(229,57,53,0.2)',
  },
};

// Mutable color object — components read from this; theme changes mutate it in place
export const C = { ...THEMES.dark };

/**
 * Write all theme tokens as CSS custom properties on :root.
 * CSS transitions on these vars make the entire UI fade smoothly,
 * regardless of whether components use inline styles or CSS classes.
 */
export function applyThemeVars(theme) {
  const r = document.documentElement.style;
  r.setProperty('--msg-bg',      theme.bg);
  r.setProperty('--msg-s1',      theme.s1);
  r.setProperty('--msg-s2',      theme.s2);
  r.setProperty('--msg-s3',      theme.s3);
  r.setProperty('--msg-s4',      theme.s4);
  r.setProperty('--msg-text',    theme.text);
  r.setProperty('--msg-sub',     theme.sub);
  r.setProperty('--msg-muted',   theme.muted);
  r.setProperty('--msg-border',  theme.border);
  r.setProperty('--msg-accent',  theme.accent);
  r.setProperty('--msg-accentD', theme.accentD);
  r.setProperty('--msg-green',   theme.green);
  r.setProperty('--msg-orange',  theme.orange);
  r.setProperty('--msg-blue',    theme.blue);
  r.setProperty('--msg-purple',  theme.purple);
  r.setProperty('--msg-teal',    theme.teal);
  r.setProperty('--msg-pink',    theme.pink);
  r.setProperty('--msg-red',     theme.red);
  // Derived glass surface colors (can't transition rgba directly in all browsers,
  // but we update them so CSS var users stay in sync)
  r.setProperty('--msg-glass-bg',
    theme.isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.05)');
  r.setProperty('--msg-glass-border',
    theme.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)');
  r.setProperty('--msg-overlay',
    theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)');
}

export const fn = "'Plus Jakarta Sans', sans-serif";
export const fb = "'Plus Jakarta Sans', sans-serif";
export const MC = {
  chest: '#4E9FFF', back: '#2DD4BF', shoulders: '#A78BFA',
  arms: '#FF6240', core: '#D99A2B', legs: '#FF6B6B',
  general: '#94A3B8', cardio: '#F472B6', full: '#4ADE80',
};

// Apply initial vars immediately on module load (before React renders)
if (typeof document !== 'undefined') applyThemeVars(C);
