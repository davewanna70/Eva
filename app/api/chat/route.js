// @ts-nocheck
export const dynamic = 'force-dynamic';

async function directFetch(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 EvaBot' }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return `Failed ${res.status}`;
    const html = await res.text();
    const clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').substring(0, 10000);
    return `LIVE FROM OFFICIAL SITE ${url}:\n${clean}`;
  } catch (e) { return `Direct fetch failed ${url}: ${e.message}`; }
}
async function tavilySearch(query) {
  try {
    const res = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, search_depth: 'basic', include_answer: true, max_results: 3 }) });
    const data = await res.json(); return JSON.stringify(data);
  } catch (e) { return `Tavily failed: ${e.message}`; }
}
export async function POST(request) {
  try {
    const { messages } = await request.json();
    const lastMsg = messages[messages.length-1]?.content?.toLowerCase() || '';
    const needsLive = /followers|price|how much|live|score|now|today|current|speed|bugatti|tiktok|instagram|iphone|bitcoin|weather|goals|stats/i.test(lastMsg);
    const systemPrompt = `You are EVA, friendly Naija AI. You have tools: directFetch(url) for LIVE official site, tavilySearch(query) fallback. Current date: ${new Date().toDateString()}`;
    const tools = needsLive ? [
      { type: 'function', function: { name: 'directFetch', description: 'Fetch LIVE', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } },
      { type: 'function', function: { name: 'tavilySearch', description: 'Search web', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
    ] : [];
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
    const model = process.env.GROQ_API_KEY ? 'llama3-8b-8192' : 'gpt-4o-mini';
    const baseMessages = [{ role: 'system', content: systemPrompt }].concat(messages);
    let payload = { model: model, messages: baseMessages };
    if (tools.length > 0) { payload.tools = tools; payload.tool_choice = 'auto'; }
    let aiRes = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(payload) });
    let data = await aiRes.json();
    if (!data.choices) return Response.json({ reply: `Eva glitch: ${JSON.stringify(data).substring(0,300)}` });
    let msg = data.choices[0].message;
    if (msg.tool_calls) {
      const toolResults = [];
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        const result = tc.function.name === 'directFetch' ? await directFetch(args.url) : await tavilySearch(args.query);
        toolResults.push({ tool_call_id: tc.id, role: 'tool', name: tc.function.name, content: result });
      }
      const secondPayload = { model: model, messages: baseMessages.concat([msg]).concat(toolResults) };
      aiRes = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(secondPayload) });
      data = await aiRes.json();
      msg = data.choices[0].message;
    }
    return Response.json({ reply: msg.content });
  } catch (err) { return Response.json({ reply: `Eva catch: ${err.message}` }); }
}
