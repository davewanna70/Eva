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

    // --- 1. FULL INTERNET SEARCH - TAVILY - FIXED FOR FOLLOWERS ---
    let webContext = ""
    const q = message.toLowerCase()

    // Map name -> TikTok handle. Add more as you like.
    const HANDLE_MAP = {
      "purple": "purplespeedy",
      "speedy": "purplespeedy",
      "wizkid": "wizkidayo",
      "davido": "davido",
      "burna": "burnaboy",
      "drake": "champagnepapi",
      "ronaldo": "cristiano",
      "messi": "leomessi",
      "crispdal": "crispdal",
      "don jazzy": "donjazzy",
      "peller": "peller089",
      "jarvis": "realjadrolita",
      "asake": "asakemusic",
      "rema": "heisrema",
      "temi": "temiotedola",
      "ayra": "ayrastarr"
    }

    let handle = ""
    // If user type @handle directly, use am
    const atMatch = message.match(/@([a-zA-Z0-9._]+)/)
    if (atMatch) handle = atMatch[1].toLowerCase()
    if (!handle) {
      for (const key in HANDLE_MAP) {
        if (q.includes(key)) { handle = HANDLE_MAP[key]; break }
      }
    }

    const isFollowerQ = q.includes("follower") || q.includes("followers") || q.includes("how many")
    const isTikTokQ = q.includes("tiktok") || q.includes("tik tok")
    const isInstaQ = q.includes("instagram") || q.includes("insta")

    // --- 1A. FOLLOWERS: Try to EXTRACT real profile first ---
    if (isFollowerQ && handle) {
      const platform = isInstaQ ? "instagram" : "tiktok"
      const profileUrl = platform === "instagram"
        ? "https://www.instagram.com/" + handle + "/"
        : "https://www.tiktok.com/@" + handle
      try {
        const extractRes = await fetch("https://api.tavily.com/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            urls: [profileUrl],
            query: "followers likes",
            extract_depth: "advanced"
          }),
        })
        const extractData = await extractRes.json()
        const extractText = JSON.stringify(extractData).slice(0, 4000)
        if (extractText && (extractText.toLowerCase().includes("follower") || extractText.match(/[0-9]+\.[0-9]+m/i))) {
          webContext = "LIVE PROFILE EXTRACT for @" + handle + " on " + platform + " (" + profileUrl + "): " + extractText + " . RULE: Use the Followers number from THIS extract as exact. Ignore old news articles."
        }
      } catch (e) { console.log("Extract fail:", e) }
    }

    // --- 1B. NORMAL SEARCH - No more old answer, only fresh TikTok/IG result ---
    if (!webContext) {
      const needWeb =
        q.includes("who") || q.includes("what") || q.includes("when") ||
        q.includes("how many") || q.includes("follower") || q.includes("score") ||
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
            // For followers, force search to TikTok/IG site only
            let searchQuery = message
            if (isFollowerQ && handle) {
              if (isInstaQ) searchQuery = "site:instagram.com " + handle + " followers"
              else searchQuery = "site:tiktok.com @" + handle + " TikTok followers"
            }
            const searchRes = await fetch("https://api.tavily.com/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                api_key: tavilyKey,
                query: searchQuery,
                search_depth: "advanced",
                max_results: 5,
                include_answer: false,
                time_range: "week"
              }),
            })
            const searchData = await searchRes.json()
            if (searchData.results && searchData.results.length > 0) {
              // Prefer TikTok.com / Instagram.com result first, ignore old blogs
              let sorted = searchData.results
              const official = searchData.results.find((r) => r.url && (r.url.includes("tiktok.com/@") || r.url.includes("instagram.com/")))
              if (official) sorted = [official, ...searchData.results.filter((r) => r !== official)]
              const resultsText = sorted.slice(0, 3).map((r) => r.title + ": " + r.content.slice(0, 600) + " (Source: " + r.url + ")").join("\n\n")
              webContext = "\n[LIVE WEB RESULTS - " + new Date().toDateString() + "]\n" + resultsText + "\nRULE: For followers, use ONLY the TikTok.com / Instagram.com result. Ignore old news blogs with old numbers like 13m, 11m, 7m. If no official profile result shows exact number, say so honestly, no guess."
            }
          }
        } catch (e) { console.log("Tavily skip:", e) }
      }
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
      "- For followers: Use LIVE PROFILE EXTRACT or TikTok.com result ONLY. Do NOT use old blog numbers.\n" +
      "- Special case: Drake has NO official verified TikTok account. His @champagnepapi is Instagram. If user asks Drake TikTok followers, say he no get official TikTok, na fake accounts dey. No invent number.\n" +
      "- If web results no get exact follower number, say I check internet now, e no show exact number, check TikTok directly - no invent number.\n" +
      "- For current gist, scores, news, use LIVE WEB RESULTS ONLY. Don't guess old 2024 numbers.\n" +
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
