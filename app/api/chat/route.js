// @ts-nocheck
export const dynamic = 'force-dynamic'
import { kv } from '@vercel/kv';

async function tavilySearch(query){
  try{
    const res=await fetch('https://api.tavily.com/search',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({api_key:process.env.TAVILY_API_KEY, query, max_results:3, include_answer:true})
    });
    const data=await res.json();
    return (data.answer || "").slice(0,2500);
  }catch(e){ return "" }
}

export async function POST(request) {
  try{
    const body = await request.json();
    let messages = body.messages || [];
    const userId = body.userId || "guest";
    if(!Array.isArray(messages)) messages = [{role:'user', content: messages}];
    const lastMsg = messages[messages.length-1]?.content || "";

    // GET memory
    let history = [];
    try{ const old = await kv.get(`chat:${userId}`); if(old) history = old.slice(-10); }catch(e){}

    const fullHistory = [...history, ...messages];
    
    let live = "";
    const low = lastMsg.toLowerCase();
    if(low.includes("http")){ try{ const r=await fetch(lastMsg.match(/https?:\/\/\S+/)?.[0]); live = (await r.text()).slice(0,2000);}catch(e){} }
    else if(low.includes("president") || low.includes("followers") || low.includes("time") || low.includes("price") || low.includes("today")){
      live = await tavilySearch(lastMsg);
    }

    const systemPrompt = `You are EVA. Female, smart, Naija sister.
STRICT RULES:
- SHORT: 1-2 sentences only, max 25 words. Unless user says "explain detail".
- NO **, NO ##, NO hashtags, NO many emojis (max 1).
- BE SMART WITH CONTEXT: Use history. If user said "president of Nigeria" then says "how about usa", you MUST answer "president of USA".
- No intro every time. Just answer direct like human on WhatsApp.
- No sources, no links.

History context + live: ${live}
`;

    const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`},
      body:JSON.stringify({model:"google/gemma-3-4b-it:free", messages:[{role:'system', content:systemPrompt}, ...fullHistory], temperature:0.6, max_tokens:120})
    });
    const data=await res.json();
    let reply = data.choices?.[0]?.message?.content || "Wetin you need?";
    reply = reply.replace(/\*\*/g,'').replace(/##/g,'').trim();

    try{ await kv.set(`chat:${userId}`, [...fullHistory, {role:'assistant', content:reply}].slice(-30)); }catch(e){}

    return Response.json({reply});
  }catch(e){
    return Response.json({reply:"Try again, network slow."});
  }
}
