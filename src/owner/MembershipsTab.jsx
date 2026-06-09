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
    <div style={{ padding: '0 16px', paddingBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text }}>Membership Plans</div>
        <button onClick={() => setShowForm(true)} style={{
          background: C.accent, border: 'none', borderRadius: 10,
          padding: '7px 14px', color: '#111', fontFamily: fn, fontWeight: 800,
          fontSize: 11, cursor: 'pointer', boxShadow: C.accentShadow,
        }}>+ New Plan</button>
      </div>

      {loading ? <Spinner text="Loading plans…" /> : plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>No plans yet</div>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginBottom: 16 }}>Create membership plans that members can purchase.</div>
          <button onClick={() => setShowForm(true)} style={{
            background: C.accent, border: 'none', borderRadius: 12,
            padding: '11px 22px', color: '#111', fontFamily: fn, fontWeight: 800,
            fontSize: 13, cursor: 'pointer', boxShadow: C.accentShadow,
          }}>+ Create Plan</button>
        </div>
      ) : plans.map(plan => (
        <Card key={plan.id} style={{ marginBottom: 10, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text }}>{plan.name}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{plan.durationDays} day{plan.durationDays !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.accent }}>₹{plan.price?.toLocaleString?.()}</div>
          </div>
          {plan.description && (
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>{plan.description}</div>
          )}
          {plan.features?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {plan.features.filter(Boolean).map((f, i) => (
                <div key={i} style={{ fontSize: 11, color: C.sub, padding: '2px 0' }}>✓ {f}</div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditPlan(plan)} style={{ flex: 1, padding: '8px', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Edit</button>
            <button onClick={() => setDelConfirm(plan.id)} style={{ flex: 1, padding: '8px', background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 10, color: C.red, fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Delete</button>
          </div>
        </Card>
      ))}

      {delConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: C.s1, borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 320 }}>
            <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8 }}>Delete Plan?</div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>Existing members on this plan won't be affected, but new purchases won't be possible.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDelConfirm(null)} style={{ flex: 1, padding: 12, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, color: C.sub, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deletePlan(delConfirm)} style={{ flex: 1, padding: 12, background: C.red, border: 'none', borderRadius: 12, color: '#fff', fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Delete</button>
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
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onClose} style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: C.sub }}>← Back</button>
        <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text }}>{initial ? 'Edit Plan' : 'New Plan'}</div>
      </div>
      <div style={{ padding: '0 16px' }}>
        {[
          { l: 'Plan Name', k: 'name', p: 'e.g. Monthly Gold' },
          { l: 'Price (₹)', k: 'price', p: 'e.g. 1500', t: 'number' },
        ].map(({ l, k, p, t }) => (
          <div key={k} style={{ marginBottom: 14 }}>
            <Lbl text={l} style={{ marginBottom: 6 }} />
            <input value={form[k]} onChange={e => sp(k, e.target.value)} placeholder={p} type={t || 'text'}
              style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
        ))}

        {/* Duration */}
        <div style={{ marginBottom: 14 }}>
          <Lbl text="Duration" style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DURATION_PRESETS.map(d => (
              <button key={d.days} onClick={() => sp('durationDays', d.days)} style={{
                padding: '7px 14px', borderRadius: 10,
                background: form.durationDays === d.days ? C.accent + '20' : C.s2,
                border: `1px solid ${form.durationDays === d.days ? C.accent : C.border}`,
                color: form.durationDays === d.days ? C.accent : C.sub,
                fontSize: 12, fontFamily: fn, fontWeight: 700, cursor: 'pointer',
              }}>{d.label}</button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <Lbl text="Description (optional)" style={{ marginBottom: 6 }} />
          <textarea value={form.description} onChange={e => sp('description', e.target.value)}
            placeholder="What's included, special terms..." rows={2}
            style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', resize: 'vertical' }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>

        {/* Features */}
        <div style={{ marginBottom: 20 }}>
          <Lbl text="Features (optional)" style={{ marginBottom: 8 }} />
          {form.features.map((feat, i) => (
            <input key={i} value={feat} onChange={e => {
              const arr = [...form.features]; arr[i] = e.target.value; sp('features', arr);
            }} placeholder={`Feature ${i + 1}, e.g. Locker access`}
              style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 13px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', marginBottom: 7 }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          ))}
        </div>

        {error && <div style={{ background: C.red + '15', border: `1px solid ${C.red}33`, borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: C.red }}>⚠️ {error}</div>}

        <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: 14, background: C.accent, border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: C.accentShadow }}>
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
    'expiring': { label: 'EXPIRING SOON', color: C.orange },
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
    <div style={{ padding: '0 16px', paddingBottom: 20 }}>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 14, overflowX: 'auto' }}>
        {STATUS_FILTER.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
            background: filter === f ? C.accent + '20' : C.s2,
            border: `1px solid ${filter === f ? C.accent : C.border}`,
            color: filter === f ? C.accent : C.sub,
            fontSize: 11, fontFamily: fn, fontWeight: 700, cursor: 'pointer',
          }}>{f}</button>
        ))}
      </div>

      {loading ? <Spinner text="Loading members…" /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>No members in this category</div>
      ) : filtered.map(m => {
        const status = getMembershipStatus(m);
        const cfg = STATUS_CFG[status];
        const daysLeft = getDaysLeft(m);
        const planName = planMap[m.membershipPlanId]?.name || m.membershipPlanName || null;
        return (
          <Card key={m.id} style={{ marginBottom: 8, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: C.accent + '20', border: `1px solid ${C.accent}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.accent,
              }}>{(m.name || '?').charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || 'Member'}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  {planName ? `📋 ${planName}` : 'No plan assigned'}
                  {daysLeft !== null && (
                    <span style={{ color: cfg.color, marginLeft: 8, fontWeight: 700 }}>
                      {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 8, fontFamily: fb, fontWeight: 700,
                  background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}33`,
                }}>{cfg.label}</div>
                <button onClick={() => setAssignModal(m)} style={{
                  fontSize: 10, color: C.accent, background: C.accent + '10', border: `1px solid ${C.accent}33`,
                  borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: fn, fontWeight: 700,
                }}>Assign</button>
              </div>
            </div>
          </Card>
        );
      })}

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ background: C.s1, borderRadius: '24px 24px 0 0', width: '100%', padding: '20px 20px calc(env(safe-area-inset-bottom,0) + 20px)' }}>
        <div style={{ fontFamily: fn, fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>Assign Membership</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>For: {member.name}</div>

        {plans.length === 0 ? (
          <div style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: '16px 0' }}>No plans created yet. Create plans in the Plans tab first.</div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <Lbl text="Select Plan" style={{ marginBottom: 8 }} />
              {plans.map(p => (
                <button key={p.id} onClick={() => setSelectedPlan(p.id)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '10px 12px', background: selectedPlan === p.id ? C.accent + '15' : C.s2,
                  border: `1px solid ${selectedPlan === p.id ? C.accent : C.border}`,
                  borderRadius: 10, marginBottom: 7, cursor: 'pointer',
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{p.durationDays} days</div>
                  </div>
                  <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.accent }}>₹{p.price?.toLocaleString?.()}</div>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <Lbl text="Start Date" style={{ marginBottom: 6 }} />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 13px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}
              />
              {endDate && (
                <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>
                  Ends: {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: 12, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, color: C.sub, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAssign} disabled={saving || !selectedPlan} style={{ flex: 2, padding: 12, background: C.accent, border: 'none', borderRadius: 12, color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: selectedPlan ? 1 : 0.5 }}>
                {saving ? 'Assigning…' : 'Assign & Activate'}
              </button>
            </div>
          </>
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
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 14px' }}>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Memberships</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Plans & member subscription tracking</div>
      </div>

      {/* Quick stats */}
      {stats && (
        <div style={{ padding: '0 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {[
            { l: 'Live', v: stats.live, c: C.green },
            { l: 'Expiring', v: stats.expiring, c: C.orange },
            { l: 'Expired', v: stats.expired, c: C.red },
            { l: 'No Plan', v: stats.noPlan, c: C.muted },
          ].map(s => (
            <Card key={s.l} style={{ padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>{s.l}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Sub-tab switcher */}
      <div style={{ padding: '0 16px', marginBottom: 16, display: 'flex', gap: 8 }}>
        {[['members', '👥 Members'], ['plans', '📋 Plans']].map(([k, l]) => (
          <button key={k} onClick={() => setSubTab(k)} style={{
            flex: 1, padding: '10px', borderRadius: 12,
            background: subTab === k ? C.accent + '18' : C.s2,
            border: `1px solid ${subTab === k ? C.accent : C.border}`,
            color: subTab === k ? C.accent : C.sub,
            fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {subTab === 'members' ? <MembersView gymId={gymId} /> : <PlansView gymId={gymId} />}
    </div>
  );
}
