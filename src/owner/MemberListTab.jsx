import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, StatusBadge, ModalShell, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

function getJsDate(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

export default function MemberListTab({ gymId, setBackHandler }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null); // member for detail sheet

  useEffect(() => {
    if (selected && setBackHandler) {
      setBackHandler(() => () => {
        setSelected(null);
        return true;
      });
    } else if (setBackHandler) {
      setBackHandler(null);
    }
    return () => { if (setBackHandler) setBackHandler(null); };
  }, [selected, setBackHandler]);

  useEffect(() => { if (gymId) loadMembers(); }, [gymId]);

  async function loadMembers() {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const snap = await db.collection('members')
        .where('gymId', '==', gymId)
        .orderBy('joinedAt', 'desc')
        .get();
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.warn('MemberList load error:', e.message);
    }
    setLoading(false);
  }


  function computeStatus(member) {
    const date = getJsDate(member.lastActiveAt);
    const la = date ? date.getTime() : 0;
    const now = Date.now();
    if (!la || now - la > 5 * 86400000) return 'inactive';
    if (now - la > 3 * 86400000) return 'at-risk';
    return 'active';
  }

  function lastSeenText(member) {
    const date = getJsDate(member.lastActiveAt);
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    if (diff < 3600000) return 'Just now';
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  const filtered = members.filter(m => {
    const q = query.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q) || (m.phone || '').includes(q);
  });

  if (loading) return <Spinner text="Loading members…" />;

  if (selected) {
    return <MemberDetailSheet member={selected} gymId={gymId} onClose={() => setSelected(null)} />;
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: '20px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Members</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{members.length} total</div>
        </div>
        <button onClick={loadMembers} style={{
          background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: '7px 14px', color: C.sub, fontFamily: fb, fontWeight: 700, fontSize: 11,
          cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>↺ Refresh</button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, email or phone…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.bg === '#111111' ? 'rgba(26, 26, 26, 0.40)' : 'rgba(255, 255, 255, 0.45)',
            border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px',
            color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      </div>

      {/* Member List */}
      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
            {query ? 'No members match your search' : 'No members yet. Import via CSV or share your gym code.'}
          </div>
        ) : filtered.map(m => {
          const status = computeStatus(m);
          return (
            <button key={m.id} onClick={() => setSelected(m)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: C.bg === '#111111' ? 'rgba(26, 26, 26, 0.40)' : 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${C.bg === '#111111' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              borderRadius: 14, marginBottom: 8, cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + '44'}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: C.accent + '20', border: `1px solid ${C.accent}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.accent,
              }}>
                {(m.name || '?').charAt(0).toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name || 'Unnamed Member'}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  Last seen: {lastSeenText(m)}
                </div>
              </div>
              {/* Score + Status */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <StatusBadge status={status} />
                <div style={{ fontSize: 11, color: C.sub, fontFamily: fb, fontWeight: 700 }}>
                  Score: <span style={{ color: C.accent }}>{m.engagementScore ?? 0}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Member Detail Sheet ──────────────────────────────────────────────────────
function MemberDetailSheet({ member, gymId, onClose }) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadActivity(); }, []);

  async function loadActivity() {
    try {
      const db = await getFBFirestore();
      const snap = await db.collection(`activityLogs/${gymId}/events`)
        .where('uid', '==', member.uid)
        .orderBy('timestamp', 'desc')
        .limit(30)
        .get();
      setActivity(snap.docs.map(d => d.data()));
    } catch (e) { console.warn(e); }
    setLoading(false);
  }

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
    const d = getJsDate(member.joinedAt);
    return d ? d.toLocaleDateString('en-IN') : '—';
  };

  const TYPE_ICONS = { workout: '💪', diet: '🥗', progress: '📊', checkin: '✅' };

  return (
    <ModalShell title={member.name || 'Member'} onClose={onClose}>
      <div style={{ padding: '20px 20px 32px' }}>
        {/* Profile Card */}
        <div style={{
          background: C.s2, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: C.accent + '20', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 22, fontWeight: 800, color: C.accent, fontFamily: fn,
          }}>
            {(member.name || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text, fontFamily: fn }}>{member.name || '—'}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{member.email || '—'}</div>
            {member.phone && <div style={{ fontSize: 12, color: C.muted }}>{member.phone}</div>}
          </div>
          <ScoreRing score={member.engagementScore ?? 0} size={56} strokeWidth={5} />
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { l: 'Engagement Score', v: `${member.engagementScore ?? 0}/100`, c: C.accent },
            { l: 'Role', v: member.role || 'member', c: C.blue },
            { l: 'Status', v: member.status || 'active', c: member.status === 'active' ? C.green : C.orange },
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
        {loading ? (
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
      </div>
    </ModalShell>
  );
}
