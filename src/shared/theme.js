// ─── Theme System ─────────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    bg: '#09090C', s1: 'rgba(26, 26, 26, 0.45)', s2: 'rgba(26, 26, 26, 0.55)', s3: 'rgba(47, 47, 47, 0.50)', s4: 'rgba(58, 58, 58, 0.60)',
    accent: '#D99A2B', accentD: 'rgba(217,154,43,0.12)',
    orange: '#FF6240', blue: '#4E9FFF', purple: '#A78BFA', teal: '#2DD4BF', pink: '#F472B6',
    green: '#4ADE80', red: '#F87171',
    text: '#F6F6F6', sub: '#A0A0A0', muted: '#777777', border: 'rgba(255, 255, 255, 0.08)',
    cardShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)', elevShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
    accentShadow: '0 4px 20px rgba(217,154,43,0.25)',
  },
  light: {
    bg: '#F2F2F7', s1: 'rgba(255, 255, 255, 0.55)', s2: 'rgba(255, 255, 255, 0.65)', s3: 'rgba(240, 240, 240, 0.60)', s4: 'rgba(230, 230, 230, 0.70)',
    accent: '#D99A2B', accentD: 'rgba(217,154,43,0.08)',
    orange: '#E55A3C', blue: '#2E7FDF', purple: '#7C5CDB', teal: '#1AAD9B', pink: '#D45494',
    green: '#2DB562', red: '#D94F4F',
    text: '#111111', sub: '#555555', muted: '#999999', border: 'rgba(0, 0, 0, 0.06)',
    cardShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.04)', elevShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.08)',
    accentShadow: '0 4px 20px rgba(217,154,43,0.15)',
  },
};

// Mutable color object — components read from this; theme changes mutate it in place
export const C = { ...THEMES.dark };

export const fn = "'Plus Jakarta Sans', sans-serif";
export const fb = "'Plus Jakarta Sans', sans-serif";
export const MC = {
  chest: '#4E9FFF', back: '#2DD4BF', shoulders: '#A78BFA',
  arms: '#FF6240', core: '#D99A2B', legs: '#FF6B6B',
  general: '#94A3B8', cardio: '#F472B6', full: '#4ADE80',
};
