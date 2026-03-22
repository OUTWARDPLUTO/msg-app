import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const C = {
  bg:'#09090C', s1:'#111115', s2:'#16161B', s3:'#1D1D24', s4:'#25252E',
  accent:'#C4FF47', accentD:'rgba(196,255,71,0.1)',
  orange:'#FF6240', blue:'#4E9FFF', purple:'#A78BFA', teal:'#2DD4BF', pink:'#F472B6',
  green:'#4ADE80', red:'#F87171',
  text:'#EFEFF5', sub:'#8888A0', muted:'#50505F', border:'#20202A',
};
const fn = "'Plus Jakarta Sans', sans-serif";
const fb = "'Plus Jakarta Sans', sans-serif";
const MC = { chest:C.blue, back:C.teal, shoulders:C.purple, arms:C.orange, core:C.accent, legs:'#FF6B6B' };

// ─── Exercise Database ──────────────────────────────────────────────────────
const EX = [
  // ── Chest ──
  { name:'Bench Press', cat:'strength', muscle:'chest', primary:'Chest', secondary:'Triceps, Ant. Deltoid', equip:'Barbell', level:'beginner', sets:4, reps:'8–12', rest:90, steps:['Lie flat, grip bar slightly wider than shoulders','Unrack and lower to mid-chest with control','Press explosively, elbows at 45°','Lock out without shrugging'], tip:'Arch upper back slightly; feet flat on floor' },
  { name:'Incline DB Press', cat:'strength', muscle:'chest', primary:'Upper Chest', secondary:'Ant. Deltoid', equip:'Dumbbell', level:'intermediate', sets:3, reps:'10–12', rest:75, steps:['Set bench to 30–45° incline','DBs at shoulder level, palms forward','Press upward and slightly inward','3-second eccentric descent'], tip:'Keep slight elbow bend at top to maintain tension' },
  { name:'Cable Flyes', cat:'strength', muscle:'chest', primary:'Chest', secondary:'Anterior Deltoid', equip:'Machine', level:'intermediate', sets:3, reps:'12–15', rest:60, steps:['Stand between cables at chest height','Arms wide, step forward','Bring hands together in hugging arc','Control return with 3s eccentric'], tip:'Think "hugging a barrel" — don\'t let elbows drop' },
  { name:'Push-Ups', cat:'strength', muscle:'chest', primary:'Chest', secondary:'Triceps, Core', equip:'Bodyweight', level:'beginner', sets:3, reps:'12–20', rest:45, steps:['Hands shoulder-width, body straight','Lower chest to 1 inch from floor','Push explosively back to start','Keep core braced throughout'], tip:'Squeeze chest at top — imagine pushing the floor apart' },
  { name:'Dumbbell Pullover', cat:'strength', muscle:'chest', primary:'Chest, Lats', secondary:'Serratus', equip:'Dumbbell', level:'intermediate', sets:3, reps:'12–15', rest:60, steps:['Lie across bench, hold one DB overhead','Lower DB in arc behind head','Feel deep stretch at bottom','Pull back to start using chest and lats'], tip:'Keep slight elbow bend — this is a stretch movement' },
  { name:'Decline Push-Up', cat:'strength', muscle:'chest', primary:'Lower Chest', secondary:'Triceps', equip:'Bodyweight', level:'intermediate', sets:3, reps:'12–15', rest:45, steps:['Feet elevated on bench or chair','Hands on floor shoulder-width','Lower chest toward floor','Press back explosively'], tip:'The angle shifts emphasis to lower pecs' },
  // ── Shoulders ──
  { name:'Lateral Raises', cat:'strength', muscle:'shoulders', primary:'Medial Deltoid', secondary:'Supraspinatus', equip:'Dumbbell', level:'beginner', sets:4, reps:'12–15', rest:60, steps:['DBs at sides, slight elbow bend','Raise arms to shoulder height','Lead with elbows not wrists','Lower slowly over 2–3 seconds'], tip:'Imagine pouring a glass of water at the top' },
  { name:'Overhead Press', cat:'strength', muscle:'shoulders', primary:'Deltoids', secondary:'Triceps, Upper Chest', equip:'Dumbbell', level:'intermediate', sets:3, reps:'8–10', rest:90, steps:['DBs at shoulder level, palms forward','Brace core, press straight overhead','Fully extend without flaring neck','Lower with control'], tip:'Keep chin slightly tucked to avoid neck strain' },
  { name:'Face Pulls', cat:'strength', muscle:'shoulders', primary:'Rear Deltoid', secondary:'Rotator Cuff', equip:'Machine', level:'beginner', sets:3, reps:'15–20', rest:45, steps:['Cable at eye height, rope attachment','Pull toward face, elbows high and wide','Externally rotate at end — hands behind ears','Slow controlled return'], tip:'Prioritise external rotation — this is shoulder health' },
  { name:'Arnold Press', cat:'strength', muscle:'shoulders', primary:'All Deltoid Heads', secondary:'Triceps', equip:'Dumbbell', level:'intermediate', sets:3, reps:'10–12', rest:75, steps:['Start with DBs at chin, palms facing you','Rotate palms outward as you press up','Reach full extension overhead','Reverse the rotation on the way down'], tip:'The rotation hits all three deltoid heads in one movement' },
  { name:'Upright Row', cat:'strength', muscle:'shoulders', primary:'Medial Deltoid, Traps', secondary:'Biceps', equip:'Barbell', level:'intermediate', sets:3, reps:'10–12', rest:60, steps:['Grip bar shoulder-width, overhand','Pull bar up along body to chin level','Elbows flare out and up above wrists','Lower slowly with control'], tip:'Keep the bar close to your body throughout' },
  { name:'Reverse Flyes', cat:'strength', muscle:'shoulders', primary:'Rear Deltoid', secondary:'Rhomboids', equip:'Dumbbell', level:'beginner', sets:3, reps:'15–20', rest:45, steps:['Hinge forward 45°, DBs hanging','Raise arms out to sides like wings','Squeeze rear delts at top','Lower under control — 3s eccentric'], tip:'Light weight, high reps — rear delts are small muscles' },
  // ── Arms ──
  { name:'Bicep Curls', cat:'strength', muscle:'arms', primary:'Biceps Brachii', secondary:'Brachialis', equip:'Dumbbell', level:'beginner', sets:3, reps:'10–14', rest:60, steps:['DBs at sides, palms forward','Curl with control, no torso swing','Squeeze bicep at top for 1s','Lower fully to complete extension'], tip:'Supinate the wrist as you curl for peak contraction' },
  { name:'Skull Crushers', cat:'strength', muscle:'arms', primary:'Triceps Long Head', secondary:'Anconeus', equip:'Barbell', level:'intermediate', sets:3, reps:'10–12', rest:60, steps:['Lie on bench, bar over chest','Lower bar toward forehead bending only elbows','Keep upper arms stationary','Press back to start'], tip:'Use lighter weight — long moment arm here' },
  { name:'Hammer Curls', cat:'strength', muscle:'arms', primary:'Brachialis', secondary:'Brachioradialis', equip:'Dumbbell', level:'beginner', sets:3, reps:'10–12', rest:60, steps:['DBs at sides, neutral grip','Curl keeping grip neutral throughout','Squeeze at top','Lower fully with control'], tip:'Don\'t rotate the wrist — neutral all the way through' },
  { name:'Tricep Pushdown', cat:'strength', muscle:'arms', primary:'Triceps', secondary:'Anconeus', equip:'Machine', level:'beginner', sets:3, reps:'12–15', rest:60, steps:['Stand at cable machine, rope at top','Elbows fixed at sides','Push rope down, flare hands at bottom','Slow return to 90° elbow angle'], tip:'Lock elbows in place — only forearms should move' },
  { name:'Preacher Curl', cat:'strength', muscle:'arms', primary:'Biceps Lower Head', secondary:'Brachialis', equip:'Machine', level:'intermediate', sets:3, reps:'10–12', rest:60, steps:['Seated at preacher bench, arms over pad','Lower to near full extension slowly','Curl up squeezing bicep hard','No momentum — full ROM every rep'], tip:'The pad prevents cheating — use it to your advantage' },
  { name:'Close-Grip Bench Press', cat:'strength', muscle:'arms', primary:'Triceps', secondary:'Chest', equip:'Barbell', level:'intermediate', sets:3, reps:'8–10', rest:75, steps:['Grip bar shoulder-width or slightly inside','Lower bar to lower chest','Elbows stay close to torso','Press explosively to lockout'], tip:'Elbows tucked in is key — flaring is a shoulder injury waiting to happen' },
  { name:'Concentration Curl', cat:'strength', muscle:'arms', primary:'Biceps Peak', secondary:'Brachialis', equip:'Dumbbell', level:'beginner', sets:3, reps:'12–15', rest:45, steps:['Seated, elbow on inner thigh','Curl the DB slowly to shoulder','Squeeze hard at top for 2s','Lower all the way, full extension'], tip:'Slow and controlled — this is an isolation movement' },
  // ── Back ──
  { name:'Pull-Ups', cat:'strength', muscle:'back', primary:'Latissimus Dorsi', secondary:'Biceps, Rear Deltoid', equip:'Bodyweight', level:'intermediate', sets:3, reps:'6–10', rest:90, steps:['Hang overhand, slightly wider than shoulders','Depress scapulae before pulling','Drive elbows down and back','Chin clears bar; fully extend at bottom'], tip:'Initiate by "bending the bar" — external rotation helps' },
  { name:'Barbell Row', cat:'strength', muscle:'back', primary:'Lats, Rhomboids', secondary:'Biceps, Rear Deltoid', equip:'Barbell', level:'intermediate', sets:4, reps:'8–10', rest:90, steps:['Hinge at hips, back at 45°, bar hanging','Row to lower sternum — lead with elbows','Squeeze shoulder blades at top','Lower under control; full extension at bottom'], tip:'Think "tuck elbows tight" — flaring loses lat engagement' },
  { name:'Deadlift', cat:'strength', muscle:'back', primary:'Erector Spinae', secondary:'Hamstrings, Glutes, Lats', equip:'Barbell', level:'intermediate', sets:3, reps:'5–8', rest:120, steps:['Bar over mid-foot, hip-width stance','Hinge at hips — chest up, neutral spine','Push the floor away, lock hips and shoulders','Lower with control; don\'t drop the weight'], tip:'Think "leg press the earth" not "pull the bar up"' },
  { name:'Lat Pulldown', cat:'strength', muscle:'back', primary:'Latissimus Dorsi', secondary:'Biceps', equip:'Machine', level:'beginner', sets:3, reps:'10–12', rest:75, steps:['Seated, wide overhand grip','Lean back 15°, pull bar to upper chest','Squeeze lats at bottom of pull','Control return to full arm extension'], tip:'Drive elbows into pockets — not "pull with hands"' },
  { name:'Seated Cable Row', cat:'strength', muscle:'back', primary:'Mid-Back, Rhomboids', secondary:'Biceps', equip:'Machine', level:'beginner', sets:3, reps:'10–12', rest:75, steps:['Seated, feet on platform, slight knee bend','Pull handle to lower abdomen','Elbows back, chest up, squeeze shoulder blades','Control return, let shoulder blades protract fully'], tip:'The full stretch at the front is as important as the squeeze at the back' },
  { name:'Single Arm DB Row', cat:'strength', muscle:'back', primary:'Lats, Rhomboids', secondary:'Biceps, Rear Delt', equip:'Dumbbell', level:'beginner', sets:3, reps:'10–12 each', rest:60, steps:['Place hand and knee on bench','DB hanging from free arm','Row elbow back and up, toward hip','Lower fully — full lat stretch at bottom'], tip:'Don\'t rotate the torso — keep hips square' },
  { name:'T-Bar Row', cat:'strength', muscle:'back', primary:'Mid-Back, Lats', secondary:'Biceps, Rear Delt', equip:'Barbell', level:'intermediate', sets:3, reps:'8–10', rest:90, steps:['Straddle loaded barbell end','Hinge forward 45°, grip close','Row to lower chest, elbows tight','Full extension at bottom every rep'], tip:'Great for mid-back thickness — use a V-handle for better range' },
  { name:'Inverted Row', cat:'strength', muscle:'back', primary:'Mid-Back, Rhomboids', secondary:'Biceps', equip:'Bodyweight', level:'beginner', sets:3, reps:'10–15', rest:60, steps:['Bar at hip height, hang underneath','Body straight from head to heels','Pull chest to bar, elbows out','Lower under control — straight body throughout'], tip:'Make it harder by raising feet; easier by bending knees' },
  // ── Legs ──
  { name:'Squat', cat:'strength', muscle:'legs', primary:'Quadriceps', secondary:'Glutes, Hamstrings', equip:'Barbell', level:'beginner', sets:4, reps:'6–10', rest:120, steps:['Bar on upper traps, feet shoulder-width','Brace core, hinge at hips and knees','Descend until thighs parallel or below','Drive through heels back to lockout'], tip:'Knees track over toes — don\'t let them cave inward' },
  { name:'Romanian Deadlift', cat:'strength', muscle:'legs', primary:'Hamstrings', secondary:'Glutes, Erectors', equip:'Barbell', level:'intermediate', sets:3, reps:'8–12', rest:90, steps:['Stand with bar at hip height, overhand grip','Push hips back, bar close to legs','Feel deep hamstring stretch at bottom','Drive hips forward to standing'], tip:'Soft bend at knees — this is a hinge, not a squat' },
  { name:'Leg Press', cat:'strength', muscle:'legs', primary:'Quadriceps', secondary:'Glutes, Hamstrings', equip:'Machine', level:'beginner', sets:3, reps:'10–15', rest:90, steps:['Feet shoulder-width at mid-plate','Lower platform to 90° knee angle','Press through heels explosively','Don\'t lock knees fully at top'], tip:'Foot placement changes emphasis — higher = more glute' },
  { name:'Bulgarian Split Squat', cat:'strength', muscle:'legs', primary:'Quadriceps, Glutes', secondary:'Hamstrings, Core', equip:'Dumbbell', level:'intermediate', sets:3, reps:'8–10 each', rest:90, steps:['Rear foot on bench, front foot far forward','Lower back knee toward floor','Keep torso upright, chest proud','Drive through front heel to rise'], tip:'This is the king of unilateral leg exercises — humbling weight is normal' },
  { name:'Leg Curl', cat:'strength', muscle:'legs', primary:'Hamstrings', secondary:'Gastrocnemius', equip:'Machine', level:'beginner', sets:3, reps:'12–15', rest:60, steps:['Lie face-down on machine, pads behind ankles','Curl heels toward glutes','Squeeze hamstrings hard at top','Lower slowly — 3s eccentric'], tip:'Point toes slightly to change hamstring head emphasis' },
  { name:'Hip Thrust', cat:'strength', muscle:'legs', primary:'Glutes', secondary:'Hamstrings, Core', equip:'Barbell', level:'intermediate', sets:4, reps:'10–15', rest:75, steps:['Upper back on bench, bar across hips','Feet flat, shoulder-width','Drive hips to full extension at top','Lower slowly, don\'t let hips touch floor between reps'], tip:'Squeeze glutes hard at lockout for 1s — you should feel it in your rear, not your lower back' },
  { name:'Walking Lunges', cat:'strength', muscle:'legs', primary:'Quadriceps, Glutes', secondary:'Hamstrings', equip:'Dumbbell', level:'beginner', sets:3, reps:'10–12 each', rest:75, steps:['DBs at sides, stand tall','Step forward, lower back knee near floor','Push off front foot, step through with other leg','Alternate for prescribed reps'], tip:'Long stride = more glute; short stride = more quad' },
  { name:'Goblet Squat', cat:'strength', muscle:'legs', primary:'Quadriceps', secondary:'Glutes, Core', equip:'Dumbbell', level:'beginner', sets:3, reps:'12–15', rest:60, steps:['Hold DB vertically at chest','Feet shoulder-width, toes out slightly','Squat deep, elbows track inside knees','Drive up through heels'], tip:'Great for learning squat depth — the weight acts as a counterbalance' },
  { name:'Calf Raises', cat:'strength', muscle:'legs', primary:'Gastrocnemius', secondary:'Soleus', equip:'Bodyweight', level:'beginner', sets:4, reps:'15–20', rest:30, steps:['Stand on edge of step, heels off','Lower heels below step level slowly','Rise onto balls of feet, full extension','Hold 1s at top, lower for 3s'], tip:'Full stretch at bottom is more important than the contraction at top' },
  { name:'Hack Squat', cat:'strength', muscle:'legs', primary:'Quadriceps', secondary:'Glutes', equip:'Machine', level:'intermediate', sets:3, reps:'10–12', rest:90, steps:['Shoulders under pads, feet on plate','Release safety, lower until 90° at knee','Drive through feet explosively','Don\'t lock out fully at top'], tip:'Feet low on the plate = more quad emphasis' },
  // ── Core ──
  { name:'Plank', cat:'strength', muscle:'core', primary:'Transverse Abdominis', secondary:'Rectus Abdominis, Glutes', equip:'Bodyweight', level:'beginner', sets:3, reps:'45–60s', rest:45, steps:['Forearms on floor, elbows under shoulders','Body in straight line head to heels','Squeeze glutes and brace abs hard','Breathe steadily — never hold breath'], tip:'Imagine someone about to punch your gut — that\'s your brace' },
  { name:'Leg Raises', cat:'strength', muscle:'core', primary:'Lower Abs', secondary:'Hip Flexors', equip:'Bodyweight', level:'intermediate', sets:3, reps:'12–15', rest:60, steps:['Lie flat, hands under lower back','Keep legs together and straight','Raise to 90°, lower slowly without floor contact','Control descent — no swinging'], tip:'Exhale on the way up — activates deep abs more effectively' },
  { name:'Cable Crunch', cat:'strength', muscle:'core', primary:'Rectus Abdominis', secondary:'Obliques', equip:'Machine', level:'beginner', sets:3, reps:'15–20', rest:45, steps:['Kneel facing cable, rope at head level','Flex spine — chin to chest, elbows toward knees','Crunch hard, squeeze abs at bottom','Return slowly, don\'t just let weight pull you back'], tip:'The movement is spinal flexion, not hip flexion — focus on crunching your ribs to your pelvis' },
  { name:'Russian Twists', cat:'strength', muscle:'core', primary:'Obliques', secondary:'Transverse Abdominis', equip:'Dumbbell', level:'beginner', sets:3, reps:'20 total', rest:45, steps:['Seated, lean back 45°, feet off floor','Hold DB or weight at chest','Rotate torso side to side','Each touch = one rep'], tip:'Slow it down — twisting fast with momentum does nothing' },
  { name:'Ab Wheel Rollout', cat:'strength', muscle:'core', primary:'Entire Core', secondary:'Lats, Shoulders', equip:'Bodyweight', level:'advanced', sets:3, reps:'8–12', rest:60, steps:['Kneel with wheel on floor','Roll forward slowly, back flat','Go as far as you can without back sagging','Pull back using abs — not arms'], tip:'This is one of the hardest core exercises — master the plank first' },
  { name:'Dead Bug', cat:'strength', muscle:'core', primary:'Transverse Abdominis', secondary:'Hip Flexors', equip:'Bodyweight', level:'beginner', sets:3, reps:'10 each side', rest:45, steps:['Lie on back, arms to ceiling, knees at 90°','Lower opposite arm and leg toward floor simultaneously','Lower back stays pressed into floor the whole time','Return and repeat other side'], tip:'If your lower back arches, you\'ve gone too far — shorten the range' },
  { name:'Side Plank', cat:'strength', muscle:'core', primary:'Obliques', secondary:'Glute Medius', equip:'Bodyweight', level:'beginner', sets:3, reps:'30–45s each', rest:30, steps:['Forearm on ground, body straight sideways','Stack feet or stagger for stability','Don\'t let hips sag','Hold and breathe steadily'], tip:'Top hand on hip for balance; raise it for extra challenge' },
  // ── Resistance Bands ──
  { name:'Band Pull-Apart', cat:'bands', muscle:'shoulders', primary:'Rear Deltoid', secondary:'Rhomboids', equip:'Band', level:'beginner', sets:3, reps:'15–20', rest:30, steps:['Hold band at chest height, arms extended','Pull band apart until arms outstretched','Squeeze shoulder blades at end range','Return with control — keep tension throughout'], tip:'Use light band — this is about volume and mind-muscle' },
  { name:'Banded Hip Thrust', cat:'bands', muscle:'legs', primary:'Glutes', secondary:'Hamstrings', equip:'Band', level:'beginner', sets:3, reps:'15–20', rest:45, steps:['Band across hips, upper back on bench','Feet flat, shoulder-width','Drive hips up, squeeze glutes at top','Lower slowly — full hip extension at top'], tip:'Push knees out against band to maximise glute activation' },
  { name:'Band Face Pull', cat:'bands', muscle:'shoulders', primary:'Rear Deltoid', secondary:'Rotator Cuff', equip:'Band', level:'beginner', sets:3, reps:'20', rest:30, steps:['Anchor band at eye level','Hold both ends, palms in','Pull toward face, elbows flaring high','Externally rotate at end — "double bicep" pose'], tip:'The #1 shoulder health exercise — do it daily' },
  { name:'Banded Row', cat:'bands', muscle:'back', primary:'Rhomboids', secondary:'Biceps', equip:'Band', level:'beginner', sets:3, reps:'12–15', rest:45, steps:['Anchor band at chest height, step back for tension','Hold ends with neutral grip','Row elbows behind torso, squeezing scapulae','Slow 3s return to full arm extension'], tip:'Anchor lower = more lat; anchor higher = more rhomboid' },
  { name:'Lateral Band Walk', cat:'bands', muscle:'legs', primary:'Glute Medius', secondary:'Abductors', equip:'Band', level:'beginner', sets:3, reps:'15 each', rest:30, steps:['Band around ankles or above knees, slight squat','Step sideways maintaining tension','Keep feet parallel — don\'t let toes turn out','Return same direction, complete the set'], tip:'Stay low — rising up kills glute activation' },
  { name:'Banded Bicep Curl', cat:'bands', muscle:'arms', primary:'Biceps', secondary:'Forearms', equip:'Band', level:'beginner', sets:3, reps:'15–20', rest:30, steps:['Stand on band, hold ends palms forward','Curl both arms simultaneously','Squeeze at top, fully extend at bottom','Control — don\'t let it snap back'], tip:'Step wider for more resistance, narrower for less' },
  // ── Yoga ──
  { name:'Downward Dog', cat:'yoga', muscle:'core', primary:'Hamstrings, Calves', secondary:'Shoulders, Spine', equip:'Bodyweight', level:'beginner', sets:1, reps:'5–8 breaths', rest:0, steps:['Start on hands and knees, wrists under shoulders','Tuck toes and lift hips to ceiling, inverted V','Press heels toward floor, straighten legs','Relax head between arms, breathe deeply'], tip:'Pedal the feet alternately to warm up the hamstrings' },
  { name:'Warrior I', cat:'yoga', muscle:'legs', primary:'Hip Flexors, Quads', secondary:'Core, Shoulders', equip:'Bodyweight', level:'beginner', sets:1, reps:'5 breaths each', rest:0, steps:['Step one foot forward into a lunge, back foot at 45°','Front knee over ankle — don\'t let it cave in','Raise arms overhead','Square hips forward, breathe into the stretch'], tip:'Micro-bend the back knee to protect the joint' },
  { name:'Pigeon Pose', cat:'yoga', muscle:'legs', primary:'Hip Flexors, Piriformis', secondary:'Glutes, IT Band', equip:'Bodyweight', level:'intermediate', sets:1, reps:'8–10 breaths', rest:0, steps:['From downward dog, bring one knee toward same-side wrist','Extend back leg straight behind you','Lower hips toward floor','Fold forward over front shin, breathe deeply'], tip:'Hips should be level — use a folded blanket if one side lifts' },
  { name:'Cat-Cow', cat:'yoga', muscle:'core', primary:'Erector Spinae', secondary:'Abdominals', equip:'Bodyweight', level:'beginner', sets:2, reps:'10 cycles', rest:0, steps:['On hands and knees, spine neutral','Inhale: drop belly, lift tailbone and chest (Cow)','Exhale: round spine to ceiling, tuck chin and pelvis (Cat)','Move fluidly with breath'], tip:'The gentlest, most therapeutic back exercise that exists' },
  { name:'Bridge Pose', cat:'yoga', muscle:'legs', primary:'Glutes', secondary:'Hamstrings, Core', equip:'Bodyweight', level:'beginner', sets:2, reps:'8–10 breaths', rest:0, steps:['Lie on back, knees bent, feet flat','Press feet into floor, lift hips to ceiling','Clasp hands beneath pelvis','Hold — breathe into chest and spine'], tip:'A softer alternative to hip thrust; great after leg day' },
  { name:"Child's Pose", cat:'yoga', muscle:'core', primary:'Lower Back', secondary:'Hips, Shoulders', equip:'Bodyweight', level:'beginner', sets:1, reps:'10–15 breaths', rest:0, steps:['Kneel, big toes touching, knees wide','Sit hips back onto heels, walk hands forward','Rest forehead on floor, arms long','Breathe into lower back — let it expand on each inhale'], tip:'The universal rest position — use it between hard sets too' },
  // ── Stretches ──
  { name:'Hip Flexor Stretch', cat:'stretch', muscle:'legs', primary:'Iliopsoas', secondary:'Rectus Femoris', equip:'Bodyweight', level:'beginner', sets:2, reps:'30–45s each', rest:0, steps:['Kneel on one knee in a lunge','Shift hips forward until stretch felt at front of back leg','Keep torso upright, core braced','Hold, breathe, deepen with each exhale'], tip:'Squeeze the glute of the kneeling leg — this increases the stretch' },
  { name:'Doorway Chest Stretch', cat:'stretch', muscle:'chest', primary:'Pectorals', secondary:'Anterior Deltoid', equip:'Bodyweight', level:'beginner', sets:2, reps:'30s each', rest:0, steps:['Stand in doorway, forearm against frame at 90°','Step through to open the chest','Rotate body away from the arm','Hold — vary height to hit different chest fibres'], tip:'Low angle = lower chest; high arm = upper chest' },
  { name:'Thoracic Rotation', cat:'stretch', muscle:'back', primary:'Thoracic Spine', secondary:'Lats, Obliques', equip:'Bodyweight', level:'beginner', sets:2, reps:'10 each side', rest:0, steps:['Sit cross-legged, spine tall','Place one hand behind head, elbow out','Rotate that elbow toward ceiling','Return slowly; no momentum'], tip:'Critical if you sit at a desk all day' },
  { name:'Seated Hamstring Stretch', cat:'stretch', muscle:'legs', primary:'Hamstrings', secondary:'Calves, Lower Back', equip:'Bodyweight', level:'beginner', sets:2, reps:'40s each', rest:0, steps:['Sit on floor, one leg extended straight','Flex foot of extended leg toward you','Hinge forward from the hip, reach toward foot','Hold at ankle, shin, or foot — wherever you can reach'], tip:'Flex the foot for a deeper stretch through the calf too' },
  { name:'Glute Figure-4 Stretch', cat:'stretch', muscle:'legs', primary:'Glutes, Piriformis', secondary:'Hip Rotators', equip:'Bodyweight', level:'beginner', sets:2, reps:'40s each', rest:0, steps:['Lie on back, knees bent','Cross one ankle over opposite knee (figure-4)','Grasp behind bottom thigh, pull both legs toward chest','Keep active foot flexed to protect the knee'], tip:'Push the knee of the crossed leg away with your elbow to deepen' },
  // ── Recovery ──
  { name:'Foam Roll — Quads', cat:'recovery', muscle:'legs', primary:'Quadriceps', secondary:'Hip Flexors', equip:'Bodyweight', level:'beginner', sets:1, reps:'60–90s each', rest:0, steps:['Lie face-down, roller under one quad','Support on forearms and opposite leg','Roll from just above knee to hip crease','Pause on tender spots for 10–20s'], tip:'Stack legs for more intensity; cross them for less' },
  { name:'Foam Roll — Lats', cat:'recovery', muscle:'back', primary:'Latissimus Dorsi', secondary:'Teres Major', equip:'Bodyweight', level:'beginner', sets:1, reps:'60s each', rest:0, steps:['Lie on side, roller under armpit area','Arm overhead, palm facing up','Roll slowly down side of back to hip','Rotate slightly forward/back to hit all fibres'], tip:'Unlocks overhead pressing after heavy pulling sessions' },
  { name:'Spiderman Lunge', cat:'recovery', muscle:'legs', primary:'Hip Flexors', secondary:'Thoracic Spine, Hamstrings', equip:'Bodyweight', level:'beginner', sets:2, reps:'5 each side', rest:30, steps:['Start in push-up position','Step one foot outside same-side hand','Drop hips, hold 2s','Add thoracic rotation: reach same-side arm to ceiling'], tip:'One of the best full-body warm-up movements that exists' },
  { name:'Diaphragmatic Breathing', cat:'recovery', muscle:'core', primary:'Diaphragm', secondary:'Parasympathetic NS', equip:'Bodyweight', level:'beginner', sets:1, reps:'5–10 min', rest:0, steps:['Lie on back, knees bent, hands on belly and chest','Inhale through nose 4 counts — belly rises, chest doesn\'t','Hold 1 count','Exhale through mouth for 6–8 counts'], tip:'Box breathing (4-4-4-4) activates the vagus nerve and reduces cortisol' },
  // ── Rehab / Low Intensity ──
  { name:'Wall Angels', cat:'rehab', muscle:'shoulders', primary:'Rotator Cuff', secondary:'Lower Traps, Serratus', equip:'Bodyweight', level:'beginner', sets:3, reps:'10', rest:30, steps:['Stand with back flat against wall','Arms at 90° like a goalpost, backs of hands on wall','Slide arms overhead, maintaining wall contact throughout','Return slowly'], tip:'If you can\'t keep contact with the wall, reduce range — this reveals shoulder mobility deficits' },
  { name:'Clamshells', cat:'rehab', muscle:'legs', primary:'Glute Medius', secondary:'Hip External Rotators', equip:'Bodyweight', level:'beginner', sets:3, reps:'15 each', rest:30, steps:['Lie on side, hips and knees bent to 90°','Keep feet together, rotate top knee toward ceiling','Stop when pelvis starts to move','Lower slowly'], tip:'Add a band above knees to increase resistance as you progress' },
  { name:'Terminal Knee Extension', cat:'rehab', muscle:'legs', primary:'VMO (Inner Quad)', secondary:'Knee Stabilisers', equip:'Band', level:'beginner', sets:3, reps:'15–20', rest:30, steps:['Band around back of knee, anchored in front','Stand with slight knee bend','Straighten knee against band resistance','Control return — don\'t snap into hyperextension'], tip:'Essential for knee rehabilitation and prevention — especially post ACL issues' },
  { name:'Bird Dog', cat:'rehab', muscle:'core', primary:'Erector Spinae', secondary:'Glutes, Core', equip:'Bodyweight', level:'beginner', sets:3, reps:'10 each side', rest:30, steps:['Start on hands and knees, spine neutral','Extend opposite arm and leg simultaneously','Keep hips level — don\'t rotate','Hold 2s, return with control'], tip:'Imagine balancing a glass of water on your lower back' },
  { name:'Prone Y-T-W', cat:'rehab', muscle:'shoulders', primary:'Lower Traps, Rhomboids', secondary:'Rotator Cuff', equip:'Bodyweight', level:'beginner', sets:3, reps:'10 each', rest:30, steps:['Lie face-down, arms in Y shape overhead','Raise arms slightly off ground, thumbs up','Hold 2s, lower — then repeat in T, then W shape','Each letter targets different back/shoulder muscles'], tip:'No weight needed — these are tiny muscles that need high-rep activation' },
  { name:'Glute Bridge', cat:'rehab', muscle:'legs', primary:'Glutes', secondary:'Hamstrings', equip:'Bodyweight', level:'beginner', sets:3, reps:'15–20', rest:45, steps:['Lie on back, knees bent, feet flat','Push through heels to lift hips','Squeeze glutes at top, hold 2s','Lower slowly — don\'t let hips touch floor between reps'], tip:'Great starting point before progressing to weighted hip thrusts' },

  // ════════════════════════════════════════════════════════════════════
  // ── ADVANCED STRENGTH — Chest ──
  { name:'Weighted Dips', cat:'strength', muscle:'chest', primary:'Lower Chest', secondary:'Triceps, Anterior Deltoid', equip:'Bodyweight', level:'advanced', sets:4, reps:'6–10', rest:120, steps:['Attach weight via belt or hold DB between legs','Grip parallel bars, slight forward lean for chest emphasis','Lower until upper arms are parallel — full depth','Press explosively through heels of palms to lockout'], tip:'Forward lean is non-negotiable — upright dips hit triceps, not chest' },
  { name:'Ring Push-Up', cat:'strength', muscle:'chest', primary:'Chest, Core', secondary:'Serratus, Triceps', equip:'Bodyweight', level:'advanced', sets:4, reps:'8–15', rest:90, steps:['Set rings low to the ground, hold with neutral grip','Lower chest between rings, allow rings to flare outward naturally','At bottom, actively pull rings apart — huge chest activation','Press back up, rings pronate at top'], tip:'The instability doubles the pec demand — every stabiliser fires' },
  { name:'Planche Lean Push-Up', cat:'strength', muscle:'chest', primary:'Chest, Anterior Deltoid', secondary:'Core, Triceps', equip:'Bodyweight', level:'advanced', sets:3, reps:'6–8', rest:120, steps:['In push-up position, shift bodyweight forward over hands','Hands angled outward slightly, fingers forward','Lower with extreme forward lean so chest goes past hands','Push back — maintaining the forward shift throughout'], tip:'This is a planche prerequisite — trains the brutal shoulder-chest line' },
  { name:'Deficit Push-Up', cat:'strength', muscle:'chest', primary:'Chest', secondary:'Triceps, Anterior Deltoid', equip:'Bodyweight', level:'advanced', sets:4, reps:'10–15', rest:75, steps:['Place hands on elevated surfaces — dumbbells, books, parallettes','Lower chest below hand level for greater ROM','Feel the deep pec stretch at bottom — pause 1s','Explode back to top'], tip:'Greater range of motion = greater muscle damage = more growth' },

  // ── ADVANCED STRENGTH — Back ──
  { name:'Weighted Pull-Up', cat:'strength', muscle:'back', primary:'Latissimus Dorsi', secondary:'Biceps, Rhomboids', equip:'Bodyweight', level:'advanced', sets:4, reps:'5–8', rest:120, steps:['Attach weight via belt, vest, or hold DB between legs','Dead hang, retract scapulae before initiating pull','Drive elbows to hips — chest to bar','Lower under control — full extension at bottom'], tip:'Add weight only when bodyweight pull-ups are genuinely easy — form first always' },
  { name:'Chest-to-Bar Pull-Up', cat:'strength', muscle:'back', primary:'Lats, Upper Back', secondary:'Biceps, Core', equip:'Bodyweight', level:'advanced', sets:4, reps:'5–8', rest:120, steps:['Wide overhand grip, dead hang','Explosive pull — aim to bring chest, not chin, to bar','Drive elbows back and down aggressively at top','Controlled descent, full hang between reps'], tip:'This is a gymnastic-level pull — requires exceptional lat strength and elbow drive' },
  { name:'Rack Pull', cat:'strength', muscle:'back', primary:'Erector Spinae, Upper Back', secondary:'Traps, Glutes', equip:'Barbell', level:'advanced', sets:4, reps:'4–6', rest:150, steps:['Set bar in rack at knee height','Conventional deadlift grip — overhand or mixed','Pull bar from pins to full hip lockout','Lower under control to pins — no dropping'], tip:'Allows heavier-than-deadlift loading — builds upper back and lockout strength' },
  { name:'Pendlay Row', cat:'strength', muscle:'back', primary:'Rhomboids, Lats', secondary:'Biceps, Rear Deltoid', equip:'Barbell', level:'advanced', sets:4, reps:'5–8', rest:120, steps:['Bar starts on the floor each rep — unlike Barbell Row','Hinge to nearly horizontal torso','Explosively row bar to lower sternum','Lower bar all the way to floor — dead stop every rep'], tip:'The dead stop kills momentum — every rep is honest' },
  { name:'Meadows Row', cat:'strength', muscle:'back', primary:'Lats, Teres Major', secondary:'Rear Deltoid, Biceps', equip:'Barbell', level:'advanced', sets:3, reps:'8–12 each', rest:90, steps:['Bar in corner of room or landmine attachment','Staggered stance beside bar, reach down with outside hand','Row bar to hip — extreme elbow flare backward','Massive lat stretch at bottom — full range only'], tip:'John Meadows invented this; it gives a lat stretch no cable row can match' },

  // ── ADVANCED STRENGTH — Shoulders ──
  { name:'Handstand Push-Up', cat:'strength', muscle:'shoulders', primary:'Anterior & Medial Deltoid', secondary:'Triceps, Upper Traps', equip:'Bodyweight', level:'advanced', sets:3, reps:'5–10', rest:120, steps:['Kick up to wall handstand, hands shoulder-width','Lower head toward floor — controlled, not fast','At bottom (head touches), press explosively to lockout','Keep core braced — no banana back'], tip:'Arguably the hardest pressing movement available — builds bulletproof shoulders' },
  { name:'Pike Push-Up', cat:'strength', muscle:'shoulders', primary:'Anterior Deltoid', secondary:'Triceps, Upper Traps', equip:'Bodyweight', level:'advanced', sets:4, reps:'10–15', rest:90, steps:['Inverted-V position — hips high, hands and feet on floor','Walk feet in to make the angle steeper','Lower crown of head toward floor','Press back to inverted-V — don\'t let hips drop'], tip:'The precursor to handstand push-ups — master this first' },
  { name:'Barbell Z-Press', cat:'strength', muscle:'shoulders', primary:'Deltoids', secondary:'Core, Triceps', equip:'Barbell', level:'advanced', sets:3, reps:'6–8', rest:120, steps:['Sit on floor with legs straight, no back support','Bar held at shoulder level in front rack position','Press straight overhead to full lockout','Lower under control — no hip lean'], tip:'No back to lean against = zero momentum = pure deltoid strength' },
  { name:'Behind-the-Neck Press', cat:'strength', muscle:'shoulders', primary:'Medial & Posterior Deltoid', secondary:'Traps, Triceps', equip:'Barbell', level:'advanced', sets:3, reps:'8–10', rest:90, steps:['Bar on upper traps, snatch-width grip','Press to full overhead lockout','Lower behind head to ears level — not lower','Strict form only — never use with shoulder issues'], tip:'Exceptional medial and rear delt builder — but demands excellent shoulder mobility' },

  // ── ADVANCED STRENGTH — Arms ──
  { name:'Barbell Drag Curl', cat:'strength', muscle:'arms', primary:'Biceps Long Head', secondary:'Brachialis', equip:'Barbell', level:'advanced', sets:3, reps:'8–12', rest:75, steps:['Stand with barbell, supinated grip','Instead of curling forward, drag bar up your torso — elbows go back','Keep bar in contact with body throughout the ascent','Lower dragging the bar back down the same path'], tip:'Elbows going backward shifts stress entirely to the long head — massive peak builder' },
  { name:'Incline DB Curl', cat:'strength', muscle:'arms', primary:'Biceps Long Head', secondary:'Brachialis', equip:'Dumbbell', level:'advanced', sets:3, reps:'10–12', rest:75, steps:['Sit on incline bench, arms hanging behind torso','Curl from full stretch — do not swing arms forward','Supinate hard at top, squeeze for 2s','Lower all the way — the stretch is the point'], tip:'The incline creates a stretch position no standing curl can replicate' },
  { name:'EZ-Bar Skull Crusher', cat:'strength', muscle:'arms', primary:'Triceps All Heads', secondary:'Anconeus', equip:'Barbell', level:'advanced', sets:4, reps:'8–10', rest:90, steps:['Lie on bench, EZ-bar held over face','Lower bar to forehead OR behind head for more stretch','Keep upper arms vertical throughout','Explode back to lockout — controlled, powerful'], tip:'Lower behind the head for greater long head stretch than to the forehead' },
  { name:'Reverse Curl', cat:'strength', muscle:'arms', primary:'Brachioradialis', secondary:'Biceps, Forearms', equip:'Barbell', level:'advanced', sets:3, reps:'10–12', rest:60, steps:['Overhand grip on bar — pronated, not supinated','Curl normally — wrists stay straight, don\'t break','Squeeze at top, lower fully','Control the eccentric — forearms burn here'], tip:'The single best forearm builder; most people never train brachioradialis' },
  { name:'Cable Overhead Tricep Extension', cat:'strength', muscle:'arms', primary:'Triceps Long Head', secondary:'Anconeus', equip:'Machine', level:'advanced', sets:3, reps:'12–15', rest:60, steps:['Face away from cable, rope held behind head','Elbows up beside ears — do not let them flare out','Extend arms forward and overhead to full lockout','Return slowly — feel the long head stretch'], tip:'Overhead position maximises long head stretch — the biggest tricep head' },

  // ── ADVANCED STRENGTH — Legs ──
  { name:'Front Squat', cat:'strength', muscle:'legs', primary:'Quadriceps', secondary:'Core, Upper Back', equip:'Barbell', level:'advanced', sets:4, reps:'5–8', rest:120, steps:['Bar rests on front deltoids, elbows forward and high','Grip with clean grip or cross-arm — elbows must stay up','Squat to full depth — torso stays upright the entire time','Drive elbows up as you rise to prevent bar drifting forward'], tip:'More upright torso than back squat = more quad, less lower back' },
  { name:'Pause Squat', cat:'strength', muscle:'legs', primary:'Quadriceps, Glutes', secondary:'Core', equip:'Barbell', level:'advanced', sets:4, reps:'4–6', rest:150, steps:['Set up as a normal back squat','Descend to full depth, pause for 3 seconds at the bottom','Completely eliminate the stretch reflex — no bouncing','Grind back up to lockout under raw strength'], tip:'Pausing at the bottom exposes every weakness in your squat — humbling weight is normal' },
  { name:'Sumo Deadlift', cat:'strength', muscle:'legs', primary:'Glutes, Adductors', secondary:'Hamstrings, Quads', equip:'Barbell', level:'advanced', sets:4, reps:'4–6', rest:150, steps:['Wide stance, toes flared out 45°+, hands inside legs','Hinge down, grip bar, chest proud','Push the floor out and away — hips and bar rise together','Lock out hips powerfully at top'], tip:'More adductor and glute demand than conventional; shorter ROM for most body types' },
  { name:'Pistol Squat', cat:'strength', muscle:'legs', primary:'Quadriceps, Glutes', secondary:'Hamstrings, Core, Balance', equip:'Bodyweight', level:'advanced', sets:3, reps:'5–8 each', rest:120, steps:['Stand on one leg, other leg extended forward','Slowly lower yourself on one leg — arms forward for balance','Go as low as possible — ideally hamstring to calf','Drive through heel to stand — use full control'], tip:'One of the most impressive feats of strength and mobility combined' },
  { name:'Nordic Hamstring Curl', cat:'strength', muscle:'legs', primary:'Hamstrings Eccentric', secondary:'Glutes, Core', equip:'Bodyweight', level:'advanced', sets:3, reps:'5–8', rest:120, steps:['Kneel, feet anchored under a bar or by a partner','Lean forward slowly, lowering torso to floor — only the hamstrings resist','Go as far as you can under control before catching yourself','Push back up with hands if needed, return under hamstring power'], tip:'Studies show this reduces hamstring injury risk by 50%+ — elite-level hamstring strengthener' },
  { name:'Single-Leg Romanian Deadlift', cat:'strength', muscle:'legs', primary:'Hamstrings, Glutes', secondary:'Core, Balance', equip:'Dumbbell', level:'advanced', sets:3, reps:'8–10 each', rest:90, steps:['Stand on one leg, DB in opposite hand or both hands','Hinge at hip, extend back leg behind you for counterbalance','Lower until DB reaches shin level — back flat throughout','Drive hip forward to return to standing'], tip:'Develops unilateral hamstring strength and hip stability simultaneously' },
  { name:'Hack Squat (Barbell)', cat:'strength', muscle:'legs', primary:'Quadriceps', secondary:'Glutes', equip:'Barbell', level:'advanced', sets:4, reps:'8–10', rest:90, steps:['Bar behind legs on the floor, narrow stance','Grip bar behind knees, squat down to pick it up','Stand up to lockout — bar drags up the back of the legs','Lower with control'], tip:'An old-school bodybuilding move that sculpts the teardrop quad' },

  // ── ADVANCED STRENGTH — Core ──
  { name:'Dragon Flag', cat:'strength', muscle:'core', primary:'Entire Anterior Chain', secondary:'Lats, Glutes', equip:'Bodyweight', level:'advanced', sets:3, reps:'5–8', rest:120, steps:['Lie on bench, grip edge behind head with both hands','Keep body rigid and straight, raise legs to vertical','Lower entire body slowly, hovering just above bench','Only shoulders remain in contact — hold position, then repeat'], tip:'Bruce Lee\'s signature core exercise — requires full-body tension and elite core strength' },
  { name:'Hollow Body Hold', cat:'strength', muscle:'core', primary:'Transverse Abdominis, Hip Flexors', secondary:'Lats, Glutes', equip:'Bodyweight', level:'advanced', sets:4, reps:'30–45s', rest:60, steps:['Lie on back, arms overhead, legs together','Press lower back hard into floor — it must not lift','Raise arms, shoulders, and legs off floor simultaneously','Hold — lower back stays down the entire time'], tip:'The foundation of all gymnastic core strength — harder than it looks' },
  { name:'L-Sit', cat:'strength', muscle:'core', primary:'Hip Flexors, Core', secondary:'Triceps, Lats', equip:'Bodyweight', level:'advanced', sets:4, reps:'10–30s', rest:90, steps:['Support on parallettes, dip bars, or push-up handles','Lift straight legs to parallel, toes pointed','Compress abs hard — legs must not sag','Hold the position with a rigid, compressed body'], tip:'Even 10s is impressive — build in 5-second increments' },
  { name:'Weighted Pallof Press', cat:'strength', muscle:'core', primary:'Anti-Rotation Core', secondary:'Obliques, Transverse Abdominis', equip:'Machine', level:'advanced', sets:3, reps:'12–15 each', rest:60, steps:['Stand perpendicular to cable machine, pull handle to chest','Press arms straight out in front of you','Hold 2s — resist the cable pulling you sideways','Return to chest slowly'], tip:'Anti-rotation work is what makes core strength transfer to real life and sport' },
  { name:'Hanging Windshield Wiper', cat:'strength', muscle:'core', primary:'Obliques, Hip Flexors', secondary:'Lats, Grip', equip:'Bodyweight', level:'advanced', sets:3, reps:'6–10', rest:90, steps:['Hang from bar, raise legs to horizontal','Rotate legs side to side like a windshield wiper','Keep upper body and bar position completely still','Control every degree of rotation — no swinging'], tip:'Combines incredible core rotation strength with grip and lat endurance' },

  // ── ADVANCED — Bands ──
  { name:'Banded Deadlift', cat:'bands', muscle:'back', primary:'Entire Posterior Chain', secondary:'Core', equip:'Band', level:'advanced', sets:4, reps:'5–6', rest:120, steps:['Loop bands around the bar and under your feet','Set up as a conventional deadlift','The band resistance increases as you rise — hardest at lockout','Control descent — bands pull bar down faster'], tip:'Accommodating resistance trains the lockout specifically — great for sticking points' },
  { name:'Banded Bench Press', cat:'bands', muscle:'chest', primary:'Chest', secondary:'Triceps, Anterior Deltoid', equip:'Band', level:'advanced', sets:4, reps:'5–6', rest:120, steps:['Loop bands around bar and under bench','Press as usual — peak resistance at lockout','Control descent with the bands pulling bar down','Teaches explosiveness through the full ROM'], tip:'Forces you to accelerate through the entire press — develops rate of force development' },
  { name:'Band Resisted Sprint', cat:'bands', muscle:'legs', primary:'Glutes, Hamstrings', secondary:'Core, Calves', equip:'Band', level:'advanced', sets:5, reps:'20m sprints', rest:90, steps:['Partner holds band looped around your waist from behind','Sprint forward against band resistance','Drive knees high, pump arms aggressively','Return to start, reset, repeat'], tip:'Develops explosive hip extension force that no gym exercise can replicate' },

  // ── ADVANCED — Yoga ──
  { name:'Crow Pose', cat:'yoga', muscle:'core', primary:'Core, Wrist Flexors', secondary:'Hip Flexors, Triceps', equip:'Bodyweight', level:'advanced', sets:1, reps:'3–5 holds of 10–30s', rest:30, steps:['Squat low, place palms flat on floor, shoulder-width','Place knees on backs of upper arms, just above elbows','Shift weight forward gradually until feet lift','Balance on hands — gaze forward, not down'], tip:'Look forward not down — eyes lead, balance follows' },
  { name:'Wheel Pose', cat:'yoga', muscle:'core', primary:'Spine, Hip Flexors', secondary:'Shoulders, Glutes, Wrists', equip:'Bodyweight', level:'advanced', sets:1, reps:'3 holds of 20–30s', rest:30, steps:['Lie on back, knees bent, feet close to hips','Place hands beside ears, fingers pointing toward feet','Press hands and feet into floor simultaneously','Extend arms and legs — lift body into full backbend'], tip:'Requires excellent shoulder mobility — never force this with tight shoulders' },
  { name:'Headstand', cat:'yoga', muscle:'shoulders', primary:'Upper Traps, Core, Balance', secondary:'Cervical Spine stabilisers', equip:'Bodyweight', level:'advanced', sets:1, reps:'30–90s hold', rest:60, steps:['Interlock fingers, place crown of head on mat inside hands','Walk feet in — hips over shoulders first','Slowly lift legs — pike then straighten','Hold rigidly: squeeze inner thighs, core braced'], tip:'Build up against a wall first — never take this straight to unsupported' },

  // ── ADVANCED — Recovery/Stretch ──
  { name:'Jefferson Curl', cat:'stretch', muscle:'back', primary:'Erector Spinae, Hamstrings', secondary:'Spinal Discs, Ligaments', equip:'Dumbbell', level:'advanced', sets:3, reps:'8–10', rest:60, steps:['Stand on elevated surface, DB in hands','Curl spine forward vertebra by vertebra — chin first','Let weight hang at bottom, fully flexed spine','Uncurl back to standing, again vertebra by vertebra'], tip:'One of the most misunderstood exercises — builds active spinal flexion strength. Start very light' },
  { name:'Loaded Progressive Stretch', cat:'stretch', muscle:'legs', primary:'Hip Flexors, Psoas', secondary:'Rectus Femoris', equip:'Dumbbell', level:'advanced', sets:3, reps:'3 cycles of 30s', rest:45, steps:['Deep lunge position, hold DB overhead for added stretch','Sink into hip flexor passively — no forcing','After 30s, contract hip flexors gently against gravity 5s','Relax into deeper stretch — PNF cycle'], tip:'PNF stretching produces the fastest flexibility gains of any method' },
];

