// @ts-nocheck
'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [swipedId, setSwipedId] = useState(null);
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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, replyTo]);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchMove(e, id) {
    const diffX = touchStartX.current - e.touches[0].clientX;
    if (diffX > 15 && diffX < 120) setSwipedId(id);
  }
  function handleTouchEnd(e, msg) {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    setSwipedId(null);
    if (diffX > 60 && diffY < 70) {
      setReplyTo(msg);
      if (navigator.vibrate) navigator.vibrate(25);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const lower = input.toLowerCase();
    if (lower.includes('my name is')) {
      const name = lower.split('my name is')[1].trim().split(' ')[0].replace(/[^a-zA-Z]/g,'');
      if (name.length > 1) localStorage.setItem('eva_user_name', name);
    }

    let finalMessage = input;
    if (replyTo) finalMessage = input; // don't add ugly Reply to [...] text
    const userMsg = { role: 'user', content: finalMessage, reply: replyTo, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const historyForApi = [...messages, userMsg].map(m => ({ role: m.role, content: (m.reply ? `Replying to ${m.reply.content.slice(0,60)}: ` : '') + m.content }));
    const currentInput = replyTo ? `Replying to "${replyTo.content.slice(0,50)}": ${input}` : input;
    setInput('');
    setReplyTo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: historyForApi.slice(-12),
          userName: localStorage.getItem('eva_user_name') || '',
          userId: localStorage.getItem('eva_user_id') || 'boss_default'
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, id: Date.now()+1 }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Error Boss', id: Date.now() }]); }
    setLoading(false);
  }

  return (
    <div style={{ 
      height: '100vh', background: '#0b141a', color: '#e9edef', display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto', overflow: 'hidden'
    }}>
      {/* Header like Meta AI */}
      <div style={{ padding: '12px 16px', background: '#202c33', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #2a3942' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff007f,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>E</div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '16px' }}>EVA</div>
          <div style={{ fontSize: '12px', color: '#8696a0' }}>Private • remembers forever</div>
        </div>
      </div>

      {/* Chat Area - WhatsApp background pattern */}
      <div ref={scrollRef} style={{ 
        flex: 1, overflowY: 'auto', padding: '12px 10px',
        backgroundColor: '#0b141a',
        backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
        backgroundRepeat: 'repeat', backgroundSize: '400px'
      }}>
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isSwiped = swipedId === m.id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', margin: '6px 0', position: 'relative' }}>
              {/* Swipe reply icon */}
              <div style={{ position: 'absolute', right: isUser ? '-8px' : 'auto', left: isUser ? 'auto' : '100%', top: '50%', transform: 'translateY(-50%)', opacity: isSwiped ? 1 : 0, transition: '0.2s' }}>
                <div style={{ background: '#202c33', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↩️</div>
              </div>

              <div
                onTouchStart={handleTouchStart}
                onTouchMove={(e)=>handleTouchMove(e,m.id)}
                onTouchEnd={(e)=>handleTouchEnd(e,m)}
                style={{
                  maxWidth: '78%', padding: '8px 10px', borderRadius: isUser ? '12px 0 12px 12px' : '0 12px 12px 12px',
                  background: isUser ? '#005c4b' : '#202c33',
                  color: '#e9edef', fontSize: '14.5px', lineHeight: '1.35',
                  boxShadow: '0 1px 0.5px rgba(0,0,0,0.3)',
                  transform: isSwiped ? 'translateX(-45px)' : 'translateX(0)',
                  transition: 'transform 0.2s ease',
                  touchAction: 'pan-y', userSelect: 'none'
                }}
              >
                {m.reply && (
                  <div style={{ borderLeft: '4px solid #ff007f', background: isUser ? '#025144' : '#2a3942', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#ff7ab6', fontWeight: '600' }}>{m.reply.role === 'user' ? 'You' : 'EVA'}</div>
                    <div style={{ fontSize: '12.5px', color: '#8696a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.reply.content.slice(0,70)}</div>
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                <div style={{ fontSize: '10px', color: isUser ? '#53bdeb' : '#8696a0', textAlign: 'right', marginTop: '4px' }}>{new Date(m.id).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '6px 0' }}>
            <div style={{ background: '#202c33', padding: '10px 14px', borderRadius: '0 12px 12px 12px', fontSize: '13px', color: '#8696a0' }}>● ● ●</div>
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div style={{ background: '#182229', borderLeft: '4px solid #ff007f', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', color: '#ff7ab6', fontWeight: '600' }}>Replying to {replyTo.role === 'user' ? 'yourself' : 'EVA'}</div>
            <div style={{ fontSize: '12.5px', color: '#8696a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyTo.content.slice(0,80)}</div>
          </div>
          <button onClick={()=>setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#8696a0', fontSize: '20px', paddingLeft: '12px' }}>×</button>
        </div>
      )}

      {/* Input - exactly like Meta AI / WhatsApp */}
      <div style={{ background: '#202c33', padding: '8px 10px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <div style={{ flex: 1, background: '#2a3942', borderRadius: '22px', padding: '6px 14px', display: 'flex', alignItems: 'center' }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder={replyTo ? 'Reply...' : 'Message EVA...'} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e9edef', fontSize: '15px', padding: '8px 0' }} />
        </div>
        <button onClick={sendMessage} style={{ background: '#00a884', border: 'none', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>➤</button>
      </div>
    </div>
  );
                  }
