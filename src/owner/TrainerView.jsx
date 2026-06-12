import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
import MemberDetailSheet from './MemberDetailSheet.jsx';
import UserAvatar from '../shared/UserAvatar.jsx';

export default function TrainerView({ gymId, user, onLogout }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkCode, setLinkCode] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    let unsubscribe;
    getFBFirestore().then(db => {
      unsubscribe = db.collection('members')
        .where('gymId', '==', gymId)
        .where('trainerUid', '==', user.uid)
        .onSnapshot(snap => {
          setMembers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
          setLoading(false);
        }, err => {
          console.warn('Trainer members fetch error:', err);
          setLoading(false);
        });
    });
    return () => unsubscribe && unsubscribe();
  }, [gymId, user.uid]);

  const handleLink = async () => {
    const code = linkCode.trim().toUpperCase();
    if (code.length !== 6) { setLinkError('Code must be 6 characters'); return; }
    setLinkLoading(true); setLinkError('');
    try {
      const db = await getFBFirestore();
      const codeSnap = await db.doc(`gyms/${gymId}/member_codes/${code}`).get();
      if (!codeSnap.exists) {
        setLinkError('Invalid member code');
        setLinkLoading(false);
        return;
      }
      const memberUid = codeSnap.data().uid;
      await db.doc(`members/${gymId}_${memberUid}`).update({
        trainerUid: user.uid
      });
      setLinkCode('');
      setLinkError('Linked successfully!');
      setTimeout(() => setLinkError(''), 3000);
    } catch (e) {
      console.error(e);
      setLinkError('Error linking member');
    }
    setLinkLoading(false);
  };

  return (
    <div style={{
      background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserAvatar user={user} size={36} fontSize={14} />
          <div>
            <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{user.name || 'Trainer'}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{gymId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            background: C.accent + '18', border: `1px solid ${C.accent}33`,
            borderRadius: 8, padding: '3px 10px', fontSize: 10, color: C.accent,
            fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>TRAINER</div>
          <button onClick={onLogout} style={{
            background: C.s3, border: `1px solid ${C.border}`, borderRadius: '50%',
            width: 34, height: 34, cursor: 'pointer', color: C.sub, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>⏻</button>
        </div>
      </div>

      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <Card style={{ padding: '16px', marginBottom: 20 }}>
          <Lbl text="Link a Member" style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
            Ask the member for their 6-character Trainer Link Code from their Profile screen.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={linkCode} onChange={e => { setLinkCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setLinkError(''); }}
              placeholder="e.g. ABCDEF" maxLength={6}
              style={{
                flex: 1, boxSizing: 'border-box', background: C.s3, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '12px', color: C.text, fontSize: 16, fontFamily: fn, outline: 'none', letterSpacing: '0.1em'
              }}
            />
            <button disabled={linkLoading || linkCode.length !== 6} onClick={handleLink} style={{
              background: linkCode.length === 6 ? C.accent : C.s4, color: linkCode.length === 6 ? '#111' : C.muted,
              border: 'none', borderRadius: 10, padding: '0 16px', fontFamily: fn, fontWeight: 700, fontSize: 14, cursor: linkCode.length === 6 ? 'pointer' : 'not-allowed',
            }}>
              {linkLoading ? '...' : 'Link'}
            </button>
          </div>
          {linkError && <div style={{ color: linkError.includes('success') ? C.green : C.red, fontSize: 12, marginTop: 8, fontFamily: fb, fontWeight: 600 }}>{linkError}</div>}
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>My Members</div>
          <div style={{ fontSize: 12, color: C.muted, fontFamily: fb, fontWeight: 700 }}>{members.length} Total</div>
        </div>

        {loading ? (
          <Spinner text="Loading your members..." />
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: C.muted, fontSize: 14 }}>
            You haven't linked any members yet.<br/>Enter a code above to start.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <Card key={m.id} style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setSelectedMember(m)}>
                <UserAvatar user={m} size={44} fontSize={16} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || 'Unnamed Member'}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{m.email}</div>
                </div>
                <div style={{ color: C.muted, fontSize: 16 }}>→</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedMember && (
        <MemberDetailSheet
          member={selectedMember}
          gymId={gymId}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
