import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, StatusBadge, ModalShell, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
import MemberDetailSheet from './MemberDetailSheet.jsx';

function getJsDate(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

export default function MemberListTab({ gymId, setBackHandler, onViewMemberProfile }) {
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
            background: !C.isLight ? 'rgba(26, 26, 26, 0.40)' : 'rgba(255, 255, 255, 0.45)',
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
            <button key={m.id} onClick={() => onViewMemberProfile ? onViewMemberProfile(m) : setSelected(m)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: !C.isLight ? 'rgba(26, 26, 26, 0.40)' : 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${!C.isLight ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
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

// Extracted to separate file MemberDetailSheet.jsx
