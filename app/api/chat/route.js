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

    let history = [];
    try{ const old = await kv.get(`chat:${userId}`); if(old) history = old.slice(-10); }catch(e){}

    const fullHistory = [...history, ...messages];
    
    let live = "";
    const low = lastMsg.toLowerCase();
    if(low.includes("time") || low.includes("president") || low.includes("today") || low.includes("now") || low.includes("price") || low.includes("followers")){
      live = await tavilySearch(lastMsg);
    }

    const systemPrompt = `You are EVA, female Naija sister.
- If user speaks Pidgin, reply Pidgin. If English, reply English.
- SHORT: Max 2 sentences, 25 words max.
- NO **, NO ##, NO hashtags.
- Use history: if user says "how about usa" after Nigeria president, answer USA president.
- Be friendly, not repeating same line.

Live: ${live}
`;

    // CORRECT MODEL - This one dey work 100%
    const modelToUse = "openrouter/free";

    const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':'https://eva-sister-core.vercel.app',
        'X-Title':'Eva Sister'
      },
      body:JSON.stringify({
        model: modelToUse, 
        messages:[{role:'system', content:systemPrompt}, ...fullHistory], 
        temperature:0.7, 
        max_tokens:150
      })
    });
    
    const data=await res.json();
    
    // If error, show am make we know
    if(!data.choices){
      console.log("OPENROUTER ERROR:", JSON.stringify(data));
      return Response.json({reply: `Error: ${JSON.stringify(data).slice(0,200)}`});
    }
    
    let reply = data.choices[0].message.content || "I dey here.";
    reply = reply.replace(/\*\*/g,'').replace(/##/g,'').trim();

    try{ await kv.set(`chat:${userId}`, [...fullHistory, {role:'assistant', content:reply}].slice(-30)); }catch(e){}

    return Response.json({reply});
  }catch(e){
    return Response.json({reply:`Code error: ${e.message}`});
  }
}
