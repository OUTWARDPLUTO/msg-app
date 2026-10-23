/**
 * engagementScore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Rolling 28-day Engagement Scoring Engine for MSG (My Smart Gains).
 *
 * Four Pillars (Total: 0 - 100):
 *  1. Consistency (0 - 30 pts): Unique active days in past 28 days (capped at 20 days).
 *  2. Workout Adherence (0 - 30 pts): Unique completed workout days vs member target.
 *  3. Healthy Habit Balance (0 - 25 pts): Nutrition (10), Attendance (7), Progress (8).
 *     * Gracefully redistributes points if gym does not track attendance.
 *  4. Recency (0 - 15 pts): 15 pts (0-1d), 10 pts (2-3d), 5 pts (4-7d), 0 pts (>7d).
 *
 * Status Thresholds:
 *  - 80 - 100: On track
 *  - 60 -  79: Building consistency
 *  - 35 -  59: Needs attention
 *  -  0 -  34: Inactive
 */

export const ROLLING_WINDOW_DAYS = 28;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const ENGAGEMENT_STATUS = {
  ON_TRACK: {
    key: 'on_track',
    label: 'On track',
    min: 80,
    max: 100,
    color: '#22c55e',
    badgeBg: 'rgba(34, 197, 94, 0.15)',
  },
  BUILDING: {
    key: 'building',
    label: 'Building consistency',
    min: 60,
    max: 79,
    color: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  NEEDS_ATTENTION: {
    key: 'needs_attention',
    label: 'Needs attention',
    min: 35,
    max: 59,
    color: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
  },
  INACTIVE: {
    key: 'inactive',
    label: 'Inactive',
    min: 0,
    max: 34,
    color: '#ef4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
  },
};

export function getStatusFromScore(score) {
  const s = Math.round(Number(score) || 0);
  if (s >= 80) return ENGAGEMENT_STATUS.ON_TRACK;
  if (s >= 60) return ENGAGEMENT_STATUS.BUILDING;
  if (s >= 35) return ENGAGEMENT_STATUS.NEEDS_ATTENTION;
  return ENGAGEMENT_STATUS.INACTIVE;
}

/**
 * Format a Date or Timestamp to 'YYYY-MM-DD' calendar key.
 */
export function toDateKey(dateOrTs) {
  if (!dateOrTs) return null;
  const d = dateOrTs.toDate ? dateOrTs.toDate() : new Date(dateOrTs);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Get the ISO week identifier (e.g. "2026-W42") for weekly frequency capping.
 */
export function toWeekKey(dateOrTs) {
  if (!dateOrTs) return null;
  const d = dateOrTs.toDate ? dateOrTs.toDate() : new Date(dateOrTs);
  if (isNaN(d.getTime())) return null;
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const weekNr = 1 + Math.ceil((firstThursday - target) / (7 * MS_PER_DAY));
  return `${target.getUTCFullYear()}-W${String(weekNr).padStart(2, '0')}`;
}

/**
 * Compute the comprehensive 0-100 rolling engagement score.
 *
 * @param {Array<Object>} rawEvents - Array of activity events { type, timestamp, ... }
 * @param {Object} options
 * @param {Date|number} [options.now] - Current timestamp (for deterministic testing & historical checks)
 * @param {number} [options.weeklyWorkoutTarget=3] - Member's weekly workout days goal (default 3)
 * @param {Date|number|null} [options.lastActiveAt] - Known last active timestamp
 * @param {boolean} [options.gymUsesAttendance=true] - Whether gym tracks attendance
 * @returns {Object} { score, status, breakdown, tips }
 */
export function computeEngagementScore(rawEvents = [], options = {}) {
  const now = options.now ? new Date(options.now).getTime() : Date.now();
  const weeklyWorkoutTarget = Math.max(1, Math.min(7, Number(options.weeklyWorkoutTarget) || 3));
  const gymUsesAttendance = options.gymUsesAttendance !== false;
  const cutoffTime = now - ROLLING_WINDOW_DAYS * MS_PER_DAY;

  // Filter events strictly to the 28-day rolling window
  const windowEvents = [];
  let latestEventTime = options.lastActiveAt
    ? (options.lastActiveAt.toDate ? options.lastActiveAt.toDate().getTime() : new Date(options.lastActiveAt).getTime())
    : 0;

  for (const ev of rawEvents) {
    if (!ev) continue;
    const t = ev.timestamp?.toDate ? ev.timestamp.toDate().getTime() : new Date(ev.timestamp || 0).getTime();
    if (isNaN(t) || t < cutoffTime || t > now + 60000) continue; // ignore future/expired
    windowEvents.push({ ...ev, _time: t });
    if (t > latestEventTime) latestEventTime = t;
  }

  // ── 1. Consistency: Unique active calendar days (0 - 30 pts) ───────────────
  const activeDayKeys = new Set();
  const workoutDayKeys = new Set();
  const dietDayKeys = new Set();
  const checkInDayKeys = new Set();
  const progressWeekKeys = new Set();

  for (const ev of windowEvents) {
    const dayKey = toDateKey(ev._time);
    if (!dayKey) continue;
    activeDayKeys.add(dayKey);

    const type = (ev.type || '').toLowerCase();
    if (type === 'workout') {
      workoutDayKeys.add(dayKey);
    } else if (type === 'diet' || type === 'nutrition') {
      dietDayKeys.add(dayKey);
    } else if (type === 'checkin' || type === 'attendance') {
      checkInDayKeys.add(dayKey);
    } else if (type === 'progress') {
      const weekKey = toWeekKey(ev._time);
      if (weekKey) progressWeekKeys.add(weekKey);
    }
  }

  const uniqueActiveDays = activeDayKeys.size;
  // 20 distinct active days out of 28 awards full 30 consistency points
  const consistencyPoints = Math.min(30, Math.round((uniqueActiveDays / 20) * 30));

  // ── 2. Workout Adherence (0 - 30 pts) ───────────────────────────────────────
  // Over 28 days = 4 weeks. Target workouts = weeklyTarget * 4.
  const targetWorkoutDays = weeklyWorkoutTarget * 4;
  const actualWorkoutDays = workoutDayKeys.size;
  const workoutPoints = Math.min(30, Math.round((actualWorkoutDays / targetWorkoutDays) * 30));

  // ── 3. Healthy Habit Balance (0 - 25 pts) ───────────────────────────────────
  let dietPoints = 0;
  let checkInPoints = 0;
  let progressPoints = 0;
  let maxDiet = 10;
  let maxCheckIn = 7;
  let maxProgress = 8;

  if (gymUsesAttendance) {
    // Standard gym: 10 diet (14d target), 7 check-in (8d target), 8 progress (4 weeks target)
    dietPoints = Math.min(10, Math.round((dietDayKeys.size / 14) * 10));
    checkInPoints = Math.min(7, Math.round((checkInDayKeys.size / 8) * 7));
    progressPoints = Math.min(8, Math.round((progressWeekKeys.size / 4) * 8));
  } else {
    // Attendance not used by this gym: re-allocate 7 attendance points without penalty
    maxDiet = 14;
    maxCheckIn = 0;
    maxProgress = 11;
    dietPoints = Math.min(14, Math.round((dietDayKeys.size / 14) * 14));
    checkInPoints = 0;
    progressPoints = Math.min(11, Math.round((progressWeekKeys.size / 4) * 11));
  }

  const habitPoints = Math.min(25, dietPoints + checkInPoints + progressPoints);

  // ── 4. Recency (0 - 15 pts) ────────────────────────────────────────────────
  let recencyPoints = 0;
  let daysSinceActive = 999;

  if (latestEventTime > 0) {
    const diffMs = Math.max(0, now - latestEventTime);
    daysSinceActive = Math.floor(diffMs / MS_PER_DAY);

    if (daysSinceActive <= 1) {
      recencyPoints = 15; // active today or yesterday
    } else if (daysSinceActive <= 3) {
      recencyPoints = 10; // active within 3 days
    } else if (daysSinceActive <= 7) {
      recencyPoints = 5;  // active within 7 days
    } else {
      recencyPoints = 0;  // inactive > 7 days
    }
  }

  // ── Final Score & Clamping ──────────────────────────────────────────────────
  const rawTotal = consistencyPoints + workoutPoints + habitPoints + recencyPoints;
  const score = Math.max(0, Math.min(100, Math.round(rawTotal)));
  const status = getStatusFromScore(score);

  // ── Actionable Coaching Tips ───────────────────────────────────────────────
  const tips = [];
  if (daysSinceActive > 3) {
    tips.push('Visit the gym or log an activity today to recover up to 15 recency points.');
  }
  if (actualWorkoutDays < targetWorkoutDays) {
    const remaining = targetWorkoutDays - actualWorkoutDays;
    tips.push(`Log ${remaining} more workout${remaining > 1 ? 's' : ''} to reach your 28-day goal.`);
  }
  if (dietDayKeys.size < 14) {
    tips.push('Log meals more consistently to earn extra healthy habit points.');
  }
  if (gymUsesAttendance && checkInDayKeys.size < 8) {
    tips.push('Scan the gym QR code during visits for attendance consistency.');
  }
  if (progressWeekKeys.size < 4) {
    tips.push('Update your body weight or measurements once a week to max out progress points.');
  }
  if (tips.length === 0) {
    tips.push('Outstanding consistency! Keep showing up and maintain your momentum.');
  }

  return {
    score,
    status: status.label,
    statusKey: status.key,
    color: status.color,
    badgeBg: status.badgeBg,
    breakdown: {
      consistency: {
        points: consistencyPoints,
        max: 30,
        activeDays: uniqueActiveDays,
        targetDays: 20,
      },
      workouts: {
        points: workoutPoints,
        max: 30,
        completedDays: actualWorkoutDays,
        targetDays: targetWorkoutDays,
        weeklyTarget: weeklyWorkoutTarget,
      },
      habits: {
        points: habitPoints,
        max: 25,
        diet: { points: dietPoints, max: maxDiet, days: dietDayKeys.size },
        checkIn: { points: checkInPoints, max: maxCheckIn, days: checkInDayKeys.size, enabled: gymUsesAttendance },
        progress: { points: progressPoints, max: maxProgress, weeks: progressWeekKeys.size },
      },
      recency: {
        points: recencyPoints,
        max: 15,
        daysAgo: daysSinceActive === 999 ? null : daysSinceActive,
      },
    },
    tips,
    computedAt: new Date(now).toISOString(),
  };
}
