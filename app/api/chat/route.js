// @ts-nocheck
export const dynamic = 'force-dynamic'
import { kv } from '@vercel/kv';

export async function POST(request) {
  try{
    const body = await request.json();
    let messages = body.messages || [];
    const userId = body.userId || "guest";
    if(!Array.isArray(messages)) messages = [{role:'user', content: messages}];
    
    let history = [];
    try{ const old = await kv.get(`chat:${userId}`); if(old) history = old.slice(-10); }catch(e){}

    const fullHistory = [...history, ...messages];

    const systemPrompt = `You are EVA, female Naija sister.
- If user speaks Pidgin, reply in Pidgin. If English, English. Match user language.
- SHORT: Max 2 sentences, 25 words.
- NO **, NO ##.
- Be smart with context. Use history.
- Friendly, no repeat.
`;

    const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':'https://eva-sister-core.vercel.app',
        'X-Title':'Eva Sister'
      },
      body:JSON.stringify({
        model: "openrouter/free", 
        messages:[{role:'system', content:systemPrompt}, ...fullHistory], 
        temperature:0.7, 
        max_tokens:150
      })
    });
    
    const data=await res.json();
    
    if(!data.choices || !data.choices[0]){
      console.log("API ERROR:", JSON.stringify(data));
      return Response.json({reply: "Make you try again, small network glitch."});
    }
    
    let reply = data.choices[0].message.content || "I dey here, how I fit help?";
    reply = reply.replace(/\*\*/g,'').replace(/##/g,'').trim();

    try{ await kv.set(`chat:${userId}`, [...fullHistory, {role:'assistant', content:reply}].slice(-30)); }catch(e){}

    return Response.json({reply});
  }catch(e){
    return Response.json({reply:`Omo error: ${e.message}`});
  }
        }
