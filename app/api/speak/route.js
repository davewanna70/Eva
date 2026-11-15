// app/api/speak/route.js — JENNY ONLY, NO ELEVENLABS, NO CREDITS
import { EdgeTTS } from "@andresaya/edge-tts";

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "No text" }), { status: 400 });
    }

    const cleanText = text.replace(/[*#_`>]/g, "").slice(0, 1000);

    const tts = new EdgeTTS();
    const result = await tts.synthesize(cleanText, "en-US-JennyNeural");

    // result.audio na the mp3 buffer
    const audioBuffer = result.audio || result;

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("JENNY ERROR:", e);
    return new Response(JSON.stringify({ error: "Jenny failed: " + e.message }), { status: 500 });
  }
}
