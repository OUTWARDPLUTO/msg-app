# Extract sections from MemberApp.jsx into src/member/
$src = "d:\AI_Project\msg-app\src\MemberApp.jsx"
$dest = "d:\AI_Project\msg-app\src\member"

$lines = Get-Content $src -Encoding UTF8

function WriteSection($name, $start, $end) {
  $slice = $lines[($start-1)..($end-1)]
  $outPath = Join-Path $dest $name
  $slice | Set-Content $outPath -Encoding UTF8
  Write-Host "Written $name ($($slice.Count) lines)"
}

# Ranges (1-indexed, inclusive)
# Constants: EX array, nutrition data, AI function — lines 1-541
WriteSection "constants.js"    1    541

# Primitives (Card, Tag, Lbl, Hd, NRow, ExCard) — 543-716
WriteSection "primitives.jsx"  543  716

# Utility functions (parseLogDate, getWeekStart, calcStreak, getThisWeekActivity, getTodayDowIndex, ChartTip) — 718-787
WriteSection "utils.js"        718  787

# HomeSection — 790-1176
WriteSection "HomeSection.jsx" 790  1176

# WorkoutSection (WarmupBlock constants + WarmupBlock + ManualPlanBuilder + ExerciseConfirmCard + WorkoutSection) — 1178-2110
WriteSection "WorkoutSection.jsx" 1178 2110

# DietSection (MealCard + DietOnboarding + WaterTracker + DietSection) — 2112-2916
WriteSection "DietSection.jsx" 2112 2916

# StoreSection (AttendanceHeatMap + PAYMENT_METHODS + StoreSection + ProductDetailSheet + MembershipCard + PlansBottomSheet + ExploreSection) — 2918-3653
WriteSection "StoreSection.jsx" 2918 3653

# ProgressSection — 3658-3817
WriteSection "ProgressSection.jsx" 3658 3817

# ProfileScreen (ModalShell + ProfileScreen) — 3819-4212
WriteSection "ProfileScreen.jsx" 3819 4212

# SettingsScreen (SettingsToggle + SettingsRow + NotificationSettings + SettingsScreen + LanguageScreen) — 4214-4612
WriteSection "SettingsScreen.jsx" 4214 4612

# Navigation & Modals (ProfileDropdown + LogProgressModal + NavIcon + BottomNavAnimated) — 4614-4795
WriteSection "Navigation.jsx" 4614 4795

# Onboarding & Tutorial (ProfileSetupScreen + TUTORIAL_STEPS + TutorialOverlay) — 4797-5073
WriteSection "ProfileSetupScreen.jsx" 4797 5073

# MemberApp main orchestrator — 5075-5256
WriteSection "MemberApp.inner.jsx" 5075 5256

Write-Host "Done! All sections extracted."
