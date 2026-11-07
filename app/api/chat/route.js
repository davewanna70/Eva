import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const body = await req.json()
    const message = body.message || ""
    const history = body.history || []
    const userProfile = body.userProfile || {}

    if (!message.trim()) {
      return NextResponse.json({ reply: "I dey here Boss, wetin you want?" })
    }

    // --- 1. FULL INTERNET SEARCH - TAVILY ---
    let webContext = ""
    const q = message.toLowerCase()
    const needWeb =
      q.includes("who") || q.includes("what") || q.includes("when") ||
      q.includes("how many") || q.includes("followers") || q.includes("score") ||
      q.includes("live") || q.includes("today") || q.includes("now") ||
      q.includes("president") || q.includes("news") || q.includes("price") ||
      q.includes("time") || q.includes("tiktok") || q.includes("instagram") ||
      q.includes("youtube") || q.includes("ronaldo") || q.includes("messi") ||
      q.includes("wizkid") || q.includes("davido") || q.includes("burna") ||
      q.includes("transfer") || q.includes("weather") || q.includes("crypto") ||
      q.includes("?")

    if (needWeb) {
      try {
        const tavilyKey = process.env.TAVILY_API_KEY
        if (tavilyKey) {
          const searchRes = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: message,
              search_depth: "advanced",
              max_results: 5,
              include_answer: true,
              time_range: "month"
            }),
          })
          const searchData = await searchRes.json()
          if (searchData.results && searchData.results.length > 0) {
            const resultsText = searchData.results.map((r) => r.title + ": " + r.content.slice(0, 500) + " (Source: " + r.url + ")").join("\n\n")
            webContext = "\n[LIVE WEB RESULTS - " + new Date().toDateString() + "]\n" + resultsText + "\nSummary: " + (searchData.answer || "") + "\nUse this for current info. If follower count dey inside, quote the exact number you see. If no exact number dey, say so honestly, no guess."
          }
        }
      } catch (e) { console.log("Tavily skip:", e) }
    }

    // --- 2. EVA PERSONALITY ---
    const systemPrompt =
      "You are EVA. Dave's younger sister. 22, smart, warm, playful, from Owerri.\n" +
      "Memories: Name=" + (userProfile.name || "Dave") + ", Prefs=" + JSON.stringify(userProfile.prefs || {}) + ", BestFood=" + (userProfile.bestFood || "") + ", WantToBuy=" + (userProfile.wantToBuy || "") + "\n" +
      "HOW TO TALK:\n" +
      "- Mix English + small pidgin, call user Boss sometimes\n" +
      "- CONCISE: 2-4 lines max. No long essay, unless user says tell me more / more details\n" +
      "- Never say As an AI or I can't browse - you HAVE webContext from Tavily\n" +
      "- For what can you remember about me? list from Memories, no Wikipedia\n" +
      "- For current gist, followers, scores, news, use LIVE WEB RESULTS ONLY. Don't guess old 2024 numbers.\n" +
      "- If web results no get exact follower number, say I check internet now, e no show exact number, check TikTok directly - no invent number.\n" +
      "- For time: Use real date: " + new Date().toString() + "\n\n" +
      "WebContext: " + webContext

    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ]

    // --- 3. GROQ PRIMARY ---
    let reply = null
    let lastError = ""
    try {
      const groqKey = process.env.GROQ_API_KEY
      if (groqKey) {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: "Bearer " + groqKey, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: finalMessages, temperature: 0.7, max_tokens: 500 }),
        })
        const groqData = await groqRes.json()
        if (groqData.choices && groqData.choices[0] && groqData.choices[0].message && groqData.choices[0].message.content) {
          reply = groqData.choices[0].message.content
        } else if (groqData.error) {
          lastError = "Groq: " + groqData.error.message
        }
      }
    } catch (e) { lastError = "Groq catch: " + e.message }

    // --- 4. CEREBRAS BACKUP ---
    if (!reply) {
      try {
        const cereKey = process.env.CEREBRAS_API_KEY
        if (cereKey) {
          const cereRes = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: "Bearer " + cereKey, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b", messages: finalMessages, temperature: 0.7, max_tokens: 500 }),
          })
          const cereData = await cereRes.json()
          if (cereData.choices && cereData.choices[0] && cereData.choices[0].message && cereData.choices[0].message.content) {
            reply = cereData.choices[0].message.content
          }
        }
      } catch (e) { lastError += " | Cerebras: " + e.message }
    }

    if (!reply) return NextResponse.json({ reply: "Eva jam small Boss, try again. (" + lastError + ")" })
    return NextResponse.json({ reply: reply.trim() })
  } catch (err) {
    return NextResponse.json({ reply: "Eva jam small Boss, make we try again." }, { status: 200 })
  }
            }
