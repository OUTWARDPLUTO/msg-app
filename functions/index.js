/**
 * Firebase Cloud Functions v2 — MSG Notification Backend
 * ─────────────────────────────────────────────────────────────────────────────
 * Project: msg2-3da02
 *
 * Functions:
 *  1. onMemberJoined       — triggers on new members/{gymId_uid} create
 *  2. scheduledInactivity  — runs every 6 h, sends gentle reminders
 *  3. scheduledOwnerDigest — runs daily at 08:00 IST
 *  4. sendCampaign         — HTTPS callable — owner-initiated campaigns
 *  5. onMembershipChange   — triggers on membership plan changes
 *
 * Security rules enforced here:
 *  - sendCampaign validates caller is gym owner via Admin SDK.
 *  - FCM tokens are read from users/{uid}/devices subcollection (server-only read).
 *  - Delivery records written to notifDelivery/{gymId}/logs (server-only write).
 *  - Idempotency keys prevent duplicate sends on Cloud Scheduler retries.
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { computeEngagementScore, ROLLING_WINDOW_DAYS, MS_PER_DAY } = require('./engagementScore');

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch all enabled FCM tokens for a uid.
 * Returns array of { token, platform, installationId, notificationsEnabled }
 */
async function getTokensForUser(uid) {
  try {
    const snap = await db.collection(`users/${uid}/devices`).get();
    return snap.docs
      .map(d => d.data())
      .filter(d => d.notificationsEnabled && d.fcmToken);
  } catch {
    return [];
  }
}

/**
 * Send a push to all devices of a user.
 * Automatically handles token cleanup for invalid tokens.
 * Returns number of successful sends.
 */
async function sendToUser({ uid, title, body, data = {}, imageUrl = null }) {
  const devices = await getTokensForUser(uid);
  if (!devices.length) return 0;

  let successCount = 0;
  const staleTokens = [];

  await Promise.all(devices.map(async (device) => {
    const msg = {
      token: device.fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        notification: {
          channelId: 'msg_push',
          icon: 'ic_launcher_foreground',
          ...(imageUrl ? { imageUrl } : {}),
        },
        priority: 'high',
      },
      apns: {
        payload: { aps: { badge: 1, sound: 'default' } },
      },
    };

    try {
      await messaging.send(msg);
      successCount++;
    } catch (err) {
      // Clean up invalid / unregistered tokens
      const code = err.errorInfo?.code || '';
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-argument'
      ) {
        staleTokens.push({ uid, installationId: device.installationId });
      }
    }
  }));

  // Remove stale tokens — fire-and-forget
  for (const { uid: u, installationId } of staleTokens) {
    db.doc(`users/${u}/devices/${installationId}`)
      .update({ notificationsEnabled: false, staleAt: FieldValue.serverTimestamp() })
      .catch(() => {});
  }

  return successCount;
}

/**
 * Fetch notification preferences for a user by role.
 */
async function getPrefs(uid, role) {
  try {
    const snap = await db.doc(`users/${uid}/notifPrefs/${role}`).get();
    return snap.exists ? snap.data() : {};
  } catch {
    return {};
  }
}

/**
 * Check if a timestamp is within quiet hours.
 */
function isQuietHour(quietStart, quietEnd) {
  const h = new Date().getUTCHours() + 5; // IST offset (+5:30 → use 5 for simplicity)
  const hIST = h % 24;
  if (quietStart < quietEnd) return hIST >= quietStart && hIST < quietEnd;
  return hIST >= quietStart || hIST < quietEnd;
}

/**
 * Write to idempotency collection to prevent duplicate sends.
 * Returns true if key is fresh (send should proceed), false if duplicate.
 */
