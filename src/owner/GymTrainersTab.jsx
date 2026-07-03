import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Spinner, Skeleton } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

export default function GymTrainersTab({ gymId, onBack }) {
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

  // removed early return

  const pending = trainers.filter(t => t.status === 'pending');
  const active = trainers.filter(t => t.status === 'active');

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>Gym Trainers</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }} className="msg-anim-fadein">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width={150} height={16} style={{ marginBottom: 16 }} />
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Skeleton circle width={40} height={40} stagger={i} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton width={120} height={16} stagger={i} />
                    <Skeleton width={160} height={12} stagger={i} />
                  </div>
                </div>
                <Skeleton width={64} height={32} borderRadius={10} stagger={i} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, color: C.orange, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>Pending Approval ({pending.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pending.map(t => (
                    <div key={t.id} style={{ padding: '16px', background: C.orange + '10', border: `1px solid ${C.orange}33`, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.orange + '20', color: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fb, fontSize: 16 }}>
                          {(t.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 600, color: C.text }}>{t.name || 'Unnamed Trainer'}</div>
                          <div style={{ fontSize: 13, color: C.sub, fontFamily: fn }}>{t.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button disabled={actionLoading} onClick={() => handleAction(t.uid, 'active')} style={{
                          flex: 1, background: C.orange, color: '#111', border: 'none', borderRadius: 12, padding: '12px', fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease'
                        }}>Approve</button>
                        <button disabled={actionLoading} onClick={() => handleAction(t.uid, 'rejected')} style={{
                          flex: 1, background: C.s1, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px', fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease'
                        }}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>Active Trainers ({active.length})</div>
              {active.length === 0 ? (
                <div style={{ background: C.s1, border: `1px dashed ${C.border}`, borderRadius: 16, padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>👟</div>
                  <div style={{ fontFamily: fb, fontSize: 16, color: C.text, marginBottom: 4 }}>No Active Trainers</div>
                  <div style={{ color: C.sub, fontSize: 13, fontFamily: fn }}>Trainers will appear here once approved.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {active.map(t => (
                    <div key={t.id} style={{ padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: C.accent + '20', color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fb, fontSize: 16 }}>
                          {(t.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 600, color: C.text }}>{t.name || 'Unnamed Trainer'}</div>
                          <div style={{ fontSize: 13, color: C.sub, fontFamily: fn }}>{t.email}</div>
                        </div>
                      </div>
                      <button disabled={actionLoading} onClick={() => handleAction(t.uid, 'revoked')} style={{
                        background: C.bg, color: C.red, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontFamily: fb, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease'
                      }}>Revoke</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
