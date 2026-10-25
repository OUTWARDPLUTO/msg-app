// src/member/workoutStorage.js
// Robust persistence, state management, and anatomical mapping for
// Workout Plan Library and Active Guided Workout Sessions.

// ─── Exercise to Anatomical Region Mapping ──────────────────────────────────
// Maps exercise muscle categories, primary, and secondary strings to the
// exact SVG identifiers used by AnatomicalFigure:
// 'chest', 'traps', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs',
// 'obliques', 'quads', 'hamstrings', 'glutes', 'calves', 'lats', 'lower_back'
export function mapExerciseToAnatomyMuscles(ex) {
  if (!ex) return { primaryMuscles: [], secondaryMuscles: [], allMuscles: [], preferredView: 'front' };

  const text = [
    ex.muscle || '',
    ex.primary || '',
    ex.name || ''
  ].join(' ').toLowerCase();

  const secText = (ex.secondary || '').toLowerCase();

  const primarySet = new Set();
  const secondarySet = new Set();

  const resolveMuscles = (str, targetSet) => {
    // Chest
    if (str.includes('chest') || str.includes('pec')) targetSet.add('chest');
    
    // Shoulders
    if (str.includes('delt') || str.includes('shoulder') || str.includes('overhead press') || str.includes('lateral raise')) {
      targetSet.add('shoulders');
    }

    // Traps
    if (str.includes('trap') || str.includes('shrug')) targetSet.add('traps');

    // Lats / Back
    if (str.includes('lat') || str.includes('pull-up') || str.includes('pulldown') || str.includes('row')) {
      targetSet.add('lats');
    }
    if (str.includes('lower back') || str.includes('erector') || str.includes('deadlift')) {
      targetSet.add('lower_back');
    }

    // Arms
    if (str.includes('bicep') || str.includes('curl') || str.includes('chin-up')) targetSet.add('biceps');
    if (str.includes('tricep') || str.includes('dip') || str.includes('pushdown') || str.includes('skull crusher')) targetSet.add('triceps');
    if (str.includes('forearm') || str.includes('grip') || str.includes('wrist')) targetSet.add('forearms');

    // Core
    if (str.includes('ab') || str.includes('core') || str.includes('crunch') || str.includes('plank')) targetSet.add('abs');
    if (str.includes('oblique') || str.includes('pallof') || str.includes('side plank')) targetSet.add('obliques');

    // Legs
    if (str.includes('quad') || str.includes('squat') || str.includes('lunge') || str.includes('leg press') || str.includes('leg extension')) {
      targetSet.add('quads');
    }
    if (str.includes('hamstring') || str.includes('romanian') || str.includes('leg curl') || str.includes('rdl') || str.includes('hinge')) {
      targetSet.add('hamstrings');
    }
    if (str.includes('glute') || str.includes('hip thrust') || str.includes('bridge')) targetSet.add('glutes');
    if (str.includes('calf') || str.includes('calves') || str.includes('raise')) targetSet.add('calves');
  };

  resolveMuscles(text, primarySet);
  resolveMuscles(secText, secondarySet);

  // Fallback if none matched
  if (primarySet.size === 0) {
    if (ex.pattern === 'push') primarySet.add('chest');
    else if (ex.pattern === 'pull') primarySet.add('lats');
    else if (ex.pattern === 'legs') primarySet.add('quads');
    else if (ex.pattern === 'core') primarySet.add('abs');
    else primarySet.add('chest');
  }

  // Remove primary from secondary if duplicated
  primarySet.forEach(m => secondarySet.delete(m));

  const primaryMuscles = Array.from(primarySet);
  const secondaryMuscles = Array.from(secondarySet);
  const allMuscles = [...primaryMuscles, ...secondaryMuscles];

  // Determine optimal default anatomical view (front vs back)
  const posteriorMuscles = ['lats', 'lower_back', 'triceps', 'hamstrings', 'glutes'];
  const exCat = (ex.muscle || '').toLowerCase();

  let preferredView = 'front';
  if (exCat === 'back' || (primaryMuscles[0] && posteriorMuscles.includes(primaryMuscles[0]))) {
    preferredView = 'back';
  } else if (primaryMuscles.some(m => posteriorMuscles.includes(m)) && !primaryMuscles.includes('chest') && !primaryMuscles.includes('quads')) {
    preferredView = 'back';
  }

  return { primaryMuscles, secondaryMuscles, allMuscles, preferredView };
}

// ─── Approximate Workout Duration Calculator ────────────────────────────────
// Estimates realistic total workout duration based on exercise count, sets,
// working set duration (avg 45s), rest intervals, and warm-up/transitions.
export function calculateApproxDuration(exercises = []) {
  if (!Array.isArray(exercises) || exercises.length === 0) return '45–55 min';

  let totalSeconds = 0;
  exercises.forEach(ex => {
    const sets = typeof ex.sets === 'number' ? ex.sets : 3;
    const rest = typeof ex.rest === 'number' ? ex.rest : 60;
    // Estimated 45 seconds of active lifting tension per set
    totalSeconds += sets * (45 + rest);
    // 60s transition buffer between exercises
    totalSeconds += 60;
  });

  const totalMinutes = Math.round(totalSeconds / 60);
  const minRange = Math.max(25, totalMinutes - 5);
  const maxRange = totalMinutes + 10;
  return `${minRange}–${maxRange} min`;
}

