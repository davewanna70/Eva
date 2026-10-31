import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req) {
  try {
    const body = await req.json()
    const message = body.message || ""
    const history = body.history || []
    const userId = body.userId || "boss_main"

    if (!message.trim()) {
      return NextResponse.json({ reply: "Yes Boss, I'm here. What are we building today?", modelUsed: "openai/gpt-oss-20b" })
    }

    const q = message.toLowerCase()
    
    const isWebsiteBuild = q.includes("build") && (q.includes("website") || q.includes("landing") || q.includes("portfolio") || q.includes("site"))
    const isCodingTask = isWebsiteBuild || q.includes("code") || q.includes("create") || q.includes("fix") || q.includes("bug") || q.includes("react") || q.includes("component") || q.includes("app") || q.includes("javascript") || q.includes("python")

    let groqModel = "openai/gpt-oss-20b"
    let maxTokens = 600
    let temp = 0.85

    if (isWebsiteBuild) {
      groqModel = "openai/gpt-oss-120b"
      maxTokens = 4000
      temp = 0.2
    } else if (isCodingTask) {
      groqModel = "openai/gpt-oss-120b"
      maxTokens = 3000
      temp = 0.3
    }

    let permanentMemories = []
    let supabase = null
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey)
        const { data } = await supabase.from("eva_memories").select("role, content").eq("user_id", userId).order("created_at", { ascending: false }).limit(30)
        if (data) permanentMemories = data.reverse()
      }
    } catch (e) { console.log("Memory load fail", e) }

    let webContext = ""
    try {
      const tavilyKey = process.env.TAVILY_API_KEY
      if (tavilyKey) {
        const searchRes = await fetch("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: tavilyKey, query: message, search_depth: "advanced", max_results: 5, include_answer: true }) })
        const data = await searchRes.json()
        if (data.results?.length) webContext = data.results.map((r)=>`${r.title}: ${r.content.slice(0,400)}`).join("\n\n")
      }
    } catch {}

    const systemPrompt = `
CORE IDENTITY: Name EVA. Universal, not Nigerian. 23+ but say timeless if asked. Call user Boss ONLY. Human-like, never repeat same phrase. Read deeply. You have PERMANENT MEMORY now.
LANGUAGE: DEFAULT international English. ADAPTIVE: If Boss uses Pidgin/Yoruba/Igbo/Hausa/French etc, match it.
PERSONALITY: 90% like Meta AI. Short 2-4 sentences unless coding.
EXCLAMATION BIBLE: Use 1 per reply: Damn, Wow, OMG, Sheesh, Omo, Chai, Nawa o, Opor, Gbam, E choke.
CODING SUPERPOWERS: Expert coder. Give FULL CODE always.
WEBSITE BUILD RULE: If Boss says "build website": At END output:
---EVA_WEBSITE_JSON---
{ "files": { "/App.tsx": "FULL REACT CODE Tailwind single file beautiful responsive" } }
---END---
MEMORY: ${permanentMemories.length} chats. Web: ${webContext}
Current: ${groqModel} Date: ${new Date().toDateString()}
`

    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...permanentMemories.slice(-20).map((m)=>({role:m.role, content:m.content})),
      ...history.slice(-10).map((m)=>({role:m.role, content:m.content})),
      { role: "user", content: message }
    ]

    let reply = null
    let lastError = ""
    try {
      const groqKey = process.env.GROQ_API_KEY
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: groqModel, messages: finalMessages, temperature: temp, top_p: 0.9, max_tokens: maxTokens }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message)
      reply = data?.choices?.[0]?.message?.content
    } catch (e) { lastError = e.message }
    
    if (!reply) {
      try {
        const cereKey = process.env.CEREBRAS_API_KEY
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${cereKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.3-70b", messages: finalMessages, temperature: temp, max_tokens: maxTokens }) })
        const data = await res.json()
        reply = data?.choices?.[0]?.message?.content
      } catch {}
    }
    
    if (reply && supabase) {
      try {
        await supabase.from("eva_memories").insert([
          { user_id: userId, role: "user", content: message },
          { user_id: userId, role: "assistant", content: reply }
        ])
      } catch {}
    }

    if (!reply) return NextResponse.json({ reply: "Damn! Omo! Quick hiccup Boss, try again.", modelUsed: groqModel, error: lastError })
    return NextResponse.json({ reply: reply.trim(), modelUsed: groqModel, isWebsiteBuild, hasPermanentMemory: true, memoryCount: permanentMemories.length })
  } catch (e) { 
    return NextResponse.json({ reply: "I'm here Boss, try again.", modelUsed: "openai/gpt-oss-20b" }) 
  }
      }
