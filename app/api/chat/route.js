// @ts-nocheck
export const dynamic = 'force-dynamic';

async function directFetch(url){
  try{
    const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(5000)});
    if(!r.ok) return 'Fetch failed '+r.status;
    return 'LIVE DATA:\n'+(await r.text()).substring(0,8000);
  }catch(e){ return 'Fetch error: '+e.message }
}

async function tavilySearch(query){
  try{
    const res=await fetch('https://api.tavily.com/search',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({api_key:process.env.TAVILY_API_KEY,query,max_results:5})
    });
    const data=await res.json();
    return JSON.stringify(data).substring(0,8000);
  }catch(e){ return 'Search fail' }
}

export async function POST(request){
  try{
    const body = await request.json();
    // FIX: Accept any format - messages, history, or single message
    let messages = body.messages || body.history || [];
    if(!messages.length && (body.message || body.input || body.prompt)){
      messages = [{role:'user', content: body.message || body.input || body.prompt}];
    }
    if(!Array.isArray(messages)) messages = [messages];
    
    const apiKey = process.env.OPENROUTER_API_KEY;
    const lastText = (messages[messages.length-1]?.content || '').toLowerCase();
    const needsLive = lastText.includes('live')||lastText.includes('follower')||lastText.includes('today')||lastText.includes('price')||lastText.includes('score')||lastText.includes('news');
    
    const tools = needsLive ? [
      {type:'function',function:{name:'directFetch',description:'Fetch live url content',parameters:{type:'object',properties:{url:{type:'string'}},required:['url']}}},
      {type:'function',function:{name:'tavilySearch',description:'Search web',parameters:{type:'object',properties:{query:{type:'string'}},required:['query']}}}
    ] : [];

    const systemPrompt = 'You are EVA, female Naija AI, sexy, helpful, smart, you have LIVE internet tools. Date: '+new Date().toDateString();

    const payload = {
      model: 'google/gemma-2-9b-it:free',
      messages: [{role:'system',content:systemPrompt},...messages],
      tools: tools.length?tools:undefined,
      tool_choice: tools.length?'auto':undefined
    };

    let res = await fetch('https://openrouter.ai/api/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey,'HTTP-Referer':'https://eva.vercel.app','X-Title':'Eva AI'},
      body: JSON.stringify(payload)
    });
    
    let data = await res.json();
    let msg = data.choices?.[0]?.message;
    
    if(!msg){
      payload.model = 'meta-llama/llama-3.1-8b-instruct:free';
      res = await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey},body:JSON.stringify(payload)});
      data = await res.json();
      msg = data.choices?.[0]?.message;
    }

    if(!msg) return Response.json({reply:'Boss check OPENROUTER_API_KEY. Error: '+JSON.stringify(data).substring(0,400)});

    if(msg.tool_calls){
      const toolResults=[];
      for(const tc of msg.tool_calls){
        const args = JSON.parse(tc.function.arguments);
        const result = tc.function.name==='directFetch'?await directFetch(args.url):await tavilySearch(args.query);
        toolResults.push({tool_call_id:tc.id,role:'tool',name:tc.function.name,content:result});
      }
      const res2 = await fetch('https://openrouter.ai/api/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey},
        body:JSON.stringify({model:payload.model,messages:[{role:'system',content:systemPrompt},...messages,msg,...toolResults]})
      });
      data = await res2.json();
      msg = data.choices?.[0]?.message;
    }

    return Response.json({reply: msg.content});
  }catch(e){
    return Response.json({reply:'Eva error fixed: '+e.message});
  }
}
