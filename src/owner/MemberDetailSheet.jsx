import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, ModalShell, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

function getJsDate(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

export default function MemberDetailSheet({ member, gymId, onClose }) {
  const [memberDetail, setMemberDetail] = useState(member);
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(!member.email || !member.joinedAt);

  // Self-healing: if details are missing, fetch them dynamically
  useEffect(() => {
    let active = true;
    if (!member.email || !member.joinedAt) {
      setLoadingDetails(true);
      getFBFirestore().then(db => {
        if (!active) return;
        db.doc(`members/${gymId}_${member.uid}`).get().then(snap => {
          if (!active) return;
          if (snap.exists) {
            setMemberDetail({ id: snap.id, ...snap.data() });
          } else {
            // fallback: check users/{uid}
            db.doc(`users/${member.uid}`).get().then(uSnap => {
              if (!active) return;
              if (uSnap.exists) {
                const uData = uSnap.data();
                setMemberDetail({
                  uid: member.uid,
                  name: uData.name || member.name || 'Member',
                  email: uData.email || '',
                  status: 'active',
                  engagementScore: uData.engagementScore || 0,
                  joinedAt: uData.createdAt || null
                });
              }
            }).catch(() => {});
          }
          setLoadingDetails(false);
        }).catch(() => {
          if (active) setLoadingDetails(false);
        });
      }).catch(() => {
        if (active) setLoadingDetails(false);
      });
    } else {
      setMemberDetail(member);
      setLoadingDetails(false);
    }
    return () => { active = false; };
  }, [member, gymId]);

  // Load activity log
  useEffect(() => {
    let active = true;
    setLoadingActivity(true);
    getFBFirestore().then(db => {
      if (!active) return;
      db.collection(`activityLogs/${gymId}/events`)
        .where('uid', '==', member.uid)
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get()
        .then(snap => {
          if (!active) return;
          setActivity(snap.docs.map(d => d.data()));
          setLoadingActivity(false);
        })
        .catch(e => {
          console.warn("Failed to load activity logs:", e);
          if (active) setLoadingActivity(false);
        });
    }).catch(() => {
      if (active) setLoadingActivity(false);
    });
    return () => { active = false; };
  }, [member.uid, gymId]);

  function timeAgo(ts) {
    const date = getJsDate(ts);
    if (!date) return '—';
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  const getJoinedDate = () => {
    const d = getJsDate(memberDetail?.joinedAt);
    return d ? d.toLocaleDateString('en-IN') : '—';
  };

  const TYPE_ICONS = { workout: '💪', diet: '🥗', progress: '📊', checkin: '✅' };

  return (
    <ModalShell title={memberDetail?.name || 'Member'} onClose={onClose}>
      <div style={{ padding: '20px 20px 32px' }} className="msg-anim-fadein">
        {loadingDetails ? (
          <Spinner text="Loading profile..." />
        ) : (
          <>
            {/* Profile Card */}
            <div style={{
              background: C.s2, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: '16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 14,
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: C.accent + '20', border: `1px solid ${C.accent}33`,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, fontWeight: 800, color: C.accent, fontFamily: fn,
              }}>
                {(memberDetail?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: fn, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberDetail?.name || '—'}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberDetail?.email || '—'}</div>
                {memberDetail?.phone && <div style={{ fontSize: 12, color: C.muted }}>{memberDetail.phone}</div>}
              </div>
              <ScoreRing score={memberDetail?.engagementScore ?? 0} size={56} strokeWidth={5} />
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { l: 'Engagement Score', v: `${memberDetail?.engagementScore ?? 0}/100`, c: C.accent },
                { l: 'Role', v: memberDetail?.role || 'member', c: C.blue },
                { l: 'Status', v: memberDetail?.status || 'active', c: memberDetail?.status === 'active' ? C.green : C.orange },
                { l: 'Joined', v: getJoinedDate(), c: C.sub },
              ].map(s => (
                <Card key={s.l} style={{ padding: '12px 14px' }}>
                  <Lbl text={s.l} style={{ marginBottom: 4 }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.c, fontFamily: fn, lineHeight: 1.2, textTransform: 'capitalize' }}>{s.v}</div>
                </Card>
              ))}
            </div>

            {/* Activity Log */}
            <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>Activity Log</div>
            {loadingActivity ? (
              <Spinner text="Loading activity…" />
            ) : activity.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No activity recorded yet.</div>
            ) : activity.map((a, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px',
                background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 7,
              }}>
                <span style={{ fontSize: 18 }}>{TYPE_ICONS[a.type] || '📌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600, textTransform: 'capitalize' }}>{a.type}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{timeAgo(a.timestamp)}</div>
                </div>
                <div style={{ fontSize: 11, color: C.accent, fontFamily: fb, fontWeight: 700 }}>+{a.points}pts</div>
              </div>
            ))}
          </>
        )}
      </div>
    </ModalShell>
  );
}
