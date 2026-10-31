export async function POST(req){
  try{
    const {message} = await req.json();
    const hasCerebras = !!process.env.CEREBRAS_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;

    if(!hasCerebras && !hasGroq){
      return Response.json({ reply: "Boss, No API key found. Add CEREBRAS or GROQ key." });
    }

    // FUNCTION to call Cerebras
    async function callCerebras(){
      const r = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CEREBRAS_API_KEY}` },
        body: JSON.stringify({
          model: "llama3.1-8b",
          messages: [{ role: "system", content: "You are EVA, call user Boss only, short smart reply." }, { role: "user", content: message }]
        })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error?.message || JSON.stringify(d));
      return d.choices[0].message.content;
    }

    // FUNCTION to call Groq
    async function callGroq(){
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "system", content: "You are EVA, call user Boss only, short smart reply." }, { role: "user", content: message }]
        })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error?.message || JSON.stringify(d));
      return d.choices[0].message.content;
    }

    // TRY CEREBRAS FIRST, THEN GROQ
    try{
      if(hasCerebras){
        const reply = await callCerebras();
        return Response.json({ reply });
      }
      throw new Error("No Cerebras");
    }catch(e1){
      // Cerebras failed, try Groq
      if(hasGroq){
        try{
          const reply = await callGroq();
          return Response.json({ reply });
        }catch(e2){
          return Response.json({ reply: `Both failed. Cerebras: ${e1.message} | Groq: ${e2.message}` });
        }
      }
      return Response.json({ reply: `Cerebras failed: ${e1.message} and no Groq key.` });
    }

  }catch(e){
    return Response.json({ reply: `System Error: ${e.message}` });
  }
}
