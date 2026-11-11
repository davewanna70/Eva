"use client";
import { useState } from "react";

export default function Build() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("Website");
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(null);

  const makeSite = () => {
    if (!prompt.trim()) return alert("Tell EVA wetin to build first");
    setBuilding(true);
    setTimeout(() => {
      const p = prompt.toLowerCase();
      let title = "My New Website";
      let desc = prompt;
      let color = "#a78bfa";
      let items = ["Welcome to my site", "About Us", "Our Services", "Contact Us"];

      if (p.includes("fashion")) { title = "ZEE Fashion Store"; desc = "Fresh styles, affordable prices. Shop the latest drops."; color = "#ec4899"; items = ["New Arrivals - ₦15,000", "Dresses - ₦12,000", "Shoes - ₦20,000", "Order on WhatsApp"]; }
      if (p.includes("restaurant") || p.includes("food")) { title = "Bella Food House"; desc = "Authentic food, fresh daily. Order now."; color = "#f59e0b"; items = ["Jollof Rice - ₦3,500", "Pounded Yam - ₦4,000", "Pepper Soup - ₦2,500", "Book a Table"]; }
      if (p.includes("church")) { title = "Grace Chapel"; desc = "Join us every Sunday 9AM. You are welcome."; color = "#22c55e"; items = ["Sunday Service - 9AM", "Midweek - Wed 5PM", "Youth Meeting - Sat 4PM", "Watch Online"]; }
      if (p.includes("portfolio")) { title = "My Portfolio"; desc = "I build beautiful things. See my work."; color = "#06b6d4"; items = ["My Projects", "My Skills", "My Experience", "Hire Me"]; }

      setBuilt({ title, desc, color, items });
      setBuilding(false);
    }, 1200);
  };

  return (
    <div style={{minHeight:"100dvh", background:"#030014", color:"white", padding:20, fontFamily:"sans-serif"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <b style={{fontSize:22}}>💧 EVA</b>
        <button onClick={()=> window.location.href='/'} style={{background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 14px", borderRadius:999}}>← Back to Chat</button>
      </div>

      <h1 style={{color:"#c084fc", fontSize:28, lineHeight:1.2, marginTop:30}}>
        What should EVA create<br/>for you today?
      </h1>

      <textarea value={prompt} onChange={(e)=> setPrompt(e.target.value)}
        placeholder="Describe your website, shop, or idea..."
        style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:16, color:"white", padding:14, fontSize:15, minHeight:80, marginTop:16}}
      />

      <p style={{marginTop:20, opacity:0.8}}>Suggestions</p>
      <div style={{display:"flex", flexWrap:"wrap", gap:10}}>
        {["Fashion store","Restaurant","Portfolio","Church site"].map(i=>(
          <button key={i} onClick={()=> setPrompt(`Build me a ${i.toLowerCase()} website`)} style={{background:"transparent", border:"1px solid #a78bfa", color:"white", padding:"8px 14px", borderRadius:999}}>{i}</button>
        ))}
      </div>

      <p style={{marginTop:24}}>Create</p>
      <div style={{display:"flex", gap:10}}>
        {["Website","Image","Video"].map(m=>(
          <button key={m} onClick={()=> setMode(m)} style={{flex:1, background: mode===m ? "#c084fc":"rgba(255,255,255,0.12)", border:"none", color: mode===m ? "black":"white", padding:14, borderRadius:14, fontWeight:"bold"}}>{m}</button>
        ))}
      </div>

      <button onClick={makeSite} style={{width:"100%", background:"#c084fc", border:"none", color:"black", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>
        {building ? "EVA dey build... ⏳" : `Create ${mode} →`}
      </button>

      {built && (
        <div style={{marginTop:24, background:"white", color:"black", borderRadius:16, overflow:"hidden"}}>
          <div style={{background:built.color, color:"white", padding:18}}>
            <b style={{fontSize:22}}>{built.title}</b>
            <p style={{margin:"6px 0 0", opacity:0.9}}>{built.desc}</p>
          </div>
          <div style={{padding:16}}>
            {built.items.map((it,i)=>(
              <div key={i} style={{padding:"12px 0", borderBottom:"1px solid #eee", display:"flex", justifyContent:"space-between"}}><span>{it}</span><span>→</span></div>
            ))}
            <button style={{width:"100%", background:built.color, border:"none", color:"white", padding:12, borderRadius:999, fontWeight:"bold", marginTop:14}}>Contact / Order Now</button>
            <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:10}}>Preview by EVA — you fit edit this later</p>
          </div>
        </div>
      )}

      <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:12}}>EVA will generate and you can edit anytime</p>
    </div>
  );
          }
