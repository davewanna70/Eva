// @ts-nocheck
export async function POST(req) {
  try {
    const { message, history = [], userName = "" } = await req.json();
    
    const systemPrompt = `You are EVA, highly intelligent international AI. Year 2026. User name: ${userName}. Remember history. For names like Zlatan list ALL famous people (Ibrahimovic Swedish football + Ibile Nigerian star). Be detailed friendly.`;

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ reply: "GROQ_API_KEY missing! Add it in Vercel Env Vars with Production ticked" });
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: systemPrompt }, ...history.slice(-10), { role: 'user', content: message }],
        temperature: 0.7
      })
    });

    const data = await res.json();
    if (!data.choices) return Response.json({ reply: `Groq Error: ${JSON.stringify(data).slice(0,500)}` });
    
    return Response.json({ reply: data.choices[0].message.content });
  } catch (e) {
    return Response.json({ reply: `Crash: ${e.message}` });
  }
}
