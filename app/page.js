"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const CHAT_ID = 1;

const EMOJI_CATS = {
  "😊 Faces": [
    {e:"😂",k:"laugh happy face"}, {e:"😊",k:"smile happy"}, {e:"😍",k:"love heart eyes"}, {e:"😭",k:"cry sad tears"}, {e:"😅",k:"sweat laugh"}, {e:"🔥",k:"fire hot"}, {e:"😎",k:"cool sunglasses"}, {e:"🤣",k:"laugh rolling"}, {e:"😇",k:"angel halo"}, {e:"😉",k:"wink"}, {e:"🥰",k:"love smile"}, {e:"😋",k:"tongue food"}, {e:"🤔",k:"think"}, {e:"😴",k:"sleep"}, {e:"😡",k:"angry mad"}, {e:"😁",k:"grin teeth"}, {e:"😆",k:"laugh"}, {e:"😏",k:"smirk"}, {e:"🤗",k:"hug"}, {e:"😌",k:"relief"}, {e:"🥺",k:"pleading cute"}, {e:"😤",k:"angry steam"}, {e:"😜",k:"tongue wink"}, {e:"🤯",k:"mind blown"}, {e:"😢",k:"cry"}, {e:"😘",k:"kiss love"}, {e:"🤩",k:"star eyes wow"}, {e:"😃",k:"happy"}, {e:"😄",k:"happy smile"}, {e:"🥳",k:"party celebrate"}, {e:"😈",k:"devil"}, {e:"💀",k:"skull dead"}, {e:"🤖",k:"robot"}, {e:"👻",k:"ghost"}, {e:"🎃",k:"pumpkin halloween"},
  ],
  "🤚 Hands": [
    {e:"👍",k:"thumbs up good"}, {e:"👎",k:"thumbs down"}, {e:"🙏",k:"pray please"}, {e:"👏",k:"clap"}, {e:"🙌",k:"celebrate hands up"}, {e:"🤘",k:"rock horns"}, {e:"🤙",k:"call me shaka"}, {e:"✋",k:"hand stop five"}, {e:"🤚",k:"hand back"}, {e:"🙋‍♀️",k:"woman raise hand"}, {e:"🙋",k:"raise hand"}, {e:"🙋‍♂️",k:"man raise hand"}, {e:"✌️",k:"peace victory"}, {e:"🤞",k:"fingers crossed luck"}, {e:"🫰",k:"finger heart"}, {e:"👌",k:"ok perfect"}, {e:"👊",k:"punch fist"}, {e:"✊",k:"fist"}, {e:"👋",k:"wave hello"}, {e:"🫡",k:"salute"}, {e:"🖐️",k:"hand five"}, {e:"🤲",k:"hands together"}, {e:"💪",k:"muscle strong"}, {e:"👀",k:"eyes look"}, {e:"🫶",k:"heart hands love"}, {e:"🤝",k:"handshake deal"}, {e:"👈",k:"point left"}, {e:"👉",k:"point right"}, {e:"👆",k:"point up"}, {e:"👇",k:"point down"},
  ],
  "🧑 People": [
    {e:"👶",k:"baby"}, {e:"👦",k:"boy"}, {e:"👧",k:"girl"}, {e:"🧒",k:"child"}, {e:"👩",k:"woman"}, {e:"👨",k:"man"}, {e:"👵",k:"old woman grandma"}, {e:"👴",k:"old man grandpa"}, {e:"👮",k:"police"}, {e:"👷",k:"worker"}, {e:"👨‍🍳",k:"chef cook"}, {e:"👨‍🎓",k:"student graduate"}, {e:"👨‍⚕️",k:"doctor"}, {e:"💃",k:"dance woman"}, {e:"🕺",k:"dance man"}, {e:"🏃",k:"run"}, {e:"👪",k:"family"}, {e:"💑",k:"couple love"},
  ],
  "🐵 Animals": [
    {e:"🐵",k:"monkey face"}, {e:"🐒",k:"monkey"}, {e:"🦍",k:"gorilla"}, {e:"🦧",k:"orangutan"}, {e:"🐶",k:"dog face"}, {e:"🐕",k:"dog"}, {e:"🐺",k:"wolf"}, {e:"🦊",k:"fox"}, {e:"🐱",k:"cat face"}, {e:"🐈",k:"cat"}, {e:"🦁",k:"lion"}, {e:"🐯",k:"tiger face"}, {e:"🐴",k:"horse face"}, {e:"🦄",k:"unicorn"}, {e:"🦓",k:"zebra"}, {e:"🐮",k:"cow face"}, {e:"🐷",k:"pig face"}, {e:"🐸",k:"frog"}, {e:"🐰",k:"rabbit"}, {e:"🐻",k:"bear"}, {e:"🐼",k:"panda"}, {e:"🐨",k:"koala"}, {e:"🐔",k:"chicken"}, {e:"🐧",k:"penguin"}, {e:"🐦",k:"bird"}, {e:"🦅",k:"eagle"}, {e:"🦉",k:"owl"}, {e:"🦇",k:"bat"}, {e:"🐝",k:"bee"}, {e:"🦋",k:"butterfly"}, {e:"🐢",k:"turtle"}, {e:"🐍",k:"snake"}, {e:"🐙",k:"octopus"}, {e:"🦀",k:"crab"}, {e:"🐳",k:"whale"}, {e:"🐬",k:"dolphin"}, {e:"🦈",k:"shark"}, {e:"🐊",k:"crocodile"},
  ],
  "🚗 Cars & Travel": [
    {e:"🚗",k:"car automobile"}, {e:"🚕",k:"taxi car"}, {e:"🚙",k:"suv car"}, {e:"🚌",k:"bus"}, {e:"🏎️",k:"race car fast"}, {e:"🚓",k:"police car"}, {e:"🚑",k:"ambulance"}, {e:"🚒",k:"fire truck"}, {e:"🚚",k:"truck delivery"}, {e:"🏍️",k:"motorcycle bike"}, {e:"🚲",k:"bicycle bike"}, {e:"✈️",k:"airplane plane flight"}, {e:"🚀",k:"rocket space"}, {e:"🚁",k:"helicopter"}, {e:"🚂",k:"train locomotive"}, {e:"🚢",k:"ship boat"}, {e:"⛵",k:"sailboat"}, {e:"🏖️",k:"beach vacation"}, {e:"🧳",k:"luggage travel"}, {e:"🚦",k:"traffic light"},
  ],
  "🍕 Food": [
    {e:"🍕",k:"pizza"}, {e:"🍔",k:"burger"}, {e:"🍟",k:"fries"}, {e:"🌭",k:"hotdog"}, {e:"🍿",k:"popcorn"}, {e:"🍩",k:"doughnut"}, {e:"🍰",k:"cake"}, {e:"🎂",k:"birthday cake"}, {e:"🍫",k:"chocolate"}, {e:"🍦",k:"ice cream"}, {e:"🍓",k:"strawberry"}, {e:"🍎",k:"apple"}, {e:"🍌",k:"banana"}, {e:"☕",k:"coffee"}, {e:"🍵",k:"tea"}, {e:"🍺",k:"beer"}, {e:"🍷",k:"wine"}, {e:"🍜",k:"noodles ramen"}, {e:"🍣",k:"sushi"},
  ],
  "⚽ Activity": [
    {e:"⚽",k:"football soccer ball"}, {e:"🏀",k:"basketball"}, {e:"🎾",k:"tennis"}, {e:"🎮",k:"game controller"}, {e:"🎲",k:"dice game"}, {e:"🎯",k:"target dart"}, {e:"🎸",k:"guitar music"}, {e:"🎵",k:"music note"}, {e:"🎤",k:"microphone sing"}, {e:"🎧",k:"headphone music"}, {e:"🎬",k:"movie film"}, {e:"💻",k:"laptop computer"}, {e:"📱",k:"phone"}, {e:"💡",k:"idea light"}, {e:"🎁",k:"gift present"}, {e:"🎉",k:"party celebrate"}, {e:"✨",k:"sparkles"}, {e:"❤️",k:"heart love"}, {e:"💔",k:"broken heart"}, {e:"💯",k:"100 perfect"}, {e:"👑",k:"crown king"}, {e:"💎",k:"diamond"}, {e:"🌹",k:"rose flower love"},
  ],
};

