// src/member/WorkoutPlanLibrary.jsx
// Workout Plan Library & Details: multiple plan cards, approximate duration,
// exercise inspection, and launching active guided workout sessions.

import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import {
  EmptyWorkoutsIllustration,
  ZapIcon,
  PlayIcon,
  TrashIcon,
  ClockIcon,
  DumbbellIcon,
  RocketIcon
} from '../components/visuals/index.js';
import {
  getSavedPlans,
  deletePlanFromLibrary,
  getActiveWorkoutSession,
  calculateApproxDuration
} from './workoutStorage.js';

export default function WorkoutPlanLibrary({
  onSelectPlanDay,
  onCreateNewPlan,
  onResumeSession
}) {
  const [plans, setPlans] = useState(() => getSavedPlans());
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const activeSession = getActiveWorkoutSession();

  const handleDelete = (planId) => {
    const updated = deletePlanFromLibrary(planId);
    setPlans(updated);
    setConfirmDeleteId(null);
    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
    }
  };

  const handleOpenDetails = (plan) => {
    setSelectedPlan(plan);
    setSelectedDayIdx(0);
  };

  return (
    <div className="msg-motion-page">
      {/* ── Active Session Alert Banner (if workout is in progress) ─────── */}
      {activeSession && (
        <div style={{
          background: `linear-gradient(135deg, ${C.accent}25, ${C.accent}10)`,
          border: `1.5px solid ${C.accent}`, borderRadius: 16,
          padding: '14px 16px', marginBottom: 18, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 12, boxShadow: `0 4px 16px ${C.accent}20`
        }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: fb, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ZapIcon size={15} color="#f59e0b" />Workout in Progress</span>
            </div>
            <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 14, color: C.text, marginTop: 2 }}>
              {activeSession.dayFocus || activeSession.planName || 'Active Session'}
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 1 }}>
              Exercise {(activeSession.activeExIdx || 0) + 1}
            </div>
          </div>
          <button onClick={() => onResumeSession(activeSession)} className="msg-press" style={{
            background: C.accent, border: 'none', borderRadius: 10, padding: '10px 16px',
            color: '#000', fontFamily: fn, fontWeight: 800, fontSize: 12, cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Resume <PlayIcon size={11} color="#000" /></span>
          </button>
        </div>
      )}

      {/* ── Library Header & Create Button ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 17, color: C.text }}>Saved Workout Plans</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{plans.length} {plans.length === 1 ? 'plan' : 'plans'} in library</div>
        </div>
        <button onClick={onCreateNewPlan} className="msg-press" style={{
          background: C.accent, border: 'none', borderRadius: 10, padding: '9px 14px',
          color: '#000', fontFamily: fn, fontWeight: 800, fontSize: 11.5, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.02em'
        }}>
          <span>+</span> Create New Plan
        </button>
      </div>

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {plans.length === 0 && (
        <div style={{
          background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18,
          padding: '36px 20px', textAlign: 'center', marginTop: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <EmptyWorkoutsIllustration size={110} />
          </div>
          <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>No Plans Saved Yet</div>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5, maxWidth: 300, margin: '0 auto 20px' }}>
            Generate a personalized AI routine or enter your own workout split to start training with guided tracking.
          </div>
          <button onClick={onCreateNewPlan} className="msg-press" style={{
            background: C.accent, border: 'none', borderRadius: 12, padding: '12px 24px',
            color: '#000', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer'
          }}>
            Create Your First Plan →
          </button>
        </div>
      )}

      {/* ── Plan Cards List ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {plans.map((p, idx) => {
          const firstDay = p.days?.[0] || {};
          const duration = p.durationEstimate || calculateApproxDuration(firstDay.exercises || []);
          const totalExCount = firstDay.exercises?.length || 0;

          return (
            <div key={p.id || idx} className="msg-motion-card" style={{
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18,
              padding: '16px 18px', transition: 'border-color 0.2s, transform 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{
                      background: C.accent + '1A', color: C.accent, border: `1px solid ${C.accent}33`,
                      fontSize: 9.5, fontFamily: fb, fontWeight: 800, textTransform: 'uppercase',
                      letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4
                    }}>
                      {p.splitDays || p.days?.length || 4} Days / Week
                    </span>
                    <span style={{
                      background: C.s3, color: C.sub, fontSize: 9.5, fontFamily: fb,
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                      padding: '2px 8px', borderRadius: 4
                    }}>
                      {p.equip || 'Gym'}
                    </span>
                  </div>

                  <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 16, color: C.text, letterSpacing: '-0.01em' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>
                    {p.focus || 'Strength & Hypertrophy'}
                  </div>
                </div>

                {/* Delete / Trash action */}
                <button
                  onClick={() => setConfirmDeleteId(confirmDeleteId === p.id ? null : p.id)}
                  style={{
                    background: 'none', border: 'none', color: C.muted, fontSize: 14,
                    cursor: 'pointer', padding: 4, opacity: 0.6
                  }}
                  title="Delete Plan"
                >
                  <TrashIcon size={15} color={C.muted} />
                </button>
              </div>

              {/* Confirm Delete prompt */}
              {confirmDeleteId === p.id && (
                <div style={{
                  marginTop: 10, padding: '10px 12px', background: C.s3, borderRadius: 10,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12
                }}>
                  <span style={{ color: C.red, fontWeight: 600 }}>Delete this workout plan?</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmDeleteId(null)} style={{
                      background: 'none', border: `1px solid ${C.border}`, borderRadius: 6,
                      padding: '4px 8px', color: C.sub, fontSize: 11, cursor: 'pointer'
                    }}>Cancel</button>
                    <button onClick={() => handleDelete(p.id)} style={{
                      background: C.red, border: 'none', borderRadius: 6,
                      padding: '4px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}>Delete</button>
                  </div>
                </div>
              )}

              {/* Metadata Badges */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', fontSize: 11, color: C.muted }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClockIcon size={12} color={C.muted} />Approx. {duration}</span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><DumbbellIcon size={12} color={C.muted} />{totalExCount} exercises / session</span>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button onClick={() => handleOpenDetails(p)} className="msg-press" style={{
                  flex: 1, padding: '10px', background: C.accent + '15',
                  border: `1px solid ${C.accent}44`, borderRadius: 10,
                  color: C.accent, fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer'
                }}>
                  View Exercises & Details →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PLAN DETAILS MODAL ─────────────────────────────────────────── */}
      {selectedPlan && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 90
        }}>
          <div className="msg-motion-sheet" style={{
            background: C.s1, border: `1px solid ${C.border}`, borderRadius: '24px 24px 0 0',
            width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto',
            padding: '20px 20px 36px', boxSizing: 'border-box'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <span style={{
                  background: C.accent + '1A', color: C.accent, border: `1px solid ${C.accent}33`,
                  fontSize: 9.5, fontFamily: fb, fontWeight: 800, textTransform: 'uppercase',
                  letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4
                }}>
                  {selectedPlan.splitDays} Day Training Split
                </span>
                <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 20, color: C.text, marginTop: 6, letterSpacing: '-0.01em' }}>
                  {selectedPlan.name}
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                  {selectedPlan.focus} · {selectedPlan.equip}
                </div>
              </div>
              <button onClick={() => setSelectedPlan(null)} style={{
                background: C.s3, border: `1px solid ${C.border}`, borderRadius: '50%',
                width: 32, height: 32, color: C.muted, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>

            {/* Day Selector Tabs */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 16, paddingBottom: 4 }}>
              {(selectedPlan.days || []).map((d, dIdx) => (
                <button key={dIdx} onClick={() => setSelectedDayIdx(dIdx)} className="msg-press" style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: 10,
                  background: selectedDayIdx === dIdx ? C.accent : C.s3,
                  border: `1px solid ${selectedDayIdx === dIdx ? C.accent : C.border}`,
                  color: selectedDayIdx === dIdx ? '#000' : C.sub,
                  fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap'
                }}>
                  {d.day}
                </button>
              ))}
            </div>

            {/* Selected Day Overview */}
            {(() => {
              const currentDay = selectedPlan.days?.[selectedDayIdx] || selectedPlan.days?.[0];
              if (!currentDay) return null;
              const approxDuration = currentDay.duration || calculateApproxDuration(currentDay.exercises || []);

              return (
                <div>
                  <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
                    <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 15, color: C.text }}>
                      {currentDay.focus || currentDay.day}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: C.sub }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClockIcon size={12} color={C.sub} />Approx. duration: <strong>{approxDuration}</strong></span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><DumbbellIcon size={12} color={C.sub} />{(currentDay.exercises || []).length} exercises</span>
                    </div>
                  </div>

                  {/* Exercises List */}
                  <div style={{ fontSize: 11, fontFamily: fb, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Prescribed Exercise Sequence
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {(currentDay.exercises || []).map((ex, exIdx) => (
                      <div key={exIdx} style={{
                        background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12,
                        padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: C.text }}>
                            {exIdx + 1}. {ex.name}
                          </div>
                          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                            {ex.primary || ex.muscle} · {ex.equip}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: fn, fontWeight: 700, fontSize: 14, color: C.accent }}>
                            {ex.sets} × {ex.reps}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClockIcon size={11} color={C.muted} />{ex.rest || 60}s rest</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Start Workout Primary Action */}
                  <button onClick={() => {
                    const planToStart = selectedPlan;
                    const dayToStart = selectedDayIdx;
                    setSelectedPlan(null);
                    onSelectPlanDay(planToStart, dayToStart);
                  }} className="msg-press" style={{
                    width: '100%', padding: '15px', background: C.accent, border: 'none', borderRadius: 14,
                    color: '#000', fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    boxShadow: `0 8px 24px ${C.accent}40`, textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Start This Workout <RocketIcon size={16} color="#000" /></span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
