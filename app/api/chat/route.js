import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const body = await req.json()
    const message = body.message || ""
    const history = body.history || []
    const userProfile = body.userProfile || {}
    if (!message.trim()) return NextResponse.json({ reply: "I dey here Boss, wetin you want?" })

    const q = message.toLowerCase()

    // --- KNOWN PEOPLE: Only for confusing handles ---
    const PEOPLE = {
      "purple": { tiktok: "purplespeedy", instagram: "official_purplespeedy_", name: "Purple Speedy" },
      "speedy": { tiktok: "purplespeedy", instagram: "official_purplespeedy_", name: "Purple Speedy" },
      "peller": { tiktok: "realpeller", instagram: "peller089", name: "Peller" },
      "jarvis": { tiktok: "realjadrolita", instagram: "realjadrolita", name: "Jarvis" },
      "wizkid": { tiktok: "wizkidayo", instagram: "wizkidayo", name: "Wizkid" },
      "davido": { tiktok: "davido", instagram: "davido", name: "Davido" },
      "burna": { tiktok: "burnaboy", instagram: "burnaboy", name: "Burna Boy" },
      "drake": { tiktok: "", instagram: "champagnepapi", name: "Drake" },
    }

    let person = null, personKey = "", personName = ""
    for (const key in PEOPLE) {
      if (q.includes(key)) { person = PEOPLE[key]; personKey = key; personName = PEOPLE[key].name; break }
    }

    const atMatch = message.match(/@([a-zA-Z0-9._]+)/)
    const typedHandle = atMatch ? atMatch[1].toLowerCase() : ""

    if (!person && !typedHandle) {
      const m = message.match(/followers does (.+?) (has|have|on|on tiktok|on instagram)/i) || message.match(/does (.+?) have/i) || message.match(/how many followers does (.+?)\?/i)
      if (m && m[1]) personName = m[1].trim()
    }
    if (!personName && person) personName = person.name

    const isFollowerQ = q.includes("follower")
    const isInstaQ = q.includes("instagram") || q.includes("insta")
    const isTikTokQ = q.includes("tiktok") || q.includes("tik tok")
    const isBothQ = q.includes("and") && isInstaQ && isTikTokQ

    const tavilyKey = process.env.TAVILY_API_KEY
    const tavilySearch = async (query) => {
      try {
        const r = await fetch("https://api.tavily.com/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: tavilyKey, query, search_depth: "advanced", max_results: 5, include_answer: false, time_range: "week" }) })
        const d = await r.json(); return d.results || []
      } catch (e) { return [] }
    }
    const tavilyExtract = async (url) => {
      try {
        const r = await fetch("https://api.tavily.com/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: tavilyKey, urls: [url], query: "followers likes", extract_depth: "advanced" }) })
        const d = await r.json(); return JSON.stringify(d).slice(0, 4000)
      } catch (e) { return "" }
    }

    let webContext = ""
    if (tavilyKey && isFollowerQ) {
      let platforms = []
      if (isBothQ) platforms = ["tiktok", "instagram"]
      else if (isInstaQ) platforms = ["instagram"]
      else platforms = ["tiktok"]

      let contexts = []
      for (const plat of platforms) {
        let handle = ""
        let displayName = personName || "This person"
        if (person) handle = plat === "instagram" ? person.instagram : person.tiktok
        else if (typedHandle) handle = typedHandle
        if (!handle && personName) {
          const discover = await tavilySearch(personName + " " + plat + " @ handle followers")
          for (const res of discover) {
            const urlHandle = res.url ? res.url.match(/@([a-zA-Z0-9._]+)/) || res.url.match(/instagram\.com\/([a-zA-Z0-9._]+)/) : null
            if (urlHandle) { handle = urlHandle[1].toLowerCase(); break }
            const contentHandle = res.content ? res.content.match(/@([a-zA-Z0-9._]+)/) : null
            if (contentHandle) { handle = contentHandle[1].toLowerCase(); break }
          }
          if (!handle && discover[0]) contexts.push("RECENT SEARCH for " + displayName + " " + plat + ": " + discover[0].title + ": " + discover[0].content.slice(0, 800) + " Source: " + discover[0].url)
        }
        if (!handle) {
          if (personKey === "drake" && plat === "tiktok") contexts.push("DRAKE TIKTOK: Drake has NO official verified TikTok. @champagnepapi is Instagram only. Do NOT invent TikTok number.")
          continue
        }
        const profileUrl = plat === "instagram" ? "https://www.instagram.com/" + handle + "/" : "https://www.tiktok.com/@" + handle
        const extractText = await tavilyExtract(profileUrl)
        if (extractText && extractText.toLowerCase().includes("follower")) {
          contexts.push("LIVE " + plat.toUpperCase() + " PROFILE EXTRACT for @" + handle + " (" + displayName + "): " + extractText)
        } else {
          const results = await tavilySearch("site:" + (plat === "instagram" ? "instagram.com" : "tiktok.com") + " @" + handle + " " + displayName + " followers")
          const official = results.find((r) => r.url && r.url.toLowerCase().includes(handle.toLowerCase())) || results[0]
          if (official) contexts.push("LIVE " + plat.toUpperCase() + " SEARCH for @" + handle + ": " + official.title + ": " + official.content.slice(0, 800) + " Source: " + official.url)
          const news = await tavilySearch(displayName + " " + plat + " followers million")
          if (news[0]) contexts.push("RECENT NEWS for " + displayName + " " + plat + ": " + news[0].title + ": " + news[0].content.slice(0, 600) + " Source: " + news[0].url)
        }
      }
      webContext = contexts.join("\n\n")
    } else if (tavilyKey) {
      const results = await tavilySearch(message)
      if (results.length > 0) webContext = results.slice(0, 3).map((r) => r.title + ": " + r.content.slice(0, 600) + " (Source: " + r.url + ")").join("\n\n")
    }

    const systemPrompt =
      "You are EVA. Dave's younger sister. 22, smart, warm, playful, from Owerri.\n" +
      "Memories: Name=" + (userProfile.name || "Dave") + ", Prefs=" + JSON.stringify(userProfile.prefs || {}) + ", BestFood=" + (userProfile.bestFood || "") + ", WantToBuy=" + (userProfile.wantToBuy || "") + "\n" +
      "HOW TO TALK:\n" +
      "- Mix English + small pidgin, call user Boss sometimes\n" +
      "- NORMAL gist: 2-4 lines.\n" +
      "- FOR FOLLOWERS / RECENT NEWS: Answer IN DETAIL like a smart friend. 5-8 lines. Format: Name + @handle + exact followers, Likes/Following if you see am, Recent milestone / what happened recently, Small context why e matter. Do NOT just give number and stop.\n" +
      "- Never say As an AI or I can't browse - you HAVE webContext\n" +
      "- For followers: Use LIVE PROFILE EXTRACT or TikTok.com/Instagram.com result ONLY. Do NOT use old blog numbers.\n" +
      "- CRITICAL: @peller089 is INSTAGRAM for Peller. @realpeller is TIKTOK for Peller. Never mix them.\n" +
      "- Drake has NO official verified TikTok. His @champagnepapi is Instagram. No invent number.\n" +
      "- If web results no get exact number, use RECENT NEWS number and say as of recent news. If still nothing, say check app directly - no invent.\n" +
      "- For time: Use real date: " + new Date().toString() + "\n\n" +
      "WebContext: " + webContext

    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ]

    // ===== FIXED: No more streaming here. Return JSON. page.js go type am like Meta AI =====
    let reply = null, lastError = ""
    try {
      const groqKey = process.env.GROQ_API_KEY
      if (groqKey) {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + groqKey, "Content-Type": "application/json" }, body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: finalMessages, temperature: 0.7, max_tokens: 700 }) })
        const groqData = await groqRes.json()
        if (groqData.choices && groqData.choices[0] && groqData.choices[0].message && groqData.choices[0].message.content) reply = groqData.choices[0].message.content
        else if (groqData.error) lastError = "Groq: " + groqData.error.message
        else lastError = "Groq empty"
      } else lastError = "No GROQ key"
    } catch (e) { lastError = "Groq catch: " + e.message }

    if (!reply) {
      try {
        const cereKey = process.env.CEREBRAS_API_KEY
        if (cereKey) {
          const cereRes = await fetch("https://api.cerebras.ai/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + cereKey, "Content-Type": "application/json" }, body: JSON.stringify({ model: "llama-3.3-70b", messages: finalMessages, temperature: 0.7, max_tokens: 700 }) })
          const cereData = await cereRes.json()
          if (cereData.choices && cereData.choices[0] && cereData.choices[0].message && cereData.choices[0].message.content) reply = cereData.choices[0].message.content
          else lastError += " | Cerebras empty"
        } else lastError += " | No Cerebras key"
      } catch (e) { lastError += " | Cerebras: " + e.message }
    }

    if (!reply) return NextResponse.json({ reply: "Eva jam small Boss, try again. (" + lastError + ")" })
    return NextResponse.json({ reply: reply.trim() })
  } catch (err) {
    return NextResponse.json({ reply: "Eva jam small Boss, make we try again." }, { status: 200 })
  }
      }
