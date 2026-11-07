"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CHAT_ID = 1;
const USER_NAME_KEY = "eva_dave_name";
const USER_STATE_KEY = "eva_dave_state";
const PREFS_KEY = "eva_dave_prefs";
const SHORT_KEY = "eva_short_mode";

export default function EVA() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastTopic, setLastTopic] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [myName, setMyName] = useState("");
  const [myState, setMyState] = useState("");
  const [prefs, setPrefs] = useState({});
  const [shortMode, setShortMode] = useState(true);
  const [wantMore, setWantMore] = useState(false);
  const router = useRouter();

  // --- LOAD MEMORY ---
  useEffect(() => {
    const savedName = localStorage.getItem(USER_NAME_KEY);
    const savedState = localStorage.getItem(USER_STATE_KEY);
    const savedPrefs = localStorage.getItem(PREFS_KEY);
    const savedShort = localStorage.getItem(SHORT_KEY);
    if (savedName) setMyName(savedName);
    if (savedState) setMyState(savedState);
    if (savedPrefs) { try { setPrefs(JSON.parse(savedPrefs)); } catch(e){} }
    if (savedShort !== null) setShortMode(savedShort === "true");

    const load = async () => {
      try {
        const { data } = await supabase.from("messages").select("*").eq("chat_id", CHAT_ID).order("created_at", { ascending: true }).limit(80);
        if (data && data.length > 0) {
          setMessages(data.map((m) => ({ from: m.sender === "you" ? "you" : "eva", text: m.text })));
        }
      } catch (e) {}
    };
    load();
  }, []);

  const saveToSupabase = async (sender, msgText) => {
    try { await supabase.from("messages").insert([{ chat_id: CHAT_ID, sender, text: msgText }]); } catch (e) {}
  };

  const savePrefs = (newPrefs) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  };

  // --- CLEAR CHAT LIKE WHATSAPP ---
  const clearChat = async () => {
    const confirmClear = window.confirm("Clear all chats? This will delete all messages with EVA.");
    if (!confirmClear) return;
    setMessages([]); setMyName(""); setMyState(""); setPrefs({}); setLastTopic(""); setLastQuestion("");
    localStorage.removeItem(USER_NAME_KEY); localStorage.removeItem(USER_STATE_KEY); localStorage.removeItem(PREFS_KEY);
    try { await supabase.from("messages").delete().eq("chat_id", CHAT_ID); } catch (e) {}
    setShowMenu(false);
  };

  // --- TIME ZONES ---
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
        return `Time for ${niceName} na ${time}.\n${date}.`;
      }
    }
    return null;
  };

  // --- NO MORE WIKIPEDIA - SMALL BUILT-IN KNOWLEDGE, SHORT ---
  const FAMOUS = {
    "ronaldo": "Cristiano Ronaldo na Portuguese footballer.\nE dey play for Al-Nassr and Portugal.\nE don win 5 Ballon d'Or.",
    "cristiano ronaldo": "Cristiano Ronaldo na Portuguese footballer.\nE dey play for Al-Nassr and Portugal.\nE don win 5 Ballon d'Or.",
    "messi": "Lionel Messi na Argentine footballer.\nE dey play for Inter Miami and Argentina.\nE don win 8 Ballon d'Or.",
    "lionel messi": "Lionel Messi na Argentine footballer.\nE dey play for Inter Miami and Argentina.\nE don win 8 Ballon d'Or.",
    "wizkid": "Wizkid na Nigerian Afrobeats star.\nE from Lagos, e sing Essence, Ojuelegba.",
    "davido": "Davido na Nigerian Afrobeats star.\nE from Lagos, e sing Fall, Unavailable.",
    "burna boy": "Burna Boy na Nigerian Afrobeats star.\nE sing Last Last, City Boys.",
    "tinubu": "Bola Tinubu na President of Nigeria.\nE become president for 2023.",
    "peter obi": "Peter Obi na Nigerian politician.\nE be former governor of Anambra.",
  };

  const getEVAReply = async (userText) => {
    const lower = userText.toLowerCase().trim();

    // --- FIX 2: SHORT MODE - 2 to 4 lines ---
    if (lower.includes("2 to 4 lines") || lower.includes("reply in 2") || lower.includes("short reply") || lower.includes("keep it short")) {
      setShortMode(true); localStorage.setItem(SHORT_KEY, "true"); setWantMore(false);
      return "Okay, I don save am.\nI go reply for 2 to 4 lines only.\nIf you want more, just tell me 'tell me more'.";
    }
    if (lower.includes("tell me more") || lower.includes("more details") || lower.includes("give me more")) {
      setWantMore(true);
      if (lastTopic && FAMOUS[lastTopic]) return FAMOUS[lastTopic] + "\nWant make I continue?";
      return "Okay, tell me which one you want more details about.\nFor example: Who is Ronaldo?";
    }
    if (lower.includes("long reply") || lower.includes("detailed")) {
      setShortMode(false); localStorage.setItem(SHORT_KEY, "false");
      return "Okay, I go give long replies now.";
    }

    // --- FIX 1: SAVE PREFERENCES - My best..., My favourite..., I want to buy... ---
    // My best food is rice and chicken
    if (lower.startsWith("my best ") || lower.startsWith("my favourite ") || lower.startsWith("my favorite ") || lower.includes("my best food is") || lower.includes("my best colour") || lower.includes("my best color")) {
      // Extract: "my best food is rice and chicken" -> key=food, value=rice and chicken
      let cleaned = userText.replace(/my (best|favourite|favorite) /i, "").trim(); // "food is rice and chicken"
      let parts = cleaned.split(/ is | na /i);
      if (parts.length >= 2) {
        let key = parts[0].trim().toLowerCase(); // food
        let value = parts.slice(1).join(" is ").trim();
        savePrefs({ [key]: value });
        return `Okay, I don save am.\nYour best ${key} na ${value}.\nI go remember am.`;
      }
    }
    // I want to buy Bentley / I want to buy a Bentley next year
    if (lower.startsWith("i want to buy") || lower.startsWith("i wan buy") || lower.includes("i want to buy")) {
      let what = userText.split(/i want to buy/i)[1].trim();
      savePrefs({ "want_to_buy": what });
      return `Bentley? Nice choice!\nE go cost plenty, but e possible.\nYou dey plan save for am, or you wan buy next year sharp?`;
    }
    // My food is... / I like...
    if (lower.startsWith("i like ") || lower.startsWith("i love ")) {
      let what = userText.split(/i (like|love) /i)[2]?.trim() || "";
      if (what) { savePrefs({ "likes": what }); return `Okay, I don save am.\nYou like ${what}.\nNice taste.`; }
    }

    // --- FIX 3: MEMORY QUESTIONS - NEVER GO WIKIPEDIA ---
    if (lower.includes("what is my name") || lower.includes("what's my name") || lower.includes("whats my name")) {
      if (myName) return `Your name na ${myName}.\nYou be developer from ${myState || "Imo state"}.\nI remember you.`;
      return "You never tell me your name yet.\nTell me: My name is ...";
    }
    if (lower.includes("what is my best") || lower.includes("what's my best") || lower.includes("what is my favourite") || lower.includes("what is my favorite") || lower.includes("what is my best food")) {
      // e.g. "what is my best food" -> key = food
      let key = lower.replace("what is my best", "").replace("what is my favourite", "").replace("what is my favorite", "").replace("what's my best", "").replace("?", "").trim();
      if (!key) key = "food";
      if (prefs[key]) return `Your best ${key} na ${prefs[key]}.\nI remember am.`;
      return `You never tell me your best ${key} yet.\nTell me: My best ${key} is ...`;
    }
    if (lower.includes("what do you remember") || lower.includes("what do u remember") || lower.includes("do you remember me")) {
      let extra = "";
      if (prefs["food"]) extra += `\nYour best food na ${prefs["food"]}.`;
      if (prefs["want_to_buy"]) extra += `\nYou wan buy ${prefs["want_to_buy"]}.`;
      if (myName) return `Yes, I remember you.\nYour name na ${myName}, you be from ${myState || "Imo state"}.${extra}`;
      return "I no remember anything yet.\nTell me your name first: My name is ...";
    }
    if (lower.includes("what car") && lower.includes("want")) {
      if (prefs["want_to_buy"]) return `You wan buy ${prefs["want_to_buy"]}.\nNa big goal be that.`;
      return "You never tell me which car you wan buy yet.\nTell me: I want to buy ...";
    }

    // --- SAVE NAME / STATE ---
    if (lower.includes("my name is") || lower.includes("my name na") || lower.includes("i'm david") || lower.includes("i am david")) {
      let name = "";
      if (lower.includes("my name is")) name = userText.split(/my name is/i)[1].trim().split(" ")[0];
      else if (lower.includes("my name na")) name = userText.split(/my name na/i)[1].trim().split(" ")[0];
      else name = "David";
      name = name.replace(/[^a-zA-Z]/g, "");
      if (name) {
        const cap = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        setMyName(cap); localStorage.setItem(USER_NAME_KEY, cap);
        if (lower.includes("from")) {
          const st = lower.split("from")[1].trim();
          setMyState(st); localStorage.setItem(USER_STATE_KEY, st);
          return `Okay ${cap}, I don save am.\nYou be developer from ${st}.\nI go remember you now.`;
        }
        return `Okay ${cap}, I don save your name.\nI go remember you now.`;
      }
    }
    if (lower.includes("i'm from") || lower.includes("i am from") || lower.includes("from imo")) {
      const st = lower.includes("imo") ? "imo state" : lower.split("from")[1].trim();
      setMyState(st); localStorage.setItem(USER_STATE_KEY, st);
      return `Okay, I don save am.\nYou dey from ${st}.`;
    }

    // --- YES / NO ---
    if (lower === "yes" || lower === "yeah" || lower === "yes please" || lower === "sure" || lower === "ok") {
      if (lastTopic && FAMOUS[lastTopic]) return FAMOUS[lastTopic] + "\nWant more?";
      if (lastQuestion.includes("follower")) return "Follower count dey change every minute.\nOpen TikTok, search the name, you go see am now.";
      return "Yes to what?\nTell me what you want do.\nE.g: Tell me a joke, Plan my day.";
    }
    if (lower === "no" || lower === "nope") return "Okay, no problem.\nWetin else you want make we do?";

    // --- GREETINGS ---
    if (["hi","hey","hey eva","hi eva","hello eva","yo","good morning","good evening"].includes(lower)) {
      return myName ? `Hey ${myName}!\nI dey here. How you dey?\nWetin you want make we do today?` : "Hey! I dey here.\nHow you dey?\nWetin you want make we do today?";
    }
    if (lower.includes("hello") || lower.includes("how are you") || lower.includes("how far")) {
      return myName ? `Hello ${myName}!\nI dey fine o. How your side?\nWetin you want make we do today?` : "Hello! I dey fine o.\nHow your side?\nWetin you want make we do today?";
    }

    if (lower.includes("can u code") || lower.includes("can you code") || lower.includes("code")) {
      return "Yes, I fit help you code.\nWetin you wan build?\nLogin page, calculator, or fix EVA code?";
    }

    if (lower.includes("time")) {
      const placeTime = getTimeForPlace(lower);
      if (placeTime) return placeTime;
      const time = new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
      return `Time now na ${time}.\nWant another country?\nE.g: Time for London now?`;
    }
    if (lower.includes("date") || lower.includes("today") || lower.includes("what day")) {
      const date = new Date().toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      return `Today na ${date}.`;
    }
    if (lower.includes("follower") && (lower.includes("tiktok") || lower.includes("instagram") || lower.includes("youtube"))) {
      setLastQuestion("follower");
      return "I no fit see live follower count.\nE dey change every minute.\nOpen TikTok, search the name, you go see am.";
    }

    // --- WHO IS / WHAT IS - NO WIKIPEDIA AGAIN ---
    let topic = "";
    if (lower.startsWith("who is ")) topic = userText.slice(7);
    else if (lower.startsWith("who is")) topic = userText.slice(6);
    else if (lower.startsWith("tell me about ")) topic = userText.slice(14);
    if (!topic && lower.includes("who is")) topic = userText.toLowerCase().split("who is")[1];
    if (topic) {
      const clean = topic.replace(/[?]/g, "").trim().toLowerCase();
      setLastTopic(clean);
      if (FAMOUS[clean]) return FAMOUS[clean];
      return `I no get details for ${clean} now.\nI don remove Wikipedia.\nTell me who you mean, I go add am.`;
    }
    // What is ... (but NOT "what is my...") - already handled above
    if (lower.startsWith("what is ") && !lower.includes("my")) {
      return "I no get internet for that one now.\nI don remove Wikipedia.\nAsk me about Ronaldo, Messi, Wizkid, or your own stuff.";
    }

    const mathMatch = lower.match(/(\d+)\s*([\+\-\*x\/])\s*(\d+)/);
    if (mathMatch) {
      const a = Number(mathMatch[1]); const op = mathMatch[2]; const b = Number(mathMatch[3]);
      let result = 0;
      if (op === "+") result = a + b; if (op === "-") result = a - b; if (op === "*" || op === "x") result = a * b; if (op === "/") result = b !== 0 ? (a / b).toFixed(2) : "cannot divide by zero";
      return `Answer na ${result}.`;
    }
    if (lower.includes("who are you")) return "I be EVA, your personal assistant.\nI fit help you chat, plan, and remember things.\nWetin you need?";
    if (lower.includes("thank")) return "You are welcome.\nI dey here anytime you need me.";
    if (lower.includes("calm routine") || lower.includes("routine")) return "Calm routine:\n1. Drink water.\n2. Take 5 slow breaths.\n3. Start with easiest task.";
    if (lower.includes("plan my day") || lower.includes("plan")) return "Make we plan your day.\nTell me 3 things you need do today.\nI go arrange am for you.";
    if (lower.includes("mood") || lower.includes("scan")) return "How you dey feel now?\nTired, stressed, happy, or sad?\nTell me, I go suggest wetin go help.";
    if (lower.includes("joke")) return "Why phone go school?\nBecause e wan be smarter!\nWant another one? Type Yes.";
    if (lower.includes("bye") || lower.includes("goodbye")) return "Goodbye! Take care.\nI go dey here anytime you need me.";
    if (lower.includes("purple")) return "Purple na colour wey EVA like.\nE mean creativity and calm.\nYou like purple too?";
    if (lower.includes("speed")) return "Speed? You mean fast car?\nOr you mean something else?\nExplain small make I help you.";

    // --- FIX 4: GENERAL CHAT - NO MORE "I hear you" FOR EVERYTHING ---
    if (lower.includes("buy") || lower.includes("bentley") || lower.includes("car")) return "Nice plan.\nBentley na big goal.\nYou dey save already, or you just dey dream am for now?";
    if (lower.includes("food") || lower.includes("rice") || lower.includes("chicken") || lower.includes("eat")) return "Rice and chicken na classic.\nNa your best food be that?\nTell me: My best food is ...";
    if (lower.includes("love") || lower.includes("like")) return "Nice, I hear you.\nTell me more about am.\nWetin make you like am?";
    if (lower.includes("tired") || lower.includes("stress") || lower.includes("sad")) return "Sorry to hear that.\nTake small rest, drink water.\nWetin dey stress you? Talk am, I dey listen.";
    if (lower.includes("happy") || lower.includes("good")) return "Nice! I happy for you.\nWetin make you happy today?";
    if (lower.includes("what do you think") || lower.includes("do u think") || lower.includes("what do u think")) return "I think e make sense.\nIf you really want am, start small plan.\nYou want make I help you plan am?";
    if (lower.includes("?")) return "Good question.\nTell me small more about am.\nMake I understand wetin you mean.";

    return "Okay, I hear you.\nTell me small more make I help you well.\nE.g: Who is Ronaldo? Time for London?";
  };

  const askEVA = async () => {
    if (!text.trim() || isThinking) return;
    const userText = text.trim();
    setText("");
    setMessages((prev) => [...prev, { from: "you", text: userText }]);
    await saveToSupabase("you", userText);
    setIsThinking(true);
    setMessages((prev) => [...prev, { from: "eva", text: "EVA is thinking..." }]);
    const reply = await getEVAReply(userText);
    setMessages((prev) => { const withoutThinking = prev.slice(0, -1); return [...withoutThinking, { from: "eva", text: reply }]; });
    await saveToSupabase("eva", reply);
    setIsThinking(false);
  };

  const addEVAMessage = (msg) => {
    // FIX: No more Discover spam - if last message na same Discover, no add again
    setMessages((prev) => {
      if (prev.length > 0 && prev[prev.length - 1].text === msg) return prev;
      return [...prev, { from: "eva", text: msg }];
    });
  };
  const openDiscover = () => { addEVAMessage("✨ Try: 'Who is Ronaldo?', 'Time for London?', 'My best food is rice and chicken', 'I want to buy Bentley'"); };
  const openChat = () => {};
  const menuClick = (item) => {
    if (item === "Clear") { clearChat(); return; }
    setShowMenu(false);
    if (item === "History") addEVAMessage("🕒 History: This na your current chat. E dey save for Supabase.");
    if (item === "Settings") addEVAMessage("⚙️ Settings: You fit tell me 'Reply in 2 to 4 lines' to change how I talk.");
    if (item === "More") addEVAMessage("⋯ More: About EVA, Help, Share EVA.");
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
              <button onClick={() => menuClick("Clear")} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#ff8080", padding: "13px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>🗑️ Clear Chat</button>
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
          <div key={i} style={{ alignSelf: m.from === "you" ? "flex-end" : "flex-start", background: m.from === "you" ? "#8b5cf6" : "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: "10px 14px", borderRadius: 16, maxWidth: "85%", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-line" }}>
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
