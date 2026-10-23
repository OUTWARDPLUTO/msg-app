/**
 * NotificationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central notification layer for MSG. Handles:
 *  - FCM device registration (permission gated — never on cold start)
 *  - Per-device Firestore record at users/{uid}/devices/{installationId}
 *  - Notification preference reads/writes to Firestore
 *  - Foreground push display via LocalNotifications
 *  - Notification tap → in-app route resolution
 *  - Local reminder helpers (water, progress) with quiet-hours enforcement
 *
 * Security contract:
 *  - NEVER exposes Admin SDK or service-account credentials.
 *  - FCM sends always go through Cloud Functions (functions/index.js).
 *  - Delivery history and campaign state are server-only; this file only
 *    reads/writes the collections the client is allowed to touch.
 */

import { getFBFirestore, serverTimestamp } from './firebase.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const LAST_ACTIVE_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
let _lastActiveWrite = 0;

// ─── Installation ID ──────────────────────────────────────────────────────────
// Stable per-app-install ID. Different from uid — each device gets its own
// record under users/{uid}/devices/{installationId}.
function getInstallationId() {
  const KEY = 'msg_installation_id';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'inst_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'inst_fallback_' + Date.now();
  }
}

// ─── Platform detection ───────────────────────────────────────────────────────
function getPlatform() {
  try {
    // Capacitor sets window.Capacitor.platform on native
    const cap = window?.Capacitor;
    if (cap?.platform === 'android') return 'android';
    if (cap?.platform === 'ios') return 'ios';
  } catch {}
  return 'web';
}

// ─── Device record helpers ─────────────────────────────────────────────────────

/**
 * Upsert a device record for this installation.
 * Called after push token is obtained or refreshed.
 */
export async function registerDeviceToken({ uid, gymId, role, fcmToken }) {
  if (!uid || !fcmToken) return;
  try {
    const db = await getFBFirestore();
    const installationId = getInstallationId();
    const ref = db.doc(`users/${uid}/devices/${installationId}`);
    await ref.set({
      fcmToken,
      platform: getPlatform(),
      gymId: gymId || null,
      role: role || 'member',
      notificationsEnabled: true,
      installationId,
      lastSeenAt: serverTimestamp(),
      // createdAt is only set on first write via merge
    }, { merge: true });

    // Set createdAt only if it doesn't exist yet
    const snap = await ref.get();
    if (snap.exists && !snap.data().createdAt) {
      await ref.update({ createdAt: serverTimestamp() });
    }

    console.log('[MSG] Device token registered:', installationId);
  } catch (err) {
    console.warn('[MSG] registerDeviceToken failed:', err.message);
  }
}

/**
 * Mark the device as having notifications disabled (user opted out).
 * Keeps the document so the server can skip it cleanly.
 */
