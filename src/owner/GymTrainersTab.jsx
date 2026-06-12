import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

export default function GymTrainersTab({ gymId }) {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let unsubscribe;
    getFBFirestore().then(db => {
      unsubscribe = db.collection(`gyms/${gymId}/trainers`)
        .orderBy('appliedAt', 'desc')
        .onSnapshot(snap => {
          setTrainers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
          setLoading(false);
        }, err => {
          console.warn('Trainers fetch error:', err);
          setLoading(false);
        });
    });
    return () => unsubscribe && unsubscribe();
  }, [gymId]);

  const handleAction = async (uid, status) => {
    setActionLoading(true);
    try {
      const db = await getFBFirestore();
      await db.doc(`gyms/${gymId}/trainers/${uid}`).update({ status });
    } catch (e) {
      console.error(e);
      alert('Action failed. Check console.');
    }
    setActionLoading(false);
  };

  if (loading) return <Spinner text="Loading trainers..." />;

  const pending = trainers.filter(t => t.status === 'pending');
  const active = trainers.filter(t => t.status === 'active');

  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 20 }}>Trainers</div>
      
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: C.orange, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Pending Approval</div>
          {pending.map(t => (
            <Card key={t.id} style={{ padding: '16px', marginBottom: 12, border: `1px solid ${C.orange}44` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text }}>{t.name || 'Unnamed Trainer'}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{t.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={actionLoading} onClick={() => handleAction(t.uid, 'active')} style={{
                    background: C.accent, color: '#111', border: 'none', borderRadius: 8, padding: '8px 14px', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer'
                  }}>Approve</button>
                  <button disabled={actionLoading} onClick={() => handleAction(t.uid, 'rejected')} style={{
                    background: C.s3, color: C.red, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 14px', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer'
                  }}>Reject</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Active Trainers</div>
        {active.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No active trainers found.</div>
        ) : active.map(t => (
          <Card key={t.id} style={{ padding: '16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text }}>{t.name || 'Unnamed Trainer'}</div>
                <div style={{ fontSize: 12, color: C.sub }}>{t.email}</div>
              </div>
              <button disabled={actionLoading} onClick={() => handleAction(t.uid, 'revoked')} style={{
                background: C.s3, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontFamily: fn, fontWeight: 600, fontSize: 11, cursor: 'pointer'
              }}>Revoke</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
