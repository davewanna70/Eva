"use client";
import { useState, useRef } from "react";

// V15.8 - PICTURE FIX: No more Pollinations (it shows "Free limit reached" yellow card).
// Use stable Pexels pictures - 4 DIFFERENT pictures, plus clean fallback if any fail.
const IMG_DRESS = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80";
const IMG_BAG = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80";
const IMG_SHOE = "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80";
const IMG_JEWELRY = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80";
const IMG_HERO = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80";

// Pexels - stable, no free-limit, each one different
const IMG_BRA = "https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=800";
const IMG_PANT = "https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?auto=compress&cs=tinysrgb&w=800";
const IMG_BIKINI = "https://images.pexels.com/photos/1533649/pexels-photo-1533649.jpeg?auto=compress&cs=tinysrgb&w=800";
const IMG_SWIM = "https://images.pexels.com/photos/1316484/pexels-photo-1316484.jpeg?auto=compress&cs=tinysrgb&w=800";
const IMG_LINGERIE_HERO = "https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=800";

const SAFE_IMAGES = [IMG_DRESS, IMG_BAG, IMG_SHOE, IMG_JEWELRY, IMG_HERO];
const DEFAULT_ITEMS = [
  { name: "Elegant Dress", price: "$45", img: IMG_DRESS, desc: "A luxury elegant dress for women. Perfect for dinner and special events." },
  { name: "Luxury Handbag", price: "$65", img: IMG_BAG, desc: "A luxury handbag with gold details. Spacious and stylish." },
  { name: "Stylish Shoes", price: "$55", img: IMG_SHOE, desc: "Stylish and comfortable shoes for everyday wear." },
  { name: "Gold Jewelry Set", price: "$35", img: IMG_JEWELRY, desc: "A beautiful gold jewelry set. Elegant and timeless." },
];
const LINGERIE_ITEMS = [
  { name: "Lace Bra Set", price: "$25", img: IMG_BRA, desc: "Comfortable lace bra set for women. Soft, breathable, and elegant." },
  { name: "Cotton Pant - 3 Pack", price: "$22", img: IMG_PANT, desc: "Soft cotton pant, pack of 3. Comfortable for everyday wear." },
  { name: "Bikini Set", price: "$28", img: IMG_BIKINI, desc: "Stylish bikini set for women. Perfect for beach and swimming." },
  { name: "Swimwear One Piece", price: "$30", img: IMG_SWIM, desc: "Elegant one-piece swimwear for ladies. Comfortable and stylish." },
];

const BLOCKED_TEXT = ["nude","naked","porn","xxx","onlyfans","escort","prostitut","child porn","kid nude","sex with minor","minor sex","school girl","schoolgirl","clone","copy exactly","exact copy","replica","pirate","crack","fake bank","phishing","fake login","steal password","fake paypal","fake crypto","scam","fake shop","bomb","hack","ddos","fake id","fake passport","drugs","how to steal","weapon","kill","murder","terror","hate","bank card","bank account","credit card number","password","otp","pin code"];
const BLOCKED_CHILD_MODEL = ["child","kid","pikin","teen","minor","baby","toddler","school"];
const BLOCKED_FILE = ["nude","naked","porn","xxx","onlyfans","escort","bank","password","otp","pin","passport","id card","credit card","nudes"];
const BLOCKED_OCR = ["bank","account number","credit card","debit card","password","otp","pin code","passport","national id","id card","sort code","routing number","iban","swift"];
const LINGERIE_WORDS = ["underwear","pikini","pant","bra","lingerie","bikini","swimwear","swimsuit","panties","boxer","brief"];

