import { useState, useEffect } from 'react';
import { C, fn, fb, MC } from '../shared/theme.js';
import { AnatomicalFigure } from '../AnatomicalFigure';
import { Card, Tag, Lbl } from './primitives.jsx';
import { EX } from './constants.js';
// ─── Attendance Heat Map (30-Day Grid) ─────────────────────────────────────────
// Renders a static, non-scrollable 10 columns × 3 rows grid representing the last 30 days
export function AttendanceHeatMap({ uid, gymId }) {
  const [checkInDates, setCheckInDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  useEffect(() => {
    if (!uid || !gymId || gymId === 'demo-gym') { setLoading(false); return; }
    (async () => {
      try {
        const db = await import('../shared/firebase.js').then(m => m.getFBFirestore());
        const thirtyDaysAgo = new Date(Date.now() - 31 * 86400000).toISOString().split('T')[0];
        const snap = await db.collection(`attendance/${gymId}/logs`)
          .where('uid', '==', uid)
          .where('date', '>=', thirtyDaysAgo)
          .get();
        const dates = new Set(snap.docs.map(d => d.data().date));
        setCheckInDates(dates);
        setTotalCheckIns(dates.size);
        // Calculate current streak
        let s = 0;
        let d = new Date();
        while (true) {
          const key = d.toISOString().split('T')[0];
          if (dates.has(key)) { s++; d = new Date(d.getTime() - 86400000); }
          else break;
        }
        setStreak(s);
      } catch (e) { console.warn('HeatMap load:', e.message); }
      setLoading(false);
    })();
  }, [uid, gymId]);

  const cellColor = (day) => {
    if (!day.hasCheckIn) return C.s4;
    if (day.isToday) return C.accent;
    return C.accent + 'BB';
  };

  if (loading) return null;

  // Build the list of last 30 days
  const daysList = [];
  const now = new Date();
  now.setHours(0,0,0,0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    daysList.push({
      date: d,
      key: key,
      hasCheckIn: checkInDates.has(key),
      isToday: key === now.toISOString().split('T')[0]
    });
  }

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <Card style={{ padding: '14px 14px 12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <Lbl text="Attendance (Last 30 Days)" style={{ marginBottom: 2 }} />
            <div style={{ fontSize: 10, color: C.muted }}>{totalCheckIns} check-in{totalCheckIns !== 1 ? 's' : ''} recorded</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 8, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Streak</div>
          </div>
        </div>

        {/* 10 columns × 3 rows static grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, marginBottom: 12 }}>
          {daysList.map((day, i) => (
            <div key={i} title={`${day.key}${day.hasCheckIn ? ' (Checked In)' : ' (Absent)'}`} style={{
              aspectRatio: '1', borderRadius: 6,
              background: cellColor(day),
              boxShadow: day.isToday && day.hasCheckIn ? `0 0 6px ${C.accent}88` : 'none',
              border: day.isToday ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'default', transition: 'background 0.2s', position: 'relative'
            }}>
              <span style={{
                fontSize: 8, fontFamily: fb, fontWeight: 800,
                color: day.hasCheckIn ? '#111' : C.muted
              }}>
                {day.date.getDate()}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: C.s4 }} />
            <span style={{ fontSize: 8, color: C.muted, fontFamily: fb }}>Absent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: C.accent }} />
            <span style={{ fontSize: 8, color: C.muted, fontFamily: fb }}>Checked In</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Store Section (Member View) ──────────────────────────────────────────────
const CAT_ICONS_M = { Protein: '🥛', Creatine: '⚡', Vitamins: '💊', 'Pre-Workout': '🔥', BCAA: '💉', 'Fat Burner': '🌡️', Accessories: '🎽', Other: '📦' };
const PAYMENT_METHODS = [
  { key: 'qr', label: 'Scan & Pay', icon: '📲', sub: 'Scan QR at the counter' },
  { key: 'razorpay', label: 'Online Pay', icon: '💳', sub: 'Pay via Razorpay' },
  { key: 'bank', label: 'Bank Transfer', icon: '🏦', sub: 'Direct bank transfer' },
];

export default function StoreSection({ gymId, setBackHandler }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('All');
  const [selected, setSelected] = useState(null);
  const [gymInfo, setGymInfo] = useState(null);

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

  useEffect(() => {
    if (!gymId) { setLoading(false); return; }
    (async () => {
      try {
        const db = await import('../shared/firebase.js').then(m => m.getFBFirestore());
        const [prodSnap, gymSnap] = await Promise.all([
          db.collection(`gyms/${gymId}/store_products`).orderBy('createdAt', 'desc').get(),
          db.doc(`gyms/${gymId}`).get(),
        ]);
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        if (gymSnap.exists) setGymInfo(gymSnap.data());
      } catch (e) { console.warn('Store load:', e.message); }
      setLoading(false);
    })();
  }, [gymId]);

  const cats = ['All', ...([...new Set(products.map(p => p.category))].filter(Boolean))];
  const filtered = filterCat === 'All' ? products : products.filter(p => p.category === filterCat);

  if (loading) return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 24, color: C.muted }}>⏳</div>
    </div>
  );

  if (selected) {
    return <ProductDetailSheet product={selected} gymInfo={gymInfo} onClose={() => setSelected(null)} />;
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <Hd t="Gym Store" s={`${gymInfo?.name || 'Your Gym'} · Supplements & More`} />

      {/* Category filter */}
      {cats.length > 1 && (
        <div style={{ padding: '0 16px', marginBottom: 14, display: 'flex', gap: 7, overflowX: 'auto' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={{
              padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              background: filterCat === c ? C.accent + '20' : C.s2,
              border: `1px solid ${filterCat === c ? C.accent : C.border}`,
              color: filterCat === c ? C.accent : C.sub,
              fontSize: 11, fontFamily: fn, fontWeight: 700, cursor: 'pointer',
            }}>
              {c !== 'All' ? (CAT_ICONS_M[c] || '') + ' ' : ''}{c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
            {products.length === 0 ? 'No products yet' : 'No products in this category'}
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
            {products.length === 0
              ? 'Your gym owner hasn\'t listed any products yet. Check back soon!'
              : 'Try a different category.'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} style={{
              background: !C.isLight ? 'rgba(26, 26, 26, 0.40)' : 'rgba(255, 255, 255, 0.45)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${!C.isLight ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              borderRadius: 16,
              overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0,
              transition: 'border-color 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + '55'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {/* Image */}
              <div style={{ width: '100%', aspectRatio: '1', background: C.s3, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderBottom: `1px solid ${C.border}` }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.innerHTML = `<span style="font-size:36px;opacity:0.4">${CAT_ICONS_M[p.category] || '📦'}</span>`; }} />
                  : <span style={{ fontSize: 36, opacity: 0.4 }}>{CAT_ICONS_M[p.category] || '📦'}</span>
                }
              </div>
              {/* Info */}
              <div style={{ padding: '10px 10px 12px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.accent, marginBottom: 5 }}>
                  ₹{p.price?.toLocaleString?.()}
                </div>
                <div style={{
                  display: 'inline-flex', padding: '2px 7px', borderRadius: 5, fontSize: 8,
                  fontFamily: fb, fontWeight: 700, whiteSpace: 'nowrap',
                  background: p.inStock ? C.green + '18' : C.red + '18',
                  color: p.inStock ? C.green : C.red,
                  border: `1px solid ${p.inStock ? C.green + '33' : C.red + '33'}`,
                }}>
                  {p.inStock ? '● IN STOCK' : '○ OUT OF STOCK'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Product Detail Sheet ─────────────────────────────────────────────────────
function ProductDetailSheet({ product, gymInfo, onClose }) {
  const [payMethod, setPayMethod] = useState(null);

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Back */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onClose} style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: C.sub }}>← Back</button>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
      </div>

      {/* Image */}
      <div style={{ margin: '14px 16px 0', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', background: C.s3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 56, opacity: 0.3 }}>{CAT_ICONS_M[product.category] || '📦'}</span>
        }
      </div>

      {/* Product Info */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.2, marginBottom: 4 }}>{product.name}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{product.category}</div>
          </div>
          <div style={{ fontFamily: fn, fontSize: 26, fontWeight: 800, color: C.accent }}>₹{product.price?.toLocaleString?.()}</div>
        </div>

        <div style={{
          display: 'inline-flex', padding: '3px 10px', borderRadius: 7, fontSize: 9,
          fontFamily: fb, fontWeight: 700, marginBottom: 12,
          background: product.inStock ? C.green + '18' : C.red + '18',
          color: product.inStock ? C.green : C.red,
          border: `1px solid ${product.inStock ? C.green + '33' : C.red + '33'}`,
        }}>
          {product.inStock ? '● IN STOCK' : '○ OUT OF STOCK'}
        </div>

        {product.description && (
          <Card style={{ padding: '12px 14px', marginBottom: 16 }}>
            <Lbl text="Description" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{product.description}</div>
          </Card>
        )}

        {/* Payment Options */}
        {product.inStock && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: fn, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>How to Purchase</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
              Visit the gym counter and pay via any method below. The desk team will hand over your order.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.key} onClick={() => setPayMethod(payMethod === pm.key ? null : pm.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: payMethod === pm.key ? C.accent + '15' : C.s2,
                  border: `1px solid ${payMethod === pm.key ? C.accent : C.border}`,
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s, background 0.2s',
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{pm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pm.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{pm.sub}</div>
                  </div>
                  {payMethod === pm.key && <span style={{ color: C.accent, fontSize: 16 }}>✓</span>}
                </button>
              ))}
            </div>

            {payMethod === 'qr' && (
              <div style={{ marginTop: 12, padding: '14px', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Ask the gym desk to scan the QR code for payment.</div>
                <div style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>📍 Visit the gym counter to pay</div>
              </div>
            )}
            {payMethod === 'razorpay' && (
              <div style={{ marginTop: 12, padding: '14px', background: C.blue + '0D', border: `1px solid ${C.blue}33`, borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>Online payment via Razorpay. You'll be directed to a secure payment page.</div>
                <button style={{ width: '100%', padding: '11px', background: C.blue, border: 'none', borderRadius: 10, color: '#fff', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                  onClick={() => { alert('Contact gym for payment link. Integration coming soon!'); }}>
                  💳 Pay ₹{product.price?.toLocaleString?.()} Now
                </button>
              </div>
            )}
            {payMethod === 'bank' && (
              <div style={{ marginTop: 12, padding: '14px', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Transfer the amount and show confirmation to the gym desk.</div>
                <div style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>🏦 Ask gym staff for bank account details</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Membership Status Card ───────────────────────────────────────────────────
export function MembershipCard({ uid, gymId, setBackHandler }) {
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    if (showPlans && setBackHandler) {
      setBackHandler(() => () => {
        setShowPlans(false);
        return true;
      });
    } else if (setBackHandler) {
      setBackHandler(null);
    }
    return () => { if (setBackHandler) setBackHandler(null); };
  }, [showPlans, setBackHandler]);

  useEffect(() => {
    if (!uid || !gymId || gymId === 'demo-gym') { setLoading(false); return; }
    (async () => {
      try {
        const db = await import('../shared/firebase.js').then(m => m.getFBFirestore());
        const [memberSnap, planSnap] = await Promise.all([
          db.doc(`members/${gymId}_${uid}`).get(),
          db.collection(`gyms/${gymId}/membership_plans`).where('isActive', '==', true).get(),
        ]);
        if (memberSnap.exists) setMembership(memberSnap.data());
        setPlans(planSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.warn('Membership load:', e.message); }
      setLoading(false);
    })();
  }, [uid, gymId]);

  if (loading || !membership) return null;

  const { membershipEndDate, membershipPlanName } = membership;
  if (!membershipEndDate) {
    return (
      <div style={{ padding: '10px 16px 0' }}>
        <button onClick={() => setShowPlans(true)} style={{
          width: '100%', padding: '12px 16px', background: C.s2,
          border: `1.5px dashed ${C.border}`, borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
        }}>
          <span style={{ fontSize: 22 }}>💳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>No active membership</div>
            <div style={{ fontSize: 11, color: C.accent, marginTop: 2, fontWeight: 600 }}>View plans →</div>
          </div>
        </button>
        {showPlans && <PlansBottomSheet plans={plans} onClose={() => setShowPlans(false)} />}
      </div>
    );
  }

  const end = membershipEndDate?.toDate ? membershipEndDate.toDate() : new Date(membershipEndDate);
  const daysLeft = Math.ceil((end - new Date()) / 86400000);
  const expired = daysLeft < 0;
  const expiringSoon = !expired && daysLeft <= 7;
  const color = expired ? C.red : expiringSoon ? C.orange : C.green;

  return (
    <div style={{ padding: '10px 16px 0' }}>
      <Card style={{
        padding: '13px 16px',
        background: color + '0D',
        border: `1.5px solid ${color}44`,
        animation: expiringSoon || expired ? 'msg-pulse-border 2s infinite' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {expired ? '⚠️' : expiringSoon ? '⏰' : '✅'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
              {membershipPlanName || 'Membership'}
            </div>
            <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 2 }}>
              {expired
                ? `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`
                : daysLeft === 0 ? 'Expires today!'
                : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`
              }
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
              Valid until {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
          {(expired || expiringSoon) && (
            <button onClick={() => setShowPlans(true)} style={{
              background: color, border: 'none', borderRadius: 10,
              padding: '7px 12px', color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 11, cursor: 'pointer',
            }}>Renew</button>
          )}
        </div>
      </Card>
      {showPlans && <PlansBottomSheet plans={plans} onClose={() => setShowPlans(false)} />}
    </div>
  );
}

function PlansBottomSheet({ plans, onClose }) {
  const [selPlan, setSelPlan] = useState(null);
  const [payMethod, setPayMethod] = useState(null);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.s1, borderRadius: '24px 24px 0 0', width: '100%', maxHeight: '80dvh', overflowY: 'auto', padding: '20px 20px calc(env(safe-area-inset-bottom,0) + 24px)' }}>
        <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>Membership Plans</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Contact gym to activate after payment.</div>

        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted, fontSize: 13 }}>No plans available yet. Ask your gym owner to set them up.</div>
        ) : plans.map(plan => (
          <button key={plan.id} onClick={() => setSelPlan(selPlan?.id === plan.id ? null : plan)} style={{
            width: '100%', padding: '14px', background: selPlan?.id === plan.id ? C.accent + '15' : C.s2,
            border: `1px solid ${selPlan?.id === plan.id ? C.accent : C.border}`,
            borderRadius: 14, marginBottom: 9, cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text }}>{plan.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{plan.durationDays} days</div>
              </div>
              <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.accent }}>₹{plan.price?.toLocaleString?.()}</div>
            </div>
            {plan.features?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {plan.features.filter(Boolean).map((f, i) => (
                  <div key={i} style={{ fontSize: 11, color: C.sub, padding: '2px 0' }}>✓ {f}</div>
                ))}
              </div>
            )}
          </button>
        ))}

        {selPlan && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontFamily: fn, fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 10 }}>Choose Payment Method</div>
            {PAYMENT_METHODS.map(pm => (
              <button key={pm.key} onClick={() => setPayMethod(payMethod === pm.key ? null : pm.key)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', width: '100%',
                background: payMethod === pm.key ? C.accent + '15' : C.s2,
                border: `1px solid ${payMethod === pm.key ? C.accent : C.border}`,
                borderRadius: 12, cursor: 'pointer', textAlign: 'left', marginBottom: 7,
              }}>
                <span style={{ fontSize: 20 }}>{pm.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{pm.label}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{pm.sub}</div>
                </div>
                {payMethod === pm.key && <span style={{ color: C.accent }}>✓</span>}
              </button>
            ))}
            {payMethod && (
              <button style={{
                width: '100%', marginTop: 8, padding: '14px', background: C.accent,
                border: 'none', borderRadius: 14, color: '#111', fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer',
              }} onClick={() => alert(`Please visit the gym or contact staff to complete your ₹${selPlan.price?.toLocaleString?.()} payment via ${payMethod}. Staff will activate your plan.`)}>
                Proceed to Pay ₹{selPlan.price?.toLocaleString?.()}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Explore Section ─────────────────────────────────────────────────────────
function ExploreSection() {

  const [muscle, setMuscle] = useState('chest');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('front');
  const [exploreSearch, setExploreSearch] = useState('');
  
  const mainGroups = [
    { id: 'chest', label: 'Chest', subs: ['chest'] },
    { id: 'back', label: 'Back', subs: ['traps', 'lats', 'lower_back'] },
    { id: 'shoulders', label: 'Shoulders', subs: ['shoulders'] },
    { id: 'arms', label: 'Arms', subs: ['biceps', 'triceps', 'forearms'] },
    { id: 'core', label: 'Core', subs: ['abs', 'obliques'] },
    { id: 'legs', label: 'Legs', subs: ['quads', 'hamstrings', 'glutes', 'calves'] },
  ];

  const getActiveMain = () => {
    const group = mainGroups.find(g => g.id === muscle || g.subs.includes(muscle));
    return group ? group.id : 'chest';
  };
  const activeMain = getActiveMain();
  const activeGroupObj = mainGroups.find(g => g.id === activeMain);

  const isMainGroupActive = (m) => {
    if (['chest', 'back', 'shoulders', 'arms', 'core', 'legs'].includes(muscle)) {
      const g = mainGroups.find(grp => grp.id === muscle);
      return g && g.subs.includes(m);
    }
    return false;
  };

  const filtered = EX.filter(e => {
    if (e.cat !== 'strength') return false;
    if (filter !== 'all' && e.level !== filter) return false;
    
    // If selecting a main group (e.g. 'arms')
    if (['chest', 'back', 'shoulders', 'arms', 'core', 'legs'].includes(muscle)) {
      return e.muscle === muscle;
    }
    
    // If selecting a specific sub-muscle
    const searchStr = `${e.primary} ${e.secondary} ${e.name}`.toLowerCase();
    
    if (muscle === 'biceps') return searchStr.includes('bicep');
    if (muscle === 'triceps') return searchStr.includes('tricep') || searchStr.includes('skull crusher');
    if (muscle === 'forearms') return searchStr.includes('brachioradialis') || searchStr.includes('forearm');
    
    if (muscle === 'quads') return searchStr.includes('quad') || searchStr.includes('squat') || searchStr.includes('leg press');
    if (muscle === 'hamstrings') return searchStr.includes('hamstring') || searchStr.includes('leg curl') || searchStr.includes('romanian deadlift');
    if (muscle === 'glutes') return searchStr.includes('glute') || searchStr.includes('hip thrust');
    if (muscle === 'calves') return searchStr.includes('calf') || searchStr.includes('gastrocnemius');
    
    if (muscle === 'traps') return searchStr.includes('trap') || searchStr.includes('shrug') || searchStr.includes('upright row');
    if (muscle === 'lats') return searchStr.includes('latissimus') || searchStr.includes('lats') || searchStr.includes('pull-up') || (searchStr.includes('row') && !searchStr.includes('upright'));
    if (muscle === 'lower_back') return searchStr.includes('erector') || searchStr.includes('lower back') || searchStr.includes('deadlift');
    
    if (muscle === 'abs') return searchStr.includes('abs') || searchStr.includes('abdomin') || searchStr.includes('core');
    if (muscle === 'obliques') return searchStr.includes('oblique');
    
    if (muscle === 'shoulders') return searchStr.includes('deltoid') || searchStr.includes('shoulder') || searchStr.includes('raise');
    if (muscle === 'chest') return searchStr.includes('chest') || searchStr.includes('pec') || searchStr.includes('press');
    
    return false;
  });

  return (
    <div>
      {/* Search bar */}
      <div style={{ padding: '0 16px 12px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
        <input
          value={exploreSearch}
          onChange={e => setExploreSearch(e.target.value)}
          placeholder="Search exercise, upper chest, hamstrings…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.s2, border: `1px solid ${exploreSearch ? C.accent : C.border}`,
            borderRadius: 12, padding: '11px 14px 11px 36px',
            color: C.text, fontSize: 13, fontFamily: 'Barlow,sans-serif', outline: 'none',
          }}
        />
        {exploreSearch && (
          <button onClick={() => setExploreSearch('')} style={{
            position: 'absolute', right: 26, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', color: C.muted, fontSize: 16, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        )}
      </div>

      {/* Search results mode */}
      {exploreSearch.trim().length >= 2 ? (
        <div style={{ padding: '0 16px' }}>
          {(() => {
            const q = exploreSearch.trim().toLowerCase();
            const results = EX.filter(e => {
              const hay = `${e.name} ${e.muscle} ${e.primary} ${e.secondary || ''}`.toLowerCase();
              return hay.includes(q);
            });
            return (
              <>
                <div style={{ color: C.sub, fontSize: 11, fontFamily: fn, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  {results.length} result{results.length !== 1 ? 's' : ''} for "{exploreSearch}"
                </div>
                {results.length === 0
                  ? <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises found — try a different term</div>
                  : results.map((ex, i) => <ExCard key={i} ex={ex} />)
                }
              </>
            );
          })()}
        </div>
      ) : (
        <>
      {/* View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, gap: 10 }}>
        {['front', 'back'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view === v ? C.accent : 'transparent',
            color: view === v ? '#111' : C.sub,
            border: `1px solid ${view === v ? C.accent : C.border}`,
            borderRadius: 20, padding: '6px 20px', fontSize: 11, fontFamily: fb,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
            boxShadow: view === v ? C.accentShadow : 'none', transition: 'all 0.2s',
          }}>
            {v} View
          </button>
        ))}
      </div>

      {/* High-quality Figure */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 8px 16px' }}>
        <div style={{
          width: '100%', maxWidth: 320, height: 460,
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AnatomicalFigure view={view} muscle={muscle} onMuscleClick={(m) => {
            setMuscle(m);
            // Auto switch view if needed
            if (['traps', 'lats', 'lower_back', 'triceps', 'glutes', 'hamstrings'].includes(m)) setView('back');
            if (['chest', 'abs', 'obliques', 'biceps', 'forearms', 'quads'].includes(m)) setView('front');
          }} isMainGroupActive={isMainGroupActive} />
        </div>
      </div>

      {/* Sub-muscle chips — right below the figure, above the group grid */}
      {activeGroupObj && activeGroupObj.subs.length > 1 && (
        <div style={{ padding: '0 16px 10px', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setMuscle(activeMain)} style={{
            background: muscle === activeMain ? MC[activeMain] : 'transparent',
            color: muscle === activeMain ? '#111' : C.sub,
            border: `1px solid ${muscle === activeMain ? MC[activeMain] : C.border}`,
            borderRadius: 20, padding: '6px 14px', fontSize: 10, fontFamily: fb,
            fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
            boxShadow: muscle === activeMain ? `0 0 8px ${MC[activeMain]}44` : 'none',
            transition: 'all 0.18s',
          }}>All</button>
          {activeGroupObj.subs.map(sub => (
            <button key={sub} onClick={() => setMuscle(sub)} style={{
              background: muscle === sub ? MC[activeMain] : 'transparent',
              color: muscle === sub ? '#111' : C.sub,
              border: `1px solid ${muscle === sub ? MC[activeMain] : C.border}`,
              borderRadius: 20, padding: '6px 14px', fontSize: 10, fontFamily: fb,
              fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer',
              boxShadow: muscle === sub ? `0 0 8px ${MC[activeMain]}44` : 'none',
              transition: 'all 0.18s',
            }}>{sub.replace('_', ' ')}</button>
          ))}
        </div>
      )}

      {/* Main Muscle group buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, padding: '8px 16px 4px' }}>
        {mainGroups.map(m => (
          <button key={m.id} onClick={() => { setMuscle(m.id); if(m.id === 'back') setView('back'); else if(['chest', 'core', 'arms', 'shoulders', 'legs'].includes(m.id)) setView('front'); }} style={{
            background: activeMain === m.id ? MC[m.id] + '22' : C.s2,
            border: `1.5px solid ${activeMain === m.id ? MC[m.id] : C.border}`,
            borderRadius: 12, padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
            color: activeMain === m.id ? MC[m.id] : C.sub, fontFamily: fb, fontWeight: 700,
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
            boxShadow: activeMain === m.id ? `0 0 8px ${MC[m.id]}33` : 'none',
            transition: 'all 0.18s ease',
          }}>
            {m.label}
            <div style={{ color: C.muted, fontWeight: 400, fontSize: 9, marginTop: 2 }}>
              {EX.filter(e => e.muscle === m.id).length} ex
            </div>
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 16px 6px', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {['all', 'beginner', 'intermediate', 'advanced'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? C.s4 : 'transparent', color: filter === f ? C.text : C.muted,
            border: `1px solid ${filter === f ? C.border : 'transparent'}`,
            borderRadius: 7, padding: '5px 10px', fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer', letterSpacing: '0.04em',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ padding: '4px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises found</div>
        ) : filtered.map((ex, i) => <ExCard key={i} ex={ex} />)}
      </div>
        </>
      )}
    </div>
  );
}





