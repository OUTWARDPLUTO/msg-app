import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { getFBAuth } from '../shared/firebase.js';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import appIconLight from '../assets/app-icon-light.png';
import appIconDark from '../assets/app-icon-dark.png';

export default function LoginScreen({ onLogin, darkMode }) {
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fbStatus, setFbStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    getFBAuth()
      .then(() => setFbStatus('ready'))
      .catch(() => setFbStatus('error'));
  }, []);

  const handleEmail = async () => {
    if (!email.trim() || !pass.trim()) { setError('Please fill in all fields'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name'); return; }
    if (fbStatus !== 'ready') { setError('Firebase not loaded. Check your connection.'); return; }
    setLoading(true); setError('');
    try {
      const auth = await getFBAuth();
      let cred;
      if (mode === 'login') {
        cred = await auth.signInWithEmailAndPassword(email.trim(), pass);
      } else {
        cred = await auth.createUserWithEmailAndPassword(email.trim(), pass);
        await cred.user.updateProfile({ displayName: name.trim() });
      }
      onLogin({
        uid: cred.user.uid,
        name: cred.user.displayName || name || email.split('@')[0],
        email: cred.user.email,
        photo: cred.user.photoURL,
      }, mode === 'signup');
    } catch (e) {
      const msgs = {
        'auth/user-not-found':      'No account found with this email',
        'auth/invalid-credential':  'Incorrect email or password',
        'auth/wrong-password':      'Incorrect password',
        'auth/email-already-in-use':'This email is already registered — log in instead',
        'auth/weak-password':       'Password must be at least 6 characters',
        'auth/invalid-email':       'Invalid email address',
        'auth/network-request-failed': 'Network error — check your connection',
        'auth/too-many-requests':   'Too many attempts — try again in a few minutes',
      };
      setError(msgs[e.code] || `Error: ${e.message}`);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    if (fbStatus !== 'ready') { setError('Firebase not loaded yet.'); return; }
    setLoading(true); setError('');
    try {
      // Initialize the native Google Auth plugin before attempting sign-in.
      // Required by capacitor-google-auth v3+ — without this call the Android
      // native bridge is null and crashes with a NullPointerException.
      await GoogleAuth.initialize({
        // Must be the Web (server) client ID — not the Android client ID.
        // Google uses this as the token audience to produce an idToken for Firebase.
        clientId: '924373588150-g5hhp1hiu6db6tduir3fr9ekfqkavhir.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      if (!idToken) throw new Error('Google sign-in did not return an ID token.');
      const auth = await getFBAuth();
      const credential = window.firebase.auth.GoogleAuthProvider.credential(idToken);
      const cred = await auth.signInWithCredential(credential);
      onLogin({
        uid: cred.user.uid,
        name: cred.user.displayName,
        email: cred.user.email,
        photo: cred.user.photoURL,
      }, cred.additionalUserInfo?.isNewUser);
    } catch (e) {
      // Ignore user-cancelled flows silently
      const cancelled = e.code === 'auth/popup-closed-by-user'
        || e.message === 'The user canceled the sign-in flow.'
        || e.message === 'The user canceled the Google sign-in flow.';
      if (!cancelled) {
        console.error('[MSG] Google sign-in error:', e);
        setError(e.message || 'Google sign-in failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const inp = (val, set, type = 'text', placeholder = '') => (
    <input
      type={type} value={val} onChange={e => set(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleEmail()}
      placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box', background: C.s3,
        border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px',
        color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', marginBottom: 12,
      }}
      onFocus={e => e.target.style.borderColor = C.accent}
      onBlur={e => e.target.style.borderColor = C.border}
    />
  );

  return (
    <div style={{
      position: 'relative', background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 430,
      margin: '0 auto', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', boxSizing: 'border-box', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img
          src={darkMode ? appIconDark : appIconLight}
          alt="MSG"
          style={{ height: 72, width: 72, objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: 16 }}
        />
        <div style={{ color: C.sub, fontSize: 13, marginTop: 14, lineHeight: 1.6 }}>Train smart. Eat right. Track everything.</div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 24, padding: '22px 20px', boxShadow: C.elevShadow }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: C.s3, borderRadius: 12, padding: 3, marginBottom: 18 }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, padding: '9px', borderRadius: 10,
              background: mode === m ? C.s1 : 'transparent',
              color: mode === m ? C.text : C.muted,
              border: 'none', fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: mode === m ? C.cardShadow : 'none', transition: 'all 0.2s',
            }}>{m === 'login' ? 'Log In' : 'Sign Up'}</button>
          ))}
        </div>

        {mode === 'signup' && inp(name, setName, 'text', 'Full name')}
        {inp(email, setEmail, 'email', 'Email address')}
        {inp(pass, setPass, 'password', '••••••••')}

        {error && (
          <div style={{ fontSize: 12, color: C.red, marginBottom: 12, padding: '9px 12px', background: C.red + '18', borderRadius: 10, lineHeight: 1.5 }}>
            ⚠️ {error}
          </div>
        )}
        {fbStatus === 'loading' && (
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, textAlign: 'center' }}>Loading Firebase… ⏳</div>
        )}

        <button onClick={handleEmail} disabled={loading || fbStatus === 'loading'} style={{
          width: '100%', background: fbStatus === 'ready' ? C.accent : C.s4,
          border: 'none', borderRadius: 14, padding: '15px', color: fbStatus === 'ready' ? '#111' : C.muted,
          fontFamily: fn, fontWeight: 800, fontSize: 14,
          cursor: loading || fbStatus === 'loading' ? 'wait' : 'pointer',
          boxShadow: fbStatus === 'ready' ? C.accentShadow : 'none',
          opacity: loading ? 0.7 : 1, marginBottom: 12, transition: 'all 0.2s',
        }}>
          {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <button onClick={handleGoogle} disabled={loading || fbStatus !== 'ready'} style={{
          width: '100%', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14,
          padding: '13px', color: C.text, fontFamily: fn, fontWeight: 700, fontSize: 13,
          cursor: loading || fbStatus !== 'ready' ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: C.cardShadow, opacity: fbStatus !== 'ready' ? 0.5 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>
      </div>

      <div style={{ color: C.muted, fontSize: 11, marginTop: 14, textAlign: 'center', lineHeight: 1.6 }}>
        By continuing you agree to our Terms of Service.
      </div>
    </div>
  );
}
