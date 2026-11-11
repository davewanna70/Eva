"use client";
import { useState } from "react";

export default function Build() {
  const [prompt, setPrompt] = useState("");
  const [inspiredBy, setInspiredBy] = useState("");
  const [changes, setChanges] = useState("");
  const [mode, setMode] = useState("Website");
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(null);
  const [chat, setChat] = useState("");

  const makeSmartSite = async () => {
    if (!prompt.trim()) return alert("Please describe what you want EVA to build");
    setBuilding(true);
    setBuilt(null);
    setChat("");

    // Build full instruction for EVA - from scratch OR inspired by
    let fullPrompt = prompt;
    if (inspiredBy.trim()) {
      fullPrompt += `. Make it inspired by the style of ${inspiredBy} - same feeling, layout vibe and quality, but original content, original name, original text. Do NOT copy their text or images.`;
    }
    if (changes.trim()) {
      fullPrompt += `. User wants these changes: ${changes}. Apply them.`;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are EVA Builder, international app. User wants: "${fullPrompt}" for ${mode}. Use US DOLLARS only, e.g $25, $45. No Naira. Use pure English.
          Return ONLY valid JSON, no extra text:
          {"title":"...","desc":"...","color":"#hex","heroImage":"https://images.unsplash.com/photo-...","items":[{"name":"...","price":"$25","img":"https://images.unsplash.com/photo-..."}],"cta":"Shop Now","extra":"One sentence why people will love it"}`,
          history: [],
        }),
      });
      const data = await res.json();
      let text = data.reply || data.text || "";
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const site = JSON.parse(text.slice(start, end + 1));
        setBuilt(site);
        setChat(site.extra || "Your website is ready. Tell me what to change.");
      } else throw new Error("no json");
    } catch (e) {
      setBuilt({
        title: prompt.slice(0, 40),
        desc: prompt + (inspiredBy ? ` Inspired by ${inspiredBy}.` : "") + (changes ? ` Changes: ${changes}` : ""),
        color: "#a78bfa",
        heroImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
        items: [
          { name: "Premium Collection", price: "$45", img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400" },
          { name: "Best Seller", price: "$35", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400" },
          { name: "New Arrival", price: "$55", img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400" },
          { name: "Limited Edition", price: "$65", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400" },
        ],
        cta: "Shop Now",
        extra: "Your website is ready with images and dollar prices."
      });
      setChat("Your website is ready. Tell me what to change.");
    }
    setBuilding(false);
  };

  return (
    <div style={{minHeight:"100dvh", background:"#030014", color:"white", padding:20, fontFamily:"sans-serif"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <b style={{fontSize:22}}>💧 EVA</b>
        <button onClick={()=> window.location.href='/'} style={{background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 14px", borderRadius:999}}>← Back to Chat</button>
      </div>

      <h1 style={{color:"#c084fc", fontSize:28, lineHeight:1.2, marginTop:30}}>What should EVA create<br/>for you today?</h1>

      <p style={{marginTop:20, fontWeight:"bold"}}>1. Describe your website</p>
      <textarea value={prompt} onChange={(e)=> setPrompt(e.target.value)}
        placeholder="E.g. A fashion store for women in New York, luxury style, dresses $25-$80"
        style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:16, color:"white", padding:14, fontSize:15, minHeight:80}}
      />

      <p style={{marginTop:18, fontWeight:"bold"}}>2. Inspired by a website? <span style={{fontWeight:"normal", opacity:0.6}}>(Optional)</span></p>
      <input value={inspiredBy} onChange={(e)=> setInspiredBy(e.target.value)}
        placeholder="E.g. bobby.com, nike.com — leave empty for your own design"
        style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13, fontSize:14}}
      />
      <div style={{display:"flex", flexWrap:"wrap", gap:8, marginTop:8}}>
        {["bobby.com","nike.com","shopify.com","airbnb.com"].map(s=>(
          <button key={s} onClick={()=> setInspiredBy(s)} style={{background: inspiredBy===s ? "#c084fc":"transparent", border:"1px solid #a78bfa", color: inspiredBy===s ? "black":"white", padding:"6px 12px", borderRadius:999, fontSize:13}}>{s}</button>
        ))}
        <button onClick={()=> setInspiredBy("")} style={{background:"transparent", border:"1px solid rgba(255,255,255,0.3)", color:"white", padding:"6px 12px", borderRadius:999, fontSize:13}}>Clear ✕</button>
      </div>

      <p style={{marginTop:18, fontWeight:"bold"}}>3. What to change / remove / add? <span style={{fontWeight:"normal", opacity:0.6}}>(Optional)</span></p>
      <input value={changes} onChange={(e)=> setChanges(e.target.value)}
        placeholder="E.g. Remove blog, change color to purple, add WhatsApp order"
        style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13, fontSize:14}}
      />

      <p style={{marginTop:14, fontSize:13, opacity:0.7}}>Tip: The more details you write, the better your website will look.</p>

      <p style={{marginTop:20}}>Create</p>
      <div style={{display:"flex", gap:10}}>
        {["Website","Image","Video"].map(m=>(
          <button key={m} onClick={()=> setMode(m)} style={{flex:1, background: mode===m ? "#c084fc":"rgba(255,255,255,0.12)", border:"none", color: mode===m ? "black":"white", padding:14, borderRadius:14, fontWeight:"bold"}}>{m}</button>
        ))}
      </div>

      <button onClick={makeSmartSite} style={{width:"100%", background:"#c084fc", border:"none", color:"black", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>
        {building ? "EVA is building... Please wait" : `Create ${mode} →`}
      </button>

      {chat && <div style={{marginTop:14, background:"rgba(167,139,250,0.2)", padding:12, borderRadius:12, fontSize:14}}>💧 EVA: {chat}</div>}

      {built && (
        <div style={{marginTop:16, background:"white", color:"black", borderRadius:16, overflow:"hidden"}}>
          {built.heroImage && <img src={built.heroImage} alt="hero" style={{width:"100%", height:180, objectFit:"cover"}} />}
          <div style={{background:built.color, color:"white", padding:18}}>
            <b style={{fontSize:22}}>{built.title}</b>
            <p style={{margin:"6px 0 0", opacity:0.9}}>{built.desc}</p>
            {inspiredBy && <p style={{fontSize:12, marginTop:8, opacity:0.8}}>Style inspired by {inspiredBy} • Original design by EVA</p>}
          </div>
          <div style={{padding:16}}>
            {built.items?.map((it,i)=>(
              <div key={i} style={{display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #eee", alignItems:"center"}}>
                {it.img && <img src={it.img} alt="" style={{width:60, height:60, borderRadius:10, objectFit:"cover"}} />}
                <div style={{flex:1}}><b>{typeof it === "string" ? it : it.name}</b><div style={{fontSize:13, opacity:0.6}}>Best quality • Fast delivery</div></div>
                <b style={{color:built.color}}>{typeof it === "string" ? "" : it.price}</b>
              </div>
            ))}
            <button style={{width:"100%", background:built.color, border:"none", color:"white", padding:12, borderRadius:999, fontWeight:"bold", marginTop:14}}>{built.cta || "Shop Now"}</button>
            <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:10}}>Preview by EVA — You can edit this anytime</p>
          </div>
        </div>
      )}

      <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:12}}>EVA will generate and you can edit anytime</p>
    </div>
  );
}
