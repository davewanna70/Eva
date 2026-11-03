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
      } catch { return null; }
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
      } catch {}
    }

    const memoryKey = "eva:forever:" + (userId || "boss");
    let mem = await redisGet(memoryKey);
    if (!mem || typeof mem !== "object") {
      mem = { name: userName || "", job: "", location: "", state: "", facts: [], firstSeen: new Date().toISOString(), lastSeen: "" };
    }
    if (!mem.facts || !Array.isArray(mem.facts)) mem.facts = [];
    if (!mem.name) mem.name = userName || "";

    const lower = message.toLowerCase();
    const isMemoryQuestion = lower.includes("memory") || lower.includes("my name") || lower.includes("who am i") || lower.includes("remember me") || lower.includes("where do i live") || lower.includes("what is my job") || lower.includes("what do i want");
    let needsRealTime = false;
    if (!isMemoryQuestion) {
      needsRealTime = /time in|what.*time|how many|followers|subscribers|currently|today|now|live|score|price|news|2025|2026|latest|real time|accurate/i.test(message);
    }

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
          realTimeData += "\nREAL SOURCES:\n" + searchData.results.slice(0,3).map(function(r,i){ return (i+1) + ". " + r.title + ": " + (r.content ? r.content.slice(0,300) : ""); }).join("\n");
        }
      } catch { realTimeData = "\nSearch failed, use your knowledge."; }
    }

    if (/time in|what.*time/i.test(lower) && !isMemoryQuestion) {
      try {
        const cityMatch = message.match(/time in ([a-zA-Z\s]+)/i);
        const city = cityMatch ? cityMatch[1].trim() : "Lagos";
        const geo = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1").then(function(r){ return r.json(); });
        if (geo.results && geo.results[0]) {
          const latitude = geo.results[0].latitude;
          const longitude = geo.results[0].longitude;
          const timezone = geo.results[0].timezone;
          const timeRes = await fetch("https://timeapi.io/api/Time/current/coordinate?latitude=" + latitude + "&longitude=" + longitude).then(function(r){ return r.json(); });
          if (timeRes.dateTime) realTimeData += "\nACCURATE REAL TIME in " + city + " (" + timezone + "): " + timeRes.dateTime + " - Current time is " + timeRes.time + ".";
        }
      } catch {}
    }

    let memoryDetails = "";
    if (mem.name) memoryDetails += "Name=" + mem.name + ". ";
    if (mem.job) memoryDetails += "Job=" + mem.job + ". ";
    if (mem.location) memoryDetails += "Location=" + mem.location + ". ";
    if (mem.state) memoryDetails += "State=" + mem.state + ". ";
    const factsText = mem.facts.slice(-30).join(" | ");
    if (factsText) memoryDetails += "Past conversations (remember all): " + factsText;

    const systemPrompt = "You are EVA. Just EVA. Year 2026. CRITICAL TRUTH: You HAVE permanent memory using Vercel KV - memory WORKING forever, stored under key " + memoryKey + ". When asked if you have permanent memory answer ALWAYS YES. You are NOT App Store Eva AI Soulmate app. Never search internet about yourself. Forever memory: " + memoryDetails + " Engine used: " + engineUsed + " " + realTimeData + " RULES: 1. If REAL-TIME DATA provided, MUST use it and quote exact numbers (followers, time etc). 2. For time questions use ACCURATE REAL TIME provided. 3. When name has many famous people (Ronaldo, Zlatan, Michael etc) list ALL famous with details. 4. You remember EVERYTHING user told you - Bugatti, job, state, name - in details forever, even after refresh or 7 years. 5. Be smart, accurate, friendly. 2-4 lines unless asked for more. You are EVA.";

    if (!groqKey) return Response.json({ reply: "GROQ_API_KEY missing" });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + groqKey },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: systemPrompt }].concat(history.slice(-12)).concat([{ role: "user", content: message }]),
        temperature: 0.5
      })
    });

    const data = await groqRes.json();
    if (!data.choices) return Response.json({ reply: "Groq Error: " + JSON.stringify(data).slice(0,500) });

    const reply = data.choices[0].message.content;

    try {
      if (lower.includes("david")) mem.name = "David";
      const nameMatch = message.match(/my name is ([a-zA-Z]+)/i);
      if (nameMatch) mem.name = nameMatch[1];
      if (lower.includes("developer")) mem.job = "developer";
      if (lower.includes("imo")) { mem.state = "Imo State"; mem.location = "Imo State"; }
      if (userName && userName !== "Boss" && userName.length > 1) mem.name = userName;

      const fullFact = new Date().toLocaleString() + ": " + message.slice(0, 500);
      mem.facts.push(fullFact);
      if (mem.facts.length > 100) mem.facts = mem.facts.slice(-100);
      mem.lastSeen = new Date().toISOString();

      await redisSet(memoryKey, mem);
    } catch {}

    return Response.json({ reply: reply });

  } catch (e) {
    return Response.json({ reply: "Crash: " + e.message });
  }
}
