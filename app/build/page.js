"use client";
import { useState } from "react";

const SAFE_IMAGES = [
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
];

const DEFAULT_ITEMS = [
  { name: "Elegant Dress", price: "$45", img: SAFE_IMAGES[0] },
  { name: "Luxury Handbag", price: "$65", img: SAFE_IMAGES[1] },
  { name: "Stylish Shoes", price: "$55", img: SAFE_IMAGES[3] },
  { name: "Gold Jewelry Set", price: "$35", img: SAFE_IMAGES[4] },
];

function userWantsLong(prompt, changes) {
  const t = (prompt + " " + changes).toLowerCase();
  return t.includes("long") || t.includes("full detail") || t.includes("full description") || t.includes("show everything") || t.includes("show all") || t.includes("detailed") || t.includes("more details") || t.includes("don't cut") || t.includes("dont cut") || t.includes("do not cut") || t.includes("show my full") || t.includes("keep my description");
}

function makeShortTitle(prompt, aiTitle) {
  if (aiTitle && aiTitle.length <= 30 && !aiTitle.toLowerCase().includes("a luxury") && !aiTitle.toLowerCase().includes("store for")) {
    return aiTitle;
  }
  const p = prompt.toLowerCase();
  if (p.includes("new york")) return "New York Luxe";
  if (p.includes("fashion") && p.includes("women")) return "Luxe Fashion";
  if (p.includes("fashion")) return "Fashion House";
  if (p.includes("restaurant") || p.includes("food")) return "Tasty Bites";
  if (p.includes("hair") || p.includes("salon") || p.includes("beauty")) return "Beauty Lounge";
  if (p.includes("shoe")) return "Step Up Shoes";
  if (p.includes("jewelry") || p.includes("jewellery")) return "Golden Glow";
  if (p.includes("tech") || p.includes("phone")) return "Tech World";
  if (p.includes("fitness") || p.includes("gym")) return "Fit Life";
  const words = prompt.trim().split(" ").filter(w => !["a","an","the","for","my"].includes(w.toLowerCase())).slice(0,2);
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "My Store";
}

function makeSmartDesc(prompt, changes, aiDesc) {
  const wantsLong = userWantsLong(prompt, changes);
  // USER WANTS LONG = RESPECT HER, DON'T CUT
  if (wantsLong) {
    // If AI gave a good long desc, use it
    if (aiDesc && aiDesc.length > 20) return aiDesc.slice(0, 400);
    // Else use her own words as desc
    return prompt.trim().slice(0, 400);
  }
  // DEFAULT = SHORT BRAND STYLE
  if (aiDesc && aiDesc.length <= 110 && aiDesc.length > 10) return aiDesc;
  const p = prompt.toLowerCase();
  if (p.includes("new york") && p.includes("fashion")) return "Luxury fashion for modern women in New York.";
  if (p.includes("fashion") && p.includes("women")) return "Elegant fashion made for modern women.";
  if (p.includes("fashion")) return "Modern fashion, made to make you stand out.";
  if (p.includes("restaurant") || p.includes("food")) return "Delicious food, made fresh for you every day.";
  if (p.includes("hair") || p.includes("salon") || p.includes("beauty")) return "Beauty and care that makes you glow.";
  if (p.includes("shoe")) return "Stylish shoes for every step you take.";
  if (p.includes("jewelry") || p.includes("jewellery")) return "Timeless jewelry that shines with you.";
  if (p.includes("tech") || p.includes("phone")) return "Smart tech, simple prices, fast delivery.";
  if (p.includes("fitness") || p.includes("gym")) return "Train strong. Live better. Every day.";
  let first = (aiDesc || prompt).split(".")[0].trim();
  if (first.length > 90) first = first.slice(0, 87) + "...";
  return first + ".";
}

