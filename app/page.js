"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EVA() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const router = useRouter();

  // --- WORLD TIME ZONES ---
  const TIME_ZONES = {
    "nigeria": "Africa/Lagos", "lagos": "Africa/Lagos", "abuja": "Africa/Lagos", "benin": "Africa/Lagos", "benin city": "Africa/Lagos",
    "ghana": "Africa/Accra", "accra": "Africa/Accra",
    "london": "Europe/London", "uk": "Europe/London", "england": "Europe/London", "britain": "Europe/London",
    "paris": "Europe/Paris", "france": "Europe/Paris",
    "berlin": "Europe/Berlin", "germany": "Europe/Berlin",
    "madrid": "Europe/Madrid", "spain": "Europe/Madrid",
    "rome": "Europe/Rome", "italy": "Europe/Rome",
    "amsterdam": "Europe/Amsterdam", "netherlands": "Europe/Amsterdam",
    "new york": "America/New_York", "newyork": "America/New_York", "usa": "America/New_York", "america": "America/New_York",
    "los angeles": "America/Los_Angeles", "california": "America/Los_Angeles", "texas": "America/Chicago", "chicago": "America/Chicago",
    "toronto": "America/Toronto", "canada": "America/Toronto",
    "mexico": "America/Mexico_City", "brazil": "America/Sao_Paulo", "sao paulo": "America/Sao_Paulo",
    "dubai": "Asia/Dubai", "uae": "Asia/Dubai", "saudi": "Asia/Riyadh", "riyadh": "Asia/Riyadh",
    "india": "Asia/Kolkata", "delhi": "Asia/Kolkata", "mumbai": "Asia/Kolkata",
    "china": "Asia/Shanghai", "beijing": "Asia/Shanghai", "shanghai": "Asia/Shanghai",
    "japan": "Asia/Tokyo", "tokyo": "Asia/Tokyo",
    "korea": "Asia/Seoul", "seoul": "Asia/Seoul",
    "singapore": "Asia/Singapore", "thailand": "Asia/Bangkok", "bangkok": "Asia/Bangkok",
    "australia": "Australia/Sydney", "sydney": "Australia/Sydney",
    "south africa": "Africa/Johannesburg", "johannesburg": "Africa/Johannesburg", "cape town": "Africa/Johannesburg",
    "egypt": "Africa/Cairo", "cairo": "Africa/Cairo",
    "kenya": "Africa/Nairobi", "nairobi": "Africa/Nairobi",
    "ethiopia": "Africa/Addis_Ababa",
    "cameroon": "Africa/Douala", "togo": "Africa/Lome", "ivory coast": "Africa/Abidjan",
  };

  const getTimeForPlace = (lowerText) => {
    for (const place in TIME_ZONES) {
      if (lowerText.includes(place)) {
        const tz = TIME_ZONES[place];
        const time = new Date().toLocaleTimeString("en-NG", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
        const date = new Date().toLocaleDateString("en-NG", { timeZone: tz, weekday: "long", day: "numeric", month: "long" });
        const niceName = place.charAt(0).toUpperCase() + place.slice(1);
        return `The current time in ${niceName} is ${time} (${date}).`;
      }
    }
    return null;
  };

  // --- FIX: USE WIKIPEDIA SEARCH, NOT DIRECT LINK ---
  const searchWikipedia = async (query) => {
    try {
      // Fix common names
      const fixes = {
        "ronaldo": "Cristiano Ronaldo",
        "cristiano ronaldo": "Cristiano Ronaldo",
        "christiano ronaldo": "Cristiano Ronaldo",
        "messi": "Lionel Messi",
        "wizkid": "Wizkid",
        "davido": "Davido",
        "burna boy": "Burna Boy",
        "tinubu": "Bola Tinubu",
        "peter obi": "Peter Obi",
      };
      const fixed = fixes[query.toLowerCase()] || query;

      // 1. Search first to find correct page
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(fixed)}&format=json&origin=*`);
      const searchData = await searchRes.json();
      const firstTitle = searchData?.query?.search?.[0]?.title;
      if (!firstTitle) return null;

      // 2. Get summary of that correct page
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`);
      const data = await res.json();
      if (data.extract) {
        const short = data.extract.split(". ").slice(0, 3).join(". ") + ".";
        return { title: firstTitle, text: short };
      }
      return null;
    } catch (e) { return null; }
  };

  const getEVAReply = async (userText) => {
    const lower = userText.toLowerCase().trim();
    const pidginWords = ["dey", "wey", "na", "abi", "abeg", "wahala", "how far", "na you"];
    const userUsedPidgin = pidginWords.some((w) => lower.includes(w));

    // --- FIX: YES / NO MEMORY ---
    if (lower === "yes" || lower === "yeah" || lower === "yes please" || lower === "sure" || lower === "ok") {
      if (lastTopic) {
        const more = await searchWikipedia(lastTopic);
        if (more) return `Okay! More about ${more.title}: ${more.text} Want me to tell you something else about ${more.title}?`;
        return `Okay! What do you want to know about ${lastTopic}? You can ask: Who is ${lastTopic}? What is ${lastTopic} known for?`;
      }
      if (lastQuestion.includes("follower")) return "For follower count, open TikTok and search the name. The number changes every minute so I cannot give you live number. Do you want me to tell you who the person is instead? Just type: Who is Wizkid";
      return "Yes to what? Tell me what you want me to do. You can say: Tell me a joke, Plan my day, Who is Ronaldo?";
    }
    if (lower === "no" || lower === "nope") return "Okay, no problem. What else do you want me to help you with?";

    // --- FIX: GREETINGS - HEY, HI, HEY EVA ---
    if (lower === "hi" || lower === "hey" || lower === "hey eva" || lower === "hi eva" || lower === "hello eva" || lower === "yo" || lower === "good morning" || lower === "good evening") {
      return "Hey! I am here. How are you doing? What do you want us to do today? You can ask me time, who a person is, or help me plan my day.";
    }
    if (lower.includes("hello") || lower.includes("how are you") || lower.includes("how far")) {
      return userUsedPidgin ? "Hello my person! I dey fine o. How your side? Wetin you want make we do today?" : "Hello! I am doing well, thank you for asking. How are you doing today? What would you like us to work on?";
    }

    // --- FIX: CAN YOU CODE ---
    if (lower.includes("can u code") || lower.includes("can you code") || lower.includes("code")) {
      return "Yes, I can help you with code! What do you want me to code? For example: A login page, a calculator, or fix your EVA code. Tell me what you want to build.";
    }

    // --- TIME ---
    if (lower.includes("time")) {
      const placeTime = getTimeForPlace(lower);
      if (placeTime) return placeTime;
      const time = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
      return `The time now is ${time}. If you want another country, ask like: What is the time in London now? What is the time in Dubai now?`;
    }

    if (lower.includes("date") || lower.includes("today") || lower.includes("what day")) {
      const date = new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      return `Today is ${date}.`;
    }

    if (lower.includes("internet") || lower.includes("full access")) {
      return "Yes, I now have internet access for general knowledge through Wikipedia. I can search for who a person is, what something is, and explain it. I do not have live access to TikTok follower counts because those numbers change every minute. What do you want me to search for?";
    }
    if (lower.includes("follower") && (lower.includes("tiktok") || lower.includes("instagram") || lower.includes("youtube"))) {
      setLastQuestion("follower");
      return "I cannot see live follower counts because they change every minute and TikTok does not allow me to check it directly. If you open TikTok and search the person's name, you will see the exact number now. Do you want me to tell you who that person is instead? Just type Yes.";
    }

    // --- WIKIPEDIA - WHO IS / WHAT IS / TELL ME ABOUT ---
    let topic = "";
    if (lower.startsWith("who is ")) topic = userText.slice(7);
    else if (lower.startsWith("who is")) topic = userText.slice(6);
    else if (lower.startsWith("what is ")) topic = userText.slice(8);
    else if (lower.startsWith("tell me about ")) topic = userText.slice(14);
    else if (lower.startsWith("tell me about")) topic = userText.slice(13);
    // Also handle "Who is wizkid" without checking start exactly, and "Who is Cristiano ronaldo"
    if (!topic && lower.includes("who is")) topic = userText.toLowerCase().split("who is")[1];

    if (topic) {
      const cleanTopic = topic.replace(/[?]/g, "").trim();
      setLastTopic(cleanTopic);
      const result = await searchWikipedia(cleanTopic);
      if (result) return `${result.text} Want me to tell you more about ${result.title}? Just type Yes.`;
      return `I searched but I could not find ${cleanTopic}. Can you spell the full name for me? For example: Cristiano Ronaldo, Wizkid.`;
    }

    const mathMatch = lower.match(/(\d+)\s*([\+\-\*x\/])\s*(\d+)/);
    if (mathMatch) {
      const a = Number(mathMatch[1]); const op = mathMatch[2]; const b = Number(mathMatch[3]);
      let result = 0;
      if (op === "+") result = a + b;
      if (op === "-") result = a - b;
      if (op === "*" || op === "x") result = a * b;
      if (op === "/") result = b !== 0 ? (a / b).toFixed(2) : "cannot divide by zero";
      return `The answer is ${result}.`;
    }
    if (lower.includes("who are you")) return "I am EVA, your personal assistant in this app. I can help you chat, plan, and find things. What do you need?";
    if (lower.includes("thank")) return "You are welcome. I am always here whenever you need me.";
    if (lower.includes("calm routine") || lower.includes("routine")) return "Here is a calm routine for you: 1. Drink water. 2. Take 5 slow breaths. 3. Write down 3 things you want to do today. 4. Start with the easiest one. Would you like one for morning or evening?";
    if (lower.includes("plan my day") || lower.includes("plan")) return "Let us plan your day. What are the 3 most important things you need to do today? Tell me and I will arrange them for you.";
    if (lower.includes("mood") || lower.includes("scan")) return "How are you feeling right now? Tell me if you feel tired, stressed, happy, or sad, and I will suggest what can help you.";
    if (lower.includes("joke")) return "Why did the phone go to school? Because it wanted to be smarter! Want another one? Type Yes.";
    if (lower.includes("bye") || lower.includes("goodbye")) return "Goodbye! Take care. I will be here whenever you need me.";

    return "I hear you. Tell me more so I can help you well. You can try: Hey, Who is Cristiano Ronaldo?, What is the time in London now?, Can you code?";
  };

  const askEVA = async () => {
    if (!text.trim() || isThinking) return;
    const userText = text.trim();
    setText("");
    setMessages((prev) => [...prev, { from: "you", text: userText }]);
    setIsThinking(true);
    setMessages((prev) => [...prev, { from: "eva", text: "EVA is thinking..." }]);
    const reply = await getEVAReply(userText);
    setMessages((prev) => {
      const withoutThinking = prev.slice(0, -1);
      return [...withoutThinking, { from: "eva", text: reply }];
    });
    setIsThinking(false);
  };

  const addEVAMessage = (msg) => { setMessages((prev) => [...prev, { from: "eva", text: msg }]); };
  const openDiscover = () => { addEVAMessage("✨ Discover: Try ask me - 'Who is Cristiano Ronaldo?', 'What is the time in London now?', 'Give me a calm routine', 'Help me plan my day'"); };
  const openChat = () => { router.push("/chat"); };
  const menuClick = (item) => {
    setShowMenu(false);
    if (item === "History") addEVAMessage("🕒 History: Your past chats will show here. For now, this is your current conversation.");
    if (item === "Settings") addEVAMessage("⚙️ Settings: Here you can change theme, voice, and how EVA talks to you.");
    if (item === "More") addEVAMessage("⋯ More: About EVA, Help, Share EVA, and Clear chat will be here.");
  };

  return (
    <div style={{ height: "100dvh", background: "#030014", color: "white", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "sans-serif", position: "relative" }}>
      <img src="/eva-bg.jpg" alt="EVA" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "relative", display: "flex", padding: "16px 18px", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/IMG-20261104-WA3311.jpg" style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "2px solid #a78bfa" }} />
          <b style={{ fontSize: 20, letterSpacing: 2 }}>EVA</b>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", fontSize: 22, fontWeight: "bold", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>⋮</button>
          {showMenu && (
            <div style={{ position: "absolute", top: 50, right: 0, width: 170, background: "rgba(0,0,0,0.85)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(10px)", zIndex: 50 }}>
              <button onClick={() => menuClick("History")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>🕒 History</button>
              <button onClick={() => menuClick("Settings")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>⚙️ Settings</button>
              <button onClick={() => menuClick("More")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14 }}>⋯ More</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", padding: "0 20px 10px" }} onClick={() => setShowMenu(false)}>
        {messages.length === 0 && (
          <div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: 14, borderRadius: 16, width: "100%", maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
            Hello, I am EVA. Ask me anything.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === "you" ? "flex-end" : "flex-start", background: m.from === "you" ? "#8b5cf6" : "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: "10px 14px", borderRadius: 16, maxWidth: "85%", fontSize: 14, lineHeight: 1.5 }}>
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ position: "relative", padding: "12px 16px 18px", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", padding: 8, borderRadius: 999, backdropFilter: "blur(10px)" }}>
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askEVA()} placeholder="Ask EVA..." autoComplete="off" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "0 12px", fontSize: 15 }} />
          <button onClick={askEVA} style={{ background: "#8b5cf6", border: "none", color: "white", padding: "10px 18px", borderRadius: 999, fontWeight: "bold" }}>Ask →</button>
        </div>
        <div style={{ display: "flex", maxWidth: 520, margin: "10px auto 0", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={openDiscover} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", padding: "9px 16px", borderRadius: 999, fontSize: 13, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(10px)" }}>✨ Discover</button>
          <button onClick={openChat} style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", padding: "9px 16px", borderRadius: 999, fontSize: 13, display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(10px)" }}>💬 Chat</button>
        </div>
      </div>
    </div>
  );
  }
