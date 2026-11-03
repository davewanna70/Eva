// @ts-nocheck
'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState('female');
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const audioRef = useRef(null);

  // --- LOAD PERMANENT DATA ON START ---
  useEffect(() => {
    const savedMessages = localStorage.getItem('eva_messages');
    if (savedMessages) {
      try { setMessages(JSON.parse(savedMessages)); } catch {}
    }
    const savedName = localStorage.getItem('eva_user_name');
    if (savedName) console.log('Eva remembers: ' + savedName);
    
    let uid = localStorage.getItem('eva_user_id');
    if (!uid) {
      uid = "user_" + Date.now() + "_" + Math.random().toString(36).slice(2,7);
      localStorage.setItem('eva_user_id', uid);
    }
  }, []);

  // --- SAVE MESSAGES AFTER REFRESH ---
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('eva_messages', JSON.stringify(messages.slice(-100)));
    }
  }, [messages]);

  function cleanForVoice(text) {
    return text.replace(/```[\s\S]*?```/g, ' code ').replace(/[*#_~`]/g, '').replace(/https?:\/\/\S+/g, '').trim();
  }

  async function speak(text) {
    if (!voiceOn) return;
    const cleaned = cleanForVoice(text);
    if (!cleaned) return;
    try {
      setSpeaking(true);
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleaned, gender })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        audioRef.current.onended = () => setSpeaking(false);
      }
    } catch(e) { setSpeaking(false); }
  }

  function CodeBlock({ code }) {
    const cleanCode = code.replace(/^(javascript|js)\n/, '');
    const lines = cleanCode.split('\n');
    return (
      <pre style={{ background: '#1e1e1e', padding: '12px', borderRadius: '8px', margin: '10px 0', border: '1px solid #333', overflowX: 'auto' }}>
        <code style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {lines.map((line, idx) => {
            let color = '#d4d4d4';
            if (line.trim().startsWith('//')) color = '#6A9955';
            if (line.trim().startsWith('function') || line.includes('return') || line.trim().startsWith('const') || line.trim().startsWith('let')) color = '#569cd6';
            return (
              <div key={idx} style={{ color: color, whiteSpace: 'pre-wrap' }}>
                {line || ' '}
              </div>
            );
          })}
        </code>
      </pre>
    );
  }

  function RenderMessage({ content }) {
    const parts = content.split('```');
    return (
      <>
        {parts.map((part, i) => {
          if (i % 2 === 1) return <CodeBlock key={i} code={part} />;
          return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
        })}
      </>
    );
  }

  function handleTouchStart(e) { 
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }
  function handleTouchEnd(e, msg) {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    // Swipe left 50px + not too much vertical swipe = reply
    if (diffX > 50 && diffY < 100) {
      setReplyTo(msg);
      if (navigator.vibrate) navigator.vibrate(20);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    
    // --- SAVE NAME, JOB, LOCATION TO LOCALSTORAGE TOO ---
    const lower = input.toLowerCase();
    if (lower.includes('my name is')) {
      const part = lower.split('my name is')[1].trim();
      const name = part.split(' ')[0].replace(/[^a-zA-Z]/g, '');
      if (name.length > 1) localStorage.setItem('eva_user_name', name);
    }
    if (lower.includes('developer')) localStorage.setItem('eva_user_job', 'developer');
    if (lower.includes('imo')) localStorage.setItem('eva_user_state', 'Imo State');

    let finalMessage = input;
    if (replyTo) finalMessage = 'Reply to [' + replyTo.content.slice(0,40) + ']: ' + input;
    const userMsg = { role: 'user', content: finalMessage, reply: replyTo, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = finalMessage;
    const currentHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    setInput('');
    setReplyTo(null);
    setLoading(true);
    try {
      const userId = localStorage.getItem('eva_user_id') || 'boss_default';
      const userName = localStorage.getItem('eva_user_name') || '';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: currentHistory.slice(-10),
          userName: userName,
          userId: userId
        })
      });
      const data = await res.json();
      const botMsg = { role: 'assistant', content: data.reply, id: Date.now()+1 };
      setMessages(prev => [...prev, botMsg]);
      if (voiceOn) speak(data.reply);
    } catch(err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error Boss', id: Date.now() }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>EVA • {gender.toUpperCase()} {speaking ? '🔊' : ''}</h1>
      <div style={{ height: '62vh', overflowY: 'auto', border: '1px solid #333', padding: '10px', marginBottom: '10px' }}>
        {messages.map((m) => (
          <div key={m.id} onTouchStart={handleTouchStart} onTouchEnd={(e)=>handleTouchEnd(e,m)} style={{ margin: '12px 0', padding: '10px', borderRadius: '8px', background: m.reply ? '#0a0a0a' : 'transparent', transition: '0.2s' }}>
            {m.reply && <div style={{ borderLeft: '3px solid #ff007f', padding: '6px 8px', marginBottom: '6px', background: '#111', fontSize: '12px', color: '#888' }}>↩️ {m.reply.content.slice(0,70)}</div>}
            <div style={{ color: m.role === 'user' ? '#0ff' : '#fff' }}><b>{m.role === 'user' ? 'You' : 'Eva'}:</b> <RenderMessage content={m.content} /></div>
            <button onClick={()=>setReplyTo(m)} style={{ marginTop: '6px', fontSize: '11px', background: '#222', color: '#aaa', border: '1px solid #333', borderRadius: '12px', padding: '3px 10px' }}>↩️ Reply</button>
          </div>
        ))}
        {loading && <div style={{ color: '#ff007f' }}>Eva typing...</div>}
      </div>
      {replyTo && (
        <div style={{ background: '#111', borderLeft: '3px solid #ff007f', padding: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#aaa' }}>Replying to: {replyTo.content.slice(0,50)}...</span>
          <button onClick={()=>setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px' }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder={replyTo ? 'Replying...' : 'Talk to Eva...'} style={{ flex: 1, padding: '12px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px' }} />
        <button onClick={sendMessage} style={{ padding: '12px 20px', background: '#fff', color: '#000', borderRadius: '8px', fontWeight: 'bold' }}>Send</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', background: '#111', padding: '12px', borderRadius: '10px', border: '1px solid #222' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={()=>setGender('female')} style={{ padding: '8px 12px', background: gender==='female'?'#ff007f':'#333', color: '#fff', borderRadius: '20px', border: 'none' }}>Female</button>
          <button onClick={()=>setGender('male')} style={{ padding: '8px 12px', background: gender==='male'?'#007fff':'#333', color: '#fff', borderRadius: '20px', border: 'none' }}>Male</button>
        </div>
        <button onClick={()=>setVoiceOn(!voiceOn)} style={{ padding: '8px 12px', background: voiceOn?'#0f0':'#f00', color: voiceOn?'#000':'#fff', borderRadius: '20px', border: 'none' }}>{voiceOn?'🔊 ON':'🔇 OFF'}</button>
      </div>
      <audio ref={audioRef} hidden />
      <div style={{ fontSize: '10px', color: '#444', marginTop: '10px', textAlign: 'center' }}>Swipe left on any message to reply • Memory saved forever</div>
    </div>
  );
    }
