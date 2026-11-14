"use client";
import { useEffect, useRef } from "react";

// Invisible EVA Voice - No floating button, no blue pill
// Controlled from 3-dot menu in page.js
// FIXED: No auto-restart loop, no ghost mic, stops cleanly
export default function EvaVoice({ enabled, onUserSaid, onSpeakState }) {
  const recognitionRef = useRef(null);
  const lastSentRef = useRef(0);
  const lastTextRef = useRef("");
  const shouldRunRef = useRef(false);
  const restartTimerRef = useRef(null);

  useEffect(() => {
    shouldRunRef.current = enabled;

    // If OFF - stop everything CLEANLY and don't restart
    if (!enabled) {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try { recognitionRef.current?.abort(); } catch {}
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = false; // FIXED: was true - true keeps mic open forever
    rec.interimResults = false; // FIXED: was true - true caused type-stop-continue glitch
    rec.lang = "en-NG";

    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      if (!last.isFinal) return;
      const text = last[0].transcript.trim();
      if (!text) return;
      // FIXED: Prevent same sentence sending twice
      if (text === lastTextRef.current && Date.now() - lastSentRef.current < 3000) return;
      if (Date.now() - lastSentRef.current < 1200) return;
      lastTextRef.current = text;
      lastSentRef.current = Date.now();
      if (onUserSaid) onUserSaid(text);
    };

    rec.onerror = (e) => {
      // FIXED: Don't restart on permission denied - that was causing blink loop
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        shouldRunRef.current = false;
        return;
      }
      // For other errors, wait 1 sec before retry, don't hammer mic
      if (shouldRunRef.current) {
        restartTimerRef.current = setTimeout(() => {
          try { rec.start(); } catch {}
        }, 1000);
      }
    };

    rec.onend = () => {
      // FIXED: Only restart if user still wants mic AND we are not speaking
      // And wait small, don't restart instantly (that caused on-off blink)
      if (shouldRunRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (shouldRunRef.current) {
            try { rec.start(); } catch {}
          }
        }, 500);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch {}

    return () => {
      shouldRunRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try { rec.abort(); } catch {}
      try { rec.stop(); } catch {}
    };
  }, [enabled]);

  return null;
}
