// src/components/visuals/AchievementBadges.jsx
// Custom luxury achievement crests and emblems for MSG ProfileScreen
import React from 'react';
import { VISUAL_TOKENS } from './tokens';

/**
 * Custom SVG glyphs for each of the 20 achievements
 */
const AchievementGlyph = ({ id, color = '#FFFFFF', size = 24 }) => {
  switch (id) {
    case 1: // First Blood
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 6 9 6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14C18 9 12 2 12 2Z" fill={color} />
          <path d="M12 7L13.5 11L12 15" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 2: // Unbreakable
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M6 3H18L22 9L12 21L2 9L6 3Z" stroke={color} strokeWidth="1.8" fill={`${color}33`} />
          <path d="M2 9H22M12 21L7 9L10 3M12 21L17 9L14 3" stroke={color} strokeWidth="1.4" />
        </svg>
      );
    case 3: // Machine Mode
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="6" width="16" height="13" rx="3" stroke={color} strokeWidth="1.8" fill={`${color}25`} />
          <circle cx="9" cy="11" r="1.8" fill={color} />
          <circle cx="15" cy="11" r="1.8" fill={color} />
          <line x1="8" y1="15" x2="16" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 2V6M9 2H15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 4: // 5AM Club
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="13" r="8" stroke={color} strokeWidth="1.8" fill={`${color}20`} />
          <polyline points="12 8 12 13 15 13" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M5 4L2 7M19 4L22 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 5: // Night Grinder
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M20 13A8 8 0 1 1 11 3A6.5 6.5 0 0 0 20 13Z" fill={color} />
          <polygon points="17 4 17.7 5.5 19.3 5.7 18 6.9 18.5 8.5 17 7.6 15.5 8.5 16 6.9 14.7 5.7 16.3 5.5" fill="#FFFFFF" />
        </svg>
      );
    case 6: // Iron Soul
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M4 17L8 7H16L20 17H4Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}30`} />
          <line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" />
        </svg>
      );
    case 7: // The Bulk Begins
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <polyline points="3 17 9 11 13 15 21 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="16 7 21 7 21 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 8: // Shredded Arc
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 14.5 6 14.5 8.5C14.5 10 13.5 11 12.5 12C15.5 11.5 18 14 18 17C18 20.3 15.3 22 12 22C8.7 22 6 20.3 6 17C6 14.2 8 12.5 10 11.5C10.2 8.5 12 2 12 2Z" fill={color} />
        </svg>
      );
    case 9: // Protein King
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M4 11L6 4L12 7L18 4L20 11H4Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}30`} />
          <path d="M5 11V18C5 19.1 5.9 20 7 20H17C18.1 20 19 19.1 19 18V11" stroke={color} strokeWidth="1.8" />
          <circle cx="12" cy="15.5" r="2" fill={color} />
        </svg>
      );
    case 10: // No Excuses
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M4 14C4 11 7 8 11 8H13C16 8 18 10 18 13C18 16 15 18 12 18H8L4 14Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}25`} />
          <path d="M9 8V4M13 8V4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 11: // Ghost Mode
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M5 19V10C5 6.1 8.1 3 12 3C15.9 3 19 6.1 19 10V19L15.5 17L12 19L8.5 17L5 19Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}20`} />
          <circle cx="9" cy="10" r="1.5" fill={color} />
          <circle cx="15" cy="10" r="1.5" fill={color} />
        </svg>
      );
    case 12: // Beast PR
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L15 9H21L16 13L18 19L12 15L6 19L8 13L3 9H9L12 3Z" fill={color} />
        </svg>
      );
    case 13: // Gym Veteran
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 6V12C4 17.5 7.4 21.5 12 22C16.6 21.5 20 17.5 20 12V6L12 2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}25`} />
          <polygon points="12,7 13.5,10.5 17,11 14.5,13.5 15,17 12,15 9,17 9.5,13.5 7,11 10.5,10.5" fill={color} />
        </svg>
      );
    case 14: // Spartan Mind
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 3C7 3 5 7 5 11V16H19V11C19 7 17 3 12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}25`} />
          <line x1="12" y1="3" x2="12" y2="16" stroke={color} strokeWidth="2" />
          <path d="M9 16V20M15 16V20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 15: // The Transformation
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="1.8" fill={`${color}15`} />
          <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.8" />
          <circle cx="12" cy="12" r="1.8" fill={color} />
          <circle cx="17.5" cy="7.5" r="1" fill={color} />
        </svg>
      );
    case 16: // Alpha Discipline
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M3 8L6 17H18L21 8L15 12L12 5L9 12L3 8Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}35`} />
          <circle cx="3" cy="7" r="1.5" fill={color} />
          <circle cx="12" cy="4" r="1.5" fill={color} />
          <circle cx="21" cy="7" r="1.5" fill={color} />
          <rect x="7" y="18" width="10" height="2" rx="1" fill={color} />
        </svg>
      );
    case 17: // Lone Wolf
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 3L16 9L21 12L17 15L15 21L12 18L9 21L7 15L3 12L8 9L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}25`} />
        </svg>
      );
    case 18: // Brotherhood
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M3 13L8 9L11 11L14 8L18 11L21 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 16L12 13L17 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 19: // Built Different
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill={`${color}20`} />
          <ellipse cx="12" cy="12" rx="4.5" ry="9" stroke={color} strokeWidth="1.6" />
          <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.6" />
        </svg>
      );
    case 20: // MSG Legend
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 21.5 12 18 5.5 21.5 7 14.5 2 9.5 9 9 12 2" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={color} />
          <polygon points="13 7 9 14 13 14 11 19 16 11 13 11" fill="#FFFFFF" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill={`${color}20`} />
        </svg>
      );
  }
};

/**
 * AchievementBadge Component
 * Renders a high-tier metallic badge with luxury borders and optional lock overlay
 */
export const AchievementBadge = ({
  id,
  unlocked = false,
  rarity = 'Common',
  size = 46,
  style = {},
}) => {
  const meta = VISUAL_TOKENS.rarity[rarity] || VISUAL_TOKENS.rarity.Common;
  const badgeColor = unlocked ? meta.primary : '#64748B';

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: 12,
        background: unlocked ? meta.bg : 'rgba(255, 255, 255, 0.03)',
        border: `1.5px solid ${unlocked ? meta.border : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: unlocked ? `0 4px 16px ${meta.glow}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: unlocked ? 1 : 0.65,
        ...style,
      }}
    >
      <AchievementGlyph id={id} color={badgeColor} size={Math.round(size * 0.58)} />

      {/* Mini Padlock when locked */}
      {!unlocked && (
        <div
          style={{
            position: 'absolute',
            bottom: -3,
            right: -3,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V11" />
          </svg>
        </div>
      )}
    </div>
  );
};
