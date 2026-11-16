// app/api/voice/route.js — KORE ONLY (Gemini) - FIXED
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';

function pcmToWav(pcmBuffer) {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(buffer, 44);
  return buffer;
}

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    // Remove emoji + markdown wey dey make Gemini TTS fail
    const cleanText = text.replace(/[*#_`>]/g, "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim().slice(0, 900);
    if (!cleanText) return NextResponse.json({ error: "No clean text" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.log("KORE ERROR: No GEMINI_API_KEY in Vercel");
      return NextResponse.json({ error: "No GEMINI_API_KEY" }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: cleanText }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
          }
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    // NEW: Show REAL Gemini error, no hide am
    if (!response.ok) {
      console.log("GEMINI VOICE FAILED:", response.status, JSON.stringify(data).slice(0, 800));
      return NextResponse.json({ error: data?.error?.message || "Gemini voice failed", geminiStatus: response.status }, { status: 502 });
    }

    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      console.log("GEMINI VOICE NO AUDIO:", JSON.stringify(data).slice(0, 800));
      return NextResponse.json({ error: data?.candidates?.[0]?.finishReason || "Kore voice failed - no audio" }, { status: 502 });
    }

    const wavBuffer = pcmToWav(Buffer.from(audioData, "base64"));
    return new NextResponse(wavBuffer, {
      status: 200,
      headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("KORE ERROR:", e);
    return NextResponse.json({ error: "Kore failed: " + e.message }, { status: 500 });
  }
}
