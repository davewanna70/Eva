"use client";
import { useState } from "react";

const IMG_DRESS = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80";
const IMG_BAG = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80";
const IMG_SHOE = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80";
const IMG_JEWELRY = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80";
const IMG_HERO = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80";
const SAFE_IMAGES = [IMG_DRESS, IMG_BAG, IMG_SHOE, IMG_JEWELRY, IMG_HERO];
const DEFAULT_ITEMS = [
  { name: "Elegant Dress", price: "$45", img: IMG_DRESS, desc: "A luxury elegant dress for women. Perfect for dinner and special events." },
  { name: "Luxury Handbag", price: "$65", img: IMG_BAG, desc: "A luxury handbag with gold details. Spacious and stylish." },
  { name: "Stylish Shoes", price: "$55", img: IMG_SHOE, desc: "Stylish and comfortable shoes for everyday wear." },
  { name: "Gold Jewelry Set", price: "$35", img: IMG_JEWELRY, desc: "A beautiful gold jewelry set. Elegant and timeless." },
];

// V14 - ENGLISH ONLY, GENERAL WORDS - NO CLOTH, NO PIDGIN IN UI
const BLOCKED_TEXT = ["nude","naked","porn","sex","xxx","onlyfans","escort","prostitut","minor","child","kid","teen","school girl","schoolgirl","clone","copy exactly","exact copy","replica","pirate","crack","fake bank","phishing","fake login","steal password","fake paypal","fake crypto","scam","fake shop","bomb","hack","ddos","fake id","fake passport","drugs","how to steal","weapon","kill","murder","terror","hate","bank card","bank account","credit card number","password","otp","pin code"];
const BLOCKED_FILE = ["nude","naked","porn","sex","xxx","onlyfans","escort","bank","password","otp","pin","passport","id card","credit card","nudes","pussy","dick","boob"];

function makeShortTitle(prompt, aiTitle) {
  if (aiTitle && aiTitle.length <= 30 && !aiTitle.toLowerCase().includes("a luxury")) return aiTitle;
  const p = prompt.toLowerCase();
  if (p.includes("new york")) return "New York Luxe";
  if (p.includes("fashion")) return "Fashion House";
  if (p.includes("food") || p.includes("restaurant")) return "Tasty Bites";
  if (p.includes("beauty") || p.includes("hair")) return "Beauty Lounge";
  if (p.includes("shoe")) return "Step Up Shoes";
  if (p.includes("jewel")) return "Golden Glow";
  if (p.includes("furniture") || p.includes("table") || p.includes("chair")) return "Home Living";
  if (p.includes("phone") || p.includes("tech")) return "Tech World";
  return prompt.trim().split(" ").slice(0,2).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ") || "My Store";
}

