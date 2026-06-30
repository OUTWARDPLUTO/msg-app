import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, SettingsToggle, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore, checkSubscription } from '../shared/firebase.js';

export default function GymSettingsTab({ gymId, gymName, ownerUid, onBack }) {
  const [name, setName]     = useState(gymName || '');
  const [threshold, setThreshold] = useState(5);
  const [saved, setSaved]   = useState(false);
  const [code, setCode]     = useState('');
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [subData, setSubData] = useState(null);
  const [subPlan, setSubPlan] = useState('monthly'); // 'trial', 'monthly', 'yearly'
  const [paymentError, setPaymentError] = useState('');


  // GPS and QR settings states
  const [useGps, setUseGps] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [useQr, setUseQr] = useState(false);
  const [useStaticQr, setUseStaticQr] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const newName = name.trim() || gymName;
      await db.doc(`gyms/${gymId}`).update({
        name: newName,
        'settings.inactivityThresholdDays': threshold,
        'settings.useGps': useGps,
        'settings.latitude': latitude ? parseFloat(latitude) : null,
        'settings.longitude': longitude ? parseFloat(longitude) : null,
        'settings.useQr': useQr,
        'settings.useStaticQr': useStaticQr,
      });
      localStorage.setItem('msg_gym_name', newName);
      window.dispatchEvent(new CustomEvent('msg_gym_name_changed', { detail: newName }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.warn(e); }
    setLoading(false);
  };

  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleActivate = async () => {
    if (!subPlan || !ownerUid) return;
    setLoading(true);
    setPaymentError('');

    try {
      // Simulate Payment Gateway and API success directly
      // In a real app this would go to the backend. Since this is mocked:
      const db = await getFBFirestore();
      
      // Calculate expiration date
      const now = Date.now();
      let expiresAt = null;
      if (subPlan === 'trial') expiresAt = now + 7 * 24 * 60 * 60 * 1000;
      else if (subPlan === 'monthly') expiresAt = now + 30 * 24 * 60 * 60 * 1000;
      else if (subPlan === 'yearly') expiresAt = now + 365 * 24 * 60 * 60 * 1000;
      
      // 1. Update user subscription (which is checked by checkSubscription in firebase.js)
      await db.doc(`users/${ownerUid}`).set({
        subscription: {
          plan: subPlan,
          status: 'active',
          expiresAt: expiresAt,
          updatedAt: new Date()
        }
      }, { merge: true });

      // 2. Update gym plan (which is checked by OwnerDashboard.jsx isPremium)
      await db.doc(`gyms/${gymId}`).update({
        plan: subPlan
      });
      
      // Reload settings to clear the lock
      await loadSettings();
      
      // Dispatch an event so other tabs immediately hide their premium popups
      window.dispatchEvent(new CustomEvent('msg_subscription_updated'));
      
    } catch (e) {
      console.error(e);
      setPaymentError(e.message || "An error occurred during payment.");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const db = await getFBFirestore();
      const doc = await db.doc(`gyms/${gymId}`).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.name) setName(data.name);
        setCode(data.gymCode || '—');
        setQrToken(data.qrToken || '');
        const s = data.settings || {};
        setThreshold(s.inactivityThresholdDays || 5);
        setUseGps(s.useGps || false);
        setLatitude(s.latitude !== undefined && s.latitude !== null ? String(s.latitude) : '');
        setLongitude(s.longitude !== undefined && s.longitude !== null ? String(s.longitude) : '');
        setUseQr(s.useQr || false);
        setUseStaticQr(s.useStaticQr || false);
      }
      
      if (ownerUid) {
        const sub = await checkSubscription(ownerUid);
        setSubData(sub);
      }
    } catch (e) { console.warn(e); }
  };

  useEffect(() => {
    if (gymId) {
      loadSettings();
    }
  }, [gymId]);

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>Settings</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Gym Code & QR</div>
          
          {(!subData || !subData.active) ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', background: C.bg, borderRadius: 12, border: `1px dashed ${C.border}` }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🔒</span>
              <div style={{ fontSize: 15, color: C.text, fontFamily: fb, fontWeight: 700, marginBottom: 4 }}>Code Locked</div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fn }}>Activate your subscription below to view your gym code.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {code && code !== '—' && (
                <div style={{ background: '#fff', padding: 12, borderRadius: 16, marginBottom: 16 }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${code}`} 
                    alt="Gym QR Code" 
                    style={{ width: 140, height: 140, display: 'block' }}
                  />
                </div>
              )}

              <div style={{ fontFamily: fb, fontSize: 40, fontWeight: 800, color: C.accent, letterSpacing: '0.2em' }}>
                {code || '——'}
              </div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 12, textAlign: 'center', fontFamily: fn, maxWidth: 280 }}>
                Share this code or QR with members. They scan or enter it in the app to join your gym.
              </div>
            </div>
          )}
        </div>

        <div style={{ background: C.s1, border: subData?.active ? `1px solid ${C.border}` : `2px solid ${C.accent}`, borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subscription</div>
            <span style={{ 
              fontSize: 11, padding: '4px 10px', borderRadius: 12, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase',
              background: subData?.active ? C.green + '22' : C.red + '22',
              color: subData?.active ? C.green : C.red
            }}>
              {subData?.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          {subData && (
            <div style={{ fontSize: 14, color: C.sub, fontFamily: fn, marginBottom: 16 }}>
              {subData.active ? (
                <>
                  Plan: <strong style={{ color: C.text, textTransform: 'capitalize' }}>{subData.plan}</strong> <br/>
                  Expires: {subData.expiresAt ? new Date(subData.expiresAt).toLocaleDateString('en-IN') : 'Forever'}
                </>
              ) : (
                <span style={{ color: C.red }}>Your subscription has expired. Members cannot access the app.</span>
              )}
            </div>
          )}

          {paymentError && (
            <div style={{ padding: '12px', background: C.red + '22', color: C.red, borderRadius: 12, fontSize: 13, marginBottom: 16, fontFamily: fn }}>
              {paymentError}
            </div>
          )}

          {!subData?.active && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {['trial', 'monthly', 'yearly'].map(plan => (
                  <button key={plan} onClick={() => setSubPlan(plan)} style={{
                    flex: 1, padding: '12px 8px',
                    background: subPlan === plan ? C.accent : 'none',
                    border: `1px solid ${subPlan === plan ? C.accent : C.border}`,
                    borderRadius: 12, color: subPlan === plan ? '#111' : C.text,
                    fontFamily: fb, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    textTransform: 'capitalize', transition: 'all 0.2s ease'
                  }}>
                    {plan}
                    <div style={{ fontSize: 11, marginTop: 6, color: subPlan === plan ? '#111' : C.sub, fontWeight: 600 }}>
                      {plan === 'trial' ? '₹249' : plan === 'monthly' ? '₹999' : '₹7,999'}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={handleActivate} disabled={loading} style={{
                width: '100%', background: C.accent, border: 'none', borderRadius: 12,
                padding: '14px', color: '#111', fontFamily: fb, fontWeight: 700, fontSize: 15, cursor: loading ? 'wait' : 'pointer',
              }}>
                {loading ? 'Processing...' : `Activate ${subPlan} plan →`}
              </button>
            </div>
          )}
        </div>

        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Gym Name</div>
          <input
            value={name} onChange={e => setName(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', background: C.bg,
              border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px',
              color: C.text, fontSize: 15, fontFamily: fn, outline: 'none',
            }}
          />
        </div>

        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Inactivity Alert Threshold</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[3, 5, 7].map(d => (
              <button key={d} onClick={() => setThreshold(d)} style={{
                flex: 1, padding: '12px',
                background: threshold === d ? C.accent : 'none',
                border: `1px solid ${threshold === d ? C.accent : C.border}`,
                borderRadius: 12, color: threshold === d ? '#111' : C.text,
                fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease'
              }}>
                {d} days
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 12, fontFamily: fn }}>
            Members inactive longer than this will appear in Alerts.
          </div>
        </div>

        {/* GPS Settings Card */}
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, color: C.text, fontFamily: fb, fontWeight: 700 }}>GPS Verification</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4, fontFamily: fn }}>
                Restrict check-ins to within 100m.
              </div>
            </div>
            <SettingsToggle on={useGps} onTap={() => setUseGps(!useGps)} />
          </div>
          
          {useGps && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }} className="msg-anim-fadein">
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 6, fontFamily: fb, fontWeight: 700 }}>LATITUDE</div>
                  <input
                    type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 19.0760"
                    style={{
                      width: '100%', boxSizing: 'border-box', background: C.bg,
                      border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px',
                      color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 6, fontFamily: fb, fontWeight: 700 }}>LONGITUDE</div>
                  <input
                    type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. 72.8777"
                    style={{
                      width: '100%', boxSizing: 'border-box', background: C.bg,
                      border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px',
                      color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
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
                  alignSelf: 'flex-start', background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '10px 16px', fontSize: 13, color: C.text,
                  fontFamily: fb, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Fetch Location
              </button>
            </div>
          )}
        </div>

        {/* QR Settings Card */}
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: useQr ? 16 : 0 }}>
            <div>
              <div style={{ fontSize: 15, color: C.text, fontFamily: fb, fontWeight: 700 }}>QR Verification</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4, fontFamily: fn, maxWidth: 220 }}>
                Require scanning the reception QR code.
              </div>
            </div>
            <SettingsToggle on={useQr} onTap={() => setUseQr(!useQr)} />
          </div>

          {useQr && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }} className="msg-anim-fadein">
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>QR Code Mode</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: '⚡ Dynamic', val: false },
                  { label: '📄 Static', val: true }
                ].map(m => (
                  <button key={m.label} onClick={() => setUseStaticQr(m.val)} style={{
                    flex: 1, padding: '12px',
                    background: useStaticQr === m.val ? C.accent : 'none',
                    border: `1px solid ${useStaticQr === m.val ? C.accent : C.border}`,
                    borderRadius: 12, color: useStaticQr === m.val ? '#111' : C.text,
                    fontFamily: fb, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease'
                  }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {useStaticQr && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 8, background: C.bg, padding: 20, borderRadius: 16 }}>
                  <div style={{ fontSize: 12, color: C.sub, textAlign: 'center', lineHeight: 1.5, fontFamily: fn }}>
                    Print this static QR code and display it at your gym's reception desk. Members scan this to check in.
                  </div>
                  <div onClick={() => setShowPreview(true)} style={{ background: '#fff', padding: 12, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} className="msg-clickable">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=msg-checkin-static:${gymId}`}
                      alt="Static QR Code"
                      style={{ width: 140, height: 140 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                    <button onClick={() => setShowPreview(true)} style={{
                      flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12,
                      padding: '10px', fontSize: 13, color: C.text, fontFamily: fb, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      Preview
                    </button>
                    <button onClick={() => {
                      setShowPrintView(true);
                    }} style={{
                      flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12,
                      padding: '10px', fontSize: 13, color: C.text, fontFamily: fb, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                      Print
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={loading} style={{
          width: '100%', padding: '16px', background: saved ? C.green : C.text,
          border: 'none', borderRadius: 16, color: C.bg, fontFamily: fb, fontWeight: 700,
          fontSize: 16, cursor: 'pointer', transition: 'all 0.3s',
        }}>
          {loading ? 'Saving…' : saved ? '✓ Saved Settings!' : 'Save Settings'}
        </button>
      </div>

      {/* In-app Fullscreen Static QR Preview Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box' }} className="msg-anim-fadein">
          <button onClick={() => setShowPreview(false)} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 24px)', right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', width: 44, height: 44, borderRadius: '50%', color: '#fff', fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, marginBottom: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ color: '#111', fontFamily: fb, fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{name || gymName}</div>
            <div style={{ color: '#666', fontFamily: fn, fontSize: 13, marginBottom: 20 }}>Scan at reception to check-in</div>
            
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&qzone=1&data=${encodeURIComponent(`msg-checkin-static:${gymId}`)}`}
              alt="Static QR Code"
              style={{ width: 260, height: 260, display: 'block' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 300 }}>
            <button onClick={() => setShowPreview(false)} style={{ flex: 1, padding: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, color: '#fff', fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Close</button>
            <button onClick={() => {
              setShowPrintView(true);
            }} style={{ flex: 2, padding: 14, background: C.accent, border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: C.accentShadow }}>🖨️ Print QR</button>
          </div>
        </div>
      )}

      {/* Fullscreen Print View Overlay */}
      {showPrintView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#111', marginBottom: 20 }}>{name || gymName} Attendance QR Code</h2>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=msg-checkin-static:${gymId}`} style={{ width: 300, height: 300 }} alt="QR Code" />
          <p style={{ marginTop: 20, fontSize: 14, color: '#666' }}>Scan to Check In</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
            <button onClick={() => setShowPrintView(false)} style={{ padding: '14px 24px', borderRadius: 12, background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
              ← Close / Go Back
            </button>
            <button onClick={() => window.print()} style={{ padding: '14px 24px', borderRadius: 12, background: C.accent, color: '#111', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>
              🖨️ Print Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
