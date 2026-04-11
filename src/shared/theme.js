// ─── Theme System ─────────────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    bg: '#111111', s1: '#1A1A1A', s2: '#1A1A1A', s3: '#2F2F2F', s4: '#3A3A3A',
    accent: '#D99A2B', accentD: 'rgba(217,154,43,0.12)',
    orange: '#FF6240', blue: '#4E9FFF', purple: '#A78BFA', teal: '#2DD4BF', pink: '#F472B6',
    green: '#4ADE80', red: '#F87171',
    text: '#F6F6F6', sub: '#A0A0A0', muted: '#666666', border: '#3A3A3A',
    cardShadow: '0 2px 12px rgba(0,0,0,0.4)', elevShadow: '0 8px 32px rgba(0,0,0,0.6)',
    accentShadow: '0 4px 20px rgba(217,154,43,0.25)',
  },
  light: {
    bg: '#F6F6F6', s1: '#FFFFFF', s2: '#FFFFFF', s3: '#F0F0F0', s4: '#E8E8E8',
    accent: '#D99A2B', accentD: 'rgba(217,154,43,0.10)',
    orange: '#E55A3C', blue: '#2E7FDF', purple: '#7C5CDB', teal: '#1AAD9B', pink: '#D45494',
    green: '#2DB562', red: '#D94F4F',
    text: '#111111', sub: '#555555', muted: '#999999', border: '#E0E0E0',
    cardShadow: '0 2px 12px rgba(0,0,0,0.07)', elevShadow: '0 8px 32px rgba(0,0,0,0.12)',
    accentShadow: '0 4px 20px rgba(217,154,43,0.20)',
  },
};

// Mutable color object — components read from this; theme changes mutate it in place
export const C = { ...THEMES.dark };

export const fn = "'Plus Jakarta Sans', sans-serif";
export const fb = "'Plus Jakarta Sans', sans-serif";
export const MC = {
  chest: '#4E9FFF', back: '#2DD4BF', shoulders: '#A78BFA',
  arms: '#FF6240', core: '#D99A2B', legs: '#FF6B6B',
};
