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
- Owner Dashboard: 6 tabs (Overview, Members, Alerts, Attendance, CSV Import, Settings)
- Firestore multi-tenant security rules
- MemberApp: workout (WGER), nutrition (USDA), progress, check-in
- Android Capacitor build with ErrorBoundary + back nav

## What's MISSING ❌ (in priority order)
1. Engagement score engine — scores exist in Firestore but are NEVER computed
   Formula: workout+10, diet+5, progress+8, checkin+3 | cap=100 | 30-day rolling
2. Razorpay payment integration (subscription screen is mocked)
3. TrainerView.jsx — empty stub, needs building
4. Member profile/stats page (own score, streak, history)
5. QR code gym join
6. BUG: GymSettingsTab.jsx line 33 — useState used instead of useEffect

## Known Technical Debt
- MemberApp.jsx is 221KB single file — needs splitting
- No loading states on tab switch in OwnerDashboard
- No error handling UI in owner tabs
- No Firestore composite index for activityLogs queries

## Agent Rules
- Always git pull before starting work
- Always git commit + push after finishing
- Gemini CLI owns: Owner dashboard, Firestore rules, web PWA
- Claude Code owns: MemberApp split, engagement engine, Android
- Never edit the same file in two agents without committing first
