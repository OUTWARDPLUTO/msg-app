import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/functions';

// Expose on window for backwards compatibility with any window.firebase references
if (typeof window !== 'undefined') {
  window.firebase = firebase;
}

// ─── Firebase Config ──────────────────────────────────────────────────────────
export const FB_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "msg2-3da02.firebaseapp.com",
  projectId: "msg2-3da02",
  storageBucket: "msg2-3da02.firebasestorage.app",
  messagingSenderId: "924373588150",
  appId: "1:924373588150:web:c1c7c3739509f44a112e17",
  measurementId: "G-N9K2PZHYCH",
};

function ensureApp() {
  if (!firebase.apps.length) {
    firebase.initializeApp(FB_CONFIG);
  }
  return firebase.app();
}

// ─── Firebase Auth ────────────────────────────────────────────────────────────
let _fbAuth = null;

export async function getFBAuth() {
  if (_fbAuth) return _fbAuth;
  ensureApp();
  _fbAuth = firebase.auth();
  return _fbAuth;
}

// ─── Firestore ────────────────────────────────────────────────────────────────
// Schema / Collections Reference:
//
// gyms/{gymId}/store_products/{productId}
//   → name (string), description (string), price (number), category (string), imageUrl (string), inStock (boolean), createdAt (timestamp), updatedAt (timestamp)
//
// gyms/{gymId}/membership_plans/{planId}
//   → name (string), description (string), price (number), durationDays (number), features (string[]), isActive (boolean), createdAt (timestamp), updatedAt (timestamp)
//
// members/{gymId_uid} (new fields added)
//   → membershipPlanId (string), membershipPlanName (string), membershipStartDate (timestamp), membershipEndDate (timestamp), membershipStatus (string), updatedAt (timestamp)
//
let _db = null;
let _persistenceInitialized = false;

export async function getFBFirestore() {
  if (_db) return _db;
  ensureApp();
  _db = firebase.firestore();

  if (!_persistenceInitialized) {
    _persistenceInitialized = true;
    // Enable offline persistence non-blocking
    _db.enablePersistence({ synchronizeTabs: false }).catch(persistErr => {
      console.warn('[MSG] Persistence unavailable:', persistErr.code);
    });
  }

  return _db;
}

// ─── Server Timestamp Helper ──────────────────────────────────────────────────
export function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}


// ─── Gym Code Generator ───────────────────────────────────────────────────────
export function generateGymCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── User Document Helpers ────────────────────────────────────────────────────
export async function getUserDoc(uid) {
  const db = await getFBFirestore();
  const snap = await db.doc(`users/${uid}`).get();
  return snap.exists ? snap.data() : null;
}

export async function setUserDoc(uid, data, merge = true) {
  const db = await getFBFirestore();
  await db.doc(`users/${uid}`).set(data, { merge });
}

export async function updateUserDoc(uid, data) {
  const db = await getFBFirestore();
  await db.doc(`users/${uid}`).update({ ...data, updatedAt: serverTimestamp() });
}

// ─── Subscription Helpers ─────────────────────────────────────────────────────
export async function saveSubscription(uid, subData) {
  const db = await getFBFirestore();
  await db.doc(`users/${uid}`).set({ subscription: subData }, { merge: true });
}

export async function checkSubscription(uid) {
  try {
    const doc = await getUserDoc(uid);
    const sub = doc?.subscription;
    if (!sub) return { active: false };
    if (sub.status !== 'active') return { active: false };
    if (sub.expiresAt && sub.expiresAt < Date.now()) return { active: false, expired: true };
    return { active: true, plan: sub.plan, expiresAt: sub.expiresAt };
  } catch { return { active: false }; }
}

