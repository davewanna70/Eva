// app/api/speak/route.js — JENNY ONLY
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { EdgeTTS } from "@andresaya/edge-tts";

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: "No text" }), { status: 400 });
    }

    const cleanText = text.replace(/[*#_`>]/g, "").slice(0, 1000);

    const tts = new EdgeTTS();
    // generate() na the correct one wey dey return audio
    const result = await tts.generate(cleanText, "en-US-JennyNeural");

    let audioBuffer = result.audio;
    // If e return Blob, convert am to Buffer
    if (audioBuffer && typeof audioBuffer.arrayBuffer === "function") {
      audioBuffer = Buffer.from(await audioBuffer.arrayBuffer());
    }
    // If e return Uint8Array / ArrayBuffer
    if (audioBuffer instanceof ArrayBuffer) {
      audioBuffer = Buffer.from(audioBuffer);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error("Jenny returned empty audio");
    }

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
