// EVA Voice - Gemini Kore ONLY - No ElevenLabs, No Phone Voice
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: "No GEMINI_API_KEY" }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: text.slice(0, 4000) }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Kore" }
              }
            }
          }
        }),
      }
    );

    const data = await response.json();
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      console.log("Gemini error:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "Gemini voice failed" }, { status: 500 });
    }

    const audioBuffer = Buffer.from(audioData, "base64");
    return new NextResponse(audioBuffer, {
      headers: { "Content-Type": "audio/wav" },
    });
  } catch (e) {
    console.log("Voice error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
