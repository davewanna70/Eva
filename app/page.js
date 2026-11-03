// @ts-nocheck
'use client';
import { useState, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState('female');
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const touchStartX = useRef(0);
  const audioRef = useRef(null);

  function cleanForVoice(text) {
    return text.replace(/```[\s\S]*?```/g, ' code block ').replace(/[*#_~`]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
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
    } catch (e) { setSpeaking(false); }
  }

  function RenderMessage({ content }) {
    const parts = content.split(/```/);
    return (
      <>
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            const code = part.replace(/^(javascript|js|python|ts|tsx)\s*\n/, '');
            return (
              <pre key={i} style={{ background: '#1e1e1e', padding: '12px', borderRadius: '8px', overflowX: 'auto', margin: '10px 0', border: '1px solid #333', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                <code>{code}</code>
              </pre>
            );
          } else {
            return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
          }
        })}
      </>
    );
  }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function handleTouchEnd(e, msg) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) {
      setReplyTo(msg);
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    let finalMessage = input;
    if (replyTo) {
      finalMessage = 'Replying to "' + replyTo.content.slice(0,60) + '": ' + input;
    }
    const userMsg = { role: 'user', content: finalMessage, reply: replyTo };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = finalMessage;
    setInput('');
    setReplyTo(null);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput })
      });
      const data = await res.json();
      const botMsg = { role: 'assistant', content: data.reply || 'Sorry Boss' };
      setMessages(prev => [...prev, botMsg]);
      if (voiceOn) speak(data.reply);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error Boss' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>EVA • {gender === 'female' ? 'FEMALE' : 'MALE'} {speaking ? '🔊' : ''}</h1>
      <div style={{ height: '60vh', overflowY: 'auto', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}>
        {messages.map((m, i) => (
          <div 
            key={i} 
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) => handleTouchEnd(e, m)}
            onDoubleClick={() => setReplyTo(m)}
            style={{ margin: '14px 0', padding: '8px', background: replyTo === m ? '#222' : 'transparent', borderRadius: '8px', color: m.role === 'user' ? '#0ff' : '#fff', lineHeight: '1.5' }}
          >
            {m.reply && (
              <div style={{ borderLeft: '3px solid #ff007f', paddingLeft: '8px', marginBottom: '6px', fontSize: '12px', color: '#aaa', background: '#111' }}>
                ↩️ {m.reply.content.slice(0,80)}
              </div>
            )}
            <b>{m.role === 'user' ? 'You' : `Eva ${gender}`}:</b> <RenderMessage content={m.content} />
          </div>
        ))}
        {loading && <div>Eva typing...</div>}
      </div>

      {replyTo && (
        <div style={{ background: '#111', borderLeft: '3px solid #ff007f', padding: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Replying to: {replyTo.content.slice(0,60)}...</div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#fff' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={replyTo ? "Reply..." : "Talk to Eva..."} style={{ flex: 1, padding: '12px', background: '#111', color: '#fff', border: '1px solid #333' }} />
        <button onClick={sendMessage} style={{ padding: '12px 20px', background: '#fff', color: '#000' }}>Send</button>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #222' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setGender('female')} style={{ padding: '10px 15px', background: gender === 'female' ? '#ff007f' : '#333', color: '#fff', borderRadius: '20px', border: 'none' }}>👩 Female</button>
          <button onClick={() => setGender('male')} style={{ padding: '10px 15px', background: gender === 'male' ? '#007fff' : '#333', color: '#fff', borderRadius: '20px', border: 'none' }}>👨 Male JARVIS</button>
        </div>
        <button onClick={() => setVoiceOn(!voiceOn)} style={{ padding: '10px 15px', background: voiceOn ? '#0f0' : '#f00', color: voiceOn ? '#000' : '#fff', borderRadius: '20px', border: 'none', fontWeight: 'bold' }}>{voiceOn ? '🔊 Voice ON' : '🔇 Voice OFF'}</button>
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
              }
