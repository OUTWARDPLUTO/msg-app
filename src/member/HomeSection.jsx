import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';
import AttendanceButton from '../sections/AttendanceButton.jsx';
import { BASE_DRI, API_URL, callClaude } from './memberData.js';
import { parseLogDate, getWeekStart, calcStreak, getThisWeekActivity, getTodayDowIndex, ChartTip } from './utils.jsx';
import { Card, Tag, Lbl, Hd, NRow } from './primitives.jsx';
import { MembershipCard, AttendanceHeatMap } from './StoreSection.jsx';

export default function HomeSection({ mealLog, progressLogs, dietGoal, onLogClick, user, gymId, onAchievementsClick, setBackHandler }) {
  const [checkInKey, setCheckInKey] = useState(0);
  const tot = mealLog.reduce((a, i) => ({ cal: a.cal + i.calories, p: a.p + i.protein, c: a.c + (i.carbs || 0), f: a.f + (i.fat || 0), na: a.na + (i.sodium || 0) }), { cal: 0, p: 0, c: 0, f: 0, na: 0 });
  const dri = { ...BASE_DRI, ...(dietGoal || {}) };
  const last = progressLogs[progressLogs.length - 1];
  const prev = progressLogs[progressLogs.length - 2];
  const wDiff = last && prev ? (last.weight - prev.weight).toFixed(1) : null;

  const streak = calcStreak(progressLogs);
  const weekDone = getThisWeekActivity(progressLogs);
  const todayIdx = getTodayDowIndex();
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '👋' : hour < 21 ? '🌆' : '🌙';
  const firstName = (user?.name || 'there').split(' ')[0];

  // Water quick-log shared with WaterTracker (same localStorage keys)
  const W_TODAY_KEY = `msg_water_${new Date().toISOString().slice(0, 10)}`;
  const wGoalMl = (() => { try { return parseInt(localStorage.getItem('msg_water_goal_ml') || '2000', 10); } catch { return 2000; } })();
  const wGoalGlasses = Math.round(wGoalMl / 250);
  const wMaxGlasses  = Math.ceil(wGoalGlasses * 1.5);
  const [wGlasses, setWGlasses] = useState(() => { try { return parseInt(localStorage.getItem(W_TODAY_KEY) || '0', 10); } catch { return 0; } });
  const updateWater = (n) => {
    const v = Math.max(0, Math.min(n, wMaxGlasses));
    setWGlasses(v);
    try { localStorage.setItem(W_TODAY_KEY, String(v)); } catch {}
  };
  const wPct  = Math.min((wGlasses / wGoalGlasses) * 100, 100);
  const wDone = wGlasses >= wGoalGlasses;
  const wc    = wDone ? C.accent : C.blue;


  const insights = [
    tot.p < dri.protein * 0.7 && { icon: '🥩', text: `You're at ${Math.round(tot.p)}g protein — need ${dri.protein}g today`, c: C.orange },
    tot.na > 2300 && { icon: '🧂', text: `High sodium today (${Math.round(tot.na)}mg) — watch salty foods`, c: C.red },
    tot.cal > dri.calories * 1.1 && { icon: '⚠️', text: `You're ${Math.round(tot.cal - dri.calories)} kcal over today's goal`, c: C.red },
    streak > 0 ? { icon: '🔥', text: `${streak}-day check-in streak — momentum is everything!`, c: C.accent }
      : { icon: '📋', text: 'No recent check-ins — log your progress to start a streak!', c: C.orange },
    last && wDiff && parseFloat(wDiff) < 0 && { icon: '📉', text: `Down ${Math.abs(wDiff)}kg since last check-in — great progress!`, c: C.green },
  ].filter(Boolean);

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ padding: '28px 20px 14px' }}>
        <div style={{ color: C.sub, fontSize: 11, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.15, marginTop: 6, letterSpacing: '-0.02em' }}>
          {greeting}, <span style={{ color: C.accent }}>{firstName}</span> {greetEmoji}
        </div>
      </div>

      {/* Smart Insights */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: ins.c + '0D', border: `1px solid ${ins.c}28`, borderRadius: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, lineHeight: '20px' }}>{ins.icon}</span>
            <span style={{ fontSize: 12.5, color: ins.c, lineHeight: 1.45, fontWeight: 500 }}>{ins.text}</span>
          </div>
        ))}
      </div>

      {/* Membership Status Card */}
      {gymId && user?.uid && <MembershipCard uid={user.uid} gymId={gymId} setBackHandler={setBackHandler} />}

      {/* Attendance Check-in Button */}
      {gymId && user?.uid && (
        <AttendanceButton
          uid={user.uid}
          gymId={gymId}
          onCheckIn={() => setCheckInKey(k => k + 1)}
        />
      )}

      {/* Check-in Heatmap */}
      {gymId && user?.uid && <AttendanceHeatMap key={checkInKey} uid={user.uid} gymId={gymId} />}

      {/* Stats row */}
      <div id="tut-stats" style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '0 0 auto', width: 90 }}>
          <Card style={{ background: C.accentD || C.s3, border: `1px solid ${C.accent}40`, textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: fn, fontSize: 40, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{streak}</div>
            <div style={{ color: C.accent, opacity: .7, fontSize: 8, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
              {streak === 1 ? 'Day' : 'Days'}
            </div>
            <div style={{ fontSize: 18, marginTop: 4 }}>{streak > 0 ? '🔥' : '💤'}</div>
          </Card>
          <button onClick={onLogClick} style={{
            background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 6px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent + '18', border: `1.5px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
            <div style={{ fontSize: 8, fontFamily: fb, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.accent, lineHeight: 1.2, textAlign: 'center' }}>Log<br />Progress</div>
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card style={{ padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <Lbl text="Calories Today" style={{ marginBottom: 4 }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{Math.round(tot.cal)}</span>
                <span style={{ color: C.muted, fontSize: 11 }}>/ {dri.calories} kcal</span>
              </div>
            </div>
            {mealLog.length > 0 ? (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', zIndex: 1, opacity: 0.25 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{ cal: 0 }, ...mealLog.reduce((acc, curr) => { acc.push({ cal: (acc.length ? acc[acc.length - 1].cal : 0) + curr.calories }); return acc; }, [])]}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={tot.cal > dri.calories ? C.red : C.accent} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={tot.cal > dri.calories ? C.red : C.accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="stepAfter" dataKey="cal" stroke={tot.cal > dri.calories ? C.red : C.accent} strokeWidth={2} fillOpacity={1} fill="url(#colorCal)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 4, background: C.s4, borderRadius: 2, marginTop: 7, position: 'relative', zIndex: 2 }}>
                <div style={{ height: '100%', width: `${Math.min(Math.round((tot.cal / dri.calories) * 100), 100)}%`, background: tot.cal > dri.calories ? C.red : C.accent, borderRadius: 2 }} />
              </div>
            )}
          </Card>
          {last && (
            <Card style={{ padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <Lbl text="Body Weight" style={{ marginBottom: 4 }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{last.weight}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>kg</span>
                  {wDiff && <span style={{ color: parseFloat(wDiff) < 0 ? C.green : C.orange, fontSize: 11, fontFamily: fb, fontWeight: 700 }}>{parseFloat(wDiff) < 0 ? wDiff : '+' + wDiff}</span>}
                </div>
              </div>
              {progressLogs.length > 1 && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', zIndex: 1, opacity: 0.35 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressLogs.slice(-7)}>
                      <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.green} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="weight" stroke={C.green} strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" isAnimationActive={false} />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Macro mini */}
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 }}>
        {[{ l: 'Protein', v: Math.round(tot.p), max: dri.protein, c: C.blue }, { l: 'Carbs', v: Math.round(tot.c), max: dri.carbs, c: C.teal }, { l: 'Fat', v: Math.round(tot.f), max: dri.fat, c: C.orange }].map(m => (
          <Card key={m.l} style={{ flex: 1, padding: '10px 12px' }}>
            <div style={{ color: m.c, fontSize: 9, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.3, marginTop: 2 }}>{m.v}g</div>
            <div style={{ height: 3, background: C.s4, borderRadius: 2, marginTop: 4 }}>
              <div style={{ height: '100%', width: `${Math.min(Math.round((m.v / m.max) * 100), 100)}%`, background: m.c, borderRadius: 2 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Nutrition Log Summary — ring chart */}
      <div style={{ padding: '10px 16px 0' }}>
        <Card style={{ padding: '13px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Lbl text="Nutrition Today" />
            <span style={{ fontSize: 10, color: C.muted }}>{mealLog.length} item{mealLog.length !== 1 ? 's' : ''} logged</span>
          </div>
          {/* Interactive water quick-log */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            padding: '8px 10px', background: C.s3, borderRadius: 10,
            border: `1px solid ${wDone ? wc + '55' : 'transparent'}`,
            transition: 'border-color 0.3s',
          }}>
            {/* Tap emoji to add a glass */}
            <button
              onClick={() => updateWater(wGlasses + 1)}
              disabled={wGlasses >= wMaxGlasses}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 18, cursor: wGlasses >= wMaxGlasses ? 'default' : 'pointer',
                lineHeight: 1, flexShrink: 0,
                filter: wDone ? 'drop-shadow(0 0 4px ' + wc + ')' : 'none',
                transition: 'filter 0.3s, transform 0.15s',
                transform: 'scale(1)',
              }}
              title="Tap to add a glass"
            >💧</button>

            {/* Progress bar */}
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, background: C.s4, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${wPct}%`, background: wc, borderRadius: 2, transition: 'width 0.35s ease' }} />
              </div>
            </div>

            {/* Count label */}
            <span style={{ fontSize: 11, color: wc, fontFamily: fb, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}>
              {wGlasses}/{wGoalGlasses} {wDone ? '✓' : 'glasses'}
            </span>

            {/* − button */}
            <button
              onClick={() => updateWater(wGlasses - 1)}
              disabled={wGlasses === 0}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: C.s4, border: `1px solid ${C.border}`,
                color: wGlasses === 0 ? C.muted : C.text,
                fontSize: 14, fontWeight: 700, lineHeight: 1,
                cursor: wGlasses === 0 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: wGlasses === 0 ? 0.35 : 1, flexShrink: 0,
              }}
            >−</button>
          </div>

          {mealLog.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '8px 0' }}>No food logged yet — tap Diet to start tracking 🥗</div>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[
                { l: 'Cal', v: Math.round(tot.cal), max: dri.calories, c: C.accent },
                { l: 'Protein', v: Math.round(tot.p), max: dri.protein, c: C.blue },
                { l: 'Carbs', v: Math.round(tot.c || 0), max: dri.carbs, c: C.teal },
                { l: 'Fat', v: Math.round(tot.f || 0), max: dri.fat, c: C.orange },
              ].map(m => {
                const pct = Math.min(Math.round((m.v / m.max) * 100), 100);
                const over = m.v > m.max;
                const r = 18, circ = 2 * Math.PI * r;
                return (
                  <div key={m.l} style={{ flex: 1, textAlign: 'center' }}>
                    <svg width="46" height="46" viewBox="0 0 46 46" style={{ display: 'block', margin: '0 auto 4px' }}>
                      <circle cx="23" cy="23" r={r} fill="none" stroke={C.s4} strokeWidth="4" />
                      <circle cx="23" cy="23" r={r} fill="none"
                        stroke={over ? C.red : m.c} strokeWidth="4"
                        strokeDasharray={circ}
                        strokeDashoffset={circ * (1 - pct / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 23 23)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                      <text x="23" y="27" textAnchor="middle" fontSize="9" fontWeight="700" fill={over ? C.red : m.c} fontFamily="sans-serif">{pct}%</text>
                    </svg>
                    <div style={{ fontSize: 8, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.l}</div>
                    <div style={{ fontSize: 10, color: C.text, fontWeight: 600, marginTop: 1 }}>{m.v}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Weekly dots — driven by real log data */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Lbl text="This Week" />
            <span style={{ fontSize: 10, color: C.muted }}>
              {weekDone.filter(Boolean).length}/7 days logged
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {DAY_LABELS.map((d, i) => {
              const logged = weekDone[i];
              const isToday = i === todayIdx;
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: logged ? C.accent : 'transparent',
                    border: isToday && !logged ? `2px solid ${C.accent}` : logged ? 'none' : `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px',
                    color: logged ? '#000' : isToday ? C.accent : C.muted,
                    fontSize: logged ? 13 : 11, fontWeight: 700,
                    boxShadow: isToday ? `0 0 0 3px ${C.accent}22` : 'none',
                  }}>{logged ? '✓' : d}</div>
                  <div style={{ color: isToday ? C.accent : C.muted, fontSize: 9, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase' }}>{d}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Weight trend mini-chart */}
      {progressLogs.length >= 2 && (
        <div style={{ padding: '14px 16px 0' }}>
          <Card style={{ padding: '14px 14px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Lbl text="Weight Trend" />
              <span style={{ fontFamily: fn, fontSize: 13, fontWeight: 700, color: wDiff && parseFloat(wDiff) < 0 ? C.green : C.orange }}>
                {last ? `${last.weight} kg` : '—'}
                {wDiff && <span style={{ fontSize: 10, marginLeft: 4 }}>{parseFloat(wDiff) < 0 ? '↓' : '↑'}{Math.abs(wDiff)}</span>}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={progressLogs} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="hwg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: C.muted, fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTip color={C.accent} unit="kg" />} />
                <Area type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2} fill="url(#hwg)" dot={{ fill: C.accent, r: 2, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Progress summary row */}
      {last && (
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 }}>
          {[
            { l: 'Waist', v: last.waist > 0 ? `${last.waist}cm` : '—', c: C.blue },
            { l: 'Arms', v: last.arms > 0 ? `${last.arms}cm` : '—', c: C.teal },
            { l: 'Body Fat', v: last.bodyFat > 0 ? `${last.bodyFat}%` : '—', c: C.orange },
          ].map(s => (
            <Card key={s.l} style={{ flex: 1, padding: '9px 10px', textAlign: 'center' }}>
              <div style={{ color: s.c, fontSize: 8, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
              <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.3, marginTop: 2 }}>{s.v}</div>
            </Card>
          ))}
        </div>


      )}
            {/* Nutrition Log Chart */}
        {mealLog.length > 0 && (
          <div style={{ padding: '14px 16px 0' }}>
            <Card style={{ padding: '16px 12px 12px' }}>
              <div style={{ fontFamily: fn, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12, paddingLeft: 4 }}>Calorie Intake Logs</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[...mealLog].reverse()}>
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} hide />
                  <Tooltip content={ChartTip} cursor={{ fill: C.s3 }} />
                  <Bar dataKey="calories" fill={C.accent} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

      {/* ── Achievements Quick-Access ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div
          id="tut-achievements"
          onClick={onAchievementsClick}
          style={{
            background: `linear-gradient(135deg,${C.s2},${C.s3})`,
            border: `1px solid ${C.accent}30`,
            borderRadius: 18,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 4px 18px ${C.accent}18`,
            transition: 'transform 0.18s, box-shadow 0.18s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* Glow blob */}
          <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, background: C.accent + '18', borderRadius: '50%', filter: 'blur(18px)', pointerEvents: 'none' }} />
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accent + '18', border: `1.5px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏆</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Achievements</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Track your milestones &amp; unlock badges</div>
          </div>
          <div style={{ fontSize: 18, color: C.accent, flexShrink: 0 }}>›</div>
        </div>
      </div>

      {/* ── Leaderboard (Coming Soon) ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div id="tut-leaderboard" style={{
          background: `linear-gradient(135deg,${C.s2},${C.s3})`,
          border: `1px solid ${C.blue}30`,
          borderRadius: 18,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 4px 18px ${C.blue}12`,
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, background: C.blue + '15', borderRadius: '50%', filter: 'blur(18px)', pointerEvents: 'none' }} />
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.blue + '18', border: `1.5px solid ${C.blue}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏅</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Leaderboard</div>
              <span style={{ background: C.blue + '22', color: C.blue, fontSize: 8, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4 }}>Coming Soon</span>
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>See who's crushing it — climb the ranks</div>
          </div>
          <div style={{ fontSize: 18, color: C.muted, flexShrink: 0, opacity: 0.5 }}>›</div>
        </div>
      </div>

      <div style={{ height: 8 }} />
      </div>
  );
}



