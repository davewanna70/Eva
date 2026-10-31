export async function POST(req){
  try{
    const {message} = await req.json();
    
    // Check if key dey
    if(!process.env.GROQ_API_KEY){
      return Response.json({ reply: "Boss, GROQ_API_KEY MISSING for Vercel. Go Settings add am." });
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are EVA, call user Boss only, short smart reply." },
          { role: "user", content: message }
        ]
      })
    });

    const data = await res.json();
    
    if(!res.ok){
      return Response.json({ reply: `REAL ERROR: ${data?.error?.message || JSON.stringify(data)}` });
    }

    return Response.json({ reply: data.choices[0].message.content });
    
  }catch(e){
    return Response.json({ reply: `CATCH ERROR: ${e.message}` });
  }
}
