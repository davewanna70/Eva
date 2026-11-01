// @ts-nocheck
export const dynamic = 'force-dynamic';

async function directFetch(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3000) });
    if (!r.ok) return 'Failed ' + r.status;
    const html = await r.text();
    return 'LIVE FROM ' + url + ':\n' + html.substring(0, 8000);
  } catch (e) { return 'Fetch fail: ' + e.message; }
}
async function tavilySearch(q) {
  try {
    const res = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: q, max_results: 3 }) });
    return JSON.stringify(await res.json());
  } catch (e) { return 'Tavily fail'; }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];
    const last = (messages.length > 0 ? messages[messages.length-1].content : '').toLowerCase();
    const needsLive = last.includes('followers') || last.includes('live') || last.includes('price') || last.includes('today');

    const tools = needsLive ? [
      { type: 'function', function: { name: 'directFetch', description: 'Fetch live', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } },
      { type: 'function', function: { name: 'tavilySearch', description: 'Search', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } }
    ] : [];

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
    const systemPrompt = 'You are EVA, friendly Naija AI with live internet. Date: ' + new Date().toDateString();
    const baseMessages = [{ role: 'system', content: systemPrompt }].concat(messages);

    // MODELS THAT WORK FOR ALL GROQ FREE KEYS
    const models = process.env.GROQ_API_KEY 
      ? ['gemma2-9b-it', 'llama-3.3-70b-versatile', 'meta-llama/llama-4-scout-17b-16e-instruct', 'llama-3.1-8b-instant']
      : ['gpt-4o-mini'];

    let finalData = null;
    for (const model of models) {
      let payload = { model: model, messages: baseMessages };
      if (tools.length > 0) { payload.tools = tools; payload.tool_choice = 'auto'; }
      const res = await fetch(baseUrl + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.choices) { finalData = data; break; }
    }

    if (!finalData || !finalData.choices) return Response.json({ reply: 'Boss abeg generate new GROQ_API_KEY for console.groq.com, your old one don expire' });

    let msg = finalData.choices[0].message;
    if (msg.tool_calls) {
      const toolResults = [];
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        const result = tc.function.name === 'directFetch' ? await directFetch(args.url) : await tavilySearch(args.query);
        toolResults.push({ tool_call_id: tc.id, role: 'tool', name: tc.function.name, content: result });
      }
      const secondPayload = { model: finalData.model || models[0], messages: baseMessages.concat([msg]).concat(toolResults) };
      const res2 = await fetch(baseUrl + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }, body: JSON.stringify(secondPayload) });
      finalData = await res2.json();
      msg = finalData.choices[0].message;
    }
    return Response.json({ reply: msg.content });
  } catch (err) {
    return Response.json({ reply: 'Eva dey here Boss' });
  }
}
