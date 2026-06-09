// MemberApp.jsx — MSG member UI (ported from msg-uncl with full feature set)
import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
// ─── Theme (shared — imported from shared/theme.js) ──────────────────────────
import { THEMES, C, fn, fb, MC } from './shared/theme.js';
import { AnatomicalFigure } from './AnatomicalFigure';
import homeLogo from './assets/home-logo.png';
import AttendanceButton from './sections/AttendanceButton.jsx';




// ─── Exercise Database ──────────────────────────────────────────────────────
// muscle tags: chest | back | front-delt | lateral-delt | rear-delt | arms | core | legs | calves | glutes | traps | forearms
const EX = [
  // ── Chest ──
  { name: 'Bench Press', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Ant. Deltoid', equip: 'Barbell', level: 'beginner', sets: 4, reps: '8–12', rest: 90, steps: ['Lie flat, grip bar slightly wider than shoulders', 'Unrack and lower to mid-chest with control', 'Press explosively, elbows at 45°', 'Lock out without shrugging'], tip: 'Arch upper back slightly; feet flat on floor' },
  { name: 'Incline DB Press', cat: 'strength', muscle: 'chest', primary: 'Upper Chest', secondary: 'Ant. Deltoid', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Set bench to 30–45° incline', 'DBs at shoulder level, palms forward', 'Press upward and slightly inward', '3-second eccentric descent'], tip: 'Keep slight elbow bend at top to maintain tension' },
  { name: 'Cable Flyes', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Anterior Deltoid', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Stand between cables at chest height', 'Arms wide, step forward', 'Bring hands together in hugging arc', 'Control return with 3s eccentric'], tip: 'Think "hugging a barrel" — don\'t let elbows drop' },
  { name: 'Push-Ups', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Core', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '12–20', rest: 45, steps: ['Hands shoulder-width, body straight', 'Lower chest to 1 inch from floor', 'Push explosively back to start', 'Keep core braced throughout'], tip: 'Squeeze chest at top — imagine pushing the floor apart' },
  { name: 'Dumbbell Pullover', cat: 'strength', muscle: 'chest', primary: 'Chest, Lats', secondary: 'Serratus', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Lie across bench, hold one DB overhead', 'Lower DB in arc behind head', 'Feel deep stretch at bottom', 'Pull back to start using chest and lats'], tip: 'Keep slight elbow bend — this is a stretch movement' },
  { name: 'Decline Push-Up', cat: 'strength', muscle: 'chest', primary: 'Lower Chest', secondary: 'Triceps', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '12–15', rest: 45, steps: ['Feet elevated on bench or chair', 'Hands on floor shoulder-width', 'Lower chest toward floor', 'Press back explosively'], tip: 'The angle shifts emphasis to lower pecs' },
  // ── Shoulders ──
  { name: 'Lateral Raises', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Dumbbell', level: 'beginner', sets: 4, reps: '12–15', rest: 60, steps: ['DBs at sides, slight elbow bend', 'Raise arms to shoulder height', 'Lead with elbows not wrists', 'Lower slowly over 2–3 seconds'], tip: 'Imagine pouring a glass of water at the top' },
  { name: 'Overhead Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, All Heads', secondary: 'Triceps, Upper Chest', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '8–10', rest: 90, steps: ['DBs at shoulder level, palms forward', 'Brace core, press straight overhead', 'Fully extend without flaring neck', 'Lower with control'], tip: 'Keep chin slightly tucked to avoid neck strain' },
  { name: 'Face Pulls', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rotator Cuff', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Cable at eye height, rope attachment', 'Pull toward face, elbows high and wide', 'Externally rotate at end — hands behind ears', 'Slow controlled return'], tip: 'Prioritise external rotation — this is shoulder health' },
  { name: 'Arnold Press', cat: 'strength', muscle: 'front-delt', primary: 'All Deltoid Heads', secondary: 'Triceps', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Start with DBs at chin, palms facing you', 'Rotate palms outward as you press up', 'Reach full extension overhead', 'Reverse the rotation on the way down'], tip: 'The rotation hits all three deltoid heads in one movement' },
  { name: 'Upright Row', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid, Traps', secondary: 'Biceps', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 60, steps: ['Grip bar shoulder-width, overhand', 'Pull bar up along body to chin level', 'Elbows flare out and up above wrists', 'Lower slowly with control'], tip: 'Keep the bar close to your body throughout' },
  { name: 'Reverse Flyes', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Hinge forward 45°, DBs hanging', 'Raise arms out to sides like wings', 'Squeeze rear delts at top', 'Lower under control — 3s eccentric'], tip: 'Light weight, high reps — rear delts are small muscles' },
  // ── Arms ──
  { name: 'Bicep Curls', cat: 'strength', muscle: 'arms', primary: 'Biceps Brachii', secondary: 'Brachialis', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–14', rest: 60, steps: ['DBs at sides, palms forward', 'Curl with control, no torso swing', 'Squeeze bicep at top for 1s', 'Lower fully to complete extension'], tip: 'Supinate the wrist as you curl for peak contraction' },
  { name: 'Skull Crushers', cat: 'strength', muscle: 'arms', primary: 'Triceps Long Head', secondary: 'Anconeus', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 60, steps: ['Lie on bench, bar over chest', 'Lower bar toward forehead bending only elbows', 'Keep upper arms stationary', 'Press back to start'], tip: 'Use lighter weight — long moment arm here' },
  { name: 'Hammer Curls', cat: 'strength', muscle: 'arms', primary: 'Brachialis', secondary: 'Brachioradialis', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12', rest: 60, steps: ['DBs at sides, neutral grip', 'Curl keeping grip neutral throughout', 'Squeeze at top', 'Lower fully with control'], tip: 'Don\'t rotate the wrist — neutral all the way through' },
  { name: 'Tricep Pushdown', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Anconeus', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Stand at cable machine, rope at top', 'Elbows fixed at sides', 'Push rope down, flare hands at bottom', 'Slow return to 90° elbow angle'], tip: 'Lock elbows in place — only forearms should move' },
  { name: 'Preacher Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Lower Head', secondary: 'Brachialis', equip: 'Machine', level: 'intermediate', sets: 3, reps: '10–12', rest: 60, steps: ['Seated at preacher bench, arms over pad', 'Lower to near full extension slowly', 'Curl up squeezing bicep hard', 'No momentum — full ROM every rep'], tip: 'The pad prevents cheating — use it to your advantage' },
  { name: 'Close-Grip Bench Press', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Chest', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '8–10', rest: 75, steps: ['Grip bar shoulder-width or slightly inside', 'Lower bar to lower chest', 'Elbows stay close to torso', 'Press explosively to lockout'], tip: 'Elbows tucked in is key — flaring is a shoulder injury waiting to happen' },
  { name: 'Concentration Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Peak', secondary: 'Brachialis', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Seated, elbow on inner thigh', 'Curl the DB slowly to shoulder', 'Squeeze hard at top for 2s', 'Lower all the way, full extension'], tip: 'Slow and controlled — this is an isolation movement' },
  // ── Back ──
  { name: 'Pull-Ups', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Biceps, Rear Deltoid', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '6–10', rest: 90, steps: ['Hang overhand, slightly wider than shoulders', 'Depress scapulae before pulling', 'Drive elbows down and back', 'Chin clears bar; fully extend at bottom'], tip: 'Initiate by "bending the bar" — external rotation helps' },
  { name: 'Barbell Row', cat: 'strength', muscle: 'back', primary: 'Lats, Rhomboids', secondary: 'Biceps, Rear Deltoid', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '8–10', rest: 90, steps: ['Hinge at hips, back at 45°, bar hanging', 'Row to lower sternum — lead with elbows', 'Squeeze shoulder blades at top', 'Lower under control; full extension at bottom'], tip: 'Think "tuck elbows tight" — flaring loses lat engagement' },
  { name: 'Deadlift', cat: 'strength', muscle: 'back', primary: 'Erector Spinae', secondary: 'Hamstrings, Glutes, Lats', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '5–8', rest: 120, steps: ['Bar over mid-foot, hip-width stance', 'Hinge at hips — chest up, neutral spine', 'Push the floor away, lock hips and shoulders', 'Lower with control; don\'t drop the weight'], tip: 'Think "leg press the earth" not "pull the bar up"' },
  { name: 'Lat Pulldown', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Biceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Seated, wide overhand grip', 'Lean back 15°, pull bar to upper chest', 'Squeeze lats at bottom of pull', 'Control return to full arm extension'], tip: 'Drive elbows into pockets — not "pull with hands"' },
  { name: 'Seated Cable Row', cat: 'strength', muscle: 'back', primary: 'Mid-Back, Rhomboids', secondary: 'Biceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Seated, feet on platform, slight knee bend', 'Pull handle to lower abdomen', 'Elbows back, chest up, squeeze shoulder blades', 'Control return, let shoulder blades protract fully'], tip: 'The full stretch at the front is as important as the squeeze at the back' },
  { name: 'Single Arm DB Row', cat: 'strength', muscle: 'back', primary: 'Lats, Rhomboids', secondary: 'Biceps, Rear Delt', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12 each', rest: 60, steps: ['Place hand and knee on bench', 'DB hanging from free arm', 'Row elbow back and up, toward hip', 'Lower fully — full lat stretch at bottom'], tip: 'Don\'t rotate the torso — keep hips square' },
  { name: 'T-Bar Row', cat: 'strength', muscle: 'back', primary: 'Mid-Back, Lats', secondary: 'Biceps, Rear Delt', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '8–10', rest: 90, steps: ['Straddle loaded barbell end', 'Hinge forward 45°, grip close', 'Row to lower chest, elbows tight', 'Full extension at bottom every rep'], tip: 'Great for mid-back thickness — use a V-handle for better range' },
  { name: 'Inverted Row', cat: 'strength', muscle: 'back', primary: 'Mid-Back, Rhomboids', secondary: 'Biceps', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10–15', rest: 60, steps: ['Bar at hip height, hang underneath', 'Body straight from head to heels', 'Pull chest to bar, elbows out', 'Lower under control — straight body throughout'], tip: 'Make it harder by raising feet; easier by bending knees' },
  // ── Legs ──
  { name: 'Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes, Hamstrings', equip: 'Barbell', level: 'beginner', sets: 4, reps: '6–10', rest: 120, steps: ['Bar on upper traps, feet shoulder-width', 'Brace core, hinge at hips and knees', 'Descend until thighs parallel or below', 'Drive through heels back to lockout'], tip: 'Knees track over toes — don\'t let them cave inward' },
  { name: 'Romanian Deadlift', cat: 'strength', muscle: 'legs', primary: 'Hamstrings', secondary: 'Glutes, Erectors', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '8–12', rest: 90, steps: ['Stand with bar at hip height, overhand grip', 'Push hips back, bar close to legs', 'Feel deep hamstring stretch at bottom', 'Drive hips forward to standing'], tip: 'Soft bend at knees — this is a hinge, not a squat' },
  { name: 'Leg Press', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes, Hamstrings', equip: 'Machine', level: 'beginner', sets: 3, reps: '10–15', rest: 90, steps: ['Feet shoulder-width at mid-plate', 'Lower platform to 90° knee angle', 'Press through heels explosively', 'Don\'t lock knees fully at top'], tip: 'Foot placement changes emphasis — higher = more glute' },
  { name: 'Bulgarian Split Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Hamstrings, Core', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '8–10 each', rest: 90, steps: ['Rear foot on bench, front foot far forward', 'Lower back knee toward floor', 'Keep torso upright, chest proud', 'Drive through front heel to rise'], tip: 'This is the king of unilateral leg exercises — humbling weight is normal' },
  { name: 'Leg Curl', cat: 'strength', muscle: 'legs', primary: 'Hamstrings', secondary: 'Gastrocnemius', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Lie face-down on machine, pads behind ankles', 'Curl heels toward glutes', 'Squeeze hamstrings hard at top', 'Lower slowly — 3s eccentric'], tip: 'Point toes slightly to change hamstring head emphasis' },
  { name: 'Hip Thrust', cat: 'strength', muscle: 'legs', primary: 'Glutes', secondary: 'Hamstrings, Core', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '10–15', rest: 75, steps: ['Upper back on bench, bar across hips', 'Feet flat, shoulder-width', 'Drive hips to full extension at top', 'Lower slowly, don\'t let hips touch floor between reps'], tip: 'Squeeze glutes hard at lockout for 1s — you should feel it in your rear, not your lower back' },
  { name: 'Walking Lunges', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Hamstrings', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12 each', rest: 75, steps: ['DBs at sides, stand tall', 'Step forward, lower back knee near floor', 'Push off front foot, step through with other leg', 'Alternate for prescribed reps'], tip: 'Long stride = more glute; short stride = more quad' },
  { name: 'Goblet Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes, Core', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Hold DB vertically at chest', 'Feet shoulder-width, toes out slightly', 'Squat deep, elbows track inside knees', 'Drive up through heels'], tip: 'Great for learning squat depth — the weight acts as a counterbalance' },
  { name: 'Calf Raises', cat: 'strength', muscle: 'legs', primary: 'Gastrocnemius', secondary: 'Soleus', equip: 'Bodyweight', level: 'beginner', sets: 4, reps: '15–20', rest: 30, steps: ['Stand on edge of step, heels off', 'Lower heels below step level slowly', 'Rise onto balls of feet, full extension', 'Hold 1s at top, lower for 3s'], tip: 'Full stretch at bottom is more important than the contraction at top' },
  { name: 'Hack Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes', equip: 'Machine', level: 'intermediate', sets: 3, reps: '10–12', rest: 90, steps: ['Shoulders under pads, feet on plate', 'Release safety, lower until 90° at knee', 'Drive through feet explosively', 'Don\'t lock out fully at top'], tip: 'Feet low on the plate = more quad emphasis' },
  // ── Core ──
  { name: 'Plank', cat: 'strength', muscle: 'core', primary: 'Transverse Abdominis', secondary: 'Rectus Abdominis, Glutes', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '45–60s', rest: 45, steps: ['Forearms on floor, elbows under shoulders', 'Body in straight line head to heels', 'Squeeze glutes and brace abs hard', 'Breathe steadily — never hold breath'], tip: 'Imagine someone about to punch your gut — that\'s your brace' },
  { name: 'Leg Raises', cat: 'strength', muscle: 'core', primary: 'Lower Abs', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Lie flat, hands under lower back', 'Keep legs together and straight', 'Raise to 90°, lower slowly without floor contact', 'Control descent — no swinging'], tip: 'Exhale on the way up — activates deep abs more effectively' },
  { name: 'Cable Crunch', cat: 'strength', muscle: 'core', primary: 'Rectus Abdominis', secondary: 'Obliques', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Kneel facing cable, rope at head level', 'Flex spine — chin to chest, elbows toward knees', 'Crunch hard, squeeze abs at bottom', 'Return slowly, don\'t just let weight pull you back'], tip: 'The movement is spinal flexion, not hip flexion — focus on crunching your ribs to your pelvis' },
  { name: 'Russian Twists', cat: 'strength', muscle: 'core', primary: 'Obliques', secondary: 'Transverse Abdominis', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '20 total', rest: 45, steps: ['Seated, lean back 45°, feet off floor', 'Hold DB or weight at chest', 'Rotate torso side to side', 'Each touch = one rep'], tip: 'Slow it down — twisting fast with momentum does nothing' },
  { name: 'Ab Wheel Rollout', cat: 'strength', muscle: 'core', primary: 'Entire Core', secondary: 'Lats, Shoulders', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '8–12', rest: 60, steps: ['Kneel with wheel on floor', 'Roll forward slowly, back flat', 'Go as far as you can without back sagging', 'Pull back using abs — not arms'], tip: 'This is one of the hardest core exercises — master the plank first' },
  { name: 'Dead Bug', cat: 'strength', muscle: 'core', primary: 'Transverse Abdominis', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10 each side', rest: 45, steps: ['Lie on back, arms to ceiling, knees at 90°', 'Lower opposite arm and leg toward floor simultaneously', 'Lower back stays pressed into floor the whole time', 'Return and repeat other side'], tip: 'If your lower back arches, you\'ve gone too far — shorten the range' },
  { name: 'Side Plank', cat: 'strength', muscle: 'core', primary: 'Obliques', secondary: 'Glute Medius', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '30–45s each', rest: 30, steps: ['Forearm on ground, body straight sideways', 'Stack feet or stagger for stability', 'Don\'t let hips sag', 'Hold and breathe steadily'], tip: 'Top hand on hip for balance; raise it for extra challenge' },
  // ── Resistance Bands ──
  { name: 'Band Pull-Apart', cat: 'bands', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Hold band at chest height, arms extended', 'Pull band apart until arms outstretched', 'Squeeze shoulder blades at end range', 'Return with control — keep tension throughout'], tip: 'Use light band — this is about volume and mind-muscle' },
  { name: 'Banded Hip Thrust', cat: 'bands', muscle: 'legs', primary: 'Glutes', secondary: 'Hamstrings', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Band across hips, upper back on bench', 'Feet flat, shoulder-width', 'Drive hips up, squeeze glutes at top', 'Lower slowly — full hip extension at top'], tip: 'Push knees out against band to maximise glute activation' },
  { name: 'Band Face Pull', cat: 'bands', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rotator Cuff', equip: 'Band', level: 'beginner', sets: 3, reps: '20', rest: 30, steps: ['Anchor band at eye level', 'Hold both ends, palms in', 'Pull toward face, elbows flaring high', 'Externally rotate at end — "double bicep" pose'], tip: 'The #1 shoulder health exercise — do it daily' },
  { name: 'Banded Row', cat: 'bands', muscle: 'back', primary: 'Rhomboids', secondary: 'Biceps', equip: 'Band', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Anchor band at chest height, step back for tension', 'Hold ends with neutral grip', 'Row elbows behind torso, squeezing scapulae', 'Slow 3s return to full arm extension'], tip: 'Anchor lower = more lat; anchor higher = more rhomboid' },
  { name: 'Lateral Band Walk', cat: 'bands', muscle: 'legs', primary: 'Glute Medius', secondary: 'Abductors', equip: 'Band', level: 'beginner', sets: 3, reps: '15 each', rest: 30, steps: ['Band around ankles or above knees, slight squat', 'Step sideways maintaining tension', 'Keep feet parallel — don\'t let toes turn out', 'Return same direction, complete the set'], tip: 'Stay low — rising up kills glute activation' },
  { name: 'Banded Bicep Curl', cat: 'bands', muscle: 'arms', primary: 'Biceps', secondary: 'Forearms', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Stand on band, hold ends palms forward', 'Curl both arms simultaneously', 'Squeeze at top, fully extend at bottom', 'Control — don\'t let it snap back'], tip: 'Step wider for more resistance, narrower for less' },
  // ── Yoga ──
  { name: 'Downward Dog', cat: 'yoga', muscle: 'core', primary: 'Hamstrings, Calves', secondary: 'Shoulders, Spine', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '5–8 breaths', rest: 0, steps: ['Start on hands and knees, wrists under shoulders', 'Tuck toes and lift hips to ceiling, inverted V', 'Press heels toward floor, straighten legs', 'Relax head between arms, breathe deeply'], tip: 'Pedal the feet alternately to warm up the hamstrings' },
  { name: 'Warrior I', cat: 'yoga', muscle: 'legs', primary: 'Hip Flexors, Quads', secondary: 'Core, Shoulders', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '5 breaths each', rest: 0, steps: ['Step one foot forward into a lunge, back foot at 45°', 'Front knee over ankle — don\'t let it cave in', 'Raise arms overhead', 'Square hips forward, breathe into the stretch'], tip: 'Micro-bend the back knee to protect the joint' },
  { name: 'Pigeon Pose', cat: 'yoga', muscle: 'legs', primary: 'Hip Flexors, Piriformis', secondary: 'Glutes, IT Band', equip: 'Bodyweight', level: 'intermediate', sets: 1, reps: '8–10 breaths', rest: 0, steps: ['From downward dog, bring one knee toward same-side wrist', 'Extend back leg straight behind you', 'Lower hips toward floor', 'Fold forward over front shin, breathe deeply'], tip: 'Hips should be level — use a folded blanket if one side lifts' },
  { name: 'Cat-Cow', cat: 'yoga', muscle: 'core', primary: 'Erector Spinae', secondary: 'Abdominals', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '10 cycles', rest: 0, steps: ['On hands and knees, spine neutral', 'Inhale: drop belly, lift tailbone and chest (Cow)', 'Exhale: round spine to ceiling, tuck chin and pelvis (Cat)', 'Move fluidly with breath'], tip: 'The gentlest, most therapeutic back exercise that exists' },
  { name: 'Bridge Pose', cat: 'yoga', muscle: 'legs', primary: 'Glutes', secondary: 'Hamstrings, Core', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '8–10 breaths', rest: 0, steps: ['Lie on back, knees bent, feet flat', 'Press feet into floor, lift hips to ceiling', 'Clasp hands beneath pelvis', 'Hold — breathe into chest and spine'], tip: 'A softer alternative to hip thrust; great after leg day' },
  { name: "Child's Pose", cat: 'yoga', muscle: 'core', primary: 'Lower Back', secondary: 'Hips, Shoulders', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '10–15 breaths', rest: 0, steps: ['Kneel, big toes touching, knees wide', 'Sit hips back onto heels, walk hands forward', 'Rest forehead on floor, arms long', 'Breathe into lower back — let it expand on each inhale'], tip: 'The universal rest position — use it between hard sets too' },
  // ── Stretches ──
  { name: 'Hip Flexor Stretch', cat: 'stretch', muscle: 'legs', primary: 'Iliopsoas', secondary: 'Rectus Femoris', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '30–45s each', rest: 0, steps: ['Kneel on one knee in a lunge', 'Shift hips forward until stretch felt at front of back leg', 'Keep torso upright, core braced', 'Hold, breathe, deepen with each exhale'], tip: 'Squeeze the glute of the kneeling leg — this increases the stretch' },
  { name: 'Doorway Chest Stretch', cat: 'stretch', muscle: 'chest', primary: 'Pectorals', secondary: 'Anterior Deltoid', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '30s each', rest: 0, steps: ['Stand in doorway, forearm against frame at 90°', 'Step through to open the chest', 'Rotate body away from the arm', 'Hold — vary height to hit different chest fibres'], tip: 'Low angle = lower chest; high arm = upper chest' },
  { name: 'Thoracic Rotation', cat: 'stretch', muscle: 'back', primary: 'Thoracic Spine', secondary: 'Lats, Obliques', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '10 each side', rest: 0, steps: ['Sit cross-legged, spine tall', 'Place one hand behind head, elbow out', 'Rotate that elbow toward ceiling', 'Return slowly; no momentum'], tip: 'Critical if you sit at a desk all day' },
  { name: 'Seated Hamstring Stretch', cat: 'stretch', muscle: 'legs', primary: 'Hamstrings', secondary: 'Calves, Lower Back', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '40s each', rest: 0, steps: ['Sit on floor, one leg extended straight', 'Flex foot of extended leg toward you', 'Hinge forward from the hip, reach toward foot', 'Hold at ankle, shin, or foot — wherever you can reach'], tip: 'Flex the foot for a deeper stretch through the calf too' },
  { name: 'Glute Figure-4 Stretch', cat: 'stretch', muscle: 'legs', primary: 'Glutes, Piriformis', secondary: 'Hip Rotators', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '40s each', rest: 0, steps: ['Lie on back, knees bent', 'Cross one ankle over opposite knee (figure-4)', 'Grasp behind bottom thigh, pull both legs toward chest', 'Keep active foot flexed to protect the knee'], tip: 'Push the knee of the crossed leg away with your elbow to deepen' },
  // ── Recovery ──
  { name: 'Foam Roll — Quads', cat: 'recovery', muscle: 'legs', primary: 'Quadriceps', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '60–90s each', rest: 0, steps: ['Lie face-down, roller under one quad', 'Support on forearms and opposite leg', 'Roll from just above knee to hip crease', 'Pause on tender spots for 10–20s'], tip: 'Stack legs for more intensity; cross them for less' },
  { name: 'Foam Roll — Lats', cat: 'recovery', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Teres Major', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '60s each', rest: 0, steps: ['Lie on side, roller under armpit area', 'Arm overhead, palm facing up', 'Roll slowly down side of back to hip', 'Rotate slightly forward/back to hit all fibres'], tip: 'Unlocks overhead pressing after heavy pulling sessions' },
  { name: 'Spiderman Lunge', cat: 'recovery', muscle: 'legs', primary: 'Hip Flexors', secondary: 'Thoracic Spine, Hamstrings', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '5 each side', rest: 30, steps: ['Start in push-up position', 'Step one foot outside same-side hand', 'Drop hips, hold 2s', 'Add thoracic rotation: reach same-side arm to ceiling'], tip: 'One of the best full-body warm-up movements that exists' },
  { name: 'Diaphragmatic Breathing', cat: 'recovery', muscle: 'core', primary: 'Diaphragm', secondary: 'Parasympathetic NS', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '5–10 min', rest: 0, steps: ['Lie on back, knees bent, hands on belly and chest', 'Inhale through nose 4 counts — belly rises, chest doesn\'t', 'Hold 1 count', 'Exhale through mouth for 6–8 counts'], tip: 'Box breathing (4-4-4-4) activates the vagus nerve and reduces cortisol' },
  // ── Rehab / Low Intensity ──
  { name: 'Wall Angels', cat: 'rehab', muscle: 'rear-delt', primary: 'Rotator Cuff', secondary: 'Lower Traps, Serratus', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10', rest: 30, steps: ['Stand with back flat against wall', 'Arms at 90° like a goalpost, backs of hands on wall', 'Slide arms overhead, maintaining wall contact throughout', 'Return slowly'], tip: 'If you can\'t keep contact with the wall, reduce range — this reveals shoulder mobility deficits' },
  { name: 'Clamshells', cat: 'rehab', muscle: 'legs', primary: 'Glute Medius', secondary: 'Hip External Rotators', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15 each', rest: 30, steps: ['Lie on side, hips and knees bent to 90°', 'Keep feet together, rotate top knee toward ceiling', 'Stop when pelvis starts to move', 'Lower slowly'], tip: 'Add a band above knees to increase resistance as you progress' },
  { name: 'Terminal Knee Extension', cat: 'rehab', muscle: 'legs', primary: 'VMO (Inner Quad)', secondary: 'Knee Stabilisers', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Band around back of knee, anchored in front', 'Stand with slight knee bend', 'Straighten knee against band resistance', 'Control return — don\'t snap into hyperextension'], tip: 'Essential for knee rehabilitation and prevention — especially post ACL issues' },
  { name: 'Bird Dog', cat: 'rehab', muscle: 'core', primary: 'Erector Spinae', secondary: 'Glutes, Core', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10 each side', rest: 30, steps: ['Start on hands and knees, spine neutral', 'Extend opposite arm and leg simultaneously', 'Keep hips level — don\'t rotate', 'Hold 2s, return with control'], tip: 'Imagine balancing a glass of water on your lower back' },
  { name: 'Prone Y-T-W', cat: 'rehab', muscle: 'rear-delt', primary: 'Lower Traps, Rhomboids', secondary: 'Rotator Cuff', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10 each', rest: 30, steps: ['Lie face-down, arms in Y shape overhead', 'Raise arms slightly off ground, thumbs up', 'Hold 2s, lower — then repeat in T, then W shape', 'Each letter targets different back/shoulder muscles'], tip: 'No weight needed — these are tiny muscles that need high-rep activation' },
  { name: 'Glute Bridge', cat: 'rehab', muscle: 'legs', primary: 'Glutes', secondary: 'Hamstrings', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Lie on back, knees bent, feet flat', 'Push through heels to lift hips', 'Squeeze glutes at top, hold 2s', 'Lower slowly — don\'t let hips touch floor between reps'], tip: 'Great starting point before progressing to weighted hip thrusts' },

  // ════════════════════════════════════════════════════════════════════
  // ── ADVANCED STRENGTH — Chest ──
  { name: 'Weighted Dips', cat: 'strength', muscle: 'chest', primary: 'Lower Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '6–10', rest: 120, steps: ['Attach weight via belt or hold DB between legs', 'Grip parallel bars, slight forward lean for chest emphasis', 'Lower until upper arms are parallel — full depth', 'Press explosively through heels of palms to lockout'], tip: 'Forward lean is non-negotiable — upright dips hit triceps, not chest' },
  { name: 'Ring Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest, Core', secondary: 'Serratus, Triceps', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '8–15', rest: 90, steps: ['Set rings low to the ground, hold with neutral grip', 'Lower chest between rings, allow rings to flare outward naturally', 'At bottom, actively pull rings apart — huge chest activation', 'Press back up, rings pronate at top'], tip: 'The instability doubles the pec demand — every stabiliser fires' },
  { name: 'Planche Lean Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest, Anterior Deltoid', secondary: 'Core, Triceps', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '6–8', rest: 120, steps: ['In push-up position, shift bodyweight forward over hands', 'Hands angled outward slightly, fingers forward', 'Lower with extreme forward lean so chest goes past hands', 'Push back — maintaining the forward shift throughout'], tip: 'This is a planche prerequisite — trains the brutal shoulder-chest line' },
  { name: 'Deficit Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '10–15', rest: 75, steps: ['Place hands on elevated surfaces — dumbbells, books, parallettes', 'Lower chest below hand level for greater ROM', 'Feel the deep pec stretch at bottom — pause 1s', 'Explode back to top'], tip: 'Greater range of motion = greater muscle damage = more growth' },

  // ── ADVANCED STRENGTH — Back ──
  { name: 'Weighted Pull-Up', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Biceps, Rhomboids', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '5–8', rest: 120, steps: ['Attach weight via belt, vest, or hold DB between legs', 'Dead hang, retract scapulae before initiating pull', 'Drive elbows to hips — chest to bar', 'Lower under control — full extension at bottom'], tip: 'Add weight only when bodyweight pull-ups are genuinely easy — form first always' },
  { name: 'Chest-to-Bar Pull-Up', cat: 'strength', muscle: 'back', primary: 'Lats, Upper Back', secondary: 'Biceps, Core', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '5–8', rest: 120, steps: ['Wide overhand grip, dead hang', 'Explosive pull — aim to bring chest, not chin, to bar', 'Drive elbows back and down aggressively at top', 'Controlled descent, full hang between reps'], tip: 'This is a gymnastic-level pull — requires exceptional lat strength and elbow drive' },
  { name: 'Rack Pull', cat: 'strength', muscle: 'back', primary: 'Erector Spinae, Upper Back', secondary: 'Traps, Glutes', equip: 'Barbell', level: 'advanced', sets: 4, reps: '4–6', rest: 150, steps: ['Set bar in rack at knee height', 'Conventional deadlift grip — overhand or mixed', 'Pull bar from pins to full hip lockout', 'Lower under control to pins — no dropping'], tip: 'Allows heavier-than-deadlift loading — builds upper back and lockout strength' },
  { name: 'Pendlay Row', cat: 'strength', muscle: 'back', primary: 'Rhomboids, Lats', secondary: 'Biceps, Rear Deltoid', equip: 'Barbell', level: 'advanced', sets: 4, reps: '5–8', rest: 120, steps: ['Bar starts on the floor each rep — unlike Barbell Row', 'Hinge to nearly horizontal torso', 'Explosively row bar to lower sternum', 'Lower bar all the way to floor — dead stop every rep'], tip: 'The dead stop kills momentum — every rep is honest' },
  { name: 'Meadows Row', cat: 'strength', muscle: 'back', primary: 'Lats, Teres Major', secondary: 'Rear Deltoid, Biceps', equip: 'Barbell', level: 'advanced', sets: 3, reps: '8–12 each', rest: 90, steps: ['Bar in corner of room or landmine attachment', 'Staggered stance beside bar, reach down with outside hand', 'Row bar to hip — extreme elbow flare backward', 'Massive lat stretch at bottom — full range only'], tip: 'John Meadows invented this; it gives a lat stretch no cable row can match' },

  // ── ADVANCED STRENGTH — Shoulders ──
  { name: 'Handstand Push-Up', cat: 'strength', muscle: 'front-delt', primary: 'Anterior & Medial Deltoid', secondary: 'Triceps, Upper Traps', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '5–10', rest: 120, steps: ['Kick up to wall handstand, hands shoulder-width', 'Lower head toward floor — controlled, not fast', 'At bottom (head touches), press explosively to lockout', 'Keep core braced — no banana back'], tip: 'Arguably the hardest pressing movement available — builds bulletproof shoulders' },
  { name: 'Pike Push-Up', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Triceps, Upper Traps', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '10–15', rest: 90, steps: ['Inverted-V position — hips high, hands and feet on floor', 'Walk feet in to make the angle steeper', 'Lower crown of head toward floor', 'Press back to inverted-V — don\'t let hips drop'], tip: 'The precursor to handstand push-ups — master this first' },
  { name: 'Barbell Z-Press', cat: 'strength', muscle: 'front-delt', primary: 'Deltoids', secondary: 'Core, Triceps', equip: 'Barbell', level: 'advanced', sets: 3, reps: '6–8', rest: 120, steps: ['Sit on floor with legs straight, no back support', 'Bar held at shoulder level in front rack position', 'Press straight overhead to full lockout', 'Lower under control — no hip lean'], tip: 'No back to lean against = zero momentum = pure deltoid strength' },
  { name: 'Behind-the-Neck Press', cat: 'strength', muscle: 'lateral-delt', primary: 'Medial & Posterior Deltoid', secondary: 'Traps, Triceps', equip: 'Barbell', level: 'advanced', sets: 3, reps: '8–10', rest: 90, steps: ['Bar on upper traps, snatch-width grip', 'Press to full overhead lockout', 'Lower behind head to ears level — not lower', 'Strict form only — never use with shoulder issues'], tip: 'Exceptional medial and rear delt builder — but demands excellent shoulder mobility' },

  // ── ADVANCED STRENGTH — Arms ──
  { name: 'Barbell Drag Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Long Head', secondary: 'Brachialis', equip: 'Barbell', level: 'advanced', sets: 3, reps: '8–12', rest: 75, steps: ['Stand with barbell, supinated grip', 'Instead of curling forward, drag bar up your torso — elbows go back', 'Keep bar in contact with body throughout the ascent', 'Lower dragging the bar back down the same path'], tip: 'Elbows going backward shifts stress entirely to the long head — massive peak builder' },
  { name: 'Incline DB Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Long Head', secondary: 'Brachialis', equip: 'Dumbbell', level: 'advanced', sets: 3, reps: '10–12', rest: 75, steps: ['Sit on incline bench, arms hanging behind torso', 'Curl from full stretch — do not swing arms forward', 'Supinate hard at top, squeeze for 2s', 'Lower all the way — the stretch is the point'], tip: 'The incline creates a stretch position no standing curl can replicate' },
  { name: 'EZ-Bar Skull Crusher', cat: 'strength', muscle: 'arms', primary: 'Triceps All Heads', secondary: 'Anconeus', equip: 'Barbell', level: 'advanced', sets: 4, reps: '8–10', rest: 90, steps: ['Lie on bench, EZ-bar held over face', 'Lower bar to forehead OR behind head for more stretch', 'Keep upper arms vertical throughout', 'Explode back to lockout — controlled, powerful'], tip: 'Lower behind the head for greater long head stretch than to the forehead' },
  { name: 'Reverse Curl', cat: 'strength', muscle: 'arms', primary: 'Brachioradialis', secondary: 'Biceps, Forearms', equip: 'Barbell', level: 'advanced', sets: 3, reps: '10–12', rest: 60, steps: ['Overhand grip on bar — pronated, not supinated', 'Curl normally — wrists stay straight, don\'t break', 'Squeeze at top, lower fully', 'Control the eccentric — forearms burn here'], tip: 'The single best forearm builder; most people never train brachioradialis' },
  { name: 'Cable Overhead Tricep Extension', cat: 'strength', muscle: 'arms', primary: 'Triceps Long Head', secondary: 'Anconeus', equip: 'Machine', level: 'advanced', sets: 3, reps: '12–15', rest: 60, steps: ['Face away from cable, rope held behind head', 'Elbows up beside ears — do not let them flare out', 'Extend arms forward and overhead to full lockout', 'Return slowly — feel the long head stretch'], tip: 'Overhead position maximises long head stretch — the biggest tricep head' },

  // ── ADVANCED STRENGTH — Legs ──
  { name: 'Front Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Core, Upper Back', equip: 'Barbell', level: 'advanced', sets: 4, reps: '5–8', rest: 120, steps: ['Bar rests on front deltoids, elbows forward and high', 'Grip with clean grip or cross-arm — elbows must stay up', 'Squat to full depth — torso stays upright the entire time', 'Drive elbows up as you rise to prevent bar drifting forward'], tip: 'More upright torso than back squat = more quad, less lower back' },
  { name: 'Pause Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Core', equip: 'Barbell', level: 'advanced', sets: 4, reps: '4–6', rest: 150, steps: ['Set up as a normal back squat', 'Descend to full depth, pause for 3 seconds at the bottom', 'Completely eliminate the stretch reflex — no bouncing', 'Grind back up to lockout under raw strength'], tip: 'Pausing at the bottom exposes every weakness in your squat — humbling weight is normal' },
  { name: 'Sumo Deadlift', cat: 'strength', muscle: 'legs', primary: 'Glutes, Adductors', secondary: 'Hamstrings, Quads', equip: 'Barbell', level: 'advanced', sets: 4, reps: '4–6', rest: 150, steps: ['Wide stance, toes flared out 45°+, hands inside legs', 'Hinge down, grip bar, chest proud', 'Push the floor out and away — hips and bar rise together', 'Lock out hips powerfully at top'], tip: 'More adductor and glute demand than conventional; shorter ROM for most body types' },
  { name: 'Pistol Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Hamstrings, Core, Balance', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '5–8 each', rest: 120, steps: ['Stand on one leg, other leg extended forward', 'Slowly lower yourself on one leg — arms forward for balance', 'Go as low as possible — ideally hamstring to calf', 'Drive through heel to stand — use full control'], tip: 'One of the most impressive feats of strength and mobility combined' },
  { name: 'Nordic Hamstring Curl', cat: 'strength', muscle: 'legs', primary: 'Hamstrings Eccentric', secondary: 'Glutes, Core', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '5–8', rest: 120, steps: ['Kneel, feet anchored under a bar or by a partner', 'Lean forward slowly, lowering torso to floor — only the hamstrings resist', 'Go as far as you can under control before catching yourself', 'Push back up with hands if needed, return under hamstring power'], tip: 'Studies show this reduces hamstring injury risk by 50%+ — elite-level hamstring strengthener' },
  { name: 'Single-Leg Romanian Deadlift', cat: 'strength', muscle: 'legs', primary: 'Hamstrings, Glutes', secondary: 'Core, Balance', equip: 'Dumbbell', level: 'advanced', sets: 3, reps: '8–10 each', rest: 90, steps: ['Stand on one leg, DB in opposite hand or both hands', 'Hinge at hip, extend back leg behind you for counterbalance', 'Lower until DB reaches shin level — back flat throughout', 'Drive hip forward to return to standing'], tip: 'Develops unilateral hamstring strength and hip stability simultaneously' },
  { name: 'Hack Squat (Barbell)', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes', equip: 'Barbell', level: 'advanced', sets: 4, reps: '8–10', rest: 90, steps: ['Bar behind legs on the floor, narrow stance', 'Grip bar behind knees, squat down to pick it up', 'Stand up to lockout — bar drags up the back of the legs', 'Lower with control'], tip: 'An old-school bodybuilding move that sculpts the teardrop quad' },

  // ── ADVANCED STRENGTH — Core ──
  { name: 'Dragon Flag', cat: 'strength', muscle: 'core', primary: 'Entire Anterior Chain', secondary: 'Lats, Glutes', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '5–8', rest: 120, steps: ['Lie on bench, grip edge behind head with both hands', 'Keep body rigid and straight, raise legs to vertical', 'Lower entire body slowly, hovering just above bench', 'Only shoulders remain in contact — hold position, then repeat'], tip: 'Bruce Lee\'s signature core exercise — requires full-body tension and elite core strength' },
  { name: 'Hollow Body Hold', cat: 'strength', muscle: 'core', primary: 'Transverse Abdominis, Hip Flexors', secondary: 'Lats, Glutes', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '30–45s', rest: 60, steps: ['Lie on back, arms overhead, legs together', 'Press lower back hard into floor — it must not lift', 'Raise arms, shoulders, and legs off floor simultaneously', 'Hold — lower back stays down the entire time'], tip: 'The foundation of all gymnastic core strength — harder than it looks' },
  { name: 'L-Sit', cat: 'strength', muscle: 'core', primary: 'Hip Flexors, Core', secondary: 'Triceps, Lats', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '10–30s', rest: 90, steps: ['Support on parallettes, dip bars, or push-up handles', 'Lift straight legs to parallel, toes pointed', 'Compress abs hard — legs must not sag', 'Hold the position with a rigid, compressed body'], tip: 'Even 10s is impressive — build in 5-second increments' },
  { name: 'Weighted Pallof Press', cat: 'strength', muscle: 'core', primary: 'Anti-Rotation Core', secondary: 'Obliques, Transverse Abdominis', equip: 'Machine', level: 'advanced', sets: 3, reps: '12–15 each', rest: 60, steps: ['Stand perpendicular to cable machine, pull handle to chest', 'Press arms straight out in front of you', 'Hold 2s — resist the cable pulling you sideways', 'Return to chest slowly'], tip: 'Anti-rotation work is what makes core strength transfer to real life and sport' },
  { name: 'Hanging Windshield Wiper', cat: 'strength', muscle: 'core', primary: 'Obliques, Hip Flexors', secondary: 'Lats, Grip', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '6–10', rest: 90, steps: ['Hang from bar, raise legs to horizontal', 'Rotate legs side to side like a windshield wiper', 'Keep upper body and bar position completely still', 'Control every degree of rotation — no swinging'], tip: 'Combines incredible core rotation strength with grip and lat endurance' },

  // ── ADVANCED — Bands ──
  { name: 'Banded Deadlift', cat: 'bands', muscle: 'back', primary: 'Entire Posterior Chain', secondary: 'Core', equip: 'Band', level: 'advanced', sets: 4, reps: '5–6', rest: 120, steps: ['Loop bands around the bar and under your feet', 'Set up as a conventional deadlift', 'The band resistance increases as you rise — hardest at lockout', 'Control descent — bands pull bar down faster'], tip: 'Accommodating resistance trains the lockout specifically — great for sticking points' },
  { name: 'Banded Bench Press', cat: 'bands', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Band', level: 'advanced', sets: 4, reps: '5–6', rest: 120, steps: ['Loop bands around bar and under bench', 'Press as usual — peak resistance at lockout', 'Control descent with the bands pulling bar down', 'Teaches explosiveness through the full ROM'], tip: 'Forces you to accelerate through the entire press — develops rate of force development' },
  { name: 'Band Resisted Sprint', cat: 'bands', muscle: 'legs', primary: 'Glutes, Hamstrings', secondary: 'Core, Calves', equip: 'Band', level: 'advanced', sets: 5, reps: '20m sprints', rest: 90, steps: ['Partner holds band looped around your waist from behind', 'Sprint forward against band resistance', 'Drive knees high, pump arms aggressively', 'Return to start, reset, repeat'], tip: 'Develops explosive hip extension force that no gym exercise can replicate' },

  // ── ADVANCED — Yoga ──
  { name: 'Crow Pose', cat: 'yoga', muscle: 'core', primary: 'Core, Wrist Flexors', secondary: 'Hip Flexors, Triceps', equip: 'Bodyweight', level: 'advanced', sets: 1, reps: '3–5 holds of 10–30s', rest: 30, steps: ['Squat low, place palms flat on floor, shoulder-width', 'Place knees on backs of upper arms, just above elbows', 'Shift weight forward gradually until feet lift', 'Balance on hands — gaze forward, not down'], tip: 'Look forward not down — eyes lead, balance follows' },
  { name: 'Wheel Pose', cat: 'yoga', muscle: 'core', primary: 'Spine, Hip Flexors', secondary: 'Shoulders, Glutes, Wrists', equip: 'Bodyweight', level: 'advanced', sets: 1, reps: '3 holds of 20–30s', rest: 30, steps: ['Lie on back, knees bent, feet close to hips', 'Place hands beside ears, fingers pointing toward feet', 'Press hands and feet into floor simultaneously', 'Extend arms and legs — lift body into full backbend'], tip: 'Requires excellent shoulder mobility — never force this with tight shoulders' },
  { name: 'Headstand', cat: 'yoga', muscle: 'shoulders', primary: 'Upper Traps, Core, Balance', secondary: 'Cervical Spine stabilisers', equip: 'Bodyweight', level: 'advanced', sets: 1, reps: '30–90s hold', rest: 60, steps: ['Interlock fingers, place crown of head on mat inside hands', 'Walk feet in — hips over shoulders first', 'Slowly lift legs — pike then straighten', 'Hold rigidly: squeeze inner thighs, core braced'], tip: 'Build up against a wall first — never take this straight to unsupported' },

  // ── ADVANCED — Recovery/Stretch ──
  { name: 'Jefferson Curl', cat: 'stretch', muscle: 'back', primary: 'Erector Spinae, Hamstrings', secondary: 'Spinal Discs, Ligaments', equip: 'Dumbbell', level: 'advanced', sets: 3, reps: '8–10', rest: 60, steps: ['Stand on elevated surface, DB in hands', 'Curl spine forward vertebra by vertebra — chin first', 'Let weight hang at bottom, fully flexed spine', 'Uncurl back to standing, again vertebra by vertebra'], tip: 'One of the most misunderstood exercises — builds active spinal flexion strength. Start very light' },
  { name: 'Loaded Progressive Stretch', cat: 'stretch', muscle: 'legs', primary: 'Hip Flexors, Psoas', secondary: 'Rectus Femoris', equip: 'Dumbbell', level: 'advanced', sets: 3, reps: '3 cycles of 30s', rest: 45, steps: ['Deep lunge position, hold DB overhead for added stretch', 'Sink into hip flexor passively — no forcing', 'After 30s, contract hip flexors gently against gravity 5s', 'Relax into deeper stretch — PNF cycle'], tip: 'PNF stretching produces the fastest flexibility gains of any method' },

  // ── NEW: Front Delt ──
  { name: 'DB Front Raise', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Upper Chest', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Stand, DBs in front of thighs, palms facing down', 'Raise one or both arms to shoulder height — arms straight', 'Hold 1s at top, lower under control', 'Keep torso still — no swinging'], tip: 'Slow eccentric is where the front delt grows — don\'t let gravity do the work' },
  { name: 'Cable Front Raise', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Upper Pec', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Stand facing away from cable, attachment at lowest point', 'Hold handle with straight arm, palm facing floor', 'Raise arm to eye level — shoulder only, no body swing', 'Lower under constant cable tension'], tip: 'Cable keeps tension through the entire range unlike a dumbbell' },
  { name: 'Landmine Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, Upper Chest', secondary: 'Triceps, Core', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Barbell end in landmine or floor corner', 'Stand, hold end of bar at shoulder, staggered stance', 'Press bar up and away in an arc to full extension', 'Lower under control — control the arc'], tip: 'The arc path is easier on the shoulder joint than straight OHP' },
  { name: 'Barbell OHP', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, All Heads', secondary: 'Triceps, Upper Traps', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '6–8', rest: 120, steps: ['Bar at front rack, grip just outside shoulder-width', 'Brace core and glutes — no lumbar arch', 'Press bar straight up, head out of the way at top', 'Lower to clavicle level — bar touches upper chest'], tip: 'The barbell OHP is the king of shoulder pressing — prioritise it above all else' },
  { name: 'Seated DB Shoulder Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, All Heads', secondary: 'Triceps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12', rest: 90, steps: ['Sit on upright bench, DBs at ear level, elbows 90°', 'Press both DBs overhead simultaneously', 'Touch DBs gently at top, don\'t clank', 'Lower to ear level with control'], tip: 'Seated removes leg drive, making it a pure shoulder exercise' },

  // ── NEW: Lateral Delt ──
  { name: 'Cable Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Stand side-on to cable, hold handle with far hand', 'Raise arm out to side to shoulder height', 'Pause 1s at top — feel the squeeze', 'Lower slowly under constant cable tension'], tip: 'Cable tension at the bottom is the advantage over dumbbells — no dead zone' },
  { name: 'Machine Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit at machine, adjust pad to elbow height', 'Rest forearms on pads, elbows bent', 'Drive elbows up and out to shoulder height', 'Lower slowly — resist the weight on the way down'], tip: 'Machine keeps constant tension and removes forearm cheating' },
  { name: 'Leaning Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '15–20', rest: 45, steps: ['Hold cable or fixed object with free hand for support', 'Lean body away from working arm', 'Raise arm to ear level — full range at this angle', 'Lower under control, maintain the lean'], tip: 'Leaning increases the range of motion at the bottom for better stretch' },

  // ── NEW: Rear Delt ──
  { name: 'Cable Rear Delt Fly', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids, Mid Traps', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Set cables at eye height, cross the handles', 'Hold left cable in right hand and vice versa', 'Pull arms apart horizontally, elbows slightly bent', 'Squeeze rear delts at full extension — hold 1s'], tip: 'The cross-cable setup maintains tension all the way through the range' },
  { name: 'Chest-Supported Row (High)', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid, Rhomboids', secondary: 'Mid Traps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 60, steps: ['Lie face-down on incline bench, DBs hanging', 'Row elbows flared wide to ear level — not hip level', 'Squeeze rear delts hard at top', 'Lower fully — full arm extension every rep'], tip: 'Wide elbow path = rear delt. Narrow path = rhomboids. Both are great.' },
  { name: 'Bent-Over Face Pull', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rotator Cuff', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '20', rest: 30, steps: ['Hinge forward 45–60°, DBs hanging, neutral grip', 'Pull DBs toward face, elbows flare wide and high', 'Externally rotate at end — hands above elbows', 'Lower under full control'], tip: 'Think of it as a dumbbell version of cable face pulls — same motion, same purpose' },
  { name: 'Machine Reverse Fly', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit facing pec deck machine, chest against pad', 'Hold handles with arms extended in front', 'Drive arms apart horizontally, slight elbow bend', 'Control return — don\'t let weight slam'], tip: 'Pec deck in reverse is the most targeted rear delt machine movement available' },

  // ── NEW: Traps ──
  { name: 'Barbell Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Levator Scapulae', equip: 'Barbell', level: 'beginner', sets: 4, reps: '12–15', rest: 60, steps: ['Hold barbell at hip level, overhand grip', 'Shrug shoulders straight UP — not forward or backward', 'Hold at top for 2s, squeeze traps hard', 'Lower fully — full depression before next rep'], tip: 'Don\'t roll shoulders — straight up, straight down. Rolling can cause impingement' },
  { name: 'DB Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Levator Scapulae', equip: 'Dumbbell', level: 'beginner', sets: 4, reps: '15–20', rest: 60, steps: ['DBs at sides, arms straight, stand tall', 'Shrug shoulders toward ears — straight up', 'Squeeze at top for 1–2s', 'Lower with control to full depression'], tip: 'DBs allow each side to work independently — great for asymmetry correction' },
  { name: 'Farmer\'s Walk', cat: 'strength', muscle: 'traps', primary: 'Upper Traps, Core', secondary: 'Forearms, Glutes', equip: 'Dumbbell', level: 'beginner', sets: 4, reps: '30–40m', rest: 90, steps: ['Pick up heavy DBs or kettlebells, stand tall', 'Walk with controlled steps — shoulders packed', 'Keep core braced, chest up throughout', 'Set down with control — don\'t drop'], tip: 'One of the most functional exercises that exists — trains everything isometrically' },
  { name: 'Trap Bar Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Mid Traps', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '10–12', rest: 75, steps: ['Stand inside trap bar, neutral grip handles', 'Lift bar to standing position', 'Shrug shoulders up and slightly back at top', 'Full depression before next rep'], tip: 'Trap bar allows more weight and neutral grip — better for elbow health than barbell shrug' },
  { name: 'Cable Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Mid Traps', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 60, steps: ['Face away from cable machine, low attachment', 'Hold bar or handles behind body', 'Shrug straight up under constant cable tension', 'Squeeze for 2s at top'], tip: 'Cable maintains tension at the top unlike free weights' },

  // ── NEW: Forearms ──
  { name: 'Wrist Curl', cat: 'strength', muscle: 'forearms', primary: 'Wrist Flexors', secondary: 'Brachioradialis', equip: 'Barbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit, forearms resting on thighs, palms facing up, barbell in hands', 'Let bar roll to fingertips at bottom', 'Curl wrist upward to full flexion', 'Lower under control — full range every rep'], tip: 'Do these at the end of any arm session — forearms are already pre-fatigued' },
  { name: 'Reverse Wrist Curl', cat: 'strength', muscle: 'forearms', primary: 'Wrist Extensors', secondary: 'Brachioradialis', equip: 'Barbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit, forearms resting on thighs, palms facing down', 'Lower bar toward floor at wrists', 'Curl wrists up to full extension', 'Lower under control'], tip: 'Most people never train wrist extensors — this fixes forearm imbalance and prevents tennis elbow' },
  { name: 'Dead Hang', cat: 'strength', muscle: 'forearms', primary: 'Grip, Forearms', secondary: 'Lats, Shoulder Girdle', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '30–60s', rest: 90, steps: ['Hang from pull-up bar, full arm extension', 'Relax everything except your grip', 'Let shoulder blades passively elevate', 'Breathe steadily — don\'t hold your breath'], tip: 'Best shoulder decompression exercise available — also builds crushing grip strength' },
  { name: 'Plate Pinch', cat: 'strength', muscle: 'forearms', primary: 'Pinch Grip, Forearms', secondary: 'Wrist Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '30–45s each', rest: 60, steps: ['Pinch two weight plates together with thumb and fingers — smooth sides out', 'Hold at side, arm straight', 'Hold as long as possible', 'Alternate hands'], tip: 'Pinch grip is the weakest link for most gym-goers — this fixes it fast' },
  { name: 'Zottman Curl', cat: 'strength', muscle: 'forearms', primary: 'Brachioradialis, Forearms', secondary: 'Biceps, Brachialis', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 60, steps: ['Start with supinated grip like a regular curl', 'Curl up — at the top, rotate wrist to overhand grip', 'Lower slowly with overhand grip (trains extensors and brachioradialis)', 'Rotate back to supinated at the bottom'], tip: 'Trains both the curl and reverse curl in one movement — the ultimate arm exercise' },

  // ── NEW: Calves ──
  { name: 'Seated Calf Raise', cat: 'strength', muscle: 'calves', primary: 'Soleus', secondary: 'Gastrocnemius', equip: 'Machine', level: 'beginner', sets: 4, reps: '15–20', rest: 45, steps: ['Sit at machine, pads on lower quads, balls of feet on plate', 'Lower heels as far as possible — full stretch', 'Rise onto tiptoes to full extension', 'Squeeze calves at top for 2s, lower slowly'], tip: 'Seated targets the soleus (deeper calf) better than standing — don\'t skip this' },
  { name: 'Single-Leg Calf Raise', cat: 'strength', muscle: 'calves', primary: 'Gastrocnemius', secondary: 'Soleus', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '15–20 each', rest: 45, steps: ['Stand on one foot on edge of step, hold wall for balance', 'Lower heel below step for full stretch', 'Rise to full tippy-toe extension', 'Full stretch at bottom — each rep from the floor'], tip: 'Single-leg forces twice the load — harder than it looks. Go slow and full ROM' },
  { name: 'Donkey Calf Raise', cat: 'strength', muscle: 'calves', primary: 'Gastrocnemius Upper Fibres', secondary: 'Soleus', equip: 'Bodyweight', level: 'intermediate', sets: 4, reps: '15–20', rest: 45, steps: ['Hinge forward 90° at hips, place hands on bench', 'Partner sits on lower back for load, or use belt weight', 'Rise onto tiptoes, full extension', 'Lower to full stretch — 4s eccentric'], tip: 'The hips-forward angle preferentially recruits the upper gastrocnemius fibres' },

  // ── NEW: Glutes (standalone) ──
  { name: 'Cable Glute Kickback', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20 each', rest: 45, steps: ['Attach ankle strap, stand facing cable machine', 'Hinge slightly, hands on machine for balance', 'Kick working leg back and up — squeeze glute at top', 'Lower under control — don\'t let hip flexor take over'], tip: 'Squeeze the glute, not the hamstring — the contraction should be felt in the cheek' },
  { name: 'Glute Kickback Machine', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20 each', rest: 45, steps: ['Kneel on machine pad, one knee on support', 'Drive working leg back and up against resistance', 'Squeeze glute at full extension — hold 1s', 'Return under control without releasing tension'], tip: 'Great finishing move for glutes — use mind-muscle connection over heavy weight' },
  { name: 'Frog Pump', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Glute Medius', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '20–30', rest: 30, steps: ['Lie on back, soles of feet together, knees splayed wide', 'Drive hips up — squeeze glutes hard at top', 'Lower just until hips barely touch floor', 'Immediately repeat — constant glute tension throughout'], tip: 'The butterfly foot position eliminates hamstring and takes the glutes through a unique angle' },
  { name: 'Step-Up', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus, Quadriceps', secondary: 'Hamstrings, Core', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15 each', rest: 60, steps: ['Stand facing a bench or box, DBs at sides', 'Step up with one foot — drive through the heel', 'Bring trailing leg up to stand on box', 'Step back down under control, same leg leads'], tip: 'Drive through the heel of the elevated foot, not the toe — more glute, less quad' },
  { name: 'Sumo Squat', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus, Adductors', secondary: 'Quadriceps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Wide stance, toes pointed 45° out, DB held vertically between legs', 'Lower until thighs parallel — chest proud', 'Drive through heels and push knees out', 'Squeeze glutes hard at lockout'], tip: 'Wide stance shifts emphasis from quads to glutes and inner thighs' },

  // ══════════════════════════════════════════════════════════════════════════
  // ── BATCH 1 — Chest (20) ──
  { name: 'Incline Bench Press', cat: 'strength', muscle: 'chest', primary: 'Upper Chest', secondary: 'Anterior Deltoid, Triceps', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '8–10', rest: 90, steps: ['Set bench to 30–45° — higher than this becomes a shoulder press', 'Grip bar 1–2 inches wider than shoulder width', 'Lower to upper chest — bar touches just below the collarbone', 'Press explosively keeping scapulae retracted throughout'], tip: 'The 30° incline is scientifically optimal for upper chest; 45° shifts too much load to the front deltoid.' },
  { name: 'Decline Bench Press', cat: 'strength', muscle: 'chest', primary: 'Lower Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '8–10', rest: 90, steps: ['Set bench to 15–30° decline and hook feet under ankle pads', 'Grip bar slightly wider than shoulder width, unrack carefully', 'Lower bar to lower chest in a controlled arc', 'Press explosively to full lockout — no shrugging at the top'], tip: 'Decline angles best isolate the sternal fibres of the pec — the "lower chest shelf" most people neglect.' },
  { name: 'Dumbbell Bench Press', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Lie flat, DBs at chest, elbows at 75° — not fully flared', 'Press DBs up and slightly inward — nearly touching at top', 'Lower with control, going slightly deeper than a barbell allows', 'Retract shoulder blades throughout — do not let them wing off the bench'], tip: 'DBs allow a greater range of motion than barbell — use that extra depth to maximise pec stretch.' },
  { name: 'Dumbbell Flye', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Serratus Anterior', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Lie flat, DBs above chest with a fixed slight elbow bend — never straighten', 'Lower arms in a wide arc until a deep chest stretch is felt', 'Drive arms back together squeezing from the outside in — think hugging a tree', 'Do not press at the top — this is a pure arc movement, not a press'], tip: 'Flyes are a stretch-focused movement — use lighter weight to maximise the pec stretch at the bottom.' },
  { name: 'Incline Dumbbell Flye', cat: 'strength', muscle: 'chest', primary: 'Upper Chest', secondary: 'Serratus Anterior', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Set bench to 30° incline, DBs above upper chest', 'Lower in a wide arc — feel the upper chest stretch at the bottom', 'Drive arms back in the arc squeezing from the outside in', 'Keep the slight elbow bend fixed — the arm angle must not change during the arc'], tip: 'The incline arc targets the clavicular (upper) fibres that flat flyes entirely miss.' },
  { name: 'Decline Dumbbell Press', cat: 'strength', muscle: 'chest', primary: 'Lower Chest', secondary: 'Triceps', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Set bench to 15–30° decline, secure feet, DBs at lower chest', 'Elbows at 75° — slightly tucked to protect the shoulder', 'Press up and slightly inward to full extension', 'Lower with control — do not let DBs drift outward during descent'], tip: 'Decline pressing develops the lower pec definition that gives the chest a complete, three-dimensional look.' },
  { name: 'Pec Deck Flye', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Anterior Deltoid', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 60, steps: ['Adjust seat so handles align exactly at chest height when seated', 'Place forearms on pads, elbows at 90° — do not grip handles', 'Drive elbows together until you feel a hard chest contraction', 'Return slowly — resist the weight on the way out for 3 seconds'], tip: 'Machine eliminates stabiliser demand — ideal for isolating the chest squeeze without shoulder involvement.' },
  { name: 'Chest Press Machine', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Adjust seat so handles align with your lower chest when gripped', 'Retract shoulder blades into the pad before pressing — hold that position', 'Press to full extension — pause 1 second squeezing chest at end range', 'Return slowly, allowing full chest stretch before next rep'], tip: 'Set the seat correctly — handles too high shifts the load to the front delts, not the chest.' },
  { name: 'Low Cable Fly', cat: 'strength', muscle: 'chest', primary: 'Upper Chest', secondary: 'Serratus Anterior', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Set both cables to the lowest position, stand in the middle', 'Hold one handle each hand, slight forward lean, arms low and wide', 'Drive arms upward in an arc until hands meet at upper chest height', 'Lower slowly — cables pulling from below maintains tension through the full arc'], tip: 'Low-to-high cable path specifically targets the clavicular (upper) pec fibres better than any incline press.' },
  { name: 'High Cable Fly', cat: 'strength', muscle: 'chest', primary: 'Lower Chest', secondary: 'Serratus Anterior', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Set both cables to the highest position, step forward with one foot', 'Arms wide like a goalpost, lean slightly forward — brace core', 'Pull arms downward and together in an arc — hands cross at hip level', 'Return slowly — full stretch with arms wide at top before each rep'], tip: 'High-to-low cable path isolates the sternal lower pec fibres — the movement that builds underpec definition.' },
  { name: 'Single-Arm Cable Fly', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Serratus Anterior', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15 each', rest: 60, steps: ['Cable at chest height, stand side-on, hold handle with the far hand', 'Cross arm across body until hand passes the midline — full contraction', 'Hold 1 second at peak — really feel the unilateral squeeze', 'Return to full stretch — slight torso rotation toward the cable is normal'], tip: 'Unilateral cable flyes expose and correct left-right pec imbalances that bilateral pressing hides.' },
  { name: 'Floor Press', cat: 'strength', muscle: 'chest', primary: 'Chest, Triceps', secondary: 'Anterior Deltoid', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '6–8', rest: 90, steps: ['Lie on the floor under a low rack, bar above chest', 'Lower bar until upper arms rest completely on the floor — pause 1 second', 'Eliminate the stretch reflex — no bounce off the floor', 'Press explosively to full lockout — this is a dead-stop strength movement'], tip: 'The floor eliminates leg drive and shortens the ROM — it builds raw lockout pressing strength that transfers to barbell bench.' },
  { name: 'Svend Press', cat: 'strength', muscle: 'chest', primary: 'Inner Chest', secondary: 'Anterior Deltoid', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '15–20', rest: 45, steps: ['Press two light plates or DBs together between palms at chest level', 'Apply maximum lateral squeeze pressure between both hands — never release', 'Extend arms straight forward maintaining the squeeze throughout', 'Return to chest — the inward force must remain constant'], tip: 'The continuous inward squeeze activates the pec\'s adduction function — targets inner chest detail no pressing movement hits.' },
  { name: 'Hex Press', cat: 'strength', muscle: 'chest', primary: 'Inner Chest, Triceps', secondary: 'Anterior Deltoid', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 60, steps: ['Lie flat, press two DBs together above chest with neutral grip — they must touch', 'Maintain inward squeeze — DBs stay touching throughout every rep', 'Lower both DBs as one unit to lower chest', 'Press back to start — the squeeze is the entire point of this exercise'], tip: 'Neutral grip reduces shoulder impingement risk while the squeeze activates medial pec fibres standard pressing misses.' },
  { name: 'Push-Up Plus', cat: 'strength', muscle: 'chest', primary: 'Serratus Anterior, Chest', secondary: 'Core, Triceps', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Set up in standard push-up position, body rigid head to heel', 'Perform the push-up — press to full lockout', 'At the top: push further, rounding the upper back — shoulder blades protract fully', 'Return under control — this protraction is the critical "plus" component'], tip: 'The scapular protraction at the top activates serratus anterior — the key muscle for shoulder health and pressing power.' },
  { name: 'Wide-Grip Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Anterior Deltoid', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Place hands 1.5× shoulder-width apart, fingers angled slightly outward', 'Lower chest to within 1 inch of the floor — full depth every rep', 'Elbows flare to about 60° — wider than a standard push-up', 'Press explosively back to top — squeeze chest at full extension'], tip: 'Wider hand placement increases the stretch across the pec at the bottom compared to standard push-up.' },
  { name: 'Paused Bench Press', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '5–6', rest: 120, steps: ['Set up as a standard bench press with slightly lighter weight', 'Lower bar to chest and hold it there for 2–3 full seconds', 'Do not relax on the chest — maintain full muscular tension throughout the pause', 'Press explosively — the pause trains starting strength with zero momentum'], tip: 'Pausing at the bottom eliminates the elastic rebound — every rep is an honest test of raw chest and tricep strength.' },
  { name: 'Landmine Chest Press', cat: 'strength', muscle: 'chest', primary: 'Upper Chest, Anterior Deltoid', secondary: 'Triceps, Core', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Landmine or corner-loaded barbell, kneel or stand, grip bar end with both hands at chest', 'Press bar forward and upward in an arc to full arm extension', 'Squeeze chest and deltoids at the top — hold 1 second', 'Lower under control following the same arc path back to chest'], tip: 'The arc path is far more shoulder-friendly than straight overhead pressing — ideal for those with shoulder issues.' },
  { name: 'Assisted Dip Machine', cat: 'strength', muscle: 'chest', primary: 'Lower Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Machine', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Kneel on the counterweight pad — higher weight = more assistance', 'Grip handles, lean torso forward 20–30° for chest emphasis', 'Lower until upper arms are parallel to the ground — full depth', 'Press through the heel of the palm to lockout — squeeze chest at top'], tip: 'Forward lean is essential — dipping upright trains triceps, leaning forward recruits the lower chest.' },
  { name: 'Kneeling Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Kneel on the floor, hands slightly wider than shoulder width', 'Keep body in a straight line from knees to head — do not let hips drop', 'Lower chest to 1 inch above the floor under control', 'Press back explosively — squeeze chest at the top'], tip: 'This is the correct regression before standard push-ups — not a lesser exercise, just a different loading.' },

  // ── BATCH 1 — Back (20) ──
  { name: 'Neutral Grip Pull-Up', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Biceps, Brachialis', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '6–10', rest: 90, steps: ['Grip parallel handles shoulder-width, palms facing each other', 'Dead hang — retract and depress scapulae before initiating', 'Pull elbows down toward hips — chest drives to the bar', 'Lower fully — complete elbow extension at the bottom every rep'], tip: 'Neutral grip reduces supination stress on the elbow — easier on the joints than a supinated chin-up.' },
  { name: 'Underhand Lat Pulldown', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi, Biceps', secondary: 'Rhomboids', equip: 'Machine', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Grip bar shoulder-width with supinated (palms-up) grip', 'Lean back slightly — 10 to 15 degrees only', 'Pull bar to upper chest driving elbows toward hips', 'Slow 3-second return to full arm extension — lats stay engaged'], tip: 'Supinated grip increases bicep involvement and allows you to pull more weight — great for beginners building pull strength.' },
  { name: 'Close-Grip Lat Pulldown', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Teres Major, Biceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Attach V-bar handle, grip with neutral palms facing each other', 'Sit with thighs locked under pads, torso upright', 'Pull handle to upper chest — drive elbows straight down toward hips', 'Control return — allow full stretch with arms overhead before next rep'], tip: 'Close grip shifts more stress to the lower lats and teres major — creates the coveted V-taper thickness.' },
  { name: 'Cable Straight-Arm Pulldown', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Teres Major, Serratus', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Stand facing high cable, rope or bar attachment, arms extended overhead', 'Keep arms straight — slight elbow bend — this is not a row', 'Pull bar down in an arc until it touches thighs', 'Return slowly to full overhead stretch — this movement is all lats'], tip: 'Straight-arm pulldowns are the most pure lat isolation exercise — triceps and biceps are completely removed.' },
  { name: 'One-Arm Cable Row', cat: 'strength', muscle: 'back', primary: 'Lats, Rhomboids', secondary: 'Biceps, Rear Deltoid', equip: 'Machine', level: 'intermediate', sets: 3, reps: '10–12 each', rest: 75, steps: ['Single D-handle at seated row height, stand or sit facing cable', 'Row handle to hip — elbow drives back along the torso', 'At peak, rotate torso slightly toward the working arm for added ROM', 'Return to full arm extension — feel the lat stretch before each rep'], tip: 'Unilateral cable rows expose side-to-side lat strength differences that bilateral rowing always masks.' },
  { name: 'Seal Row', cat: 'strength', muscle: 'back', primary: 'Mid-Back, Rhomboids', secondary: 'Biceps, Rear Deltoid', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '8–10', rest: 90, steps: ['Lie face-down on a high bench — chest at the edge, bar below', 'Arms hang straight down to the bar — grip just outside shoulder width', 'Row bar upward to touch the bench edge — elbows go wide', 'Lower fully — the hanging position eliminates all body swing'], tip: 'Prone position makes body cheating physically impossible — the most strict barbell row variation in existence.' },
  { name: 'Kroc Row', cat: 'strength', muscle: 'back', primary: 'Lats, Rhomboids', secondary: 'Traps, Forearms, Core', equip: 'Dumbbell', level: 'advanced', sets: 2, reps: '20–30 each', rest: 120, steps: ['Place one hand on bench, opposite foot staggered back', 'Use a heavy DB — heavier than you think you can handle', 'Row explosively, allowing slight torso rotation to achieve maximum range', 'Lower quickly but under control — speed and volume are the point here'], tip: 'Matt Kroc invented this to build raw lat thickness with high volume — ego check: the weight should be challenging.' },
  { name: 'Renegade Row', cat: 'strength', muscle: 'back', primary: 'Lats, Rhomboids', secondary: 'Core, Triceps', equip: 'Dumbbell', level: 'advanced', sets: 3, reps: '6–8 each', rest: 90, steps: ['Push-up position gripping two DBs — feet wide for stability', 'Brace core so hard that the torso does not rotate during the row', 'Row one DB to hip height — other arm stays locked, pressing the floor', 'Alternate sides — the anti-rotation demand is the real core training here'], tip: 'The challenge is keeping the hips square — if they rotate, you\'ve lost the anti-rotation stimulus entirely.' },
  { name: 'Trap Bar Deadlift', cat: 'strength', muscle: 'back', primary: 'Erector Spinae, Glutes', secondary: 'Hamstrings, Quads, Traps', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '5–8', rest: 120, steps: ['Stand inside the trap bar, feet hip-width, use high handles to start', 'Hinge at hip and knee, neutral spine — grip the handles firmly', 'Push the floor away and drive hips forward to lockout simultaneously', 'Lower with control — hip hinge first, then bend knees as bar passes them'], tip: 'Trap bar deadlift is more quad-dominant and spine-friendly than conventional — a safer first deadlift for beginners.' },
  { name: 'Good Morning', cat: 'strength', muscle: 'back', primary: 'Erector Spinae', secondary: 'Hamstrings, Glutes', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Bar on upper traps, feet shoulder-width, slight knee bend', 'Hinge forward at hips — push hips back, not down', 'Lower until torso is near parallel — back must stay neutral throughout', 'Drive hips forward to return to standing — squeeze glutes at lockout'], tip: 'Good mornings build the posterior chain in the stretched position — directly carries over to squat and deadlift strength.' },
  { name: 'Back Extension', cat: 'strength', muscle: 'back', primary: 'Erector Spinae', secondary: 'Glutes, Hamstrings', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Lie face-down in a back extension bench, hips at pad edge', 'Cross arms on chest or hold a plate for load', 'Lower torso toward floor under control — feel the erector stretch', 'Extend to horizontal — do not hyperextend beyond neutral'], tip: 'Stop at horizontal not above it — hyperextension compresses the lumbar discs without additional muscle benefit.' },
  { name: 'Reverse Hyperextension', cat: 'strength', muscle: 'back', primary: 'Erector Spinae, Glutes', secondary: 'Hamstrings', equip: 'Machine', level: 'intermediate', sets: 3, reps: '15–20', rest: 60, steps: ['Lie face-down on hyperextension bench, hips at the edge, legs hanging', 'Hold the bench with both hands — core braced', 'Raise both legs until body forms a straight line — squeeze glutes at top', 'Lower legs slowly below horizontal for a full spinal stretch'], tip: 'One of the few exercises that decompresses the lumbar spine while strengthening the posterior chain simultaneously.' },
  { name: 'Landmine Row', cat: 'strength', muscle: 'back', primary: 'Lats, Mid-Back', secondary: 'Biceps, Rear Deltoid', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12 each', rest: 75, steps: ['Barbell in landmine or corner, stand perpendicular to the bar', 'Hinge 45°, grip the bar end with one hand in a neutral position', 'Row the bar to your hip — extreme elbow extension backward', 'Lower to full arm extension — feel the complete lat stretch'], tip: 'The landmine angle creates a unique pulling arc that hits the lower lats and teres major like no cable can.' },
  { name: 'Deficit Deadlift', cat: 'strength', muscle: 'back', primary: 'Erector Spinae, Lats', secondary: 'Hamstrings, Glutes', equip: 'Barbell', level: 'advanced', sets: 4, reps: '4–5', rest: 150, steps: ['Stand on a 2–4 inch platform — plates or low box work well', 'Greater depth requires more hip flexion and lat engagement off the floor', 'Conventional setup — maintain tension, pull bar smoothly from the extended range', 'Control the descent back through the full deficit range'], tip: 'Deficit deadlifts build strength specifically from the weakest part of the pull — the initial floor position.' },
  { name: 'Wide-Grip Seated Cable Row', cat: 'strength', muscle: 'back', primary: 'Upper Back, Rhomboids', secondary: 'Rear Deltoid, Biceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Attach a straight bar, grip wide — hands at 1.5× shoulder width', 'Row bar to lower sternum — elbows flare out wide to 90°', 'Squeeze shoulder blades together hard at the contracted position', 'Return to full arm extension — allow full scapular protraction'], tip: 'Wide grip rows target the upper/mid back and rhomboids more than close grip, which emphasises the lats.' },
  { name: 'Underhand Barbell Row', cat: 'strength', muscle: 'back', primary: 'Lats, Biceps', secondary: 'Rhomboids, Rear Deltoid', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '8–10', rest: 90, steps: ['Overhand barbell row setup — then flip grip to supinated (underhand)', 'Hinge to 45°, bar hanging at arms length, core braced', 'Row bar to lower abdomen — elbows stay close to the torso', 'Lower under control — the supinated grip increases bicep contribution significantly'], tip: 'Underhand grip allows the elbows to tuck tighter, creating a superior lat stretch and contraction path.' },
  { name: 'Superman Hold', cat: 'strength', muscle: 'back', primary: 'Erector Spinae', secondary: 'Glutes, Rear Deltoid', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10–12', rest: 30, steps: ['Lie face-down on floor, arms extended overhead like Superman', 'Simultaneously raise arms, chest, and legs off the floor', 'Hold the top position for 2 full seconds — squeeze glutes and upper back', 'Lower slowly to floor and repeat without letting limbs completely relax'], tip: 'Builds endurance in the posterior chain — a critical exercise for lower back health and posture correction.' },
  { name: 'High Row Machine', cat: 'strength', muscle: 'back', primary: 'Upper Lats, Teres Major', secondary: 'Rear Deltoid, Biceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Adjust seat so the cable pulls from above at a high angle', 'Grip handles, arms extended high — lean chest into the pad', 'Pull handles down and back — elbows aim toward the floor', 'Return to full overhead stretch — constant upper lat engagement'], tip: 'High pull machines emphasise the upper lats and teres major more than any rowing motion at hip level.' },
  { name: 'V-Bar Lat Pulldown', cat: 'strength', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Teres Major, Biceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Attach V-bar to pulldown cable, sit with thighs under pad', 'Grip V-bar, palms facing each other, arms extended overhead', 'Pull bar to upper chest — elbows drive straight down toward the floor', 'Slow return to full stretch — resist the weight on the way up'], tip: 'Neutral grip on the V-bar reduces elbow stress compared to pronated wide grip while maintaining full lat activation.' },
  { name: 'Dumbbell Deadlift', cat: 'strength', muscle: 'back', primary: 'Erector Spinae, Glutes', secondary: 'Hamstrings, Traps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Stand with DBs in front of thighs, feet hip-width apart', 'Hinge at hips pushing them back, maintain neutral spine throughout', 'Lower DBs along the front of the legs to mid-shin level', 'Drive hips forward powerfully to return to standing — squeeze glutes at top'], tip: 'Dumbbell deadlifts are ideal for learning hip hinge mechanics before loading a barbell — perfect beginner starting point.' },

  // ── BATCH 2 — Front Delt (12) ──
  { name: 'Plate Front Raise', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Upper Chest', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Hold a weight plate with both hands at the 3 and 9 o\'clock positions', 'Stand tall, slight bend in elbows, plate at hip level', 'Raise plate to eye level — do not swing torso to assist', 'Lower slowly over 3 seconds — maintain shoulder tension throughout'], tip: 'The circular plate forces a neutral grip which distributes load across more shoulder fibres than a dumbbell.' },
  { name: 'Push Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, Triceps', secondary: 'Legs, Core', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '6–8', rest: 90, steps: ['Bar at front rack, grip just outside shoulder width', 'Dip slightly at the knees — only 2–3 inches of knee bend', 'Explode upward and use the momentum to press bar overhead', 'Lock out fully — press with arms after leg drive initiates'], tip: 'The leg drive allows 20–30% more weight overhead than a strict press — builds explosive strength the strict press can\'t.' },
  { name: 'Half-Kneeling Landmine Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, Upper Chest', secondary: 'Triceps, Core', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12 each', rest: 75, steps: ['Kneel on one knee beside a landmine, grip the bar end at shoulder height', 'Brace core hard — the kneeling position removes all leg assistance', 'Press the bar forward and upward in an arc to full extension', 'Lower under control following the arc — feel the front delt work'], tip: 'Half-kneeling position eliminates lower body compensation — forces the shoulder to do all the work.' },
  { name: 'Dumbbell Z-Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, All Heads', secondary: 'Core, Triceps', equip: 'Dumbbell', level: 'advanced', sets: 3, reps: '8–10', rest: 90, steps: ['Sit on the floor with legs straight in front of you — no back support', 'DBs at ear level, elbows at 90°, core braced hard', 'Press DBs overhead to full extension — do not lean back', 'Lower under control — the upright position is the challenge'], tip: 'No back support means zero momentum — any weight you press here is pure deltoid strength.' },
  { name: 'Alternating Dumbbell Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Triceps, Core', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12 each', rest: 75, steps: ['Seated or standing, DBs at shoulder height, palms forward', 'Press one DB overhead while the other stays at shoulder level', 'Lower the pressed arm as you begin pressing the other', 'Maintain strict torso — no side-bending to compensate'], tip: 'Alternating presses create an anti-lateral-flexion core demand that bilateral pressing never achieves.' },
  { name: 'Kettlebell Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, All Heads', secondary: 'Triceps, Rotator Cuff', equip: 'Kettlebell', level: 'intermediate', sets: 3, reps: '8–10 each', rest: 75, steps: ['Clean KB to rack position — bell resting on forearm, elbow close to body', 'Brace core, squeeze glutes, press KB straight overhead to full lockout', 'Keep wrist straight — do not let it fold backward under the KB', 'Lower back to rack position with control — do not drop from overhead'], tip: 'The offset centre of mass of a KB challenges the rotator cuff far more than a dumbbell at the same weight.' },
  { name: 'Band Front Raise', cat: 'bands', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Upper Chest', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Stand on band, hold both ends with an overhand grip', 'Arms straight at sides, slight elbow bend throughout', 'Raise both arms simultaneously to shoulder height', 'Lower slowly — band tension increases as arms rise, making the top harder'], tip: 'Band resistance is highest at the top where dumbbells are easiest — better front delt stimulus through the full arc.' },
  { name: 'Incline Front Raise', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Upper Chest', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '12–15', rest: 45, steps: ['Lie face-down on a 30–45° incline bench, DBs hanging below', 'Arms straight, raise DBs forward to ear height — no body swing possible', 'Hold 1 second at top — full anterior deltoid isolation', 'Lower slowly — the incline creates a longer range than standing raises'], tip: 'Prone position eliminates all momentum — the most isolated front raise variation that exists.' },
  { name: 'Machine Shoulder Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, All Heads', secondary: 'Triceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Adjust seat so handles align with your shoulders when seated', 'Grip handles, retract shoulder blades into the back pad', 'Press to full extension — do not lock out aggressively', 'Return to shoulder height — full range, no half reps'], tip: 'Machine guided path removes stabilisation demand — ideal for beginners learning overhead pressing safely.' },
  { name: 'Thumbs-Up Front Raise', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Supraspinatus', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Hold DBs at sides with thumbs pointing up — neutral grip throughout', 'Raise arms forward to shoulder height — do not go higher', 'Hold 1 second at top feeling the front delt contraction', 'Lower slowly over 3 seconds — eccentric is where the growth happens'], tip: 'Neutral grip externally rotates the shoulder slightly — reduces impingement risk versus a pronated-grip front raise.' },
  { name: 'Single-Arm Landmine Press', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, Upper Chest', secondary: 'Triceps, Serratus', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12 each', rest: 75, steps: ['Stand beside a landmine, hold bar end in one hand at shoulder height', 'Stagger stance for stability — opposite foot forward to the pressing arm', 'Press bar forward and up in an arc to full arm extension', 'Lower under control — feel the front delt and serratus stretch at bottom'], tip: 'Unilateral pressing reveals side-to-side pressing strength imbalances that bilateral pressing always compensates around.' },
  { name: 'Cable Y-Raise', cat: 'strength', muscle: 'front-delt', primary: 'Anterior Deltoid, Lower Traps', secondary: 'Serratus, Supraspinatus', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 45, steps: ['Stand facing cable with low attachment, one cable in each hand', 'Arms at sides, raise both forward and out in a Y-shape to above head level', 'Thumbs up at the top — full overhead lockout with scapular upward rotation', 'Lower slowly — this movement trains both front delt and scapular health'], tip: 'The Y-raise trains the often-neglected upward rotation function of the scapula — critical for shoulder longevity.' },

  // ── BATCH 2 — Lateral Delt (10) ──
  { name: 'Bent-Arm Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['DBs at sides, bend elbows to 90° and hold that angle throughout', 'Raise elbows out to the side — elbows always lead, never wrists', 'Raise until upper arms are parallel to the floor', 'Lower slowly — the bent arm shortens the lever, allowing more weight'], tip: 'Bent elbow shortens the lever and reduces rotator cuff demand — better for beginners and those with impingement.' },
  { name: 'Seated Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit on a bench, DBs at sides, torso upright', 'Raise arms out to the side — lead with elbows, not wrists', 'Stop at shoulder height — going higher recruits traps, not delts', 'Lower for a 3-second eccentric — this is where delt growth happens'], tip: 'Seated position prevents any body sway — every rep is honest and goes directly to the lateral head.' },
  { name: 'Band Lateral Raise', cat: 'bands', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Stand on band, one end in each hand at sides', 'Raise arms to shoulder height — lead with elbows', 'Hold 1 second at top — constant band tension throughout', 'Lower slowly — the band provides increasing resistance at the top'], tip: 'Band tension peaks at the top where dumbbell tension drops — this creates superior lateral delt stimulus.' },
  { name: 'Plate Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '12–15 each', rest: 45, steps: ['Hold a light plate in one hand, thumb on top, arm at side', 'Raise arm out to the side — keep the plate horizontal throughout', 'Stop at shoulder height — do not tilt or rotate the plate', 'Lower slowly — switch sides after completing all reps'], tip: 'Holding the plate horizontally requires more internal shoulder rotation — targets the lateral head more precisely.' },
  { name: 'Cross-Body Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Rear Deltoid', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '12–15 each', rest: 45, steps: ['Hold DB in one hand, reach it across body to the opposite hip', 'Raise arm out and across from that low crossed position', 'The longer arc creates a bigger range of motion than standard raises', 'Lower back across the body — full cross before each rep'], tip: 'Starting from the crossed position increases the range of motion by 30–40° compared to a standard lateral raise.' },
  { name: 'Incline Side Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '15–20', rest: 45, steps: ['Lie sideways on a 30° incline bench, bottom arm holding the bench', 'Top arm hangs down holding DB — this is the start position', 'Raise top arm to vertical — perpendicular to the incline', 'Lower all the way down — the bench increases the lower range of motion'], tip: 'The incline creates a stretch at the bottom that standing raises never reach — superior delt activation through full ROM.' },
  { name: 'Cable Upright Row', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid, Traps', secondary: 'Biceps, Rear Deltoid', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Cable at lowest setting, straight bar or rope attachment', 'Stand close, grip bar shoulder-width — overhand grip', 'Pull bar straight up to chin level — elbows flare above wrists', 'Lower under constant cable tension — slow 3-second eccentric'], tip: 'Cable maintains tension at the bottom of the movement where a barbell has zero load — better overall stimulus.' },
  { name: 'Kettlebell Lateral Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus, Rotator Cuff', equip: 'Kettlebell', level: 'intermediate', sets: 3, reps: '12–15 each', rest: 45, steps: ['Hold KB by the horns or the handle — either works differently', 'Stand tall, raise KB out to the side to shoulder height', 'Pause at the top — the KB demands more rotator cuff stabilisation than a DB', 'Lower slowly — the offset weight creates a unique rotational challenge'], tip: 'Holding the KB by the bell (upside down) increases instability and rotator cuff demand significantly.' },
  { name: 'Y-Raise', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid, Lower Traps', secondary: 'Serratus, Rhomboids', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 30, steps: ['Lie face-down on an incline bench at 30–45°, DBs hanging below', 'Raise both arms diagonally into a Y shape — thumbs pointing up', 'Raise to just above head level — scapulae upwardly rotate at the top', 'Lower slowly — feel the combined delt and lower trap work'], tip: 'The Y-raise in a prone position removes all momentum — purely targets the lateral delt and lower trap.' },
  { name: 'Wide-Grip Upright Row', cat: 'strength', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Rear Deltoid, Supraspinatus', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Grip bar wider than shoulder width — 1.5× shoulder width', 'Pull bar up keeping elbows flaring out wide — not up', 'Stop when elbows reach shoulder height — bar stays low', 'Lower under control — the wide grip targets delts over traps'], tip: 'Wide grip shifts emphasis from traps to lateral delts — narrower grip does the opposite. Go wide for shoulder development.' },

  // ── BATCH 2 — Rear Delt (12) ──
  { name: 'Seated Rear Delt Fly', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids, Mid Traps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit at end of bench, hinge torso forward until chest rests on thighs', 'DBs hang below with a neutral grip — arms almost vertical', 'Raise arms out to sides to shoulder height — elbows slightly bent', 'Lower slowly — the seated position prevents any torso swing'], tip: 'Chest-on-thigh position is the strictest rear delt fly setup possible — zero momentum can enter.' },
  { name: 'Cable Rear Delt Pull-Apart', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Set cables at shoulder height, stand in the middle facing the machine', 'Cross the cables — hold left cable in right hand and vice versa', 'Pull arms apart horizontally, elbows slightly bent throughout', 'Hold at full extension for 1 second — squeeze rear delts hard'], tip: 'The cross-cable setup keeps tension on the rear delt throughout the entire range of motion.' },
  { name: 'Incline Rear Delt Raise', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Lower Traps, Rhomboids', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Lie face-down on a 30° incline bench, DBs hanging below', 'Raise arms out to sides — elbows slightly bent, hands in neutral grip', 'Raise to shoulder height only — do not shrug at the top', 'Lower slowly — full hang between every rep'], tip: 'Prone incline raises completely isolate the rear delt — no torso lean, no momentum, no assistance.' },
  { name: 'Lying Rear Delt Raise', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids, Mid Traps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Lie sideways on a bench, lower arm supporting head or gripping the bench', 'Top arm holds a light DB, elbow slightly bent, arm at side', 'Raise top arm straight up until perpendicular to the floor', 'Lower slowly — gravity directly loads the rear delt in this position'], tip: 'Side-lying is the only position where gravity is perfectly aligned with the rear delt — optimal resistance curve.' },
  { name: 'W-Raise', cat: 'rehab', muscle: 'rear-delt', primary: 'Rear Deltoid, Infraspinatus', secondary: 'Rhomboids, Lower Traps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 30, steps: ['Lie face-down on bench or floor, arms in W position — elbows bent at 90°', 'Raise arms off the ground keeping the W shape', 'Externally rotate at the top — thumbs rotate toward ceiling', 'Lower slowly — control every degree of the movement'], tip: 'The W-raise trains both rear delt strength and external rotation — two of the most neglected shoulder functions.' },
  { name: 'External Rotation', cat: 'rehab', muscle: 'rear-delt', primary: 'Infraspinatus, Teres Minor', secondary: 'Rear Deltoid', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20 each', rest: 30, steps: ['Band at elbow height, elbow bent to 90° and pressed against your side', 'Rotate forearm outward away from the body — elbow stays glued to rib', 'Go as far as comfortable — do not force past natural range', 'Return slowly — maintain elbow contact with torso throughout'], tip: 'External rotation is the single most important rotator cuff exercise — neglecting it is a direct path to shoulder injury.' },
  { name: 'Scapular Pull-Up', cat: 'rehab', muscle: 'rear-delt', primary: 'Lower Traps, Serratus', secondary: 'Rhomboids, Rear Deltoid', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10–12', rest: 45, steps: ['Hang from a pull-up bar in a dead hang, arms fully extended', 'Without bending the elbows, depress and retract the shoulder blades', 'Body rises 2–3 inches — this is all scapular movement, no elbow bend', 'Lower back to dead hang — full scapular elevation before each rep'], tip: 'This trains scapular depression in isolation — the initiating movement of every healthy pull-up and row.' },
  { name: 'Dumbbell Rear Delt Circle', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rotator Cuff, Mid Traps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10 each direction', rest: 30, steps: ['Hinge forward 45°, light DBs hanging with neutral grip', 'Draw small backward circles in the horizontal plane', 'Keep elbows soft — the movement comes from the shoulder joint', 'Reverse direction — forward circles hit the rear delt differently'], tip: 'Circular motion forces constant tension through every angle — like doing a rear fly in all directions at once.' },
  { name: 'Seated Cable Rear Delt Row', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids, Mid Traps', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit at cable row station, cable at eye height, rope attachment', 'Hold rope, arms extended forward, elbows at shoulder height', 'Pull rope to face with elbows flaring wide and high', 'Externally rotate at end — hands finish above elbows'], tip: 'Keeping elbows high throughout is the key — dropping them shifts the load to lats instead of rear delts.' },
  { name: 'Rear Delt Kettlebell Fly', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids', equip: 'Kettlebell', level: 'intermediate', sets: 3, reps: '12–15', rest: 45, steps: ['Hinge forward 45°, light KBs hanging in each hand', 'Raise both arms out to the side — elbows slightly bent', 'At the top, externally rotate — thumbs rotate toward ceiling', 'Lower under control — full hang at the bottom for maximum stretch'], tip: 'The external rotation cue at the top adds infraspinatus engagement on top of the rear delt — double the benefit.' },
  { name: 'Band Rear Delt Fly', cat: 'bands', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids', equip: 'Band', level: 'beginner', sets: 3, reps: '20', rest: 30, steps: ['Hold band with both hands, arms extended forward at shoulder height', 'Pull band apart horizontally until arms are straight out to sides', 'Hold full extension for 1 second — squeeze rear delts', 'Return with control — do not let the band snap back'], tip: 'Use a light band with high reps — rear delts are small muscles that respond better to volume than heavy load.' },
  { name: 'High Cable Rear Delt Pull', cat: 'strength', muscle: 'rear-delt', primary: 'Rear Deltoid', secondary: 'Rhomboids, Biceps', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Set cable at highest position, stand facing the machine', 'Reach up and grab the handle with one hand — arm extended overhead', 'Pull handle down and across to opposite hip in a wide arc', 'Return slowly along the same arc — feel rear delt stretch at top'], tip: 'The high-to-low arc uniquely targets the rear delt fibres that standard horizontal flies cannot reach.' },

  // ── BATCH 3 — Arms (20) ──
  { name: 'Spider Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Short Head', secondary: 'Brachialis', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 60, steps: ['Lie chest-down on a 45° incline bench, arms hanging straight down', 'Curl both DBs simultaneously — elbows stay pointing straight down', 'Squeeze hard at the top — no body movement is possible in this position', 'Lower slowly over 3 seconds — full elbow extension at the bottom'], tip: 'The prone position removes all cheating — this is the most strict bicep curl variation that exists.' },
  { name: 'Cable Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Brachii', secondary: 'Brachialis', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Stand facing low cable, straight bar or EZ attachment', 'Grip bar shoulder-width, supinated — elbows pinned to sides', 'Curl bar to upper chest — squeeze biceps hard at the top', 'Lower slowly to full extension — constant cable tension throughout'], tip: 'Cable provides constant tension at the bottom where dumbbells go slack — superior stimulus through the full ROM.' },
  { name: 'EZ-Bar Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Brachii', secondary: 'Brachialis, Brachioradialis', equip: 'Barbell', level: 'beginner', sets: 3, reps: '10–12', rest: 60, steps: ['Grip EZ-bar at the inner angled grip, palms facing up at 45°', 'Elbows pinned to sides — do not let them drift forward', 'Curl bar to upper chest — squeeze at the top for 1 second', 'Lower under control — full extension at the bottom every rep'], tip: 'The angled grip reduces wrist and elbow strain compared to a straight bar while maintaining full bicep activation.' },
  { name: 'Bayesian Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Long Head', secondary: 'Brachialis', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Set cable to low position, face away from the machine', 'Hold cable handle behind hip, arm extended and slightly behind torso', 'Curl forward and up — the long head is fully stretched at the start', 'Lower back to the extended behind-the-body position every rep'], tip: 'Starting with the arm behind the body places the long head in maximum stretch — an advantage no standing curl provides.' },
  { name: 'Cross-Body Hammer Curl', cat: 'strength', muscle: 'arms', primary: 'Brachialis, Brachioradialis', secondary: 'Biceps', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12 each', rest: 60, steps: ['Stand with DB in one hand, neutral grip, arm at side', 'Curl DB across body toward opposite shoulder — not straight up', 'Squeeze at top — the cross-body path hits brachialis harder', 'Lower fully — alternate arms each rep'], tip: 'The cross-body path increases brachialis activation by 20% compared to a standard hammer curl.' },
  { name: 'Overhead Cable Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Long Head', secondary: 'Brachialis', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Stand between two high cables, hold one in each hand — arms extended overhead', 'Keep upper arms horizontal and stationary — only forearms move', 'Curl both hands toward the back of your head simultaneously', 'Extend fully back to overhead — peak long head stretch maintained throughout'], tip: 'Arms overhead places the long head in constant stretch — the position Arnold called the "double bicep peak" builder.' },
  { name: 'Waiter Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Short Head', secondary: 'Brachialis', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Hold one DB vertically with both hands cupping the top plate like a waiter holding a tray', 'Elbows at sides, forearms supinated upward — this is the start', 'Curl upward while maintaining the supinated hand position throughout', 'Lower slowly — the unique grip keeps supination tension constant'], tip: 'The waiter grip locks supination throughout the curl — maximises short head activation better than a standard curl.' },
  { name: 'Seated Alternating Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Brachii', secondary: 'Brachialis', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12 each', rest: 60, steps: ['Sit on a bench, back straight, DBs at sides with neutral grip', 'Curl one arm up, supinating the wrist as it rises — palm faces up at top', 'Squeeze at top, lower fully before curling the other arm', 'Do not lean to assist — sit tall and strict throughout'], tip: 'Seated position prevents torso swing — every rep forces the bicep to do the work alone.' },
  { name: 'Incline Cable Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Long Head', secondary: 'Brachialis', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Set incline bench in front of a low cable, sit with arms hanging behind you', 'Cable pulls arms into extension behind the torso — max long head stretch', 'Curl both handles to shoulders — elbows stay in the hanging-back position', 'Lower slowly to full extension — the back-arm position is the key'], tip: 'Combining incline bench and cable gives the maximum long head stretch that no dumbbell incline curl can replicate.' },
  { name: 'Cheat Curl', cat: 'strength', muscle: 'arms', primary: 'Biceps Brachii', secondary: 'Forearms, Core', equip: 'Barbell', level: 'advanced', sets: 3, reps: '6–8', rest: 90, steps: ['Load barbell heavier than your strict max — this is intentional', 'Use minimal hip drive to get the bar moving — just enough to break inertia', 'Control the descent strictly over 4 seconds — the eccentric is everything', 'The cheat is in the concentric only — strict negative every single rep'], tip: 'Cheat curls were popularised by Arnold for overloading the eccentric — a heavier eccentric builds more muscle than the concentric.' },
  { name: 'Diamond Push-Up', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Chest, Anterior Deltoid', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Place hands together below chest forming a diamond shape with thumbs and index fingers', 'Body rigid head to heels — standard push-up alignment', 'Lower chest toward hands — elbows flare directly back, not out', 'Press explosively back to start — squeeze triceps at full lockout'], tip: 'Diamond hand position narrows the grip and maximises tricep activation — the hardest bodyweight tricep exercise.' },
  { name: 'Tate Press', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Chest', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 60, steps: ['Lie flat on bench, DBs held above chest with elbows pointing up', 'Lower DBs by bending elbows outward — DBs lower to chest level', 'Elbows stay pointing up throughout — not tucking in', 'Press DBs back to start by extending elbows upward'], tip: 'The elbows-up position uniquely loads the lateral tricep head — a Dave Tate innovation rarely seen in commercial gyms.' },
  { name: 'Overhead Dumbbell Extension', cat: 'strength', muscle: 'arms', primary: 'Triceps Long Head', secondary: 'Anconeus', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Sit or stand, hold one DB with both hands overhead, arms extended', 'Lower DB behind head by bending elbows — upper arms stay vertical', 'Go until forearms are parallel to the floor or deeper for more stretch', 'Press back to full overhead extension — squeeze long head at lockout'], tip: 'Overhead position maximally stretches the long head — the largest of the three tricep heads and most important for size.' },
  { name: 'Tricep Bench Dip', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Anterior Deltoid, Chest', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Hands on bench behind you, fingers forward, feet on floor or elevated', 'Lower body by bending elbows — do not let elbows flare out wide', 'Lower until upper arms are parallel — do not go deeper than 90°', 'Press back to start through the triceps — not the shoulders'], tip: 'Keep hips close to the bench — the further your feet, the harder it is. Never dip with hips way out in front.' },
  { name: 'Single-Arm Tricep Pushdown', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Anconeus', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15 each', rest: 45, steps: ['D-handle on high cable, stand perpendicular, one hand at a time', 'Elbow pinned to side at 90° — it must not move during the rep', 'Push handle straight down to full lockout — fully extend the elbow', 'Return to 90° — do not let the weight pull elbow above 90° at top'], tip: 'Unilateral pushdowns fix tricep imbalances and allow you to feel each head contract independently.' },
  { name: 'V-Bar Pushdown', cat: 'strength', muscle: 'arms', primary: 'Triceps Lateral Head', secondary: 'Medial Head, Anconeus', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Attach V-bar to high cable, grip with neutral hands — palms facing each other', 'Elbows pinned to sides — stand upright, slight forward lean', 'Push bar down to full lockout — wrists stay neutral throughout', 'Return to 90° elbow angle — slow and controlled'], tip: 'V-bar grip puts the wrists in a natural position that reduces strain while isolating the lateral tricep head.' },
  { name: 'Rope Pushdown', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Anconeus', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Rope attachment on high cable, grip both ends, thumbs up', 'Elbows at sides — stand with slight forward lean for balance', 'Push rope down and flare hands outward at the bottom', 'The flare at the bottom maximally contracts the lateral and medial heads'], tip: 'Flaring the hands at the bottom creates a supramaximal contraction that a straight bar cannot replicate.' },
  { name: 'Dumbbell Kickback', cat: 'strength', muscle: 'arms', primary: 'Triceps Lateral Head', secondary: 'Anconeus', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15 each', rest: 45, steps: ['Hinge forward 45°, upper arm parallel to the floor and pinned there', 'Extend forearm back until arm is fully straight — elbow stays stationary', 'Hold 1 second at full extension — squeeze the lateral head', 'Lower to 90° — upper arm stays parallel to floor throughout'], tip: 'The lateral head is most active when the arm is behind the body — kickbacks are the ideal lateral head exercise.' },
  { name: 'JM Press', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Chest, Anterior Deltoid', equip: 'Barbell', level: 'advanced', sets: 4, reps: '6–8', rest: 90, steps: ['Lie on bench, bar set like a close-grip bench but elbows pointing forward', 'Lower bar toward neck — elbows go forward not out', 'At the bottom, bar is near neck and elbows are very high and forward', 'Press back explosively — the combined elbow position uniquely loads all three heads'], tip: 'JM Press is a powerlifter\'s tricep builder — a hybrid between skull crusher and close-grip bench that overloads all three heads.' },
  { name: 'Close-Grip Push-Up', cat: 'strength', muscle: 'arms', primary: 'Triceps', secondary: 'Chest, Anterior Deltoid', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '15–20', rest: 45, steps: ['Hands just inside shoulder width — slightly narrower than standard', 'Elbows tuck close to the torso throughout the entire movement', 'Lower chest between hands — elbows point backward, not outward', 'Press explosively — feel the triceps drive the lockout'], tip: 'Elbow position is everything — if they flare out, you\'ve converted it to a chest exercise. Keep them tucked.' },

  // ── BATCH 4 — Core (20) ──
  { name: 'Bicycle Crunch', cat: 'strength', muscle: 'core', primary: 'Obliques, Rectus Abdominis', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '20 total', rest: 45, steps: ['Lie on back, hands behind head — elbows wide, not pulling neck', 'Raise both legs off the floor, knees bent to 90°', 'Rotate torso bringing one elbow to the opposite knee — fully extend the other leg', 'Alternate in a controlled pedalling motion — quality over speed'], tip: 'Slow this down — bicycles done fast with momentum achieve nothing. Aim for 2 seconds per side.' },
  { name: 'Reverse Crunch', cat: 'strength', muscle: 'core', primary: 'Lower Rectus Abdominis', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Lie on back, arms at sides pressing floor, legs at 90°', 'Curl pelvis toward ribcage — hips lift slightly off the floor', 'The movement is a spinal curl, not a hip hinge — feel your lower abs initiate', 'Lower hips slowly — do not let them slam down'], tip: 'The reverse crunch is hip flexion plus posterior pelvic tilt — most people do only the hip flexion part and miss the ab work.' },
  { name: 'Mountain Climbers', cat: 'cardio', muscle: 'core', primary: 'Core, Hip Flexors', secondary: 'Shoulders, Triceps', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '30s', rest: 30, steps: ['Push-up position — shoulders stacked over wrists, hips level', 'Drive one knee toward chest — hips must not rise during the movement', 'Quickly switch legs — the drive and recovery is one rep', 'Maintain rigid plank form throughout — no bouncing hips'], tip: 'Hips rising is the most common error — if they come up, slow down and focus on keeping the plank position.' },
  { name: 'Toe Touches', cat: 'strength', muscle: 'core', primary: 'Upper Rectus Abdominis', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Lie on back, legs straight pointing to ceiling, arms extended overhead', 'Crunch upper body up, reaching hands toward toes', 'The movement is spinal flexion — do not just swing arms up', 'Lower under control — shoulders barely touch floor before next rep'], tip: 'Focus on the crunch initiating the movement — shoulders, not hands, should lead the way up.' },
  { name: 'Flutter Kicks', cat: 'strength', muscle: 'core', primary: 'Lower Abs, Hip Flexors', secondary: 'Quads', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '30s', rest: 30, steps: ['Lie on back, hands under lower back for lumbar support', 'Raise both legs 6 inches off the floor — back stays flat', 'Alternate kicking legs up and down in a small controlled range', 'Keep legs straight and toes pointed — engage core throughout'], tip: 'If your lower back arches off the floor, raise your legs higher — only go lower when you can maintain a flat back.' },
  { name: 'Scissor Kicks', cat: 'strength', muscle: 'core', primary: 'Lower Abs, Hip Flexors', secondary: 'Adductors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '30s', rest: 30, steps: ['Lie on back, hands under hips, both legs raised to 45°', 'Cross legs in a scissors pattern — alternate which leg passes over the top', 'Keep legs straight and core braced — back must stay flat', 'Maintain control — no wild swinging of the legs'], tip: 'Crossing the legs horizontally (not vertically like flutter kicks) increases adductor and lower ab co-activation.' },
  { name: 'Plank Shoulder Tap', cat: 'strength', muscle: 'core', primary: 'Core, Anti-Rotation', secondary: 'Shoulders, Triceps', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '20 total', rest: 45, steps: ['High push-up position — hands under shoulders, feet wide for stability', 'Tap one hand to the opposite shoulder — torso must not rotate', 'Replace hand and repeat on the other side — that is 2 reps', 'Squeeze glutes hard — this is what prevents hip rotation'], tip: 'The anti-rotation challenge is the point — if your hips shift with each tap, widen your feet stance.' },
  { name: 'Plank Hip Dip', cat: 'strength', muscle: 'core', primary: 'Obliques', secondary: 'Transverse Abdominis, Shoulders', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '20 total', rest: 30, steps: ['Forearm plank position — elbows under shoulders, body rigid', 'Rotate hips and dip one side toward the floor — controlled, not collapsed', 'Return to neutral plank before dipping the other side', 'Small movement — hips should only drop 6–8 inches each side'], tip: 'Hip dips are a dynamic oblique exercise built into a plank — the return to neutral is where the oblique works hardest.' },
  { name: 'V-Up', cat: 'strength', muscle: 'core', primary: 'Rectus Abdominis, Hip Flexors', secondary: 'Quads', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Lie flat, arms overhead, legs straight — everything touching the floor', 'Simultaneously raise arms and legs to meet above your hips', 'Touch hands to feet or shins — form a V at the top', 'Lower both arms and legs slowly back to the floor together'], tip: 'The V-up is a full-range spinal flexion exercise — much harder than a crunch and significantly more effective.' },
  { name: 'Hanging Leg Raise', cat: 'strength', muscle: 'core', primary: 'Lower Abs, Hip Flexors', secondary: 'Lats, Grip', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '10–15', rest: 60, steps: ['Hang from pull-up bar, arms fully extended, core braced', 'Raise legs by flexing at the hip — bring knees to chest or legs to parallel', 'Add posterior pelvic tilt at the top to feel the lower abs contract', 'Lower slowly — do not swing or use momentum'], tip: 'The posterior pelvic tilt at the top turns a hip flexion movement into a true abdominal exercise — most people skip this cue.' },
  { name: 'Ab Crunch Machine', cat: 'strength', muscle: 'core', primary: 'Rectus Abdominis', secondary: 'Obliques', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit in machine, hold handles or pads in front of chest or at sides of head', 'Flex spine — curl ribcage toward pelvis, not head toward knees', 'Squeeze abs hard at the bottom — hold 1 second', 'Return slowly — resist the weight on the way up'], tip: 'Think about bringing your ribcage to your hips, not your head to your knees — this is the difference between ab work and neck strain.' },
  { name: 'Copenhagen Plank', cat: 'strength', muscle: 'core', primary: 'Obliques, Adductors', secondary: 'Glute Medius, Core', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '20–30s each', rest: 60, steps: ['Set up in a side plank with top foot on a bench or box', 'Lift bottom leg off the floor to hover — adductors engage', 'Maintain a rigid side plank — no hip sag or rotation', 'Hold — this is one of the hardest core exercises for the lateral chain'], tip: 'The Copenhagen Plank has the highest adductor activation of any exercise tested — critical for groin injury prevention.' },
  { name: 'Bear Crawl', cat: 'cardio', muscle: 'core', primary: 'Core, Shoulders', secondary: 'Hip Flexors, Quads', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '20m', rest: 45, steps: ['On all fours, knees hovering 2 inches off the floor — do not let them touch', 'Move opposite hand and foot simultaneously — cross-pattern movement', 'Keep hips level — they should not rise or bob during movement', 'Breathe steadily — the hovering knees demand constant core tension'], tip: 'Hovering the knees 2 inches above the floor forces continuous core engagement that a normal crawl cannot replicate.' },
  { name: 'Stir the Pot', cat: 'strength', muscle: 'core', primary: 'Transverse Abdominis, Obliques', secondary: 'Shoulders, Core', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '10 each direction', rest: 60, steps: ['Forearm plank position with elbows on a Swiss ball — body rigid', 'Slowly draw circles with both elbows on the ball — clockwise', 'The ball moves, your body does not — anti-rotation is the goal', 'Complete circles in one direction then reverse'], tip: 'Invented by Stuart McGill — the circular motion creates unstable anti-rotation demand no rigid plank can replicate.' },
  { name: 'Cable Woodchop', cat: 'strength', muscle: 'core', primary: 'Obliques, Rotational Core', secondary: 'Shoulders, Lats', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15 each', rest: 60, steps: ['Cable set high to one side, grip handle with both hands, stand side-on', 'Rotate and pull cable diagonally down and across toward opposite hip', 'Keep arms nearly straight — the rotation comes from the torso, not the arms', 'Return slowly along the same diagonal path — resist the cable pulling you back'], tip: 'Rotational core strength is what protects the spine in sport and daily life — far more functional than crunches.' },
  { name: 'Suitcase Carry', cat: 'strength', muscle: 'core', primary: 'Obliques, Anti-Lateral Flexion', secondary: 'Traps, Forearms, Glutes', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '30m each', rest: 60, steps: ['Hold a heavy DB or KB in one hand at your side — like carrying a suitcase', 'Stand tall — do not lean toward the weight or away from it', 'Walk with controlled steps — shoulders level throughout', 'Switch hands after completing the distance'], tip: 'The core works hardest at preventing lateral lean — this is anti-lateral-flexion training, the most overlooked core function.' },
  { name: 'Single-Leg Plank', cat: 'strength', muscle: 'core', primary: 'Core, Glutes', secondary: 'Hamstrings, Shoulders', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '30s each', rest: 30, steps: ['Forearm plank position — elbows under shoulders, body rigid', 'Lift one leg 6 inches off the floor — foot flexed, knee straight', 'Hips must stay level — do not rotate toward the raised leg', 'Hold, then switch legs after each interval'], tip: 'Single-leg plank increases glute activation and core demand by 30% over a standard plank — a meaningful upgrade.' },
  { name: 'Tuck Crunch', cat: 'strength', muscle: 'core', primary: 'Rectus Abdominis', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Lie on back, knees bent toward chest, hands behind head — elbows wide', 'Crunch upper body up while simultaneously pulling knees to chest', 'Both ends of the body come together at the top', 'Lower both upper body and legs slowly — do not fully rest between reps'], tip: 'The double-crunch motion creates greater rectus abdominis activation than either a crunch or leg raise alone.' },
  { name: 'Pallof Press', cat: 'strength', muscle: 'core', primary: 'Anti-Rotation Core', secondary: 'Obliques, Transverse Abdominis', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15 each', rest: 60, steps: ['Stand perpendicular to a cable machine at chest height — cable tensions the torso', 'Hold the handle at chest with both hands', 'Press arms straight out — resist the cable trying to rotate your body', 'Hold 2 seconds extended, then return to chest slowly'], tip: 'Anti-rotation core training is what actually transfers to athletic performance — every spine surgeon recommends it.' },
  { name: 'Hollow Body Rock', cat: 'strength', muscle: 'core', primary: 'Transverse Abdominis, Hip Flexors', secondary: 'Lats, Glutes', equip: 'Bodyweight', level: 'advanced', sets: 4, reps: '10–15 rocks', rest: 60, steps: ['Hollow body hold position — lower back pressed to floor, arms overhead, legs raised', 'Gently rock forward and back maintaining the rigid hollow body shape', 'The shape must not change during the rocking — body stays compressed', 'If shape breaks, stop and reset — quality only'], tip: 'Hollow body rocking is a gymnastic core drill — it builds the reflexive core tension that transfers to every other lift.' },

  // ── BATCH 5 — Legs (25) ──
  { name: 'Box Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Hamstrings, Core', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '5–6', rest: 120, steps: ['Set a box at parallel depth or slightly below, bar on upper traps', 'Descend under control until you sit on the box — back stays upright', 'Pause completely on the box — eliminate the stretch reflex', 'Drive through the floor explosively — hips and shoulders rise together'], tip: 'The box pause eliminates elastic energy — every rep is raw strength. Powerlifters use this to fix squat weaknesses.' },
  { name: 'Dumbbell Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes, Core', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 75, steps: ['Hold DBs at sides, feet shoulder-width, toes slightly out', 'Brace core, chest up — initiate by pushing knees out over toes', 'Descend until thighs parallel — maintain upright torso', 'Drive through heels to standing — squeeze quads at lockout'], tip: 'Holding DBs at your sides keeps the centre of mass balanced — a good stepping stone before barbell squatting.' },
  { name: 'Sissy Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '10–15', rest: 75, steps: ['Stand holding a support with one hand for balance', 'Rise onto your toes, lean torso back as you lower your knees toward the floor', 'The torso leans back as the knees go forward — opposite of a normal squat', 'Return to standing by driving knees back and hips forward'], tip: 'Sissy squats put the quad through a unique terminal knee extension stretch — one of the only true quad isolation exercises.' },
  { name: 'Leg Extension', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Rectus Femoris', equip: 'Machine', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Adjust pad to sit just above the ankle — not on the shin', 'Sit upright, back against pad, hands on handles', 'Extend knees to full lockout — squeeze quads hard at top', 'Lower slowly over 3 seconds — do not let the weight drop'], tip: 'The slow eccentric (lowering) phase of the leg extension creates more quad damage and growth than the concentric.' },
  { name: 'Reverse Lunge', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Hamstrings, Core', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12 each', rest: 75, steps: ['Stand tall, DBs at sides', 'Step one foot directly backward — not to the side', 'Lower back knee toward floor under control', 'Drive through the front heel to return to standing — bring feet together'], tip: 'Reverse lunges are more knee-friendly than forward lunges because the shin stays more vertical over the front foot.' },
  { name: 'Lateral Lunge', cat: 'strength', muscle: 'legs', primary: 'Adductors, Glutes', secondary: 'Quadriceps, Core', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12 each', rest: 75, steps: ['Stand tall, DB at chest or at sides', 'Step wide to one side — keep the stepping foot pointing forward', 'Sit into the bent leg — knee over toes, straight leg stays planted', 'Push off the bent leg back to standing — feel the adductor and glute stretch'], tip: 'The lateral lunge trains the frontal plane — neglected by almost all leg programmes that only do forward/backward movement.' },
  { name: 'Curtsy Lunge', cat: 'strength', muscle: 'legs', primary: 'Glutes, Adductors', secondary: 'Quadriceps, Core', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '12–15 each', rest: 60, steps: ['Stand tall, hands on hips or at chest for balance', 'Step one foot behind and across the other in a curtsy pattern', 'Lower back knee toward the floor — keep front knee over toes', 'Drive through front foot to return to start position'], tip: 'The cross-behind motion creates a unique hip external rotation demand that targets the glute medius better than a standard lunge.' },
  { name: 'Wall Sit', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes, Core', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '45–60s', rest: 45, steps: ['Stand with back against a wall, feet shoulder-width, 2 feet from wall', 'Slide down until thighs are parallel to the floor — 90° at knees and hips', 'Arms at sides or on thighs — do not use arms to push off the thighs', 'Hold — breathe steadily throughout the isometric hold'], tip: 'The quad is under maximum isometric tension at 90° — this position has been shown to increase quad endurance and tendon strength.' },
  { name: 'Zercher Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Core', secondary: 'Glutes, Upper Back', equip: 'Barbell', level: 'advanced', sets: 3, reps: '6–8', rest: 120, steps: ['Hold bar in the crook of the elbows — bar rests on forearms, arms crossed', 'Stand tall, elbows held high and forward', 'Squat deep — the bar position forces an upright torso', 'Drive through heels to standing — elbows stay high throughout'], tip: 'Zercher squat demands more upper back and core bracing than any other squat variation — a total body strength test.' },
  { name: 'Overhead Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Core, Shoulders, Upper Back', equip: 'Barbell', level: 'advanced', sets: 3, reps: '5–6', rest: 120, steps: ['Press bar overhead in snatch-width grip — arms fully locked, bar behind the head', 'Feet slightly wider than shoulder-width, toes flared', 'Squat to full depth — maintain bar directly over the ankle throughout', 'Drive up through heels — bar must not drift forward during the ascent'], tip: 'The overhead squat is the ultimate mobility and stability test — it exposes every weakness in the shoulders, thoracic spine, and ankles.' },
  { name: 'Landmine Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Core, Upper Chest', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Hold bar end at chest height with both hands, landmine in front', 'Feet shoulder-width, squat down as bar descends in its arc', 'Keep chest proud — the bar guides you into an upright torso', 'Press bar back to chest height as you drive back to standing'], tip: 'The arc of the landmine naturally produces an upright squat pattern — excellent for those struggling with forward lean.' },
  { name: 'Skater Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Core, Balance', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '8–10 each', rest: 90, steps: ['Stand on one leg, other leg extended behind you slightly — not on anything', 'Lower by bending the standing knee — rear foot hovers above the floor', 'Lower until rear knee nearly touches the ground', 'Drive through the front heel to standing — full control throughout'], tip: 'Skater squats require single-leg control without the rear foot leverage of a Bulgarian split squat — significantly harder.' },
  { name: 'Single-Leg Press', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes, Hamstrings', equip: 'Machine', level: 'intermediate', sets: 3, reps: '12–15 each', rest: 75, steps: ['Set leg press to lower weight than bilateral — one leg at a time', 'Place one foot in the center of the plate, other leg crossed or hanging', 'Press through the heel to full extension — do not fully lock the knee', 'Lower slowly until 90° — full range every rep'], tip: 'Unilateral leg press reveals side-to-side strength imbalances and prevents the stronger leg from compensating.' },
  { name: 'Hamstring Slider Curl', cat: 'strength', muscle: 'legs', primary: 'Hamstrings', secondary: 'Glutes, Core', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '10–12', rest: 75, steps: ['Lie on back, feet on sliders or socks on a smooth floor, hips bridged up', 'Drive heels into the floor and slide both feet toward your hips', 'Keep hips elevated throughout — do not let them drop during the curl', 'Slide feet back out to the start — this eccentric is where it gets hard'], tip: 'The hamstring slider curl trains both hip extension and knee flexion simultaneously — the two functions the hamstring performs in sport.' },
  { name: 'Glute Ham Raise', cat: 'strength', muscle: 'legs', primary: 'Hamstrings, Glutes', secondary: 'Calves, Core', equip: 'Machine', level: 'advanced', sets: 3, reps: '6–10', rest: 90, steps: ['Anchor feet in GHD machine, body horizontal, hands at chest', 'Lower torso toward floor under hamstring control only — no hands yet', 'Use hands to assist from the floor back up if needed', 'Focus on the eccentric — the hamstring loading on the way down is everything'], tip: 'The glute ham raise is the most demanding closed-chain hamstring exercise — used by elite athletes to prevent hamstring tears.' },
  { name: 'Stiff-Leg Deadlift', cat: 'strength', muscle: 'legs', primary: 'Hamstrings', secondary: 'Glutes, Erectors', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '10–12', rest: 90, steps: ['Stand with bar at hips, knees locked straight — not bent like an RDL', 'Hinge forward, bar travels directly down the legs', 'Feel the deep hamstring stretch at the bottom — go until your back rounds slightly', 'Return to standing — the hamstring stretch is the point of this variation'], tip: 'Straight legs increase the hamstring stretch further than an RDL — a greater stretch means greater muscle activation.' },
  { name: 'Dumbbell Romanian Deadlift', cat: 'strength', muscle: 'legs', primary: 'Hamstrings, Glutes', secondary: 'Erectors', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '10–12', rest: 75, steps: ['Stand with DBs in front of thighs, palms facing thighs', 'Push hips back — soft knee bend — DBs travel down the front of the legs', 'Lower until a strong hamstring stretch is felt — back stays neutral', 'Drive hips forward to return — squeeze glutes at the top'], tip: 'DBs allow each hand to track its own natural path — reduces lat engagement needed to keep the bar close in a barbell RDL.' },
  { name: 'Pendulum Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes', equip: 'Machine', level: 'intermediate', sets: 4, reps: '10–15', rest: 90, steps: ['Load the pendulum squat machine, step in and position your back against the pad', 'Feet hip-width, low on the footplate', 'Squat to full depth — the arc of the machine keeps you upright', 'Drive through heels to lockout — do not bounce at the bottom'], tip: 'The pendulum squat arc mimics the natural path of a heel-elevated squat — maximum quad loading with minimal lower back stress.' },
  { name: 'Cyclist Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes', equip: 'Barbell', level: 'intermediate', sets: 3, reps: '12–15', rest: 75, steps: ['Elevate heels on plates or a wedge — 2 inches is enough', 'Barbell on upper traps, feet close together', 'Squat as deep as possible — heels elevated enables a very upright torso', 'Drive through the balls of the feet to standing — feel the quads work'], tip: 'Heel elevation shifts 90% of the load to the quads and virtually eliminates glutes — the purest quad exercise with a barbell.' },
  { name: 'Spanish Squat', cat: 'rehab', muscle: 'legs', primary: 'Quadriceps, VMO', secondary: 'Knee Stabilisers', equip: 'Band', level: 'beginner', sets: 3, reps: '30–45s hold', rest: 45, steps: ['Loop band around a fixed post at knee height, then behind both knees', 'Walk back until band is taut and holds the shins vertical', 'Squat down while the band holds your shins — vertical shin is key', 'Hold at parallel or below — a knee rehab and VMO activation drill'], tip: 'The band prevents the shins from coming forward — allows a deep squat position that strengthens the knee without knee stress.' },
  { name: 'Barbell Bulgarian Split Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Hamstrings, Core', equip: 'Barbell', level: 'advanced', sets: 4, reps: '6–8 each', rest: 120, steps: ['Bar on upper traps, rear foot on bench, front foot far forward', 'Brace hard — barbell makes balance significantly harder than dumbbells', 'Lower back knee toward floor — torso stays upright', 'Drive through front heel explosively — squeeze quad and glute at top'], tip: 'The barbell version allows much heavier loading than dumbbells — a critical progression for building serious leg mass.' },
  { name: 'Tempo Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Core, Hamstrings', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '4–5', rest: 120, steps: ['Set up as a standard back squat with moderate weight — 60–70% of max', 'Lower over 4 full seconds — count it out, do not rush', 'Pause 2 seconds at the bottom — eliminate all momentum', 'Drive up in 1 second — the contrast between slow down and fast up is the training stimulus'], tip: 'Tempo squats build greater connective tissue strength than regular squats — essential for long-term joint health.' },
  { name: 'Box Jump', cat: 'cardio', muscle: 'legs', primary: 'Quads, Glutes, Calves', secondary: 'Core, Hip Flexors', equip: 'Bodyweight', level: 'intermediate', sets: 4, reps: '8–10', rest: 60, steps: ['Stand arm\'s length from box, feet hip-width', 'Swing arms back, hinge hips — load the spring', 'Explode upward, pull knees to chest, land softly on full foot', 'Step — never jump — down from the box to protect your Achilles'], tip: 'Land with bent knees absorbing impact quietly — if you can hear the landing, you are not absorbing force properly.' },
  { name: 'Jump Squat', cat: 'cardio', muscle: 'legs', primary: 'Quads, Glutes', secondary: 'Calves, Core', equip: 'Bodyweight', level: 'intermediate', sets: 4, reps: '10', rest: 60, steps: ['Stand feet shoulder-width, arms at sides', 'Squat down to parallel — load up the spring', 'Explode upward as high as possible — arms swing forward to assist', 'Land softly with bent knees — immediately load into next squat'], tip: 'The amortisation phase (between landing and next jump) should be as short as possible — this is where reactive strength is built.' },

  // ── BATCH 5 — Glutes (15) ──
  { name: 'Banded Squat', cat: 'bands', muscle: 'glutes', primary: 'Gluteus Maximus, Glute Medius', secondary: 'Quadriceps', equip: 'Band', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Band above knees, feet shoulder-width — the band will pull knees in', 'Push knees OUT against band resistance throughout', 'Squat to parallel or below — keep pushing knees out', 'Drive up through heels — glute medius is challenged every rep'], tip: 'The act of pushing knees out against the band doubles the glute medius stimulus versus a standard squat.' },
  { name: 'Hip Abduction Machine', cat: 'strength', muscle: 'glutes', primary: 'Glute Medius', secondary: 'TFL, Hip Rotators', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit in machine, pads on outer thighs — adjust to starting position', 'Press thighs outward against pads — squeeze glute medius at full abduction', 'Hold 1 second at peak — return under control — do not let weight slam', 'Lower slowly — the eccentric loads the medius as much as the concentric'], tip: 'One of the few direct glute medius exercises — a muscle that prevents the knee from collapsing inward during squats and runs.' },
  { name: 'Cable Hip Abduction', cat: 'strength', muscle: 'glutes', primary: 'Glute Medius', secondary: 'TFL, Hip Rotators', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20 each', rest: 45, steps: ['Ankle strap on low cable, stand side-on to machine', 'Standing leg slightly bent — hold machine for balance', 'Drive working leg out to the side to 45° — do not lean into it', 'Return slowly — constant cable tension unlike a machine'], tip: 'Standing cable abduction requires balance from the standing leg — trains the glute medius bilaterally in a functional pattern.' },
  { name: 'Dumbbell Hip Thrust', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings, Core', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['Upper back on bench, DB across hips, feet flat shoulder-width', 'Drive hips up — hold DB with both hands so it does not slide', 'Full hip extension at the top — squeeze glutes hard for 2 seconds', 'Lower slowly — do not let hips touch floor between reps'], tip: 'DB hip thrust is the ideal regression before loading with a barbell — can be loaded heavily with the right dumbbell weight.' },
  { name: 'Barbell Glute Bridge', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings, Core', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '12–15', rest: 75, steps: ['Lie on floor, bar across hips with pad, feet flat hip-width', 'Drive heels into floor and push hips up to full extension', 'Squeeze glutes at the top — no lower back arch', 'Lower until hips are 1 inch from floor — do not touch, repeat'], tip: 'Glute bridge on floor has a shorter ROM than hip thrust on a bench — but allows heavier loading for strength work.' },
  { name: 'Single-Leg Hip Thrust', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings, Core', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '12–15 each', rest: 60, steps: ['Upper back on bench, one foot on floor — the working leg — other leg extended up', 'Drive through the heel of the working foot to full hip extension', 'Squeeze the glute at the top — the extended leg should not touch the floor', 'Lower slowly — one rep done — repeat without resting'], tip: 'Single-leg hip thrust doubles the load on one glute — reveals and corrects left-right glute strength imbalances quickly.' },
  { name: 'Donkey Kick', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20 each', rest: 30, steps: ['On all fours, knees under hips, hands under shoulders', 'Keeping knee bent at 90°, drive one heel toward the ceiling', 'Squeeze glute hard at the top — hip should be fully extended', 'Lower under control — do not let knee touch floor between reps'], tip: 'The knee bent position isolates the gluteus maximus and minimises hamstring contribution — a pure glute drill.' },
  { name: 'Fire Hydrant', cat: 'rehab', muscle: 'glutes', primary: 'Glute Medius', secondary: 'Hip External Rotators', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20 each', rest: 30, steps: ['On all fours, neutral spine throughout', 'Lift one knee out to the side — like a dog at a fire hydrant', 'Raise as high as hip mobility allows — do not rotate the torso', 'Lower under control — core stays engaged the whole time'], tip: 'Fire hydrants train the hip external rotation function of glute medius — critical for knee stability and hip health.' },
  { name: 'Monster Walk', cat: 'bands', muscle: 'glutes', primary: 'Glute Medius', secondary: 'Abductors, Quads', equip: 'Band', level: 'beginner', sets: 3, reps: '20 steps each', rest: 30, steps: ['Band above knees, squat to athletic position — slight knee bend, hips back', 'Walk diagonally forward in a wide zigzag pattern', 'Keep tension in the band — feet never come fully together', 'Return walking backward in the same pattern'], tip: 'The monster walk keeps the glute medius under tension in a semi-squat — more functional than a stationary hip abduction.' },
  { name: 'Seated Hip Abduction', cat: 'strength', muscle: 'glutes', primary: 'Glute Medius', secondary: 'TFL', equip: 'Machine', level: 'beginner', sets: 3, reps: '20–25', rest: 30, steps: ['Sit in the hip abduction machine with pads on outer thighs', 'Lean forward slightly — this recruits glute medius more than sitting upright', 'Drive thighs apart to maximum range — squeeze at full abduction', 'Return slowly — high reps and constant tension is the key here'], tip: 'Leaning slightly forward in the hip abduction machine increases glute medius activation by up to 25% versus sitting upright.' },
  { name: 'Reverse Hyperextension Machine', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings, Erectors', equip: 'Machine', level: 'intermediate', sets: 3, reps: '15–20', rest: 60, steps: ['Lie face-down with hips at the edge of the pad, legs hanging with ankles strapped', 'Hold the handles firmly — do not let torso lift off the pad', 'Swing legs up powerfully to hip extension — squeeze glutes at top', 'Lower slowly — legs drop below horizontal for full glute stretch'], tip: 'The reverse hyperextension decompresses the lumbar spine on the lowering phase — unique in being rehabilitative while building strength.' },
  { name: 'Kettlebell Swing', cat: 'cardio', muscle: 'glutes', primary: 'Gluteus Maximus, Hamstrings', secondary: 'Core, Traps', equip: 'Kettlebell', level: 'intermediate', sets: 4, reps: '15–20', rest: 60, steps: ['Stand with KB between feet, hinge at hips, neutral spine', 'Hike the KB back between the legs like a hike snap in football', 'Drive hips forward explosively — the hip snap launches the KB forward', 'Let KB float to chest height — no arm pull — hips do all the work'], tip: 'The kettlebell swing is a ballistic hip hinge — the bell is launched by the hips, not lifted by the arms. Most people use too much arm.' },
  { name: 'Hip Circle Walk', cat: 'bands', muscle: 'glutes', primary: 'Glute Medius, Hip Rotators', secondary: 'Abductors', equip: 'Band', level: 'beginner', sets: 3, reps: '20 steps each', rest: 30, steps: ['Band around ankles, stand in athletic position with slight knee bend', 'Walk in a large circle — stepping sideways and forward simultaneously', 'Maintain constant tension in the band — feet never fully close together', 'Complete the circle, then reverse direction'], tip: 'The diagonal step pattern activates glute medius in all three planes of motion — more complete than a straight lateral walk.' },
  { name: 'Bulgarian Hip Thrust', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Quadriceps, Core', equip: 'Dumbbell', level: 'advanced', sets: 3, reps: '10–12 each', rest: 90, steps: ['Rear foot elevated on bench in a split squat position, DB across hips', 'Lower hips toward floor in a hip thrust pattern — not a lunge', 'Drive hips forward and up — squeeze glute at full extension', 'The rear elevated position increases ROM over a standard hip thrust'], tip: 'Elevating the rear foot in a hip thrust increases glute ROM by extending the hip beyond neutral — a superior stretch-to-squeeze movement.' },
  { name: 'Squat to Hip Abduction', cat: 'bands', muscle: 'glutes', primary: 'Gluteus Maximus, Glute Medius', secondary: 'Quadriceps', equip: 'Band', level: 'beginner', sets: 3, reps: '12–15', rest: 45, steps: ['Band above knees, feet shoulder-width', 'Squat to parallel pushing knees out against the band', 'As you rise, shift to one leg and extend the other out to the side', 'Return the extended leg to the floor and squat again — alternate sides'], tip: 'This combination trains both glute max (in the squat) and glute medius (in the abduction) — two glute functions in one movement.' },

  // ── BATCH 6a — Calves (8) ──
  { name: 'Smith Machine Calf Raise', cat: 'strength', muscle: 'calves', primary: 'Gastrocnemius', secondary: 'Soleus', equip: 'Machine', level: 'beginner', sets: 4, reps: '15–20', rest: 45, steps: ['Place a step or plate under the Smith bar footpads, balls of feet on edge', 'Lower heels as far below the step as possible — full stretch', 'Rise onto tiptoes to full extension — squeeze at the very top', 'Lower slowly over 3 seconds — the eccentric builds calf mass'], tip: 'The Smith machine allows you to focus entirely on the calf without balancing — ideal for maximising load and ROM.' },
  { name: 'Standing Machine Calf Raise', cat: 'strength', muscle: 'calves', primary: 'Gastrocnemius', secondary: 'Soleus', equip: 'Machine', level: 'beginner', sets: 4, reps: '15–20', rest: 45, steps: ['Shoulder pads in place, balls of feet on platform edge', 'Lower heels below the platform for full gastrocnemius stretch', 'Rise to full tippy-toe extension — hold 2 seconds', 'Lower slowly — 3 to 4 seconds down for maximum time under tension'], tip: 'Calves have a high proportion of slow-twitch fibres — they respond better to slow eccentrics and high reps than any other muscle.' },
  { name: 'Calf Raise on Leg Press', cat: 'strength', muscle: 'calves', primary: 'Gastrocnemius', secondary: 'Soleus', equip: 'Machine', level: 'beginner', sets: 4, reps: '20–25', rest: 30, steps: ['Sit in leg press, extend legs to near-lockout, only balls of feet on lower edge of plate', 'Lower heels by dorsiflexing — platform edge allows a full stretch', 'Push through balls of feet to full plantarflexion — squeeze at the top', 'Control the return — 3 seconds down every rep'], tip: 'Leg press calf raises allow very heavy loading without axial spine compression — best machine for overloading the calf.' },
  { name: 'Tibialis Raise', cat: 'rehab', muscle: 'calves', primary: 'Tibialis Anterior', secondary: 'Ankle Stabilisers', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Stand with heels on a step or low ledge, toes hanging off', 'Dorsiflex — pull toes up toward shins as high as possible', 'Hold at the top for 1 second — feel the tibialis anterior work', 'Lower toes slowly back below the step level'], tip: 'Tibialis anterior training prevents shin splints and improves ankle dorsiflexion — the most neglected lower leg muscle.' },
  { name: 'Eccentric Calf Drop', cat: 'strength', muscle: 'calves', primary: 'Gastrocnemius', secondary: 'Soleus, Achilles Tendon', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '10–15', rest: 60, steps: ['Stand on a step on both feet, rise to tiptoes on both feet together', 'Transfer weight to one foot only at the top', 'Lower slowly on the single leg over 4–6 seconds — heel below step level', 'Use both feet to rise again — the eccentric single-leg is the point'], tip: 'Eccentric single-leg calf drops are the gold standard treatment for Achilles tendinopathy — they also build exceptional calf mass.' },
  { name: 'Banded Calf Raise', cat: 'bands', muscle: 'calves', primary: 'Gastrocnemius', secondary: 'Soleus', equip: 'Band', level: 'beginner', sets: 3, reps: '20–25', rest: 30, steps: ['Sit on a bench, band looped around the ball of one foot, ends held in hands', 'Start with foot dorsiflexed — band pulling your foot toward you', 'Plantarflex against band resistance — push toes away from you', 'Return slowly to full dorsiflexion — constant band tension throughout'], tip: 'Seated band calf raises target the soleus specifically because the knee is bent — the same benefit as a seated calf machine.' },
  { name: 'Seated Dumbbell Calf Raise', cat: 'strength', muscle: 'calves', primary: 'Soleus', secondary: 'Gastrocnemius', equip: 'Dumbbell', level: 'beginner', sets: 4, reps: '15–20', rest: 30, steps: ['Sit on a bench, DB balanced on one knee, balls of foot on a plate or step', 'Lower heel below the step for full soleus stretch', 'Rise to full plantarflexion — squeeze at the top', 'Lower slowly — the seated position targets the soleus, not the gastroc'], tip: 'Knee bent at 90° virtually removes the gastrocnemius — this rep range and position is purely soleus training.' },
  { name: 'Jump Rope', cat: 'cardio', muscle: 'calves', primary: 'Gastrocnemius, Soleus', secondary: 'Calves, Coordination', equip: 'Bodyweight', level: 'beginner', sets: 5, reps: '60s', rest: 30, steps: ['Hold handles at hip height, rope behind you to start', 'Jump on the balls of both feet — heels never touch the ground', 'Small jumps — 1 to 2 inches off the ground is enough', 'Keep elbows in, wrists drive the rope — not the whole arm'], tip: 'Jumping rope burns more calories per minute than running at the same perceived effort — and trains calves simultaneously.' },

  // ── BATCH 6a — Traps (8) ──
  { name: 'Power Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Levator Scapulae, Forearms', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '8–10', rest: 90, steps: ['Set barbell heavier than a standard shrug — this uses body drive', 'Slight dip at knees, then extend knees and shrug explosively', 'The knee drive adds momentum — use it to overload the traps', 'Reset between reps — this is not a continuous movement'], tip: 'Power shrugs overload the traps through a range that strict shrugs cannot reach — used by Olympic weightlifters for trap development.' },
  { name: 'Clean Pull', cat: 'strength', muscle: 'traps', primary: 'Upper Traps, Erectors', secondary: 'Glutes, Hamstrings', equip: 'Barbell', level: 'advanced', sets: 4, reps: '4–5', rest: 120, steps: ['Set up as a conventional deadlift — this is the pulling part of the clean', 'Pull the bar explosively — once it passes the knee, extend the hips fast', 'Shrug violently at the top — rise onto toes', 'Let the bar drop under control — do not catch it'], tip: 'The clean pull trains the traps through a full explosive shrug that no static shrug can replicate — great for athletes.' },
  { name: 'Behind-the-Back Barbell Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius, Mid Traps', secondary: 'Rhomboids', equip: 'Barbell', level: 'intermediate', sets: 4, reps: '12–15', rest: 75, steps: ['Hold barbell behind your body at arm length — like a reverse deadlift position', 'Stand tall, retract scapulae slightly', 'Shrug straight up — the bar behind you changes the line of pull', 'Lower fully — full scapular depression before each rep'], tip: 'The behind-the-back position shifts the line of pull to target mid-traps more than a standard front shrug.' },
  { name: 'Incline Dumbbell Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Rhomboids', equip: 'Dumbbell', level: 'intermediate', sets: 3, reps: '12–15', rest: 60, steps: ['Lie face-down on a 30° incline bench, DBs hanging below', 'Shrug shoulders straight up toward ears — no body momentum possible', 'Hold at top for 2 seconds — squeeze traps hard', 'Lower to full depression — each rep starts from a fully stretched position'], tip: 'The prone position eliminates all body swing — the most isolated dumbbell shrug variation possible.' },
  { name: 'Kettlebell Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Levator Scapulae', equip: 'Kettlebell', level: 'beginner', sets: 3, reps: '15–20', rest: 60, steps: ['Hold KBs at sides by the handles, stand tall', 'Shrug straight up — the horn-grip of a KB is thicker than a DB, training grip too', 'Squeeze traps at the top for 2 seconds', 'Lower fully — complete depression before the next rep'], tip: 'Kettlebell handles are thicker and require more grip engagement — builds forearm and grip strength alongside the traps.' },
  { name: 'Dumbbell Upright Row', cat: 'strength', muscle: 'traps', primary: 'Upper Traps, Lateral Deltoid', secondary: 'Biceps, Rear Deltoid', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '12–15', rest: 60, steps: ['DBs at thighs, overhand grip, stand tall', 'Pull DBs up along the front of the body to chin level', 'Elbows flare out and rise above the wrists at the top', 'Lower under control — do not just drop the weight'], tip: 'Dumbbell upright rows allow each arm to track its natural path — less wrist strain than a barbell version.' },
  { name: 'Barbell High Pull', cat: 'strength', muscle: 'traps', primary: 'Upper Traps, Lateral Deltoid', secondary: 'Biceps, Erectors', equip: 'Barbell', level: 'advanced', sets: 4, reps: '5–6', rest: 120, steps: ['Deadlift setup — bar on floor, conventional grip', 'Pull bar explosively from floor, shrugging and pulling elbows high at the top', 'Bar rises to upper chest level with elbows flaring above wrists', 'Lower under control — this is a partial clean without the catch'], tip: 'The high pull trains explosive trap and delt recruitment — a staple of Olympic weightlifting accessory work.' },
  { name: 'Seated Cable Shrug', cat: 'strength', muscle: 'traps', primary: 'Upper Trapezius', secondary: 'Mid Traps', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 45, steps: ['Sit at a cable row station, hold bar at arms length, seated upright', 'Shrug straight up against constant cable tension', 'Hold at peak for 2 seconds — squeeze traps hard', 'Lower slowly to full depression — cable maintains tension throughout'], tip: 'Seated position eliminates leg drive — all load goes directly to the traps with no momentum possible.' },

  // ── BATCH 6a — Forearms (8) ──
  { name: 'Towel Pull-Up', cat: 'strength', muscle: 'forearms', primary: 'Grip, Forearms', secondary: 'Lats, Biceps', equip: 'Bodyweight', level: 'advanced', sets: 3, reps: '5–8', rest: 120, steps: ['Loop two towels over a pull-up bar — one for each hand', 'Grip the hanging towel ends tightly — this is unstable and demands grip strength', 'Perform pull-ups normally — the towel diameter crushes the hand harder than any bar', 'Lower under full control — grip is the limiter here'], tip: 'Towel pull-ups develop crushing grip strength that carries over to every pulling exercise and sport.' },
  { name: 'Wrist Roller', cat: 'strength', muscle: 'forearms', primary: 'Wrist Flexors, Extensors', secondary: 'Brachioradialis', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '3 full rolls each', rest: 60, steps: ['Hold a dowel or bar with a rope and weight attached at arms length', 'Roll the weight up by alternately flexing wrists forward', 'Once fully rolled up, reverse — unroll with control', 'Keep arms parallel to the floor throughout — no arm drop'], tip: 'The wrist roller trains both flexors and extensors through their full range — the most complete forearm exercise available.' },
  { name: 'Cable Wrist Curl', cat: 'strength', muscle: 'forearms', primary: 'Wrist Flexors', secondary: 'Brachioradialis', equip: 'Machine', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Kneel at low cable, forearm on thigh or bench, palm up, hold handle', 'Let wrist extend fully — hand drops below the forearm', 'Curl wrist upward to full flexion', 'Lower slowly — constant cable tension at the bottom unlike free weights'], tip: 'Cable wrist curls maintain tension at the stretched position where dumbbells have zero load — superior stimulus.' },
  { name: 'Dumbbell Wrist Curl', cat: 'strength', muscle: 'forearms', primary: 'Wrist Flexors', secondary: 'Forearm Belly', equip: 'Dumbbell', level: 'beginner', sets: 3, reps: '15–20', rest: 30, steps: ['Sit, forearm resting on thigh palm-up, DB in hand', 'Let DB roll to fingertips — full wrist extension at the bottom', 'Curl wrist and fingers upward to full flexion', 'Lower slowly — the finger-roll at the bottom is the key movement'], tip: 'Rolling the DB to the fingertips at the bottom targets the finger flexors as well as the wrist flexors — more complete stimulation.' },
  { name: 'Pinch Block', cat: 'strength', muscle: 'forearms', primary: 'Pinch Grip, Thumb', secondary: 'Wrist Flexors', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '30–45s each', rest: 60, steps: ['Stack two 10kg plates together smooth side out, pinch between thumb and fingers', 'Hold at arm length at hip level — stand tall', 'Hold as long as possible — set the plates down with control', 'Rest and repeat for prescribed sets'], tip: 'Pinch grip (thumb vs fingers) is the weakest grip pattern for most lifters — training it directly transfers to wrist health.' },
  { name: 'Gripper', cat: 'strength', muscle: 'forearms', primary: 'Hand Grip, Forearms', secondary: 'Flexor Digitorum', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10–15 each', rest: 30, steps: ['Hold a hand gripper in one hand — calibrated resistance level', 'Close the gripper fully so both handles touch', 'Hold the closed position for 2 seconds — squeeze hard', 'Open slowly under control — the eccentric builds more strength'], tip: 'Working through progressively harder gripper levels is the most systematic way to develop crushing grip strength.' },
  { name: 'Rice Bucket', cat: 'rehab', muscle: 'forearms', primary: 'Wrist Flexors, Extensors', secondary: 'Finger Flexors, Intrinsics', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '3–5 min', rest: 0, steps: ['Fill a bucket with dry rice — your hand should sink in easily', 'Open and close hand in the rice — like squeezing and releasing', 'Rotate wrist — flex, extend, pronate, supinate against the resistance', 'Vary the movements — scooping, twisting, finger spreading'], tip: 'Rice bucket training was used by pitchers and martial artists for decades — provides 3D forearm stimulus no equipment can replicate.' },
  { name: 'Finger Extension Band', cat: 'rehab', muscle: 'forearms', primary: 'Finger Extensors', secondary: 'Wrist Extensors', equip: 'Band', level: 'beginner', sets: 3, reps: '20–25', rest: 20, steps: ['Loop a rubber band around all five fingers on one hand', 'Start with fingers together — spread them apart against band resistance', 'Open hand as wide as possible — feel the extensors activate', 'Return fingers together slowly — resist the band pulling them closed'], tip: 'Finger extensors are completely neglected in standard training — this simple drill prevents tennis elbow and improves grip balance.' },

  // ── BATCH 6b — Cardio (10) ──
  { name: 'Burpee', cat: 'cardio', muscle: 'general', primary: 'Full Body', secondary: 'Core, Cardio', equip: 'Bodyweight', level: 'intermediate', sets: 4, reps: '10', rest: 60, steps: ['Stand, drop hands to floor — jump or step feet back into push-up position', 'Perform one push-up — chest touches floor', 'Jump or step feet forward to hands', 'Explosively jump up reaching arms overhead — that is one rep'], tip: 'The push-up is non-negotiable — burpees without a push-up are just a squat thrust and miss most of the upper body demand.' },
  { name: 'Battle Rope Waves', cat: 'cardio', muscle: 'general', primary: 'Shoulders, Core', secondary: 'Arms, Cardio', equip: 'Bodyweight', level: 'intermediate', sets: 5, reps: '30s', rest: 30, steps: ['Hold one end of the rope in each hand, athletic stance, slight knee bend', 'Alternate driving each arm up and down creating waves', 'Keep waves large — small waves indicate too much fatigue, rest or reduce time', 'Maintain strong core — do not let torso collapse'], tip: 'Battle ropes have the highest metabolic demand of any implement studied — 30 seconds is genuinely very hard done correctly.' },
  { name: 'Sled Push', cat: 'cardio', muscle: 'legs', primary: 'Quads, Glutes', secondary: 'Core, Calves', equip: 'Bodyweight', level: 'intermediate', sets: 5, reps: '20m', rest: 90, steps: ['Load sled with moderate weight, hands on the handles, lean forward', 'Drive with alternating powerful leg steps — short, fast strides', 'Keep body at about 45° lean — torso parallel reduces power', 'Push continuously for the full distance without stopping mid-run'], tip: 'Sled pushes have zero eccentric component — no muscle damage, no soreness, and can be trained daily. Underrated recovery tool.' },
  { name: 'Rowing Machine', cat: 'cardio', muscle: 'back', primary: 'Lats, Legs, Core', secondary: 'Full Body Cardio', equip: 'Machine', level: 'beginner', sets: 1, reps: '20 min', rest: 0, steps: ['Strap feet in, grab handle with overhand grip, knees bent at start', 'Drive legs first — 60% of power — then lean back, then pull with arms', 'Reverse in the same sequence — arms, body, legs on the recovery', 'Maintain a stroke rate of 18–24 per minute for steady state'], tip: 'Most people rush the return — the recovery should take twice as long as the drive for optimal power production.' },
  { name: 'Assault Bike Intervals', cat: 'cardio', muscle: 'cardio', primary: 'Full Body Conditioning', secondary: 'Cardio, Legs, Arms', equip: 'Machine', level: 'intermediate', sets: 8, reps: '20s max effort', rest: 40, steps: ['Sit upright, both hands on moving handles, feet on pedals', 'Sprint as hard as absolutely possible for the entire 20 seconds', 'The bike resists harder the faster you go — there is no ceiling on difficulty', 'Rest 40 seconds — breathing controlled — then repeat'], tip: '20-second max efforts on the Assault Bike elicit the same cardiorespiratory response as a 4-minute all-out run — in a fraction of the time.' },
  { name: 'Stair Climber', cat: 'cardio', muscle: 'legs', primary: 'Glutes, Quads', secondary: 'Calves, Cardio', equip: 'Machine', level: 'beginner', sets: 1, reps: '20–30 min', rest: 0, steps: ['Step on the machine, set speed to a challenging but sustainable pace', 'Stand upright — do not lean on the handrails for support', 'Take full steps — not half-steps — for maximum glute engagement', 'Maintain pace steadily — this is a cardiovascular and glute endurance workout'], tip: 'Leaning on the handrails reduces calorie burn by up to 25% and removes the glute demand — stand unsupported.' },
  { name: 'High Knees', cat: 'cardio', muscle: 'cardio', primary: 'Hip Flexors, Cardio', secondary: 'Core, Calves', equip: 'Bodyweight', level: 'beginner', sets: 4, reps: '30s', rest: 30, steps: ['Stand tall, run in place driving knees up to hip height alternately', 'Pump arms vigorously — opposite arm to knee like sprinting', 'Stay on the balls of the feet — heels should not touch the ground', 'Keep torso upright — do not lean back as fatigue builds'], tip: 'High knees are essentially running in place — the hip flexor demand is much higher than regular running due to the exaggerated knee drive.' },
  { name: 'Shuttle Run', cat: 'cardio', muscle: 'cardio', primary: 'Glutes, Quads', secondary: 'Cardio, Agility', equip: 'Bodyweight', level: 'beginner', sets: 6, reps: '10m×4', rest: 60, steps: ['Mark two cones 10 metres apart — sprint from one to the other', 'Touch the ground or cone at each end — this forces deceleration', 'Sprint back immediately — the change of direction is the stimulus', 'Complete 4 lengths per set — each set is 40m total'], tip: 'The deceleration and change of direction in shuttles trains muscles eccentrically in a way straight sprinting never does.' },
  { name: 'Rowing Sprints', cat: 'cardio', muscle: 'back', primary: 'Legs, Lats, Core', secondary: 'Full Body, Cardio', equip: 'Machine', level: 'intermediate', sets: 8, reps: '250m sprint', rest: 90, steps: ['On rowing machine, set monitor to 250m goal', 'Sprint the 250m at maximum effort — first 5 strokes are the most important', 'Drive legs explosively — the catch position should feel like a squat', 'Rest 90 seconds and repeat for prescribed sets'], tip: '250m sprints at max effort are one of the best HIIT protocols for VO2max improvement — study-backed and brutal.' },
  { name: 'Bear Crawl Sprint', cat: 'cardio', muscle: 'general', primary: 'Core, Shoulders, Hips', secondary: 'Full Body, Cardio', equip: 'Bodyweight', level: 'intermediate', sets: 4, reps: '15m', rest: 60, steps: ['Bear crawl position — knees 2 inches off the floor, on all fours', 'Move as fast as possible while keeping knees off the ground', 'Drive opposite hand and foot simultaneously — fast and powerful', 'Do not let hips rise — keep the position throughout the sprint'], tip: 'Bear crawl sprints at full speed test coordination and full-body power in a way no traditional cardio modality can replicate.' },

  // ── BATCH 6b — Rehab / Recovery / Stretch / Yoga (12) ──
  { name: 'Scapular Wall Slide', cat: 'rehab', muscle: 'rear-delt', primary: 'Lower Traps, Serratus', secondary: 'Rotator Cuff, Rhomboids', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10–12', rest: 30, steps: ['Stand against wall, lower back and head touching, arms in goalpost position', 'Both forearms and backs of hands must touch the wall throughout', 'Slide arms overhead maintaining wall contact — stop where contact breaks', 'Return to goalpost — the wall is the feedback mechanism'], tip: 'Loss of wall contact reveals the exact point of shoulder mobility restriction — work just to that point each session.' },
  { name: 'Hip 90/90 Stretch', cat: 'stretch', muscle: 'legs', primary: 'Hip External and Internal Rotators', secondary: 'Piriformis, Glutes', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '60s each', rest: 0, steps: ['Sit with both knees bent to 90° — one in front, one to the side', 'Both shins are parallel — front shin faces sideways, back shin faces back', 'Sit tall, keeping hips flat on the floor — no leaning', 'Hold the position breathing deeply — switch sides after 60 seconds'], tip: 'The 90/90 stretch simultaneously works both internal and external hip rotation — no other stretch achieves this.' },
  { name: 'Foam Roll - IT Band', cat: 'recovery', muscle: 'legs', primary: 'IT Band, TFL', secondary: 'Lateral Quad', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '60–90s each', rest: 0, steps: ['Lie on side, roller under the outer thigh, support on forearm', 'Roll from hip down to just above the knee', 'Pause on any tender spots for 10–20 seconds', 'Use opposite foot on floor to control the pressure'], tip: 'The IT band itself has no muscle tissue — focus rolling on the TFL at the hip and the lateral quad for real relief.' },
  { name: 'Foam Roll - Upper Back', cat: 'recovery', muscle: 'back', primary: 'Thoracic Spine, Rhomboids', secondary: 'Erectors, Traps', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '60s', rest: 0, steps: ['Sit on floor, roller behind you at mid-back level — not lower back', 'Hands behind head, lean back over the roller', 'Roll slowly up the thoracic spine — stop at any stiff segment', 'Extend over the roller at each segment — open the chest'], tip: 'Never foam roll the lumbar spine — only the thoracic region from T1 to T12 should be mobilised this way.' },
  { name: 'Lacrosse Ball Pec Release', cat: 'recovery', muscle: 'chest', primary: 'Pectoralis Minor, Anterior Deltoid', secondary: 'Coracobrachialis', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '90s each', rest: 0, steps: ['Place lacrosse ball in the pec minor — just inside and below the shoulder', 'Lean into a wall or lie face-down on the ball', 'Slowly move your arm through various ranges — up, across, down', 'Pause on tender points — breathe into them for release'], tip: 'Tight pec minor is the primary cause of rounded shoulders and forward head posture — releasing it is transformative.' },
  { name: 'Overhead Tricep Stretch', cat: 'stretch', muscle: 'arms', primary: 'Triceps Long Head', secondary: 'Lats', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '30–45s each', rest: 0, steps: ['Raise one arm overhead and bend the elbow — hand drops behind the head', 'Use opposite hand to gently push the elbow further behind the head', 'Feel the stretch in the long head of the tricep and into the lat', 'Hold breathing deeply — deepen on each exhale'], tip: 'The long head crosses the shoulder joint — stretching it with the arm overhead releases both tricep and lat tightness simultaneously.' },
  { name: 'Cross-Body Shoulder Stretch', cat: 'stretch', muscle: 'rear-delt', primary: 'Posterior Capsule, Rear Deltoid', secondary: 'Rhomboids', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '30s each', rest: 0, steps: ['Bring one arm across the body at shoulder height — straight arm', 'Use other hand or forearm to gently pull it closer to the chest', 'Feel the stretch in the back of the shoulder — posterior capsule', 'Hold without forcing — breathe deeply into the stretch'], tip: 'Posterior shoulder tightness is the most common overhead pressing restriction — this stretch is the primary fix.' },
  { name: 'Standing Quad Stretch', cat: 'stretch', muscle: 'legs', primary: 'Quadriceps, Rectus Femoris', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '30–40s each', rest: 0, steps: ['Stand on one foot, hold a wall for balance if needed', 'Bend the free knee and grab the ankle — pull heel toward glute', 'Keep knees together — do not let the stretching knee drift wide', 'Tilt pelvis slightly posterior — this increases the rectus femoris stretch'], tip: 'Tilting the pelvis posteriorly (tucking the tail) adds hip extension to the stretch — targeting the rectus femoris which crosses both joints.' },
  { name: 'Triangle Pose', cat: 'yoga', muscle: 'legs', primary: 'Hamstrings, Adductors', secondary: 'Spine, Obliques', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '5 breaths each', rest: 0, steps: ['Wide stance, front foot forward, back foot at 90°', 'Extend arms parallel to floor, hinge at the hip toward the front leg', 'Lower front hand to shin, ankle, or floor — top arm reaches to ceiling', 'Hold, breathing into the side body stretch — switch sides'], tip: 'Triangle pose stretches the lateral chain — the IT band, obliques, and adductors in one position that no gym machine replicates.' },
  { name: 'Lizard Pose', cat: 'yoga', muscle: 'legs', primary: 'Hip Flexors, Adductors', secondary: 'Glutes, Thoracic Spine', equip: 'Bodyweight', level: 'intermediate', sets: 1, reps: '8 breaths each', rest: 0, steps: ['From downward dog, step one foot outside the same-side hand', 'Lower the back knee to the ground — pad it if needed', 'Walk the front foot slightly wider than the hand', 'Option to lower onto forearms for a deeper hip flexor and groin stretch'], tip: 'Lizard pose provides the deepest hip flexor and groin stretch of any yoga position — essential for those who sit for long periods.' },
  { name: 'Supine Twist', cat: 'yoga', muscle: 'back', primary: 'Thoracic Spine, Obliques', secondary: 'Glutes, IT Band', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '8 breaths each', rest: 0, steps: ['Lie on back, draw one knee to chest', 'Guide that knee across the body to the opposite side — let it drop toward floor', 'Arms wide in a T — look away from the crossed knee', 'Breathe into the rotation — let gravity deepen the twist on each exhale'], tip: 'The supine twist decompresses the lumbar spine and restores rotation in the thoracic spine — use it after every training session.' },
  { name: 'Legs Up the Wall', cat: 'recovery', muscle: 'general', primary: 'Venous Return, Parasympathetic NS', secondary: 'Hamstrings, Lower Back', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '5–10 min', rest: 0, steps: ['Sit sideways next to a wall, then swing legs up as you lie back', 'Legs rest against the wall, body at 90°', 'Arms at sides or on belly — close your eyes', 'Breathe slowly — stay here as long as comfortable'], tip: 'Legs up the wall reverses blood pooling in the legs and activates the parasympathetic nervous system — one of the best recovery tools available.' },

  // ── PILATES ──────────────────────────────────────────────────────────────────
  { name: 'The Hundred', cat: 'pilates', muscle: 'core', primary: 'Rectus Abdominis, Transverse Abs', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 1, reps: '100 pumps', rest: 30, steps: ['Lie on back, curl head and shoulders off the mat, legs at 45°', 'Arms reach long beside hips, hovering off the mat', 'Pump arms up and down in small pulses — inhale 5, exhale 5', 'Complete 10 full breath cycles for 100 total pumps'], tip: 'The lower your legs, the harder the abs work — keep them where you feel your lower back stay flat.' },
  { name: 'Roll-Up', cat: 'pilates', muscle: 'core', primary: 'Rectus Abdominis, Spine', secondary: 'Hamstrings', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '8–10', rest: 30, steps: ['Lie flat, arms overhead, legs together', 'Inhale, then exhale as you peel spine off mat vertebra by vertebra', 'Reach fingertips toward toes — pause at top', 'Roll back down with control — one vertebra at a time'], tip: 'If you pop up — your hip flexors are doing the work. Slow down and feel each vertebra.' },
  { name: 'Single Leg Stretch', cat: 'pilates', muscle: 'core', primary: 'Abdominals, Hip Flexors', secondary: 'Quadriceps', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10 each', rest: 20, steps: ['Lie on back, curl head and shoulders up', 'Draw one knee to chest, extend other leg long', 'Switch legs in a controlled scissor — this is one rep', 'Keep lower back imprinted into mat throughout'], tip: 'The speed is slow and deliberate — think "Pilates, not cardio".' },
  { name: 'Double Leg Stretch', cat: 'pilates', muscle: 'core', primary: 'Transverse Abdominis', secondary: 'Rectus Abdominis, Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '8–10', rest: 30, steps: ['Lie on back, curl head up, both knees hugged to chest', 'Inhale: extend arms overhead and legs to 45° simultaneously', 'Keep lower back flat — do not arch off mat', 'Exhale: circle arms around and hug knees back in'], tip: 'Arms reaching overhead challenges the abs more than legs going out — if too hard, keep legs higher.' },
  { name: 'Criss-Cross', cat: 'pilates', muscle: 'core', primary: 'Obliques', secondary: 'Rectus Abdominis', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10 each', rest: 20, steps: ['Lie on back, hands behind head, curl up, knees at 90°', 'Rotate to bring right elbow toward left knee while extending right leg', 'Switch sides with control — no momentum', 'Elbow goes toward knee — hips stay square'], tip: 'The rotation comes from the waist, not the neck — your elbow should stay wide, not collapsing inward.' },
  { name: 'Spine Stretch Forward', cat: 'pilates', muscle: 'back', primary: 'Erector Spinae, Hamstrings', secondary: 'Thoracic Spine', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '6–8', rest: 20, steps: ['Sit tall with legs extended forward, feet flexed, arms reaching out', 'Exhale: round spine forward, reaching hands past feet', 'Hold the stretch at the end — feel the thoracic spine open', 'Inhale and roll back up to sitting tall'], tip: 'Think "scooping" the belly in and up as you round forward — not just bending at the hips.' },
  { name: 'Swan', cat: 'pilates', muscle: 'back', primary: 'Erector Spinae, Thoracic Extension', secondary: 'Glutes, Posterior Chain', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '6–8', rest: 30, steps: ['Lie face-down, hands under shoulders, elbows close to body', 'Inhale: press through hands to lift chest off mat', 'Extend only as far as the back lifts — hips stay down', 'Exhale: lower back down with control — vertebra by vertebra'], tip: 'Squeeze the backs of your thighs — this protects your lower back during extension.' },
  { name: 'The Saw', cat: 'pilates', muscle: 'back', primary: 'Obliques, Thoracic Spine', secondary: 'Hamstrings', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '6 each', rest: 20, steps: ['Sit tall, legs wide apart, arms out in a T', 'Exhale: rotate and reach outside hand toward opposite foot — pulse 3×', 'The trailing hand reaches behind, palm up', 'Inhale back to center, exhale to the other side'], tip: 'Think "spiralling" — your spine should rotate AND lengthen, not just twist.' },
  { name: 'Side-Lying Leg Lift', cat: 'pilates', muscle: 'glutes', primary: 'Glute Medius, Hip Abductors', secondary: 'Glute Maximus', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '15 each', rest: 20, steps: ['Lie on your side, body in a straight line, head on outstretched arm', 'Lift top leg to hip height — foot flexed, lead with heel', 'Hold 1 second at top — feel the outer hip engage', 'Lower slowly — 3 full seconds down'], tip: 'Do not let your pelvis tilt forward or back — the stability work is half the exercise.' },
  { name: 'Side-Lying Circles', cat: 'pilates', muscle: 'glutes', primary: 'Hip Abductors, Hip Flexors', secondary: 'Core Stabilisers', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '10 each direction, each side', rest: 20, steps: ['Lie on side, top leg lifted to hip height', 'Draw small controlled circles forward — 10 reps', 'Reverse direction for 10 more circles', 'Keep pelvis completely still — only the leg moves'], tip: 'Smaller, controlled circles are far more effective than large sloppy ones.' },
  { name: 'Bridge with Progression', cat: 'pilates', muscle: 'glutes', primary: 'Gluteus Maximus, Hamstrings', secondary: 'Core, Spine', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '10', rest: 30, steps: ['Lie on back, knees bent, feet hip-width, arms at sides', 'Exhale: peel spine off mat from tailbone — vertebra by vertebra', 'At the top, squeeze glutes and hold 3 seconds', 'Roll down one vertebra at a time — feel each segment of your spine'], tip: 'Peeling up vertebra by vertebra is the Pilates difference — it mobilises the spine, not just works the glutes.' },
  { name: 'Teaser', cat: 'pilates', muscle: 'core', primary: 'Rectus Abdominis, Hip Flexors', secondary: 'Thoracic Spine', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '5–8', rest: 30, steps: ['Lie on back, legs at 45°, arms overhead', 'Simultaneously lift arms to 45° and curl spine to sitting — create a V shape', 'Balance on sit bones — hold 2 seconds', 'Roll back down with full control, arms following'], tip: 'Preparation: practice with knees bent first — straighten legs only when you can hold the V for 5s.' },
  { name: 'Swimming', cat: 'pilates', muscle: 'back', primary: 'Erector Spinae, Glutes', secondary: 'Hamstrings, Deltoids', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '20 total', rest: 30, steps: ['Lie face-down, arms and legs long', 'Lift all four limbs off the mat simultaneously', 'Alternate lifting opposite arm and leg in a fast flutter pattern', 'Inhale 5 flutters, exhale 5 — stay long, not high'], tip: 'The movement is in length, not height — reaching long activates the posterior chain better than lifting high.' },
  { name: 'Pilates Push-Up', cat: 'pilates', muscle: 'chest', primary: 'Chest, Triceps', secondary: 'Core, Anterior Deltoid', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '5–8', rest: 45, steps: ['Stand tall, then roll down to the floor one vertebra at a time', 'Walk hands out to a plank position', 'Do 3 push-ups — elbows track back along ribs, not flared', 'Walk hands back and roll up to standing — spine stacks up'], tip: 'The push-up is 20% of this exercise — the roll-down and roll-up are the Pilates portion.' },
  { name: 'Rolling Like a Ball', cat: 'pilates', muscle: 'core', primary: 'Spine Mobility, Abdominals', secondary: 'Hip Flexors', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '8–10', rest: 20, steps: ['Sit with knees hugged to chest, balance on sit bones, feet off floor', 'Inhale: roll back to shoulder blades — no further', 'Exhale: roll back up to balance — do not roll to the neck', 'Keep the ball shape constant — the curve doesn\'t change'], tip: 'This massages the spine and builds balance — keep the C-curve constant and control the momentum.' },
  { name: 'Leg Pull Front', cat: 'pilates', muscle: 'core', primary: 'Core Stability, Shoulders', secondary: 'Glutes, Hip Flexors', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '5 each', rest: 30, steps: ['Start in a straight-arm plank position', 'Kick one leg up behind you — keep hips level', 'Pulse the lifted leg twice at the top — glutes squeezed', 'Lower and switch legs — maintain plank stability throughout'], tip: 'The plank must not shift when you kick — build the static hold first before adding the kick.' },
  { name: 'Mermaid Stretch', cat: 'pilates', muscle: 'back', primary: 'Lateral Thoracic Spine, Obliques', secondary: 'Hip Flexors, Lats', equip: 'Bodyweight', level: 'beginner', sets: 2, reps: '5 each', rest: 20, steps: ['Sit with both legs folded to one side, sit tall', 'Reach the top arm over your head in a side bend arc', 'Feel the long stretch from hip to fingertips — breathe into it', 'Return tall and repeat to the other side'], tip: 'Think "arc" not "bend" — the whole side body lengthens, not just the waist.' },
  { name: 'Hip Circle', cat: 'pilates', muscle: 'core', primary: 'Hip Flexors, Core', secondary: 'Obliques', equip: 'Bodyweight', level: 'intermediate', sets: 2, reps: '5 each direction', rest: 20, steps: ['Sit up with legs extended, hands at sides on the mat', 'Tilt slightly back and circle your hips — keep legs long', 'Complete a full circle without losing balance or letting legs lower', 'Reverse the circle direction after 5 reps'], tip: 'Your hands are support, not a crutch — the lighter your grip, the more your core works.' },
  { name: 'Chest Expansion (Kneeling)', cat: 'pilates', muscle: 'rear-delt', primary: 'Posterior Deltoid, Rhomboids', secondary: 'Thoracic Spine, Biceps', equip: 'Bodyweight', level: 'beginner', sets: 3, reps: '8', rest: 20, steps: ['Kneel tall, arms reaching forward at shoulder height', 'Exhale: pull arms back behind hips — keep arms straight', 'Head turns slowly right, then left — hold the expansion', 'Return arms forward on the inhale'], tip: 'This opens the chest and builds posture muscles — do it daily if you sit at a desk.' },
  { name: 'Pilates Side Plank', cat: 'pilates', muscle: 'core', primary: 'Obliques, Glute Medius', secondary: 'Shoulders, Hip Abductors', equip: 'Bodyweight', level: 'intermediate', sets: 3, reps: '30s each', rest: 30, steps: ['Start on your side, forearm on mat, legs stacked and long', 'Lift hips to create a straight diagonal line from head to feet', 'Top arm can reach to ceiling or rest on hip', 'Breathe steadily — hold, don\'t sag'], tip: 'In Pilates, the side plank is held with the full body energised — reach through your top fingertips and push away through your feet.' },


  // ── FOUNDATION LEVEL — For people who cannot yet do standard push-ups, squats, etc. ──
  { name: 'Wall Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest', secondary: 'Triceps, Anterior Deltoid', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '15–20', rest: 30, steps: ['Stand arm-length from a wall, hands at shoulder height and width', 'Lean in, bending elbows until your nose nearly touches the wall', 'Push back to straight arms — this is one rep', 'Keep your body in a straight line — do not let hips sag or poke back'], tip: 'Wall push-ups build the same muscles as floor push-ups — they are the dignified starting point, not a lesser version.' },
  { name: 'Incline Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest, Triceps', secondary: 'Core, Anterior Deltoid', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '10–15', rest: 45, steps: ['Place hands on a sturdy table, counter, or bench — the higher, the easier', 'Walk feet back until body is in a straight diagonal line', 'Lower chest toward the surface — elbows at 45°', 'Push back to straight arms — squeeze chest at the top'], tip: 'As you get stronger, use a lower surface — chair, then a step, then the floor. Each inch lower makes it harder.' },
  { name: 'Knee Push-Up', cat: 'strength', muscle: 'chest', primary: 'Chest, Triceps', secondary: 'Core', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '8–12', rest: 45, steps: ['Kneel with hands slightly wider than shoulder width, knees on floor', 'Hips aligned with shoulders and knees — no piking or sagging', 'Lower chest toward the floor until it nearly touches', 'Press back to straight arms — full range every rep'], tip: 'Knee push-ups are a legitimate strength exercise. Once you can do 15 with perfect form, move to a floor push-up.' },
  { name: 'Chair Squat', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Hamstrings, Core', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '10–15', rest: 45, steps: ['Stand in front of a sturdy chair, feet shoulder-width, arms extended forward', 'Slowly lower yourself as if you are going to sit — touch the chair and stand back up', 'Do not fully sit — just touch and immediately drive back up', 'Keep chest up and knees over toes throughout'], tip: 'The chair gives you confidence and a target depth — remove it once you can do 15 clean reps without touching.' },
  { name: 'Sit-to-Stand', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Core, Balance', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '10', rest: 45, steps: ['Sit in a chair with feet flat, shoulder-width, arms crossed on chest', 'Lean forward slightly from the hips — not the waist', 'Drive through your heels to stand fully upright', 'Lower back to the chair slowly and with control — do not collapse back into it'], tip: 'Sit-to-stand is one of the most important functional exercises for quality of life — it trains the exact movement pattern of daily life.' },
  { name: 'Step Up', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Glutes', secondary: 'Balance, Core', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '8–10 each', rest: 45, steps: ['Stand in front of a low step or stair (6–8 inches high)', 'Place one foot fully on the step', 'Drive through that heel to step up — bring both feet to the step', 'Step back down with control — lead with the same foot going up and down'], tip: 'Step-ups build single-leg strength and balance safely — a much better starting point than lunges for deconditioned beginners.' },
  { name: 'Box Step-Down', cat: 'strength', muscle: 'legs', primary: 'Quadriceps, Balance', secondary: 'Glutes, Core', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '8–10 each', rest: 45, steps: ['Stand on a low step, one foot at the edge, the other hanging free', 'Slowly lower the hanging foot toward the floor — tap gently, do not transfer weight', 'The standing leg must do all the work — control the descent', 'Return to standing — do not use the hanging leg to push back up'], tip: 'Eccentric step-downs build the quad and VMO strength that prevents knee problems — used in knee physiotherapy worldwide.' },
  { name: 'Seated Band Row', cat: 'bands', muscle: 'back', primary: 'Rhomboids, Mid-Back', secondary: 'Biceps', equip: 'Band', level: 'foundation', sets: 3, reps: '15–20', rest: 30, steps: ['Sit on the floor or a chair, loop band around your feet or a fixed anchor', 'Hold both ends, arms straight out in front', 'Pull elbows back, squeezing shoulder blades together', 'Return slowly to full arm extension — control the band'], tip: 'Seated rows from a chair are accessible to everyone and directly build the posture muscles weakened by sitting all day.' },
  { name: 'Band Lat Pulldown', cat: 'bands', muscle: 'back', primary: 'Latissimus Dorsi', secondary: 'Biceps', equip: 'Band', level: 'foundation', sets: 3, reps: '15–20', rest: 30, steps: ['Anchor band overhead at a door frame or high fixed point', 'Sit or kneel, hold both ends overhead with arms extended', 'Pull hands down to chest level — elbows drive down toward your hips', 'Return arms slowly overhead — feel the lat stretch at the top'], tip: 'Band lat pulldowns teach the lat engagement pattern needed for real pull-ups — the first step on that journey.' },
  { name: 'Standing Band Bicep Curl', cat: 'bands', muscle: 'arms', primary: 'Biceps Brachii', secondary: 'Forearms', equip: 'Band', level: 'foundation', sets: 3, reps: '15–20', rest: 30, steps: ['Stand on the band, hold both ends with palms up', 'Start with arms fully extended at sides', 'Curl both hands up toward shoulders — squeeze biceps at the top', 'Lower slowly back to full extension — do not let the band snap down'], tip: 'A light band provides the perfect resistance for someone starting out — you can safely control every part of the movement.' },
  { name: 'Band Tricep Pressdown', cat: 'bands', muscle: 'arms', primary: 'Triceps', secondary: 'Anconeus', equip: 'Band', level: 'foundation', sets: 3, reps: '15–20', rest: 30, steps: ['Anchor band at eye level on a door or fixed point above you', 'Hold both ends, elbows at sides, forearms parallel to floor', 'Push hands down to full elbow extension — elbows stay fixed', 'Return slowly to 90° — do not let band pull elbows up above waist'], tip: 'This is the safest first tricep exercise — zero joint strain and complete control over the resistance level.' },
  { name: 'Standing Hip Hinge', cat: 'strength', muscle: 'back', primary: 'Erector Spinae, Hamstrings', secondary: 'Glutes', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '15', rest: 30, steps: ['Stand with feet hip-width, hands on hips or arms at sides', 'Push hips back as if touching a wall behind you — soft knee bend', 'Lower torso until it is roughly parallel to the floor — back stays neutral', 'Drive hips forward to return to standing — squeeze glutes at the top'], tip: 'The hip hinge is the most important movement pattern to learn — it is the foundation of every deadlift and row.' },
  { name: 'Glute Bridge', cat: 'strength', muscle: 'glutes', primary: 'Gluteus Maximus', secondary: 'Hamstrings, Core', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '15–20', rest: 30, steps: ['Lie on your back, knees bent to 90°, feet flat on the floor hip-width', 'Press feet into the floor and squeeze glutes to lift hips', 'Raise hips until body forms a straight line from knees to shoulders', 'Lower hips slowly — do not let them fully touch the floor between reps'], tip: 'The glute bridge is the safest entry point for glute training — done on the floor with no equipment needed.' },
  { name: 'Clamshell', cat: 'rehab', muscle: 'glutes', primary: 'Glute Medius', secondary: 'Hip External Rotators', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '15–20 each', rest: 30, steps: ['Lie on your side, knees bent to 45°, hips stacked — like a clam shell', 'Keep feet together throughout — they do not separate', 'Open the top knee upward like opening a clamshell', 'Lower slowly — do not let your pelvis roll backward during the movement'], tip: 'Clamshells activate the glute medius — a muscle that is chronically weak in sedentary people and causes knee and hip pain.' },
  { name: 'Seated March', cat: 'strength', muscle: 'core', primary: 'Hip Flexors, Core', secondary: 'Quads', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '20 total', rest: 30, steps: ['Sit tall in a chair, hands on thighs, back straight', 'Lift one knee up toward your chest — hold 1 second', 'Lower that foot and lift the other — alternate like marching', 'Keep your back straight and core lightly engaged throughout'], tip: 'Seated marching builds hip flexor strength and core awareness — the foundation for all standing exercises.' },
  { name: 'Seated Core Brace', cat: 'strength', muscle: 'core', primary: 'Transverse Abdominis, Core', secondary: 'Spinal Stabilisers', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '10 × 10s holds', rest: 30, steps: ['Sit tall in a chair with feet flat — do not slouch', 'Take a deep breath in, then tighten your stomach as if bracing for a punch', 'Hold the brace for 10 seconds — breathe normally while bracing', 'Release fully, rest 5 seconds, repeat'], tip: 'Learning to brace the core is the most important skill in fitness — it protects the spine in every exercise and movement.' },
  { name: 'Standing Calf Raise', cat: 'strength', muscle: 'calves', primary: 'Gastrocnemius', secondary: 'Soleus', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '20', rest: 30, steps: ['Stand at a wall or chair for balance, feet hip-width flat on the floor', 'Rise up onto the balls of both feet — as high as you can go', 'Hold the top for 1 second — squeeze calves', 'Lower back to flat feet slowly — 2 to 3 seconds down'], tip: 'Even standing flat on the floor (no step) builds calf strength and ankle stability — a great first exercise.' },
  { name: 'Wall Sit — Short', cat: 'strength', muscle: 'legs', primary: 'Quadriceps', secondary: 'Glutes', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '15–20s', rest: 45, steps: ['Back against the wall, slide down until thighs are at 45° — not fully parallel yet', 'Feet flat on the floor, shoulder-width apart', 'Hold the position — breathe steadily, do not hold breath', 'Build up to 30 seconds before progressing to a full parallel wall sit'], tip: 'Starting at 45° instead of 90° lets complete beginners build quad endurance without overwhelming joint stress.' },
  { name: 'Seated Shoulder Press', cat: 'bands', muscle: 'front-delt', primary: 'Anterior Deltoid', secondary: 'Triceps', equip: 'Band', level: 'foundation', sets: 3, reps: '12–15', rest: 30, steps: ['Sit in a chair, sit on the band, hold both ends at shoulder height', 'Press both hands upward overhead to full extension', 'Lower slowly back to shoulder height — do not drop', 'Keep back straight — do not lean back to assist the press'], tip: 'Seated position with a band makes overhead pressing accessible and safe for those who cannot yet do a standing press.' },
  { name: 'Seated Lateral Raise (Band)', cat: 'bands', muscle: 'lateral-delt', primary: 'Lateral Deltoid', secondary: 'Supraspinatus', equip: 'Band', level: 'foundation', sets: 3, reps: '15', rest: 30, steps: ['Sit in a chair, sit on a light band, hold both ends at sides', 'Raise both arms out to the side to shoulder height', 'Lead with the elbows — do not shrug at the top', 'Lower slowly — 3 full seconds down to feel the muscle working'], tip: 'Seated band raises let anyone train the lateral deltoid safely — perfect for building shoulder confidence before standing work.' },
  { name: 'Supported Plank', cat: 'strength', muscle: 'core', primary: 'Core, Shoulders', secondary: 'Glutes', equip: 'Bodyweight', level: 'foundation', sets: 3, reps: '15–20s', rest: 30, steps: ['Place forearms on a chair seat or low table — elevated position', 'Step feet back until body is in a diagonal straight line', 'Hold the position — squeeze core and glutes', 'Progress to a lower surface as you get stronger — floor is the goal'], tip: 'An elevated plank reduces the bodyweight demand by up to 40% — allows complete beginners to build core endurance safely.' },
];


// ─── Nutrition Data ─────────────────────────────────────────────────────────
const BASE_DRI = {
  calories: 2200, protein: 150, carbs: 220, fat: 70, fiber: 30,
  sodium: 2300, potassium: 3500, calcium: 1000, iron: 18,
  vitaminA: 900, vitaminB12: 2.4, vitaminC: 90, vitaminD: 20, vitaminE: 15,
  magnesium: 400, zinc: 11,
};
const NMETA = [
  { key: 'protein', label: 'Protein', unit: 'g', cat: 'macro', color: C.blue },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g', cat: 'macro', color: C.teal },
  { key: 'fat', label: 'Fat', unit: 'g', cat: 'macro', color: C.orange },
  { key: 'fiber', label: 'Fiber', unit: 'g', cat: 'macro', color: C.purple },
  { key: 'sodium', label: 'Sodium', unit: 'mg', cat: 'mineral', color: '#94A3B8' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', cat: 'mineral', color: C.pink },
  { key: 'calcium', label: 'Calcium', unit: 'mg', cat: 'mineral', color: C.blue },
  { key: 'iron', label: 'Iron', unit: 'mg', cat: 'mineral', color: C.orange },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', cat: 'mineral', color: '#93C5FD' },
  { key: 'zinc', label: 'Zinc', unit: 'mg', cat: 'mineral', color: '#C4B5FD' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg', cat: 'vitamin', color: '#FBBF24' },
  { key: 'vitaminB12', label: 'Vitamin B12', unit: 'mcg', cat: 'vitamin', color: C.purple },
  { key: 'vitaminC', label: 'Vitamin C', unit: 'mg', cat: 'vitamin', color: C.green },
  { key: 'vitaminD', label: 'Vitamin D', unit: 'mcg', cat: 'vitamin', color: '#FDE68A' },
  { key: 'vitaminE', label: 'Vitamin E', unit: 'mg', cat: 'vitamin', color: '#6EE7B7' },
];
const DEF_MEALS = [
  { name: 'Oats with milk & banana', calories: 380, protein: 12, carbs: 65, fat: 7, fiber: 6, sodium: 180, potassium: 480, calcium: 180, iron: 3.2, vitaminA: 40, vitaminB12: 0.8, vitaminC: 8, vitaminD: 1.2, vitaminE: 1.5, magnesium: 55, zinc: 1.8 },
  { name: 'Whey protein shake', calories: 150, protein: 28, carbs: 6, fat: 2, fiber: 1, sodium: 140, potassium: 320, calcium: 200, iron: 1.0, vitaminA: 0, vitaminB12: 1.2, vitaminC: 0, vitaminD: 2.0, vitaminE: 0.5, magnesium: 30, zinc: 2.5 },
  { name: 'Boiled eggs ×3', calories: 210, protein: 18, carbs: 1, fat: 15, fiber: 0, sodium: 210, potassium: 200, calcium: 75, iron: 2.7, vitaminA: 270, vitaminB12: 1.8, vitaminC: 0, vitaminD: 3.0, vitaminE: 1.5, magnesium: 30, zinc: 1.8 },
];
const DEF_LOGS = [
  { date: 'Feb 7', weight: 74.2, bodyFat: 18.5, chest: 96, waist: 82, arms: 35, legs: 55, notes: '' },
  { date: 'Feb 14', weight: 73.8, bodyFat: 18.1, chest: 96.5, waist: 81, arms: 35.5, legs: 55, notes: 'Feeling more energy' },
  { date: 'Feb 21', weight: 73.5, bodyFat: 17.8, chest: 97, waist: 80.5, arms: 36, legs: 55.5, notes: '' },
  { date: 'Feb 28', weight: 73.1, bodyFat: 17.4, chest: 97, waist: 80, arms: 36, legs: 56, notes: 'Sleep getting better' },
  { date: 'Mar 7', weight: 72.8, bodyFat: 17.1, chest: 97.5, waist: 79, arms: 36.5, legs: 56, notes: '' },
  { date: 'Mar 14', weight: 72.5, bodyFat: 16.8, chest: 98, waist: 78.5, arms: 37, legs: 56.5, notes: 'PR on bench today 🔥' },
];

// ─── AI API (OpenRouter) ───────────────────────────────────────────────────────
const OR_KEY = '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';
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callClaude(sys, userMsg) {
  const r = await fetch(OR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OR_KEY}`,
      'HTTP-Referer': 'https://msg-app-mu.vercel.app',
      'X-Title': 'MSG - My Smart Gains',
    },
    body: JSON.stringify({
      model: 'google/gemma-4-31b-it:free',
      max_tokens: 2500,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: userMsg },
      ],
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter error ${r.status}`);
  }
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── Primitives ─────────────────────────────────────────────────────────────
const Card = ({ children, style: s = {}, onClick }) => (
  <div onClick={onClick} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, boxShadow: C.cardShadow, cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.2s, transform 0.15s', ...s }}>{children}</div>
);
const Tag = ({ label, active, color, onClick }) => (
  <button onClick={onClick} style={{
    background: active ? (color || C.accent) : 'transparent',
    color: active ? '#111111' : C.sub,
    border: `1px solid ${active ? (color || C.accent) : C.border}`,
    borderRadius: 24, padding: '7px 16px', fontSize: 11, fontFamily: fb,
    fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: active ? C.accentShadow : 'none',
    transition: 'all 0.18s ease',
  }}>{label}</button>
);
const Lbl = ({ text, style: s = {} }) => (
  <div style={{ color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', ...s }}>{text}</div>
);
const Hd = ({ t, s: sub }) => (
  <div style={{ padding: '24px 20px 12px' }}>
    <div style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{t}</div>
    {sub && <div style={{ color: C.sub, fontSize: 13, marginTop: 4, fontWeight: 400 }}>{sub}</div>}
  </div>
);

// ─── Nutrient Row ───────────────────────────────────────────────────────────
function NRow({ label, current, dri, unit, color }) {
  const pct = dri > 0 ? Math.min((current / dri) * 100, 130) : 0;
  const status = pct < 70 ? 'deficit' : pct > 110 ? 'excess' : 'ok';
  const bc = status === 'ok' ? C.green : status === 'excess' ? C.red : C.blue;
  const ic = status === 'ok' ? '✓' : status === 'excess' ? '↑' : '↓';
  const disp = unit === 'mcg' ? current.toFixed(1) : unit === 'g' ? current.toFixed(1) : Math.round(current);
  const driDisp = unit === 'mcg' ? dri : unit === 'g' ? dri : dri;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${C.border}` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: C.sub }}>{label}</span>
          <span style={{ fontSize: 11, color: bc, fontFamily: fb, fontWeight: 700 }}>{ic} {disp}/{driDisp}{unit}</span>
        </div>
        <div style={{ height: 3, background: C.s4, borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: bc, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Card ───────────────────────────────────────────────────────────
function ExCard({ ex }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState([]);
  const [timer, setTimer] = useState(null);
  const ivRef = useRef(null);
  const mc = MC[ex.muscle] || C.accent;

  useEffect(() => () => clearInterval(ivRef.current), []);

  const startTimer = (e) => {
    e.stopPropagation();
    clearInterval(ivRef.current);
    let t = ex.rest;
    setTimer(t);
    ivRef.current = setInterval(() => {
      t--;
      setTimer(t);
      if (t <= 0) { clearInterval(ivRef.current); setTimer(null); }
    }, 1000);
  };

  const toggleSet = (e, i) => {
    e.stopPropagation();
    setDone(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  };

  const allDone = done.length === (ex.sets || 0);
  const s = typeof ex.sets === 'number' ? ex.sets : 3;

  return (
    <div className="msg-anim-fadeup" style={{ background: C.s2, border: `1px solid ${allDone ? mc + '50' : C.border}`, borderLeft: `3px solid ${mc}`, borderRadius: '2px 14px 14px 2px', marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.3s, transform 0.2s, box-shadow 0.2s' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', gap: 12, padding: '14px 16px', cursor: 'pointer', alignItems: 'flex-start' }}>
        {/* Muscle thumbnail */}
        <div style={{ width: 54, height: 62, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg,${mc}20,${mc}08)`, border: `1px solid ${mc}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: fn, fontSize: (ex.primary || '').includes(',') ? 18 : 26, color: mc, lineHeight: 1, letterSpacing: '0.02em' }}>
            {(ex.primary || '').includes(',') ? ex.primary.split(',').map(s => s.trim()[0].toUpperCase()).join('/') : ex.muscle.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ fontSize: 6, color: mc, fontFamily: fb, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, marginTop: 2, textAlign: 'center', padding: '0 2px' }}>
            {(ex.primary || '').includes(',') ? ex.primary.split(',').map(s => s.trim().slice(0,3)).join('/').toUpperCase() : ex.muscle}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: allDone ? mc : C.text }}>{ex.name}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{ex.primary} · {ex.equip}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 5, alignItems: 'center' }}>
            <span style={{ fontFamily: fn, fontSize: 20, color: mc, letterSpacing: '0.04em', lineHeight: 1 }}>{ex.sets} × {ex.reps}</span>
            <span style={{ fontSize: 10, color: C.muted, background: C.s3, padding: '2px 7px', borderRadius: 4 }}>⏱ {ex.rest}s rest</span>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            {Array.from({ length: s }).map((_, i) => (
              <button key={i} onClick={e => toggleSet(e, i)} style={{
                width: 24, height: 24, borderRadius: '50%',
                background: done.includes(i) ? mc : 'transparent',
                border: `1.5px solid ${done.includes(i) ? mc : C.muted}`,
                cursor: 'pointer', fontSize: 9, color: done.includes(i) ? '#000' : C.muted,
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{done.includes(i) ? '✓' : i + 1}</button>
            ))}
          </div>
        </div>
        <div style={{ color: C.muted, fontSize: 20, flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>{open ? '−' : '+'}</div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ background: mc + '1A', color: mc, border: `1px solid ${mc}33`, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 4 }}>Primary: {ex.primary}</span>
            {ex.secondary && <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 4 }}>Also: {ex.secondary}</span>}
            <span style={{ background: C.s3, color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 4 }}>{ex.level}</span>
          </div>

          <Lbl text="Form Guide" style={{ marginBottom: 10 }} />
          {(ex.steps || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.s3, border: `1px solid ${mc}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, color: mc, fontFamily: fb, fontWeight: 700 }}>{i + 1}</div>
              <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.55, flex: 1 }}>{step}</div>
            </div>
          ))}
          {ex.tip && (
            <div style={{ marginTop: 8, padding: '9px 12px', background: C.s3, borderRadius: 10, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
              💡 {ex.tip}
            </div>
          )}

          <button onClick={startTimer} style={{
            width: '100%', marginTop: 14, background: timer !== null ? C.s3 : mc + '18',
            border: `1px solid ${mc}44`, borderRadius: 10, padding: '11px 14px',
            color: mc, fontFamily: fb, fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            {timer !== null ? (
              <>
                <span>⏱ {timer}s remaining</span>
                <div style={{ flex: 1, height: 3, background: C.s4, borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${Math.round((timer / ex.rest) * 100)}%`, background: mc, borderRadius: 2 }} />
                </div>
              </>
            ) : `⏱ Start Rest Timer (${ex.rest}s)`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Log Stats Engine — single source of truth for streak + weekly dots ───────
function parseLogDate(dateStr) {
  // Handles "Feb 7", "Mar 14" etc. — tries current year, falls back to last year
  const y = new Date().getFullYear();
  let d = new Date(`${dateStr} ${y}`);
  if (isNaN(d.getTime())) return null;
  // If the parsed date is more than 30 days in the future, it must be last year
  if (d.getTime() > Date.now() + 30 * 86400000) d = new Date(`${dateStr} ${y - 1}`);
  return d;
}

function getWeekStart(ts) {
  // Returns Monday 00:00:00 of the week containing ts
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((dow + 6) % 7)); // shift to Monday
  return d.getTime();
}

function calcStreak(logs) {
  if (!logs.length) return 0;
  const parsed = logs.map(l => parseLogDate(l.date)).filter(Boolean);
  if (!parsed.length) return 0;

  // Collect unique day timestamps
  const daySet = new Set(parsed.map(d => new Date(d).setHours(0,0,0,0)));
  const days = [...daySet].sort((a, b) => b - a); // newest first

  const today = new Date().setHours(0,0,0,0);
  const yesterday = today - 86400000;

  // Streak is alive only if user logged today or yesterday
  if (days[0] < yesterday) return 0;

  // Count consecutive days backwards
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = (days[i - 1] - days[i]) / 86400000;
    if (Math.round(gap) === 1) streak++;
    else break;
  }
  return streak;
}

function getThisWeekActivity(logs) {
  // Returns [Mon, Tue, Wed, Thu, Fri, Sat, Sun] boolean array for current Mon–Sun week
  const parsed = logs.map(l => parseLogDate(l.date)).filter(Boolean);
  const weekStart = getWeekStart(Date.now());
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = weekStart + i * 86400000;
    const dayEnd = dayStart + 86400000;
    return parsed.some(d => d.getTime() >= dayStart && d.getTime() < dayEnd);
  });
}

function getTodayDowIndex() {
  // Mon=0 … Sun=6 (matches getThisWeekActivity order)
  return (new Date().getDay() + 6) % 7;
}

// ─── Chart Tooltip (top-level — never define components inside render) ────────
function ChartTip({ active, payload, label, color, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ color: C.sub, fontSize: 10, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, color }}>{payload[0].value}{unit}</div>
    </div>
  );
}

// ─── Home Section ────────────────────────────────────────────────────────────
function HomeSection({ mealLog, progressLogs, dietGoal, onLogClick, user, gymId, onAchievementsClick }) {
  const [checkInKey, setCheckInKey] = useState(0);
  const tot = mealLog.reduce((a, i) => ({ cal: a.cal + i.calories, p: a.p + i.protein, c: a.c + (i.carbs || 0), f: a.f + (i.fat || 0), na: a.na + (i.sodium || 0) }), { cal: 0, p: 0, c: 0, f: 0, na: 0 });
  const dri = { ...BASE_DRI, ...(dietGoal || {}) };
  const last = progressLogs[progressLogs.length - 1];
  const prev = progressLogs[progressLogs.length - 2];
  const wDiff = last && prev ? (last.weight - prev.weight).toFixed(1) : null;

  const streak = calcStreak(progressLogs);
  const weekDone = getThisWeekActivity(progressLogs);
  const todayIdx = getTodayDowIndex();
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const greetEmoji = hour < 12 ? '☀️' : hour < 17 ? '👋' : hour < 21 ? '🌆' : '🌙';
  const firstName = (user?.name || 'there').split(' ')[0];

  // Water quick-log shared with WaterTracker (same localStorage keys)
  const W_TODAY_KEY = `msg_water_${new Date().toISOString().slice(0, 10)}`;
  const wGoalMl = (() => { try { return parseInt(localStorage.getItem('msg_water_goal_ml') || '2000', 10); } catch { return 2000; } })();
  const wGoalGlasses = Math.round(wGoalMl / 250);
  const wMaxGlasses  = Math.ceil(wGoalGlasses * 1.5);
  const [wGlasses, setWGlasses] = useState(() => { try { return parseInt(localStorage.getItem(W_TODAY_KEY) || '0', 10); } catch { return 0; } });
  const updateWater = (n) => {
    const v = Math.max(0, Math.min(n, wMaxGlasses));
    setWGlasses(v);
    try { localStorage.setItem(W_TODAY_KEY, String(v)); } catch {}
  };
  const wPct  = Math.min((wGlasses / wGoalGlasses) * 100, 100);
  const wDone = wGlasses >= wGoalGlasses;
  const wc    = wDone ? C.accent : C.blue;


  const insights = [
    tot.p < dri.protein * 0.7 && { icon: '🥩', text: `You're at ${Math.round(tot.p)}g protein — need ${dri.protein}g today`, c: C.orange },
    tot.na > 2300 && { icon: '🧂', text: `High sodium today (${Math.round(tot.na)}mg) — watch salty foods`, c: C.red },
    tot.cal > dri.calories * 1.1 && { icon: '⚠️', text: `You're ${Math.round(tot.cal - dri.calories)} kcal over today's goal`, c: C.red },
    streak > 0 ? { icon: '🔥', text: `${streak}-day check-in streak — momentum is everything!`, c: C.accent }
      : { icon: '📋', text: 'No recent check-ins — log your progress to start a streak!', c: C.orange },
    last && wDiff && parseFloat(wDiff) < 0 && { icon: '📉', text: `Down ${Math.abs(wDiff)}kg since last check-in — great progress!`, c: C.green },
  ].filter(Boolean);

  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{ padding: '28px 20px 14px' }}>
        <div style={{ color: C.sub, fontSize: 11, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.15, marginTop: 6, letterSpacing: '-0.02em' }}>
          {greeting}, <span style={{ color: C.accent }}>{firstName}</span> {greetEmoji}
        </div>
      </div>

      {/* Smart Insights */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: ins.c + '0D', border: `1px solid ${ins.c}28`, borderRadius: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, lineHeight: '20px' }}>{ins.icon}</span>
            <span style={{ fontSize: 12.5, color: ins.c, lineHeight: 1.45, fontWeight: 500 }}>{ins.text}</span>
          </div>
        ))}
      </div>

      {/* Membership Status Card */}
      {gymId && user?.uid && <MembershipCard uid={user.uid} gymId={gymId} />}

      {/* Attendance Check-in Button */}
      {gymId && user?.uid && (
        <AttendanceButton
          uid={user.uid}
          gymId={gymId}
          onCheckIn={() => setCheckInKey(k => k + 1)}
        />
      )}

      {/* Check-in Heatmap */}
      {gymId && user?.uid && <AttendanceHeatMap key={checkInKey} uid={user.uid} gymId={gymId} />}

      {/* Stats row */}
      <div id="tut-stats" style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: '0 0 auto', width: 90 }}>
          <Card style={{ background: C.accentD, border: '1px solid rgba(196,255,71,0.25)', textAlign: 'center', padding: '14px 8px' }}>
            <div style={{ fontFamily: fn, fontSize: 40, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{streak}</div>
            <div style={{ color: C.accent, opacity: .7, fontSize: 8, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
              {streak === 1 ? 'Day' : 'Days'}
            </div>
            <div style={{ fontSize: 18, marginTop: 4 }}>{streak > 0 ? '🔥' : '💤'}</div>
          </Card>
          <button onClick={onLogClick} style={{
            background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 6px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.accent + '18', border: `1.5px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
            <div style={{ fontSize: 8, fontFamily: fb, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.accent, lineHeight: 1.2, textAlign: 'center' }}>Log<br />Progress</div>
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Card style={{ padding: '12px 14px' }}>
            <Lbl text="Calories Today" style={{ marginBottom: 4 }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{Math.round(tot.cal)}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>/ {dri.calories} kcal</span>
            </div>
            <div style={{ height: 4, background: C.s4, borderRadius: 2, marginTop: 7 }}>
              <div style={{ height: '100%', width: `${Math.min(Math.round((tot.cal / dri.calories) * 100), 100)}%`, background: tot.cal > dri.calories ? C.red : C.accent, borderRadius: 2 }} />
            </div>
          </Card>
          {last && (
            <Card style={{ padding: '12px 14px' }}>
              <Lbl text="Body Weight" style={{ marginBottom: 4 }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: fn, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{last.weight}</span>
                <span style={{ color: C.muted, fontSize: 11 }}>kg</span>
                {wDiff && <span style={{ color: parseFloat(wDiff) < 0 ? C.green : C.orange, fontSize: 11, fontFamily: fb, fontWeight: 700 }}>{parseFloat(wDiff) < 0 ? wDiff : '+' + wDiff}</span>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Macro mini */}
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 }}>
        {[{ l: 'Protein', v: Math.round(tot.p), max: dri.protein, c: C.blue }, { l: 'Carbs', v: Math.round(tot.c), max: dri.carbs, c: C.teal }, { l: 'Fat', v: Math.round(tot.f), max: dri.fat, c: C.orange }].map(m => (
          <Card key={m.l} style={{ flex: 1, padding: '10px 12px' }}>
            <div style={{ color: m.c, fontSize: 9, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.3, marginTop: 2 }}>{m.v}g</div>
            <div style={{ height: 3, background: C.s4, borderRadius: 2, marginTop: 4 }}>
              <div style={{ height: '100%', width: `${Math.min(Math.round((m.v / m.max) * 100), 100)}%`, background: m.c, borderRadius: 2 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Nutrition Log Summary — ring chart */}
      <div style={{ padding: '10px 16px 0' }}>
        <Card style={{ padding: '13px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Lbl text="Nutrition Today" />
            <span style={{ fontSize: 10, color: C.muted }}>{mealLog.length} item{mealLog.length !== 1 ? 's' : ''} logged</span>
          </div>
          {/* Interactive water quick-log */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            padding: '8px 10px', background: C.s3, borderRadius: 10,
            border: `1px solid ${wDone ? wc + '55' : 'transparent'}`,
            transition: 'border-color 0.3s',
          }}>
            {/* Tap emoji to add a glass */}
            <button
              onClick={() => updateWater(wGlasses + 1)}
              disabled={wGlasses >= wMaxGlasses}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 18, cursor: wGlasses >= wMaxGlasses ? 'default' : 'pointer',
                lineHeight: 1, flexShrink: 0,
                filter: wDone ? 'drop-shadow(0 0 4px ' + wc + ')' : 'none',
                transition: 'filter 0.3s, transform 0.15s',
                transform: 'scale(1)',
              }}
              title="Tap to add a glass"
            >💧</button>

            {/* Progress bar */}
            <div style={{ flex: 1 }}>
              <div style={{ height: 4, background: C.s4, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${wPct}%`, background: wc, borderRadius: 2, transition: 'width 0.35s ease' }} />
              </div>
            </div>

            {/* Count label */}
            <span style={{ fontSize: 11, color: wc, fontFamily: fb, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' }}>
              {wGlasses}/{wGoalGlasses} {wDone ? '✓' : 'glasses'}
            </span>

            {/* − button */}
            <button
              onClick={() => updateWater(wGlasses - 1)}
              disabled={wGlasses === 0}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: C.s4, border: `1px solid ${C.border}`,
                color: wGlasses === 0 ? C.muted : C.text,
                fontSize: 14, fontWeight: 700, lineHeight: 1,
                cursor: wGlasses === 0 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: wGlasses === 0 ? 0.35 : 1, flexShrink: 0,
              }}
            >−</button>
          </div>

          {mealLog.length === 0 ? (
            <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '8px 0' }}>No food logged yet — tap Diet to start tracking 🥗</div>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[
                { l: 'Cal', v: Math.round(tot.cal), max: dri.calories, c: C.accent },
                { l: 'Protein', v: Math.round(tot.p), max: dri.protein, c: C.blue },
                { l: 'Carbs', v: Math.round(tot.cal / 4 * 0.45), max: dri.carbs, c: C.teal },
                { l: 'Fat', v: Math.round(tot.cal / 9 * 0.3), max: dri.fat, c: C.orange },
              ].map(m => {
                const pct = Math.min(Math.round((m.v / m.max) * 100), 100);
                const over = m.v > m.max;
                const r = 18, circ = 2 * Math.PI * r;
                return (
                  <div key={m.l} style={{ flex: 1, textAlign: 'center' }}>
                    <svg width="46" height="46" viewBox="0 0 46 46" style={{ display: 'block', margin: '0 auto 4px' }}>
                      <circle cx="23" cy="23" r={r} fill="none" stroke={C.s4} strokeWidth="4" />
                      <circle cx="23" cy="23" r={r} fill="none"
                        stroke={over ? C.red : m.c} strokeWidth="4"
                        strokeDasharray={circ}
                        strokeDashoffset={circ * (1 - pct / 100)}
                        strokeLinecap="round"
                        transform="rotate(-90 23 23)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                      <text x="23" y="27" textAnchor="middle" fontSize="9" fontWeight="700" fill={over ? C.red : m.c} fontFamily="sans-serif">{pct}%</text>
                    </svg>
                    <div style={{ fontSize: 8, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.l}</div>
                    <div style={{ fontSize: 10, color: C.text, fontWeight: 600, marginTop: 1 }}>{m.v}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Weekly dots — driven by real log data */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Lbl text="This Week" />
            <span style={{ fontSize: 10, color: C.muted }}>
              {weekDone.filter(Boolean).length}/7 days logged
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {DAY_LABELS.map((d, i) => {
              const logged = weekDone[i];
              const isToday = i === todayIdx;
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: logged ? C.accent : 'transparent',
                    border: isToday && !logged ? `2px solid ${C.accent}` : logged ? 'none' : `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px',
                    color: logged ? '#000' : isToday ? C.accent : C.muted,
                    fontSize: logged ? 13 : 11, fontWeight: 700,
                    boxShadow: isToday ? `0 0 0 3px ${C.accent}22` : 'none',
                  }}>{logged ? '✓' : d}</div>
                  <div style={{ color: isToday ? C.accent : C.muted, fontSize: 9, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase' }}>{d}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Weight trend mini-chart */}
      {progressLogs.length >= 2 && (
        <div style={{ padding: '14px 16px 0' }}>
          <Card style={{ padding: '14px 14px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Lbl text="Weight Trend" />
              <span style={{ fontFamily: fn, fontSize: 13, fontWeight: 700, color: wDiff && parseFloat(wDiff) < 0 ? C.green : C.orange }}>
                {last ? `${last.weight} kg` : '—'}
                {wDiff && <span style={{ fontSize: 10, marginLeft: 4 }}>{parseFloat(wDiff) < 0 ? '↓' : '↑'}{Math.abs(wDiff)}</span>}
              </span>
            </div>
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={progressLogs} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="hwg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.accent} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 8 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: C.muted, fontSize: 8 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTip color={C.accent} unit="kg" />} />
                <Area type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2} fill="url(#hwg)" dot={{ fill: C.accent, r: 2, strokeWidth: 0 }} activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Progress summary row */}
      {last && (
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 }}>
          {[
            { l: 'Waist', v: last.waist > 0 ? `${last.waist}cm` : '—', c: C.blue },
            { l: 'Arms', v: last.arms > 0 ? `${last.arms}cm` : '—', c: C.teal },
            { l: 'Body Fat', v: last.bodyFat > 0 ? `${last.bodyFat}%` : '—', c: C.orange },
          ].map(s => (
            <Card key={s.l} style={{ flex: 1, padding: '9px 10px', textAlign: 'center' }}>
              <div style={{ color: s.c, fontSize: 8, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div>
              <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.3, marginTop: 2 }}>{s.v}</div>
            </Card>
          ))}
        </div>


      )}
            {/* Nutrition Log Chart */}
        {mealLog.length > 0 && (
          <div style={{ padding: '14px 16px 0' }}>
            <Card style={{ padding: '16px 12px 12px' }}>
              <div style={{ fontFamily: fn, fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12, paddingLeft: 4 }}>Calorie Intake Logs</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[...mealLog].reverse()}>
                  <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} hide />
                  <Tooltip content={ChartTip} cursor={{ fill: C.s3 }} />
                  <Bar dataKey="calories" fill={C.accent} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

      {/* ── Achievements Quick-Access ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div
          id="tut-achievements"
          onClick={onAchievementsClick}
          style={{
            background: `linear-gradient(135deg,${C.s2},${C.s3})`,
            border: `1px solid ${C.accent}30`,
            borderRadius: 18,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 4px 18px ${C.accent}18`,
            transition: 'transform 0.18s, box-shadow 0.18s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {/* Glow blob */}
          <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, background: C.accent + '18', borderRadius: '50%', filter: 'blur(18px)', pointerEvents: 'none' }} />
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accent + '18', border: `1.5px solid ${C.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏆</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Achievements</div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Track your milestones &amp; unlock badges</div>
          </div>
          <div style={{ fontSize: 18, color: C.accent, flexShrink: 0 }}>›</div>
        </div>
      </div>

      {/* ── Leaderboard (Coming Soon) ── */}
      <div style={{ padding: '14px 16px 0' }}>
        <div id="tut-leaderboard" style={{
          background: `linear-gradient(135deg,${C.s2},${C.s3})`,
          border: `1px solid ${C.blue}30`,
          borderRadius: 18,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 4px 18px ${C.blue}12`,
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, background: C.blue + '15', borderRadius: '50%', filter: 'blur(18px)', pointerEvents: 'none' }} />
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.blue + '18', border: `1.5px solid ${C.blue}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏅</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Leaderboard</div>
              <span style={{ background: C.blue + '22', color: C.blue, fontSize: 8, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 4 }}>Coming Soon</span>
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>See who's crushing it — climb the ranks</div>
          </div>
          <div style={{ fontSize: 18, color: C.muted, flexShrink: 0, opacity: 0.5 }}>›</div>
        </div>
      </div>

      <div style={{ height: 8 }} />
      </div>
  );
}

// ─── Warmup Block ─────────────────────────────────────────────────────────────
const WARMUP_ROUTINE = [
  { move: 'Light Cardio', detail: '2 min brisk walk or on-the-spot jog', duration: '2 min' },
  { move: 'Arm Circles', detail: '10 forward, 10 backward — both arms', duration: '30s' },
  { move: 'Hip Circles', detail: 'Hands on hips, 10 circles each direction', duration: '30s' },
  { move: 'Leg Swings', detail: '10 front-back, 10 side-side per leg', duration: '1 min' },
  { move: 'Cat-Cow', detail: '10 slow cycles with deep breath — wakes up the spine', duration: '1 min' },
  { move: 'Shoulder Rolls', detail: '10 forward, 10 backward — loosen the shoulder girdle', duration: '30s' },
  { move: 'Squat to Stand', detail: '8 reps — squat down, grab toes, press knees out, stand tall', duration: '1 min' },
  { move: 'Spiderman Lunge', detail: '5 per side — step out, drop hip, reach arm to ceiling', duration: '1 min' },
  { move: 'Inchworm', detail: '6 reps — hinge forward, walk hands to plank, walk back, stand', duration: '1 min' },
  { move: 'Jump Rope / Jumping Jacks', detail: '30 seconds light intensity to elevate heart rate', duration: '30s' },
];

function WarmupBlock() {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(null); // which item is running
  const [timers, setTimers] = useState(() => WARMUP_ROUTINE.map(w => parseDurSec(w.duration)));
  const [running, setRunning] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const ivRef = useRef(null);
  const autoRef = useRef(false);
  const activeRef = useRef(null);

  function parseDurSec(dur) {
    if (!dur) return 60;
    const m = dur.match(/(\d+)\s*min/); const s = dur.match(/(\d+)s/);
    return (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0) || 60;
  }

  const total = WARMUP_ROUTINE.reduce((a, w) => a + parseDurSec(w.duration), 0);
  const elapsed = WARMUP_ROUTINE.reduce((a, w, i) => a + (parseDurSec(w.duration) - (timers[i] ?? parseDurSec(w.duration))), 0);
  const overallPct = Math.min((elapsed / total) * 100, 100);

  const clearIv = () => clearInterval(ivRef.current);

  const startItem = (idx, auto = false) => {
    clearIv();
    autoRef.current = auto;
    activeRef.current = idx;
    setActiveIdx(idx);
    setRunning(true);
    ivRef.current = setInterval(() => {
      setTimers(prev => {
        const next = [...prev];
        if (next[activeRef.current] <= 1) {
          clearIv();
          setRunning(false);
          if (autoRef.current && activeRef.current < WARMUP_ROUTINE.length - 1) {
            setTimeout(() => startItem(activeRef.current + 1, true), 800);
          } else {
            setAutoMode(false);
          }
          next[activeRef.current] = 0;
          return next;
        }
        next[activeRef.current] = next[activeRef.current] - 1;
        return next;
      });
    }, 1000);
  };

  const pauseItem = () => { clearIv(); setRunning(false); };

  const resetItem = (idx) => {
    if (activeIdx === idx) { clearIv(); setRunning(false); setActiveIdx(null); }
    setTimers(prev => { const n = [...prev]; n[idx] = parseDurSec(WARMUP_ROUTINE[idx].duration); return n; });
  };

  const startAll = () => {
    setTimers(WARMUP_ROUTINE.map(w => parseDurSec(w.duration)));
    setAutoMode(true);
    setTimeout(() => startItem(0, true), 50);
  };

  const resetAll = () => {
    clearIv(); setRunning(false); setActiveIdx(null); setAutoMode(false);
    setTimers(WARMUP_ROUTINE.map(w => parseDurSec(w.duration)));
  };

  useEffect(() => () => clearIv(), []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ background: `linear-gradient(135deg,${C.s2},${C.s3})`, border: `1px solid ${C.accent}30`, borderLeft: `3px solid ${C.accent}`, borderRadius: '2px 14px 14px 2px', marginBottom: 14, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
        <div style={{ width: 54, height: 54, borderRadius: 10, background: C.accent + '18', border: `1px solid ${C.accent}30`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div style={{ fontSize: 6, color: C.accent, fontFamily: fb, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Warmup</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.accent }}>Full-Body Warmup Routine</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>10 movements · 7–10 minutes · Do this before every session</div>
          {open && overallPct > 0 && (
            <div style={{ height: 3, background: C.s4, borderRadius: 2, marginTop: 6 }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: C.accent, borderRadius: 2, transition: 'width 0.5s linear' }} />
            </div>
          )}
        </div>
        <div style={{ color: open ? C.accent : C.muted, fontSize: 20, flexShrink: 0 }}>{open ? '−' : '+'}</div>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px 14px' }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Tap ▶ on each movement or use <strong style={{ color: C.accent }}>Start All</strong> to auto-advance.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={e => { e.stopPropagation(); startAll(); }} style={{ flex: 1, padding: '10px', background: C.accent, border: 'none', borderRadius: 10, color: '#111', fontFamily: fb, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>▶ Start All</button>
            <button onClick={e => { e.stopPropagation(); resetAll(); }} style={{ padding: '10px 16px', background: C.s4, border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontFamily: fb, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>↺ Reset</button>
          </div>
          {WARMUP_ROUTINE.map((w, i) => {
            const maxSec = parseDurSec(w.duration);
            const rem = timers[i] ?? maxSec;
            const pct = Math.max(0, (rem / maxSec) * 100);
            const isActive = activeIdx === i;
            const isDone = rem === 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, padding: '10px 12px', background: isActive ? C.accent + '12' : isDone ? C.green + '0D' : C.s4, borderRadius: 12, border: `1px solid ${isActive ? C.accent + '44' : isDone ? C.green + '33' : 'transparent'}`, transition: 'all 0.3s' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: isDone ? C.green + '22' : isActive ? C.accent + '20' : C.s3, border: `1px solid ${isDone ? C.green + '66' : isActive ? C.accent + '66' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 800, color: isDone ? C.green : isActive ? C.accent : C.sub }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? C.accent : isDone ? C.green : C.text }}>{w.move}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.45 }}>{w.detail}</div>
                  {isActive && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ height: 3, background: C.s3, borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 2, transition: 'width 1s linear' }} />
                      </div>
                      <div style={{ fontFamily: fb, fontSize: 20, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{fmt(rem)}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, alignItems: 'flex-end' }}>
                  {!isActive && !isDone && (
                    <button onClick={e => { e.stopPropagation(); startItem(i, false); }} style={{ background: C.accent + '20', border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '4px 10px', color: C.accent, fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>▶</button>
                  )}
                  {isActive && running && (
                    <button onClick={e => { e.stopPropagation(); pauseItem(); }} style={{ background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', color: C.sub, fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>⏸</button>
                  )}
                  {isActive && !running && (
                    <button onClick={e => { e.stopPropagation(); startItem(i, autoRef.current); }} style={{ background: C.accent + '20', border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '4px 10px', color: C.accent, fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>▶</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); resetItem(i); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', padding: '2px 6px' }}>↺</button>
                  <div style={{ fontSize: 9, color: isDone ? C.green : isActive ? C.accent : C.muted, fontFamily: fb, fontWeight: 600, whiteSpace: 'nowrap' }}>{isDone ? 'Done!' : isActive ? fmt(rem) : w.duration}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Week Plan Structures ─────────────────────────────────────────────────────
const WEEK_STRUCTURES = {
  3: [
    { day: 'Day 1', focus: 'Full Body A', muscles: ['chest', 'back', 'legs', 'core'] },
    { day: 'Day 2', focus: 'Full Body B', muscles: ['front-delt', 'lateral-delt', 'back', 'legs', 'arms'] },
    { day: 'Day 3', focus: 'Full Body C', muscles: ['chest', 'rear-delt', 'legs', 'core'] },
  ],
  4: [
    { day: 'Day 1', focus: 'Upper Body A — Push', muscles: ['chest', 'front-delt', 'lateral-delt', 'arms'] },
    { day: 'Day 2', focus: 'Lower Body A — Quad Focus', muscles: ['legs', 'calves', 'core'] },
    { day: 'Day 3', focus: 'Upper Body B — Pull', muscles: ['back', 'rear-delt', 'traps', 'arms'] },
    { day: 'Day 4', focus: 'Lower Body B — Posterior Chain', muscles: ['legs', 'glutes', 'core'] },
  ],
  5: [
    { day: 'Day 1', focus: 'Push — Chest & Front Delt', muscles: ['chest', 'front-delt', 'arms'] },
    { day: 'Day 2', focus: 'Pull — Back & Rear Delt', muscles: ['back', 'rear-delt', 'arms'] },
    { day: 'Day 3', focus: 'Legs — Quad, Glute & Calf Focus', muscles: ['legs', 'glutes', 'calves'] },
    { day: 'Day 4', focus: 'Shoulders — Lateral & Traps', muscles: ['lateral-delt', 'rear-delt', 'front-delt', 'traps', 'arms'] },
    { day: 'Day 5', focus: 'Pull + Core', muscles: ['back', 'core', 'forearms'] },
  ],
  6: [
    { day: 'Day 1', focus: 'Push A — Chest & Anterior Delt', muscles: ['chest', 'front-delt', 'arms'] },
    { day: 'Day 2', focus: 'Pull A — Lats & Rear Delt', muscles: ['back', 'rear-delt', 'arms'] },
    { day: 'Day 3', focus: 'Legs A — Squat & Quad', muscles: ['legs', 'calves', 'core'] },
    { day: 'Day 4', focus: 'Push B — Lateral Delt & Traps', muscles: ['lateral-delt', 'front-delt', 'traps', 'arms'] },
    { day: 'Day 5', focus: 'Pull B — Deadlift & Rear Delt', muscles: ['back', 'rear-delt', 'forearms'] },
    { day: 'Day 6', focus: 'Legs B — Hinge, Glute & Calf', muscles: ['legs', 'glutes', 'calves', 'core'] },
  ],
};

// ─── Manual Plan Builder (wger API + local EX fallback) ──────────────────────
function ManualPlanBuilder({ setWeekPlan, onBack }) {
  const WGER_KEY = import.meta.env.VITE_WGER_KEY ?? '';
  const [step, setStep] = useState(0); // 0=pick days, 1=enter exercises
  const [days, setDays] = useState(null);
  const [planDays, setPlanDays] = useState([]); // [{dayName, exercises:[]}]
  const [activeDay, setActiveDay] = useState(0);
  const [exInput, setExInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null); // pending exercise to confirm
  const [dayNames] = useState(['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']);

  const initDays = (n) => {
    setDays(n);
    setPlanDays(Array.from({ length: n }, (_, i) => ({ dayName: `Day ${i + 1}`, focus: '', exercises: [] })));
    setStep(1);
  };

  const searchExercise = async (name) => {
    if (!name.trim()) return;
    setSearching(true); setSearchResult(null);
    // 1. Try wger API
    if (WGER_KEY) {
      try {
        const r = await fetch(
          `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(name)}&language=2&format=json`,
          { headers: { Authorization: `Token ${WGER_KEY}` } }
        );
        if (r.ok) {
          const data = await r.json();
          const hit = data.suggestions?.[0];
          if (hit) {
            setSearchResult({
              name: hit.value,
              muscle: hit.data?.category?.name?.toLowerCase() || 'general',
              primary: hit.data?.category?.name || 'General',
              secondary: '',
              equip: 'Any',
              level: 'intermediate',
              sets: 3, reps: '10–12', rest: 60,
              steps: ['Focus on proper form', 'Control the eccentric', 'Full range of motion'],
              tip: 'Use wger.de for full exercise guide',
              source: 'wger',
            });
            setSearching(false); return;
          }
        }
      } catch (_) {}
    }
    // 2. Local EX DB fallback
    const q = name.toLowerCase();
    const found = EX.find(e => e.name.toLowerCase().includes(q) || q.includes(e.name.toLowerCase().split(' ')[0]));
    if (found) { setSearchResult({ ...found, source: 'local' }); }
    else {
      // Generic placeholder
      setSearchResult({
        name: name.trim(), muscle: 'general', primary: 'General', secondary: '',
        equip: 'Any', level: 'intermediate', sets: 3, reps: '10–12', rest: 60,
        steps: ['Focus on proper form', 'Full range of motion', 'Controlled movement'],
        tip: 'No data found — check exercise name',
        source: 'manual',
      });
    }
    setSearching(false);
  };

  const addExercise = (ex, sets, reps) => {
    setPlanDays(prev => prev.map((d, i) => i === activeDay
      ? { ...d, exercises: [...d.exercises, { ...ex, sets: parseInt(sets) || 3, reps: reps || '10–12' }] }
      : d
    ));
    setExInput(''); setSearchResult(null);
  };

  const removeExercise = (dayIdx, exIdx) => {
    setPlanDays(prev => prev.map((d, i) => i === dayIdx
      ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
      : d
    ));
  };

  const savePlan = () => {
    const plan = planDays.map(d => ({
      day: d.dayName, focus: d.focus || d.dayName, duration: '45–60 min',
      exercises: d.exercises,
    }));
    setWeekPlan(plan);
  };

  if (step === 0) return (
    <div style={{ padding: '0 16px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: fn, marginBottom: 16, padding: 0 }}>← Back</button>
      <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>How many training days?</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>We'll create a day-by-day template for you to fill in.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[3, 4, 5, 6].map(n => (
          <button key={n} onClick={() => initDays(n)} className="msg-anim-fadeup" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 18px', background: C.s2, border: `1px solid ${C.border}`,
            borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            animationDelay: `${(n - 3) * 0.06}s`,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{n} Days / Week</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{n === 3 ? 'Full Body' : n === 4 ? 'Upper / Lower' : n === 5 ? 'Push Pull Legs' : 'PPL × 2'}</div>
            </div>
            <div style={{ color: C.accent, fontSize: 18 }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );

  const curDay = planDays[activeDay] || { exercises: [] };

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4, marginBottom: 14 }}>
        {planDays.map((d, i) => (
          <button key={i} onClick={() => { setActiveDay(i); setSearchResult(null); setExInput(''); }} style={{
            flexShrink: 0, padding: '7px 12px',
            background: activeDay === i ? C.accent : C.s2,
            border: `1px solid ${activeDay === i ? C.accent : C.border}`,
            borderRadius: 8, color: activeDay === i ? '#000' : C.sub,
            fontFamily: fn, fontWeight: 700, fontSize: 10, cursor: 'pointer',
          }}>{d.dayName}</button>
        ))}
      </div>

      {/* Day focus label */}
      <input value={curDay.focus} onChange={e => setPlanDays(p => p.map((d, i) => i === activeDay ? { ...d, focus: e.target.value } : d))}
        placeholder={`e.g. Chest & Triceps`}
        style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', marginBottom: 12 }}
      />

      {/* Exercise search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={exInput} onChange={e => setExInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchExercise(exInput)}
          placeholder="Type exercise name…"
          style={{ flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 12px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}
        />
        <button onClick={() => searchExercise(exInput)} disabled={searching || !exInput.trim()} style={{
          background: C.accent, border: 'none', borderRadius: 10, padding: '0 16px',
          color: '#000', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
          opacity: !exInput.trim() ? 0.4 : 1,
        }}>{searching ? '…' : 'Find'}</button>
      </div>

      {/* Search result — confirm card */}
      {searchResult && <ExerciseConfirmCard ex={searchResult} onAdd={addExercise} onDismiss={() => setSearchResult(null)} />}

      {/* Current day exercises */}
      <div style={{ marginBottom: 16 }}>
        {curDay.exercises.length === 0 && !searchResult && (
          <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', padding: '18px 0', border: `1px dashed ${C.border}`, borderRadius: 12 }}>
            No exercises yet — search to add one
          </div>
        )}
        {curDay.exercises.map((ex, i) => (
          <div key={i} className="msg-anim-fadeup" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
            background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8,
            animationDelay: `${i * 0.04}s`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ex.name}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{ex.sets} sets × {ex.reps} · {ex.primary}</div>
            </div>
            <button onClick={() => removeExercise(activeDay, i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 16, cursor: 'pointer', padding: '4px' }}>✕</button>
          </div>
        ))}
      </div>

      {/* Save plan button */}
      <button onClick={savePlan} disabled={planDays.every(d => d.exercises.length === 0)} style={{
        width: '100%', padding: '14px', marginBottom: 20,
        background: planDays.some(d => d.exercises.length > 0) ? C.accent : C.s4,
        color: planDays.some(d => d.exercises.length > 0) ? '#000' : C.muted,
        border: 'none', borderRadius: 12, fontFamily: fn, fontWeight: 800, fontSize: 14, cursor: 'pointer',
      }}>
        Save My Plan ({planDays.filter(d => d.exercises.length > 0).length}/{days} days ready)
      </button>
    </div>
  );
}

// Confirm card for wger/local exercise result
function ExerciseConfirmCard({ ex, onAdd, onDismiss }) {
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState(ex.reps || '10–12');
  const mc = MC[ex.muscle] || C.accent;
  return (
    <div className="msg-anim-scalein" style={{ background: C.s2, border: `2px solid ${mc}44`, borderLeft: `3px solid ${mc}`, borderRadius: '2px 14px 14px 2px', padding: '14px', marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ex.name}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{ex.primary}{ex.secondary ? ` · ${ex.secondary}` : ''} · {ex.equip}</div>
        </div>
        <span style={{ fontSize: 9, background: mc + '20', color: mc, padding: '2px 8px', borderRadius: 4, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {ex.source === 'wger' ? 'wger' : ex.source === 'local' ? 'Library' : 'Custom'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Sets</div>
          <input value={sets} onChange={e => setSets(e.target.value)} type="number" min="1" max="10"
            style={{ width: '100%', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none', textAlign: 'center' }} />
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Reps</div>
          <input value={reps} onChange={e => setReps(e.target.value)}
            style={{ width: '100%', background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDismiss} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
        <button onClick={() => onAdd(ex, sets, reps)} style={{ flex: 2, padding: '10px', background: mc, border: 'none', borderRadius: 10, color: '#111', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Add to Day</button>
      </div>
    </div>
  );
}

// ─── Workout Section ─────────────────────────────────────────────────────────
function WorkoutSection({ weekPlan, setWeekPlan }) {
  const [planMode, setPlanMode] = useState(null); // null | 'ai' | 'manual'

  // Wizard state
  const [wStep, setWStep] = useState(0);
  const [days, setDays] = useState(null);
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [equip, setEquip] = useState('');
  const [injury, setInjury] = useState(null);
  const [injuryArea, setInjuryArea] = useState('');
  const [injuryTyping, setInjuryTyping] = useState(false);

  // Plan state — weekPlan now lives in App root (passed as prop)
  const [loading, setLoading] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  // View state
  const [view, setView] = useState('plan');
  const [libMuscle, setLibMuscle] = useState('all');
  const [libCat, setLibCat] = useState('strength');
  const [filter, setFilter] = useState('all');
  const [libSearch, setLibSearch] = useState('');

  const resetWizard = () => {
    setWStep(0); setDays(null); setGoal(''); setLevel(''); setEquip('');
    setInjury(null); setInjuryArea(''); setInjuryTyping(false);
    setActiveDay(0);
    // Note: weekPlan is NOT cleared here — use Settings > Reset Workout Plan
  };

  // Build fallback plan from local EX database

  const buildFallbackPlan = (daysN, goalV, levelV, equipV, injuryV) => {
    const struct = WEEK_STRUCTURES[daysN] || WEEK_STRUCTURES[4];
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
    return struct.map(d => {
      let pool = EX.filter(e => (e.cat === 'strength' || e.cat === 'bands' || e.cat === 'rehab') && d.muscles.includes(e.muscle));
      if (injuryV) pool = pool.filter(e => e.level === 'beginner');
      if (equipV === 'bodyweight') pool = pool.filter(e => e.equip === 'Bodyweight');
      else if (equipV === 'dumbbell') pool = pool.filter(e => ['Dumbbell', 'Bodyweight'].includes(e.equip));
      else if (equipV === 'barbell') pool = pool.filter(e => ['Barbell', 'Dumbbell', 'Bodyweight'].includes(e.equip));
      if (levelV === 'foundation') {
        // Try foundation-only first; if fewer than 3 exercises, fall back to beginner for that day
        const fPool = pool.filter(e => e.level === 'foundation');
        pool = fPool.length >= 3 ? fPool : pool.filter(e => ['foundation', 'beginner'].includes(e.level));
      } else if (levelV === 'beginner') pool = pool.filter(e => e.level === 'beginner');
      else if (levelV === 'intermediate') pool = pool.filter(e => ['beginner', 'intermediate'].includes(e.level));
      // Pick 1–2 per muscle group proportionally then fill to 5
      const byMuscle = {};
      pool.forEach(e => { if (!byMuscle[e.muscle]) byMuscle[e.muscle] = []; byMuscle[e.muscle].push(e); });
      let exercises = [];
      d.muscles.forEach(m => {
        const group = byMuscle[m] ? shuffle(byMuscle[m]) : [];
        const quota = d.muscles.length <= 2 ? 2 : 1;
        exercises.push(...group.slice(0, quota));
      });
      // If still under 5, fill with shuffled leftovers
      if (exercises.length < 5) {
        const used = new Set(exercises.map(e => e.name));
        const extras = shuffle(pool.filter(e => !used.has(e.name)));
        exercises.push(...extras.slice(0, 5 - exercises.length));
      }
      exercises = exercises.slice(0, 6);
      return { day: d.day, focus: d.focus, duration: goalV === 'fat loss' ? '40–50 min' : '50–60 min', exercises };
    });
  };

  const generatePlan = async () => {
    setLoading(true); setWeekPlan(null);
    const hasInjury = injury && injuryArea;
    const injuryNote = hasInjury ? `User has an injury: ${injuryArea}. Avoid exercises stressing this area.` : '';
    const struct = WEEK_STRUCTURES[days] || WEEK_STRUCTURES[4];
    const dayList = struct.map(d => `${d.day} (${d.focus}): target muscles [${d.muscles.join(', ')}]`).join(' | ');

    // Build a compact exercise catalogue for AI to pick from
    const catalogue = EX
      .filter(e => e.cat === 'strength')
      .filter(e => {
        if (equip === 'bodyweight') return e.equip === 'Bodyweight';
        if (equip === 'dumbbell')   return ['Dumbbell','Bodyweight'].includes(e.equip);
        if (equip === 'barbell')    return ['Barbell','Dumbbell','Bodyweight'].includes(e.equip);
        return true; // full gym
      })
      .filter(e => {
        if (level === 'foundation') return e.level === 'foundation';
        if (level === 'beginner') return e.level === 'beginner';
        if (level === 'intermediate') return ['beginner','intermediate'].includes(e.level);
        return true;
      })
      .map(e => `${e.name}|${e.muscle}`);
    const catalogueStr = catalogue.join(', ');

    try {
      const sys = `You are an expert personal trainer. Return ONLY valid JSON, no markdown. Schema: {"week_plan":[{"day":"string","focus":"string","duration":"string","exercises":["exercise_name"]}]}. Pick exercise names ONLY from the provided catalogue. Each exercise name must exactly match the catalogue.`;
      const prompt = `Catalogue (name|muscle): ${catalogueStr}\n\nCreate a ${days}-day ${goal} plan for a ${level} using ${equip}. Plan: ${dayList}. Pick 5-6 exercises per day. Ensure each target muscle gets at least one exercise. ${injuryNote} Return ONLY the JSON.`;
      const text = await callClaude(sys, prompt);
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

      // Enrich exercise names with full local DB data
      const byName = {};
      EX.forEach(e => { byName[e.name.toLowerCase()] = e; });
      const enriched = parsed.week_plan.map(d => ({
        ...d,
        exercises: (d.exercises || []).map(nameOrObj => {
          const name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj.name;
          const local = byName[name?.toLowerCase()];
          if (local) return local;
          // AI gave us a name not in DB — use AI object data if available
          if (typeof nameOrObj === 'object') return nameOrObj;
          // Last resort: create minimal shell so ExCard doesn't crash
          return { name, muscle: 'general', primary: name, secondary: '', equip: equip === 'bodyweight' ? 'Bodyweight' : 'Any', level, sets: 3, reps: '10-12', rest: 60, steps: ['Focus on controlled movement', 'Full range of motion', 'Keep core braced'], tip: 'Perform with proper form.' };
        }).filter(Boolean),
      }));
      setWeekPlan(enriched);
    } catch {
      setWeekPlan(buildFallbackPlan(days, goal, level, equip, hasInjury ? injuryArea : null));
    }
    setLoading(false);
    setActiveDay(0);
  };

  const wizardSteps = [
    {
      q: 'How many days per week can you train?',
      sub: 'Be realistic — consistency beats intensity',
      field: 'days',
      opts: [
        { label: '3 Days', sub: 'Full Body — Perfect for beginners', val: 3 },
        { label: '4 Days', sub: 'Upper / Lower Split', val: 4 },
        { label: '5 Days', sub: 'Push / Pull / Legs', val: 5 },
        { label: '6 Days', sub: 'PPL ×2 — Advanced', val: 6 },
      ],
    },
    {
      q: 'What is your primary training goal?',
      sub: 'This shapes volume, intensity, and rest periods',
      field: 'goal',
      opts: [
        { label: 'Muscle Gain', sub: 'Hypertrophy — size and definition', val: 'muscle gain' },
        { label: 'Fat Loss', sub: 'Maintain muscle, burn fat', val: 'fat loss' },
        { label: 'Strength', sub: 'Progressive overload, heavier lifts', val: 'strength' },
        { label: 'Endurance', sub: 'Conditioning and stamina', val: 'endurance' },
      ],
    },
    {
      q: 'What is your training experience level?',
      sub: 'Be honest — beginners grow fastest with less',
      field: 'level',
      opts: [
        { label: '🌱 Foundation', sub: 'Can\'t yet do push-ups or squats — starting from zero', val: 'foundation' },
        { label: 'Beginner', sub: 'Under 1 year of consistent training', val: 'beginner' },
        { label: 'Intermediate', sub: '1–3 years, solid form on basics', val: 'intermediate' },
        { label: 'Advanced', sub: '3+ years, knows periodisation', val: 'advanced' },
      ],
    },
    {
      q: 'What equipment do you have access to?',
      sub: 'We\'ll build your plan around what\'s available',
      field: 'equip',
      opts: [
        { label: 'Full Gym', sub: 'Barbells, cables, machines — everything', val: 'full gym' },
        { label: 'Dumbbells', sub: 'Adjustable or fixed DBs + bench', val: 'dumbbell' },
        { label: 'Barbell', sub: 'Barbell + plates + rack', val: 'barbell' },
        { label: 'Bodyweight', sub: 'No equipment — home or outdoor', val: 'bodyweight' },
      ],
    },
  ];

  const curStep = wizardSteps[wStep];
  const totalWizardSteps = wizardSteps.length + 1; // +1 for injury step

  const progressPct = weekPlan ? 100 : (wStep / totalWizardSteps) * 100;

  // ── Injury step (step 4) ──
  const renderInjuryStep = () => (
    <div>
      <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>Any injuries or limitations?</div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>We'll adjust intensity and substitute exercises to protect you.</div>
      {injury === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'No injuries', sub: 'I can train freely', val: false, icon: '✅' },
            { label: 'Yes, I have an injury', sub: 'Tell us what area to protect', val: true, icon: '🩺' },
          ].map(opt => (
            <button key={String(opt.val)} onClick={() => { if (opt.val) setInjuryTyping(true); else { setInjury(false); generatePlan(); } }} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {injuryTyping && (
        <div>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 10 }}>Describe the injury / area to avoid (e.g. "left knee", "lower back", "right shoulder rotator cuff"):</div>
          <textarea value={injuryArea} onChange={e => setInjuryArea(e.target.value)} rows={3} placeholder="e.g. Lower back disc issue, avoid heavy deadlifts and squats..."
            style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', resize: 'none', marginBottom: 14 }} />
          <button onClick={() => { setInjury(injuryArea || 'general'); generatePlan(); }} disabled={!injuryArea.trim()} style={{
            width: '100%', background: injuryArea.trim() ? C.accent : C.s4, color: injuryArea.trim() ? '#000' : C.muted,
            border: 'none', borderRadius: 12, padding: 14, fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: injuryArea.trim() ? 'pointer' : 'not-allowed',
          }}>Build Injury-Safe Plan →</button>
        </div>
      )}
    </div>
  );

  // ── Main render ──
  return (
    <div>
      <Hd t="Workout" s="Week Plan · Library · Execute" />
      <div style={{ padding: '0 16px', display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['plan', 'Week Plan'], ['library', 'Exercise Library']].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{
            flex: 1, padding: '10px', background: view === k ? C.accent : C.s2,
            border: `1px solid ${view === k ? C.accent : C.border}`, borderRadius: 10,
            color: view === k ? '#000' : C.sub, fontFamily: fn, fontWeight: 700, fontSize: 11,
            letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* ── PLAN TAB ── */}
      {view === 'plan' && (
        <div style={{ padding: '0 16px' }}>

          {/* Manual Plan Builder */}
          {!weekPlan && planMode === 'manual' && (
            <ManualPlanBuilder setWeekPlan={setWeekPlan} onBack={() => setPlanMode(null)} />
          )}

          {/* Two-path landing — shown when no plan AND no mode selected */}
          {!weekPlan && !loading && planMode === null && (
            <div>
              <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>Create Your Workout Plan</div>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>Choose how you want to build your week.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => setPlanMode('ai')} className="msg-anim-fadeup" style={{
                  padding: '20px 18px', background: `linear-gradient(135deg, ${C.accent}20, ${C.accent}08)`,
                  border: `1px solid ${C.accent}44`, borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.accent, marginBottom: 4 }}>Build with AI</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>Answer a few questions — get a personalized week plan generated for you. Best for beginners.</div>
                </button>
                <button onClick={() => setPlanMode('manual')} className="msg-anim-fadeup msg-d2" style={{
                  padding: '20px 18px', background: C.s2,
                  border: `1px solid ${C.border}`, borderRadius: 18, cursor: 'pointer', textAlign: 'left',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>Enter My Plan</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>Already have a routine? Type in your exercises — we auto-fill the details using the exercise database.</div>
                </button>
              </div>
            </div>
          )}

          {/* AI Wizard — before plan is generated */}
          {!weekPlan && !loading && planMode === 'ai' && (
            <div>
              <button onClick={() => { setPlanMode(null); resetWizard(); }} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: fn, marginBottom: 16, padding: 0 }}>← Back</button>

              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {Array.from({ length: totalWizardSteps }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < wStep ? C.accent : i === wStep ? C.accent + '60' : C.s4, transition: 'background 0.3s' }} />
                ))}
              </div>

              {wStep < wizardSteps.length ? (
                <>
                  <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>{curStep.q}</div>
                  <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>{curStep.sub}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {curStep.opts.map(opt => {
                      const isActive = (curStep.field === 'days' && days === opt.val) || (curStep.field === 'goal' && goal === opt.val) || (curStep.field === 'level' && level === opt.val) || (curStep.field === 'equip' && equip === opt.val);
                      return (
                        <button key={String(opt.val)} onClick={() => {
                          if (curStep.field === 'days') setDays(opt.val);
                          if (curStep.field === 'goal') setGoal(opt.val);
                          if (curStep.field === 'level') setLevel(opt.val);
                          if (curStep.field === 'equip') setEquip(opt.val);
                          setWStep(s => s + 1);
                        }} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px',
                          background: isActive ? C.accent + '18' : C.s2,
                          border: `1px solid ${isActive ? C.accent : C.border}`, borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                        }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? C.accent : C.text }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{opt.sub}</div>
                          </div>
                          {isActive && <div style={{ color: C.accent, fontSize: 16 }}>✓</div>}
                        </button>
                      );
                    })}
                  </div>
                  {wStep > 0 && (
                    <button onClick={() => setWStep(s => s - 1)} style={{ width: '100%', marginTop: 14, padding: '11px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>← Back</button>
                  )}
                </>
              ) : renderInjuryStep()}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⚡</div>
              <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 18, color: C.accent, marginBottom: 8 }}>Building Your {days}-Day Plan</div>
              <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.5 }}>AI is designing your personalised week…{injury ? ' accounting for your injury' : ''}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, opacity: 0.4 + (i * 0.3), animation: 'none' }} />
                ))}
              </div>
            </div>
          )}

          {/* Week plan rendered */}
          {weekPlan && !loading && (
            <>
              {/* Plan header */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 18, color: C.text, letterSpacing: '-0.02em' }}>{days}-Day {goal.charAt(0).toUpperCase() + goal.slice(1)} Plan</div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>
                    {level} · {equip}{injury ? ` · 🩺 Injury-safe (${typeof injury === 'string' ? injury.slice(0, 30) : 'adjusted'})` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>To change this plan, go to ⚙️ Settings → Reset Workout Plan</div>
                </div>

                {/* Day tabs */}
                <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                  {weekPlan.map((d, i) => (
                    <button key={i} onClick={() => setActiveDay(i)} style={{
                      flexShrink: 0, padding: '7px 12px',
                      background: activeDay === i ? C.accent : C.s2,
                      border: `1px solid ${activeDay === i ? C.accent : C.border}`, borderRadius: 8,
                      color: activeDay === i ? '#000' : C.sub,
                      fontFamily: fn, fontWeight: 700, fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}>
                      {d.day.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active day */}
              {weekPlan[activeDay] && (() => {
                const d = weekPlan[activeDay];
                return (
                  <div>
                    <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 16px', marginBottom: 14 }}>
                      <div style={{ fontFamily: fn, fontWeight: 800, fontSize: 16, color: C.text, letterSpacing: '-0.01em' }}>{d.focus || d.day}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: C.sub, background: C.s3, padding: '2px 8px', borderRadius: 4 }}>⏱ {d.duration || '50–60 min'}</span>
                        <span style={{ fontSize: 10, color: C.sub, background: C.s3, padding: '2px 8px', borderRadius: 4 }}>💪 {(d.exercises || []).length} exercises</span>
                        {injury && <span style={{ fontSize: 10, color: C.orange, background: C.orange + '18', padding: '2px 8px', borderRadius: 4 }}>🩺 Low impact</span>}
                      </div>
                    </div>

                    {/* Single warmup block */}
                    <WarmupBlock />

                    {/* Exercises */}
                    {(d.exercises || []).map((ex, i) => <ExCard key={i} ex={ex} />)}

                    {/* Day nav */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 20 }}>
                      {activeDay > 0 && (
                        <button onClick={() => setActiveDay(a => a - 1)} style={{ flex: 1, padding: 12, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>← Prev Day</button>
                      )}
                      {activeDay < weekPlan.length - 1 && (
                        <button onClick={() => setActiveDay(a => a + 1)} style={{ flex: 1, padding: 12, background: C.accent + '18', border: `1px solid ${C.accent}44`, borderRadius: 10, color: C.accent, fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Next Day →</button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ── LIBRARY TAB ── */}
      {view === 'library' && (
        <div style={{ padding: '0 16px' }}>
          {(() => {
            const CATS = [
              { key: 'strength', label: '💪 Strength', color: C.blue },
              { key: 'bands', label: '🔴 Bands', color: C.orange },
              { key: 'pilates', label: '🪷 Pilates', color: '#c084fc' },
              { key: 'yoga', label: '🧘 Yoga', color: C.purple },
              { key: 'stretch', label: '🤸 Stretch', color: C.teal },
              { key: 'recovery', label: '🛁 Recovery', color: C.green },
              { key: 'rehab', label: '🩺 Rehab', color: C.red },
            ];
            const catColor = CATS.find(c => c.key === libCat)?.color || C.accent;

            // Search mode: filter all EX by name/primary/secondary/muscle
            const searchQ = libSearch.trim().toLowerCase();
            const searchResults = searchQ.length >= 2
              ? EX.filter(e => {
                  const haystack = `${e.name} ${e.muscle} ${e.primary} ${e.secondary || ''}`.toLowerCase();
                  return haystack.includes(searchQ);
                })
              : null;

            const catExs = EX.filter(e => e.cat === libCat && (filter === 'all' || e.level === filter));
            const muscles = ['all', ...new Set(EX.filter(e => e.cat === libCat).map(e => e.muscle))];
            return (
              <>
                {/* Search bar */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4 }}>🔍</span>
                  <input
                    value={libSearch}
                    onChange={e => setLibSearch(e.target.value)}
                    placeholder="Search by exercise, muscle, upper chest…"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: C.s2, border: `1px solid ${libSearch ? C.accent : C.border}`,
                      borderRadius: 12, padding: '11px 14px 11px 36px',
                      color: C.text, fontSize: 13, fontFamily: 'Barlow,sans-serif', outline: 'none',
                    }}
                  />
                  {libSearch && (
                    <button onClick={() => setLibSearch('')} style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: C.muted, fontSize: 16, cursor: 'pointer', lineHeight: 1,
                    }}>×</button>
                  )}
                </div>

                {/* Search results view */}
                {searchResults ? (
                  <>
                    <div style={{ color: C.sub, fontSize: 11, fontFamily: fn, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{libSearch}"
                    </div>
                    {searchResults.length === 0
                      ? <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises found — try a different term</div>
                      : searchResults.map((ex, i) => <ExCard key={i} ex={ex} />)
                    }
                  </>
                ) : (
                  <>
                    {/* Category tabs */}
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12, scrollbarWidth: 'none' }}>
                      {CATS.map(c => (
                        <button key={c.key} onClick={() => { setLibCat(c.key); setLibMuscle('all'); setFilter('all'); }} style={{
                          background: libCat === c.key ? c.color + '22' : 'transparent',
                          border: `1px solid ${libCat === c.key ? c.color : C.border}`,
                          borderRadius: 10, padding: '8px 14px', color: libCat === c.key ? c.color : C.sub,
                          fontFamily: fn, fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.04em', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>{c.label} <span style={{ opacity: 0.5 }}>({EX.filter(e => e.cat === c.key).length})</span></button>
                      ))}
                    </div>
                    {libCat === 'strength' && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {muscles.map(m => (
                          <button key={m} onClick={() => setLibMuscle(m)} style={{
                            background: libMuscle === m ? MC[m] || catColor + '20' : 'transparent',
                            border: `1px solid ${libMuscle === m ? MC[m] || catColor : C.border}`,
                            borderRadius: 7, padding: '5px 11px', color: libMuscle === m ? MC[m] || catColor : C.sub,
                            fontFamily: fn, fontWeight: 700, fontSize: 10, textTransform: 'capitalize', letterSpacing: '0.04em', cursor: 'pointer',
                          }}>{m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}</button>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                      {['all', 'foundation', 'beginner', 'intermediate', 'advanced'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                          background: filter === f ? C.s4 : 'transparent', color: filter === f ? C.text : C.muted,
                          border: `1px solid ${filter === f ? C.border : 'transparent'}`,
                          borderRadius: 7, padding: '4px 10px', fontSize: 10, fontFamily: fn, fontWeight: 600, textTransform: 'capitalize', cursor: 'pointer', letterSpacing: '0.04em',
                        }}>{f}</button>
                      ))}
                    </div>
                    {catExs.length === 0
                      ? <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>No exercises match</div>
                      : (libCat === 'strength' && libMuscle !== 'all' ? catExs.filter(e => e.muscle === libMuscle) : catExs).map((ex, i) => <ExCard key={i} ex={ex} />)
                    }
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Meal Card (Expandable) ──────────────────────────────────────────────────
function MealCard({ item, onDelete }) {
  const [open, setOpen] = useState(false);
  const cats = [
    { label: 'Macros', keys: ['protein', 'carbs', 'fat', 'fiber'] },
    { label: 'Minerals', keys: ['sodium', 'potassium', 'calcium', 'iron', 'magnesium', 'zinc'] },
    { label: 'Vitamins', keys: ['vitaminA', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE'] },
  ];
  return (
    <div style={{ background: C.s2, border: `1px solid ${open ? C.accent + '44' : C.border}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.25s' }}>
      {/* Header row — always visible */}
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
            P <span style={{ color: C.blue }}>{item.protein}g</span> · C <span style={{ color: C.teal }}>{item.carbs}g</span> · F <span style={{ color: C.orange }}>{item.fat}g</span> · Fiber <span style={{ color: C.purple }}>{item.fiber || 0}g</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ fontFamily: fn, fontSize: 28, color: C.accent, letterSpacing: '0.04em', lineHeight: 1 }}>{item.calories}</div>
          <div style={{ color: open ? C.accent : C.muted, fontSize: 16, fontWeight: 300, lineHeight: 1, transition: 'color 0.2s' }}>{open ? '−' : '+'}</div>
        </div>
      </div>

      {/* Expanded: full nutrient breakdown */}
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 14px 14px' }}>
          {cats.map(cat => (
            <div key={cat.label} style={{ marginBottom: 12 }}>
              <Lbl text={cat.label} style={{ marginBottom: 8 }} />
              {cat.keys.map(k => {
                const meta = NMETA.find(n => n.key === k);
                if (!meta) return null;
                const dri = BASE_DRI[k] || 1;
                const val = item[k] || 0;
                const pct = Math.min((val / dri) * 100, 130);
                const status = pct < 70 ? 'deficit' : pct > 110 ? 'excess' : 'ok';
                const bc = status === 'ok' ? C.green : status === 'excess' ? C.red : C.blue;
                const ic = status === 'ok' ? '✓' : status === 'excess' ? '↑' : '↓';
                const disp = meta.unit === 'mcg' ? val.toFixed(1) : meta.unit === 'g' ? val.toFixed(1) : Math.round(val);
                return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11.5, color: C.sub }}>{meta.label}</span>
                        <span style={{ fontSize: 10.5, color: bc, fontFamily: fb, fontWeight: 700 }}>{ic} {disp}/{dri}{meta.unit}</span>
                      </div>
                      <div style={{ height: 2.5, background: C.s4, borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: bc, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <button onClick={onDelete} style={{ marginTop: 4, width: '100%', padding: '9px', background: 'transparent', border: `1px solid ${C.red}33`, borderRadius: 9, color: C.red, fontFamily: fb, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Remove Entry
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Diet Onboarding ─────────────────────────────────────────────────────────
function DietOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState({ goal: '', speed: '', activity: '', diet: '', cw: '', tw: '' });

  const allSteps = [
    { q: "What's your primary goal?", field: 'goal', opts: ['Lose Weight', 'Gain Weight', 'Maintain'] },
    { q: 'At what pace?', field: 'speed', opts: ['Slow (±250 kcal)', 'Moderate (±500 kcal)', 'Aggressive (±750 kcal)'], skip: ans.goal === 'Maintain' },
    { q: 'How active are you?', field: 'activity', opts: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] },
    { q: 'Diet preference?', field: 'diet', opts: ['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Flexible'] },
  ];
  const steps = allSteps.filter(s => !s.skip);
  const total = steps.length + 1;
  const cur = steps[step];

  const next = (val) => {
    if (cur) setAns(a => ({ ...a, [cur.field]: val }));
    setStep(s => s + 1);
  };

  const finish = () => {
    const w = parseFloat(ans.cw) || 75;
    const mult = { Sedentary: 30, 'Lightly Active': 33, 'Moderately Active': 36, 'Very Active': 40 }[ans.activity] || 33;
    const tdee = Math.round(w * mult);
    const speedAdj = { 'Slow (±250 kcal)': 250, 'Moderate (±500 kcal)': 500, 'Aggressive (±750 kcal)': 750 }[ans.speed] || 0;
    const cal = ans.goal === 'Lose Weight' ? tdee - speedAdj : ans.goal === 'Gain Weight' ? tdee + speedAdj : tdee;
    const protein = Math.round(ans.goal === 'Gain Weight' ? w * 2.2 : ans.goal === 'Lose Weight' ? w * 2.0 : w * 1.8);
    const fat = Math.round(w * 0.8);
    const carbs = Math.max(50, Math.round((cal - protein * 4 - fat * 9) / 4));
    onComplete({ ...ans, calories: cal, protein, carbs, fat, currentWeight: w, targetWeight: parseFloat(ans.tw) || w });
  };

  return (
    <div style={{ padding: 24, minHeight: '100%' }}>
      <div style={{ fontFamily: fn, fontSize: 34, color: C.text, letterSpacing: '0.05em', marginBottom: 6 }}>PERSONALIZE</div>
      <div style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>Set up your nutrition profile in {total} steps</div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step || step >= total ? C.accent : i === step ? C.accent + '60' : C.s3, transition: 'background 0.3s' }} />
        ))}
      </div>

      {cur ? (
        <>
          <div style={{ fontFamily: fn, fontSize: 22, color: C.text, letterSpacing: '0.04em', marginBottom: 20, lineHeight: 1.2 }}>{cur.q}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cur.opts.map(opt => (
              <button key={opt} onClick={() => next(opt)} style={{
                background: C.s2, border: `1px solid ${ans[cur.field] === opt ? C.accent : C.border}`,
                borderRadius: 12, padding: '15px 18px', textAlign: 'left', cursor: 'pointer',
                color: ans[cur.field] === opt ? C.accent : C.text, fontSize: 15, fontWeight: 500,
                fontFamily: 'Barlow,sans-serif',
              }}>{opt}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontFamily: fn, fontSize: 22, color: C.text, letterSpacing: '0.04em', marginBottom: 20 }}>YOUR WEIGHT DETAILS</div>
          {[{ l: 'Current Weight (kg)', k: 'cw', p: 'e.g. 72.5' }, { l: 'Target Weight (kg)', k: 'tw', p: 'e.g. 68.0' }].map(f => (
            <div key={f.k} style={{ marginBottom: 16 }}>
              <Lbl text={f.l} style={{ marginBottom: 8 }} />
              <input type="number" value={ans[f.k]} onChange={e => setAns(a => ({ ...a, [f.k]: e.target.value }))} placeholder={f.p}
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', color: C.text, fontSize: 16, fontFamily: 'Barlow,sans-serif', outline: 'none' }} />
            </div>
          ))}
          <button onClick={finish} disabled={!ans.cw} style={{
            width: '100%', background: ans.cw ? C.accent : C.s4, color: ans.cw ? '#000' : C.muted,
            border: 'none', borderRadius: 12, padding: 15, fontSize: 13, fontFamily: fb,
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: ans.cw ? 'pointer' : 'not-allowed', marginTop: 8,
          }}>Calculate My Plan →</button>
        </>
      )}
    </div>
  );
}

// ─── Water Tracker ───────────────────────────────────────────────────────────
function WaterTracker() {
  const ML_PER_GLASS = 250;
  const TODAY_KEY  = () => `msg_water_${new Date().toISOString().slice(0, 10)}`;
  const GOAL_KEY   = 'msg_water_goal_ml'; // persists across days

  // Goal in ml, default 2000 ml (2 L)
  const [goalMl, setGoalMl] = useState(() => {
    try { return parseInt(localStorage.getItem(GOAL_KEY) || '2000', 10); } catch { return 2000; }
  });

  const [glasses, setGlasses] = useState(() => {
    try { return parseInt(localStorage.getItem(TODAY_KEY()) || '0', 10); } catch { return 0; }
  });

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput]     = useState('');

  const goalGlasses = Math.round(goalMl / ML_PER_GLASS);
  const maxGlasses  = Math.ceil(goalGlasses * 1.5);

  const update = (n) => {
    const v = Math.max(0, Math.min(n, maxGlasses));
    setGlasses(v);
    try { localStorage.setItem(TODAY_KEY(), String(v)); } catch { }
  };

  const applyGoal = (litres) => {
    const ml = Math.round(Math.max(0.5, Math.min(litres, 10)) * 1000);
    setGoalMl(ml);
    try { localStorage.setItem(GOAL_KEY, String(ml)); } catch { }
    setEditingGoal(false);
  };

  const intakeMl   = glasses * ML_PER_GLASS;
  const pct        = Math.min((intakeMl / goalMl) * 100, 100);
  const done       = intakeMl >= goalMl;
  const waterColor = done ? C.accent : C.blue;
  const bubbleCount = Math.min(goalGlasses, 12);

  return (
    <div style={{
      background: C.s2, border: `1px solid ${done ? waterColor + '55' : C.border}`,
      borderRadius: 18, padding: '16px 18px', marginBottom: 14,
      boxShadow: done ? `0 0 18px ${waterColor}22` : 'none',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 22 }}>💧</div>
          <div>
            <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Water Intake</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              {intakeMl} ml · of {goalMl} ml ({(goalMl / 1000).toFixed(1)} L)
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: waterColor, lineHeight: 1 }}>
            {(intakeMl / 1000).toFixed(2)}<span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>/{(goalMl / 1000).toFixed(1)} L</span>
          </div>
          <div style={{ fontSize: 9, color: done ? waterColor : C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {done ? '✓ Goal met!' : `${glasses}/${goalGlasses} glasses`}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: C.s4, borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${C.blue}, ${done ? C.accent : C.blue}90)`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Goal setter */}
      {editingGoal ? (
        <div style={{ marginBottom: 14, background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 10, color: C.sub, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Set Daily Goal
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[1.5, 2.0, 2.5, 3.0].map(l => (
              <button key={l} onClick={() => applyGoal(l)} style={{
                flex: 1, padding: '8px 0', borderRadius: 9,
                background: goalMl === l * 1000 ? waterColor + '22' : C.s2,
                border: `1.5px solid ${goalMl === l * 1000 ? waterColor : C.border}`,
                color: goalMl === l * 1000 ? waterColor : C.sub,
                fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>{l} L</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <input
              type="number" step="0.1" min="0.5" max="10"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              placeholder="e.g. 2.2 L"
              style={{
                flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: '10px 12px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none',
              }}
            />
            <button onClick={() => { const v = parseFloat(goalInput); if (v >= 0.5) applyGoal(v); }} style={{
              background: waterColor, border: 'none', borderRadius: 10,
              padding: '10px 18px', color: '#000', fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>Set</button>
            <button onClick={() => setEditingGoal(false)} style={{
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '10px 12px', color: C.muted, fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}>✕</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setGoalInput((goalMl / 1000).toFixed(1)); setEditingGoal(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Goal: {(goalMl / 1000).toFixed(1)} L/day
          </span>
          <span style={{ fontSize: 9, color: waterColor, fontFamily: fb, fontWeight: 700 }}>✎ Edit</span>
        </button>
      )}

      {/* Glass bubbles — uses bubbleCount (max 12), not undefined GOAL */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {Array.from({ length: bubbleCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => update(i < glasses ? i : i + 1)}
            style={{
              width: `calc(${100 / bubbleCount}% - 5px)`, aspectRatio: '1', borderRadius: 10,
              background: i < glasses ? waterColor + '22' : C.s3,
              border: `1.5px solid ${i < glasses ? waterColor : C.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, transition: 'all 0.18s ease',
              boxShadow: i < glasses ? `0 0 8px ${waterColor}44` : 'none',
            }}
          >{i < glasses ? '💧' : '○'}</button>
        ))}
        {goalGlasses > 12 && (
          <div style={{ fontSize: 10, color: C.muted, alignSelf: 'center', paddingLeft: 4 }}>
            +{goalGlasses - 12} more
          </div>
        )}
      </div>

      {/* +/- controls — use maxGlasses not hardcoded 12 */}
      <div style={{ display: 'flex', gap: 7 }}>
        <button
          onClick={() => update(glasses - 1)}
          disabled={glasses === 0}
          style={{
            flex: 1, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '9px 0', color: glasses === 0 ? C.muted : C.text,
            fontFamily: fn, fontWeight: 700, fontSize: 18, cursor: glasses === 0 ? 'not-allowed' : 'pointer',
            opacity: glasses === 0 ? 0.4 : 1,
          }}
        >−</button>
        <button
          onClick={() => update(glasses + 1)}
          disabled={glasses >= maxGlasses}
          style={{
            flex: 3, background: waterColor + '18', border: `1px solid ${waterColor}44`, borderRadius: 10,
            padding: '9px 0', color: waterColor,
            fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: glasses >= maxGlasses ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
          }}
        >+ Add Glass (250 ml)</button>
        <button
          onClick={() => update(glasses + 1)}
          disabled={glasses >= maxGlasses}
          style={{
            flex: 1, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '9px 0', color: glasses >= maxGlasses ? C.muted : waterColor,
            fontFamily: fn, fontWeight: 700, fontSize: 18, cursor: glasses >= maxGlasses ? 'not-allowed' : 'pointer',
            opacity: glasses >= maxGlasses ? 0.4 : 1,
          }}
        >+</button>
      </div>
    </div>
  );
}


// ─── Diet Section ────────────────────────────────────────────────────────────
function DietSection({ dietGoal, setDietGoal, mealLog, setMealLog }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [nutriTab, setNutriTab] = useState('macro');
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);

  if (!dietGoal) return <DietOnboarding onComplete={g => setDietGoal(g)} />;

  const dri = { ...BASE_DRI, calories: dietGoal.calories, protein: dietGoal.protein, carbs: dietGoal.carbs, fat: dietGoal.fat };
  const tot = mealLog.reduce((acc, item) => {
    NMETA.forEach(n => { acc[n.key] = (acc[n.key] || 0) + (item[n.key] || 0); });
    acc.calories = (acc.calories || 0) + (item.calories || 0);
    return acc;
  }, {});

  const logFood = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput(''); setLoading(true);

    // ── Local Food Database (values per 100g; defaultG = grams per "1 unit") ──
    const FOODS = [
      { al: ['egg', 'eggs', 'whole egg', 'boiled egg', 'fried egg'], cal: 155, p: 13, c: 1.1, f: 11, fi: 0, na: 124, k: 126, ca: 56, fe: 1.8, vA: 140, vB12: 1.1, vC: 0, vD: 2.0, vE: 1.1, mg: 12, zn: 1.3, dg: 60 },
      { al: ['egg white', 'egg whites'], cal: 52, p: 11, c: 0.7, f: 0.2, fi: 0, na: 166, k: 163, ca: 7, fe: 0.1, vA: 0, vB12: 0.1, vC: 0, vD: 0, vE: 0, mg: 11, zn: 0.0, dg: 33 },
      { al: ['milk', 'whole milk', 'cow milk', 'full fat milk'], cal: 61, p: 3.2, c: 4.8, f: 3.3, fi: 0, na: 43, k: 132, ca: 113, fe: 0.1, vA: 28, vB12: 0.4, vC: 1, vD: 1.3, vE: 0.1, mg: 10, zn: 0.4, dg: 250 },
      { al: ['paneer', 'cottage cheese india'], cal: 265, p: 18, c: 1.2, f: 20, fi: 0, na: 30, k: 91, ca: 190, fe: 0.2, vA: 193, vB12: 0.8, vC: 0, vD: 0.5, vE: 0.3, mg: 8, zn: 2.7, dg: 100 },
      { al: ['greek yogurt', 'greek yoghurt'], cal: 59, p: 10, c: 3.6, f: 0.4, fi: 0, na: 36, k: 141, ca: 110, fe: 0.1, vA: 0, vB12: 0.7, vC: 0, vD: 0, vE: 0, mg: 11, zn: 0.5, dg: 150 },
      { al: ['curd', 'dahi', 'plain yogurt', 'yogurt', 'yoghurt'], cal: 61, p: 3.5, c: 4.7, f: 3.3, fi: 0, na: 46, k: 155, ca: 121, fe: 0.1, vA: 27, vB12: 0.4, vC: 1, vD: 0, vE: 0.1, mg: 12, zn: 0.6, dg: 150 },
      { al: ['whey protein', 'whey', 'protein powder', 'protein shake'], cal: 120, p: 25, c: 3, f: 2, fi: 1, na: 140, k: 320, ca: 200, fe: 1.0, vA: 0, vB12: 1.2, vC: 0, vD: 2.0, vE: 0.5, mg: 30, zn: 2.5, dg: 30 },
      { al: ['butter', 'salted butter'], cal: 717, p: 0.9, c: 0.1, f: 81, fi: 0, na: 576, k: 24, ca: 24, fe: 0.0, vA: 684, vB12: 0.2, vC: 0, vD: 1.5, vE: 2.3, mg: 2, zn: 0.1, dg: 10 },
      { al: ['ghee', 'clarified butter', 'desi ghee'], cal: 900, p: 0, c: 0, f: 99, fi: 0, na: 0, k: 1, ca: 1, fe: 0.0, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 2.8, mg: 0, zn: 0.1, dg: 10 },
      { al: ['white rice', 'rice', 'cooked rice', 'boiled rice'], cal: 130, p: 2.7, c: 28, f: 0.3, fi: 0.4, na: 1, k: 35, ca: 10, fe: 0.2, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 12, zn: 0.5, dg: 200 },
      { al: ['raw rice', 'uncooked rice'], cal: 365, p: 7, c: 80, f: 0.7, fi: 2.8, na: 5, k: 115, ca: 28, fe: 0.8, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 25, zn: 1.1, dg: 100 },
      { al: ['oats', 'rolled oats', 'oatmeal', 'porridge oats'], cal: 389, p: 17, c: 66, f: 7, fi: 11, na: 2, k: 429, ca: 54, fe: 4.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.4, mg: 177, zn: 4.0, dg: 40 },
      { al: ['cooked oats', 'oatmeal cooked', 'porridge'], cal: 68, p: 2.5, c: 12, f: 1.4, fi: 1.7, na: 49, k: 61, ca: 10, fe: 0.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 26, zn: 0.6, dg: 250 },
      { al: ['roti', 'chapati', 'wheat roti', 'phulka'], cal: 297, p: 10, c: 56, f: 3.7, fi: 3.5, na: 3, k: 160, ca: 34, fe: 3.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.4, mg: 82, zn: 1.6, dg: 45 },
      { al: ['bread', 'white bread', 'sandwich bread', 'bread slice'], cal: 265, p: 9, c: 49, f: 3.2, fi: 2.7, na: 491, k: 115, ca: 107, fe: 3.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.4, mg: 23, zn: 0.7, dg: 35 },
      { al: ['brown bread', 'whole wheat bread', 'multigrain bread'], cal: 247, p: 13, c: 41, f: 4.2, fi: 6, na: 400, k: 248, ca: 107, fe: 3.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.6, mg: 82, zn: 1.5, dg: 35 },
      { al: ['quinoa', 'raw quinoa', 'uncooked quinoa'], cal: 368, p: 14, c: 64, f: 6, fi: 7, na: 5, k: 563, ca: 47, fe: 4.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 2.4, mg: 197, zn: 3.1, dg: 100 },
      { al: ['cooked quinoa', 'quinoa cooked', 'quinoa boiled'], cal: 120, p: 4.4, c: 22, f: 1.9, fi: 2.8, na: 7, k: 172, ca: 17, fe: 1.5, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.6, mg: 64, zn: 1.1, dg: 185 },
      { al: ['poha', 'flattened rice', 'beaten rice'], cal: 346, p: 6.3, c: 77, f: 0.6, fi: 1.5, na: 8, k: 140, ca: 14, fe: 2.8, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 45, zn: 1.0, dg: 80 },
      { al: ['semolina', 'rava', 'suji', 'sooji'], cal: 360, p: 13, c: 73, f: 1, fi: 3.9, na: 1, k: 186, ca: 17, fe: 4.4, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 47, zn: 0.9, dg: 50 },
      { al: ['wheat flour', 'atta', 'whole wheat flour'], cal: 340, p: 13, c: 72, f: 2, fi: 10, na: 2, k: 363, ca: 34, fe: 3.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 1.0, mg: 138, zn: 2.6, dg: 100 },
      { al: ['pasta', 'spaghetti', 'noodles'], cal: 371, p: 13, c: 75, f: 1.5, fi: 2.7, na: 6, k: 215, ca: 21, fe: 3.3, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 53, zn: 1.4, dg: 80 },
      { al: ['cooked pasta', 'boiled pasta'], cal: 158, p: 5.8, c: 31, f: 0.9, fi: 1.8, na: 1, k: 44, ca: 7, fe: 1.3, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 18, zn: 0.5, dg: 180 },
      { al: ['maggi', 'instant noodles', '2 minute noodles'], cal: 435, p: 9.5, c: 64, f: 16, fi: 3, na: 1045, k: 160, ca: 30, fe: 2.5, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.5, mg: 30, zn: 0.8, dg: 70 },
      { al: ['dal', 'lentils', 'raw dal', 'masoor dal', 'red lentil'], cal: 352, p: 25, c: 60, f: 1, fi: 11, na: 6, k: 677, ca: 56, fe: 7.5, vA: 0, vB12: 0, vC: 4, vD: 0, vE: 0.5, mg: 122, zn: 3.3, dg: 100 },
      { al: ['cooked dal', 'boiled dal', 'cooked lentils'], cal: 116, p: 9, c: 20, f: 0.4, fi: 8, na: 2, k: 369, ca: 19, fe: 3.3, vA: 2, vB12: 0, vC: 1.5, vD: 0, vE: 0.2, mg: 36, zn: 1.3, dg: 200 },
      { al: ['toor dal', 'arhar dal', 'pigeon pea'], cal: 335, p: 22, c: 57, f: 1.7, fi: 15, na: 17, k: 1392, ca: 130, fe: 5.2, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.5, mg: 183, zn: 2.8, dg: 100 },
      { al: ['moong dal', 'mung dal', 'yellow moong', 'green moong'], cal: 347, p: 24, c: 63, f: 1.2, fi: 16, na: 15, k: 1246, ca: 132, fe: 6.7, vA: 6, vB12: 0, vC: 4, vD: 0, vE: 0.4, mg: 189, zn: 2.7, dg: 100 },
      { al: ['chana dal', 'split chickpea', 'bengal gram'], cal: 364, p: 20, c: 61, f: 5, fi: 18, na: 24, k: 845, ca: 105, fe: 4.3, vA: 3, vB12: 0, vC: 3, vD: 0, vE: 0.3, mg: 139, zn: 3.4, dg: 100 },
      { al: ['urad dal', 'black dal', 'black gram'], cal: 347, p: 25, c: 59, f: 1.6, fi: 18, na: 38, k: 983, ca: 138, fe: 7.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.5, mg: 267, zn: 3.4, dg: 100 },
      { al: ['rajma', 'kidney beans', 'red kidney beans'], cal: 333, p: 24, c: 60, f: 0.8, fi: 25, na: 28, k: 1359, ca: 83, fe: 6.7, vA: 0, vB12: 0, vC: 5, vD: 0, vE: 0.2, mg: 140, zn: 2.8, dg: 100 },
      { al: ['cooked rajma', 'boiled kidney beans'], cal: 127, p: 8.7, c: 23, f: 0.5, fi: 7.4, na: 2, k: 403, ca: 35, fe: 2.9, vA: 0, vB12: 0, vC: 1, vD: 0, vE: 0.1, mg: 45, zn: 1.1, dg: 200 },
      { al: ['chickpeas', 'chana', 'chole', 'kabuli chana'], cal: 364, p: 19, c: 61, f: 6, fi: 17, na: 24, k: 875, ca: 105, fe: 6.2, vA: 3, vB12: 0, vC: 4, vD: 0, vE: 0.8, mg: 115, zn: 3.4, dg: 100 },
      { al: ['cooked chickpeas', 'boiled chickpeas', 'cooked chole'], cal: 164, p: 8.9, c: 27, f: 2.6, fi: 7.6, na: 7, k: 291, ca: 49, fe: 2.9, vA: 2, vB12: 0, vC: 1.3, vD: 0, vE: 0.4, mg: 48, zn: 1.5, dg: 200 },
      { al: ['tofu', 'soya paneer', 'bean curd'], cal: 76, p: 8, c: 1.9, f: 4.2, fi: 0.3, na: 7, k: 121, ca: 350, fe: 2.7, vA: 0, vB12: 0, vC: 0.1, vD: 0, vE: 0.1, mg: 30, zn: 0.8, dg: 100 },
      { al: ['chicken breast', 'boneless chicken', 'chicken fillet'], cal: 165, p: 31, c: 0, f: 3.6, fi: 0, na: 74, k: 256, ca: 15, fe: 1.0, vA: 9, vB12: 0.3, vC: 0, vD: 0.1, vE: 0.3, mg: 29, zn: 1.0, dg: 100 },
      { al: ['chicken thigh', 'chicken leg', 'dark chicken'], cal: 209, p: 26, c: 0, f: 11, fi: 0, na: 88, k: 220, ca: 13, fe: 1.3, vA: 21, vB12: 0.3, vC: 0, vD: 0.1, vE: 0.4, mg: 23, zn: 2.4, dg: 100 },
      { al: ['mutton', 'lamb', 'goat meat', 'gosht'], cal: 294, p: 25, c: 0, f: 21, fi: 0, na: 72, k: 310, ca: 17, fe: 2.7, vA: 0, vB12: 2.6, vC: 0, vD: 0, vE: 0.5, mg: 23, zn: 4.1, dg: 100 },
      { al: ['fish', 'white fish', 'rohu', 'katla', 'tilapia'], cal: 96, p: 20, c: 0, f: 1.7, fi: 0, na: 56, k: 302, ca: 17, fe: 0.5, vA: 14, vB12: 1.6, vC: 0, vD: 6.0, vE: 0.6, mg: 26, zn: 0.8, dg: 100 },
      { al: ['salmon', 'grilled salmon'], cal: 208, p: 20, c: 0, f: 13, fi: 0, na: 59, k: 363, ca: 12, fe: 0.4, vA: 58, vB12: 3.2, vC: 3, vD: 11, vE: 3.6, mg: 29, zn: 0.6, dg: 100 },
      { al: ['tuna', 'canned tuna', 'tuna fish'], cal: 130, p: 30, c: 0, f: 1, fi: 0, na: 50, k: 444, ca: 10, fe: 1.3, vA: 0, vB12: 2.5, vC: 0, vD: 4.5, vE: 1.0, mg: 35, zn: 0.8, dg: 100 },
      { al: ['potato', 'aloo', 'boiled potato'], cal: 87, p: 1.9, c: 20, f: 0.1, fi: 1.8, na: 6, k: 421, ca: 12, fe: 0.8, vA: 2, vB12: 0, vC: 20, vD: 0, vE: 0.1, mg: 23, zn: 0.3, dg: 150 },
      { al: ['sweet potato', 'shakarkandi'], cal: 86, p: 1.6, c: 20, f: 0.1, fi: 3, na: 55, k: 337, ca: 30, fe: 0.6, vA: 961, vB12: 0, vC: 3, vD: 0, vE: 0.3, mg: 25, zn: 0.3, dg: 130 },
      { al: ['spinach', 'palak', 'baby spinach'], cal: 23, p: 2.9, c: 3.6, f: 0.4, fi: 2.2, na: 79, k: 558, ca: 99, fe: 2.7, vA: 469, vB12: 0, vC: 28, vD: 0, vE: 2.0, mg: 79, zn: 0.5, dg: 100 },
      { al: ['broccoli'], cal: 34, p: 2.8, c: 6.6, f: 0.4, fi: 2.6, na: 33, k: 316, ca: 47, fe: 0.7, vA: 77, vB12: 0, vC: 89, vD: 0, vE: 0.8, mg: 21, zn: 0.4, dg: 100 },
      { al: ['carrot', 'gajar'], cal: 41, p: 0.9, c: 10, f: 0.2, fi: 2.8, na: 69, k: 320, ca: 33, fe: 0.3, vA: 835, vB12: 0, vC: 6, vD: 0, vE: 0.7, mg: 12, zn: 0.2, dg: 80 },
      { al: ['tomato', 'tamatar'], cal: 18, p: 0.9, c: 3.9, f: 0.2, fi: 1.2, na: 5, k: 237, ca: 10, fe: 0.3, vA: 42, vB12: 0, vC: 14, vD: 0, vE: 0.5, mg: 11, zn: 0.2, dg: 100 },
      { al: ['onion', 'pyaz'], cal: 40, p: 1.1, c: 9.3, f: 0.1, fi: 1.7, na: 4, k: 146, ca: 23, fe: 0.2, vA: 0, vB12: 0, vC: 8, vD: 0, vE: 0, mg: 10, zn: 0.2, dg: 80 },
      { al: ['cucumber', 'kheera'], cal: 15, p: 0.7, c: 3.6, f: 0.1, fi: 0.5, na: 2, k: 147, ca: 16, fe: 0.3, vA: 5, vB12: 0, vC: 2.8, vD: 0, vE: 0, mg: 13, zn: 0.2, dg: 100 },
      { al: ['banana', 'kela'], cal: 89, p: 1.1, c: 23, f: 0.3, fi: 2.6, na: 1, k: 358, ca: 5, fe: 0.3, vA: 3, vB12: 0, vC: 9, vD: 0, vE: 0.1, mg: 27, zn: 0.2, dg: 120 },
      { al: ['apple', 'seb'], cal: 52, p: 0.3, c: 14, f: 0.2, fi: 2.4, na: 1, k: 107, ca: 6, fe: 0.1, vA: 3, vB12: 0, vC: 5, vD: 0, vE: 0.2, mg: 5, zn: 0.0, dg: 150 },
      { al: ['mango', 'aam', 'alphonso'], cal: 60, p: 0.8, c: 15, f: 0.4, fi: 1.6, na: 1, k: 168, ca: 11, fe: 0.2, vA: 54, vB12: 0, vC: 36, vD: 0, vE: 0.9, mg: 10, zn: 0.1, dg: 200 },
      { al: ['orange', 'santra'], cal: 47, p: 0.9, c: 12, f: 0.1, fi: 2.4, na: 0, k: 181, ca: 40, fe: 0.1, vA: 11, vB12: 0, vC: 53, vD: 0, vE: 0.2, mg: 10, zn: 0.1, dg: 130 },
      { al: ['almonds', 'badam'], cal: 579, p: 21, c: 22, f: 50, fi: 12, na: 1, k: 733, ca: 264, fe: 3.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 25, mg: 270, zn: 3.1, dg: 30 },
      { al: ['peanuts', 'groundnuts', 'moongfali'], cal: 567, p: 26, c: 16, f: 49, fi: 8.5, na: 18, k: 705, ca: 92, fe: 4.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 8.3, mg: 168, zn: 3.3, dg: 30 },
      { al: ['peanut butter'], cal: 588, p: 25, c: 20, f: 50, fi: 6, na: 459, k: 649, ca: 49, fe: 1.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 9.1, mg: 154, zn: 2.5, dg: 32 },
      { al: ['chai', 'tea with milk', 'indian tea', 'masala chai'], cal: 37, p: 1.6, c: 5.5, f: 1, fi: 0, na: 10, k: 65, ca: 40, fe: 0.1, vA: 10, vB12: 0.1, vC: 0, vD: 0, vE: 0, mg: 5, zn: 0.1, dg: 200 },
      { al: ['idli', 'idly'], cal: 39, p: 2, c: 8, f: 0.2, fi: 0.5, na: 150, k: 35, ca: 8, fe: 0.3, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 8, zn: 0.2, dg: 60 },
      { al: ['dosa', 'plain dosa'], cal: 168, p: 4.6, c: 30, f: 3.7, fi: 1.5, na: 380, k: 110, ca: 20, fe: 0.9, vA: 0, vB12: 0, vC: 1, vD: 0, vE: 0.1, mg: 20, zn: 0.5, dg: 100 },
      { al: ['khichdi', 'dal khichdi'], cal: 124, p: 4.6, c: 23, f: 1.6, fi: 2.4, na: 220, k: 190, ca: 25, fe: 1.2, vA: 10, vB12: 0, vC: 1, vD: 0, vE: 0.2, mg: 30, zn: 0.7, dg: 200 },
      { al: ['biryani', 'chicken biryani', 'veg biryani'], cal: 197, p: 9, c: 29, f: 5.5, fi: 1.5, na: 450, k: 220, ca: 35, fe: 1.3, vA: 25, vB12: 0.2, vC: 3, vD: 0, vE: 0.4, mg: 28, zn: 1.0, dg: 250 },
      { al: ['paratha', 'aloo paratha'], cal: 300, p: 6.5, c: 45, f: 10, fi: 3, na: 380, k: 180, ca: 40, fe: 2.5, vA: 20, vB12: 0, vC: 4, vD: 0, vE: 0.5, mg: 40, zn: 0.8, dg: 80 },
      { al: ['paneer curry', 'palak paneer', 'paneer tikka'], cal: 230, p: 11, c: 8, f: 17, fi: 1.5, na: 380, k: 180, ca: 220, fe: 1.2, vA: 180, vB12: 0.5, vC: 8, vD: 0.3, vE: 0.6, mg: 25, zn: 1.8, dg: 200 },
      // Sugars & sweeteners
      { al: ['sugar', 'white sugar', 'table sugar', 'cane sugar', 'granulated sugar', 'sucrose'], cal: 387, p: 0, c: 100, f: 0, fi: 0, na: 1, k: 2, ca: 1, fe: 0.01, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 0, zn: 0, dg: 10 },
      { al: ['brown sugar', 'raw sugar', 'demerara sugar'], cal: 380, p: 0.1, c: 98, f: 0, fi: 0, na: 11, k: 133, ca: 83, fe: 1.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 29, zn: 0.2, dg: 10 },
      { al: ['honey', 'raw honey'], cal: 304, p: 0.3, c: 82, f: 0, fi: 0.2, na: 4, k: 52, ca: 6, fe: 0.4, vA: 0, vB12: 0, vC: 0.5, vD: 0, vE: 0, mg: 2, zn: 0.2, dg: 15 },
      { al: ['jaggery', 'gur', 'jaggery powder'], cal: 383, p: 0.4, c: 98, f: 0.1, fi: 0, na: 19, k: 1056, ca: 80, fe: 2.5, vA: 0, vB12: 0, vC: 7, vD: 0, vE: 0, mg: 70, zn: 0.3, dg: 10 },
      { al: ['maple syrup'], cal: 260, p: 0, c: 67, f: 0.1, fi: 0, na: 12, k: 204, ca: 102, fe: 0.1, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 21, zn: 1.0, dg: 20 },
      { al: ['jam', 'fruit jam', 'strawberry jam', 'mixed fruit jam'], cal: 250, p: 0.4, c: 65, f: 0.1, fi: 1, na: 32, k: 77, ca: 20, fe: 0.5, vA: 5, vB12: 0, vC: 3, vD: 0, vE: 0.1, mg: 4, zn: 0.1, dg: 20 },
      // Oils
      { al: ['olive oil', 'extra virgin olive oil'], cal: 884, p: 0, c: 0, f: 100, fi: 0, na: 2, k: 1, ca: 1, fe: 0.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 14.4, mg: 0, zn: 0, dg: 10 },
      { al: ['coconut oil'], cal: 892, p: 0, c: 0, f: 100, fi: 0, na: 0, k: 0, ca: 1, fe: 0.0, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0.1, mg: 0, zn: 0, dg: 10 },
      { al: ['sunflower oil', 'vegetable oil', 'cooking oil'], cal: 884, p: 0, c: 0, f: 100, fi: 0, na: 0, k: 0, ca: 0, fe: 0.0, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 5.6, mg: 0, zn: 0, dg: 10 },
      // Fruits
      { al: ['banana', 'ripe banana'], cal: 89, p: 1.1, c: 23, f: 0.3, fi: 2.6, na: 1, k: 358, ca: 5, fe: 0.3, vA: 3, vB12: 0, vC: 8.7, vD: 0, vE: 0.1, mg: 27, zn: 0.2, dg: 120 },
      { al: ['apple', 'red apple', 'green apple'], cal: 52, p: 0.3, c: 14, f: 0.2, fi: 2.4, na: 1, k: 107, ca: 6, fe: 0.1, vA: 3, vB12: 0, vC: 4.6, vD: 0, vE: 0.2, mg: 5, zn: 0.04, dg: 182 },
      { al: ['orange', 'navel orange', 'sweet lime', 'mosambi'], cal: 47, p: 0.9, c: 12, f: 0.1, fi: 2.4, na: 0, k: 181, ca: 40, fe: 0.1, vA: 11, vB12: 0, vC: 53, vD: 0, vE: 0.2, mg: 10, zn: 0.1, dg: 180 },
      { al: ['mango', 'ripe mango', 'alphonso'], cal: 60, p: 0.8, c: 15, f: 0.4, fi: 1.6, na: 1, k: 168, ca: 11, fe: 0.2, vA: 54, vB12: 0, vC: 36, vD: 0, vE: 0.9, mg: 10, zn: 0.1, dg: 200 },
      { al: ['dates', 'dry dates', 'medjool dates', 'khajoor'], cal: 282, p: 2.5, c: 75, f: 0.4, fi: 8, na: 2, k: 696, ca: 64, fe: 1.0, vA: 7, vB12: 0, vC: 0.4, vD: 0, vE: 0.1, mg: 54, zn: 0.4, dg: 40 },
      // Nuts & seeds
      { al: ['almonds', 'almond', 'badam'], cal: 579, p: 21, c: 22, f: 49, fi: 12.5, na: 1, k: 733, ca: 264, fe: 3.7, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 25.6, mg: 270, zn: 3.1, dg: 28 },
      { al: ['peanuts', 'groundnuts', 'moongphali'], cal: 567, p: 26, c: 16, f: 49, fi: 8.5, na: 18, k: 705, ca: 92, fe: 4.6, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 8.3, mg: 168, zn: 3.3, dg: 30 },
      { al: ['peanut butter', 'groundnut butter'], cal: 588, p: 25, c: 20, f: 50, fi: 6, na: 429, k: 558, ca: 49, fe: 1.9, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 9.1, mg: 154, zn: 2.9, dg: 32 },
      { al: ['walnuts', 'walnut', 'akhrot'], cal: 654, p: 15, c: 14, f: 65, fi: 6.7, na: 2, k: 441, ca: 98, fe: 2.9, vA: 1, vB12: 0, vC: 1.3, vD: 0, vE: 0.7, mg: 158, zn: 3.1, dg: 30 },
      // Beverages
      { al: ['coffee', 'black coffee', 'espresso', 'filter coffee'], cal: 2, p: 0.3, c: 0, f: 0, fi: 0, na: 5, k: 49, ca: 2, fe: 0.1, vA: 0, vB12: 0, vC: 0, vD: 0, vE: 0, mg: 3, zn: 0.0, dg: 240 },
      { al: ['protein bar', 'energy bar', 'granola bar'], cal: 400, p: 20, c: 45, f: 12, fi: 3, na: 200, k: 250, ca: 100, fe: 3, vA: 0, vB12: 0.5, vC: 0, vD: 0, vE: 0, mg: 30, zn: 1.0, dg: 60 },
    ];

    // ── Smart Quantity + Food Parser ─────────────────────────────────────────
    function parseEntry(raw) {
      const s = raw.toLowerCase().trim();
      let grams = null;
      let countMul = 1;

      // "x50g", "x 50g"
      const xg = s.match(/x\s*(\d+\.?\d*)\s*g\b/); if (xg) grams = parseFloat(xg[1]);
      // "100g", "100grams"
      if (!grams) { const m = s.match(/(\d+\.?\d*)\s*g(?:ram)?s?\b/); if (m) grams = parseFloat(m[1]); }
      // "100ml"
      if (!grams) { const m = s.match(/(\d+\.?\d*)\s*ml\b/); if (m) grams = parseFloat(m[1]); }
      // "2 cups" => *240
      if (!grams) { const m = s.match(/(\d+\.?\d*)\s*cup/); if (m) grams = parseFloat(m[1]) * 240; }
      // "half cup"
      if (!grams && s.includes('half cup')) grams = 120;
      // "half [food]" without unit
      const isHalf = !grams && (s.startsWith('half') || s.includes(' half '));
      // Count: "3 eggs" — only if NO gram amount found
      if (!grams) { const m = s.match(/^(\d+\.?\d*)\s+/); if (m) countMul = Math.min(parseFloat(m[1]), 20); }

      // Strip quantity tokens to isolate food name
      const foodStr = s
        .replace(/\d+\.?\d*\s*(?:g(?:ram)?s?|ml|kg|oz|lb|cups?|scoops?|pieces?|slices?|servings?)\b/g, '')
        .replace(/x\s*\d+\.?\d*\s*g?\b/g, '')
        .replace(/^\d+\.?\d*\s+/, '')
        .replace(/\b(half|boiled|fried|raw|cooked|whole|large|medium|small|fresh)\b/g, '')
        .replace(/\s+/g, ' ').trim();

      // Find best matching food
      let best = null, score = 0;
      for (const food of FOODS) {
        for (const alias of food.al) {
          if (foodStr === alias) { best = food; score = 999; break; }
          if (foodStr.includes(alias) && alias.length > score) { best = food; score = alias.length; }
          if (alias.includes(foodStr) && foodStr.length > score) { best = food; score = foodStr.length; }
        }
        if (score === 999) break;
      }
      if (!best) {
        const words = foodStr.split(' ').filter(w => w.length > 3);
        for (const food of FOODS) {
          for (const alias of food.al) {
            for (const word of words) {
              if (alias.includes(word) && word.length > score) { best = food; score = word.length; }
            }
          }
        }
      }
      if (!best) return null;

      const actualG = grams !== null ? grams : best.dg * countMul * (isHalf ? 0.5 : 1);
      const sc = actualG / 100;
      const r = (v, d = 1) => Math.round(v * sc * Math.pow(10, d)) / Math.pow(10, d);
      return {
        name: raw, calories: Math.round(best.cal * sc), protein: r(best.p),
        carbs: r(best.c), fat: r(best.f), fiber: r(best.fi),
        sodium: Math.round(best.na * sc), potassium: Math.round(best.k * sc),
        calcium: Math.round(best.ca * sc), iron: r(best.fe),
        vitaminA: Math.round(best.vA * sc), vitaminB12: r(best.vB12),
        vitaminC: Math.round(best.vC * sc), vitaminD: r(best.vD),
        vitaminE: r(best.vE), magnesium: Math.round(best.mg * sc), zinc: r(best.zn),
      };
    }

    const local = parseEntry(q);
    if (local) { setMealLog(p => [local, ...p]); setLoading(false); return; }

    // ── USDA FDC API lookup (accurate macros/micros) ──────────────────────────
    const USDA_KEY = import.meta.env.VITE_USDA_KEY ?? '';
    const USDA_NUTRIENT_MAP = {
      1008: 'calories', 1003: 'protein', 1005: 'carbs', 1004: 'fat',
      1079: 'fiber', 1093: 'sodium', 1092: 'potassium', 1087: 'calcium',
      1089: 'iron', 1106: 'vitaminA', 1178: 'vitaminB12', 1162: 'vitaminC',
      1114: 'vitaminD', 1109: 'vitaminE', 1090: 'magnesium', 1095: 'zinc',
    };
    if (USDA_KEY) {
      try {
        // Extract gram amount from query for scaling
        const gramsMatch = q.match(/(\d+\.?\d*)\s*g(?:ram)?s?\b/i);
        const scaleFactor = gramsMatch ? parseFloat(gramsMatch[1]) / 100 : 1;
        const searchTerm = q.replace(/\d+\.?\d*\s*g(?:ram)?s?\b/gi, '').trim() || q;

        const resp = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(searchTerm)}&api_key=${USDA_KEY}&dataType=Foundation,SR%20Legacy&pageSize=1`
        );
        if (resp.ok) {
          const data = await resp.json();
          const food = data.foods?.[0];
          if (food) {
            const nutrients = {};
            (food.foodNutrients || []).forEach(n => {
              const key = USDA_NUTRIENT_MAP[n.nutrientId];
              if (key) nutrients[key] = Math.round((n.value || 0) * scaleFactor * 10) / 10;
            });
            if (nutrients.calories) {
              const item = {
                name: `${food.description}${gramsMatch ? ` (${gramsMatch[1]}g)` : ''}`,
                calories: Math.round(nutrients.calories || 0),
                protein: nutrients.protein || 0,
                carbs: nutrients.carbs || 0,
                fat: nutrients.fat || 0,
                fiber: nutrients.fiber || 0,
                sodium: nutrients.sodium || 0,
                potassium: nutrients.potassium || 0,
                calcium: nutrients.calcium || 0,
                iron: nutrients.iron || 0,
                vitaminA: nutrients.vitaminA || 0,
                vitaminB12: nutrients.vitaminB12 || 0,
                vitaminC: nutrients.vitaminC || 0,
                vitaminD: nutrients.vitaminD || 0,
                vitaminE: nutrients.vitaminE || 0,
                magnesium: nutrients.magnesium || 0,
                zinc: nutrients.zinc || 0,
                source: 'USDA',
              };
              setMealLog(p => [item, ...p]);
              setLoading(false);
              return;
            }
          }
        }
      } catch (_) { /* fall through to AI */ }
    }

    // ── Claude AI fallback ────────────────────────────────────────────────────
    try {
      const sys = `Precise nutritionist. Return nutrition for the EXACT quantity stated. ONLY valid JSON, no markdown. Schema: {"name":"string","calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"sodium":number,"potassium":number,"calcium":number,"iron":number,"vitaminA":number,"vitaminB12":number,"vitaminC":number,"vitaminD":number,"vitaminE":number,"magnesium":number,"zinc":number}`;
      const text = await callClaude(sys, `Food: "${q}"`);
      const item = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (item.calories > 3000) item.calories = Math.round(item.calories / 10);
      setMealLog(p => [{ ...item, name: item.name || q }, ...p]);
    } catch {
      setMealLog(p => [{
        name: `${q} (estimated)`, calories: 200, protein: 8, carbs: 28, fat: 6, fiber: 3,
        sodium: 200, potassium: 250, calcium: 40, iron: 1.5,
        vitaminA: 15, vitaminB12: 0.3, vitaminC: 5, vitaminD: 0.3, vitaminE: 0.7, magnesium: 30, zinc: 0.8,
      }, ...p]);
    }
    setLoading(false);
  };


  // High protein sources by diet preference
  const proteinSources = {
    'Non-Vegetarian': [
      { food: 'Chicken Breast (100g)', protein: '31g', cal: '165', tag: 'Lean', macros: { protein: 31, carbs: 0, fat: 3.6 } },
      { food: 'Eggs (2 whole)', protein: '13g', cal: '155', tag: 'Complete', macros: { protein: 13, carbs: 1, fat: 11 } },
      { food: 'Tuna (100g)', protein: '30g', cal: '130', tag: 'Lean', macros: { protein: 30, carbs: 0, fat: 1 } },
      { food: 'Greek Yogurt (150g)', protein: '15g', cal: '90', tag: 'Dairy', macros: { protein: 15, carbs: 6, fat: 0.7 } },
      { food: 'Salmon (100g)', protein: '25g', cal: '208', tag: 'Omega-3', macros: { protein: 25, carbs: 0, fat: 13 } },
      { food: 'Cottage Cheese (100g)', protein: '11g', cal: '98', tag: 'Dairy', macros: { protein: 11, carbs: 3.4, fat: 4.3 } },
      { food: 'Turkey (100g)', protein: '29g', cal: '157', tag: 'Lean', macros: { protein: 29, carbs: 0, fat: 4 } },
      { food: 'Whey Protein (1 scoop)', protein: '25g', cal: '120', tag: 'Supplement', macros: { protein: 25, carbs: 3, fat: 2 } },
    ],
    'Vegetarian': [
      { food: 'Paneer (100g)', protein: '18g', cal: '265', tag: 'Dairy', macros: { protein: 18, carbs: 1.2, fat: 20 } },
      { food: 'Greek Yogurt (150g)', protein: '15g', cal: '90', tag: 'Dairy', macros: { protein: 15, carbs: 6, fat: 0.7 } },
      { food: 'Eggs (2 whole)', protein: '13g', cal: '155', tag: 'Complete', macros: { protein: 13, carbs: 1, fat: 11 } },
      { food: 'Lentils cooked (100g)', protein: '9g', cal: '116', tag: 'Plant', macros: { protein: 9, carbs: 20, fat: 0.4 } },
      { food: 'Chickpeas (100g)', protein: '9g', cal: '164', tag: 'Plant', macros: { protein: 9, carbs: 27, fat: 2.6 } },
      { food: 'Tofu (100g)', protein: '8g', cal: '76', tag: 'Soy', macros: { protein: 8, carbs: 1.9, fat: 4.2 } },
      { food: 'Cottage Cheese (100g)', protein: '11g', cal: '98', tag: 'Dairy', macros: { protein: 11, carbs: 3.4, fat: 4.3 } },
      { food: 'Whey Protein (1 scoop)', protein: '25g', cal: '120', tag: 'Supplement', macros: { protein: 25, carbs: 3, fat: 2 } },
    ],
    'Vegan': [
      { food: 'Tempeh (100g)', protein: '19g', cal: '193', tag: 'Fermented', macros: { protein: 19, carbs: 9, fat: 11 } },
      { food: 'Tofu firm (100g)', protein: '10g', cal: '83', tag: 'Soy', macros: { protein: 10, carbs: 2, fat: 5 } },
      { food: 'Lentils cooked (100g)', protein: '9g', cal: '116', tag: 'Plant', macros: { protein: 9, carbs: 20, fat: 0.4 } },
      { food: 'Black Beans (100g)', protein: '9g', cal: '132', tag: 'Legume', macros: { protein: 9, carbs: 24, fat: 0.5 } },
      { food: 'Edamame (100g)', protein: '11g', cal: '122', tag: 'Soy', macros: { protein: 11, carbs: 10, fat: 5 } },
      { food: 'Pea Protein (1 scoop)', protein: '21g', cal: '100', tag: 'Supplement', macros: { protein: 21, carbs: 2, fat: 1.5 } },
      { food: 'Hemp Seeds (30g)', protein: '10g', cal: '166', tag: 'Seeds', macros: { protein: 10, carbs: 2.6, fat: 14 } },
      { food: 'Seitan (100g)', protein: '25g', cal: '150', tag: 'Wheat', macros: { protein: 25, carbs: 14, fat: 1.9 } },
    ],
    'Flexible': [
      { food: 'Chicken Breast (100g)', protein: '31g', cal: '165', tag: 'Lean', macros: { protein: 31, carbs: 0, fat: 3.6 } },
      { food: 'Eggs (2 whole)', protein: '13g', cal: '155', tag: 'Complete', macros: { protein: 13, carbs: 1, fat: 11 } },
      { food: 'Paneer (100g)', protein: '18g', cal: '265', tag: 'Dairy', macros: { protein: 18, carbs: 1.2, fat: 20 } },
      { food: 'Lentils cooked (100g)', protein: '9g', cal: '116', tag: 'Plant', macros: { protein: 9, carbs: 20, fat: 0.4 } },
      { food: 'Greek Yogurt (150g)', protein: '15g', cal: '90', tag: 'Dairy', macros: { protein: 15, carbs: 6, fat: 0.7 } },
      { food: 'Tuna (100g)', protein: '30g', cal: '130', tag: 'Lean', macros: { protein: 30, carbs: 0, fat: 1 } },
      { food: 'Whey Protein (1 scoop)', protein: '25g', cal: '120', tag: 'Supplement', macros: { protein: 25, carbs: 3, fat: 2 } },
      { food: 'Tofu (100g)', protein: '8g', cal: '76', tag: 'Soy', macros: { protein: 8, carbs: 1.9, fat: 4.2 } },
    ],
  };
  const pSources = proteinSources[dietGoal.diet] || proteinSources['Flexible'];
  const tagColors = { Lean: C.accent, Complete: C.blue, Dairy: C.teal, Plant: C.green, Soy: C.purple, Supplement: C.orange, 'Omega-3': C.blue, Legume: C.teal, Fermented: C.pink, Seeds: C.purple, Wheat: C.orange };

  const calPct = Math.min(Math.round(((tot.calories || 0) / dri.calories) * 100), 100);
  const catMeta = NMETA.filter(n => n.cat === nutriTab);

  return (
    <div>
      <Hd t="DIET" s={`${dietGoal.goal} · ${dietGoal.calories} kcal target`} />

      {/* Goal tags + notepad toggle */}
      <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ background: C.accent + '18', color: C.accent, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6 }}>{dietGoal.goal}</span>
          {dietGoal.speed && <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6 }}>{dietGoal.speed?.split('(')[0].trim()}</span>}
          {dietGoal.diet && <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6 }}>{dietGoal.diet}</span>}
        </div>
        <button onClick={() => setNoteOpen(o => !o)} style={{
          background: noteOpen ? C.accent + '1A' : C.s3, border: `1px solid ${noteOpen ? C.accent : C.border}`,
          borderRadius: 8, padding: '5px 10px', color: noteOpen ? C.accent : C.muted,
          fontFamily: fb, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0, marginLeft: 8,
        }}>📝 {noteOpen ? 'Close' : 'Notes'}</button>
      </div>

      {/* Notepad */}
      {noteOpen && (
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ background: C.s2, border: `1px solid ${C.accent}33`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: fn, fontSize: 14, fontWeight: 700, color: C.accent }}>
                  🥩 High Protein Guide · {dietGoal.diet || 'Flexible'}
                </div>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 600 }}>per serving</span>
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>Protein · Carbs · Fat · Calories</div>
            </div>
            {/* Protein sources table */}
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {pSources.map((s, i) => {
                const tc = tagColors[s.tag] || C.accent;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.food}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                        <span style={{ color: C.blue }}>P {s.macros.protein}g</span>
                        {' · '}
                        <span style={{ color: C.teal }}>C {s.macros.carbs}g</span>
                        {' · '}
                        <span style={{ color: C.orange }}>F {s.macros.fat}g</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{s.cal}</div>
                      <div style={{ background: tc + '18', color: tc, fontSize: 7, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '1px 5px', borderRadius: 3, marginTop: 2 }}>{s.tag}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Personal notes */}
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>📝 My Notes</div>
              <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 400))} rows={3}
                placeholder="Track how you feel, cheat meals, energy levels..."
                style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', color: C.text, fontSize: 12, fontFamily: fn, resize: 'none', outline: 'none', lineHeight: 1.6 }} />
              <div style={{ textAlign: 'right', fontSize: 9, color: C.muted }}>{note.length}/400</div>
            </div>
          </div>
        </div>
      )}

      {/* Water Tracker */}
      <div style={{ padding: '0 16px 2px' }}>
        <WaterTracker />
      </div>

      {/* LOG FOOD — moved to top for quick access */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.text, marginBottom: 10 }}>Log Food</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && logFood()}
            placeholder="Describe any food in plain language..."
            style={{ flex: 1, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none' }}
          />
          <button onClick={logFood} disabled={loading || !input.trim()} style={{
            background: C.accent, border: 'none', borderRadius: 12, padding: '0 18px', color: '#000',
            fontFamily: fn, fontWeight: 700, fontSize: 12, cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !input.trim()) ? 0.4 : 1,
          }}>{loading ? '…' : 'LOG'}</button>
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 12 }}>AI estimates all 15 nutrients automatically</div>
        {mealLog.map((item, i) => <MealCard key={i} item={item} onDelete={() => setMealLog(l => l.filter((_, j) => j !== i))} />)}
      </div>

      {/* Calorie summary */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <Lbl text="Total Calories" style={{ marginBottom: 5 }} />
              <div style={{ fontFamily: fn, fontSize: 48, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: '-0.03em' }}>{Math.round(tot.calories || 0)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: fn, fontWeight: 700, fontSize: 15, color: (dri.calories - (tot.calories || 0)) > 0 ? C.accent : C.red }}>
                {(dri.calories - (tot.calories || 0)) > 0 ? `${dri.calories - Math.round(tot.calories || 0)} kcal left` : 'Over goal'}
              </div>
              <div style={{ color: C.muted, fontSize: 11 }}>of {dri.calories} kcal</div>
              {dietGoal.targetWeight && dietGoal.currentWeight && (
                <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
                  {dietGoal.currentWeight}→{dietGoal.targetWeight}kg · <span style={{ color: C.accent }}>{Math.abs((dietGoal.currentWeight - dietGoal.targetWeight).toFixed(1))}kg to go</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ height: 6, background: C.s4, borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${calPct}%`, background: calPct > 100 ? C.red : C.accent, borderRadius: 3, transition: 'width 0.4s ease' }} />
          </div>
        </Card>
      </div>

      {/* Full Nutrition Panel */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.text }}>Full Nutrition</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['↓', C.blue, 'Deficit'], ['✓', C.green, 'Optimal'], ['↑', C.red, 'Excess']].map(([ic, c, l]) => (
              <span key={l} style={{ fontSize: 9, color: c, fontFamily: fb, fontWeight: 700, background: c + '18', padding: '2px 6px', borderRadius: 3 }}>{ic} {l}</span>
            ))}
          </div>
        </div>
        <Card style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
            {[['macro', 'Macros'], ['mineral', 'Minerals'], ['vitamin', 'Vitamins']].map(([k, l]) => (
              <button key={k} onClick={() => setNutriTab(k)} style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none',
                borderBottom: `2px solid ${nutriTab === k ? C.accent : 'transparent'}`,
                color: nutriTab === k ? C.accent : C.muted, fontFamily: fn, fontWeight: 700, fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
          <div style={{ paddingBottom: 4 }}>
            {catMeta.map(n => <NRow key={n.key} label={n.label} current={tot[n.key] || 0} dri={dri[n.key] || BASE_DRI[n.key] || 0} unit={n.unit} color={n.color} />)}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Attendance Heat Map (GitHub-style) ───────────────────────────────────────
// Renders a 52-week × 7-day grid coloured by check-in intensity
function AttendanceHeatMap({ uid, gymId }) {
  const [checkInDates, setCheckInDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);

  useEffect(() => {
    if (!uid || !gymId || gymId === 'demo-gym') { setLoading(false); return; }
    (async () => {
      try {
        const db = await import('./shared/firebase.js').then(m => m.getFBFirestore());
        const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
        const snap = await db.collection(`attendance/${gymId}/logs`)
          .where('uid', '==', uid)
          .where('date', '>=', oneYearAgo)
          .get();
        const dates = new Set(snap.docs.map(d => d.data().date));
        setCheckInDates(dates);
        setTotalCheckIns(dates.size);
        // Calculate current streak
        let s = 0;
        let d = new Date();
        while (true) {
          const key = d.toISOString().split('T')[0];
          if (dates.has(key)) { s++; d = new Date(d - 86400000); }
          else break;
        }
        setStreak(s);
      } catch (e) { console.warn('HeatMap load:', e.message); }
      setLoading(false);
    })();
  }, [uid, gymId]);

  // Build 52 weeks × 7 days grid, starting from today going back
  const weeks = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Align to start of week (Sunday=0)
  const dayOfWeek = today.getDay();
  // Go back to cover 52 full weeks + current partial week
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (52 * 7 + dayOfWeek));

  let cur = new Date(startDate);
  let week = [];
  while (cur <= today) {
    const key = cur.toISOString().split('T')[0];
    week.push({ date: key, hasCheckIn: checkInDates.has(key), isToday: key === today.toISOString().split('T')[0] });
    if (week.length === 7) { weeks.push(week); week = []; }
    cur = new Date(cur.getTime() + 86400000);
  }
  if (week.length > 0) weeks.push(week);

  // Month labels
  const monthLabels = [];
  weeks.forEach((wk, wi) => {
    const first = wk[0];
    if (first) {
      const d = new Date(first.date + 'T00:00:00');
      if (d.getDate() <= 7) {
        monthLabels.push({ wi, label: d.toLocaleString('en-IN', { month: 'short' }) });
      }
    }
  });

  const cellColor = (day) => {
    if (!day.hasCheckIn) return C.s4;
    if (day.isToday) return C.accent;
    return C.accent + 'BB';
  };

  if (loading) return null;

  return (
    <div style={{ padding: '14px 16px 0' }}>
      <Card style={{ padding: '14px 14px 10px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <Lbl text="Check-in Consistency" style={{ marginBottom: 2 }} />
            <div style={{ fontSize: 10, color: C.muted }}>{totalCheckIns} days in the last year</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: 8, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>Streak</div>
            </div>
          </div>
        </div>

        {/* Month labels */}
        <div style={{ display: 'flex', marginBottom: 2, marginLeft: 0, overflowX: 'auto', paddingBottom: 2 }}>
          {weeks.map((_, wi) => {
            const lbl = monthLabels.find(m => m.wi === wi);
            return (
              <div key={wi} style={{ width: 11, flexShrink: 0, marginRight: 2 }}>
                {lbl ? <div style={{ fontSize: 7, color: C.muted, fontFamily: fb, whiteSpace: 'nowrap', transform: 'translateX(-2px)' }}>{lbl.label}</div> : null}
              </div>
            );
          })}
        </div>

        {/* Grid — columns = weeks, rows = days */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {wk.map((day, di) => (
                <div key={di} title={`${day.date}${day.hasCheckIn ? ' ✅' : ''}`} style={{
                  width: 9, height: 9, borderRadius: 2,
                  background: cellColor(day),
                  boxShadow: day.isToday && day.hasCheckIn ? `0 0 6px ${C.accent}88` : 'none',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 6 }}>
          <span style={{ fontSize: 8, color: C.muted, fontFamily: fb }}>Less</span>
          {[C.s4, C.accent + '44', C.accent + '88', C.accent + 'BB', C.accent].map((c, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c }} />
          ))}
          <span style={{ fontSize: 8, color: C.muted, fontFamily: fb }}>More</span>
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

function StoreSection({ gymId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('All');
  const [selected, setSelected] = useState(null);
  const [gymInfo, setGymInfo] = useState(null);

  useEffect(() => {
    if (!gymId) { setLoading(false); return; }
    (async () => {
      try {
        const db = await import('./shared/firebase.js').then(m => m.getFBFirestore());
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
              background: C.s2, border: `1px solid ${C.border}`, borderRadius: 16,
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
                  fontFamily: fb, fontWeight: 700,
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
function MembershipCard({ uid, gymId }) {
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    if (!uid || !gymId || gymId === 'demo-gym') { setLoading(false); return; }
    (async () => {
      try {
        const db = await import('./shared/firebase.js').then(m => m.getFBFirestore());
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
      <Hd t="EXPLORE" s="Tap muscle · browse exercises" />

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

// ChartTip is defined above HomeSection

// ─── Progress Section ────────────────────────────────────────────────────────
function ProgressSection({ logs, onLogClick, onDelete }) {
  const [metric, setMetric] = useState('weight');
  const metrics = [
    { key: 'weight', label: 'Weight', unit: 'kg', color: C.accent },
    { key: 'bodyFat', label: 'Body Fat', unit: '%', color: C.orange },
    { key: 'waist', label: 'Waist', unit: 'cm', color: C.blue },
    { key: 'chest', label: 'Chest', unit: 'cm', color: C.purple },
    { key: 'arms', label: 'Arms', unit: 'cm', color: C.teal },
  ];
  const cur = metrics.find(m => m.key === metric) || metrics[0];
  const last = logs[logs.length - 1];
  const first = logs[0];
  const totalDiff = last && first ? (last[metric] - first[metric]).toFixed(1) : null;
  const weekDiff = logs.length >= 2 ? (last[metric] - logs[logs.length - 2][metric]).toFixed(1) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 20px 12px' }}>
        <div>
          <div style={{ fontFamily: fn, fontSize: 34, letterSpacing: '0.05em', color: C.text, lineHeight: 1 }}>PROGRESS</div>
          <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Track your transformation</div>
        </div>
        <button onClick={onLogClick} style={{
          background: C.accent, border: 'none', borderRadius: 12, padding: '10px 16px',
          color: '#000', fontFamily: fb, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
        }}>+ Log Entry</button>
      </div>

      {/* Stat grid */}
      {last && (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Body Weight', val: `${last.weight} kg`, diff: totalDiff, c: C.accent },
            { label: 'Body Fat', val: `${last.bodyFat}%`, diff: null, c: C.orange },
            { label: 'Waist', val: last.waist > 0 ? `${last.waist} cm` : '—', diff: null, c: C.blue },
            { label: 'Chest', val: last.chest > 0 ? `${last.chest} cm` : '—', diff: null, c: C.purple },
            { label: 'Arms', val: last.arms > 0 ? `${last.arms} cm` : '—', diff: null, c: C.teal },
            { label: 'Legs', val: last.legs > 0 ? `${last.legs} cm` : '—', diff: null, c: C.pink || C.green },
          ].map((s, i) => (
            <Card key={i} style={{ padding: 14 }}>
              <Lbl text={s.label} style={{ marginBottom: 4 }} />
              <div style={{ fontFamily: fn, fontSize: 26, color: s.c, lineHeight: 1.2 }}>{s.val}</div>
              {s.diff && <div style={{ fontSize: 11, color: parseFloat(s.diff) < 0 ? C.green : C.orange, fontFamily: fb, fontWeight: 700, marginTop: 3 }}>
                {parseFloat(s.diff) < 0 ? '↓' : '↑'} {Math.abs(s.diff)} kg total
              </div>}
            </Card>
          ))}
        </div>
      )}

      {/* Graph */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
          {metrics.map(m => (
            <button key={m.key} onClick={() => setMetric(m.key)} style={{
              background: metric === m.key ? m.color + '1F' : 'transparent',
              border: `1px solid ${metric === m.key ? m.color : C.border}`,
              borderRadius: 7, padding: '5px 11px', color: metric === m.key ? m.color : C.sub,
              fontFamily: fb, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
            }}>{m.label}</button>
          ))}
        </div>
        {weekDiff && (
          <div style={{ fontSize: 12, color: parseFloat(weekDiff) <= 0 && metric === 'weight' ? C.green : parseFloat(weekDiff) >= 0 && metric !== 'weight' ? C.green : C.orange, fontFamily: fb, fontWeight: 700, marginBottom: 8 }}>
            {parseFloat(weekDiff) <= 0 ? '↓' : '↑'} {Math.abs(weekDiff)}{cur.unit} this week
          </div>
        )}
        <Card style={{ padding: '16px 4px 8px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={logs}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cur.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={cur.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.muted, fontSize: 9 }} axisLine={false} tickLine={false} width={30} domain={['auto', 'auto']} />
              <Tooltip content={<ChartTip color={cur.color} unit={cur.unit} />} />
              <Area type="monotone" dataKey={metric} stroke={cur.color} strokeWidth={2} fill="url(#pg)" dot={{ fill: cur.color, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Log history */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{ fontFamily: fn, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: C.text, marginBottom: 10 }}>LOG HISTORY</div>
        {logs.length === 0 && (
          <div style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No entries yet — tap + Log Entry to start</div>
        )}
        {[...logs].map((log, ri) => {
          const realIdx = logs.length - 1 - ri; // index in original array (reverse display)
          const idx = logs.length - 1 - ri;
          return (
            <Card key={ri} style={{ padding: '12px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: fb, fontWeight: 700, fontSize: 12, color: C.sub, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{log.date}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: C.accent }}>{log.weight}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>kg</span></span>
                  {log.bodyFat > 0 && <span style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: C.orange }}>{log.bodyFat}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>%bf</span></span>}
                  {log.height > 0 && <span style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: C.teal }}>{log.height}<span style={{ fontSize: 10, color: C.muted, fontWeight: 400 }}>cm</span></span>}
                  <button onClick={() => onDelete(idx)} style={{ width: 24, height: 24, borderRadius: '50%', background: C.red + '18', border: `1px solid ${C.red}33`, color: C.red, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 2 }}>×</button>
                </div>
              </div>
              {(log.chest || log.waist) > 0 && (
                <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                  {[['Chest', log.chest, 'cm'], ['Waist', log.waist, 'cm'], ['Arms', log.arms, 'cm'], ['Legs', log.legs, 'cm']].filter(([, v]) => v > 0).map(([l, v, u]) => (
                    <span key={l} style={{ fontSize: 11, color: C.muted }}>{l}: <span style={{ color: C.sub, fontWeight: 600 }}>{v}{u}</span></span>
                  ))}
                </div>
              )}
              {log.notes && <div style={{ fontSize: 11, color: C.muted, marginTop: 5, fontStyle: 'italic' }}>"{log.notes}"</div>}
            </Card>
          );
        }).reverse()}
      </div>

      {/* Weekly Activity — driven by real log data */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: C.text, marginBottom: 10 }}>Weekly Activity</div>
        <Card>
          {(() => {
            const weekDone = getThisWeekActivity(logs);
            const todayIdx = getTodayDowIndex();
            const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Lbl text="This Week" />
                  <span style={{ fontSize: 10, color: C.muted }}>{weekDone.filter(Boolean).length}/7 logged</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {DAY_LABELS.map((d, i) => {
                    const logged = weekDone[i];
                    const isToday = i === todayIdx;
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: logged ? C.accent : 'transparent',
                          border: isToday && !logged ? `2px solid ${C.accent}` : logged ? 'none' : `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px',
                          color: logged ? '#000' : isToday ? C.accent : C.muted,
                          fontSize: logged ? 13 : 11, fontWeight: 700,
                          boxShadow: isToday ? `0 0 0 3px ${C.accent}22` : 'none',
                        }}>{logged ? '✓' : d}</div>
                        <div style={{ color: isToday ? C.accent : C.muted, fontSize: 9, fontFamily: fb, fontWeight: 600 }}>{d}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}

// ─── Modal Shell ─────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: C.bg, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px 12px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: C.s3, border: 'none', width: 34, height: 34, borderRadius: '50%', color: C.sub, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <div style={{ fontFamily: fn, fontSize: 28, color: C.text, letterSpacing: '0.06em', lineHeight: 1 }}>{title}</div>
      </div>
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen({ onClose, progressLogs, dietGoal, mealLog = [], weekPlan, user }) {
  const [editing, setEditing] = useState(false);
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const [photo, setPhoto] = useState(() => {
    try { return localStorage.getItem('msg_profile_photo') || user?.photo || null; } catch { return user?.photo || null; }
  });
  const photoInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setPhoto(dataUrl);
      try { localStorage.setItem('msg_profile_photo', dataUrl); } catch {}
    };
    reader.readAsDataURL(file);
  };

  const [profile, setProfile] = useState({
    name: user?.name || 'User',
    initials,
    bio: '',
    age: '', gender: '', phone: '', city: '',
  });
  const [draft, setDraft] = useState({ ...profile });
  const sp = (k, v) => setDraft(p => ({ ...p, [k]: v }));

  const last = progressLogs[progressLogs.length - 1];
  const first = progressLogs[0];
  const realStreak = calcStreak(progressLogs); // weeks
  const weightChange = last && first ? last.weight - first.weight : null;
  const weightLost = weightChange !== null && weightChange < 0 ? Math.abs(weightChange) : 0;
  const weightGained = weightChange !== null && weightChange > 0 ? weightChange : 0;
  const totalWorkouts = progressLogs.length;

  const stats = [
    { label: 'Current Weight', val: last ? `${last.weight} kg` : '—', color: C.accent },
    { label: 'Body Fat', val: last ? `${last.bodyFat}%` : '—', color: C.orange },
    { label: 'Height', val: last && last.height > 0 ? `${last.height} cm` : '—', color: C.teal },
    { label: 'Weight Change', val: weightChange !== null ? `${weightChange.toFixed(1)} kg` : '—', color: weightChange < 0 ? C.green : C.orange },
    { label: 'Entries Logged', val: `${progressLogs.length}`, color: C.purple },
    { label: 'Check-in Streak', val: realStreak > 0 ? `${realStreak} day${realStreak !== 1 ? 's' : ''} 🔥` : '—', color: C.accent },
  ];

  // ── Achievement definitions (20 total) ───────────────────────────────────
  const [expandedAch, setExpandedAch] = useState(null);
  const ACHIEVEMENTS = [
    { id:1,  icon:'🩸', name:'First Blood',        cat:'Onboarding',   rarity:'Common',    desc:'Complete your first workout',
      how:'Log your first progress entry in the app. Just show up once — that\'s all it takes to start.',
      progress:'Single unlock — earned once, forever', unlocked: totalWorkouts >= 1 },
    { id:2,  icon:'💎', name:'Unbreakable',         cat:'Discipline',   rarity:'Common',    desc:'Maintain a 7-day check-in streak',
      how:'Log at least one progress entry every week without missing a week. Consistency is the key.',
      progress:'1 week → 4 weeks → 8 weeks → 52 weeks', unlocked: realStreak >= 1 },
    { id:3,  icon:'🤖', name:'Machine Mode',        cat:'Discipline',   rarity:'Common',    desc:'Hit a 30-day check-in streak',
      how:'Keep logging progress entries every week for 4 consecutive weeks. No gap allowed.',
      progress:'4 weeks of unbroken check-ins', unlocked: realStreak >= 4 },
    { id:4,  icon:'⏰', name:'5AM Club',            cat:'Lifestyle',    rarity:'Rare',      desc:'Complete 10 workouts before 6AM',
      how:'Start 10 of your workout sessions before 6:00 AM. Early birds build the strongest habits.',
      progress:'10 → 50 → 100 early sessions', unlocked: false },
    { id:5,  icon:'🌙', name:'Night Grinder',       cat:'Lifestyle',    rarity:'Rare',      desc:'Complete 10 workouts after 10PM',
      how:'Finish 10 workout sessions after 10:00 PM. Night owls earn this one.',
      progress:'10 → 50 → 100 late sessions', unlocked: false },
    { id:6,  icon:'⚙️', name:'Iron Soul',           cat:'Strength',     rarity:'Epic',      desc:'Lift a cumulative 100,000 kg total volume',
      how:'Track your lifts consistently. The app totals your volume across all sessions — sets × reps × weight.',
      progress:'100k → 500k → 1M → 10M kg', unlocked: false },
    { id:7,  icon:'📈', name:'The Bulk Begins',     cat:'Physique',     rarity:'Rare',      desc:'Intentionally gain 5kg of bodyweight',
      how:'Log your progress consistently while on a gaining phase. When your current weight exceeds your starting weight by 5kg, this unlocks.',
      progress:'5kg → 10kg → 15kg gained', unlocked: weightGained >= 5 },
    { id:8,  icon:'🔥', name:'Shredded Arc',        cat:'Physique',     rarity:'Rare',      desc:'Lose your first 5kg of fat',
      how:'Keep logging progress while cutting. When you\'re 5kg lighter than when you started, this unlocks automatically.',
      progress:'5kg → 10kg → 15kg lost', unlocked: weightLost >= 5 },
    { id:9,  icon:'🥩', name:'Protein King',        cat:'Nutrition',    rarity:'Rare',      desc:'Log 30+ meals in the Diet section',
      how:'Use the Diet tab to log your food daily. Every meal logged counts — aim for at least one log per day.',
      progress:'30 → 90 → 180 meals logged', unlocked: mealLog.length >= 30 },
    { id:10, icon:'💪', name:'No Excuses',          cat:'Hardcore',     rarity:'Epic',      desc:'Work out on a weekend, holiday, or bad weather day',
      how:'Show up when others don\'t. Complete a workout on a weekend, public holiday, or when life throws a curveball.',
      progress:'Seasonal Expansion unlocks', unlocked: false },
    { id:11, icon:'👻', name:'Ghost Mode',          cat:'Discipline',   rarity:'Common',    desc:'Complete a workout session without skipping any sets',
      how:'Build your workout plan and follow it to the letter — no skipped sets allowed. Tick every set in your plan.',
      progress:'10 → 50 → 100 perfect sessions', unlocked: totalWorkouts >= 1 && weekPlan != null },
    { id:12, icon:'🏆', name:'Beast PR',            cat:'Strength',     rarity:'Rare',      desc:'Set your first personal record on any lift',
      how:'Log a heavier lift than you\'ve done before on any exercise. Your history tracks PRs automatically.',
      progress:'1 → 10 → 50 PRs set', unlocked: false },
    { id:13, icon:'🦁', name:'Gym Veteran',         cat:'Achievement',  rarity:'Rare',      desc:'Log 100 progress entries (workouts)',
      how:'Show up 100 times. That\'s it. Every progress log counts toward this milestone.',
      progress:'100 → 500 → 1000 entries', unlocked: totalWorkouts >= 100 },
    { id:14, icon:'🧘', name:'Spartan Mind',        cat:'Recovery',     rarity:'Rare',      desc:'Meditate or stretch for 14 consecutive days',
      how:'Use the Recovery or Stretch section in Explore for 14 days in a row. Mind training counts as training.',
      progress:'14 → 30 → 90 days', unlocked: false },
    { id:15, icon:'📸', name:'The Transformation',  cat:'Physique',     rarity:'Epic',      desc:'Upload your first transformation comparison photo',
      how:'Go to your Profile and upload a before/after photo. Visual proof of your journey.',
      progress:'Milestone-based unlock', unlocked: false },
    { id:16, icon:'👑', name:'Alpha Discipline',    cat:'Discipline',   rarity:'Legendary', desc:'Maintain a 60-day unbroken check-in streak',
      how:'Log progress every single week for 8 weeks straight. Miss one week and the streak resets. Pure discipline.',
      progress:'60 → 180 → 365 days', unlocked: realStreak >= 8 },
    { id:17, icon:'🐺', name:'Lone Wolf',           cat:'Lifestyle',    rarity:'Rare',      desc:'Log 20 solo training sessions',
      how:'Train and log 20 workouts independently — no group classes, no partner sessions. Self-reliance builds character.',
      progress:'20 → 50 → 100 solo sessions', unlocked: totalWorkouts >= 20 },
    { id:18, icon:'🤝', name:'Brotherhood',         cat:'Social',       rarity:'Epic',      desc:'Refer 3 active friends to MSG',
      how:'Share your referral link with friends and have 3 of them sign up and log at least one workout.',
      progress:'3 → 10 → 25 referrals', unlocked: false },
    { id:19, icon:'🌍', name:'Built Different',     cat:'Hardcore',     rarity:'Epic',      desc:'Complete a workout outside your home gym',
      how:'Work out while travelling, at a hotel gym, outdoor park, or any non-home-gym location. Log it manually.',
      progress:'5 → 20 → 50 away sessions', unlocked: false },
    { id:20, icon:'⚡', name:'MSG Legend',          cat:'Legendary',    rarity:'Mythic',    desc:'365 logged entries + 52-week streak + transformation',
      how:'The final boss. Log every week for a full year, hit 365 total entries, and upload your transformation photo. Ultimate status.',
      progress:'Final Prestige — earned once', unlocked: realStreak >= 52 && totalWorkouts >= 365 },
  ];
  const rarityColor = { Common: C.sub, Rare: C.blue, Epic: C.purple, Legendary: C.orange, Mythic: '#FF6B6B' };
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  if (editing) {
    return (
      <ModalShell title="Edit Profile" onClose={() => setEditing(false)}>
        <div style={{ padding: '16px 20px 30px' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fn, fontSize: 26, fontWeight: 800, color: '#000' }}>{draft.initials}</div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: C.s3, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer' }}>✏️</div>
            </div>
          </div>
          {/* Fields */}
          {[
            { l: 'Full Name', k: 'name', p: 'Your name', type: 'text' },
            { l: 'Initials', k: 'initials', p: 'e.g. BS', type: 'text' },
            { l: 'Bio / Role', k: 'bio', p: 'What you study or do', type: 'text' },
            { l: 'Age', k: 'age', p: 'e.g. 20', type: 'number' },
            { l: 'City', k: 'city', p: 'e.g. Jaipur', type: 'text' },
            { l: 'Phone', k: 'phone', p: 'Optional', type: 'tel' },
          ].map(f => (
            <div key={f.k} style={{ marginBottom: 14 }}>
              <Lbl text={f.l} style={{ marginBottom: 7 }} />
              <input type={f.type} value={draft[f.k]} onChange={e => sp(f.k, e.target.value)} placeholder={f.p}
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 14px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none' }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <Lbl text="Gender" style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => (
                <button key={g} onClick={() => sp('gender', g)} style={{
                  flex: 1, padding: '9px 4px', background: draft.gender === g ? C.accent + '18' : C.s2,
                  border: `1px solid ${draft.gender === g ? C.accent : C.border}`, borderRadius: 10,
                  color: draft.gender === g ? C.accent : C.sub, fontFamily: fn, fontWeight: 600, fontSize: 10, cursor: 'pointer',
                }}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { setProfile({ ...draft }); setEditing(false); }} style={{ flex: 2, background: C.accent, border: 'none', borderRadius: 12, padding: 14, color: '#000', fontFamily: fn, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save Changes</button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="My Profile" onClose={onClose}>
      {/* Avatar + name */}
      <div style={{ padding: '24px 20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
        <button onClick={() => setEditing(true)} style={{ position: 'absolute', top: 20, right: 20, background: C.s3, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          ✏️ Edit
        </button>

        {/* Avatar with camera upload button */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ width: 86, height: 86, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fn, fontSize: 28, fontWeight: 800, color: '#000', border: `3px solid ${C.accent}55`, overflow: 'hidden' }}>
            {photo
              ? <img src={photo} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span>{profile.initials}</span>
            }
          </div>
          {/* Camera button overlay */}
          <button
            onClick={() => photoInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: C.accent, border: `2px solid ${C.bg}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 13, boxShadow: C.accentShadow,
              transition: 'transform 0.15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >📷</button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>{profile.name}</div>
        <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>{profile.bio}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          {profile.age && <span style={{ color: C.muted, fontSize: 12 }}>{profile.age} yrs</span>}
          {profile.gender && <span style={{ color: C.muted, fontSize: 12 }}>· {profile.gender}</span>}
          {profile.city && <span style={{ color: C.muted, fontSize: 12 }}>· 📍 {profile.city}</span>}
        </div>
        {dietGoal && (
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            <span style={{ background: C.accent + '18', color: C.accent, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: 6 }}>{dietGoal.goal}</span>
            <span style={{ background: C.s3, color: C.sub, fontSize: 10, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 12px', borderRadius: 6 }}>{dietGoal.activity || 'Moderately Active'}</span>
          </div>
        )}
      </div>
      {/* Stats grid */}
      <div style={{ padding: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 14px' }}>
            <Lbl text={s.label} style={{ marginBottom: 5 }} />
            <div style={{ fontFamily: fn, fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: '-0.01em', lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {/* Achievements */}
      <div style={{ padding: '18px 16px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Achievements</div>
          <span style={{ fontSize: 11, color: C.accent, fontFamily: fb, fontWeight: 700 }}>{unlockedCount} / {ACHIEVEMENTS.length} unlocked</span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: C.s4, borderRadius: 2, marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}%`, background: C.accent, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
          {ACHIEVEMENTS.map(a => {
            const rc = rarityColor[a.rarity] || C.sub;
            const isOpen = expandedAch === a.id;
            return (
              <div key={a.id} style={{ gridColumn: isOpen ? '1 / -1' : 'auto', transition: 'all 0.25s ease' }}>
                {/* Tile */}
                <div onClick={() => setExpandedAch(isOpen ? null : a.id)} style={{
                  background: a.unlocked ? (isOpen ? rc + '15' : C.s2) : C.s3,
                  border: `1.5px solid ${isOpen ? rc : a.unlocked ? rc + '55' : C.border}`,
                  borderRadius: isOpen ? '14px 14px 0 0' : 14,
                  padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                  opacity: a.unlocked ? 1 : 0.5,
                  filter: a.unlocked ? 'none' : 'grayscale(1)',
                  boxShadow: isOpen ? `0 0 16px ${rc}44` : a.unlocked ? `0 0 10px ${rc}22` : 'none',
                  transition: 'all 0.25s ease', position: 'relative', userSelect: 'none',
                }}>
                  <div style={{ fontSize: isOpen ? 30 : 24, marginBottom: 5, filter: a.unlocked ? 'none' : 'brightness(0)', transition: 'font-size 0.2s' }}>{a.icon}</div>
                  <div style={{ fontSize: 9, color: a.unlocked ? C.text : C.muted, fontFamily: fb, fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.3 }}>{a.name}</div>
                  <div style={{ fontSize: 7, color: rc, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3, opacity: a.unlocked ? 1 : 0.5 }}>{a.rarity}</div>
                  {a.unlocked && !isOpen && (
                    <div style={{ position: 'absolute', top: 5, right: 6, width: 9, height: 9, borderRadius: '50%', background: rc, boxShadow: `0 0 6px ${rc}` }} />
                  )}
                  <div style={{ fontSize: 8, color: C.muted, marginTop: 4 }}>{isOpen ? '▲ tap to close' : '▼ tap for details'}</div>
                </div>
                {/* Expanded detail panel */}
                {isOpen && (
                  <div style={{
                    background: C.s2, border: `1.5px solid ${rc}`, borderTop: 'none',
                    borderRadius: '0 0 14px 14px', padding: '14px 16px 16px',
                    boxShadow: `0 6px 20px ${rc}22`,
                  }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 36 }}>{a.icon}</div>
                      <div>
                        <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text }}>{a.name}</div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ background: rc + '1A', color: rc, fontSize: 9, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4 }}>{a.rarity}</span>
                          <span style={{ background: C.s3, color: C.sub, fontSize: 9, fontFamily: fb, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 4 }}>{a.cat}</span>
                          <span style={{ background: a.unlocked ? C.green + '20' : C.s4, color: a.unlocked ? C.green : C.muted, fontSize: 9, fontFamily: fb, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{a.unlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}</span>
                        </div>
                      </div>
                    </div>
                    {/* What it is */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: rc, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>What it means</div>
                      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{a.desc}</div>
                    </div>
                    {/* How to earn */}
                    <div style={{ background: rc + '0D', border: `1px solid ${rc}22`, borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: rc, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>💡 How to earn it</div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.65 }}>{a.how}</div>
                    </div>
                    {/* Progression */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>Progression</div>
                      <div style={{ fontSize: 10, color: C.sub, fontStyle: 'italic' }}>{a.progress}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, padding: '12px 14px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55 }}>
            🔒 <span style={{ color: C.sub }}>Locked achievements are earned through real progress — log workouts, hit streaks, and track nutrition to unlock them.</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Settings helpers (must be top-level, never inside render) ───────────────
function SettingsToggle({ on, onTap }) {
  return (
    <div onClick={onTap} style={{ width: 44, height: 24, borderRadius: 12, background: on ? C.accent : C.s4, cursor: 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: on ? '#000' : C.muted, transition: 'left 0.25s' }} />
    </div>
  );
}
function SettingsRow({ label, sub, on, onTap }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <SettingsToggle on={on} onTap={onTap} />
    </div>
  );
}

// ─── Notification Scheduling Helpers ─────────────────────────────────────────
const NOTIF_PROGRESS_ID = 1001;
const NOTIF_WATER_BASE  = 2000;

async function ensureNotifChannel() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.createChannel({
      id: 'msg_reminders',
      name: 'MSG Reminders',
      description: 'Daily progress and water intake reminders',
      importance: 4, // HIGH
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
    });
  } catch { /* web / unsupported platform */ }
}

async function requestNotifPermission() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await ensureNotifChannel();
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  } catch { return false; }
}

async function scheduleProgressReminder(timeStr) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_PROGRESS_ID }] });
    if (!timeStr) return;
    const [h, m] = timeStr.split(':').map(Number);
    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIF_PROGRESS_ID,
        title: '📊 Time to log your progress!',
        body: 'Record your weight, measurements & notes for today.',
        schedule: { on: { hour: h, minute: m }, allowWhileIdle: true, repeats: true },
        smallIcon: 'ic_launcher_foreground', channelId: 'msg_reminders',
      }],
    });
  } catch (e) { console.warn('scheduleProgressReminder:', e); }
}

async function scheduleWaterReminders(intervalHours, dndStart, dndEnd) {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const ids = Array.from({ length: 100 }, (_, i) => ({ id: NOTIF_WATER_BASE + i }));
    await LocalNotifications.cancel({ notifications: ids });
    if (!intervalHours || intervalHours === 'off') return;
    const ivMin = Math.round(parseFloat(intervalHours) * 60);
    if (isNaN(ivMin) || ivMin <= 0) return;
    const notifications = [];
    let nid = NOTIF_WATER_BASE;
    for (let m = 360; m <= 1320; m += ivMin) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const ds = dndStart != null ? parseInt(dndStart, 10) : null;
      const de = dndEnd   != null ? parseInt(dndEnd,   10) : null;
      const inDND = ds !== null && de !== null && (
        ds < de ? (h >= ds && h < de) : (h >= ds || h < de)
      );
      if (inDND) continue;
      notifications.push({
        id: nid++,
        title: '💧 Drink some water!',
        body: 'Staying hydrated keeps your energy up and performance sharp.',
        schedule: { on: { hour: h, minute: min }, allowWhileIdle: true, repeats: true },
        smallIcon: 'ic_launcher_foreground', channelId: 'msg_reminders',
      });
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch (e) { console.warn('scheduleWaterReminders:', e); }
}

// ─── Notification Settings Component ─────────────────────────────────────────
function NotificationSettings() {
  const LS = {
    progressTime:   'msg_notif_progress_time',
    waterInterval:  'msg_notif_water_interval',
    dndStart:       'msg_notif_dnd_start',
    dndEnd:         'msg_notif_dnd_end',
  };
  const load = k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };

  const [progressTime,  setProgressTime]  = useState(() => load(LS.progressTime)  || '20:00');
  const [waterInterval, setWaterInterval] = useState(() => load(LS.waterInterval) || 'off');
  const [dndStart,      setDndStart]      = useState(() => load(LS.dndStart)      || '22');
  const [dndEnd,        setDndEnd]        = useState(() => load(LS.dndEnd)        || '7');
  const [saved,         setSaved]         = useState(false);
  const [denied,        setDenied]        = useState(false);

  const save = async () => {
    const granted = await requestNotifPermission();
    if (!granted) { setDenied(true); return; }
    setDenied(false);
    try { localStorage.setItem(LS.progressTime,  progressTime);  } catch {}
    try { localStorage.setItem(LS.waterInterval, waterInterval); } catch {}
    try { localStorage.setItem(LS.dndStart,      dndStart);      } catch {}
    try { localStorage.setItem(LS.dndEnd,        dndEnd);        } catch {}
    await scheduleProgressReminder(progressTime);
    await scheduleWaterReminders(waterInterval, dndStart, dndEnd);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const chip = (val, cur, set) => (
    <button key={val} onClick={() => set(val)} style={{
      padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${cur === val ? C.accent : C.border}`,
      background: cur === val ? C.accent + '22' : C.s3,
      color: cur === val ? C.accent : C.sub,
      fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer',
      transition: 'all 0.18s',
    }}>{val}</button>
  );

  const hourOpts = Array.from({ length: 24 }, (_, i) => String(i));
  const selStyle = {
    background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '8px 12px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none',
    marginTop: 6, width: '100%',
  };

  return (
    <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 16px 14px' }}>

      {/* Progress reminder */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>📊 Daily Progress Reminder</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Pick a time — you'll get a daily reminder to log your weight & measurements.</div>
        <input
          type="time"
          value={progressTime}
          onChange={e => setProgressTime(e.target.value)}
          style={{ ...selStyle, width: 'auto' }}
        />
      </div>

      {/* Water reminder interval */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>💧 Water Reminder Interval</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>How often should we remind you to drink water? (6 AM – 10 PM)</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Off', val: 'off' },
            { label: 'Every 30m', val: '0.5' },
            { label: 'Every 1h', val: '1' },
            { label: 'Every 1.5h', val: '1.5' },
            { label: 'Every 2h', val: '2' },
            { label: 'Every 3h', val: '3' },
            { label: 'Every 4h', val: '4' },
          ].map(({ label, val }) => (
            <button key={val} onClick={() => setWaterInterval(val)} style={{
              padding: '6px 14px', borderRadius: 20,
              border: `1.5px solid ${waterInterval === val ? C.accent : C.border}`,
              background: waterInterval === val ? C.accent + '22' : C.s3,
              color: waterInterval === val ? C.accent : C.sub,
              fontFamily: fn, fontWeight: 700, fontSize: 11, cursor: 'pointer',
              transition: 'all 0.18s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* DND window */}
      {waterInterval !== 'off' && (
        <div style={{ marginBottom: 18, background: C.s3, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>🌙 Do Not Disturb</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>No water reminders during these hours.</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>From</div>
              <select value={dndStart} onChange={e => setDndStart(e.target.value)} style={selStyle}>
                {hourOpts.map(h => <option key={h} value={h}>{h.padStart(2,'0')}:00</option>)}
              </select>
            </div>
            <div style={{ color: C.muted, fontWeight: 700, paddingTop: 20 }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Until</div>
              <select value={dndEnd} onChange={e => setDndEnd(e.target.value)} style={selStyle}>
                {hourOpts.map(h => <option key={h} value={h}>{h.padStart(2,'0')}:00</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {denied && (
        <div style={{ fontSize: 11, color: C.red, marginBottom: 10, padding: '8px 12px', background: C.red + '18', borderRadius: 8 }}>
          ⚠️ Notification permission denied. Please enable it in Android Settings → Apps → MSG → Notifications.
        </div>
      )}

      <button onClick={save} style={{
        width: '100%', background: saved ? C.green + '22' : C.accent, border: 'none',
        borderRadius: 12, padding: '12px', color: saved ? C.green : '#000',
        fontFamily: fn, fontWeight: 800, fontSize: 13, cursor: 'pointer',
        boxShadow: saved ? 'none' : C.accentShadow, transition: 'all 0.3s',
      }}>
        {saved ? '✓ Saved & Scheduled!' : 'Save & Schedule Notifications'}
      </button>
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen({ onClose, onResetDiet, onResetWorkout, darkMode, onToggleTheme }) {
  const [settings, setSettings] = useState({
    units: 'kg', notifications: true, workoutReminder: true, mealReminder: false,
    darkMode: true, autoTimer: true, showMicros: true, weekStart: 'Mon',
  });
  const tog = k => setSettings(s => ({ ...s, [k]: !s[k] }));
  const sections = [
    {
      title: 'GENERAL', rows: [
        {
          label: 'Weight Units', sub: 'kg or lbs', custom: (
            <div style={{ display: 'flex', gap: 6 }}>
              {['kg', 'lbs'].map(u => (
                <button key={u} onClick={() => setSettings(s => ({ ...s, units: u }))} style={{ padding: '5px 14px', borderRadius: 10, background: settings.units === u ? C.accent : C.s4, color: settings.units === u ? '#111' : '', border: 'none', fontFamily: fb, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', boxShadow: settings.units === u ? C.accentShadow : 'none' }}>{u}</button>
              ))}
            </div>
          )
        },
        {
          label: 'Week Starts On', sub: 'Calendar view', custom: (
            <div style={{ display: 'flex', gap: 6 }}>
              {['Mon', 'Sun'].map(d => (
                <button key={d} onClick={() => setSettings(s => ({ ...s, weekStart: d }))} style={{ padding: '5px 14px', borderRadius: 10, background: settings.weekStart === d ? C.accent : C.s4, color: settings.weekStart === d ? '#111' : '', border: 'none', fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: settings.weekStart === d ? C.accentShadow : 'none' }}>{d}</button>
              ))}
            </div>
          )
        },
        {
          label: 'Theme', sub: darkMode ? 'Dark mode — tap to switch to Light' : 'Light mode — tap to switch to Dark', custom: (
            <button onClick={onToggleTheme} style={{ padding: '5px 16px', borderRadius: 10, background: C.accent, color: '#111', border: 'none', fontFamily: fb, fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: C.accentShadow }}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          )
        },
      ]
    },
    {
      title: 'NOTIFICATIONS',
      custom: (
        <NotificationSettings />
      ),
    },
    {
      title: 'WORKOUT', rows: [
        { label: 'Auto-Start Rest Timer', sub: 'Starts timer after set', k: 'autoTimer' },
      ]
    },
    {
      title: 'NUTRITION', rows: [
        { label: 'Show Micronutrients', sub: 'Vitamins & minerals panel', k: 'showMicros' },
      ]
    },
  ];
  return (
    <ModalShell title="SETTINGS" onClose={onClose}>
      <div style={{ padding: '8px 20px 30px' }}>
        {sections.map(sec => (
          <div key={sec.title} style={{ marginBottom: 24 }}>
            <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '16px 0 8px' }}>{sec.title}</div>
            {sec.custom
              ? sec.custom
              : sec.rows?.map((row, i) => row.k ? (
                  <SettingsRow key={i} label={row.label} sub={row.sub} on={settings[row.k]} onTap={() => tog(row.k)} />
                ) : (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{row.label}</div>
                      {row.sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{row.sub}</div>}
                    </div>
                    {row.custom}
                  </div>
                ))
            }
          </div>
        ))}
        {/* Reset workout plan */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0 10px' }}>WORKOUT PLAN</div>
          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 4 }}>Reset Weekly Workout Plan</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>Clears your current plan and lets you rebuild from scratch with new goals, days, or equipment.</div>
            <button onClick={() => { onResetWorkout(); onClose(); }} style={{
              width: '100%', background: C.blue + '18', border: `1px solid ${C.blue}44`, borderRadius: 10,
              padding: '11px', color: C.blue, fontFamily: fn, fontWeight: 700, fontSize: 12,
              letterSpacing: '0.02em', cursor: 'pointer',
            }}>↺ Reset &amp; Rebuild Workout</button>
          </div>
        </div>
        {/* Reconfigure diet plan */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0 10px' }}>DIET PLAN</div>
          <div style={{ background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginBottom: 4 }}>Reconfigure Nutrition Plan</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14, lineHeight: 1.5 }}>Reset your goal, calorie target, macro split, and dietary preferences.</div>
            <button onClick={() => { onResetDiet(); onClose(); }} style={{
              width: '100%', background: C.orange + '18', border: `1px solid ${C.orange}44`, borderRadius: 10,
              padding: '11px', color: C.orange, fontFamily: fb, fontWeight: 700, fontSize: 12,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
            }}>↩ Reset &amp; Reconfigure</button>
          </div>
        </div>
        <div style={{ marginTop: 8, padding: '12px 14px', background: C.s2, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>MSG v1.0 · Settings auto-saved</div>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Language Screen ──────────────────────────────────────────────────────────
function LanguageScreen({ onClose }) {
  const [selected, setSelected] = useState('en-IN');
  const langs = [
    { code: 'en-IN', name: 'English', region: 'India', native: 'English' },
    { code: 'hi-IN', name: 'Hindi', region: 'India', native: 'हिन्दी' },
    { code: 'en-US', name: 'English', region: 'United States', native: 'English (US)' },
    { code: 'en-GB', name: 'English', region: 'United Kingdom', native: 'English (UK)' },
    { code: 'mr-IN', name: 'Marathi', region: 'India', native: 'मराठी' },
    { code: 'gu-IN', name: 'Gujarati', region: 'India', native: 'ગુજરાતી' },
    { code: 'pa-IN', name: 'Punjabi', region: 'India', native: 'ਪੰਜਾਬੀ' },
    { code: 'ta-IN', name: 'Tamil', region: 'India', native: 'தமிழ்' },
    { code: 'te-IN', name: 'Telugu', region: 'India', native: 'తెలుగు' },
    { code: 'es-ES', name: 'Spanish', region: 'Spain', native: 'Español' },
    { code: 'fr-FR', name: 'French', region: 'France', native: 'Français' },
    { code: 'de-DE', name: 'German', region: 'Germany', native: 'Deutsch' },
    { code: 'ja-JP', name: 'Japanese', region: 'Japan', native: '日本語' },
    { code: 'zh-CN', name: 'Chinese', region: 'Simplified', native: '中文(简体)' },
    { code: 'ar-SA', name: 'Arabic', region: 'Saudi Arabia', native: 'العربية' },
  ];
  const regions = [...new Set(langs.map(l => l.region))];
  return (
    <ModalShell title="LANGUAGE" onClose={onClose}>
      <div style={{ padding: '12px 16px 30px' }}>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 20, lineHeight: 1.5 }}>
          Select your preferred language for the app interface.
        </div>
        {regions.map(region => (
          <div key={region} style={{ marginBottom: 18 }}>
            <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{region}</div>
            {langs.filter(l => l.region === region).map(l => (
              <button key={l.code} onClick={() => setSelected(l.code)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box',
                padding: '13px 14px', marginBottom: 7,
                background: selected === l.code ? C.accent + '18' : C.s2,
                border: `1px solid ${selected === l.code ? C.accent : C.border}`,
                borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: selected === l.code ? C.accent : C.text }}>{l.native}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{l.name}</div>
                </div>
                {selected === l.code && <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#000', fontWeight: 700, flexShrink: 0 }}>✓</div>}
              </button>
            ))}
          </div>
        ))}
        <button onClick={onClose} style={{ width: '100%', background: C.accent, border: 'none', borderRadius: 12, padding: 15, color: '#000', fontFamily: fb, fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 8 }}>
          Apply Language
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Profile Dropdown ────────────────────────────────────────────────────────
function ProfileDropdown({ onClose, onNavigate, onLogout, user }) {
  const items = [
    { icon: '👤', label: 'View Profile', sub: 'Stats, achievements & goals', action: 'profile' },
    { icon: '⚙️', label: 'Settings', sub: 'Units, notifications, preferences', action: 'settings' },
    { icon: '🌐', label: 'Language', sub: 'English (IN) · change anytime', action: 'language' },
    { icon: '🚪', label: 'Logout', sub: 'Sign out of MSG', action: 'logout', danger: true },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 49 }} />
      <div style={{ position: 'absolute', top: 56, right: 16, zIndex: 50, background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, minWidth: 228, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }}>
        <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${C.border}`, background: C.s3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fn, fontSize: 15, color: '#000', letterSpacing: '0.04em', flexShrink: 0 }}>BS</div>
            <div>
              <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, lineHeight: 1 }}>{(user?.name || 'User').toUpperCase()}</div>
              <div style={{ color: C.sub, fontSize: 11, marginTop: 3 }}>{user?.email || ''}</div>
            </div>
          </div>
        </div>
        {items.map((item, i) => (
          <button key={i} onClick={() => { onClose(); item.action === 'logout' ? onLogout() : onNavigate(item.action); }} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px',
            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none',
          }}
            onMouseEnter={e => e.currentTarget.style.background = C.s3}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <span style={{ fontSize: 17 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: item.danger ? C.red : C.text }}>{item.label}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{item.sub}</div>
            </div>
            {!item.danger && <span style={{ color: C.muted, fontSize: 14 }}>›</span>}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Log Progress Modal ──────────────────────────────────────────────────────
function LogProgressModal({ onSave, onClose }) {
  const [form, setForm] = useState({ weight: '', height: '', bodyFat: '', chest: '', waist: '', arms: '', legs: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    const entry = {
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      weight: parseFloat(form.weight) || 0,
      height: parseFloat(form.height) || 0,
      bodyFat: parseFloat(form.bodyFat) || 0,
      chest: parseFloat(form.chest) || 0,
      waist: parseFloat(form.waist) || 0,
      arms: parseFloat(form.arms) || 0,
      legs: parseFloat(form.legs) || 0,
      notes: form.notes,
    };
    onSave(entry);
    onClose();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: C.s1, borderRadius: '20px 20px 0 0', padding: '20px 20px 30px', maxHeight: '88%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: fn, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Log Progress</div>
          <button onClick={onClose} style={{ background: C.s3, border: 'none', width: 32, height: 32, borderRadius: '50%', color: C.sub, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[{ l: 'Weight (kg)', k: 'weight', p: '72.5' }, { l: 'Height (cm)', k: 'height', p: '175' }, { l: 'Body Fat %', k: 'bodyFat', p: '17.2' }].map(f => (
            <div key={f.k}>
              <Lbl text={f.l} style={{ marginBottom: 7 }} />
              <input type="number" value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.p}
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 10px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none' }} />
            </div>
          ))}
        </div>

        <Lbl text="Measurements (cm)" style={{ marginBottom: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {['chest', 'waist', 'arms', 'legs'].map(k => (
            <div key={k}>
              <div style={{ color: C.muted, fontSize: 10, fontFamily: fb, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.06em', marginBottom: 5 }}>{k}</div>
              <input type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="cm"
                style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 12px', color: C.text, fontSize: 14, fontFamily: fn, outline: 'none' }} />
            </div>
          ))}
        </div>

        <Lbl text="Notes (optional)" style={{ marginBottom: 8 }} />
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="How are you feeling today? Any PRs?" rows={2}
          style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 13, fontFamily: fn, outline: 'none', resize: 'none', marginBottom: 18 }} />

        <button onClick={save} disabled={!form.weight} style={{
          width: '100%', background: form.weight ? C.accent : C.s4, color: form.weight ? '#000' : C.muted,
          border: 'none', borderRadius: 12, padding: 15, fontSize: 13, fontFamily: fn, fontWeight: 700,
          letterSpacing: '0.02em', cursor: form.weight ? 'pointer' : 'not-allowed',
        }}>Save Entry</button>
      </div>
    </div>
  );
}

// ─── Bottom Nav (Animated) ────────────────────────────────────────────────────
function NavIcon({ id, active }) {
  const s = active ? C.accent : C.muted;
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: s, strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round', style: { transition: 'stroke 0.2s' } };
  if (id === 'home') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
  if (id === 'workout') return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
  if (id === 'diet') return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M8 6s1 2 4 2 4-2 4-2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="9" y1="12" x2="15" y2="12" /></svg>;
  if (id === 'store') return <svg {...p}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
  if (id === 'progress') return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>;
  return null;
}

function BottomNavAnimated({ tab, setTab, darkMode }) {
  const tabs = ['home', 'workout', 'diet', 'store', 'progress'];
  return (
    <div style={{ background: C.s1, borderTop: `1px solid ${C.border}`, display: 'flex', padding: '8px 0', flexShrink: 0, paddingBottom: 'max(16px, env(safe-area-inset-bottom))', boxShadow: `0 -4px 24px rgba(0,0,0,${darkMode ? '0.35' : '0.1'})` }}>
      {tabs.map(id => {
        const active = tab === id;
        return (
          <button key={id} id={`tut-tab-${id}`} onClick={() => setTab(id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '2px 0',
          }}>
            <div style={{
              transform: active ? 'scale(1.18) translateY(-2px)' : 'scale(1) translateY(0)',
              transition: 'transform 0.25s cubic-bezier(.22,.68,0,1.4)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <NavIcon id={id} active={active} />
            </div>
            <div style={{
              fontSize: 8, fontFamily: fb, fontWeight: active ? 700 : 500,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: active ? C.accent : C.muted,
              transition: 'color 0.2s',
            }}>{id}</div>
            <div style={{
              width: active ? 18 : 0, height: 2, borderRadius: 1, background: C.accent,
              transition: 'width 0.3s cubic-bezier(.22,.68,0,1.4)', marginTop: -1,
            }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Profile Setup Screen (shown once after first signup) ─────────────────────
function ProfileSetupScreen({ user, onComplete }) {
  const [form, setForm] = useState({
    name: user?.name || '', age: '', gender: '', height: '', currentWeight: '', targetWeight: '',
    goal: 'Build Strength', activity: 'Moderately Active', diet: 'Flexible', city: '',
  });
  const [step, setStep] = useState(0);
  const sp = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const steps = [
    {
      title: 'Who Are You? 👋', sub: 'Let\'s personalise your experience from day one.',
      fields: [
        { l: 'Display Name', k: 'name', p: 'What should we call you?', type: 'text' },
        { l: 'Age', k: 'age', p: 'e.g. 22', type: 'number' },
        { l: 'City / Location', k: 'city', p: 'e.g. Mumbai', type: 'text' },
      ],
    },
    {
      title: 'Your Body 💪', sub: 'Honest numbers = smarter targets. We\'ve got you.',
      fields: [
        { l: 'Height (cm)', k: 'height', p: 'e.g. 175', type: 'number' },
        { l: 'Current Weight (kg)', k: 'currentWeight', p: 'e.g. 72.5', type: 'number' },
        { l: 'Goal Weight (kg)', k: 'targetWeight', p: 'e.g. 68.0', type: 'number' },
      ],
    },
  ];

  const selOpts = [
    { l: 'Gender', k: 'gender', opts: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    { l: 'Primary Goal', k: 'goal', opts: ['Lose Fat', 'Build Muscle', 'Maintain', 'Build Strength'] },
    { l: 'Activity Level', k: 'activity', opts: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'] },
    { l: 'Diet Style', k: 'diet', opts: ['Flexible', 'Non-Vegetarian', 'Vegetarian', 'Vegan'] },
  ];
  const selStep = { title: 'Your Mission 🎯', sub: 'Set the direction. We\'ll handle the plan.', sels: selOpts };

  const allSteps = [...steps, selStep];
  const cur = allSteps[step];
  const isLast = step === allSteps.length - 1;

  const canNext = step === 0
    ? form.name && form.age
    : step === 1
      ? form.height && form.currentWeight && form.targetWeight
      : form.gender && form.goal;

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, zIndex: 200, display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', padding: '0 24px', justifyContent: 'center' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 28 }}>
        {allSteps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.accent : C.s3, transition: 'background 0.3s' }} />
        ))}
      </div>

      <div style={{ fontFamily: fn, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
        Step {step + 1} of {allSteps.length}
      </div>
      <div style={{ fontFamily: fn, fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 4 }}>{cur.title}</div>
      <div style={{ color: C.sub, fontSize: 13, marginBottom: 24 }}>{cur.sub}</div>

      {cur.fields?.map(f => (
        <div key={f.k} style={{ marginBottom: 14 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>{f.l}</div>
          <input type={f.type} value={form[f.k]} onChange={e => sp(f.k, e.target.value)} placeholder={f.p}
            style={{ width: '100%', boxSizing: 'border-box', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', color: C.text, fontSize: 15, fontFamily: fn, outline: 'none', transition: 'border 0.2s' }}
            onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>
      ))}

      {cur.sels?.map(s => (
        <div key={s.k} style={{ marginBottom: 16 }}>
          <div style={{ color: C.sub, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{s.l}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {s.opts.map(o => (
              <button key={o} onClick={() => sp(s.k, o)} style={{
                padding: '8px 14px', borderRadius: 20, border: `1px solid ${form[s.k] === o ? C.accent : C.border}`,
                background: form[s.k] === o ? C.accent : 'transparent', color: form[s.k] === o ? '#111' : C.sub,
                fontFamily: fn, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                boxShadow: form[s.k] === o ? C.accentShadow : 'none', transition: 'all 0.18s',
              }}>{o}</button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '14px', background: C.s2, border: `1px solid ${C.border}`, borderRadius: 14, color: C.sub, fontFamily: fn, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>← Back</button>
        )}
        <button onClick={() => {
          if (isLast) onComplete({ ...user, name: form.name || user?.name, profile: form });
          else setStep(s => s + 1);
        }} disabled={!canNext} style={{
          flex: 2, padding: '14px', background: canNext ? C.accent : C.s4, color: canNext ? '#111' : C.muted,
          border: 'none', borderRadius: 14, fontFamily: fn, fontWeight: 800, fontSize: 14,
          cursor: canNext ? 'pointer' : 'not-allowed', boxShadow: canNext ? C.accentShadow : 'none', transition: 'all 0.2s',
        }}>
          {isLast ? 'Let\'s Go 🚀' : 'Next →'}
        </button>
      </div>

      <button onClick={() => onComplete(user)} style={{ marginTop: 16, background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: fn }}>
        Fill this in later
      </button>
    </div>
  );
}


// ─── Tutorial Overlay (Spotlight) ────────────────────────────────────────────
const TUTORIAL_STEPS = [
  { id: 'welcome',      emoji: '👋', title: 'Welcome to MSG!',             body: "Your personal smart fitness app. Let's take a 30-second tour so you know exactly where everything is.", target: null },
  { id: 'stats',        emoji: '📊', title: 'Your Daily Stats',            body: 'Streak, calories, body weight — updated every day. Your personal health snapshot at a glance.', target: 'tut-stats' },
  { id: 'achievements', emoji: '🏆', title: 'Achievements',                body: 'Tap here to view earned badges and milestones. Unlock new ones by consistently hitting your goals.', target: 'tut-achievements' },
  { id: 'leaderboard',  emoji: '🏅', title: 'Leaderboard — Coming Soon',  body: "Soon you'll be able to compete with friends and climb global fitness ranks.", target: 'tut-leaderboard' },
  { id: 'workout',      emoji: '💪', title: 'Workout',                     body: 'Build your week plan with 140+ exercises across strength, yoga, bands & rehab. Rest timer included.', target: 'tut-tab-workout' },
  { id: 'diet',         emoji: '🥗', title: 'Diet & Water',                body: 'Log any meal in plain language. Track 15 nutrients and set your custom daily water goal in litres.', target: 'tut-tab-diet' },
  { id: 'explore',      emoji: '🗺️', title: 'Explore',                    body: 'Tap a muscle on the interactive body map to see exercises for that exact muscle group.', target: 'tut-tab-explore' },
  { id: 'progress',     emoji: '📈', title: 'Progress',                    body: 'Log weight, body fat & measurements. Charts show your transformation week over week.', target: 'tut-tab-progress' },
  { id: 'profile',      emoji: '👤', title: 'Your Profile',                body: 'Tap your avatar to open achievements, settings, language options, or sign out.', target: 'tut-profile-btn' },
  { id: 'done',         emoji: '🚀', title: "You're all set!",             body: "Your fitness journey starts now. Log your first workout, track a meal, or weigh in — every action builds your streak!", target: null },
];

function TutorialOverlay({ onDone }) {
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState(null);  // { top, left, right, bottom, width, height }
  const [above, setAbove] = useState(false);

  const cur    = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const total  = TUTORIAL_STEPS.length;

  useEffect(() => {
    if (!cur.target) { setSpot(null); return; }
    const PAD = 10;

    const el = document.getElementById(cur.target);
    if (!el) { setSpot(null); return; }

    // Scroll the element into the center of the viewport first
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    // Wait for scroll animation to settle, then measure
    const measure = () => {
      const r = el.getBoundingClientRect();
      const W = window.innerWidth, H = window.innerHeight;
      const s = {
        top:    Math.max(0, r.top    - PAD),
        left:   Math.max(0, r.left   - PAD),
        right:  Math.min(W, r.right  + PAD),
        bottom: Math.min(H, r.bottom + PAD),
      };
      s.width  = s.right  - s.left;
      s.height = s.bottom - s.top;
      setSpot(s);
      setAbove(r.top > H * 0.55);
    };

    // 380ms covers a typical 300ms smooth scroll + buffer
    const t = setTimeout(measure, 380);
    return () => clearTimeout(t);
  }, [step, cur.target]);

  const W = typeof window !== 'undefined' ? window.innerWidth  : 400;
  const H = typeof window !== 'undefined' ? window.innerHeight : 800;
  const DIM   = 'rgba(0,0,0,0.80)';
  const TRANS = 'all 0.36s cubic-bezier(.4,0,.2,1)';
  const CARD_W = Math.min(W - 32, 340);
  const OFFSET = 18;

  const cardLeft = spot
    ? Math.max(16, Math.min(W - CARD_W - 16, (spot.left + spot.right) / 2 - CARD_W / 2))
    : (W - CARD_W) / 2;
  const cardTop = spot
    ? (above ? Math.max(12, spot.top - OFFSET - 225) : Math.min(H - 270, spot.bottom + OFFSET))
    : Math.max(80, (H - 310) / 2);

  const arrowCenterX = spot ? (spot.left + spot.right) / 2 : W / 2;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
      {spot ? (<>
        {/* 4-rect dim to create spotlight hole */}
        <div style={{ position: 'fixed', top: 0,          left: 0, width: W,                     height: spot.top,              background: DIM, transition: TRANS, pointerEvents: 'auto' }} />
        <div style={{ position: 'fixed', top: spot.bottom, left: 0, width: W,                     height: Math.max(0, H - spot.bottom), background: DIM, transition: TRANS, pointerEvents: 'auto' }} />
        <div style={{ position: 'fixed', top: spot.top,   left: 0, width: spot.left,              height: spot.height,           background: DIM, transition: TRANS, pointerEvents: 'auto' }} />
        <div style={{ position: 'fixed', top: spot.top,   left: spot.right, width: Math.max(0, W - spot.right), height: spot.height, background: DIM, transition: TRANS, pointerEvents: 'auto' }} />

        {/* Spotlight glow ring */}
        <div style={{
          position: 'fixed', zIndex: 501,
          top: spot.top, left: spot.left, width: spot.width, height: spot.height,
          borderRadius: 15, border: `2.5px solid ${C.accent}`,
          boxShadow: `0 0 0 4px ${C.accent}22, 0 0 30px ${C.accent}77`,
          transition: TRANS, pointerEvents: 'none',
        }} />

        {/* Arrow */}
        <div style={{
          position: 'fixed', zIndex: 503,
          left: Math.max(20, Math.min(W - 20, arrowCenterX - 7)),
          top: above ? spot.top - OFFSET - 12 : spot.bottom + OFFSET - 10,
          width: 0, height: 0, pointerEvents: 'none',
          borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
          ...(above ? { borderTop: `10px solid ${C.s2}` } : { borderBottom: `10px solid ${C.s2}` }),
          transition: TRANS,
        }} />
      </>) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(3px)', pointerEvents: 'auto' }} />
      )}

      {/* Tooltip card */}
      <div style={{
        position: 'fixed', zIndex: 502, pointerEvents: 'auto',
        top: cardTop, left: cardLeft, width: CARD_W,
        background: C.s2, border: `1.5px solid ${C.accent}44`,
        borderRadius: 20, padding: '20px 20px 16px',
        boxShadow: `0 20px 60px rgba(0,0,0,0.75), 0 0 30px ${C.accent}18`,
        transition: `top ${TRANS}, left ${TRANS}`,
      }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} style={{
              flex: i === step ? 2.5 : 1, height: 3, borderRadius: 2,
              background: i <= step ? C.accent : C.s4,
              opacity: i > step ? 0.3 : 1,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{ fontSize: 9, color: C.muted, fontFamily: fb, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {step + 1} / {total}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>{cur.emoji}</span>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {cur.title}
          </div>
        </div>

        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.65, marginBottom: 16 }}>
          {cur.body}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              background: C.s3, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '10px 14px', color: C.sub,
              fontFamily: fn, fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0,
            }}>←</button>
          )}
          <button onClick={() => isLast ? onDone() : setStep(s => s + 1)} style={{
            flex: 1, background: C.accent, border: 'none', borderRadius: 10,
            padding: '11px', color: '#000',
            fontFamily: fn, fontWeight: 800, fontSize: 13,
            letterSpacing: '0.02em', cursor: 'pointer', boxShadow: C.accentShadow,
          }}>
            {isLast ? "🚀 Let's Go!" : 'Next →'}
          </button>
          {!isLast && (
            <button onClick={onDone} style={{
              background: 'none', border: 'none', color: C.muted,
              fontSize: 11, fontFamily: fn, cursor: 'pointer', padding: '0 4px', flexShrink: 0,
            }}>Skip</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MemberApp ────────────────────────────────────────────────────────────────
export default function MemberApp({
  user, darkMode, onToggleTheme, onLogout,
  gymId, gymName, // msg-app SaaS layer props
  dietGoal, setDietGoal, mealLog, setMealLog, weekPlan, setWeekPlan,
  progressLogs, setProgressLogs,
}) {
  Object.assign(C, THEMES[darkMode ? 'dark' : 'light']);

  const [tab, setTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [profileScreen, setProfileScreen] = useState(null);

  // Setup + tutorial gating
  // msg_setup_done is set after ProfileSetupScreen completes
  // msg_tutorial_done is set after the tutorial is dismissed
  const [setupDone, setSetupDone] = useState(() => !!localStorage.getItem('msg_setup_done'));
  const [showTutorial, setShowTutorial] = useState(false); // fires AFTER setup, not on mount

  // Register push notifications via Capacitor
  useEffect(() => {
    (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          await PushNotifications.register();
          PushNotifications.addListener('registration', token => {
            console.log('[MSG] Push token:', token.value);
          });
          PushNotifications.addListener('registrationError', err => {
            console.warn('[MSG] Push registration error:', err);
          });
          PushNotifications.addListener('pushNotificationReceived', n => {
            console.log('[MSG] Push received:', n);
          });
        }
      } catch {
        // Not available in web/dev environment — silently ignore
      }
    })();
  }, []);

  // ── Tab navigation history for Android back button ─────────────────────
  const tabHistoryRef = useRef(['home']);

  // Wrap setTab to push onto the history stack
  const navigate = (newTab) => {
    if (newTab !== tab) {
      tabHistoryRef.current = [...tabHistoryRef.current, newTab];
    }
    setTab(newTab);
  };

  // Register a global back handler for the Capacitor backButton event in App.jsx.
  // Priority: close profileScreen → close log modal → close profile dropdown
  //           → go to previous tab → go home → return false (let app exit)
  useEffect(() => {
    window.__msgGoBack = () => {
      if (!setupDone) return true;          // block back during setup
      if (showTutorial) return true;        // block back during tutorial
      if (profileScreen) { setProfileScreen(null); return true; }
      if (showLogModal)  { setShowLogModal(false);  return true; }
      if (showProfile)   { setShowProfile(false);   return true; }
      if (tabHistoryRef.current.length > 1) {
        tabHistoryRef.current = tabHistoryRef.current.slice(0, -1);
        setTab(tabHistoryRef.current[tabHistoryRef.current.length - 1]);
        return true;
      }
      if (tab !== 'home') { tabHistoryRef.current = ['home']; setTab('home'); return true; }
      return false;
    };
    return () => { window.__msgGoBack = null; };
  }, [setupDone, showTutorial, profileScreen, showLogModal, showProfile, tab]);

  const handleSaveProgress = (entry) => {
    setProgressLogs(l => [...l, entry]);

  };


  const views = {
    home: (
      <div>
        <HomeSection
          mealLog={mealLog}
          progressLogs={progressLogs}
          dietGoal={dietGoal}
          onLogClick={() => setShowLogModal(true)}
          user={user}
          gymId={gymId}
          onAchievementsClick={() => setProfileScreen('profile')}
        />
      </div>
    ),
    workout: <WorkoutSection weekPlan={weekPlan} setWeekPlan={setWeekPlan} />,
    diet:    <DietSection dietGoal={dietGoal} setDietGoal={setDietGoal} mealLog={mealLog} setMealLog={setMealLog} />,
    store:   <StoreSection gymId={gymId} />,
    progress: <ProgressSection logs={progressLogs} onLogClick={() => setShowLogModal(true)} onDelete={i => setProgressLogs(l => l.filter((_, j) => j !== i))} />,
  };

  // ── Show ProfileSetupScreen on first ever login ──────────────────────────
  if (!setupDone) {
    return (
      <ProfileSetupScreen
        user={user}
        onComplete={(completedUser) => {
          localStorage.setItem('msg_setup_done', '1');
          setSetupDone(true);
          // Only show tutorial if it hasn't been seen before
          if (!localStorage.getItem('msg_tutorial_done')) {
            setShowTutorial(true);
          }
        }}
      />
    );
  }

  return (
    <div className="msg-root" style={{ position: 'relative', background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', flexDirection: 'column', height: '100dvh', maxWidth: 430, margin: '0 auto', overflow: 'hidden', colorScheme: darkMode ? 'dark' : 'light' }}>
      {showTutorial && <TutorialOverlay onDone={() => { setShowTutorial(false); localStorage.setItem('msg_tutorial_done', '1'); }} />}
      {/* Status bar background — fills the notch/status bar area on edge-to-edge devices */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'env(safe-area-inset-top)', background: C.bg, zIndex: 999, flexShrink: 0 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingLeft: 20, paddingRight: 20, paddingBottom: 0, flexShrink: 0, zIndex: 10, background: C.bg }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
              width: 44, height: 44,
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(196,160,60,0.25), 0 0 16px rgba(196,160,60,0.35)',
              flexShrink: 0,
              transition: 'box-shadow 0.2s',
            }}>
            <img
              src={homeLogo}
              alt="MSG"
              style={{ width: 44, height: 44, objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
        <button id="tut-profile-btn" onClick={() => setShowProfile(p => !p)} style={{ width: 36, height: 36, borderRadius: '50%', background: C.accent, border: `2px solid ${showProfile ? C.text : 'transparent'}`, cursor: 'pointer', fontFamily: fn, fontSize: 11, fontWeight: 800, color: '#111', transition: 'all 0.2s', boxShadow: C.accentShadow, overflow: 'hidden', padding: 0 }}>
        {(() => {
          const savedPhoto = (() => { try { return localStorage.getItem('msg_profile_photo'); } catch { return null; } })();
          const photoSrc = savedPhoto || user?.photo;
          return photoSrc
            ? <img
                src={photoSrc} alt=''
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            : <span style={{ fontSize: 11, fontWeight: 800, color: '#111' }}>{(user?.name || 'U').slice(0,2).toUpperCase()}</span>;
        })()}
        </button>
      </div>

      {showProfile && (
        <ProfileDropdown
          onClose={() => setShowProfile(false)}
          onNavigate={screen => setProfileScreen(screen)}
          onLogout={onLogout}
          user={user}
        />
      )}

      {showLogModal && <LogProgressModal onSave={handleSaveProgress} onClose={() => setShowLogModal(false)} />}
      {profileScreen === 'profile'  && <ProfileScreen  onClose={() => setProfileScreen(null)} progressLogs={progressLogs} dietGoal={dietGoal} mealLog={mealLog} weekPlan={weekPlan} user={user} />}
      {profileScreen === 'settings' && <SettingsScreen onClose={() => setProfileScreen(null)} onResetDiet={() => setDietGoal(null)} onResetWorkout={() => setWeekPlan(null)} darkMode={darkMode} onToggleTheme={onToggleTheme} />}
      {profileScreen === 'language' && <LanguageScreen onClose={() => setProfileScreen(null)} />}

      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {views[tab]}
      </div>
      <BottomNavAnimated tab={tab} setTab={navigate} darkMode={darkMode} />
    </div>
  );
}