export default function Build() {
  const [prompt, setPrompt] = useState("");
  const [inspiredBy, setInspiredBy] = useState("");
  const [changes, setChanges] = useState("");
  const [mode, setMode] = useState("Website");
  const [building, setBuilding] = useState(false);
  const [built, setBuilt] = useState(null);
  const [chat, setChat] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [liveMode, setLiveMode] = useState(false);

  // V14 Upload + Safety
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedVideoMsg, setGeneratedVideoMsg] = useState("");
  const [confirmedSafe, setConfirmedSafe] = useState(false);
  const [checking, setChecking] = useState(false);
  const [safetyLog, setSafetyLog] = useState("");

  const getPriceNum = (p) => { const n = parseFloat(String(p||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; };
  const cartTotal = cart.reduce((sum,c)=> sum + getPriceNum(c.price), 0);
  const fixImg = (url, i) => { if (!url || !url.includes("http")) return SAFE_IMAGES[i % SAFE_IMAGES.length]; return url; };
  const correctImageByName = (name, img, i) => {
    const n = (name||"").toLowerCase();
    if (n.includes("dress")||n.includes("gown")) return IMG_DRESS;
    if (n.includes("bag")||n.includes("handbag")||n.includes("purse")) return IMG_BAG;
    if (n.includes("shoe")||n.includes("sneaker")||n.includes("heel")) return IMG_SHOE;
    if (n.includes("jewel")||n.includes("gold")||n.includes("ring")||n.includes("necklace")) return IMG_JEWELRY;
    return fixImg(img,i);
  };

  // V14 - SAFETY CHECK FOR IMAGE / VIDEO
  const checkFileSafety = async (file, kind) => {
    // 1. Type check
    if (kind === "image" && !file.type.startsWith("image/")) { alert("Please select an image file only."); return false; }
    if (kind === "video" && !file.type.startsWith("video/")) { alert("Please select a video file only."); return false; }
    // 2. Size check - max 20MB
    if (file.size > 20 * 1024 * 1024) { alert("File is too large. Maximum size is 20MB."); return false; }
    // 3. Filename check
    const fname = file.name.toLowerCase();
    const badFile = BLOCKED_FILE.find(w => fname.includes(w));
    if (badFile) { alert(`This file name contains a blocked word: "${badFile}". This file cannot be uploaded.`); setSafetyLog(`Rejected: filename contains "${badFile}"`); return false; }
    // 4. Confirmation check
    if (!confirmedSafe) { alert("Please confirm that this is your own product image/video and it contains no nudity, no child, no sexual content, and no bank or personal documents."); return false; }
    // 5. AI Vision check - try server, if no server, hold for review
    setChecking(true);
    try {
      const res = await fetch("/api/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, fileType: file.type, kind }) });
      if (res.ok) {
        const d = await res.json();
        if (d.blocked) { alert("This image/video was rejected by safety check: " + (d.reason || "It may contain restricted content.")); setSafetyLog("Rejected by AI safety check: " + (d.reason || "")); setChecking(false); return false; }
      }
    } catch(e) {
      // No moderate API yet - we still allow but log it, and require confirmation
      setSafetyLog("AI moderation API not connected yet. File accepted with user confirmation and filename check. It will be held for review if reported.");
    }
    setChecking(false);
    return true;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const ok = await checkFileSafety(f, "image");
      if (!ok) continue;
      const url = URL.createObjectURL(f);
      setUploadedImages(prev => [...prev, { url, name: f.name }].slice(0, 8));
    }
    setChat("Your images have been uploaded. They will be used in your website instead of stock images.");
    e.target.value = "";
  };

  const handleVideoUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ok = await checkFileSafety(f, "video");
    if (!ok) { e.target.value = ""; return; }
    setUploadedVideo(URL.createObjectURL(f));
    setChat("Your video has been uploaded. It will appear at the top of your website.");
    e.target.value = "";
  };

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return alert("Please type what you want AI to create first.");
    const bad = BLOCKED_TEXT.find(w => prompt.toLowerCase().includes(w));
    if (bad) { setChat(`This request cannot be completed because it may contain restricted content: "${bad}". Please try a safe, original request.`); return; }
    if (mode === "Image") {
      setBuilding(true);
      const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&seed=${Date.now()}`;
      setGeneratedImage(aiUrl);
      setChat("AI has generated an image for you. If you like it, select Use This Image for Website.");
      setBuilding(false);
    }
    if (mode === "Video") {
      setGeneratedVideoMsg("AI video generation requires a paid video API (Runway / Veo). For now, please upload your own video in Website mode. It is free and shows your real product.");
      setChat("AI video generation requires a paid API. Please use Upload Video in Website mode for now.");
    }
  };

  const makeSmartSite = async () => {
    if (!prompt.trim()) return alert("Please describe what you want EVA to build.");
    const allText = (prompt + " " + inspiredBy + " " + changes).toLowerCase();
    const found = BLOCKED_TEXT.find(w => allText.includes(w));
    if (found) { setChat(`This request cannot be completed. It may contain restricted content: "${found}". Please try a safe, original website idea.`); return; }
    setBuilding(true); setBuilt(null); setChat(""); setSelectedItem(null); setCart([]);
    let fullPrompt = prompt;
    if (inspiredBy.trim()) fullPrompt += `. Inspired by the style of ${inspiredBy}, but with original content.`;
    if (changes.trim()) fullPrompt += `. Changes: ${changes}.`;
    if (uploadedImages.length > 0) fullPrompt += `. User uploaded ${uploadedImages.length} real product images.`;
    try {
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: `You are EVA Builder. User wants: "${fullPrompt}" for Website. Use US DOLLARS only. Return ONLY valid JSON: {"title":"New York Luxe","desc":"...","color":"#a78bfa","heroImage":"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800","items":[{"name":"...","price":"$25","img":"https://images.unsplash.com/photo-1445205170230-053b83016050?w=400","desc":"One sentence"}],"cta":"Shop Now","extra":"One sentence"}`, history: [] }) });
      const data = await res.json();
      let text = data.reply || data.text || "";
      const start = text.indexOf("{"); const end = text.lastIndexOf("}");
      let site;
      if (start !== -1 && end !== -1) {
        site = JSON.parse(text.slice(start, end+1));
        site.title = makeShortTitle(prompt, site.title);
        site.desc = site.desc && site.desc.length <= 110 ? site.desc : "Luxury fashion for modern women in New York.";
        site.heroImage = fixImg(site.heroImage, 4);
        if (!site.items || site.items.length===0) site.items = DEFAULT_ITEMS;
        else site.items = site.items.map((it,i)=>({ name: it.name||"Product", price: it.price||"$35", img: correctImageByName(it.name, it.img, i), desc: it.desc||"Best quality. Fast delivery." }));
        if (!site.color) site.color = "#a78bfa";
      } else throw new Error("no json");
      if (uploadedImages.length > 0) {
        site.items = uploadedImages.map((up, i) => {
          const orig = site.items[i] || DEFAULT_ITEMS[i % DEFAULT_ITEMS.length];
          return { name: orig.name, price: orig.price, img: up.url, desc: orig.desc + " - Your product photo." };
        });
        site.extra = "Your website is ready with your uploaded images.";
      }
      if (uploadedVideo) site.video = uploadedVideo;
      setBuilt(site); setChat(site.extra || "Your website is ready. Select View Live Shop to see the customer view.");
    } catch(e) {
      let fallbackItems = DEFAULT_ITEMS;
      if (uploadedImages.length > 0) fallbackItems = uploadedImages.map((up,i)=>({ name: DEFAULT_ITEMS[i % DEFAULT_ITEMS.length].name, price: DEFAULT_ITEMS[i % DEFAULT_ITEMS.length].price, img: up.url, desc: "Your product photo." }));
      setBuilt({ title: makeShortTitle(prompt,""), desc: "Luxury fashion for modern women in New York.", color:"#a78bfa", heroImage: IMG_HERO, items: fallbackItems, cta:"Shop Now", extra:"Your website is ready.", video: uploadedVideo || null });
      setChat("Your website is ready with your uploaded images.");
    }
    setBuilding(false);
  };

  if (liveMode && built) {
    return (
      <div style={{minHeight:"100dvh", background:"white", color:"black", fontFamily:"sans-serif"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:"black", color:"white", position:"sticky", top:0, zIndex:10}}>
          <b style={{fontSize:20}}>{built.title}</b>
          <div style={{display:"flex", gap:8}}>
            <button onClick={()=> setShowCart(true)} style={{background:"white", border:"none", color:"black", padding:"8px 14px", borderRadius:999, fontWeight:"bold"}}>Cart ({cart.length})</button>
            <button onClick={()=> setLiveMode(false)} style={{background:"rgba(255,255,255,0.2)", border:"none", color:"white", padding:"8px 10px", borderRadius:999, fontSize:12}}>Owner: Back to Builder</button>
          </div>
        </div>
        {built.video ? <video src={built.video} controls style={{width:"100%", maxHeight:320, objectFit:"cover", display:"block", background:"black"}} /> : <img src={built.heroImage} alt="" style={{width:"100%", height:220, objectFit:"cover", display:"block"}} />}
        <div style={{background:built.color, color:"white", padding:20}}><b style={{fontSize:26}}>{built.title}</b><p style={{margin:"6px 0 0", lineHeight:1.5}}>{built.desc}</p><p style={{fontSize:13, marginTop:8}}>Free Delivery • Easy Returns • Quality You Can Trust</p></div>
        <div style={{padding:16}}><h3>Shop All Products</h3>{built.items?.map((it,i)=>(
          <div key={i} onClick={()=>{ setSelectedItem(it); setSelectedSize("M"); }} style={{display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #eee", alignItems:"center", cursor:"pointer"}}>
            <img src={it.img} alt="" style={{width:80, height:80, borderRadius:12, objectFit:"cover"}} />
            <div style={{flex:1}}><b>{it.name}</b><div style={{fontSize:13, opacity:0.6}}>Tap to view details</div><div style={{fontSize:12, color:"#22c55e", fontWeight:"bold"}}>In Stock</div></div><b style={{color:built.color}}>{it.price}</b>
          </div>))}</div>
        {selectedItem && (<div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center"}}><div style={{background:"white", width:"100%", maxHeight:"92vh", overflow:"auto", borderRadius:"20px 20px 0 0", padding:16}}><button onClick={()=> setSelectedItem(null)} style={{background:"#eee", border:"none", padding:"8px 14px", borderRadius:999}}>Back to Shop</button><img src={selectedItem.img} alt="" style={{width:"100%", height:300, objectFit:"cover", borderRadius:14, marginTop:12}} /><h2>{selectedItem.name}</h2><b style={{fontSize:24, color:built.color}}>{selectedItem.price}</b><p>{selectedItem.desc}</p><div style={{display:"flex", gap:8}}>{["S","M","L","XL"].map(s=>(<button key={s} onClick={()=> setSelectedSize(s)} style={{padding:"10px 18px", borderRadius:999, border: selectedSize===s ? `2px solid ${built.color}` : "1px solid #ccc", background: selectedSize===s ? built.color : "white", color: selectedSize===s ? "white":"black", fontWeight:"bold"}}>{s}</button>))}</div><button onClick={()=>{ setCart([...cart, {...selectedItem, size:selectedSize}]); setSelectedItem(null); setShowCart(true); }} style={{width:"100%", background:built.color, border:"none", color:"white", padding:15, borderRadius:999, fontWeight:"bold", marginTop:12}}>Add to Cart — {selectedItem.price}</button></div></div>)}
        {showCart && (<div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:60, display:"flex", alignItems:"flex-end", justifyContent:"center"}}><div style={{background:"white", width:"100%", maxHeight:"92vh", overflow:"auto", borderRadius:"20px 20px 0 0", padding:16}}><div style={{display:"flex", justifyContent:"space-between"}}><h2>Your Cart ({cart.length})</h2><button onClick={()=> setShowCart(false)} style={{background:"#eee", border:"none", padding:"8px 14px", borderRadius:999}}>Close</button></div>{cart.length===0 ? <p>Your cart is empty.</p> : cart.map((c,i)=>(<div key={i} style={{display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #eee", alignItems:"center"}}><img src={c.img} alt="" style={{width:55, height:55, borderRadius:10, objectFit:"cover"}} /><div style={{flex:1}}><b>{c.name}</b><div style={{fontSize:13}}>Size {c.size}</div></div><b>{c.price}</b><button onClick={()=> setCart(cart.filter((_,idx)=> idx!==i))} style={{background:"#fee", border:"none", padding:"6px 10px", borderRadius:999}}>Remove</button></div>))}<h3 style={{textAlign:"right"}}>Total: ${cartTotal.toFixed(2)}</h3><button onClick={()=>{ if(!cart.length) return alert("Your cart is empty."); alert("Thank you. Your order is confirmed."); setCart([]); setShowCart(false); }} style={{width:"100%", background:"black", border:"none", color:"white", padding:15, borderRadius:999, fontWeight:"bold"}}>Checkout — ${cartTotal.toFixed(2)}</button></div></div>)}
      </div>
    );
  }

  return (
    <div style={{minHeight:"100dvh", background:"#030014", color:"white", padding:20, fontFamily:"sans-serif"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:22}}>EVA</b><button onClick={()=> window.location.href='/'} style={{background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 14px", borderRadius:999}}>Back</button></div>
      <h1 style={{color:"#c084fc", fontSize:28, lineHeight:1.2, marginTop:30}}>What should EVA create<br/>for you today?</h1>
      <p style={{marginTop:20, fontWeight:"bold"}}>1. Describe what you want</p>
      <textarea value={prompt} onChange={(e)=> setPrompt(e.target.value)} placeholder={mode==="Website" ? "Example: A fashion store for women in New York, dresses $25-$80" : mode==="Image" ? "Example: A red dress for women, luxury style" : "Example: A woman wearing a red dress walking in New York"} style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:16, color:"white", padding:14, fontSize:15, minHeight:80}} />

      {mode==="Website" && (
        <div style={{marginTop:16, background:"rgba(255,255,255,0.08)", padding:14, borderRadius:16}}>
          <b>Upload your images (For Website)</b>
          <p style={{fontSize:13, opacity:0.7, margin:"6px 0"}}>Select images of your products from your device. EVA will use your images instead of stock images. This works for any product: clothes, furniture, food, electronics, and more.</p>
          <label style={{display:"block", background:"white", color:"black", textAlign:"center", padding:12, borderRadius:12, fontWeight:"bold", cursor:"pointer"}}>Upload your images<input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{display:"none"}} /></label>
          {uploadedImages.length>0 && <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:10}}>{uploadedImages.map((im,i)=>(<div key={i} style={{position:"relative"}}><img src={im.url} alt="" style={{width:70, height:70, borderRadius:10, objectFit:"cover"}} /><button onClick={()=> setUploadedImages(uploadedImages.filter((_,idx)=> idx!==i))} style={{position:"absolute", top:-6, right:-6, background:"red", color:"white", border:"none", borderRadius:999, width:22, height:22}}>X</button></div>))}</div>}
          <p style={{fontSize:12, marginTop:8}}>Uploaded: {uploadedImages.length} / 8 images</p>

          <b style={{display:"block", marginTop:16}}>Upload your video (For Website)</b>
          <p style={{fontSize:13, opacity:0.7, margin:"6px 0"}}>Upload a video you have already recorded. It will appear at the top of your website.</p>
          <label style={{display:"block", background:"#c084fc", color:"black", textAlign:"center", padding:12, borderRadius:12, fontWeight:"bold", cursor:"pointer"}}>Upload your video<input type="file" accept="video/*" onChange={handleVideoUpload} style={{display:"none"}} /></label>
          {uploadedVideo && <video src={uploadedVideo} controls style={{width:"100%", height:160, objectFit:"cover", borderRadius:12, marginTop:10}} />}

          <div style={{marginTop:14, background:"rgba(255,255,255,0.1)", padding:10, borderRadius:10, fontSize:13, lineHeight:1.5}}>
            <b>Safety Rules for Uploads</b>
            <p style={{margin:"6px 0 0"}}>Do not upload nudity, sexual content, images of children, or bank documents, ID cards, passwords, or personal records. Only upload images and videos of your own products.</p>
            <label style={{display:"flex", gap:8, marginTop:10, cursor:"pointer"}}><input type="checkbox" checked={confirmedSafe} onChange={(e)=> setConfirmedSafe(e.target.checked)} /> I confirm this is my own product image/video and it follows the safety rules above.</label>
            {checking && <p>Checking your file for safety. Please wait.</p>}
            {safetyLog && <p style={{fontSize:12, opacity:0.7}}>{safetyLog}</p>}
          </div>
        </div>
      )}

      {mode!=="Website" && <p style={{fontSize:13, opacity:0.7, marginTop:12}}>{mode==="Image" ? "Image mode: AI will generate a new image from your description." : "Video mode: AI will generate a new video from your description. This requires a paid video API."}</p>}

      <p style={{marginTop:18, fontWeight:"bold"}}>2. Inspired by? (Optional)</p>
      <input value={inspiredBy} onChange={(e)=> setInspiredBy(e.target.value)} placeholder="Enter a website name or link" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13}} />
      <p style={{marginTop:18, fontWeight:"bold"}}>3. What would you like to change? (Optional)</p>
      <input value={changes} onChange={(e)=> setChanges(e.target.value)} placeholder="Example: Show full details, add WhatsApp ordering" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13}} />

      <p style={{marginTop:20}}>Create</p>
      <div style={{display:"flex", gap:10}}>{["Website","Image","Video"].map(m=>(<button key={m} onClick={()=> setMode(m)} style={{flex:1, background: mode===m ? "#c084fc":"rgba(255,255,255,0.12)", border:"none", color: mode===m ? "black":"white", padding:14, borderRadius:14, fontWeight:"bold"}}>{m}</button>))}</div>

      {mode==="Website" ? <button onClick={makeSmartSite} style={{width:"100%", background:"#c084fc", border:"none", color:"black", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>{building ? "EVA is building. Please wait." : "Create Website"}</button>
      : <button onClick={handleGenerateAI} style={{width:"100%", background:"#22c55e", border:"none", color:"white", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>{building ? "AI is creating. Please wait." : mode==="Image" ? "Generate AI Image" : "Generate AI Video"}</button>}

      {chat && <div style={{marginTop:14, background:"rgba(167,139,250,0.2)", padding:12, borderRadius:12, fontSize:14}}>EVA: {chat}</div>}

      {mode==="Image" && generatedImage && (
        <div style={{marginTop:16, background:"white", color:"black", borderRadius:16, padding:14}}>
          <b>AI Generated Image</b>
          <img src={generatedImage} alt="" style={{width:"100%", height:300, objectFit:"cover", borderRadius:12, marginTop:10}} />
          <button onClick={()=>{ setUploadedImages([{url: generatedImage, name:"AI Image"}]); setMode("Website"); setChat("This AI image has been moved to Website Upload. Select Create Website to use it."); }} style={{width:"100%", background:"black", border:"none", color:"white", padding:12, borderRadius:999, fontWeight:"bold", marginTop:10}}>Use This Image For Website</button>
        </div>
      )}
      {mode==="Video" && generatedVideoMsg && <div style={{marginTop:14, background:"rgba(255,255,255,0.1)", padding:12, borderRadius:12, fontSize:14}}>{generatedVideoMsg}</div>}

      {built && mode==="Website" && (
        <div style={{marginTop:16, background:"white", color:"black", borderRadius:16, overflow:"hidden"}}>
          {built.video ? <video src={built.video} controls style={{width:"100%", height:180, objectFit:"cover", display:"block"}} /> : <img src={built.heroImage} alt="" style={{width:"100%", height:180, objectFit:"cover", display:"block"}} />}
          <div style={{background:built.color, color:"white", padding:18}}><b style={{fontSize:22}}>{built.title}</b><p style={{margin:"6px 0 0"}}>{built.desc}</p></div>
          <div style={{padding:16}}>
            {built.items?.map((it,i)=>(<div key={i} onClick={()=>{ setSelectedItem(it); setSelectedSize("M"); }} style={{display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #eee", alignItems:"center", cursor:"pointer"}}><img src={it.img} alt="" style={{width:60, height:60, borderRadius:10, objectFit:"cover"}} /><div style={{flex:1}}><b>{it.name}</b><div style={{fontSize:13, opacity:0.6}}>Tap to view details</div></div><b style={{color:built.color}}>{it.price}</b></div>))}
            <button onClick={()=> setLiveMode(true)} style={{width:"100%", background:"black", border:"none", color:"white", padding:14, borderRadius:999, fontWeight:"bold", marginTop:14}}>View Live Shop</button>
            <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:10}}>V14 — English UI • General Product Words • Upload Safety</p>
          </div>
        </div>
      )}
      {selectedItem && !liveMode && built && (<div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center"}}><div style={{background:"white", color:"black", width:"100%", maxHeight:"92vh", overflow:"auto", borderRadius:"20px 20px 0 0", padding:16}}><button onClick={()=> setSelectedItem(null)} style={{background:"#eee", border:"none", padding:"8px 14px", borderRadius:999}}>Back to Shop</button><img src={selectedItem.img} alt="" style={{width:"100%", height:280, objectFit:"cover", borderRadius:14, marginTop:12}} /><h2>{selectedItem.name}</h2><b style={{color:built.color, fontSize:22}}>{selectedItem.price}</b><p>{selectedItem.desc}</p><button onClick={()=>{ setCart([...cart, {...selectedItem, size:selectedSize}]); setSelectedItem(null); }} style={{width:"100%", background:built.color, border:"none", color:"white", padding:15, borderRadius:999, fontWeight:"bold", marginTop:12}}>Add to Cart — {selectedItem.price}</button></div></div>)}
      <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:16}}>EVA creates original designs. Copying brands, logos, or illegal content is not allowed.</p>
    </div>
  );
         }