export default function Build() {
  const [prompt, setPrompt] = useState("");
  const [inspiredBy, setInspiredBy] = useState("");
  const [changes, setChanges] = useState("");
  const [mode, setMode] = useState("Website");
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(null);
  const [chat, setChat] = useState("");

  const BLOCKED = [
    "nude", "naked", "porn", "sex", "xxx", "onlyfans", "escort", "prostitut",
    "minor", "child", "kid", "teen", "school girl", "schoolgirl",
    "clone", "copy exactly", "exact copy", "replica", "pirate", "crack",
    "fake bank", "phishing", "fake login", "steal password", "fake paypal", "fake crypto", "scam", "fake shop",
    "bomb", "hack", "ddos", "fake id", "fake passport", "drugs", "how to steal", "weapon",
    "kill", "murder", "terror", "hate",
  ];

  const fixImg = (url, i) => {
    if (!url || !url.includes("http") || !url.includes("unsplash")) return SAFE_IMAGES[i % SAFE_IMAGES.length];
    return url;
  };

  const makeSmartSite = async () => {
    if (!prompt.trim()) return alert("Please describe what you want EVA to build");
    const allText = (prompt + " " + inspiredBy + " " + changes).toLowerCase();
    const found = BLOCKED.find(w => allText.includes(w));
    if (found) {
      setChat(`I cannot build that. That request is not allowed because it may involve "${found}" content. I can help you build a safe, original website instead — e.g. a fashion store, restaurant, portfolio, or business site. What would you like to build?`);
      return;
    }
    if (inspiredBy.trim() && (allText.includes("copy exactly") || allText.includes("exact copy") || allText.includes("clone"))) {
      setChat(`I cannot copy that website exactly. I can create a website inspired by its style — clean, modern, original design with your own name and content. Want me to do that?`);
      return;
    }

    setBuilding(true);
    setBuilt(null);
    setChat("");
    let fullPrompt = prompt;
    if (inspiredBy.trim()) fullPrompt += `. Make it inspired by the style of ${inspiredBy} - same feeling, layout vibe and quality, but original content, original name, original text. Do NOT copy their text, logo, or images.`;
    if (changes.trim()) fullPrompt += `. User wants these changes: ${changes}. Apply them.`;

    const wantsLong = userWantsLong(prompt, changes);
    const descInstruction = wantsLong
      ? `desc must be LONG and DETAILED, use user's own words, show full details she typed, up to 3 sentences. DO NOT shorten or cut it.`
      : `desc must be ONE SHORT sentence, max 15 words, e.g "Luxury fashion for modern women in New York." NEVER use the full user description as title or desc.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are EVA Builder, international app. User wants: "${fullPrompt}" for ${mode}. Use US DOLLARS only, e.g $25, $45. No Naira. Use pure English. Create original design only, do not copy any brand. IMPORTANT: title must be SHORT brand name, 2-3 words ONLY, e.g "New York Luxe". ${descInstruction} Return ONLY valid JSON: {"title":"New York Luxe","desc":"...","color":"#a78bfa","heroImage":"https://images.unsplash.com/photo-1445205170230-053b83016050?w=800","items":[{"name":"...","price":"$25","img":"https://images.unsplash.com/photo-1445205170230-053b83016050?w=400"}],"cta":"Shop Now","extra":"One sentence why people will love it"}`,
          history: [],
        }),
      });
      const data = await res.json();
      let text = data.reply || data.text || "";
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        let site = JSON.parse(text.slice(start, end + 1));
        site.title = makeShortTitle(prompt, site.title);
        site.desc = makeSmartDesc(prompt, changes, site.desc);
        site.heroImage = fixImg(site.heroImage, 0);
        if (!site.items || site.items.length === 0) site.items = DEFAULT_ITEMS;
        else site.items = site.items.map((it, i) => ({ name: it.name || "Product", price: it.price || "$35", img: fixImg(it.img, i) }));
        if (!site.color) site.color = "#a78bfa";
        setBuilt(site);
        setChat(site.extra || "Your website is ready. Tell me what to change.");
      } else throw new Error("no json");
    } catch (e) {
      setBuilt({
        title: makeShortTitle(prompt, ""),
        desc: makeSmartDesc(prompt, changes, ""),
        color: "#a78bfa",
        heroImage: SAFE_IMAGES[2],
        items: DEFAULT_ITEMS,
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
      <textarea value={prompt} onChange={(e)=> setPrompt(e.target.value)} placeholder="E.g. A fashion store for women in New York, luxury style, dresses $25-$80" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:16, color:"white", padding:14, fontSize:15, minHeight:80}} />
      <p style={{marginTop:18, fontWeight:"bold"}}>2. Inspired by a website? <span style={{fontWeight:"normal", opacity:0.6}}>(Optional)</span></p>
      <input value={inspiredBy} onChange={(e)=> setInspiredBy(e.target.value)} placeholder="Type a website name or link — leave empty for your own design" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13, fontSize:14}} />
      <p style={{marginTop:18, fontWeight:"bold"}}>3. What to change / remove / add? <span style={{fontWeight:"normal", opacity:0.6}}>(Optional)</span></p>
      <input value={changes} onChange={(e)=> setChanges(e.target.value)} placeholder="E.g. Show full details, long description, add WhatsApp order" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13, fontSize:14}} />
      <p style={{marginTop:14, fontSize:13, opacity:0.7}}>Tip: Want long description? Type "show full details" in box 3. Want short? Leave it empty.</p>
      <p style={{marginTop:20}}>Create</p>
      <div style={{display:"flex", gap:10}}>
        {["Website","Image","Video"].map(m=>(
          <button key={m} onClick={()=> setMode(m)} style={{flex:1, background: mode===m ? "#c084fc":"rgba(255,255,255,0.12)", border:"none", color: mode===m ? "black":"white", padding:14, borderRadius:14, fontWeight:"bold"}}>{m}</button>
        ))}
      </div>
      <button onClick={makeSmartSite} style={{width:"100%", background:"#c084fc", border:"none", color:"black", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>{building ? "EVA is building... Please wait" : `Create ${mode} →`}</button>
      {chat && <div style={{marginTop:14, background:"rgba(167,139,250,0.2)", padding:12, borderRadius:12, fontSize:14}}>💧 EVA: {chat}</div>}
      {built && (
        <div style={{marginTop:16, background:"white", color:"black", borderRadius:16, overflow:"hidden"}}>
          <img src={built.heroImage} alt="" onError={(e)=>{e.target.src = SAFE_IMAGES[2]}} style={{width:"100%", height:180, objectFit:"cover", display:"block"}} />
          <div style={{background:built.color, color:"white", padding:18}}>
            <b style={{fontSize:22}}>{built.title}</b>
            <p style={{margin:"6px 0 0", opacity:0.9, lineHeight:1.5}}>{built.desc}</p>
            {inspiredBy && <p style={{fontSize:12, marginTop:8, opacity:0.8}}>Style inspired by {inspiredBy} • Original design by EVA</p>}
          </div>
          <div style={{padding:16}}>
            {built.items?.map((it,i)=>(
              <div key={i} style={{display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #eee", alignItems:"center"}}>
                <img src={it.img} onError={(e)=>{e.target.src = SAFE_IMAGES[i % SAFE_IMAGES.length]}} alt="" style={{width:60, height:60, borderRadius:10, objectFit:"cover"}} />
                <div style={{flex:1}}><b>{it.name}</b><div style={{fontSize:13, opacity:0.6}}>Best quality • Fast delivery</div></div>
                <b style={{color:built.color}}>{it.price}</b>
              </div>
            ))}
            <button style={{width:"100%", background:built.color, border:"none", color:"white", padding:12, borderRadius:999, fontWeight:"bold", marginTop:14}}>{built.cta || "Shop Now"}</button>
            <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:10}}>Preview by EVA — You can edit this anytime</p>
          </div>
        </div>
      )}
      <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:16}}>EVA creates original designs. Copying brands, logos, or illegal content is not allowed.</p>
      <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:6}}>EVA will generate and you can edit anytime</p>
    </div>
  );
  }
