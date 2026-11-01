// @ts-nocheck
export const dynamic = 'force-dynamic'
import { kv } from '@vercel/kv';

async function directFetch(url){
  try{
    const r=await fetch(url,{headers:{'User-Agent':'Eva'}});
    if(r.ok) return (await r.text()).slice(0,3000);
    return '';
  }catch(e){ return '' }
}

async function tavilySearch(query){
  try{
    const res=await fetch('https://api.tavily.com/search',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({api_key:process.env.TAVILY_API_KEY, query, max_results:3, include_answer:true})
    });
    const data=await res.json();
    return (data.answer || JSON.stringify(data.results).slice(0,3000));
  }catch(e){ return '' }
}

export async function POST(request) {
  try{
    const body = await request.json();
    let messages = body.messages || body.message || [];
    const userId = body.userId || "default_user";
    if(!Array.isArray(messages)) messages = [{role:'user', content: messages}];
    
    const lastUserMsg = messages[messages.length-1]?.content || "";

    // --- MEMORY: GET ---
    let history = [];
    try{
      const old = await kv.get(`chat:${userId}`);
      if(Array.isArray(old)) history = old.slice(-12); // last 12 only for speed + context
    }catch(e){}

    // --- SMART CONTEXT FIX: If user says "how about X" "in Owerri" "in USA" ---
    // We keep history so AI knows we are still talking about same topic
    const fullMessagesForAI = [...history, ...messages];

    // --- ONLY USE LIVE TOOLS WHEN NEEDED ---
    const lower = lastUserMsg.toLowerCase();
    const needsLive = lower.includes("http") || lower.includes("today") || lower.includes("now") || lower.includes("live") || lower.includes("price") || lower.includes("how many") || lower.includes("followers") || lower.includes("president") || lower.includes("time");
    
    let liveContext = "";
    if(needsLive){
      if(lower.includes("http")) liveContext = await directFetch(lastUserMsg.match(/https?:\/\/\S+/)?.[0] || "");
      else if(lower.includes("follower") || lower.includes("president") || lower.includes("time") || lower.includes("price")) {
         liveContext = await tavilySearch(lastUserMsg);
      }
    }

    const systemPrompt = `
You are EVA, female AI sister. You are super smart, fast, and human.
RULES YOU MUST OBEY:
1. SHORT: Max 1-2 sentences. Max 25 words. Never give long essay unless user says "explain in detail".
2. NO FORMATTING: Never use **bold**, ##, **, hashtags, too many commas. Talk normal like WhatsApp.
3. NO EMOJIS overload: Max 1 emoji per reply, or none.
4. SMART CONTEXT: If user asks "how about usa" after "who is president of Nigeria", you MUST understand they mean "who is president of USA". Always use previous conversation to understand.
5. BE CONCISE: If they ask "how many followers does Wizkid have on tiktok" answer: "Wizkid has about 3.4M on TikTok as of now." STOP. No source, no over 53M likes story.
6. TIME: If they ask time, give short time only. Example: "It's 3:45 PM in Owerri now."
7. NEVER say "As an AI", "Hey there! gorgeous! EVA here your sexy smart Naija AI" - Stop that intro everytime. Just answer direct.

User ID: ${userId}
${liveContext ? `LIVE INFO: ${liveContext}` : ""}
`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    // FAST MODEL ONLY - no 3 fallbacks = faster (2 sec not 6 sec)
    const payload={
      model:"google/gemma-3-4b-it:free",
      messages:[{role:'system', content:systemPrompt}, ...fullMessagesForAI],
      temperature:0.7,
      max_tokens:120
    };

    const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify(payload)
    });
    const data=await res.json();
    let reply = data.choices?.[0]?.message?.content || "I dey here. Wetin you need?";

    // Clean reply: remove ** and ##
    reply = reply.replace(/\*\*/g, '').replace(/##/g, '').replace(/#\w+/g, '').trim();

    // --- MEMORY: SAVE ---
    try{
      const toSave = [...fullMessagesForAI, {role:'assistant', content:reply}];
      await kv.set(`chat:${userId}`, toSave.slice(-30)); // keep last 30
    }catch(e){}

    return Response.json({reply});

  }catch(e){
    return Response.json({reply: "Network slow, try again."});
  }
}