// V15.8 - WHATSAPP: From FIRST BOX only, as you said
function extractWhatsApp(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/[\s\-\(\)]/g,"");
  const m = cleaned.match(/(\+?234\d{10}|0\d{10})/);
  if (!m) return null;
  let raw = m[1];
  let wa = raw;
  if (wa.startsWith("0")) wa = "234" + wa.slice(1);
  if (wa.startsWith("+")) wa = wa.slice(1);
  return { display: raw, waLink: `https://wa.me/${wa}?text=${encodeURIComponent("Hello, I want to order from your store")}` };
}
function maskNumber(display) {
  if (!display || display.length < 7) return display;
  return display.slice(0,4) + "***" + display.slice(-3);
}
function parsePriceRange(text) {
  const t = (text||"").toLowerCase().replace("prize","price");
  const m = t.match(/\$?\s*(\d+)\s*(?:to|-)\s*\$?\s*(\d+)/);
  if (m) { let min = parseInt(m[1]); let max = parseInt(m[2]); if (min > max) [min,max]=[max,min]; return { min, max }; }
  return null;
}
function applyPriceRange(items, range) {
  if (!range) return items;
  const { min, max } = range;
  const step = items.length > 1 ? (max - min) / (items.length - 1) : 0;
  return items.map((it, i) => {
    let p = Math.round(min + step * i);
    if (i === items.length-1) p = max;
    if (i === 0) p = min + Math.round(step*0.3);
    return { ...it, price: `$${p}` };
  });
}
function getDefaultForPrompt(prompt) {
  const p = (prompt||"").toLowerCase();
  if (LINGERIE_WORDS.some(w => p.includes(w))) return LINGERIE_ITEMS;
  return DEFAULT_ITEMS;
}
function getHeroForPrompt(prompt) {
  const p = (prompt||"").toLowerCase();
  if (LINGERIE_WORDS.some(w => p.includes(w))) return IMG_LINGERIE_HERO;
  return IMG_HERO;
}
function makeShortTitle(prompt, aiTitle) {
  if (aiTitle && aiTitle.length <= 30 && !aiTitle.toLowerCase().includes("a luxury") && !aiTitle.toLowerCase().startsWith("create")) return aiTitle;
  const stop = ["create","make","build","give","me","a","an","the","for","please","i","want","need","with","website","store","shop","online","whatsapp","contact","number","price","tag","from","to","my"];
  const words = (prompt||"").replace(/[^a-zA-Z0-9 $]/g,"").split(/\s+/).filter(w => w && !stop.includes(w.toLowerCase()) && !w.includes("$") && isNaN(parseInt(w)) && !w.startsWith("090") && !w.startsWith("080") && w.length > 1);
  if (words.length >= 2) return words.slice(0,2).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
  if (words.length === 1) return words[0].charAt(0).toUpperCase()+words[0].slice(1) + " Store";
  return "My Store";
}
// V15.8 - Clean fallback color per product, if image ever fails (no more yellow "Free limit" card)
function fallbackColor(name) {
  const n = (name||"").toLowerCase();
  if (n.includes("bra")) return "#fbcfe8";
  if (n.includes("pant")) return "#ddd6fe";
  if (n.includes("bikini")) return "#fecaca";
  if (n.includes("swim")) return "#bfdbfe";
  return "#e5e7eb";
}
function fallbackEmoji(name) {
  const n = (name||"").toLowerCase();
  if (n.includes("bra")) return "👙";
  if (n.includes("pant")) return "🩲";
  if (n.includes("bikini")) return "👙";
  if (n.includes("swim")) return "🏊‍♀️";
  return "🛍️";
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script"); s.src = src; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });
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
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedVideoMsg, setGeneratedVideoMsg] = useState("");
  const [confirmedSafe, setConfirmedSafe] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkStatus, setCheckStatus] = useState("");
  const [showSafety, setShowSafety] = useState(false);
  const [failedImgs, setFailedImgs] = useState({});
  const modelRef = useRef(null);

  const getPriceNum = (p) => { const n = parseFloat(String(p||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; };
  const cartTotal = cart.reduce((sum,c)=> sum + getPriceNum(c.price), 0);
  const fixImg = (url, i) => { if (!url || !url.includes("http") || url.includes("pollinations")) return SAFE_IMAGES[i % SAFE_IMAGES.length]; return url; };
  const correctImageByName = (name, img, i) => {
    const n = (name||"").toLowerCase();
    // V15.8 - NEVER use Pollinations, NEVER use beach/car. Always Pexels product photo.
    if (n.includes("bra")) return IMG_BRA;
    if (n.includes("pant") || n.includes("underwear") || n.includes("brief") || n.includes("boxer")) return IMG_PANT;
    if (n.includes("bikini")) return IMG_BIKINI;
    if (n.includes("swim")) return IMG_SWIM;
    if (n.includes("lingerie")) return IMG_BRA;
    if (n.includes("dress")||n.includes("gown")) return IMG_DRESS;
    if (n.includes("bag")||n.includes("handbag")||n.includes("purse")) return IMG_BAG;
    if (n.includes("shoe")||n.includes("sneaker")||n.includes("heel")) return IMG_SHOE;
    if (n.includes("jewel")||n.includes("gold")||n.includes("ring")||n.includes("necklace")) return IMG_JEWELRY;
    return fixImg(img,i);
  };
  const handleImgError = (e, name, key) => {
    // If Pexels fails, hide img and show clean colour box instead - no yellow card
    if (key) setFailedImgs(prev => ({...prev, [key]: true}));
    e.target.style.display = "none";
  };
  // Small component for product image with clean fallback
  const ProductImg = ({ item, idx, size }) => {
    const key = `${item.name}-${idx}`;
    const isFailed = failedImgs[key];
    const w = size === "large" ? "100%" : size === "small" ? 60 : 80;
    const h = size === "large" ? 300 : size === "small" ? 60 : 80;
    if (isFailed) {
      return <div style={{width:w, height:h, minWidth:w, background:fallbackColor(item.name), borderRadius: size==="large"?14:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize: size==="large"?64:28, flexShrink:0}}>{fallbackEmoji(item.name)}</div>;
    }
    return <img src={item.img} alt={item.name} onError={(e)=>handleImgError(e,item.name,key)} style={{width:w, height:h, minWidth:w, borderRadius: size==="large"?14:12, objectFit:"cover", flexShrink:0}} />;
  };

  const loadNSFWModel = async () => {
    if (modelRef.current) return modelRef.current;
    setCheckStatus("Loading safety AI model. Please wait...");
    await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js");
    await loadScript("https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js");
    const model = await window.nsfwjs.load(); modelRef.current = model; return model;
  };
  const isNSFWPrediction = (preds) => {
    const get = (name) => { const p = preds.find(x => x.className === name); return p ? p.probability : 0; };
    const porn = get("Porn"); const hentai = get("Hentai");
    if (porn > 0.70 || hentai > 0.70) return { blocked: true, reason: `Porn ${Math.round(porn*100)}% / Hentai ${Math.round(hentai*100)}%` };
    return { blocked: false, reason: "" };
  };
  const checkImageWithAI = async (imgUrl) => {
    try { const model = await loadNSFWModel(); const img = new Image(); img.crossOrigin = "anonymous"; img.src = imgUrl; await new Promise((res, rej) => { img.onload = res; img.onerror = rej; }); const preds = await model.classify(img); return isNSFWPrediction(preds); } catch(e) { return { blocked: false, reason: "" }; }
  };
  const checkVideoWithAI = async (videoUrl) => {
    try {
      const model = await loadNSFWModel(); const video = document.createElement("video"); video.src = videoUrl; video.muted = true; video.playsInline = true;
      await new Promise((res) => { video.onloadedmetadata = res; }); const duration = video.duration || 3; const times = [0.5, duration/2, Math.max(0.5, duration - 0.5)];
      for (let t of times) { video.currentTime = Math.min(t, duration - 0.1); await new Promise((res) => { video.onseeked = res; setTimeout(res, 500); }); const canvas = document.createElement("canvas"); canvas.width = video.videoWidth || 400; canvas.height = video.videoHeight || 400; const ctx = canvas.getContext("2d"); ctx.drawImage(video, 0, 0, canvas.width, canvas.height); const img = new Image(); img.src = canvas.toDataURL("image/jpeg", 0.8); await new Promise((res) => { img.onload = res; }); const preds = await model.classify(img); const result = isNSFWPrediction(preds); if (result.blocked) return result; }
      return { blocked: false, reason: "" };
    } catch(e) { return { blocked: false, reason: "" }; }
  };
  const checkTextWithOCR = async (imgUrl) => {
    try { await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"); const worker = await window.Tesseract.createWorker("eng"); const ret = await worker.recognize(imgUrl); await worker.terminate(); const text = (ret.data.text || "").toLowerCase(); const found = BLOCKED_OCR.find(w => text.includes(w)); if (found) return { blocked: true, reason: `Document text detected: "${found}"` }; return { blocked: false, reason: "" }; } catch(e) { return { blocked: false, reason: "" }; }
  };
  const isChildModelRequest = (text) => { const t = (text||"").toLowerCase(); const hasChild = BLOCKED_CHILD_MODEL.some(w => t.includes(w)); const hasUnderwear = LINGERIE_WORDS.some(w => t.includes(w)) || t.includes("model") || t.includes("showroom") || t.includes("wearing"); return hasChild && hasUnderwear; };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      if (!f.type.startsWith("image/")) { alert("Please select an image file only."); continue; }
      if (f.size > 20*1024*1024) { alert("File is too large. Maximum size is 20MB."); continue; }
      const fname = f.name.toLowerCase(); const badFile = BLOCKED_FILE.find(w => fname.includes(w));
      if (badFile) { alert(`This file cannot be uploaded. File name contains a blocked word: "${badFile}".`); continue; }
      if (!confirmedSafe) { alert("Please confirm that this is your own product image and it follows the safety rules."); continue; }
      const url = URL.createObjectURL(f); setChecking(true); setCheckStatus("Checking your image. Please wait...");
      const ai = await checkImageWithAI(url); if (ai.blocked) { setChecking(false); setCheckStatus(""); alert(`This image was rejected by safety check. Reason: ${ai.reason}. Please upload a clean product image.`); URL.revokeObjectURL(url); continue; }
      const ocr = await checkTextWithOCR(url); if (ocr.blocked) { setChecking(false); setCheckStatus(""); alert(`This image was rejected. Reason: ${ocr.reason}. Do not upload bank documents or personal records.`); URL.revokeObjectURL(url); continue; }
      setUploadedImages(prev => [...prev, { url, name: f.name }]); setCheckStatus("Image approved."); setChat("Your image passed the safety check and has been uploaded.");
    }
    setChecking(false); e.target.value = "";
  };
  const handleVideoUpload = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith("video/")) { alert("Please select a video file only."); e.target.value=""; return; }
    if (f.size > 20*1024*1024) { alert("File is too large. Maximum size is 20MB."); e.target.value=""; return; }
    const fname = f.name.toLowerCase(); const badFile = BLOCKED_FILE.find(w => fname.includes(w));
    if (badFile) { alert(`This file cannot be uploaded. File name contains a blocked word: "${badFile}".`); e.target.value=""; return; }
    if (!confirmedSafe) { alert("Please confirm that this is your own product video and it follows the safety rules."); e.target.value=""; return; }
    const url = URL.createObjectURL(f); setChecking(true); setCheckStatus("Checking your video. AI is checking 3 frames. Please wait...");
    const ai = await checkVideoWithAI(url); if (ai.blocked) { setChecking(false); setCheckStatus(""); alert(`This video was rejected by safety check. Reason: ${ai.reason}. Please upload a clean product video.`); URL.revokeObjectURL(url); e.target.value=""; return; }
    setUploadedVideo(url); setChecking(false); setCheckStatus("Video approved."); setChat("Your video passed the safety check and has been uploaded."); e.target.value = "";
  };
  const handleGenerateAI = async () => {
    if (!prompt.trim()) return alert("Please type what you want AI to create first.");
    if (isChildModelRequest(prompt)) { setChat("This request cannot be completed. Children cannot be used as models for underwear, swimwear, or bikini. For kids products, please use flat lay photos or a mannequin, not a child model."); return; }
    const bad = BLOCKED_TEXT.find(w => prompt.toLowerCase().includes(w));
    if (bad) { setChat(`This request cannot be completed because it may contain restricted content: "${bad}". Please try a safe, original request.`); return; }
    if (mode === "Image") { setBuilding(true); const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&seed=${Date.now()}`; setGeneratedImage(aiUrl); setChat("AI has generated an image for you. If you like it, select Use This Image for Website."); setBuilding(false); }
    if (mode === "Video") { setGeneratedVideoMsg("AI video generation requires a paid video API (Runway / Veo). For now, please upload your own video in Website mode. It is free and shows your real product."); setChat("AI video generation requires a paid API. Please use Upload Video in Website mode for now."); }
  };

  const makeSmartSite = async () => {
    if (!prompt.trim()) return alert("Please describe what you want EVA to build.");
    const allText = (prompt + " " + inspiredBy + " " + changes).toLowerCase();
    if (isChildModelRequest(allText)) { setChat("This request cannot be completed. Children cannot be used as models for underwear, swimwear, or bikini. For kids products, please use flat lay photos or a mannequin, not a child model."); return; }
    const found = BLOCKED_TEXT.find(w => allText.includes(w));
    if (found) { setChat(`This request cannot be completed. It may contain restricted content: "${found}". Please try a safe, original website idea.`); return; }
    setBuilding(true); setBuilt(null); setChat(""); setSelectedItem(null); setCart([]); setFailedImgs({});
    let fullPrompt = prompt;
    if (inspiredBy.trim()) fullPrompt += `. Inspired by the style of ${inspiredBy}, but with original content.`;
    if (changes.trim()) fullPrompt += `. Changes: ${changes}.`;
    if (uploadedImages.length > 0) fullPrompt += `. User uploaded ${uploadedImages.length} real product images.`;
    const priceRange = parsePriceRange(prompt + " " + changes);
    const waInfo = extractWhatsApp(prompt) || extractWhatsApp(inspiredBy + " " + changes);
    if (priceRange) fullPrompt += `. IMPORTANT: All product prices MUST be between $${priceRange.min} and $${priceRange.max}.`;
    if (waInfo) fullPrompt += `. IMPORTANT: Seller WhatsApp is ${waInfo.display}. Show WhatsApp contact button.`;
    if (LINGERIE_WORDS.some(w => allText.includes(w))) fullPrompt += `. IMPORTANT: This is an adult women underwear / lingerie / swimwear store. Products MUST be: Lace Bra Set, Cotton Pant 3 Pack, Bikini Set, Swimwear One Piece. Do NOT use dresses, handbags, shoes, jewelry, cars, beach photos. Prices in USD.`;
    const categoryDefaults = getDefaultForPrompt(prompt);
    const categoryHero = getHeroForPrompt(prompt);
    try {
      const res = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: `You are EVA Builder. User wants: "${fullPrompt}" for Website. Use US DOLLARS only. Return ONLY valid JSON: {"title":"New York Luxe","desc":"...","color":"#a78bfa","heroImage":"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800","items":[{"name":"...","price":"$25","img":"https://images.unsplash.com/photo-1445205170230-053b83016050?w=400","desc":"One sentence"}],"cta":"Shop Now","extra":"One sentence"}`, history: [] }) });
      const data = await res.json(); let text = data.reply || data.text || ""; const start = text.indexOf("{"); const end = text.lastIndexOf("}");
      let site;
      if (start !== -1 && end !== -1) {
        site = JSON.parse(text.slice(start, end+1)); site.title = makeShortTitle(prompt, site.title); site.desc = site.desc && site.desc.length <= 110 ? site.desc : "Quality products for modern customers."; site.heroImage = fixImg(site.heroImage, 4);
        if (!site.items || site.items.length===0) site.items = categoryDefaults; else site.items = site.items.map((it,i)=>({ name: it.name||"Product", price: it.price||"$35", img: correctImageByName(it.name, it.img, i), desc: it.desc||"Best quality. Fast delivery." }));
        const isLingerie = LINGERIE_WORDS.some(w => allText.includes(w)); if (isLingerie) { const hasLingerieItem = site.items.some(it => LINGERIE_WORDS.some(w => (it.name||"").toLowerCase().includes(w))); if (!hasLingerieItem) site.items = categoryDefaults; }
        site.items = applyPriceRange(site.items, priceRange); if (!site.color) site.color = "#a78bfa";
      } else throw new Error("no json");
      if (waInfo) { site.whatsapp = waInfo; site.extra = `WhatsApp contact added: ${maskNumber(waInfo.display)}. Customers can order on WhatsApp.`; }
      if (uploadedImages.length > 0) { site.items = uploadedImages.map((up, i) => { const orig = site.items[i] || categoryDefaults[i % categoryDefaults.length]; return { name: orig.name, price: orig.price, img: up.url, desc: orig.desc + " - Your product photo." }; }); site.extra = (site.extra || "") + " Your website is ready with your uploaded images."; }
      if (uploadedVideo) site.video = uploadedVideo;
      setBuilt(site); setChat(site.extra || "Your website is ready. Select View Live Shop to see the customer view.");
    } catch(e) {
      let fallbackItems = applyPriceRange(categoryDefaults, priceRange);
      if (uploadedImages.length > 0) fallbackItems = uploadedImages.map((up,i)=>({ name: fallbackItems[i % fallbackItems.length].name, price: fallbackItems[i % fallbackItems.length].price, img: up.url, desc: "Your product photo." }));
      const fallbackSite = { title: makeShortTitle(prompt,""), desc: "Quality products for modern customers.", color:"#a78bfa", heroImage: categoryHero, items: fallbackItems, cta:"Shop Now", extra:"Your website is ready.", video: uploadedVideo || null };
      if (waInfo) { fallbackSite.whatsapp = waInfo; fallbackSite.extra = `WhatsApp contact added: ${maskNumber(waInfo.display)}. Customers can order on WhatsApp.`; }
      setBuilt(fallbackSite); setChat(fallbackSite.extra);
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
        {built.video ? <video src={built.video} controls style={{width:"100%", maxHeight:320, objectFit:"cover", display:"block", background:"black"}} /> : <img src={built.heroImage} alt="" style={{width:"100%", height:220, objectFit:"cover", display:"block"}} onError={(e)=>{e.target.src=IMG_HERO; e.target.onerror=null;}} />}
        <div style={{background:built.color, color:"white", padding:20}}><b style={{fontSize:26}}>{built.title}</b><p style={{margin:"6px 0 0", lineHeight:1.5}}>{built.desc}</p><p style={{fontSize:13, marginTop:8}}>Free Delivery • Easy Returns • Quality You Can Trust</p>
        {built.whatsapp && <a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block", background:"#25D366", color:"white", textAlign:"center", padding:"12px", borderRadius:999, fontWeight:"bold", textDecoration:"none", marginTop:12}}>Chat on WhatsApp — Order Now</a>}
        </div>
        <div style={{padding:16}}><h3>Shop All Products</h3>{built.items?.map((it,i)=>(
          <div key={i} onClick={()=>{ setSelectedItem(it); setSelectedSize("M"); }} style={{display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #eee", alignItems:"center", cursor:"pointer"}}>
            <ProductImg item={it} idx={i} />
            <div style={{flex:1}}><b>{it.name}</b><div style={{fontSize:13, opacity:0.6}}>Tap to view details</div><div style={{fontSize:12, color:"#22c55e", fontWeight:"bold"}}>In Stock</div></div><b style={{color:built.color}}>{it.price}</b>
          </div>))}</div>
        {built.whatsapp && <div style={{margin:"0 16px 16px", background:"#f0fdf4", border:"1px solid #bbf7d0", padding:14, borderRadius:12}}><b>Contact Seller</b><p style={{margin:"6px 0 0", fontSize:14}}>WhatsApp: {maskNumber(built.whatsapp.display)}<br/>Tap below to chat directly.</p><a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block", background:"#25D366", color:"white", textAlign:"center", padding:"12px", borderRadius:999, fontWeight:"bold", textDecoration:"none", marginTop:10}}>Open WhatsApp</a></div>}
        {selectedItem && (<div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center"}}><div style={{background:"white", width:"100%", maxHeight:"92vh", overflow:"auto", borderRadius:"20px 20px 0 0", padding:16}}><button onClick={()=> setSelectedItem(null)} style={{background:"#eee", border:"none", padding:"8px 14px", borderRadius:999}}>Back to Shop</button><ProductImg item={selectedItem} idx={999} size="large" /><h2>{selectedItem.name}</h2><b style={{fontSize:24, color:built.color}}>{selectedItem.price}</b><p>{selectedItem.desc}</p><div style={{display:"flex", gap:8}}>{["S","M","L","XL"].map(s=>(<button key={s} onClick={()=> setSelectedSize(s)} style={{padding:"10px 18px", borderRadius:999, border: selectedSize===s ? `2px solid ${built.color}` : "1px solid #ccc", background: selectedSize===s ? built.color : "white", color: selectedSize===s ? "white":"black", fontWeight:"bold"}}>{s}</button>))}</div><button onClick={()=>{ setCart([...cart, {...selectedItem, size:selectedSize}]); setSelectedItem(null); setShowCart(true); }} style={{width:"100%", background:built.color, border:"none", color:"white", padding:15, borderRadius:999, fontWeight:"bold", marginTop:12}}>Add to Cart — {selectedItem.price}</button>{built.whatsapp && <a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block", background:"#25D366", color:"white", textAlign:"center", padding:"12px", borderRadius:999, fontWeight:"bold", textDecoration:"none", marginTop:10}}>Ask on WhatsApp</a>}</div></div>)}
        {showCart && (<div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:60, display:"flex", alignItems:"flex-end", justifyContent:"center"}}><div style={{background:"white", width:"100%", maxHeight:"92vh", overflow:"auto", borderRadius:"20px 20px 0 0", padding:16}}><div style={{display:"flex", justifyContent:"space-between"}}><h2>Your Cart ({cart.length})</h2><button onClick={()=> setShowCart(false)} style={{background:"#eee", border:"none", padding:"8px 14px", borderRadius:999}}>Close</button></div>{cart.length===0 ? <p>Your cart is empty.</p> : cart.map((c,i)=>(<div key={i} style={{display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #eee", alignItems:"center"}}><ProductImg item={c} idx={i} size="small" /><div style={{flex:1}}><b>{c.name}</b><div style={{fontSize:13}}>Size {c.size}</div></div><b>{c.price}</b><button onClick={()=> setCart(cart.filter((_,idx)=> idx!==i))} style={{background:"#fee", border:"none", padding:"6px 10px", borderRadius:999}}>Remove</button></div>))}<h3 style={{textAlign:"right"}}>Total: ${cartTotal.toFixed(2)}</h3><button onClick={()=>{ if(!cart.length) return alert("Your cart is empty."); alert("Thank you. Your order is confirmed."); setCart([]); setShowCart(false); }} style={{width:"100%", background:"black", border:"none", color:"white", padding:15, borderRadius:999, fontWeight:"bold"}}>Checkout — ${cartTotal.toFixed(2)}</button>{built.whatsapp && <a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block", background:"#25D366", color:"white", textAlign:"center", padding:"12px", borderRadius:999, fontWeight:"bold", textDecoration:"none", marginTop:10}}>Checkout on WhatsApp</a>}</div></div>)}
      </div>
    );
  }

  return (
    <div style={{minHeight:"100dvh", background:"#030014", color:"white", padding:20, fontFamily:"sans-serif"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><b style={{fontSize:22}}>EVA</b><button onClick={()=> window.location.href='/'} style={{background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 14px", borderRadius:999}}>Back</button></div>
      <h1 style={{color:"#c084fc", fontSize:28, lineHeight:1.2, marginTop:30}}>What should EVA create<br/>for you today?</h1>
      <p style={{marginTop:20, fontWeight:"bold"}}>1. Describe what you want</p>
      <textarea value={prompt} onChange={(e)=> setPrompt(e.target.value)} placeholder={mode==="Website" ? "Example: Female underwear website $50 to $80, my WhatsApp 090... for contact" : mode==="Image" ? "Example: A red dress for women, luxury style" : "Example: A woman wearing a red dress walking in New York"} style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:16, color:"white", padding:14, fontSize:15, minHeight:90}} />
      <p style={{fontSize:12, opacity:0.7, marginTop:4}}>Type everything here: what you sell, price, and your WhatsApp for contact. Example: “Female underwear $50 to $80, my WhatsApp 090...”</p>
      {mode==="Website" && (
        <div style={{marginTop:16, background:"rgba(255,255,255,0.08)", padding:14, borderRadius:16}}>
          <label style={{display:"block", background:"white", color:"black", textAlign:"center", padding:12, borderRadius:12, fontWeight:"bold", cursor:"pointer"}}>Upload your image<input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{display:"none"}} /></label>
          {uploadedImages.length>0 && (<div><p style={{fontSize:12, margin:"10px 0 6px", opacity:0.8}}>{uploadedImages.length} image(s) uploaded</p><div style={{display:"flex", gap:8, flexWrap:"wrap"}}>{uploadedImages.map((im,i)=>(<div key={i} style={{position:"relative"}}><img src={im.url} alt="" style={{width:56, height:56, borderRadius:10, objectFit:"cover"}} /><button onClick={()=> setUploadedImages(uploadedImages.filter((_,idx)=> idx!==i))} style={{position:"absolute", top:-6, right:-6, background:"red", color:"white", border:"none", borderRadius:999, width:20, height:20, fontSize:11}}>X</button></div>))}</div></div>)}
          <label style={{display:"block", background:"#c084fc", color:"black", textAlign:"center", padding:12, borderRadius:12, fontWeight:"bold", cursor:"pointer", marginTop:10}}>Upload your video<input type="file" accept="video/*" onChange={handleVideoUpload} style={{display:"none"}} /></label>
          {uploadedVideo && <video src={uploadedVideo} controls style={{width:"100%", height:140, objectFit:"cover", borderRadius:12, marginTop:10}} />}
          <div style={{marginTop:12}}>
            <button onClick={()=> setShowSafety(!showSafety)} style={{width:"100%", background:"transparent", border:"none", color:"white", textAlign:"left", padding:"6px 0", fontSize:13, display:"flex", justifyContent:"space-between", cursor:"pointer"}}><span>Safety Rules for Uploads</span><span>{showSafety ? "▲" : "▼"}</span></button>
            {showSafety && (<div style={{background:"rgba(255,255,255,0.08)", padding:10, borderRadius:10, fontSize:12, lineHeight:1.5}}>Do not upload nudity, sexual content, images of children, or bank documents, ID cards, passwords, or personal records. Only upload images and videos of your own products. EVA will scan the content inside your image and video, not only the file name. For kids products, do not use children as models for underwear, swimwear, or bikini. Use flat lay photos or a mannequin instead.</div>)}
            <label style={{display:"flex", gap:8, marginTop:8, fontSize:13, lineHeight:1.4, cursor:"pointer"}}><input type="checkbox" checked={confirmedSafe} onChange={(e)=> setConfirmedSafe(e.target.checked)} style={{marginTop:2}} /> I confirm this is my own product image/video and it follows the safety rules.</label>
            {checking && <p style={{color:"#facc15", fontSize:13, fontWeight:"bold"}}>{checkStatus}</p>}
            {!checking && checkStatus && <p style={{fontSize:12, color:"#22c55e"}}>{checkStatus}</p>}
          </div>
        </div>
      )}
      {mode!=="Website" && <p style={{fontSize:13, opacity:0.7, marginTop:12}}>{mode==="Image" ? "Image mode: AI will generate a new image from your description." : "Video mode: AI will generate a new video from your description. This requires a paid video API."}</p>}
      <p style={{marginTop:18, fontWeight:"bold"}}>2. Inspired by? (Optional)</p>
      <input value={inspiredBy} onChange={(e)=> setInspiredBy(e.target.value)} placeholder="Enter a website name or link" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13}} />
      <p style={{marginTop:18, fontWeight:"bold"}}>3. What would you like to change? (Optional)</p>
      <input value={changes} onChange={(e)=> setChanges(e.target.value)} placeholder="Example: Show full details" style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"white", padding:13}} />
      <p style={{marginTop:20}}>Create</p>
      <div style={{display:"flex", gap:10}}>{["Website","Image","Video"].map(m=>(<button key={m} onClick={()=> setMode(m)} style={{flex:1, background: mode===m ? "#c084fc":"rgba(255,255,255,0.12)", border:"none", color: mode===m ? "black":"white", padding:14, borderRadius:14, fontWeight:"bold"}}>{m}</button>))}</div>
      {mode==="Website" ? <button onClick={makeSmartSite} style={{width:"100%", background:"#c084fc", border:"none", color:"black", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>{building ? "EVA is building. Please wait." : "Create Website"}</button>
      : <button onClick={handleGenerateAI} style={{width:"100%", background:"#22c55e", border:"none", color:"white", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>{building ? "AI is creating. Please wait." : mode==="Image" ? "Generate AI Image" : "Generate AI Video"}</button>}
      {chat && <div style={{marginTop:14, background:"rgba(167,139,250,0.2)", padding:12, borderRadius:12, fontSize:14}}>EVA: {chat}</div>}
      {mode==="Image" && generatedImage && (<div style={{marginTop:16, background:"white", color:"black", borderRadius:16, padding:14}}><b>AI Generated Image</b><img src={generatedImage} alt="" style={{width:"100%", height:300, objectFit:"cover", borderRadius:12, marginTop:10}} /><button onClick={()=>{ setUploadedImages([{url: generatedImage, name:"AI Image"}]); setMode("Website"); setChat("This AI image has been moved to Website Upload. Select Create Website to use it."); }} style={{width:"100%", background:"black", border:"none", color:"white", padding:12, borderRadius:999, fontWeight:"bold", marginTop:10}}>Use This Image For Website</button></div>)}
      {mode==="Video" && generatedVideoMsg && <div style={{marginTop:14, background:"rgba(255,255,255,0.1)", padding:12, borderRadius:12, fontSize:14}}>{generatedVideoMsg}</div>}
      {built && mode==="Website" && (
        <div style={{marginTop:16, background:"white", color:"black", borderRadius:16, overflow:"hidden"}}>
          {built.video ? <video src={built.video} controls style={{width:"100%", height:180, objectFit:"cover", display:"block"}} /> : <img src={built.heroImage} alt="" onError={(e)=>{e.target.src=IMG_HERO; e.target.onerror=null;}} style={{width:"100%", height:180, objectFit:"cover", display:"block"}} />}
          <div style={{background:built.color, color:"white", padding:18}}><b style={{fontSize:22}}>{built.title}</b><p style={{margin:"6px 0 0"}}>{built.desc}</p>{built.whatsapp && <p style={{margin:"8px 0 0", fontSize:13, background:"rgba(0,0,0,0.2)", padding:"8px", borderRadius:8}}>WhatsApp: {maskNumber(built.whatsapp.display)} — Added for contact ✅</p>}</div>
          <div style={{padding:16}}>
            {built.items?.map((it,i)=>(<div key={i} onClick={()=>{ setSelectedItem(it); setSelectedSize("M"); }} style={{display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #eee", alignItems:"center", cursor:"pointer"}}><ProductImg item={it} idx={i} size="small" /><div style={{flex:1}}><b>{it.name}</b><div style={{fontSize:13, opacity:0.6}}>Tap to view details</div></div><b style={{color:built.color}}>{it.price}</b></div>))}
            <button onClick={()=> setLiveMode(true)} style={{width:"100%", background:"black", border:"none", color:"white", padding:14, borderRadius:999, fontWeight:"bold", marginTop:14}}>View Live Shop</button>
            <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:10}}>V15.8 — Picture Fix: No More Yellow Free Limit Card</p>
          </div>
        </div>
      )}
      {selectedItem && !liveMode && built && (<div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center"}}><div style={{background:"white", color:"black", width:"100%", maxHeight:"92vh", overflow:"auto", borderRadius:"20px 20px 0 0", padding:16}}><button onClick={()=> setSelectedItem(null)} style={{background:"#eee", border:"none", padding:"8px 14px", borderRadius:999}}>Back to Shop</button><ProductImg item={selectedItem} idx={999} size="large" /><h2>{selectedItem.name}</h2><b style={{color:built.color, fontSize:22}}>{selectedItem.price}</b><p>{selectedItem.desc}</p><button onClick={()=>{ setCart([...cart, {...selectedItem, size:selectedSize}]); setSelectedItem(null); }} style={{width:"100%", background:built.color, border:"none", color:"white", padding:15, borderRadius:999, fontWeight:"bold", marginTop:12}}>Add to Cart — {selectedItem.price}</button></div></div>)}
      <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:16}}>EVA creates original designs. Copying brands, logos, or illegal content is not allowed.</p>
    </div>
  );
    }
