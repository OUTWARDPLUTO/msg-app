import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, SettingsToggle } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

export default function GymSettingsTab({ gymId, gymName, ownerUid }) {
  const [name, setName]     = useState(gymName || '');
  const [threshold, setThreshold] = useState(5);
  const [saved, setSaved]   = useState(false);
  const [code, setCode]     = useState('');
  const [loading, setLoading] = useState(false);

  // GPS and QR settings states
  const [useGps, setUseGps] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [useQr, setUseQr] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      await db.doc(`gyms/${gymId}`).update({
        name: name.trim() || gymName,
        settings: {
          inactivityThresholdDays: threshold,
          useGps,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          useQr,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.warn(e); }
    setLoading(false);
  };

  const loadSettings = async () => {
    try {
      const db = await getFBFirestore();
      const doc = await db.doc(`gyms/${gymId}`).get();
      if (doc.exists) {
        const data = doc.data();
        setCode(data.gymCode || '—');
        const s = data.settings || {};
        setThreshold(s.inactivityThresholdDays || 5);
        setUseGps(s.useGps || false);
        setLatitude(s.latitude !== undefined && s.latitude !== null ? String(s.latitude) : '');
        setLongitude(s.longitude !== undefined && s.longitude !== null ? String(s.longitude) : '');
        setUseQr(s.useQr || false);
      }
    } catch (e) { console.warn(e); }
  };

  useEffect(() => {
    if (gymId) {
      loadSettings();
    }
  }, [gymId]);

  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>Gym Settings</div>

      <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
        <Lbl text="Gym Code" style={{ marginBottom: 8 }} />
        <div style={{ fontFamily: fn, fontSize: 32, fontWeight: 800, color: C.accent, letterSpacing: '0.3em' }}>
          {code || '——'}
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
          Share this code with members. They enter it in the app to join your gym.
        </div>
      </Card>

      <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
        <Lbl text="Gym Name" style={{ marginBottom: 8 }} />
        <input
          value={name} onChange={e => setName(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', background: C.s3,
            border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px',
            color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
          }}
        />
      </Card>

      <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
        <Lbl text="Inactivity Alert Threshold" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 5, 7].map(d => (
            <button key={d} onClick={() => setThreshold(d)} style={{
              flex: 1, padding: '10px',
              background: threshold === d ? C.accent + '18' : C.s3,
              border: `1px solid ${threshold === d ? C.accent : C.border}`,
              borderRadius: 10, color: threshold === d ? C.accent : C.sub,
              fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              {d} days
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
          Members inactive longer than this will appear in Alerts.
        </div>
      </Card>

      {/* GPS Settings Card */}
      <Card style={{ padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <Lbl text="GPS Location Verification" />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Restrict check-ins to members within 100 meters of the gym.
            </div>
          </div>
          <SettingsToggle on={useGps} onTap={() => setUseGps(!useGps)} />
        </div>
        
        {useGps && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10, borderTop: `1px solid ${C.border}`, paddingTop: 12 }} className="msg-anim-fadein">
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontFamily: fb, fontWeight: 700 }}>LATITUDE</div>
                <input
                  type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 19.0760"
                  style={{
                    width: '100%', boxSizing: 'border-box', background: C.s3,
                    border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px',
                    color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontFamily: fb, fontWeight: 700 }}>LONGITUDE</div>
                <input
                  type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. 72.8777"
                  style={{
                    width: '100%', boxSizing: 'border-box', background: C.s3,
                    border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px',
                    color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
                  }}
                />
              </div>
            </div>
            <button
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  pos => {
                    setLatitude(pos.coords.latitude.toFixed(6));
                    setLongitude(pos.coords.longitude.toFixed(6));
                  },
                  err => alert(`Could not fetch location: ${err.message}`),
                  { enableHighAccuracy: true }
                );
              }}
              style={{
                alignSelf: 'flex-start', background: C.s3, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '6px 12px', fontSize: 11, color: C.text,
                fontFamily: fn, fontWeight: 600, cursor: 'pointer',
              }}
            >
              📍 Fetch Current Location
            </button>
          </div>
        )}
      </Card>

      {/* QR Settings Card */}
      <Card style={{ padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Lbl text="QR Code Scan Verification" />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Require scanning the reception QR code to prevent remote check-ins.
            </div>
          </div>
          <SettingsToggle on={useQr} onTap={() => setUseQr(!useQr)} />
        </div>
      </Card>

      <button onClick={handleSave} disabled={loading} style={{
        width: '100%', padding: '14px', background: saved ? C.green : C.accent,
        border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800,
        fontSize: 14, cursor: 'pointer', transition: 'background 0.3s',
        boxShadow: C.accentShadow,
      }}>
        {loading ? 'Saving…' : saved ? '✓ Saved Settings!' : 'Save Settings'}
      </button>
    </div>
  );
}
