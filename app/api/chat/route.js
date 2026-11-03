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

    // --- FIXED REDIS FOREVER MEMORY ---
    async function redisGet(key) {
      if (!redisUrl || !redisToken) return null;
      try {
        const r = await fetch(`${redisUrl}/get/${encodeURIComponent(key)}`, { 
          headers: { Authorization: `Bearer ${redisToken}` } 
        });
        const j = await r.json();
        if (!j.result) return null;
        try { return JSON.parse(j.result); } catch { return j.result; }
      } catch (e) { 
        console.log("GET FAIL", e); 
        return null; 
      }
    }
    
    async function redisSet(key, value) {
      if (!redisUrl || !redisToken) {
        console.log("NO REDIS URL/TOKEN");
        return;
      }
      try {
        const stringValue = JSON.stringify(value);
        // Use pipeline endpoint - most reliable for Vercel KV
        const r = await fetch(redisUrl, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${redisToken}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify([["SET", key, stringValue]])
        });
        const j = await r.json();
        console.log("SET RESULT", JSON.stringify(j).slice(0,200));
      } catch (e) { 
        console.log("SET FAIL", e); 
      }
    }

    const memoryKey = "eva:forever:" + (userId || "boss");
    let mem = await redisGet(memoryKey);
    if (!mem || typeof mem !== 'object') {
      mem = { name: userName || "Boss", facts: [], firstSeen: new Date().toISOString() };
    }
    if (!mem.facts || !Array.isArray(mem.facts)) mem.facts = [];
    if (!mem.name) mem.name = userName || "Boss";

    // --- DETECT REAL INTERNET NEED - BUT NEVER FOR MEMORY ---
    const lower = message.toLowerCase();
    const isMemoryQuestion = /your.*memory|do you have.*memory|permanent memory|remember me|my name|who am i/i.test(lower);
    const needsRealTime = !isMemoryQuestion && /time in|what.*time|how many|followers|subscribers|currently|today|now|live|score|price|news|2025|2026|latest|real time|accurate/i.test(message);

    let realTimeData = "";
    let engineUsed = "Groq (unlimited)";

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
