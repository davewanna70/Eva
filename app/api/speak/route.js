export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text) return new Response(JSON.stringify({ error: "No text" }), { status: 400 });

    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim();

    if (!apiKey || !voiceId) {
      console.error("Missing env:", { hasKey: !!apiKey, hasVoiceId: !!voiceId });
      return new Response(JSON.stringify({ error: "ElevenLabs not configured - missing key or voice ID" }), { status: 500 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: text.slice(0, 4000),
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs error:", res.status, errText);
      // Send the REAL reason back so EVA can show it
      return new Response(JSON.stringify({ error: `ElevenLabs ${res.status}: ${errText}` }), { status: 500 });
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg" } });
  } catch (e) {
    console.error("Speak error:", e);
    return new Response(JSON.stringify({ error: "Speak error: " + e.message }), { status: 500 });
  }
}
