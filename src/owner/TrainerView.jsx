/**
 * TrainerView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete, production-ready Trainer Experience for MSG (My Smart Gains).
 *
 * Capabilities:
 *  - Multi-tenant: See ONLY members assigned to this trainer (where trainerUid == user.uid && gymId == gymId).
 *  - Dashboard Summary: Total assigned, On Track (80+), Building (60-79), Needs Attention (35-59), Inactive (<35).
 *  - Today's Follow-ups: Highlights members needing immediate coaching intervention.
 *  - Member Roster: Search, engagement filter chips, and profile launcher.
 *  - Member Detail Sheet: 4-pillar engagement breakdown, activity timeline, attendance, and coaching notes.
 *  - Link Member: 6-character link code verification.
 *  - Resilient states: Loading skeleton, offline banner, empty states, and error handling with retry.
 */

import { useState, useEffect, useMemo } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner, UserAvatar, Skeleton } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';
import { getStatusFromScore } from '../shared/engagementScore.js';
import MemberDetailSheet from './MemberDetailSheet.jsx';

export default function TrainerView({ gymId, user, onLogout }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Navigation tab: 'dashboard' | 'members'
  const [tab, setTab] = useState('dashboard');
  const [memberFilter, setMemberFilter] = useState('all'); // 'all' | 'needs_attention' | 'on_track' | 'inactive'
  const [searchQuery, setSearchQuery] = useState('');

  // Member linking state
  const [linkCode, setLinkCode] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState(null); // { text, type: 'success'|'error' }

  // Selected member for detail sheet
  const [selectedMember, setSelectedMember] = useState(null);
  const [childBackHandler, setChildBackHandler] = useState(null);

  // Android system back button handler
  useEffect(() => {
    window.__msgGoBack = () => {
      if (selectedMember) {
        setSelectedMember(null);
        return true;
      }
      if (childBackHandler) {
        const handled = childBackHandler();
        if (handled) return true;
      }
      if (tab !== 'dashboard') {
        setTab('dashboard');
        return true;
      }
      return false;
    };
    return () => {
      window.__msgGoBack = null;
    };
  }, [selectedMember, childBackHandler, tab]);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Real-time listener for assigned members ─────────────────────────────────
  const fetchAssignedMembers = () => {
    if (!gymId || !user?.uid) return;
    setLoading(true);
    setError(null);

    let unsubscribe = null;
    getFBFirestore().then(db => {
      // Multi-tenant query: ONLY members in this gym assigned to this trainer
      unsubscribe = db.collection('members')
        .where('gymId', '==', gymId)
        .where('trainerUid', '==', user.uid)
        .onSnapshot(
          snap => {
            const list = snap.docs.map(d => ({ ...d.data(), id: d.id }));
            setMembers(list);
            setLoading(false);
          },
          err => {
            console.warn('[MSG] Trainer members fetch error:', err);
            setError('Unable to load your assigned members. Please check connection.');
            setLoading(false);
          }
        );
    }).catch(err => {
      setError(err.message || 'Connection error');
      setLoading(false);
    });

    return () => { if (unsubscribe) unsubscribe(); };
  };

  useEffect(() => {
    const unsub = fetchAssignedMembers();
    return () => unsub && unsub();
  }, [gymId, user?.uid]);

  // ── Handle linking a member by 6-char code ──────────────────────────────────
  const handleLinkMember = async () => {
    const code = linkCode.trim().toUpperCase();
    if (code.length !== 6) {
      setLinkMessage({ text: 'Code must be exactly 6 characters.', type: 'error' });
      return;
    }
    setLinkLoading(true);
    setLinkMessage(null);

    try {
      const db = await getFBFirestore();
      const codeSnap = await db.doc(`gyms/${gymId}/member_codes/${code}`).get();

      if (!codeSnap.exists) {
        setLinkMessage({ text: 'Invalid or expired member code.', type: 'error' });
        setLinkLoading(false);
        return;
      }

      const memberUid = codeSnap.data().uid;
      // Assign this trainer to the member
      await db.doc(`members/${gymId}_${memberUid}`).update({
        trainerUid: user.uid,
        trainerAssignedAt: new Date(),
      });

      setLinkCode('');
      setLinkMessage({ text: 'Member linked successfully to your roster!', type: 'success' });
      setTimeout(() => setLinkMessage(null), 4000);
    } catch (err) {
      console.error('[MSG] Linking error:', err);
      setLinkMessage({ text: 'Failed to link member. Please try again.', type: 'error' });
    }
    setLinkLoading(false);
  };

  // ── Metrics calculation using standardized thresholds ────────────────────────
  const metrics = useMemo(() => {
    let onTrack = 0;
    let building = 0;
    let needsAttention = 0;
    let inactive = 0;

    const now = Date.now();
    const followUps = [];

    members.forEach(m => {
      const score = m.engagementScore !== undefined ? m.engagementScore : null;
      const la = m.lastActiveAt?.toDate?.()?.getTime() || 0;
      const daysSince = la ? Math.floor((now - la) / (24 * 60 * 60 * 1000)) : 999;

      let status;
      if (score !== null) {
        status = getStatusFromScore(score);
      } else {
        // Fallback if score not yet computed
        if (daysSince <= 2) status = { key: 'on_track', label: 'On track' };
        else if (daysSince <= 4) status = { key: 'building', label: 'Building' };
        else if (daysSince <= 7) status = { key: 'needs_attention', label: 'Needs attention' };
        else status = { key: 'inactive', label: 'Inactive' };
      }

      if (status.key === 'on_track') onTrack++;
      else if (status.key === 'building') building++;
      else if (status.key === 'needs_attention') needsAttention++;
      else inactive++;

      // Today's follow-up trigger: needs attention, inactive for 4+ days, or score < 50
      if (status.key === 'needs_attention' || status.key === 'inactive' || daysSince >= 4) {
        followUps.push({
          ...m,
          _status: status,
          _daysSince: daysSince === 999 ? 'Never' : `${daysSince}d ago`,
          _reason: daysSince >= 7 ? 'Inactive for over a week' : daysSince >= 4 ? 'No check-in in 4+ days' : 'Engagement score dropped',
        });
      }
    });

    return {
      total: members.length,
      onTrack,
      building,
      needsAttention,
      inactive,
      followUps,
    };
  }, [members]);

  // ── Filtered members roster ─────────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    let list = members;

    // Filter chip
    if (memberFilter === 'on_track') {
      list = list.filter(m => (m.engagementScore !== undefined ? m.engagementScore >= 80 : false));
    } else if (memberFilter === 'building') {
      list = list.filter(m => (m.engagementScore !== undefined ? m.engagementScore >= 60 && m.engagementScore < 80 : false));
    } else if (memberFilter === 'needs_attention') {
      list = list.filter(m => (m.engagementScore !== undefined ? m.engagementScore >= 35 && m.engagementScore < 60 : true));
    } else if (memberFilter === 'inactive') {
      list = list.filter(m => (m.engagementScore !== undefined ? m.engagementScore < 35 : false));
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.phone || '').includes(q)
      );
    }

    return list;
  }, [members, memberFilter, searchQuery]);

  return (
    <div style={{
      background: C.bg, color: C.text, fontFamily: fn,
      display: 'flex', flexDirection: 'column', height: '100dvh',
      maxWidth: 430, margin: '0 auto', overflow: 'hidden', position: 'relative',
    }}>
      {/* Offline Banner */}
      {!isOnline && (
        <div style={{
          background: C.orange, color: '#111', fontSize: 11, fontFamily: fb,
          fontWeight: 700, padding: '4px 12px', textAlign: 'center', letterSpacing: '0.04em',
        }}>
          OFFLINE MODE — SHOWING LOCALLY CACHED DATA
        </div>
      )}

      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 20px 12px',
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: C.s1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserAvatar user={user} size={38} fontSize={15} />
          <div>
            <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
              {user.name || 'Trainer'}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Coach Roster · {gymId}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            background: C.accent + '18', border: `1px solid ${C.accent}33`,
            borderRadius: 8, padding: '3px 9px', fontSize: 10, color: C.accent,
            fontFamily: fb, fontWeight: 700, letterSpacing: '0.06em',
          }}>
            TRAINER
          </div>
          <button onClick={onLogout} title="Sign Out" style={{
            background: C.s2, border: `1px solid ${C.border}`, borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: C.sub, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            ⏻
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
              Connection Error
            </div>
            <div style={{ color: C.sub, fontSize: 13, marginBottom: 20 }}>{error}</div>
            <button onClick={fetchAssignedMembers} style={{
              background: C.accent, color: '#111', border: 'none', borderRadius: 12,
              padding: '12px 24px', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer',
            }}>
              ↻ Retry Loading
            </button>
          </div>
        ) : loading ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton height={100} borderRadius={16} />
            <Skeleton height={140} borderRadius={16} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height={70} borderRadius={14} stagger={i} />)}
            </div>
          </div>
        ) : tab === 'dashboard' ? (
          /* ── 1. DASHBOARD OVERVIEW ── */
          <div style={{ padding: '20px 20px 40px' }}>
            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px' }}>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase' }}>Assigned Members</div>
                <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 800, color: C.text, marginTop: 4 }}>{metrics.total}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>In your coaching squad</div>
              </div>

              <div onClick={() => { setMemberFilter('needs_attention'); setTab('members'); }} style={{ background: metrics.needsAttention > 0 ? C.orange + '12' : C.s1, border: `1px solid ${metrics.needsAttention > 0 ? C.orange + '44' : C.border}`, borderRadius: 16, padding: '14px', cursor: 'pointer' }}>
                <div style={{ fontSize: 11, color: metrics.needsAttention > 0 ? C.orange : C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase' }}>Needs Attention</div>
                <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 800, color: metrics.needsAttention > 0 ? C.orange : C.text, marginTop: 4 }}>
                  {metrics.needsAttention + metrics.inactive}
                </div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Tap to review & follow up →</div>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px' }}>
                <div style={{ fontSize: 11, color: C.green, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase' }}>On Track</div>
                <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 800, color: C.green, marginTop: 4 }}>{metrics.onTrack}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>High engagement (80+)</div>
              </div>

              <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px' }}>
                <div style={{ fontSize: 11, color: C.blue, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase' }}>Building Momentum</div>
                <div style={{ fontSize: 28, fontFamily: fb, fontWeight: 800, color: C.blue, marginTop: 4 }}>{metrics.building}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Active habits (60-79)</div>
              </div>
            </div>

            {/* Today's Follow-ups */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 800, color: C.text }}>
                  ⚡ Today's Follow-ups
                </div>
                <span style={{ fontSize: 12, color: C.sub }}>{metrics.followUps.length} pending</span>
              </div>

              {metrics.followUps.length === 0 ? (
                <div style={{
                  background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16,
                  padding: '24px 20px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                  <div style={{ fontFamily: fb, fontSize: 14, fontWeight: 700, color: C.text }}>All members active!</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Everyone in your squad has engaged recently.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {metrics.followUps.slice(0, 4).map(m => {
                    const status = getStatusFromScore(m.engagementScore || 30);
                    return (
                      <div key={m.id} onClick={() => setSelectedMember(m)} style={{
                        background: C.s1, border: `1px solid ${C.border}`, borderRadius: 14,
                        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                      }}>
                        <UserAvatar user={m} size={40} fontSize={14} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontFamily: fb, fontWeight: 700, color: C.text }}>{m.name || 'Member'}</div>
                          <div style={{ fontSize: 11, color: status.color, marginTop: 2 }}>{m._reason} · {m._daysSince}</div>
                        </div>
                        <div style={{
                          background: status.badgeBg, color: status.color,
                          borderRadius: 8, padding: '4px 8px', fontSize: 11, fontFamily: fb, fontWeight: 800,
                        }}>
                          {m.engagementScore ?? '—'}
                        </div>
                      </div>
                    );
                  })}
                  {metrics.followUps.length > 4 && (
                    <button onClick={() => { setMemberFilter('needs_attention'); setTab('members'); }} style={{
                      background: 'none', border: 'none', color: C.accent, fontFamily: fn, fontWeight: 700,
                      fontSize: 12, padding: '6px 0', cursor: 'pointer', textAlign: 'center',
                    }}>
                      View all {metrics.followUps.length} follow-ups →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Link a Member by Code */}
            <Card style={{ padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <Lbl text="Add Member via Code" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 12, lineHeight: 1.4 }}>
                Ask the member for their 6-character Trainer Link Code from their MSG Profile screen.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={linkCode}
                  onChange={e => {
                    setLinkCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setLinkMessage(null);
                  }}
                  placeholder="e.g. ABCDEF"
                  maxLength={6}
                  style={{
                    flex: 1, boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 15, fontFamily: fb,
                    fontWeight: 800, outline: 'none', letterSpacing: '0.12em',
                  }}
                />
                <button
                  disabled={linkLoading || linkCode.length !== 6}
                  onClick={handleLinkMember}
                  style={{
                    background: linkCode.length === 6 ? C.accent : C.s3,
                    color: linkCode.length === 6 ? '#111' : C.muted,
                    border: 'none', borderRadius: 12, padding: '0 18px',
                    fontFamily: fn, fontWeight: 800, fontSize: 13,
                    cursor: linkCode.length === 6 ? 'pointer' : 'default', transition: 'all 0.2s',
                  }}
                >
                  {linkLoading ? <Spinner size={14} /> : 'Link'}
                </button>
              </div>
              {linkMessage && (
                <div style={{
                  fontSize: 12, marginTop: 10, fontFamily: fn, fontWeight: 600,
                  color: linkMessage.type === 'success' ? C.green : C.red,
                }}>
                  {linkMessage.text}
                </div>
              )}
            </Card>
          </div>
        ) : tab === 'members' ? (
          /* ── 2. MEMBER ROSTER & SEARCH ── */
          <div style={{ padding: '16px 20px 40px' }}>
            {/* Search Input */}
            <div style={{ marginBottom: 14 }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search member name or email..."
                style={{
                  width: '100%', boxSizing: 'border-box', background: C.s1,
                  border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px',
                  color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
                }}
              />
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 14 }} className="msg-scroll">
              {[
                { id: 'all', label: `All (${metrics.total})` },
                { id: 'on_track', label: `On Track (${metrics.onTrack})` },
                { id: 'building', label: `Building (${metrics.building})` },
                { id: 'needs_attention', label: `Attention (${metrics.needsAttention})` },
                { id: 'inactive', label: `Inactive (${metrics.inactive})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setMemberFilter(f.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: memberFilter === f.id ? C.accent : C.s1,
                    color: memberFilter === f.id ? '#111' : C.sub,
                    border: `1px solid ${memberFilter === f.id ? C.accent : C.border}`,
                    fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Member List */}
            {filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontFamily: fb, fontSize: 14, fontWeight: 700, color: C.text }}>No members match</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing search filters or enter a code to link a member.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredMembers.map(m => {
                  const status = getStatusFromScore(m.engagementScore || 30);
                  const lastActive = m.lastActiveAt?.toDate?.() || (m.lastActiveAt ? new Date(m.lastActiveAt) : null);
                  const daysAgo = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1000)) : null;

                  return (
                    <Card
                      key={m.id}
                      onClick={() => setSelectedMember(m)}
                      style={{
                        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                        background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, cursor: 'pointer',
                      }}
                    >
                      <UserAvatar user={m} size={44} fontSize={16} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontFamily: fb, fontSize: 15, fontWeight: 800, color: C.text,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {m.name || 'Unnamed Member'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {m.email || 'No email'} · {daysAgo === null ? 'Never active' : daysAgo === 0 ? 'Active today' : `${daysAgo}d ago`}
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
                      }}>
                        <div style={{
                          background: status.badgeBg, color: status.color,
                          borderRadius: 8, padding: '3px 8px', fontSize: 12, fontFamily: fb, fontWeight: 800,
                        }}>
                          {m.engagementScore !== undefined ? m.engagementScore : '—'}
                        </div>
                        <div style={{ fontSize: 9, color: status.color, fontWeight: 700 }}>
                          {status.label}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex', borderTop: `1px solid ${C.border}`, background: C.s1,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)', flexShrink: 0,
      }}>
        <button
          onClick={() => setTab('dashboard')}
          style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 0', color: tab === 'dashboard' ? C.accent : C.muted,
            fontFamily: fb, fontWeight: 700, fontSize: 11,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}
        >
          <span style={{ fontSize: 20 }}>📊</span>
          Overview
        </button>

        <button
          onClick={() => setTab('members')}
          style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 0', color: tab === 'members' ? C.accent : C.muted,
            fontFamily: fb, fontWeight: 700, fontSize: 11,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}
        >
          <span style={{ fontSize: 20 }}>👥</span>
          Squad ({members.length})
        </button>
      </div>

      {/* Member Detail Sheet modal */}
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
