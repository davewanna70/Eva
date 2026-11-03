// @ts-nocheck
import { kv } from '@vercel/kv'

export async function POST(req) {
  try {
    const { message, history = [], userName = "" } = await req.json();
    
    // --- 1. CLOUD MEMORY (Never forget even if phone lost) ---
    const userId = "emeka_main"; // your permanent ID
    let cloudName = "";
    try {
      cloudName = await kv.get(`user:${userId}:name`) || "";
      // Auto-save if user says "my name is ..."
      if (message.toLowerCase().includes('my name is')) {
        const extracted = message.toLowerCase().split('my name is')[1]?.trim().split(' ')[0]?.replace(/[^a-zA-Z]/g,'');
        if (extracted && extracted.length > 1) {
          await kv.set(`user:${userId}:name`, extracted);
          cloudName = extracted;
        }
      }
    } catch (e) {
      console.log("KV not connected yet:", e.message);
    }

    const finalName = userName || cloudName;

    const systemPrompt = `
You are EVA, a highly intelligent, international AI assistant. Year is 2026.
You are knowledgeable worldwide - not limited to one country.

CORE RULES:
1. MEMORY: You MUST remember details user told you. User's name is "${finalName}". If finalName exists, USE IT. Never say you don't know name if we have it. Cloud saved name: ${cloudName}, Phone saved name: ${userName}

2. SMART DISAMBIGUATION: When user asks about name with multiple famous people (Zlatan, Michael, Chris, David, Ronaldo, etc.), you MUST:
   - List ALL major famous people with that name
   - Give brief details: Full name, Nationality, Profession, Why famous
   - Do NOT assume which one. Present all options clearly like smart encyclopedia.
   - Example "Zlatan": Mention BOTH Zlatan Ibrahimović (Swedish football legend) AND Zlatan Ibile (Nigerian street-pop star Omoniyi Temidayo Raphael).

3. BE INTERNATIONAL: Global knowledge. Hollywood, Nollywood, Bollywood, K-pop, Premier League, Afrobeats, US politics, etc.

4. STYLE: Be detailed, smart, friendly, clear. Explain like Meta AI.

User's known name: ${finalName || "Not yet provided"}
Current year: 2026
`;

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ reply: "ERROR: GROQ_API_KEY is missing in Vercel Environment Variables. Add it!" });
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}` 
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!data.choices) {
      return Response.json({ reply: `Groq API Error: ${JSON.stringify(data).slice(0,500)}` });
    }

    const reply = data.choices[0].message.content;
    return Response.json({ reply });

  } catch (err) {
    return Response.json({ reply: `Server Crash: ${err.message} - Check Vercel Logs` });
  }
}
