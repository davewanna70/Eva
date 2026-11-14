export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return new Response("No text", { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID; // Jessica

    if (!apiKey || !voiceId) {
      return new Response("ElevenLabs not configured", { status: 500 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
      }),
    });

    if (!res.ok) return new Response("ElevenLabs failed", { status: 500 });
    const audio = await res.arrayBuffer();
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg" } });
  } catch {
    return new Response("Speak error", { status: 500 });
  }
}
