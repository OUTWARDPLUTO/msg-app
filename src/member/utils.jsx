import { C } from '../shared/theme.js';
export function parseLogDate(dateStr) {
  // Handles "Feb 7", "Mar 14" etc. — tries current year, falls back to last year
  const y = new Date().getFullYear();
  let d = new Date(`${dateStr} ${y}`);
  if (isNaN(d.getTime())) return null;
  // If the parsed date is more than 30 days in the future, it must be last year
  if (d.getTime() > Date.now() + 30 * 86400000) d = new Date(`${dateStr} ${y - 1}`);
  return d;
}

export function getWeekStart(ts) {
  // Returns Monday 00:00:00 of the week containing ts
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((dow + 6) % 7)); // shift to Monday
  return d.getTime();
}

export function calcStreak(logs) {
  if (!logs.length) return 0;
  const parsed = logs.map(l => parseLogDate(l.date)).filter(Boolean);
  if (!parsed.length) return 0;

  // Collect unique day timestamps
  const daySet = new Set(parsed.map(d => new Date(d).setHours(0,0,0,0)));
  const days = [...daySet].sort((a, b) => b - a); // newest first

  const today = new Date().setHours(0,0,0,0);
  const yesterday = today - 86400000;

  // Streak is alive only if user logged today or yesterday
  if (days[0] < yesterday) return 0;

  // Count consecutive days backwards
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = (days[i - 1] - days[i]) / 86400000;
    if (Math.round(gap) === 1) streak++;
    else break;
  }
  return streak;
}

export function getThisWeekActivity(logs) {
  // Returns [Mon, Tue, Wed, Thu, Fri, Sat, Sun] boolean array for current Mon–Sun week
  const parsed = logs.map(l => parseLogDate(l.date)).filter(Boolean);
  const weekStart = getWeekStart(Date.now());
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = weekStart + i * 86400000;
    const dayEnd = dayStart + 86400000;
    return parsed.some(d => d.getTime() >= dayStart && d.getTime() < dayEnd);
  });
}

export function getTodayDowIndex() {
  // Mon=0 … Sun=6 (matches getThisWeekActivity order)
  return (new Date().getDay() + 6) % 7;
}

// ─── Chart Tooltip (top-level — never define components inside render) ────────
export function ChartTip({ active, payload, label, color, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ color: C.sub, fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color }}>{payload[0].value}{unit}</div>
    </div>
  );
}


