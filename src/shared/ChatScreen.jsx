// ─── ChatScreen.jsx — Shared real-time chat UI used by member, owner & trainer ─
import { useState, useEffect, useRef } from 'react';
import { C, fn, fb } from './theme.js';
import { sendMessage, listenToMessages, markChatRead } from './firebase.js';

function formatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ChatScreen({
  chatId,
  chatMeta,       // { gymId, memberUid, ownerUid, trainerUid, type, memberName, otherName }
  senderUid,
  senderRole,     // 'member' | 'owner' | 'trainer'
  onClose,
  otherUser,      // { name, photo } of the recipient display
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Real-time message listener
  useEffect(() => {
    if (!chatId) return;
    const unsub = listenToMessages(chatId, msgs => {
      setMessages(msgs);
    });
    // Mark as read when opening chat
    markChatRead(chatId, senderRole).catch(() => {});
    return unsub;
  }, [chatId, senderRole]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    try {
      await sendMessage(chatId, senderUid, senderRole, t, chatMeta);
    } catch (e) {
      console.warn('[MSG] sendMessage error:', e);
      setText(t); // restore on failure
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDark = !C.isLight;
  const myBubbleBg = isDark ? C.accent : C.accent;
  const theirBubbleBg = isDark ? '#1E1E1E' : '#EFEFEF';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: C.bg,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, background: C.bg,
      }}>
        <button onClick={onClose} style={{
          background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          border: 'none', borderRadius: '50%',
          width: 36, height: 36, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: C.sub, flexShrink: 0,
        }}>←</button>
        <UserAvatar user={otherUser || { name: chatMeta?.otherName || '?' }} size={40} fontSize={14} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 800, color: C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {otherUser?.name || chatMeta?.otherName || 'Chat'}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
            {chatMeta?.type === 'trainer' ? 'Your Trainer' : senderRole === 'member' ? 'Gym Owner' : 'Member'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <div style={{ fontFamily: fn, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>Start a conversation</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              Messages are private and secure. Only you and {otherUser?.name || 'the other person'} can see them.
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderUid === senderUid;
          const ts = formatTime(msg.createdAt);
          const showTime = i === 0 || (
            messages[i - 1]?.senderUid !== msg.senderUid ||
            (msg.createdAt?.seconds - messages[i - 1]?.createdAt?.seconds > 120)
          );
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {showTime && (
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, marginTop: i > 0 ? 6 : 0,
                  alignSelf: 'center', fontFamily: fb, fontWeight: 600, letterSpacing: '0.04em' }}>
                  {ts}
                </div>
              )}
              <div style={{
                maxWidth: '75%',
                background: isMe ? myBubbleBg : theirBubbleBg,
                color: isMe ? '#fff' : C.text,
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '10px 14px',
                fontSize: 14, lineHeight: 1.45,
                wordBreak: 'break-word',
                boxShadow: isMe ? `0 2px 8px ${C.accent}40` : 'none',
              }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px 12px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: 8, alignItems: 'flex-end',
        background: C.bg, flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          maxLength={1000}
          style={{
            flex: 1, background: isDark ? '#1A1A1A' : '#F3F3F3',
            border: `1px solid ${C.border}`, borderRadius: 22,
            padding: '10px 16px', color: C.text, fontSize: 14,
            fontFamily: fn, outline: 'none', resize: 'none',
            minHeight: 42, maxHeight: 120, overflowY: 'auto',
            lineHeight: 1.45, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: text.trim() ? C.accent : (isDark ? '#222' : '#E0E0E0'),
            border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
            boxShadow: text.trim() ? `0 2px 8px ${C.accent}55` : 'none',
          }}
        >
          {sending
            ? <div style={{ width: 16, height: 16, border: '2px solid #fff5', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? '#fff' : C.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
          }
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
