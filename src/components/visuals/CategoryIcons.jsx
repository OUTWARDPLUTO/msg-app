// src/components/visuals/CategoryIcons.jsx
// Visual components for Store Categories, Workout Modalities, Payment Methods, and Dayparts
import React from 'react';
import {
  SunIcon,
  SunsetIcon,
  MoonIcon,
  WaveIcon,
  CreditCardIcon,
  DumbbellIcon,
} from './CustomIcons';

/**
 * Store Product Category Vector Icons
 */
export const ProductCategoryIcon = ({ category = 'Other', size = 28, color = 'currentColor', style = {} }) => {
  const norm = String(category).toLowerCase();

  if (norm.includes('protein')) {
    // Shaker cup / Whey tub with measurement markers
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="Protein">
        <path d="M8 8H20L18.5 24H9.5L8 8Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}15`} />
        <path d="M6 5H22V8H6V5Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill={`${color}30`} />
        <path d="M11 2H17V5H11V2Z" fill={color} />
        <line x1="12" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="16" x2="16" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (norm.includes('creatine')) {
    // Energy / Performance Molecular Crystal
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="Creatine">
        <polygon points="14 3 23 8 23 20 14 25 5 20 5 8 14 3" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}15`} />
        <polygon points="15 7 9 15 14 15 13 21 19 13 14 13 15 7" fill={color} />
      </svg>
    );
  }

  if (norm.includes('vitamin')) {
    // Pharmaceutical Capsule & Bio-ring
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="Vitamins">
        <path d="M7 14C7 10.1 10.1 7 14 7V21C10.1 21 7 17.9 7 14Z" fill={color} stroke={color} strokeWidth="1.8" />
        <path d="M21 14C21 10.1 17.9 7 14 7V21C17.9 21 21 17.9 21 14Z" stroke={color} strokeWidth="1.8" fill={`${color}20`} />
        <circle cx="21" cy="7" r="3" fill="#F59E0B" />
      </svg>
    );
  }

  if (norm.includes('pre-workout') || norm.includes('preworkout')) {
    // Thermogenic Ignition Spark
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="Pre-Workout">
        <path d="M14 2C14 2 17 7 17 10C17 12 16 13 15 14C19 14 22 17 22 20.5C22 24.5 18.5 26 14 26C9.5 26 6 24.5 6 20.5C6 17 8.5 15 11 14C11 10 14 2 14 2Z" fill={`${color}30`} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="14" cy="20" r="3" fill={color} />
      </svg>
    );
  }

  if (norm.includes('bcaa')) {
    // Branched Chain Amino Acid Link
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="BCAA">
        <circle cx="7" cy="14" r="3.5" fill={color} />
        <circle cx="21" cy="7" r="3.5" fill={color} />
        <circle cx="21" cy="21" r="3.5" fill={color} />
        <line x1="10" y1="13" x2="18" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="15" x2="18" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (norm.includes('fat') || norm.includes('burner')) {
    // Metabolic Speedometer
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="Fat Burner">
        <path d="M5 19C5 14 9 10 14 10C19 10 23 14 23 19" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="19" x2="19" y2="13" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="14" cy="19" r="2.5" fill={color} />
      </svg>
    );
  }

  if (norm.includes('accessori') || norm.includes('gear')) {
    // Wrist Wrap / Strap / Athletic Gear
    return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="Accessories">
        <rect x="5" y="8" width="18" height="12" rx="3" stroke={color} strokeWidth="2" fill={`${color}15`} />
        <path d="M10 8V20M14 8V20M18 8V20" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
        <rect x="7" y="11" width="4" height="6" rx="1" fill={color} />
      </svg>
    );
  }

  // Fallback: Premium Product Package Box
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={style} aria-label="Product">
      <path d="M14 3L23 8V19L14 24L5 19V8L14 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}15`} />
      <path d="M5 8L14 13L23 8M14 13V24" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * Workout Modality Category Icons
 */
export const WorkoutModalityIcon = ({ modality = 'strength', size = 16, color = 'currentColor', style = {} }) => {
  const norm = String(modality).toLowerCase();

  switch (norm) {
    case 'strength':
      return <DumbbellIcon size={size} color={color} style={style} />;
    case 'bands':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} aria-label="Resistance Bands">
          <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="2.5" strokeDasharray="3 3" />
          <circle cx="10" cy="10" r="4.5" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'pilates':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} aria-label="Pilates">
          <ellipse cx="10" cy="10" rx="8" ry="4" stroke={color} strokeWidth="1.8" transform="rotate(-20 10 10)" />
          <circle cx="10" cy="10" r="2.5" fill={color} />
        </svg>
      );
    case 'yoga':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} aria-label="Yoga">
          <circle cx="10" cy="4" r="2" fill={color} />
          <path d="M5 16C5 12 7 9 10 9C13 9 15 12 15 16M3 13C6 11 10 12 10 12M17 13C14 11 10 12 10 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'stretch':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} aria-label="Stretch">
          <circle cx="8" cy="5" r="2" fill={color} />
          <path d="M4 16L9 11L12 14L17 7M17 7H13M17 7V11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'recovery':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} aria-label="Recovery">
          <path d="M3 11C3 14.9 6.1 18 10 18C13.9 18 17 14.9 17 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7 6C7 8 8.3 9 10 9C11.7 9 13 8 13 6M10 2V4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'rehab':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} aria-label="Rehab">
          <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.8" fill={`${color}15`} />
          <path d="M10 6V14M6 10H14" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'foundation':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={style} aria-label="Foundation">
          <path d="M10 17V8M10 8C7 8 5 6 5 3C8 3 10 5 10 8ZM10 8C13 8 15 6 15 3C12 3 10 5 10 8Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill={`${color}20`} />
        </svg>
      );
    default:
      return <DumbbellIcon size={size} color={color} style={style} />;
  }
};

/**
 * Payment Method Vector Icons
 */
export const PaymentMethodIcon = ({ method = 'qr', size = 22, color = 'currentColor', style = {} }) => {
  switch (method) {
    case 'qr':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-label="Scan QR">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
          <rect x="14" y="14" width="3" height="3" fill={color} />
          <rect x="18" y="18" width="3" height="3" fill={color} />
          <rect x="18" y="14" width="3" height="3" fill={color} />
          <rect x="14" y="18" width="3" height="3" fill={color} />
        </svg>
      );
    case 'razorpay':
    case 'card':
      return <CreditCardIcon size={size} color={color} style={style} />;
    case 'bank':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-label="Bank Transfer">
          <path d="M3 9L12 3L21 9V10H3V9Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}20`} />
          <line x1="6" y1="10" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="10" x2="12" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="10" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <rect x="2" y="18" width="20" height="3" rx="0.5" stroke={color} strokeWidth="1.8" />
        </svg>
      );
    default:
      return <CreditCardIcon size={size} color={color} style={style} />;
  }
};

/**
 * Daypart Icon: Resolves greeting time-of-day
 */
export const DaypartIcon = ({ hour = 12, size = 18, style = {} }) => {
  if (hour < 12) return <SunIcon size={size} color="#F59E0B" style={style} />;
  if (hour < 17) return <WaveIcon size={size} color="#E53935" style={style} />;
  if (hour < 21) return <SunsetIcon size={size} color="#F97316" style={style} />;
  return <MoonIcon size={size} color="#93C5FD" style={style} />;
};
