/**
 * test/engagementScore.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the 28-day rolling engagement scoring engine.
 */

import assert from 'node:assert';
import {
  computeEngagementScore,
  getStatusFromScore,
  toDateKey,
  toWeekKey,
  ROLLING_WINDOW_DAYS,
  MS_PER_DAY,
} from '../src/shared/engagementScore.js';

console.log('🧪 Running Engagement Score Engine Unit Tests...\n');

const BASE_NOW = new Date('2026-10-23T12:00:00Z').getTime();

// ── Test 1: Empty state / brand new member ────────────────────────────────────
{
  const res = computeEngagementScore([], { now: BASE_NOW });
  assert.strictEqual(res.score, 0, 'Empty events must produce a score of 0');
  assert.strictEqual(res.status, 'Inactive');
  assert.strictEqual(res.statusKey, 'inactive');
  assert.strictEqual(res.breakdown.consistency.points, 0);
  assert.strictEqual(res.breakdown.workouts.points, 0);
  assert.strictEqual(res.breakdown.habits.points, 0);
  assert.strictEqual(res.breakdown.recency.points, 0);
  console.log('✅ Test 1 passed: Empty state yields 0 score');
}

// ── Test 2: Same-day spam resistance (anti-cheat) ─────────────────────────────
{
  // User submits 10 workouts and 10 diet logs on the exact same day
  const events = [];
  for (let i = 0; i < 10; i++) {
    events.push({ type: 'workout', timestamp: new Date(BASE_NOW - 1000 * 60 * i) });
    events.push({ type: 'diet', timestamp: new Date(BASE_NOW - 1000 * 60 * i) });
  }

  const res = computeEngagementScore(events, { now: BASE_NOW, weeklyWorkoutTarget: 3 });
  // 1 active day => consistency: round(1/20 * 30) = 2 pts
  // 1 workout day out of 12 => round(1/12 * 30) = 3 pts
  // 1 diet day => round(1/14 * 10) = 1 pt
  // Recency => today = 15 pts
  // Total ~ 21 pts (NOT 100 or 80)
  assert.strictEqual(res.breakdown.consistency.activeDays, 1, 'Only 1 active day counted despite 20 events');
  assert.strictEqual(res.breakdown.workouts.completedDays, 1, 'Only 1 workout day counted');
  assert.strictEqual(res.breakdown.habits.diet.days, 1, 'Only 1 diet day counted');
  assert.ok(res.score < 30, `Same-day spam should not inflate score (was ${res.score})`);
  console.log('✅ Test 2 passed: Same-day spam correctly capped');
}

// ── Test 3: Natural Inactivity Decay ──────────────────────────────────────────
{
  // Member had 12 workout days and 10 diet days between 25 and 15 days ago, but has been inactive for the last 10 days
  const events = [];
  for (let d = 10; d < 22; d++) {
    events.push({ type: 'workout', timestamp: new Date(BASE_NOW - d * MS_PER_DAY) });
    events.push({ type: 'diet', timestamp: new Date(BASE_NOW - d * MS_PER_DAY) });
  }

  const resInactive10Days = computeEngagementScore(events, { now: BASE_NOW });
  assert.strictEqual(resInactive10Days.breakdown.recency.points, 0, 'Recency points must be 0 after >7 days of inactivity');
  assert.strictEqual(resInactive10Days.breakdown.recency.daysAgo, 10);

  // If member was active yesterday instead:
  events.push({ type: 'workout', timestamp: new Date(BASE_NOW - 1 * MS_PER_DAY) });
  const resActiveYesterday = computeEngagementScore(events, { now: BASE_NOW });
  assert.strictEqual(resActiveYesterday.breakdown.recency.points, 15, 'Active yesterday earns full 15 recency points');

  // Verify decay difference
  const decayDiff = resActiveYesterday.score - resInactive10Days.score;
  assert.ok(decayDiff >= 15, `Score should naturally decay when member is inactive (decay was ${decayDiff})`);
  console.log(`✅ Test 3 passed: Inactivity decay verified (-${decayDiff} pts when inactive 10d vs active yesterday)`);
}

// ── Test 4: Perfect engagement reaches 100 cap ────────────────────────────────
{
  const events = [];
  // 24 active days across 28 days with full workouts (4 days/week = 16 days), diet (20 days), checkins (12 days), progress (4 weeks)
  for (let d = 0; d < 24; d++) {
    const t = new Date(BASE_NOW - d * MS_PER_DAY);
    events.push({ type: 'diet', timestamp: t });
    if (d % 2 === 0) events.push({ type: 'workout', timestamp: t }); // 12 workouts
    if (d % 3 === 0) events.push({ type: 'checkin', timestamp: t }); // 8 checkins
    if (d % 7 === 0) events.push({ type: 'progress', timestamp: t }); // 4 weeks
  }

  const res = computeEngagementScore(events, { now: BASE_NOW, weeklyWorkoutTarget: 3 });
  assert.strictEqual(res.score, 100, `Highly engaged member should achieve 100 (got ${res.score})`);
  assert.strictEqual(res.status, 'On track');
  assert.strictEqual(res.statusKey, 'on_track');
  console.log('✅ Test 4 passed: High engagement achieves 100 and "On track" label');
}

// ── Test 5: Attendance-free gym redistribution ────────────────────────────────
{
  const events = [];
  for (let d = 0; d < 14; d++) {
    const t = new Date(BASE_NOW - d * MS_PER_DAY);
    events.push({ type: 'diet', timestamp: t });
  }

  const withAtt = computeEngagementScore(events, { now: BASE_NOW, gymUsesAttendance: true });
  const withoutAtt = computeEngagementScore(events, { now: BASE_NOW, gymUsesAttendance: false });

  assert.strictEqual(withAtt.breakdown.habits.checkIn.enabled, true);
  assert.strictEqual(withoutAtt.breakdown.habits.checkIn.enabled, false);
  assert.ok(withoutAtt.breakdown.habits.diet.points > withAtt.breakdown.habits.diet.points, 'Points redistributed when gym has no attendance tracking');
  console.log('✅ Test 5 passed: Attendance-free gym correctly redistributes habit points');
}

// ── Test 6: Status thresholds verification ────────────────────────────────────
{
  assert.strictEqual(getStatusFromScore(100).label, 'On track');
  assert.strictEqual(getStatusFromScore(80).label, 'On track');
  assert.strictEqual(getStatusFromScore(79).label, 'Building consistency');
  assert.strictEqual(getStatusFromScore(60).label, 'Building consistency');
  assert.strictEqual(getStatusFromScore(59).label, 'Needs attention');
  assert.strictEqual(getStatusFromScore(35).label, 'Needs attention');
  assert.strictEqual(getStatusFromScore(34).label, 'Inactive');
  assert.strictEqual(getStatusFromScore(0).label, 'Inactive');
  console.log('✅ Test 6 passed: All status thresholds map accurately (80/60/35 boundaries)');
}

console.log('\n🎉 ALL ENGAGEMENT SCORE UNIT TESTS PASSED SUCCESSFULLY!\n');
