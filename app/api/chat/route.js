// @ts-nocheck
export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message || "";
    const history = body.history || [];
    const userName = body.userName || "";
    const userId = body.userId || "boss_default";

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    async function redisGet(key) {
      if (!redisUrl) return null;
      try {
        const r = await fetch(redisUrl + "/get/" + key, { headers: { Authorization: "Bearer " + redisToken } });
        const j = await r.json();
        return j.result ? JSON.parse(j.result) : null;
      } catch { return null; }
    }

    async function redisSet(key, value) {
      if (!redisUrl) return;
      try {
        await fetch(redisUrl + "/set/" + key, {
          method: "POST",
          headers: { Authorization: "Bearer " + redisToken, "Content-Type": "application/json" },
          body: JSON.stringify({ value: JSON.stringify(value) })
        });
      } catch {}
    }

    const memoryKey = "eva:forever:" + (userId || userName || "boss");
    let foreverMemory = await redisGet(memoryKey);
    if (!foreverMemory) foreverMemory = { name: userName, facts: [], firstSeen: new Date().toISOString() };

    let factsText = "";
    if (foreverMemory.facts && foreverMemory.facts.length > 0) {
      factsText = foreverMemory.facts.slice(-20).join(" | ");
    }

    const systemPrompt = "You are EVA - Highly Intelligent Sister AI. Year 2026. "
      + "FOREVER MEMORY about boss (from Vercel Storage - never forget): Name=" + (foreverMemory.name || "Boss")
      + ", First met=" + foreverMemory.firstSeen
      + ", Facts=" + factsText + ". "
      + "RULES: You NEVER forget this boss even if phone lost. "
      + "IMPORTANT: When user asks about a name like Zlatan, Chris, Michael, etc - if 2 or 3 famous people share that name, you MUST list ALL of them with details. "
      + "Example: Zlatan = 1) Zlatan Ibrahimovic (Swedish football legend) 2) Zlatan Ibile (Nigerian Zanku musician). "
      + "Another: If 3 famous people bear same name, detail all 3. Never bring only one person. Always ask which one user means after listing. "
      + "You are EVA, not Llama. Be detailed, loving, smart.";

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ reply: "GROQ_API_KEY missing" });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + process.env.GROQ_API_KEY },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: systemPrompt }, ...history.slice(-12), { role: "user", content: message }],
        temperature: 0.7
      })
    });

    const data = await groqRes.json();
    if (!data.choices) {
      return Response.json({ reply: "Groq Error: " + JSON.stringify(data).slice(0, 600) });
    }

    const reply = data.choices[0].message.content;

    // Save to forever memory
    if (message.length > 15) {
      foreverMemory.facts.push(new Date().toLocaleDateString() + ": " + message.slice(0, 150));
      if (foreverMemory.facts.length > 50) foreverMemory.facts = foreverMemory.facts.slice(-50);
      await redisSet(memoryKey, foreverMemory);
    }

    return Response.json({ reply: reply });

  } catch (e) {
    return Response.json({ reply: "Crash: " + e.message });
  }
}