// ─── Nutrition Data ─────────────────────────────────────────────────────────
const BASE_DRI = {
  calories:2200, protein:150, carbs:220, fat:70, fiber:30,
  sodium:2300, potassium:3500, calcium:1000, iron:18,
  vitaminA:900, vitaminB12:2.4, vitaminC:90, vitaminD:20, vitaminE:15,
  magnesium:400, zinc:11,
};
const NMETA = [
  { key:'protein',   label:'Protein',      unit:'g',   cat:'macro',   color:C.blue },
  { key:'carbs',     label:'Carbohydrates', unit:'g',   cat:'macro',   color:C.teal },
  { key:'fat',       label:'Fat',           unit:'g',   cat:'macro',   color:C.orange },
  { key:'fiber',     label:'Fiber',         unit:'g',   cat:'macro',   color:C.purple },
  { key:'sodium',    label:'Sodium',        unit:'mg',  cat:'mineral', color:'#94A3B8' },
  { key:'potassium', label:'Potassium',     unit:'mg',  cat:'mineral', color:C.pink },
  { key:'calcium',   label:'Calcium',       unit:'mg',  cat:'mineral', color:C.blue },
  { key:'iron',      label:'Iron',          unit:'mg',  cat:'mineral', color:C.orange },
  { key:'magnesium', label:'Magnesium',     unit:'mg',  cat:'mineral', color:'#93C5FD' },
  { key:'zinc',      label:'Zinc',          unit:'mg',  cat:'mineral', color:'#C4B5FD' },
  { key:'vitaminA',  label:'Vitamin A',     unit:'mcg', cat:'vitamin', color:'#FBBF24' },
  { key:'vitaminB12',label:'Vitamin B12',   unit:'mcg', cat:'vitamin', color:C.purple },
  { key:'vitaminC',  label:'Vitamin C',     unit:'mg',  cat:'vitamin', color:C.green },
  { key:'vitaminD',  label:'Vitamin D',     unit:'mcg', cat:'vitamin', color:'#FDE68A' },
  { key:'vitaminE',  label:'Vitamin E',     unit:'mg',  cat:'vitamin', color:'#6EE7B7' },
];
const DEF_MEALS = [
  { name:'Oats with milk & banana', calories:380, protein:12, carbs:65, fat:7, fiber:6, sodium:180, potassium:480, calcium:180, iron:3.2, vitaminA:40, vitaminB12:0.8, vitaminC:8, vitaminD:1.2, vitaminE:1.5, magnesium:55, zinc:1.8 },
  { name:'Whey protein shake', calories:150, protein:28, carbs:6, fat:2, fiber:1, sodium:140, potassium:320, calcium:200, iron:1.0, vitaminA:0, vitaminB12:1.2, vitaminC:0, vitaminD:2.0, vitaminE:0.5, magnesium:30, zinc:2.5 },
  { name:'Boiled eggs ×3', calories:210, protein:18, carbs:1, fat:15, fiber:0, sodium:210, potassium:200, calcium:75, iron:2.7, vitaminA:270, vitaminB12:1.8, vitaminC:0, vitaminD:3.0, vitaminE:1.5, magnesium:30, zinc:1.8 },
];
const DEF_LOGS = [
  { date:'Feb 7',  weight:74.2, bodyFat:18.5, chest:96,   waist:82,   arms:35,   legs:55,   notes:'' },
  { date:'Feb 14', weight:73.8, bodyFat:18.1, chest:96.5, waist:81,   arms:35.5, legs:55,   notes:'Feeling more energy' },
  { date:'Feb 21', weight:73.5, bodyFat:17.8, chest:97,   waist:80.5, arms:36,   legs:55.5, notes:'' },
  { date:'Feb 28', weight:73.1, bodyFat:17.4, chest:97,   waist:80,   arms:36,   legs:56,   notes:'Sleep getting better' },
  { date:'Mar 7',  weight:72.8, bodyFat:17.1, chest:97.5, waist:79,   arms:36.5, legs:56,   notes:'' },
  { date:'Mar 14', weight:72.5, bodyFat:16.8, chest:98,   waist:78.5, arms:37,   legs:56.5, notes:'PR on bench today 🔥' },
];

