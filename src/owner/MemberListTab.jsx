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
  const [activeTab, setActiveTab] = useState('All');

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
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>Members</div>
        </div>
        <button style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search members..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, 
              padding: '16px 48px 16px 44px',
              color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
            }}
          />
          <button style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, color: C.sub, display: 'flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
        </div>
      </div>

      {/* Add Member Button */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <button style={{
          width: '100%', background: C.accent, borderRadius: 16, padding: '16px',
          color: C.text, fontFamily: fb, fontSize: 16, fontWeight: 700, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Member
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ padding: '0 20px', marginBottom: 24, display: 'flex', gap: 24, borderBottom: `1px solid ${C.border}` }}>
        {['All', 'Active', 'Inactive', 'Freeze'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            background: activeTab === t ? 'rgba(229,57,53,0.15)' : 'none',
            border: 'none', padding: '8px 16px', borderRadius: '8px 8px 0 0',
            color: activeTab === t ? C.text : C.sub,
            fontFamily: fb, fontSize: 13, fontWeight: activeTab === t ? 600 : 500,
            cursor: 'pointer', position: 'relative'
          }}>
            {t}
            {activeTab === t && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: C.accent }} />}
          </button>
        ))}
      </div>

      {/* Member List */}
      <div style={{ padding: '0 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            No members found.
          </div>
        ) : filtered.map(m => {
          // Map real status to mockup labels. In mockup "Active" is red, "Freeze" is grey.
          const statusText = computeStatus(m) === 'inactive' ? 'Inactive' : 'Active';
          const statusColor = statusText === 'Active' ? C.accent : C.sub;
          
          return (
            <button key={m.id} onClick={() => onViewMemberProfile ? onViewMemberProfile(m) : setSelected(m)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 0', background: 'none', border: 'none', borderBottom: `1px solid ${C.border}`,
              cursor: 'pointer', textAlign: 'left',
            }}>
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: C.s1, border: `1px solid ${C.border}`, overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fn, fontSize: 16, fontWeight: 700, color: C.text,
              }}>
                {(m.name || '?').charAt(0).toUpperCase()}
              </div>
              
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontFamily: fb, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                  {m.name || 'Unnamed Member'}
                </div>
                <div style={{ fontSize: 13, fontFamily: fn, color: C.sub }}>
                  Premium Plan {/* Mocked as per image, replace with real plan later */}
                </div>
              </div>
              
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontFamily: fb, color: statusColor, fontWeight: 600 }}>
                  {statusText}
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Extracted to separate file MemberDetailSheet.jsx
