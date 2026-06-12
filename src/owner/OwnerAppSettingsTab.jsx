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

export default function OwnerAppSettingsTab({ darkMode, onToggleTheme }) {
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
    <div style={{ padding: '20px 16px 32px' }} className="msg-anim-fadein">
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>{t('settings.title')}</div>

      <Card style={{ padding: '16px', marginBottom: 16 }}>
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
      </Card>

      <Card style={{ padding: '16px', marginBottom: 16 }}>
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
      </Card>

      <Card style={{ padding: '16px' }}>
        <Lbl text={t('settings.languagePreference')} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
          {t('settings.languagePreferenceDesc')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }} className="msg-scroll">
          {LANGS.map(l => {
            const active = selectedLang === l.code;
            return (
              <button key={l.code} onClick={() => saveLang(l.code)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', background: active ? C.accent + '18' : C.s3,
                border: `1px solid ${active ? C.accent : C.border}`,
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? C.accent : C.text }}>{l.native}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{l.name}</div>
                </div>
                {active && <div style={{ width: 16, height: 16, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#000', fontWeight: 700, flexShrink: 0 }}>✓</div>}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
