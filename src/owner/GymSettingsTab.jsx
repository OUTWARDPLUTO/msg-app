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
  const [useStaticQr, setUseStaticQr] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
          useStaticQr,
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
        setUseStaticQr(s.useStaticQr || false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: useQr ? 12 : 0 }}>
          <div>
            <Lbl text="QR Code Scan Verification" />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Require scanning the reception QR code to prevent remote check-ins.
            </div>
          </div>
          <SettingsToggle on={useQr} onTap={() => setUseQr(!useQr)} />
        </div>

        {useQr && (
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }} className="msg-anim-fadein">
            <Lbl text="QR Code Mode" />
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: '⚡ Dynamic', val: false },
                { label: '📄 Static (Printed)', val: true }
              ].map(m => (
                <button key={m.label} onClick={() => setUseStaticQr(m.val)} style={{
                  flex: 1, padding: '10px',
                  background: useStaticQr === m.val ? C.accent + '18' : C.s3,
                  border: `1px solid ${useStaticQr === m.val ? C.accent : C.border}`,
                  borderRadius: 10, color: useStaticQr === m.val ? C.accent : C.sub,
                  fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}>
                  {m.label}
                </button>
              ))}
            </div>

            {useStaticQr && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 10, background: C.s3, padding: 14, borderRadius: 14 }}>
                <div style={{ fontSize: 11, color: C.sub, textAlign: 'center', lineHeight: 1.5 }}>
                  Print this static QR code and display it at your gym's reception desk. Members scan this to check in.
                </div>
                <div onClick={() => setShowPreview(true)} style={{ background: '#fff', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} className="msg-clickable">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=msg-checkin-static:${gymId}`}
                    alt="Static QR Code"
                    style={{ width: 150, height: 150 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowPreview(true)} style={{
                    background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '6px 12px', fontSize: 11, color: C.text, fontFamily: fn, fontWeight: 600, cursor: 'pointer'
                  }}>
                    🔍 Preview
                  </button>
                  <button onClick={() => {
                    const win = window.open();
                    win.document.write(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>${name || gymName} Attendance QR Code</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=msg-checkin-static:${gymId}" style="width:300px;height:300px;"/><p style="margin-top:20px;font-size:14px;color:#666;">Scan to Check In</p><button onclick="window.close()" style="margin-top:30px;padding:12px 24px;border-radius:12px;background:#111;color:#fff;border:none;cursor:pointer;font-weight:bold;font-size:14px;">← Close / Go Back</button></div>`);
                    win.print();
                  }} style={{
                    background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '6px 12px', fontSize: 11, color: C.text, fontFamily: fn, fontWeight: 600, cursor: 'pointer'
                  }}>
                    🖨️ Print QR Code
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <button onClick={handleSave} disabled={loading} style={{
        width: '100%', padding: '14px', background: saved ? C.green : C.accent,
        border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800,
        fontSize: 14, cursor: 'pointer', transition: 'background 0.3s',
        boxShadow: C.accentShadow,
      }}>
        {loading ? 'Saving…' : saved ? '✓ Saved Settings!' : 'Save Settings'}
      </button>

      {/* In-app Fullscreen Static QR Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }} className="msg-anim-fadein">
          <button onClick={() => setShowPreview(false)} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 24px)', right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', width: 44, height: 44, borderRadius: '50%', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: fn, color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{name || gymName}</h2>
            <p style={{ color: '#aaa', fontSize: 13 }}>Scan this QR code at reception to check in</p>
          </div>

          <div style={{ background: '#fff', padding: 20, borderRadius: 24, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', marginBottom: 24 }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(`msg-checkin-static:${gymId}`)}`}
              alt="Static QR Code"
              style={{ width: 260, height: 260, display: 'block' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 300 }}>
            <button onClick={() => setShowPreview(false)} style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, color: '#fff', fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Close</button>
            <button onClick={() => {
              const win = window.open();
              win.document.write(`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>${name || gymName} Attendance QR Code</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=msg-checkin-static:${gymId}" style="width:300px;height:300px;"/><p style="margin-top:20px;font-size:14px;color:#666;">Scan to Check In</p><button onclick="window.close()" style="margin-top:30px;padding:12px 24px;border-radius:12px;background:#111;color:#fff;border:none;cursor:pointer;font-weight:bold;font-size:14px;">← Close / Go Back</button></div>`);
              win.print();
            }} style={{ flex: 2, padding: 14, background: C.accent, border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: C.accentShadow }}>🖨️ Print QR</button>
          </div>
        </div>
      )}
    </div>
  );
}
