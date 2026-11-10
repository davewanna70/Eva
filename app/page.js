"use client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const CHAT_ID = 1;

const EMOJI_CATS = {
  "😊 Faces": [
    {e:"😂",k:"laugh happy face"}, {e:"😊",k:"smile happy"}, {e:"😍",k:"love heart eyes"}, {e:"😭",k:"cry sad tears"}, {e:"😅",k:"sweat laugh"}, {e:"🔥",k:"fire hot"}, {e:"😎",k:"cool sunglasses"}, {e:"🤣",k:"laugh rolling"}, {e:"😇",k:"angel halo"}, {e:"😉",k:"wink"}, {e:"🥰",k:"love smile"}, {e:"😋",k:"tongue food"}, {e:"🤔",k:"think"}, {e:"😴",k:"sleep"}, {e:"😡",k:"angry mad"}, {e:"😁",k:"grin teeth"}, {e:"😆",k:"laugh"}, {e:"😏",k:"smirk"}, {e:"🤗",k:"hug"}, {e:"😌",k:"relief"}, {e:"🥺",k:"pleading cute"}, {e:"😤",k:"angry steam"}, {e:"😜",k:"tongue wink"}, {e:"🤯",k:"mind blown"}, {e:"😢",k:"cry"}, {e:"😘",k:"kiss love"}, {e:"🤩",k:"star eyes wow"}, {e:"😃",k:"happy"}, {e:"😄",k:"happy smile"}, {e:"🥳",k:"party celebrate"}, {e:"😈",k:"devil"}, {e:"💀",k:"skull dead"}, {e:"🤖",k:"robot"}, {e:"👻",k:"ghost"}, {e:"🎃",k:"pumpkin halloween"}
  ],
  "🤚 Hands": [
    {e:"👍",k:"thumbs up good"}, {e:"👎",k:"thumbs down"}, {e:"🙏",k:"pray please"}, {e:"👏",k:"clap"}, {e:"🙌",k:"celebrate hands up"}, {e:"🤘",k:"rock horns"}, {e:"🤙",k:"call me shaka"}, {e:"✋",k:"hand stop five"}, {e:"🤚",k:"hand back"}, {e:"🙋‍♀️",k:"woman raise hand"}, {e:"🙋",k:"raise hand"}, {e:"🙋‍♂️",k:"man raise hand"}, {e:"✌️",k:"peace victory"}, {e:"🤞",k:"fingers crossed luck"}, {e:"🫰",k:"finger heart"}, {e:"👌",k:"ok perfect"}, {e:"👊",k:"punch fist"}, {e:"✊",k:"fist"}, {e:"👋",k:"wave hello"}, {e:"🫡",k:"salute"}, {e:"🖐️",k:"hand five"}, {e:"🤲",k:"hands together"}, {e:"💪",k:"muscle strong"}, {e:"👀",k:"eyes look"}, {e:"🫶",k:"heart hands love"}, {e:"🤝",k:"handshake deal"}, {e:"👈",k:"point left"}, {e:"👉",k:"point right"}, {e:"👆",k:"point up"}, {e:"👇",k:"point down"}
  ],
  "🧑 People": [
    {e:"👶",k:"baby"}, {e:"👦",k:"boy"}, {e:"👧",k:"girl"}, {e:"🧒",k:"child"}, {e:"👩",k:"woman"}, {e:"👨",k:"man"}, {e:"👵",k:"old woman grandma"}, {e:"👴",k:"old man grandpa"}, {e:"👮",k:"police"}, {e:"👷",k:"worker"}, {e:"👨‍🍳",k:"chef cook"}, {e:"👨‍🎓",k:"student graduate"}, {e:"👨‍⚕️",k:"doctor"}, {e:"💃",k:"dance woman"}, {e:"🕺",k:"dance man"}, {e:"🏃",k:"run"}, {e:"👪",k:"family"}, {e:"💑",k:"couple love"}
  ],
  "🐵 Animals": [
    {e:"🐵",k:"monkey face"}, {e:"🐒",k:"monkey"}, {e:"🦍",k:"gorilla"}, {e:"🦧",k:"orangutan"}, {e:"🐶",k:"dog face"}, {e:"🐕",k:"dog"}, {e:"🐺",k:"wolf"}, {e:"🦊",k:"fox"}, {e:"🐱",k:"cat face"}, {e:"🐈",k:"cat"}, {e:"🦁",k:"lion"}, {e:"🐯",k:"tiger face"}, {e:"🐴",k:"horse face"}, {e:"🦄",k:"unicorn"}, {e:"🦓",k:"zebra"}, {e:"🐮",k:"cow face"}, {e:"🐷",k:"pig face"}, {e:"🐸",k:"frog"}, {e:"🐰",k:"rabbit"}, {e:"🐻",k:"bear"}, {e:"🐼",k:"panda"}, {e:"🐨",k:"koala"}, {e:"🐔",k:"chicken"}, {e:"🐧",k:"penguin"}, {e:"🐦",k:"bird"}, {e:"🦅",k:"eagle"}, {e:"🦉",k:"owl"}, {e:"🦇",k:"bat"}, {e:"🐝",k:"bee"}, {e:"🦋",k:"butterfly"}, {e:"🐢",k:"turtle"}, {e:"🐍",k:"snake"}, {e:"🐙",k:"octopus"}, {e:"🦀",k:"crab"}, {e:"🐳",k:"whale"}, {e:"🐬",k:"dolphin"}, {e:"🦈",k:"shark"}, {e:"🐊",k:"crocodile"}
  ],
  "🚗 Cars & Travel": [
    {e:"🚗",k:"car automobile"}, {e:"🚕",k:"taxi car"}, {e:"🚙",k:"suv car"}, {e:"🚌",k:"bus"}, {e:"🏎️",k:"race car fast"}, {e:"🚓",k:"police car"}, {e:"🚑",k:"ambulance"}, {e:"🚒",k:"fire truck"}, {e:"🚚",k:"truck delivery"}, {e:"🏍️",k:"motorcycle bike"}, {e:"🚲",k:"bicycle bike"}, {e:"✈️",k:"airplane plane flight"}, {e:"🚀",k:"rocket space"}, {e:"🚁",k:"helicopter"}, {e:"🚂",k:"train locomotive"}, {e:"🚢",k:"ship boat"}, {e:"⛵",k:"sailboat"}, {e:"🏖️",k:"beach vacation"}, {e:"🧳",k:"luggage travel"}, {e:"🚦",k:"traffic light"}
  ],
  "🍕 Food": [
    {e:"🍕",k:"pizza"}, {e:"🍔",k:"burger"}, {e:"🍟",k:"fries"}, {e:"🌭",k:"hotdog"}, {e:"🍿",k:"popcorn"}, {e:"🍩",k:"doughnut"}, {e:"🍰",k:"cake"}, {e:"🎂",k:"birthday cake"}, {e:"🍫",k:"chocolate"}, {e:"🍦",k:"ice cream"}, {e:"🍓",k:"strawberry"}, {e:"🍎",k:"apple"}, {e:"🍌",k:"banana"}, {e:"☕",k:"coffee"}, {e:"🍵",k:"tea"}, {e:"🍺",k:"beer"}, {e:"🍷",k:"wine"}, {e:"🍜",k:"noodles ramen"}, {e:"🍣",k:"sushi"}
  ],
  "⚽ Activity": [
    {e:"⚽",k:"football soccer ball"}, {e:"🏀",k:"basketball"}, {e:"🎾",k:"tennis"}, {e:"🎮",k:"game controller"}, {e:"🎲",k:"dice game"}, {e:"🎯",k:"target dart"}, {e:"🎸",k:"guitar music"}, {e:"🎵",k:"music note"}, {e:"🎤",k:"microphone sing"}, {e:"🎧",k:"headphone music"}, {e:"🎬",k:"movie film"}, {e:"💻",k:"laptop computer"}, {e:"📱",k:"phone"}, {e:"💡",k:"idea light"}, {e:"🎁",k:"gift present"}, {e:"🎉",k:"party celebrate"}, {e:"✨",k:"sparkles"}, {e:"❤️",k:"heart love"}, {e:"💔",k:"broken heart"}, {e:"💯",k:"100 perfect"}, {e:"👑",k:"crown king"}, {e:"💎",k:"diamond"}, {e:"🌹",k:"rose flower love"}
  ]
};
const EMOJI_CAT_LIST = Object.keys(EMOJI_CATS);
const cleanText = (t) => (t || "").replace(/\*\*/g, "").replace(/^\s*-\s*/gm, "• ");
const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};
const getEmojiSize = (t) => {
  const cleaned = (t || "").replace("▍", "").trim().replace(/\s/g, "");
  if (!cleaned) return 15;
  const chars = Array.from(cleaned);
  const isOnlyEmoji = chars.every((c) => /\p{Extended_Pictographic}/u.test(c));
  if (!isOnlyEmoji) return 15;
  if (chars.length === 1) return 50;
  if (chars.length === 2) return 45;
  return 40;
};
const isOnlyEmojiMsg = (t) => {
  const cleaned = (t || "").replace("▍", "").trim().replace(/\s/g, "");
  if (!cleaned) return false;
  const chars = Array.from(cleaned);
  return chars.length > 0 && chars.every((c) => /\p{Extended_Pictographic}/u.test(c));
};
const getEmojiAnim = (e) => {
  if (["😂","🤣","😆","😁"].includes(e)) return "eva-laugh";
  if (["😌","😉","😏","😜","😋"].includes(e)) return "eva-wink";
  if (["😍","🥰","😘","❤️","💕","😃","😄","😊"].includes(e)) return "eva-love";
  if (["😭","😢","🥺","😩"].includes(e)) return "eva-cry";
  if (["😎","😈","🤩"].includes(e)) return "eva-cool";
  if (["🔥","✨","💯"].includes(e)) return "eva-fire";
  if (["😡","😤","💀"].includes(e)) return "eva-angry";
  if (["🥳","🎉","🎂"].includes(e)) return "eva-party";
  if (["😴"].includes(e)) return "eva-sleep";
  if (["🤔","🤯"].includes(e)) return "eva-think";
  if (["👍","👏","🙏","🙌","👋","🤘","🤙","✌️","👌","💪"].includes(e)) return "eva-hand";
  return "eva-pop";
};
const CopyIcon = ({size=26}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#f0f0f0" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9))", display: "block" }}>
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);
const ForwardIcon = ({size=28}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#f0f0f0" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9))", display: "block" }}>
    <path d="M14 9V5l7 7-7 7v-4c-5 0-8.5 1.6-11 5 1-5 4-10 11-11z" />
  </svg>
);
const TrashIcon = ({size=26}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#f0f0f0" style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.95))", display: "block" }}>
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);
const extractLinks = (txt) => {
  const m = (txt || "").match(/https?:\/\/[^\s]+/g);
  return m || [];
};
const isDocMsg = (m) => {
  const t = (m.text || "").toLowerCase();
  return m.type === "doc" || m.mediaType === "doc" || /\.pdf|\.doc|\.docx|\.xls|\.xlsx|\.ppt|\.txt|\.zip/.test(t) || m.fileName;
};
const isMediaMsg = (m) => {
  if (m.type === "image" || m.type === "video" || m.mediaUrl || m.imageUrl) return true;
  const t = (m.text || "").toLowerCase();
  if (/\.jpg|\.jpeg|\.png|\.webp|\.gif|\.mp4|\.mov|\.mp3|\.wav/.test(t)) return true;
  return false;
};
const isLinkMsg = (m) => extractLinks(m.text).length > 0;
const isVideoMsg = (m) => {
  if (m.type === "video") return true;
  const t = (m.text || "").toLowerCase();
  return /\.mp4|\.mov|\.gif/.test(t) || m.mediaType === "video";
};
const isPhotoMsg = (m) => {
  if (m.type === "image") return true;
  const t = (m.text || "").toLowerCase();
  return /\.jpg|\.jpeg|\.png|\.webp/.test(t) || m.mediaUrl || m.imageUrl;
};
const getSizeFor = (msgs, kind) => {
  let bytes = 0;
  (msgs || []).forEach((m) => {
    if (kind === "videos" && !isVideoMsg(m)) return;
    if (kind === "photos" && !isPhotoMsg(m)) return;
    if (kind === "all") {
      bytes += new Blob([m.text || ""]).size + 200;
      if (m.mediaUrl || m.imageUrl) bytes += 1200000;
      else if (m.type === "video") bytes += 8000000;
      else if (isDocMsg(m)) bytes += 800000;
      else if (isMediaMsg(m)) bytes += 500000;
      return;
    }
    if (kind === "videos") bytes += m.mediaSize || 8000000;
    if (kind === "photos") bytes += m.mediaSize || 1200000;
  });
  if (bytes < 1024) return "0.0 MB";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function EVA() {
  // FIX SHAKE: start empty, load cache BEFORE paint. No useState(localStorage) — na that dey cause hydration shake.
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState("😊 Faces");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [myName, setMyName] = useState("");
  const [prefs, setPrefs] = useState({});
  const [replayMap, setReplayMap] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [selectedIdxs, setSelectedIdxs] = useState([]);
  const [toast, setToast] = useState("");
  const [swipeOffset, setSwipeOffset] = useState({});
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [mediaTab, setMediaTab] = useState("Media");
  const [highlightIdx, setHighlightIdx] = useState(null);
  const [showClearSheet, setShowClearSheet] = useState(false);
  const [clearMode, setClearMode] = useState("all");

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const didInitialScroll = useRef(false);
  const lastUserMsgRef = useRef(null);
  const outerRef = useRef(null);
  const swipeStartX = useRef(null);
  const swipeStartY = useRef(null);
  const longPressTimer = useRef(null);
  const savedScrollTop = useRef(0);
  const justSelectedAt = useRef(0);
  const isLongPress = useRef(false);
  const emojiGridRef = useRef(null);
  const emojiScrollPosRef = useRef(0);
  const emojiTabsRef = useRef(null);
  const swipeStartXRef = useRef(null);
  const swipeStartYRef = useRef(null);
  const showEmojiRef = useRef(false);
  showEmojiRef.current = showEmoji;

  // ===== WHATSAPP STABLE — NO AUTO SCROLL ON TYPING =====
  const scrollToQuestionWhatsApp = (userMsgIndex) => {
    setTimeout(() => {
      if (!scrollRef.current) return;
      const el = document.getElementById(`eva-msg-${userMsgIndex}`);
      if (!el) { scrollRef.current.scrollTop = scrollRef.current.scrollHeight; return; }
      scrollRef.current.scrollTo({ top: el.offsetTop - 12, behavior: "smooth" });
    }, 80);
  };
  const saveScroll = () => { if (scrollRef.current) savedScrollTop.current = scrollRef.current.scrollTop; };
  const restoreScroll = () => { requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = savedScrollTop.current; }); };
  const handleInputBlur = () => { setTimeout(() => { restoreScroll(); }, 50); };
  const handleInputFocus = () => { if (showEmojiRef.current) setShowEmoji(false); saveScroll(); };

  const isMulti = selectedIdxs.length >= 2;
  const isSingle = selectedIdxs.length === 1;
  const searchResults = searchQuery.trim() ? messages.map((m, idx) => ({ m, idx })).filter(({ m }) => cleanText(m.text).toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const mediaList = messages.map((m, idx) => ({ m, idx })).filter(({ m }) => isMediaMsg(m));
  const docsList = messages.map((m, idx) => ({ m, idx })).filter(({ m }) => isDocMsg(m));
  const linksList = messages.map((m, idx) => ({ m, idx })).filter(({ m }) => isLinkMsg(m));
  const totalSize = getSizeFor(messages, "all");
  const videoSize = getSizeFor(messages, "videos");
  const photoSize = getSizeFor(messages, "photos");

  const jumpToMessage = (idx) => {
    setShowSearch(false); setShowMedia(false); setSearchQuery(""); setHighlightIdx(idx);
    setTimeout(() => {
      const el = document.getElementById(`eva-msg-${idx}`);
      if (el && scrollRef.current) el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightIdx(null), 2500);
    }, 100);
  };

  // ===== FIX SHAKE: LOCALSTORAGE = INSTANT, SUPABASE = SILENT BACKUP =====
  useLayoutEffect(() => {
    try {
      const n = localStorage.getItem("eva_dave_name"); if (n) setMyName(n);
      const p = localStorage.getItem("eva_dave_prefs"); if (p) setPrefs(JSON.parse(p));
    } catch (e) {}
    let cached = [];
    try { cached = JSON.parse(localStorage.getItem("eva_messages_cache") || "[]"); } catch (e) { cached = []; }
    if (cached.length > 0) {
      setMessages(cached);
      setIsReady(true);
      // Supabase background — only if e get MORE messages, never replace, never shake
      (async () => {
        try {
          const { data } = await supabase.from("messages").select("*").eq("chat_id", CHAT_ID).order("created_at", { ascending: true }).limit(80);
          if (data && data.length) {
            const mapped = data.map((m) => ({ from: m.sender === "you" ? "you" : "eva", text: m.text, time: m.created_at ? new Date(m.created_at).getTime() : Date.now(), status: m.sender === "you" ? "delivered" : undefined }));
            if (mapped.length > cached.length) {
              setMessages(mapped);
              try { localStorage.setItem("eva_messages_cache", JSON.stringify(mapped)); } catch (e) {}
            }
          }
        } catch (e) {}
      })();
      return;
    }
    // No cache (new phone) — load from Supabase ONCE
    (async () => {
      try {
        const { data } = await supabase.from("messages").select("*").eq("chat_id", CHAT_ID).order("created_at", { ascending: true }).limit(80);
        if (data && data.length) {
          const mapped = data.map((m) => ({ from: m.sender === "you" ? "you" : "eva", text: m.text, time: m.created_at ? new Date(m.created_at).getTime() : Date.now(), status: m.sender === "you" ? "delivered" : undefined }));
          setMessages(mapped);
          try { localStorage.setItem("eva_messages_cache", JSON.stringify(mapped)); } catch (e) {}
        }
      } catch (e) {}
      setIsReady(true);
    })();
  }, []);

  // Initial scroll ONCE, INSTANT, no smooth
  useEffect(() => {
    if (!isReady) return;
    if (didInitialScroll.current) return;
    if (messages.length === 0) return;
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    didInitialScroll.current = true;
  }, [isReady, messages.length]);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 1500); };
  const saveToSupabase = async (sender, msgText) => {
    try { const { error } = await supabase.from("messages").insert([{ chat_id: CHAT_ID, sender, text: msgText }]); return !error; } catch (e) { return false; }
  };
  const openClearSheet = () => { setShowMenu(false); setShowClearSheet(true); };
  const doClearChat = async () => {
    if (clearMode === "videos") {
      setMessages((prev) => { const next = prev.filter((m) => !isVideoMsg(m)); try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (e) {} return next; });
    } else if (clearMode === "photos") {
      setMessages((prev) => { const next = prev.filter((m) => !isPhotoMsg(m)); try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (e) {} return next; });
    } else {
      setMessages([]); setMyName(""); setPrefs({});
      localStorage.removeItem("eva_dave_name"); localStorage.removeItem("eva_dave_prefs"); localStorage.removeItem("eva_messages_cache");
      try { await supabase.from("messages").delete().eq("chat_id", CHAT_ID); } catch (e) {}
    }
    setShowClearSheet(false); setShowSearch(false); setShowMedia(false); setClearMode("all"); didInitialScroll.current = true; showToast("Chat cleared");
  };
  const toggleEmoji = () => {
    if (showEmoji) { setShowEmoji(false); setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 100); }
    else { if (document.activeElement) document.activeElement.blur(); setShowEmoji(true); }
  };
  const onInputTouchStart = (e) => { if (showEmojiRef.current) { e.preventDefault(); setShowEmoji(false); setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 120); } };
  const onInputFocus = () => { handleInputFocus(); };
  const switchEmojiCat = (cat) => {
    if (emojiGridRef.current) emojiScrollPosRef.current = emojiGridRef.current.scrollTop;
    setEmojiTab(cat); setEmojiSearch("");
    requestAnimationFrame(() => { requestAnimationFrame(() => {
      if (emojiGridRef.current) { const max = emojiGridRef.current.scrollHeight - emojiGridRef.current.clientHeight; emojiGridRef.current.scrollTo({ top: Math.min(emojiScrollPosRef.current, Math.max(0, max)), behavior: "smooth" }); }
      const active = emojiTabsRef.current?.querySelector(`[data-cat="${cat}"]`);
      if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }); });
  };
  const onEmojiSwipeStart = (e) => { const t = e.touches ? e.touches[0] : e; swipeStartXRef.current = t.clientX; swipeStartYRef.current = t.clientY; };
  const onEmojiSwipeEnd = (e) => {
    if (swipeStartXRef.current == null) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - swipeStartXRef.current; const dy = t.clientY - swipeStartYRef.current;
    swipeStartXRef.current = null; swipeStartYRef.current = null;
    if (Math.abs(dx) < 70) return; if (Math.abs(dy) > Math.abs(dx)) return; if (emojiSearch.trim()) return;
    const idx = EMOJI_CAT_LIST.indexOf(emojiTab);
    if (dx < 0 && idx < EMOJI_CAT_LIST.length - 1) switchEmojiCat(EMOJI_CAT_LIST[idx + 1]);
    if (dx > 0 && idx > 0) switchEmojiCat(EMOJI_CAT_LIST[idx - 1]);
  };
  const addEmoji = (emoji) => {
    if (emojiGridRef.current) emojiScrollPosRef.current = emojiGridRef.current.scrollTop;
    setText((prev) => prev + emoji);
    requestAnimationFrame(() => { if (emojiGridRef.current) emojiGridRef.current.scrollTop = emojiScrollPosRef.current; if (document.activeElement) document.activeElement.blur(); });
  };
  const getEmojisToShow = () => {
    if (emojiSearch.trim()) { const q = emojiSearch.toLowerCase(); const all = Object.values(EMOJI_CATS).flat(); return all.filter((item) => item.k.includes(q)); }
    return EMOJI_CATS[emojiTab] || [];
  };
  const toggleSelect = (idx) => { setSelectedIdxs((prev) => { if (prev.includes(idx)) return prev.filter((x) => x !== idx); return [...prev, idx]; }); };
  const onMsgTouchStart = (e, idx) => {
    const t = e.touches[0]; swipeStartX.current = t.clientX; swipeStartY.current = t.clientY; isLongPress.current = false;
    if (scrollRef.current) savedScrollTop.current = scrollRef.current.scrollTop;
    longPressTimer.current = setTimeout(() => { isLongPress.current = true; justSelectedAt.current = Date.now(); setSelectedIdxs((prev) => prev.includes(idx) ? prev : [...prev, idx]); setSwipeOffset({}); requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = savedScrollTop.current; }); }, 450);
  };
  const onMsgTouchMove = (e, idx) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (swipeStartX.current == null) return;
    const t = e.touches[0]; const dx = t.clientX - swipeStartX.current; const dy = t.clientY - swipeStartY.current;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }
    if (dx > 0 && dx < 90 && Math.abs(dy) < 30 && selectedIdxs.length === 0) setSwipeOffset({ [idx]: dx });
  };
  const onMsgTouchEnd = (e, m, idx) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (swipeStartX.current == null) return;
    const t = e.changedTouches[0]; const dx = t.clientX - swipeStartX.current; const dy = t.clientY - swipeStartY.current;
    swipeStartX.current = null; swipeStartY.current = null; setSwipeOffset({});
    if (isLongPress.current) { isLongPress.current = false; return; }
    if (selectedIdxs.length > 0) return;
    if (dx > 60 && Math.abs(dy) < 40) { setReplyTo({ from: m.from, text: m.text }); setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 50); }
  };
  const onMsgClick = (e, idx) => { e.stopPropagation(); if (Date.now() - justSelectedAt.current < 300) return; if (selectedIdxs.length > 0) { toggleSelect(idx); return; } };
  const doCopy = async (e) => {
    if (e) e.stopPropagation();
    if (selectedIdxs.length === 0) return;
    const txt = selectedIdxs.map((i) => cleanText(messages[i]?.text || "")).join("\n");
    try { await navigator.clipboard.writeText(txt); } catch (err) {}
    const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
    setSelectedIdxs([]); requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; });
    showToast(isMulti ? `${selectedIdxs.length} messages copied` : "Copied");
  };
  const doForward = (e) => {
    if (e) e.stopPropagation();
    if (selectedIdxs.length === 0) return;
    const txt = selectedIdxs.map((i) => cleanText(messages[i]?.text || "")).join("\n");
    setText(txt); setSelectedIdxs([]); setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 50);
  };
  const openDeleteSheet = (e) => { if (e) { e.stopPropagation(); e.preventDefault(); } setShowDeleteSheet(true); };
  const closeDeleteSheet = () => setShowDeleteSheet(false);
  const doDeleteForMe = async () => {
    const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
    const toDelete = new Set(selectedIdxs);
    setMessages((prev) => { const next = prev.filter((_, i) => !toDelete.has(i)); try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (err) {} return next; });
    setShowDeleteSheet(false); setSelectedIdxs([]); requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; });
    showToast(selectedIdxs.length > 1 ? `${selectedIdxs.length} messages deleted` : "Message deleted");
  };
  const doDeleteForEveryone = async () => {
    const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
    const toDelete = new Set(selectedIdxs);
    const yourMsgs = selectedIdxs.filter((i) => messages[i]?.from === "you");
    for (const i of yourMsgs) { try { const txt = messages[i]?.text; if (txt) await supabase.from("messages").delete().eq("chat_id", CHAT_ID).eq("sender", "you").eq("text", txt); } catch (err) {} }
    setMessages((prev) => { const next = prev.filter((_, i) => !toDelete.has(i)); try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (err) {} return next; });
    setShowDeleteSheet(false); setSelectedIdxs([]); requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; });
    showToast("Message deleted for everyone");
  };
  const askEVA = async () => {
    if (!text.trim() || isThinking) return;
    const userText = text.trim(); const curReply = replyTo;
    setText(""); setReplyTo(null); setShowEmoji(false); setEmojiSearch(""); const nowTs = Date.now();
    const lower = userText.toLowerCase();
    if (lower.includes("my name is")) { const nm = userText.split(/my name is/i)[1].trim().split(" ")[0].replace(/[^a-zA-Z]/g, ""); if (nm) { const cap = nm.charAt(0).toUpperCase() + nm.slice(1).toLowerCase(); setMyName(cap); localStorage.setItem("eva_dave_name", cap); } }
    if (lower.includes("my best food is")) { const v = userText.split(/my best food is/i)[1].trim(); const np = { ...prefs, food: v }; setPrefs(np); localStorage.setItem("eva_dave_prefs", JSON.stringify(np)); }
    if (lower.includes("i want to buy")) { const v = userText.split(/i want to buy/i)[1].trim(); const np = { ...prefs, want_to_buy: v }; setPrefs(np); localStorage.setItem("eva_dave_prefs", JSON.stringify(np)); }
    setIsThinking(true);
    const userMsgIndex = messages.length;
    setMessages((prev) => { const next = [...prev, { from: "you", text: userText, time: nowTs, status: "sending", replyTo: curReply }, { from: "eva", text: "▍", time: nowTs }]; try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (e) {} return next; });
    saveToSupabase("you", userText).then((ok) => {
      if (!ok) return;
      setMessages((prev) => { const copy = [...prev]; for (let i = copy.length - 1; i >= 0; i--) { if (copy[i].from === "you" && copy[i].time === nowTs) { copy[i] = { ...copy[i], status: "delivered" }; break; } } try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {} return copy; });
    });
    scrollToQuestionWhatsApp(userMsgIndex);
    const typeOut = (fullText) => {
      const cleaned = cleanText(fullText);
      return new Promise((resolve) => {
        let i = 0;
        const interval = setInterval(() => {
          i += 3; const shown = cleaned.slice(0, i); const display = shown + "▍";
          setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = { from: "eva", text: display, time: nowTs }; try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {} return copy; });
          if (i >= cleaned.length) { clearInterval(interval); setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = { from: "eva", text: cleaned, time: nowTs }; try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {} return copy; }); resolve(); }
        }, 18);
      });
    };
    try {
      const history = [...messages, { from: "you", text: userText }].slice(-10).map((m) => ({ role: m.from === "you" ? "user" : "assistant", content: m.text }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userText, history, userProfile: { name: myName, prefs, bestFood: prefs.food, wantToBuy: prefs.want_to_buy, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos" } }) });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json(); const reply = data.reply || "I dey here Boss, try again."; await typeOut(reply); saveToSupabase("eva", reply);
      } else {
        const reader = res.body.getReader(); const decoder = new TextDecoder(); let fullReply = ""; let shown = "";
        const showLoop = setInterval(() => { if (shown.length < fullReply.length) { shown = fullReply.slice(0, shown.length + 4); const display = cleanText(shown) + "▍"; setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = { from: "eva", text: display, time: nowTs }; try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {} return copy; }); } }, 18);
        while (true) { const { done, value } = await reader.read(); if (done) break; fullReply += decoder.decode(value, { stream: true }); }
        clearInterval(showLoop); await typeOut(fullReply); saveToSupabase("eva", fullReply);
      }
    } catch (e) {
      setMessages((prev) => { const w = prev.slice(0, -1); const next = [...w, { from: "eva", text: "Network jam small Boss, try again.", time: Date.now() }]; try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (e) {} return next; });
    }
    setIsThinking(false); if (textareaRef.current) textareaRef.current.focus();
  };
  const hideKeyboardToRead = (e) => {
    if (e && e.target !== e.currentTarget) return;
    setShowMenu(false);
    if (selectedIdxs.length > 0) { const st = scrollRef.current ? scrollRef.current.scrollTop : 0; setSelectedIdxs([]); requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; }); return; }
    if (showEmojiRef.current) setShowEmoji(false);
    if (document.activeElement) document.activeElement.blur();
    saveScroll(); setTimeout(() => { restoreScroll(); }, 60);
  };
  const selectedHasYou = selectedIdxs.some((i) => messages[i]?.from === "you");
  const selectedOnlyEva = selectedIdxs.length > 0 && !selectedHasYou;
  const deleteTitle = selectedIdxs.length === 1 ? (selectedOnlyEva ? "Delete message from EVA?" : "Delete message?") : `Delete ${selectedIdxs.length} messages?`;

  return (
    <div ref={outerRef} style={{ height: "100dvh", minHeight: "100dvh", maxHeight: "100dvh", background: "#030014", color: "white", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "sans-serif", position: "fixed", inset: 0, top: 0, left: 0, right: 0, bottom: 0, overscrollBehavior: "none" }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        .eva-no-select { -webkit-touch-callout: none !important; -webkit-user-select: none !important; -khtml-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; }
        .eva-no-select * { -webkit-touch-callout: none !important; -webkit-user-select: none !important; user-select: none !important; }
        input, textarea { -webkit-user-select: text !important; user-select: text !important; -webkit-touch-callout: default !important; }
        @keyframes evaLaugh { 0%{transform:scale(.6) rotate(-8deg)} 25%{transform:scale(1.25) rotate(6deg) translateY(-4px)} 50%{transform:scale(1.1) rotate(-6deg) translateY(2px)} 75%{transform:scale(1.2) rotate(4deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes evaWink { 0%{transform:scale(.7)} 30%{transform:scale(1.2) rotate(-6deg) translateX(-2px)} 60%{transform:scale(1.05) rotate(4deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes evaLove { 0%{transform:scale(.6)} 30%{transform:scale(1.35)} 50%{transform:scale(1.1)} 70%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes evaCry { 0%{transform:scale(.7) translateY(-6px)} 40%{transform:scale(1.15) translateY(4px)} 70%{transform:scale(1.05) translateY(2px)} 100%{transform:scale(1) translateY(0)} }
        @keyframes evaCool { 0%{transform:scale(.7) rotate(-10deg) translateY(-6px)} 50%{transform:scale(1.2) rotate(4deg) translateY(2px)} 100%{transform:scale(1) rotate(0)} }
        @keyframes evaFire { 0%{transform:scale(.9) rotate(-3deg)} 50%{transform:scale(1.25) rotate(3deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes evaAngry { 0%{transform:scale(.8)} 20%{transform:scale(1.2) translateX(-4px)} 40%{transform:scale(1.15) translateX(4px)} 60%{transform:scale(1.2) translateX(-3px)} 100%{transform:scale(1) translateX(0)} }
        @keyframes evaParty { 0%{transform:scale(.6) translateY(10px)} 40%{transform:scale(1.3) translateY(-8px) rotate(-6deg)} 70%{transform:scale(1.1) translateY(2px) rotate(4deg)} 100%{transform:scale(1) translateY(0)} }
        @keyframes evaSleep { 0%{transform:scale(.9)} 50%{transform:scale(1.15) translateY(-2px)} 100%{transform:scale(1)} }
        @keyframes evaThink { 0%{transform:scale(.8) rotate(-8deg)} 50%{transform:scale(1.15) rotate(6deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes evaHand { 0%{transform:scale(.7) rotate(-10deg)} 50%{transform:scale(1.2) rotate(10deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes evaPop { 0%{transform:scale(.5)} 50%{transform:scale(1.25)} 100%{transform:scale(1)} }
        .eva-laugh{ animation: evaLaugh 0.8s ease-out 1; }
        .eva-wink{ animation: evaWink 0.7s ease-out 1; }
        .eva-love{ animation: evaLove 0.8s ease-out 1; }
        .eva-cry{ animation: evaCry 0.8s ease-out 1; }
        .eva-cool{ animation: evaCool 0.7s ease-out 1; }
        .eva-fire{ animation: evaFire 0.7s ease-out 1; }
        .eva-angry{ animation: evaAngry 0.7s ease-out 1; }
        .eva-party{ animation: evaParty 0.8s ease-out 1; }
        .eva-sleep{ animation: evaSleep 0.9s ease-out 1; }
        .eva-think{ animation: evaThink 0.7s ease-out 1; }
        .eva-hand{ animation: evaHand 0.7s ease-out 1; }
        .eva-pop{ animation: evaPop 0.6s ease-out 1; }
      `}</style>
      <img src="/eva-bg.jpg" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", zIndex: 0 }} />
      {showMenu && (<div style={{ position: "fixed", inset: 0, zIndex: 35, background: "transparent" }} onClick={() => setShowMenu(false)} />)}
      <div style={{ position: "relative", zIndex: 50, flexShrink: 0, flexGrow: 0, background: "rgba(3,0,20,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", paddingTop: "env(safe-area-inset-top)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", padding: "12px 18px 12px", alignItems: "center", justifyContent: "space-between", minHeight: 56, boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, minWidth: 38, minHeight: 38, borderRadius: 999, overflow: "hidden", border: "2px solid #a78bfa", background: "linear-gradient(135deg, #1e1b4b, #4c1d95, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>💧</div>
            <b style={{ fontSize: 20, letterSpacing: 2, lineHeight: 1 }}>EVA</b>
          </div>
          <div style={{ position: "relative", flexShrink: 0, zIndex: 70 }}>
            <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", fontSize: 22, lineHeight: 1 }}>⋮</button>
            {showMenu && (
              <div style={{ position: "absolute", top: 50, right: 0, width: 210, background: "rgba(10,10,20,0.98)", borderRadius: 14, overflow: "hidden", zIndex: 80, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.12)" }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setShowMenu(false); setShowSearch(true); setSearchQuery(""); setTimeout(() => { const inp = document.getElementById("eva-search-input"); if (inp) inp.focus(); }, 100); }} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>🔍 Search</button>
                <button onClick={() => { setShowMenu(false); setShowMedia(true); }} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>🖼️ Media, links, and docs</button>
                <button onClick={openClearSheet} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#ff8080", padding: "13px 16px", fontSize: 14, cursor: "pointer" }}>🗑️ Clear Chat</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showSearch && (
        <div style={{ position: "relative", zIndex: 40, flex: 1, minHeight: 0, background: "#0a0a15", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} style={{ background: "transparent", border: "none", color: "white", fontSize: 20, padding: 4 }}>←</button>
            <input id="eva-search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." autoFocus style={{ flex: 1, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 999, color: "white", padding: "10px 14px", fontSize: 14, outline: "none" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "transparent", border: "none", color: "#aaa", fontSize: 16 }}>✕</button>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px" }}>
            {!searchQuery.trim() && <div style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 30 }}>Type to search messages in EVA<br />e.g. “eva”, “joke”, “pics”</div>}
            {searchQuery.trim() && searchResults.length === 0 && <div style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 30 }}>No results for “{searchQuery}”</div>}
            {searchQuery.trim() && searchResults.length > 0 && <div style={{ fontSize: 12, color: "#a78bfa", marginBottom: 8 }}>{searchResults.length} result{searchResults.length > 1 ? "s" : ""} — tap to jump</div>}
            {searchResults.map(({ m, idx }) => (
              <button key={idx} onClick={() => jumpToMessage(idx)} style={{ width: "100%", textAlign: "left", background: m.from === "you" ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px", marginBottom: 8, color: "white" }}>
                <div style={{ fontSize: 11, color: m.from === "you" ? "#c4b5fd" : "#aaa", marginBottom: 4 }}>{m.from === "you" ? "You" : "EVA"} • {fmtTime(m.time)}</div>
                <div style={{ fontSize: 14, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cleanText(m.text)}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {showMedia && !showSearch && (
        <div style={{ position: "relative", zIndex: 40, flex: 1, minHeight: 0, background: "#0a0a15", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            <button onClick={() => setShowMedia(false)} style={{ background: "transparent", border: "none", color: "white", fontSize: 20, padding: 4 }}>←</button>
            <b style={{ fontSize: 16 }}>Media, links, and docs</b>
          </div>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            {["Media", "Docs", "Links"].map((t) => (
              <button key={t} onClick={() => setMediaTab(t)} style={{ flex: 1, background: "transparent", border: "none", borderBottom: mediaTab === t ? "2px solid #25D366" : "2px solid transparent", color: mediaTab === t ? "#25D366" : "#aaa", padding: "12px 0", fontSize: 14, fontWeight: mediaTab === t ? "bold" : "normal" }}>{t}</button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {mediaTab === "Media" && (<>{mediaList.length === 0 ? (<div style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>No media yet<br /><span style={{ fontSize: 12, opacity: 0.7 }}>When you send pics / videos in EVA, dem go show here</span></div>) : (<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>{mediaList.map(({ m, idx }) => (<button key={idx} onClick={() => jumpToMessage(idx)} style={{ aspectRatio: "1", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, overflow: "hidden", padding: 0, position: "relative" }}>{m.mediaUrl || m.imageUrl ? <img src={m.mediaUrl || m.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>{isOnlyEmojiMsg(m.text) ? cleanText(m.text).slice(0, 2) : "🖼️"}</span>}<span style={{ position: "absolute", bottom: 4, right: 6, fontSize: 10, color: "white", textShadow: "0 1px 3px black" }}>{fmtTime(m.time)}</span></button>))}</div>)}</>)}
            {mediaTab === "Docs" && (<>{docsList.length === 0 ? (<div style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>No docs yet<br /><span style={{ fontSize: 12, opacity: 0.7 }}>When you send PDF / Doc / files in EVA, dem go show here</span></div>) : docsList.map(({ m, idx }) => (<button key={idx} onClick={() => jumpToMessage(idx)} style={{ width: "100%", textAlign: "left", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px", marginBottom: 8, color: "white", display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 28 }}>📄</span><span style={{ flex: 1, minWidth: 0 }}><span style={{ display: "block", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.fileName || cleanText(m.text).slice(0, 60)}</span><span style={{ fontSize: 11, color: "#aaa" }}>{m.from === "you" ? "You" : "EVA"} • {fmtTime(m.time)}</span></span></button>))}</>)}
            {mediaTab === "Links" && (<>{linksList.length === 0 ? (<div style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>No links yet<br /><span style={{ fontSize: 12, opacity: 0.7 }}>When you or EVA send links, dem go show here</span></div>) : linksList.map(({ m, idx }) => (<button key={idx} onClick={() => jumpToMessage(idx)} style={{ width: "100%", textAlign: "left", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px", marginBottom: 8, color: "white" }}><div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>{m.from === "you" ? "You" : "EVA"} • {fmtTime(m.time)}</div>{extractLinks(m.text).map((l, li) => (<div key={li} style={{ fontSize: 14, color: "#4da3ff", wordBreak: "break-all", marginBottom: 4 }}>{l}</div>))}<div style={{ fontSize: 13, opacity: 0.8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cleanText(m.text)}</div></button>))}</>)}
          </div>
        </div>
      )}
      {!showSearch && !showMedia && (
      <div ref={scrollRef} className="eva-no-select" style={{ position: "relative", zIndex: 10, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", overscrollBehavior: "contain", overflowAnchor: "auto", padding: "12px 20px 10px", WebkitOverflowScrolling: "touch", scrollBehavior: "auto", visibility: isReady ? "visible" : "hidden" }} onClick={hideKeyboardToRead} onContextMenu={(e) => e.preventDefault()} onSelectStart={(e) => e.preventDefault()}>
        {messages.length === 0 && isReady && (<div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: 14, borderRadius: 16, maxWidth: 420, margin: "0 auto", textAlign: "center" }}>Hello, I am EVA. Ask me anything.</div>)}
        {messages.map((m, i) => {
          const isLastUser = m.from === "you" && messages.slice(i + 1).every((x) => x.from !== "you");
          const naked = isOnlyEmojiMsg(m.text);
          const isSel = selectedIdxs.includes(i);
          const off = swipeOffset[i] || 0;
          const isHighlighted = highlightIdx === i;
          return (
            <div id={`eva-msg-${i}`} key={i} className="eva-no-select" style={{ position: "relative", alignSelf: m.from === "you" ? "flex-end" : "flex-start", width: "100%", display: "flex", flexDirection: "column", alignItems: m.from === "you" ? "flex-end" : "flex-start", paddingTop: (isSingle && isSel && naked) ? 36 : 0 }} onContextMenu={(e) => e.preventDefault()} onSelectStart={(e) => e.preventDefault()}>
              {off > 20 && (<div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", opacity: Math.min(1, off / 60), fontSize: 22 }}>↩️</div>)}
              {isSingle && isSel && naked && (
                <div style={{ position: "absolute", top: 0, right: m.from === "you" ? 0 : "auto", left: m.from === "you" ? "auto" : 0, display: "flex", alignItems: "center", gap: 14, background: "rgba(0,0,0,0.88)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 12px", boxShadow: "0 6px 20px rgba(0,0,0,0.5)", zIndex: 30 }} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  <button onClick={doCopy} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><CopyIcon size={18} /></button>
                  <button onClick={doForward} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><ForwardIcon size={20} /></button>
                  <button onClick={openDeleteSheet} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><TrashIcon size={18} /></button>
                </div>
              )}
              <div ref={isLastUser ? lastUserMsgRef : null} onTouchStart={(e) => onMsgTouchStart(e, i)} onTouchMove={(e) => onMsgTouchMove(e, i)} onTouchEnd={(e) => onMsgTouchEnd(e, m, i)} onClick={(e) => onMsgClick(e, i)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (!selectedIdxs.includes(i)) { justSelectedAt.current = Date.now(); setSelectedIdxs((prev) => [...prev, i]); } }} onSelectStart={(e) => e.preventDefault()} style={naked ? { background: isSel ? "rgba(139,92,246,0.45)" : (isHighlighted ? "rgba(37,211,102,0.4)" : "transparent"), border: isSel ? "1px solid rgba(139,92,246,0.5)" : (isHighlighted ? "1px solid #25D366" : "none"), padding: "2px 6px 2px", borderRadius: 8, maxWidth: "85%", fontSize: 15, lineHeight: 1.2, whiteSpace: "pre-line", boxShadow: "none", touchAction: "pan-y", transform: off ? `translateX(${off}px)` : "none" } : { background: isSel ? "rgba(139,92,246,0.75)" : (isHighlighted ? "rgba(37,211,102,0.35)" : (m.from === "you" ? "#8b5cf6" : "rgba(0,0,0,0.65)")), border: isSel ? "1px solid rgba(255,255,255,0.6)" : (isHighlighted ? "1px solid #25D366" : "1px solid rgba(255,255,255,0.25)"), padding: "10px 14px 6px", borderRadius: 16, maxWidth: "85%", fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-line", touchAction: "pan-y", transform: off ? `translateX(${off}px)` : "none" }}>
                {m.replyTo && (<div style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 8, marginBottom: 6, opacity: 0.9 }}><div style={{ fontSize: 12, fontWeight: "bold", color: "#c4b5fd" }}>{m.replyTo.from === "you" ? "You" : "EVA"}</div><div style={{ fontSize: 13, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{cleanText(m.replyTo.text)}</div></div>)}
                {naked ? (<div key={replayMap[i] || `emoji-${m.time}-${i}`} onClick={(e) => { if (selectedIdxs.length === 0) { e.stopPropagation(); setReplayMap((prev) => ({ ...prev, [i]: Date.now() })); } }} style={{ display: "flex", gap: 2, cursor: "pointer" }}>{Array.from(cleanText(m.text)).map((ch, j) => (<span key={j} className={getEmojiAnim(ch)} style={{ fontSize: getEmojiSize(m.text), lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.6)", display: "inline-block", animationDelay: `${j * 0.08}s` }}>{ch}</span>))}</div>) : (<div style={{ fontSize: 15, lineHeight: 1.5 }}>{cleanText(m.text)}</div>)}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: naked ? 0 : 4, fontSize: 10, opacity: naked ? 0.85 : 0.75, textShadow: naked ? "0 1px 3px rgba(0,0,0,0.9)" : "none" }}><span>{fmtTime(m.time)}</span>{m.from === "you" && (<span style={{ fontSize: 12, letterSpacing: -2 }}>{m.status === "delivered" ? "✓✓" : "✓"}</span>)}</div>
              </div>
              {isSingle && isSel && !naked && (<button onClick={openDeleteSheet} onTouchStart={(e) => e.stopPropagation()} style={{ position: "absolute", top: -8, right: 2, background: "transparent", border: "none", boxShadow: "none", padding: 4, cursor: "pointer", zIndex: 25 }}><TrashIcon /></button>)}
              {isSingle && isSel && !naked && (<div style={{ position: "absolute", top: "100%", left: 0, right: 0, width: "100%", maxWidth: "85%", alignSelf: m.from === "you" ? "flex-end" : "flex-start", background: "transparent", border: "none", boxShadow: "none", padding: "4px 4px 0", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20, pointerEvents: "auto" }} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}><button onClick={doCopy} style={{ background: "transparent", border: "none", boxShadow: "none", padding: 6, cursor: "pointer" }}><CopyIcon /></button><button onClick={doForward} style={{ background: "transparent", border: "none", boxShadow: "none", padding: 6, cursor: "pointer" }}><ForwardIcon /></button></div>)}
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 10, flexShrink: 0 }} />
      </div>
      )}
      {toast && (<div style={{ position: "relative", zIndex: 40, margin: "0 auto", background: "rgba(0,0,0,0.9)", color: "white", padding: "8px 16px", borderRadius: 999, fontSize: 13, marginBottom: 6 }}>{toast}</div>)}
      {isMulti && !showSearch && !showMedia && (
        <div style={{ position: "relative", zIndex: 35, flexShrink: 0, display: "flex", justifyContent: "flex-start", padding: "0 16px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(0,0,0,0.88)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "7px 14px", boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
            <span style={{ fontSize: 12, color: "#c4b5fd", fontWeight: "bold", whiteSpace: "nowrap" }}>{selectedIdxs.length} selected</span>
            <button onClick={doCopy} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><CopyIcon size={20} /></button>
            <button onClick={doForward} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><ForwardIcon size={22} /></button>
            <button onClick={openDeleteSheet} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><TrashIcon size={20} /></button>
            <button onClick={() => setSelectedIdxs([])} style={{ background: "transparent", border: "none", color: "#aaa", fontSize: 14, padding: "0 2px", cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}
      {showDeleteSheet && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={closeDeleteSheet}>
          <div style={{ width: "100%", maxWidth: 520, background: "#1a1a1a", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: "16px 20px calc(20px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: "bold", color: "white", marginBottom: 16, textAlign: "left" }}>{deleteTitle}</div>
            {selectedHasYou && (<button onClick={doDeleteForEveryone} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#25D366", padding: "14px 0", fontSize: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Delete for everyone</button>)}
            <button onClick={doDeleteForMe} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#25D366", padding: "14px 0", fontSize: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Delete for me</button>
            <button onClick={closeDeleteSheet} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#25D366", padding: "14px 0", fontSize: 16 }}>Cancel</button>
            {selectedIdxs.length > 1 && !selectedHasYou && (<div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>EVA messages can only be deleted for you</div>)}
          </div>
        </div>
      )}
      {showClearSheet && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 110, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowClearSheet(false)}>
          <div style={{ width: "100%", maxWidth: 520, background: "#111118", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: "12px 20px calc(20px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <button onClick={() => setShowClearSheet(false)} style={{ background: "transparent", border: "none", color: "white", fontSize: 20, padding: 4 }}>✕</button>
              <b style={{ fontSize: 18, color: "white" }}>Clear chat</b>
            </div>
            <button onClick={() => setClearMode("all")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: "12px 0", textAlign: "left" }}><span style={{ width: 20, height: 20, borderRadius: 999, border: clearMode === "all" ? "6px solid #25D366" : "2px solid #666", display: "block", boxSizing: "border-box" }} /><span style={{ color: "white", fontSize: 15, flex: 1 }}>All messages <span style={{ color: "#aaa" }}>({totalSize})</span></span></button>
            <button onClick={() => setClearMode("videos")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: "12px 0", textAlign: "left" }}><span style={{ width: 20, height: 20, borderRadius: 999, border: clearMode === "videos" ? "6px solid #25D366" : "2px solid #666", display: "block", boxSizing: "border-box" }} /><span style={{ color: "white", fontSize: 15, flex: 1 }}>Videos <span style={{ color: "#aaa" }}>({videoSize})</span></span></button>
            <button onClick={() => setClearMode("photos")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: "12px 0", textAlign: "left" }}><span style={{ width: 20, height: 20, borderRadius: 999, border: clearMode === "photos" ? "6px solid #25D366" : "2px solid #666", display: "block", boxSizing: "border-box" }} /><span style={{ color: "white", fontSize: 15, flex: 1 }}>Photos <span style={{ color: "#aaa" }}>({photoSize})</span></span></button>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4, margin: "14px 0 16px" }}>Your saved files from EVA will remain in your device gallery after clearing.</div>
            <button onClick={doClearChat} style={{ width: "100%", background: "transparent", border: "none", color: "#ff5a5a", fontSize: 15, padding: "12px 0", fontWeight: "bold" }}>{clearMode === "all" ? `Clear chat (${totalSize})` : clearMode === "videos" ? `Clear videos (${videoSize})` : `Clear photos (${photoSize})`}</button>
          </div>
        </div>
      )}
      {showEmoji && !showSearch && !showMedia && (
        <div style={{ position: "relative", zIndex: 25, flexShrink: 0, flexGrow: 0, height: 280, minHeight: 280, maxHeight: 280, background: "rgba(0,0,0,0.95)", borderTop: "1px solid rgba(255,255,255,0.2)", padding: "10px 10px 6px", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box", transform: "translateZ(0)", willChange: "transform" }}>
          <input value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} placeholder="🔍 Search emoji... type car, monkey, love" style={{ width: "100%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, color: "white", padding: "9px 14px", fontSize: 13, outline: "none", boxSizing: "border-box", flexShrink: 0 }} />
          <div ref={emojiTabsRef} style={{ display: "flex", gap: 6, overflowX: "auto", overflowY: "hidden", padding: "10px 0 8px", whiteSpace: "nowrap", scrollbarWidth: "none", flexShrink: 0, scrollBehavior: "smooth", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
            {EMOJI_CAT_LIST.map((cat) => (<button key={cat} data-cat={cat} onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onClick={() => switchEmojiCat(cat)} style={{ background: emojiTab === cat && !emojiSearch ? "#8b5cf6" : "rgba(255,255,255,0.12)", border: "none", color: "white", padding: "6px 12px", borderRadius: 999, fontSize: 12, flexShrink: 0 }}>{cat}</button>))}
          </div>
          <div ref={emojiGridRef} onTouchStart={onEmojiSwipeStart} onTouchEnd={onEmojiSwipeEnd} onScroll={() => { if (emojiGridRef.current) emojiScrollPosRef.current = emojiGridRef.current.scrollTop; }} style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingBottom: 6, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", scrollBehavior: "smooth", transform: "translateZ(0)", willChange: "scroll-position" }}>
            {getEmojisToShow().map((item, i) => (<button key={i} onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onClick={() => addEmoji(item.e)} style={{ background: "transparent", border: "none", fontSize: 26, padding: 6, touchAction: "manipulation" }}>{item.e}</button>))}
          </div>
          {getEmojisToShow().length === 0 && (<div style={{ textAlign: "center", padding: 14, fontSize: 13, color: "#aaa", flexShrink: 0 }}>No emoji for "{emojiSearch}" — try car, monkey, love, dog</div>)}
          <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.35)", padding: "2px 0 0", flexShrink: 0 }}>← Swipe sides to change gesture →</div>
        </div>
      )}
      {!showSearch && !showMedia && (
      <div style={{ position: "relative", zIndex: 30, flexShrink: 0, flexGrow: 0, background: "rgba(3,0,20,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", padding: "12px 16px 12px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        {replyTo && (<div style={{ maxWidth: 520, margin: "0 auto 8px", background: "rgba(139,92,246,0.25)", borderLeft: "3px solid #8b5cf6", padding: "8px 10px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><div style={{ minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: "bold", color: "#c4b5fd" }}>Replying to {replyTo.from === "you" ? "You" : "EVA"}</div><div style={{ fontSize: 13, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanText(replyTo.text)}</div></div><button onClick={() => setReplyTo(null)} style={{ background: "transparent", border: "none", color: "white", fontSize: 16 }}>✕</button></div>)}
        <div style={{ display: "flex", gap: 6, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 999, padding: 8, alignItems: "center" }}>
          <button onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onClick={toggleEmoji} style={{ background: showEmoji ? "#8b5cf6" : "transparent", border: "none", fontSize: 24, padding: "2px 4px", flexShrink: 0, borderRadius: 999 }}>😊</button>
          <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} onTouchStart={onInputTouchStart} onFocus={onInputFocus} onBlur={handleInputBlur} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askEVA(); } }} placeholder="Ask EVA..." rows={1} enterKeyHint="send" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} readOnly={showEmoji} data-lpignore="true" data-1p-ignore="true" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "10px 6px", fontSize: 15, resize: "none", maxHeight: 100, fontFamily: "sans-serif" }} />
          <button onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onClick={askEVA} style={{ background: "#8b5cf6", border: "none", color: "white", padding: "10px 18px", borderRadius: 999, fontWeight: "bold", flexShrink: 0, touchAction: "manipulation" }}>Ask →</button>
        </div>
      </div>
      )}
    </div>
  );
  }
