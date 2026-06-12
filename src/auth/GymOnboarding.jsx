import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Spinner } from '../shared/primitives.jsx';
import {
  getGymByCode, createGym, createMemberDoc,
  setUserDoc, serverTimestamp, saveSubscription, getFBFirestore,
} from '../shared/firebase.js';
import appIconLight from '../assets/app-icon-light.png';
import appIconDark from '../assets/app-icon-dark.png';

// ─── Keyframe injector ───────────────────────────────────────────────────────
function injectOnboardingCSS() {
  if (document.getElementById('onboard-css')) return;
  const s = document.createElement('style');
  s.id = 'onboard-css';
  s.textContent = `
    @keyframes obFadeUp { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
    @keyframes obPulse  { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
    @keyframes obShine  { from{background-position:-200% 0;} to{background-position:200% 0;} }
    @keyframes obBounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
    .ob-card { animation: obFadeUp 0.45s cubic-bezier(.22,.68,0,1.2) both; }
    .ob-card-2 { animation: obFadeUp 0.45s 0.1s cubic-bezier(.22,.68,0,1.2) both; }
    .ob-card-3 { animation: obFadeUp 0.45s 0.2s cubic-bezier(.22,.68,0,1.2) both; }
    .ob-pulse { animation: obPulse 2s ease-in-out infinite; }
    .ob-bounce { animation: obBounce 1.8s ease-in-out infinite; }
    .ob-btn:active { transform:scale(0.97) !important; }
    .ob-choice:hover { transform:translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .ob-choice { transition: transform 0.2s, box-shadow 0.2s; }
  `;
  document.head.appendChild(s);
}