// ─── Claude API ─────────────────────────────────────────────────────────────
async function callClaude(sys, user) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system:sys, messages:[{role:'user',content:user}] }),
  });
  return (await r.json()).content[0].text;
}

// ─── Primitives ─────────────────────────────────────────────────────────────
const Card = ({ children, style:s={}, onClick }) => (
  <div onClick={onClick} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:16, padding:16, cursor:onClick?'pointer':'default', ...s }}>{children}</div>
);
const Tag = ({ label, active, color, onClick }) => (
  <button onClick={onClick} style={{
    background:active?(color||C.accent)+'22':`${C.s3}`, color:active?(color||C.accent):C.sub,
    border:`1px solid ${active?(color||C.accent)+'55':C.border}`,
    borderRadius:20, padding:'6px 14px', fontSize:11, fontFamily:fb,
    fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap',
  }}>{label}</button>
);
const Lbl = ({ text, style:s={} }) => (
  <div style={{ color:C.sub, fontSize:10, fontFamily:fb, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', ...s }}>{text}</div>
);
const Hd = ({ t, s: sub }) => (
  <div style={{ padding:'24px 20px 12px' }}>
    <div style={{ fontFamily:fn, fontSize:28, fontWeight:800, color:C.text, lineHeight:1.1, letterSpacing:'-0.02em' }}>{t}</div>
    {sub && <div style={{ color:C.sub, fontSize:13, marginTop:4, fontWeight:400 }}>{sub}</div>}
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
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:`0.5px solid ${C.border}` }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:12, color:C.sub }}>{label}</span>
          <span style={{ fontSize:11, color:bc, fontFamily:fb, fontWeight:700 }}>{ic} {disp}/{driDisp}{unit}</span>
        </div>
        <div style={{ height:3, background:C.s4, borderRadius:2 }}>
          <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:bc, borderRadius:2, transition:'width 0.4s ease' }} />
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
    setDone(p => p.includes(i) ? p.filter(x=>x!==i) : [...p,i]);
  };

  const allDone = done.length === (ex.sets || 0);
  const s = typeof ex.sets === 'number' ? ex.sets : 3;

  return (
    <div style={{ background:C.s2, border:`1px solid ${allDone?mc+'50':C.border}`, borderLeft:`3px solid ${mc}`, borderRadius:'2px 14px 14px 2px', marginBottom:10, overflow:'hidden', transition:'border-color 0.3s' }}>
      <div onClick={() => setOpen(o=>!o)} style={{ display:'flex', gap:12, padding:'14px 16px', cursor:'pointer', alignItems:'flex-start' }}>
        {/* Muscle thumbnail */}
        <div style={{ width:54, height:62, borderRadius:10, flexShrink:0, background:`linear-gradient(135deg,${mc}20,${mc}08)`, border:`1px solid ${mc}30`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontFamily:fn, fontSize:26, color:mc, lineHeight:1, letterSpacing:'0.02em' }}>{ex.muscle.slice(0,1).toUpperCase()}</div>
          <div style={{ fontSize:6, color:mc, fontFamily:fb, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.8, marginTop:2 }}>{ex.muscle}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:15, color:allDone?mc:C.text }}>{ex.name}</div>
          <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{ex.primary} · {ex.equip}</div>
          <div style={{ display:'flex', gap:10, marginTop:5, alignItems:'center' }}>
            <span style={{ fontFamily:fn, fontSize:20, color:mc, letterSpacing:'0.04em', lineHeight:1 }}>{ex.sets} × {ex.reps}</span>
            <span style={{ fontSize:10, color:C.muted, background:C.s3, padding:'2px 7px', borderRadius:4 }}>⏱ {ex.rest}s rest</span>
          </div>
          <div style={{ display:'flex', gap:5, marginTop:8 }}>
            {Array.from({length:s}).map((_,i)=>(
              <button key={i} onClick={e=>toggleSet(e,i)} style={{
                width:24, height:24, borderRadius:'50%',
                background:done.includes(i)?mc:'transparent',
                border:`1.5px solid ${done.includes(i)?mc:C.muted}`,
                cursor:'pointer', fontSize:9, color:done.includes(i)?'#000':C.muted,
                fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
              }}>{done.includes(i)?'✓':i+1}</button>
            ))}
          </div>
        </div>
        <div style={{ color:C.muted, fontSize:20, flexShrink:0, lineHeight:1, paddingTop:2 }}>{open?'−':'+'}</div>
      </div>

      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'14px 16px 16px' }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
            <span style={{ background:mc+'1A', color:mc, border:`1px solid ${mc}33`, fontSize:10, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 9px', borderRadius:4 }}>Primary: {ex.primary}</span>
            {ex.secondary && <span style={{ background:C.s3, color:C.sub, fontSize:10, fontFamily:fb, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 9px', borderRadius:4 }}>Also: {ex.secondary}</span>}
            <span style={{ background:C.s3, color:C.muted, fontSize:10, fontFamily:fb, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 9px', borderRadius:4 }}>{ex.level}</span>
          </div>

          <Lbl text="Form Guide" style={{marginBottom:10}} />
          {(ex.steps||[]).map((step,i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:C.s3, border:`1px solid ${mc}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:9, color:mc, fontFamily:fb, fontWeight:700 }}>{i+1}</div>
              <div style={{ fontSize:12.5, color:C.sub, lineHeight:1.55, flex:1 }}>{step}</div>
            </div>
          ))}
          {ex.tip && (
            <div style={{ marginTop:8, padding:'9px 12px', background:C.s3, borderRadius:10, fontSize:12, color:C.sub, lineHeight:1.5 }}>
              💡 {ex.tip}
            </div>
          )}

          <button onClick={startTimer} style={{
            width:'100%', marginTop:14, background:timer!==null?C.s3:mc+'18',
            border:`1px solid ${mc}44`, borderRadius:10, padding:'11px 14px',
            color:mc, fontFamily:fb, fontWeight:700, fontSize:12, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
            {timer !== null ? (
              <>
                <span>⏱ {timer}s remaining</span>
                <div style={{ flex:1, height:3, background:C.s4, borderRadius:2 }}>
                  <div style={{ height:'100%', width:`${Math.round((timer/ex.rest)*100)}%`, background:mc, borderRadius:2 }} />
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

  // Collect unique week-start timestamps that have at least one log
  const weekSet = new Set(parsed.map(d => getWeekStart(d.getTime())));
  const weeks = [...weekSet].sort((a, b) => b - a); // newest first

  const thisWeek = getWeekStart(Date.now());
  const lastWeek = thisWeek - 7 * 86400000;

  // Streak is alive only if user logged this week or last week
  if (weeks[0] < lastWeek) return 0;

  // Count consecutive weeks backwards
  let streak = 1;
  for (let i = 1; i < weeks.length; i++) {
    const gap = (weeks[i - 1] - weeks[i]) / (7 * 86400000);
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

// ─── Home Section ────────────────────────────────────────────────────────────
function HomeSection({ mealLog, progressLogs, dietGoal, onLogClick }) {
  const tot = mealLog.reduce((a,i) => ({ cal:a.cal+i.calories, p:a.p+i.protein, na:a.na+(i.sodium||0) }), {cal:0,p:0,na:0});
  const dri = { ...BASE_DRI, ...(dietGoal||{}) };
  const last = progressLogs[progressLogs.length-1];
  const prev = progressLogs[progressLogs.length-2];
  const wDiff = last&&prev ? (last.weight-prev.weight).toFixed(1) : null;

  const streak      = calcStreak(progressLogs);
  const weekDone    = getThisWeekActivity(progressLogs); // [Mon…Sun]
  const todayIdx    = getTodayDowIndex();                // Mon=0…Sun=6
  const DAY_LABELS  = ['M','T','W','T','F','S','S'];

  const insights = [
    tot.p < dri.protein*0.7 && { icon:'🥩', text:`You're at ${Math.round(tot.p)}g protein — need ${dri.protein}g today`, c:C.orange },
    tot.na > 2300 && { icon:'🧂', text:`High sodium today (${Math.round(tot.na)}mg) — watch salty foods`, c:C.red },
    tot.cal > dri.calories*1.1 && { icon:'⚠️', text:`You're ${Math.round(tot.cal-dri.calories)} kcal over today's goal`, c:C.red },
    streak > 0 ? { icon:'🔥', text:`${streak}-week check-in streak — momentum is everything!`, c:C.accent }
               : { icon:'📋', text:'No recent check-ins — log your progress to start a streak!', c:C.orange },
    last && wDiff && parseFloat(wDiff)<0 && { icon:'📉', text:`Down ${Math.abs(wDiff)}kg since last check-in — great progress!`, c:C.green },
  ].filter(Boolean);

  return (
    <div style={{ paddingBottom:8 }}>
      <div style={{ padding:'28px 20px 14px' }}>
        <div style={{ color:C.sub, fontSize:11, fontFamily:fb, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>
          {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
        </div>
        <div style={{ fontFamily:fn, fontSize:24, fontWeight:800, color:C.text, lineHeight:1.15, marginTop:6, letterSpacing:'-0.02em' }}>
          Good morning, <span style={{color:C.accent}}>Bhrigu</span> 👋
        </div>
      </div>

      {/* Smart Insights */}
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:7 }}>
        {insights.map((ins,i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'10px 14px', background:ins.c+'0D', border:`1px solid ${ins.c}28`, borderRadius:10, alignItems:'flex-start' }}>
            <span style={{fontSize:13,lineHeight:'20px'}}>{ins.icon}</span>
            <span style={{ fontSize:12.5, color:ins.c, lineHeight:1.45, fontWeight:500 }}>{ins.text}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ padding:'14px 16px 0', display:'flex', gap:10 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10, flex:'0 0 auto', width:90 }}>
          <Card style={{ background:C.accentD, border:'1px solid rgba(196,255,71,0.25)', textAlign:'center', padding:'14px 8px' }}>
            <div style={{ fontFamily:fn, fontSize:40, fontWeight:800, color:C.accent, lineHeight:1 }}>{streak}</div>
            <div style={{ color:C.accent, opacity:.7, fontSize:8, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>
              {streak === 1 ? 'Week' : 'Weeks'}
            </div>
            <div style={{ fontSize:18, marginTop:4 }}>{streak > 0 ? '🔥' : '💤'}</div>
          </Card>
          <button onClick={onLogClick} style={{
            background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, padding:'10px 6px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer',
          }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:C.accent+'18', border:`1.5px solid ${C.accent}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📊</div>
            <div style={{ fontSize:8, fontFamily:fb, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:C.accent, lineHeight:1.2, textAlign:'center' }}>Log<br/>Progress</div>
          </button>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
          <Card style={{ padding:'12px 14px' }}>
            <Lbl text="Calories Today" style={{marginBottom:4}} />
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{ fontFamily:fn, fontSize:28, fontWeight:800, color:C.text, lineHeight:1 }}>{Math.round(tot.cal)}</span>
              <span style={{ color:C.muted, fontSize:11 }}>/ {dri.calories} kcal</span>
            </div>
            <div style={{ height:4, background:C.s4, borderRadius:2, marginTop:7 }}>
              <div style={{ height:'100%', width:`${Math.min(Math.round((tot.cal/dri.calories)*100),100)}%`, background:tot.cal>dri.calories?C.red:C.accent, borderRadius:2 }} />
            </div>
          </Card>
          {last && (
            <Card style={{ padding:'12px 14px' }}>
              <Lbl text="Body Weight" style={{marginBottom:4}} />
              <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                <span style={{ fontFamily:fn, fontSize:28, fontWeight:800, color:C.text, lineHeight:1 }}>{last.weight}</span>
                <span style={{ color:C.muted, fontSize:11 }}>kg</span>
                {wDiff && <span style={{ color:parseFloat(wDiff)<0?C.green:C.orange, fontSize:11, fontFamily:fb, fontWeight:700 }}>{parseFloat(wDiff)<0?wDiff:'+'+wDiff}</span>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Macro mini */}
      <div style={{ padding:'10px 16px 0', display:'flex', gap:8 }}>
        {[{l:'Protein',v:Math.round(tot.p),max:dri.protein,c:C.blue},{l:'Carbs',v:Math.round(tot.cal/4*0.45),max:dri.carbs,c:C.teal},{l:'Fat',v:Math.round(tot.cal/9*0.3),max:dri.fat,c:C.orange}].map(m => (
          <Card key={m.l} style={{ flex:1, padding:'10px 12px' }}>
            <div style={{ color:m.c, fontSize:9, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{m.l}</div>
            <div style={{ fontFamily:fn, fontSize:18, fontWeight:700, color:C.text, lineHeight:1.3, marginTop:2 }}>{m.v}g</div>
            <div style={{ height:3, background:C.s4, borderRadius:2, marginTop:4 }}>
              <div style={{ height:'100%', width:`${Math.min(Math.round((m.v/m.max)*100),100)}%`, background:m.c, borderRadius:2 }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly dots — driven by real log data */}
      <div style={{ padding:'14px 16px 0' }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <Lbl text="This Week" />
            <span style={{ fontSize:10, color:C.muted }}>
              {weekDone.filter(Boolean).length}/7 days logged
            </span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            {DAY_LABELS.map((d,i) => {
              const logged = weekDone[i];
              const isToday = i === todayIdx;
              return (
                <div key={i} style={{ textAlign:'center' }}>
                  <div style={{
                    width:34, height:34, borderRadius:'50%',
                    background: logged ? C.accent : 'transparent',
                    border: isToday && !logged ? `2px solid ${C.accent}` : logged ? 'none' : `1px solid ${C.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 5px',
                    color: logged ? '#000' : isToday ? C.accent : C.muted,
                    fontSize: logged ? 13 : 11, fontWeight: 700,
                    boxShadow: isToday ? `0 0 0 3px ${C.accent}22` : 'none',
                  }}>{logged ? '✓' : d}</div>
                  <div style={{ color: isToday ? C.accent : C.muted, fontSize:9, fontFamily:fb, fontWeight:600, textTransform:'uppercase' }}>{d}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
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
  return (
    <div style={{ background:`linear-gradient(135deg,${C.s2},${C.s3})`, border:`1px solid ${C.accent}30`, borderLeft:`3px solid ${C.accent}`, borderRadius:'2px 14px 14px 2px', marginBottom:14, overflow:'hidden' }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer' }}>
        <div style={{ width:54, height:54, borderRadius:10, background:C.accent+'18', border:`1px solid ${C.accent}30`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:22 }}>🔥</span>
          <div style={{ fontSize:6, color:C.accent, fontFamily:fb, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>Warmup</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, color:C.accent }}>Full-Body Warmup Routine</div>
          <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>10 movements · 7–10 minutes · Do this before every session</div>
          <div style={{ display:'flex', gap:8, marginTop:5, flexWrap:'wrap' }}>
            {['Mobility','Activation','Temp Rise'].map(t => (
              <span key={t} style={{ fontSize:9, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', background:C.accent+'18', color:C.accent, padding:'2px 7px', borderRadius:4 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ color:open?C.accent:C.muted, fontSize:20, flexShrink:0 }}>{open?'−':'+'}</div>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'12px 16px 14px' }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:12, lineHeight:1.5 }}>
            Complete this routine in sequence without stopping. Rest 15–20s between movements if needed. Never skip warmup — cold muscles tear.
          </div>
          {WARMUP_ROUTINE.map((w,i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10, padding:'8px 10px', background:C.s4, borderRadius:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:C.accent+'20', border:`1px solid ${C.accent}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:10, fontWeight:800, color:C.accent }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{w.move}</div>
                <div style={{ fontSize:11, color:C.sub, marginTop:2, lineHeight:1.45 }}>{w.detail}</div>
              </div>
              <div style={{ fontSize:10, color:C.muted, background:C.s3, padding:'2px 8px', borderRadius:4, flexShrink:0, fontFamily:fb, fontWeight:600, whiteSpace:'nowrap' }}>{w.duration}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Week Plan Structures ─────────────────────────────────────────────────────
const WEEK_STRUCTURES = {
  3: [
    { day:'Day 1', focus:'Full Body A', muscles:['chest','back','legs','core'] },
    { day:'Day 2', focus:'Full Body B', muscles:['shoulders','back','legs','arms'] },
    { day:'Day 3', focus:'Full Body C', muscles:['chest','shoulders','legs','core'] },
  ],
  4: [
    { day:'Day 1', focus:'Upper Body A  — Push', muscles:['chest','shoulders','arms'] },
    { day:'Day 2', focus:'Lower Body A  — Quad Focus', muscles:['legs','core'] },
    { day:'Day 3', focus:'Upper Body B  — Pull', muscles:['back','shoulders','arms'] },
    { day:'Day 4', focus:'Lower Body B  — Posterior Chain', muscles:['legs','core'] },
  ],
  5: [
    { day:'Day 1', focus:'Push — Chest & Shoulders', muscles:['chest','shoulders','arms'] },
    { day:'Day 2', focus:'Pull — Back & Biceps', muscles:['back','arms'] },
    { day:'Day 3', focus:'Legs — Quad & Glute Focus', muscles:['legs'] },
    { day:'Day 4', focus:'Push — Shoulders & Triceps', muscles:['shoulders','arms','chest'] },
    { day:'Day 5', focus:'Pull + Core', muscles:['back','core'] },
  ],
  6: [
    { day:'Day 1', focus:'Push A — Chest & Ant. Delt', muscles:['chest','shoulders','arms'] },
    { day:'Day 2', focus:'Pull A — Lats & Rhomboids', muscles:['back','arms'] },
    { day:'Day 3', focus:'Legs A — Squat & Quad', muscles:['legs','core'] },
    { day:'Day 4', focus:'Push B — Shoulders & Triceps', muscles:['shoulders','chest','arms'] },
    { day:'Day 5', focus:'Pull B — Deadlift & Rear Delt', muscles:['back','arms'] },
    { day:'Day 6', focus:'Legs B — Hinge & Glute', muscles:['legs','core'] },
  ],
};

// ─── Workout Section ─────────────────────────────────────────────────────────
function WorkoutSection({ weekPlan, setWeekPlan }) {
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

  const resetWizard = () => {
    setWStep(0); setDays(null); setGoal(''); setLevel(''); setEquip('');
    setInjury(null); setInjuryArea(''); setInjuryTyping(false);
    setActiveDay(0);
    // Note: weekPlan is NOT cleared here — use Settings > Reset Workout Plan
  };

  // Build fallback plan from local EX database
  const buildFallbackPlan = (daysN, goalV, levelV, equipV, injuryV) => {
    const struct = WEEK_STRUCTURES[daysN] || WEEK_STRUCTURES[4];
    return struct.map(d => {
      let pool = EX.filter(e => e.cat === 'strength' && d.muscles.includes(e.muscle));
      if (injuryV) pool = pool.filter(e => e.level === 'beginner');
      if (equipV === 'bodyweight') pool = pool.filter(e => e.equip === 'Bodyweight');
      else if (equipV === 'dumbbell') pool = pool.filter(e => ['Dumbbell','Bodyweight'].includes(e.equip));
      else if (equipV === 'barbell') pool = pool.filter(e => ['Barbell','Dumbbell','Bodyweight'].includes(e.equip));
      const exercises = pool.slice(0, 5);
      return { day: d.day, focus: d.focus, duration: goalV === 'fat loss' ? '40–50 min' : '50–60 min', exercises };
    });
  };

  const generatePlan = async () => {
    setLoading(true); setWeekPlan(null);
    const hasInjury = injury && injuryArea;
    const injuryNote = hasInjury ? `User has an injury: ${injuryArea}. Avoid exercises that stress this area. Prefer low-intensity and rehab movements.` : '';
    const struct = WEEK_STRUCTURES[days] || WEEK_STRUCTURES[4];
    const dayList = struct.map(d => `${d.day}: ${d.focus}`).join(', ');

    try {
      const sys = `You are an expert personal trainer. Return ONLY valid JSON, no markdown. Schema: {"week_plan":[{"day":"string","focus":"string","duration":"string","exercises":[{"name":"string","muscle":"string","primary":"string","secondary":"string","equip":"string","level":"string","sets":number,"reps":"string","rest":number,"steps":["string"],"tip":"string"}]}]}`;
      const prompt = `Create a ${days}-day per week ${goal} workout plan for a ${level} trainee using ${equip} equipment. Weekly structure: ${dayList}. Each day should have 5 exercises. ${injuryNote} Return full JSON.`;
      const text = await callClaude(sys, prompt);
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      setWeekPlan(parsed.week_plan);
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
      <div style={{ fontFamily:fn, fontSize:20, fontWeight:800, color:C.text, letterSpacing:'-0.02em', marginBottom:6 }}>Any injuries or limitations?</div>
      <div style={{ fontSize:13, color:C.sub, marginBottom:20, lineHeight:1.5 }}>We'll adjust intensity and substitute exercises to protect you.</div>
      {injury === null && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { label:'No injuries', sub:'I can train freely', val:false, icon:'✅' },
            { label:'Yes, I have an injury', sub:'Tell us what area to protect', val:true, icon:'🩺' },
          ].map(opt => (
            <button key={String(opt.val)} onClick={()=>{ if(opt.val) setInjuryTyping(true); else { setInjury(false); generatePlan(); } }} style={{
              display:'flex', alignItems:'center', gap:14, padding:'16px 18px',
              background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, cursor:'pointer', textAlign:'left',
            }}>
              <span style={{fontSize:24}}>{opt.icon}</span>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{opt.label}</div>
                <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {injuryTyping && (
        <div>
          <div style={{ fontSize:13, color:C.sub, marginBottom:10 }}>Describe the injury / area to avoid (e.g. "left knee", "lower back", "right shoulder rotator cuff"):</div>
          <textarea value={injuryArea} onChange={e=>setInjuryArea(e.target.value)} rows={3} placeholder="e.g. Lower back disc issue, avoid heavy deadlifts and squats..."
            style={{ width:'100%', boxSizing:'border-box', background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', color:C.text, fontSize:13, fontFamily:fn, outline:'none', resize:'none', marginBottom:14 }} />
          <button onClick={()=>{ setInjury(injuryArea||'general'); generatePlan(); }} disabled={!injuryArea.trim()} style={{
            width:'100%', background:injuryArea.trim()?C.accent:C.s4, color:injuryArea.trim()?'#000':C.muted,
            border:'none', borderRadius:12, padding:14, fontFamily:fn, fontWeight:700, fontSize:13, cursor:injuryArea.trim()?'pointer':'not-allowed',
          }}>Build Injury-Safe Plan →</button>
        </div>
      )}
    </div>
  );

  // ── Main render ──
  return (
    <div>
      <Hd t="Workout" s="Week Plan · Library · Execute" />
      <div style={{ padding:'0 16px', display:'flex', gap:6, marginBottom:16 }}>
        {[['plan','Week Plan'],['library','Exercise Library']].map(([k,l]) => (
          <button key={k} onClick={()=>setView(k)} style={{
            flex:1, padding:'10px', background:view===k?C.accent:C.s2,
            border:`1px solid ${view===k?C.accent:C.border}`, borderRadius:10,
            color:view===k?'#000':C.sub, fontFamily:fn, fontWeight:700, fontSize:11,
            letterSpacing:'0.04em', textTransform:'uppercase', cursor:'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* ── PLAN TAB ── */}
      {view === 'plan' && (
        <div style={{ padding:'0 16px' }}>

          {/* Wizard — before plan is generated */}
          {!weekPlan && !loading && (
            <div>
              {/* Progress bar */}
              <div style={{ display:'flex', gap:4, marginBottom:20 }}>
                {Array.from({length:totalWizardSteps}).map((_,i) => (
                  <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < wStep ? C.accent : i === wStep ? C.accent+'60' : C.s4, transition:'background 0.3s' }} />
                ))}
              </div>

              {wStep < wizardSteps.length ? (
                <>
                  <div style={{ fontFamily:fn, fontSize:20, fontWeight:800, color:C.text, letterSpacing:'-0.02em', marginBottom:6 }}>{curStep.q}</div>
                  <div style={{ fontSize:13, color:C.sub, marginBottom:20, lineHeight:1.5 }}>{curStep.sub}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {curStep.opts.map(opt => {
                      const isActive = (curStep.field==='days'&&days===opt.val)||(curStep.field==='goal'&&goal===opt.val)||(curStep.field==='level'&&level===opt.val)||(curStep.field==='equip'&&equip===opt.val);
                      return (
                        <button key={String(opt.val)} onClick={()=>{
                          if(curStep.field==='days') setDays(opt.val);
                          if(curStep.field==='goal') setGoal(opt.val);
                          if(curStep.field==='level') setLevel(opt.val);
                          if(curStep.field==='equip') setEquip(opt.val);
                          setWStep(s=>s+1);
                        }} style={{
                          display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px',
                          background: isActive ? C.accent+'18' : C.s2,
                          border:`1px solid ${isActive ? C.accent : C.border}`, borderRadius:14, cursor:'pointer', textAlign:'left',
                        }}>
                          <div>
                            <div style={{ fontSize:14, fontWeight:700, color: isActive ? C.accent : C.text }}>{opt.label}</div>
                            <div style={{ fontSize:11, color:C.sub, marginTop:3 }}>{opt.sub}</div>
                          </div>
                          {isActive && <div style={{ color:C.accent, fontSize:16 }}>✓</div>}
                        </button>
                      );
                    })}
                  </div>
                  {wStep > 0 && (
                    <button onClick={()=>setWStep(s=>s-1)} style={{ width:'100%', marginTop:14, padding:'11px', background:'none', border:`1px solid ${C.border}`, borderRadius:10, color:C.muted, fontFamily:fn, fontWeight:600, fontSize:12, cursor:'pointer' }}>← Back</button>
                  )}
                </>
              ) : renderInjuryStep()}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:36, marginBottom:16 }}>⚡</div>
              <div style={{ fontFamily:fn, fontWeight:800, fontSize:18, color:C.accent, marginBottom:8 }}>Building Your {days}-Day Plan</div>
              <div style={{ color:C.sub, fontSize:13, lineHeight:1.5 }}>AI is designing your personalised week…{injury ? ' accounting for your injury' : ''}</div>
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:20 }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:C.accent, opacity:0.4+(i*0.3), animation:'none' }} />
                ))}
              </div>
            </div>
          )}

          {/* Week plan rendered */}
          {weekPlan && !loading && (
            <>
              {/* Plan header */}
              <div style={{ marginBottom:14 }}>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontFamily:fn, fontWeight:800, fontSize:18, color:C.text, letterSpacing:'-0.02em' }}>{days}-Day {goal.charAt(0).toUpperCase()+goal.slice(1)} Plan</div>
                  <div style={{ fontSize:12, color:C.sub, marginTop:3 }}>
                    {level} · {equip}{injury ? ` · 🩺 Injury-safe (${typeof injury === 'string' ? injury.slice(0,30) : 'adjusted'})` : ''}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>To change this plan, go to ⚙️ Settings → Reset Workout Plan</div>
                </div>

                {/* Day tabs */}
                <div style={{ display:'flex', gap:5, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4 }}>
                  {weekPlan.map((d,i) => (
                    <button key={i} onClick={()=>setActiveDay(i)} style={{
                      flexShrink:0, padding:'7px 12px',
                      background: activeDay===i ? C.accent : C.s2,
                      border:`1px solid ${activeDay===i ? C.accent : C.border}`, borderRadius:8,
                      color: activeDay===i ? '#000' : C.sub,
                      fontFamily:fn, fontWeight:700, fontSize:10, cursor:'pointer', whiteSpace:'nowrap',
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
                    <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, padding:'12px 16px', marginBottom:14 }}>
                      <div style={{ fontFamily:fn, fontWeight:800, fontSize:16, color:C.text, letterSpacing:'-0.01em' }}>{d.focus || d.day}</div>
                      <div style={{ display:'flex', gap:10, marginTop:6 }}>
                        <span style={{ fontSize:10, color:C.sub, background:C.s3, padding:'2px 8px', borderRadius:4 }}>⏱ {d.duration || '50–60 min'}</span>
                        <span style={{ fontSize:10, color:C.sub, background:C.s3, padding:'2px 8px', borderRadius:4 }}>💪 {(d.exercises||[]).length} exercises</span>
                        {injury && <span style={{ fontSize:10, color:C.orange, background:C.orange+'18', padding:'2px 8px', borderRadius:4 }}>🩺 Low impact</span>}
                      </div>
                    </div>

                    {/* Single warmup block */}
                    <WarmupBlock />

                    {/* Exercises */}
                    {(d.exercises||[]).map((ex,i) => <ExCard key={i} ex={ex} />)}

                    {/* Day nav */}
                    <div style={{ display:'flex', gap:8, marginTop:6, marginBottom:20 }}>
                      {activeDay > 0 && (
                        <button onClick={()=>setActiveDay(a=>a-1)} style={{ flex:1, padding:12, background:C.s2, border:`1px solid ${C.border}`, borderRadius:10, color:C.sub, fontFamily:fn, fontWeight:600, fontSize:12, cursor:'pointer' }}>← Prev Day</button>
                      )}
                      {activeDay < weekPlan.length-1 && (
                        <button onClick={()=>setActiveDay(a=>a+1)} style={{ flex:1, padding:12, background:C.accent+'18', border:`1px solid ${C.accent}44`, borderRadius:10, color:C.accent, fontFamily:fn, fontWeight:700, fontSize:12, cursor:'pointer' }}>Next Day →</button>
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
        <div style={{ padding:'0 16px' }}>
          {(() => {
            const CATS = [
              { key:'strength', label:'💪 Strength', color:C.blue },
              { key:'bands',    label:'🔴 Bands',    color:C.orange },
              { key:'yoga',     label:'🧘 Yoga',     color:C.purple },
              { key:'stretch',  label:'🤸 Stretch',  color:C.teal },
              { key:'recovery', label:'🛁 Recovery', color:C.green },
              { key:'rehab',    label:'🩺 Rehab',    color:C.red },
            ];
            const catColor = CATS.find(c=>c.key===libCat)?.color || C.accent;
            const catExs = EX.filter(e => e.cat === libCat && (filter==='all' || e.level===filter));
            const muscles = ['all',...new Set(EX.filter(e=>e.cat===libCat).map(e=>e.muscle))];
            return (
              <>
                <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:6, marginBottom:12, scrollbarWidth:'none' }}>
                  {CATS.map(c => (
                    <button key={c.key} onClick={()=>{ setLibCat(c.key); setLibMuscle('all'); setFilter('all'); }} style={{
                      background:libCat===c.key?c.color+'22':'transparent',
                      border:`1px solid ${libCat===c.key?c.color:C.border}`,
                      borderRadius:10, padding:'8px 14px', color:libCat===c.key?c.color:C.sub,
                      fontFamily:fn, fontWeight:700, fontSize:11, textTransform:'uppercase',
                      letterSpacing:'0.04em', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                    }}>{c.label} <span style={{opacity:0.5}}>({EX.filter(e=>e.cat===c.key).length})</span></button>
                  ))}
                </div>
                {libCat === 'strength' && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                    {muscles.map(m => (
                      <button key={m} onClick={()=>setLibMuscle(m)} style={{
                        background:libMuscle===m?MC[m]||catColor+'20':'transparent',
                        border:`1px solid ${libMuscle===m?MC[m]||catColor:C.border}`,
                        borderRadius:7, padding:'5px 11px', color:libMuscle===m?MC[m]||catColor:C.sub,
                        fontFamily:fn, fontWeight:700, fontSize:10, textTransform:'capitalize', letterSpacing:'0.04em', cursor:'pointer',
                      }}>{m === 'all' ? 'All' : m.charAt(0).toUpperCase()+m.slice(1)}</button>
                    ))}
                  </div>
                )}
                <div style={{ display:'flex', gap:5, marginBottom:12 }}>
                  {['all','beginner','intermediate','advanced'].map(f => (
                    <button key={f} onClick={()=>setFilter(f)} style={{
                      background:filter===f?C.s4:'transparent', color:filter===f?C.text:C.muted,
                      border:`1px solid ${filter===f?C.border:'transparent'}`,
                      borderRadius:7, padding:'4px 10px', fontSize:10, fontFamily:fn, fontWeight:600, textTransform:'capitalize', cursor:'pointer', letterSpacing:'0.04em',
                    }}>{f}</button>
                  ))}
                </div>
                {catExs.length === 0
                  ? <div style={{ color:C.muted, fontSize:13, textAlign:'center', padding:24 }}>No exercises match</div>
                  : (libCat==='strength' && libMuscle!=='all' ? catExs.filter(e=>e.muscle===libMuscle) : catExs).map((ex,i) => <ExCard key={i} ex={ex} />)
                }
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
    { label:'Macros', keys:['protein','carbs','fat','fiber'] },
    { label:'Minerals', keys:['sodium','potassium','calcium','iron','magnesium','zinc'] },
    { label:'Vitamins', keys:['vitaminA','vitaminB12','vitaminC','vitaminD','vitaminE'] },
  ];
  return (
    <div style={{ background:C.s2, border:`1px solid ${open?C.accent+'44':C.border}`, borderRadius:14, marginBottom:10, overflow:'hidden', transition:'border-color 0.25s' }}>
      {/* Header row — always visible */}
      <div onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 14px', cursor:'pointer' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>
            P <span style={{color:C.blue}}>{item.protein}g</span> · C <span style={{color:C.teal}}>{item.carbs}g</span> · F <span style={{color:C.orange}}>{item.fat}g</span> · Fiber <span style={{color:C.purple}}>{item.fiber||0}g</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ fontFamily:fn, fontSize:28, color:C.accent, letterSpacing:'0.04em', lineHeight:1 }}>{item.calories}</div>
          <div style={{ color:open?C.accent:C.muted, fontSize:16, fontWeight:300, lineHeight:1, transition:'color 0.2s' }}>{open?'−':'+'}</div>
        </div>
      </div>

      {/* Expanded: full nutrient breakdown */}
      {open && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'12px 14px 14px' }}>
          {cats.map(cat => (
            <div key={cat.label} style={{ marginBottom:12 }}>
              <Lbl text={cat.label} style={{ marginBottom:8 }} />
              {cat.keys.map(k => {
                const meta = NMETA.find(n=>n.key===k);
                if (!meta) return null;
                const dri = BASE_DRI[k]||1;
                const val = item[k]||0;
                const pct = Math.min((val/dri)*100,130);
                const status = pct<70?'deficit':pct>110?'excess':'ok';
                const bc = status==='ok'?C.green:status==='excess'?C.red:C.blue;
                const ic = status==='ok'?'✓':status==='excess'?'↑':'↓';
                const disp = meta.unit==='mcg'?val.toFixed(1):meta.unit==='g'?val.toFixed(1):Math.round(val);
                return (
                  <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:meta.color, flexShrink:0 }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:11.5, color:C.sub }}>{meta.label}</span>
                        <span style={{ fontSize:10.5, color:bc, fontFamily:fb, fontWeight:700 }}>{ic} {disp}/{dri}{meta.unit}</span>
                      </div>
                      <div style={{ height:2.5, background:C.s4, borderRadius:2 }}>
                        <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:bc, borderRadius:2, transition:'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <button onClick={onDelete} style={{ marginTop:4, width:'100%', padding:'9px', background:'transparent', border:`1px solid ${C.red}33`, borderRadius:9, color:C.red, fontFamily:fb, fontWeight:700, fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
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
  const [ans, setAns] = useState({ goal:'', speed:'', activity:'', diet:'', cw:'', tw:'' });

  const allSteps = [
    { q:"What's your primary goal?", field:'goal', opts:['Lose Weight','Gain Weight','Maintain'] },
    { q:'At what pace?', field:'speed', opts:['Slow (±250 kcal)','Moderate (±500 kcal)','Aggressive (±750 kcal)'], skip: ans.goal==='Maintain' },
    { q:'How active are you?', field:'activity', opts:['Sedentary','Lightly Active','Moderately Active','Very Active'] },
    { q:'Diet preference?', field:'diet', opts:['Non-Vegetarian','Vegetarian','Vegan','Flexible'] },
  ];
  const steps = allSteps.filter(s => !s.skip);
  const total = steps.length + 1;
  const cur = steps[step];

  const next = (val) => {
    if (cur) setAns(a => ({...a,[cur.field]:val}));
    setStep(s=>s+1);
  };

  const finish = () => {
    const w = parseFloat(ans.cw)||75;
    const mult = {Sedentary:30,'Lightly Active':33,'Moderately Active':36,'Very Active':40}[ans.activity]||33;
    const tdee = Math.round(w*mult);
    const speedAdj = {'Slow (±250 kcal)':250,'Moderate (±500 kcal)':500,'Aggressive (±750 kcal)':750}[ans.speed]||0;
    const cal = ans.goal==='Lose Weight'?tdee-speedAdj:ans.goal==='Gain Weight'?tdee+speedAdj:tdee;
    const protein = Math.round(ans.goal==='Gain Weight'?w*2.2:ans.goal==='Lose Weight'?w*2.0:w*1.8);
    const fat = Math.round(w*0.8);
    const carbs = Math.max(50, Math.round((cal-protein*4-fat*9)/4));
    onComplete({ ...ans, calories:cal, protein, carbs, fat, currentWeight:w, targetWeight:parseFloat(ans.tw)||w });
  };

  return (
    <div style={{ padding:24, minHeight:'100%' }}>
      <div style={{ fontFamily:fn, fontSize:34, color:C.text, letterSpacing:'0.05em', marginBottom:6 }}>PERSONALIZE</div>
      <div style={{ color:C.sub, fontSize:13, marginBottom:24 }}>Set up your nutrition profile in {total} steps</div>
      <div style={{ display:'flex', gap:4, marginBottom:28 }}>
        {Array.from({length:total}).map((_,i) => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<step||step>=total?C.accent:i===step?C.accent+'60':C.s3, transition:'background 0.3s' }} />
        ))}
      </div>

      {cur ? (
        <>
          <div style={{ fontFamily:fn, fontSize:22, color:C.text, letterSpacing:'0.04em', marginBottom:20, lineHeight:1.2 }}>{cur.q}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {cur.opts.map(opt => (
              <button key={opt} onClick={()=>next(opt)} style={{
                background:C.s2, border:`1px solid ${ans[cur.field]===opt?C.accent:C.border}`,
                borderRadius:12, padding:'15px 18px', textAlign:'left', cursor:'pointer',
                color:ans[cur.field]===opt?C.accent:C.text, fontSize:15, fontWeight:500,
                fontFamily:'Barlow,sans-serif',
              }}>{opt}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontFamily:fn, fontSize:22, color:C.text, letterSpacing:'0.04em', marginBottom:20 }}>YOUR WEIGHT DETAILS</div>
          {[{l:'Current Weight (kg)',k:'cw',p:'e.g. 72.5'},{l:'Target Weight (kg)',k:'tw',p:'e.g. 68.0'}].map(f => (
            <div key={f.k} style={{ marginBottom:16 }}>
              <Lbl text={f.l} style={{marginBottom:8}} />
              <input type="number" value={ans[f.k]} onChange={e=>setAns(a=>({...a,[f.k]:e.target.value}))} placeholder={f.p}
                style={{ width:'100%', boxSizing:'border-box', background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', color:C.text, fontSize:16, fontFamily:'Barlow,sans-serif', outline:'none' }} />
            </div>
          ))}
          <button onClick={finish} disabled={!ans.cw} style={{
            width:'100%', background:ans.cw?C.accent:C.s4, color:ans.cw?'#000':C.muted,
            border:'none', borderRadius:12, padding:15, fontSize:13, fontFamily:fb,
            fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:ans.cw?'pointer':'not-allowed', marginTop:8,
          }}>Calculate My Plan →</button>
        </>
      )}
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

  if (!dietGoal) return <DietOnboarding onComplete={g=>setDietGoal(g)} />;

  const dri = { ...BASE_DRI, calories:dietGoal.calories, protein:dietGoal.protein, carbs:dietGoal.carbs, fat:dietGoal.fat };
  const tot = mealLog.reduce((acc, item) => {
    NMETA.forEach(n => { acc[n.key] = (acc[n.key]||0) + (item[n.key]||0); });
    acc.calories = (acc.calories||0) + (item.calories||0);
    return acc;
  }, {});

  const logFood = async () => {
    if (!input.trim()||loading) return;
    const q = input.trim(); setInput(''); setLoading(true);

    // ── Local Food Database (values per 100g; defaultG = grams per "1 unit") ──
    const FOODS = [
      { al:['egg','eggs','whole egg','boiled egg','fried egg'],                  cal:155,p:13,  c:1.1, f:11,  fi:0,   na:124,k:126, ca:56,  fe:1.8, vA:140,vB12:1.1,vC:0,  vD:2.0, vE:1.1, mg:12, zn:1.3, dg:60  },
      { al:['egg white','egg whites'],                                            cal:52, p:11,  c:0.7, f:0.2, fi:0,   na:166,k:163, ca:7,   fe:0.1, vA:0,  vB12:0.1,vC:0,  vD:0,   vE:0,   mg:11, zn:0.0, dg:33  },
      { al:['milk','whole milk','cow milk','full fat milk'],                      cal:61, p:3.2, c:4.8, f:3.3, fi:0,   na:43, k:132, ca:113, fe:0.1, vA:28, vB12:0.4,vC:1,  vD:1.3, vE:0.1, mg:10, zn:0.4, dg:250 },
      { al:['paneer','cottage cheese india'],                                     cal:265,p:18,  c:1.2, f:20,  fi:0,   na:30, k:91,  ca:190, fe:0.2, vA:193,vB12:0.8,vC:0,  vD:0.5, vE:0.3, mg:8,  zn:2.7, dg:100 },
      { al:['greek yogurt','greek yoghurt'],                                      cal:59, p:10,  c:3.6, f:0.4, fi:0,   na:36, k:141, ca:110, fe:0.1, vA:0,  vB12:0.7,vC:0,  vD:0,   vE:0,   mg:11, zn:0.5, dg:150 },
      { al:['curd','dahi','plain yogurt','yogurt','yoghurt'],                     cal:61, p:3.5, c:4.7, f:3.3, fi:0,   na:46, k:155, ca:121, fe:0.1, vA:27, vB12:0.4,vC:1,  vD:0,   vE:0.1, mg:12, zn:0.6, dg:150 },
      { al:['whey protein','whey','protein powder','protein shake'],              cal:120,p:25,  c:3,   f:2,   fi:1,   na:140,k:320, ca:200, fe:1.0, vA:0,  vB12:1.2,vC:0,  vD:2.0, vE:0.5, mg:30, zn:2.5, dg:30  },
      { al:['butter','salted butter'],                                             cal:717,p:0.9, c:0.1, f:81,  fi:0,   na:576,k:24,  ca:24,  fe:0.0, vA:684,vB12:0.2,vC:0,  vD:1.5, vE:2.3, mg:2,  zn:0.1, dg:10  },
      { al:['ghee','clarified butter','desi ghee'],                               cal:900,p:0,   c:0,   f:99,  fi:0,   na:0,  k:1,   ca:1,   fe:0.0, vA:0,  vB12:0,  vC:0,  vD:0,   vE:2.8, mg:0,  zn:0.1, dg:10  },
      { al:['white rice','rice','cooked rice','boiled rice'],                     cal:130,p:2.7, c:28,  f:0.3, fi:0.4, na:1,  k:35,  ca:10,  fe:0.2, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0,   mg:12, zn:0.5, dg:200 },
      { al:['raw rice','uncooked rice'],                                           cal:365,p:7,   c:80,  f:0.7, fi:2.8, na:5,  k:115, ca:28,  fe:0.8, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.1, mg:25, zn:1.1, dg:100 },
      { al:['oats','rolled oats','oatmeal','porridge oats'],                      cal:389,p:17,  c:66,  f:7,   fi:11,  na:2,  k:429, ca:54,  fe:4.7, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.4, mg:177,zn:4.0, dg:40  },
      { al:['cooked oats','oatmeal cooked','porridge'],                           cal:68, p:2.5, c:12,  f:1.4, fi:1.7, na:49, k:61,  ca:10,  fe:0.7, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.1, mg:26, zn:0.6, dg:250 },
      { al:['roti','chapati','wheat roti','phulka'],                              cal:297,p:10,  c:56,  f:3.7, fi:3.5, na:3,  k:160, ca:34,  fe:3.9, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.4, mg:82, zn:1.6, dg:45  },
      { al:['bread','white bread','sandwich bread','bread slice'],                cal:265,p:9,   c:49,  f:3.2, fi:2.7, na:491,k:115, ca:107, fe:3.6, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.4, mg:23, zn:0.7, dg:35  },
      { al:['brown bread','whole wheat bread','multigrain bread'],                cal:247,p:13,  c:41,  f:4.2, fi:6,   na:400,k:248, ca:107, fe:3.9, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.6, mg:82, zn:1.5, dg:35  },
      { al:['quinoa','raw quinoa','uncooked quinoa'],                             cal:368,p:14,  c:64,  f:6,   fi:7,   na:5,  k:563, ca:47,  fe:4.6, vA:0,  vB12:0,  vC:0,  vD:0,   vE:2.4, mg:197,zn:3.1, dg:100 },
      { al:['cooked quinoa','quinoa cooked','quinoa boiled'],                     cal:120,p:4.4, c:22,  f:1.9, fi:2.8, na:7,  k:172, ca:17,  fe:1.5, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.6, mg:64, zn:1.1, dg:185 },
      { al:['poha','flattened rice','beaten rice'],                               cal:346,p:6.3, c:77,  f:0.6, fi:1.5, na:8,  k:140, ca:14,  fe:2.8, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0,   mg:45, zn:1.0, dg:80  },
      { al:['semolina','rava','suji','sooji'],                                    cal:360,p:13,  c:73,  f:1,   fi:3.9, na:1,  k:186, ca:17,  fe:4.4, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0,   mg:47, zn:0.9, dg:50  },
      { al:['wheat flour','atta','whole wheat flour'],                            cal:340,p:13,  c:72,  f:2,   fi:10,  na:2,  k:363, ca:34,  fe:3.9, vA:0,  vB12:0,  vC:0,  vD:0,   vE:1.0, mg:138,zn:2.6, dg:100 },
      { al:['pasta','spaghetti','noodles'],                                        cal:371,p:13,  c:75,  f:1.5, fi:2.7, na:6,  k:215, ca:21,  fe:3.3, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.1, mg:53, zn:1.4, dg:80  },
      { al:['cooked pasta','boiled pasta'],                                        cal:158,p:5.8, c:31,  f:0.9, fi:1.8, na:1,  k:44,  ca:7,   fe:1.3, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0,   mg:18, zn:0.5, dg:180 },
      { al:['maggi','instant noodles','2 minute noodles'],                        cal:435,p:9.5, c:64,  f:16,  fi:3,   na:1045,k:160,ca:30,  fe:2.5, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.5, mg:30, zn:0.8, dg:70  },
      { al:['dal','lentils','raw dal','masoor dal','red lentil'],                 cal:352,p:25,  c:60,  f:1,   fi:11,  na:6,  k:677, ca:56,  fe:7.5, vA:0,  vB12:0,  vC:4,  vD:0,   vE:0.5, mg:122,zn:3.3, dg:100 },
      { al:['cooked dal','boiled dal','cooked lentils'],                          cal:116,p:9,   c:20,  f:0.4, fi:8,   na:2,  k:369, ca:19,  fe:3.3, vA:2,  vB12:0,  vC:1.5,vD:0,   vE:0.2, mg:36, zn:1.3, dg:200 },
      { al:['toor dal','arhar dal','pigeon pea'],                                 cal:335,p:22,  c:57,  f:1.7, fi:15,  na:17, k:1392,ca:130, fe:5.2, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.5, mg:183,zn:2.8, dg:100 },
      { al:['moong dal','mung dal','yellow moong','green moong'],                 cal:347,p:24,  c:63,  f:1.2, fi:16,  na:15, k:1246,ca:132, fe:6.7, vA:6,  vB12:0,  vC:4,  vD:0,   vE:0.4, mg:189,zn:2.7, dg:100 },
      { al:['chana dal','split chickpea','bengal gram'],                          cal:364,p:20,  c:61,  f:5,   fi:18,  na:24, k:845, ca:105, fe:4.3, vA:3,  vB12:0,  vC:3,  vD:0,   vE:0.3, mg:139,zn:3.4, dg:100 },
      { al:['urad dal','black dal','black gram'],                                 cal:347,p:25,  c:59,  f:1.6, fi:18,  na:38, k:983, ca:138, fe:7.6, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0.5, mg:267,zn:3.4, dg:100 },
      { al:['rajma','kidney beans','red kidney beans'],                           cal:333,p:24,  c:60,  f:0.8, fi:25,  na:28, k:1359,ca:83,  fe:6.7, vA:0,  vB12:0,  vC:5,  vD:0,   vE:0.2, mg:140,zn:2.8, dg:100 },
      { al:['cooked rajma','boiled kidney beans'],                                cal:127,p:8.7, c:23,  f:0.5, fi:7.4, na:2,  k:403, ca:35,  fe:2.9, vA:0,  vB12:0,  vC:1,  vD:0,   vE:0.1, mg:45, zn:1.1, dg:200 },
      { al:['chickpeas','chana','chole','kabuli chana'],                          cal:364,p:19,  c:61,  f:6,   fi:17,  na:24, k:875, ca:105, fe:6.2, vA:3,  vB12:0,  vC:4,  vD:0,   vE:0.8, mg:115,zn:3.4, dg:100 },
      { al:['cooked chickpeas','boiled chickpeas','cooked chole'],                cal:164,p:8.9, c:27,  f:2.6, fi:7.6, na:7,  k:291, ca:49,  fe:2.9, vA:2,  vB12:0,  vC:1.3,vD:0,   vE:0.4, mg:48, zn:1.5, dg:200 },
      { al:['tofu','soya paneer','bean curd'],                                    cal:76, p:8,   c:1.9, f:4.2, fi:0.3, na:7,  k:121, ca:350, fe:2.7, vA:0,  vB12:0,  vC:0.1,vD:0,   vE:0.1, mg:30, zn:0.8, dg:100 },
      { al:['chicken breast','boneless chicken','chicken fillet'],                cal:165,p:31,  c:0,   f:3.6, fi:0,   na:74, k:256, ca:15,  fe:1.0, vA:9,  vB12:0.3,vC:0,  vD:0.1, vE:0.3, mg:29, zn:1.0, dg:100 },
      { al:['chicken thigh','chicken leg','dark chicken'],                        cal:209,p:26,  c:0,   f:11,  fi:0,   na:88, k:220, ca:13,  fe:1.3, vA:21, vB12:0.3,vC:0,  vD:0.1, vE:0.4, mg:23, zn:2.4, dg:100 },
      { al:['mutton','lamb','goat meat','gosht'],                                  cal:294,p:25,  c:0,   f:21,  fi:0,   na:72, k:310, ca:17,  fe:2.7, vA:0,  vB12:2.6,vC:0,  vD:0,   vE:0.5, mg:23, zn:4.1, dg:100 },
      { al:['fish','white fish','rohu','katla','tilapia'],                        cal:96, p:20,  c:0,   f:1.7, fi:0,   na:56, k:302, ca:17,  fe:0.5, vA:14, vB12:1.6,vC:0,  vD:6.0, vE:0.6, mg:26, zn:0.8, dg:100 },
      { al:['salmon','grilled salmon'],                                             cal:208,p:20,  c:0,   f:13,  fi:0,   na:59, k:363, ca:12,  fe:0.4, vA:58, vB12:3.2,vC:3,  vD:11,  vE:3.6, mg:29, zn:0.6, dg:100 },
      { al:['tuna','canned tuna','tuna fish'],                                    cal:130,p:30,  c:0,   f:1,   fi:0,   na:50, k:444, ca:10,  fe:1.3, vA:0,  vB12:2.5,vC:0,  vD:4.5, vE:1.0, mg:35, zn:0.8, dg:100 },
      { al:['potato','aloo','boiled potato'],                                      cal:87, p:1.9, c:20,  f:0.1, fi:1.8, na:6,  k:421, ca:12,  fe:0.8, vA:2,  vB12:0,  vC:20, vD:0,   vE:0.1, mg:23, zn:0.3, dg:150 },
      { al:['sweet potato','shakarkandi'],                                          cal:86, p:1.6, c:20,  f:0.1, fi:3,   na:55, k:337, ca:30,  fe:0.6, vA:961,vB12:0,  vC:3,  vD:0,   vE:0.3, mg:25, zn:0.3, dg:130 },
      { al:['spinach','palak','baby spinach'],                                     cal:23, p:2.9, c:3.6, f:0.4, fi:2.2, na:79, k:558, ca:99,  fe:2.7, vA:469,vB12:0,  vC:28, vD:0,   vE:2.0, mg:79, zn:0.5, dg:100 },
      { al:['broccoli'],                                                            cal:34, p:2.8, c:6.6, f:0.4, fi:2.6, na:33, k:316, ca:47,  fe:0.7, vA:77, vB12:0,  vC:89, vD:0,   vE:0.8, mg:21, zn:0.4, dg:100 },
      { al:['carrot','gajar'],                                                      cal:41, p:0.9, c:10,  f:0.2, fi:2.8, na:69, k:320, ca:33,  fe:0.3, vA:835,vB12:0,  vC:6,  vD:0,   vE:0.7, mg:12, zn:0.2, dg:80  },
      { al:['tomato','tamatar'],                                                     cal:18, p:0.9, c:3.9, f:0.2, fi:1.2, na:5,  k:237, ca:10,  fe:0.3, vA:42, vB12:0,  vC:14, vD:0,   vE:0.5, mg:11, zn:0.2, dg:100 },
      { al:['onion','pyaz'],                                                         cal:40, p:1.1, c:9.3, f:0.1, fi:1.7, na:4,  k:146, ca:23,  fe:0.2, vA:0,  vB12:0,  vC:8,  vD:0,   vE:0,   mg:10, zn:0.2, dg:80  },
      { al:['cucumber','kheera'],                                                    cal:15, p:0.7, c:3.6, f:0.1, fi:0.5, na:2,  k:147, ca:16,  fe:0.3, vA:5,  vB12:0,  vC:2.8,vD:0,   vE:0,   mg:13, zn:0.2, dg:100 },
      { al:['banana','kela'],                                                        cal:89, p:1.1, c:23,  f:0.3, fi:2.6, na:1,  k:358, ca:5,   fe:0.3, vA:3,  vB12:0,  vC:9,  vD:0,   vE:0.1, mg:27, zn:0.2, dg:120 },
      { al:['apple','seb'],                                                          cal:52, p:0.3, c:14,  f:0.2, fi:2.4, na:1,  k:107, ca:6,   fe:0.1, vA:3,  vB12:0,  vC:5,  vD:0,   vE:0.2, mg:5,  zn:0.0, dg:150 },
      { al:['mango','aam','alphonso'],                                               cal:60, p:0.8, c:15,  f:0.4, fi:1.6, na:1,  k:168, ca:11,  fe:0.2, vA:54, vB12:0,  vC:36, vD:0,   vE:0.9, mg:10, zn:0.1, dg:200 },
      { al:['orange','santra'],                                                       cal:47, p:0.9, c:12,  f:0.1, fi:2.4, na:0,  k:181, ca:40,  fe:0.1, vA:11, vB12:0,  vC:53, vD:0,   vE:0.2, mg:10, zn:0.1, dg:130 },
      { al:['almonds','badam'],                                                       cal:579,p:21,  c:22,  f:50,  fi:12,  na:1,  k:733, ca:264, fe:3.7, vA:0,  vB12:0,  vC:0,  vD:0,   vE:25,  mg:270,zn:3.1, dg:30  },
      { al:['peanuts','groundnuts','moongfali'],                                     cal:567,p:26,  c:16,  f:49,  fi:8.5, na:18, k:705, ca:92,  fe:4.6, vA:0,  vB12:0,  vC:0,  vD:0,   vE:8.3, mg:168,zn:3.3, dg:30  },
      { al:['peanut butter'],                                                         cal:588,p:25,  c:20,  f:50,  fi:6,   na:459,k:649, ca:49,  fe:1.7, vA:0,  vB12:0,  vC:0,  vD:0,   vE:9.1, mg:154,zn:2.5, dg:32  },
      { al:['chai','tea with milk','indian tea','masala chai'],                      cal:37, p:1.6, c:5.5, f:1,   fi:0,   na:10, k:65,  ca:40,  fe:0.1, vA:10, vB12:0.1,vC:0,  vD:0,   vE:0,   mg:5,  zn:0.1, dg:200 },
      { al:['idli','idly'],                                                           cal:39, p:2,   c:8,   f:0.2, fi:0.5, na:150,k:35,  ca:8,   fe:0.3, vA:0,  vB12:0,  vC:0,  vD:0,   vE:0,   mg:8,  zn:0.2, dg:60  },
      { al:['dosa','plain dosa'],                                                     cal:168,p:4.6, c:30,  f:3.7, fi:1.5, na:380,k:110, ca:20,  fe:0.9, vA:0,  vB12:0,  vC:1,  vD:0,   vE:0.1, mg:20, zn:0.5, dg:100 },
      { al:['khichdi','dal khichdi'],                                                 cal:124,p:4.6, c:23,  f:1.6, fi:2.4, na:220,k:190, ca:25,  fe:1.2, vA:10, vB12:0,  vC:1,  vD:0,   vE:0.2, mg:30, zn:0.7, dg:200 },
      { al:['biryani','chicken biryani','veg biryani'],                             cal:197,p:9,   c:29,  f:5.5, fi:1.5, na:450,k:220, ca:35,  fe:1.3, vA:25, vB12:0.2,vC:3,  vD:0,   vE:0.4, mg:28, zn:1.0, dg:250 },
      { al:['paratha','aloo paratha'],                                               cal:300,p:6.5, c:45,  f:10,  fi:3,   na:380,k:180, ca:40,  fe:2.5, vA:20, vB12:0,  vC:4,  vD:0,   vE:0.5, mg:40, zn:0.8, dg:80  },
      { al:['paneer curry','palak paneer','paneer tikka'],                           cal:230,p:11,  c:8,   f:17,  fi:1.5, na:380,k:180, ca:220, fe:1.2, vA:180,vB12:0.5,vC:8,  vD:0.3, vE:0.6, mg:25, zn:1.8, dg:200 },
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
      const r = (v, d=1) => Math.round(v * sc * Math.pow(10,d)) / Math.pow(10,d);
      return {
        name: raw, calories:Math.round(best.cal*sc), protein:r(best.p),
        carbs:r(best.c), fat:r(best.f), fiber:r(best.fi),
        sodium:Math.round(best.na*sc), potassium:Math.round(best.k*sc),
        calcium:Math.round(best.ca*sc), iron:r(best.fe),
        vitaminA:Math.round(best.vA*sc), vitaminB12:r(best.vB12),
        vitaminC:Math.round(best.vC*sc), vitaminD:r(best.vD),
        vitaminE:r(best.vE), magnesium:Math.round(best.mg*sc), zinc:r(best.zn),
      };
    }

    const local = parseEntry(q);
    if (local) { setMealLog(p => [local, ...p]); setLoading(false); return; }

    // Unknown food — try AI if available
    try {
      const sys = `Precise nutritionist. Return nutrition for the EXACT quantity stated. ONLY valid JSON, no markdown. Schema: {"name":"string","calories":number,"protein":number,"carbs":number,"fat":number,"fiber":number,"sodium":number,"potassium":number,"calcium":number,"iron":number,"vitaminA":number,"vitaminB12":number,"vitaminC":number,"vitaminD":number,"vitaminE":number,"magnesium":number,"zinc":number}`;
      const text = await callClaude(sys, `Food: "${q}"`);
      const item = JSON.parse(text.replace(/```json|```/g,'').trim());
      if (item.calories > 3000) item.calories = Math.round(item.calories / 10);
      setMealLog(p => [{...item, name:item.name||q}, ...p]);
    } catch {
      setMealLog(p => [{
        name:`${q} (estimated)`, calories:200, protein:8, carbs:28, fat:6, fiber:3,
        sodium:200, potassium:250, calcium:40, iron:1.5,
        vitaminA:15, vitaminB12:0.3, vitaminC:5, vitaminD:0.3, vitaminE:0.7, magnesium:30, zinc:0.8,
      }, ...p]);
    }
    setLoading(false);
  };

  // High protein sources by diet preference
  const proteinSources = {
    'Non-Vegetarian': [
      { food:'Chicken Breast (100g)', protein:'31g', cal:'165', tag:'Lean',       macros:{protein:31,carbs:0,fat:3.6} },
      { food:'Eggs (2 whole)',         protein:'13g', cal:'155', tag:'Complete',   macros:{protein:13,carbs:1,fat:11} },
      { food:'Tuna (100g)',            protein:'30g', cal:'130', tag:'Lean',       macros:{protein:30,carbs:0,fat:1} },
      { food:'Greek Yogurt (150g)',    protein:'15g', cal:'90',  tag:'Dairy',      macros:{protein:15,carbs:6,fat:0.7} },
      { food:'Salmon (100g)',          protein:'25g', cal:'208', tag:'Omega-3',    macros:{protein:25,carbs:0,fat:13} },
      { food:'Cottage Cheese (100g)', protein:'11g', cal:'98',  tag:'Dairy',      macros:{protein:11,carbs:3.4,fat:4.3} },
      { food:'Turkey (100g)',          protein:'29g', cal:'157', tag:'Lean',       macros:{protein:29,carbs:0,fat:4} },
      { food:'Whey Protein (1 scoop)', protein:'25g', cal:'120', tag:'Supplement', macros:{protein:25,carbs:3,fat:2} },
    ],
    'Vegetarian': [
      { food:'Paneer (100g)',           protein:'18g', cal:'265', tag:'Dairy',      macros:{protein:18,carbs:1.2,fat:20} },
      { food:'Greek Yogurt (150g)',     protein:'15g', cal:'90',  tag:'Dairy',      macros:{protein:15,carbs:6,fat:0.7} },
      { food:'Eggs (2 whole)',          protein:'13g', cal:'155', tag:'Complete',   macros:{protein:13,carbs:1,fat:11} },
      { food:'Lentils cooked (100g)',   protein:'9g',  cal:'116', tag:'Plant',      macros:{protein:9,carbs:20,fat:0.4} },
      { food:'Chickpeas (100g)',        protein:'9g',  cal:'164', tag:'Plant',      macros:{protein:9,carbs:27,fat:2.6} },
      { food:'Tofu (100g)',             protein:'8g',  cal:'76',  tag:'Soy',        macros:{protein:8,carbs:1.9,fat:4.2} },
      { food:'Cottage Cheese (100g)',  protein:'11g', cal:'98',  tag:'Dairy',      macros:{protein:11,carbs:3.4,fat:4.3} },
      { food:'Whey Protein (1 scoop)', protein:'25g', cal:'120', tag:'Supplement', macros:{protein:25,carbs:3,fat:2} },
    ],
    'Vegan': [
      { food:'Tempeh (100g)',           protein:'19g', cal:'193', tag:'Fermented',  macros:{protein:19,carbs:9,fat:11} },
      { food:'Tofu firm (100g)',        protein:'10g', cal:'83',  tag:'Soy',        macros:{protein:10,carbs:2,fat:5} },
      { food:'Lentils cooked (100g)',   protein:'9g',  cal:'116', tag:'Plant',      macros:{protein:9,carbs:20,fat:0.4} },
      { food:'Black Beans (100g)',      protein:'9g',  cal:'132', tag:'Legume',     macros:{protein:9,carbs:24,fat:0.5} },
      { food:'Edamame (100g)',          protein:'11g', cal:'122', tag:'Soy',        macros:{protein:11,carbs:10,fat:5} },
      { food:'Pea Protein (1 scoop)',   protein:'21g', cal:'100', tag:'Supplement', macros:{protein:21,carbs:2,fat:1.5} },
      { food:'Hemp Seeds (30g)',        protein:'10g', cal:'166', tag:'Seeds',      macros:{protein:10,carbs:2.6,fat:14} },
      { food:'Seitan (100g)',           protein:'25g', cal:'150', tag:'Wheat',      macros:{protein:25,carbs:14,fat:1.9} },
    ],
    'Flexible': [
      { food:'Chicken Breast (100g)', protein:'31g', cal:'165', tag:'Lean',       macros:{protein:31,carbs:0,fat:3.6} },
      { food:'Eggs (2 whole)',         protein:'13g', cal:'155', tag:'Complete',   macros:{protein:13,carbs:1,fat:11} },
      { food:'Paneer (100g)',          protein:'18g', cal:'265', tag:'Dairy',      macros:{protein:18,carbs:1.2,fat:20} },
      { food:'Lentils cooked (100g)', protein:'9g',  cal:'116', tag:'Plant',      macros:{protein:9,carbs:20,fat:0.4} },
      { food:'Greek Yogurt (150g)',   protein:'15g', cal:'90',  tag:'Dairy',      macros:{protein:15,carbs:6,fat:0.7} },
      { food:'Tuna (100g)',            protein:'30g', cal:'130', tag:'Lean',       macros:{protein:30,carbs:0,fat:1} },
      { food:'Whey Protein (1 scoop)',protein:'25g', cal:'120', tag:'Supplement', macros:{protein:25,carbs:3,fat:2} },
      { food:'Tofu (100g)',            protein:'8g',  cal:'76',  tag:'Soy',        macros:{protein:8,carbs:1.9,fat:4.2} },
    ],
  };
  const pSources = proteinSources[dietGoal.diet] || proteinSources['Flexible'];
  const tagColors = { Lean:C.accent, Complete:C.blue, Dairy:C.teal, Plant:C.green, Soy:C.purple, Supplement:C.orange, 'Omega-3':C.blue, Legume:C.teal, Fermented:C.pink, Seeds:C.purple, Wheat:C.orange };

  const calPct = Math.min(Math.round(((tot.calories||0)/dri.calories)*100),100);
  const catMeta = NMETA.filter(n=>n.cat===nutriTab);

  return (
    <div>
      <Hd t="DIET" s={`${dietGoal.goal} · ${dietGoal.calories} kcal target`} />

      {/* Goal tags + notepad toggle */}
      <div style={{ padding:'0 16px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
          <span style={{ background:C.accent+'18', color:C.accent, fontSize:10, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 10px', borderRadius:6 }}>{dietGoal.goal}</span>
          {dietGoal.speed && <span style={{ background:C.s3, color:C.sub, fontSize:10, fontFamily:fb, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 10px', borderRadius:6 }}>{dietGoal.speed?.split('(')[0].trim()}</span>}
          {dietGoal.diet && <span style={{ background:C.s3, color:C.sub, fontSize:10, fontFamily:fb, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 10px', borderRadius:6 }}>{dietGoal.diet}</span>}
        </div>
        <button onClick={()=>setNoteOpen(o=>!o)} style={{
          background:noteOpen?C.accent+'1A':C.s3, border:`1px solid ${noteOpen?C.accent:C.border}`,
          borderRadius:8, padding:'5px 10px', color:noteOpen?C.accent:C.muted,
          fontFamily:fb, fontWeight:700, fontSize:10, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', flexShrink:0, marginLeft:8,
        }}>📝 {noteOpen?'Close':'Notes'}</button>
      </div>

      {/* Notepad */}
      {noteOpen && (
        <div style={{ padding:'0 16px 12px' }}>
          <div style={{ background:C.s2, border:`1px solid ${C.accent}33`, borderRadius:14, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'12px 14px 10px', borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontFamily:fn, fontSize:14, fontWeight:700, color:C.accent }}>
                  🥩 High Protein Guide · {dietGoal.diet || 'Flexible'}
                </div>
                <span style={{ fontSize:10, color:C.muted, fontFamily:fb, fontWeight:600 }}>per serving</span>
              </div>
              <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>Protein · Carbs · Fat · Calories</div>
            </div>
            {/* Protein sources table */}
            <div style={{ maxHeight:220, overflowY:'auto' }}>
              {pSources.map((s,i) => {
                const tc = tagColors[s.tag] || C.accent;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderBottom:`0.5px solid ${C.border}` }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{s.food}</div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>
                        <span style={{color:C.blue}}>P {s.macros.protein}g</span>
                        {' · '}
                        <span style={{color:C.teal}}>C {s.macros.carbs}g</span>
                        {' · '}
                        <span style={{color:C.orange}}>F {s.macros.fat}g</span>
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:C.accent }}>{s.cal}</div>
                      <div style={{ background:tc+'18', color:tc, fontSize:7, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', padding:'1px 5px', borderRadius:3, marginTop:2 }}>{s.tag}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Personal notes */}
            <div style={{ padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:C.muted, fontFamily:fb, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>📝 My Notes</div>
              <textarea value={note} onChange={e=>setNote(e.target.value.slice(0,400))} rows={3}
                placeholder="Track how you feel, cheat meals, energy levels..."
                style={{ width:'100%', boxSizing:'border-box', background:'transparent', border:'none', color:C.text, fontSize:12, fontFamily:fn, resize:'none', outline:'none', lineHeight:1.6 }} />
              <div style={{ textAlign:'right', fontSize:9, color:C.muted }}>{note.length}/400</div>
            </div>
          </div>
        </div>
      )}

      {/* LOG FOOD — moved to top for quick access */}
      <div style={{ padding:'0 16px' }}>
        <div style={{ fontFamily:fn, fontSize:16, fontWeight:800, letterSpacing:'-0.02em', color:C.text, marginBottom:10 }}>Log Food</div>
        <div style={{ display:'flex', gap:8, marginBottom:4 }}>
          <input
            value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&logFood()}
            placeholder="Describe any food in plain language..."
            style={{ flex:1, background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'13px 14px', color:C.text, fontSize:13, fontFamily:fn, outline:'none' }}
          />
          <button onClick={logFood} disabled={loading||!input.trim()} style={{
            background:C.accent, border:'none', borderRadius:12, padding:'0 18px', color:'#000',
            fontFamily:fn, fontWeight:700, fontSize:12, cursor:(loading||!input.trim())?'not-allowed':'pointer', opacity:(loading||!input.trim())?0.4:1,
          }}>{loading?'…':'LOG'}</button>
        </div>
        <div style={{ color:C.muted, fontSize:11, marginBottom:12 }}>AI estimates all 15 nutrients automatically</div>
        {mealLog.map((item,i) => <MealCard key={i} item={item} onDelete={()=>setMealLog(l=>l.filter((_,j)=>j!==i))} />)}
      </div>

      {/* Calorie summary */}
      <div style={{ padding:'14px 16px 0' }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
            <div>
              <Lbl text="Total Calories" style={{marginBottom:5}} />
              <div style={{ fontFamily:fn, fontSize:48, fontWeight:800, color:C.text, lineHeight:1, letterSpacing:'-0.03em' }}>{Math.round(tot.calories||0)}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:fn, fontWeight:700, fontSize:15, color:(dri.calories-(tot.calories||0))>0?C.accent:C.red }}>
                {(dri.calories-(tot.calories||0))>0?`${dri.calories-Math.round(tot.calories||0)} kcal left`:'Over goal'}
              </div>
              <div style={{ color:C.muted, fontSize:11 }}>of {dri.calories} kcal</div>
              {dietGoal.targetWeight&&dietGoal.currentWeight&&(
                <div style={{ color:C.sub, fontSize:11, marginTop:4 }}>
                  {dietGoal.currentWeight}→{dietGoal.targetWeight}kg · <span style={{color:C.accent}}>{Math.abs((dietGoal.currentWeight-dietGoal.targetWeight).toFixed(1))}kg to go</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ height:6, background:C.s4, borderRadius:3 }}>
            <div style={{ height:'100%', width:`${calPct}%`, background:calPct>100?C.red:C.accent, borderRadius:3, transition:'width 0.4s ease' }} />
          </div>
        </Card>
      </div>

      {/* Full Nutrition Panel */}
      <div style={{ padding:'14px 16px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontFamily:fn, fontSize:16, fontWeight:800, letterSpacing:'-0.02em', color:C.text }}>Full Nutrition</div>
          <div style={{ display:'flex', gap:4 }}>
            {[['↓',C.blue,'Deficit'],['✓',C.green,'Optimal'],['↑',C.red,'Excess']].map(([ic,c,l])=>(
              <span key={l} style={{ fontSize:9, color:c, fontFamily:fb, fontWeight:700, background:c+'18', padding:'2px 6px', borderRadius:3 }}>{ic} {l}</span>
            ))}
          </div>
        </div>
        <Card style={{ padding:'0 16px' }}>
          <div style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
            {[['macro','Macros'],['mineral','Minerals'],['vitamin','Vitamins']].map(([k,l]) => (
              <button key={k} onClick={()=>setNutriTab(k)} style={{
                flex:1, padding:'12px 0', background:'none', border:'none',
                borderBottom:`2px solid ${nutriTab===k?C.accent:'transparent'}`,
                color:nutriTab===k?C.accent:C.muted, fontFamily:fn, fontWeight:700, fontSize:11,
                textTransform:'uppercase', letterSpacing:'0.06em', cursor:'pointer',
              }}>{l}</button>
            ))}
          </div>
          <div style={{ paddingBottom:4 }}>
            {catMeta.map(n => <NRow key={n.key} label={n.label} current={tot[n.key]||0} dri={dri[n.key]||BASE_DRI[n.key]||0} unit={n.unit} color={n.color} />)}
          </div>
        </Card>
      </div>

      {/* HIGH PROTEIN SOURCES — moved to bottom */}
      <div style={{ padding:'14px 16px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontFamily:fn, fontSize:16, fontWeight:800, letterSpacing:'-0.02em', color:C.text }}>High Protein Sources</div>
          <span style={{ fontSize:10, color:C.sub, fontFamily:fb, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{dietGoal.diet||'Flexible'}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {pSources.map((s,i) => {
            const tc = tagColors[s.tag] || C.accent;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:C.s2, border:`1px solid ${C.border}`, borderRadius:11, padding:'10px 13px' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, color:C.text, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.food}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                    <span style={{color:C.blue}}>P {s.macros.protein}g</span> · <span style={{color:C.teal}}>C {s.macros.carbs}g</span> · <span style={{color:C.orange}}>F {s.macros.fat}g</span>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:fn, fontSize:15, fontWeight:700, color:C.blue, letterSpacing:'-0.01em', lineHeight:1 }}>{s.protein}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{s.cal} kcal</div>
                  <div style={{ background:tc+'1A', color:tc, fontSize:7, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'2px 5px', borderRadius:3, marginTop:2, display:'inline-block' }}>{s.tag}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Explore Section ─────────────────────────────────────────────────────────
function ExploreSection() {
  const [muscle, setMuscle] = useState('chest');
  const [filter, setFilter] = useState('all');
  const muscles = ['chest','back','shoulders','arms','core','legs'];
  const filtered = EX.filter(e=>e.cat==='strength'&&e.muscle===muscle&&(filter==='all'||e.level===filter));
  const hi = (m) => ({ fill:MC[m]||C.accent, fillOpacity:muscle===m?0.32:0, cursor:'pointer', stroke:muscle===m?MC[m]||C.accent:'none', strokeWidth:0.8 });
  const hit = { fill:'transparent', stroke:'transparent', strokeWidth:14, cursor:'pointer' };

  return (
    <div>
      <Hd t="EXPLORE" s="Tap muscle · browse exercises" />
      <div style={{ display:'flex', gap:14, padding:'0 16px', alignItems:'flex-start' }}>
        <svg viewBox="0 0 220 300" style={{ width:148, height:200, flexShrink:0 }}>
          <g fill={C.s3} stroke={C.border} strokeWidth="1.3">
            <ellipse cx="110" cy="32" rx="23" ry="27" />
            <rect x="102" y="56" width="16" height="14" rx="5" />
            <path d="M66,72 L60,68 L55,195 L100,196 L100,146 L120,146 L120,196 L165,195 L160,68 L154,72 Q134,64 110,64 Q86,64 66,72Z" />
            <path d="M60,76 L38,80 L26,163 L50,167Z" />
            <path d="M50,167 L26,163 L18,210 L46,212Z" />
            <path d="M160,76 L182,80 L194,163 L170,167Z" />
            <path d="M170,167 L194,163 L202,210 L174,212Z" />
            <path d="M82,197 L74,274 L104,274 L112,197Z" />
            <path d="M138,197 L146,274 L116,274 L108,197Z" />
          </g>
          <path d="M78,94 Q110,88 142,94 L139,143 Q110,148 81,143Z" {...hi('chest')} onClick={()=>setMuscle('chest')} />
          <path d="M78,94 Q110,88 142,94 L139,143 Q110,148 81,143Z" {...hit} onClick={()=>setMuscle('chest')} />
          <ellipse cx="65" cy="108" rx="17" ry="22" {...hi('shoulders')} onClick={()=>setMuscle('shoulders')} />
          <ellipse cx="155" cy="108" rx="17" ry="22" {...hi('shoulders')} onClick={()=>setMuscle('shoulders')} />
          <ellipse cx="65" cy="108" rx="17" ry="22" {...hit} onClick={()=>setMuscle('shoulders')} />
          <ellipse cx="155" cy="108" rx="17" ry="22" {...hit} onClick={()=>setMuscle('shoulders')} />
          <path d="M52,112 L38,116 L30,165 L50,169Z" {...hi('arms')} onClick={()=>setMuscle('arms')} />
          <path d="M168,112 L182,116 L190,165 L170,169Z" {...hi('arms')} onClick={()=>setMuscle('arms')} />
          <path d="M52,112 L38,116 L30,165 L50,169Z" {...hit} onClick={()=>setMuscle('arms')} />
          <path d="M168,112 L182,116 L190,165 L170,169Z" {...hit} onClick={()=>setMuscle('arms')} />
          <rect x="82" y="147" width="56" height="47" rx="4" {...hi('core')} onClick={()=>setMuscle('core')} />
          <rect x="82" y="147" width="56" height="47" rx="4" {...hit} onClick={()=>setMuscle('core')} />
          <path d="M84,197 L77,272 L106,272 L113,197Z" {...hi('legs')} onClick={()=>setMuscle('legs')} />
          <path d="M136,197 L143,272 L114,272 L107,197Z" {...hi('legs')} onClick={()=>setMuscle('legs')} />
          <path d="M84,197 L77,272 L106,272 L113,197Z" {...hit} onClick={()=>setMuscle('legs')} />
          <path d="M136,197 L143,272 L114,272 L107,197Z" {...hit} onClick={()=>setMuscle('legs')} />
          <path d="M67,82 Q50,87 48,100 L56,178 Q80,182 100,178 L100,102 Q84,86 67,82Z" fill={MC.back} fillOpacity={muscle==='back'?0.22:0} cursor="pointer" onClick={()=>setMuscle('back')} />
          <path d="M67,82 Q50,87 48,100 L56,178 Q80,182 100,178 L100,102 Q84,86 67,82Z" {...hit} onClick={()=>setMuscle('back')} />
        </svg>

        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:5, paddingTop:2 }}>
          {muscles.map(m => (
            <button key={m} onClick={()=>setMuscle(m)} style={{
              background:muscle===m?MC[m]+'18':'transparent',
              border:`1px solid ${muscle===m?MC[m]:C.border}`,
              borderRadius:10, padding:'9px 12px', textAlign:'left', cursor:'pointer',
              color:muscle===m?MC[m]:C.sub, fontFamily:fb, fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:'0.05em',
            }}>{m.charAt(0).toUpperCase()+m.slice(1)} <span style={{color:C.muted,fontWeight:400,fontSize:10}}>({EX.filter(e=>e.muscle===m).length})</span></button>
          ))}
        </div>
      </div>

      <div style={{ padding:'12px 16px 6px', display:'flex', gap:5, flexWrap:'wrap' }}>
        {['all','beginner','intermediate','advanced'].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{
            background:filter===f?C.s4:'transparent', color:filter===f?C.text:C.muted,
            border:`1px solid ${filter===f?C.border:'transparent'}`,
            borderRadius:7, padding:'5px 10px', fontSize:10, fontFamily:fb, fontWeight:600, textTransform:'capitalize', cursor:'pointer', letterSpacing:'0.04em',
          }}>{f}</button>
        ))}
      </div>

      <div style={{ padding:'4px 16px' }}>
        {filtered.length===0 ? (
          <div style={{ color:C.muted, fontSize:13, textAlign:'center', padding:24 }}>No exercises found</div>
        ) : filtered.map((ex,i) => <ExCard key={i} ex={ex} />)}
      </div>
    </div>
  );
}

// ─── Chart Tooltip (top-level — never define components inside render) ────────
function ChartTip({ active, payload, label, color, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.s3, border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 12px' }}>
      <div style={{ color:C.sub, fontSize:10, marginBottom:2 }}>{label}</div>
      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:20, color }}>{payload[0].value}{unit}</div>
    </div>
  );
}

// ─── Progress Section ────────────────────────────────────────────────────────
function ProgressSection({ logs, onLogClick, onDelete }) {
  const [metric, setMetric] = useState('weight');
  const metrics = [
    {key:'weight',label:'Weight',unit:'kg',color:C.accent},
    {key:'bodyFat',label:'Body Fat',unit:'%',color:C.orange},
    {key:'waist',label:'Waist',unit:'cm',color:C.blue},
    {key:'chest',label:'Chest',unit:'cm',color:C.purple},
    {key:'arms',label:'Arms',unit:'cm',color:C.teal},
  ];
  const cur = metrics.find(m=>m.key===metric)||metrics[0];
  const last = logs[logs.length-1];
  const first = logs[0];
  const totalDiff = last&&first ? (last[metric]-first[metric]).toFixed(1) : null;
  const weekDiff = logs.length>=2 ? (last[metric]-logs[logs.length-2][metric]).toFixed(1) : null;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'24px 20px 12px' }}>
        <div>
          <div style={{ fontFamily:fn, fontSize:34, letterSpacing:'0.05em', color:C.text, lineHeight:1 }}>PROGRESS</div>
          <div style={{ color:C.sub, fontSize:13, marginTop:4 }}>Track your transformation</div>
        </div>
        <button onClick={onLogClick} style={{
          background:C.accent, border:'none', borderRadius:12, padding:'10px 16px',
          color:'#000', fontFamily:fb, fontWeight:700, fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
        }}>+ Log Entry</button>
      </div>

      {/* Stat grid */}
      {last && (
        <div style={{ padding:'0 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {[
            {label:'Body Weight',val:`${last.weight} kg`,diff:totalDiff,c:C.accent},
            {label:'Body Fat',val:`${last.bodyFat}%`,diff:null,c:C.orange},
            {label:'Waist',val:`${last.waist} cm`,diff:null,c:C.blue},
            {label:'Chest',val:`${last.chest} cm`,diff:null,c:C.purple},
          ].map((s,i) => (
            <Card key={i} style={{ padding:14 }}>
              <Lbl text={s.label} style={{marginBottom:4}} />
              <div style={{ fontFamily:fn, fontSize:26, color:s.c, lineHeight:1.2 }}>{s.val}</div>
              {s.diff && <div style={{ fontSize:11, color:parseFloat(s.diff)<0?C.green:C.orange, fontFamily:fb, fontWeight:700, marginTop:3 }}>
                {parseFloat(s.diff)<0?'↓':'↑'} {Math.abs(s.diff)} kg total
              </div>}
            </Card>
          ))}
        </div>
      )}

      {/* Graph */}
      <div style={{ padding:'0 16px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:5, marginBottom:12, flexWrap:'wrap' }}>
          {metrics.map(m => (
            <button key={m.key} onClick={()=>setMetric(m.key)} style={{
              background:metric===m.key?m.color+'1F':'transparent',
              border:`1px solid ${metric===m.key?m.color:C.border}`,
              borderRadius:7, padding:'5px 11px', color:metric===m.key?m.color:C.sub,
              fontFamily:fb, fontWeight:700, fontSize:10, textTransform:'uppercase', letterSpacing:'0.04em', cursor:'pointer',
            }}>{m.label}</button>
          ))}
        </div>
        {weekDiff && (
          <div style={{ fontSize:12, color:parseFloat(weekDiff)<=0&&metric==='weight'?C.green:parseFloat(weekDiff)>=0&&metric!=='weight'?C.green:C.orange, fontFamily:fb, fontWeight:700, marginBottom:8 }}>
            {parseFloat(weekDiff)<=0?'↓':'↑'} {Math.abs(weekDiff)}{cur.unit} this week
          </div>
        )}
        <Card style={{ padding:'16px 4px 8px' }}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={logs}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cur.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={cur.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false} width={30} domain={['auto','auto']} />
              <Tooltip content={<ChartTip color={cur.color} unit={cur.unit} />} />
              <Area type="monotone" dataKey={metric} stroke={cur.color} strokeWidth={2} fill="url(#pg)" dot={{fill:cur.color,r:3,strokeWidth:0}} activeDot={{r:5,strokeWidth:0}} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Log history */}
      <div style={{ padding:'0 16px', marginBottom:16 }}>
        <div style={{ fontFamily:fn, fontSize:18, fontWeight:800, letterSpacing:'-0.02em', color:C.text, marginBottom:10 }}>LOG HISTORY</div>
        {logs.length === 0 && (
          <div style={{ color:C.muted, fontSize:13, textAlign:'center', padding:'24px 0' }}>No entries yet — tap + Log Entry to start</div>
        )}
        {[...logs].map((log, ri) => {
          const realIdx = logs.length - 1 - ri; // index in original array (reverse display)
          const idx = logs.length - 1 - ri;
          return (
            <Card key={ri} style={{ padding:'12px 16px', marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ fontFamily:fb, fontWeight:700, fontSize:12, color:C.sub, letterSpacing:'0.06em', textTransform:'uppercase', marginTop:2 }}>{log.date}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:fn, fontSize:20, fontWeight:700, color:C.accent }}>{log.weight}<span style={{fontSize:10,color:C.muted,fontWeight:400}}>kg</span></span>
                  {log.bodyFat>0 && <span style={{ fontFamily:fn, fontSize:20, fontWeight:700, color:C.orange }}>{log.bodyFat}<span style={{fontSize:10,color:C.muted,fontWeight:400}}>%bf</span></span>}
                  {log.height>0 && <span style={{ fontFamily:fn, fontSize:20, fontWeight:700, color:C.teal }}>{log.height}<span style={{fontSize:10,color:C.muted,fontWeight:400}}>cm</span></span>}
                  <button onClick={()=>onDelete(idx)} style={{ width:24, height:24, borderRadius:'50%', background:C.red+'18', border:`1px solid ${C.red}33`, color:C.red, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:2 }}>×</button>
                </div>
              </div>
              {(log.chest||log.waist)>0 && (
                <div style={{ display:'flex', gap:10, marginTop:6, flexWrap:'wrap' }}>
                  {[['Chest',log.chest,'cm'],['Waist',log.waist,'cm'],['Arms',log.arms,'cm'],['Legs',log.legs,'cm']].filter(([,v])=>v>0).map(([l,v,u]) => (
                    <span key={l} style={{ fontSize:11, color:C.muted }}>{l}: <span style={{color:C.sub,fontWeight:600}}>{v}{u}</span></span>
                  ))}
                </div>
              )}
              {log.notes && <div style={{fontSize:11,color:C.muted,marginTop:5,fontStyle:'italic'}}>"{log.notes}"</div>}
            </Card>
          );
        }).reverse()}
      </div>

      {/* Weekly Activity — driven by real log data */}
      <div style={{ padding:'0 16px 20px' }}>
        <div style={{ fontFamily:fn, fontSize:16, fontWeight:800, letterSpacing:'-0.02em', color:C.text, marginBottom:10 }}>Weekly Activity</div>
        <Card>
          {(() => {
            const weekDone = getThisWeekActivity(logs);
            const todayIdx = getTodayDowIndex();
            const DAY_LABELS = ['M','T','W','T','F','S','S'];
            return (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <Lbl text="This Week" />
                  <span style={{ fontSize:10, color:C.muted }}>{weekDone.filter(Boolean).length}/7 logged</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  {DAY_LABELS.map((d,i) => {
                    const logged = weekDone[i];
                    const isToday = i === todayIdx;
                    return (
                      <div key={i} style={{ textAlign:'center' }}>
                        <div style={{
                          width:34, height:34, borderRadius:'50%',
                          background: logged ? C.accent : 'transparent',
                          border: isToday && !logged ? `2px solid ${C.accent}` : logged ? 'none' : `1px solid ${C.border}`,
                          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 5px',
                          color: logged ? '#000' : isToday ? C.accent : C.muted,
                          fontSize: logged ? 13 : 11, fontWeight: 700,
                          boxShadow: isToday ? `0 0 0 3px ${C.accent}22` : 'none',
                        }}>{logged ? '✓' : d}</div>
                        <div style={{ color: isToday ? C.accent : C.muted, fontSize:9, fontFamily:fb, fontWeight:600 }}>{d}</div>
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
    <div style={{ position:'absolute', inset:0, zIndex:100, background:C.bg, display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px 12px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <button onClick={onClose} style={{ background:C.s3, border:'none', width:34, height:34, borderRadius:'50%', color:C.sub, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ fontFamily:fn, fontSize:28, color:C.text, letterSpacing:'0.06em', lineHeight:1 }}>{title}</div>
      </div>
      <div className="msg-scroll" style={{ flex:1, overflowY:'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen({ onClose, progressLogs, dietGoal }) {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name:'Bhrigu Sharma', initials:'BS',
    bio:'B.Tech Bioinformatics · Amity University Rajasthan',
    age:'20', gender:'Male', phone:'', city:'Jaipur',
  });
  const [draft, setDraft] = useState({...profile});
  const sp = (k,v) => setDraft(p=>({...p,[k]:v}));

  const last = progressLogs[progressLogs.length-1];
  const first = progressLogs[0];
  const stats = [
    { label:'Current Weight', val: last ? `${last.weight} kg` : '—', color:C.accent },
    { label:'Body Fat', val: last ? `${last.bodyFat}%` : '—', color:C.orange },
    { label:'Height', val: last&&last.height>0 ? `${last.height} cm` : '—', color:C.teal },
    { label:'Weight Change', val: last&&first ? `${(last.weight-first.weight).toFixed(1)} kg` : '—', color: last&&first&&(last.weight-first.weight)<0 ? C.green : C.orange },
    { label:'Entries Logged', val: `${progressLogs.length}`, color:C.purple },
    { label:'Workout Streak', val: '12 days 🔥', color:C.accent },
  ];
  const badges = [
    { icon:'🔥', label:'12-Day Streak' }, { icon:'💪', label:'First Workout' },
    { icon:'🥗', label:'Nutrition Tracker' }, { icon:'📉', label:'Fat Loss Started' },
    { icon:'🏋️', label:'Lifted Heavy' }, { icon:'⚡', label:'5 Workouts' },
  ];

  if (editing) {
    return (
      <ModalShell title="Edit Profile" onClose={()=>setEditing(false)}>
        <div style={{ padding:'16px 20px 30px' }}>
          {/* Avatar */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
            <div style={{ position:'relative' }}>
              <div style={{ width:80, height:80, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:fn, fontSize:26, fontWeight:800, color:'#000' }}>{draft.initials}</div>
              <div style={{ position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:'50%', background:C.s3, border:`2px solid ${C.bg}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, cursor:'pointer' }}>✏️</div>
            </div>
          </div>
          {/* Fields */}
          {[
            {l:'Full Name',   k:'name',     p:'Your name',       type:'text'},
            {l:'Initials',    k:'initials', p:'e.g. BS',         type:'text'},
            {l:'Bio / Role',  k:'bio',      p:'What you study or do', type:'text'},
            {l:'Age',         k:'age',      p:'e.g. 20',         type:'number'},
            {l:'City',        k:'city',     p:'e.g. Jaipur',     type:'text'},
            {l:'Phone',       k:'phone',    p:'Optional',        type:'tel'},
          ].map(f => (
            <div key={f.k} style={{ marginBottom:14 }}>
              <Lbl text={f.l} style={{marginBottom:7}} />
              <input type={f.type} value={draft[f.k]} onChange={e=>sp(f.k,e.target.value)} placeholder={f.p}
                style={{ width:'100%', boxSizing:'border-box', background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'13px 14px', color:C.text, fontSize:14, fontFamily:fn, outline:'none' }} />
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <Lbl text="Gender" style={{marginBottom:8}} />
            <div style={{ display:'flex', gap:8 }}>
              {['Male','Female','Other','Prefer not to say'].map(g => (
                <button key={g} onClick={()=>sp('gender',g)} style={{
                  flex:1, padding:'9px 4px', background:draft.gender===g?C.accent+'18':C.s2,
                  border:`1px solid ${draft.gender===g?C.accent:C.border}`, borderRadius:10,
                  color:draft.gender===g?C.accent:C.sub, fontFamily:fn, fontWeight:600, fontSize:10, cursor:'pointer',
                }}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={()=>setEditing(false)} style={{ flex:1, background:C.s3, border:`1px solid ${C.border}`, borderRadius:12, padding:14, color:C.sub, fontFamily:fn, fontWeight:600, fontSize:13, cursor:'pointer' }}>Cancel</button>
            <button onClick={()=>{ setProfile({...draft}); setEditing(false); }} style={{ flex:2, background:C.accent, border:'none', borderRadius:12, padding:14, color:'#000', fontFamily:fn, fontWeight:700, fontSize:13, cursor:'pointer' }}>Save Changes</button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="My Profile" onClose={onClose}>
      {/* Avatar + name */}
      <div style={{ padding:'24px 20px 18px', display:'flex', flexDirection:'column', alignItems:'center', borderBottom:`1px solid ${C.border}`, position:'relative' }}>
        <button onClick={()=>setEditing(true)} style={{ position:'absolute', top:20, right:20, background:C.s3, border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 12px', color:C.sub, fontFamily:fn, fontWeight:600, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
          ✏️ Edit
        </button>
        <div style={{ width:76, height:76, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:fn, fontSize:26, fontWeight:800, color:'#000', marginBottom:14, border:`3px solid ${C.accent}44` }}>{profile.initials}</div>
        <div style={{ fontFamily:fn, fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.02em' }}>{profile.name}</div>
        <div style={{ color:C.sub, fontSize:13, marginTop:4 }}>{profile.bio}</div>
        <div style={{ display:'flex', gap:10, marginTop:6 }}>
          {profile.age && <span style={{ color:C.muted, fontSize:12 }}>{profile.age} yrs</span>}
          {profile.gender && <span style={{ color:C.muted, fontSize:12 }}>· {profile.gender}</span>}
          {profile.city && <span style={{ color:C.muted, fontSize:12 }}>· 📍 {profile.city}</span>}
        </div>
        {dietGoal && (
          <div style={{ display:'flex', gap:7, marginTop:12 }}>
            <span style={{ background:C.accent+'18', color:C.accent, fontSize:10, fontFamily:fb, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 12px', borderRadius:6 }}>{dietGoal.goal}</span>
            <span style={{ background:C.s3, color:C.sub, fontSize:10, fontFamily:fb, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 12px', borderRadius:6 }}>{dietGoal.activity||'Moderately Active'}</span>
          </div>
        )}
      </div>
      {/* Stats grid */}
      <div style={{ padding:'16px 16px 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {stats.map((s,i) => (
          <div key={i} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'13px 14px' }}>
            <Lbl text={s.label} style={{ marginBottom:5 }} />
            <div style={{ fontFamily:fn, fontSize:20, fontWeight:700, color:s.color, letterSpacing:'-0.01em', lineHeight:1 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {/* Badges */}
      <div style={{ padding:'18px 16px 24px' }}>
        <div style={{ fontFamily:fn, fontSize:16, fontWeight:800, color:C.text, letterSpacing:'-0.02em', marginBottom:12 }}>Achievements</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9 }}>
          {badges.map((b,i) => (
            <div key={i} style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 8px', textAlign:'center' }}>
              <div style={{ fontSize:24, marginBottom:6 }}>{b.icon}</div>
              <div style={{ fontSize:10, color:C.sub, fontFamily:fb, fontWeight:600, letterSpacing:'0.04em', lineHeight:1.3 }}>{b.label}</div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Settings helpers (must be top-level, never inside render) ───────────────
function SettingsToggle({ on, onTap }) {
  return (
    <div onClick={onTap} style={{ width:44, height:24, borderRadius:12, background:on?C.accent:C.s4, cursor:'pointer', position:'relative', transition:'background 0.25s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, left:on?23:3, width:18, height:18, borderRadius:'50%', background:on?'#000':C.muted, transition:'left 0.25s' }} />
    </div>
  );
}
function SettingsRow({ label, sub, on, onTap }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
      <div>
        <div style={{ fontSize:14, color:C.text, fontWeight:500 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</div>}
      </div>
      <SettingsToggle on={on} onTap={onTap} />
    </div>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────────────────
function SettingsScreen({ onClose, onResetDiet, onResetWorkout }) {
  const [settings, setSettings] = useState({
    units:'kg', notifications:true, workoutReminder:true, mealReminder:false,
    darkMode:true, autoTimer:true, showMicros:true, weekStart:'Mon',
  });
  const tog = k => setSettings(s=>({...s,[k]:!s[k]}));
  const sections = [
    { title:'GENERAL', rows:[
      { label:'Weight Units', sub:'kg or lbs', custom:(
        <div style={{ display:'flex', gap:6 }}>
          {['kg','lbs'].map(u=>(
            <button key={u} onClick={()=>setSettings(s=>({...s,units:u}))} style={{ padding:'5px 14px', borderRadius:7, background:settings.units===u?C.accent:C.s4, color:settings.units===u?'#000':C.sub, border:'none', fontFamily:fb, fontWeight:700, fontSize:11, textTransform:'uppercase', cursor:'pointer' }}>{u}</button>
          ))}
        </div>
      )},
      { label:'Week Starts On', sub:'Calendar view', custom:(
        <div style={{ display:'flex', gap:6 }}>
          {['Mon','Sun'].map(d=>(
            <button key={d} onClick={()=>setSettings(s=>({...s,weekStart:d}))} style={{ padding:'5px 14px', borderRadius:7, background:settings.weekStart===d?C.accent:C.s4, color:settings.weekStart===d?'#000':C.sub, border:'none', fontFamily:fb, fontWeight:700, fontSize:11, cursor:'pointer' }}>{d}</button>
          ))}
        </div>
      )},
    ]},
    { title:'NOTIFICATIONS', rows:[
      { label:'Push Notifications', sub:'All app alerts', k:'notifications' },
      { label:'Workout Reminder', sub:'Daily at 7:00 AM', k:'workoutReminder' },
      { label:'Meal Reminder', sub:'Log food prompts', k:'mealReminder' },
    ]},
    { title:'WORKOUT', rows:[
      { label:'Auto-Start Rest Timer', sub:'Starts timer after set', k:'autoTimer' },
    ]},
    { title:'NUTRITION', rows:[
      { label:'Show Micronutrients', sub:'Vitamins & minerals panel', k:'showMicros' },
    ]},
  ];
  return (
    <ModalShell title="SETTINGS" onClose={onClose}>
      <div style={{ padding:'8px 20px 30px' }}>
        {sections.map(sec => (
          <div key={sec.title} style={{ marginBottom:24 }}>
            <div style={{ color:C.muted, fontSize:10, fontFamily:fb, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', padding:'16px 0 4px' }}>{sec.title}</div>
            {sec.rows.map((row,i) => row.k ? (
              <SettingsRow key={i} label={row.label} sub={row.sub} on={settings[row.k]} onTap={()=>tog(row.k)} />
            ) : (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:14, color:C.text, fontWeight:500 }}>{row.label}</div>
                  {row.sub && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{row.sub}</div>}
                </div>
                {row.custom}
              </div>
            ))}
          </div>
        ))}
        {/* Reset workout plan */}
        <div style={{ marginBottom:20 }}>
          <div style={{ color:C.muted, fontSize:10, fontFamily:fb, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 0 10px' }}>WORKOUT PLAN</div>
          <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontSize:14, color:C.text, fontWeight:600, marginBottom:4 }}>Reset Weekly Workout Plan</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.5 }}>Clears your current plan and lets you rebuild from scratch with new goals, days, or equipment.</div>
            <button onClick={()=>{ onResetWorkout(); onClose(); }} style={{
              width:'100%', background:C.blue+'18', border:`1px solid ${C.blue}44`, borderRadius:10,
              padding:'11px', color:C.blue, fontFamily:fn, fontWeight:700, fontSize:12,
              letterSpacing:'0.02em', cursor:'pointer',
            }}>↺ Reset &amp; Rebuild Workout</button>
          </div>
        </div>
        {/* Reconfigure diet plan */}
        <div style={{ marginBottom:20 }}>
          <div style={{ color:C.muted, fontSize:10, fontFamily:fb, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 0 10px' }}>DIET PLAN</div>
          <div style={{ background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontSize:14, color:C.text, fontWeight:500, marginBottom:4 }}>Reconfigure Nutrition Plan</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.5 }}>Reset your goal, calorie target, macro split, and dietary preferences.</div>
            <button onClick={()=>{ onResetDiet(); onClose(); }} style={{
              width:'100%', background:C.orange+'18', border:`1px solid ${C.orange}44`, borderRadius:10,
              padding:'11px', color:C.orange, fontFamily:fb, fontWeight:700, fontSize:12,
              letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
            }}>↩ Reset &amp; Reconfigure</button>
          </div>
        </div>
        <div style={{ marginTop:8, padding:'12px 14px', background:C.s2, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, color:C.muted, textAlign:'center', lineHeight:1.5 }}>MSG v1.0 · Settings auto-saved</div>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Language Screen ──────────────────────────────────────────────────────────
function LanguageScreen({ onClose }) {
  const [selected, setSelected] = useState('en-IN');
  const langs = [
    { code:'en-IN', name:'English', region:'India', native:'English' },
    { code:'hi-IN', name:'Hindi', region:'India', native:'हिन्दी' },
    { code:'en-US', name:'English', region:'United States', native:'English (US)' },
    { code:'en-GB', name:'English', region:'United Kingdom', native:'English (UK)' },
    { code:'mr-IN', name:'Marathi', region:'India', native:'मराठी' },
    { code:'gu-IN', name:'Gujarati', region:'India', native:'ગુજરાતી' },
    { code:'pa-IN', name:'Punjabi', region:'India', native:'ਪੰਜਾਬੀ' },
    { code:'ta-IN', name:'Tamil', region:'India', native:'தமிழ்' },
    { code:'te-IN', name:'Telugu', region:'India', native:'తెలుగు' },
    { code:'es-ES', name:'Spanish', region:'Spain', native:'Español' },
    { code:'fr-FR', name:'French', region:'France', native:'Français' },
    { code:'de-DE', name:'German', region:'Germany', native:'Deutsch' },
    { code:'ja-JP', name:'Japanese', region:'Japan', native:'日本語' },
    { code:'zh-CN', name:'Chinese', region:'Simplified', native:'中文(简体)' },
    { code:'ar-SA', name:'Arabic', region:'Saudi Arabia', native:'العربية' },
  ];
  const regions = [...new Set(langs.map(l=>l.region))];
  return (
    <ModalShell title="LANGUAGE" onClose={onClose}>
      <div style={{ padding:'12px 16px 30px' }}>
        <div style={{ fontSize:13, color:C.sub, marginBottom:20, lineHeight:1.5 }}>
          Select your preferred language for the app interface.
        </div>
        {regions.map(region => (
          <div key={region} style={{ marginBottom:18 }}>
            <div style={{ color:C.muted, fontSize:10, fontFamily:fb, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>{region}</div>
            {langs.filter(l=>l.region===region).map(l => (
              <button key={l.code} onClick={()=>setSelected(l.code)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', boxSizing:'border-box',
                padding:'13px 14px', marginBottom:7,
                background:selected===l.code?C.accent+'18':C.s2,
                border:`1px solid ${selected===l.code?C.accent:C.border}`,
                borderRadius:12, cursor:'pointer', textAlign:'left',
              }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color:selected===l.code?C.accent:C.text }}>{l.native}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{l.name}</div>
                </div>
                {selected===l.code && <div style={{ width:20, height:20, borderRadius:'50%', background:C.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#000', fontWeight:700, flexShrink:0 }}>✓</div>}
              </button>
            ))}
          </div>
        ))}
        <button onClick={onClose} style={{ width:'100%', background:C.accent, border:'none', borderRadius:12, padding:15, color:'#000', fontFamily:fb, fontWeight:700, fontSize:13, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', marginTop:8 }}>
          Apply Language
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Profile Dropdown ────────────────────────────────────────────────────────
function ProfileDropdown({ onClose, onNavigate, onLogout }) {
  const items = [
    { icon:'👤', label:'View Profile', sub:'Stats, achievements & goals', action:'profile' },
    { icon:'⚙️', label:'Settings', sub:'Units, notifications, preferences', action:'settings' },
    { icon:'🌐', label:'Language', sub:'English (IN) · change anytime', action:'language' },
    { icon:'🚪', label:'Logout', sub:'Sign out of MSG', action:'logout', danger:true },
  ];
  return (
    <>
      <div onClick={onClose} style={{ position:'absolute', inset:0, zIndex:49 }} />
      <div style={{ position:'absolute', top:56, right:16, zIndex:50, background:C.s2, border:`1px solid ${C.border}`, borderRadius:14, minWidth:228, overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,0.8)' }}>
        <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${C.border}`, background:C.s3 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38,height:38,borderRadius:'50%',background:C.accent,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:fn,fontSize:15,color:'#000',letterSpacing:'0.04em',flexShrink:0 }}>BS</div>
            <div>
              <div style={{ fontFamily:fn, fontSize:18, color:C.text, letterSpacing:'0.04em', lineHeight:1 }}>BHRIGU SHARMA</div>
              <div style={{ color:C.sub, fontSize:11, marginTop:3 }}>B.Tech Bioinformatics</div>
            </div>
          </div>
        </div>
        {items.map((item,i) => (
          <button key={i} onClick={()=>{ onClose(); item.action==='logout' ? onLogout() : onNavigate(item.action); }} style={{
            display:'flex', alignItems:'center', gap:12, width:'100%', padding:'13px 16px',
            background:'none', border:'none', cursor:'pointer', textAlign:'left',
            borderBottom:i<items.length-1?`1px solid ${C.border}`:'none',
          }}
          onMouseEnter={e=>e.currentTarget.style.background=C.s3}
          onMouseLeave={e=>e.currentTarget.style.background='none'}>
            <span style={{ fontSize:17 }}>{item.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:item.danger?C.red:C.text }}>{item.label}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{item.sub}</div>
            </div>
            {!item.danger && <span style={{ color:C.muted, fontSize:14 }}>›</span>}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Log Progress Modal ──────────────────────────────────────────────────────
function LogProgressModal({ onSave, onClose }) {
  const [form, setForm] = useState({ weight:'', height:'', bodyFat:'', chest:'', waist:'', arms:'', legs:'', notes:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = () => {
    const entry = {
      date: new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric'}),
      weight: parseFloat(form.weight)||0,
      height: parseFloat(form.height)||0,
      bodyFat: parseFloat(form.bodyFat)||0,
      chest: parseFloat(form.chest)||0,
      waist: parseFloat(form.waist)||0,
      arms: parseFloat(form.arms)||0,
      legs: parseFloat(form.legs)||0,
      notes: form.notes,
    };
    onSave(entry);
    onClose();
  };

  return (
    <div style={{ position:'absolute', inset:0, zIndex:100, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'flex-end' }}>
      <div style={{ width:'100%', background:C.s1, borderRadius:'20px 20px 0 0', padding:'20px 20px 30px', maxHeight:'88%', overflowY:'auto', boxSizing:'border-box' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:fn, fontSize:22, fontWeight:800, color:C.text, letterSpacing:'-0.02em' }}>Log Progress</div>
          <button onClick={onClose} style={{ background:C.s3, border:'none', width:32, height:32, borderRadius:'50%', color:C.sub, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
          {[{l:'Weight (kg)',k:'weight',p:'72.5'},{l:'Height (cm)',k:'height',p:'175'},{l:'Body Fat %',k:'bodyFat',p:'17.2'}].map(f => (
            <div key={f.k}>
              <Lbl text={f.l} style={{marginBottom:7}} />
              <input type="number" value={form[f.k]} onChange={e=>set(f.k,e.target.value)} placeholder={f.p}
                style={{ width:'100%', boxSizing:'border-box', background:C.s2, border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 10px', color:C.text, fontSize:14, fontFamily:fn, outline:'none' }} />
            </div>
          ))}
        </div>

        <Lbl text="Measurements (cm)" style={{marginBottom:10}} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {['chest','waist','arms','legs'].map(k => (
            <div key={k}>
              <div style={{ color:C.muted, fontSize:10, fontFamily:fb, fontWeight:700, textTransform:'capitalize', letterSpacing:'0.06em', marginBottom:5 }}>{k}</div>
              <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="cm"
                style={{ width:'100%', boxSizing:'border-box', background:C.s2, border:`1px solid ${C.border}`, borderRadius:10, padding:'11px 12px', color:C.text, fontSize:14, fontFamily:fn, outline:'none' }} />
            </div>
          ))}
        </div>

        <Lbl text="Notes (optional)" style={{marginBottom:8}} />
        <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="How are you feeling today? Any PRs?" rows={2}
          style={{ width:'100%', boxSizing:'border-box', background:C.s2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', color:C.text, fontSize:13, fontFamily:fn, outline:'none', resize:'none', marginBottom:18 }} />

        <button onClick={save} disabled={!form.weight} style={{
          width:'100%', background:form.weight?C.accent:C.s4, color:form.weight?'#000':C.muted,
          border:'none', borderRadius:12, padding:15, fontSize:13, fontFamily:fn, fontWeight:700,
          letterSpacing:'0.02em', cursor:form.weight?'pointer':'not-allowed',
        }}>Save Entry</button>
      </div>
    </div>
  );
}

// ─── Bottom Nav ──────────────────────────────────────────────────────────────
function NavIcon({ id, active }) {
  const s = active ? C.accent : C.muted;
  const p = { width:20, height:20, viewBox:'0 0 24 24', fill:'none', stroke:s, strokeWidth:'1.8', strokeLinecap:'round', strokeLinejoin:'round' };
  if (id === 'home')     return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  if (id === 'workout')  return <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
  if (id === 'diet')     return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M8 6s1 2 4 2 4-2 4-2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="9" y1="12" x2="15" y2="12"/></svg>;
  if (id === 'explore')  return <svg {...p}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
  if (id === 'progress') return <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
  return null;
}

function BottomNav({ tab, setTab }) {
  const tabs = ['home','workout','diet','explore','progress'];
  return (
    <div style={{ background:C.s1, borderTop:`1px solid ${C.border}`, display:'flex', padding:'10px 0 18px', flexShrink:0, paddingBottom:'max(18px, env(safe-area-inset-bottom))' }}>
      {tabs.map(id => (
        <button key={id} onClick={()=>setTab(id)} style={{ flex:1, background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'2px 0' }}>
          <NavIcon id={id} active={tab===id} />
          <div style={{ fontSize:8, fontFamily:fb, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:tab===id?C.accent:C.muted }}>{id}</div>
          {tab===id && <div style={{ width:3, height:3, borderRadius:'50%', background:C.accent, marginTop:-2 }} />}
        </button>
      ))}
    </div>
  );
}

// ─── App Root ────────────────────────────────────────────────────────────────
export default function MSG() {
  const [tab, setTab] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [profileScreen, setProfileScreen] = useState(null);
  const [loggedIn, setLoggedIn] = useState(true);
  const [dietGoal, setDietGoal] = useState(null);
  const [mealLog, setMealLog] = useState(DEF_MEALS);
  const [weekPlan, setWeekPlan] = useState(null);   // persists across tab switches
  const [progressLogs, setProgressLogs] = useState(() => [
    { date:'Feb 7',  weight:74.2, bodyFat:18.5, chest:96,   waist:82,   arms:35,   legs:55,   notes:'' },
    { date:'Feb 14', weight:73.8, bodyFat:18.1, chest:96.5, waist:81,   arms:35.5, legs:55,   notes:'Feeling more energy' },
    { date:'Feb 21', weight:73.5, bodyFat:17.8, chest:97,   waist:80.5, arms:36,   legs:55.5, notes:'' },
    { date:'Feb 28', weight:73.1, bodyFat:17.4, chest:97,   waist:80,   arms:36,   legs:56,   notes:'Sleep getting better' },
    { date:'Mar 7',  weight:72.8, bodyFat:17.1, chest:97.5, waist:79,   arms:36.5, legs:56,   notes:'' },
    { date:'Mar 14', weight:72.5, bodyFat:16.8, chest:98,   waist:78.5, arms:37,   legs:56.5, notes:'PR on bench today 🔥' },
  ]);

  useEffect(() => {
    if (!document.getElementById('msg-gf')) {
      const link = document.createElement('link');
      link.id='msg-gf'; link.rel='stylesheet';
      link.href='https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('msg-global-css')) {
      const style = document.createElement('style');
      style.id = 'msg-global-css';
      style.textContent = `
        html { height: -webkit-fill-available; }
        body { min-height: -webkit-fill-available; overscroll-behavior: none; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        .msg-scroll { overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
        .msg-bottom-nav { padding-bottom: env(safe-area-inset-bottom, 0px) !important; }
        @supports (height: 100dvh) { .msg-root { height: 100dvh !important; } }
        @supports not (height: 100dvh) { .msg-root { height: 100vh !important; height: -webkit-fill-available !important; } }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleLogout = () => {
    setLoggedIn(false);
    setShowProfile(false);
    setProfileScreen(null);
    setTab('home');
    setMealLog(DEF_MEALS);
    setProgressLogs(DEF_LOGS);
    setDietGoal(null);
  };

  const handleLogin = () => setLoggedIn(true);

  // Logged-out screen
  if (!loggedIn) {
    return (
      <div style={{ position:'relative', background:C.bg, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', flexDirection:'column', height:'100dvh', maxWidth:430, margin:'0 auto', alignItems:'center', justifyContent:'center', padding:'0 28px', boxSizing:'border-box' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontFamily:fn, fontSize:64, fontWeight:800, color:C.accent, letterSpacing:'-0.03em', lineHeight:1 }}>MSG</div>
          <div style={{ fontFamily:fn, fontSize:11, fontWeight:700, letterSpacing:'0.2em', color:C.muted, textTransform:'uppercase', marginTop:6 }}>My Smart Gains</div>
          <div style={{ color:C.sub, fontSize:13, marginTop:10, lineHeight:1.5 }}>Train smart. Eat right. Track everything.</div>
        </div>
        <div style={{ width:'100%', background:C.s2, border:`1px solid ${C.border}`, borderRadius:16, padding:'24px 20px', marginBottom:16 }}>
          {['Email','Password'].map(f => (
            <div key={f} style={{ marginBottom:14 }}>
              <Lbl text={f} style={{marginBottom:7}} />
              <input type={f==='Password'?'password':'email'} placeholder={f==='Email'?'bhrigu@email.com':'••••••••'}
                style={{ width:'100%', boxSizing:'border-box', background:C.s3, border:`1px solid ${C.border}`, borderRadius:10, padding:'13px 14px', color:C.text, fontSize:14, fontFamily:'Barlow,sans-serif', outline:'none' }} />
            </div>
          ))}
          <button onClick={handleLogin} style={{ width:'100%', background:C.accent, border:'none', borderRadius:12, padding:15, color:'#000', fontFamily:fb, fontWeight:700, fontSize:13, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', marginTop:4 }}>
            Sign In
          </button>
        </div>
        <div style={{ color:C.muted, fontSize:12 }}>Don't have an account? <span style={{color:C.accent,cursor:'pointer'}} onClick={handleLogin}>Sign up free</span></div>
      </div>
    );
  }

  const views = {
    home: <HomeSection mealLog={mealLog} progressLogs={progressLogs} dietGoal={dietGoal} onLogClick={()=>setShowLogModal(true)} />,
    workout: <WorkoutSection weekPlan={weekPlan} setWeekPlan={setWeekPlan} />,
    diet: <DietSection dietGoal={dietGoal} setDietGoal={setDietGoal} mealLog={mealLog} setMealLog={setMealLog} />,
    explore: <ExploreSection />,
    progress: <ProgressSection logs={progressLogs} onLogClick={()=>setShowLogModal(true)} onDelete={i=>setProgressLogs(l=>l.filter((_,j)=>j!==i))} />,
  };

  return (
    <div className="msg-root" style={{ position:'relative', background:C.bg, color:C.text, fontFamily:"'Plus Jakarta Sans',sans-serif", display:'flex', flexDirection:'column', height:'100dvh', maxWidth:430, margin:'0 auto', overflow:'hidden' }}>
      {/* Top bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px 0', flexShrink:0, zIndex:10 }}>
        <div style={{ display:'flex', flexDirection:'column', lineHeight:1 }}>
          <div style={{ fontFamily:fn, fontSize:20, fontWeight:800, letterSpacing:'-0.01em', color:C.accent }}>MSG</div>
          <div style={{ fontFamily:fn, fontSize:8.5, fontWeight:600, letterSpacing:'0.12em', color:C.muted, textTransform:'uppercase', marginTop:1 }}>My Smart Gains</div>
        </div>
        <button onClick={()=>setShowProfile(p=>!p)} style={{
          width:36, height:36, borderRadius:'50%', background:C.accent,
          border:`2px solid ${showProfile?C.text:'transparent'}`, cursor:'pointer',
          fontFamily:fn, fontSize:13, color:'#000', letterSpacing:'0.04em', transition:'border 0.2s',
        }}>BS</button>
      </div>

      {showProfile && (
        <ProfileDropdown
          onClose={()=>setShowProfile(false)}
          onNavigate={screen=>{ setProfileScreen(screen); }}
          onLogout={handleLogout}
        />
      )}

      {showLogModal && <LogProgressModal onSave={e=>setProgressLogs(l=>[...l,e])} onClose={()=>setShowLogModal(false)} />}

      {/* Profile sub-screens rendered as overlays */}
      {profileScreen==='profile' && <ProfileScreen onClose={()=>setProfileScreen(null)} progressLogs={progressLogs} dietGoal={dietGoal} />}
      {profileScreen==='settings' && <SettingsScreen onClose={()=>setProfileScreen(null)} onResetDiet={()=>setDietGoal(null)} onResetWorkout={()=>setWeekPlan(null)} />}
      {profileScreen==='language' && <LanguageScreen onClose={()=>setProfileScreen(null)} />}

      <div className="msg-scroll" style={{ flex:1, overflowY:'auto' }}>
        {views[tab]}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
