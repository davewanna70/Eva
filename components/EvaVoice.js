"use client";
import { useState, useRef, useCallback } from "react";

export default function EvaVoice({ onUserSaid }) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  const speak = useCallback(async (text) => {
    if (!text) return;
    try {
      setSpeaking(true);
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("speak failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      await audio.play();
    } catch { setSpeaking(false); }
  }, []);

  const startEva = () => {
    setAllowed(true);
    setTimeout(() => speak("Welcome back, Boss. I have been waiting for you. How can I help you today?"), 800);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-NG";
    rec.onresult = (e) => {
      const text = e.results[e.results.length - 1][0].transcript;
      if (onUserSaid) onUserSaid(text);
      if (text.toLowerCase().includes("hello") || text.toLowerCase().includes("hey eva")) {
        speak("Yes Boss, I am here. I am listening.");
      }
    };
    rec.onend = () => { try { rec.start(); } catch {} };
    recognitionRef.current = rec;
    try { rec.start(); setListening(true); } catch {}
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 999, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      {!allowed ? (
        <button onClick={startEva} style={{ background: "#22d3ee", color: "#000", border: "none", padding: "14px 20px", borderRadius: 999, fontWeight: 800, cursor: "pointer", fontSize: 15 }}>
          🎤 Allow EVA to Talk & Listen
        </button>
      ) : (
        <>
          <div style={{ background: "#000", color: "#fff", padding: "8px 12px", borderRadius: 12, fontSize: 12, border: "1px solid #22d3ee" }}>
            {speaking ? "🔊 EVA speaking..." : listening ? "🎤 EVA listening..." : "EVA ready"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => speak("Hello Boss, this is Eva. Can you hear me clearly?")} style={{ background: "#fff", color: "#000", border: "none", padding: "10px 16px", borderRadius: 999, fontWeight: 700, cursor: "pointer" }}>Test Voice</button>
            <button onClick={() => speak("Yes Boss, I am here.")} style={{ background: "#22d3ee", color: "#000", border: "none", padding: "10px 16px", borderRadius: 999, fontWeight: 700, cursor: "pointer" }}>Say Hi</button>
          </div>
        </>
      )}
    </div>
  );
        }
