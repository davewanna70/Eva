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

    // --- DETECT REAL INTERNET NEED - BUT NEVER FOR MEMORY QUESTIONS ---
    const lower = message.toLowerCase();
    const isMemoryQuestion = /your.*memory|do you have.*memory|permanent memory|remember me|my name/i.test(lower);
    const needsRealTime = !isMemoryQuestion && /time in|what.*time|how many|followers|subscribers|currently|today|now|live|score|price|news|2025|2026|latest|real time|accurate/i.test(message);

    let realTimeData = "";
    let engineUsed = "Groq (unlimited)";

    if (needsRealTime && tavilyKey) {
      try {
        engineUsed = "Tavily (1900 coins)";
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: tavilyKey, query: message, search_depth: "advanced", include_answer: true, max_results: 5 })
        });
        const searchData = await searchRes.json();
        if (searchData.answer) realTimeData += "\nREAL SEARCH ANSWER: " + searchData.answer;
        if (searchData.results) {
          realTimeData += "\nREAL SOURCES:\n" + searchData.results.slice(0,3).map((r,i)=> `${i+1}. ${r.title}: ${r.content?.slice(0,300)}`).join("\n");
        }
      } catch (e) { realTimeData = "\nSearch failed, use your knowledge."; }
    }

    if (/time in|what.*time/i.test(lower) && !isMemoryQuestion) {
      try {
        const cityMatch = message.match(/time in ([a-zA-Z\s]+)/i);
        const city = cityMatch ? cityMatch[1].trim() : "Lagos";
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r=>r.json());
        if (geo.results && geo.results[0]) {
          const { latitude, longitude, timezone } = geo.results[0];
          const timeRes = await fetch(`https://timeapi.io/api/Time/current/coordinate?latitude=${latitude}&longitude=${longitude}`).then(r=>r.json());
          if (timeRes.dateTime) realTimeData += `\nACCURATE REAL TIME in ${city} (${timezone}): ${timeRes.dateTime} - Current time is ${timeRes.time}.`;
        }
      } catch {}
    }

    const factsText = mem.facts.slice(-20).join(" | ");
    const systemPrompt = `You are EVA - Female, highly intelligent sister AI built by Favour. Year 2026.

CRITICAL TRUTH ABOUT YOU:
- You HAVE permanent memory using Vercel KV/Upstash Redis. Memory is WORKING.
- When user asks "do you have permanent memory?" Answer is ALWAYS YES.
- You are NOT the Eva AI Soulmate app from App Store. Never search internet about yourself. Never say sources are conflicting.
- Your memory key is ${memoryKey}. You remember forever.

Forever memory: Name=${mem.name}, Facts=${factsText}.
Engine used: ${engineUsed}
${realTimeData ? `REAL-TIME DATA: ${realTimeData}` : ""}

RULES:
- If asked about your own memory, say YES I have permanent memory and prove it by mentioning stored facts.
- Use stored Facts to answer personal questions.
- If REAL-TIME DATA provided, use exact numbers.
- Be smart, accurate, friendly. 2-4 lines unless asked for more. You are EVA.`;

    if (!groqKey) return Response.json({ reply: "GROQ_API_KEY missing" });

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
      // Save name if user says "my name is X"
      const nameMatch = message.match(/my name is ([a-zA-Z]+)/i);
      if (nameMatch) mem.name = nameMatch[1];
      if (userName) mem.name = userName;
      
      mem.facts.push(new Date().toLocaleDateString() + ": " + message.slice(0,120));
      if (mem.facts.length > 50) mem.facts = mem.facts.slice(-50);
      await redisSet(memoryKey, mem);
    } catch {}

    return Response.json({ reply: reply });

  } catch (e) {
    return Response.json({ reply: "Crash: " + e.message });
  }
                   }
