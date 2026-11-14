import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text, gender } = await req.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    // Use Jessica from Vercel FIRST, if no Jessica, fall back to Rachel
    const jessicaId = process.env.ELEVENLABS_VOICE_ID?.trim();
    const voices = { 
      female: jessicaId || '21m00Tcm4TlvDq8ikWAM', 
      male: 'pNInz6obpgDQGcFmaJgB' 
    };
    const voiceId = gender === 'male' ? voices.male : voices.female;

    if (!apiKey || !voiceId) {
      console.error("Missing ElevenLabs config", { hasKey: !!apiKey, hasVoiceId: !!voiceId });
      return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 500 });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({ 
        text: text.slice(0, 4000), 
        model_id: 'eleven_multilingual_v2', 
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true } 
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("ElevenLabs error:", response.status, errText);
      return NextResponse.json({ error: `ElevenLabs ${response.status}: ${errText}` }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (e) { 
    console.error("Voice error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}