export async function disableDeviceNotifications(uid) {
  if (!uid) return;
  try {
    const db = await getFBFirestore();
    const installationId = getInstallationId();
    await db.doc(`users/${uid}/devices/${installationId}`).set(
      { notificationsEnabled: false, lastSeenAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.warn('[MSG] disableDeviceNotifications:', err.message);
  }
}

/**
 * Update lastSeenAt on this device record — rate-limited to avoid hammering
 * Firestore on every App.resume event.
 */
export async function touchDeviceLastSeen(uid) {
  if (!uid) return;
  const now = Date.now();
  if (now - _lastActiveWrite < LAST_ACTIVE_RATE_LIMIT_MS) return;
  _lastActiveWrite = now;
  try {
    const db = await getFBFirestore();
    const installationId = getInstallationId();
    await db.doc(`users/${uid}/devices/${installationId}`).set(
      { lastSeenAt: serverTimestamp() },
      { merge: true }
    );
  } catch {}
}

// ─── Notification Preferences ─────────────────────────────────────────────────

/**
 * Default preferences by role.
 */
export const DEFAULT_PREFS = {
  member: {
    workout:           true,  // workout reminders
    progress:          true,  // progress log reminders
    trainerMessages:   true,  // messages from trainers/owners
    membership:        true,  // membership/payment alerts (cannot be disabled)
    inactivity:        true,  // inactivity comeback nudges
    promotional:       true,  // owner custom campaign messages
    quietHourStart:    22,    // hour (24h) — no pushes after this
    quietHourEnd:      7,     // hour (24h) — no pushes before this
  },
  owner: {
    newMembers:        true,
    attendanceAlerts:  true,
    paymentExceptions: true,
    unreadChats:       true,
    inactivityDigest:  'daily', // 'daily' | 'weekly' | 'off'
    quietHourStart:    23,
    quietHourEnd:      7,
  },
  trainer: {
    memberMessages:    true,
    inactivityAlerts:  true,
    quietHourStart:    22,
    quietHourEnd:      7,
  },
};

/**
 * Fetch notification preferences from Firestore.
 * Falls back to defaults if the doc doesn't exist yet.
 */
export async function getNotifPrefs(uid, role) {
  if (!uid) return DEFAULT_PREFS[role] || DEFAULT_PREFS.member;
  try {
    const db = await getFBFirestore();
    const snap = await db.doc(`users/${uid}/notifPrefs/${role}`).get();
    if (snap.exists) {
      // Merge with defaults so new preference keys are automatically populated
      return { ...(DEFAULT_PREFS[role] || {}), ...snap.data() };
    }
    return DEFAULT_PREFS[role] || DEFAULT_PREFS.member;
  } catch {
    return DEFAULT_PREFS[role] || DEFAULT_PREFS.member;
  }
}

/**
 * Save notification preferences to Firestore.
 * The `membership` category for members is always forced true (essential).
 */
export async function saveNotifPrefs(uid, role, prefs) {
  if (!uid) return;
  try {
    const db = await getFBFirestore();
    const safePrefs = { ...prefs };
    if (role === 'member') safePrefs.membership = true; // cannot be disabled
    await db.doc(`users/${uid}/notifPrefs/${role}`).set({
      ...safePrefs,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('[MSG] saveNotifPrefs failed:', err.message);
  }
}

// ─── Push Registration (permission gated) ─────────────────────────────────────

/**
 * Request push permission and register with FCM.
 * MUST only be called after the user explicitly enables push in Settings.
 * Returns { granted: bool, token: string|null }.
 */
export async function requestAndRegisterPush({ uid, gymId, role }) {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Check current status first to avoid showing dialog unnecessarily
    const status = await PushNotifications.checkPermissions();

    let finalStatus = status.receive;
    if (finalStatus === 'prompt' || finalStatus === 'prompt-with-rationale') {
      const result = await PushNotifications.requestPermissions();
      finalStatus = result.receive;
    }

    if (finalStatus !== 'granted') {
      await disableDeviceNotifications(uid);
      return { granted: false, token: null };
    }

    await PushNotifications.register();

    return new Promise((resolve) => {
      let resolved = false;
      const finish = (result) => {
        if (resolved) return;
        resolved = true;
        resolve(result);
      };

      // FCM token received
      PushNotifications.addListener('registration', async (token) => {
        const fcmToken = token.value;
        console.log('[MSG] FCM token:', fcmToken);
        await registerDeviceToken({ uid, gymId, role, fcmToken });
        // Persist token locally for quick access
        try { localStorage.setItem('msg_fcm_token', fcmToken); } catch {}
        finish({ granted: true, token: fcmToken });
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.warn('[MSG] Push registration error:', err);
        finish({ granted: true, token: null }); // permission granted but token failed
      });

      // Timeout fallback after 10 s
      setTimeout(() => finish({ granted: true, token: null }), 10000);
    });
  } catch (err) {
    // Not available in web/dev environment — graceful no-op
    console.log('[MSG] Push not available:', err.message);
    return { granted: false, token: null };
  }
}

/**
 * Attach persistent push listeners for the session.
 * Call once per login, after registration.
 * Handles: foreground display, token refresh, notification tap routing.
 */
export async function attachPushListeners({ onNavigate } = {}) {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Show push in foreground using LocalNotifications (FCM won't auto-display it)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('[MSG] Push received (foreground):', notification);
      try {
        await LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 90000) + 10000,
            title: notification.title || 'MSG',
            body: notification.body || '',
            extra: notification.data || {},
            channelId: 'msg_push',
            smallIcon: 'ic_launcher_foreground',
          }],
        });
      } catch {}
    });

    // Handle tap on push or local notification → route in-app
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification?.data || {};
      handleNotificationTap(data, onNavigate);
    });

    // Handle token refresh — update Firestore record
    PushNotifications.addListener('registration', async (token) => {
      const uid = _currentUid;
      const gymId = _currentGymId;
      const role = _currentRole;
      if (uid && token.value) {
        try { localStorage.setItem('msg_fcm_token', token.value); } catch {}
        await registerDeviceToken({ uid, gymId, role, fcmToken: token.value });
      }
    });

    // LocalNotification tap routing
    try {
      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const extra = action.notification?.extra || {};
        handleNotificationTap(extra, onNavigate);
      });
    } catch {}

  } catch {
    // Web/dev — no-op
  }
}

