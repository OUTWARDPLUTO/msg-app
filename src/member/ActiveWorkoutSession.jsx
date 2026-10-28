// src/member/ActiveWorkoutSession.jsx
// Guided Workout Execution screen: Continuous elapsed-time stopwatch,
// live AnatomicalFigure target muscle highlighting, set-by-set reps/kg logging,
// previous/next exercise flow, unfinished-session recovery, and truthful completion summary.

import { useState, useEffect, useRef } from 'react';
import { C, fn, fb, MC } from '../shared/theme.js';
import { AnatomicalFigure } from '../AnatomicalFigure.jsx';
import {
  mapExerciseToAnatomyMuscles,
  saveActiveWorkoutSession,
  clearActiveWorkoutSession,
  saveWorkoutHistoryEntry
} from './workoutStorage.js';
import { trackActivity } from '../shared/firebase.js';
import {
  AnimatedTrophy,
  AnimatedStopwatch,
  AnimatedPlayPause,
  PauseIcon,
  PlayIcon,
  ZapIcon,
  ClockIcon,
  CycleViewIcon,
  BookOpenIcon,
  LightbulbIcon
} from '../components/visuals/index.js';

export default function ActiveWorkoutSession({
  plan,
  dayIndex = 0,
  initialSession = null,
  onFinish,
  onExit,
  onClose,
  user,
  gymId
}) {
  const handleSessionClose = onFinish || onClose || onExit || (() => {});
  const selectedDay = plan?.days?.[dayIndex] || plan?.days?.[0] || { exercises: [], focus: 'Workout' };
  const exercises = selectedDay.exercises || [];

  // ── Session State Initialization ──────────────────────────────────────────
  const [activeExIdx, setActiveExIdx] = useState(() => initialSession?.activeExIdx || 0);

  // Stopwatch state: timestamp-based to prevent timer drift and survive rerenders
  const [accumulatedMs, setAccumulatedMs] = useState(() => initialSession?.accumulatedMs || 0);
  const [isRunning, setIsRunning] = useState(() => initialSession ? initialSession.isRunning : true);
  const [intervalStart, setIntervalStart] = useState(() => initialSession?.intervalStart || Date.now());
  const [displaySeconds, setDisplaySeconds] = useState(0);

  // Per-exercise set logs: { [exerciseIndex]: [ { setNum: 1, reps: 10, weight: 20, done: false }, ... ] }
  const [exerciseLogs, setExerciseLogs] = useState(() => {
    if (initialSession?.exerciseLogs) return initialSession.exerciseLogs;
    const initial = {};
    exercises.forEach((ex, idx) => {
      const setCount = typeof ex.sets === 'number' ? ex.sets : 3;
      const targetRepMatch = String(ex.reps || '10').match(/\d+/);
      const defaultRep = targetRepMatch ? parseInt(targetRepMatch[0], 10) : 10;
      initial[idx] = Array.from({ length: setCount }, (_, i) => ({
        setNum: i + 1,
        reps: defaultRep,
        weight: ex.equip === 'Bodyweight' ? 0 : 20,
        done: false,
      }));
    });
    return initial;
  });

  // UI state
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finishedSummary, setFinishedSummary] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewAnatomy, setViewAnatomy] = useState('front');

  const currentExercise = exercises[activeExIdx] || exercises[0] || {};
  const currentSets = exerciseLogs[activeExIdx] || [];

  // Update preferred anatomical view whenever active exercise changes
  useEffect(() => {
    const { preferredView } = mapExerciseToAnatomyMuscles(currentExercise);
    setViewAnatomy(preferredView);
  }, [activeExIdx, currentExercise]);

  // ── Stopwatch Interval and Timestamp Math ─────────────────────────────────
  useEffect(() => {
    let timerId = null;

    const tick = () => {
      const now = Date.now();
      const currentInterval = isRunning ? (now - intervalStart) : 0;
      const totalElapsedMs = accumulatedMs + currentInterval;
      setDisplaySeconds(Math.floor(totalElapsedMs / 1000));
    };

    tick();
    if (isRunning) {
      timerId = setInterval(tick, 500);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isRunning, intervalStart, accumulatedMs]);

  // ── Active Session Persistence ────────────────────────────────────────────
  useEffect(() => {
    if (isFinished) return;
    const sessionData = {
      planId: plan?.id,
      planName: plan?.name,
      dayIndex,
      dayFocus: selectedDay.focus,
      activeExIdx,
      accumulatedMs,
      isRunning,
      intervalStart,
      exerciseLogs,
      lastUpdated: Date.now()
    };
    saveActiveWorkoutSession(sessionData);
  }, [activeExIdx, accumulatedMs, isRunning, intervalStart, exerciseLogs, isFinished, plan, dayIndex, selectedDay]);

  // Handle Pause / Resume
  const togglePauseResume = () => {
    const now = Date.now();
    if (isRunning) {
      // Pausing: accumulate interval time and pause
      const sessionDelta = now - intervalStart;
      setAccumulatedMs(prev => prev + sessionDelta);
      setIsRunning(false);
    } else {
      // Resuming: start a new interval from right now
      setIntervalStart(now);
      setIsRunning(true);
    }
  };

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ── Set Logging Handlers ──────────────────────────────────────────────────
  const updateSetField = (setIdx, field, val) => {
    setExerciseLogs(prev => {
      const exSets = [...(prev[activeExIdx] || [])];
      if (exSets[setIdx]) {
        exSets[setIdx] = { ...exSets[setIdx], [field]: val };
      }
      return { ...prev, [activeExIdx]: exSets };
    });
  };

  const toggleSetComplete = (setIdx) => {
    setExerciseLogs(prev => {
      const exSets = [...(prev[activeExIdx] || [])];
      if (exSets[setIdx]) {
        exSets[setIdx] = { ...exSets[setIdx], done: !exSets[setIdx].done };
      }
      return { ...prev, [activeExIdx]: exSets };
    });
  };

  const handleAddSet = () => {
    setExerciseLogs(prev => {
      const exSets = [...(prev[activeExIdx] || [])];
      const lastSet = exSets[exSets.length - 1];
      exSets.push({
        setNum: exSets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 20,
        done: false,
      });
      return { ...prev, [activeExIdx]: exSets };
    });
  };

  // ── Exercise Navigation ───────────────────────────────────────────────────
  const handlePrevExercise = () => {
    if (activeExIdx > 0) {
      setActiveExIdx(i => i - 1);
    }
  };

  const handleNextExercise = () => {
    if (activeExIdx < exercises.length - 1) {
      setActiveExIdx(i => i + 1);
    }
  };

  // ── Workout Finishing and Summary ─────────────────────────────────────────
  const handleFinishWorkout = () => {
    const now = Date.now();
    const finalMs = isRunning ? accumulatedMs + (now - intervalStart) : accumulatedMs;
    const finalSeconds = Math.floor(finalMs / 1000);
    setIsRunning(false);

    // Calculate truthful summary metrics
    let totalSetsLogged = 0;
    let completedSetsCount = 0;
    let totalVolumeKg = 0;
    const exercisesCompleted = [];

    exercises.forEach((ex, idx) => {
      const sets = exerciseLogs[idx] || [];
      totalSetsLogged += sets.length;
      const completedForThis = sets.filter(s => s.done);
      completedSetsCount += completedForThis.length;

      sets.forEach(s => {
        if (s.done) {
          totalVolumeKg += (Number(s.reps) || 0) * (Number(s.weight) || 0);
        }
      });

      if (completedForThis.length > 0) {
        exercisesCompleted.push({
          name: ex.name,
          completedSets: completedForThis.length,
          totalSets: sets.length
        });
      }
    });

    const summary = {
      planName: plan?.name || 'Custom Plan',
      dayFocus: selectedDay.focus,
      durationSec: finalSeconds,
      durationFormatted: formatTime(finalSeconds),
      totalExercisesCount: exercises.length,
      exercisesCompletedCount: exercisesCompleted.length,
      totalSetsLogged,
      completedSetsCount,
      totalVolumeKg: Math.round(totalVolumeKg),
      exercisesDetail: exercisesCompleted,
    };

    // Save record to persistent history & clear active session
    saveWorkoutHistoryEntry(summary);
    clearActiveWorkoutSession();

    // Trigger Firebase engagement score activity event
    if (user?.uid && gymId && user.uid !== 'demo') {
      try {
        trackActivity(user.uid, gymId, 'workout', 30);
      } catch (err) {
        console.warn('[MSG] Activity track failed:', err);
      }
    }

    setFinishedSummary(summary);
    setIsFinished(true);
  };

  // ── Discard Session ───────────────────────────────────────────────────────
  const handleDiscardSession = () => {
    clearActiveWorkoutSession();
    handleSessionClose();
  };

  // Anatomical Region Resolution
  const { primaryMuscles, secondaryMuscles, allMuscles } = mapExerciseToAnatomyMuscles(currentExercise);
  const exerciseProgressPct = exercises.length > 0 ? Math.round(((activeExIdx + 1) / exercises.length) * 100) : 0;
  const isFinalExercise = activeExIdx === exercises.length - 1;

  // ── RENDER: Workout Summary View ──────────────────────────────────────────
  if (isFinished && finishedSummary) {
    return (
      <div className="msg-motion-page" style={{ padding: '20px 16px 40px', maxWidth: 500, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <AnimatedTrophy size={64} />
          </div>
          <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 24, color: C.text, letterSpacing: '-0.02em' }}>Workout Completed!</div>
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, marginTop: 4 }}>+30 Engagement Points Earned</div>
        </div>

        {/* Summary Card */}
        <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18, padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontFamily: fb, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Session Summary</div>
          <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 17, color: C.text, marginBottom: 16 }}>{finishedSummary.dayFocus}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', fontFamily: fb, fontWeight: 700 }}>Active Time</div>
              <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 20, color: C.text, marginTop: 2 }}>{finishedSummary.durationFormatted}</div>
            </div>
            <div style={{ background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', fontFamily: fb, fontWeight: 700 }}>Total Volume</div>
              <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 20, color: C.accent, marginTop: 2 }}>{finishedSummary.totalVolumeKg} <span style={{ fontSize: 12, color: C.sub }}>kg</span></div>
            </div>
            <div style={{ background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', fontFamily: fb, fontWeight: 700 }}>Exercises</div>
              <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 20, color: C.text, marginTop: 2 }}>{finishedSummary.exercisesCompletedCount} <span style={{ fontSize: 12, color: C.sub }}>/ {finishedSummary.totalExercisesCount}</span></div>
            </div>
            <div style={{ background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', fontFamily: fb, fontWeight: 700 }}>Sets Completed</div>
              <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 20, color: C.text, marginTop: 2 }}>{finishedSummary.completedSetsCount} <span style={{ fontSize: 12, color: C.sub }}>/ {finishedSummary.totalSetsLogged}</span></div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontWeight: 600 }}>Logged Exercises</div>
            {finishedSummary.exercisesDetail.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12.5 }}>
                <span style={{ color: C.text, fontWeight: 600 }}>{item.name}</span>
                <span style={{ color: C.sub, fontSize: 11 }}>{item.completedSets} of {item.totalSets} sets</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSessionClose} className="msg-press" style={{
          width: '100%', padding: '16px', background: C.accent, border: 'none', borderRadius: 14,
          color: '#000', fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer',
          boxShadow: `0 8px 24px ${C.accent}40`, textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>Return to Workout Plans</button>
      </div>
    );
  }

  // ── RENDER: Active Guided Workout Interface ───────────────────────────────
  return (
    <div className="msg-motion-page" style={{ padding: '0 16px 90px', maxWidth: 540, margin: '0 auto' }}>

      {/* ── TOP SECTION: SESSION HEADER & LIVE STOPWATCH ────────────────── */}
      <div style={{
        background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18,
        padding: '14px 16px', marginTop: 8, marginBottom: 14, position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10.5, fontFamily: fb, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {selectedDay.focus || 'Training Session'}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>
              Exercise {activeExIdx + 1} of {exercises.length}
            </div>
          </div>

          {/* Stopwatch & Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              background: C.s3, border: `1px solid ${isRunning ? C.accent + '44' : C.border}`,
              borderRadius: 10, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <AnimatedStopwatch size={14} isRunning={isRunning} color={C.accent} />
              <span style={{ fontFamily: fn, fontWeight: 800, fontSize: 15, color: isRunning ? C.text : C.orange, letterSpacing: '0.04em' }}>
                {formatTime(displaySeconds)}
              </span>
            </div>

            {/* Pause/Resume Button */}
            <button onClick={togglePauseResume} className="msg-press" style={{
              width: 32, height: 32, borderRadius: 8, background: isRunning ? C.s3 : C.accent,
              border: `1px solid ${isRunning ? C.border : C.accent}`, color: isRunning ? C.text : '#000',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700
            }} title={isRunning ? 'Pause Workout' : 'Resume Workout'}>
              {isRunning ? <PauseIcon size={13} color={C.text} /> : <PlayIcon size={13} color={C.text} />}
            </button>

            {/* Exit Button */}
            <button onClick={() => setShowExitModal(true)} className="msg-press" style={{
              width: 32, height: 32, borderRadius: 8, background: C.s3,
              border: `1px solid ${C.border}`, color: C.muted, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
            }} title="Exit Workout">
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 4, background: C.s3, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${exerciseProgressPct}%`, background: C.accent,
            borderRadius: 2, transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
        </div>
      </div>

      {/* ── MIDDLE SECTION: CURRENT EXERCISE & ANATOMICAL VISUALIZATION ── */}
      <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px', marginBottom: 14 }}>
        {/* Exercise Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.01em' }}>
              {currentExercise.name}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <span style={{ background: C.accent + '18', color: C.accent, border: `1px solid ${C.accent}33`, fontSize: 10, fontFamily: fb, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                Primary: {currentExercise.primary || currentExercise.muscle}
              </span>
              {currentExercise.isCompound && (
                <span style={{ background: '#f59e0b1A', color: '#f59e0b', border: '1px solid #f59e0b33', fontSize: 10, fontFamily: fb, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ZapIcon size={11} color="#f59e0b" />Compound Lift</span>
                </span>
              )}
              {currentExercise.isIsometric && (
                <span style={{ background: '#06b6d41A', color: '#06b6d4', border: '1px solid #06b6d433', fontSize: 10, fontFamily: fb, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClockIcon size={11} color="#06b6d4" />Isometric Hold</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Prescription Details */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, padding: '10px 14px', background: C.s3, borderRadius: 12, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', fontFamily: fb, fontWeight: 700 }}>Target</span>
            <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 15, color: C.text }}>
              {currentExercise.sets} Sets × {currentExercise.reps}
            </div>
          </div>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div>
            <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', fontFamily: fb, fontWeight: 700 }}>Rest</span>
            <div style={{ fontFamily: fn, fontWeight: 700, fontSize: 14, color: C.sub }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClockIcon size={12} color={C.muted} />{currentExercise.rest || 60}s</span>
            </div>
          </div>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div>
            <span style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', fontFamily: fb, fontWeight: 700 }}>Equipment</span>
            <div style={{ fontFamily: fn, fontWeight: 700, fontSize: 14, color: C.sub }}>
              {currentExercise.equip || 'Gym'}
            </div>
          </div>
        </div>

        {/* Anatomical Figure Viewer */}
        <div style={{ marginTop: 14, background: '#050505', border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>Target Anatomy: <strong style={{ color: C.accent }}>{allMuscles.join(', ')}</strong></span>
            <button onClick={() => setViewAnatomy(v => v === 'front' ? 'back' : 'front')} className="msg-press" style={{
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px',
              color: C.text, fontFamily: fn, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CycleViewIcon size={13} color={C.accent} />View:</span> <strong style={{ color: C.accent, textTransform: 'uppercase' }}>{viewAnatomy}</strong>
            </button>
          </div>

          <div style={{ height: 210, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <AnatomicalFigure
              view={viewAnatomy}
              muscle={null}
              isMainGroupActive={(muscleName) => allMuscles.includes(muscleName)}
              onMuscleClick={() => {}}
            />
          </div>
        </div>

        {/* Collapsible Form Guide */}
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setFormOpen(o => !o)} style={{
            width: '100%', background: 'none', border: 'none', color: C.sub, fontSize: 11.5,
            fontWeight: 700, cursor: 'pointer', padding: '6px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><BookOpenIcon size={14} color={C.accent} />Form Guide & Tips</span>
            <span>{formOpen ? '▲' : '▼'}</span>
          </button>
          {formOpen && (
            <div style={{ padding: '8px 4px 4px', fontSize: 12, color: C.sub, lineHeight: 1.55 }}>
              {(currentExercise.steps || []).map((step, sIdx) => (
                <div key={sIdx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span style={{ color: C.accent, fontWeight: 700 }}>{sIdx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
              {currentExercise.tip && (
                <div style={{ marginTop: 6, padding: '8px 10px', background: C.s3, borderRadius: 8, color: C.accent }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><LightbulbIcon size={14} color="#f59e0b" style={{ flexShrink: 0 }} /><span>{currentExercise.tip}</span></span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── LOWER SECTION: SET, REPETITION & WEIGHT LOGGING ─────────────── */}
      <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 15, color: C.text }}>Record Sets</div>
          <button onClick={handleAddSet} className="msg-press" style={{
            background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px',
            color: C.accent, fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer'
          }}>+ Add Set</button>
        </div>

        {/* Sets Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px', gap: 8, padding: '0 8px 8px', fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase' }}>
          <div>Set</div>
          <div>Reps</div>
          <div>Weight (kg)</div>
          <div style={{ textAlign: 'center' }}>Done</div>
        </div>

        {/* Set Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentSets.map((set, sIdx) => (
            <div key={sIdx} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px', gap: 8, alignItems: 'center',
              padding: '8px', background: set.done ? `${C.accent}12` : C.s3,
              border: `1px solid ${set.done ? C.accent + '44' : C.border}`, borderRadius: 12,
              transition: 'background 0.2s, border-color 0.2s'
            }}>
              {/* Set # */}
              <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 13, color: set.done ? C.accent : C.muted, paddingLeft: 4 }}>
                #{set.setNum}
              </div>

              {/* Actual Reps Input */}
              <div>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={set.reps}
                  onChange={e => updateSetField(sIdx, 'reps', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  style={{
                    width: '100%', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '8px 10px', color: C.text, fontFamily: fn, fontWeight: 700, fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              {/* Actual Weight (kg) Input */}
              <div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="999"
                  value={set.weight}
                  onChange={e => updateSetField(sIdx, 'weight', Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '8px 10px', color: C.text, fontFamily: fn, fontWeight: 700, fontSize: 13, outline: 'none'
                  }}
                />
              </div>

              {/* Done Checkbox Button */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => toggleSetComplete(sIdx)} className="msg-press" style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: set.done ? C.accent : 'transparent',
                  border: `2px solid ${set.done ? C.accent : C.muted}`,
                  color: set.done ? '#000' : 'transparent',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM NAVIGATION: PREVIOUS / NEXT / FINISH ─────────────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handlePrevExercise}
          disabled={activeExIdx === 0}
          className="msg-press"
          style={{
            flex: 1, padding: 14, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14,
            color: activeExIdx === 0 ? C.muted : C.text, fontFamily: fn, fontWeight: 700, fontSize: 13,
            cursor: activeExIdx === 0 ? 'not-allowed' : 'pointer', opacity: activeExIdx === 0 ? 0.4 : 1
          }}
        >
          ← Prev Exercise
        </button>

        {isFinalExercise ? (
          <button
            onClick={handleFinishWorkout}
            className="msg-press"
            style={{
              flex: 1.5, padding: 14, background: C.accent, border: 'none', borderRadius: 14,
              color: '#000', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer',
              boxShadow: `0 4px 16px ${C.accent}40`, textTransform: 'uppercase', letterSpacing: '0.04em'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Finish Workout <AnimatedTrophy size={16} /></span>
          </button>
        ) : (
          <button
            onClick={handleNextExercise}
            className="msg-press"
            style={{
              flex: 1.5, padding: 14, background: C.accent + '22', border: `1px solid ${C.accent}`, borderRadius: 14,
              color: C.accent, fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer'
            }}
          >
            Next Exercise →
          </button>
        )}
      </div>

      {/* ── EXIT WORKOUT CONFIRMATION MODAL ─────────────────────────────── */}
      {showExitModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div className="msg-motion-sheet" style={{
            background: C.s1, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 20px',
            maxWidth: 380, width: '100%', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <AnimatedPlayPause isPaused={true} size={48} />
            </div>
            <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 6 }}>Leave Workout Session?</div>
            <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5, marginBottom: 20 }}>
              Your session progress and elapsed time are saved. You can resume anytime or conclude now.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => setShowExitModal(false)} className="msg-press" style={{
                padding: '13px', background: C.accent, border: 'none', borderRadius: 12,
                color: '#000', fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer'
              }}>Resume Workout</button>

              <button onClick={() => { setShowExitModal(false); handleFinishWorkout(); }} className="msg-press" style={{
                padding: '13px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12,
                color: C.text, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}>Finish & Save Log</button>

              <button onClick={handleDiscardSession} className="msg-press" style={{
                padding: '12px', background: 'none', border: 'none',
                color: C.red, fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer'
              }}>Discard Session</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
