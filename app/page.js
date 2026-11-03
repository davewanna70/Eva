// @ts-nocheck
'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [swipedId, setSwipedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    let uid = localStorage.getItem('eva_user_id');
    if (!uid) {
      uid = "user_" + Date.now() + "_" + Math.random().toString(36).slice(2,6);
      localStorage.setItem('eva_user_id', uid);
    }
  }, []);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, loading, replyTo]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchMove(e, id) {
    const diffX = e.touches[0].clientX - touchStartX.current; // SWIPE RIGHT = positive
    if (diffX > 15 && diffX < 120) setSwipedId(id); // show icon when moving right
  }
  function handleTouchEnd(e, msg) {
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
    setSwipedId(null);
    // SWIPE RIGHT 60px to reply (like WhatsApp / Meta AI)
    if (diffX > 65 && diffY < 75) {
      setReplyTo(msg);
      if (navigator.vibrate) navigator.vibrate(30);
    }
  }

  function copyText(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input, reply: replyTo, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const historyForApi = [...messages, userMsg].map(m => ({ role: m.role, content: (m.reply ? `Replying to ${m.reply.content.slice(0,60)}: ` : '') + m.content }));
    const currentInput = replyTo ? `Replying to "${replyTo.content.slice(0,50)}": ${input}` : input;
    setInput(''); setReplyTo(null); setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, history: historyForApi.slice(-12), userName: localStorage.getItem('eva_user_name') || '', userId: localStorage.getItem('eva_user_id') || 'boss_default' })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, id: Date.now()+1 }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Error Boss', id: Date.now() }]); }
    setLoading(false);
  }

  return (
    <div style={{ height: '100vh', background: '#0b141a', color: '#e9edef', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#202c33', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff007f,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>E</div>
        <div><div style={{ fontWeight: '600' }}>EVA</div><div style={{ fontSize: '11px', color: '#8696a0' }}>Unlimited memory • Swipe right to reply</div></div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', backgroundColor: '#0b141a', backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, backgroundSize: '400px' }}>
        {messages.map((m) => {
          const isUser = m.role === 'user'; const isSwiped = swipedId === m.id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '8px 0', position: 'relative' }}>
              {/* Swipe right icon appears on LEFT when you swipe right */}
              <div style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)', opacity: isSwiped ? 1 : 0, transition: '0.2s' }}>
                <div style={{ background: '#00a884', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩️</div>
              </div>

              <div
                onTouchStart={handleTouchStart}
                onTouchMove={(e)=>handleTouchMove(e,m.id)}
                onTouchEnd={(e)=>handleTouchEnd(e,m)}
                onClick={() => copyText(m.content, m.id)}
                style={{
                  maxWidth: '78%', padding: '8px 10px', borderRadius: isUser ? '0 12px 12px 12px' : '0 12px 12px 12px',
                  background: isUser ? '#005c4b' : '#202c33', color: '#e9edef', fontSize: '14.5px', lineHeight: '1.35',
                  transform: isSwiped ? 'translateX(45px)' : 'translateX(0)', // moves RIGHT like WhatsApp
                  transition: 'transform 0.2s ease', touchAction: 'pan-y',
                  userSelect: 'text', WebkitUserSelect: 'text', cursor: 'pointer'
                }}
              >
                {m.reply && <div style={{ borderLeft: '4px solid #ff007f', background: isUser ? '#025144' : '#2a3942', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px' }}><div style={{ fontSize: '12px', color: '#ff7ab6' }}>{m.reply.role === 'user' ? 'You' : 'EVA'}</div><div style={{ fontSize: '12px', color: '#8696a0' }}>{m.reply.content.slice(0,70)}</div></div>}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <div style={{ fontSize: '10px', color: copiedId === m.id ? '#00ff88' : '#8696a0' }}>{copiedId === m.id ? '✓ Copied!' : new Date(m.id).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                  <div style={{ fontSize: '10px', color: '#8696a0' }}>Tap to copy • Swipe right to reply</div>
                </div>
              </div>
            </div>
          );
        })}
        {loading && <div style={{ background: '#202c33', padding: '10px 14px', borderRadius: '0 12px 12px 12px', width: 'fit-content' }}>● ● ●</div>}
      </div>

      {replyTo && <div style={{ background: '#182229', borderLeft: '4px solid #ff007f', padding: '10px 12px', display: 'flex', justifyContent: 'space-between' }}><div><div style={{ color: '#ff7ab6', fontSize: '13px' }}>Replying to {replyTo.role === 'user' ? 'yourself' : 'EVA'}</div><div style={{ color: '#8696a0', fontSize: '12px' }}>{replyTo.content.slice(0,80)}</div></div><button onClick={()=>setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#8696a0', fontSize: '20px' }}>×</button></div>}

      <div style={{ background: '#202c33', padding: '8px 10px', display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, background: '#2a3942', borderRadius: '22px', padding: '6px 14px', display: 'flex' }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder={replyTo ? 'Reply...' : 'Message EVA...'} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e9edef', fontSize: '15px', padding: '8px 0' }} />
        </div>
        <button onClick={sendMessage} style={{ background: '#00a884', border: 'none', width: '46px', height: '46px', borderRadius: '50%', fontSize: '20px' }}>➤</button>
      </div>
    </div>
  );
}
