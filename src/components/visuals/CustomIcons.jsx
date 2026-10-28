// src/components/visuals/CustomIcons.jsx
// Bespoke static vector icons for MSG Visual System
import React from 'react';

const BaseIcon = ({ size = 20, color = 'currentColor', children, style = {}, className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={className}
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

// ─── Fitness & Exercise ───
export const DumbbellIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M6 5V19M18 5V19M4 7H8M16 7H20M4 17H8M16 17H20M6 12H18M2 9V15M22 9V15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const BarbellIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M2 12H22M6 8V16M18 8V16M4 10V14M20 10V14M9 12H15" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const ZapIcon = ({ size = 20, color = 'currentColor', fill = false, ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={fill ? color : `${color}22`} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const TargetIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </BaseIcon>
);

export const PlayIcon = ({ size = 20, color = 'currentColor', fill = true, ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <polygon points="6 4 19 12 6 20 6 4" fill={fill ? color : 'none'} stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </BaseIcon>
);

export const PauseIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <rect x="6" y="4" width="4" height="16" rx="1" fill={color} />
    <rect x="14" y="4" width="4" height="16" rx="1" fill={color} />
  </BaseIcon>
);

// ─── Nutrition & Health ───
export const SaladIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M4 12C4 16.4 7.6 20 12 20C16.4 20 20 16.4 20 12H4Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 6C10 4 6 5 6 9C8 9 11 8 12 6Z" fill={`${color}33`} stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M12 6C14 4 18 5 18 9C16 9 13 8 12 6Z" fill={`${color}33`} stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </BaseIcon>
);

export const ProteinSteakIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M16.5 4C13 4 8 7 6 10C3.5 13.7 4 18 8 19.5C13 21.5 19 19.5 20.5 15C22 10.5 20 4 16.5 4Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <ellipse cx="14" cy="11.5" rx="2.5" ry="2" stroke={color} strokeWidth="1.5" fill={`${color}22`} />
  </BaseIcon>
);

export const MineralSaltIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M9 4H15V8H9V4Z" stroke={color} strokeWidth="1.8" />
    <path d="M7 8H17L18.5 20H5.5L7 8Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="1" fill={color} />
    <circle cx="9.5" cy="16" r="1" fill={color} />
    <circle cx="14.5" cy="16" r="1" fill={color} />
  </BaseIcon>
);

export const WaterDropIcon = ({ size = 20, color = 'currentColor', fill = true, ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M12 3C12 3 6.5 10 6.5 14.5C6.5 17.5 8.9 20 12 20C15.1 20 17.5 17.5 17.5 14.5C17.5 10 12 3 12 3Z" fill={fill ? `${color}33` : 'none'} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

// ─── Analytics & Progress ───
export const BarChartIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M18 20V10M12 20V4M6 20V14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const TrendUpIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M22 7L13.5 15.5L8.5 10.5L2 17M22 7H16M22 7V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const TrendDownIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M22 17L13.5 8.5L8.5 13.5L2 7M22 17H16M22 17V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

// ─── Navigation & Core System ───
export const HomeIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M3 10.5L12 3L21 10.5V20C21 20.6 20.6 21 20 21H15V14H9V21H4C3.4 21 3 20.6 3 20V10.5Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const UsersIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M16 21V19C16 17.3 14.7 16 13 16H6C4.3 16 3 17.3 3 19V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="9.5" cy="8.5" r="4" stroke={color} strokeWidth="1.8" />
    <path d="M21 21V19C21 17.7 20.1 16.6 18.8 16.2M16 4.5C17.2 4.9 18 6.1 18 7.5C18 8.9 17.2 10.1 16 10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

export const UserIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M19 21V19C19 16.8 17.2 15 15 15H9C6.8 15 5 16.8 5 19V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="7.5" r="4.5" stroke={color} strokeWidth="1.8" />
  </BaseIcon>
);

export const CalendarIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
    <path d="M16 2V6M8 2V6M3 9.5H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

export const StoreIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M3 9L4.5 4H19.5L21 9V10C21 11.4 19.9 12.5 18.5 12.5C17.1 12.5 16 11.4 16 10C16 11.4 14.9 12.5 13.5 12.5C12.1 12.5 11 11.4 11 10C11 11.4 9.9 12.5 8.5 12.5C7.1 12.5 6 11.4 6 10C6 11.4 4.9 12.5 3.5 12.5C2.1 12.5 1 11.4 1 10V9M4 12.5V20H20V12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const MenuMoreIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="12" cy="12" r="1.8" fill={color} />
    <circle cx="19" cy="12" r="1.8" fill={color} />
    <circle cx="5" cy="12" r="1.8" fill={color} />
  </BaseIcon>
);

