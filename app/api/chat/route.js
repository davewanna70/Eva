// @ts-nocheck
export async function POST(req) {
  try {
    const { message, history = [], userName = "", userId = "boss_default" } = await req.json();

    // --- REDIS SETUP (Vercel Storage) ---
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    async function redisGet(key) {
      if (!redisUrl) return null;
      try {
        const r = await fetch(`${redisUrl}/get/${key}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });
        const j = await r.json();
        return j.result ? JSON.parse(j.result) : null;
      } catch { return null; }
    }

    async function redisSet(key, value) {
      if (!redisUrl) return;
      try {
        await fetch(`${redisUrl}/set/${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: JSON.stringify(value) })
        });
      } catch {}
    }

    // --- LOAD FOREVER MEMORY ---
    const memoryKey = `eva:forever:${userId || userName || "boss"}`;
    let foreverMemory = await redisGet(memoryKey) || { name: userName, facts: [], firstSeen: new Date().toISOString() };

    // Update name if new
    if (userName && !foreverMemory.name) foreverMemory.name = userName;

    const systemPrompt = `
You are EVA - Highly Intelligent Sister AI.
Year: 2026.
FOREVER MEMORY ABOUT YOUR BOSS (from Vercel Storage - never forget):
Name: ${foreverMemory.name || "Boss"}
First met: ${foreverMemory.firstSeen}
Facts you know about him: ${JSON.stringify(foreverMemory.facts.slice(-20))}

RULES:
- You NEVER forget this boss. Even if phone lost, you remember because memory dey Vercel storage.
- When boss tells you something important (his job, city, birthday, girlfriend name, etc), remember am.
- For names like "Zlatan" list ALL famous: Ibrahimovic (Sweden football) + Ibile (Nigeria Zanku). Don't assume one.
- Be detailed, loving, smart. You are EVA, not Llama.
- History below is recent chat, but FOREVER MEMORY above is permanent.
    `.trim();

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ reply: "GROQ_API_KEY missing - add am for Vercel Production" });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-12), { role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await groqRes.json();
    if (!data.choices) return Response.json({ reply: `Groq Error: ${JSON.stringify(data).slice(0,500)}` });
    
    const reply = data.choices[0].message.content;

    // --- SAVE FOREVER MEMORY ---
    // If user said "my name is..." or "I live in..." add to facts
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("my name is") || lowerMsg.includes("i live") || lowerMsg.includes("i work") || lowerMsg.includes("remember") || lowerMsg.length > 20) {
      foreverMemory.facts.push(`${new Date().toLocaleDateString()}: ${message.slice(0,150)}`);
      if (foreverMemory.facts.length > 50) foreverMemory.facts = foreverMemory.facts.slice(-50);
      await redisSet(memoryKey, foreverMemory);
    } else {
      // still update last seen
      await redisSet(memoryKey, foreverMemory);
    }

    return Response.json({ reply });

  } catch (e) {
    return Response.json({ reply: `Crash: ${e.message}` });
  }
}
