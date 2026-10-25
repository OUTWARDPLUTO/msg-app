// ─── Workout Generation Engine ───────────────────────────────────────────────
// Scientifically structured workout planning, strict PPL classification,
// compound strength prioritization, isometric training, and modular customization.
import { EX } from './constants.js';

// ─── Modular Custom Exercise Prioritization Registry (Requirement 9) ─────────
// When user-curated exercises are provided, they are registered here.
// Exercises in this registry receive top selection priority over alternatives
// while respecting equipment, injury, and split movement constraints.
export const CUSTOM_PREFERRED_EXERCISES = new Set([]);

export function setCustomPreferredExercises(exerciseList = []) {
  CUSTOM_PREFERRED_EXERCISES.clear();
  exerciseList.forEach(name => {
    if (typeof name === 'string' && name.trim()) {
      CUSTOM_PREFERRED_EXERCISES.add(name.trim().toLowerCase());
    }
  });
}

export function addCustomPreferredExercise(name) {
  if (typeof name === 'string' && name.trim()) {
    CUSTOM_PREFERRED_EXERCISES.add(name.trim().toLowerCase());
  }
}

// ─── Dedicated Isometric Exercise Bank ────────────────────────────────────────
// High-tension static exercises to complement dynamic resistance training,
// enhance stability, joint integrity, and motor unit recruitment.
export const ISOMETRIC_BANK = [
  // Push / Chest / Triceps Isometrics
  {
    name: 'Paused Bench Press', cat: 'strength', muscle: 'chest', pattern: 'push',
    primary: 'Chest, Triceps', secondary: 'Anterior Deltoid', equip: 'Barbell', level: 'intermediate',
    sets: 3, reps: '3s pause / 6–8 reps', rest: 90,
    steps: ['Lower bar with full control to mid-chest', 'Hold dead still 1 inch off chest for 3 full seconds', 'Drive explosively off chest to lockout'],
    tip: 'Eliminates stretch-reflex, massively overloading chest tension and starting strength',
    isCompound: true, isIsometric: true, tier: 'S'
  },
  {
    name: 'Paused Push-Up Hold', cat: 'strength', muscle: 'chest', pattern: 'push',
    primary: 'Pectoralis Major, Triceps', secondary: 'Core Stability', equip: 'Bodyweight', level: 'beginner',
    sets: 3, reps: '20–30s hold', rest: 60,
    steps: ['Lower chest until 1 inch off floor', 'Lock shoulder blades back and brace core hard', 'Hold hovering position without resting on floor'],
    tip: 'Peak isometric tension on pec fibers at maximum loaded stretch',
    isCompound: false, isIsometric: true, tier: 'A'
  },
  {
    name: 'Paused DB Press', cat: 'strength', muscle: 'chest', pattern: 'push',
    primary: 'Pectoralis Major', secondary: 'Triceps, Ant Deltoid', equip: 'Dumbbell', level: 'intermediate',
    sets: 3, reps: '3s pause / 8–10 reps', rest: 75,
    steps: ['Lower dumbbells deep into chest stretch', 'Pause completely for 3 seconds with zero bounce', 'Press back up with controlled force'],
    tip: 'Deep chest stretch isometric creates intense mechanical tension',
    isCompound: true, isIsometric: true, tier: 'A'
  },
  {
    name: 'Dip Bottom Hold', cat: 'strength', muscle: 'chest', pattern: 'push',
    primary: 'Lower Chest, Triceps', secondary: 'Anterior Deltoid', equip: 'Bodyweight', level: 'advanced',
    sets: 3, reps: '15–25s hold', rest: 75,
    steps: ['Lower into parallel bar dip to 90 degree elbow bend', 'Hold stationary keeping chest slightly forward', 'Drive up to starting position'],
    tip: 'Intense chest and tricep isometric under loaded stretch',
    isCompound: false, isIsometric: true, tier: 'A'
  },
  {
    name: 'Overhead Lockout Hold', cat: 'strength', muscle: 'front-delt', pattern: 'push',
    primary: 'Anterior & Medial Deltoid', secondary: 'Triceps, Traps, Core', equip: 'Dumbbell', level: 'intermediate',
    sets: 3, reps: '25–35s hold', rest: 60,
    steps: ['Press dumbbells to full overhead extension', 'Lock arms with ribcage pinned down and core braced', 'Hold weight overhead resisting any sway'],
    tip: 'Builds phenomenal shoulder stability and core anti-extension power',
    isCompound: false, isIsometric: true, tier: 'B'
  },

  // Pull / Back / Biceps Isometrics
  {
    name: 'Dead Hang', cat: 'strength', muscle: 'back', pattern: 'pull',
    primary: 'Latissimus Dorsi, Grip, Forearms', secondary: 'Upper Back, Scapula', equip: 'Bodyweight', level: 'beginner',
    sets: 3, reps: '35–50s hold', rest: 60,
    steps: ['Grip pull-up bar slightly wider than shoulders', 'Let body hang freely with shoulders packed down', 'Breathe deeply while maintaining active grip'],
    tip: 'Decompresses the spine while building unshakeable grip endurance and lat tension',
    isCompound: false, isIsometric: true, tier: 'S'
  },
  {
    name: 'Flexed-Arm Chin-Up Hold', cat: 'strength', muscle: 'arms', pattern: 'pull',
    primary: 'Biceps Brachii, Lats', secondary: 'Upper Back, Core', equip: 'Bodyweight', level: 'intermediate',
    sets: 3, reps: '20–30s hold', rest: 75,
    steps: ['Pull chin cleanly over bar using underhand grip', 'Lock elbows tight at sides and hold chin above bar', 'Fight descent slowly when time expires'],
    tip: 'Maximum contraction isometric for peaked biceps and upper back',
    isCompound: false, isIsometric: true, tier: 'A'
  },
  {
    name: 'Paused Barbell Row', cat: 'strength', muscle: 'back', pattern: 'pull',
    primary: 'Rhomboids, Lats, Mid-Back', secondary: 'Biceps, Erector Spinae', equip: 'Barbell', level: 'intermediate',
    sets: 3, reps: '2s pause / 6–8 reps', rest: 90,
    steps: ['Hinge to 45 degree torso angle', 'Row bar explosively to lower sternum', 'Pause for 2 full seconds squeezing shoulder blades', 'Lower under 3s control'],
    tip: 'Removes all momentum, forcing mid-back and lat musculature to fire 100%',
    isCompound: true, isIsometric: true, tier: 'S'
  },
  {
    name: 'Superman Hold', cat: 'strength', muscle: 'back', pattern: 'pull',
    primary: 'Erector Spinae, Rhomboids', secondary: 'Glutes, Rear Delts', equip: 'Bodyweight', level: 'beginner',
    sets: 3, reps: '30–40s hold', rest: 45,
    steps: ['Lie face down on mat, arms extended forward', 'Simultaneously raise chest, arms, and legs off floor', 'Squeeze entire posterior chain and hold'],
    tip: 'Strengthens thoracic extension, countering forward-slouched posture',
    isCompound: false, isIsometric: true, tier: 'B'
  },
  {
    name: 'Face Pull Peak Hold', cat: 'strength', muscle: 'rear-delt', pattern: 'pull',
    primary: 'Rear Deltoid, Infraspinatus', secondary: 'Lower Traps, Rhomboids', equip: 'Machine', level: 'beginner',
    sets: 3, reps: '3s hold / 12–15 reps', rest: 60,
    steps: ['Pull rope to eye level with high elbows', 'Externally rotate hands behind ears', 'Hold peak double-bicep contraction for 3 seconds'],
    tip: 'Essential for posterior shoulder stability and rotator cuff longevity',
    isCompound: false, isIsometric: true, tier: 'A'
  },

  // Legs / Posterior Chain Isometrics
  {
    name: 'Pause Squat', cat: 'strength', muscle: 'legs', pattern: 'legs',
    primary: 'Quadriceps, Glutes', secondary: 'Adductors, Core', equip: 'Barbell', level: 'intermediate',
    sets: 3, reps: '3s pause / 5–6 reps', rest: 120,
    steps: ['Descend below parallel with vertical chest', 'Pause dead-still at the bottom for 3 full seconds', 'Drive hard through mid-foot to stand'],
    tip: 'Builds explosive reversal strength in the hole and bulletproofs knee tendons',
    isCompound: true, isIsometric: true, tier: 'S'
  },
  {
    name: 'Wall Sit', cat: 'strength', muscle: 'legs', pattern: 'legs',
    primary: 'Quadriceps', secondary: 'Glutes, Calves', equip: 'Bodyweight', level: 'beginner',
    sets: 3, reps: '45–60s hold', rest: 60,
    steps: ['Back flat against wall, thighs parallel to floor', 'Knees at exact 90 degree angle over ankles', 'Keep hands off thighs and maintain position'],
    tip: 'Unmatched isometric quad burn and patellar tendon rehabilitation',
    isCompound: false, isIsometric: true, tier: 'A'
  },
  {
    name: 'Glute Bridge Hold', cat: 'strength', muscle: 'glutes', pattern: 'legs',
    primary: 'Gluteus Maximus', secondary: 'Hamstrings, Core', equip: 'Bodyweight', level: 'beginner',
    sets: 3, reps: '30–45s hold', rest: 45,
    steps: ['Lie on back, feet flat and hip-width', 'Drive hips to full extension towards ceiling', 'Squeeze glutes with maximum force throughout hold'],
    tip: 'Direct isometric glute activation and hip extension reinforcement',
    isCompound: false, isIsometric: true, tier: 'B'
  },
  {
    name: 'Nordic Hamstring Catch Hold', cat: 'strength', muscle: 'legs', pattern: 'legs',
    primary: 'Hamstrings', secondary: 'Calves, Glutes', equip: 'Bodyweight', level: 'advanced',
    sets: 3, reps: '5–8s hold / 4 reps', rest: 90,
    steps: ['Kneel with ankles securely anchored', 'Lower torso forward keeping straight line knee to shoulder', 'Hold bottom-most angle for 5–8 seconds before pushing back'],
    tip: 'The gold standard for eccentric-isometric hamstring injury resistance',
    isCompound: false, isIsometric: true, tier: 'S'
  },

  // Core / Stability Isometrics
  {
    name: 'Hardstyle RKC Plank', cat: 'strength', muscle: 'core', pattern: 'core',
    primary: 'Transverse Abdominis, Rectus Abdominis', secondary: 'Glutes, Shoulders', equip: 'Bodyweight', level: 'beginner',
    sets: 3, reps: '35–45s hold', rest: 45,
    steps: ['Forearms on floor, body in perfect line', 'Pull elbows towards toes and squeeze glutes maximally', 'Maintain 100% full-body tension'],
    tip: 'Active contraction produces 3x greater abdominal activation than standard plank',
    isCompound: false, isIsometric: true, tier: 'S'
  },
  {
    name: 'Side Plank', cat: 'strength', muscle: 'core', pattern: 'core',
    primary: 'Obliques, Quadratus Lumborum', secondary: 'Glute Medius', equip: 'Bodyweight', level: 'beginner',
    sets: 3, reps: '30–40s per side', rest: 45,
    steps: ['Elbow under shoulder, feet stacked', 'Raise hips so body forms straight diagonal line', 'Do not let hips sag or rotate forward'],
    tip: 'Crucial for lateral spinal stability and waistline definition',
    isCompound: false, isIsometric: true, tier: 'A'
  },
  {
    name: 'Hollow Body Hold', cat: 'strength', muscle: 'core', pattern: 'core',
    primary: 'Deep Anterior Core, Transverse Abdominis', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'intermediate',
    sets: 3, reps: '25–35s hold', rest: 60,
    steps: ['Lie on back, press lumbar spine completely flush to floor', 'Extend arms overhead and legs straight, hovering 6 inches off ground', 'Maintain contact between lower back and floor'],
    tip: 'Gymnastic staple that locks the ribcage to the pelvis',
    isCompound: false, isIsometric: true, tier: 'S'
  },
  {
    name: 'Weighted Pallof Press Hold', cat: 'strength', muscle: 'core', pattern: 'core',
    primary: 'Obliques, Core Anti-Rotation', secondary: 'Shoulders, Glutes', equip: 'Machine', level: 'intermediate',
    sets: 3, reps: '15–20s hold per side', rest: 60,
    steps: ['Stand perpendicular to cable or band at chest level', 'Press handle straight out in front with both hands', 'Resist the lateral pull with zero torso twist'],
    tip: 'Top anti-rotational exercise to transfer power through the core safely',
    isCompound: false, isIsometric: true, tier: 'A'
  },
];

