// src/components/visuals/tokens.js
// Visual design tokens, gradients, and typography presets for MSG Visual System

export const VISUAL_TOKENS = {
  stroke: {
    thin: 1.5,
    default: 1.85,
    bold: 2.2,
    heavy: 2.8,
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  // High-precision rarity color palettes for achievements and badges
  rarity: {
    Common: {
      primary: '#94A3B8',
      glow: 'rgba(148, 163, 184, 0.35)',
      gradient: 'linear-gradient(135deg, #64748B 0%, #94A3B8 50%, #CBD5E1 100%)',
      border: 'rgba(148, 163, 184, 0.3)',
      bg: 'rgba(148, 163, 184, 0.12)',
    },
    Rare: {
      primary: '#38BDF8',
      glow: 'rgba(56, 189, 248, 0.45)',
      gradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 50%, #7DD3FC 100%)',
      border: 'rgba(56, 189, 248, 0.35)',
      bg: 'rgba(56, 189, 248, 0.12)',
    },
    Epic: {
      primary: '#A855F7',
      glow: 'rgba(168, 85, 247, 0.45)',
      gradient: 'linear-gradient(135deg, #7E22CE 0%, #A855F7 50%, #C084FC 100%)',
      border: 'rgba(168, 85, 247, 0.35)',
      bg: 'rgba(168, 85, 247, 0.14)',
    },
    Legendary: {
      primary: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.5)',
      gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #FDE68A 100%)',
      border: 'rgba(245, 158, 11, 0.4)',
      bg: 'rgba(245, 158, 11, 0.15)',
    },
    Mythic: {
      primary: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.55)',
      gradient: 'linear-gradient(135deg, #B91C1C 0%, #EF4444 50%, #FCA5A5 100%)',
      border: 'rgba(239, 68, 68, 0.4)',
      bg: 'rgba(239, 68, 68, 0.16)',
    },
  },
  // Functional accent gradients
  gradients: {
    accent: 'linear-gradient(135deg, #C62828 0%, #E53935 50%, #FF6B6B 100%)',
    flame: 'linear-gradient(180deg, #FF9100 0%, #FF5C33 50%, #E53935 100%)',
    trophy: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%)',
    water: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 100%)',
    emerald: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    violet: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
    titanium: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
  },
};
