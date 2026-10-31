export async function POST(req){
  try{
    const {message} = await req.json();
    return Response.json({ reply: `You said: ${message}. I'm EVA, Boss — I'm here.` });
  }catch(e){
    return Response.json({ reply: "I'm here Boss, say that again?" });
  }
}