export default function GymOnboarding({ user, onGymJoined, darkMode }) {
  injectOnboardingCSS();

  const [screen, setScreen]     = useState('choice');
  const [gymCode, setGymCode]   = useState('');
  const [gymName, setGymName]   = useState('');
  const [error, setError]       = useState('');
  const [createdGym, setCreatedGym] = useState(null);
  const [copied, setCopied]     = useState(false);
  const [subPlan, setSubPlan]   = useState(null); // 'monthly'|'yearly'

  // Scanner States for QR Join
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Pre-warm Firestore so scripts are loaded before user submits gym code
  useEffect(() => { getFBFirestore().catch(() => {}); }, []);

  // ── Join gym by code (members) ─────────────────────────────────────────────
  const handleJoin = async (overrideCode = null) => {
    const code = (overrideCode || gymCode).trim().toUpperCase();
    if (code.length !== 6) { setError('Please enter a valid 6-character gym code.'); return; }
    setScreen('loading'); setError('');
    try {
      const gym = await getGymByCode(code);
      if (!gym) {
        setScreen('join');
        setError('No gym found with that code. Double-check with your gym owner.');
        return;
      }
      await setUserDoc(user.uid, {
        uid: user.uid, name: user.name || '', email: user.email || '',
        role: 'member', gymId: gym.id,
        joinedAt: serverTimestamp(), lastActiveAt: serverTimestamp(),
      });
      await createMemberDoc(gym.id, user.uid, {
        name: user.name || '', email: user.email || '', phone: '', role: 'member',
      });
      onGymJoined(gym.id, 'member', gym.name);
    } catch (e) {
      setScreen('join');
      const msg = e?.code === 'unavailable' || e?.message?.includes('network')
        ? 'Network error. Check your internet connection and try again.'
        : e?.code === 'permission-denied'
        ? 'Access denied. Please log out and log back in.'
        : `Error: ${e?.message || 'Something went wrong. Please try again.'}`;
      setError(msg);
      console.error('[MSG] handleJoin:', e);
    }
  };

  // ── Create gym (owner path → go to subscription) ───────────────────────────
  const handleCreate = async () => {
    if (!gymName.trim()) { setError('Please enter a gym name.'); return; }
    setScreen('loading'); setError('');
    try {
      const gym = await createGym(user.uid, gymName.trim());
      await setUserDoc(user.uid, {
        uid: user.uid, name: user.name || '', email: user.email || '',
        role: 'owner', gymId: gym.id,
        joinedAt: serverTimestamp(), lastActiveAt: serverTimestamp(),
      });
      setCreatedGym(gym);
      setScreen('subscription'); // → show pricing
    } catch (e) {
      setScreen('create');
      const msg = e?.code === 'unavailable' || e?.message?.includes('network')
        ? 'Network error. Check your internet connection and try again.'
        : e?.code === 'permission-denied'
        ? 'Access denied. Please log out and log back in.'
        : `Error: ${e?.message || 'Could not create gym. Please try again.'}`;
      setError(msg);
      console.error('[MSG] handleCreate:', e);
    }
  };

    }
  };

  // ── QR Scanner Logic ───────────────────────────────────────────────────────
  const loadJsQR = () => {
    return new Promise((resolve, reject) => {
      if (window.jsQR) { resolve(window.jsQR); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      script.onload = () => resolve(window.jsQR);
      script.onerror = () => reject(new Error('Failed to load QR scanner library.'));
      document.body.appendChild(script);
    });
  };

  const startScanner = async () => {
    setScannerError('');
    setShowScanner(true);
    
    try {
      await loadJsQR();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          try {
            await videoRef.current.play();
            animationFrameRef.current = requestAnimationFrame(tickScanner);
          } catch (e) {
            setScannerError("Could not start video stream playback.");
          }
        }
      }, 300);
    } catch (err) {
      setScannerError(err.message || 'Camera permission denied or device not supported.');
    }
  };

  const closeScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setShowScanner(false);
  };

  const tickScanner = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert"
      });
      
      if (code && code.data) {
        // We expect the QR to be something like `join_ABCDEF_timestamp` or just `ABCDEF` or URL
        let scannedCode = code.data;
        if (scannedCode.includes('join_')) {
          scannedCode = scannedCode.split('join_')[1].split('_')[0];
        } else if (scannedCode.length > 6) {
          // try to parse if it's a URL like msg://join?code=ABCDEF
          const match = scannedCode.match(/code=([A-Z0-9]{6})/i);
          if (match) scannedCode = match[1];
        }

        if (scannedCode && scannedCode.length === 6) {
          closeScanner();
          setGymCode(scannedCode);
          handleJoin(scannedCode);
          return;
        }
      }
    }
    
    if (streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(tickScanner);
    }
  };

  // Helper to load Razorpay SDK dynamically
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

  // ── Activate subscription (Secure Razorpay Flow) ─────────────────
  const handleActivate = async () => {
    if (!subPlan) return;
    setScreen('loading');
    setError('');

    try {
      const isLoaded = await loadRazorpaySDK();
      if (!isLoaded) throw new Error("Could not load payment gateway. Check your connection.");

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      // 1. Ask backend to create a secure order
      const res = await fetch(`${API_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: subPlan, gymId: createdGym.id, uid: user.uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      // 2. Open Razorpay Checkout widget
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Public key
        amount: data.amount,
        currency: "INR",
        name: "MSG Gym Platform",
        description: `${subPlan === 'yearly' ? 'Yearly' : 'Monthly'} Subscription`,
        order_id: data.orderId,
        handler: async function (response) {
          // 3. Send signature to backend for verification
          setScreen('loading');
          try {
            const verifyRes = await fetch(`${API_URL}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                uid: user.uid,
                plan: subPlan,
                gymId: createdGym.id
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");
            
            // Payment successful and verified!
            setCreatedGym(prev => ({ ...prev, gymCode: verifyData.gymCode }));
            setScreen('success');
          } catch (e) {
            console.error("Verification Error:", e);
            setError("Payment verification failed. Please contact support.");
            setScreen('subscription');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: "#E5FF00" // C.accent
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        console.error("Payment Failed", response.error);
        setError("Payment failed: " + response.error.description);
        setScreen('subscription');
      });
      
      // We must close the loading screen because Razorpay opens an overlay
      setScreen('subscription'); 
      rzp.open();
      
    } catch (e) {
      console.error(e);
      setError(e.message || "An error occurred during payment.");
      setScreen('subscription');
    }
  };

  const handleCopyCode = () => {
    if (!createdGym?.gymCode) return;
    navigator.clipboard.writeText(createdGym.gymCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Shared helpers ────────────────────────────────────────────────────────
  const backBtn = (to) => (
    <button onClick={() => { setScreen(to); setError(''); }} style={{
      background: 'none', border: 'none', color: C.muted, fontSize: 13,
      cursor: 'pointer', fontFamily: fn, marginBottom: 20, textAlign: 'left', padding: 0,
    }} className="ob-btn">← Back</button>
  );

  const logoBlock = (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <img
        src={appIconLight}
        alt="MSG"
        style={{ height: 60, width: 60, objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: 14 }}
      />
    </div>
  );

  const errorBox = error && (
    <div style={{ color: C.red, fontSize: 12, marginBottom: 14, padding: '9px 12px', background: C.red + '18', borderRadius: 10, lineHeight: 1.5 }}>
      ⚠️ {error}
    </div>
  );

  const wrap = (children) => (
    <div style={{
      background: C.bg, color: C.text, fontFamily: fn,
      height: '100dvh', maxWidth: 430, margin: '0 auto', padding: '40px 24px',
      boxSizing: 'border-box', overflowY: 'auto', display: 'flex', flexDirection: 'column',
    }}>
      {logoBlock}
      {children}
    </div>
  );

  if (screen === 'loading') return wrap(<Spinner text="Setting up your gym…" />);

  // ── Success: show gym code ─────────────────────────────────────────────────
  if (screen === 'success') return wrap(
    <>
      <div className="ob-card" style={{ textAlign: 'center', marginBottom: 28 }}>
        <div className="ob-bounce" style={{ fontSize: 56, marginBottom: 12, display:'inline-block' }}>🎉</div>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 8 }}>
          You're Live!
        </div>
        <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.6 }}>
          <strong style={{ color: C.accent }}>{createdGym?.name}</strong> is active.{' '}
          Share your unique code so members can join.
        </div>
      </div>

      <div className="ob-card-2" style={{
        background: `linear-gradient(135deg, ${C.accent}20, ${C.accent}08)`,
        border: `2px solid ${C.accent}55`, borderRadius: 20,
        padding: '24px 20px', textAlign: 'center', marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Your Gym Code & QR
        </div>
        
        {createdGym?.gymCode && (
          <div style={{ background: '#fff', padding: 12, borderRadius: 12, display: 'inline-block', marginBottom: 16 }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${createdGym.gymCode}`} 
              alt="Gym QR Code" 
              style={{ width: 150, height: 150, display: 'block' }}
            />
          </div>
        )}

        <div style={{ fontFamily: fn, fontSize: 42, fontWeight: 800, color: C.accent, letterSpacing: '0.4em', lineHeight: 1 }}>
          {createdGym?.gymCode}
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 10, lineHeight: 1.5 }}>
          Share this code or QR so members can join. Find it anytime in Settings.
        </div>
      </div>

      <button onClick={handleCopyCode} className="ob-btn ob-card-3" style={{
        width: '100%', padding: '14px', marginBottom: 12,
        background: copied ? C.green + '18' : C.s2,
        border: `1px solid ${copied ? C.green : C.border}`,
        borderRadius: 14, color: copied ? C.green : C.sub,
        fontFamily: fn, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        transition: 'all 0.25s',
      }}>
        {copied ? '✓ Copied to clipboard!' : '📋 Copy Gym Code'}
      </button>

      <button onClick={() => onGymJoined(createdGym.id, 'owner', createdGym.name)} className="ob-btn ob-card-3" style={{
        width: '100%', padding: '15px',
        background: C.accent, border: 'none', borderRadius: 14,
        color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 15,
        cursor: 'pointer', boxShadow: C.accentShadow, transition: 'all 0.2s',
      }}>
        Go to Dashboard →
      </button>
    </>
  );

  // ── Subscription Pricing Screen ────────────────────────────────────────────
  if (screen === 'subscription') return wrap(
    <>
      <div className="ob-card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>⚡</div>
        <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>
          Activate Your Gym
        </div>
        <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.6 }}>
          Choose a plan to unlock the full MSG owner dashboard for{' '}
          <strong style={{ color: C.accent }}>{createdGym?.name}</strong>
        </div>
      </div>

      {/* Early adopter banner */}
      <div className="ob-card-2" style={{
        background: `linear-gradient(135deg, ${C.accent}22, ${C.orange}18)`,
        border: `1px solid ${C.accent}44`, borderRadius: 14,
        padding: '10px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🎁</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.accent }}>Early Adopter Offer — Limited Time</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Lock in 50% off before prices go up. Forever.</div>
        </div>
      </div>

      {/* 7-Day Trial Plan */}
      <button
        className={`ob-choice ob-card-2 ob-btn`}
        onClick={() => setSubPlan('trial')}
        style={{
          width: '100%', padding: '16px 20px', marginBottom: 12, textAlign: 'left',
          background: subPlan === 'trial'
            ? `linear-gradient(135deg, ${C.accent}22, ${C.accent}0A)`
            : C.s2,
          border: `2px solid ${subPlan === 'trial' ? C.accent : C.border}`,
          borderRadius: 18, cursor: 'pointer',
          boxShadow: subPlan === 'trial' ? `0 0 0 3px ${C.accent}22, ${C.cardShadow}` : C.cardShadow,
          transition: 'all 0.25s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>⏱️</span>
              <span style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: subPlan === 'trial' ? C.accent : C.text }}>7-Day Trial</span>
              {subPlan === 'trial' && <span style={{ fontSize: 12, color: C.accent }}>✓</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.accent }}>₹149</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>1 Week Access</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>Test it out</div>
          </div>
        </div>
      </button>

      {/* Monthly Plan */}
      <button
        className={`ob-choice ob-card-2 ob-btn`}
        onClick={() => setSubPlan('monthly')}
        style={{
          width: '100%', padding: '18px 20px', marginBottom: 12, textAlign: 'left',
          background: subPlan === 'monthly'
            ? `linear-gradient(135deg, ${C.accent}22, ${C.accent}0A)`
            : C.s2,
          border: `2px solid ${subPlan === 'monthly' ? C.accent : C.border}`,
          borderRadius: 18, cursor: 'pointer',
          boxShadow: subPlan === 'monthly' ? `0 0 0 3px ${C.accent}22, ${C.cardShadow}` : C.cardShadow,
          transition: 'all 0.25s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>📅</span>
              <span style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: subPlan === 'monthly' ? C.accent : C.text }}>Monthly</span>
              {subPlan === 'monthly' && <span style={{ fontSize: 12, color: C.accent }}>✓</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.accent }}>₹499</span>
              <span style={{ fontSize: 13, color: C.muted }}>/month</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C.muted, textDecoration: 'line-through', marginRight: 6 }}>₹999/month</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.green + '20', padding: '1px 7px', borderRadius: 4 }}>50% OFF</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Billed Monthly</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>Cancel anytime</div>
          </div>
        </div>
      </button>

      {/* Yearly Plan */}
      <button
        className={`ob-choice ob-card-2 ob-btn`}
        onClick={() => setSubPlan('yearly')}
        style={{
          width: '100%', padding: '16px 20px', marginBottom: 20, textAlign: 'left',
          background: subPlan === 'yearly'
            ? `linear-gradient(135deg, ${C.accent}22, ${C.accent}0A)`
            : C.s2,
          border: `2px solid ${subPlan === 'yearly' ? C.accent : C.border}`,
          borderRadius: 18, cursor: 'pointer',
          boxShadow: subPlan === 'yearly' ? `0 0 0 3px ${C.accent}22` : 'none',
          transition: 'all 0.25s',
        }}
      >
        {/* BEST VALUE badge — inline, not absolute */}
        <div style={{
          display: 'inline-block', marginBottom: 10,
          background: C.accent, color: '#111',
          fontSize: 9, fontFamily: fb, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 6,
        }}>⭐ BEST VALUE</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              <span style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: subPlan === 'yearly' ? C.accent : C.text }}>Yearly</span>
              {subPlan === 'yearly' && <span style={{ fontSize: 12, color: C.accent }}>✓</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.accent }}>₹4,199</span>
              <span style={{ fontSize: 13, color: C.muted }}>/year</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C.muted, textDecoration: 'line-through', marginRight: 6 }}>₹11,988/year</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: C.green + '20', padding: '1px 7px', borderRadius: 4 }}>65% OFF</span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Just ₹350/mo</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>Save ₹7,789</div>
          </div>
        </div>
      </button>


      {/* What's included */}
      <div className="ob-card-3" style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Everything Included</div>
        {[
          ['📊', 'Member engagement & retention dashboard'],
          ['⚠️', 'Inactive member alerts & insights'],
          ['📋', 'Unlimited member CSV import'],
          ['📅', 'Live attendance tracking'],
          ['🔑', 'Unique gym code + unlimited members'],
          ['💪', 'MSG fitness app for all your members'],
        ].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'center' }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            <span style={{ fontSize: 12, color: C.sub }}>{text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleActivate}
        disabled={!subPlan}
        className="ob-btn"
        style={{
          width: '100%', padding: '16px',
          background: subPlan ? C.accent : C.s4,
          color: subPlan ? '#111' : C.muted,
          border: 'none', borderRadius: 14,
          fontFamily: fn, fontWeight: 800, fontSize: 15,
          cursor: subPlan ? 'pointer' : 'not-allowed',
          boxShadow: subPlan ? C.accentShadow : 'none',
          transition: 'all 0.2s', marginBottom: 10,
        }}
      >
        {subPlan ? `Activate ${subPlan === 'monthly' ? 'Monthly' : subPlan === 'yearly' ? 'Yearly' : 'Trial'} Plan →` : 'Select a Plan to Continue'}
      </button>

      <div style={{ fontSize: 10, color: C.muted, textAlign: 'center', lineHeight: 1.6 }}>
        🔒 Secure payment · Cancel anytime · No hidden fees
      </div>
    </>
  );

  // ── Choice Screen ──────────────────────────────────────────────────────────
  if (screen === 'choice') return wrap(
    <>
      <div className="ob-card" style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Welcome to MSG
      </div>
      <div className="ob-card" style={{ color: C.sub, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        You're one step away. Are you a gym owner or a member?
      </div>

      <button onClick={() => setScreen('create')} className="ob-choice ob-card-2 ob-btn" style={{
        width: '100%', padding: '20px 18px', marginBottom: 14,
        background: `linear-gradient(135deg, ${C.accent}22, ${C.accent}08)`,
        border: `1px solid ${C.accent}44`, borderRadius: 18, cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🏋️</div>
        <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.accent, marginBottom: 4 }}>I'm a Gym Owner</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>Create your gym, manage members, track engagement and retention.</div>
      </button>

      <button onClick={() => setScreen('join')} className="ob-choice ob-card-3 ob-btn" style={{
        width: '100%', padding: '20px 18px',
        background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18,
        cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>💪</div>
        <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>I'm a Gym Member</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>Enter your gym's 6-character code to join and start training.</div>
      </button>
    </>
  );

  // ── Join Screen (members only) ─────────────────────────────────────────────
  if (screen === 'join') return wrap(
    <>
      {backBtn('choice')}
      <div className="ob-card" style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
      <div className="ob-card" style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>Enter Gym Code</div>
      <div className="ob-card" style={{ color: C.sub, fontSize: 13, marginBottom: 28, lineHeight: 1.5 }}>
        Ask your gym owner for the 6-character code. Without a valid code, access is not possible.
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input
          value={gymCode}
          onChange={e => { setGymCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
          placeholder="e.g. GYM123"
          maxLength={6}
          style={{
            flex: 1, boxSizing: 'border-box', background: C.s2,
            border: `2px solid ${gymCode.length === 6 ? C.accent : C.border}`,
            borderRadius: 14, padding: '16px', color: C.text, fontSize: 24,
            fontFamily: fn, fontWeight: 800, outline: 'none', letterSpacing: '0.3em',
            textAlign: 'center', textTransform: 'uppercase',
            transition: 'border-color 0.2s',
          }}
        />
        <button onClick={startScanner} style={{
          background: C.s3, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: '0 20px', color: C.text, fontSize: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          📷
        </button>
      </div>
      {errorBox}

      {/* Code dots indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < gymCode.length ? C.accent : C.s4,
            transition: 'background 0.15s',
          }} />
        ))}
      </div>

      <button onClick={handleJoin} disabled={gymCode.length !== 6} className="ob-btn" style={{
        width: '100%', padding: '15px',
        background: gymCode.length === 6 ? C.accent : C.s4,
        color: gymCode.length === 6 ? '#111' : C.muted,
        border: 'none', borderRadius: 14, fontFamily: fn, fontWeight: 800,
        fontSize: 15, cursor: gymCode.length === 6 ? 'pointer' : 'not-allowed',
        boxShadow: gymCode.length === 6 ? C.accentShadow : 'none',
        transition: 'all 0.2s',
      }}>Join Gym →</button>

      <div style={{ marginTop: 16, fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.6, padding: '10px 14px', background: C.s2, borderRadius: 12, border: `1px solid ${C.border}` }}>
        🔐 A valid gym code is required to access MSG as a member. Contact your gym owner if you don't have one.
      </div>

      {showScanner && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24, boxSizing: 'border-box', fontFamily: fn
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.accent, marginBottom: 6 }}>Scan Gym QR Code</div>
            <div style={{ fontSize: 12, color: C.sub }}>Point your camera at the gym's code</div>
          </div>
          
          <div style={{
            position: 'relative', width: 280, height: 280, borderRadius: 20,
            overflow: 'hidden', background: '#000', border: `2px solid ${C.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {scannerError ? (
              <div style={{ padding: 20, color: C.red, fontSize: 13, textAlign: 'center' }}>
                ⚠️ Camera Error: {scannerError}
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', width: 180, height: 180,
                  border: `3px solid ${C.accent}`, borderRadius: 16,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', pointerEvents: 'none'
                }} />
              </>
            )}
          </div>

          <button
            onClick={closeScanner}
            style={{
              marginTop: 24, background: C.s2, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '12px 28px', color: C.text,
              fontSize: 13, fontFamily: fn, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </>
  );

  // ── Create Screen (owner) ──────────────────────────────────────────────────
  return wrap(
    <>
      {backBtn('choice')}
      <div className="ob-card" style={{ fontSize: 36, marginBottom: 12 }}>🏗️</div>
      <div className="ob-card" style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>Name Your Gym</div>
      <div className="ob-card" style={{ color: C.sub, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
        We'll generate a unique gym code. You'll choose your plan on the next step.
      </div>

      <div className="ob-card-2" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: C.sub, fontFamily: fb, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Gym Name</div>
        <input
          value={gymName}
          onChange={e => { setGymName(e.target.value); setError(''); }}
          placeholder="e.g. PowerHouse Fitness"
          style={{
            width: '100%', boxSizing: 'border-box', background: C.s2,
            border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px',
            color: C.text, fontSize: 16, fontFamily: fn, outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      </div>

      {errorBox}

      <button onClick={handleCreate} disabled={!gymName.trim()} className="ob-btn ob-card-3" style={{
        width: '100%', padding: '15px',
        background: gymName.trim() ? C.accent : C.s4,
        color: gymName.trim() ? '#111' : C.muted,
        border: 'none', borderRadius: 14, fontFamily: fn, fontWeight: 800,
        fontSize: 15, cursor: gymName.trim() ? 'pointer' : 'not-allowed',
        boxShadow: gymName.trim() ? C.accentShadow : 'none',
        transition: 'all 0.2s',
      }}>Continue to Pricing →</button>
    </>
  );
}
