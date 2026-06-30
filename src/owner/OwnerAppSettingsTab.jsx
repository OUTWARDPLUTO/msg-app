import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, SettingsRow } from '../shared/primitives.jsx';
import { useTranslation } from 'react-i18next';

const LANGS = [
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

export default function OwnerAppSettingsTab({ darkMode, onToggleTheme, onBack, onShowTutorial }) {
  const { t, i18n } = useTranslation();
  
  const [selectedLang, setSelectedLang] = useState(() => {
    try {
      return localStorage.getItem('msg_lang') || 'en-IN';
    } catch { return 'en-IN'; }
  });

  const [settings, setSettings] = useState(() => {
    const load = (key, fallback) => {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch { return fallback; }
    };
    return {
      units: load('msg_owner_units', 'kg'),
      weekStart: load('msg_owner_weekstart', 'Mon'),
      pushNotifications: load('msg_owner_push', true),
      attendanceAlerts: load('msg_owner_att_alert', true),
      subReminders: load('msg_owner_sub_rem', true),
    };
  });

  const save = (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  };

  const saveLang = (code) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    try {
      localStorage.setItem('msg_lang', code);
    } catch {}
  };

  const setUnit = (u) => {
    setSettings(s => {
      const ns = { ...s, units: u };
      save('msg_owner_units', u);
      return ns;
    });
  };

  const setWeekStart = (d) => {
    setSettings(s => {
      const ns = { ...s, weekStart: d };
      save('msg_owner_weekstart', d);
      return ns;
    });
  };

  const tog = (key) => {
    setSettings(s => {
      const ns = { ...s, [key]: !s[key] };
      save(`msg_owner_${key.toLowerCase()}`, ns[key]);
      return ns;
    });
  };

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div>
            <div style={{ fontFamily: fb, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{t('settings.title')}</div>
          </div>
        </div>
        {onShowTutorial && (
          <button onClick={onShowTutorial} style={{
            background: C.accent + '20', border: `1px solid ${C.accent}40`,
            borderRadius: 12, padding: '6px 12px', color: C.accent,
            fontFamily: fb, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            ? Tutorial
          </button>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 24, padding: '24px', marginBottom: 24 }}>
        <Lbl text={t('settings.generalPreferences')} style={{ marginBottom: 10 }} />
        
        {/* Theme row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{t('settings.appTheme')}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {darkMode ? t('settings.darkModeEnabled') : t('settings.lightModeEnabled')}
            </div>
          </div>
          <button onClick={onToggleTheme} style={{
            padding: '6px 14px', borderRadius: 10, background: C.accent,
            color: '#111', border: 'none', fontFamily: fb, fontWeight: 700,
            fontSize: 11, cursor: 'pointer', boxShadow: C.accentShadow
          }}>
            {darkMode ? t('settings.btnLight') : t('settings.btnDark')}
          </button>
        </div>

        {/* Units row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{t('settings.weightUnits')}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t('settings.weightUnitsDesc')}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['kg', 'lbs'].map(u => {
              const active = settings.units === u;
              return (
                <button key={u} onClick={() => setUnit(u)} style={{
                  padding: '5px 12px', borderRadius: 8,
                  background: active ? C.accent : C.s3,
                  color: active ? '#111' : C.sub,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  fontFamily: fb, fontWeight: 700, fontSize: 11,
                  cursor: 'pointer', boxShadow: active ? C.accentShadow : 'none'
                }}>{u.toUpperCase()}</button>
              );
            })}
          </div>
        </div>

        {/* Calendar week start */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0',
        }}>
          <div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{t('settings.weekStartsOn')}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{t('settings.weekStartsOnDesc')}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Mon', 'Sun'].map(d => {
              const active = settings.weekStart === d;
              return (
                <button key={d} onClick={() => setWeekStart(d)} style={{
                  padding: '5px 12px', borderRadius: 8,
                  background: active ? C.accent : C.s3,
                  color: active ? '#111' : C.sub,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  fontFamily: fb, fontWeight: 700, fontSize: 11,
                  cursor: 'pointer', boxShadow: active ? C.accentShadow : 'none'
                }}>{d}</button>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 24, padding: '24px', marginBottom: 24 }}>
          <Lbl text={t('settings.ownerNotifications')} style={{ marginBottom: 10 }} />
          
          <SettingsRow
            label={t('settings.pushNotifications')}
            sub={t('settings.pushNotificationsDesc')}
            on={settings.pushNotifications}
            onTap={() => tog('pushNotifications')}
          />

          <SettingsRow
            label={t('settings.attendanceAlerts')}
            sub={t('settings.attendanceAlertsDesc')}
            on={settings.attendanceAlerts}
            onTap={() => tog('attendanceAlerts')}
          />

          <SettingsRow
            label={t('settings.subscriptionAlerts')}
            sub={t('settings.subscriptionAlertsDesc')}
            on={settings.subReminders}
            onTap={() => tog('subReminders')}
          />
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 24, padding: '24px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
          <Lbl text={t('settings.languagePreference')} style={{ marginBottom: 10 }} />
          </button>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, fontFamily: fn }}>
            {t('settings.languagePreferenceDesc')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }} className="msg-scroll">
            {LANGS.map(l => {
              const active = selectedLang === l.code;
              return (
                <button key={l.code} onClick={() => saveLang(l.code)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box',
                  padding: '14px 16px', background: active ? C.accent + '15' : C.bg,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  borderRadius: 16, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease'
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 700, color: active ? C.accent : C.text }}>{l.native}</div>
                    <div style={{ fontSize: 12, fontFamily: fn, color: C.muted, marginTop: 2 }}>{l.name}</div>
                  </div>
                  {active && <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
