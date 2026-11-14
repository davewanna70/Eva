"use client";
import { useEffect, useRef } from "react";

// Invisible EVA Voice - No floating button, no blue pill
// Controlled from 3-dot menu in page.js
export default function EvaVoice({ enabled, onUserSaid, onSpeakState }) {
  const recognitionRef = useRef(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      try { recognitionRef.current?.stop(); } catch {}
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-NG";
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      if (!last.isFinal) return;
      const text = last[0].transcript.trim();
      if (!text) return;
      if (Date.now() - lastSentRef.current < 1200) return;
      lastSentRef.current = Date.now();
      if (onUserSaid) onUserSaid(text);
    };
    rec.onend = () => { if (enabled) { try { rec.start(); } catch {} } };
    recognitionRef.current = rec;
    try { rec.start(); } catch {}
    return () => { try { rec.stop(); } catch {} };
  }, [enabled]);

  return null; // No UI - all controls in 3-dot menu
}
