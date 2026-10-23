# MSG — My Smart Gains (Gym SaaS)

## Project Overview
React + Vite PWA + Android (Capacitor). Multi-tenant gym SaaS.
Firebase project: msg2-3da02. Stack: Firebase Auth + Firestore, Capacitor.
Workspace: d:\AI_Project\msg-app (WSL: /mnt/d/AI_Project/msg-app)

## Role Routing (App.jsx)
- No user → LoginScreen
- No gymId → GymOnboarding  
- role=owner → OwnerDashboard
- role=trainer → TrainerView (STUB — empty)
- default → MemberApp

## Firestore Schema
gyms/{gymId}             → name, ownerUid, gymCode, plan, settings
users/{uid}              → uid, name, email, role, gymId, lastActiveAt
members/{gymId_uid}      → uid, gymId, name, email, status, engagementScore
attendance/{gymId}/logs  → uid, gymId, date, checkedInAt
activityLogs/{gymId}/events → uid, gymId, type, points, timestamp

## What's DONE ✅
- Firebase Auth (Email + Google OAuth, native Android)
- Role-based router, Gym create/join (6-char code)
- Owner Dashboard: Overview, Members, Alerts, Attendance, CSV Import, Settings (with loading, empty, error/retry states)
- Firestore multi-tenant security rules (tamper-resistant engagement scores, trainer scoping)
- MemberApp: workout (WGER), nutrition (USDA), progress, check-in, lean orchestrator split
- Android Capacitor build with ErrorBoundary + back nav
- Razorpay payment integration (subscription screen is mocked)
- Member profile/stats page (own score, streak, history)
- QR code gym join
- FIXED: GymSettingsTab.jsx line 134 gymName sync effect bug
- Production TrainerView.jsx: assigned squad, dashboard KPIs, roster search/filter, follow-ups, chat, member detail & coaching notes
- Rebuilt Engagement Scoring Engine: 28-day rolling window, 4 pillars (Consistency 30, Workouts 30, Habits 25, Recency 15), tamper-resistant Cloud Functions v2 + Admin SDK
- Automated daily score decay and activity event trigger functions

## What's MISSING ❌ (in priority order)
- None (Core product MVP & trainer experience fully built)

## Known Technical Debt
- MemberApp split completed into src/member/ sections; keep monitoring bundle chunk sizes.

## Agent Rules
- Always git pull before starting work
- Always git commit + push after finishing
- Gemini CLI owns: Owner dashboard, Firestore rules, web PWA
- Claude Code owns: MemberApp split, engagement engine, Android
- Never edit the same file in two agents without committing first
