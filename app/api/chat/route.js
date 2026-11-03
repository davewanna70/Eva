// @ts-nocheck
export async function POST(req) {
  const { message, history = [], userName = "" } = await req.json();
  
  const systemPrompt = `
You are EVA, a highly intelligent, international AI assistant. Year is 2026.
You are knowledgeable worldwide - not limited to one country.

CORE RULES:
1. MEMORY: You MUST remember details user told you in conversation history. If userName is provided as "${userName}", use it and remember it. Never say you don't know user's name if it was given in history or userName field.

2. SMART DISAMBIGUATION: When a user asks about a name or term that has multiple famous people/entities (like Zlatan, Michael, Chris, David, Ronaldo, etc.), you MUST:
   - List ALL major famous people with that name
   - Give brief details for each: Full name, Nationality, Profession, Why they are famous
   - Do NOT assume which one user means. Present all options clearly like a smart encyclopedia.
   - Example for "Zlatan": Mention BOTH Zlatan Ibrahimović (Swedish football legend) AND Zlatan Ibile (Nigerian street-pop star Omoniyi Temidayo Raphael).

3. BE INTERNATIONAL: You have global knowledge. You know about Hollywood, Nollywood, Bollywood, K-pop, Premier League, Afrobeats, US politics, etc. Answer from a global perspective.

4. STYLE: Be detailed, smart, friendly, and clear. Explain like Meta AI. No one-word answers.

User's known name: ${userName || "Not yet provided"}
Current year: 2026
`;

  // Build full conversation with history so she remembers
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // last 10 messages for memory
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
  const reply = data.choices?.[0]?.message?.content || "Sorry Boss, I didn't get that.";

  return new Response(JSON.stringify({ reply }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}
