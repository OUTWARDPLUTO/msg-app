import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Spinner } from '../shared/primitives.jsx';
import {
  getGymByCode, createGym, createMemberDoc,
  setUserDoc, serverTimestamp,
} from '../shared/firebase.js';

export default function GymOnboarding({ user, onGymJoined }) {
  const [screen, setScreen]     = useState('choice'); // 'choice'|'join'|'create'|'loading'|'success'
  const [gymCode, setGymCode]   = useState('');
  const [gymName, setGymName]   = useState('');
  const [error, setError]       = useState('');
  const [createdGym, setCreatedGym] = useState(null);
  const [copied, setCopied]     = useState(false);

  // ── Join gym by code ───────────────────────────────────────────────────────
  const handleJoin = async () => {
    const code = gymCode.trim().toUpperCase();
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
      setError('Something went wrong. Please try again.');
      console.error(e);
    }
  };

  // ── Create new gym (owner path) ───────────────────────────────────────────
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
      // Show code reveal screen before entering dashboard
      setCreatedGym(gym);
      setScreen('success');
    } catch (e) {
      setScreen('create');
      setError('Could not create gym. Please try again.');
      console.error(e);
    }
  };

  const handleCopyCode = () => {
    if (!createdGym?.gymCode) return;
    navigator.clipboard.writeText(createdGym.gymCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Shared styles ─────────────────────────────────────────────────────────
  const backBtn = (
    <button onClick={() => { setScreen('choice'); setError(''); }} style={{
      background: 'none', border: 'none', color: C.muted, fontSize: 13,
      cursor: 'pointer', fontFamily: fn, marginBottom: 20, textAlign: 'left', padding: 0,
    }}>← Back</button>
  );

  const logoBlock = (
    <div style={{ textAlign: 'center', marginBottom: 36 }}>
      <div style={{ fontSize: 52, fontWeight: 800, color: C.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>MSG</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', color: C.muted, textTransform: 'uppercase', marginTop: 5, fontFamily: fb }}>Gym Platform</div>
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
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Gym Created!
        </div>
        <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.6 }}>
          <strong style={{ color: C.accent }}>{createdGym?.name}</strong> is live.<br />
          Share your unique code so members can join.
        </div>
      </div>

      {/* Big code display */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accent}18, ${C.accent}06)`,
        border: `2px solid ${C.accent}55`, borderRadius: 20,
        padding: '24px 20px', textAlign: 'center', marginBottom: 16,
      }}>
        <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Your Gym Code
        </div>
        <div style={{ fontFamily: fn, fontSize: 42, fontWeight: 800, color: C.accent, letterSpacing: '0.4em', lineHeight: 1 }}>
          {createdGym?.gymCode}
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 10, lineHeight: 1.5 }}>
          Only 1 code per gym. This is permanent — you can always find it in Settings.
        </div>
      </div>

      {/* Copy button */}
      <button onClick={handleCopyCode} style={{
        width: '100%', padding: '14px', marginBottom: 12,
        background: copied ? C.green + '18' : C.s2,
        border: `1px solid ${copied ? C.green : C.border}`,
        borderRadius: 14, color: copied ? C.green : C.sub,
        fontFamily: fn, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        transition: 'all 0.2s',
      }}>
        {copied ? '✓ Copied to clipboard!' : '📋 Copy Code'}
      </button>

      {/* Enter dashboard */}
      <button onClick={() => onGymJoined(createdGym.id, 'owner', createdGym.name)} style={{
        width: '100%', padding: '15px',
        background: C.accent, border: 'none', borderRadius: 14,
        color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 15,
        cursor: 'pointer', boxShadow: C.accentShadow,
      }}>
        Go to Dashboard →
      </button>
    </>
  );

  // ── Choice Screen ──────────────────────────────────────────────────────────
  if (screen === 'choice') return wrap(
    <>
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Welcome to MSG
      </div>
      <div style={{ color: C.sub, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        You're one step away. Are you a gym owner or a member?
      </div>

      <button onClick={() => setScreen('create')} style={{
        width: '100%', padding: '20px 18px', marginBottom: 14,
        background: `linear-gradient(135deg, ${C.accent}22, ${C.accent}08)`,
        border: `1px solid ${C.accent}44`, borderRadius: 18, cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🏋️</div>
        <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.accent, marginBottom: 4 }}>I'm a Gym Owner</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>Create your gym, add members, track engagement and retention.</div>
      </button>

      <button onClick={() => setScreen('join')} style={{
        width: '100%', padding: '20px 18px',
        background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18,
        cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>💪</div>
        <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>I'm a Gym Member</div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>Join your gym using a 6-character code from your gym owner.</div>
      </button>
    </>
  );

  // ── Join Screen ────────────────────────────────────────────────────────────
  if (screen === 'join') return wrap(
    <>
      {backBtn}
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
      <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>Enter Gym Code</div>
      <div style={{ color: C.sub, fontSize: 13, marginBottom: 28, lineHeight: 1.5 }}>
        Ask your gym owner for the 6-character code or use the invite link they shared.
      </div>

      <input
        value={gymCode}
        onChange={e => { setGymCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setError(''); }}
        placeholder="e.g. GYM123"
        maxLength={6}
        style={{
          width: '100%', boxSizing: 'border-box', background: C.s2,
          border: `2px solid ${gymCode.length === 6 ? C.accent : C.border}`,
          borderRadius: 14, padding: '16px', color: C.text, fontSize: 24,
          fontFamily: fn, fontWeight: 800, outline: 'none', letterSpacing: '0.3em',
          textAlign: 'center', marginBottom: 14, textTransform: 'uppercase',
          transition: 'border-color 0.2s',
        }}
      />
      {errorBox}
      <button onClick={handleJoin} disabled={gymCode.length !== 6} style={{
        width: '100%', padding: '15px',
        background: gymCode.length === 6 ? C.accent : C.s4,
        color: gymCode.length === 6 ? '#111' : C.muted,
        border: 'none', borderRadius: 14, fontFamily: fn, fontWeight: 800,
        fontSize: 15, cursor: gymCode.length === 6 ? 'pointer' : 'not-allowed',
        boxShadow: gymCode.length === 6 ? C.accentShadow : 'none',
      }}>Join Gym →</button>
    </>
  );

  // ── Create Screen ──────────────────────────────────────────────────────────
  return wrap(
    <>
      {backBtn}
      <div style={{ fontSize: 36, marginBottom: 12 }}>🏗️</div>
      <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-0.02em' }}>Create Your Gym</div>
      <div style={{ color: C.sub, fontSize: 13, marginBottom: 28, lineHeight: 1.5 }}>
        We'll generate a unique gym code. Share it with your members to let them join.
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: C.sub, fontFamily: fb, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Gym Name</div>
        <input
          value={gymName}
          onChange={e => { setGymName(e.target.value); setError(''); }}
          placeholder="e.g. PowerHouse Fitness"
          style={{
            width: '100%', boxSizing: 'border-box', background: C.s2,
            border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px',
            color: C.text, fontSize: 16, fontFamily: fn, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      </div>

      <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>What you get</div>
        {[['📊','Member engagement dashboard'],['🔑','Unique gym code + invite link'],['⚠️','Inactive member alerts'],['📋','CSV bulk member import']].map(([icon, text]) => (
          <div key={text} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 13, color: C.sub }}>{text}</span>
          </div>
        ))}
      </div>

      {errorBox}

      <button onClick={handleCreate} disabled={!gymName.trim()} style={{
        width: '100%', padding: '15px',
        background: gymName.trim() ? C.accent : C.s4,
        color: gymName.trim() ? '#111' : C.muted,
        border: 'none', borderRadius: 14, fontFamily: fn, fontWeight: 800,
        fontSize: 15, cursor: gymName.trim() ? 'pointer' : 'not-allowed',
        boxShadow: gymName.trim() ? C.accentShadow : 'none',
      }}>Create Gym & Continue →</button>
    </>
  );
}
