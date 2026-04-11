import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl } from '../shared/primitives.jsx';

// Trainer view — simplified version showing assigned members
export default function TrainerView({ gymId, user, onLogout }) {
  return (
    <div style={{
      background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
        <div>
          <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, color: C.blue, letterSpacing: '-0.01em' }}>MSG Trainer</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Trainer Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            background: C.blue + '18', border: `1px solid ${C.blue}33`,
            borderRadius: 8, padding: '3px 10px', fontSize: 10, color: C.blue,
            fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>TRAINER</div>
          <button onClick={onLogout} style={{
            background: C.s3, border: `1px solid ${C.border}`, borderRadius: '50%',
            width: 34, height: 34, cursor: 'pointer', color: C.sub, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⏻</button>
        </div>
      </div>

      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🏋️</div>
          <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>
            Trainer Dashboard
          </div>
          <div style={{ color: C.sub, fontSize: 14, lineHeight: 1.6 }}>
            Full trainer features are coming in the next update.<br />
            For now, contact your gym owner for member management.
          </div>
          <div style={{ marginTop: 24, padding: '14px 16px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14 }}>
            <Lbl text="Your Gym ID" style={{ marginBottom: 6 }} />
            <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 700, color: C.accent, letterSpacing: '0.08em' }}>{gymId}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
