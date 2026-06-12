import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl } from './primitives.jsx';
// ─── Settings helpers (must be top-level, never inside render) ───────────────
function SettingsToggle({ on, onTap }) {
  return (
    <div onClick={onTap} style={{ width: 44, height: 24, borderRadius: 12, background: on ? C.accent : C.s4, cursor: 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: on ? '#000' : C.muted, transition: 'left 0.25s' }} />
    </div>
  );
}
function SettingsRow({ label, sub, on, onTap }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <SettingsToggle on={on} onTap={onTap} />
    </div>
  );
}

// ─── Notification Scheduling Helpers ─────────────────────────────────────────
const NOTIF_PROGRESS_ID = 1001;
const NOTIF_WATER_BASE  = 2000;

async function ensureNotifChannel() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.createChannel({
      id: 'msg_reminders',
      name: 'MSG Reminders',
      description: 'Daily progress and water intake reminders',
      importance: 4, // HIGH
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
    });
  } catch { /* web / unsupported platform */ }
}

async function requestNotifPermission() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await ensureNotifChannel();
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  } catch { return false; }
}

async function scheduleProgressReminder(timeStr) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_PROGRESS_ID }] });
    if (!timeStr) return;
    const [h, m] = timeStr.split(':').map(Number);
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIF_PROGRESS_ID,
        title: '📊 Time to log your progress!',
        body: 'Record your weight, measurements & notes for today.',
        schedule: { on: { hour: h, minute: m }, allowWhileIdle: true, repeats: true },
        smallIcon: 'ic_launcher_foreground', channelId: 'msg_reminders',
      }],
    });
  } catch (e) { console.warn('scheduleProgressReminder:', e); }
}

async function scheduleWaterReminders(intervalHours, dndStart, dndEnd) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const ids = Array.from({ length: 100 }, (_, i) => ({ id: NOTIF_WATER_BASE + i }));
    await LocalNotifications.cancel({ notifications: ids });
    if (!intervalHours || intervalHours === 'off') return;
    const ivMin = Math.round(parseFloat(intervalHours) * 60);
    if (isNaN(ivMin) || ivMin <= 0) return;
    const notifications = [];
    let nid = NOTIF_WATER_BASE;
    for (let m = 360; m <= 1320; m += ivMin) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const ds = dndStart != null ? parseInt(dndStart, 10) : null;
      const de = dndEnd   != null ? parseInt(dndEnd,   10) : null;
      const inDND = ds !== null && de !== null && (
        ds < de ? (h >= ds && h < de) : (h >= ds || h < de)
      );
      if (inDND) continue;
      notifications.push({
        id: nid++,
        title: '💧 Drink some water!',
        body: 'Staying hydrated keeps your energy up and performance sharp.',
        schedule: { on: { hour: h, minute: min }, allowWhileIdle: true, repeats: true },
        smallIcon: 'ic_launcher_foreground', channelId: 'msg_reminders',
      });
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch (e) { console.warn('scheduleWaterReminders:', e); }
}

