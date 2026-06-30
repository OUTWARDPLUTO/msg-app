import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, ScoreRing, StatusBadge, ModalShell, Spinner, Skeleton } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
import MemberDetailSheet from './MemberDetailSheet.jsx';
import AlertsTab from './AlertsTab.jsx';
import RevenueDetail from './RevenueDetail.jsx';

function getJsDate(field) {
  if (!field) return null;
  if (typeof field.toDate === 'function') return field.toDate();
  if (field.seconds) return new Date(field.seconds * 1000);
  const d = new Date(field);
  return isNaN(d.getTime()) ? null : d;
}

export default function MemberListTab({ gymId, setBackHandler, onViewMemberProfile, subTab, setSubTab }) {
  const _subTab = subTab || 'directory';
  const _setSubTab = setSubTab || (() => {});
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

  // remove early return for loading

  if (selected) {
    return <MemberDetailSheet member={selected} gymId={gymId} onClose={() => setSelected(null)} />;
  }

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Sub-Nav */}
      <div style={{ padding: '0 20px', marginBottom: 16, display: 'flex', gap: 12, overflowX: 'auto' }} className="msg-scroll">
        {[
          { id: 'directory', label: 'Directory' },
          { id: 'alerts', label: 'At-Risk Alerts' },
          { id: 'stats', label: 'Revenue Stats' }
        ].map(t => (
          <button key={t.id} onClick={() => _setSubTab(t.id)} style={{
            background: _subTab === t.id ? C.text : C.s1,
            color: _subTab === t.id ? C.bg : C.text,
            border: `1px solid ${_subTab === t.id ? C.text : C.border}`,
            padding: '8px 16px', borderRadius: 20, fontFamily: fb, fontSize: 13,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {_subTab === 'alerts' && <AlertsTab gymId={gymId} onViewMemberProfile={onViewMemberProfile} hideHeader={true} />}
      {_subTab === 'stats' && <RevenueDetail gymId={gymId} hideHeader={true} />}

      {_subTab === 'directory' && (
        <>
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
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${C.border}` }}>
                    <Skeleton circle size={48} stagger={i} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton width="60%" height={16} stagger={i} />
                      <Skeleton width="40%" height={12} stagger={i} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            No members found.
          </div>
        ) : filtered.map(m => {
          // Use the actual subscription status to match MemberDetailSheet
          const statusText = (m.status || 'active') === 'inactive' ? 'Inactive' : 'Active';
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
        </>
      )}
    </div>
  );
}
