import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl } from './primitives.jsx';

// ── Inline helpers to avoid import-chain failures on Android WebView ──────────
function parseLogDate(dateStr) {
  const y = new Date().getFullYear();
  let d = new Date(`${dateStr} ${y}`);
  if (isNaN(d.getTime())) return null;
  if (d.getTime() > Date.now() + 30 * 86400000) d = new Date(`${dateStr} ${y - 1}`);
  return d;
}
function getThisWeekActivity(logs) {
  const parsed = logs.map(l => parseLogDate(l.date)).filter(Boolean);
  const now = Date.now();
  const dow = new Date().getDay(); // 0=Sun
  const weekStart = new Date(now);
  weekStart.setHours(0,0,0,0);
  weekStart.setDate(weekStart.getDate() - ((dow + 6) % 7)); // Monday
  const ms = weekStart.getTime();
  return Array.from({ length: 7 }, (_, i) => {
    const s = ms + i * 86400000;
    const e = s + 86400000;
    return parsed.some(d => d.getTime() >= s && d.getTime() < e);
  });
}
function getTodayDowIndex() { return (new Date().getDay() + 6) % 7; }
function ChartTip({ active, payload, label, color, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ color: C.sub, fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: fn, fontSize: 20, color }}>{payload[0].value}{unit}</div>
    </div>
  );
}
export default function ProgressSection({ logs, onLogClick, onDelete }) {
  const [metric, setMetric] = useState('weight');
  const metrics = [
    { key: 'weight', label: 'Weight', unit: 'kg', color: C.accent },
    { key: 'bodyFat', label: 'Body Fat', unit: '%', color: C.orange },
    { key: 'waist', label: 'Waist', unit: 'cm', color: C.blue },
    { key: 'chest', label: 'Chest', unit: 'cm', color: C.purple },
    { key: 'arms', label: 'Arms', unit: 'cm', color: C.teal },
    { key: 'legs', label: 'Legs', unit: 'cm', color: C.pink },
  ];
  const cur = metrics.find(m => m.key === metric) || metrics[0];
  const last = logs[logs.length - 1];
  const first = logs[0];
  const totalDiff = last && first ? (last[metric] - first[metric]).toFixed(1) : null;
  const weekDiff = logs.length >= 2 ? (last[metric] - logs[logs.length - 2][metric]).toFixed(1) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 20px 12px' }}>
        <div>
          <div style={{ fontFamily: fn, fontSize: 34, letterSpacing: '0.05em', color: C.text, lineHeight: 1 }}>PROGRESS</div>
          <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Track your transformation</div>
        </div>
        <button onClick={onLogClick} style={{
          background: C.accent, border: 'none', borderRadius: 12, padding: '10px 16px',
          color: '#000', fontFamily: fb, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
        }}>+ Log Entry</button>
      </div>

      {/* Stat grid */}
      {last && (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Body Weight', val: `${last.weight} kg`, diff: totalDiff, c: C.accent },
            { label: 'Body Fat', val: last.bodyFat > 0 ? `${last.bodyFat}%` : '—', diff: null, c: C.orange },
            { label: 'Waist', val: last.waist > 0 ? `${last.waist} cm` : '—', diff: null, c: C.blue },
            { label: 'Chest', val: last.chest > 0 ? `${last.chest} cm` : '—', diff: null, c: C.purple },
            { label: 'Arms', val: last.arms > 0 ? `${last.arms} cm` : '—', diff: null, c: C.teal },
            { label: 'Legs', val: last.legs > 0 ? `${last.legs} cm` : '—', diff: null, c: C.pink || C.green },
          ].map((s, i) => (
            <Card key={i} style={{ padding: 14 }}>
              <Lbl text={s.label} style={{ marginBottom: 4 }} />
              <div style={{ fontFamily: fn, fontSize: 26, color: s.c, lineHeight: 1.2 }}>{s.val}</div>
              {s.diff && <div style={{ fontSize: 11, color: parseFloat(s.diff) < 0 ? C.green : C.orange, fontFamily: fb, fontWeight: 700, marginTop: 3 }}>
                {parseFloat(s.diff) < 0 ? '↓' : '↑'} {Math.abs(s.diff)} kg total
              </div>}
            </Card>
          ))}
        </div>
      )}

      {/* Graph */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
          {metrics.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)} style={{
              background: metric === m.key ? m.color + '1F' : 'transparent',
              border: `1px solid ${metric === m.key ? m.color : C.border}`,
              borderRadius: 7, padding: '5px 11px', color: metric === m.key ? m.color : C.sub,
              fontFamily: fb, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
            }}>{m.label}</button>
          ))}
        </div>
        {weekDiff && (
          <div style={{ fontSize: 12, color: parseFloat(weekDiff) <= 0 && metric === 'weight' ? C.green : parseFloat(weekDiff) >= 0 && metric !== 'weight' ? C.green : C.orange, fontFamily: fb, fontWeight: 700, marginBottom: 8 }}>
            {parseFloat(weekDiff) <= 0 ? '↓' : '↑'} {Math.abs(weekDiff)}{cur.unit} this week
          </div>
        )}
        <Card style={{ padding: '16px 4px 8px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={logs}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cur.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={cur.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} width={30} domain={['auto', 'auto']} />
              <Tooltip content={<ChartTip color={cur.color} unit={cur.unit} />} />
              <Area type="monotone" dataKey={metric} stroke={cur.color} strokeWidth={2} fill="url(#pg)" dot={{ fill: cur.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Log history */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.text, marginBottom: 10 }}>LOG HISTORY</div>
        {logs.length === 0 && (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No entries yet — tap + Log Entry to start</div>
        )}
        {[...logs].reverse().map((log, ri) => {
          const idx = logs.length - 1 - ri;
          return (
            <Card key={idx} style={{ padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: fb, fontWeight: 700, fontSize: 12, color: C.sub, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{log.date}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: C.accent }}>{log.weight}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>kg</span></span>
                  {log.bodyFat > 0 && <span style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: C.orange }}>{log.bodyFat}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>%bf</span></span>}
                  {log.height > 0 && <span style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: C.teal }}>{log.height}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>cm</span></span>}
                  <button onClick={() => onDelete(idx)} style={{ width: 24, height: 24, borderRadius: '50%', background: C.red + '18', border: `1px solid ${C.red}33`, color: C.red, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 2 }}>×</button>
                </div>
              </div>
              {(log.chest || log.waist) > 0 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  {[['Chest', log.chest, 'cm'], ['Waist', log.waist, 'cm'], ['Arms', log.arms, 'cm'], ['Legs', log.legs, 'cm']].filter(([, v]) => v > 0).map(([l, v, u]) => (
                    <span key={l} style={{ fontSize: 11, color: C.muted }}>{l}: <span style={{ color: C.sub, fontWeight: 600 }}>{v}{u}</span></span>
                  ))}
                </div>
              )}
              {log.notes && <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontStyle: 'italic' }}>"{log.notes}"</div>}
            </Card>
          );
        })}
      </div>

      {/* Weekly Activity — driven by real log data */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.text, marginBottom: 10 }}>Weekly Activity</div>
        <Card>
          {(() => {
            const weekDone = getThisWeekActivity(logs);
            const todayIdx = getTodayDowIndex();
            const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Lbl text="This Week" />
                  <span style={{ fontSize: 10, color: C.muted }}>{weekDone.filter(Boolean).length}/7 logged</span>
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
                        <div style={{ color: isToday ? C.accent : C.muted, fontSize: 9, fontFamily: fb, fontWeight: 600 }}>{d}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}


