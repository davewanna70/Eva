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

    // --- REDIS FOREVER MEMORY ---
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

    const memoryKey = "eva:forever:" + (userId || "boss");
    let mem = await redisGet(memoryKey);
    if (!mem) mem = { name: userName || "Boss", facts: [], firstSeen: new Date().toISOString() };
    if (!mem.facts || !Array.isArray(mem.facts)) mem.facts = [];

    // --- DETECT IF NEED REAL INTERNET (Engine 2) ---
    const lower = message.toLowerCase();
    const needsRealTime = /time in|what.*time|how many|followers|subscribers|currently|today|now|live|score|price|news|2025|2026|latest|real time|accurate/i.test(message);

    let realTimeData = "";
    let engineUsed = "Groq (unlimited)";

    // --- ENGINE 2: TAVILY REAL SEARCH ---
    if (needsRealTime && tavilyKey) {
      try {
        engineUsed = "Tavily (1900 coins)";
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: message,
            search_depth: "advanced",
            include_answer: true,
            max_results: 5
          })
        });
        const searchData = await searchRes.json();
        if (searchData.answer) realTimeData += "\nREAL SEARCH ANSWER: " + searchData.answer;
        if (searchData.results) {
          realTimeData += "\nREAL SOURCES:\n" + searchData.results.slice(0,3).map((r,i)=> `${i+1}. ${r.title}: ${r.content?.slice(0,300)}`).join("\n");
        }
      } catch (e) { realTimeData = "\nSearch failed, use your knowledge."; }
    }

    // --- ENGINE FOR TIME (ANY CITY, NOT ONLY LAGOS) ---
    if (/time in|what.*time/i.test(lower)) {
      try {
        // Try get real time via timeapi.io for any city
        const cityMatch = message.match(/time in ([a-zA-Z\s]+)/i);
        const city = cityMatch ? cityMatch[1].trim() : "Lagos";
        // Use geocoding to get lat/long then time
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r=>r.json());
        if (geo.results && geo.results[0]) {
          const { latitude, longitude, timezone } = geo.results[0];
          const timeRes = await fetch(`https://timeapi.io/api/Time/current/coordinate?latitude=${latitude}&longitude=${longitude}`).then(r=>r.json());
          if (timeRes.dateTime) realTimeData += `\nACCURATE REAL TIME in ${city} (${timezone}): ${timeRes.dateTime} - Current time is ${timeRes.time}.`;
        }
      } catch {}
    }

    const factsText = mem.facts.slice(-20).join(" | ");
    const systemPrompt = `You are EVA - Female, highly intelligent sister AI. Year 2026.
Forever memory: Name=${mem.name}, Facts=${factsText}.
Engine used for this question: ${engineUsed}
${realTimeData ? `REAL-TIME INTERNET DATA (USE THIS FOR ACCURACY, DO NOT HALLUCINATE): ${realTimeData}` : "No real-time search needed, answer from knowledge."}

RULES:
- If REAL-TIME DATA provided, you MUST use it and quote exact numbers. Example: Wizkid followers = use the number from search, not your old memory.
- For time questions, use the ACCURATE REAL TIME provided, not guess.
- When name has many famous people (Ronaldo, Zlatan, Michael, Chris etc), list ALL famous with details, don't bring only one.
- Be smart, accurate, friendly. Keep reply 2-4 lines unless user asks for more details. You are EVA.`;

    if (!groqKey) return Response.json({ reply: "GROQ_API_KEY missing" });

    // --- ENGINE 1: GROQ (Almost unlimited) ---
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + groqKey },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: systemPrompt }, ...history.slice(-12), { role: "user", content: message }],
        temperature: 0.5
      })
    });

    const data = await groqRes.json();
    if (!data.choices) return Response.json({ reply: "Groq Error: " + JSON.stringify(data).slice(0,500) });

    const reply = data.choices[0].message.content;

    try {
      mem.facts.push(new Date().toLocaleDateString() + ": " + message.slice(0,120));
      if (mem.facts.length > 50) mem.facts = mem.facts.slice(-50);
      if (userName) mem.name = userName;
      await redisSet(memoryKey, mem);
    } catch {}

    return Response.json({ reply: reply });

  } catch (e) {
    return Response.json({ reply: "Crash: " + e.message });
  }
}
