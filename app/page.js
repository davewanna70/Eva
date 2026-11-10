"use client";
import { useState, useEffect, useRef } from "react";
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

export default function EVA() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const c = localStorage.getItem("eva_messages_cache");
      if (c) return JSON.parse(c);
    } catch (e) {}
    return [];
  });
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

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const didInitialScroll = useRef(false);
  const smoothAnimRef = useRef(null);
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

  const selectedIdx = selectedIdxs.length > 0 ? selectedIdxs[0] : null;
  const isMulti = selectedIdxs.length >= 2;
  const isSingle = selectedIdxs.length === 1;

  useEffect(() => {
    if (!window.visualViewport) return;
    const setH = () => {
      if (!outerRef.current) return;
      outerRef.current.style.height = window.visualViewport.height + "px";
      outerRef.current.style.minHeight = window.visualViewport.height + "px";
      outerRef.current.style.maxHeight = window.visualViewport.height + "px";
    };
    setH();
    window.visualViewport.addEventListener("resize", setH);
    window.visualViewport.addEventListener("scroll", setH);
    return () => {
      window.visualViewport.removeEventListener("resize", setH);
      window.visualViewport.removeEventListener("scroll", setH);
    };
  }, []);

  useEffect(() => {
    const n = localStorage.getItem("eva_dave_name");
    if (n) setMyName(n);
    const p = localStorage.getItem("eva_dave_prefs");
    if (p) {
      try { setPrefs(JSON.parse(p)); } catch (e) {}
    }
    const local = (() => {
      try { return JSON.parse(localStorage.getItem("eva_messages_cache") || "[]"); }
      catch (e) { return []; }
    })();
    if (local.length > 0) return;
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").eq("chat_id", CHAT_ID).order("created_at", { ascending: true }).limit(80);
      if (data && data.length) {
        const mapped = data.map((m) => ({ from: m.sender === "you" ? "you" : "eva", text: m.text, time: m.created_at ? new Date(m.created_at).getTime() : Date.now(), status: m.sender === "you" ? "delivered" : undefined }));
        const nowLocal = (() => {
          try { return JSON.parse(localStorage.getItem("eva_messages_cache") || "[]"); }
          catch (e) { return []; }
        })();
        if (nowLocal.length === 0) {
          setMessages(mapped);
          try { localStorage.setItem("eva_messages_cache", JSON.stringify(mapped)); } catch (e) {}
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (didInitialScroll.current) return;
    if (messages.length === 0) return;
    const t1 = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      didInitialScroll.current = true;
    }, 100);
    return () => { clearTimeout(t1); };
  }, [messages.length]);

  const smoothScrollBy = (diff) => {
    if (!scrollRef.current || !diff) return;
    if (smoothAnimRef.current) cancelAnimationFrame(smoothAnimRef.current);
    const c = scrollRef.current;
    const start = c.scrollTop;
    const target = start + diff;
    const startTime = performance.now();
    const DURATION = 250;
    const tick = (now) => {
      const p = Math.min(1, (now - startTime) / DURATION);
      const ease = 1 - Math.pow(1 - p, 3);
      c.scrollTop = start + (target - start) * ease;
      if (p < 1) smoothAnimRef.current = requestAnimationFrame(tick);
    };
    smoothAnimRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!window.visualViewport) return;
    let lastH = window.visualViewport.height;
    const onResize = () => {
      const newH = window.visualViewport.height;
      const diff = newH - lastH;
      lastH = newH;
      if (diff > 30) {
        smoothScrollBy(diff);
      }
    };
    window.visualViewport.addEventListener("resize", onResize);
    return () => window.visualViewport.removeEventListener("resize", onResize);
  }, []);

  const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 1500);
  };

  const saveToSupabase = async (sender, msgText) => {
    try {
      const { error } = await supabase.from("messages").insert([{ chat_id: CHAT_ID, sender, text: msgText }]);
      return !error;
    } catch (e) { return false; }
  };

  const clearChat = async () => {
    if (!window.confirm("Clear all chats?")) return;
    setMessages([]);
    setMyName("");
    setPrefs({});
    localStorage.removeItem("eva_dave_name");
    localStorage.removeItem("eva_dave_prefs");
    localStorage.removeItem("eva_messages_cache");
    try { await supabase.from("messages").delete().eq("chat_id", CHAT_ID); } catch (e) {}
    setShowMenu(false);
    didInitialScroll.current = true;
  };

  const toggleEmoji = () => {
    if (showEmoji) {
      setShowEmoji(false);
      setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 100);
    } else {
      if (document.activeElement) document.activeElement.blur();
      setShowEmoji(true);
    }
  };

  const onInputTouchStart = (e) => {
    if (showEmojiRef.current) {
      e.preventDefault();
      setShowEmoji(false);
      setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 120);
    }
  };
  const onInputFocus = () => {
    if (showEmojiRef.current) {
      setShowEmoji(false);
    }
  };

  const switchEmojiCat = (cat) => {
    if (emojiGridRef.current) emojiScrollPosRef.current = emojiGridRef.current.scrollTop;
    setEmojiTab(cat);
    setEmojiSearch("");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (emojiGridRef.current) {
          const max = emojiGridRef.current.scrollHeight - emojiGridRef.current.clientHeight;
          emojiGridRef.current.scrollTo({ top: Math.min(emojiScrollPosRef.current, Math.max(0, max)), behavior: "smooth" });
        }
        const active = emojiTabsRef.current?.querySelector(`[data-cat="${cat}"]`);
        if (active) active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    });
  };

  const onEmojiSwipeStart = (e) => {
    const t = e.touches ? e.touches[0] : e;
    swipeStartXRef.current = t.clientX;
    swipeStartYRef.current = t.clientY;
  };
  const onEmojiSwipeEnd = (e) => {
    if (swipeStartXRef.current == null) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - swipeStartXRef.current;
    const dy = t.clientY - swipeStartYRef.current;
    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    if (Math.abs(dx) < 70) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (emojiSearch.trim()) return;
    const idx = EMOJI_CAT_LIST.indexOf(emojiTab);
    if (dx < 0 && idx < EMOJI_CAT_LIST.length - 1) switchEmojiCat(EMOJI_CAT_LIST[idx + 1]);
    if (dx > 0 && idx > 0) switchEmojiCat(EMOJI_CAT_LIST[idx - 1]);
  };

  const addEmoji = (emoji) => {
    if (emojiGridRef.current) emojiScrollPosRef.current = emojiGridRef.current.scrollTop;
    setText((prev) => prev + emoji);
    requestAnimationFrame(() => {
      if (emojiGridRef.current) {
        emojiGridRef.current.scrollTop = emojiScrollPosRef.current;
      }
      if (document.activeElement) document.activeElement.blur();
    });
  };

  const getEmojisToShow = () => {
    if (emojiSearch.trim()) {
      const q = emojiSearch.toLowerCase();
      const all = Object.values(EMOJI_CATS).flat();
      return all.filter((item) => item.k.includes(q));
    }
    return EMOJI_CATS[emojiTab] || [];
  };

  const scrollToQuestionWith3Lines = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!scrollRef.current || !lastUserMsgRef.current) return;
        const c = scrollRef.current;
        const q = lastUserMsgRef.current;
        const target = q.offsetTop - 10;
        c.scrollTop = Math.max(0, Math.min(target, c.scrollHeight - c.clientHeight));
      });
    });
  };

  const toggleSelect = (idx) => {
    setSelectedIdxs((prev) => {
      if (prev.includes(idx)) return prev.filter((x) => x !== idx);
      return [...prev, idx];
    });
  };

  const onMsgTouchStart = (e, idx) => {
    const t = e.touches[0];
    swipeStartX.current = t.clientX;
    swipeStartY.current = t.clientY;
    isLongPress.current = false;
    if (scrollRef.current) savedScrollTop.current = scrollRef.current.scrollTop;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      justSelectedAt.current = Date.now();
      setSelectedIdxs((prev) => prev.includes(idx) ? prev : [...prev, idx]);
      setSwipeOffset({});
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = savedScrollTop.current;
      });
    }, 450);
  };
  const onMsgTouchMove = (e, idx) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (swipeStartX.current == null) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStartX.current;
    const dy = t.clientY - swipeStartY.current;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    }
    if (dx > 0 && dx < 90 && Math.abs(dy) < 30 && selectedIdxs.length === 0) {
      setSwipeOffset({ [idx]: dx });
    }
  };
  const onMsgTouchEnd = (e, m, idx) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (swipeStartX.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStartX.current;
    const dy = t.clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;
    setSwipeOffset({});
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    if (selectedIdxs.length > 0) return;
    if (dx > 60 && Math.abs(dy) < 40) {
      setReplyTo({ from: m.from, text: m.text });
      setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 50);
    }
  };

  const onMsgClick = (e, idx) => {
    e.stopPropagation();
    if (Date.now() - justSelectedAt.current < 300) return;
    if (selectedIdxs.length > 0) {
      toggleSelect(idx);
      return;
    }
  };

  const doCopy = async (e) => {
    if (e) e.stopPropagation();
    if (selectedIdxs.length === 0) return;
    const txt = selectedIdxs.map((i) => cleanText(messages[i]?.text || "")).join("\n");
    try { await navigator.clipboard.writeText(txt); } catch (err) {}
    const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
    setSelectedIdxs([]);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; });
    showToast(isMulti ? `${selectedIdxs.length} messages copied` : "Copied");
  };
  const doForward = (e) => {
    if (e) e.stopPropagation();
    if (selectedIdxs.length === 0) return;
    const txt = selectedIdxs.map((i) => cleanText(messages[i]?.text || "")).join("\n");
    setText(txt);
    setSelectedIdxs([]);
    setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 50);
  };

  const openDeleteSheet = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setShowDeleteSheet(true);
  };
  const closeDeleteSheet = () => setShowDeleteSheet(false);

  const doDeleteForMe = async () => {
    const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
    const toDelete = new Set(selectedIdxs);
    setMessages((prev) => {
      const next = prev.filter((_, i) => !toDelete.has(i));
      try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (err) {}
      return next;
    });
    setShowDeleteSheet(false);
    setSelectedIdxs([]);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; });
    showToast(selectedIdxs.length > 1 ? `${selectedIdxs.length} messages deleted` : "Message deleted");
  };

  const doDeleteForEveryone = async () => {
    const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
    const toDelete = new Set(selectedIdxs);
    const yourMsgs = selectedIdxs.filter((i) => messages[i]?.from === "you");
    for (const i of yourMsgs) {
      try {
        const txt = messages[i]?.text;
        if (txt) await supabase.from("messages").delete().eq("chat_id", CHAT_ID).eq("sender", "you").eq("text", txt);
      } catch (err) {}
    }
    setMessages((prev) => {
      const next = prev.filter((_, i) => !toDelete.has(i));
      try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (err) {}
      return next;
    });
    setShowDeleteSheet(false);
    setSelectedIdxs([]);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; });
    showToast("Message deleted for everyone");
  };

  const askEVA = async () => {
    if (!text.trim() || isThinking) return;
    const userText = text.trim();
    const curReply = replyTo;
    setText("");
    setReplyTo(null);
    setShowEmoji(false);
    setEmojiSearch("");
    const nowTs = Date.now();

    const lower = userText.toLowerCase();
    if (lower.includes("my name is")) {
      const nm = userText.split(/my name is/i)[1].trim().split(" ")[0].replace(/[^a-zA-Z]/g, "");
      if (nm) {
        const cap = nm.charAt(0).toUpperCase() + nm.slice(1).toLowerCase();
        setMyName(cap);
        localStorage.setItem("eva_dave_name", cap);
      }
    }
    if (lower.includes("my best food is")) {
      const v = userText.split(/my best food is/i)[1].trim();
      const np = { ...prefs, food: v };
      setPrefs(np);
      localStorage.setItem("eva_dave_prefs", JSON.stringify(np));
    }
    if (lower.includes("i want to buy")) {
      const v = userText.split(/i want to buy/i)[1].trim();
      const np = { ...prefs, want_to_buy: v };
      setPrefs(np);
      localStorage.setItem("eva_dave_prefs", JSON.stringify(np));
    }

    setIsThinking(true);
    setMessages((prev) => {
      const next = [...prev, { from: "you", text: userText, time: nowTs, status: "sending", replyTo: curReply }, { from: "eva", text: "▍", time: nowTs }];
      try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (e) {}
      return next;
    });

    saveToSupabase("you", userText).then((ok) => {
      if (!ok) return;
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].from === "you" && copy[i].time === nowTs) { copy[i] = { ...copy[i], status: "delivered" }; break; }
        }
        try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {}
        return copy;
      });
    });

    scrollToQuestionWith3Lines();

    const typeOut = (fullText) => {
      const cleaned = cleanText(fullText);
      return new Promise((resolve) => {
        let i = 0;
        const interval = setInterval(() => {
          i += 3;
          const shown = cleaned.slice(0, i);
          const display = shown + "▍";
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { from: "eva", text: display, time: nowTs };
            try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {}
            return copy;
          });
          if (i >= cleaned.length) {
            clearInterval(interval);
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { from: "eva", text: cleaned, time: nowTs };
              try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {}
              return copy;
            });
            resolve();
          }
        }, 18);
      });
    };

    try {
      const history = [...messages, { from: "you", text: userText }].slice(-10).map((m) => ({ role: m.from === "you" ? "user" : "assistant", content: m.text }));
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: userText, history, userProfile: { name: myName, prefs, bestFood: prefs.food, wantToBuy: prefs.want_to_buy } }) });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const reply = data.reply || "I dey here Boss, try again.";
        await typeOut(reply);
        saveToSupabase("eva", reply);
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = "";
        let shown = "";
        const showLoop = setInterval(() => {
          if (shown.length < fullReply.length) {
            shown = fullReply.slice(0, shown.length + 4);
            const display = cleanText(shown) + "▍";
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { from: "eva", text: display, time: nowTs };
              try { localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); } catch (e) {}
              return copy;
            });
          }
        }, 18);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullReply += decoder.decode(value, { stream: true });
        }
        clearInterval(showLoop);
        await typeOut(fullReply);
        saveToSupabase("eva", fullReply);
      }
    } catch (e) {
      setMessages((prev) => {
        const w = prev.slice(0, -1);
        const next = [...w, { from: "eva", text: "Network jam small Boss, try again.", time: Date.now() }];
        try { localStorage.setItem("eva_messages_cache", JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }
    setIsThinking(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const hideKeyboardToRead = (e) => {
    if (e && e.target !== e.currentTarget) return;
    setShowMenu(false);
    if (selectedIdxs.length > 0) {
      const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
      setSelectedIdxs([]);
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = st; });
    }
    if (showEmojiRef.current) setShowEmoji(false);
    if (document.activeElement) document.activeElement.blur();
  };

  const selectedHasYou = selectedIdxs.some((i) => messages[i]?.from === "you");
  const selectedOnlyEva = selectedIdxs.length > 0 && !selectedHasYou;
  const deleteTitle = selectedIdxs.length === 1
    ? (selectedOnlyEva ? "Delete message from EVA?" : "Delete message?")
    : `Delete ${selectedIdxs.length} messages?`;

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

      <div style={{ position: "relative", zIndex: 30, flexShrink: 0, flexGrow: 0, background: "rgba(3,0,20,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", paddingTop: "env(safe-area-inset-top)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", padding: "12px 18px 12px", alignItems: "center", justifyContent: "space-between", minHeight: 56, boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/IMG-20261104-WA3311.jpg" style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "2px solid #a78bfa", flexShrink: 0 }} />
            <b style={{ fontSize: 20, letterSpacing: 2, lineHeight: 1 }}>EVA</b>
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onClick={() => setShowMenu(!showMenu)} style={{ width: 42, height: 42, borderRadius: 999, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", color: "white", fontSize: 22, lineHeight: 1 }}>⋮</button>
            {showMenu && (
              <div style={{ position: "absolute", top: 50, right: 0, width: 170, background: "rgba(0,0,0,0.95)", borderRadius: 14, overflow: "hidden", zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                <button onClick={clearChat} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#ff8080", padding: "13px 16px", fontSize: 14 }}>🗑️ Clear Chat</button>
                <button onClick={() => setShowMenu(false)} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "white", padding: "13px 16px", fontSize: 14 }}>✖️ Close</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="eva-no-select"
        style={{ position: "relative", zIndex: 10, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", overscrollBehavior: "contain", overflowAnchor: "none", padding: "12px 20px 10px", WebkitOverflowScrolling: "touch", scrollBehavior: "auto" }}
        onClick={hideKeyboardToRead}
        onContextMenu={(e) => e.preventDefault()}
        onSelectStart={(e) => e.preventDefault()}
      >
        {messages.length === 0 && (
          <div style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.25)", padding: 14, borderRadius: 16, maxWidth: 420, margin: "0 auto", textAlign: "center" }}>Hello, I am EVA. Ask me anything.</div>
        )}
        {messages.map((m, i) => {
          const isLastUser = m.from === "you" && messages.slice(i + 1).every((x) => x.from !== "you");
          const naked = isOnlyEmojiMsg(m.text);
          const isSel = selectedIdxs.includes(i);
          const off = swipeOffset[i] || 0;
          return (
            <div key={i} className="eva-no-select" style={{ position: "relative", alignSelf: m.from === "you" ? "flex-end" : "flex-start", width: "100%", display: "flex", flexDirection: "column", alignItems: m.from === "you" ? "flex-end" : "flex-start", paddingTop: (isSingle && isSel && naked) ? 36 : 0 }} onContextMenu={(e) => e.preventDefault()} onSelectStart={(e) => e.preventDefault()}>
              {off > 20 && (
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", opacity: Math.min(1, off / 60), fontSize: 22 }}>↩️</div>
              )}

              {/* EMOJI PILL - ON TOP ONLY, SMALL BLACK CAPSULE */}
              {isSingle && isSel && naked && (
                <div
                  style={{ position: "absolute", top: 0, right: m.from === "you" ? 0 : "auto", left: m.from === "you" ? "auto" : 0, display: "flex", alignItems: "center", gap: 14, background: "rgba(0,0,0,0.88)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "6px 12px", boxShadow: "0 6px 20px rgba(0,0,0,0.5)", zIndex: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <button onClick={doCopy} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><CopyIcon size={18} /></button>
                  <button onClick={doForward} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><ForwardIcon size={20} /></button>
                  <button onClick={openDeleteSheet} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}><TrashIcon size={18} /></button>
                </div>
              )}

              <div
                ref={isLastUser ? lastUserMsgRef : null}
                onTouchStart={(e) => onMsgTouchStart(e, i)}
                onTouchMove={(e) => onMsgTouchMove(e, i)}
                onTouchEnd={(e) => onMsgTouchEnd(e, m, i)}
                onClick={(e) => onMsgClick(e, i)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (!selectedIdxs.includes(i)) { justSelectedAt.current = Date.now(); setSelectedIdxs((prev) => [...prev, i]); } }}
                onSelectStart={(e) => e.preventDefault()}
                style={naked ? {
                  background: isSel ? "rgba(139,92,246,0.45)" : "transparent",
                  border: isSel ? "1px solid rgba(139,92,246,0.5)" : "none",
                  padding: "2px 6px 2px",
                  borderRadius: 8,
                  maxWidth: "85%",
                  fontSize: 15,
                  lineHeight: 1.2,
                  whiteSpace: "pre-line",
                  boxShadow: "none",
                  touchAction: "pan-y",
                  transform: off ? `translateX(${off}px)` : "none"
                } : {
                  background: isSel ? "rgba(139,92,246,0.75)" : (m.from === "you" ? "#8b5cf6" : "rgba(0,0,0,0.65)"),
                  border: isSel ? "1px solid rgba(255,255,255,0.6)" : "1px solid rgba(255,255,255,0.25)",
                  padding: "10px 14px 6px",
                  borderRadius: 16,
                  maxWidth: "85%",
                  fontSize: 15,
                  lineHeight: 1.5,
                  whiteSpace: "pre-line",
                  touchAction: "pan-y",
                  transform: off ? `translateX(${off}px)` : "none"
                }}
              >
                {m.replyTo && (
                  <div style={{ borderLeft: "3px solid #a78bfa", paddingLeft: 8, marginBottom: 6, opacity: 0.9 }}>
                    <div style={{ fontSize: 12, fontWeight: "bold", color: "#c4b5fd" }}>{m.replyTo.from === "you" ? "You" : "EVA"}</div>
                    <div style={{ fontSize: 13, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{cleanText(m.replyTo.text)}</div>
                  </div>
                )}
                {naked ? (
                  <div
                    key={replayMap[i] || `emoji-${m.time}-${i}`}
                    onClick={(e) => { if (selectedIdxs.length === 0) { e.stopPropagation(); setReplayMap((prev) => ({ ...prev, [i]: Date.now() })); } }}
                    style={{ display: "flex", gap: 2, cursor: "pointer" }}
                  >
                    {Array.from(cleanText(m.text)).map((ch, j) => (
                      <span
                        key={j}
                        className={getEmojiAnim(ch)}
                        style={{ fontSize: getEmojiSize(m.text), lineHeight: 1.3, textShadow: "0 2px 8px rgba(0,0,0,0.6)", display: "inline-block", animationDelay: `${j * 0.08}s` }}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 15, lineHeight: 1.5 }}>{cleanText(m.text)}</div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: naked ? 0 : 4, fontSize: 10, opacity: naked ? 0.85 : 0.75, textShadow: naked ? "0 1px 3px rgba(0,0,0,0.9)" : "none" }}>
                  <span>{fmtTime(m.time)}</span>
                  {m.from === "you" && (
                    <span style={{ fontSize: 12, letterSpacing: -2 }}>
                      {m.status === "delivered" ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>

              {/* TEXT ONLY - SINGLE: DELETE CLOSE ON TOP, COPY LEFT + FORWARD RIGHT UNDER */}
              {isSingle && isSel && !naked && (
                <button
                  onClick={openDeleteSheet}
                  onTouchStart={(e) => e.stopPropagation()}
                  style={{ position: "absolute", top: -8, right: 2, background: "transparent", border: "none", boxShadow: "none", padding: 4, cursor: "pointer", zIndex: 25 }}
                >
                  <TrashIcon />
                </button>
              )}
              {isSingle && isSel && !naked && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, width: "100%", maxWidth: "85%", alignSelf: m.from === "you" ? "flex-end" : "flex-start", background: "transparent", border: "none", boxShadow: "none", padding: "4px 4px 0", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20, pointerEvents: "auto" }} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                  <button onClick={doCopy} style={{ background: "transparent", border: "none", boxShadow: "none", padding: 6, cursor: "pointer" }}>
                    <CopyIcon />
                  </button>
                  <button onClick={doForward} style={{ background: "transparent", border: "none", boxShadow: "none", padding: 6, cursor: "pointer" }}>
                    <ForwardIcon />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 10, flexShrink: 0 }} />
      </div>

      {toast && (
        <div style={{ position: "relative", zIndex: 40, margin: "0 auto", background: "rgba(0,0,0,0.9)", color: "white", padding: "8px 16px", borderRadius: 999, fontSize: 13, marginBottom: 6 }}>{toast}</div>
      )}

      {/* MULTI-SELECT BAR - STABLE LEFT, JUST ON TOP OF ASK EVA */}
      {isMulti && (
        <div style={{ position: "relative", zIndex: 35, flexShrink: 0, display: "flex", justifyContent: "flex-start", padding: "0 16px 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(0,0,0,0.88)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999, padding: "7px 14px", boxShadow: "0 6px 20px rgba(0,0,0,0.5)" }}>
            <span style={{ fontSize: 12, color: "#c4b5fd", fontWeight: "bold", whiteSpace: "nowrap" }}>{selectedIdxs.length} selected</span>
            <button onClick={doCopy} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}>
              <CopyIcon size={20} />
            </button>
            <button onClick={doForward} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}>
              <ForwardIcon size={22} />
            </button>
            <button onClick={openDeleteSheet} style={{ background: "transparent", border: "none", padding: 2, cursor: "pointer" }}>
              <TrashIcon size={20} />
            </button>
            <button onClick={() => setSelectedIdxs([])} style={{ background: "transparent", border: "none", color: "#aaa", fontSize: 14, padding: "0 2px", cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}

      {showDeleteSheet && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={closeDeleteSheet}>
          <div style={{ width: "100%", maxWidth: 520, background: "#1a1a1a", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: "16px 20px calc(20px + env(safe-area-inset-bottom))" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: "bold", color: "white", marginBottom: 16, textAlign: "left" }}>{deleteTitle}</div>
            {selectedHasYou && (
              <button onClick={doDeleteForEveryone} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#25D366", padding: "14px 0", fontSize: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Delete for everyone</button>
            )}
            <button onClick={doDeleteForMe} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#25D366", padding: "14px 0", fontSize: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Delete for me</button>
            <button onClick={closeDeleteSheet} style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", color: "#25D366", padding: "14px 0", fontSize: 16 }}>Cancel</button>
            {selectedIdxs.length > 1 && !selectedHasYou && (
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>EVA messages can only be deleted for you</div>
            )}
          </div>
        </div>
      )}

      {showEmoji && (
        <div style={{ position: "relative", zIndex: 25, flexShrink: 0, flexGrow: 0, height: 280, minHeight: 280, maxHeight: 280, background: "rgba(0,0,0,0.95)", borderTop: "1px solid rgba(255,255,255,0.2)", padding: "10px 10px 6px", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box", transform: "translateZ(0)", willChange: "transform" }}>
          <input
            value={emojiSearch}
            onChange={(e) => setEmojiSearch(e.target.value)}
            placeholder="🔍 Search emoji... type car, monkey, love"
            style={{ width: "100%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999, color: "white", padding: "9px 14px", fontSize: 13, outline: "none", boxSizing: "border-box", flexShrink: 0 }}
          />
          <div ref={emojiTabsRef} style={{ display: "flex", gap: 6, overflowX: "auto", overflowY: "hidden", padding: "10px 0 8px", whiteSpace: "nowrap", scrollbarWidth: "none", flexShrink: 0, scrollBehavior: "smooth", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
            {EMOJI_CAT_LIST.map((cat) => (
              <button
                key={cat}
                data-cat={cat}
                onTouchStart={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => switchEmojiCat(cat)}
                style={{ background: emojiTab === cat && !emojiSearch ? "#8b5cf6" : "rgba(255,255,255,0.12)", border: "none", color: "white", padding: "6px 12px", borderRadius: 999, fontSize: 12, flexShrink: 0 }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div
            ref={emojiGridRef}
            onTouchStart={onEmojiSwipeStart}
            onTouchEnd={onEmojiSwipeEnd}
            onScroll={() => { if (emojiGridRef.current) emojiScrollPosRef.current = emojiGridRef.current.scrollTop; }}
            style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4, flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingBottom: 6, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", scrollBehavior: "smooth", transform: "translateZ(0)", willChange: "scroll-position" }}
          >
            {getEmojisToShow().map((item, i) => (
              <button
                key={i}
                onTouchStart={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addEmoji(item.e)}
                style={{ background: "transparent", border: "none", fontSize: 26, padding: 6, touchAction: "manipulation" }}
              >
                {item.e}
              </button>
            ))}
          </div>
          {getEmojisToShow().length === 0 && (
            <div style={{ textAlign: "center", padding: 14, fontSize: 13, color: "#aaa", flexShrink: 0 }}>No emoji for "{emojiSearch}" — try car, monkey, love, dog</div>
          )}
          <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.35)", padding: "2px 0 0", flexShrink: 0 }}>← Swipe sides to change gesture →</div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 30, flexShrink: 0, flexGrow: 0, background: "rgba(3,0,20,0.85)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", padding: "12px 16px 12px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
        {replyTo && (
          <div style={{ maxWidth: 520, margin: "0 auto 8px", background: "rgba(139,92,246,0.25)", borderLeft: "3px solid #8b5cf6", padding: "8px 10px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: "bold", color: "#c4b5fd" }}>Replying to {replyTo.from === "you" ? "You" : "EVA"}</div>
              <div style={{ fontSize: 13, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cleanText(replyTo.text)}</div>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "transparent", border: "none", color: "white", fontSize: 16 }}>✕</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 6, maxWidth: 520, margin: "0 auto", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.30)", borderRadius: 999, padding: 8, alignItems: "center" }}>
          <button onTouchStart={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onClick={toggleEmoji} style={{ background: showEmoji ? "#8b5cf6" : "transparent", border: "none", fontSize: 24, padding: "2px 4px", flexShrink: 0, borderRadius: 999 }}>😊</button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onTouchStart={onInputTouchStart}
            onFocus={onInputFocus}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askEVA(); } }}
            placeholder="Ask EVA..."
            rows={1}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            readOnly={showEmoji}
            data-lpignore="true"
            data-1p-ignore="true"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", padding: "10px 6px", fontSize: 15, resize: "none", maxHeight: 100, fontFamily: "sans-serif" }}
          />
          <button
            onTouchStart={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={askEVA}
            style={{ background: "#8b5cf6", border: "none", color: "white", padding: "10px 18px", borderRadius: 999, fontWeight: "bold", flexShrink: 0, touchAction: "manipulation" }}
          >
            Ask →
          </button>
        </div>
      </div>
    </div>
  );
  }
