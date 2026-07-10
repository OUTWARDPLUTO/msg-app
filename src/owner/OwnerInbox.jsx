import { useState, useEffect } from 'react';
import { C, fn, fb } from '../shared/theme.js';
import { UserAvatar } from '../shared/primitives.jsx';
import { getFBFirestore, getChatId, listenToOwnerChats } from '../shared/firebase.js';
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

export default function OwnerInbox({ gymId, user, gymName, setBackHandler }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberNames, setMemberNames] = useState({}); // uid → name/photo
  const [openChat, setOpenChat] = useState(null); // { chatData, memberInfo }

  // Listen to all chats for this gym
  useEffect(() => {
    if (!gymId) return;
    const unsub = listenToOwnerChats(gymId, chatList => {
      setChats(chatList);
      setLoading(false);
      // Load member names we don't have yet
      const unknownUids = chatList
        .map(c => c.memberUid)
        .filter(uid => uid && !memberNames[uid]);
      if (unknownUids.length > 0) {
        getFBFirestore().then(db => {
          Promise.all(unknownUids.map(uid =>
            db.doc(`users/${uid}`).get().then(snap => ({ uid, data: snap.exists ? snap.data() : null }))
          )).then(results => {
            setMemberNames(prev => {
              const next = { ...prev };
              results.forEach(({ uid, data }) => {
                if (data) next[uid] = { name: data.name || 'Member', photo: data.photo };
              });
              return next;
            });
          }).catch(() => {});
        });
      }
    });
    return unsub;
  }, [gymId]);

  // Back button
  useEffect(() => {
    if (openChat && setBackHandler) {
      setBackHandler(() => () => { setOpenChat(null); return true; });
    } else if (setBackHandler) {
      setBackHandler(null);
    }
    return () => { if (setBackHandler) setBackHandler(null); };
  }, [openChat, setBackHandler]);

  const isDark = !C.isLight;

  if (openChat) {
    const { chatData, memberInfo } = openChat;
    const isTrainerChat = chatData.type === 'trainer';
    return (
      <ChatScreen
        chatId={chatData.id}
        chatMeta={{ gymId, memberUid: chatData.memberUid, ownerUid: user.uid, type: chatData.type || 'owner', otherName: memberInfo?.name || 'Member' }}
        senderUid={user.uid}
        senderRole={isTrainerChat ? 'trainer' : 'owner'}
        onClose={() => setOpenChat(null)}
        otherUser={{ name: memberInfo?.name || 'Member', photo: memberInfo?.photo }}
      />
    );
  }

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadOwner || 0), 0);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: fn, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Messages
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              {gymName || 'Gym'} · Member conversations
            </div>
          </div>
          {totalUnread > 0 && (
            <div style={{
              background: C.accent, color: '#fff',
              fontFamily: fb, fontWeight: 700, fontSize: 11,
              padding: '3px 10px', borderRadius: 20,
            }}>
              {totalUnread} unread
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.5 }}>💬</div>
          <div style={{ fontSize: 13, color: C.muted }}>Loading conversations…</div>
        </div>
      ) : chats.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <div style={{ fontFamily: fn, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>No messages yet</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
            When members message you, their conversations will appear here.
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {chats.map(chat => {
            const memberInfo = memberNames[chat.memberUid] || { name: 'Member' };
            const unread = chat.unreadOwner || 0;
            const isTrainer = chat.type === 'trainer';
            return (
              <button
                key={chat.id}
                onClick={() => setOpenChat({ chatData: chat, memberInfo })}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 14px',
                  background: isDark
                    ? unread > 0 ? 'rgba(229,57,53,0.07)' : 'rgba(26,26,26,0.4)'
                    : unread > 0 ? 'rgba(229,57,53,0.05)' : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${unread > 0 ? C.accent + '40' : C.border}`,
                  borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.accent + '55'}
                onMouseLeave={e => e.currentTarget.style.borderColor = unread > 0 ? C.accent + '40' : C.border}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar user={memberInfo} size={44} fontSize={15} />
                  {isTrainer && (
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: C.blue, border: `2px solid ${C.bg}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8,
                    }}>🏅</div>
                  )}
                  {unread > 0 && (
                    <div style={{
                      position: 'absolute', top: -3, right: -3,
                      width: 18, height: 18, borderRadius: '50%',
                      background: C.accent, border: `2px solid ${C.bg}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontFamily: fb, fontWeight: 800, color: '#fff',
                    }}>{unread > 9 ? '9+' : unread}</div>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontFamily: fn, fontSize: 14, fontWeight: unread > 0 ? 800 : 600, color: C.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {memberInfo.name}
                      {isTrainer && <span style={{ fontSize: 10, color: C.blue, marginLeft: 6, fontFamily: fb, fontWeight: 700 }}>TRAINER</span>}
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: fb, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>
                      {formatPreviewTime(chat.lastMessageAt)}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: unread > 0 ? C.sub : C.muted,
                    fontWeight: unread > 0 ? 600 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.lastMessage || 'No messages yet'}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
