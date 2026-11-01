import { NextResponse } from 'next/server';
export async function POST(req) {
  try {
    const { text, gender } = await req.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voices = { female: '21m00Tcm4TlvDq8ikWAM', male: 'pNInz6obpgDQGcFmaJgB' };
    const voiceId = gender === 'male' ? voices.male : voices.female;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.7, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true } })
    });
    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
