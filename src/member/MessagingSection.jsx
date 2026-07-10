// ─── MessagingSection.jsx — Member's conversation list ────────────────────────
import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';
import { getFBFirestore, getChatId, listenToMemberChats } from '../shared/firebase.js';
import ChatScreen from '../shared/ChatScreen.jsx';

function formatPreviewTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function MessagingSection({ user, gymId, gymName }) {
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [trainerInfo, setTrainerInfo] = useState(null);
  const [chats, setChats] = useState({});
  const [openChat, setOpenChat] = useState(null); // 'owner' | 'trainer'

  // Load gym owner info and member's linked trainer
  useEffect(() => {
    if (!gymId || !user?.uid) return;
    (async () => {
      try {
        const db = await getFBFirestore();
        // Get gym doc → ownerUid
        const gymSnap = await db.doc(`gyms/${gymId}`).get();
        if (gymSnap.exists) {
          const gymData = gymSnap.data();
          const ownerUid = gymData.ownerUid;
          if (ownerUid) {
            const ownerSnap = await db.doc(`users/${ownerUid}`).get();
            setOwnerInfo(ownerSnap.exists ? { uid: ownerUid, ...ownerSnap.data() } : { uid: ownerUid, name: 'Gym Owner' });
          }
        }
        // Get member doc → trainerUid
        const memberSnap = await db.doc(`members/${gymId}_${user.uid}`).get();
        if (memberSnap.exists && memberSnap.data().trainerUid) {
          const tUid = memberSnap.data().trainerUid;
          const tSnap = await db.doc(`users/${tUid}`).get();
          setTrainerInfo(tSnap.exists ? { uid: tUid, ...tSnap.data() } : { uid: tUid, name: 'Trainer' });
        }
      } catch (e) { console.warn('[MSG] MessagingSection load:', e.message); }
    })();
  }, [gymId, user?.uid]);

  // Real-time chat listener
  useEffect(() => {
    if (!gymId || !user?.uid) return;
    const unsub = listenToMemberChats(gymId, user.uid, chatList => {
      const map = {};
      chatList.forEach(c => { map[c.id] = c; });
      setChats(map);
    });
    return unsub;
  }, [gymId, user?.uid]);

  const isDark = !C.isLight;

  const ownerChatId = ownerInfo ? getChatId(gymId, user.uid, 'owner') : null;
  const trainerChatId = trainerInfo ? getChatId(gymId, user.uid, 'trainer', trainerInfo.uid) : null;

  const ownerChatData = ownerChatId ? chats[ownerChatId] : null;
  const trainerChatData = trainerChatId ? chats[trainerChatId] : null;

  const ownerUnread = ownerChatData?.unreadMember || 0;
  const trainerUnread = trainerChatData?.unreadMember || 0;

  if (openChat === 'owner' && ownerInfo && ownerChatId) {
    return (
      <ChatScreen
        chatId={ownerChatId}
        chatMeta={{ gymId, memberUid: user.uid, ownerUid: ownerInfo.uid, type: 'owner', otherName: ownerInfo.name || gymName }}
        senderUid={user.uid}
        senderRole="member"
        onClose={() => setOpenChat(null)}
        otherUser={{ name: ownerInfo.name || gymName || 'Gym Owner', photo: ownerInfo.photo }}
      />
    );
  }

  if (openChat === 'trainer' && trainerInfo && trainerChatId) {
    return (
      <ChatScreen
        chatId={trainerChatId}
        chatMeta={{ gymId, memberUid: user.uid, trainerUid: trainerInfo.uid, type: 'trainer', otherName: trainerInfo.name }}
        senderUid={user.uid}
        senderRole="member"
        onClose={() => setOpenChat(null)}
        otherUser={{ name: trainerInfo.name || 'Trainer', photo: trainerInfo.photo }}
      />
    );
  }

  const ConvRow = ({ icon, title, sub, lastMsg, lastTime, unread, onClick, locked = false }) => (
    <button onClick={locked ? undefined : onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px',
      background: isDark ? 'rgba(26, 26, 26, 0.40)' : 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      borderRadius: 18, cursor: locked ? 'default' : 'pointer', textAlign: 'left',
      marginBottom: 12, transition: 'border-color 0.2s',
      opacity: locked ? 0.55 : 1,
    }}
      onMouseEnter={e => { if (!locked) e.currentTarget.style.borderColor = C.accent + '55'; }}
      onMouseLeave={e => { if (!locked) e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'; }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: C.accent + '20', border: `1.5px solid ${C.accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {icon}
        </div>
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: C.accent, border: `2px solid ${C.bg}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontFamily: fb, fontWeight: 800, color: '#fff',
          }}>{unread > 9 ? '9+' : unread}</div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ fontFamily: fn, fontSize: 14, fontWeight: 800, color: C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {title}
          </div>
          {lastTime && (
            <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>
              {lastTime}
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, color: unread > 0 ? C.sub : C.muted,
          fontWeight: unread > 0 ? 600 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lastMsg || sub}
        </div>
      </div>
      {!locked && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ padding: '28px 20px 14px' }}>
        <div style={{ color: C.sub, fontSize: 11, fontFamily: fb, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          Inbox
        </div>
        <div style={{ fontFamily: fn, fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Messages
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          Chat with your gym owner and trainer
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Owner chat */}
        <ConvRow
          icon="🏋️"
          title={ownerInfo?.name || gymName || 'Gym Owner'}
          sub="Tap to message your gym owner"
          lastMsg={ownerChatData?.lastMessage}
          lastTime={ownerChatData?.lastMessageAt ? formatPreviewTime(ownerChatData.lastMessageAt) : null}
          unread={ownerUnread}
          onClick={() => setOpenChat('owner')}
          locked={!ownerInfo}
        />

        {/* Trainer chat */}
        <ConvRow
          icon="👟"
          title={trainerInfo?.name || 'Your Trainer'}
          sub={trainerInfo ? 'Tap to message your trainer' : 'No trainer linked yet — ask your trainer to enter your code'}
          lastMsg={trainerChatData?.lastMessage}
          lastTime={trainerChatData?.lastMessageAt ? formatPreviewTime(trainerChatData.lastMessageAt) : null}
          unread={trainerUnread}
          onClick={() => setOpenChat('trainer')}
          locked={!trainerInfo}
        />
      </div>

      {/* Privacy note */}
      <div style={{ padding: '4px 16px 0' }}>
        <div style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            Your messages are private. Only you and the recipient can read them. No other members can access your conversations.
          </div>
        </div>
      </div>
    </div>
  );
}
