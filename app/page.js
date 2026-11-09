"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const CHAT_ID = 1;

export default function EVA() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [myName, setMyName] = useState("");
  const [prefs, setPrefs] = useState({});

  // FIX 1: For scroll to bottom like WhatsApp
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const isFirstLoad = useRef(true);

  // FIX 1b: This go jump to last message every time messages change
  useEffect(() => {
    if (bottomRef.current) {
      // First time: jump straight, no animation (no shake)
      // After: also jump straight, like WhatsApp
      bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
    isFirstLoad.current = false;
  }, [messages, isThinking]);

  useEffect(() => {
    const n = localStorage.getItem("eva_dave_name"); if(n) setMyName(n);
    const p = localStorage.getItem("eva_dave_prefs"); if(p) try{ setPrefs(JSON.parse(p)); }catch(e){}
    const load = async () => {
      const { data } = await supabase.from("messages").select("*").eq("chat_id", CHAT_ID).order("created_at", {ascending:true}).limit(80);
      if(data && data.length) setMessages(data.map(m=>({from:m.sender==="you"?"you":"eva", text:m.text})));
    }; load();
  }, []);

  const saveToSupabase = async (sender, msgText) => { try{ await supabase.from("messages").insert([{chat_id:CHAT_ID, sender, text:msgText}]); }catch(e){} };

  const clearChat = async () => {
    if(!window.confirm("Clear all chats?")) return;
    setMessages([]); setMyName(""); setPrefs({});
    localStorage.removeItem("eva_dave_name"); localStorage.removeItem("eva_dave_prefs");
    try{ await supabase.from("messages").delete().eq("chat_id", CHAT_ID); }catch(e){}
    setShowMenu(false);
  };

  const askEVA = async () => {
    if(!text.trim() || isThinking) return;
    const userText = text.trim(); setText("");
    const lower = userText.toLowerCase();
    if(lower.includes("my name is")){ const nm = userText.split(/my name is/i)[1].trim().split(" ")[0].replace(/[^a-zA-Z]/g,""); if(nm){ const cap = nm.charAt(0).toUpperCase()+nm.slice(1).toLowerCase(); setMyName(cap); localStorage.setItem("eva_dave_name", cap);} }
    if(lower.includes("my best food is")){ const v = userText.split(/my best food is/i)[1].trim(); const np = {...prefs, food:v}; setPrefs(np); localStorage.setItem("eva_dave_prefs", JSON.stringify(np)); }
    if(lower.includes("i want to buy")){ const v = userText.split(/i want to buy/i)[1].trim(); const np = {...prefs, want_to_buy:v}; setPrefs(np); localStorage.setItem("eva_dave_prefs", JSON.stringify(np)); }

    setMessages(prev=>[...prev, {from:"you", text:userText}]);
    await saveToSupabase("you", userText);
    setIsThinking(true);
    setMessages(prev=>[...prev, {from:"eva", text:"EVA is thinking..."}]);

    try{
      const history = [...messages, {from:"you", text:userText}].slice(-10).map(m=>({role:m.from==="you"?"user":"assistant", content:m.text}));
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message:userText, history, userProfile:{name:myName, prefs, bestFood:prefs.food, wantToBuy:prefs.want_to_buy} }) });
      const data = await res.json();
      const reply = data.reply || "I dey here Boss, try again.";
      setMessages(prev=>{ const w = prev.slice(0,-1); return [...w, {from:"eva", text:reply}]; });
      await saveToSupabase("eva", reply);
    }catch(e){
      setMessages(prev=>{ const w = prev.slice(0,-1); return [...w, {from:"eva", text:"Network jam small Boss, try again."}]; });
    }
    setIsThinking(false);
  };

  return (
    <div style={{height:"100dvh", minHeight:"100dvh", background:"#030014", color:"white", display:"flex", flexDirection:"column", overflow:"hidden", fontFamily:"sans-serif", position:"fixed", inset:0}}>
      {/* FIX 2: Background lock — e no go move again */}
      <img src="/eva-bg.jpg" style={{position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", pointerEvents:"none", transform:"translateZ(0)"}} />
      <div style={{position:"relative", display:"flex", padding:"16px 18px", alignItems:"center", justifyContent:"space-between", flexShrink:0}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}><img src="/IMG-20261104-WA3311.jpg" style={{width:38, height:38, borderRadius:999, objectFit:"cover", border:"2px solid #a78bfa"}} /><b style={{fontSize:20, letterSpacing:2}}>EVA</b></div>
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowMenu(!showMenu)} style={{width:42, height:42, borderRadius:999, background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.30)", color:"white", fontSize:22}}>⋮</button>
          {showMenu && (<div style={{position:"absolute", top:50, right:0, width:170, background:"rgba(0,0,0,0.85)", borderRadius:14, overflow:"hidden", zIndex:50}}>
            <button onClick={clearChat} style={{width:"100%", textAlign:"left", background:"transparent", border:"none", color:"#ff8080", padding:"13px 16px", fontSize:14}}>🗑️ Clear Chat</button>
            <button onClick={()=>setShowMenu(false)} style={{width:"100%", textAlign:"left", background:"transparent", border:"none", color:"white", padding:"13px 16px", fontSize:14}}>✖️ Close</button>
          </div>)}
        </div>
      </div>
      {/* FIX 2b: Chat list na only thing wey go scroll, with ref */}
      <div ref={scrollRef} style={{position:"relative", flex:1, minHeight:0, display:"flex", flexDirection:"column", gap:10, overflowY:"auto", overscrollBehavior:"contain", padding:"0 20px 10px"}} onClick={()=>setShowMenu(false)}>
        {messages.length===0 && (<div style={{background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.25)", padding:14, borderRadius:16, maxWidth:420, margin:"0 auto", textAlign:"center"}}>Hello, I am EVA. Ask me anything.</div>)}
        {messages.map((m,i)=>(<div key={i} style={{alignSelf:m.from==="you"?"flex-end":"flex-start", background:m.from==="you"?"#8b5cf6":"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.25)", padding:"10px 14px", borderRadius:16, maxWidth:"85%", fontSize:14, lineHeight:1.5, whiteSpace:"pre-line"}}>{m.text}</div>))}
        {/* FIX 1c: Invisible marker for bottom — na this WhatsApp dey use */}
        <div ref={bottomRef} style={{height:1, flexShrink:0}} />
      </div>
      <div style={{position:"relative", padding:"12px 16px 18px", flexShrink:0}}>
        <div style={{display:"flex", gap:10, maxWidth:520, margin:"0 auto", background:"rgba(255,255,255,0.14)", border:"1px solid rgba(255,255,255,0.30)", padding:8, borderRadius:999}}>
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askEVA()} placeholder="Ask EVA..." style={{flex:1, background:"transparent", border:"none", outline:"none", color:"white", padding:"0 12px", fontSize:15}} />
          <button onClick={askEVA} style={{background:"#8b5cf6", border:"none", color:"white", padding:"10px 18px", borderRadius:999, fontWeight:"bold"}}>Ask →</button>
        </div>
      </div>
    </div>
  );
        }
