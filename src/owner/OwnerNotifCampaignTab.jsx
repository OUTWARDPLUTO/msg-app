/**
 * OwnerNotifCampaignTab.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Owner campaign notification UI:
 *  - Audience picker (all / inactive / selected / plan)
 *  - Send now or schedule later
 *  - Title + body + optional route
 *  - Preview + confirmation step
 *  - Per-gym frequency limit feedback (server enforced)
 *  - Audit log of past campaigns
 *
 * All sends go through the Cloud Function `sendCampaign` (HTTPS callable).
 * Never touches FCM or Admin SDK directly.
 */

import { useState, useEffect, useCallback } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import {
  BroadcastIcon,
  SleepIcon,
  CreditCardIcon,
  TargetIcon,
  ClockIcon,
  CheckCircleIcon,
  UploadCloudIcon,
  BellOffIcon,
  WarningIcon,
  CheckIcon,
} from '../components/visuals/index.js';
import { Spinner } from '../shared/primitives.jsx';
import { getFBFirestore } from '../shared/firebase.js';

// ─── Callable Function Invoker ─────────────────────────────────────────────────
// We call the Cloud Function via the Firebase compat SDK's functions().httpsCallable().
async function callFunction(name, data) {
  if (!window.firebase?.functions) {
    throw new Error('Firebase Functions SDK is not available.');
  }
  const fn = window.firebase.functions();
  const callable = fn.httpsCallable(name);
  const result = await callable(data);
  return result.data;
}

