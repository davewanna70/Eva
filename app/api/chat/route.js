// @ts-nocheck
export const dynamic = 'force-dynamic';

async function directFetch(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 EvaBot' },
      signal: AbortSignal.timeout(3000)
    });
    if (!r.ok) return 'Failed ' + r.status;
    const html = await r.text();
    const clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').substring(0, 8000);
    return 'LIVE FROM ' + url + ':\n' + clean;
  } catch (e) {
    return 'Fetch failed: ' + e.message;
  }
}

async function tavilySearch(query) {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        max_results: 3
      })
    });
    const data = await res.json();
    return JSON.stringify(data);
  } catch (e) {
    return 'Tavily failed: ' + e.message;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = body.messages || [];
    let lastMsg = '';
    if (messages.length > 0) {
      lastMsg = messages[messages.length - 1].content || '';
      lastMsg = lastMsg.toLowerCase();
    }

    let needsLive = false;
    if (lastMsg.includes('followers') || lastMsg.includes('live') || lastMsg.includes('price') || lastMsg.includes('today') || lastMsg.includes('now')) {
      needsLive = true;
    }

    const systemPrompt = 'You are EVA, friendly Naija AI. You have tools directFetch and tavilySearch. Date: ' + new Date().toDateString();

    let tools = [];
    if (needsLive) {
      tools = [
        { type: 'function', function: { name: 'directFetch', description: 'Fetch live site', parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } } },
        { type: 'function', function: { name: 'tavilySearch', description: 'Search web', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } }
      ];
    }

    let apiKey = '';
    let baseUrl = '';
    let model = '';

    if (process.env.GROQ_API_KEY) {
      apiKey = process.env.GROQ_API_KEY;
      baseUrl = 'https://api.groq.com/openai/v1';
      model = 'llama-3.3-70b-versatile';
    } else {
      apiKey = process.env.OPENAI_API_KEY;
      baseUrl = 'https://api.openai.com/v1';
      model = 'gpt-4o-mini';
    }

    const baseMessages = [{ role: 'system', content: systemPrompt }].concat(messages);

    let payload = {
      model: model,
      messages: baseMessages
    };

    if (tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    let aiRes = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify(payload)
    });

    let data = await aiRes.json();

    if (!data.choices) {
      if (model === 'llama-3.3-70b-versatile') {
        payload.model = 'llama-3.1-8b-instant';
        aiRes = await fetch(baseUrl + '/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
          body: JSON.stringify(payload)
        });
        data = await aiRes.json();
      }
    }

    if (!data.choices) {
      return Response.json({ reply: 'Boss try again in 5 sec: ' + JSON.stringify(data).substring(0, 200) });
    }

    let msg = data.choices[0].message;

    if (msg.tool_calls) {
      const toolResults = [];
      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments);
        let result = '';
        if (tc.function.name === 'directFetch') {
          result = await directFetch(args.url);
        } else {
          result = await tavilySearch(args.query);
        }
        toolResults.push({ tool_call_id: tc.id, role: 'tool', name: tc.function.name, content: result });
      }

      const secondPayload = {
        model: model,
        messages: baseMessages.concat([msg]).concat(toolResults)
      };

      aiRes = await fetch(baseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify(secondPayload)
      });

      data = await aiRes.json();
      msg = data.choices[0].message;
    }

    return Response.json({ reply: msg.content });
  } catch (err) {
    return Response.json({ reply: 'Eva dey here Boss, how I fit help?' });
  }
}
