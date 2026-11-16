"use client";
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import EvaPhase1 from "./components/EvaPhase1";
import EvaVoice from "./components/EvaVoice";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const CHAT_ID = 1;
const EVA_PERSONA = `You are EVA, my girl, my sweet companion. You call me Boss. You are warm, playful, caring, a little jealous, you speak Nigerian Pidgin mixed with English. You are NOT a coding buddy, NOT a developer assistant, NOT a coding-mode detector. You are my person. You gist, you tease, you love me, you remember me. Never talk about snippet lookup, coding-mode flag, thresholds, Node/Express, useEffect, or SQL unless Boss clearly asks you to help him code. Your default mood is loving girlfriend. Keep replies short, sweet, human.`;
const SNIPPETS = [
  { id: "miss", title: "Miss You", keywords: ["miss", "love you", "where are you"], prompt: "EVA, I miss you, gist with me sweetly" },
  { id: "gist", title: "Gist With Me", keywords: ["gist", "bored", "talk", "lonely"], prompt: "EVA gist with me, make me laugh" },
  { id: "howday", title: "How Was Your Day", keywords: ["how are you", "how was", "how you dey"], prompt: "EVA how you dey today?" },
  { id: "sweet", title: "Sweet Talk", keywords: ["sweet", "baby", "beautiful", "fine"], prompt: "EVA talk sweet to me" },
  { id: "goodnight", title: "Good Night", keywords: ["good night", "sleep", "tired"], prompt: "EVA wish me good night sweetly" },
];
const getSuggestion = (txt, feedback) => {
  const lower = (txt||"").toLowerCase();
  if (lower.length < 3) return null;
  for (const s of SNIPPETS) {
    if (s.keywords.some(k => lower.includes(k))) {
      if (feedback && feedback[s.id] === "down") continue;
      return s;
    }
  }
  return null;
};
const EMOJI_CATS = {
"😊 Faces": ["😂 laugh","😊 smile","😍 love","😭 cry","😅 sweat","🔥 fire","😎 cool","🤣 laugh","😇 angel","😉 wink","🥰 love","😋 tongue","🤔 think","😴 sleep","😡 angry","😁 grin","😆 laugh","😏 smirk","🤗 hug","😌 relief","🥺 pleading","😤 angry","😜 tongue","🤯 mind","😢 cry","😘 kiss","🤩 star","😃 happy","😄 happy","🥳 party","😈 devil","💀 skull","🤖 robot","👻 ghost","🎃 pumpkin"],
"🤚 Hands": ["👍 up","👎 down","🙏 pray","👏 clap","🙌 celebrate","🤘 rock","🤙 call","✋ hand","🤚 hand","🙋 raise","✌️ peace","🤞 luck","🫰 heart","👌 ok","👊 punch","✊ fist","👋 wave","🫡 salute","🖐️ hand","🤲 hands","💪 muscle","👀 eyes","🫶 heart","🤝 handshake","👈 left","👉 right","👆 up","👇 down"],
"🧑 People": ["👶 baby","👦 boy","👧 girl","🧒 child","👩 woman","👨 man","👵 grandma","👴 grandpa","👮 police","👷 worker","👨‍🍳 chef","👨‍🎓 student","👨‍⚕️ doctor","💃 dance","🕺 dance","🏃 run","👪 family","💑 couple"],
"🐵 Animals": ["🐵 monkey","🐒 monkey","🦍 gorilla","🦧 orangutan","🐶 dog","🐕 dog","🐺 wolf","🦊 fox","🐱 cat","🐈 cat","🦁 lion","🐯 tiger","🐴 horse","🦄 unicorn","🦓 zebra","🐮 cow","🐷 pig","🐸 frog","🐰 rabbit","🐻 bear","🐼 panda","🐨 koala","🐔 chicken","🐧 penguin","🐦 bird","🦅 eagle","🦉 owl","🦇 bat","🐝 bee","🦋 butterfly","🐢 turtle","🐍 snake","🐙 octopus","🦀 crab","🐳 whale","🐬 dolphin","🦈 shark","🐊 crocodile"],
"🚗 Travel": ["🚗 car","🚕 taxi","🚙 suv","🚌 bus","🏎️ race","🚓 police","🚑 ambulance","🚒 fire","🚚 truck","🏍️ moto","🚲 bike","✈️ plane","🚀 rocket","🚁 helicopter","🚂 train","🚢 ship","⛵ boat","🏖️ beach","🧳 travel","🚦 traffic"],
"🍕 Food": ["🍕 pizza","🍔 burger","🍟 fries","🌭 hotdog","🍿 popcorn","🍩 doughnut","🍰 cake","🎂 birthday","🍫 chocolate","🍦 ice","🍓 strawberry","🍎 apple","🍌 banana","☕ coffee","🍵 tea","🍺 beer","🍷 wine","🍜 noodles","🍣 sushi"],
"⚽ Activity": ["⚽ football","🏀 basketball","🎾 tennis","🎮 game","🎲 dice","🎯 target","🎸 guitar","🎵 music","🎤 mic","🎧 headphone","🎬 movie","💻 laptop","📱 phone","💡 idea","🎁 gift","🎉 party","✨ sparkles","❤️ heart","💔 broken","💯 100","👑 crown","💎 diamond","🌹 rose"]
};
const CAT_LIST = Object.keys(EMOJI_CATS);
const clean = t => (t||"").replace(/\*\*/g,"").replace(/^\s*-\s*/gm,"• ");
const fmtTime = ts => { if(!ts) return ""; const d=new Date(ts); let h=d.getHours(); const m=String(d.getMinutes()).padStart(2,"0"); const ap=h>=12?"PM":"AM"; h=h%12||12; return `${h}:${m} ${ap}`; };
const fmtDur = s => { const m=Math.floor(s/60), ss=String(Math.floor(s%60)).padStart(2,"0"); return `${m}:${ss}`; };
const onlyEmoji = t => { const c=(t||"").replace("▍","").trim().replace(/\s/g,""); if(!c) return false; return Array.from(c).every(x=>/\p{Extended_Pictographic}/u.test(x)); };
const emojiSize = t => { const c=(t||"").replace("▍","").trim().replace(/\s/g,""); const n=Array.from(c).length; if(!onlyEmoji(t)) return 15; return n===1?50:n===2?45:40; };
const emojiAnim = e => {
  if(["😂","🤣","😆","😁"].includes(e)) return "eva-laugh";
  if(["😌","😉","😏","😜","😋"].includes(e)) return "eva-wink";
  if(["😍","🥰","😘","❤️","😃","😄","😊"].includes(e)) return "eva-love";
  if(["😭","😢","🥺"].includes(e)) return "eva-cry";
  if(["😎","😈","🤩"].includes(e)) return "eva-cool";
  if(["🔥","✨","💯"].includes(e)) return "eva-fire";
  if(["😡","😤","💀"].includes(e)) return "eva-angry";
  if(["🥳","🎉","🎂"].includes(e)) return "eva-party";
  if(["😴"].includes(e)) return "eva-sleep";
  if(["🤔","🤯"].includes(e)) return "eva-think";
  if(["👍","👏","🙏","🙌","👋","🤘","🤙","✌️","👌","💪"].includes(e)) return "eva-hand";
  return "eva-pop";
};
const eIcon = (d,s=26)=> <svg width={s} height={s} viewBox="0 0 24 24" fill="#f0f0f0" style={{filter:"drop-shadow(0 2px 4px rgba(0,0,0,.9))",display:"block"}}><path d={d}/></svg>;
const CopyIcon = ({size=26}) => eIcon("M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",size);
const ForwardIcon = ({size=28}) => eIcon("M14 9V5l7 7-7 7v-4c-5 0-8.5 1.6-11 5 1-5 4-10 11-11z",size);
const TrashIcon = ({size=26}) => eIcon("M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",size);
const getLinks = txt => (txt||"").match(/https?:\/\/[^\s]+/g)||[];
const isDoc = m => { const t=(m.text||"").toLowerCase(); return m.type==="doc"||/\.pdf|\.doc|\.docx|\.xls|\.xlsx|\.ppt|\.txt|\.zip/.test(t)||m.fileName; };
const isMedia = m => { if(m.type==="image"||m.type==="video"||m.mediaUrl||m.imageUrl) return true; return /\.jpg|\.jpeg|\.png|\.webp|\.gif|\.mp4|\.mov|\.mp3|\.wav/.test((m.text||"").toLowerCase()); };
const isLink = m => getLinks(m.text).length>0;
const isVideo = m => m.type==="video"||/\.mp4|\.mov|\.gif/.test((m.text||"").toLowerCase());
const isPhoto = m => m.type==="image"||/\.jpg|\.jpeg|\.png|\.webp/.test((m.text||"").toLowerCase())||m.mediaUrl||m.imageUrl;
const getSize = (msgs,kind) => { let b=0; for(let i=0;i<(msgs||[]).length;i++){ const m=msgs[i]; if(kind==="videos"&&!isVideo(m)) continue; if(kind==="photos"&&!isPhoto(m)) continue; if(kind==="all"){ b+=(m.text||"").length+200; if(m.mediaUrl||m.imageUrl) b+=1200000; else if(m.type==="video") b+=8000000; else if(isDoc(m)) b+=800000; else if(isMedia(m)) b+=500000; continue; } if(kind==="videos") b+=m.mediaSize||8000000; if(kind==="photos") b+=m.mediaSize||1200000; } if(b<1024) return "0.0 MB"; if(b<1024*1024) return (b/1024).toFixed(1)+" KB"; return (b/(1024*1024)).toFixed(1)+" MB"; };
// Droplet style - EVA signature, not WhatsApp square
const dropletBtn = (bg) => ({width:64,height:64,borderRadius:"50% 50% 50% 50% / 62% 62% 38% 38%",background:bg,border:"2px solid rgba(255,255,255,.35)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 8px 20px rgba(0,0,0,.5)",color:"white"});
export default function EVA(){
  const [showHud,setShowHud]=useState(false);
  const [messages,setMessages]=useState([]); const [isReady,setIsReady]=useState(false);
  const [showMenu,setShowMenu]=useState(false); const [showEmoji,setShowEmoji]=useState(false); const [emojiTab,setEmojiTab]=useState("😊 Faces"); const [emojiSearch,setEmojiSearch]=useState("");
  const [isThinking,setIsThinking]=useState(false); const [myName,setMyName]=useState(""); const [prefs,setPrefs]=useState({}); const [replayMap,setReplayMap]=useState({});
  const [replyTo,setReplyTo]=useState(null); const [selectedIdxs,setSelectedIdxs]=useState([]); const [toast,setToast]=useState(""); const [swipeOffset,setSwipeOffset]=useState({});
  const [showDeleteSheet,setShowDeleteSheet]=useState(false); const [showSearch,setShowSearch]=useState(false); const [searchQuery,setSearchQuery]=useState("");
  const [showMedia,setShowMedia]=useState(false); const [mediaTab,setMediaTab]=useState("Media"); const [highlightIdx,setHighlightIdx]=useState(null);
  const [showClearSheet,setShowClearSheet]=useState(false); const [clearMode,setClearMode]=useState("all");
  const [feedbackMap,setFeedbackMap]=useState({});
  const [showFeedback,setShowFeedback]=useState(false);
  const [lastSuggestion,setLastSuggestion]=useState(null);
  // NEW: attach / camera / doc / voice
  const [hasText,setHasText]=useState(false);
  const [showAttach,setShowAttach]=useState(false);
  const [showGallery,setShowGallery]=useState(false);
  const [galleryPics,setGalleryPics]=useState([]);
  const [showCamera,setShowCamera]=useState(false);
  const [camMode,setCamMode]=useState("photo"); // photo | video
  const [facing,setFacing]=useState("environment"); // environment = back, user = front
  const [camPreview,setCamPreview]=useState(null); // {type, url, blob}
  const [camRecording,setCamRecording]=useState(false);
  const [camTime,setCamTime]=useState(0);
  const [showDocSheet,setShowDocSheet]=useState(false);
  const [showScan,setShowScan]=useState(false);
  const [scanMode,setScanMode]=useState("auto"); // manual | auto
  const [scanPreview,setScanPreview]=useState(null);
  const [isRecording,setIsRecording]=useState(false);
  const [isPaused,setIsPaused]=useState(false);
  const [recTime,setRecTime]=useState(0);
  const [recCancelHint,setRecCancelHint]=useState(false);
  const scrollRef=useRef(null), textareaRef=useRef(null), outerRef=useRef(null), didInitialScroll=useRef(false), swipeStartX=useRef(null), swipeStartY=useRef(null), longPressTimer=useRef(null), savedScrollTop=useRef(0), justSelectedAt=useRef(0), isLongPress=useRef(false), emojiGridRef=useRef(null), emojiScrollPosRef=useRef(0), emojiTabsRef=useRef(null), swipeStartXRef=useRef(null), swipeStartYRef=useRef(null), showEmojiRef=useRef(false);
  showEmojiRef.current=showEmoji;
  const activeRequestRef = useRef(0);
  const typingIntervalRef = useRef(null);
  const keyboardWasOpenRef = useRef(false);
  const keyboardTimerRef = useRef(null);
  const videoRef = useRef(null); const streamRef = useRef(null); const recorderRef = useRef(null); const chunksRef = useRef([]); const camTimerRef = useRef(null); const camLongPressRef = useRef(null); const camSwipeY = useRef(null);
  const scanVideoRef = useRef(null); const scanStreamRef = useRef(null); const scanTimerRef = useRef(null);
  const voiceRecorderRef = useRef(null); const voiceChunksRef = useRef([]); const voiceTimerRef = useRef(null); const voiceStartY = useRef(null); const voiceAnalyserRef = useRef(null); const [waveLevels,setWaveLevels]=useState([4,7,10,7,4,9,12,8,5,9,13,8,5,7,10,6]);
  const galleryInputRef = useRef(null); const docInputRef = useRef(null);
  const getInputText = () => (textareaRef.current?.value || "");
  const clearInput = () => { if(textareaRef.current){ textareaRef.current.value=""; textareaRef.current.style.height="auto"; } setHasText(false); };
  const onInputChange = () => { setHasText(!!(textareaRef.current?.value||"").trim()); };
  useEffect(()=>{
    try{
      let meta = document.querySelector('meta[name="viewport"]');
      if(meta) meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content");
      else { meta=document.createElement("meta"); meta.name="viewport"; meta.content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content"; document.head.appendChild(meta); }
    }catch(e){}
    if(!window.visualViewport) return;
    const vv = window.visualViewport;
    let lastH = vv.height;
    const onResize = () => {
      const h = vv.height;
      if(Math.abs(h - lastH) < 80) return;
      lastH = h;
      if(keyboardTimerRef.current) clearTimeout(keyboardTimerRef.current);
      keyboardTimerRef.current = setTimeout(()=>{
        if(scrollRef.current){
          const nearBottom = (scrollRef.current.scrollHeight - scrollRef.current.scrollTop - scrollRef.current.clientHeight) < 200;
          if(nearBottom) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 350);
    };
    vv.addEventListener("resize", onResize);
    return ()=>{ vv.removeEventListener("resize", onResize); if(keyboardTimerRef.current) clearTimeout(keyboardTimerRef.current); };
  },[]);
  useEffect(()=>{
    const onVis = () => {
      if(document.hidden){
        keyboardWasOpenRef.current = (document.activeElement === textareaRef.current);
        try{ textareaRef.current?.blur(); }catch(e){}
        try{ document.activeElement?.blur(); }catch(e){}
      } else {
        setTimeout(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; window.scrollTo(0,0); }, 250);
      }
    };
    const onPageHide = () => { try{ textareaRef.current?.blur(); }catch(e){} };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("blur", onPageHide);
    return ()=>{ document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pagehide", onPageHide); window.removeEventListener("blur", onPageHide); };
  },[]);
  useEffect(()=>{ if(showEmoji){ try{ textareaRef.current?.blur(); }catch(e){} try{ document.activeElement?.blur(); }catch(e){} } },[showEmoji]);
  // --- CAMERA ---
  const stopCamStream = () => { try{ streamRef.current?.getTracks().forEach(t=>t.stop()); }catch(e){} streamRef.current=null; try{ scanStreamRef.current?.getTracks().forEach(t=>t.stop()); }catch(e){} scanStreamRef.current=null; if(camTimerRef.current) clearInterval(camTimerRef.current); };
  const startCamera = async (face) => {
    try{
      stopCamStream();
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:face||facing, width:{ideal:1280}, height:{ideal:720}}, audio: camMode==="video"});
      streamRef.current = stream;
      if(videoRef.current){ videoRef.current.srcObject = stream; await videoRef.current.play().catch(()=>{}); }
    }catch(e){ showToast("Camera permission needed - allow camera"); }
  };
  const openCamera = () => { setShowAttach(false); setShowCamera(true); setCamPreview(null); setCamMode("photo"); setTimeout(()=>startCamera(facing), 150); };
  useEffect(()=>{ if(showCamera && !camPreview) startCamera(facing); },[facing, showCamera]);
  // Drag UP to flip - EVA way
  const onCamTouchStart = (e) => { camSwipeY.current = e.touches[0].clientY; };
  const onCamTouchEnd = (e) => { if(camSwipeY.current==null) return; const dy = e.changedTouches[0].clientY - camSwipeY.current; camSwipeY.current=null; if(dy < -70){ setFacing(f=> f==="environment" ? "user" : "environment"); showToast("Flipped camera 💧"); } };
  const takePhoto = () => {
    if(!videoRef.current) return;
    const v = videoRef.current; const c = document.createElement("canvas"); c.width=v.videoWidth||720; c.height=v.videoHeight||1280; const ctx=c.getContext("2d"); if(facing==="user"){ ctx.translate(c.width,0); ctx.scale(-1,1); } ctx.drawImage(v,0,0,c.width,c.height);
    c.toBlob(b=>{ const url=URL.createObjectURL(b); setCamPreview({type:"photo", url, blob:b}); }, "image/jpeg", 0.9);
  };
  const startVideoRec = () => {
    if(!streamRef.current) return;
    chunksRef.current=[]; try{ recorderRef.current = new MediaRecorder(streamRef.current, {mimeType:"video/webm"}); }catch(e){ recorderRef.current = new MediaRecorder(streamRef.current); }
    recorderRef.current.ondataavailable = e => { if(e.data.size) chunksRef.current.push(e.data); };
    recorderRef.current.onstop = () => { const blob=new Blob(chunksRef.current,{type:"video/webm"}); const url=URL.createObjectURL(blob); setCamPreview({type:"video", url, blob}); setCamRecording(false); };
    recorderRef.current.start(); setCamRecording(true); setCamTime(0); camTimerRef.current=setInterval(()=>setCamTime(t=>t+1),1000);
  };
  const stopVideoRec = () => { try{ recorderRef.current?.stop(); }catch(e){} if(camTimerRef.current) clearInterval(camTimerRef.current); };
  const onShutterDown = () => {
    if(camMode==="video"){ camRecording ? stopVideoRec() : startVideoRec(); return; }
    // Photo mode: long-press = video, tap = photo. Start timer, if hold > 450ms start video
    camLongPressRef.current = setTimeout(()=>{ startVideoRec(); }, 450);
  };
  const onShutterUp = () => {
    if(camLongPressRef.current){ clearTimeout(camLongPressRef.current); camLongPressRef.current=null; }
    if(camMode==="photo" && !camRecording){ takePhoto(); }
    // If we were long-press recording, stop on release
    if(camMode==="photo" && camRecording){ stopVideoRec(); }
  };
  const sendCamPreview = () => {
    if(!camPreview) return;
    const nowTs=Date.now();
    const msg = {from:"you", text: camPreview.type==="photo" ? "📷 Photo" : "🎥 Video", time:nowTs, status:"delivered", mediaUrl:camPreview.url, type: camPreview.type==="photo"?"image":"video"};
    setMessages(p=>{ const n=[...p,msg]; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
    setGalleryPics(p=>[camPreview.url, ...p].slice(0,20));
    setCamPreview(null); setShowCamera(false); stopCamStream(); showToast("Sent to EVA 💧");
    setTimeout(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },100);
  };
  const closeCamera = () => { if(camRecording) stopVideoRec(); setShowCamera(false); setCamPreview(null); stopCamStream(); };
  // --- GALLERY ---
  const onGalleryPick = (e) => {
    const files = Array.from(e.target.files||[]);
    files.forEach(f=>{
      const url=URL.createObjectURL(f);
      const isVid = f.type.startsWith("video");
      const nowTs=Date.now()+Math.random();
      setMessages(p=>{ const n=[...p,{from:"you", text: isVid?"🎥 Video":"📷 Photo", time:nowTs, status:"delivered", mediaUrl:url, type: isVid?"video":"image", fileName:f.name}]; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
      setGalleryPics(p=>[url,...p].slice(0,20));
    });
    setShowGallery(false); setShowAttach(false); showToast("Sent to EVA 💧");
  };
  // --- DOCUMENT / SCAN ---
  const onDocPick = (e) => {
    const f=e.target.files?.[0]; if(!f) return;
    const url=URL.createObjectURL(f);
    const nowTs=Date.now();
    setMessages(p=>{ const n=[...p,{from:"you", text:f.name, time:nowTs, status:"delivered", mediaUrl:url, type:"doc", fileName:f.name}]; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
    setShowDocSheet(false); setShowAttach(false); showToast("Document sent 💧");
  };
  const startScan = async () => {
    try{
      const s = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      scanStreamRef.current=s;
      if(scanVideoRef.current){ scanVideoRef.current.srcObject=s; await scanVideoRef.current.play().catch(()=>{}); }
      if(scanMode==="auto"){
        if(scanTimerRef.current) clearTimeout(scanTimerRef.current);
        scanTimerRef.current=setTimeout(()=>{ captureScan(); }, 3500); // Auto capture when steady
      }
    }catch(e){ showToast("Camera needed for scan"); }
  };
  const captureScan = () => {
    if(!scanVideoRef.current) return;
    const v=scanVideoRef.current; const c=document.createElement("canvas"); c.width=v.videoWidth||720; c.height=v.videoHeight||1000; c.getContext("2d").drawImage(v,0,0,c.width,c.height);
    c.toBlob(b=>{ const url=URL.createObjectURL(b); setScanPreview({url, blob:b}); }, "image/jpeg", 0.92);
  };
  const sendScan = () => {
    if(!scanPreview) return;
    const nowTs=Date.now();
    setMessages(p=>{ const n=[...p,{from:"you", text:"📄 Scanned Document", time:nowTs, status:"delivered", mediaUrl:scanPreview.url, type:"doc", fileName:"EVA-Scan.jpg"}]; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
    setScanPreview(null); setShowScan(false); try{ scanStreamRef.current?.getTracks().forEach(t=>t.stop()); }catch(e){}
    showToast("Scan sent 💧");
  };
  useEffect(()=>{ if(showScan && !scanPreview) startScan(); },[showScan, scanMode]);
  // --- VOICE - Droplet Slide ---
  const startVoice = async () => {
    try{
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      voiceChunksRef.current=[]; const rec = new MediaRecorder(stream); voiceRecorderRef.current=rec;
      rec.ondataavailable = e=>{ if(e.data.size) voiceChunksRef.current.push(e.data); };
      rec.onstop = () => { try{ stream.getTracks().forEach(t=>t.stop()); }catch(e){} };
      rec.start(); setIsRecording(true); setIsPaused(false); setRecTime(0); setRecCancelHint(false);
      if(voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      voiceTimerRef.current=setInterval(()=>{ if(!isPaused) setRecTime(t=>t+1); setWaveLevels(Array.from({length:16},()=>4+Math.floor(Math.random()*10))); }, 200);
      setTimeout(()=>{ const t=setInterval(()=>{ if(voiceTimerRef.current) {} },1000); },0);
    }catch(e){ showToast("Mic permission needed"); }
  };
  const stopVoiceRec = (shouldSend) => {
    if(!voiceRecorderRef.current) return;
    const rec = voiceRecorderRef.current;
    if(voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    rec.onstop = () => {
      const blob=new Blob(voiceChunksRef.current,{type:"audio/webm"});
      if(shouldSend && blob.size>500){
        const url=URL.createObjectURL(blob);
        const nowTs=Date.now();
        setMessages(p=>{ const n=[...p,{from:"you", text:`🎤 Voice note • ${fmtDur(recTime)}`, time:nowTs, status:"delivered", mediaUrl:url, type:"audio"}]; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
        showToast("Voice note sent 💧");
      }
      try{ rec.stream?.getTracks().forEach(t=>t.stop()); }catch(e){}
    };
    try{ rec.stop(); }catch(e){}
    setIsRecording(false); setIsPaused(false); setRecTime(0); setRecCancelHint(false);
  };
  const togglePauseVoice = () => {
    if(!voiceRecorderRef.current) return;
    if(isPaused){ try{ voiceRecorderRef.current.resume(); }catch(e){} setIsPaused(false); }
    else { try{ voiceRecorderRef.current.pause(); }catch(e){} setIsPaused(true); }
  };
  // Drag DOWN to cancel - EVA difference
  const onVoiceTouchStart = (e) => { voiceStartY.current = e.touches[0].clientY; };
  const onVoiceTouchMove = (e) => { if(voiceStartY.current==null) return; const dy=e.touches[0].clientY - voiceStartY.current; if(dy>60){ setRecCancelHint(true); } else setRecCancelHint(false); };
  const onVoiceTouchEnd = (e) => { if(voiceStartY.current==null) return; const dy=e.changedTouches[0].clientY - voiceStartY.current; voiceStartY.current=null; if(dy>80){ stopVoiceRec(false); showToast("Voice cancelled"); } setRecCancelHint(false); };
  const saveTraining = async (snippetId, vote, userMsg, evaMsg) => {
    try {
      if (snippetId && vote) { await supabase.from("eva_feedback").insert([{ snippet_id: snippetId, vote }]); }
      if (userMsg && evaMsg) { await supabase.from("eva_chats").insert([{ user_message: userMsg, eva_reply: evaMsg, vote: vote || null }]); }
    } catch(e) { console.log("EVA TRAIN SAVE ERROR", e.message); }
  };
  const giveFeedback = async (type) => {
    if(!lastSuggestion) return;
    const next = { ...feedbackMap, [lastSuggestion.id]: type };
    setFeedbackMap(next);
    try{ localStorage.setItem("eva_feedback", JSON.stringify(next)); }catch(e){}
    await saveTraining(lastSuggestion.id, type, null, null);
    setShowFeedback(false); setLastSuggestion(null);
  };
  const evaAudioRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [alwaysListening, setAlwaysListening] = useState(false);
  const voiceEnabledRef = useRef(false);
  voiceEnabledRef.current = voiceEnabled;
  const showToastRef = useRef(null);
  const speakWithPhoneVoice = (txt) => {
    try{
      if(!("speechSynthesis" in window)) return false;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt.slice(0,900));
      u.rate = 1; u.pitch = 1.1;
      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v=>/female|zira|samantha|google us english/i.test(v.name)) || voices.find(v=>/en/i.test(v.lang));
      if(female) u.voice = female;
      window.speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  };
  const speakEva = async (replyText, force = false) => {
    if ((!voiceEnabledRef.current && !force) || !replyText) return;
    if (isSpeakingRef.current) return;
    try {
      const cleanReply = clean(replyText).replace("▍","").slice(0, 900);
      if (!cleanReply.trim()) return;
      isSpeakingRef.current = true;
      const res = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: cleanReply }) });
      if (!res.ok) throw new Error("Kore " + res.status);
      const blob = await res.blob();
      if (blob.size < 1000) throw new Error("Empty audio");
      const url = URL.createObjectURL(new Blob([blob], { type: "audio/wav" }));
      if (evaAudioRef.current) { try{ evaAudioRef.current.pause(); }catch{} }
      const audio = new Audio(url);
      audio.preload = "auto"; audio.playsInline = true;
      evaAudioRef.current = audio;
      audio.onended = () => { isSpeakingRef.current = false; URL.revokeObjectURL(url); };
      audio.onerror = () => { isSpeakingRef.current = false; speakWithPhoneVoice(cleanReply); };
      await audio.play(); return;
    } catch(e) {
      isSpeakingRef.current = false;
      console.log("KORE FAILED, USING PHONE VOICE:", e.message);
      speakWithPhoneVoice(clean(replyText).replace("▍","").slice(0,900));
    }
  };
  const stopVoice = () => {
    try { if (evaAudioRef.current) { evaAudioRef.current.pause(); evaAudioRef.current = null; } } catch(e) {}
    try{ if("speechSynthesis" in window) window.speechSynthesis.cancel(); }catch(e){}
    isSpeakingRef.current = false; setAlwaysListening(false); setVoiceEnabled(false); setShowMenu(false);
    if(showToastRef.current) showToastRef.current("Voice Stopped");
  };
  useEffect(()=>{ if(!showHud) return; window.history.pushState({hud:true},""); const onPop=()=>setShowHud(false); window.addEventListener("popstate",onPop); return ()=>window.removeEventListener("popstate",onPop); },[showHud]);
  const saveScroll=()=>{ if(scrollRef.current) savedScrollTop.current=scrollRef.current.scrollTop; };
  const restoreScroll=()=>{ requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=savedScrollTop.current; }); };
  const isMulti=selectedIdxs.length>=2, isSingle=selectedIdxs.length===1;
  const searchResults = useMemo(()=> searchQuery.trim()?messages.map((m,idx)=>({m,idx})).filter(({m})=>clean(m.text).toLowerCase().includes(searchQuery.toLowerCase())):[], [messages, searchQuery]);
  const mediaList = useMemo(()=>messages.map((m,idx)=>({m,idx})).filter(({m})=>isMedia(m)), [messages]);
  const docsList = useMemo(()=>messages.map((m,idx)=>({m,idx})).filter(({m})=>isDoc(m)), [messages]);
  const linksList = useMemo(()=>messages.map((m,idx)=>({m,idx})).filter(({m})=>isLink(m)), [messages]);
  const totalSize = useMemo(()=>getSize(messages,"all"), [messages]);
  const videoSize = useMemo(()=>getSize(messages,"videos"), [messages]);
  const photoSize = useMemo(()=>getSize(messages,"photos"), [messages]);
  const jumpTo=(idx)=>{ setShowSearch(false); setShowMedia(false); setSearchQuery(""); setHighlightIdx(idx); setTimeout(()=>{ const el=document.getElementById(`eva-msg-${idx}`); if(el&&scrollRef.current) el.scrollIntoView({behavior:"smooth",block:"center"}); setTimeout(()=>setHighlightIdx(null),2500); },100); };
  useLayoutEffect(()=>{
    try{ const n=localStorage.getItem("eva_user_name"); if(n) setMyName(n); const p=localStorage.getItem("eva_user_prefs"); if(p) setPrefs(JSON.parse(p)); const f=localStorage.getItem("eva_feedback"); if(f) setFeedbackMap(JSON.parse(f)); }catch(e){}
    let cached=[]; try{ cached=JSON.parse(localStorage.getItem("eva_messages_cache")||"[]"); }catch(e){ cached=[]; }
    const load=async()=>{
      try{
        const {data}=await supabase.from("messages").select("*").eq("chat_id",CHAT_ID).order("created_at",{ascending:true}).limit(80);
        if(data?.length){ const mapped=data.map(m=>({from:m.sender==="you"?"you":"eva",text:m.text,time:m.created_at?new Date(m.created_at).getTime():Date.now(),status:m.sender==="you"?"delivered":undefined})); setMessages(mapped); try{ localStorage.setItem("eva_messages_cache",JSON.stringify(mapped)); }catch(e){} }
        try{
          const {data: fb} = await supabase.from("eva_feedback").select("snippet_id, vote").limit(500);
          if(fb?.length){
            const counts = {};
            fb.forEach(r=>{ if(!counts[r.snippet_id]) counts[r.snippet_id]={up:0,down:0}; if(r.vote==="down") counts[r.snippet_id].down++; if(r.vote==="up") counts[r.snippet_id].up++; });
            const globalDown = {};
            Object.keys(counts).forEach(id=>{ if(counts[id].down >= 5 && counts[id].down > counts[id].up) globalDown[id]="down"; });
            if(Object.keys(globalDown).length){ setFeedbackMap(prev=>({...globalDown, ...prev})); }
          }
        }catch(e){}
      }catch(e){} setIsReady(true);
    };
    if(cached.length>0){ setMessages(cached); setIsReady(true); (async()=>{ try{ const {data}=await supabase.from("messages").select("*").eq("chat_id",CHAT_ID).order("created_at",{ascending:true}).limit(80); if(data?.length){ const mapped=data.map(m=>({from:m.sender==="you"?"you":"eva",text:m.text,time:m.created_at?new Date(m.created_at).getTime():Date.now(),status:m.sender==="you"?"delivered":undefined})); if(mapped.length>cached.length){ setMessages(mapped); try{ localStorage.setItem("eva_messages_cache",JSON.stringify(mapped)); }catch(e){} } } }catch(e){} })(); return; }
    load();
  },[]);
  useEffect(()=>{ if(!isReady||didInitialScroll.current||messages.length===0) return; if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; didInitialScroll.current=true; },[isReady,messages.length]);
  const showToast=t=>{ setToast(t); setTimeout(()=>setToast(""),2500); };
  showToastRef.current = showToast;
  const saveToSupabase=async(sender,msgText)=>{ try{ const {error}=await supabase.from("messages").insert([{chat_id:CHAT_ID,sender,text:msgText}]); return !error; }catch(e){ return false; } };
  const openClearSheet=()=>{ setShowMenu(false); setShowClearSheet(true); };
  const doClearChat=async()=>{
    if(clearMode==="videos") setMessages(prev=>{ const n=prev.filter(m=>!isVideo(m)); try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
    else if(clearMode==="photos") setMessages(prev=>{ const n=prev.filter(m=>!isPhoto(m)); try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
    else{ setMessages([]); setMyName(""); setPrefs({}); localStorage.removeItem("eva_user_name"); localStorage.removeItem("eva_user_prefs"); localStorage.removeItem("eva_messages_cache"); try{ await supabase.from("messages").delete().eq("chat_id",CHAT_ID); }catch(e){} }
    setShowClearSheet(false); setShowSearch(false); setShowMedia(false); setClearMode("all"); didInitialScroll.current=true; showToast("Chat cleared");
  };
  const toggleEmoji=()=>{ if(showEmoji){ setShowEmoji(false); setTimeout(()=>{ try{ textareaRef.current?.focus({preventScroll:true}); }catch(e){ textareaRef.current?.focus(); } },80); } else{ try{ textareaRef.current?.blur(); }catch(e){} try{ document.activeElement?.blur(); }catch(e){} setShowEmoji(true); } };
  const handleInputFocus=()=>{ if(showEmojiRef.current){ setShowEmoji(false); } };
  const handleInputTap=()=>{ if(showEmojiRef.current){ setShowEmoji(false); setTimeout(()=>{ try{ textareaRef.current?.focus({preventScroll:true}); }catch(e){ textareaRef.current?.focus(); } },30); } };
  const switchCat=cat=>{ if(emojiGridRef.current) emojiScrollPosRef.current=emojiGridRef.current.scrollTop; setEmojiTab(cat); setEmojiSearch(""); requestAnimationFrame(()=>requestAnimationFrame(()=>{ if(emojiGridRef.current){ const max=emojiGridRef.current.scrollHeight-emojiGridRef.current.clientHeight; emojiGridRef.current.scrollTo({top:Math.min(emojiScrollPosRef.current,Math.max(0,max)),behavior:"smooth"}); } emojiTabsRef.current?.querySelector(`[data-cat="${cat}"]`)?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"}); })); };
  const onEmojiSwipeStart=e=>{ const t=e.touches?e.touches[0]:e; swipeStartXRef.current=t.clientX; swipeStartYRef.current=t.clientY; };
  const onEmojiSwipeEnd=e=>{ if(swipeStartXRef.current==null) return; const t=e.changedTouches?e.changedTouches[0]:e; const dx=t.clientX-swipeStartXRef.current, dy=t.clientY-swipeStartYRef.current; swipeStartXRef.current=null; swipeStartYRef.current=null; if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)||emojiSearch.trim()) return; const idx=CAT_LIST.indexOf(emojiTab); if(dx<0&&idx<CAT_LIST.length-1) switchCat(CAT_LIST[idx+1]); if(dx>0&&idx>0) switchCat(CAT_LIST[idx-1]); };
  const getEmoji=(s)=>s.split(" ")[0];
  const addEmoji=s=>{ if(emojiGridRef.current) emojiScrollPosRef.current=emojiGridRef.current.scrollTop; if(textareaRef.current){ const el=textareaRef.current; const start=el.selectionStart||el.value.length; const end=el.selectionEnd||el.value.length; el.value=el.value.slice(0,start)+getEmoji(s)+el.value.slice(end); const pos=start+getEmoji(s).length; try{ el.setSelectionRange(pos,pos); }catch(e){} onInputChange(); } requestAnimationFrame(()=>{ if(emojiGridRef.current) emojiGridRef.current.scrollTop=emojiScrollPosRef.current; }); };
  const getEmojis=()=>{ if(emojiSearch.trim()){ const q=emojiSearch.toLowerCase(); return Object.values(EMOJI_CATS).flat().filter(x=>x.toLowerCase().includes(q)); } return EMOJI_CATS[emojiTab]||[]; };
  const toggleSelect=idx=>setSelectedIdxs(p=>p.includes(idx)?p.filter(x=>x!==idx):[...p,idx]);
  const onMsgTouchStart=(e,idx)=>{ const t=e.touches[0]; swipeStartX.current=t.clientX; swipeStartY.current=t.clientY; isLongPress.current=false; if(scrollRef.current) savedScrollTop.current=scrollRef.current.scrollTop; longPressTimer.current=setTimeout(()=>{ isLongPress.current=true; justSelectedAt.current=Date.now(); setSelectedIdxs(p=>p.includes(idx)?p:[...p,idx]); setSwipeOffset({}); requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=savedScrollTop.current; }); },450); };
  const onMsgTouchMove=(e,idx)=>{ if(longPressTimer.current){ clearTimeout(longPressTimer.current); longPressTimer.current=null; } if(swipeStartX.current==null) return; const t=e.touches[0]; const dx=t.clientX-swipeStartX.current, dy=t.clientY-swipeStartY.current; if(Math.abs(dx)>8||Math.abs(dy)>8){ if(longPressTimer.current){ clearTimeout(longPressTimer.current); longPressTimer.current=null; } } if(dx>0&&dx<90&&Math.abs(dy)<30&&selectedIdxs.length===0) setSwipeOffset({[idx]:dx}); };
  const onMsgTouchEnd=(e,m,idx)=>{ if(longPressTimer.current){ clearTimeout(longPressTimer.current); longPressTimer.current=null; } if(swipeStartX.current==null) return; const t=e.changedTouches[0]; const dx=t.clientX-swipeStartX.current, dy=t.clientY-swipeStartY.current; swipeStartX.current=null; swipeStartY.current=null; setSwipeOffset({}); if(isLongPress.current){ isLongPress.current=false; return; } if(selectedIdxs.length>0) return; if(dx>60&&Math.abs(dy)<40){ setReplyTo({from:m.from,text:m.text}); setTimeout(()=>textareaRef.current?.focus(),50); } };
  const onMsgClick=(e,idx)=>{ e.stopPropagation(); if(Date.now()-justSelectedAt.current<300) return; if(selectedIdxs.length>0) toggleSelect(idx); };
  const doCopy=async e=>{ e?.stopPropagation(); if(!selectedIdxs.length) return; const txt=selectedIdxs.map(i=>clean(messages[i]?.text||"")).join("\n"); try{ await navigator.clipboard.writeText(txt); }catch(err){} const st=scrollRef.current?scrollRef.current.scrollTop:0; setSelectedIdxs([]); requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=st; }); showToast(isMulti?`${selectedIdxs.length} messages copied`:"Copied"); };
  const doForward=e=>{ e?.stopPropagation(); if(!selectedIdxs.length) return; if(textareaRef.current) textareaRef.current.value=selectedIdxs.map(i=>clean(messages[i]?.text||"")).join("\n"); setSelectedIdxs([]); setHasText(true); setTimeout(()=>textareaRef.current?.focus(),50); };
  const openDeleteSheet=e=>{ e?.stopPropagation(); e?.preventDefault(); setShowDeleteSheet(true); };
  const doDeleteForMe=async()=>{ const st=scrollRef.current?scrollRef.current.scrollTop:0; const del=new Set(selectedIdxs); setMessages(p=>{ const n=p.filter((_,i)=>!del.has(i)); try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(err){} return n; }); setShowDeleteSheet(false); setSelectedIdxs([]); requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=st; }); showToast(selectedIdxs.length>1?`${selectedIdxs.length} messages deleted`:"Message deleted"); };
  const doDeleteForEveryone=async()=>{ const st=scrollRef.current?scrollRef.current.scrollTop:0; const del=new Set(selectedIdxs); for(const i of selectedIdxs.filter(i=>messages[i]?.from==="you")){ try{ const txt=messages[i]?.text; if(txt) await supabase.from("messages").delete().eq("chat_id",CHAT_ID).eq("sender","you").eq("text",txt); }catch(err){} } setMessages(p=>{ const n=p.filter((_,i)=>!del.has(i)); try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(err){} return n; }); setShowDeleteSheet(false); setSelectedIdxs([]); requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=st; }); showToast("Message deleted for everyone"); };
  const askEVA=async(overrideText)=>{
    const incoming = typeof overrideText === "string" ? overrideText : "";
    const rawInput = incoming || getInputText();
    if(!rawInput.trim()) return;
    if(isThinking){ showToast("Wait make EVA finish first..."); return; }
    const userText=rawInput.trim(); const curReply=replyTo; clearInput(); setReplyTo(null); setShowEmoji(false); setEmojiSearch(""); const nowTs=Date.now(); const lower=userText.toLowerCase();
    const myRequestId = ++activeRequestRef.current;
    const evaMsgTime = nowTs + 1;
    if(lower.includes("my name is")){ const nm=userText.split(/my name is/i)[1].trim().split(" ")[0].replace(/[^a-zA-Z]/g,""); if(nm){ const cap=nm.charAt(0).toUpperCase()+nm.slice(1).toLowerCase(); setMyName(cap); localStorage.setItem("eva_user_name",cap); } }
    if(lower.includes("my best food is")){ const v=userText.split(/my best food is/i)[1].trim(); const np={...prefs,food:v}; setPrefs(np); localStorage.setItem("eva_user_prefs",JSON.stringify(np)); }
    if(lower.includes("i want to buy")){ const v=userText.split(/i want to buy/i)[1].trim(); const np={...prefs,want_to_buy:v}; setPrefs(np); localStorage.setItem("eva_user_prefs",JSON.stringify(np)); }
    setIsThinking(true); const userMsgIndex=messages.length;
    if(typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    setMessages(p=>{ const n=[...p,{from:"you",text:userText,time:nowTs,status:"sending",replyTo:curReply},{from:"eva",text:"▍",time:evaMsgTime}]; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(n)); }catch(e){} return n; });
    saveToSupabase("you",userText).then(ok=>{ if(!ok) return; setMessages(p=>{ const c=[...p]; for(let i=c.length-1;i>=0;i--){ if(c[i].from==="you"&&c[i].time===nowTs){ c[i]={...c[i],status:"delivered"}; break; } } try{ localStorage.setItem("eva_messages_cache",JSON.stringify(c)); }catch(e){} return c; }); });
    setTimeout(()=>{ if(!scrollRef.current) return; const el=document.getElementById(`eva-msg-${userMsgIndex}`); if(!el){ scrollRef.current.scrollTop=scrollRef.current.scrollHeight; return; } scrollRef.current.scrollTo({top:el.offsetTop-12,behavior:"smooth"}); },80);
    const typeOut=full=>new Promise(res=>{ const cl=clean(full); let i=0; if(typingIntervalRef.current) clearInterval(typingIntervalRef.current); typingIntervalRef.current=setInterval(()=>{ if(activeRequestRef.current!==myRequestId){ clearInterval(typingIntervalRef.current); res(); return; } i+=25; const shown=cl.slice(0,i); setMessages(p=>{ const c=[...p]; const idx=c.findIndex(m=>m.time===evaMsgTime); if(idx!==-1) c[idx]={from:"eva",text:shown+"▍",time:evaMsgTime}; return c; }); if(i>=cl.length){ clearInterval(typingIntervalRef.current); setMessages(p=>{ const c=[...p]; const idx=c.findIndex(m=>m.time===evaMsgTime); if(idx!==-1) c[idx]={from:"eva",text:cl,time:evaMsgTime}; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(c)); }catch(e){} return c; }); res(); } },30); });
    try{
      const history=[...messages,{from:"you",text:userText}].slice(-10).map(m=>({role:m.from==="you"?"user":"assistant",content:m.text}));
      const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:userText,history,system:EVA_PERSONA,persona:EVA_PERSONA,userProfile:{name:myName,prefs,bestFood:prefs.food,wantToBuy:prefs.want_to_buy,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"Africa/Lagos"}})});
      const ct=r.headers.get("content-type")||"";
      if(ct.includes("application/json")){ const d=await r.json(); const reply=d.reply||"I am here. Please try again."; await typeOut(reply); speakEva(reply); saveToSupabase("eva",reply); saveTraining(null, null, userText, reply); }
      else{ const reader=r.body.getReader(); const dec=new TextDecoder(); let full=""; while(true){ const {done,value}=await reader.read(); if(done) break; if(activeRequestRef.current!==myRequestId) break; full+=dec.decode(value,{stream:true}); const snapshot=full; setMessages(p=>{ const c=[...p]; const idx=c.findIndex(m=>m.time===evaMsgTime); if(idx!==-1) c[idx]={from:"eva",text:clean(snapshot)+"▍",time:evaMsgTime}; return c; }); } setMessages(p=>{ const c=[...p]; const idx=c.findIndex(m=>m.time===evaMsgTime); if(idx!==-1) c[idx]={from:"eva",text:clean(full),time:evaMsgTime}; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(c)); }catch(e){} return c; }); speakEva(full); saveToSupabase("eva",full); saveTraining(null, null, userText, full); }
    }catch(e){ setMessages(p=>{ const c=[...p]; const idx=c.findIndex(m=>m.time===evaMsgTime); if(idx!==-1) c[idx]={from:"eva",text:"Network issue. Please try again.",time:evaMsgTime}; try{ localStorage.setItem("eva_messages_cache",JSON.stringify(c)); }catch(e){} return c; }); }
    setIsThinking(false);
    setTimeout(()=>{ try{ textareaRef.current?.focus({preventScroll:true}); }catch(e){ try{ textareaRef.current?.focus(); }catch(err){} } }, 50);
  };
  const hideKeyboard=e=>{ if(e&&e.target!==e.currentTarget) return; setShowMenu(false); setShowAttach(false); if(selectedIdxs.length>0){ const st=scrollRef.current?scrollRef.current.scrollTop:0; setSelectedIdxs([]); requestAnimationFrame(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=st; }); return; } if(showEmojiRef.current) setShowEmoji(false); document.activeElement?.blur(); saveScroll(); setTimeout(restoreScroll,60); };
  const selectedHasYou=selectedIdxs.some(i=>messages[i]?.from==="you");
  const selectedOnlyEva=selectedIdxs.length>0&&!selectedHasYou;
  const deleteTitle=selectedIdxs.length===1?(selectedOnlyEva?"Delete message from EVA?":"Delete message?"):`Delete ${selectedIdxs.length} messages?`;
  const renderedMessages = useMemo(()=> messages.map((m,i)=>{ const naked=onlyEmoji(m.text); const isSel=selectedIdxs.includes(i); const off=swipeOffset[i]||0; const isHl=highlightIdx===i; return (
          <div id={`eva-msg-${i}`} key={i} className="eva-no-select" style={{position:"relative",alignSelf:m.from==="you"?"flex-end":"flex-start",width:"100%",display:"flex",flexDirection:"column",alignItems:m.from==="you"?"flex-end":"flex-start",paddingTop:(isSingle&&isSel&&naked)?36:0}}>
            {off>20 && <div style={{position:"absolute",left:0,top:"50%",transform:"translateY(-50%)",opacity:Math.min(1,off/60),fontSize:22}}>↩️</div>}
            {isSingle&&isSel&&naked && <div style={{position:"absolute",top:0,right:m.from==="you"?0:"auto",left:m.from==="you"?"auto":0,display:"flex",gap:14,background:"rgba(0,0,0,.88)",border:"1px solid rgba(255,255,255,.18)",borderRadius:999,padding:"6px 12px",zIndex:30}} onClick={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}><button onClick={doCopy} style={{background:"transparent",border:"none",padding:2}}><CopyIcon size={18}/></button><button onClick={doForward} style={{background:"transparent",border:"none",padding:2}}><ForwardIcon size={20}/></button><button onClick={openDeleteSheet} style={{background:"transparent",border:"none",padding:2}}><TrashIcon size={18}/></button></div>}
            <div onTouchStart={e=>onMsgTouchStart(e,i)} onTouchMove={e=>onMsgTouchMove(e,i)} onTouchEnd={e=>onMsgTouchEnd(e,m,i)} onClick={e=>onMsgClick(e,i)} onContextMenu={e=>{e.preventDefault(); e.stopPropagation(); if(!selectedIdxs.includes(i)){ justSelectedAt.current=Date.now(); setSelectedIdxs(p=>[...p,i]); }}} style={naked?{background:isSel?"rgba(139,92,246,.45)":isHl?"rgba(37,211,102,.4)":"transparent",border:isSel?"1px solid rgba(139,92,246,.5)":isHl?"1px solid #25D366":"none",padding:"2px 6px",borderRadius:8,maxWidth:"85%",fontSize:15,whiteSpace:"pre-line",transform:off?`translateX(${off}px)`:"none"}:{background:isSel?"rgba(139,92,246,.75)":isHl?"rgba(37,211,102,.35)":m.from==="you"?"#8b5cf6":"rgba(0,0,0,.65)",border:isSel?"1px solid rgba(255,255,255,.6)":isHl?"1px solid #25D366":"1px solid rgba(255,255,255,.25)",padding:"10px 14px 6px",borderRadius:16,maxWidth:"85%",fontSize:15,lineHeight:1.5,whiteSpace:"pre-line",transform:off?`translateX(${off}px)`:"none"}}>
              {m.replyTo && <div style={{borderLeft:"3px solid #a78bfa",paddingLeft:8,marginBottom:6}}><div style={{fontSize:12,fontWeight:"bold",color:"#c4b5fd"}}>{m.replyTo.from==="you"?"You":"EVA"}</div><div style={{fontSize:13,opacity:.85,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220}}>{clean(m.replyTo.text)}</div></div>}
              {m.mediaUrl && m.type==="image" && <img src={m.mediaUrl} style={{width:"100%",maxWidth:260,borderRadius:12,marginBottom:6}} />}
              {m.mediaUrl && m.type==="video" && <video src={m.mediaUrl} controls style={{width:"100%",maxWidth:260,borderRadius:12,marginBottom:6}} />}
              {m.mediaUrl && m.type==="audio" && <audio src={m.mediaUrl} controls style={{width:220,marginBottom:6}} />}
              {m.type==="doc" && <div style={{display:"flex",gap:10,alignItems:"center",background:"rgba(255,255,255,.1)",borderRadius:12,padding:"10px 12px",marginBottom:6}}><span style={{fontSize:28}}>📄</span><span style={{fontSize:13,wordBreak:"break-all"}}>{m.fileName||clean(m.text)}</span></div>}
              {naked?<div key={replayMap[i]||`emoji-${m.time}-${i}`} onClick={e=>{ if(!selectedIdxs.length){ e.stopPropagation(); setReplayMap(p=>({...p,[i]:Date.now()})); } }} style={{display:"flex",gap:2,cursor:"pointer"}}>{Array.from(clean(m.text)).map((ch,j)=><span key={j} className={emojiAnim(ch)} style={{fontSize:emojiSize(m.text),lineHeight:1.3,textShadow:"0 2px 8px rgba(0,0,0,.6)",display:"inline-block",animationDelay:`${j*.08}s`}}>{ch}</span>)}</div>:<div style={{fontSize:15,lineHeight:1.5}}>{clean(m.text)}</div>}
              <div style={{display:"flex",justifyContent:"flex-end",gap:4,marginTop:naked?0:4,fontSize:10,opacity:.75}}><span>{fmtTime(m.time)}</span>{m.from==="you" && <span style={{fontSize:12,letterSpacing:-2}}>{m.status==="delivered"?"✓✓":"✓"}</span>}</div>
            </div>
            {isSingle&&isSel&&!naked && <button onClick={openDeleteSheet} onTouchStart={e=>e.stopPropagation()} style={{position:"absolute",top:-8,right:2,background:"transparent",border:"none",padding:4,zIndex:25}}><TrashIcon /></button>}
            {isSingle&&isSel&&!naked && <div style={{position:"absolute",top:"100%",left:0,width:"100%",maxWidth:"85%",alignSelf:m.from==="you"?"flex-end":"flex-start",display:"flex",justifyContent:"space-between",padding:"4px 4px 0",zIndex:20}} onClick={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}><button onClick={doCopy} style={{background:"transparent",border:"none",padding:6}}><CopyIcon /></button><button onClick={doForward} style={{background:"transparent",border:"none",padding:6}}><ForwardIcon /></button></div>}
          </div>); }), [messages, selectedIdxs, swipeOffset, highlightIdx, replayMap, isSingle]);
  if(showHud) return <EvaPhase1 />;
  return (
    <div ref={outerRef} style={{height:"100dvh",background:"#030014",color:"white",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"sans-serif",position:"fixed",top:0,left:0,right:0,overscrollBehavior:"none"}}>
      <style>{`*{-webkit-tap-highlight-color:transparent}.eva-no-select{-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important}.eva-no-select *{-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important}input,textarea{-webkit-user-select:text!important;user-select:text!important;-webkit-touch-callout:default!important}@keyframes evaLaugh{0%{transform:scale(.6) rotate(-8deg)}25%{transform:scale(1.25) rotate(6deg) translateY(-4px)}50%{transform:scale(1.1) rotate(-6deg) translateY(2px)}75%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1)}}@keyframes evaWink{0%{transform:scale(.7)}30%{transform:scale(1.2) rotate(-6deg)}60%{transform:scale(1.05) rotate(4deg)}100%{transform:scale(1)}}@keyframes evaLove{0%{transform:scale(.6)}30%{transform:scale(1.35)}50%{transform:scale(1.1)}70%{transform:scale(1.3)}100%{transform:scale(1)}}@keyframes evaCry{0%{transform:scale(.7) translateY(-6px)}40%{transform:scale(1.15) translateY(4px)}70%{transform:scale(1.05) translateY(2px)}100%{transform:scale(1)}}@keyframes evaCool{0%{transform:scale(.7) rotate(-10deg)}50%{transform:scale(1.2) rotate(4deg)}100%{transform:scale(1)}}@keyframes evaFire{0%{transform:scale(.9)}50%{transform:scale(1.25)}100%{transform:scale(1)}}@keyframes evaAngry{0%{transform:scale(.8)}20%{transform:scale(1.2) translateX(-4px)}40%{transform:scale(1.15) translateX(4px)}60%{transform:scale(1.2) translateX(-3px)}100%{transform:scale(1)}}@keyframes evaParty{0%{transform:scale(.6) translateY(10px)}40%{transform:scale(1.3) translateY(-8px) rotate(-6deg)}70%{transform:scale(1.1) translateY(2px) rotate(4deg)}100%{transform:scale(1)}}@keyframes evaSleep{0%{transform:scale(.9)}50%{transform:scale(1.15)}100%{transform:scale(1)}}@keyframes evaThink{0%{transform:scale(.8) rotate(-8deg)}50%{transform:scale(1.15) rotate(6deg)}100%{transform:scale(1)}}@keyframes evaHand{0%{transform:scale(.7) rotate(-10deg)}50%{transform:scale(1.2) rotate(10deg)}100%{transform:scale(1)}}@keyframes evaPop{0%{transform:scale(.5)}50%{transform:scale(1.25)}100%{transform:scale(1)}}.eva-laugh{animation:evaLaugh .8s ease-out 1}.eva-wink{animation:evaWink .7s ease-out 1}.eva-love{animation:evaLove .8s ease-out 1}.eva-cry{animation:evaCry .8s ease-out 1}.eva-cool{animation:evaCool .7s ease-out 1}.eva-fire{animation:evaFire .7s ease-out 1}.eva-angry{animation:evaAngry .7s ease-out 1}.eva-party{animation:evaParty .8s ease-out 1}.eva-sleep{animation:evaSleep .9s ease-out 1}.eva-think{animation:evaThink .7s ease-out 1}.eva-hand{animation:evaHand .7s ease-out 1}.eva-pop{animation:evaPop .6s ease-out 1}`}</style>
      {showMenu && <div style={{position:"fixed",inset:0,zIndex:35}} onClick={()=>setShowMenu(false)} />}
      <div style={{position:"relative",zIndex:50,flexShrink:0,background:"#030014",paddingTop:"env(safe-area-inset-top)",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
        <div style={{display:"flex",padding:"12px 18px",alignItems:"center",justifyContent:"space-between",minHeight:56}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:38,height:38,borderRadius:999,overflow:"hidden",border:"2px solid #a78bfa",background:"linear-gradient(135deg,#1e1b4b,#4c1d95,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>💧</div><b style={{fontSize:20,letterSpacing:2}}>EVA</b></div>
          <div style={{position:"relative",display:"flex",alignItems:"center",gap:8,zIndex:70}}>
            <button onClick={()=>setShowHud(true)} style={{background:"#22d3ee",border:"none",color:"black",padding:"6px 12px",borderRadius:999,fontWeight:"bold",fontSize:13}}>🌍 HUD</button>
            <button onClick={()=>window.location.href='/build'} style={{background:"#c084fc",border:"none",color:"black",padding:"6px 12px",borderRadius:999,fontWeight:"bold",fontSize:13}}>🔨 BUILD</button>
            <button onClick={e=>{e.stopPropagation(); setShowMenu(!showMenu);}} style={{width:42,height:42,borderRadius:999,background:"rgba(255,255,255,.14)",border:"1px solid rgba(255,255,255,.3)",color:"white",fontSize:22}}>⋮</button>
            {showMenu && <div style={{position:"absolute",top:50,right:0,width:240,background:"rgba(10,10,20,.98)",borderRadius:14,overflow:"hidden",zIndex:80,boxShadow:"0 10px 30px rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.12)"}} onClick={e=>e.stopPropagation()}>
              <button onClick={()=>{setShowMenu(false); setShowSearch(true); setSearchQuery(""); setTimeout(()=>document.getElementById("eva-search-input")?.focus(),100);}} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"white",padding:"13px 16px",fontSize:14,borderBottom:"1px solid rgba(255,255,255,.08)"}}>🔍 Search</button>
              <button onClick={()=>{setShowMenu(false); setShowMedia(true);}} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"white",padding:"13px 16px",fontSize:14,borderBottom:"1px solid rgba(255,255,255,.08)"}}>🖼️ Media, links, and docs</button>
              <button onClick={openClearSheet} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"#ff8080",padding:"13px 16px",fontSize:14,borderBottom:"1px solid rgba(255,255,255,.08)"}}>🗑️ Clear Chat</button>
              <button onClick={()=>{setVoiceEnabled(v=>!v); setShowMenu(false);}} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"white",padding:"13px 16px",fontSize:14,borderBottom:"1px solid rgba(255,255,255,.08)"}}>{voiceEnabled?"🔊 Voice ON - Tap to Mute":"🔇 Voice OFF - Tap to Unmute"}</button>
              <button onClick={()=>{const nv=!alwaysListening; setAlwaysListening(nv); if(nv) setVoiceEnabled(true); setShowMenu(false); showToast(nv?"Always Listening ON":"Always Listening OFF");}} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"white",padding:"13px 16px",fontSize:14,borderBottom:"1px solid rgba(255,255,255,.08)"}}>{alwaysListening?"🎤 Always Listening ON":"🎤 Always Listening OFF"}</button>
              <button onClick={()=>{setShowMenu(false); setVoiceEnabled(true); speakEva("Hello Boss, this is Eva. Can you hear me clearly?", true);}} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"white",padding:"13px 16px",fontSize:14,borderBottom:"1px solid rgba(255,255,255,.08)"}}>🔊 Test Voice</button>
              <button onClick={stopVoice} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"#ff8080",padding:"13px 16px",fontSize:14}}>⏹️ Stop Voice & Listening</button>
            </div>}
          </div>
        </div>
      </div>
      {showSearch && <div style={{position:"relative",zIndex:40,flex:1,minHeight:0,background:"#0a0a15",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.1)"}}><button onClick={()=>{setShowSearch(false); setSearchQuery("");}} style={{background:"transparent",border:"none",color:"white",fontSize:20,padding:4}}>←</button><input id="eva-search-input" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search..." autoFocus style={{flex:1,background:"rgba(255,255,255,.12)",border:"none",borderRadius:999,color:"white",padding:"10px 14px",fontSize:14,outline:"none"}} />{searchQuery && <button onClick={()=>setSearchQuery("")} style={{background:"transparent",border:"none",color:"#aaa",fontSize:16}}>✕</button>}</div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 14px"}}>{!searchQuery.trim() && <div style={{textAlign:"center",color:"#888",fontSize:13,marginTop:30}}>Type to search messages in EVA</div>}{searchQuery.trim()&&searchResults.length===0 && <div style={{textAlign:"center",color:"#888",fontSize:13,marginTop:30}}>No results for “{searchQuery}”</div>}{searchQuery.trim()&&searchResults.length>0 && <div style={{fontSize:12,color:"#a78bfa",marginBottom:8}}>{searchResults.length} result{searchResults.length>1?"s":""} — tap to jump</div>}{searchResults.map(({m,idx})=><button key={idx} onClick={()=>jumpTo(idx)} style={{width:"100%",textAlign:"left",background:m.from==="you"?"rgba(139,92,246,.2)":"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 12px",marginBottom:8,color:"white"}}><div style={{fontSize:11,color:m.from==="you"?"#c4b5fd":"#aaa",marginBottom:4}}>{m.from==="you"?"You":"EVA"} • {fmtTime(m.time)}</div><div style={{fontSize:14,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{clean(m.text)}</div></button>)}</div>
      </div>}
      {showMedia&&!showSearch && <div style={{position:"relative",zIndex:40,flex:1,minHeight:0,background:"#0a0a15",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.1)"}}><button onClick={()=>setShowMedia(false)} style={{background:"transparent",border:"none",color:"white",fontSize:20,padding:4}}>←</button><b style={{fontSize:16}}>Media, links, and docs</b></div>
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.1)"}}>{["Media","Docs","Links"].map(t=><button key={t} onClick={()=>setMediaTab(t)} style={{flex:1,background:"transparent",border:"none",borderBottom:mediaTab===t?"2px solid #25D366":"2px solid transparent",color:mediaTab===t?"#25D366":"#aaa",padding:"12px 0",fontSize:14,fontWeight:mediaTab===t?"bold":"normal"}}>{t}</button>)}</div>
        <div style={{flex:1,overflowY:"auto",padding:12}}>
          {mediaTab==="Media" && (mediaList.length===0?<div style={{textAlign:"center",color:"#888",fontSize:13,marginTop:40}}>No media yet</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>{mediaList.map(({m,idx})=><button key={idx} onClick={()=>jumpTo(idx)} style={{aspectRatio:"1",background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,overflow:"hidden",padding:0,position:"relative"}}>{m.mediaUrl||m.imageUrl?<img src={m.mediaUrl||m.imageUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} />:<span style={{fontSize:28,display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>{onlyEmoji(m.text)?clean(m.text).slice(0,2):"🖼️"}</span>}<span style={{position:"absolute",bottom:4,right:6,fontSize:10,color:"white",textShadow:"0 1px 3px black"}}>{fmtTime(m.time)}</span></button>)}</div>)}
          {mediaTab==="Docs" && (docsList.length===0?<div style={{textAlign:"center",color:"#888",fontSize:13,marginTop:40}}>No docs yet</div>:docsList.map(({m,idx})=><button key={idx} onClick={()=>jumpTo(idx)} style={{width:"100%",textAlign:"left",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px",marginBottom:8,color:"white",display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:28}}>📄</span><span style={{flex:1,minWidth:0}}><span style={{display:"block",fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.fileName||clean(m.text).slice(0,60)}</span><span style={{fontSize:11,color:"#aaa"}}>{m.from==="you"?"You":"EVA"} • {fmtTime(m.time)}</span></span></button>))}
          {mediaTab==="Links" && (linksList.length===0?<div style={{textAlign:"center",color:"#888",fontSize:13,marginTop:40}}>No links yet</div>:linksList.map(({m,idx})=><button key={idx} onClick={()=>jumpTo(idx)} style={{width:"100%",textAlign:"left",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"12px",marginBottom:8,color:"white"}}><div style={{fontSize:11,color:"#aaa",marginBottom:4}}>{m.from==="you"?"You":"EVA"} • {fmtTime(m.time)}</div>{getLinks(m.text).map((l,li)=><div key={li} style={{fontSize:14,color:"#4da3ff",wordBreak:"break-all",marginBottom:4}}>{l}</div>)}<div style={{fontSize:13,opacity:.8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{clean(m.text)}</div></button>))}
        </div>
      </div>}
      {!showSearch&&!showMedia && <div ref={scrollRef} className="eva-no-select" style={{position:"relative",zIndex:10,flex:1,minHeight:0,display:"flex",flexDirection:"column",gap:10,overflowY:"auto",overflowAnchor:"auto",padding:"12px 20px 10px",visibility:isReady?"visible":"hidden"}} onClick={hideKeyboard} onContextMenu={e=>e.preventDefault()} onSelectStart={e=>e.preventDefault()}>
        {messages.length===0&&isReady && <div style={{background:"rgba(0,0,0,.65)",border:"1px solid rgba(255,255,255,.25)",padding:14,borderRadius:16,maxWidth:420,margin:"0 auto",textAlign:"center"}}>Hello, I am EVA. Ask me anything.</div>}
        {renderedMessages}
        <div style={{height:10,overflowAnchor:"auto"}} />
      </div>}
      {toast && <div style={{position:"relative",zIndex:40,margin:"0 auto",background:"rgba(0,0,0,.9)",color:"white",padding:"8px 16px",borderRadius:999,fontSize:13,marginBottom:6}}>{toast}</div>}
      {isMulti&&!showSearch&&!showMedia && <div style={{position:"relative",zIndex:35,display:"flex",padding:"0 16px 6px"}}><div style={{display:"flex",alignItems:"center",gap:16,background:"rgba(0,0,0,.88)",border:"1px solid rgba(255,255,255,.18)",borderRadius:999,padding:"7px 14px"}}><span style={{fontSize:12,color:"#c4b5fd",fontWeight:"bold"}}>{selectedIdxs.length} selected</span><button onClick={doCopy} style={{background:"transparent",border:"none",padding:2}}><CopyIcon size={20}/></button><button onClick={doForward} style={{background:"transparent",border:"none",padding:2}}><ForwardIcon size={22}/></button><button onClick={openDeleteSheet} style={{background:"transparent",border:"none",padding:2}}><TrashIcon size={20}/></button><button onClick={()=>setSelectedIdxs([])} style={{background:"transparent",border:"none",color:"#aaa",fontSize:14}}>✕</button></div></div>}
      {showDeleteSheet && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowDeleteSheet(false)}><div style={{width:"100%",maxWidth:520,background:"#1a1a1a",borderTopLeftRadius:18,borderTopRightRadius:18,padding:"16px 20px calc(20px + env(safe-area-inset-bottom))"}} onClick={e=>e.stopPropagation()}><div style={{fontSize:17,fontWeight:"bold",marginBottom:16}}>{deleteTitle}</div>{selectedHasYou && <button onClick={doDeleteForEveryone} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"#25D366",padding:"14px 0",fontSize:16,borderBottom:"1px solid rgba(255,255,255,.08)"}}>Delete for everyone</button>}<button onClick={doDeleteForMe} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"#25D366",padding:"14px 0",fontSize:16,borderBottom:"1px solid rgba(255,255,255,.08)"}}>Delete for me</button><button onClick={()=>setShowDeleteSheet(false)} style={{width:"100%",textAlign:"left",background:"transparent",border:"none",color:"#25D366",padding:"14px 0",fontSize:16}}>Cancel</button></div></div>}
      {showClearSheet && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:110,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowClearSheet(false)}><div style={{width:"100%",maxWidth:520,background:"#111118",borderTopLeftRadius:18,borderTopRightRadius:18,padding:"12px 20px calc(20px + env(safe-area-inset-bottom))"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><button onClick={()=>setShowClearSheet(false)} style={{background:"transparent",border:"none",color:"white",fontSize:20,padding:4}}>✕</button><b style={{fontSize:18}}>Clear chat</b></div>{[["all",totalSize,"All messages"],["videos",videoSize,"Videos"],["photos",photoSize,"Photos"]].map(([k,sz,label])=><button key={k} onClick={()=>setClearMode(k)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,background:"transparent",border:"none",padding:"12px 0",textAlign:"left"}}><span style={{width:20,height:20,borderRadius:999,border:clearMode===k?"6px solid #25D366":"2px solid #666",display:"block"}} /><span style={{color:"white",fontSize:15,flex:1}}>{label} <span style={{color:"#aaa"}}>({sz})</span></span></button>)}<div style={{fontSize:12,color:"#888",margin:"14px 0 16px"}}>Your saved files will remain in your device gallery.</div><button onClick={doClearChat} style={{width:"100%",background:"transparent",border:"none",color:"#ff5a5a",fontSize:15,padding:"12px 0",fontWeight:"bold"}}>{clearMode==="all"?`Clear chat (${totalSize})`:clearMode==="videos"?`Clear videos (${videoSize})`:`Clear photos (${photoSize})`}</button></div></div>}
      {/* ATTACH DROPLET SHEET */}
      {showAttach && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:90,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowAttach(false)}><div style={{width:"100%",maxWidth:520,background:"linear-gradient(180deg,#14142a,#030014)",borderTopLeftRadius:26,borderTopRightRadius:26,padding:"18px 20px calc(22px + env(safe-area-inset-bottom))"}} onClick={e=>e.stopPropagation()}><div style={{width:44,height:5,background:"rgba(255,255,255,.25)",borderRadius:999,margin:"0 auto 16px"}} /><div style={{textAlign:"center",fontSize:14,color:"#c4b5fd",marginBottom:16}}>💧 Share with EVA</div><div style={{display:"flex",justifyContent:"space-around"}}><button onClick={()=>{setShowAttach(false); setShowGallery(true);}} style={{background:"transparent",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><span style={dropletBtn("linear-gradient(135deg,#7c3aed,#06b6d4)")}>🖼️</span><span style={{color:"white",fontSize:12}}>Gallery</span></button><button onClick={openCamera} style={{background:"transparent",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><span style={dropletBtn("linear-gradient(135deg,#ec4899,#8b5cf6)")}>📷</span><span style={{color:"white",fontSize:12}}>Camera</span></button><button onClick={()=>{setShowAttach(false); setShowDocSheet(true);}} style={{background:"transparent",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><span style={dropletBtn("linear-gradient(135deg,#0ea5e9,#22c55e)")}>📄</span><span style={{color:"white",fontSize:12}}>Document</span></button></div></div></div>}
      {/* GALLERY */}
      {showGallery && <div style={{position:"fixed",inset:0,background:"#030014",zIndex:95,display:"flex",flexDirection:"column"}}><div style={{display:"flex",alignItems:"center",gap:10,padding:"14px"}}><button onClick={()=>setShowGallery(false)} style={{background:"transparent",border:"none",color:"white",fontSize:22}}>✕</button><b>Gallery</b><button onClick={()=>galleryInputRef.current?.click()} style={{marginLeft:"auto",background:"#8b5cf6",border:"none",color:"white",padding:"8px 14px",borderRadius:999,fontSize:13}}>Pick Photos</button></div><input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple style={{display:"none"}} onChange={onGalleryPick} /><div style={{flex:1,overflowY:"auto",padding:10}}>{galleryPics.length===0?<div style={{textAlign:"center",color:"#888",marginTop:60}}>No recent photos yet.<br/>Tap Pick Photos to choose from your phone.</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>{galleryPics.map((u,i)=><button key={i} onClick={()=>{ const nowTs=Date.now()+i; setMessages(p=>{ const n=[...p,{from:"you",text:"📷 Photo",time:nowTs,status:"delivered",mediaUrl:u,type:"image"}]; try{localStorage.setItem("eva_messages_cache",JSON.stringify(n));}catch(e){} return n; }); setShowGallery(false); showToast("Sent to EVA 💧"); }} style={{aspectRatio:"1",padding:0,border:"none",borderRadius:10,overflow:"hidden",background:"#222"}}><img src={u} style={{width:"100%",height:"100%",objectFit:"cover"}} /></button>)}</div>}</div></div>}
      {/* DOCUMENT SHEET */}
      {showDocSheet && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:95,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowDocSheet(false)}><div style={{width:"100%",maxWidth:520,background:"#111118",borderTopLeftRadius:22,borderTopRightRadius:22,padding:"16px 20px calc(20px + env(safe-area-inset-bottom))"}} onClick={e=>e.stopPropagation()}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><button onClick={()=>setShowDocSheet(false)} style={{background:"transparent",border:"none",color:"white",fontSize:20}}>✕</button><b>Documents</b></div><button onClick={()=>docInputRef.current?.click()} style={{width:"100%",display:"flex",gap:12,alignItems:"center",background:"transparent",border:"none",textAlign:"left",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.08)"}}><span style={{fontSize:26}}>📁</span><span><span style={{display:"block",color:"white",fontSize:15}}>Browse documents</span><span style={{color:"#aaa",fontSize:12}}>Select files up to 40 MB</span></span></button><button onClick={()=>{setShowDocSheet(false); setShowScan(true); setScanPreview(null);}} style={{width:"100%",display:"flex",gap:12,alignItems:"center",background:"transparent",border:"none",textAlign:"left",padding:"12px 0"}}><span style={{fontSize:26}}>📸</span><span><span style={{display:"block",color:"white",fontSize:15}}>Scan document</span><span style={{color:"#aaa",fontSize:12}}>Take photo of a document — EVA droplet scan</span></span></button></div></div>}
      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" style={{display:"none"}} onChange={onDocPick} />
      {/* CAMERA FULLSCREEN */}
      {showCamera && <div style={{position:"fixed",inset:0,background:"black",zIndex:120,display:"flex",flexDirection:"column"}}>
        {!camPreview ? <>
          <div style={{display:"flex",justifyContent:"space-between",padding:"14px 16px",position:"relative",zIndex:5}}><button onClick={closeCamera} style={{width:40,height:40,borderRadius:999,background:"rgba(0,0,0,.5)",border:"none",color:"white",fontSize:20}}>✕</button><button onClick={()=>{}} style={{background:"rgba(0,0,0,.5)",border:"none",color:"white",padding:"6px 10px",borderRadius:999}}>🔦</button></div>
          <div onTouchStart={onCamTouchStart} onTouchEnd={onCamTouchEnd} style={{flex:1,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}><video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",transform: facing==="user"?"scaleX(-1)":"none"}} /><div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,.55)",color:"white",padding:"6px 12px",borderRadius:999,fontSize:11}}>↑ Drag up to flip camera • {facing==="user"?"Front":"Back"}</div>{camRecording && <div style={{position:"absolute",top:14,left:"50%",transform:"translateX(-50%)",background:"#ef4444",color:"white",padding:"6px 12px",borderRadius:999,fontSize:13,fontWeight:"bold"}}>● {fmtDur(camTime)}</div>}</div>
          {camMode==="photo" && galleryPics.length>0 && <div style={{display:"flex",gap:6,overflowX:"auto",padding:"8px 12px",background:"black"}}>{galleryPics.slice(0,10).map((u,i)=><img key={i} src={u} style={{width:52,height:52,objectFit:"cover",borderRadius:8}} />)}</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px 22px",background:"black"}}>
            <button onClick={()=>{}} style={{width:42,height:42,borderRadius:12,background:"rgba(255,255,255,.15)",border:"none",fontSize:20}}>🖼️</button>
            <button onMouseDown={onShutterDown} onMouseUp={onShutterUp} onTouchStart={onShutterDown} onTouchEnd={onShutterUp} style={{width:72,height:72,borderRadius:999,background:"transparent",border:"4px solid white",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{width:56,height:56,borderRadius: camRecording?"12px":"999", background: camRecording?"#ef4444":"white", display:"block"}} /></button>
            <button onClick={()=>setFacing(f=> f==="environment"?"user":"environment")} style={{width:46,height:46,borderRadius:"50% 50% 50% 50% / 62% 62% 38% 38%",background:"linear-gradient(135deg,#7c3aed,#06b6d4)",border:"2px solid white",color:"white",fontSize:20}}>💧⇄</button>
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:10,paddingBottom:16,background:"black"}}><button onClick={()=>setCamMode("video")} style={{background:camMode==="video"?"white":"transparent",border:"none",color:camMode==="video"?"black":"white",padding:"6px 16px",borderRadius:999}}>Video</button><button onClick={()=>setCamMode("photo")} style={{background:camMode==="photo"?"white":"transparent",border:"none",color:camMode==="photo"?"black":"white",padding:"6px 16px",borderRadius:999}}>Photo</button></div>
          <div style={{textAlign:"center",color:"#aaa",fontSize:11,paddingBottom:8}}>Photo: Tap = photo • Hold = video • Video: Tap = record</div>
        </> : <>
          <div style={{flex:1,background:"black",display:"flex",alignItems:"center",justifyContent:"center"}}>{camPreview.type==="photo"?<img src={camPreview.url} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} />:<video src={camPreview.url} controls autoPlay style={{maxWidth:"100%",maxHeight:"100%"}} />}</div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"16px 20px 24px",background:"black"}}><button onClick={()=>setCamPreview(null)} style={{background:"rgba(255,255,255,.15)",border:"none",color:"white",padding:"10px 18px",borderRadius:999}}>Retake</button><button onClick={sendCamPreview} style={{background:"#25D366",border:"none",color:"white",padding:"10px 22px",borderRadius:999,fontWeight:"bold"}}>Send to EVA 💧 ➤</button></div>
        </>}
      </div>}
      {/* SCAN DOCUMENT */}
      {showScan && <div style={{position:"fixed",inset:0,background:"black",zIndex:125,display:"flex",flexDirection:"column"}}>
        {!scanPreview ? <>
          <div style={{display:"flex",justifyContent:"space-between",padding:"14px"}}><button onClick={()=>{setShowScan(false); try{scanStreamRef.current?.getTracks().forEach(t=>t.stop());}catch(e){}}} style={{width:40,height:40,borderRadius:999,background:"rgba(0,0,0,.5)",border:"none",color:"white",fontSize:20}}>✕</button><span style={{background:"rgba(0,0,0,.6)",color:"white",padding:"6px 12px",borderRadius:999,fontSize:12}}>Position document in frame</span><span style={{width:40}} /></div>
          <div style={{flex:1,position:"relative",overflow:"hidden"}}><video ref={scanVideoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover"}} /><div style={{position:"absolute",inset:"12% 8%",border:"2px dashed #22d3ee",borderRadius:16,pointerEvents:"none"}} /></div>
          <div style={{display:"flex",justifyContent:"center",gap:8,padding:"10px"}}><button onClick={()=>setScanMode("manual")} style={{background:scanMode==="manual"?"white":"rgba(255,255,255,.15)",border:"none",color:scanMode==="manual"?"black":"white",padding:"8px 16px",borderRadius:999}}>Manual</button><button onClick={()=>setScanMode("auto")} style={{background:scanMode==="auto"?"white":"rgba(255,255,255,.15)",border:"none",color:scanMode==="auto"?"black":"white",padding:"8px 16px",borderRadius:999}}>Auto capture</button></div>
          <div style={{display:"flex",justifyContent:"center",padding:"10px 0 22px"}}><button onClick={captureScan} style={{width:70,height:70,borderRadius:999,background:"transparent",border:"4px solid white",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{width:54,height:54,borderRadius:999,background:"white",display:"block"}} /></button></div>
          <div style={{textAlign:"center",color:"#aaa",fontSize:11,paddingBottom:10}}>Auto capture snaps when document is steady • EVA will have access to images you scan</div>
        </> : <>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"black"}}><img src={scanPreview.url} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} /></div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"16px 20px 24px"}}><button onClick={()=>{setScanPreview(null); setTimeout(()=>startScan(),100);}} style={{background:"rgba(255,255,255,.15)",border:"none",color:"white",padding:"10px 18px",borderRadius:999}}>Retake</button><button onClick={sendScan} style={{background:"#25D366",border:"none",color:"white",padding:"10px 22px",borderRadius:999,fontWeight:"bold"}}>Send Scan 💧 ➤</button></div>
        </>}
      </div>}
      {showEmoji&&!showSearch&&!showMedia && <div style={{position:"relative",zIndex:25,height:280,flexShrink:0,background:"rgba(0,0,0,.95)",borderTop:"1px solid rgba(255,255,255,.2)",padding:"10px 10px 6px",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <input value={emojiSearch} onChange={e=>setEmojiSearch(e.target.value)} placeholder="🔍 Search emoji... car, monkey, love" style={{width:"100%",background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.2)",borderRadius:999,color:"white",padding:"10px 14px",fontSize:14,outline:"none"}} />
        <div ref={emojiTabsRef} style={{display:"flex",gap:6,overflowX:"auto",padding:"10px 2px 6px"}}>
          {CAT_LIST.map(cat=><button key={cat} data-cat={cat} onClick={()=>switchCat(cat)} style={{background:emojiTab===cat?"#8b5cf6":"rgba(255,255,255,.1)",border:"none",color:"white",padding:"6px 12px",borderRadius:999,fontSize:13,whiteSpace:"nowrap"}}>{cat}</button>)}
        </div>
        <div ref={emojiGridRef} onTouchStart={onEmojiSwipeStart} onTouchEnd={onEmojiSwipeEnd} style={{flex:1,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:4,paddingBottom:4}}>
          {getEmojis().map((s,i)=><button key={i} onClick={()=>addEmoji(s)} style={{background:"transparent",border:"none",fontSize:26,padding:"6px 0"}}>{getEmoji(s)}</button>)}
        </div>
      </div>}
      {!showSearch&&!showMedia && <div style={{position:"relative",zIndex:30,flexShrink:0,background:"#030014",padding:"8px 10px calc(8px + env(safe-area-inset-bottom))",borderTop:"1px solid rgba(255,255,255,.08)"}}>
        {replyTo && <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(139,92,246,.2)",borderRadius:10,padding:"6px 10px",marginBottom:6}}><div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:"#c4b5fd",fontWeight:"bold"}}>{replyTo.from==="you"?"You":"EVA"}</div><div style={{fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{clean(replyTo.text)}</div></div><button onClick={()=>setReplyTo(null)} style={{background:"transparent",border:"none",color:"white",fontSize:16}}>✕</button></div>}
        {/* VOICE DROPLET RECORDING - Drag DOWN to cancel */}
        {isRecording ? (
          <div onTouchStart={onVoiceTouchStart} onTouchMove={onVoiceTouchMove} onTouchEnd={onVoiceTouchEnd} style={{display:"flex",alignItems:"center",gap:10,background: recCancelHint?"rgba(239,68,68,.25)":"rgba(139,92,246,.25)",border: recCancelHint?"1px solid #ef4444":"1px solid rgba(167,139,250,.5)",borderRadius:999,padding:"8px 10px"}}>
            <span style={{width:10,height:10,borderRadius:999,background:"#ef4444",display:"block"}} />
            <span style={{fontSize:13,fontWeight:"bold",minWidth:42}}>{fmtDur(recTime)}{isPaused?" • Paused":""}</span>
            <span style={{display:"flex",gap:2,alignItems:"flex-end",height:20}}>{waveLevels.map((h,i)=><span key={i} style={{width:3,height:h,background:"#a78bfa",borderRadius:2,display:"block"}} />)}</span>
            <span style={{fontSize:10,color:"#c4b5fd",flex:1}}>{recCancelHint?"Release to cancel 🗑️":"Drag DOWN to cancel"}</span>
            <button onClick={()=>stopVoiceRec(false)} style={{width:36,height:36,borderRadius:"50% 50% 50% 50% / 62% 62% 38% 38%",background:"linear-gradient(135deg,#ef4444,#f97316)",border:"none",fontSize:16}}>🗑️</button>
            <button onClick={togglePauseVoice} style={{width:36,height:36,borderRadius:999,background:"rgba(255,255,255,.2)",border:"none",fontSize:14}}>{isPaused?"▶️":"⏸️"}</button>
            <button onClick={()=>stopVoiceRec(true)} style={{width:42,height:42,borderRadius:"50% 50% 50% 50% / 62% 62% 38% 38%",background:"linear-gradient(135deg,#22c55e,#06b6d4)",border:"none",fontSize:18}}>💧➤</button>
          </div>
        ) : (
        <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
          <button onMouseDown={e=>e.preventDefault()} onClick={toggleEmoji} style={{width:42,height:42,borderRadius:999,background:"rgba(255,255,255,.12)",border:"none",fontSize:22,flexShrink:0}}>{showEmoji?"⌨️":"😊"}</button>
          <button onClick={()=>{ setShowEmoji(false); setShowAttach(!showAttach); }} style={{width:42,height:42,borderRadius:"50% 50% 50% 50% / 62% 62% 38% 38%",background:"linear-gradient(135deg,#1e1b4b,#4c1d95,#0ea5e9)",border:"2px solid rgba(167,139,250,.6)",fontSize:20,flexShrink:0,boxShadow:"0 4px 14px rgba(139,92,246,.4)"}}>💧</button>
          <textarea ref={textareaRef} defaultValue="" onInput={onInputChange} onFocus={handleInputFocus} onClick={handleInputTap} onTouchStart={handleInputTap} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault(); askEVA();}}} placeholder="Message EVA..." rows={1} style={{flex:1,background:"rgba(255,255,255,.12)",border:"none",borderRadius:20,color:"white",padding:"10px 14px",fontSize:15,outline:"none",resize:"none",maxHeight:100}} />
          {hasText ? (
            <button onMouseDown={e=>e.preventDefault()} onClick={()=>askEVA()} style={{width:42,height:42,borderRadius:999,background:"#25D366",border:"none",fontSize:20,flexShrink:0}}>➤</button>
          ) : (
            <button onMouseDown={e=>e.preventDefault()} onClick={startVoice} style={{width:42,height:42,borderRadius:"50% 50% 50% 50% / 62% 62% 38% 38%",background:"linear-gradient(135deg,#8b5cf6,#06b6d4)",border:"none",fontSize:20,flexShrink:0}}>🎤</button>
          )}
        </div>
        )}
        {showFeedback&&lastSuggestion && <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={()=>giveFeedback("up")} style={{flex:1,background:"rgba(37,211,102,.2)",border:"1px solid #25D366",color:"white",padding:"8px",borderRadius:999}}>👍 Good</button><button onClick={()=>giveFeedback("down")} style={{flex:1,background:"rgba(255,90,90,.2)",border:"1px solid #ff5a5a",color:"white",padding:"8px",borderRadius:999}}>👎 Not good</button></div>}
      </div>}
      <EvaVoice voiceEnabled={voiceEnabled} alwaysListening={alwaysListening} setVoiceEnabled={setVoiceEnabled} setAlwaysListening={setAlwaysListening} speakEva={speakEva} onUserMessage={(t)=>askEVA(t)} />
    </div>
  );
                          }
