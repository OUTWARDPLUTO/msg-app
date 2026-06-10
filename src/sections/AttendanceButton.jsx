import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { checkIn, getTodayCheckIn, getDistance, getFBFirestore } from '../shared/firebase.js';

export default function AttendanceButton({ uid, gymId, onCheckIn }) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  // Scanner States
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scannerLoading, setScannerLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const DEMO = gymId === 'demo-gym';

  useEffect(() => {
    if (!uid || !gymId) { setLoading(false); return; }
    if (DEMO) {
      const today = new Date().toISOString().split('T')[0];
      setChecked(localStorage.getItem('demo_checkin') === today);
      setLoading(false);
      return;
    }
    getTodayCheckIn(uid, gymId).then(v => { setChecked(v); setLoading(false); });
    
    return () => {
      // Clean up camera stream and timers on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [uid, gymId]);

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
    setScannerLoading(true);
    setShowScanner(true);
    
    try {
      await loadJsQR();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      
      // Delay slightly to ensure video element is rendered and bound
      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          try {
            await videoRef.current.play();
            animationFrameRef.current = requestAnimationFrame(tickScanner);
          } catch (e) {
            console.error("Video play failed:", e);
            setScannerError("Could not start video stream playback.");
          }
        }
      }, 300);
    } catch (err) {
      console.warn("Scanner error:", err);
      setScannerError(err.message || 'Camera permission denied or device not supported.');
    }
    setScannerLoading(false);
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
        if (code.data.startsWith('msg-checkin:')) {
          const parts = code.data.split(':');
          const scannedGymId = parts[1];
          const token = parts[2];
          
          if (scannedGymId === gymId) {
            closeScanner();
            submitCheckIn(token);
            return;
          } else {
            alert("This QR code belongs to a different gym.");
            closeScanner();
            return;
          }
        }
      }
    }
    
    if (streamRef.current) {
      animationFrameRef.current = requestAnimationFrame(tickScanner);
    }
  };

  const submitCheckIn = async (token = null) => {
    setLoading(true);
    try {
      const result = await checkIn(uid, gymId, token);
      if (result.success || result.alreadyCheckedIn) {
        setChecked(true);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 600);
        if (onCheckIn) onCheckIn();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (err) {
      alert(`Check-in failed: ${err.message}`);
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (checked || loading) return;
    setLoading(true);
    
    if (DEMO) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('demo_checkin', today);
      setChecked(true); setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
      setLoading(false);
      if (onCheckIn) onCheckIn();
      return;
    }
    
    try {
      const db = await getFBFirestore();
      const gymSnap = await db.doc(`gyms/${gymId}`).get();
      if (!gymSnap.exists) {
        alert("Gym not found.");
        setLoading(false);
        return;
      }
      
      const settings = gymSnap.data().settings || {};
      
      if (settings.useGps) {
        const gymLat = settings.latitude;
        const gymLng = settings.longitude;
        if (gymLat === undefined || gymLat === null || gymLng === undefined || gymLng === null) {
          alert("Gym coordinates have not been configured by the owner in Gym Settings.");
          setLoading(false);
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const dist = getDistance(pos.coords.latitude, pos.coords.longitude, gymLat, gymLng);
            if (dist > 100) {
              alert(`Verification failed: You are too far from the gym (${Math.round(dist)}m away). You must be within 100 meters.`);
              setLoading(false);
            } else {
              if (settings.useQr) {
                startScanner();
              } else {
                submitCheckIn();
              }
            }
          },
          (err) => {
            alert(`GPS verification failed: ${err.message}. Please enable location permissions on your device to check in.`);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        if (settings.useQr) {
          startScanner();
        } else {
          submitCheckIn();
        }
      }
    } catch (err) {
      alert(`Check-in verification failed: ${err.message}`);
      setLoading(false);
    }
  };

  if (!uid || !gymId) return null;

  return (
    <div style={{ padding: '0 16px', marginBottom: 12 }}>
      <button
        onClick={handleCheckIn}
        disabled={checked || loading}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          background: checked
            ? `linear-gradient(135deg, ${C.green}25, ${C.green}10)`
            : `linear-gradient(135deg, ${C.accent}25, ${C.accent}10)`,
          border: `1px solid ${checked ? C.green + '40' : C.accent + '40'}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16, cursor: checked ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          transform: animating ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: checked ? C.green + '20' : C.accent + '20',
          border: `1.5px solid ${checked ? C.green + '40' : C.accent + '40'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, transition: 'all 0.3s',
        }}>
          {loading ? '⏳' : checked ? '✅' : '📍'}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{
            fontFamily: fn, fontSize: 15, fontWeight: 800,
            color: checked ? C.green : C.accent, lineHeight: 1.1,
          }}>
            {loading ? 'Checking status…' : checked ? 'Checked In Today ✓' : 'Check In Now'}
          </div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>
            {checked
              ? `Great! Your attendance is logged for ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : 'Tap to mark your gym attendance for today'}
          </div>
        </div>
        {!checked && !loading && (
          <div style={{ color: C.accent, fontSize: 18, flexShrink: 0 }}>›</div>
        )}
      </button>

      {/* QR Code Camera Scanner Overlay */}
      {showScanner && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24, boxSizing: 'border-box', fontFamily: fn
        }} className="msg-anim-fadein">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.accent, marginBottom: 6 }}>Scan Gym QR Code</div>
            <div style={{ fontSize: 12, color: C.sub }}>Point your camera at the screen at gym reception</div>
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
    </div>
  );
}
