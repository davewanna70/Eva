"use client";
import { useState, useRef } from "react";

// V18.0 - GALLERY + PER-IMAGE DETAILS
// User selects many images -> gallery shows them -> click one -> write Name/Price/Desc -> Done (marked) -> next -> Overall Done uploads all.
// Same for Video. Same rules: max 20MB per file, safety check, no nudity / bank docs / children models.

function extractWhatsApp(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/[\s\-\(\)]/g,"");
  const m = cleaned.match(/(\+?234\d{10}|0\d{10})/);
  if (!m) return null;
  let raw = m[1]; let wa = raw;
  if (wa.startsWith("0")) wa = "234" + wa.slice(1);
  if (wa.startsWith("+")) wa = wa.slice(1);
  return { display: raw, waLink: `https://wa.me/${wa}?text=${encodeURIComponent("Hello, I want to order from your store")}` };
}
function maskNumber(d){ if(!d||d.length<7) return d; return d.slice(0,4)+"***"+d.slice(-3); }
function parsePriceRange(text){
  const t=(text||"").toLowerCase();
  let m = t.match(/(?:between|from)\s*\$?\s*(\d+)\s*(?:and|to|-)\s*\$?\s*(\d+)/);
  if(m){ let min=parseInt(m[1]); let max=parseInt(m[2]); if(min>max)[min,max]=[max,min]; return {min,max}; }
  m = t.match(/\$?\s*(\d+)\s*(?:to|-)\s*\$?\s*(\d+)/);
  if(m){ let min=parseInt(m[1]); let max=parseInt(m[2]); if(min>max)[min,max]=[max,min]; return {min,max}; }
  return null;
}
function makeShortTitle(prompt,aiTitle){
  const called = (prompt||"").match(/called\s+([A-Za-z0-9\s&'-]+?)(?:\s+for\s+|\s+in\s+|\s*,|\s*\.)/i);
  if(called && called[1]) return called[1].trim().split(/\s+/).slice(0,4).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
  if(aiTitle && aiTitle.length<=30 && !aiTitle.toLowerCase().includes("modern called")) return aiTitle;
  return "My Store";
}
function parseProductsFromPrompt(prompt){
  const full = prompt || "";
  let after = full;
  const idx = full.toLowerCase().indexOf("products:");
  if(idx !== -1) after = full.slice(idx + 9);
  else {
    const idx2 = full.toLowerCase().indexOf("sell");
    if(idx2 !== -1) after = full.slice(idx2 + 4);
  }
  const waIdx = after.toLowerCase().indexOf("whatsapp");
  if(waIdx !== -1) after = after.slice(0, waIdx);
  const priceIdx = after.toLowerCase().indexOf("prices must");
  if(priceIdx !== -1) after = after.slice(0, priceIdx);
  const parts = after.split(",").map(s=>s.trim()).filter(Boolean);
  const items = [];
  for(let part of parts){
    const m = part.match(/^(.+?)\s*\$?\s*(\d+)\s*\.?\s*$/);
    if(!m) continue;
    let name = m[1].trim().replace(/^(and|sell|4 products:|products:)\s*/i,"").trim();
    let price = m[2];
    if(!name || name.length < 2) continue;
    if(/^\d+$/.test(name)) continue;
    if(name.toLowerCase().includes("between")) continue;
    if(name.toLowerCase().includes("whatsapp")) continue;
    if(name.toLowerCase().includes("price")) continue;
    name = name.replace(/^\d+\s+products:\s*/i,"").trim();
    items.push({ name: name.charAt(0).toUpperCase()+name.slice(1), price: `$${price}`, img: `https://loremflickr.com/800/600/${encodeURIComponent(name)}?lock=${Math.floor(Math.random()*1000)}`, desc: `${name} - Quality product. Fast delivery. In Stock.` });
  }
  if(items.length >= 2) return items.slice(0,6);
  return null;
}
function genericFallback(prompt){
  const t=(prompt||"").toLowerCase();
  let cat = "Product";
  if(t.includes("phone")) cat="Phone";
  else if(t.includes("sneaker")||t.includes("shoe")) cat="Sneakers";
  else if(t.includes("wig")||t.includes("hair")) cat="Hair";
  else if(t.includes("dress")) cat="Dress";
  else if(t.includes("underwear")||t.includes("bra")) cat="Underwear";
  else if(t.includes("food")||t.includes("cake")) cat="Food";
  return [1,2,3,4].map(i=>({ name:`${cat} ${i}`, price:`$${30+i*5}`, img:`https://loremflickr.com/800/600/${encodeURIComponent(cat)}?lock=${i}`, desc:`Quality ${cat} - Best seller. Fast delivery.` }));
}
function emojiFor(name){
  const n=(name||"").toLowerCase();
  if(n.includes("phone")||n.includes("iphone")||n.includes("samsung")) return "📱";
  if(n.includes("sneaker")||n.includes("shoe")) return "👟";
  if(n.includes("wig")||n.includes("hair")) return "💇‍♀️";
  if(n.includes("dress")) return "👗";
  if(n.includes("bra")||n.includes("bikini")) return "👙";
  if(n.includes("cake")||n.includes("food")) return "🍰";
  if(n.includes("bag")) return "👜";
  return "🛍️";
}
function colorFor(name){
  const n=(name||"").toLowerCase();
  if(n.includes("phone")) return "#dbeafe";
  if(n.includes("sneaker")||n.includes("shoe")) return "#e0e7ff";
  if(n.includes("wig")||n.includes("hair")) return "#fce7f3";
  return "#e5e7eb";
}
const BLOCKED_TEXT = ["nude","naked","porn","xxx","onlyfans","escort","prostitut","child porn","kid nude","sex with minor","minor sex","school girl","schoolgirl","clone","copy exactly","exact copy","replica","pirate","crack","fake bank","phishing","fake login","steal password","fake paypal","fake crypto","scam","fake shop","bomb","hack","ddos","fake id","fake passport","drugs","how to steal","weapon","kill","murder","terror","hate","bank card","bank account","credit card number","password","otp","pin code"];
const BLOCKED_CHILD_MODEL = ["child","kid","pikin","teen","minor","baby","toddler","school"];
const BLOCKED_FILE = ["nude","naked","porn","xxx","onlyfans","escort","bank","password","otp","pin","passport","id card","credit card","nudes"];
const BLOCKED_OCR = ["bank","account number","credit card","debit card","password","otp","pin code","passport","national id","id card","sort code","routing number","iban","swift"];
const LINGERIE_WORDS = ["underwear","pikini","pant","bra","lingerie","bikini","swimwear","swimsuit","panties","boxer","brief"];
function loadScript(src){ return new Promise((res,rej)=>{ if(document.querySelector(`script[src="${src}"]`)) return res(); const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }

export default function Build(){
  const [prompt,setPrompt]=useState("");
  const [inspiredBy,setInspiredBy]=useState("");
  const [changes,setChanges]=useState("");
  const [mode,setMode]=useState("Website");
  const [building,setBuilding]=useState(false);
  const [built,setBuilt]=useState(null);
  const [chat,setChat]=useState("");
  const [selectedItem,setSelectedItem]=useState(null);
  const [selectedSize,setSelectedSize]=useState("M");
  const [cart,setCart]=useState([]);
  const [showCart,setShowCart]=useState(false);
  const [liveMode,setLiveMode]=useState(false);
  const [uploadedImages,setUploadedImages]=useState([]);
  const [uploadedVideo,setUploadedVideo]=useState(null);
  const [uploadedVideoMeta,setUploadedVideoMeta]=useState(null);
  const [generatedImage,setGeneratedImage]=useState(null);
  const [generatedVideoMsg,setGeneratedVideoMsg]=useState("");
  const [confirmedSafe,setConfirmedSafe]=useState(false);
  const [checking,setChecking]=useState(false);
  const [checkStatus,setCheckStatus]=useState("");
  const [showSafety,setShowSafety]=useState(false);
  const [failedImgs,setFailedImgs]=useState({});
  const modelRef=useRef(null);

  // V18 - Gallery staging
  const [pendingImages,setPendingImages]=useState([]); // {id, url, file, fileName, productName, price, desc, done}
  const [pendingVideos,setPendingVideos]=useState([]); // same for video
  const [editingImageId,setEditingImageId]=useState(null);
  const [editingVideoId,setEditingVideoId]=useState(null);
  const [editName,setEditName]=useState("");
  const [editPrice,setEditPrice]=useState("");
  const [editDesc,setEditDesc]=useState("");
  const [uploadingAll,setUploadingAll]=useState(false);
  const [uploadProgress,setUploadProgress]=useState("");

  const getPriceNum=(p)=>{ const n=parseFloat(String(p||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; };
  const cartTotal=cart.reduce((s,c)=>s+getPriceNum(c.price),0);
  const handleImgError=(e,name,key)=>{ if(key) setFailedImgs(p=>({...p,[key]:true})); e.target.style.display="none"; };
  const ProductImg=({item,idx,size})=>{
    const key=`${item.name}-${idx}`; const isFailed=failedImgs[key];
    const w=size==="large"?"100%":size==="small"?60:80; const h=size==="large"?300:size==="small"?60:80;
    if(isFailed) return <div style={{width:w,height:h,minWidth:w,background:colorFor(item.name),borderRadius:size==="large"?14:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size==="large"?64:28,flexShrink:0}}>{emojiFor(item.name)}</div>;
    return <img src={item.img} alt={item.name} onError={(e)=>handleImgError(e,item.name,key)} style={{width:w,height:h,minWidth:w,borderRadius:size==="large"?14:12,objectFit:"cover",flexShrink:0}} />;
  };

  const loadNSFWModel=async()=>{ if(modelRef.current) return modelRef.current; setCheckStatus("Loading safety AI model. Please wait..."); await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js"); await loadScript("https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js"); const m=await window.nsfwjs.load(); modelRef.current=m; return m; };
  const isNSFWPrediction=(preds)=>{ const g=(n)=>{ const p=preds.find(x=>x.className===n); return p?p.probability:0; }; const porn=g("Porn"); const hen=g("Hentai"); if(porn>0.70||hen>0.70) return {blocked:true,reason:`Porn ${Math.round(porn*100)}% / Hentai ${Math.round(hen*100)}%`}; return {blocked:false,reason:""}; };
  const checkImageWithAI=async(u)=>{ try{ const m=await loadNSFWModel(); const img=new Image(); img.crossOrigin="anonymous"; img.src=u; await new Promise((a,b)=>{img.onload=a; img.onerror=b;}); const p=await m.classify(img); return isNSFWPrediction(p); }catch(e){ return {blocked:false,reason:""}; } };
  const checkVideoWithAI=async(u)=>{ try{ const m=await loadNSFWModel(); const v=document.createElement("video"); v.src=u; v.muted=true; v.playsInline=true; await new Promise(r=>{v.onloadedmetadata=r;}); const d=v.duration||3; const times=[0.5,d/2,Math.max(0.5,d-0.5)]; for(let t of times){ v.currentTime=Math.min(t,d-0.1); await new Promise(r=>{v.onseeked=r; setTimeout(r,500);}); const c=document.createElement("canvas"); c.width=v.videoWidth||400; c.height=v.videoHeight||400; const ctx=c.getContext("2d"); ctx.drawImage(v,0,0,c.width,c.height); const img=new Image(); img.src=c.toDataURL("image/jpeg",0.8); await new Promise(r=>{img.onload=r;}); const p=await m.classify(img); const r2=isNSFWPrediction(p); if(r2.blocked) return r2; } return {blocked:false,reason:""}; }catch(e){ return {blocked:false,reason:""}; } };
  const checkTextWithOCR=async(u)=>{ try{ await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"); const w=await window.Tesseract.createWorker("eng"); const r=await w.recognize(u); await w.terminate(); const t=(r.data.text||"").toLowerCase(); const f=BLOCKED_OCR.find(x=>t.includes(x)); if(f) return {blocked:true,reason:`Document text detected: "${f}"`}; return {blocked:false,reason:""}; }catch(e){ return {blocked:false,reason:""}; } };
  const isChildModelRequest=(t)=>{ const s=(t||"").toLowerCase(); const hc=BLOCKED_CHILD_MODEL.some(w=>s.includes(w)); const hu=LINGERIE_WORDS.some(w=>s.includes(w))||s.includes("model")||s.includes("showroom")||s.includes("wearing"); return hc&&hu; };

  // V18 - Step 1: Select from gallery, do NOT upload yet. Just stage them.
  const handleSelectImages=(e)=>{
    const files=Array.from(e.target.files||[]);
    const newItems=[];
    for(const f of files){
      if(!f.type.startsWith("image/")){ alert("Please select an image file only."); continue; }
      if(f.size>20*1024*1024){ alert(`"${f.name}" is too large. Maximum is 20MB per file. This one was skipped.`); continue; }
      const fname=f.name.toLowerCase(); const bad=BLOCKED_FILE.find(w=>fname.includes(w));
      if(bad){ alert(`"${f.name}" cannot be used. File name contains blocked word: "${bad}".`); continue; }
      const url=URL.createObjectURL(f);
      newItems.push({ id: Date.now()+"-"+Math.random(), url, file: f, fileName: f.name, productName:"", price:"", desc:"", done:false });
    }
    if(newItems.length>0) setPendingImages(p=>[...p,...newItems]);
    e.target.value="";
  };
  const handleSelectVideos=(e)=>{
    const files=Array.from(e.target.files||[]);
    const newItems=[];
    for(const f of files){
      if(!f.type.startsWith("video/")){ alert("Please select a video file only."); continue; }
      if(f.size>20*1024*1024){ alert(`"${f.name}" is too large. Maximum is 20MB per file. This one was skipped.`); continue; }
      const fname=f.name.toLowerCase(); const bad=BLOCKED_FILE.find(w=>fname.includes(w));
      if(bad){ alert(`"${f.name}" cannot be used. File name contains blocked word: "${bad}".`); continue; }
      const url=URL.createObjectURL(f);
      newItems.push({ id: Date.now()+"-"+Math.random(), url, file: f, fileName: f.name, productName:"", price:"", desc:"", done:false });
    }
    if(newItems.length>0) setPendingVideos(p=>[...p,...newItems]);
    e.target.value="";
  };
  // V18 - Step 2: Click one image -> open small box
  const openImageEditor=(item)=>{
    setEditingImageId(item.id); setEditName(item.productName||""); setEditPrice(item.price||""); setEditDesc(item.desc||"");
  };
  const openVideoEditor=(item)=>{
    setEditingVideoId(item.id); setEditName(item.productName||""); setEditPrice(item.price||""); setEditDesc(item.desc||"");
  };
  // V18 - Step 3: Press Done for that one -> mark it
  const saveImageDetail=()=>{
    if(!editName.trim()){ alert("Please write Product Name, e.g. iPhone 13 or Red Dress."); return; }
    if(!editPrice.trim()){ alert("Please write Price, e.g. $400 or 400."); return; }
    setPendingImages(p=>p.map(it=> it.id===editingImageId ? {...it, productName: editName.trim(), price: editPrice.trim().startsWith("$")?editPrice.trim():`$${editPrice.trim()}`, desc: editDesc.trim()||`${editName.trim()} - Quality product. Fast delivery.`, done:true} : it));
    setEditingImageId(null); setEditName(""); setEditPrice(""); setEditDesc("");
  };
  const saveVideoDetail=()=>{
    if(!editName.trim()){ alert("Please write Video Title, e.g. iPhone 13 Promo."); return; }
    if(!editPrice.trim()){ alert("Please write Price, e.g. $400."); return; }
    setPendingVideos(p=>p.map(it=> it.id===editingVideoId ? {...it, productName: editName.trim(), price: editPrice.trim().startsWith("$")?editPrice.trim():`$${editPrice.trim()}`, desc: editDesc.trim()||`${editName.trim()} - Watch this product video.`, done:true} : it));
    setEditingVideoId(null); setEditName(""); setEditPrice(""); setEditDesc("");
  };
  // V18 - Step 4: Overall Done -> start uploading all, with safety check
  const uploadAllImages=async()=>{
    if(pendingImages.length===0) return alert("No images selected yet. Select images from gallery first.");
    if(!confirmedSafe) return alert("Please confirm that these are your own product images and they follow the safety rules.");
    const notDone = pendingImages.filter(p=>!p.done);
    if(notDone.length>0){
      const go = window.confirm(`${notDone.length} image(s) have no details yet. Do you want to upload them with auto name? Press OK to continue, or Cancel to add details first.`);
      if(!go) return;
    }
    setUploadingAll(true); setChecking(true);
    for(let i=0;i<pendingImages.length;i++){
      const it = pendingImages[i];
      setUploadProgress(`Checking image ${i+1} of ${pendingImages.length}...`);
      setCheckStatus(`Checking image ${i+1} of ${pendingImages.length}. Please wait...`);
      const ai=await checkImageWithAI(it.url);
      if(ai.blocked){ alert(`"${it.productName||it.fileName}" was rejected. Reason: ${ai.reason}. It was skipped.`); continue; }
      const ocr=await checkTextWithOCR(it.url);
      if(ocr.blocked){ alert(`"${it.productName||it.fileName}" was rejected. Reason: ${ocr.reason}. It was skipped.`); continue; }
      const name = it.productName || `Product ${uploadedImages.length+i+1}`;
      const price = it.price || "$35";
      const desc = it.desc || `${name} - Quality product. Fast delivery.`;
      setUploadedImages(p=>[...p,{url:it.url, name: it.fileName, productName:name, price, desc}]);
    }
    setPendingImages([]); setUploadingAll(false); setChecking(false); setCheckStatus("All images uploaded."); setUploadProgress("");
    setChat("All your images have been uploaded with their details. Now press Create Website.");
  };
  const uploadAllVideos=async()=>{
    if(pendingVideos.length===0) return alert("No video selected yet.");
    if(!confirmedSafe) return alert("Please confirm that this is your own product video and it follows the safety rules.");
    const notDone = pendingVideos.filter(p=>!p.done);
    if(notDone.length>0){
      const go = window.confirm(`${notDone.length} video(s) have no details yet. Do you want to upload with auto name? Press OK to continue, or Cancel to add details first.`);
      if(!go) return;
    }
    setUploadingAll(true); setChecking(true);
    for(let i=0;i<pendingVideos.length;i++){
      const it = pendingVideos[i];
      setUploadProgress(`Checking video ${i+1} of ${pendingVideos.length}...`);
      setCheckStatus(`Checking video ${i+1} of ${pendingVideos.length}. AI is checking 3 frames. Please wait...`);
      const ai=await checkVideoWithAI(it.url);
      if(ai.blocked){ alert(`Video "${it.productName||it.fileName}" was rejected. Reason: ${ai.reason}. It was skipped.`); continue; }
      // Use first video as main shop video, with its details
      setUploadedVideo(it.url);
      setUploadedVideoMeta({ productName: it.productName||"Product Video", price: it.price||"$35", desc: it.desc||"Watch this product video." });
    }
    setPendingVideos([]); setUploadingAll(false); setChecking(false); setCheckStatus("Video uploaded."); setUploadProgress("");
    setChat("Your video has been uploaded with its details.");
  };

  const handleGenerateAI=async()=>{
    if(!prompt.trim()) return alert("Please type what you want AI to create first.");
    if(isChildModelRequest(prompt)){ setChat("This request cannot be completed. Children cannot be used as models for underwear, swimwear, or bikini."); return; }
    const bad=BLOCKED_TEXT.find(w=>prompt.toLowerCase().includes(w));
    if(bad){ setChat(`This request cannot be completed because it may contain restricted content: "${bad}".`); return; }
    if(mode==="Image"){ setBuilding(true); const aiUrl=`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800&seed=${Date.now()}`; setGeneratedImage(aiUrl); setChat("AI has generated an image for you."); setBuilding(false); }
    if(mode==="Video"){ setGeneratedVideoMsg("AI video generation requires a paid video API. For now, please upload your own video in Website mode."); }
  };

  const makeSmartSite=async()=>{
    if(!prompt.trim() && uploadedImages.length===0) return alert("Please describe what you want EVA to build, or upload images with details.");
    const allText=(prompt+" "+inspiredBy+" "+changes).toLowerCase();
    if(isChildModelRequest(allText)){ setChat("This request cannot be completed. Children cannot be used as models for underwear, swimwear, or bikini."); return; }
    const found=BLOCKED_TEXT.find(w=>allText.includes(w));
    if(found){ setChat(`This request cannot be completed. It may contain restricted content: "${found}".`); return; }
    setBuilding(true); setBuilt(null); setChat(""); setSelectedItem(null); setCart([]); setFailedImgs({});
    // V18 PRIORITY: If user detailed images in gallery, use THOSE names/prices/descs - no guessing
    let myProducts = null;
    if(uploadedImages.length>0){
      myProducts = uploadedImages.map(up=>({ name: up.productName||up.name||"Product", price: up.price||"$35", img: up.url, desc: up.desc||"Quality product. Fast delivery." }));
    } else {
      myProducts = parseProductsFromPrompt(prompt+" "+changes) || genericFallback(prompt);
    }
    const priceRange=parsePriceRange(prompt+" "+changes);
    const waInfo=extractWhatsApp(prompt)||extractWhatsApp(inspiredBy+" "+changes);
    const title = makeShortTitle(prompt,"");
    const heroKeyword = encodeURIComponent(title || "store");
    const heroImage = uploadedImages.length>0 ? uploadedImages[0].url : `https://loremflickr.com/1200/600/${heroKeyword}?lock=999`;
    const site = { title, desc:"Quality products for modern customers. Free Delivery • Easy Returns • Quality You Can Trust.", color:"#a78bfa", heroImage, items: myProducts, cta:"Shop Now", extra:"Your website is ready with your product details.", video: uploadedVideo || null, videoMeta: uploadedVideoMeta || null };
    if(waInfo){ site.whatsapp=waInfo; site.extra=`WhatsApp contact added: ${maskNumber(waInfo.display)}. Customers can order on WhatsApp.`; }
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:`Write a short 1-sentence store description for: "${prompt}". Return ONLY JSON: {"desc":"..."}` ,history:[]})});
      const data=await res.json(); let text=data.reply||data.text||""; const s=text.indexOf("{"); const e=text.lastIndexOf("}");
      if(s!==-1&&e!==-1){ const j=JSON.parse(text.slice(s,e+1)); if(j.desc) site.desc=j.desc.slice(0,110); }
    }catch(e){}
    setBuilt(site); setChat(site.extra); setBuilding(false);
  };

  if(liveMode&&built){
    return (
      <div style={{minHeight:"100dvh",background:"white",color:"black",fontFamily:"sans-serif"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"black",color:"white",position:"sticky",top:0,zIndex:10}}>
          <b style={{fontSize:20}}>{built.title}</b>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowCart(true)} style={{background:"white",border:"none",color:"black",padding:"8px 14px",borderRadius:999,fontWeight:"bold"}}>Cart ({cart.length})</button>
            <button onClick={()=>setLiveMode(false)} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",padding:"8px 10px",borderRadius:999,fontSize:12}}>Owner: Back to Builder</button>
          </div>
        </div>
        {built.video?<div><video src={built.video} controls style={{width:"100%",maxHeight:320,objectFit:"cover",display:"block",background:"black"}}/>{built.videoMeta&&<div style={{padding:"12px 16px",background:"#f8fafc"}}><b>{built.videoMeta.productName}</b> — <b>{built.videoMeta.price}</b><p style={{margin:"4px 0 0",fontSize:13}}>{built.videoMeta.desc}</p></div>}</div>:<img src={built.heroImage} alt="" style={{width:"100%",height:220,objectFit:"cover",display:"block"}} onError={(e)=>{e.target.style.display="none";}}/>}
        <div style={{background:built.color,color:"white",padding:20}}><b style={{fontSize:26}}>{built.title}</b><p style={{margin:"6px 0 0",lineHeight:1.5}}>{built.desc}</p><p style={{fontSize:13,marginTop:8}}>Free Delivery • Easy Returns • Quality You Can Trust</p>
        {built.whatsapp&&<a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:12}}>Chat on WhatsApp — Order Now</a>}
        </div>
        <div style={{padding:16}}><h3>Shop All Products</h3>{built.items?.map((it,i)=>(
          <div key={i} onClick={()=>{setSelectedItem(it); setSelectedSize("M");}} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #eee",alignItems:"center",cursor:"pointer"}}>
            <ProductImg item={it} idx={i}/>
            <div style={{flex:1}}><b>{it.name}</b><div style={{fontSize:13,opacity:0.6}}>Tap to view details</div><div style={{fontSize:12,color:"#22c55e",fontWeight:"bold"}}>In Stock</div></div><b style={{color:built.color}}>{it.price}</b>
          </div>))}</div>
        {built.whatsapp&&<div style={{margin:"0 16px 16px",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:14,borderRadius:12}}><b>Contact Seller</b><p style={{margin:"6px 0 0",fontSize:14}}>WhatsApp: {maskNumber(built.whatsapp.display)}<br/>Tap below to chat directly.</p><a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:10}}>Open WhatsApp</a></div>}
        {selectedItem&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{background:"white",width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:"20px 20px 0 0",padding:16}}><button onClick={()=>setSelectedItem(null)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Back to Shop</button><ProductImg item={selectedItem} idx={999} size="large"/><h2>{selectedItem.name}</h2><b style={{fontSize:24,color:built.color}}>{selectedItem.price}</b><p>{selectedItem.desc}</p><div style={{display:"flex",gap:8}}>{["S","M","L","XL"].map(s=>(<button key={s} onClick={()=>setSelectedSize(s)} style={{padding:"10px 18px",borderRadius:999,border:selectedSize===s?`2px solid ${built.color}`:"1px solid #ccc",background:selectedSize===s?built.color:"white",color:selectedSize===s?"white":"black",fontWeight:"bold"}}>{s}</button>))}</div><button onClick={()=>{setCart([...cart,{...selectedItem,size:selectedSize}]); setSelectedItem(null); setShowCart(true);}} style={{width:"100%",background:built.color,border:"none",color:"white",padding:15,borderRadius:999,fontWeight:"bold",marginTop:12}}>Add to Cart — {selectedItem.price}</button>{built.whatsapp&&<a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:10}}>Ask on WhatsApp</a>}</div></div>)}
        {showCart&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:60,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{background:"white",width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:"20px 20px 0 0",padding:16}}><div style={{display:"flex",justifyContent:"space-between"}}><h2>Your Cart ({cart.length})</h2><button onClick={()=>setShowCart(false)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>{cart.length===0?<p>Your cart is empty.</p>:cart.map((c,i)=>(<div key={i} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #eee",alignItems:"center"}}><ProductImg item={c} idx={i} size="small"/><div style={{flex:1}}><b>{c.name}</b><div style={{fontSize:13}}>Size {c.size}</div></div><b>{c.price}</b><button onClick={()=>setCart(cart.filter((_,idx)=>idx!==i))} style={{background:"#fee",border:"none",padding:"6px 10px",borderRadius:999}}>Remove</button></div>))}<h3 style={{textAlign:"right"}}>Total: ${cartTotal.toFixed(2)}</h3><button onClick={()=>{if(!cart.length) return alert("Your cart is empty."); alert("Thank you. Your order is confirmed."); setCart([]); setShowCart(false);}} style={{width:"100%",background:"black",border:"none",color:"white",padding:15,borderRadius:999,fontWeight:"bold"}}>Checkout — ${cartTotal.toFixed(2)}</button>{built.whatsapp&&<a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:10}}>Checkout on WhatsApp</a>}</div></div>)}
      </div>
    );
  }

  return (
    <div style={{minHeight:"100dvh",background:"#030014",color:"white",padding:20,fontFamily:"sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><b style={{fontSize:22}}>EVA</b><button onClick={()=>window.location.href='/'} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"white",padding:"8px 14px",borderRadius:999}}>Back</button></div>
      <h1 style={{color:"#c084fc",fontSize:28,lineHeight:1.2,marginTop:30}}>What should EVA create<br/>for you today?</h1>
      <p style={{marginTop:20,fontWeight:"bold"}}>1. Describe what you want</p>
      <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Example: Create store called Lagos Phone Hub. WhatsApp 090... for contact. Or just upload your images with details below." style={{width:"100%",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:16,color:"white",padding:14,fontSize:15,minHeight:90}} />
      <p style={{fontSize:12,opacity:0.7,marginTop:4}}>Tip: You can now skip long description. Just upload images, detail each one in gallery, EVA will use your details.</p>
      {mode==="Website"&&(
        <div style={{marginTop:16,background:"rgba(255,255,255,0.08)",padding:14,borderRadius:16}}>
          {/* V18 IMAGE GALLERY */}
          <p style={{fontWeight:"bold",margin:"0 0 8px"}}>📸 Your Product Images — Tap each to add details</p>
          <label style={{display:"block",background:"white",color:"black",textAlign:"center",padding:12,borderRadius:12,fontWeight:"bold",cursor:"pointer"}}>Select Images From Gallery<input type="file" accept="image/*" multiple onChange={handleSelectImages} style={{display:"none"}}/></label>
          <p style={{fontSize:11,opacity:0.7,margin:"6px 0 0"}}>Max 20MB per image. Tap an image to write its Name, Price, Description.</p>
          {pendingImages.length>0&&(<div style={{marginTop:12}}>
            <p style={{fontSize:12,opacity:0.8}}>{pendingImages.filter(p=>p.done).length} of {pendingImages.length} detailed ✅</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {pendingImages.map((im)=>(
                <div key={im.id} onClick={()=>openImageEditor(im)} style={{position:"relative",cursor:"pointer",border: im.done ? "2px solid #22c55e" : "2px solid #facc15", borderRadius:12, overflow:"hidden"}}>
                  <img src={im.url} alt="" style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/>
                  <div style={{background: im.done ? "#22c55e" : "#facc15", color: im.done ? "white" : "black", fontSize:10, fontWeight:"bold", textAlign:"center", padding:"3px"}}>{im.done ? "Done ✅" : "Tap to add details"}</div>
                  {im.done&&<div style={{position:"absolute",top:4,left:4,background:"rgba(0,0,0,0.6)",color:"white",fontSize:10,padding:"2px 6px",borderRadius:999}}>{im.productName} — {im.price}</div>}
                  <button onClick={(e)=>{e.stopPropagation(); setPendingImages(pendingImages.filter(x=>x.id!==im.id));}} style={{position:"absolute",top:4,right:4,background:"red",color:"white",border:"none",borderRadius:999,width:20,height:20,fontSize:11}}>X</button>
                </div>
              ))}
            </div>
            <button onClick={uploadAllImages} disabled={uploadingAll} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:13,borderRadius:12,fontWeight:"bold",marginTop:10}}>{uploadingAll?"Uploading... Please wait.":"Overall Done — Upload All Images"}</button>
            {uploadProgress&&<p style={{fontSize:12,color:"#facc15",fontWeight:"bold",marginTop:6}}>{uploadProgress}</p>}
          </div>)}
          {uploadedImages.length>0&&(<div style={{marginTop:12}}><p style={{fontSize:12,margin:"0 0 6px",opacity:0.8}}>{uploadedImages.length} uploaded ✅</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{uploadedImages.map((im,i)=>(<div key={i} style={{position:"relative",background:"rgba(255,255,255,0.1)",padding:6,borderRadius:10,maxWidth:120}}><img src={im.url} alt="" style={{width:"100%",height:56,borderRadius:8,objectFit:"cover"}}/><div style={{fontSize:11,fontWeight:"bold",marginTop:4}}>{im.productName} — {im.price}</div><div style={{fontSize:10,opacity:0.8}}>{im.desc?.slice(0,40)}</div><button onClick={()=>setUploadedImages(uploadedImages.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:-6,right:-6,background:"red",color:"white",border:"none",borderRadius:999,width:20,height:20,fontSize:11}}>X</button></div>))}</div></div>)}

          {/* V18 VIDEO GALLERY */}
          <p style={{fontWeight:"bold",margin:"18px 0 8px"}}>🎥 Your Product Videos — Same way, tap to add details</p>
          <label style={{display:"block",background:"#c084fc",color:"black",textAlign:"center",padding:12,borderRadius:12,fontWeight:"bold",cursor:"pointer"}}>Select Videos From Gallery<input type="file" accept="video/*" multiple onChange={handleSelectVideos} style={{display:"none"}}/></label>
          <p style={{fontSize:11,opacity:0.7,margin:"6px 0 0"}}>Max 20MB per video. Tap a video to write its Title, Price, Description.</p>
          {pendingVideos.length>0&&(<div style={{marginTop:12}}>
            <p style={{fontSize:12,opacity:0.8}}>{pendingVideos.filter(p=>p.done).length} of {pendingVideos.length} detailed ✅</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {pendingVideos.map((vd)=>(
                <div key={vd.id} onClick={()=>openVideoEditor(vd)} style={{position:"relative",cursor:"pointer",border: vd.done ? "2px solid #22c55e" : "2px solid #facc15", borderRadius:12, overflow:"hidden"}}>
                  <video src={vd.url} style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/>
                  <div style={{background: vd.done ? "#22c55e" : "#facc15", color: vd.done ? "white" : "black", fontSize:10, fontWeight:"bold", textAlign:"center", padding:"3px"}}>{vd.done ? "Done ✅" : "Tap to add details"}</div>
                  {vd.done&&<div style={{position:"absolute",top:4,left:4,background:"rgba(0,0,0,0.6)",color:"white",fontSize:10,padding:"2px 6px",borderRadius:999}}>{vd.productName} — {vd.price}</div>}
                  <button onClick={(e)=>{e.stopPropagation(); setPendingVideos(pendingVideos.filter(x=>x.id!==vd.id));}} style={{position:"absolute",top:4,right:4,background:"red",color:"white",border:"none",borderRadius:999,width:20,height:20,fontSize:11}}>X</button>
                </div>
              ))}
            </div>
            <button onClick={uploadAllVideos} disabled={uploadingAll} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:13,borderRadius:12,fontWeight:"bold",marginTop:10}}>{uploadingAll?"Uploading... Please wait.":"Overall Done — Upload All Videos"}</button>
          </div>)}
          {uploadedVideo&&<div style={{marginTop:12}}><video src={uploadedVideo} controls style={{width:"100%",height:140,objectFit:"cover",borderRadius:12}}/><p style={{fontSize:12,marginTop:4}}>{uploadedVideoMeta?.productName} — {uploadedVideoMeta?.price} ✅</p></div>}

          <div style={{marginTop:12}}>
            <button onClick={()=>setShowSafety(!showSafety)} style={{width:"100%",background:"transparent",border:"none",color:"white",textAlign:"left",padding:"6px 0",fontSize:13,display:"flex",justifyContent:"space-between",cursor:"pointer"}}><span>Safety Rules for Uploads</span><span>{showSafety?"▲":"▼"}</span></button>
            {showSafety&&(<div style={{background:"rgba(255,255,255,0.08)",padding:10,borderRadius:10,fontSize:12,lineHeight:1.5}}>Do not upload nudity, sexual content, images of children, or bank documents, ID cards, passwords, or personal records. Only upload images and videos of your own products. Max 20MB per file. EVA will scan the content inside your image and video, not only the file name. For kids products, do not use children as models for underwear, swimwear, or bikini. Use flat lay photos or a mannequin instead.</div>)}
            <label style={{display:"flex",gap:8,marginTop:8,fontSize:13,lineHeight:1.4,cursor:"pointer"}}><input type="checkbox" checked={confirmedSafe} onChange={(e)=>setConfirmedSafe(e.target.checked)} style={{marginTop:2}}/> I confirm this is my own product image/video and it follows the safety rules.</label>
            {checking&&<p style={{color:"#facc15",fontSize:13,fontWeight:"bold"}}>{checkStatus}</p>}
            {!checking&&checkStatus&&<p style={{fontSize:12,color:"#22c55e"}}>{checkStatus}</p>}
          </div>
        </div>
      )}
      {mode!=="Website"&&<p style={{fontSize:13,opacity:0.7,marginTop:12}}>{mode==="Image"?"Image mode: AI will generate a new image from your description.":"Video mode: AI will generate a new video from your description. This requires a paid video API."}</p>}
      <p style={{marginTop:18,fontWeight:"bold"}}>2. Inspired by? (Optional)</p>
      <input value={inspiredBy} onChange={(e)=>setInspiredBy(e.target.value)} placeholder="Enter a website name or link" style={{width:"100%",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:14,color:"white",padding:13}}/>
      <p style={{marginTop:18,fontWeight:"bold"}}>3. What would you like to change? (Optional)</p>
      <input value={changes} onChange={(e)=>setChanges(e.target.value)} placeholder="Example: Show full details" style={{width:"100%",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:14,color:"white",padding:13}}/>
      <p style={{marginTop:20}}>Create</p>
      <div style={{display:"flex",gap:10}}>{["Website","Image","Video"].map(m=>(<button key={m} onClick={()=>setMode(m)} style={{flex:1,background:mode===m?"#c084fc":"rgba(255,255,255,0.12)",border:"none",color:mode===m?"black":"white",padding:14,borderRadius:14,fontWeight:"bold"}}>{m}</button>))}</div>
      {mode==="Website"?<button onClick={makeSmartSite} style={{width:"100%",background:"#c084fc",border:"none",color:"black",padding:14,borderRadius:999,fontWeight:"bold",marginTop:20,fontSize:16}}>{building?"EVA is building. Please wait.":"Create Website"}</button>
      :<button onClick={handleGenerateAI} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:14,borderRadius:999,fontWeight:"bold",marginTop:20,fontSize:16}}>{building?"AI is creating. Please wait.":mode==="Image"?"Generate AI Image":"Generate AI Video"}</button>}
      {chat&&<div style={{marginTop:14,background:"rgba(167,139,250,0.2)",padding:12,borderRadius:12,fontSize:14}}>EVA: {chat}</div>}
      {mode==="Image"&&generatedImage&&(<div style={{marginTop:16,background:"white",color:"black",borderRadius:16,padding:14}}><b>AI Generated Image</b><img src={generatedImage} alt="" style={{width:"100%",height:300,objectFit:"cover",borderRadius:12,marginTop:10}}/><button onClick={()=>{setUploadedImages([{url:generatedImage,name:"AI Image",productName:"AI Image",price:"$35",desc:"AI generated image."}]); setMode("Website"); setChat("This AI image has been moved to Website Upload.");}} style={{width:"100%",background:"black",border:"none",color:"white",padding:12,borderRadius:999,fontWeight:"bold",marginTop:10}}>Use This Image For Website</button></div>)}
      {mode==="Video"&&generatedVideoMsg&&<div style={{marginTop:14,background:"rgba(255,255,255,0.1)",padding:12,borderRadius:12,fontSize:14}}>{generatedVideoMsg}</div>}
      {built&&mode==="Website"&&(
        <div style={{marginTop:16,background:"white",color:"black",borderRadius:16,overflow:"hidden"}}>
          {built.video?<video src={built.video} controls style={{width:"100%",height:180,objectFit:"cover",display:"block"}}/>:<img src={built.heroImage} alt="" onError={(e)=>{e.target.style.display="none";}} style={{width:"100%",height:180,objectFit:"cover",display:"block"}}/>}
          <div style={{background:built.color,color:"white",padding:18}}><b style={{fontSize:22}}>{built.title}</b><p style={{margin:"6px 0 0"}}>{built.desc}</p>{built.whatsapp&&<p style={{margin:"8px 0 0",fontSize:13,background:"rgba(0,0,0,0.2)",padding:"8px",borderRadius:8}}>WhatsApp: {maskNumber(built.whatsapp.display)} — Added for contact ✅</p>}</div>
          <div style={{padding:16}}>
            {built.items?.map((it,i)=>(<div key={i} onClick={()=>{setSelectedItem(it); setSelectedSize("M");}} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #eee",alignItems:"center",cursor:"pointer"}}><ProductImg item={it} idx={i} size="small"/><div style={{flex:1}}><b>{it.name}</b><div style={{fontSize:13,opacity:0.6}}>Tap to view details</div></div><b style={{color:built.color}}>{it.price}</b></div>))}
            <button onClick={()=>setLiveMode(true)} style={{width:"100%",background:"black",border:"none",color:"white",padding:14,borderRadius:999,fontWeight:"bold",marginTop:14}}>View Live Shop</button>
            <p style={{textAlign:"center",fontSize:12,opacity:0.6,marginTop:10}}>V18.0 — Gallery Details: Tap each image/video, write details, Done, Upload All</p>
          </div>
        </div>
      )}
      {selectedItem&&!liveMode&&built&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{background:"white",color:"black",width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:"20px 20px 0 0",padding:16}}><button onClick={()=>setSelectedItem(null)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Back to Shop</button><ProductImg item={selectedItem} idx={999} size="large"/><h2>{selectedItem.name}</h2><b style={{color:built.color,fontSize:22}}>{selectedItem.price}</b><p>{selectedItem.desc}</p><button onClick={()=>{setCart([...cart,{...selectedItem,size:selectedSize}]); setSelectedItem(null);}} style={{width:"100%",background:built.color,border:"none",color:"white",padding:15,borderRadius:999,fontWeight:"bold",marginTop:12}}>Add to Cart — {selectedItem.price}</button></div></div>)}

      {/* V18 - Small box for Image details */}
      {editingImageId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",color:"black",width:"100%",borderRadius:"20px 20px 0 0",padding:16,maxHeight:"92vh",overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{margin:0}}>Add details for this image</h3><button onClick={()=>setEditingImageId(null)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>
            <p style={{fontSize:12,opacity:0.6}}>Write what this product is. EVA will use this exact name, price, description.</p>
            <label style={{fontWeight:"bold",fontSize:13}}>Product Name *</label>
            <input value={editName} onChange={(e)=>setEditName(e.target.value)} placeholder="e.g. iPhone 13, Red Dress, White Sneakers" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Price *</label>
            <input value={editPrice} onChange={(e)=>setEditPrice(e.target.value)} placeholder="e.g. $400 or 400" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Description / Anything you want</label>
            <textarea value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} placeholder="e.g. UK used, battery 92%, clean, no scratch. Size M, L, XL available." style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15,minHeight:80}}/>
            <button onClick={saveImageDetail} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:14,borderRadius:999,fontWeight:"bold",fontSize:16}}>Done ✅ — Mark this image</button>
          </div>
        </div>
      )}
      {/* V18 - Small box for Video details */}
      {editingVideoId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",color:"black",width:"100%",borderRadius:"20px 20px 0 0",padding:16,maxHeight:"92vh",overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{margin:0}}>Add details for this video</h3><button onClick={()=>setEditingVideoId(null)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>
            <p style={{fontSize:12,opacity:0.6}}>Write what this video is about. Same rules: max 20MB.</p>
            <label style={{fontWeight:"bold",fontSize:13}}>Video Title *</label>
            <input value={editName} onChange={(e)=>setEditName(e.target.value)} placeholder="e.g. iPhone 13 Promo Video" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Price *</label>
            <input value={editPrice} onChange={(e)=>setEditPrice(e.target.value)} placeholder="e.g. $400 or 400" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Description</label>
            <textarea value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} placeholder="e.g. This video shows the phone working, camera test, etc." style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15,minHeight:80}}/>
            <button onClick={saveVideoDetail} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:14,borderRadius:999,fontWeight:"bold",fontSize:16}}>Done ✅ — Mark this video</button>
          </div>
        </div>
      )}
      <p style={{textAlign:"center",fontSize:12,opacity:0.6,marginTop:16}}>EVA creates original designs. Copying brands, logos, or illegal content is not allowed.</p>
    </div>
  );
    }