// ─── Workout Plan Library Storage ───────────────────────────────────────────
const SAVED_PLANS_KEY = 'msg_saved_plans';
const ACTIVE_PLAN_ID_KEY = 'msg_active_plan_id';
const ACTIVE_SESSION_KEY = 'msg_active_workout_session';
const WORKOUT_HISTORY_KEY = 'msg_workout_history';

export function getSavedPlans() {
  try {
    const raw = localStorage.getItem(SAVED_PLANS_KEY);
    let plans = raw ? JSON.parse(raw) : [];

    // Backward-compatibility: if no saved plans exist yet but msg_week_plan does, migrate it!
    if (!Array.isArray(plans) || plans.length === 0) {
      const legacyRaw = localStorage.getItem('msg_week_plan');
      if (legacyRaw) {
        const legacyPlan = JSON.parse(legacyRaw);
        if (Array.isArray(legacyPlan) && legacyPlan.length > 0) {
          const migrated = {
            id: `plan_${Date.now()}`,
            name: `${legacyPlan.length}-Day Personalized Plan`,
            splitDays: legacyPlan.length,
            focus: legacyPlan[0]?.focus?.split('—')[0]?.trim() || 'Custom Split',
            level: 'Intermediate',
            equip: 'Full Gym',
            durationEstimate: calculateApproxDuration(legacyPlan[0]?.exercises || []),
            createdAt: new Date().toISOString(),
            days: legacyPlan
          };
          plans = [migrated];
          localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));
          localStorage.setItem(ACTIVE_PLAN_ID_KEY, migrated.id);
        }
      }
    }

    return Array.isArray(plans) ? plans : [];
  } catch (err) {
    console.error('[MSG] Error reading saved plans:', err);
    return [];
  }
}

export function savePlanToLibrary(planData) {
  try {
    const plans = getSavedPlans();
    const planId = planData.id || `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const durationEstimate = calculateApproxDuration(planData.days?.[0]?.exercises || []);

    const newPlan = {
      id: planId,
      name: planData.name || `${planData.days?.length || 4}-Day Workout Plan`,
      splitDays: planData.days?.length || 4,
      focus: planData.focus || 'Strength & Hypertrophy',
      level: planData.level || 'Intermediate',
      equip: planData.equip || 'Gym',
      durationEstimate,
      createdAt: planData.createdAt || new Date().toISOString(),
      days: planData.days || []
    };

    const existingIndex = plans.findIndex(p => p.id === planId);
    if (existingIndex >= 0) {
      plans[existingIndex] = newPlan;
    } else {
      plans.unshift(newPlan);
    }

    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));
    localStorage.setItem(ACTIVE_PLAN_ID_KEY, planId);
    // Also keep msg_week_plan in sync with the latest active plan
    localStorage.setItem('msg_week_plan', JSON.stringify(newPlan.days));

    return newPlan;
  } catch (err) {
    console.error('[MSG] Error saving plan to library:', err);
    return null;
  }
}

export function deletePlanFromLibrary(planId) {
  try {
    let plans = getSavedPlans();
    plans = plans.filter(p => p.id !== planId);
    localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(plans));

    const activeId = localStorage.getItem(ACTIVE_PLAN_ID_KEY);
    if (activeId === planId) {
      const nextActive = plans[0] || null;
      if (nextActive) {
        localStorage.setItem(ACTIVE_PLAN_ID_KEY, nextActive.id);
        localStorage.setItem('msg_week_plan', JSON.stringify(nextActive.days));
      } else {
        localStorage.removeItem(ACTIVE_PLAN_ID_KEY);
        localStorage.removeItem('msg_week_plan');
      }
    }
    return plans;
  } catch (err) {
    console.error('[MSG] Error deleting plan:', err);
    return getSavedPlans();
  }
}

export function getActivePlan() {
  const plans = getSavedPlans();
  const activeId = localStorage.getItem(ACTIVE_PLAN_ID_KEY);
  if (activeId) {
    const found = plans.find(p => p.id === activeId);
    if (found) return found;
  }
  return plans[0] || null;
}

export function setActivePlan(planId) {
  const plans = getSavedPlans();
  const target = plans.find(p => p.id === planId);
  if (target) {
    localStorage.setItem(ACTIVE_PLAN_ID_KEY, target.id);
    localStorage.setItem('msg_week_plan', JSON.stringify(target.days));
  }
}

// ─── Active Workout Session Management ──────────────────────────────────────
export function getActiveWorkoutSession() {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[MSG] Error reading active session:', err);
    return null;
  }
}

export function saveActiveWorkoutSession(session) {
  try {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('[MSG] Error saving active session:', err);
  }
}

export function clearActiveWorkoutSession() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {}
}

// ─── Workout History Management ─────────────────────────────────────────────
export function getWorkoutHistory() {
  try {
    const raw = localStorage.getItem(WORKOUT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function saveWorkoutHistoryEntry(entry) {
  try {
    const history = getWorkoutHistory();
    const record = {
      id: `session_${Date.now()}`,
      completedAt: new Date().toISOString(),
      ...entry
    };
    history.unshift(record);
    // Keep last 100 sessions
    localStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
    return record;
  } catch (err) {
    console.error('[MSG] Error saving workout history:', err);
    return null;
  }
}
