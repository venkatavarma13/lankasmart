'use client';
import { useState, useEffect, useRef } from 'react';

const P = '#4E2A4F';
const PD = '#2D1E2F';
const G = '#D4AF6A';

const QUICK_ACTIONS = [
  { label: '📦 Track My Order', msg: 'How can I track my order?' },
  { label: '🛍️ Browse Products', msg: 'What products do you sell?' },
  { label: '🚚 Delivery Info', msg: 'What are your delivery options and charges?' },
  { label: '↩️ Return & Refund', msg: 'What is your return and refund policy?' },
  { label: '💳 Payment Methods', msg: 'What payment methods do you accept?' },
  { label: '📞 Contact Support', msg: 'How can I contact customer support?' },
];

export default function ChatBot({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello${user ? ' ' + user.name.split(' ')[0] : ''}! I'm the L MART AI Assistant.\n\nI can help you with:\n• 🛍️ Product details & availability\n• 📦 Order status & tracking\n• 🚚 Delivery information\n• ↩️ Returns & refunds\n• 💳 Payment queries\n\nWhat can I help you with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          user: user ? { id: user.id, name: user.name } : null,
        }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '😕 Connection issue. Please reach us at:\n📞 +91 94931 63557\n✉️ supportlmart@gmail.com',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg, ${P}, ${PD})`,
          border: 'none', cursor: 'pointer', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(78,42,79,0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          fontSize: 24,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(78,42,79,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(78,42,79,0.45)'; }}
        title="Chat with AI Assistant"
      >
        {open ? '✕' : '🤖'}
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#e53e3e', color: 'white',
            width: 20, height: 20, borderRadius: '50%',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>{unread}</span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 999,
          width: 370, maxWidth: 'calc(100vw - 32px)',
          height: 520, maxHeight: 'calc(100vh - 110px)',
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 40px rgba(78,42,79,0.25)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', border: '1px solid rgba(78,42,79,0.12)',
          animation: 'chatSlideIn 0.25s ease',
        }}>
          <style>{`
            @keyframes chatSlideIn {
              from { opacity: 0; transform: translateY(12px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
            .chat-msg-bot { align-self: flex-start; }
            .chat-msg-user { align-self: flex-end; }
            .chat-bubble-bot {
              background: #faf5fb; color: ${PD};
              border: 1px solid rgba(78,42,79,0.10);
              border-radius: 14px 14px 14px 3px;
            }
            .chat-bubble-user {
              background: linear-gradient(135deg, ${P}, ${PD}); color: white;
              border-radius: 14px 14px 3px 14px;
            }
            .quick-chip:hover { background: ${P} !important; color: white !important; }
          `}</style>

          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${P}, ${PD})`,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(212,175,106,0.25)', border: `2px solid ${G}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>L MART AI Assistant</div>
              <div style={{ color: G, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }} />
                Online · Replies instantly
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: 8, padding: '4px 8px', fontSize: 13 }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 12px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}
                style={{ maxWidth: '84%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}
                  style={{ padding: '9px 13px', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg-bot" style={{ maxWidth: '84%' }}>
                <div className="chat-bubble-bot" style={{ padding: '10px 14px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0,1,2].map(j => (
                    <span key={j} style={{
                      width: 7, height: 7, borderRadius: '50%', background: P,
                      display: 'inline-block', opacity: 0.6,
                      animation: `bounce 1.2s ${j * 0.2}s infinite`,
                    }} />
                  ))}
                  <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(1)} 40%{transform:scale(1.4)} }`}</style>
                </div>
              </div>
            )}

            {/* Quick Actions — shown only at start */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {QUICK_ACTIONS.map(qa => (
                  <button key={qa.label} className="quick-chip"
                    onClick={() => sendMessage(qa.msg)}
                    style={{
                      padding: '6px 11px', fontSize: 12, borderRadius: 20,
                      border: `1.5px solid ${P}`, background: 'white', color: P,
                      cursor: 'pointer', fontWeight: 600, transition: 'all 0.18s',
                    }}>
                    {qa.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px', borderTop: '1px solid rgba(78,42,79,0.10)',
            display: 'flex', gap: 8, alignItems: 'flex-end', background: '#faf5fb',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about products, orders, delivery..."
              rows={1}
              style={{
                flex: 1, padding: '9px 12px', fontSize: 13,
                border: `1.5px solid rgba(78,42,79,0.20)`,
                borderRadius: 10, outline: 'none', resize: 'none',
                background: 'white', color: PD, lineHeight: 1.4,
                maxHeight: 80, overflowY: 'auto',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = P}
              onBlur={e => e.target.style.borderColor = 'rgba(78,42,79,0.20)'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !loading ? `linear-gradient(135deg, ${P}, ${PD})` : '#ddd',
                color: 'white', cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0, transition: 'background 0.2s',
              }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