// ─── Generate a stable campaign ID ───────────────────────────────────────────
function newCampaignId() {
  return 'cmp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// ─── Audience types ────────────────────────────────────────────────────────────
const AUDIENCE_TYPES = [
  { key: 'all',      label: 'All active members',    sub: 'Send to everyone currently in your gym', icon: <BroadcastIcon size={16} color={C.accent} /> },
  { key: 'inactive', label: 'Inactive members',       sub: 'Members who have not visited recently', icon: <SleepIcon size={16} color={C.accent} /> },
  { key: 'plan',     label: 'Membership plan',        sub: 'Members on a specific membership plan', icon: <CreditCardIcon size={16} color={C.accent} /> },
  { key: 'selected', label: 'Selected members',       sub: 'Hand-pick specific members to notify', icon: <TargetIcon size={16} color={C.accent} /> },
];

// ─── Route options for tap destination ────────────────────────────────────────
const ROUTE_OPTIONS = [
  { key: 'home',       label: 'Home screen' },
  { key: 'workout',    label: 'Workout section' },
  { key: 'progress',   label: 'Progress tracker' },
  { key: 'diet',       label: 'Nutrition / Diet' },
  { key: 'membership', label: 'Membership info' },
];

export default function OwnerNotifCampaignTab({ gymId, ownerUid, onBack }) {
  // Step: 'compose' → 'preview' → 'sent'
  const [step,        setStep]        = useState('compose');
  const [audType,     setAudType]     = useState('all');
  const [inactiveDays, setInactiveDays] = useState(7);
  const [planId,      setPlanId]      = useState('');
  const [plans,       setPlans]       = useState([]);
  const [members,     setMembers]     = useState([]);
  const [selectedUids, setSelectedUids] = useState(new Set());
  const [title,       setTitle]       = useState('');
  const [body,        setBody]        = useState('');
  const [route,       setRoute]       = useState('home');
  const [scheduleAt,  setScheduleAt]  = useState('');
  const [sending,     setSending]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');
  const [campaigns,   setCampaigns]   = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Load membership plans and member list
  useEffect(() => {
    if (!gymId) return;
    getFBFirestore().then(db => {
      db.collection(`gyms/${gymId}/membership_plans`).get().then(snap => {
        setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(() => {});
      db.collection('members').where('gymId', '==', gymId).where('status', '==', 'active').get().then(snap => {
        setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => !m.uid?.startsWith('imported_')));
      }).catch(() => {});
      // Load campaign history
      setCampaignsLoading(true);
      db.collection(`gyms/${gymId}/campaigns`).orderBy('createdAt', 'desc').limit(20).get().then(snap => {
        setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCampaignsLoading(false);
      }).catch(() => setCampaignsLoading(false));
    });
  }, [gymId]);

  const toggleMember = uid => setSelectedUids(s => {
    const n = new Set(s);
    if (n.has(uid)) n.delete(uid); else n.add(uid);
    return n;
  });

  const buildAudience = () => {
    if (audType === 'all')      return { type: 'all' };
    if (audType === 'inactive') return { type: 'inactive', inactiveDays };
    if (audType === 'plan')     return { type: 'plan', planId };
    if (audType === 'selected') return { type: 'selected', uids: [...selectedUids] };
    return { type: 'all' };
  };

  const handleSend = async () => {
    setError('');
    setSending(true);
    try {
      const campaignId = newCampaignId();
      const res = await callFunction('sendCampaign', {
        gymId,
        audience: buildAudience(),
        title: title.trim(),
        body: body.trim(),
        route,
        scheduleAt: scheduleAt || null,
        campaignId,
      });
      setResult(res);
      setStep('sent');
      // Refresh campaign log
      getFBFirestore().then(db => {
        db.collection(`gyms/${gymId}/campaigns`).orderBy('createdAt', 'desc').limit(20).get().then(snap => {
          setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => {});
      });
    } catch (err) {
      const msg = err?.details?.message || err?.message || 'Send failed. Please try again.';
      if (msg.includes('limit')) setError('Daily campaign limit reached (max 3 per day). Try again tomorrow.');
      else if (msg.includes('already-exists')) setError('This campaign was already sent.');
      else setError(msg);
      setStep('compose');
    }
    setSending(false);
  };

  const resetForm = () => {
    setStep('compose');
    setTitle(''); setBody(''); setRoute('home');
    setAudType('all'); setSelectedUids(new Set());
    setScheduleAt(''); setResult(null); setError('');
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', background: C.s3, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 14,
    fontFamily: fn, outline: 'none', resize: 'none',
  };

  if (step === 'sent') return (
    <div style={{ padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{result?.status === 'scheduled' ? <ClockIcon size={44} color={C.accent} /> : <CheckCircleIcon size={44} color={C.green} />}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>
        {result?.status === 'scheduled' ? 'Campaign Scheduled!' : 'Campaign Sent!'}
      </div>
      {result?.status !== 'scheduled' && (
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><UploadCloudIcon size={14} color={C.accent} /><span>Delivered to <strong>{result?.successCount || 0}</strong> member{result?.successCount !== 1 ? 's' : ''}</span></div>
          {result?.skipCount > 0 && <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><BellOffIcon size={14} color={C.muted} /><span><strong>{result.skipCount}</strong> opted out or in quiet hours</span></div>}
        </div>
      )}
      {result?.status === 'scheduled' && (
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>Scheduled for {scheduleAt}</div>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {onBack && (
          <button onClick={onBack} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 22px', color: C.text, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Done
          </button>
        )}
        <button onClick={resetForm} style={{ background: C.accent, border: 'none', borderRadius: 12, padding: '13px 26px', color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          Create Another
        </button>
      </div>
    </div>
  );

  if (step === 'preview') return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setStep('compose')} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Preview Campaign</div>
          <div style={{ fontSize: 11, color: C.muted }}>Review before sending</div>
        </div>
      </div>

      <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Notification Preview</div>
        <div style={{ background: C.s3, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{body}</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: C.muted }}><strong>Audience:</strong> {AUDIENCE_TYPES.find(a => a.key === audType)?.label}</div>
          <div style={{ fontSize: 12, color: C.muted }}><strong>Opens:</strong> {ROUTE_OPTIONS.find(r => r.key === route)?.label}</div>
          {scheduleAt && <div style={{ fontSize: 12, color: C.muted }}><strong>Scheduled:</strong> {scheduleAt}</div>}
        </div>
      </div>

      <div style={{ background: C.orange + '18', border: `1px solid ${C.orange}44`, borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: C.orange, lineHeight: 1.5 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WarningIcon size={13} color={C.orange} /> Members who have opted out of promotional notifications will not receive this message. Max 3 campaigns per day.</span>
        </div>
      </div>

      {error && (
        <div style={{ background: C.red + '18', border: `1px solid ${C.red}44`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.red }}>{error}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setStep('compose')} style={{ flex: 1, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px', color: C.text, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          ← Edit
        </button>
        <button onClick={handleSend} disabled={sending} style={{ flex: 2, background: sending ? C.s3 : C.accent, border: 'none', borderRadius: 12, padding: '13px', color: sending ? C.muted : '#111', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: sending ? 'default' : 'pointer', transition: 'all 0.2s' }}>
          {sending ? <Spinner size={16} /> : (scheduleAt ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ClockIcon size={14} color="#000" />Schedule Campaign</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><UploadCloudIcon size={14} color="#000" />Send Now</span>)}
        </button>
      </div>
    </div>
  );

  // ── Compose step ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 20px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text, padding: 0, cursor: 'pointer', display: 'flex' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        )}
        <div>
          <div style={{ fontSize: 20, fontFamily: fb, fontWeight: 800, color: C.text }}>Push Campaigns</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Send push notifications to your gym members</div>
        </div>
      </div>

      {error && (
        <div style={{ background: C.red + '18', border: `1px solid ${C.red}44`, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.red }}>{error}</div>
        </div>
      )}

      {/* Audience */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: fb, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Audience</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {AUDIENCE_TYPES.map(a => (
            <button key={a.key} onClick={() => setAudType(a.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: audType === a.key ? C.accent + '18' : C.s2, border: `1.5px solid ${audType === a.key ? C.accent : C.border}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${audType === a.key ? C.accent : C.border}`, background: audType === a.key ? C.accent : 'transparent', flexShrink: 0, transition: 'all 0.2s' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: audType === a.key ? C.accent : C.text }}>{a.label}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{a.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Inactive days sub-picker */}
        {audType === 'inactive' && (
          <div style={{ marginTop: 10, background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>Inactive for at least:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[3, 5, 7, 14, 30].map(d => (
                <button key={d} onClick={() => setInactiveDays(d)} style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${inactiveDays === d ? C.accent : C.border}`, background: inactiveDays === d ? C.accent + '22' : C.s2, color: inactiveDays === d ? C.accent : C.sub, fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Plan picker */}
        {audType === 'plan' && (
          <div style={{ marginTop: 10 }}>
            <select value={planId} onChange={e => setPlanId(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}>
              <option value="">Select a membership plan…</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}

        {/* Member picker */}
        {audType === 'selected' && (
          <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 12 }}>
            {members.map(m => (
              <div key={m.uid} onClick={() => toggleMember(m.uid)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: selectedUids.has(m.uid) ? C.accent + '12' : 'transparent' }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selectedUids.has(m.uid) ? C.accent : C.border}`, background: selectedUids.has(m.uid) ? C.accent : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#000', fontWeight: 700 }}>
                  {selectedUids.has(m.uid) ? <CheckIcon size={12} color="#000" strokeWidth={3} /> : null}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{m.email}</div>
                </div>
              </div>
            ))}
            {members.length === 0 && <div style={{ padding: 16, color: C.muted, fontSize: 13, textAlign: 'center' }}>No members found</div>}
          </div>
        )}
      </div>

      {/* Message */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: fb, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Message</div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Notification title (e.g. New Batch Starting!)"
          maxLength={60}
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Notification body — keep it short and actionable."
          maxLength={200}
          rows={3}
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: 'right' }}>{body.length}/200</div>
      </div>

      {/* Route */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: fb, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Opens screen</div>
        <select value={route} onChange={e => setRoute(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}>
          {ROUTE_OPTIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: fb, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Schedule (optional)</div>
        <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)} style={{ ...inputStyle }} />
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Leave blank to send immediately.</div>
      </div>

      <button
        onClick={() => {
          setError('');
          if (!title.trim()) { setError('Please enter a notification title.'); return; }
          if (!body.trim())  { setError('Please enter a notification body.'); return; }
          if (audType === 'plan' && !planId) { setError('Please select a membership plan.'); return; }
          if (audType === 'selected' && selectedUids.size === 0) { setError('Please select at least one member.'); return; }
          setStep('preview');
        }}
        style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 14, padding: '14px', color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: C.accentShadow }}
      >
        Preview Campaign →
      </button>

      {/* Campaign history */}
      {!campaignsLoading && campaigns.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, fontFamily: fb, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Recent Campaigns</div>
          {campaigns.map(c => (
            <div key={c.id} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.body?.slice(0, 60)}…</div>
                </div>
                <div style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: c.status === 'sent' ? C.green + '22' : c.status === 'scheduled' ? C.blue + '22' : C.s3, color: c.status === 'sent' ? C.green : c.status === 'scheduled' ? C.blue : C.muted, fontWeight: 700, fontFamily: fb, flexShrink: 0, marginLeft: 8 }}>
                  {c.status?.toUpperCase()}
                </div>
              </div>
              {c.successCount !== undefined && (
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><UploadCloudIcon size={11} color={C.muted} />{c.successCount} delivered</span> · {c.skipCount || 0} skipped · Audience: {c.audience?.type}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
