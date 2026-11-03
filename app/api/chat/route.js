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
    const tavilyKey = process.env.TAVILY_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    async function redisGet(key) {
      if (!redisUrl || !redisToken) return null;
      try {
        const url = redisUrl + "/get/" + encodeURIComponent(key);
        const r = await fetch(url, { headers: { Authorization: "Bearer " + redisToken } });
        const j = await r.json();
        if (!j.result) return null;
        try { return JSON.parse(j.result); } catch { return j.result; }
      } catch (e) { return null; }
    }

    async function redisSet(key, value) {
      if (!redisUrl || !redisToken) return;
      try {
        const stringValue = JSON.stringify(value);
        const r = await fetch(redisUrl, {
          method: "POST",
          headers: { Authorization: "Bearer " + redisToken, "Content-Type": "application/json" },
          body: JSON.stringify([["SET", key, stringValue]])
        });
        await r.json();
      } catch (e) {}
    }

    const memoryKey = "eva:forever:" + (userId || "boss");
    let mem = await redisGet(memoryKey);
    if (!mem || typeof mem !== "object") {
      mem = { name: userName || "Boss", facts: [], firstSeen: new Date().toISOString() };
    }
    if (!mem.facts || !Array.isArray(mem.facts)) mem.facts = [];
    if (!mem.name) mem.name = userName || "Boss";

    const lower = message.toLowerCase();
    const isMemoryQuestion = lower.includes("memory") || lower.includes("my name") || lower.includes("who am i") || lower.includes("remember me");
    let needsRealTime = false;
    if (!isMemoryQuestion) {
      needsRealTime = lower.includes("time in") || lower.includes("followers") || lower.includes("currently") || lower.includes("today") || lower.includes("news") || lower.includes("price");
    }

    let realTimeData = "";
    if (needsRealTime && tavilyKey) {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: message, search_depth: "advanced", include_answer: true, max_results: 3 })
        });
        const searchData = await searchRes.json();
        if (searchData.answer) realTimeData = "REAL ANSWER: " + searchData.answer;
      } catch {}
    }

    const factsText = mem.facts.slice(-20).join(" | ");
    const systemPrompt = "You are EVA - Female sister AI built by Favour. Year 2026. You HAVE permanent memory using Vercel KV. When asked if you have permanent memory answer ALWAYS YES. You are NOT App Store Eva AI Soulmate. Memory Key=" + memoryKey + " Name=" + mem.name + " Facts=" + factsText + " " + realTimeData + " RULES: Use facts, say YES to memory.";

    if (!groqKey) return Response.json({ reply: "GROQ_API_KEY missing" });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + groqKey },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: systemPrompt }, ...history.slice(-12), { role: "user", content: message }],
        temperature: 0.5
      })
    });

    const data = await groqRes.json();
    if (!data.choices) return Response.json({ reply: "Groq Error: " + JSON.stringify(data).slice(0,300) });

    const reply = data.choices[0].message.content;

    try {
      const m = message.match(/my name is ([a-zA-Z]+)/i);
      if (m) mem.name = m[1];
      if (userName && userName !== "Boss") mem.name = userName;
      mem.facts.push(new Date().toLocaleDateString() + ": " + message.slice(0,120));
      if (mem.facts.length > 50) mem.facts = mem.facts.slice(-50);
      await redisSet(memoryKey, mem);
    } catch {}

    return Response.json({ reply: reply });
  } catch (e) {
    return Response.json({ reply: "Crash: " + e.message });
  }
}
