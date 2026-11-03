// @ts-nocheck
export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message || "";
    const history = body.history || [];
    const userId = body.userId || "boss_default";
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    const groqKey = process.env.GROQ_API_KEY;

    async function redisGet(key) {
      if (!redisUrl || !redisToken) return null;
      try {
        const r = await fetch(redisUrl + "/pipeline", {
          method: "POST", headers: { Authorization: "Bearer " + redisToken, "Content-Type": "application/json" },
          body: JSON.stringify([["GET", key]])
        });
        const j = await r.json();
        if (!j[0]?.result) return null;
        return JSON.parse(j[0].result);
      } catch { return null; }
    }
    async function redisSet(key, value) {
      if (!redisUrl || !redisToken) return;
      try {
        await fetch(redisUrl + "/pipeline", {
          method: "POST", headers: { Authorization: "Bearer " + redisToken, "Content-Type": "application/json" },
          body: JSON.stringify([["SET", key, JSON.stringify(value)]])
        });
      } catch {}
    }

    const memoryKey = "eva:forever:" + userId;
    let mem = await redisGet(memoryKey);
    if (!mem || typeof mem !== "object") mem = { people: {}, current: "David", facts: [] };
    if (!mem.people) mem.people = {};
    if (!mem.people["David"]) mem.people["David"] = { name: "David", job: "", location: "" };
    
    const lower = message.toLowerCase();
    let extractedName = "";
    if (lower.includes("david")) extractedName = "David";
    const m1 = message.match(/my name is ([A-Za-z]+)/i);
    if (m1) extractedName = m1[1];
    const m2 = message.match(/it's me ([A-Za-z]+)/i);
    if (m2) extractedName = m2[1];

    if (extractedName) {
      extractedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1).toLowerCase();
      if (!mem.people[extractedName]) mem.people[extractedName] = { name: extractedName, job: "", location: "" };
      mem.current = extractedName;
    }

    let current = mem.current || "David";
    if (!mem.people[current]) mem.people[current] = { name: current, job: "", location: "" };
    const person = mem.people[current];

    if (lower.includes("developer") || lower.includes("dev") || lower.includes("coding")) person.job = "developer";
    if (lower.includes("pilot")) person.job = "pilot";
    if (lower.includes("nurse")) person.job = "nurse";
    if (lower.includes("imo")) person.location = "Imo State";
    if (lower.includes("lagos")) person.location = "Lagos";
    if (lower.includes("abuja")) person.location = "Abuja";

    person.lastSeen = new Date().toISOString();
    mem.facts = mem.facts || [];
    mem.facts.push(message.slice(0,200));
    await redisSet(memoryKey, mem);

    const allPeopleText = Object.values(mem.people).map(p => `${p.name}: job=${p.job || 'unknown'}, location=${p.location || 'unknown'}`).join(" | ");
    const systemPrompt = `You are EVA. PERMANENT memory. DATABASE: ${allPeopleText}. CURRENT USER IS ${current}. HIS DATA: Name=${person.name}, Job=${person.job}, Location=${person.location}. RULE: When asked what you know about me, MUST say Name, Job, Location. For David MUST say developer from Imo State if in DATABASE. Never say only name. Remember unlimited people: ${allPeopleText}`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + groqKey },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: systemPrompt }, ...history.slice(-8), { role: "user", content: message }],
        temperature: 0.2
      })
    });
    const data = await groqRes.json();
    return Response.json({ reply: data.choices?.[0]?.message?.content || "Error" });
  } catch (e) {
    return Response.json({ reply: "Crash: " + e.message });
  }
}
