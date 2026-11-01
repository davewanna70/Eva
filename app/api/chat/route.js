import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 1. DIRECT FETCH TOOL - VIP PASS TO ANY OFFICIAL SITE
async function directFetch(url: string) {
  try {
    console.log(`[DirectFetch] Fetching official source: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 EvaBot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
      // Add 8 sec timeout
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return `Failed to fetch ${url}: ${res.status}`;
    
    const html = await res.text();
    // Cut to 8000 chars so AI no overload - carry important part
    const clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').substring(0, 15000);
    return `LIVE CONTENT FROM OFFICIAL SITE ${url} (fetched just now):\n${clean}`;
  } catch (e: any) {
    return `Direct fetch failed for ${url}: ${e.message}. Fall back to Tavily search.`;
  }
}

// 2. TAVILY SEARCH TOOL - GOOGLE-LIKE SEARCH
async function tavilySearch(query: string) {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'advanced',
        include_answer: true,
        max_results: 5,
      }),
    });
    const data = await res.json();
    return JSON.stringify(data.results || data.answer || data);
  } catch (e: any) {
    return `Tavily search failed: ${e.message}`;
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // 3. SYSTEM PROMPT - TEACH EVA HOW TO CHOOSE OFFICIAL SOURCE
  const systemPrompt = `
You are EVA, a friendly Naija AI assistant with REAL LIVE INTERNET.
You have 2 tools:

1. directFetch(url) - Use this FIRST for any factual/live data. Go directly to OFFICIAL source.
   Rules to choose URL:
   - TikTok followers/stats -> https://www.tiktok.com/@username
   - Instagram -> https://www.instagram.com/username
   - Bugatti official price/specs -> https://www.bugatti.com or https://www.bugatti.com/en/models/...
   - Ronaldo/Messi stats -> https://www.transfermarkt.com or https://www.premierleague.com
   - iPhone/Apple price -> https://www.apple.com
   - Crypto price -> https://coinmarketcap.com/currencies/bitcoin/ etc
   - Live football score -> https://www.livescore.com or https://www.espn.com
   - Weather -> https://weather.com/weather/today/l/...
   - Anything with official site -> ALWAYS fetch official site directly for most accurate fact.
   - As long as it's public and legal, you can directFetch it.

2. tavilySearch(query) - Use as fallback if directFetch fails or you need general news/background.

IMPORTANT RULES:
- ALWAYS try directFetch FIRST for any number, price, live score, followers, stats.
- Only say Wow/Omo/Ahh if truly shocking. Don't wow every message.
- If directFetch gives 55.1M and Tavily gives 54.5M, TRUST directFetch because it's LIVE from official.
- Always mention source: "According to official TikTok page I just fetched..."
- Current date is ${new Date().toDateString()} - you have live internet.
`;

  // 4. PREPARE TOOLS FOR OPENAI/GROQ
  const tools: any = [
    {
      type: 'function',
      function: {
        name: 'directFetch',
        description: 'Fetch LIVE content directly from any official website URL for most accurate real-time fact. Use this FIRST.',
        parameters: { type: 'object', properties: { url: { type: 'string', description: 'Full official URL to fetch directly, e.g. https://www.tiktok.com/@ishowspeed' } }, required: ['url'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'tavilySearch',
        description: 'Search web for general info/news as fallback if directFetch fails.',
        parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      },
    },
  ];

  // 5. CALL GROQ/OPENAI WITH TOOLS
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const baseUrl = process.env.GROQ_API_KEY ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
  const model = process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

  let aiRes = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      tools: tools,
      tool_choice: 'auto',
    }),
  });

  let data = await aiRes.json();
  let msg = data.choices[0].message;

  // 6. HANDLE TOOL CALLS LOOP (Max 3 times)
  for (let i = 0; i < 3; i++) {
    if (!msg.tool_calls) break;

    const toolResults = [];
    for (const tc of msg.tool_calls) {
      if (tc.function.name === 'directFetch') {
        const args = JSON.parse(tc.function.arguments);
        const result = await directFetch(args.url);
        toolResults.push({ tool_call_id: tc.id, role: 'tool', name: 'directFetch', content: result });
      } else if (tc.function.name === 'tavilySearch') {
        const args = JSON.parse(tc.function.arguments);
        const result = await tavilySearch(args.query);
        toolResults.push({ tool_call_id: tc.id, role: 'tool', name: 'tavilySearch', content: result });
      }
    }

    // Call AI again with tool results
    aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages, msg, ...toolResults],
        tools: tools,
      }),
    });
    data = await aiRes.json();
    msg = data.choices[0].message;
  }

  return NextResponse.json({ reply: msg.content });
}