export const SettingsIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const SearchIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
    <path d="M16.5 16.5L21.5 21.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </BaseIcon>
);

export const EditIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M12 20H21M16.5 3.5L20.5 7.5L7 21H3V17L16.5 3.5Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const CopyIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <rect x="9" y="9" width="12" height="12" rx="2" stroke={color} strokeWidth="1.8" />
    <path d="M5 15H4C3.4 15 3 14.6 3 14V4C3 3.4 3.4 3 4 3H14C14.6 3 15 3.4 15 4V5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

export const TrashIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M3 6H21M19 6V20C19 20.6 18.6 21 18 21H6C5.4 21 5 20.6 5 20V6M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6M10 11V16M14 11V16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const BellIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8M13.73 21A2 2 0 0 1 10.27 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const BellOffIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M13.73 21A2 2 0 0 1 10.27 21M18.6 13C18.2 10.3 17.3 8.3 15.6 6.9M6.3 6.3C6.1 6.8 6 7.4 6 8C6 15 3 17 3 17H17M1 1L23 23" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const CameraIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M23 19C23 19.6 22.6 20 22 20H2C1.4 20 1 19.6 1 19V8C1 7.4 1.4 7 2 7H6L8 4H16L18 7H22C22.6 7 23 7.4 23 8V19Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
  </BaseIcon>
);

export const PrinterIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M6 9V2H18V9M6 18H4C2.9 18 2 17.1 2 16V11C2 9.9 2.9 9 4 9H20C21.1 9 22 9.9 22 11V16C22 17.1 21.1 18 20 18H18M6 14H18V22H6V14Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const UndoIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M9 14L4 9L9 4M4 9H15C18.3 9 21 11.7 21 15C21 18.3 18.3 21 15 21H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const LogoutIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M9 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const CreditCardIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.8" />
    <line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="1.8" />
    <path d="M6 15H10" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const UploadCloudIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M16 16L12 12L8 16M12 12V21M20.4 17.4C22.2 16.5 23 14.4 22.4 12.5C21.7 10.6 19.8 9.3 17.8 9.5C17.2 6.8 14.8 5 12 5C9.7 5 7.6 6.3 6.6 8.3C4.2 8.7 2.4 10.7 2.5 13.2C2.6 15.6 4.4 17.5 6.8 17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const BroadcastIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8M13.73 21A2 2 0 0 1 10.27 21M12 2V3M4.9 4.9L5.6 5.6M19.1 4.9L18.4 5.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

export const MegaphoneIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M3 11V15H7L14 19V7L7 11H3ZM14 10C15.5 10.7 16.5 12.2 16.5 13.5C16.5 14.8 15.5 16.3 14 17M17 7C19.8 8.4 21.5 11 21.5 13.5C21.5 16 19.8 18.6 17 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const SmartphoneIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.8" />
    <line x1="11" y1="18" x2="13" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const LocationPinIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5 7 1 12 1C17 1 21 5 21 10Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
  </BaseIcon>
);

