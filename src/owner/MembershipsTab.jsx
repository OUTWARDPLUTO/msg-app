import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl, Spinner } from '../shared/primitives.jsx';
import { getFBFirestore, serverTimestamp } from '../shared/firebase.js';

// ─── Membership Plans Sub-Tab ─────────────────────────────────────────────────
function PlansView({ gymId }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);

  useEffect(() => { if (gymId) loadPlans(); }, [gymId]);

  async function loadPlans() {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const snap = await db.collection(`gyms/${gymId}/membership_plans`).orderBy('createdAt', 'desc').get();
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn(e); }
    setLoading(false);
  }

  async function deletePlan(id) {
    try {
      const db = await getFBFirestore();
      await db.doc(`gyms/${gymId}/membership_plans/${id}`).delete();
      setPlans(p => p.filter(x => x.id !== id));
    } catch (e) { console.warn(e); }
    setDelConfirm(null);
  }

  if (showForm || editPlan) {
    return (
      <PlanForm
        gymId={gymId}
        initial={editPlan}
        onSave={(plan) => {
          setPlans(prev => {
            const i = prev.findIndex(p => p.id === plan.id);
            if (i >= 0) { const arr = [...prev]; arr[i] = plan; return arr; }
            return [plan, ...prev];
          });
          setShowForm(false); setEditPlan(null);
        }}
        onClose={() => { setShowForm(false); setEditPlan(null); }}
      />
    );
  }

  return (
    <div style={{ padding: '0 20px', paddingBottom: 40 }} className="msg-anim-fadein">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontFamily: fb, fontSize: 16, fontWeight: 700, color: C.text }}>Membership Plans</div>
        <button onClick={() => setShowForm(true)} style={{
          background: C.accent, border: 'none', borderRadius: 12,
          padding: '10px 16px', color: '#111', fontFamily: fb, fontWeight: 700,
          fontSize: 13, cursor: 'pointer', boxShadow: C.accentShadow, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Plan
        </button>
      </div>

      {loading ? <div style={{ padding: '40px 0' }}><Spinner text="Loading plans…" /></div> : plans.length === 0 ? (
        <div style={{ background: C.s1, border: `1px dashed ${C.border}`, borderRadius: 20, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.8 }}>📋</div>
          <div style={{ fontFamily: fb, fontSize: 16, color: C.text, marginBottom: 8 }}>No Plans Created</div>
          <div style={{ fontSize: 13, color: C.sub, fontFamily: fn, marginBottom: 24, maxWidth: 240, margin: '0 auto 24px', lineHeight: 1.5 }}>Create membership plans for your members to subscribe to.</div>
          <button onClick={() => setShowForm(true)} style={{
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: '12px 24px', color: C.text, fontFamily: fb, fontWeight: 700,
            fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease'
          }}>Create First Plan</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans.map(plan => (
            <div key={plan.id} style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 700, color: C.text }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: C.sub, fontFamily: fn, marginTop: 4 }}>{plan.durationDays} day{plan.durationDays !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontFamily: fb, fontSize: 24, fontWeight: 800, color: C.accent }}>₹{plan.price?.toLocaleString?.()}</div>
              </div>
              {plan.description && (
                <div style={{ fontSize: 13, color: C.text, fontFamily: fn, marginBottom: 16, lineHeight: 1.5, opacity: 0.8 }}>{plan.description}</div>
              )}
              {plan.features?.length > 0 && (
                <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.filter(Boolean).map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span style={{ fontSize: 13, color: C.sub, fontFamily: fn }}>{f}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setEditPlan(plan)} style={{ flex: 1, padding: '12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontFamily: fb, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease' }}>Edit Plan</button>
                <button onClick={() => setDelConfirm(plan.id)} style={{ flex: 1, padding: '12px', background: C.red + '10', border: `1px solid ${C.red}33`, borderRadius: 12, color: C.red, fontFamily: fb, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {delConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'msg-fadein 0.2s ease-out' }}>
          <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 24, padding: '24px', width: '100%', maxWidth: 320, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
            <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>Delete Plan?</div>
            <div style={{ fontSize: 14, color: C.sub, fontFamily: fn, marginBottom: 24, lineHeight: 1.5 }}>Existing members on this plan will not be affected, but new purchases will be disabled.</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDelConfirm(null)} style={{ flex: 1, padding: '14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deletePlan(delConfirm)} style={{ flex: 1, padding: '14px', background: C.red, border: 'none', borderRadius: 14, color: '#fff', fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(248, 113, 113, 0.3)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plan Form ────────────────────────────────────────────────────────────────
const DURATION_PRESETS = [
  { label: '1 Month', days: 30 }, { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 }, { label: '1 Year', days: 365 },
];

function PlanForm({ gymId, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price?.toString() || '',
    durationDays: initial?.durationDays || 30,
    features: initial?.features || ['', '', ''],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const sp = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Plan name is required'); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { setError('Valid price required'); return; }
    setSaving(true);
    try {
      const db = await getFBFirestore();
      const isEdit = !!initial?.id;
      const ref = isEdit
        ? db.doc(`gyms/${gymId}/membership_plans/${initial.id}`)
        : db.collection(`gyms/${gymId}/membership_plans`).doc();
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        durationDays: form.durationDays,
        features: form.features.filter(f => f.trim()),
        isActive: true,
        updatedAt: serverTimestamp(),
      };
      if (!isEdit) data.createdAt = serverTimestamp();
      await ref.set(data, { merge: true });
      onSave({ id: ref.id, ...data });
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ paddingBottom: 40 }} className="msg-anim-fadein">
      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={onClose} style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text, transition: 'all 0.2s ease' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 700, color: C.text }}>{initial ? 'Edit Plan' : 'New Plan'}</div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div style={{ background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 20px', marginBottom: 24 }}>
          {[
            { l: 'Plan Name', k: 'name', p: 'e.g. Monthly Gold' },
            { l: 'Price (₹)', k: 'price', p: 'e.g. 1500', t: 'number' },
          ].map(({ l, k, p, t }) => (
            <div key={k} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{l}</div>
              <input value={form[k]} onChange={e => sp(k, e.target.value)} placeholder={p} type={t || 'text'}
                style={{ width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border-color 0.2s ease' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
          ))}

          {/* Duration */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Duration</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DURATION_PRESETS.map(d => (
                <button key={d.days} onClick={() => sp('durationDays', d.days)} style={{
                  padding: '10px 16px', borderRadius: 12,
                  background: form.durationDays === d.days ? C.accent + '15' : C.bg,
                  border: `1px solid ${form.durationDays === d.days ? C.accent : C.border}`,
                  color: form.durationDays === d.days ? C.accent : C.text,
                  fontSize: 13, fontFamily: fb, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
                }}>{d.label}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Description <span style={{ textTransform: 'none', color: C.muted, fontWeight: 500 }}>(Optional)</span></div>
            <textarea value={form.description} onChange={e => sp('description', e.target.value)}
              placeholder="What's included, special terms..." rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', resize: 'vertical', transition: 'border-color 0.2s ease' }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>

          {/* Features */}
          <div>
            <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Features <span style={{ textTransform: 'none', color: C.muted, fontWeight: 500 }}>(Optional)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.features.map((feat, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 16, top: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <input value={feat} onChange={e => {
                    const arr = [...form.features]; arr[i] = e.target.value; sp('features', arr);
                  }} placeholder={`Feature ${i + 1}, e.g. Locker access`}
                    style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px 14px 44px', color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border-color 0.2s ease' }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <div style={{ background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 12, padding: '16px', marginBottom: 20, fontSize: 14, color: C.red, fontFamily: fn, display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>}

        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '16px', background: C.text, border: 'none', borderRadius: 16, color: C.bg, fontFamily: fb, fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s ease' }}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Plan'}
        </button>
      </div>
    </div>
  );
}

// ─── Members Membership View ──────────────────────────────────────────────────
const STATUS_FILTER = ['All', 'Live', 'Expiring Soon', 'Expired', 'No Plan'];

function MembersView({ gymId }) {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [assignModal, setAssignModal] = useState(null); // member obj

  useEffect(() => { if (gymId) load(); }, [gymId]);

  async function load() {
    setLoading(true);
    try {
      const db = await getFBFirestore();
      const [memberSnap, planSnap] = await Promise.all([
        db.collection('members').where('gymId', '==', gymId).orderBy('joinedAt', 'desc').get(),
        db.collection(`gyms/${gymId}/membership_plans`).get(),
      ]);
      setMembers(memberSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPlans(planSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn(e); }
    setLoading(false);
  }

  function getMembershipStatus(m) {
    if (!m.membershipEndDate) return 'no-plan';
    const end = m.membershipEndDate?.toDate ? m.membershipEndDate.toDate() : new Date(m.membershipEndDate);
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / 86400000);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 7) return 'expiring';
    return 'live';
  }

  function getDaysLeft(m) {
    if (!m.membershipEndDate) return null;
    const end = m.membershipEndDate?.toDate ? m.membershipEndDate.toDate() : new Date(m.membershipEndDate);
    return Math.ceil((end - new Date()) / 86400000);
  }

  const STATUS_CFG = {
    'live': { label: 'LIVE', color: C.green },
    'expiring': { label: 'EXPIRING', color: C.orange },
    'expired': { label: 'EXPIRED', color: C.red },
    'no-plan': { label: 'NO PLAN', color: C.muted },
  };

  const filtered = members.filter(m => {
    const s = getMembershipStatus(m);
    if (filter === 'All') return true;
    if (filter === 'Live') return s === 'live';
    if (filter === 'Expiring Soon') return s === 'expiring';
    if (filter === 'Expired') return s === 'expired';
    if (filter === 'No Plan') return s === 'no-plan';
    return true;
  });

  const planMap = Object.fromEntries(plans.map(p => [p.id, p]));

  return (
    <div style={{ padding: '0 20px', paddingBottom: 40 }} className="msg-anim-fadein">
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, margin: '0 -4px' }} className="msg-scroll">
        {STATUS_FILTER.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
            background: filter === f ? C.accent : C.s1,
            border: `1px solid ${filter === f ? C.accent : C.border}`,
            color: filter === f ? '#111' : C.sub,
            fontSize: 13, fontFamily: fb, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', margin: '0 4px'
          }}>{f}</button>
        ))}
      </div>

      {loading ? <div style={{ padding: '40px 0' }}><Spinner text="Loading members…" /></div> : filtered.length === 0 ? (
        <div style={{ background: C.s1, border: `1px dashed ${C.border}`, borderRadius: 20, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>👥</div>
          <div style={{ fontFamily: fb, fontSize: 16, color: C.text, marginBottom: 4 }}>No Members Found</div>
          <div style={{ color: C.sub, fontSize: 13, fontFamily: fn }}>No members match the selected filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(m => {
            const status = getMembershipStatus(m);
            const cfg = STATUS_CFG[status];
            const daysLeft = getDaysLeft(m);
            const planName = planMap[m.membershipPlanId]?.name || m.membershipPlanName || null;
            return (
              <div key={m.id} style={{ padding: '16px', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: C.bg, border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: fb, fontSize: 18, color: C.text,
                  }}>{(m.name || '?').charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || 'Member'}</div>
                      <div style={{
                        padding: '4px 8px', borderRadius: 8, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: cfg.color + '15', color: cfg.color, border: `1px solid ${cfg.color}33`,
                      }}>{cfg.label}</div>
                    </div>
                    <div style={{ fontSize: 13, color: C.sub, fontFamily: fn }}>
                      {planName ? `📋 ${planName}` : 'No active plan'}
                      {daysLeft !== null && (
                        <span style={{ color: cfg.color, marginLeft: 8, fontWeight: 600, fontFamily: fb }}>
                          {daysLeft < 0 ? `• Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? '• Expires today' : `• ${daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ height: 1, background: C.border, margin: '0 -16px 12px' }}></div>
                <button onClick={() => setAssignModal(m)} style={{
                  width: '100%', fontSize: 14, color: C.text, background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: '12px', cursor: 'pointer', fontFamily: fb, fontWeight: 600, transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                  Assign Plan
                </button>
              </div>
            );
          })}
        </div>
      )}

      {assignModal && (
        <AssignPlanModal
          gymId={gymId}
          member={assignModal}
          plans={plans}
          onSave={(updatedMember) => {
            setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
            setAssignModal(null);
          }}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}

// ─── Assign Plan Modal ────────────────────────────────────────────────────────
function AssignPlanModal({ gymId, member, plans, onSave, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState(member.membershipPlanId || '');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const plan = plans.find(p => p.id === selectedPlan);
  const endDate = plan ? new Date(new Date(startDate).getTime() + plan.durationDays * 86400000) : null;

  const handleAssign = async () => {
    if (!selectedPlan || !plan) return;
    setSaving(true);
    try {
      const db = await getFBFirestore();
      const start = new Date(startDate);
      const end = new Date(start.getTime() + plan.durationDays * 86400000);
      const updates = {
        membershipPlanId: plan.id,
        membershipPlanName: plan.name,
        membershipStartDate: start,
        membershipEndDate: end,
        membershipStatus: 'active',
        updatedAt: serverTimestamp(),
      };
      await db.doc(`members/${gymId}_${member.uid}`).update(updates);
      onSave({ ...member, ...updates, membershipEndDate: end });
    } catch (e) { console.warn(e); }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', animation: 'msg-fadein 0.2s ease-out' }}>
      <div style={{ background: C.s1, borderRadius: '32px 32px 0 0', width: '100%', padding: '32px 20px calc(env(safe-area-inset-bottom,0) + 24px)', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: fb, fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 4 }}>Assign Plan</div>
            <div style={{ fontSize: 14, color: C.sub, fontFamily: fn }}>For: <strong style={{ color: C.text, fontFamily: fb }}>{member.name}</strong></div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.text }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {plans.length === 0 ? (
          <div style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: C.sub, fontFamily: fn, lineHeight: 1.5 }}>No plans created yet.<br/>Create plans in the Plans tab first.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Select Plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }} className="msg-scroll">
                {plans.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlan(p.id)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', padding: '16px', background: selectedPlan === p.id ? C.accent + '15' : C.bg,
                    border: `1px solid ${selectedPlan === p.id ? C.accent : C.border}`,
                    borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left'
                  }}>
                    <div>
                      <div style={{ fontSize: 16, fontFamily: fb, fontWeight: 600, color: selectedPlan === p.id ? C.accent : C.text, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: C.sub, fontFamily: fn }}>{p.durationDays} days</div>
                    </div>
                    <div style={{ fontFamily: fb, fontSize: 18, fontWeight: 800, color: selectedPlan === p.id ? C.accent : C.text }}>₹{p.price?.toLocaleString?.()}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: C.sub, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Start Date</div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px', color: C.text, fontSize: 15, fontFamily: fb, outline: 'none', transition: 'border-color 0.2s ease' }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              {endDate && (
                <div style={{ fontSize: 13, color: C.sub, marginTop: 8, fontFamily: fn, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Ends: <strong style={{ color: C.text, fontFamily: fb }}>{endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
              )}
            </div>

            <button onClick={handleAssign} disabled={saving || !selectedPlan} style={{ width: '100%', padding: '16px', background: C.text, border: 'none', borderRadius: 16, color: C.bg, fontFamily: fb, fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all 0.2s ease', opacity: (!selectedPlan || saving) ? 0.5 : 1, marginTop: 12 }}>
              {saving ? 'Assigning…' : 'Assign & Activate'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Memberships Tab ─────────────────────────────────────────────────────
export default function MembershipsTab({ gymId }) {
  const [subTab, setSubTab] = useState('members');

  // Quick stats
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!gymId) return;
    (async () => {
      try {
        const db = await getFBFirestore();
        const snap = await db.collection('members').where('gymId', '==', gymId).get();
        const members = snap.docs.map(d => d.data());
        const now = new Date();
        let live = 0, expiring = 0, expired = 0, noPlan = 0;
        members.forEach(m => {
          if (!m.membershipEndDate) { noPlan++; return; }
          const end = m.membershipEndDate?.toDate ? m.membershipEndDate.toDate() : new Date(m.membershipEndDate);
          const daysLeft = Math.ceil((end - now) / 86400000);
          if (daysLeft < 0) expired++;
          else if (daysLeft <= 7) expiring++;
          else live++;
        });
        setStats({ live, expiring, expired, noPlan });
      } catch (e) { console.warn(e); }
    })();
  }, [gymId]);

  return (
    <div style={{ paddingBottom: 100, background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 20px) 20px 20px' }}>
        <div style={{ fontFamily: fb, fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Memberships</div>
        <div style={{ fontSize: 13, color: C.sub, fontFamily: fn, marginTop: 4 }}>Plans & subscriptions</div>
      </div>

      {/* Quick stats */}
      {stats && (
        <div style={{ padding: '0 20px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {[
            { l: 'Live', v: stats.live, c: C.green },
            { l: 'Expiring', v: stats.expiring, c: C.orange },
            { l: 'Expired', v: stats.expired, c: C.red },
            { l: 'No Plan', v: stats.noPlan, c: C.sub },
          ].map(s => (
            <div key={s.l} style={{ padding: '16px 8px', textAlign: 'center', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16 }}>
              <div style={{ fontFamily: fb, fontSize: 24, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 8 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-tab switcher */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', background: C.s1, border: `1px solid ${C.border}`, borderRadius: 16, padding: 4 }}>
          {[['members', '👥 Members'], ['plans', '📋 Plans']].map(([k, l]) => (
            <button key={k} onClick={() => setSubTab(k)} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              background: subTab === k ? C.bg : 'transparent',
              border: 'none',
              boxShadow: subTab === k ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              color: subTab === k ? C.text : C.sub,
              fontFamily: fb, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s ease',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {subTab === 'members' ? <MembersView gymId={gymId} /> : <PlansView gymId={gymId} />}
    </div>
  );
}
