// ─── Firebase Config ──────────────────────────────────────────────────────────
export const FB_CONFIG = {
  apiKey: "AIzaSyDhFd7sd_qioRmGoWgOkJweDkvqgMUKznE",
  authDomain: "msg2-3da02.firebaseapp.com",
  projectId: "msg2-3da02",
  storageBucket: "msg2-3da02.firebasestorage.app",
  messagingSenderId: "924373588150",
  appId: "1:924373588150:web:c1c7c3739509f44a112e17",
  measurementId: "G-N9K2PZHYCH",
};

// ─── Script Loader ────────────────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = res;
    s.onerror = () => rej(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

function pollFor(getter, timeout = 5000) {
  return new Promise((res, rej) => {
    const start = Date.now();
    const t = setInterval(() => {
      if (getter()) { clearInterval(t); res(); }
      if (Date.now() - start > timeout) { clearInterval(t); rej(new Error('Firebase SDK timeout')); }
    }, 100);
  });
}

function ensureApp() {
  if (!window.firebase.apps?.length) window.firebase.initializeApp(FB_CONFIG);
}

// ─── Firebase Auth ────────────────────────────────────────────────────────────
let _fbAuth = null;
let _fbAuthLoading = false;
let _fbAuthCallbacks = [];

export async function getFBAuth() {
  if (_fbAuth) return _fbAuth;
  if (_fbAuthLoading) return new Promise((res, rej) => _fbAuthCallbacks.push({ res, rej }));
  _fbAuthLoading = true;
  try {
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
    await pollFor(() => window.firebase?.app);
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js');
    await pollFor(() => window.firebase?.auth);
    ensureApp();
    _fbAuth = window.firebase.auth();
    _fbAuthCallbacks.forEach(cb => cb.res(_fbAuth));
    return _fbAuth;
  } catch (err) {
    _fbAuthCallbacks.forEach(cb => cb.rej(err));
    _fbAuthLoading = false; _fbAuth = null;
    throw err;
  }
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
let _dbLoading = false;
let _dbCallbacks = [];

export async function getFBFirestore() {
  if (_db) return _db;
  if (_dbLoading) return new Promise((res, rej) => _dbCallbacks.push({ res, rej }));
  _dbLoading = true;
  try {
    // Auth compat must be loaded first (loads firebase-app-compat)
    await getFBAuth();
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js');
    await pollFor(() => window.firebase?.firestore);
    ensureApp();
    _db = window.firebase.firestore();
    // Enable offline persistence — MUST assign _db first before this attempt
    // failed-precondition = multiple tabs, unimplemented = WebView doesn't support it
    // Either way we swallow the error and continue — app works online-only
    try { await _db.enablePersistence({ synchronizeTabs: false }); } catch (persistErr) {
      console.warn('[MSG] Persistence unavailable:', persistErr.code);
    }

    _dbCallbacks.forEach(cb => cb.res(_db));
    return _db;
  } catch (err) {
    _dbCallbacks.forEach(cb => cb.rej(err));
    _dbLoading = false; _db = null;
    throw err;
  }
}

// ─── Server Timestamp Helper ──────────────────────────────────────────────────
export function serverTimestamp() {
  return window.firebase.firestore.FieldValue.serverTimestamp();
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
  const gymCode = generateGymCode();
  const ref = db.collection('gyms').doc();
  const gymData = {
    name: gymName,
    ownerUid,
    gymCode,
    plan: 'free',
    createdAt: serverTimestamp(),
    settings: { inactivityThresholdDays: 5 },
  };
  await ref.set(gymData);
  return { id: ref.id, ...gymData };
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

// ─── Engagement & Activity Logs ───────────────────────────────────────────────
const ACTIVITY_POINTS = { workout: 10, diet: 5, progress: 8, checkin: 3 };

export async function trackActivity(uid, gymId, type) {
  if (!uid || !gymId) return;
  if (uid === 'demo' || gymId === 'demo-gym') return; // skip Firestore in demo mode
  try {
    const db = await getFBFirestore();
    const ts = serverTimestamp();
    // Write activity event
    await db.collection(`activityLogs/${gymId}/events`).add({
      uid, gymId, type,
      points: ACTIVITY_POINTS[type] || 1,
      timestamp: ts,
    });
    // Update lastActiveAt on user doc
    await db.doc(`users/${uid}`).update({ lastActiveAt: ts }).catch(() => {});
    // Recalculate + store engagement score
    await recalculateEngagement(uid, gymId, db);
  } catch (err) {
    console.warn('[MSG] trackActivity failed (offline?):', err.message);
  }
}

async function recalculateEngagement(uid, gymId, db) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const snap = await db.collection(`activityLogs/${gymId}/events`)
    .where('uid', '==', uid)
    .where('timestamp', '>=', thirtyDaysAgo)
    .get();
  const events = snap.docs.map(d => d.data());
  const score = calcEngagementScore(events);
  await db.doc(`members/${gymId}_${uid}`).update({ engagementScore: score, lastActiveAt: serverTimestamp() }).catch(() => {});
}

export function calcEngagementScore(events) {
  const totalPoints = events.reduce((s, e) => s + (e.points || 0), 0);
  const cappedBase = Math.min(totalPoints, 80);
  const uniqueDays = new Set(
    events.map(e => {
      const d = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp);
      return d.toDateString();
    })
  ).size;
  const consistencyBonus = uniqueDays >= 15 ? 20 : uniqueDays >= 8 ? 10 : uniqueDays >= 4 ? 5 : 0;
  return Math.min(cappedBase + consistencyBonus, 100);
}

// ─── Attendance ───────────────────────────────────────────────────────────────
export async function checkIn(uid, gymId) {
  if (!uid || !gymId) return { error: 'Missing uid or gymId' };
  try {
    const db = await getFBFirestore();
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
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
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
let _storageLoading = false;
let _storageCallbacks = [];

export async function getFBStorage() {
  if (_storage) return _storage;
  if (_storageLoading) return new Promise((res, rej) => _storageCallbacks.push({ res, rej }));
  _storageLoading = true;
  try {
    await getFBAuth();
    await loadScript('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js');
    await pollFor(() => window.firebase?.storage);
    ensureApp();
    _storage = window.firebase.storage();
    _storageCallbacks.forEach(cb => cb.res(_storage));
    return _storage;
  } catch (err) {
    _storageCallbacks.forEach(cb => cb.rej(err));
    _storageLoading = false; _storage = null;
    throw err;
  }
}

export async function uploadFile(path, file) {
  const storage = await getFBStorage();
  const ref = storage.ref(path);
  const snap = await ref.put(file);
  return await snap.ref.getDownloadURL();
}