const cleanText = (t) => (t || "").replace(/\*\*/g, "").replace(/^\s*-\s*/gm, "• ");

export default function EVA() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState(() => {
    try { const c = localStorage.getItem("eva_messages_cache"); if(c) return JSON.parse(c); } catch(e){} return [];
  });
  const [showMenu, setShowMenu] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState("😊 Faces");
  const [emojiSearch, setEmojiSearch] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [myName, setMyName] = useState("");
  const [prefs, setPrefs] = useState({});

  const scrollRef = useRef(null); const bottomRef = useRef(null); const textareaRef = useRef(null);
  const lastUserMsgRef = useRef(null);
  const keyboardOpenRef = useRef(false);
  const didInitialScroll = useRef(false);

  useEffect(()=>{
    const n = localStorage.getItem("eva_dave_name"); if(n) setMyName(n);
    const p = localStorage.getItem("eva_dave_prefs"); if(p) try{ setPrefs(JSON.parse(p)); }catch(e){}
    const local = (()=>{ try{ return JSON.parse(localStorage.getItem("eva_messages_cache") || "[]"); }catch(e){ return []; } })();
    if (local.length > 0) return;
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").eq("chat_id", CHAT_ID).order("created_at", {ascending:true}).limit(80);
      if(data && data.length){ 
        const mapped = data.map(m=>({from:m.sender==="you"?"you":"eva", text:m.text})); 
        const nowLocal = (()=>{ try{ return JSON.parse(localStorage.getItem("eva_messages_cache") || "[]"); }catch(e){ return []; } })();
        if (nowLocal.length === 0) { setMessages(mapped); try{ localStorage.setItem("eva_messages_cache", JSON.stringify(mapped)); }catch(e){} }
      }
    }; load();
  },[]);

  useEffect(()=>{
    if (didInitialScroll.current) return;
    if (messages.length === 0) return;
    const t1 = setTimeout(()=>{
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      didInitialScroll.current = true;
    }, 100);
    const t2 = setTimeout(()=>{
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 400);
    return ()=>{ clearTimeout(t1); clearTimeout(t2); };
  },[messages.length]);

  useEffect(()=>{
    if (!window.visualViewport) return;
    let lastH = window.visualViewport.height;
    const onResize = () => {
      const newH = window.visualViewport.height;
      const diff = newH - lastH;
      if (diff > 100) {
        keyboardOpenRef.current = false;
        setTimeout(()=>{
          if (scrollRef.current) scrollRef.current.scrollTop += diff;
        }, 120);
      } else if (diff < -100) {
        keyboardOpenRef.current = true;
      }
      lastH = newH;
    };
    window.visualViewport.addEventListener("resize", onResize);
    return ()=> window.visualViewport.removeEventListener("resize", onResize);
  },[]);

  const saveToSupabase = async (sender, msgText) => { try{ await supabase.from("messages").insert([{chat_id:CHAT_ID, sender, text:msgText}]); }catch(e){} };
  const clearChat = async () => {
    if(!window.confirm("Clear all chats?")) return;
    setMessages([]); setMyName(""); setPrefs({}); localStorage.removeItem("eva_dave_name"); localStorage.removeItem("eva_dave_prefs"); localStorage.removeItem("eva_messages_cache");
    try{ await supabase.from("messages").delete().eq("chat_id", CHAT_ID); }catch(e){} setShowMenu(false);
    didInitialScroll.current = true;
    setTimeout(()=>{ if(scrollRef.current) scrollRef.current.scrollTop = 0; }, 50);
  };

  const addEmoji = (emoji) => { setText(prev=>prev+emoji); textareaRef.current?.focus(); };

  const getEmojisToShow = () => {
    if(emojiSearch.trim()){
      const q = emojiSearch.toLowerCase();
      const all = Object.values(EMOJI_CATS).flat();
      return all.filter(item => item.k.includes(q));
    }
    return EMOJI_CATS[emojiTab] || [];
  };

  // ===== PHONE-PROOF: 3 FULL LINES FOR ANY PHONE =====
  // We no use fixed 90 / 135 again. We measure the REAL visible height with visualViewport.
  // Small phone = viewport small = push question up more. Big phone = push less. Result same: 3 full lines.
  const scrollToQuestionWith3Lines = () => {
    setTimeout(()=>{
      if (!lastUserMsgRef.current || !scrollRef.current) return;
      const container = scrollRef.current;
      const qEl = lastUserMsgRef.current;
      const qTop = qEl.offsetTop;
      const qHeight = qEl.offsetHeight;

      // Real visible chat height for THIS phone, with keyboard open
      // visualViewport.height = wetin screen show now. Minus header (~70) and input bar (~90) = chat area.
      // If visualViewport no dey, fall back to container.clientHeight.
      let visibleChatHeight = container.clientHeight;
      if (window.visualViewport) {
        const vvH = window.visualViewport.height;
        // Header + input bar na about 160px total. This work for any phone because vvH na real.
        visibleChatHeight = Math.max(200, vvH - 160);
      }

      // We want question + gap + 3 full lines + bubble padding to end 14px above Ask bar
      const LINE_H = 22; // 14px font * 1.5 lineHeight = 21, plus 1px safety = 22
      const wantBottom = qTop + qHeight + 10 + (3 * LINE_H) + 30;
      const target = wantBottom - visibleChatHeight + 14;
      container.scrollTop = Math.max(0, target);
    }, 80);
  };

  const askEVA = async () => {
    if(!text.trim() || isThinking) return;
    const userText = text.trim();
    if (textareaRef.current) textareaRef.current.focus();
    setText(""); setShowEmoji(false); setEmojiSearch("");
    requestAnimationFrame(()=>{ textareaRef.current?.focus(); });

    const lower = userText.toLowerCase();
    if(lower.includes("my name is")){ const nm = userText.split(/my name is/i)[1].trim().split(" ")[0].replace(/[^a-zA-Z]/g,""); if(nm){ const cap = nm.charAt(0).toUpperCase()+nm.slice(1).toLowerCase(); setMyName(cap); localStorage.setItem("eva_dave_name", cap);} }
    if(lower.includes("my best food is")){ const v = userText.split(/my best food is/i)[1].trim(); const np = {...prefs, food:v}; setPrefs(np); localStorage.setItem("eva_dave_prefs", JSON.stringify(np)); }
    if(lower.includes("i want to buy")){ const v = userText.split(/i want to buy/i)[1].trim(); const np = {...prefs, want_to_buy:v}; setPrefs(np); localStorage.setItem("eva_dave_prefs", JSON.stringify(np)); }

    setMessages(prev=>{ const next=[...prev,{from:"you",text:userText}]; try{ localStorage.setItem("eva_messages_cache", JSON.stringify(next)); }catch(e){} return next; });
    await saveToSupabase("you", userText);
    scrollToQuestionWith3Lines();
    setIsThinking(true);
    setMessages(prev=>[...prev,{from:"eva",text:"▍"}]);
    setTimeout(()=>{ scrollToQuestionWith3Lines(); }, 350);
    setTimeout(()=>{ scrollToQuestionWith3Lines(); }, 700);

    const typeOut = (fullText) => {
      const cleaned = cleanText(fullText);
      return new Promise((resolve) => {
        let i = 0;
        const interval = setInterval(() => {
          i += 3;
          const shown = cleaned.slice(0, i);
          const display = shown + "▍";
          setMessages(prev => {
            const copy = [...prev];
            copy[copy.length-1] = {from:"eva", text: display};
            try{ localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); }catch(e){}
            return copy;
          });
          if(i >= cleaned.length){
            clearInterval(interval);
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length-1] = {from:"eva", text: cleaned};
              try{ localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); }catch(e){}
              return copy;
            });
            resolve();
          }
        }, 18);
      });
    };

    try{
      const history=[...messages,{from:"you",text:userText}].slice(-10).map(m=>({role:m.from==="you"?"user":"assistant", content:m.text}));
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:userText,history,userProfile:{name:myName,prefs,bestFood:prefs.food,wantToBuy:prefs.want_to_buy}})});
      const contentType = res.headers.get("content-type") || "";
      if(contentType.includes("application/json")){
        const data=await res.json();
        const reply=data.reply||"I dey here Boss, try again.";
        await typeOut(reply);
        await saveToSupabase("eva", reply);
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullReply = "";
        let shown = "";
        const showLoop = setInterval(()=>{
          if(shown.length < fullReply.length){
            shown = fullReply.slice(0, shown.length + 4);
            const display = cleanText(shown) + "▍";
            setMessages(prev=>{
              const copy=[...prev];
              copy[copy.length-1]={from:"eva",text:display};
              try{ localStorage.setItem("eva_messages_cache", JSON.stringify(copy)); }catch(e){}
              return copy;
            });
          }
        }, 18);
        while(true){
          const {done, value} = await reader.read();
          if(done) break;
          fullReply += decoder.decode(value, {stream:true});
        }
        clearInterval(showLoop);
        await typeOut(fullReply);
        await saveToSupabase("eva", fullReply);
      }
    }catch(e){
      setMessages(prev=>{ const w=prev.slice(0,-1); const next=[...w,{from:"eva",text:"Network jam small Boss, try again."}]; try{ localStorage.setItem("eva_messages_cache", JSON.stringify(next)); }catch(e){} return next; });
    }
    setIsThinking(false);
    textareaRef.current?.focus();
  };

  const hideKeyboardToRead = () => {
    setShowMenu(false);
    if (document.activeElement) document.activeElement.blur();
    setTimeout(()=>{
      if (scrollRef.current) scrollRef.current.scrollTop += 280;
    }, 250);
  };

  return (
    <div style={{height:"100dvh", minHeight:"100dvh", maxHeight:"100dvh", background:"#030014", color:"white", display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"sans-serif", position:"fixed", inset:0}}>
      <img src="/eva-bg.jpg" style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", pointerEvents:"none"}} />
      <div style={{position:"relative", display:"flex", padding:"16px 18px", alignItems:"center", justifyContent:"space-between", flexShrink:0}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}><img src="/IMG-20261104-WA3311.jpg" style={{width:38, height:38, borderRadius:999, objectFit:"cover", border:"2px solid #a78bfa"}} /><b style={{fontSize:20, letterSpacing:2}}>EVA</b></div>
        <div style={{position:"relative"}}>
          <button onTouchStart={(e)=>e.preventDefault()} onMouseDown={(e)=>e.preventDefault()} onClick={()=>setShowMenu(!showMenu)} style={{width:42, height:42, borderRadius:999, background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.30)", color:"white", fontSize:22}}>⋮</button>
          {showMenu && (<div style={{position:"absolute", top:50, right:0, width:170, background:"rgba(0,0,0,0.85)", borderRadius:14, overflow:"hidden", zIndex:50}}>
            <button onClick={clearChat} style={{width:"100%", textAlign:"left", background:"transparent", border:"none", color:"#ff8080", padding:"13px 16px", fontSize:14}}>🗑️ Clear Chat</button>
            <button onClick={()=>setShowMenu(false)} style={{width:"100%", textAlign:"left", background:"transparent", border:"none", color:"white", padding:"13px 16px", fontSize:14}}>✖️ Close</button>
          </div>)}
        </div>
      </div>

      <div 
        ref={scrollRef} 
        style={{position:"relative", flex:1, minHeight:0, display:"flex", flexDirection:"column", gap:10, overflowY:"auto", overscrollBehavior:"contain", padding:"0 20px 10px"}}
        onClick={hideKeyboardToRead}
      >
        {messages.length===0 && (<div style={{background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.25)", padding:14, borderRadius:16, maxWidth:420, margin:"0 auto", textAlign:"center"}}>Hello, I am EVA. Ask me anything.</div>)}
        {messages.map((m,i)=>{
          const isLastUser = m.from==="you" && messages.slice(i+1).every(x=>x.from!=="you");
          return (<div key={i} ref={isLastUser ? lastUserMsgRef : null} style={{alignSelf:m.from==="you"?"flex-end":"flex-start", background:m.from==="you"?"#8b5cf6":"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.25)", padding:"10px 14px", borderRadius:16, maxWidth:"85%", fontSize:14, lineHeight:1.5, whiteSpace:"pre-line"}}>{cleanText(m.text)}</div>);
        })}
        <div ref={bottomRef} style={{height:1, flexShrink:0}} />
      </div>

      {showEmoji && (
        <div style={{position:"relative", background:"rgba(0,0,0,0.95)", borderTop:"1px solid rgba(255,255,255,0.2)", padding:"10px 10px 6px", flexShrink:0, zIndex:20}}>
          <input value={emojiSearch} onChange={e=>setEmojiSearch(e.target.value)} placeholder="🔍 Search emoji... type car, monkey, love" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:999, color:"white", padding:"9px 14px", fontSize:13, outline:"none", boxSizing:"border-box"}} />
          <div style={{display:"flex", gap:6, overflowX:"auto", padding:"10px 0 8px", whiteSpace:"nowrap", scrollbarWidth:"none"}}>
            {Object.keys(EMOJI_CATS).map(cat=>(
              <button key={cat} onTouchStart={(e)=>e.preventDefault()} onMouseDown={(e)=>e.preventDefault()} onClick={()=>{setEmojiTab(cat); setEmojiSearch("");}} style={{background: emojiTab===cat && !emojiSearch ? "#8b5cf6" : "rgba(255,255,255,0.12)", border:"none", color:"white", padding:"6px 12px", borderRadius:999, fontSize:12, flexShrink:0}}>{cat}</button>
            ))}
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(8, 1fr)", gap:4, maxHeight:190, overflowY:"auto", paddingBottom:6}}>
            {getEmojisToShow().map((item,i)=>(
              <button key={i} onTouchStart={(e)=>e.preventDefault()} onMouseDown={(e)=>e.preventDefault()} onClick={()=>addEmoji(item.e)} style={{background:"transparent", border:"none", fontSize:26, padding:6}}>{item.e}</button>
            ))}
          </div>
          {getEmojisToShow().length===0 && <div style={{textAlign:"center", padding:14, fontSize:13, color:"#aaa"}}>No emoji for "{emojiSearch}" — try car, monkey, love, dog</div>}
        </div>
      )}

      <div style={{position:"relative", padding:"12px 16px 18px", flexShrink:0}}>
        <div style={{display:"flex", gap:6, maxWidth:520, margin:"0 auto", background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.30)", padding:8, borderRadius:999, alignItems:"center"}}>
          <button onTouchStart={(e)=>e.preventDefault()} onMouseDown={(e)=>e.preventDefault()} onClick={()=>setShowEmoji(!showEmoji)} style={{background:"transparent", border:"none", fontSize:24, padding:"2px 4px", flexShrink:0}}>😊</button>
          <textarea 
            ref={textareaRef} 
            value={text} 
            onChange={e=>setText(e.target.value)} 
            onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); askEVA(); } }} 
            placeholder="Ask EVA..." rows={1} 
            enterKeyHint="send"
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} 
            data-lpignore="true" data-1p-ignore="true" 
            style={{flex:1, background:"transparent", border:"none", outline:"none", color:"white", padding:"10px 6px", fontSize:15, resize:"none", maxHeight:100, fontFamily:"sans-serif"}} 
          />
          <button 
            onTouchStart={(e)=>e.preventDefault()} 
            onMouseDown={(e)=>e.preventDefault()} 
            onClick={askEVA} 
            style={{background:"#8b5cf6", border:"none", color:"white", padding:"10px 18px", borderRadius:999, fontWeight:"bold", flexShrink:0, touchAction:"manipulation"}}
          >Ask →</button>
        </div>
      </div>
    </div>
  );
                                                                                                                                                                                                               }
