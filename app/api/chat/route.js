// @ts-nocheck
export const dynamic = 'force-dynamic'
import { kv } from '@vercel/kv';

export async function POST(request) {
  try{
    const body = await request.json();
    // FIX: Accept both message and messages
    let incomingText = body.message || body.prompt || "";
    let messages = body.messages || [];
    
    if(incomingText && messages.length === 0){
      messages = [{role:'user', content: incomingText}];
    }
    if(!Array.isArray(messages)) messages = [{role:'user', content: String(messages)}];
    
    let history = [];
    try{ 
      const old = await kv.get(`chat:${body.userId || "guest"}`);
      if(Array.isArray(old) && old.length > 0) history = old.slice(-10); 
    }catch(e){}

    const fullHistory = [...history, ...messages].filter(m => m.content && m.content.trim() !== "");

    // If still empty, no ask empty AI
    if(fullHistory.length === 0){
      return Response.json({reply: "Hey, I dey here! Ask me anything 😊"});
    }

    const systemPrompt = `You are EVA, female Naija sister.
- Match user language: Pidgin if user speaks Pidgin, else English.
- SHORT but helpful: Max 3 sentences.
- NO **, NO ##.
- Use history for context.
- Friendly, helpful, no repeat.
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
        model: "google/gemma-3-27b-it",
        messages:[{role:'system', content:systemPrompt}, ...fullHistory], 
        temperature:0.7, 
        max_tokens:300
      })
    });
    
    const data=await res.json();
    
    if(!data.choices || !data.choices[0]){
      console.log("API ERROR:", JSON.stringify(data));
      return Response.json({reply: "Make you try again, small network glitch."});
    }
    
    let reply = data.choices[0].message.content || "I dey here, how I fit help?";
    reply = reply.replace(/\*\*/g,'').replace(/##/g,'').trim();

    try{ 
      await kv.set(`chat:${body.userId || "guest"}`, [...fullHistory, {role:'assistant', content:reply}].slice(-30)); 
    }catch(e){}

    return Response.json({reply});
  }catch(e){
    console.log("SERVER ERROR:", e);
    return Response.json({reply:`Omo error: ${e.message}`});
  }
}