// ─── Notification Settings Component ─────────────────────────────────────────
function NotificationSettings() {
  const LS = {
    progressTime:   'msg_notif_progress_time',
    waterInterval:  'msg_notif_water_interval',
    dndStart:       'msg_notif_dnd_start',
    dndEnd:         'msg_notif_dnd_end',
  };
  const load = k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };

  const [progressTime,  setProgressTime]  = useState(() => load(LS.progressTime)  || '20:00');
  const [waterInterval, setWaterInterval] = useState(() => load(LS.waterInterval) || 'off');
  const [dndStart,      setDndStart]      = useState(() => load(LS.dndStart)      || '22');
  const [dndEnd,        setDndEnd]        = useState(() => load(LS.dndEnd)        || '7');
  const [saved,         setSaved]         = useState(false);
  const [denied,        setDenied]        = useState(false);

  const save = async () => {
    const granted = await requestNotifPermission();
    if (!granted) { setDenied(true); return; }
    setDenied(false);
    try { localStorage.setItem(LS.progressTime,  progressTime);  } catch {}
    try { localStorage.setItem(LS.waterInterval, waterInterval); } catch {}
    try { localStorage.setItem(LS.dndStart,      dndStart);      } catch {}
    try { localStorage.setItem(LS.dndEnd,        dndEnd);        } catch {}
    await scheduleProgressReminder(progressTime);
    await scheduleWaterReminders(waterInterval, dndStart, dndEnd);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const chip = (val, cur, set) => (
    <button key={val} onClick={() => set(val)} style={{
      padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${cur === val ? C.accent : C.border}`,
      background: cur === val ? C.accent + '22' : C.s3,
      color: cur === val ? C.accent : C.sub,
      fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer',
      transition: 'all 0.18s',
    }}>{val}</button>
  );

  const hourOpts = Array.from({ length: 24 }, (_, i) => String(i));
  const selStyle = {
    background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '8px 12px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
    marginTop: 6, width: '100%',
  };

  return (
    <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 16px 14px' }}>

      {/* Progress reminder */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>📊 Daily Progress Reminder</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Pick a time — you'll get a daily reminder to log your weight & measurements.</div>
        <input
          type="time"
          value={progressTime}
          onChange={e => setProgressTime(e.target.value)}
          style={{ ...selStyle, width: 'auto' }}
        />
      </div>

      {/* Water reminder interval */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>💧 Water Reminder Interval</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>How often should we remind you to drink water? (6 AM – 10 PM)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Off', val: 'off' },
            { label: 'Every 30m', val: '0.5' },
            { label: 'Every 1h', val: '1' },
            { label: 'Every 1.5h', val: '1.5' },
            { label: 'Every 2h', val: '2' },
            { label: 'Every 3h', val: '3' },
            { label: 'Every 4h', val: '4' },
          ].map(({ label, val }) => (
            <button key={val} onClick={() => setWaterInterval(val)} style={{
              padding: '6px 14px', borderRadius: 20,
              border: `1.5px solid ${waterInterval === val ? C.accent : C.border}`,
              background: waterInterval === val ? C.accent + '22' : C.s3,
              color: waterInterval === val ? C.accent : C.sub,
              fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer',
              transition: 'all 0.18s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* DND window */}
      {waterInterval !== 'off' && (
        <div style={{ marginBottom: 18, background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>🌙 Do Not Disturb</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>No water reminders during these hours.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>From</div>
              <select value={dndStart} onChange={e => setDndStart(e.target.value)} style={selStyle}>
                {hourOpts.map(h => <option key={h} value={h}>{h.padStart(2,'0')}:00</option>)}
              </select>
            </div>
            <div style={{ color: C.muted, fontWeight: 700, paddingTop: 20 }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Until</div>
              <select value={dndEnd} onChange={e => setDndEnd(e.target.value)} style={selStyle}>
                {hourOpts.map(h => <option key={h} value={h}>{h.padStart(2,'0')}:00</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {denied && (
        <div style={{ fontSize: 11, color: C.red, marginBottom: 10, padding: '8px 12px', background: C.red + '18', borderRadius: 8 }}>
          ⚠️ Notification permission denied. Please enable it in Android Settings → Apps → MSG → Notifications.
        </div>
      )}

      <button onClick={save} style={{
        width: '100%', background: saved ? C.green + '22' : C.accent, border: 'none',
        borderRadius: 12, padding: '12px', color: saved ? C.green : '#000',
        fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer',
        boxShadow: saved ? 'none' : C.accentShadow, transition: 'all 0.3s',
      }}>
        {saved ? '✓ Saved & Scheduled!' : 'Save & Schedule Notifications'}
      </button>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
export default function SettingsScreen({ onClose, onResetDiet, onResetWorkout, darkMode, onToggleTheme }) {
  const [settings, setSettings] = useState({
    units: 'kg', notifications: true, workoutReminder: true, mealReminder: false,
    darkMode: true, autoTimer: true, showMicros: true, weekStart: 'Mon',
  });
  const tog = k => setSettings(s => ({ ...s, [k]: !s[k] }));
  const sections = [
    {
      title: 'GENERAL', rows: [
        {
          label: 'Weight Units', sub: 'kg or lbs', custom: (
            <div style={{ display: 'flex', gap: 6 }}>
              {['kg', 'lbs'].map(u => (
                <button key={u} onClick={() => setSettings(s => ({ ...s, units: u }))} style={{ padding: '5px 14px', borderRadius: 10, background: settings.units === u ? C.accent : C.s4, color: settings.units === u ? '#111' : '', border: 'none', fontFamily: fb, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', boxShadow: settings.units === u ? C.accentShadow : 'none' }}>{u}</button>
              ))}
            </div>
          )
        },
        {
          label: 'Week Starts On', sub: 'Calendar view', custom: (
            <div style={{ display: 'flex', gap: 6 }}>
              {['Mon', 'Sun'].map(d => (
                <button key={d} onClick={() => setSettings(s => ({ ...s, weekStart: d }))} style={{ padding: '5px 14px', borderRadius: 10, background: settings.weekStart === d ? C.accent : C.s4, color: settings.weekStart === d ? '#111' : '', border: 'none', fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: settings.weekStart === d ? C.accentShadow : 'none' }}>{d}</button>
              ))}
            </div>
          )
        },
        {
          label: 'Theme', sub: darkMode ? 'Dark mode — tap to switch to Light' : 'Light mode — tap to switch to Dark', custom: (
            <button onClick={onToggleTheme} style={{ padding: '5px 16px', borderRadius: 10, background: C.accent, color: '#111', border: 'none', fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: C.accentShadow }}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          )
        },
      ]
    },
    {
      title: 'NOTIFICATIONS',
      custom: (
        <NotificationSettings />
      ),
    },
    {
      title: 'WORKOUT', rows: [
        { label: 'Auto-Start Rest Timer', sub: 'Starts timer after set', k: 'autoTimer' },
      ]
    },
    {
      title: 'NUTRITION', rows: [
        { label: 'Show Micronutrients', sub: 'Vitamins & minerals panel', k: 'showMicros' },
      ]
    },
  ];
  return (
    <ModalShell title="SETTINGS" onClose={onClose}>
      <div style={{ padding: '8px 20px 30px' }}>
        {sections.map(sec => (
          <div key={sec.title} style={{ marginBottom: 24 }}>
            <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px 0 8px' }}>{sec.title}</div>
            {sec.custom
              ? sec.custom
              : sec.rows?.map((row, i) => row.k ? (
                  <SettingsRow key={i} label={row.label} sub={row.sub} on={settings[row.k]} onTap={() => tog(row.k)} />
                ) : (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{row.label}</div>
                      {row.sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{row.sub}</div>}
                    </div>
                    {row.custom}
                  </div>
                ))
            }
          </div>
        ))}
        {/* Reset workout plan */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0 10px' }}>WORKOUT PLAN</div>
          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 4 }}>Reset Weekly Workout Plan</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>Clears your current plan and lets you rebuild from scratch with new goals, days, or equipment.</div>
            <button onClick={() => { onResetWorkout(); onClose(); }} style={{
              width: '100%', background: C.blue + '18', border: `1px solid ${C.blue}44`, borderRadius: 10,
              padding: '11px', color: C.blue, fontFamily: fn, fontWeight: 700, fontSize: 12,
              letterSpacing: '0.02em', cursor: 'pointer',
            }}>↺ Reset &amp; Rebuild Workout</button>
          </div>
        </div>
        {/* Reconfigure diet plan */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0 10px' }}>DIET PLAN</div>
          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 4 }}>Reconfigure Nutrition Plan</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>Reset your goal, calorie target, macro split, and dietary preferences.</div>
            <button onClick={() => { onResetDiet(); onClose(); }} style={{
              width: '100%', background: C.orange + '18', border: `1px solid ${C.orange}44`, borderRadius: 10,
              padding: '11px', color: C.orange, fontFamily: fb, fontWeight: 700, fontSize: 12,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}>↩ Reset &amp; Reconfigure</button>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: '12px 14px', background: C.s2, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>MSG v1.0 · Settings auto-saved</div>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Language Screen ──────────────────────────────────────────────────────────
export function LanguageScreen({ onClose }) {
  const [selected, setSelected] = useState(() => {
    try {
      return localStorage.getItem('msg_lang') || 'en-IN';
    } catch { return 'en-IN'; }
  });
  const langs = [
    { code: 'en-IN', name: 'English', region: 'India', native: 'English' },
    { code: 'hi-IN', name: 'Hindi', region: 'India', native: 'हिन्दी' },
    { code: 'en-US', name: 'English', region: 'United States', native: 'English (US)' },
    { code: 'en-GB', name: 'English', region: 'United Kingdom', native: 'English (UK)' },
    { code: 'mr-IN', name: 'Marathi', region: 'India', native: 'मराठी' },
    { code: 'gu-IN', name: 'Gujarati', region: 'India', native: 'ગુજરાતી' },
    { code: 'pa-IN', name: 'Punjabi', region: 'India', native: 'ਪੰਜਾਬੀ' },
    { code: 'ta-IN', name: 'Tamil', region: 'India', native: 'தமிழ்' },
    { code: 'te-IN', name: 'Telugu', region: 'India', native: 'తెలుగు' },
    { code: 'es-ES', name: 'Spanish', region: 'Spain', native: 'Español' },
    { code: 'fr-FR', name: 'French', region: 'France', native: 'Français' },
    { code: 'de-DE', name: 'German', region: 'Germany', native: 'Deutsch' },
    { code: 'ja-JP', name: 'Japanese', region: 'Japan', native: '日本語' },
    { code: 'zh-CN', name: 'Chinese', region: 'Simplified', native: '中文(简体)' },
    { code: 'ar-SA', name: 'Arabic', region: 'Saudi Arabia', native: 'العربية' },
  ];
  const regions = [...new Set(langs.map(l => l.region))];
  return (
    <ModalShell title="LANGUAGE" onClose={onClose}>
      <div style={{ padding: '12px 16px 30px' }}>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>
          Select your preferred language for the app interface.
        </div>
        {regions.map(region => (
          <div key={region} style={{ marginBottom: 18 }}>
            <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{region}</div>
            {langs.filter(l => l.region === region).map(l => (
              <button key={l.code} onClick={() => {
                setSelected(l.code);
                try { localStorage.setItem('msg_lang', l.code); } catch {}
              }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box',
                padding: '13px 14px', marginBottom: 7,
                background: selected === l.code ? C.accent + '18' : C.s2,
                border: `1px solid ${selected === l.code ? C.accent : C.border}`,
                borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: selected === l.code ? C.accent : C.text }}>{l.native}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{l.name}</div>
                </div>
                {selected === l.code && <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#000', fontWeight: 700, flexShrink: 0 }}>✓</div>}
              </button>
            ))}
          </div>
        ))}
        <button onClick={onClose} style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 12, padding: 15, color: '#000', fontFamily: fb, fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 8 }}>
          Apply Language
        </button>
      </div>
    </ModalShell>
  );
}


