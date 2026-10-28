// src/components/visuals/EmptyStateIllustration.jsx
// Architectural SVG illustrations for contextual empty states across MSG
import React from 'react';

export const EmptyWorkoutIllustration = ({ size = 64, color = '#E53935' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="No workouts logged">
    <rect x="14" y="10" width="36" height="46" rx="6" stroke={color} strokeWidth="2.5" fill={`${color}12`} />
    <path d="M22 6H42V14H22V6Z" stroke={color} strokeWidth="2" fill={`${color}25`} />
    <line x1="22" y1="24" x2="42" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="22" y1="32" x2="36" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="42" r="3" fill={color} />
    <circle cx="32" cy="42" r="3" fill={color} />
    <circle cx="40" cy="42" r="3" fill={color} />
  </svg>
);

export const EmptyDietIllustration = ({ size = 64, color = '#22C55E' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="No meals logged">
    <circle cx="32" cy="32" r="24" stroke={color} strokeWidth="2.5" fill={`${color}10`} />
    <circle cx="32" cy="32" r="16" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M26 24V40M22 24V32M30 24V32" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M38 24C38 30 36 34 36 40" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const EmptyStoreIllustration = ({ size = 64, color = '#3B82F6' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="No store items">
    <path d="M12 22H52L48 50H16L12 22Z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill={`${color}10`} />
    <path d="M24 22V16C24 11.6 27.6 8 32 8C36.4 8 40 11.6 40 16V22" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="32" cy="36" r="4" fill={color} />
  </svg>
);

export const EmptyMembersIllustration = ({ size = 64, color = '#A855F7' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="No members found">
    <rect x="10" y="16" width="44" height="32" rx="5" stroke={color} strokeWidth="2.5" fill={`${color}10`} />
    <circle cx="24" cy="32" r="6" stroke={color} strokeWidth="2" />
    <line x1="36" y1="28" x2="48" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <line x1="36" y1="36" x2="44" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const EmptyAttendanceIllustration = ({ size = 64, color = '#F59E0B' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="No attendance records">
    <rect x="12" y="14" width="40" height="40" rx="6" stroke={color} strokeWidth="2.5" fill={`${color}10`} />
    <line x1="12" y1="26" x2="52" y2="26" stroke={color} strokeWidth="2" />
    <circle cx="22" cy="36" r="2" fill={color} />
    <circle cx="32" cy="36" r="2" fill={color} />
    <circle cx="42" cy="36" r="2" fill={color} />
    <circle cx="22" cy="44" r="2" fill={color} />
    <circle cx="32" cy="44" r="2" fill={color} />
  </svg>
);

export const EmptyAlertsIllustration = ({ size = 64, color = '#22C55E' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="All members active">
    <path d="M32 8L14 16V28C14 41 21.6 51 32 55C42.4 51 50 41 50 28V16L32 8Z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill={`${color}12`} />
    <path d="M24 32L30 38L40 26" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const EmptyTrainersIllustration = ({ size = 64, color = '#EC4899' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="No trainers added">
    <rect x="14" y="12" width="36" height="44" rx="4" stroke={color} strokeWidth="2.5" fill={`${color}10`} />
    <path d="M24 8H40V14H24V8Z" stroke={color} strokeWidth="2" fill={`${color}25`} />
    <circle cx="32" cy="28" r="7" stroke={color} strokeWidth="2" />
    <path d="M22 46C22 41 26 38 32 38C38 38 42 41 42 46" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const EmptyWorkoutsIllustration = EmptyWorkoutIllustration;
export const EmptyMealsIllustration = EmptyDietIllustration;