// ─── Classification Helper ───────────────────────────────────────────────────
export function classifyExercise(ex) {
  const name = (ex.name || '').toLowerCase();
  const primary = (ex.primary || '').toLowerCase();
  const muscle = ex.muscle || '';

  // 1. Check if explicitly in isometric bank
  const isoMatch = ISOMETRIC_BANK.find(i => i.name.toLowerCase() === name);
  if (isoMatch) return isoMatch;

  // 2. Identify isometrics in general DB
  const isIsometric = (
    name.includes('pause') || name.includes('hold') || name.includes('plank') ||
    name.includes('wall sit') || name.includes('dead hang') || name.includes('l-sit')
  );

  // 3. Movement Pattern
  let pattern = 'other';
  if (['chest', 'front-delt', 'lateral-delt'].includes(muscle)) {
    pattern = 'push';
  } else if (['back', 'rear-delt', 'traps', 'forearms'].includes(muscle)) {
    pattern = 'pull';
  } else if (['legs', 'calves', 'glutes'].includes(muscle)) {
    pattern = 'legs';
  } else if (muscle === 'core') {
    pattern = 'core';
  } else if (muscle === 'arms') {
    // Discriminate triceps (push) vs biceps/forearms (pull)
    const isTricep = (
      primary.includes('tricep') || name.includes('tricep') || name.includes('skull') ||
      name.includes('pushdown') || name.includes('close-grip') || name.includes('tate') ||
      name.includes('jm press') || name.includes('dip') || name.includes('diamond')
    );
    pattern = isTricep ? 'push' : 'pull';
  }

  // 4. Compound vs Isolation
  const isCompound = (
    name.includes('press') || name.includes('squat') || name.includes('deadlift') ||
    name.includes('row') || name.includes('pull-up') || name.includes('chin-up') ||
    name.includes('dip') || name.includes('lunge') || name.includes('push-up') ||
    name.includes('pulldown') || name.includes('thrust') || name.includes('clean')
  ) && !name.includes('pallof') && !name.includes('french press') && !name.includes('tate press') &&
       !name.includes('pullover') && !name.includes('reverse fly') && !name.includes('face pull') &&
       !name.includes('upright row');

  // 5. Tier / Biomechanical effectiveness
  let tier = 'B';
  const sCompounds = [
    'bench press', 'incline db press', 'overhead press', 'barbell row', 'pull-ups',
    'weighted pull-up', 'deadlift', 'squat', 'front squat', 'romanian deadlift',
    'bulgarian split squat', 'hip thrust', 'close-grip bench press', 'pause squat',
    'paused bench press', 'dead hang', 'hardstyle rkc plank'
  ];
  if (sCompounds.some(s => name.includes(s))) {
    tier = 'S';
  } else if (isCompound || name.includes('cable') || name.includes('curl') || name.includes('raise') || name.includes('flye')) {
    tier = 'A';
  }

  return {
    ...ex,
    pattern,
    isCompound,
    isIsometric,
    tier,
  };
}

