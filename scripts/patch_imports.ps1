param()
$base = "d:\AI_Project\msg-app\src"
$memberDir = "$base\member"

function GetContent($file) {
    return Get-Content (Join-Path $memberDir $file) -Encoding UTF8 -Raw
}

# ── 1. HomeSection.jsx ─────────────────────────────────────────────────────
$homeHeader = @"
import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';
import AttendanceButton from '../sections/AttendanceButton.jsx';
import { BASE_DRI, API_URL, callClaude } from './memberData.js';
import { parseLogDate, getWeekStart, calcStreak, getThisWeekActivity, getTodayDowIndex, ChartTip } from './utils.js';
import { Card, Tag, Lbl, Hd, NRow } from './primitives.jsx';

"@
$homeBody = GetContent "HomeSection.jsx"
($homeHeader + $homeBody) | Set-Content (Join-Path $memberDir "HomeSection.jsx") -Encoding UTF8
Write-Host "HomeSection.jsx patched"

# ── 2. WorkoutSection.jsx ─────────────────────────────────────────────────
$workoutHeader = @"
import { useState, useEffect, useRef } from 'react';
import { C, fn, fb, MC } from '../shared/theme.js';
import { AnatomicalFigure } from '../AnatomicalFigure';
import { API_URL, callClaude } from './memberData.js';
import { Card, Tag, Lbl, Hd, ExCard } from './primitives.jsx';

// EX array is inlined below via WorkoutSection.jsx extraction — do not import
"@
$workoutBody = GetContent "WorkoutSection.jsx"
($workoutHeader + $workoutBody) | Set-Content (Join-Path $memberDir "WorkoutSection.jsx") -Encoding UTF8
Write-Host "WorkoutSection.jsx patched"

# ── 3. DietSection.jsx ─────────────────────────────────────────────────────
$dietHeader = @"
import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { BASE_DRI, NMETA, DEF_MEALS, API_URL, callClaude } from './memberData.js';
import { Card, Tag, Lbl, Hd, NRow } from './primitives.jsx';

"@
$dietBody = GetContent "DietSection.jsx"
($dietHeader + $dietBody) | Set-Content (Join-Path $memberDir "DietSection.jsx") -Encoding UTF8
Write-Host "DietSection.jsx patched"

# ── 4. StoreSection.jsx ─────────────────────────────────────────────────────
$storeHeader = @"
import { useState, useEffect } from 'react';
import { C, fn, fb, MC } from '../shared/theme.js';
import { AnatomicalFigure } from '../AnatomicalFigure';
import { Card, Tag, Lbl } from './primitives.jsx';

"@
$storeBody = GetContent "StoreSection.jsx"
($storeHeader + $storeBody) | Set-Content (Join-Path $memberDir "StoreSection.jsx") -Encoding UTF8
Write-Host "StoreSection.jsx patched"

# ── 5. ProgressSection.jsx ─────────────────────────────────────────────────
$progressHeader = @"
import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { C, fn, fb } from '../shared/theme.js';
import { ChartTip } from './utils.js';
import { Card, Tag } from './primitives.jsx';

"@
$progressBody = GetContent "ProgressSection.jsx"
($progressHeader + $progressBody) | Set-Content (Join-Path $memberDir "ProgressSection.jsx") -Encoding UTF8
Write-Host "ProgressSection.jsx patched"

# ── 6. ProfileScreen.jsx ─────────────────────────────────────────────────────
$profileHeader = @"
import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';
import { Card, Lbl, Hd } from './primitives.jsx';

"@
$profileBody = GetContent "ProfileScreen.jsx"
($profileHeader + $profileBody) | Set-Content (Join-Path $memberDir "ProfileScreen.jsx") -Encoding UTF8
Write-Host "ProfileScreen.jsx patched"

# ── 7. SettingsScreen.jsx ─────────────────────────────────────────────────────
$settingsHeader = @"
import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card, Lbl } from './primitives.jsx';

"@
$settingsBody = GetContent "SettingsScreen.jsx"
($settingsHeader + $settingsBody) | Set-Content (Join-Path $memberDir "SettingsScreen.jsx") -Encoding UTF8
Write-Host "SettingsScreen.jsx patched"

# ── 8. Navigation.jsx ─────────────────────────────────────────────────────────
$navHeader = @"
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';

"@
$navBody = GetContent "Navigation.jsx"
($navHeader + $navBody) | Set-Content (Join-Path $memberDir "Navigation.jsx") -Encoding UTF8
Write-Host "Navigation.jsx patched"

# ── 9. ProfileSetupScreen.jsx ────────────────────────────────────────────────
$setupHeader = @"
import { useState } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { Card } from './primitives.jsx';

"@
$setupBody = GetContent "ProfileSetupScreen.jsx"
($setupHeader + $setupBody) | Set-Content (Join-Path $memberDir "ProfileSetupScreen.jsx") -Encoding UTF8
Write-Host "ProfileSetupScreen.jsx patched"

# ── 10. utils.js ─────────────────────────────────────────────────────────────
$utilHeader = @"
import { C } from '../shared/theme.js';

"@
$utilBody = GetContent "utils.js"
($utilHeader + $utilBody) | Set-Content (Join-Path $memberDir "utils.js") -Encoding UTF8
Write-Host "utils.js patched"

# ── 11. primitives.jsx ─────────────────────────────────────────────────────────
$primHeader = @"
import { useState, useEffect, useRef } from 'react';
import { MC, C, fn, fb } from '../shared/theme.js';

"@
$primBody = GetContent "primitives.jsx"
($primHeader + $primBody) | Set-Content (Join-Path $memberDir "primitives.jsx") -Encoding UTF8
Write-Host "primitives.jsx patched"

Write-Host "All files patched with imports!"
