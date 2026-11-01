// @ts-nocheck
export const dynamic = 'force-dynamic';

async function directFetch(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 EvaBot' }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return `Failed ${res.status}`;
    const html = await res.text();
    const clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').substring(0, 8000);
    return `LIVE FROM ${url}:\n${clean}`;
  } catch (e) { return `Direct fetch failed: ${e.message}`; }
}
async function tavilySearch(query) {
  try {
    const res = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, search_depth: 'basic', include_answer: true, max_results: 3 }) });
    const data = await res.json(); return JSON.stringify(data);
  } catch (e) { return `Tavily failed: ${e.message}`; }
}

async function callGroq(payload, apiKey, baseUrl) {
  // Try models one by one until one works
  const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'llama-3.1-70b-versatile'];
  for (const model of modelsToTry) {
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ ...payload, model }),
      });
      const data = await res.json();
      if (data.choices) return data;
      console.log(`Model ${model} failed:`, JSON.stringify(data).substring(0,200));
    } catch (e) { console.log(`Model ${model} error:`, e.message); }
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];
    let lastMsg = "";
    if (messages.length > 0) lastMsg = (messages[messages.length-1]?.content || "").toLowerCase();
    const needsLive = /followers|price|how much|live|score|now|today|current|speed|bugatti|tiktok|instagram|iphone|bitcoin|weather|goals|stats/i.test(lastMsg);
    const systemPrompt = `You are EVA, friendly Naija AI. Tools: directFetch(url) for LIVE, tavilySearch(query) fallback. Date: ${new Date().toDateString()}`;
    const tools = needsLive ? [
      { type: 'function', function: { name: 'directFetch', description: 'Fetch LIVE', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } },
      { type: 'function', function: { name: 'tavilySearch', description: 'Search web', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
    ] : [];
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai
