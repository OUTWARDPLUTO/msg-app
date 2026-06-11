// ─── Theme System ─────────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    bg: '#000000', s1: '#0A0A0A', s2: '#111111', s3: '#181818', s4: '#222222',
    accent: '#F2B94A', accentD: 'rgba(242,185,74,0.15)',
    orange: '#FF6240', blue: '#4E9FFF', purple: '#A78BFA', teal: '#2DD4BF', pink: '#F472B6',
    green: '#4ADE80', red: '#F87171',
    text: '#FFFFFF', sub: '#A0A0A0', muted: '#777777', border: 'rgba(255, 255, 255, 0.08)',
    cardShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 24px rgba(0,0,0,0.6)', 
    elevShadow: '0 20px 40px -10px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)',
    accentShadow: '0 0 16px rgba(242,185,74,0.35)',
  },
  light: {
    bg: '#F2F2F7', s1: '#FFFFFF', s2: '#F8F8F8', s3: '#F0F0F0', s4: '#E5E5E5',
    accent: '#D99A2B', accentD: 'rgba(217,154,43,0.12)',
    orange: '#E55A3C', blue: '#2E7FDF', purple: '#7C5CDB', teal: '#1AAD9B', pink: '#D45494',
    green: '#2DB562', red: '#D94F4F',
    text: '#111111', sub: '#555555', muted: '#999999', border: 'rgba(0, 0, 0, 0.06)',
    cardShadow: '0 4px 12px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255,255,255,1)', 
    elevShadow: '0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,1)',
    accentShadow: '0 4px 16px rgba(217,154,43,0.25)',
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
