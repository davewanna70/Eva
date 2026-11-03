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
  const audioRef = useRef(null);

  // Load saved name when page opens
  useEffect(() => {
    const savedName = localStorage.getItem('eva_user_name');
    if (savedName) {
      console.log("Eva remembers: " + savedName);
    }
  }, []);

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
    } catch(e){ setSpeaking(false); }
  }

  function CodeBlock({ code }) {
    const lines = code.replace(/^(javascript|js)\n/, '').split('\n');
    return (
      <pre style={{ background: '#1e1e1e', padding: '12px', borderRadius: '8px', margin: '10px 0', border: '1px solid #333', overflowX: 'auto' }}>
        <code style={{ fontFamily: 'monospace', fontSize: '13px' }}>
          {lines.map((line, i) => {
            let color = '#d4d4d4';
            if (line.trim().startsWith('//')) color = '#6A9955';
            else if (/^\s*(function|return|const|let|if|else)\b/.test(line)) color = '#569cd6';
            else if (line.includes('console')) color = '#DCDCAA';
            return <div key={i} style={{ color, whiteSpace: 'pre-wrap' }}>{line || ' '}</div>
          })}
        </code>
      </pre>
