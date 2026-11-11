"use client";
import { useState, useRef, useEffect } from "react";

// V20.1 - NO MORE LOSS + SMART OPTIONS FOR ANY PRODUCT + NO DUPLICATE
// FIX 1: Images saved as Base64 (not blob) so they survive Back / Refresh / Close tab
// FIX 2: Phone Back button handled - Product Detail -> Shop, Shop -> Builder, Builder keeps My Saved Shops
// FIX 3: Smart Options - Phone = Storage, Cloth = S/M/L/XL, Shoe = 38-44, Hair = Short/Medium/Long + Inches, Food = S/M/L, Perfume = ml, Others = No size, just Description
// FIX 4: After Create Shop, uploaded images cleared - Add New Product starts empty, no duplicate
// Same rules: Max 20MB per file, safety check.

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
  else { const idx2 = full.toLowerCase().indexOf("sell"); if(idx2 !== -1) after = full.slice(idx2 + 4); }
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
    items.push({ name: name.charAt(0).toUpperCase()+name.slice(1), price: `$${price}`, img: `https://loremflickr.com/800/600/${encodeURIComponent(name)}?lock=${Math.floor(Math.random()*1000)}`, desc: `${name} - Quality product. Fast delivery. In Stock.`, soldOut:false, id: Date.now()+"-"+Math.random() });
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
  return [1,2,3,4].map(i=>({ name:`${cat} ${i}`, price:`$${30+i*5}`, img:`https://loremflickr.com/800/600/${encodeURIComponent(cat)}?lock=${i}`, desc:`Quality ${cat} - Best seller. Fast delivery.`, soldOut:false, id: Date.now()+"-"+i }));
}
function emojiFor(name){
  const n=(name||"").toLowerCase();
  if(n.includes("phone")||n.includes("iphone")||n.includes("samsung")||n.includes("tecno")||n.includes("infinix")) return "📱";
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
  if(n.includes("phone")||n.includes("iphone")||n.includes("samsung")) return "#dbeafe";
  if(n.includes("sneaker")||n.includes("shoe")) return "#e0e7ff";
  if(n.includes("wig")||n.includes("hair")) return "#fce7f3";
  return "#e5e7eb";
}
// V20.1 - SMART OPTIONS FOR ANY PRODUCT - Reads Name + Description together
// Phone = Storage, Cloth = S/M/L/XL, Shoe = 38-44, Hair = Short/Medium/Long + Inches, Food = S/M/L, Perfume = ml, Unknown = No size, just Description
function getOptionsFor(name, desc){
  const n = ((name||"")+" "+(desc||"")).toLowerCase();
  // PHONE - Storage, never S/M/L
  if(n.includes("phone")||n.includes("iphone")||n.includes("samsung")||n.includes("tecno")||n.includes("infinix")||n.includes("itel")||n.includes("redmi")||n.includes("pixel")||n.includes("oppo")||n.includes("vivo")||n.includes("nokia")||n.includes("huawei"))
    return { label:"Storage", options:["128GB","256GB","512GB"] };
  // SHOE - Shoe size
  if(n.includes("sneaker")||n.includes("shoe")||n.includes("sandal")||n.includes("heel")||n.includes("boot")||n.includes("slippers")||n.includes("crocs"))
    return { label:"Shoe Size", options:["38","39","40","41","42","43","44"] };
  // HAIR / WIG - Long, Short, Medium + Inches - exactly like real hair websites
  if(n.includes("wig")||n.includes("hair")||n.includes("bone straight")||n.includes("frontal")||n.includes("closure")||n.includes("brazilian")||n.includes("peruvian"))
    return { label:"Length", options:["Short - 10\"","Medium - 16\"","Long - 22\"","Extra Long - 28\"","30\""] };
  // CLOTH - S/M/L/XL
  if(n.includes("dress")||n.includes("shirt")||n.includes("cloth")||n.includes("top")||n.includes("gown")||n.includes("jacket")||n.includes("trouser")||n.includes("jean")||n.includes("hoodie")||n.includes("bra")||n.includes("underwear")||n.includes("pant")||n.includes("bikini")||n.includes("swim")||n.includes("abaya")||n.includes("skirt"))
    return { label:"Size", options:["S","M","L","XL"] };
  // FOOD / CAKE - Small / Medium / Large
  if(n.includes("cake")||n.includes("food")||n.includes("pizza")||n.includes("shawarma")||n.includes("burger")||n.includes("small chops")||n.includes("rice"))
    return { label:"Size", options:["Small","Medium","Large"] };
  // PERFUME / CREAM / OIL - Size in ml
  if(n.includes("perfume")||n.includes("cream")||n.includes("oil")||n.includes("serum")||n.includes("lotion"))
    return { label:"Size", options:["50ml","100ml","200ml"] };
  // UNKNOWN PRODUCT - No forced option, just show description like real website
  // Example: If you sell "Handmade Beads", e go show no size, just your description
  return { label:"", options:[] };
}
const BLOCKED_TEXT = ["nude","naked","porn","xxx","onlyfans","escort","prostitut","child porn","kid nude","sex with minor","minor sex","school girl","schoolgirl","clone","copy exactly","exact copy","replica","pirate","crack","fake bank","phishing","fake login","steal password","fake paypal","fake crypto","scam","fake shop","bomb","hack","ddos","fake id","fake passport","drugs","how to steal","weapon","kill","murder","terror","hate","bank card","bank account","credit card number","password","otp","pin code"];
const BLOCKED_CHILD_MODEL = ["child","kid","pikin","teen","minor","baby","toddler","school"];
const BLOCKED_FILE = ["nude","naked","porn","xxx","onlyfans","escort","bank","password","otp","pin","passport","id card","credit card","nudes"];
const BLOCKED_OCR = ["bank","account number","credit card","debit card","password","otp","pin code","passport","national id","id card","sort code","routing number","iban","swift"];
const LINGERIE_WORDS = ["underwear","pikini","pant","bra","lingerie","bikini","swimwear","swimsuit","panties","boxer","brief"];
function loadScript(src){ return new Promise((res,rej)=>{ if(document.querySelector(`script[src="${src}"]`)) return res(); const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
// V20 - Convert file to Base64 so it survives refresh / Back button
function fileToBase64(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }

export default function Build(){
  const [prompt,setPrompt]=useState("");
  const [inspiredBy,setInspiredBy]=useState("");
  const [changes,setChanges]=useState("");
  const [mode,setMode]=useState("Website");
  const [building,setBuilding]=useState(false);
  const [built,setBuilt]=useState(null);
  const [chat,setChat]=useState("");
  const [selectedItem,setSelectedItem]=useState(null);
  const [selectedOption,setSelectedOption]=useState(""); // V20 - smart option, not just Size
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

  const [ownerPin,setOwnerPin]=useState("");
  const [isOwner,setIsOwner]=useState(false);
  const [showOwnerLogin,setShowOwnerLogin]=useState(false);
  const [loginPinInput,setLoginPinInput]=useState("");
  const [myShops,setMyShops]=useState([]);
  const [showMyShops,setShowMyShops]=useState(false);
  const [editingProduct,setEditingProduct]=useState(null);
  const [editProdName,setEditProdName]=useState("");
  const [editProdPrice,setEditProdPrice]=useState("");
  const [editProdDesc,setEditProdDesc]=useState("");
  const [showAddProduct,setShowAddProduct]=useState(false);
  const [showEditStore,setShowEditStore]=useState(false);
  const [editStoreTitle,setEditStoreTitle]=useState("");
  const [editStoreDesc,setEditStoreDesc]=useState("");

  const [pendingImages,setPendingImages]=useState([]);
  const [pendingVideos,setPendingVideos]=useState([]);
  const [editingImageId,setEditingImageId]=useState(null);
  const [editingVideoId,setEditingVideoId]=useState(null);
  const [editName,setEditName]=useState("");
  const [editPrice,setEditPrice]=useState("");
  const [editDesc,setEditDesc]=useState("");
  const [uploadingAll,setUploadingAll]=useState(false);
  const [uploadProgress,setUploadProgress]=useState("");

  // V20 - Load saved shops + restore last shop on enter, so Back button no kill am
  useEffect(()=>{
    try{
      const saved = JSON.parse(localStorage.getItem("eva_my_shops")||"[]");
      // Filter out old blob shops that are dead - only keep base64 or http shops
      const valid = saved.filter(s=> s.items && s.items.every(it=> !String(it.img||"").startsWith("blob:")));
      if(valid.length!==saved.length) localStorage.setItem("eva_my_shops", JSON.stringify(valid));
      setMyShops(valid);
      if(valid.length>0) setShowMyShops(true);
    }catch(e){}
  },[]);
  // V20 - Handle phone Back button: Product Detail -> Shop, Shop -> Builder, Builder -> stay
  useEffect(()=>{
    const onPop = ()=>{
      if(selectedItem){ setSelectedItem(null); return; }
      if(showCart){ setShowCart(false); return; }
      if(showAddProduct){ setShowAddProduct(false); return; }
      if(showEditStore){ setShowEditStore(false); return; }
      if(editingProduct){ setEditingProduct(null); return; }
      if(editingImageId){ setEditingImageId(null); return; }
      if(editingVideoId){ setEditingVideoId(null); return; }
      if(showOwnerLogin){ setShowOwnerLogin(false); return; }
      if(liveMode){ setLiveMode(false); return; }
      // If in builder, do nothing - stay in builder, don't lose data
    };
    window.addEventListener("popstate", onPop);
    return ()=>window.removeEventListener("popstate", onPop);
  },[selectedItem,showCart,showAddProduct,showEditStore,editingProduct,editingImageId,editingVideoId,showOwnerLogin,liveMode]);
  const pushHistory=(label)=>{ try{ window.history.pushState({v20:label}, "", "#"+label); }catch(e){} };

  const saveShopToStorage=(site)=>{
    try{
      const all = JSON.parse(localStorage.getItem("eva_my_shops")||"[]");
      const existingIdx = all.findIndex(s=>s.id===site.id);
      if(existingIdx>=0) all[existingIdx]=site;
      else all.unshift(site);
      // Keep only last 5 shops to avoid storage full - Base64 is big
      const trimmed = all.slice(0,5);
      localStorage.setItem("eva_my_shops", JSON.stringify(trimmed));
      setMyShops(trimmed);
    }catch(e){ alert("Storage is full. Please delete old shops or use smaller images (max 20MB, but try <2MB for best save). Your shop is still shown now, but may not save after refresh."); }
  };

  const getPriceNum=(p)=>{ const n=parseFloat(String(p||"").replace(/[^0-9.]/g,"")); return isNaN(n)?0:n; };
  const cartTotal=cart.reduce((s,c)=>s+getPriceNum(c.price),0);
  const handleImgError=(e,name,key)=>{ if(key) setFailedImgs(p=>({...p,[key]:true})); e.target.style.display="none"; };
  const ProductImg=({item,idx,size})=>{
    const key=`${item.name}-${idx}`; const isFailed=failedImgs[key];
    const w=size==="large"?"100%":size==="small"?60:80; const h=size==="large"?300:size==="small"?60:80;
    if(isFailed) return <div style={{width:w,height:h,minWidth:w,background:colorFor(item.name),borderRadius:size==="large"?14:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size==="large"?64:28,flexShrink:0}}>{emojiFor(item.name)}</div>;
    return <img src={item.img} alt={item.name} onError={(e)=>handleImgError(e,item.name,key)} style={{width:w,height:h,minWidth:w,borderRadius:size==="large"?14:12,objectFit:"cover",flexShrink:0}} />;
  };
  const openProduct=(item)=>{
    setSelectedItem(item);
    const opts = getOptionsFor(item.name, item.desc);
    setSelectedOption(opts.options[0]||"");
    pushHistory("product");
  };
  const closeProduct=()=>{ setSelectedItem(null); };

  const loadNSFWModel=async()=>{ if(modelRef.current) return modelRef.current; setCheckStatus("Loading safety AI model. Please wait..."); await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js"); await loadScript("https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js"); const m=await window.nsfwjs.load(); modelRef.current=m; return m; };
  const isNSFWPrediction=(preds)=>{ const g=(n)=>{ const p=preds.find(x=>x.className===n); return p?p.probability:0; }; const porn=g("Porn"); const hen=g("Hentai"); if(porn>0.70||hen>0.70) return {blocked:true,reason:`Porn ${Math.round(porn*100)}% / Hentai ${Math.round(hen*100)}%`}; return {blocked:false,reason:""}; };
  const checkImageWithAI=async(u)=>{ try{ const m=await loadNSFWModel(); const img=new Image(); img.crossOrigin="anonymous"; img.src=u; await new Promise((a,b)=>{img.onload=a; img.onerror=b;}); const p=await m.classify(img); return isNSFWPrediction(p); }catch(e){ return {blocked:false,reason:""}; } };
  const checkVideoWithAI=async(u)=>{ try{ const m=await loadNSFWModel(); const v=document.createElement("video"); v.src=u; v.muted=true; v.playsInline=true; await new Promise(r=>{v.onloadedmetadata=r;}); const d=v.duration||3; const times=[0.5,d/2,Math.max(0.5,d-0.5)]; for(let t of times){ v.currentTime=Math.min(t,d-0.1); await new Promise(r=>{v.onseeked=r; setTimeout(r,500);}); const c=document.createElement("canvas"); c.width=v.videoWidth||400; c.height=v.videoHeight||400; const ctx=c.getContext("2d"); ctx.drawImage(v,0,0,c.width,c.height); const img=new Image(); img.src=c.toDataURL("image/jpeg",0.8); await new Promise(r=>{img.onload=r;}); const p=await m.classify(img); const r2=isNSFWPrediction(p); if(r2.blocked) return r2; } return {blocked:false,reason:""}; }catch(e){ return {blocked:false,reason:""}; } };
  const checkTextWithOCR=async(u)=>{ try{ await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"); const w=await window.Tesseract.createWorker("eng"); const r=await w.recognize(u); await w.terminate(); const t=(r.data.text||"").toLowerCase(); const f=BLOCKED_OCR.find(x=>t.includes(x)); if(f) return {blocked:true,reason:`Document text detected: "${f}"`}; return {blocked:false,reason:""}; }catch(e){ return {blocked:false,reason:""}; } };
  const isChildModelRequest=(t)=>{ const s=(t||"").toLowerCase(); const hc=BLOCKED_CHILD_MODEL.some(w=>s.includes(w)); const hu=LINGERIE_WORDS.some(w=>s.includes(w))||s.includes("model")||s.includes("showroom")||s.includes("wearing"); return hc&&hu; };

  // V20 - Select images as Base64, not blob, so they survive Back / Refresh
  const handleSelectImages=async(e)=>{
    const files=Array.from(e.target.files||[]);
    const newItems=[];
    for(const f of files){
      if(!f.type.startsWith("image/")){ alert("Please select an image file only."); continue; }
      if(f.size>20*1024*1024){ alert(`"${f.name}" is too large. Maximum is 20MB per file. Try <2MB for best save.`); continue; }
      const fname=f.name.toLowerCase(); const bad=BLOCKED_FILE.find(w=>fname.includes(w));
      if(bad){ alert(`"${f.name}" cannot be used. File name contains blocked word: "${bad}".`); continue; }
      const base64 = await fileToBase64(f);
      newItems.push({ id: Date.now()+"-"+Math.random(), url: base64, file: f, fileName: f.name, productName:"", price:"", desc:"", done:false });
    }
    if(newItems.length>0) setPendingImages(p=>[...p,...newItems]);
    e.target.value="";
  };
  const handleSelectVideos=async(e)=>{
    const files=Array.from(e.target.files||[]);
    const newItems=[];
    for(const f of files){
      if(!f.type.startsWith("video/")){ alert("Please select a video file only."); continue; }
      if(f.size>20*1024*1024){ alert(`"${f.name}" is too large. Maximum is 20MB per file.`); continue; }
      const fname=f.name.toLowerCase(); const bad=BLOCKED_FILE.find(w=>fname.includes(w));
      if(bad){ alert(`"${f.name}" cannot be used. File name contains blocked word: "${bad}".`); continue; }
      const base64 = await fileToBase64(f);
      newItems.push({ id: Date.now()+"-"+Math.random(), url: base64, file: f, fileName: f.name, productName:"", price:"", desc:"", done:false });
    }
    if(newItems.length>0) setPendingVideos(p=>[...p,...newItems]);
    e.target.value="";
  };
  const openImageEditor=(item)=>{ setEditingImageId(item.id); setEditName(item.productName||""); setEditPrice(item.price||""); setEditDesc(item.desc||""); pushHistory("edit-image"); };
  const openVideoEditor=(item)=>{ setEditingVideoId(item.id); setEditName(item.productName||""); setEditPrice(item.price||""); setEditDesc(item.desc||""); pushHistory("edit-video"); };
  const saveImageDetail=()=>{
    if(!editName.trim()){ alert("Please write Product Name."); return; }
    if(!editPrice.trim()){ alert("Please write Price."); return; }
    setPendingImages(p=>p.map(it=> it.id===editingImageId ? {...it, productName: editName.trim(), price: editPrice.trim().startsWith("$")?editPrice.trim():`$${editPrice.trim()}`, desc: editDesc.trim()||`${editName.trim()} - Quality product. Fast delivery.`, done:true} : it));
    setEditingImageId(null); setEditName(""); setEditPrice(""); setEditDesc("");
  };
  const saveVideoDetail=()=>{
    if(!editName.trim()){ alert("Please write Video Title."); return; }
    if(!editPrice.trim()){ alert("Please write Price."); return; }
    setPendingVideos(p=>p.map(it=> it.id===editingVideoId ? {...it, productName: editName.trim(), price: editPrice.trim().startsWith("$")?editPrice.trim():`$${editPrice.trim()}`, desc: editDesc.trim()||`${editName.trim()} - Watch this product video.`, done:true} : it));
    setEditingVideoId(null); setEditName(""); setEditPrice(""); setEditDesc("");
  };
  const uploadAllImages=async()=>{
    if(pendingImages.length===0) return alert("No images selected yet.");
    if(!confirmedSafe) return alert("Please confirm that these are your own product images and they follow the safety rules.");
    const notDone = pendingImages.filter(p=>!p.done);
    if(notDone.length>0){ const go = window.confirm(`${notDone.length} image(s) have no details yet. Upload with auto name? Press OK to continue, Cancel to add details first.`); if(!go) return; }
    setUploadingAll(true); setChecking(true);
    for(let i=0;i<pendingImages.length;i++){
      const it = pendingImages[i];
      setUploadProgress(`Checking image ${i+1} of ${pendingImages.length}...`);
      setCheckStatus(`Checking image ${i+1} of ${pendingImages.length}. Please wait...`);
      const ai=await checkImageWithAI(it.url);
      if(ai.blocked){ alert(`"${it.productName||it.fileName}" was rejected. Reason: ${ai.reason}. Skipped.`); continue; }
      const ocr=await checkTextWithOCR(it.url);
      if(ocr.blocked){ alert(`"${it.productName||it.fileName}" was rejected. Reason: ${ocr.reason}. Skipped.`); continue; }
      const name = it.productName || `Product ${uploadedImages.length+i+1}`;
      const price = it.price || "$35";
      const desc = it.desc || `${name} - Quality product. Fast delivery.`;
      setUploadedImages(p=>[...p,{url:it.url, name: it.fileName, productName:name, price, desc}]);
    }
    setPendingImages([]); setUploadingAll(false); setChecking(false); setCheckStatus("All images uploaded. They are now saved safely - Back button will not delete them."); setUploadProgress("");
    setChat("All your images have been uploaded with their details. Now press Create Website.");
  };
  const uploadAllVideos=async()=>{
    if(pendingVideos.length===0) return alert("No video selected yet.");
    if(!confirmedSafe) return alert("Please confirm that this is your own product video and it follows the safety rules.");
    const notDone = pendingVideos.filter(p=>!p.done);
    if(notDone.length>0){ const go = window.confirm(`${notDone.length} video(s) have no details yet. Upload with auto name?`); if(!go) return; }
    setUploadingAll(true); setChecking(true);
    for(let i=0;i<pendingVideos.length;i++){
      const it = pendingVideos[i];
      setUploadProgress(`Checking video ${i+1} of ${pendingVideos.length}...`);
      setCheckStatus(`Checking video ${i+1} of ${pendingVideos.length}. AI is checking 3 frames. Please wait...`);
      const ai=await checkVideoWithAI(it.url);
      if(ai.blocked){ alert(`Video "${it.productName||it.fileName}" was rejected. Reason: ${ai.reason}. Skipped.`); continue; }
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
    let pin = ownerPin.trim();
    if(!pin){
      const p = window.prompt("OWNER SETUP: Choose a 4-digit PIN for your shop (e.g. 1234). Only you with this PIN can edit your shop. Customers will NOT see this. Enter your PIN:");
      if(!p || p.length<4){ alert("Please choose a 4-digit PIN to protect your shop."); return; }
      pin = p.trim(); setOwnerPin(pin);
    }
    setBuilding(true); setBuilt(null); setChat(""); setSelectedItem(null); setCart([]); setFailedImgs({}); setIsOwner(true);
    let myProducts = null;
    if(uploadedImages.length>0){
      myProducts = uploadedImages.map((up,i)=>({ id: Date.now()+"-"+i+"-"+Math.random(), name: up.productName||up.name||"Product", price: up.price||"$35", img: up.url, desc: up.desc||"Quality product. Fast delivery.", soldOut:false }));
    } else {
      myProducts = parseProductsFromPrompt(prompt+" "+changes) || genericFallback(prompt);
    }
    const waInfo=extractWhatsApp(prompt)||extractWhatsApp(inspiredBy+" "+changes);
    const title = makeShortTitle(prompt,"");
    const heroKeyword = encodeURIComponent(title || "store");
    const heroImage = uploadedImages.length>0 ? uploadedImages[0].url : `https://loremflickr.com/1200/600/${heroKeyword}?lock=999`;
    const site = { id: Date.now().toString(), title, desc:"Quality products for modern customers. Free Delivery • Easy Returns • Quality You Can Trust.", color:"#a78bfa", heroImage, items: myProducts, cta:"Shop Now", extra:"Your website is ready with your product details.", video: uploadedVideo || null, videoMeta: uploadedVideoMeta || null, ownerPin: pin, whatsapp: waInfo || null, createdAt: new Date().toLocaleString() };
    if(waInfo){ site.extra=`WhatsApp contact added: ${maskNumber(waInfo.display)}. Customers can order on WhatsApp.`; }
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:`Write a short 1-sentence store description for: "${prompt}". Return ONLY JSON: {"desc":"..."}` ,history:[]})});
      const data=await res.json(); let text=data.reply||data.text||""; const s=text.indexOf("{"); const e=text.lastIndexOf("}");
      if(s!==-1&&e!==-1){ const j=JSON.parse(text.slice(s,e+1)); if(j.desc) site.desc=j.desc.slice(0,110); }
    }catch(e){}
    setBuilt(site); saveShopToStorage(site);
    // V20 FIX - Clear uploaded so Add New Product starts empty, no duplicate
    setUploadedImages([]); setUploadedVideo(null); setUploadedVideoMeta(null); setPendingImages([]); setPendingVideos([]);
    setChat(site.extra+" Your shop is SAVED. Even if you press Back or close tab, go to My Saved Shops to open it again."); setBuilding(false);
    pushHistory("shop-created");
  };

  const updateBuiltAndSave=(newSite)=>{ setBuilt(newSite); saveShopToStorage(newSite); };
  const toggleSoldOut=(id)=>{
    if(!isOwner) return alert("Only owner can do this. Press Owner Login and enter your PIN.");
    const newItems = built.items.map(it=> it.id===id ? {...it, soldOut: !it.soldOut} : it);
    updateBuiltAndSave({...built, items: newItems});
  };
  const deleteProduct=(id)=>{
    if(!isOwner) return;
    if(!window.confirm("Delete this product?")) return;
    const newItems = built.items.filter(it=>it.id!==id);
    updateBuiltAndSave({...built, items: newItems});
  };
  const openEditProduct=(item)=>{ setEditingProduct(item); setEditProdName(item.name); setEditProdPrice(item.price); setEditProdDesc(item.desc); pushHistory("edit-product"); };
  const saveEditProduct=()=>{
    if(!editProdName.trim()||!editProdPrice.trim()) return alert("Please fill Name and Price.");
    const newItems = built.items.map(it=> it.id===editingProduct.id ? {...it, name: editProdName.trim(), price: editProdPrice.trim().startsWith("$")?editProdPrice.trim():`$${editProdPrice.trim()}`, desc: editProdDesc.trim()} : it);
    updateBuiltAndSave({...built, items: newItems}); setEditingProduct(null);
  };
  const addUploadedToShop=()=>{
    if(uploadedImages.length===0) return alert("No uploaded images to add.");
    const existingUrls = new Set(built.items.map(it=>it.img));
    const newOnes = uploadedImages.filter(u=>!existingUrls.has(u.url)).map((u,i)=>({ id: Date.now()+"-"+i+"-"+Math.random(), name: u.productName||"New Product", price: u.price||"$35", img: u.url, desc: u.desc||"New product. Fast delivery.", soldOut:false }));
    if(newOnes.length===0) return alert("These images are already in your shop. Select NEW images.");
    updateBuiltAndSave({...built, items: [...built.items, ...newOnes]});
    setUploadedImages([]); setShowAddProduct(false); setChat("New product(s) added to your shop.");
  };
  const openShopFromMyShops=(shop)=>{
    setBuilt(shop); setIsOwner(false); setLiveMode(true); setCart([]); pushHistory("live-shop");
    setChat("This is customer view. Press Owner Login to edit. Your shop was restored from saved shops - Back button will not delete it.");
  };
  const tryOwnerLogin=()=>{
    if(!built) return;
    if(loginPinInput.trim()===built.ownerPin){ setIsOwner(true); setShowOwnerLogin(false); setLoginPinInput(""); setChat("Owner login successful. You can now edit your shop. Customers do NOT see these buttons."); }
    else { alert("Wrong PIN. Only the owner with correct PIN can edit."); }
  };
  const goBackToBuilder=()=>{ setLiveMode(false); setSelectedItem(null); setShowCart(false); setChat("You are back in Builder. Your shop is still saved in My Saved Shops below. It is NOT lost."); };

  if(liveMode&&built){
    return (
      <div style={{minHeight:"100dvh",background:"white",color:"black",fontFamily:"sans-serif"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",background:"black",color:"white",position:"sticky",top:0,zIndex:10}}>
          <b style={{fontSize:20}}>{built.title}</b>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>{setShowCart(true); pushHistory("cart");}} style={{background:"white",border:"none",color:"black",padding:"8px 14px",borderRadius:999,fontWeight:"bold"}}>Cart ({cart.length})</button>
            {isOwner ? (
              <button onClick={()=>{setIsOwner(false); setChat("You logged out of Owner Mode. Now showing Customer View.");}} style={{background:"#22c55e",border:"none",color:"white",padding:"8px 10px",borderRadius:999,fontSize:12,fontWeight:"bold"}}>Owner: Logout</button>
            ) : (
              <button onClick={()=>{setShowOwnerLogin(true); pushHistory("owner-login");}} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",padding:"8px 10px",borderRadius:999,fontSize:12}}>Owner Login</button>
            )}
            <button onClick={goBackToBuilder} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",padding:"8px 10px",borderRadius:999,fontSize:12}}>Back to Builder (Shop Saved)</button>
          </div>
        </div>
        {isOwner&&<div style={{background:"#fef3c7",padding:"12px 16px",borderBottom:"1px solid #fde68a"}}><b>👑 Owner Mode ON</b> — Only you see Edit / Sold Out / Delete buttons. Customers do NOT see them. <button onClick={()=>{setEditStoreTitle(built.title); setEditStoreDesc(built.desc); setShowEditStore(true); pushHistory("edit-store");}} style={{background:"black",color:"white",border:"none",padding:"6px 12px",borderRadius:999,fontSize:12,marginLeft:8}}>Edit Store Info</button> <button onClick={()=>{setShowAddProduct(true); pushHistory("add-product");}} style={{background:"#22c55e",color:"white",border:"none",padding:"6px 12px",borderRadius:999,fontSize:12}}>Add New Product +</button></div>}
        {built.video?<div><video src={built.video} controls style={{width:"100%",maxHeight:320,objectFit:"cover",display:"block",background:"black"}}/>{built.videoMeta&&<div style={{padding:"12px 16px",background:"#f8fafc"}}><b>{built.videoMeta.productName}</b> — <b>{built.videoMeta.price}</b><p style={{margin:"4px 0 0",fontSize:13}}>{built.videoMeta.desc}</p></div>}</div>:<img src={built.heroImage} alt="" style={{width:"100%",height:220,objectFit:"cover",display:"block"}} onError={(e)=>{e.target.style.display="none";}}/>}
        <div style={{background:built.color,color:"white",padding:20}}><b style={{fontSize:26}}>{built.title}</b><p style={{margin:"6px 0 0",lineHeight:1.5}}>{built.desc}</p><p style={{fontSize:13,marginTop:8}}>Free Delivery • Easy Returns • Quality You Can Trust</p>
        {built.whatsapp&&<a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:12}}>Chat on WhatsApp — Order Now</a>}
        </div>
        <div style={{padding:16}}><h3>Shop All Products</h3>{built.items?.map((it,i)=>(
          <div key={it.id||i} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #eee",alignItems:"center",opacity: it.soldOut?0.5:1}}>
            <div onClick={()=>{if(!it.soldOut) openProduct(it);}} style={{display:"flex",gap:12,flex:1,alignItems:"center",cursor: it.soldOut?"not-allowed":"pointer"}}>
              <ProductImg item={it} idx={i}/>
              <div style={{flex:1}}><b>{it.name}</b> {it.soldOut&&<span style={{background:"#ef4444",color:"white",fontSize:10,padding:"2px 8px",borderRadius:999,marginLeft:6}}>SOLD OUT</span>}<div style={{fontSize:13,opacity:0.6}}>{it.soldOut?"Sold out - check back soon":"Tap to view details"}</div><div style={{fontSize:12,color: it.soldOut?"#ef4444":"#22c55e",fontWeight:"bold"}}>{it.soldOut?"Out of Stock":"In Stock"}</div></div><b style={{color:built.color}}>{it.price}</b>
            </div>
            {isOwner&&(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <button onClick={()=>toggleSoldOut(it.id)} style={{background: it.soldOut?"#22c55e":"#f59e0b",border:"none",color:"white",padding:"6px 10px",borderRadius:999,fontSize:11,fontWeight:"bold"}}>{it.soldOut?"Back In Stock":"Mark Sold Out"}</button>
                <button onClick={()=>openEditProduct(it)} style={{background:"black",border:"none",color:"white",padding:"6px 10px",borderRadius:999,fontSize:11}}>Edit</button>
                <button onClick={()=>deleteProduct(it.id)} style={{background:"#fee2e2",border:"none",color:"#ef4444",padding:"6px 10px",borderRadius:999,fontSize:11,fontWeight:"bold"}}>Delete</button>
              </div>
            )}
          </div>))}</div>
        {built.whatsapp&&<div style={{margin:"0 16px 16px",background:"#f0fdf4",border:"1px solid #bbf7d0",padding:14,borderRadius:12}}><b>Contact Seller</b><p style={{margin:"6px 0 0",fontSize:14}}>WhatsApp: {maskNumber(built.whatsapp.display)}<br/>Tap below to chat directly.</p><a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:10}}>Open WhatsApp</a></div>}
        {selectedItem&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{background:"white",width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:"20px 20px 0 0",padding:16}}><button onClick={closeProduct} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>← Back to Shop (Not Back to EVA)</button><ProductImg item={selectedItem} idx={999} size="large"/><h2>{selectedItem.name}</h2><b style={{fontSize:24,color:built.color}}>{selectedItem.price}</b><p>{selectedItem.desc}</p>
        {/* V20.1 SMART OPTIONS - Name + Desc */}
        {(()=>{ const opts=getOptionsFor(selectedItem.name, selectedItem.desc); if(opts.options.length===0) return null; return (<div><p style={{fontWeight:"bold",margin:"12px 0 6px"}}>{opts.label}:</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{opts.options.map(s=>(<button key={s} onClick={()=>setSelectedOption(s)} style={{padding:"10px 18px",borderRadius:999,border:selectedOption===s?`2px solid ${built.color}`:"1px solid #ccc",background:selectedOption===s?built.color:"white",color:selectedOption===s?"white":"black",fontWeight:"bold"}}>{s}</button>))}</div></div>); })()}
        <button onClick={()=>{if(selectedItem.soldOut) return alert("This product is sold out."); setCart([...cart,{...selectedItem, option:selectedOption}]); setSelectedItem(null); setShowCart(true);}} style={{width:"100%",background:built.color,border:"none",color:"white",padding:15,borderRadius:999,fontWeight:"bold",marginTop:12}}>Add to Cart — {selectedItem.price} {selectedOption?`(${selectedOption})`:""}</button>{built.whatsapp&&<a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:10}}>Ask on WhatsApp</a>}</div></div>)}
        {showCart&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:60,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{background:"white",width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:"20px 20px 0 0",padding:16}}><div style={{display:"flex",justifyContent:"space-between"}}><h2>Your Cart ({cart.length})</h2><button onClick={()=>setShowCart(false)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>{cart.length===0?<p>Your cart is empty.</p>:cart.map((c,i)=>(<div key={i} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:"1px solid #eee",alignItems:"center"}}><ProductImg item={c} idx={i} size="small"/><div style={{flex:1}}><b>{c.name}</b><div style={{fontSize:13}}>{c.option?`${getOptionsFor(c.name, c.desc).label}: ${c.option}`:""}</div></div><b>{c.price}</b><button onClick={()=>setCart(cart.filter((_,idx)=>idx!==i))} style={{background:"#fee",border:"none",padding:"6px 10px",borderRadius:999}}>Remove</button></div>))}<h3 style={{textAlign:"right"}}>Total: ${cartTotal.toFixed(2)}</h3><button onClick={()=>{if(!cart.length) return alert("Your cart is empty."); alert("Thank you. Your order is confirmed."); setCart([]); setShowCart(false);}} style={{width:"100%",background:"black",border:"none",color:"white",padding:15,borderRadius:999,fontWeight:"bold"}}>Checkout — ${cartTotal.toFixed(2)}</button>{built.whatsapp&&<a href={built.whatsapp.waLink} target="_blank" rel="noreferrer" style={{display:"block",background:"#25D366",color:"white",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:"bold",textDecoration:"none",marginTop:10}}>Checkout on WhatsApp</a>}</div></div>)}
        {showOwnerLogin&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:"white",width:"100%",maxWidth:400,borderRadius:16,padding:20}}>
              <h3 style={{margin:"0 0 6px"}}>Owner Login 🔒</h3><p style={{fontSize:13,opacity:0.7,margin:"0 0 12px"}}>Only the shop owner with PIN can edit. Customers cannot edit.</p>
              <input value={loginPinInput} onChange={(e)=>setLoginPinInput(e.target.value)} placeholder="Enter your 4-digit Owner PIN" type="password" inputMode="numeric" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,fontSize:16}}/>
              <button onClick={tryOwnerLogin} style={{width:"100%",background:"black",color:"white",border:"none",padding:13,borderRadius:999,fontWeight:"bold",marginTop:12}}>Login as Owner</button>
              <button onClick={()=>setShowOwnerLogin(false)} style={{width:"100%",background:"#eee",border:"none",padding:12,borderRadius:999,marginTop:8}}>Cancel — I'm a Customer</button>
            </div>
          </div>
        )}
        {editingProduct&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:"white",width:"100%",borderRadius:"20px 20px 0 0",padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><h3>Edit Product — Owner Only</h3><button onClick={()=>setEditingProduct(null)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>
              <label style={{fontWeight:"bold",fontSize:13}}>Product Name</label><input value={editProdName} onChange={(e)=>setEditProdName(e.target.value)} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px"}}/>
              <label style={{fontWeight:"bold",fontSize:13}}>Price</label><input value={editProdPrice} onChange={(e)=>setEditProdPrice(e.target.value)} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px"}}/>
              <label style={{fontWeight:"bold",fontSize:13}}>Description</label><textarea value={editProdDesc} onChange={(e)=>setEditProdDesc(e.target.value)} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",minHeight:70}}/>
              <button onClick={saveEditProduct} style={{width:"100%",background:"#22c55e",color:"white",border:"none",padding:14,borderRadius:999,fontWeight:"bold"}}>Save Changes ✅</button>
            </div>
          </div>
        )}
        {showEditStore&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:"white",width:"100%",borderRadius:"20px 20px 0 0",padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><h3>Edit Store Info</h3><button onClick={()=>setShowEditStore(false)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>
              <label style={{fontWeight:"bold",fontSize:13}}>Store Name</label><input value={editStoreTitle} onChange={(e)=>setEditStoreTitle(e.target.value)} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px"}}/>
              <label style={{fontWeight:"bold",fontSize:13}}>Store Description</label><textarea value={editStoreDesc} onChange={(e)=>setEditStoreDesc(e.target.value)} style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",minHeight:70}}/>
              <button onClick={()=>{updateBuiltAndSave({...built, title: editStoreTitle.trim()||built.title, desc: editStoreDesc.trim()||built.desc}); setShowEditStore(false);}} style={{width:"100%",background:"black",color:"white",border:"none",padding:14,borderRadius:999,fontWeight:"bold"}}>Save Store Info ✅</button>
            </div>
          </div>
        )}
        {showAddProduct&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:"white",width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:"20px 20px 0 0",padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between"}}><h3>Add New Product — Owner Only</h3><button onClick={()=>setShowAddProduct(false)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>
              <p style={{fontSize:12,opacity:0.7}}>Same as before: Select NEW images → Tap each → Write Name/Price/Desc → Done → Overall Done → Add To Shop. Max 20MB per file. Old products will NOT show here again.</p>
              <label style={{display:"block",background:"black",color:"white",textAlign:"center",padding:12,borderRadius:12,fontWeight:"bold",cursor:"pointer"}}>Select NEW Images From Gallery<input type="file" accept="image/*" multiple onChange={handleSelectImages} style={{display:"none"}}/></label>
              {pendingImages.length>0&&(<div style={{marginTop:12}}><p style={{fontSize:12}}>{pendingImages.filter(p=>p.done).length} of {pendingImages.length} detailed ✅</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{pendingImages.map((im)=>(<div key={im.id} onClick={()=>openImageEditor(im)} style={{position:"relative",cursor:"pointer",border: im.done ? "2px solid #22c55e" : "2px solid #facc15", borderRadius:12, overflow:"hidden"}}><img src={im.url} alt="" style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/><div style={{background: im.done ? "#22c55e" : "#facc15", color: im.done ? "white" : "black", fontSize:10, fontWeight:"bold", textAlign:"center", padding:"3px"}}>{im.done ? "Done ✅" : "Tap to add details"}</div><button onClick={(e)=>{e.stopPropagation(); setPendingImages(pendingImages.filter(x=>x.id!==im.id));}} style={{position:"absolute",top:4,right:4,background:"red",color:"white",border:"none",borderRadius:999,width:20,height:20,fontSize:11}}>X</button></div>))}</div><button onClick={uploadAllImages} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:13,borderRadius:12,fontWeight:"bold",marginTop:10}}>Overall Done — Upload All</button></div>)}
              {uploadedImages.length>0&&(<div style={{marginTop:12}}><p style={{fontSize:12}}>{uploadedImages.length} ready to add ✅ — These are NEW, not old</p>{uploadedImages.map((u,i)=>(<div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid #eee"}}><img src={u.url} alt="" style={{width:50,height:50,borderRadius:8,objectFit:"cover"}}/><div style={{flex:1}}><b>{u.productName}</b> — {u.price}<div style={{fontSize:11,opacity:0.7}}>{u.desc?.slice(0,50)}</div></div></div>))}<button onClick={addUploadedToShop} style={{width:"100%",background:"black",color:"white",border:"none",padding:14,borderRadius:999,fontWeight:"bold",marginTop:10}}>Add These To My Shop ✅</button></div>)}
              <label style={{display:"flex",gap:8,marginTop:12,fontSize:13,cursor:"pointer"}}><input type="checkbox" checked={confirmedSafe} onChange={(e)=>setConfirmedSafe(e.target.checked)}/> I confirm this is my own product and follows safety rules.</label>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{minHeight:"100dvh",background:"#030014",color:"white",padding:20,fontFamily:"sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><b style={{fontSize:22}}>EVA</b><button onClick={()=>window.location.href='/'} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"white",padding:"8px 14px",borderRadius:999}}>Back</button></div>
      <h1 style={{color:"#c084fc",fontSize:28,lineHeight:1.2,marginTop:30}}>What should EVA create<br/>for you today?</h1>
      <div style={{marginTop:12,background:"#fef3c7",color:"black",padding:10,borderRadius:12,fontSize:12,lineHeight:1.5}}><b>V20.1 FIXED:</b> ✅ Back button no go delete shop again — shop dey save for My Saved Shops. ✅ Phone = Storage, Cloth = S/M/L/XL, Shoe = 38-44, Hair = Short/Medium/Long + Inches, Food = S/M/L, Perfume = ml, Unknown = Description only. ✅ Add New Product no go duplicate old products.</div>
      {myShops.length>0&&(
        <div style={{marginTop:16,background:"rgba(255,255,255,0.08)",padding:14,borderRadius:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><b>My Saved Shops ({myShops.length}) — Even after Back / Refresh, e still dey</b><button onClick={()=>setShowMyShops(!showMyShops)} style={{background:"white",color:"black",border:"none",padding:"6px 12px",borderRadius:999,fontSize:12,fontWeight:"bold"}}>{showMyShops?"Hide":"Show"}</button></div>
          {showMyShops&&myShops.map((s)=>(
            <div key={s.id} onClick={()=>openShopFromMyShops(s)} style={{display:"flex",gap:10,alignItems:"center",background:"white",color:"black",borderRadius:12,padding:10,marginTop:10,cursor:"pointer"}}>
              <img src={s.heroImage} alt="" style={{width:50,height:50,borderRadius:8,objectFit:"cover"}}/>
              <div style={{flex:1}}><b>{s.title}</b><div style={{fontSize:12,opacity:0.6}}>{s.items?.length} products • {s.createdAt} • Tap to open as Customer</div></div>
              <span style={{fontSize:12,fontWeight:"bold"}}>Open →</span>
            </div>
          ))}
          <p style={{fontSize:11,opacity:0.7,margin:"8px 0 0"}}>If you press phone Back and enter again, come here, press your shop — e go open again. E no lost.</p>
        </div>
      )}
      <p style={{marginTop:20,fontWeight:"bold"}}>1. Describe what you want</p>
      <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="Example: Create store called Lagos Phone Hub. WhatsApp 090... for contact." style={{width:"100%",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:16,color:"white",padding:14,fontSize:15,minHeight:90}} />
      <p style={{fontSize:12,opacity:0.7,marginTop:4}}>Tip: You can skip long description. Upload images, detail each one, EVA will use your details.</p>
      <p style={{marginTop:14,fontWeight:"bold"}}>🔒 Owner PIN (for your shop)</p>
      <input value={ownerPin} onChange={(e)=>setOwnerPin(e.target.value)} placeholder="Choose 4-digit PIN, e.g. 1234 — Only you can edit with this PIN" type="password" inputMode="numeric" style={{width:"100%",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:14,color:"white",padding:13}}/>
      {mode==="Website"&&(
        <div style={{marginTop:16,background:"rgba(255,255,255,0.08)",padding:14,borderRadius:16}}>
          <p style={{fontWeight:"bold",margin:"0 0 8px"}}>📸 Your Product Images — Tap each to add details</p>
          <label style={{display:"block",background:"white",color:"black",textAlign:"center",padding:12,borderRadius:12,fontWeight:"bold",cursor:"pointer"}}>Select Images From Gallery<input type="file" accept="image/*" multiple onChange={handleSelectImages} style={{display:"none"}}/></label>
          <p style={{fontSize:11,opacity:0.7,margin:"6px 0 0"}}>Max 20MB per image. Try &lt;2MB per image for best save after refresh. Tap an image to write its Name, Price, Description.</p>
          {pendingImages.length>0&&(<div style={{marginTop:12}}><p style={{fontSize:12,opacity:0.8}}>{pendingImages.filter(p=>p.done).length} of {pendingImages.length} detailed ✅</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{pendingImages.map((im)=>(<div key={im.id} onClick={()=>openImageEditor(im)} style={{position:"relative",cursor:"pointer",border: im.done ? "2px solid #22c55e" : "2px solid #facc15", borderRadius:12, overflow:"hidden"}}><img src={im.url} alt="" style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/><div style={{background: im.done ? "#22c55e" : "#facc15", color: im.done ? "white" : "black", fontSize:10, fontWeight:"bold", textAlign:"center", padding:"3px"}}>{im.done ? "Done ✅" : "Tap to add details"}</div>{im.done&&<div style={{position:"absolute",top:4,left:4,background:"rgba(0,0,0,0.6)",color:"white",fontSize:10,padding:"2px 6px",borderRadius:999}}>{im.productName} — {im.price}</div>}<button onClick={(e)=>{e.stopPropagation(); setPendingImages(pendingImages.filter(x=>x.id!==im.id));}} style={{position:"absolute",top:4,right:4,background:"red",color:"white",border:"none",borderRadius:999,width:20,height:20,fontSize:11}}>X</button></div>))}</div><button onClick={uploadAllImages} disabled={uploadingAll} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:13,borderRadius:12,fontWeight:"bold",marginTop:10}}>{uploadingAll?"Uploading... Please wait.":"Overall Done — Upload All Images"}</button>{uploadProgress&&<p style={{fontSize:12,color:"#facc15",fontWeight:"bold",marginTop:6}}>{uploadProgress}</p>}</div>)}
          {uploadedImages.length>0&&(<div style={{marginTop:12}}><p style={{fontSize:12,margin:"0 0 6px",opacity:0.8}}>{uploadedImages.length} uploaded ✅</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{uploadedImages.map((im,i)=>(<div key={i} style={{position:"relative",background:"rgba(255,255,255,0.1)",padding:6,borderRadius:10,maxWidth:120}}><img src={im.url} alt="" style={{width:"100%",height:56,borderRadius:8,objectFit:"cover"}}/><div style={{fontSize:11,fontWeight:"bold",marginTop:4}}>{im.productName} — {im.price}</div><div style={{fontSize:10,opacity:0.8}}>{im.desc?.slice(0,40)}</div><button onClick={()=>setUploadedImages(uploadedImages.filter((_,idx)=>idx!==i))} style={{position:"absolute",top:-6,right:-6,background:"red",color:"white",border:"none",borderRadius:999,width:20,height:20,fontSize:11}}>X</button></div>))}</div></div>)}
          <p style={{fontWeight:"bold",margin:"18px 0 8px"}}>🎥 Your Product Videos — Same way, tap to add details</p>
          <label style={{display:"block",background:"#c084fc",color:"black",textAlign:"center",padding:12,borderRadius:12,fontWeight:"bold",cursor:"pointer"}}>Select Videos From Gallery<input type="file" accept="video/*" multiple onChange={handleSelectVideos} style={{display:"none"}}/></label>
          <p style={{fontSize:11,opacity:0.7,margin:"6px 0 0"}}>Max 20MB per video. Tap a video to write its Title, Price, Description.</p>
          {pendingVideos.length>0&&(<div style={{marginTop:12}}><p style={{fontSize:12,opacity:0.8}}>{pendingVideos.filter(p=>p.done).length} of {pendingVideos.length} detailed ✅</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{pendingVideos.map((vd)=>(<div key={vd.id} onClick={()=>openVideoEditor(vd)} style={{position:"relative",cursor:"pointer",border: vd.done ? "2px solid #22c55e" : "2px solid #facc15", borderRadius:12, overflow:"hidden"}}><video src={vd.url} style={{width:"100%",height:90,objectFit:"cover",display:"block"}}/><div style={{background: vd.done ? "#22c55e" : "#facc15", color: vd.done ? "white" : "black", fontSize:10, fontWeight:"bold", textAlign:"center", padding:"3px"}}>{vd.done ? "Done ✅" : "Tap to add details"}</div>{vd.done&&<div style={{position:"absolute",top:4,left:4,background:"rgba(0,0,0,0.6)",color:"white",fontSize:10,padding:"2px 6px",borderRadius:999}}>{vd.productName} — {vd.price}</div>}<button onClick={(e)=>{e.stopPropagation(); setPendingVideos(pendingVideos.filter(x=>x.id!==vd.id));}} style={{position:"absolute",top:4,right:4,background:"red",color:"white",border:"none",borderRadius:999,width:20,height:20,fontSize:11}}>X</button></div>))}</div><button onClick={uploadAllVideos} disabled={uploadingAll} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:13,borderRadius:12,fontWeight:"bold",marginTop:10}}>{uploadingAll?"Uploading... Please wait.":"Overall Done — Upload All Videos"}</button></div>)}
          {uploadedVideo&&<div style={{marginTop:12}}><video src={uploadedVideo} controls style={{width:"100%",height:140,objectFit:"cover",borderRadius:12}}/><p style={{fontSize:12,marginTop:4}}>{uploadedVideoMeta?.productName} — {uploadedVideoMeta?.price} ✅</p></div>}
          <div style={{marginTop:12}}>
            <button onClick={()=>setShowSafety(!showSafety)} style={{width:"100%",background:"transparent",border:"none",color:"white",textAlign:"left",padding:"6px 0",fontSize:13,display:"flex",justifyContent:"space-between",cursor:"pointer"}}><span>Safety Rules for Uploads</span><span>{showSafety?"▲":"▼"}</span></button>
            {showSafety&&(<div style={{background:"rgba(255,255,255,0.08)",padding:10,borderRadius:10,fontSize:12,lineHeight:1.5}}>Do not upload nudity, sexual content, images of children, or bank documents, ID cards, passwords, or personal records. Only upload images and videos of your own products. Max 20MB per file. EVA will scan the content inside your image and video, not only the file name.</div>)}
            <label style={{display:"flex",gap:8,marginTop:8,fontSize:13,lineHeight:1.4,cursor:"pointer"}}><input type="checkbox" checked={confirmedSafe} onChange={(e)=>setConfirmedSafe(e.target.checked)} style={{marginTop:2}}/> I confirm this is my own product image/video and it follows the safety rules.</label>
            {checking&&<p style={{color:"#facc15",fontSize:13,fontWeight:"bold"}}>{checkStatus}</p>}
            {!checking&&checkStatus&&<p style={{fontSize:12,color:"#22c55e"}}>{checkStatus}</p>}
          </div>
        </div>
      )}
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
          <div style={{background:built.color,color:"white",padding:18}}><b style={{fontSize:22}}>{built.title}</b><p style={{margin:"6px 0 0"}}>{built.desc}</p>{built.whatsapp&&<p style={{margin:"8px 0 0",fontSize:13,background:"rgba(0,0,0,0.2)",padding:"8px",borderRadius:8}}>WhatsApp: {maskNumber(built.whatsapp.display)} — Added for contact ✅</p>}<p style={{fontSize:12,marginTop:8}}>Owner PIN set ✅ — Shop SAVED, Back button will NOT delete it.</p></div>
          <div style={{padding:16}}>
            {built.items?.map((it,i)=>(<div key={it.id||i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #eee",alignItems:"center"}}><ProductImg item={it} idx={i} size="small"/><div style={{flex:1}}><b>{it.name}</b> {it.soldOut&&<span style={{background:"#ef4444",color:"white",fontSize:10,padding:"2px 6px",borderRadius:999,marginLeft:4}}>SOLD OUT</span>}<div style={{fontSize:13,opacity:0.6}}>Tap to view details</div></div><b style={{color:built.color}}>{it.price}</b></div>))}
            <button onClick={()=>{setLiveMode(true); pushHistory("live-shop");}} style={{width:"100%",background:"black",border:"none",color:"white",padding:14,borderRadius:999,fontWeight:"bold",marginTop:14}}>View Live Shop — Test Back Button</button>
            <p style={{textAlign:"center",fontSize:12,opacity:0.6,marginTop:10}}>V20.1 — No Loss, Smart Options For Any Product, No Duplicate</p>
          </div>
        </div>
      )}
      {selectedItem&&!liveMode&&built&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div style={{background:"white",color:"black",width:"100%",maxHeight:"92vh",overflow:"auto",borderRadius:"20px 20px 0 0",padding:16}}><button onClick={closeProduct} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>← Back to Shop</button><ProductImg item={selectedItem} idx={999} size="large"/><h2>{selectedItem.name}</h2><b style={{color:built.color,fontSize:22}}>{selectedItem.price}</b><p>{selectedItem.desc}</p>
      {(()=>{ const opts=getOptionsFor(selectedItem.name, selectedItem.desc); if(opts.options.length===0) return null; return (<div><p style={{fontWeight:"bold",margin:"12px 0 6px"}}>{opts.label}:</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{opts.options.map(s=>(<button key={s} onClick={()=>setSelectedOption(s)} style={{padding:"10px 18px",borderRadius:999,border:selectedOption===s?`2px solid ${built.color}`:"1px solid #ccc",background:selectedOption===s?built.color:"white",color:selectedOption===s?"white":"black",fontWeight:"bold"}}>{s}</button>))}</div></div>); })()}
      <button onClick={()=>{setCart([...cart,{...selectedItem, option:selectedOption}]); setSelectedItem(null);}} style={{width:"100%",background:built.color,border:"none",color:"white",padding:15,borderRadius:999,fontWeight:"bold",marginTop:12}}>Add to Cart — {selectedItem.price} {selectedOption?`(${selectedOption})`:""}</button></div></div>)}
      {editingImageId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",color:"black",width:"100%",borderRadius:"20px 20px 0 0",padding:16,maxHeight:"92vh",overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{margin:0}}>Add details for this image</h3><button onClick={()=>setEditingImageId(null)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>
            <label style={{fontWeight:"bold",fontSize:13}}>Product Name *</label><input value={editName} onChange={(e)=>setEditName(e.target.value)} placeholder="e.g. iPhone 13" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Price *</label><input value={editPrice} onChange={(e)=>setEditPrice(e.target.value)} placeholder="e.g. $400" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Description</label><textarea value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} placeholder="e.g. UK used, battery 92%" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15,minHeight:80}}/>
            <button onClick={saveImageDetail} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:14,borderRadius:999,fontWeight:"bold",fontSize:16}}>Done ✅ — Mark this image</button>
          </div>
        </div>
      )}
      {editingVideoId&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"white",color:"black",width:"100%",borderRadius:"20px 20px 0 0",padding:16,maxHeight:"92vh",overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h3 style={{margin:0}}>Add details for this video</h3><button onClick={()=>setEditingVideoId(null)} style={{background:"#eee",border:"none",padding:"8px 14px",borderRadius:999}}>Close</button></div>
            <label style={{fontWeight:"bold",fontSize:13}}>Video Title *</label><input value={editName} onChange={(e)=>setEditName(e.target.value)} placeholder="e.g. iPhone 13 Promo" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Price *</label><input value={editPrice} onChange={(e)=>setEditPrice(e.target.value)} placeholder="e.g. $400" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15}}/>
            <label style={{fontWeight:"bold",fontSize:13}}>Description</label><textarea value={editDesc} onChange={(e)=>setEditDesc(e.target.value)} placeholder="e.g. Shows phone working" style={{width:"100%",padding:12,border:"1px solid #ddd",borderRadius:12,margin:"6px 0 12px",fontSize:15,minHeight:80}}/>
            <button onClick={saveVideoDetail} style={{width:"100%",background:"#22c55e",border:"none",color:"white",padding:14,borderRadius:999,fontWeight:"bold",fontSize:16}}>Done ✅ — Mark this video</button>
          </div>
        </div>
      )}
      <p style={{textAlign:"center",fontSize:12,opacity:0.6,marginTop:16}}>EVA creates original designs. Copying brands, logos, or illegal content is not allowed.</p>
    </div>
  );
}