export const CheckCircleIcon = ({ size = 20, color = 'currentColor', fill = false, ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="12" cy="12" r="9" fill={fill ? `${color}22` : 'none'} stroke={color} strokeWidth="1.8" />
    <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const WarningIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M12 3L22 20H2L12 3Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill={`${color}18`} />
    <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="1" fill={color} />
  </BaseIcon>
);

export const LockIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8" />
    <path d="M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

export const ShieldLockIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M12 2L3 6V11C3 16.5 6.8 21.7 12 23C17.2 21.7 21 16.5 21 11V6L12 2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}14`} />
    <circle cx="12" cy="11" r="2" fill={color} />
    <path d="M12 13V16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

export const KeyIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="7.5" cy="15.5" r="4.5" stroke={color} strokeWidth="1.8" />
    <path d="M10.5 12.5L20 3M20 3H16M20 3V7M16 7L18 9M13 10L15 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const GiftIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <rect x="3" y="8" width="18" height="13" rx="2" stroke={color} strokeWidth="1.8" />
    <path d="M12 8V21M3 12H21M12 8C12 8 8 6 8 4C8 2.5 9.5 2 11 3.5L12 5L13 3.5C14.5 2 16 2.5 16 4C16 6 12 8 12 8Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const LightbulbIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M9 18H15M10 21H14M12 2C8.1 2 5 5.1 5 9C5 12.4 7.2 14.5 8.5 16H15.5C16.8 14.5 19 12.4 19 9C19 5.1 15.9 2 12 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const BookOpenIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M2 4V19C4 18 7 18 10 19C11 19.3 12 19.7 12 20C12 19.7 13 19.3 14 19C17 18 20 18 22 19V4C20 3 17 3 14 4C13 4.3 12 4.7 12 5C12 4.7 11 4.3 10 4C7 3 4 3 2 4ZM12 5V20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const NotesIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const RefreshIcon = ({ size = 20, color = 'currentColor', spinOnClick = false, ...props }) => {
  const [spinning, setSpinning] = React.useState(false);
  return (
    <span
      onClick={() => {
        if (spinOnClick) {
          setSpinning(true);
          setTimeout(() => setSpinning(false), 600);
        }
      }}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <BaseIcon
        size={size}
        color={color}
        className={spinning ? 'msg-anim-spin' : ''}
        {...props}
      >
        <path d="M21 12A9 9 0 0 0 6 5.3L3 8M3 3V8H8M3 12A9 9 0 0 0 18 18.7L21 16M21 21V16H16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </BaseIcon>
    </span>
  );
};

export const CycleViewIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M4 12C4 7.6 7.6 4 12 4C14.5 4 16.7 5.1 18.2 7M20 12C20 16.4 16.4 20 12 20C9.5 20 7.3 18.9 5.8 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <polyline points="18 3 18 7 14 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="6 21 6 17 10 17" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const SunIcon = ({ size = 20, color = '#F59E0B', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="12" cy="12" r="5" fill={color} />
    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </BaseIcon>
);

export const MoonIcon = ({ size = 20, color = '#93C5FD', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3A7 7 0 0 0 21 12.8Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </BaseIcon>
);

export const SunsetIcon = ({ size = 20, color = '#F97316', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M17 18A5 5 0 0 0 7 18M12 2V9M4.2 10.2L5.6 11.6M1 18H23M12 9L9.5 6.5M12 9L14.5 6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const WaveIcon = ({ size = 20, color = '#F59E0B', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M18 11V6C18 4.9 17.1 4 16 4C14.9 4 14 4.9 14 6V11M14 8C14 6.9 13.1 6 12 6C10.9 6 10 6.9 10 8V12M10 9.5C10 8.4 9.1 7.5 8 7.5C6.9 7.5 6 8.4 6 9.5V14C6 17.3 8.7 20 12 20H13C16.3 20 19 17.3 19 14V11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const RocketIcon = ({ size = 20, color = '#E53935', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M4.5 16.5C3 15 3 13 4 11L13 2C15.5 4.5 19.5 8.5 22 11L13 20C11 21 9 21 7.5 19.5L4.5 16.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M14 7L17 10M5 19L2 22M9 16L7 20M16 9L20 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="9" r="1.5" fill={color} />
  </BaseIcon>
);

export const DiamondIcon = ({ size = 20, color = '#38BDF8', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M6 3H18L22 9L12 21L2 9L6 3Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill={`${color}22`} />
    <path d="M2 9H22M12 21L7.5 9L10 3M12 21L16.5 9L14 3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const GlobeIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <ellipse cx="12" cy="12" rx="4" ry="9" stroke={color} strokeWidth="1.8" />
    <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" />
  </BaseIcon>
);

export const SparklesIcon = ({ size = 20, color = '#F59E0B', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" fill={color} />
    <path d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z" fill={color} />
  </BaseIcon>
);

export const StarBadge = ({ text = 'BEST VALUE', style = {} }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '3px 8px',
      borderRadius: 6,
      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
      ...style,
    }}
  >
    <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
      <polygon points="12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.5 5.5 21 7 14 2 9.3 9 8.5 12 2" />
    </svg>
    {text}
  </span>
);

export const ClockIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const SleepIcon = ({ size = 20, color = '#94A3B8', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M4 19H10L4 23H10M12 11H17L12 15H17M17 3H21L17 6H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

export const BadgeTrainerIcon = ({ size = 20, color = 'currentColor', ...props }) => (
  <BaseIcon size={size} color={color} {...props}>
    <path d="M12 2L15 8.5L22 9.3L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.3L9 8.5L12 2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={`${color}22`} />
    <circle cx="12" cy="11" r="2.5" fill={color} />
  </BaseIcon>
);

export const AlertTriangleIcon = ({ size = 20, color = '#E53935', ...props }) => (
  <WarningIcon size={size} color={color} {...props} />
);