// ─── Equipment Matching Helper ───────────────────────────────────────────────
export function isEquipmentCompatible(exEquip, userEquip) {
  const eq = (exEquip || 'Bodyweight').toLowerCase();
  const u = (userEquip || 'gym').toLowerCase();

  if (u === 'bodyweight') return eq.includes('bodyweight') || eq.includes('band');
  if (u === 'dumbbell')   return eq.includes('dumbbell') || eq.includes('bodyweight') || eq.includes('band');
  if (u === 'barbell')    return eq.includes('barbell') || eq.includes('dumbbell') || eq.includes('bodyweight') || eq.includes('band');
  return true; // 'gym' has access to machines, cables, barbells, dumbbells, and bodyweight
}

// ─── Comprehensive Scientifically-Structured Split Definitions ───────────────
// Built strictly adhering to push/pull/legs mechanics, recovery windows,
// multi-joint compound strength, hypertrophy, and isometric development.
export const WEEK_SPLIT_DEFINITIONS = {
  3: [
    {
      day: 'Day 1',
      focus: 'Full Body A — Quad & Horizontal Push Strength',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'legs', target: 'quads', preferredType: 'compound' },
        { role: 'primary_compound', pattern: 'push', target: 'chest', preferredType: 'compound' },
        { role: 'primary_compound', pattern: 'pull', target: 'back_horizontal', preferredType: 'compound' },
        { role: 'hypertrophy',       pattern: 'legs', target: 'hamstrings', preferredType: 'compound_or_iso' },
        { role: 'hypertrophy',       pattern: 'push', target: 'lateral_delts', preferredType: 'isolation' },
        { role: 'arms_push',         pattern: 'push', target: 'triceps', preferredType: 'isolation' },
        { role: 'core',              pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'isometric',         pattern: 'push', target: 'chest_or_quad', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 2',
      focus: 'Full Body B — Posterior Chain & Vertical Pull Strength',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'legs', target: 'hinge_posterior', preferredType: 'compound' },
        { role: 'primary_compound', pattern: 'pull', target: 'lats_vertical', preferredType: 'compound' },
        { role: 'primary_compound', pattern: 'push', target: 'overhead_delts', preferredType: 'compound' },
        { role: 'hypertrophy',       pattern: 'legs', target: 'quads_unilateral', preferredType: 'compound' },
        { role: 'hypertrophy',       pattern: 'pull', target: 'rear_delts', preferredType: 'isolation' },
        { role: 'arms_pull',         pattern: 'pull', target: 'biceps', preferredType: 'isolation' },
        { role: 'core',              pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'isometric',         pattern: 'pull', target: 'back_or_hang', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 3',
      focus: 'Full Body C — Hypertrophy & Unilateral Balance',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'legs', target: 'quads_or_hack', preferredType: 'compound' },
        { role: 'primary_compound', pattern: 'push', target: 'chest_incline', preferredType: 'compound' },
        { role: 'primary_compound', pattern: 'pull', target: 'back_row', preferredType: 'compound' },
        { role: 'hypertrophy',       pattern: 'legs', target: 'glutes_or_hams', preferredType: 'compound_or_iso' },
        { role: 'hypertrophy',       pattern: 'push', target: 'lateral_delts', preferredType: 'isolation' },
        { role: 'arms_superset',     pattern: 'pull', target: 'biceps_hammer', preferredType: 'isolation' },
        { role: 'arms_superset',     pattern: 'push', target: 'triceps_overhead', preferredType: 'isolation' },
        { role: 'isometric',         pattern: 'legs', target: 'squat_pause', preferredType: 'isometric' },
      ],
    },
  ],

  4: [
    {
      day: 'Day 1',
      focus: 'Upper Body A — Chest Strength & Horizontal Push Focus',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'push', target: 'chest_flat', preferredType: 'compound' },
        { role: 'secondary_compound', pattern: 'push', target: 'chest_incline', preferredType: 'compound' },
        { role: 'overhead_push',    pattern: 'push', target: 'overhead_delts', preferredType: 'compound' },
        { role: 'isolation_chest',  pattern: 'push', target: 'chest_fly', preferredType: 'isolation' },
        { role: 'lateral_delts',    pattern: 'push', target: 'lateral_delts', preferredType: 'isolation' },
        { role: 'compound_triceps', pattern: 'push', target: 'triceps_compound', preferredType: 'compound_or_iso' },
        { role: 'isolation_triceps', pattern: 'push', target: 'triceps_extension', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'push', target: 'chest_iso', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 2',
      focus: 'Lower Body A — Quad Dominant & Core Stability',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'legs', target: 'quads_squat', preferredType: 'compound' },
        { role: 'unilateral_compound', pattern: 'legs', target: 'quads_unilateral', preferredType: 'compound' },
        { role: 'quad_hypertrophy', pattern: 'legs', target: 'quads_machine', preferredType: 'compound_or_iso' },
        { role: 'hamstring_support', pattern: 'legs', target: 'hamstring_curl', preferredType: 'isolation' },
        { role: 'glute_activation', pattern: 'legs', target: 'glutes', preferredType: 'isolation' },
        { role: 'calves',           pattern: 'legs', target: 'calves', preferredType: 'isolation' },
        { role: 'core_dynamic',     pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'isometric',        pattern: 'legs', target: 'quad_wall_sit', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 3',
      focus: 'Upper Body B — Lat Width & Horizontal Row Thickness',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'pull', target: 'lats_vertical', preferredType: 'compound' },
        { role: 'horizontal_row',   pattern: 'pull', target: 'back_horizontal', preferredType: 'compound' },
        { role: 'lat_hypertrophy',  pattern: 'pull', target: 'lats_pulldown', preferredType: 'compound_or_iso' },
        { role: 'rear_delts',       pattern: 'pull', target: 'rear_delts', preferredType: 'isolation' },
        { role: 'traps',            pattern: 'pull', target: 'traps', preferredType: 'isolation' },
        { role: 'biceps_strength',  pattern: 'pull', target: 'biceps_supinated', preferredType: 'isolation' },
        { role: 'biceps_hammer',    pattern: 'pull', target: 'biceps_brachialis', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'pull', target: 'dead_hang', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 4',
      focus: 'Lower Body B — Posterior Chain (Hamstrings & Glutes)',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'legs', target: 'hinge_rdl', preferredType: 'compound' },
        { role: 'glute_compound',   pattern: 'legs', target: 'glutes_thrust', preferredType: 'compound' },
        { role: 'secondary_quad',   pattern: 'legs', target: 'quads_support', preferredType: 'compound' },
        { role: 'hamstring_isolation', pattern: 'legs', target: 'hamstring_curl', preferredType: 'isolation' },
        { role: 'calves',           pattern: 'legs', target: 'calves', preferredType: 'isolation' },
        { role: 'core_dynamic',     pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'core_isometric',   pattern: 'core', target: 'core_anti_extension', preferredType: 'isometric' },
        { role: 'isometric',        pattern: 'legs', target: 'glute_bridge_hold', preferredType: 'isometric' },
      ],
    },
  ],

  5: [
    {
      day: 'Day 1',
      focus: 'Push — Chest, Anterior/Lateral Delts & Triceps',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'push', target: 'chest_flat', preferredType: 'compound' },
        { role: 'secondary_compound', pattern: 'push', target: 'chest_incline', preferredType: 'compound' },
        { role: 'overhead_shoulder', pattern: 'push', target: 'overhead_delts', preferredType: 'compound' },
        { role: 'isolation_chest',  pattern: 'push', target: 'chest_fly', preferredType: 'isolation' },
        { role: 'lateral_delts',    pattern: 'push', target: 'lateral_delts', preferredType: 'isolation' },
        { role: 'compound_triceps', pattern: 'push', target: 'triceps_compound', preferredType: 'compound_or_iso' },
        { role: 'isolation_triceps', pattern: 'push', target: 'triceps_extension', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'push', target: 'chest_paused_press', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 2',
      focus: 'Pull — Lats, Mid-Back, Rear Delts & Biceps',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'pull', target: 'lats_vertical', preferredType: 'compound' },
        { role: 'horizontal_row',   pattern: 'pull', target: 'back_horizontal', preferredType: 'compound' },
        { role: 'lat_hypertrophy',  pattern: 'pull', target: 'lats_pulldown', preferredType: 'compound_or_iso' },
        { role: 'rear_delts',       pattern: 'pull', target: 'rear_delts', preferredType: 'isolation' },
        { role: 'traps',            pattern: 'pull', target: 'traps', preferredType: 'isolation' },
        { role: 'biceps_curl',      pattern: 'pull', target: 'biceps_supinated', preferredType: 'isolation' },
        { role: 'biceps_hammer',    pattern: 'pull', target: 'biceps_brachialis', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'pull', target: 'dead_hang', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 3',
      focus: 'Legs — Quad & Hamstring Dominant Strength',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'legs', target: 'quads_squat', preferredType: 'compound' },
        { role: 'posterior_hinge',  pattern: 'legs', target: 'hinge_rdl', preferredType: 'compound' },
        { role: 'unilateral_compound', pattern: 'legs', target: 'quads_unilateral', preferredType: 'compound' },
        { role: 'quad_hypertrophy', pattern: 'legs', target: 'quads_machine', preferredType: 'compound_or_iso' },
        { role: 'hamstring_hypertrophy', pattern: 'legs', target: 'hamstring_curl', preferredType: 'isolation' },
        { role: 'glute_hypertrophy', pattern: 'legs', target: 'glutes_thrust', preferredType: 'compound_or_iso' },
        { role: 'calves',           pattern: 'legs', target: 'calves', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'legs', target: 'pause_squat_or_wall_sit', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 4',
      focus: 'Upper Hypertrophy — Weak Point Volume & Arm Specialization',
      duration: '50–60 min',
      slots: [
        { role: 'incline_chest',    pattern: 'push', target: 'chest_incline', preferredType: 'compound' },
        { role: 'upper_back_row',   pattern: 'pull', target: 'back_row', preferredType: 'compound' },
        { role: 'shoulder_press',   pattern: 'push', target: 'overhead_delts', preferredType: 'compound' },
        { role: 'lateral_delts',    pattern: 'push', target: 'lateral_delts', preferredType: 'isolation' },
        { role: 'rear_delts',       pattern: 'pull', target: 'rear_delts', preferredType: 'isolation' },
        { role: 'arms_biceps',      pattern: 'pull', target: 'biceps', preferredType: 'isolation' },
        { role: 'arms_triceps',     pattern: 'push', target: 'triceps', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'core', target: 'core_anti_rotation', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 5',
      focus: 'Lower & Posterior Chain Hypertrophy + Core',
      duration: '50–60 min',
      slots: [
        { role: 'glute_compound',   pattern: 'legs', target: 'glutes_thrust', preferredType: 'compound' },
        { role: 'hamstring_hinge',  pattern: 'legs', target: 'hinge_rdl', preferredType: 'compound' },
        { role: 'quad_isolation',   pattern: 'legs', target: 'quads_machine', preferredType: 'compound_or_iso' },
        { role: 'hamstring_curl',   pattern: 'legs', target: 'hamstring_curl', preferredType: 'isolation' },
        { role: 'calves',           pattern: 'legs', target: 'calves', preferredType: 'isolation' },
        { role: 'core_dynamic_1',   pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'core_dynamic_2',   pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'isometric',        pattern: 'core', target: 'core_hollow_or_plank', preferredType: 'isometric' },
      ],
    },
  ],

  6: [
    {
      day: 'Day 1',
      focus: 'Push A — Chest Heavy Strength, Delts & Triceps',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'push', target: 'chest_flat', preferredType: 'compound' },
        { role: 'secondary_compound', pattern: 'push', target: 'chest_incline', preferredType: 'compound' },
        { role: 'overhead_press',   pattern: 'push', target: 'overhead_delts', preferredType: 'compound' },
        { role: 'chest_fly',        pattern: 'push', target: 'chest_fly', preferredType: 'isolation' },
        { role: 'lateral_delts',    pattern: 'push', target: 'lateral_delts', preferredType: 'isolation' },
        { role: 'triceps_compound', pattern: 'push', target: 'triceps_compound', preferredType: 'compound_or_iso' },
        { role: 'triceps_isolation', pattern: 'push', target: 'triceps_extension', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'push', target: 'paused_bench', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 2',
      focus: 'Pull A — Lat Width, Heavy Horizontal Rows & Biceps',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'pull', target: 'lats_vertical', preferredType: 'compound' },
        { role: 'horizontal_row',   pattern: 'pull', target: 'back_horizontal', preferredType: 'compound' },
        { role: 'lat_hypertrophy',  pattern: 'pull', target: 'lats_pulldown', preferredType: 'compound_or_iso' },
        { role: 'rear_delts',       pattern: 'pull', target: 'rear_delts', preferredType: 'isolation' },
        { role: 'traps',            pattern: 'pull', target: 'traps', preferredType: 'isolation' },
        { role: 'biceps_supinated', pattern: 'pull', target: 'biceps_supinated', preferredType: 'isolation' },
        { role: 'biceps_hammer',    pattern: 'pull', target: 'biceps_brachialis', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'pull', target: 'dead_hang', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 3',
      focus: 'Legs A — Heavy Squat & Quad Dominant Performance',
      duration: '55–65 min',
      slots: [
        { role: 'primary_compound', pattern: 'legs', target: 'quads_squat', preferredType: 'compound' },
        { role: 'unilateral_squat', pattern: 'legs', target: 'quads_unilateral', preferredType: 'compound' },
        { role: 'quad_press',       pattern: 'legs', target: 'quads_machine', preferredType: 'compound_or_iso' },
        { role: 'hamstring_curl',   pattern: 'legs', target: 'hamstring_curl', preferredType: 'isolation' },
        { role: 'glute_bridge',     pattern: 'legs', target: 'glutes_thrust', preferredType: 'compound_or_iso' },
        { role: 'calves',           pattern: 'legs', target: 'calves', preferredType: 'isolation' },
        { role: 'core_dynamic',     pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'isometric',        pattern: 'legs', target: 'pause_squat_or_wall_sit', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 4',
      focus: 'Push B — Incline Hypertrophy, High-Volume Shoulders & Triceps',
      duration: '55–65 min',
      slots: [
        { role: 'primary_incline',  pattern: 'push', target: 'chest_incline', preferredType: 'compound' },
        { role: 'shoulder_press',   pattern: 'push', target: 'overhead_delts', preferredType: 'compound' },
        { role: 'dips_or_press',    pattern: 'push', target: 'chest_flat_or_dips', preferredType: 'compound' },
        { role: 'lateral_delts_high', pattern: 'push', target: 'lateral_delts', preferredType: 'isolation' },
        { role: 'incline_fly',      pattern: 'push', target: 'chest_fly', preferredType: 'isolation' },
        { role: 'triceps_overhead', pattern: 'push', target: 'triceps_overhead', preferredType: 'isolation' },
        { role: 'triceps_pushdown', pattern: 'push', target: 'triceps_extension', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'push', target: 'push_up_hold', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 5',
      focus: 'Pull B — Deadlift/Hinge Focus, Upper Back Density & Biceps',
      duration: '55–65 min',
      slots: [
        { role: 'primary_hinge',    pattern: 'pull', target: 'back_deadlift', preferredType: 'compound' },
        { role: 'chest_supported_row', pattern: 'pull', target: 'back_horizontal', preferredType: 'compound' },
        { role: 'vertical_lat',     pattern: 'pull', target: 'lats_pulldown', preferredType: 'compound_or_iso' },
        { role: 'rear_delt_fly',    pattern: 'pull', target: 'rear_delts', preferredType: 'isolation' },
        { role: 'traps_shrug',      pattern: 'pull', target: 'traps', preferredType: 'isolation' },
        { role: 'biceps_preacher',  pattern: 'pull', target: 'biceps_supinated', preferredType: 'isolation' },
        { role: 'forearms_grip',    pattern: 'pull', target: 'forearms', preferredType: 'isolation' },
        { role: 'isometric',        pattern: 'pull', target: 'superman_or_hang', preferredType: 'isometric' },
      ],
    },
    {
      day: 'Day 6',
      focus: 'Legs B — Posterior Chain (RDL & Hip Thrust), Glutes & Calves',
      duration: '55–65 min',
      slots: [
        { role: 'primary_hinge',    pattern: 'legs', target: 'hinge_rdl', preferredType: 'compound' },
        { role: 'glute_thrust',     pattern: 'legs', target: 'glutes_thrust', preferredType: 'compound' },
        { role: 'front_or_hack_squat', pattern: 'legs', target: 'quads_machine', preferredType: 'compound_or_iso' },
        { role: 'hamstring_curl',   pattern: 'legs', target: 'hamstring_curl', preferredType: 'isolation' },
        { role: 'quad_extension',   pattern: 'legs', target: 'quads_machine', preferredType: 'isolation' },
        { role: 'calves_seated',    pattern: 'legs', target: 'calves', preferredType: 'isolation' },
        { role: 'core_anti_extension', pattern: 'core', target: 'core', preferredType: 'any' },
        { role: 'isometric',        pattern: 'core', target: 'core_hollow_or_plank', preferredType: 'isometric' },
      ],
    },
  ],
};

// ─── Exercise Scorer & Selector ─────────────────────────────────────────────
function scoreExercise(ex, slot, { equip, level, customPreferences = CUSTOM_PREFERRED_EXERCISES, usedNames = new Set() }) {
  if (usedNames.has(ex.name.toLowerCase())) return -1000; // avoid repeats in same workout
  if (!isEquipmentCompatible(ex.equip, equip)) return -1000;

  let score = 100;
  const nameLower = ex.name.toLowerCase();

  // 1. Highest Priority: Custom Preferred Registry (Requirement 9)
  if (customPreferences.has(nameLower)) {
    score += 800; // Strongest boost
  }

  // 2. Pattern Match
  if (ex.pattern !== slot.pattern && slot.pattern !== 'core') {
    return -2000; // Disqualify wrong movement pattern immediately!
  }

  // 3. Movement Type Priority (Compound vs Isolation vs Isometric)
  if (slot.preferredType === 'compound') {
    if (ex.isCompound) score += 300;
    else score -= 150;
  } else if (slot.preferredType === 'isometric') {
    if (ex.isIsometric) score += 500;
    else return -1000; // Only real isometrics for isometric slots
  } else if (slot.preferredType === 'isolation') {
    if (!ex.isCompound && !ex.isIsometric) score += 200;
  }

  // 4. Target Sub-Muscle Matching
  const target = slot.target.toLowerCase();
  const primary = (ex.primary || '').toLowerCase();
  const muscle = (ex.muscle || '').toLowerCase();

  if (target.includes('chest') && (muscle === 'chest' || primary.includes('chest') || primary.includes('pec'))) score += 150;
  if (target.includes('incline') && (primary.includes('upper chest') || nameLower.includes('incline'))) score += 180;
  if (target.includes('overhead') && (primary.includes('anterior') || primary.includes('deltoid') || nameLower.includes('overhead') || nameLower.includes('press'))) score += 150;
  if (target.includes('lateral') && (muscle === 'lateral-delt' || primary.includes('lateral'))) score += 200;
  if (target.includes('rear') && (muscle === 'rear-delt' || primary.includes('rear deltoid') || nameLower.includes('face pull') || nameLower.includes('reverse fly'))) score += 200;
  if (target.includes('lats') && (primary.includes('lat') || nameLower.includes('pull-up') || nameLower.includes('pulldown'))) score += 180;
  if (target.includes('row') && (nameLower.includes('row') || primary.includes('rhomboid'))) score += 180;
  if (target.includes('traps') && (muscle === 'traps' || primary.includes('trap') || nameLower.includes('shrug'))) score += 200;
  if (target.includes('triceps') && (primary.includes('tricep') || nameLower.includes('pushdown') || nameLower.includes('skull') || nameLower.includes('dip'))) score += 180;
  if (target.includes('biceps') && (primary.includes('bicep') || nameLower.includes('curl'))) score += 180;
  if (target.includes('hammer') && (nameLower.includes('hammer') || primary.includes('brachialis') || primary.includes('brachioradialis'))) score += 220;
  if (target.includes('quad') && (primary.includes('quad') || nameLower.includes('squat') || nameLower.includes('leg press'))) score += 180;
  if (target.includes('hinge') && (nameLower.includes('deadlift') || nameLower.includes('rdl') || primary.includes('hamstring') || primary.includes('erector'))) score += 200;
  if (target.includes('curl') && target.includes('hamstring') && (nameLower.includes('leg curl') || primary.includes('hamstring'))) score += 220;
  if (target.includes('glute') && (muscle === 'glutes' || primary.includes('glute') || nameLower.includes('thrust') || nameLower.includes('bridge'))) score += 200;
  if (target.includes('calves') && (muscle === 'calves' || primary.includes('gastrocnemius') || primary.includes('soleus') || nameLower.includes('calf'))) score += 250;
  if (target.includes('core') && (muscle === 'core' || primary.includes('abdomin') || primary.includes('oblique'))) score += 150;

  // 5. Tier / Biomechanical Rating
  if (ex.tier === 'S') score += 120;
  else if (ex.tier === 'A') score += 60;

  // 6. Level Suitability (avoiding trivializing advanced workouts)
  if (level === 'advanced') {
    if (ex.level === 'advanced') score += 80;
    if (ex.level === 'intermediate') score += 50;
    if (ex.level === 'foundation') score -= 120;
  } else if (level === 'intermediate') {
    if (ex.level === 'intermediate' || ex.level === 'advanced') score += 40;
  } else if (level === 'beginner') {
    if (ex.level === 'beginner' || ex.level === 'intermediate') score += 40;
  }

  return score;
}

// ─── Master Deterministic Plan Builder ───────────────────────────────────────
// Generates fully compliant, science-backed workout splits directly from the local DB.
export function buildIntelligentWorkoutPlan({ days = 4, goal = 'muscle gain', level = 'intermediate', equip = 'gym', injury = null, customPreferences = CUSTOM_PREFERRED_EXERCISES }) {
  const numDays = [3, 4, 5, 6].includes(Number(days)) ? Number(days) : 4;
  const splitTemplate = WEEK_SPLIT_DEFINITIONS[numDays] || WEEK_SPLIT_DEFINITIONS[4];

  // Prepare Master Pool (EX + ISOMETRIC_BANK)
  const classifiedMaster = [...EX, ...ISOMETRIC_BANK].map(classifyExercise);

  return splitTemplate.map(dayDef => {
    const dayExercises = [];
    const usedNames = new Set();

    // Fill each dedicated slot with the most biomechanically appropriate exercise
    dayDef.slots.forEach(slot => {
      let pool = classifiedMaster.filter(ex => {
        if (slot.preferredType === 'isometric') return ex.isIsometric;
        if (slot.pattern && ex.pattern !== slot.pattern && slot.pattern !== 'core') return false;
        if (injury && typeof injury === 'string') {
          const inj = injury.toLowerCase();
          if (inj.includes('shoulder') && (ex.name.toLowerCase().includes('overhead press') || ex.name.toLowerCase().includes('behind-the-neck'))) return false;
          if (inj.includes('knee') && (ex.name.toLowerCase().includes('heavy squat') || ex.name.toLowerCase().includes('hack squat'))) return false;
          if (inj.includes('back') && (ex.name.toLowerCase().includes('deadlift') || ex.name.toLowerCase().includes('good morning'))) return false;
        }
        return isEquipmentCompatible(ex.equip, equip);
      });

      // Score and select best candidate
      let bestEx = null;
      let highestScore = -Infinity;

      pool.forEach(ex => {
        const sc = scoreExercise(ex, slot, { equip, level, customPreferences, usedNames });
        if (sc > highestScore) {
          highestScore = sc;
          bestEx = ex;
        }
      });

      if (bestEx) {
        usedNames.add(bestEx.name.toLowerCase());
        // Tune sets & reps for goal
        const adjusted = { ...bestEx };
        if (goal === 'strength' && bestEx.isCompound && !bestEx.isIsometric) {
          adjusted.sets = 4;
          adjusted.reps = '5–6';
          adjusted.rest = 120;
        } else if (goal === 'fat loss') {
          adjusted.rest = Math.max(45, (adjusted.rest || 60) - 15);
        }
        dayExercises.push(adjusted);
      }
    });

    // Ensure we meet the 7–8 exercise requirement if a slot was unfilled due to extreme equipment constraints
    if (dayExercises.length < 7) {
      const needed = 7 - dayExercises.length;
      const fillers = classifiedMaster
        .filter(e => isEquipmentCompatible(e.equip, equip) && !usedNames.has(e.name.toLowerCase()))
        .filter(e => {
          if (dayDef.focus.toLowerCase().includes('push') && e.pattern !== 'push') return false;
          if (dayDef.focus.toLowerCase().includes('pull') && e.pattern !== 'pull') return false;
          if (dayDef.focus.toLowerCase().includes('legs') && e.pattern !== 'legs') return false;
          return true;
        })
        .slice(0, needed);

      fillers.forEach(f => {
        usedNames.add(f.name.toLowerCase());
        dayExercises.push(f);
      });
    }

    return {
      day: dayDef.day,
      focus: dayDef.focus,
      duration: goal === 'fat loss' ? '50–60 min' : '55–70 min',
      exercises: dayExercises,
    };
  });
}

// ─── Quality Assurance & Plan Sanitizer (Layer 3) ───────────────────────────
// Audits ANY generated plan (whether from AI or external source), enforcing:
// 1. Strict PPL purity (zero curls on push days, zero triceps on pull days)
// 2. Minimum of 1 major compound movement per session
// 3. Mandatory inclusion of suitable isometric training
// 4. Adequate 7–8 exercise volume
export function sanitizeAndValidatePlan(rawPlan, { days = 4, goal = 'muscle gain', level = 'intermediate', equip = 'gym', injury = null, customPreferences = CUSTOM_PREFERRED_EXERCISES }) {
  if (!Array.isArray(rawPlan) || rawPlan.length === 0) {
    return buildIntelligentWorkoutPlan({ days, goal, level, equip, injury, customPreferences });
  }

  const numDays = [3, 4, 5, 6].includes(Number(days)) ? Number(days) : rawPlan.length;
  const splitTemplate = WEEK_SPLIT_DEFINITIONS[numDays] || WEEK_SPLIT_DEFINITIONS[4];

  // DB lookup by lower-case name
  const allMaster = [...EX, ...ISOMETRIC_BANK].map(classifyExercise);
  const byName = {};
  allMaster.forEach(e => { byName[e.name.toLowerCase()] = e; });

  const sanitized = rawPlan.map((d, dayIndex) => {
    const templateDay = splitTemplate[dayIndex] || splitTemplate[dayIndex % splitTemplate.length];
    const dayFocus = (d.focus || templateDay.focus).toLowerCase();

    // Determine strict primary pattern for this day
    let allowedPattern = null;
    if (dayFocus.includes('push')) allowedPattern = 'push';
    else if (dayFocus.includes('pull')) allowedPattern = 'pull';
    else if (dayFocus.includes('legs') || dayFocus.includes('lower body')) allowedPattern = 'legs';

    // Map incoming exercises to classified objects
    let validExercises = [];
    const used = new Set();

    (d.exercises || []).forEach(item => {
      const name = (typeof item === 'string' ? item : item.name || '').trim();
      let matched = byName[name.toLowerCase()];

      if (!matched) {
        // Find closest match or classify raw object
        matched = allMaster.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
      }

      if (matched) {
        // Enforce Pattern Purity: discard pull on push, discard push on pull
        if (allowedPattern && matched.pattern !== allowedPattern && matched.pattern !== 'core') {
          // Cross-contamination detected (e.g. Bicep curl on push day!)
          return;
        }
        if (!used.has(matched.name.toLowerCase())) {
          used.add(matched.name.toLowerCase());
          validExercises.push(matched);
        }
      }
    });

    // Check 1: Mandatory Compound Strength Movement
    const hasCompound = validExercises.some(e => e.isCompound);
    if (!hasCompound) {
      // Find suitable gold-standard compound for this day
      const candidateCompound = allMaster.find(e => (
        e.isCompound && e.tier === 'S' &&
        (!allowedPattern || e.pattern === allowedPattern) &&
        isEquipmentCompatible(e.equip, equip) &&
        !used.has(e.name.toLowerCase())
      ));
      if (candidateCompound) {
        used.add(candidateCompound.name.toLowerCase());
        validExercises.unshift(candidateCompound); // Place as #1 primary lift
      }
    }

    // Check 2: Mandatory Isometric Exercise
    const hasIsometric = validExercises.some(e => e.isIsometric);
    if (!hasIsometric) {
      const candidateIso = ISOMETRIC_BANK.find(e => (
        (!allowedPattern || e.pattern === allowedPattern || e.pattern === 'core') &&
        isEquipmentCompatible(e.equip, equip) &&
        !used.has(e.name.toLowerCase())
      ));
      if (candidateIso) {
        used.add(candidateIso.name.toLowerCase());
        validExercises.push(candidateIso);
      }
    }

    // Check 3: Adequate Volume (7–8 exercises per session)
    if (validExercises.length < 7) {
      const fallbackDay = buildIntelligentWorkoutPlan({ days: numDays, goal, level, equip, injury, customPreferences })[dayIndex];
      if (fallbackDay && fallbackDay.exercises) {
        fallbackDay.exercises.forEach(fe => {
          if (validExercises.length < 8 && !used.has(fe.name.toLowerCase())) {
            used.add(fe.name.toLowerCase());
            validExercises.push(fe);
          }
        });
      }
    }

    return {
      day: d.day || templateDay.day,
      focus: templateDay.focus,
      duration: d.duration || (goal === 'fat loss' ? '50–60 min' : '55–70 min'),
      exercises: validExercises.slice(0, 8),
    };
  });

  return sanitized;
}

// ─── AI Prompt Constructor ──────────────────────────────────────────────────
// Equips the AI model with strict movement rules, compound & isometric requirements,
// and the categorized catalogue so it cannot make PPL assignment errors.
export function buildAiPromptContext({ days, goal, level, equip, injury, customPreferences = CUSTOM_PREFERRED_EXERCISES }) {
  const numDays = [3, 4, 5, 6].includes(Number(days)) ? Number(days) : 4;
  const splitDef = WEEK_SPLIT_DEFINITIONS[numDays] || WEEK_SPLIT_DEFINITIONS[4];

  const classified = [...EX, ...ISOMETRIC_BANK].map(classifyExercise);

  const pushPool = classified.filter(e => e.pattern === 'push' && isEquipmentCompatible(e.equip, equip)).map(e => e.name);
  const pullPool = classified.filter(e => e.pattern === 'pull' && isEquipmentCompatible(e.equip, equip)).map(e => e.name);
  const legPool  = classified.filter(e => e.pattern === 'legs' && isEquipmentCompatible(e.equip, equip)).map(e => e.name);
  const corePool = classified.filter(e => e.pattern === 'core' && isEquipmentCompatible(e.equip, equip)).map(e => e.name);

  const preferredNotice = customPreferences.size > 0
    ? `User High-Priority Preferred Exercises: [${Array.from(customPreferences).join(', ')}]. Integrate these wherever appropriate.`
    : '';

  const injuryNotice = injury && typeof injury === 'string'
    ? `User Injury Notice: ${injury}. STRICTLY omit movements stressing this region.`
    : '';

  const dayRequirements = splitDef.map((d, i) => (
    `Day ${i + 1} (${d.focus}): Must contain exactly 7-8 exercises. Target slots: ${d.slots.map(s => `${s.role} (${s.target})`).join(', ')}`
  )).join('\n');

  const systemPrompt = `You are an elite, Olympic-level strength and conditioning specialist.
Return ONLY valid raw JSON with zero markdown codeblocks, following this exact schema:
{
  "week_plan": [
    {
      "day": "Day 1",
      "focus": "string",
      "duration": "55–65 min",
      "exercises": ["Exercise Name 1", "Exercise Name 2", "Exercise Name 3", "Exercise Name 4", "Exercise Name 5", "Exercise Name 6", "Exercise Name 7", "Exercise Name 8"]
    }
  ]
}

STRICT PROGRAMMING RULES:
1. PUSH/PULL/LEGS PURITY:
   - Push days MUST ONLY contain PUSH exercises (Chest, Anterior Delts, Lateral Delts, Triceps). Absolutely NO curls, rows, or pulls.
   - Pull days MUST ONLY contain PULL exercises (Lats, Rows, Rear Delts, Traps, Biceps, Forearms). Absolutely NO bench presses, overhead presses, or triceps.
   - Legs days MUST ONLY contain LEGS exercises (Quads, Hamstrings, Glutes, Calves, Core).
2. COMPOUND STRENGTH FIRST: Each session must start with at least 1 major compound multi-joint strength exercise (e.g. Barbell Bench Press, Squat, Pull-Up, Barbell Row, Overhead Press, Deadlift).
3. ISOMETRIC INTEGRATION: Each session must end with 1 designated isometric stability/hypertrophy finisher (e.g. Paused Bench Press, Dead Hang, Pause Squat, Hardstyle RKC Plank, Wall Sit).
4. VOLUME: Provide exactly 7 to 8 exercises per session. Do NOT generate short or simplified routines.
5. EXERCISE NAMES: Pick exercise names ONLY from the provided allowed pools.`;

  const userPrompt = `Create a master-level ${numDays}-Day ${goal.toUpperCase()} workout plan for a ${level.toUpperCase()} trainee using ${equip.toUpperCase()} equipment.

ALLOWED PUSH EXERCISES:
${pushPool.slice(0, 45).join(', ')}

ALLOWED PULL EXERCISES:
${pullPool.slice(0, 45).join(', ')}

ALLOWED LEGS EXERCISES:
${legPool.slice(0, 45).join(', ')}

ALLOWED CORE & ISOMETRICS:
${corePool.slice(0, 20).join(', ')}, ${ISOMETRIC_BANK.map(i => i.name).join(', ')}

TRAINING SPLIT TARGETS:
${dayRequirements}

${preferredNotice}
${injuryNotice}

Return ONLY the valid JSON object.`;

  return { systemPrompt, userPrompt };
}
