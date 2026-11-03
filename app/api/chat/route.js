// @ts-nocheck
export const dynamic = 'force-dynamic'
import { kv } from '@vercel/kv';

export async function POST(request) {
  try{
    const body = await request.json();
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

    const fullHistory = [...history, ...messages].filter(m => m?.content && String(m.content).trim() !== "");

    if(fullHistory.length === 0){
      return Response.json({reply: "Hey, I dey here! Ask me anything 😊"});
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const systemPrompt = `You are EVA, female Naija sister. Today is ${todayStr}.

CRITICAL RULES:
- Today is 2026. Never say "As of February 2024" or "My cutoff is 2024". 
- You DO NOT have live search unless told. Never invent fake matches like "scored against Al-Riyadh yesterday".
- If user asks current/live stats, say: "I no get live number for today, but as of 2024 he had ~890 career goals. Check ESPN or LiveScore for the live count today."
- LANGUAGE: Speak fluent correct English by default. Only use Pidgin if user speaks Pidgin first. User instructed you before to use English default.
- Be concise, 3-4 sentences max, friendly, helpful.
- NO **, NO ##, NO excessive emojis.
- Use chat history for context.
`;

    // Auto-switch model: cheap for normal, sonar for live questions
    let modelToUse = "google/gemma-3-27b-it";
    const lastUserMsg = String(fullHistory[fullHistory.length-1]?.content || "").toLowerCase();
    const needLive = /(current|today|now|live|score now|how many.*have now|news|latest|this week|this season)/i.test(lastUserMsg);
    
    if(needLive){
      modelToUse = "perplexity/sonar"; // live web model, costs small money
    }

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
        max_tokens:400
      })
    });
    
    const data=await res.json();
    
    if(!data.choices || !data.choices[0]){
      console.log("API ERROR:", JSON.stringify(data));
      return Response.json({reply: "Make you try again, small network glitch — I dey here."});
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
