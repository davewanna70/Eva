// @ts-nocheck
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];
    const apiKey = process.env.OPENAI_API_KEY;
    
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: 'You are EVA, female Naija AI, helpful, sweet, with live vibes. Date: ' + new Date().toDateString() }].concat(messages)
      })
    });
    
    const data = await res.json();
    if (data.error) return Response.json({ reply: 'OpenAI Error: ' + data.error.message + ' - Check your OPENAI_API_KEY balance for openai.com' });
    
    return Response.json({ reply: data.choices[0].message.content });
  } catch (e) {
    return Response.json({ reply: 'Eva error: ' + e.message });
  }
}