async function claimIdempotencyKey(key, ttlMs = 7 * 24 * 60 * 60 * 1000) {
  const ref = db.doc(`notifIdempotency/${key}`);
  try {
    await db.runTransaction(async (txn) => {
      const snap = await txn.get(ref);
      if (snap.exists) throw new Error('duplicate');
      txn.set(ref, { createdAt: FieldValue.serverTimestamp(), expiresAt: Date.now() + ttlMs });
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Write a delivery log record (server-only collection).
 */
async function logDelivery({ gymId, uid, type, title, body, campaignId = null }) {
  try {
    await db.collection(`notifDelivery/${gymId}/logs`).add({
      uid,
      type,
      title,
      body,
      campaignId,
      sentAt: FieldValue.serverTimestamp(),
    });
  } catch {}
}

// ─── 1. On New Member Joined ──────────────────────────────────────────────────

exports.onMemberJoined = onDocumentCreated(
  'members/{docId}',
  async (event) => {
    const member = event.data?.data();
    if (!member) return;
    const { gymId, name, uid } = member;
    if (!gymId) return;

    // Get gym owner uid
    const gymSnap = await db.doc(`gyms/${gymId}`).get();
    if (!gymSnap.exists) return;
    const ownerUid = gymSnap.data().ownerUid;
    if (!ownerUid) return;

    // Check owner prefs
    const prefs = await getPrefs(ownerUid, 'owner');
    if (prefs.newMembers === false) return;

    await sendToUser({
      uid: ownerUid,
      title: '🎉 New Member Joined!',
      body: `${name || 'Someone'} just joined your gym.`,
      data: { route: 'members', memberUid: uid || '' },
    });

    await logDelivery({ gymId, uid: ownerUid, type: 'new_member', title: '🎉 New Member Joined!', body: `${name} joined` });
  }
);

// ─── 2. Messaging Feature Removed ─────────────────────────────────────────────
// (onMessageSent trigger decommissioned)


// ─── 3. Scheduled Inactivity Notifications ────────────────────────────────────
// Runs every 6 hours. Checks all members; sends gentle reminders according to
// the inactivity schedule defined in the requirements.

exports.scheduledInactivity = onSchedule(
  { schedule: '0 */6 * * *', timeZone: 'Asia/Kolkata', retryCount: 1 },
  async () => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Batch-read members active within last 30 days to limit scope
    const cutoff = new Date(now - 30 * DAY_MS);
    const membersSnap = await db.collection('members')
      .where('status', '==', 'active')
      .get();

    for (const doc of membersSnap.docs) {
      const member = doc.data();
      const { uid, gymId, name } = member;
      if (!uid || !gymId || uid.startsWith('imported_')) continue;

      try {
        const userSnap = await db.doc(`users/${uid}`).get();
        if (!userSnap.exists) continue;
        const userData = userSnap.data();

        const lastActiveAt = userData.lastActiveAt?.toDate?.() || new Date(userData.lastActiveAt || 0);
        const inactiveMs = now - lastActiveAt.getTime();
        const inactiveDays = inactiveMs / DAY_MS;

        // Check inactivity state
        const inactivity = userData.inactivity || {};
        const lastNotifiedAt = inactivity.lastNotifiedAt?.toDate?.() || null;
        const notifCount = inactivity.notifCountThisMonth || 0;
        const monthAgo = new Date(now - 30 * DAY_MS);

        // Frequency cap: max 3 per 30 days
        if (notifCount >= 3) continue;

        // No notification if active within 48 hours
        if (inactiveDays < 2) continue;

        // Minimum gap: 7 days between inactivity notifications
        if (lastNotifiedAt && (now - lastNotifiedAt.getTime()) < 7 * DAY_MS) continue;

        // Check user prefs
        const prefs = await getPrefs(uid, 'member');
        if (prefs.inactivity === false) continue;
        if (isQuietHour(prefs.quietHourStart ?? 22, prefs.quietHourEnd ?? 7)) continue;

        // Determine message severity
        let title, body;
        if (inactiveDays < 4) {
          // 2–3 days: gentle reminder
          title = '🏋️ Miss the gym?';
          body = `Hey ${name || 'there'}! It's been a couple days — a quick workout can reset your energy.`;
        } else if (inactiveDays < 8) {
          // 4–7 days: stronger comeback prompt
          title = '💪 Time to come back!';
          body = `${name || 'Hey'}! It's been ${Math.floor(inactiveDays)} days. Let's not lose that streak — your body is waiting!`;
        } else {
          // 7+ days: every 7 days until cap
          title = '🔥 We miss you at the gym!';
          body = `${name || 'Hey'}! ${Math.floor(inactiveDays)} days without training. One session can make all the difference.`;
        }

        // Idempotency: one inactivity notif per 7-day window per user
        const iKey = `inactivity_${uid}_${Math.floor(inactiveDays / 7)}`;
        const fresh = await claimIdempotencyKey(iKey, 8 * DAY_MS);
        if (!fresh) continue;

        const sent = await sendToUser({
          uid,
          title,
          body,
          data: { route: 'home', type: 'inactivity' },
        });

        if (sent > 0) {
          // Update inactivity tracking in user doc
          await db.doc(`users/${uid}`).update({
            'inactivity.lastNotifiedAt': FieldValue.serverTimestamp(),
            'inactivity.notifCountThisMonth': FieldValue.increment(1),
            'inactivity.lastMessage': title,
          });
          await logDelivery({ gymId, uid, type: 'inactivity', title, body });
        }
      } catch (err) {
        console.warn(`[MSG] inactivity check failed for ${uid}:`, err.message);
      }
    }
  }
);

// ─── 4. Daily Owner Digest ────────────────────────────────────────────────────
// Runs daily at 08:00 IST. Sends grouped digest of inactive members to owners.

exports.scheduledOwnerDigest = onSchedule(
  { schedule: '30 2 * * *', timeZone: 'UTC', retryCount: 1 }, // 2:30 UTC = 8:00 IST
  async () => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const INACTIVITY_THRESHOLD_DAYS = 5;

    // Get all gyms
    const gymsSnap = await db.collection('gyms').get();

    for (const gymDoc of gymsSnap.docs) {
      const gymId = gymDoc.id;
      const gym = gymDoc.data();
      const ownerUid = gym.ownerUid;
      const thresholdDays = gym.settings?.inactivityThresholdDays || INACTIVITY_THRESHOLD_DAYS;
      if (!ownerUid) continue;

      try {
        const prefs = await getPrefs(ownerUid, 'owner');
        if (prefs.inactivityDigest === 'off') continue;
        if (prefs.inactivityDigest === 'weekly') {
          // Only run on Mondays
          if (new Date().getDay() !== 1) continue;
        }
        if (isQuietHour(prefs.quietHourStart ?? 23, prefs.quietHourEnd ?? 7)) continue;

        // Count inactive members
        const cutoff = new Date(now - thresholdDays * DAY_MS);
        const membersSnap = await db.collection('members')
          .where('gymId', '==', gymId)
          .where('status', '==', 'active')
          .get();

        const inactive = membersSnap.docs.filter(d => {
          const data = d.data();
          if (data.uid?.startsWith('imported_')) return false;
          const la = data.lastActiveAt?.toDate?.() || new Date(0);
          return la < cutoff;
        });

        if (inactive.length === 0) continue;

        // Idempotency: one digest per day per gym
        const iKey = `digest_${gymId}_${new Date().toISOString().slice(0, 10)}`;
        const fresh = await claimIdempotencyKey(iKey, 26 * 60 * 60 * 1000);
        if (!fresh) continue;

        const title = `📊 ${inactive.length} inactive member${inactive.length > 1 ? 's' : ''} in your gym`;
        const body = `${inactive.length} member${inactive.length > 1 ? 's haven\'t' : ' hasn\'t'} visited in ${thresholdDays}+ days. Tap to review.`;

        await sendToUser({
          uid: ownerUid,
          title,
          body,
          data: { route: 'members', type: 'inactivity_digest', gymId },
        });

        await logDelivery({ gymId, uid: ownerUid, type: 'inactivity_digest', title, body });
      } catch (err) {
        console.warn(`[MSG] owner digest failed for gym ${gymId}:`, err.message);
      }
    }
  }
);

// ─── 5. Send Campaign (HTTPS Callable) ───────────────────────────────────────
// Owner-initiated custom push campaigns. Server validates ownership.

exports.sendCampaign = onCall(
  { enforceAppCheck: false }, // enable AppCheck in production for extra security
  async (request) => {
    const callerUid = request.auth?.uid;
    if (!callerUid) throw new HttpsError('unauthenticated', 'Not authenticated');

    const { gymId, audience, title, body, route = 'home', scheduleAt = null, campaignId } = request.data;

    if (!gymId || !title || !body) {
      throw new HttpsError('invalid-argument', 'gymId, title and body are required');
    }
    if (!campaignId) {
      throw new HttpsError('invalid-argument', 'campaignId is required for idempotency');
    }

    // ── Authorization: verify caller is owner of this gym ───────────────────
    const gymSnap = await db.doc(`gyms/${gymId}`).get();
    if (!gymSnap.exists) throw new HttpsError('not-found', 'Gym not found');
    if (gymSnap.data().ownerUid !== callerUid) {
      throw new HttpsError('permission-denied', 'Not the owner of this gym');
    }

    // ── Campaign frequency limit: max 3 campaigns per gym per day ───────────
    const today = new Date().toISOString().slice(0, 10);
    const campaignCountSnap = await db.collection(`notifDelivery/${gymId}/logs`)
      .where('type', '==', 'campaign')
      .where('sentDate', '==', today)
      .get();
    if (campaignCountSnap.size >= 3) {
      throw new HttpsError('resource-exhausted', 'Campaign limit reached for today (max 3)');
    }

    // ── Idempotency ─────────────────────────────────────────────────────────
    const iKey = `campaign_${campaignId}`;
    const fresh = await claimIdempotencyKey(iKey, 30 * 24 * 60 * 60 * 1000);
    if (!fresh) throw new HttpsError('already-exists', 'Campaign already sent');

    // ── Scheduled send support ───────────────────────────────────────────────
    if (scheduleAt && new Date(scheduleAt) > new Date()) {
      // Persist as a pending campaign; a separate scheduler would pick it up.
      // For now, write to a queue and return.
      await db.collection(`gyms/${gymId}/campaigns`).doc(campaignId).set({
        campaignId, gymId, audience, title, body, route,
        scheduleAt, status: 'scheduled',
        createdBy: callerUid,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { status: 'scheduled', campaignId };
    }

    // ── Build audience list ──────────────────────────────────────────────────
    let memberDocs = [];
    const membersSnap = await db.collection('members')
      .where('gymId', '==', gymId)
      .where('status', '==', 'active')
      .get();
    const allActive = membersSnap.docs.filter(d => !d.data().uid?.startsWith('imported_'));

    if (audience.type === 'all') {
      memberDocs = allActive;
    } else if (audience.type === 'inactive') {
      const DAY_MS = 24 * 60 * 60 * 1000;
      const thresholdDays = audience.inactiveDays || 7;
      const cutoff = new Date(Date.now() - thresholdDays * DAY_MS);
      memberDocs = allActive.filter(d => {
        const la = d.data().lastActiveAt?.toDate?.() || new Date(0);
        return la < cutoff;
      });
    } else if (audience.type === 'selected') {
      const selectedUids = new Set(audience.uids || []);
      memberDocs = allActive.filter(d => selectedUids.has(d.data().uid));
    } else if (audience.type === 'plan') {
      memberDocs = allActive.filter(d => d.data().membershipPlanId === audience.planId);
    }

    // ── Write campaign audit record ──────────────────────────────────────────
    const campaignRef = db.collection(`gyms/${gymId}/campaigns`).doc(campaignId);
    await campaignRef.set({
      campaignId, gymId, audience, title, body, route,
      status: 'sending',
      targetCount: memberDocs.length,
      createdBy: callerUid,
      createdAt: FieldValue.serverTimestamp(),
      sentAt: FieldValue.serverTimestamp(),
    });

    // ── Send to each member, respecting their opt-out pref ──────────────────
    let successCount = 0;
    let skipCount = 0;

    for (const doc of memberDocs) {
      const { uid: memberUid } = doc.data();
      if (!memberUid) continue;

      // Respect member opt-out for promotional messages
      const prefs = await getPrefs(memberUid, 'member');
      if (prefs.promotional === false) { skipCount++; continue; }
      if (isQuietHour(prefs.quietHourStart ?? 22, prefs.quietHourEnd ?? 7)) { skipCount++; continue; }

      const sent = await sendToUser({
        uid: memberUid,
        title,
        body,
        data: { route: route || 'home', campaignId, type: 'campaign' },
      });

      if (sent > 0) {
        successCount++;
        await logDelivery({ gymId, uid: memberUid, type: 'campaign', title, body, campaignId });
      }
    }

    // Update campaign record with results
    await campaignRef.update({
      status: 'sent',
      successCount,
      skipCount,
      completedAt: FieldValue.serverTimestamp(),
    });

    return { status: 'sent', successCount, skipCount, total: memberDocs.length };
  }
);

// ─── 6. Membership Exception Alert ───────────────────────────────────────────
// Trigger when a member's membership status changes to 'expired' or 'suspended'.

exports.onMembershipChange = onDocumentCreated(
  'gyms/{gymId}/membershipEvents/{eventId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const { gymId } = event.params;
    const { memberUid, memberName, type, planName } = data;

    if (!memberUid || !type) return;

    // Notify owner
    const gymSnap = await db.doc(`gyms/${gymId}`).get();
    if (!gymSnap.exists) return;
    const ownerUid = gymSnap.data().ownerUid;

    if (ownerUid) {
      const ownerPrefs = await getPrefs(ownerUid, 'owner');
      if (ownerPrefs.paymentExceptions !== false) {
        const titles = {
          expired: `⚠️ Membership Expired`,
          suspended: `🚫 Membership Suspended`,
          payment_failed: `💳 Payment Failed`,
        };
        const bodies = {
          expired: `${memberName || 'A member'}'s ${planName || 'membership'} has expired.`,
          suspended: `${memberName || 'A member'}'s membership was suspended.`,
          payment_failed: `Payment failed for ${memberName || 'a member'}'s subscription.`,
        };
        await sendToUser({
          uid: ownerUid,
          title: titles[type] || '⚠️ Membership Alert',
          body: bodies[type] || 'A membership status changed.',
          data: { route: 'members', type: 'membership_exception' },
        });
      }
    }

    // Notify member (essential — cannot be opted out)
    if (memberUid) {
      const memberTitles = {
        expired: '⏰ Your Membership Expired',
        suspended: '🚫 Your Membership was Suspended',
        payment_failed: '💳 Payment Failed',
      };
      const memberBodies = {
        expired: `Your ${planName || 'gym'} membership has expired. Renew to keep training!`,
        suspended: 'Your gym membership has been suspended. Contact your gym for details.',
        payment_failed: 'Your last payment failed. Please update your payment method.',
      };
      await sendToUser({
        uid: memberUid,
        title: memberTitles[type] || 'Membership Alert',
        body: memberBodies[type] || 'Your membership status changed.',
        data: { route: 'membership', type: 'membership_essential' },
      });

      await logDelivery({ gymId, uid: memberUid, type: 'membership', title: memberTitles[type], body: memberBodies[type] });
    }
  }
);

// ─── 7. Engagement Scoring Backend (Trusted Cloud Function) ───────────────────
// Central engine that recomputes a member's 28-day rolling engagement score.
// Written exclusively by Firebase Admin — clients cannot forge or edit scores.

async function recomputeMemberEngagement(gymId, memberUid) {
  if (!gymId || !memberUid || memberUid.startsWith('imported_') || memberUid === 'demo') return null;

  // 1. Fetch member doc
  const memberRef = db.doc(`members/${gymId}_${memberUid}`);
  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) return null;
  const memberData = memberSnap.data();

  // 2. Fetch user doc & gym settings
  const [userSnap, gymSnap] = await Promise.all([
    db.doc(`users/${memberUid}`).get().catch(() => null),
    db.doc(`gyms/${gymId}`).get().catch(() => null),
  ]);

  const userData = userSnap?.exists ? userSnap.data() : {};
  const gymData = gymSnap?.exists ? gymSnap.data() : {};
  const gymSettings = gymData.settings || {};

  // Gym uses attendance if QR or GPS check-in is enabled (or settings not explicitly disabled)
  const gymUsesAttendance = gymSettings.useQr !== false && gymSettings.useGps !== false;
  const weeklyWorkoutTarget = userData.weeklyWorkoutTarget || memberData.weeklyWorkoutTarget || 3;
  const lastActiveAt = userData.lastActiveAt || memberData.lastActiveAt || null;

  // 3. Fetch activity events in the 28-day rolling window
  const cutoff = new Date(Date.now() - ROLLING_WINDOW_DAYS * MS_PER_DAY);
  let rawEvents = [];

  try {
    const snap = await db.collection(`activityLogs/${gymId}/events`)
      .where('uid', '==', memberUid)
      .where('timestamp', '>=', cutoff)
      .get();
    rawEvents = snap.docs.map(d => d.data());
  } catch {
    // Graceful fallback if composite index is pending: fetch by UID and filter in memory
    const snap = await db.collection(`activityLogs/${gymId}/events`)
      .where('uid', '==', memberUid)
      .get();
    rawEvents = snap.docs
      .map(d => d.data())
      .filter(e => {
        const t = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp || 0);
        return t >= cutoff;
      });
  }

  // 4. Compute 0 - 100 rolling score
  const result = computeEngagementScore(rawEvents, {
    weeklyWorkoutTarget,
    gymUsesAttendance,
    lastActiveAt,
    now: Date.now(),
  });

  const ts = FieldValue.serverTimestamp();

  // Determine true latest activity timestamp from rawEvents or existing record
  let latestActivityTs = lastActiveAt || null;
  for (const e of rawEvents) {
    if (e.timestamp) {
      const et = e.timestamp.toDate ? e.timestamp.toDate().getTime() : new Date(e.timestamp).getTime();
      const cur = latestActivityTs ? (latestActivityTs.toDate ? latestActivityTs.toDate().getTime() : new Date(latestActivityTs).getTime()) : 0;
      if (et > cur) {
        latestActivityTs = e.timestamp;
      }
    }
  }

  const memberUpdates = {
    engagementScore: result.score,
    engagementStatus: result.status,
    engagementStatusKey: result.statusKey,
    engagementBreakdown: result.breakdown,
    engagementUpdatedAt: ts,
  };
  if (latestActivityTs) {
    memberUpdates.lastActiveAt = latestActivityTs;
  }

  // 5. Update member doc (trusted server write)
  await memberRef.update(memberUpdates);

  // 6. Update user doc: sync lastActiveAt & reset inactivity alert counters only if genuinely active
  const isRecentlyActive = result.breakdown.recency.daysAgo !== null && result.breakdown.recency.daysAgo <= 1;
  if (userSnap?.exists) {
    const userUpdates = {};
    if (latestActivityTs) userUpdates.lastActiveAt = latestActivityTs;
    if (isRecentlyActive) {
      userUpdates.inactivity = {
        lastNotifiedAt: null,
        notifCountThisMonth: 0,
        resetAt: ts,
      };
    }
    if (Object.keys(userUpdates).length > 0) {
      await db.doc(`users/${memberUid}`).update(userUpdates).catch(() => {});
    }
  }

  return result;
}

// ─── 8. Trigger on Activity Logged ────────────────────────────────────────────
// Whenever a client logs an activity event, trigger server-side recomputation.
// Idempotent and recursion-free (updates member doc, not activityLogs).

exports.onActivityLogged = onDocumentCreated(
  'activityLogs/{gymId}/events/{eventId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const { gymId, eventId } = event.params;
    const { uid } = data;
    if (!uid || uid.startsWith('imported_') || uid === 'demo') return;

    // Idempotency: skip if already processed on retry
    const iKey = `act_${gymId}_${eventId}`;
    const fresh = await claimIdempotencyKey(iKey, 60 * 60 * 1000); // 1 hour TTL
    if (!fresh) return;

    try {
      await recomputeMemberEngagement(gymId, uid);
    } catch (err) {
      console.warn(`[MSG] onActivityLogged failed for ${uid} in ${gymId}:`, err.message);
    }
  }
);

// ─── 9. Scheduled Daily Engagement Decay ──────────────────────────────────────
// Runs daily at 03:00 IST. Recomputes rolling 28-day scores for all active members
// so that scores naturally decay as activity ages out, even if the user is dormant.

exports.scheduledDailyEngagementDecay = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'Asia/Kolkata', retryCount: 1 },
  async () => {
    console.log('[MSG] Starting scheduledDailyEngagementDecay...');
    try {
      const membersSnap = await db.collection('members').where('status', '==', 'active').get();
      for (const doc of membersSnap.docs) {
        const { uid, gymId } = doc.data();
        if (!uid || !gymId || uid.startsWith('imported_') || uid === 'demo') continue;
        try {
          await recomputeMemberEngagement(gymId, uid);
        } catch (err) {
          console.warn(`[MSG] Failed to decay engagement for ${uid} in ${gymId}:`, err.message);
        }
      }
      console.log(`[MSG] Completed scheduledDailyEngagementDecay for ${membersSnap.size} members.`);
    } catch (err) {
      console.error('[MSG] scheduledDailyEngagementDecay error:', err);
    }
  }
);