// ─── Session context (set by App.jsx on login) ────────────────────────────────
let _currentUid = null;
let _currentGymId = null;
let _currentRole = null;

export function setNotifSessionContext(uid, gymId, role) {
  _currentUid = uid;
  _currentGymId = gymId;
  _currentRole = role;
}

export function clearNotifSessionContext() {
  _currentUid = null;
  _currentGymId = null;
  _currentRole = null;
  try { localStorage.removeItem('msg_fcm_token'); } catch {}
}

// ─── Notification Tap → Route Resolution ──────────────────────────────────────

/**
 * Map notification data payload to an in-app route.
 * `data.route` can be: messages | attendance | membership | alerts |
 *                       progress | workout | profile | owner_inbox
 */
export function handleNotificationTap(data, onNavigate) {
  if (!data || !onNavigate) return;
  const route = data.route || data.screen || '';
  console.log('[MSG] Notification tap route:', route, data);

  switch (route) {
    case 'messages':
    case 'member_messages':
      onNavigate('messages');
      break;
    case 'attendance':
      onNavigate('attendance');
      break;
    case 'membership':
    case 'payment':
      onNavigate('profile'); // member goes to profile → membership section
      break;
    case 'progress':
      onNavigate('progress');
      break;
    case 'workout':
      onNavigate('workout');
      break;
    case 'owner_inbox':
    case 'owner_messages':
      onNavigate('messages'); // owner nav
      break;
    case 'owner_alerts':
      onNavigate('dashboard');
      break;
    case 'profile':
      onNavigate('profile');
      break;
    default:
      onNavigate('home');
  }
}

// ─── lastActiveAt update (rate-limited) ──────────────────────────────────────

/**
 * Bump lastActiveAt on the user doc and device record.
 * Rate-limited to at most once every 5 minutes per session.
 * Also resets inactivity notification state so the Cloud Function
 * won't send inactivity reminders to users who have just returned.
 */
export async function updateLastActive(uid, gymId) {
  if (!uid || uid === 'demo') return;
  const now = Date.now();
  if (now - _lastActiveWrite < LAST_ACTIVE_RATE_LIMIT_MS) return;
  _lastActiveWrite = now;
  try {
    const db = await getFBFirestore();
    const ts = serverTimestamp();
    // Update user doc
    await db.doc(`users/${uid}`).update({
      lastActiveAt: ts,
      // Reset inactivity notification state — server checks this before sending
      inactivity: {
        lastNotifiedAt: null,
        notifCountThisMonth: 0,
        resetAt: ts,
      },
    }).catch(() => {
      // Might fail if user doc doesn't exist yet — safe to ignore
    });
    // Update member doc
    if (gymId) {
      await db.doc(`members/${gymId}_${uid}`).update({ lastActiveAt: ts }).catch(() => {});
    }
    // Touch device record
    await touchDeviceLastSeen(uid);
  } catch (err) {
    console.warn('[MSG] updateLastActive failed:', err.message);
  }
}

// ─── Local Notification Channel Setup ─────────────────────────────────────────

/**
 * Create all required Android notification channels.
 * Idempotent — safe to call on every launch.
 */
export async function ensureNotifChannels() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.createChannel({
      id: 'msg_reminders',
      name: 'MSG Reminders',
      description: 'Daily progress and water intake reminders',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
    });
    await LocalNotifications.createChannel({
      id: 'msg_push',
      name: 'MSG Alerts',
      description: 'Push notifications from MSG',
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
  } catch {
    // Web / unsupported — ignore
  }
}

// ─── Quiet Hours Guard ────────────────────────────────────────────────────────

/**
 * Returns true if the current local hour falls inside quiet hours.
 * start and end are integers (0–23). Handles overnight ranges (e.g. 22→7).
 */
export function isInQuietHours(start, end) {
  const h = new Date().getHours();
  if (start < end) return h >= start && h < end;
  return h >= start || h < end; // overnight wrap
}