// ─── Gym Document Helpers ─────────────────────────────────────────────────────
export async function getGymByCode(gymCode) {
  const db = await getFBFirestore();
  const snap = await db.collection('gyms').where('gymCode', '==', gymCode.toUpperCase()).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function createGym(ownerUid, gymName) {
  const db = await getFBFirestore();
  const ref = db.collection('gyms').doc();
  const gymData = {
    name: gymName,
    ownerUid,
    gymCode: null, // Assigned after payment
    plan: 'free', // Will be updated on payment
    createdAt: serverTimestamp(),
    settings: { inactivityThresholdDays: 5 },
  };
  await ref.set(gymData);
  return { id: ref.id, ...gymData };
}

export async function findGymByOwnerUid(uid) {
  try {
    const db = await getFBFirestore();
    const snap = await db.collection('gyms').where('ownerUid', '==', uid).limit(1).get();
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  } catch (err) {
    console.warn('[MSG Auth] findGymByOwnerUid check skipped:', err.message);
  }
  return null;
}

export async function findMemberRecordsByUid(uid) {
  try {
    const db = await getFBFirestore();
    const snap = await db.collection('members').where('uid', '==', uid).limit(1).get();
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  } catch (err) {
    console.warn('[MSG Auth] findMemberRecordsByUid check skipped:', err.message);
  }
  return null;
}

// ─── Member Document Helpers ──────────────────────────────────────────────────
export async function createMemberDoc(gymId, uid, data) {
  const db = await getFBFirestore();
  await db.doc(`members/${gymId}_${uid}`).set({
    uid, gymId, ...data,
    status: 'active',
    engagementScore: 0,
    joinedAt: serverTimestamp(),
  });
}

export async function getGymMembers(gymId) {
  const db = await getFBFirestore();
  const snap = await db.collection('members').where('gymId', '==', gymId).orderBy('joinedAt', 'desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

import { toWeekKey, computeEngagementScore } from './engagementScore.js';

// ─── Engagement & Activity Logs ───────────────────────────────────────────────
const ACTIVITY_POINTS = { workout: 10, diet: 5, progress: 8, checkin: 3 };

export async function trackActivity(uid, gymId, type) {
  if (!uid || !gymId) return;
  if (uid === 'demo' || gymId === 'demo-gym') return; // skip Firestore in demo mode
  try {
    const db = await getFBFirestore();
    const ts = serverTimestamp();

    // Deterministic, deduplicated activity doc ID:
    // workout, diet, checkin: maximum once per member/day
    // progress: maximum once per member/week
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const weekKey = toWeekKey(now);
    const eventId = type === 'progress'
      ? `progress_${uid}_${weekKey}`
      : `${type}_${uid}_${dateKey}`;

    // Write activity event with deterministic ID to prevent button-mashing inflation
    await db.collection(`activityLogs/${gymId}/events`).doc(eventId).set({
      uid, gymId, type,
      points: ACTIVITY_POINTS[type] || 1,
      timestamp: ts,
      dateKey: type === 'progress' ? weekKey : dateKey,
    }, { merge: true });

    // Update lastActiveAt on user doc and reset inactivity notification state
    await db.doc(`users/${uid}`).update({
      lastActiveAt: ts,
      inactivity: {
        lastNotifiedAt: null,
        notifCountThisMonth: 0,
        resetAt: ts,
      },
    }).catch(() => {});

    // Note: engagementScore calculation is authoritative in Cloud Functions v2
    // (onActivityLogged & scheduledDailyEngagementDecay). Clients do not write score fields.
  } catch (err) {
    console.warn('[MSG] trackActivity failed (offline?):', err.message);
  }
}

export function calcEngagementScore(events, options = {}) {
  const res = computeEngagementScore(events, options);
  return res.score;
}

export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export async function checkIn(uid, gymId, qrToken = null) {
  if (!uid || !gymId) return { error: 'Missing uid or gymId' };
  try {
    const db = await getFBFirestore();
    
    // Load gym settings first to check validation rules
    const gymSnap = await db.doc(`gyms/${gymId}`).get();
    if (!gymSnap.exists) return { error: 'Gym not found' };
    const gymData = gymSnap.data();
    const settings = gymData.settings || {};
    
    // Validate QR code if enabled
    if (settings.useQr) {
      if (!qrToken) {
        return { error: 'QR Code verification is required for this gym.' };
      }
      const isStaticMatch = settings.useStaticQr && qrToken === `static_${gymId}`;
      if (!isStaticMatch) {
        const activeQr = gymData.activeQrToken;
        if (!activeQr || !activeQr.token || activeQr.token !== qrToken) {
          return { error: 'Invalid QR Code. Please scan the current code displayed at reception.' };
        }
        const expiresAt = activeQr.expiresAt?.toDate ? activeQr.expiresAt.toDate().getTime() : new Date(activeQr.expiresAt).getTime();
        if (Date.now() > expiresAt) {
          return { error: 'QR Code has expired. Please scan the new code displayed at reception.' };
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await db.collection(`attendance/${gymId}/logs`)
      .where('uid', '==', uid).where('date', '==', today).get();
    if (!existing.empty) return { alreadyCheckedIn: true };
    await db.collection(`attendance/${gymId}/logs`).add({
      uid, gymId, date: today, checkedInAt: serverTimestamp(),
    });
    await trackActivity(uid, gymId, 'checkin');
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

export async function getTodayCheckIn(uid, gymId) {
  if (!uid || !gymId) return false;
  try {
    const db = await getFBFirestore();
    const today = new Date().toISOString().split('T')[0];
    const snap = await db.collection(`attendance/${gymId}/logs`)
      .where('uid', '==', uid).where('date', '==', today).get();
    return !snap.empty;
  } catch { return false; }
}

// ─── CSV Import ───────────────────────────────────────────────────────────────
export function parseCSV(text) {
  // Strip BOM and normalize line endings
  const cleanText = (text || '').replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split(/\r\n|\r|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };
  
  const parseLine = (line) => {
    // Split by comma, ignoring commas inside double quotes
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const cols = parseLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] || '']));
  });
  return { headers, rows };
}

export async function importMembersFromCSV(gymId, mappedRows) {
  const db = await getFBFirestore();
  const ts = serverTimestamp();
  const BATCH_SIZE = 400; // Firestore batch limit is 500
  for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = mappedRows.slice(i, i + BATCH_SIZE);
    slice.forEach(({ name, email, phone }) => {
      const tempId = `imported_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const ref = db.doc(`members/${gymId}_${tempId}`);
      batch.set(ref, {
        uid: tempId, gymId, name: name || 'Unknown',
        email: email || '', phone: phone || '',
        role: 'member', status: 'active',
        engagementScore: 0, joinedAt: ts, importedAt: ts,
      });
    });
    await batch.commit();
  }
}

// ─── Firebase Storage ─────────────────────────────────────────────────────────
let _storage = null;

export async function getFBStorage() {
  if (_storage) return _storage;
  ensureApp();
  _storage = firebase.storage();
  return _storage;
}

export async function uploadFile(path, file) {
  const storage = await getFBStorage();
  const ref = storage.ref(path);
  const snap = await ref.put(file);
  return await snap.ref.getDownloadURL();
}


