"use client";
import { useEffect, useState, useRef } from "react";
import EarthGlobe from "../../Components/EarthGlobe";

const POOL = [
  { kind:"crypto", headline:"Trading Live Market" },
  { kind:"news", headline:"World Live News" },
  { kind:"tiktok", headline:"Viral Live Now" },
  { kind:"sport", headline:"Football Live Score" },
  { kind:"hacker", headline:"EVA System Check" },
  { kind:"music", headline:"Music Trending Live" },
  { kind:"market", headline:"Dollar / Naira Live" },
  { kind:"space", headline:"Earth / Space Live" },
  { kind:"gaming", headline:"Gaming Live Stream" },
  { kind:"naija", headline:"Naija Live Now" },
];

function RealChart({ points=[], up=true, h=70 }) {
  if(!points.length) return <div style={{ height:h, background:"rgba(255,255,255,.04)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#94a3b8" }}>Waiting for live trades...</div>;
  const min = Math.min(...points), max = Math.max(...points);
  const path = points.map((p,i)=> `${(i/(points.length-1))*100},${40 - ((p-min)/((max-min)||1))*40}`).join(" L ");
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width:"100%", height:h, display:"block" }}>
      <defs><linearGradient id={`rg${h}${up?"u":"d"}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={`M ${path} L 100,40 L 0,40 Z`} fill={`url(#rg${h}${up?"u":"d"})`} />
      <path d={`M ${path}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="100" cy={40 - ((points[points.length-1]-min)/((max-min)||1))*40} r="2.5" fill={color} />
    </svg>
  );
}

function CryptoChart({ big=false, realCrypto, trading }) {
  const list = trading?.cryptoList || [];
  const [livePts, setLivePts] = useState({});
  const [livePrice, setLivePrice] = useState({});
  const [wsLive, setWsLive] = useState(false);
  const [selected, setSelected] = useState("BTC");
  const [showAllForex, setShowAllForex] = useState(false);
  const [showGold, setShowGold] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertCoin, setAlertCoin] = useState("BTC");
  const [alertSet, setAlertSet] = useState(()=>{ try{ return JSON.parse(localStorage.getItem("eva_alert")||"null"); }catch(e){ return null; } });
  const [alertHit, setAlertHit] = useState(false);
  const [calcAmount, setCalcAmount] = useState("100");
  const [calcFrom, setCalcFrom] = useState("USD");
  const [calcTo, setCalcTo] = useState("BTC");
  const [calcChange, setCalcChange] = useState(5);
  const [goldLive, setGoldLive] = useState(0);

  useEffect(()=>{
    let ws=null, retry=null;
    const connect = ()=>{
      try{
        ws = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade/bnbusdt@trade/solusdt@trade/dogeusdt@trade/paxgusdt@trade");
        ws.onopen = ()=> setWsLive(true);
        ws.onmessage = (ev)=>{
          try{
            const j = JSON.parse(ev.data); const d=j.data||{};
            const sym=(d.s||"").replace("USDT",""); const price=Number(d.p);
            if(!sym||!price) return;
            if(sym==="PAXG"){ setGoldLive(price); return; }
            setLivePrice(prev=> ({...prev,[sym]:price}));
            setLivePts(prev=> ({...prev,[sym]:[...(prev[sym]||[]).slice(-59), price]}));
          }catch(e){}
        };
        ws.onclose = ()=>{ setWsLive(false); retry=setTimeout(connect,3000); };
        ws.onerror = ()=>{ try{ws.close();}catch(e){} };
      }catch(e){ retry=setTimeout(connect,3000); }
    };
    connect();
    return ()=>{ if(ws) try{ws.close();}catch(e){} if(retry) clearTimeout(retry); };
  },[]);

  const getCoin = (c)=> ({...c, pts: livePts[c.name]||[], price: livePrice[c.name]||c.price});
  const btcRaw = list.find(c=>c.name==="BTC") || {price:realCrypto?.price||0, change:0, spark:[]};
  const btc = getCoin(btcRaw);
  const forex = trading?.forex||[];
  const goldPrice = goldLive || trading?.gold || 0;

  useEffect(()=>{ if(alertSet) try{ localStorage.setItem("eva_alert", JSON.stringify(alertSet)); }catch(e){} },[alertSet]);
  useEffect(()=>{
    if(!alertSet) return;
    const cur = alertSet.coin==="GOLD" ? goldPrice : (livePrice[alertSet.coin] || list.find(c=>c.name===alertSet.coin)?.price);
    if(!cur) return;
    if(Math.abs(cur - alertSet.price)/alertSet.price < 0.002){
      setAlertHit(true);
      try{ navigator.vibrate?.([200,100,200]); }catch(e){}
      try{ if("Notification" in window && Notification.permission==="granted"){ new Notification(`${alertSet.coin} Price Alert`, { body: `${alertSet.coin} has reached $${Number(cur).toLocaleString()}` }); } }catch(e){}
      try{ const ctx = new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); o.connect(ctx.destination); o.frequency.value=880; o.start(); o.stop(ctx.currentTime+0.3); }catch(e){}
    }
  },[livePrice, goldLive, goldPrice, alertSet, list]);

  const requestNotif = async ()=>{ try{ if("Notification" in window && Notification.permission==="default") await Notification.requestPermission(); }catch(e){} };

  const rates = {}; (trading?.forex||[]).forEach(f=>{ rates[f.pair]=f.price; });
  const usdRates = { USD:1, NGN: rates["USD / NGN"]||1349, EUR: rates["EUR / USD"]?1/rates["EUR / USD"]:0.9, GBP: rates["GBP / USD"]?1/rates["GBP / USD"]:0.76, JPY: rates["USD / JPY"]||159, CAD:1.36, AUD:1.52, CHF:0.88, CNY:7.2, INR:83, AED:3.67, ZAR:18.5, KES:129, GHS:15.2 };
  const assetPriceUSD = calcTo==="GOLD" ? goldPrice : (livePrice[calcTo] || list.find(c=>c.name===calcTo)?.price || 0);
  const amount = Number(calcAmount)||0;
  const amountUSD = calcFrom==="USD" ? amount : amount / (usdRates[calcFrom]||1);
  const assetAmount = assetPriceUSD ? amountUSD / assetPriceUSD : 0;
  const profitUSD = amountUSD * (calcChange/100);
  const profitInFrom = calcFrom==="USD" ? profitUSD : profitUSD * (usdRates[calcFrom]||1);

  const allForexList = [
    { code:"USD", label:"US Dollar", rate:1 },
    { code:"NGN", label:"Nigerian Naira", rate: usdRates.NGN },
    { code:"EUR", label:"Euro", rate: usdRates.EUR },
    { code:"GBP", label:"British Pound", rate: usdRates.GBP },
    { code:"JPY", label:"Japanese Yen", rate: usdRates.JPY },
    { code:"CAD", label:"Canadian Dollar", rate: usdRates.CAD },
    { code:"AUD", label:"Australian Dollar", rate: usdRates.AUD },
    { code:"CHF", label:"Swiss Franc", rate: usdRates.CHF },
    { code:"CNY", label:"Chinese Yuan", rate: usdRates.CNY },
    { code:"INR", label:"Indian Rupee", rate: usdRates.INR },
    { code:"AED", label:"UAE Dirham", rate: usdRates.AED },
    { code:"ZAR", label:"South African Rand", rate: usdRates.ZAR },
    { code:"KES", label:"Kenyan Shilling", rate: usdRates.KES },
    { code:"GHS", label:"Ghana Cedi", rate: usdRates.GHS },
  ];
  const visibleForex = showAllForex ? allForexList : allForexList.slice(0,4);

  if(!big){
    const up=(btc.change||0)>=0;
    return (
      <div style={{ width:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:17, fontWeight:900 }}>${Number(btc.price).toLocaleString(undefined,{maximumFractionDigits:2})}</span>
          <span style={{ fontSize:11, fontWeight:800, color: up?"#22c55e":"#ef4444" }}>{up?"▲":"▼"} {Math.abs(Number(btc.change||0)).toFixed(2)}%</span>
        </div>
        <div style={{ marginTop:6 }}><RealChart points={btc.pts} up={up} h={62} /></div>
        <div style={{ fontSize:9, color: wsLive?"#22c55e":"#facc15", marginTop:4 }}>● {wsLive?"BINANCE LIVE":"CONNECTING TO BINANCE..."}</div>
        {alertSet && <div style={{ fontSize:10, color:"#facc15", marginTop:2 }}>Alert: {alertSet.coin} at ${Number(alertSet.price).toLocaleString()}</div>}
      </div>
    );
  }

  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8, overflow:"hidden" }}>
      <div style={{ fontSize:10, color: wsLive?"#22c55e":"#facc15", fontWeight:800 }}>● {wsLive?"BINANCE LIVE - REAL TRADES":"CONNECTING TO BINANCE..."}</div>
      <div style={{ fontSize:11, color:"#94a3b8" }}>Tap any coin to select it. Calculator and Alert will follow that coin.</div>
      {list.map((cRaw,i)=>{
        const c=getCoin(cRaw); const up=(c.change||0)>=0; const stable=c.name==="USDT"; const isSel=selected===c.name;
        return (
          <div key={i} onClick={()=>{ setSelected(c.name); setCalcTo(c.name); setAlertCoin(c.name); }} style={{ background: isSel?"rgba(34,211,238,.12)":"rgba(255,255,255,.04)", borderRadius:14, padding:"10px 12px", border: isSel?"1px solid rgba(34,211,238,.6)":"1px solid rgba(255,255,255,.07)", cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:800 }}>{c.name} <span style={{ fontSize:10, color:"#94a3b8", fontWeight:500 }}>{c.full}</span> {isSel && <span style={{ fontSize:10, color:"#22d3ee" }}>● SELECTED</span>}</span>
              <span style={{ fontSize:13, fontWeight:800 }}>${Number(c.price).toLocaleString(undefined,{maximumFractionDigits:c.name==="DOGE"?4:2})}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
              <span style={{ fontSize:11, color: up?"#22c55e":"#ef4444", fontWeight:800 }}>{up?"▲":"▼"} {Math.abs(Number(c.change||0)).toFixed(2)}%</span>
              <span style={{ fontSize:10, color:"#22c55e" }}>● LIVE • TAP TO SELECT</span>
            </div>
            <div style={{ marginTop:6 }}>
              {stable ? <div style={{ height:58, display:"flex", alignItems:"center", justifyContent:"center", borderBottom:"2px solid #22c55e", background:"rgba(34,197,94,.06)", borderRadius:8, fontSize:11, color:"#94a3b8" }}>$1.00 Stable</div> : <RealChart points={c.pts} up={up} h={58} />}
            </div>
          </div>
        );
      })}
      <div onClick={()=>{ setShowGold(!showGold); if(!showGold){ setCalcTo("GOLD"); } }} style={{ background: showGold?"rgba(250,204,21,.12)":"rgba(255,255,255,.04)", borderRadius:12, padding:"10px 12px", border:"1px solid rgba(250,204,21,.3)", cursor:"pointer" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, fontWeight:800 }}>GOLD {showGold?"▼":"▶"} Tap to expand</span>
          <span style={{ fontSize:13, fontWeight:800 }}>{goldPrice ? `$${Number(goldPrice).toLocaleString()}` : "Loading..."}</span>
        </div>
        {showGold && <div style={{ fontSize:11, color:"#94a3b8", marginTop:6, lineHeight:1.6 }}>Per ounce: {goldPrice ? `$${Number(goldPrice).toLocaleString()}` : "Loading..."}<br/>Per gram: {goldPrice ? `$${(goldPrice/31.1).toFixed(2)}` : "Loading..."}<br/>Gold is a metal, not a coin. People buy it to preserve value. Calculator is now set to GOLD.</div>}
      </div>
      <div style={{ background:"rgba(250,204,21,.08)", border:"1px solid rgba(250,204,21,.3)", borderRadius:14, padding:12 }}>
        <div style={{ fontSize:12, fontWeight:800 }}>Price Alert</div>
        <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Set a price. EVA will notify you when the live price reaches it. Works while EVA is open. For alerts when the app is fully closed, a server push is required later.</div>
        {alertHit ? <div style={{ fontSize:12, color:"#22c55e", fontWeight:800, marginTop:6 }}>{alertSet?.coin} has reached ${Number(alertSet?.price||0).toLocaleString()}!</div> : alertSet ? <div style={{ fontSize:11, marginTop:6 }}>Waiting for {alertSet.coin} to reach <b>${Number(alertSet.price).toLocaleString()}</b></div> : null}
        <div style={{ display:"flex", gap:6, marginTop:8 }}>
          <select value={alertCoin} onChange={e=> setAlertCoin(e.target.value)} style={{ background:"rgba(0,0,0,.4)", color:"#fff", border:"1px solid rgba(255,255,255,.2)", borderRadius:999, padding:"8px", fontSize:12, maxWidth:90 }}>{list.map(c=> <option key={c.name} value={c.name}>{c.name}</option>)}<option value="GOLD">GOLD</option></select>
          <input value={alertPrice} onChange={e=> setAlertPrice(e.target.value.replace(/[^0-9.]/g,""))} placeholder="e.g. 70000" inputMode="decimal" style={{ flex:1, minWidth:0, background:"rgba(0,0,0,.4)", border:"1px solid rgba(255,255,255,.2)", borderRadius:999, padding:"8px 12px", color:"#fff", fontSize:13, outline:"none" }} />
          <button onClick={async ()=>{ await requestNotif(); if(alertPrice){ setAlertSet({ coin: alertCoin, price: Number(alertPrice) }); setAlertHit(false); setAlertPrice(""); } }} style={{ background:"#facc15", color:"#000", border:"none", borderRadius:999, padding:"8px 14px", fontWeight:800, fontSize:12, cursor:"pointer", flexShrink:0 }}>SET</button>
          {alertSet && <button onClick={()=>{ setAlertSet(null); setAlertHit(false); try{ localStorage.removeItem("eva_alert"); }catch(e){} }} style={{ background:"rgba(255,255,255,.1)", color:"#fff", border:"none", borderRadius:999, padding:"8px 10px", fontSize:12, cursor:"pointer" }}>Clear</button>}
        </div>
      </div>
      <div style={{ background:"rgba(34,211,238,.08)", border:"1px solid rgba(34,211,238,.3)", borderRadius:14, padding:12 }}>
        <div style={{ fontSize:12, fontWeight:800 }}>Calculator</div>
        <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Convert any currency to any asset. Uses live price and live exchange rate.</div>
        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          <select value={calcFrom} onChange={e=> setCalcFrom(e.target.value)} style={{ background:"rgba(0,0,0,.4)", color:"#fff", border:"1px solid rgba(255,255,255,.2)", borderRadius:999, padding:"8px", fontSize:12, flex:"1 1 110px", minWidth:0 }}>{allForexList.map(f=> <option key={f.code} value={f.code}>{f.code} - {f.label}</option>)}</select>
          <input value={calcAmount} onChange={e=> setCalcAmount(e.target.value.replace(/[^0-9.]/g,""))} inputMode="decimal" style={{ flex:"1 1 70px", minWidth:0, background:"rgba(0,0,0,.4)", border:"1px solid rgba(255,255,255,.2)", borderRadius:999, padding:"8px 12px", color:"#fff", fontSize:13, outline:"none" }} />
          <select value={calcTo} onChange={e=> setCalcTo(e.target.value)} style={{ background:"rgba(0,0,0,.4)", color:"#fff", border:"1px solid rgba(255,255,255,.2)", borderRadius:999, padding:"8px", fontSize:12, flex:"1 1 80px", minWidth:0 }}>{list.map(c=> <option key={c.name} value={c.name}>{c.name}</option>)}<option value="GOLD">GOLD</option></select>
        </div>
        <div style={{ display:"flex", gap:6, marginTop:8, alignItems:"center", fontSize:11, flexWrap:"wrap" }}>Price change: {[-10,-5,5,10,20].map(v=> <button key={v} onClick={()=> setCalcChange(v)} style={{ background: calcChange===v?"#22d3ee":"rgba(255,255,255,.1)", color: calcChange===v?"#000":"#fff", border:"none", borderRadius:999, padding:"5px 10px", cursor:"pointer", fontWeight:800 }}>{v>0?`+${v}%`:`${v}%`}</button>)}</div>
        <div style={{ fontSize:12, marginTop:8, lineHeight:1.6 }}>
          {assetPriceUSD ? <><span>= <b>{assetAmount.toFixed(6)} {calcTo}</b></span><br/><span>= <b>${amountUSD.toLocaleString(undefined,{maximumFractionDigits:2})} USD</b></span><br/><span style={{ color:"#94a3b8", fontSize:11 }}>If {calcTo} moves {calcChange}% → Profit / Loss = {calcChange>=0?"+":""}{profitInFrom.toLocaleString(undefined,{maximumFractionDigits:2})} {calcFrom}</span></> : <span style={{ color:"#facc15" }}>Loading {calcTo} price... Please wait a few seconds.</span>}
        </div>
      </div>
      <div style={{ background:"rgba(255,255,255,.04)", borderRadius:14, padding:12 }}>
        <div style={{ fontSize:12, fontWeight:800 }}>Currencies</div>
        <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Tap a currency to use it in the calculator.</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
          {visibleForex.map((f,i)=> (
            <button key={i} onClick={()=> setCalcFrom(f.code)} style={{ background: calcFrom===f.code?"rgba(34,211,238,.2)":"rgba(255,255,255,.06)", border: calcFrom===f.code?"1px solid #22d3ee":"1px solid rgba(255,255,255,.1)", borderRadius:12, padding:"8px 10px", color:"#fff", cursor:"pointer", textAlign:"left", flex:"1 1 45%" }}>
              <div style={{ fontSize:10, color:"#94a3b8" }}>{f.code} • {f.label}</div>
              <div style={{ fontSize:12, fontWeight:800, marginTop:2 }}>1 USD = {f.code==="USD"?"1.00":Number(f.rate).toLocaleString(undefined,{maximumFractionDigits:2})} {f.code}</div>
            </button>
          ))}
        </div>
        <button onClick={()=> setShowAllForex(!showAllForex)} style={{ width:"100%", background:"rgba(255,255,255,.08)", border:"none", color:"#fff", padding:"8px", borderRadius:999, marginTop:8, cursor:"pointer", fontSize:11, fontWeight:800 }}>{showAllForex?"Show Less ▲":"Show All Currencies ▼"}</button>
        <div style={{ display:"flex", gap:6, marginTop:8 }}>{(forex||[]).slice(0,4).map((f,i)=> (<div key={i} style={{ flex:1, background:"rgba(255,255,255,.04)", borderRadius:10, padding:"8px", textAlign:"center" }}><div style={{ fontSize:9, color:"#94a3b8" }}>{f.pair}</div><div style={{ fontSize:11, fontWeight:800, marginTop:2 }}>{Number(f.price).toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>))}</div>
      </div>
    </div>
  );
}

function HackerBox({ big=false }) {
  const [health, setHealth] = useState(null);
  const [lines, setLines] = useState(["> eva --system-check --live"]);
  useEffect(()=>{
    const load = async ()=>{
      try{
        const r = await fetch("/api/health"); const j = await r.json(); setHealth(j);
        const newLines = j.checks.map(c=> `${c.status==="OK" ? "✓" : "✗"} ${c.name} — ${c.ms}ms`);
        setLines(prev=> [...prev.slice(-(big?8:1)), `> check @ ${new Date().toLocaleTimeString()}`, ...newLines]);
      }catch(e){}
    };
    load(); const t=setInterval(load, 1000); return ()=>clearInterval(t);
  },[big]);
  if(!big) return <div style={{ fontFamily:"monospace", fontSize:10, lineHeight:1.5, color:"#4ade80" }}><div style={{ fontWeight:800 }}>{health?.ok ? "● ALL OK" : "● CHECKING..."}</div><div style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lines[lines.length-1] || "> checking..."}</div></div>;
  return (
    <div style={{ fontFamily:"monospace", fontSize:12, lineHeight:1.5, color:"#4ade80", width:"100%" }}>
      <div style={{ fontWeight:800, fontSize:10 }}>{health?.ok ? "● SYSTEM: ALL OK" : "● SYSTEM: CHECKING..."}</div>
      {lines.slice(-14).map((l,i)=> <div key={i} style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color: l.startsWith("✗") ? "#ef4444" : "#4ade80" }}>{l}</div>)}
      <div>▋</div>
    </div>
  );
}

function NewsView({ news, big=false, fullscreen=false, selected, setSelected, openInside, setOpenInside }) {
  if(!news || news.length===0) return <div style={{fontSize:11,color:"#94a3b8"}}>Syncing news...</div>;
  const item = news[selected % news.length];
  if(!big && !fullscreen){
    return (
      <div style={{ width:"100%" }}>
        <div style={{fontSize:9,color:"#67e8f9",fontWeight:800}}>{item.source} • TODAY</div>
        <div style={{fontSize:11, color:"#fff", lineHeight:1.35, marginTop:4, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{item.title}</div>
      </div>
    );
  }
  if(openInside){
    const cur = news[selected % news.length];
    return (
      <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(34,211,238,.12)", borderRadius:10, padding:"8px 10px" }}>
          <span style={{ fontSize:11, fontWeight:800 }}>Reading inside EVA • {openInside.source}</span>
          <button onClick={(e)=>{ e.stopPropagation(); setOpenInside(null); }} style={{ background:"rgba(255,255,255,.15)", border:"none", color:"#fff", fontSize:11, padding:"4px 10px", borderRadius:999, cursor:"pointer" }}>Close</button>
        </div>
        <div style={{ background:"rgba(255,255,255,.06)", borderRadius:12, padding:12 }}>
          {cur?.img && <img src={cur.img} alt="" style={{ width:"100%", borderRadius:10, maxHeight: fullscreen?260:180, objectFit:"cover" }} />}
          <div style={{ fontSize: fullscreen?17:15, fontWeight:800, lineHeight:1.4, marginTop:10 }}>{cur?.title}</div>
          <div style={{ fontSize:9, color:"#67e8f9", fontWeight:800, marginTop:6 }}>{cur?.source} • {cur?.time ? new Date(cur.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "TODAY"}</div>
          <div style={{ fontSize: fullscreen?13:12, color:"#e2e8f0", lineHeight:1.65, marginTop:8 }}>{cur?.full || cur?.desc || "Full story from " + openInside.source + "."}</div>
          <a href={openInside.link} target="_blank" rel="noreferrer" onClick={(e)=> e.stopPropagation()} style={{ display:"block", textAlign:"center", background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.2)", color:"#fff", padding:"9px", borderRadius:999, fontSize:11, marginTop:12, textDecoration:"none" }}>Open full on {openInside.source} site</a>
        </div>
        <div style={{ fontSize:9, color:"#67e8f9", fontWeight:800 }}>LIVE FEED — TAP TO READ ANOTHER</div>
        <div style={{ maxHeight: fullscreen? 220 : 140, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
          {news.map((n,i)=> (
            <div key={i} onClick={(e)=>{ e.stopPropagation(); setSelected(i); setOpenInside({ source:n.source, link:n.link }); }} style={{ padding:"8px 10px", borderRadius:10, background: i===selected ? "rgba(34,211,238,.18)" : "rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", cursor:"pointer" }}>
              <div style={{ fontSize:9, color:"#67e8f9", fontWeight:800 }}>{n.source}</div>
              <div style={{ fontSize:11, color:"#fff", lineHeight:1.35, marginTop:2 }}>{n.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ background:"rgba(255,255,255,.05)", borderRadius:12, padding: fullscreen?14:10 }}>
        <div style={{fontSize:9,color:"#67e8f9",fontWeight:800}}>{item.source} • {item.time ? new Date(item.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "TODAY"}</div>
        <div style={{fontSize: fullscreen?18:14, fontWeight: fullscreen?800:600, color:"#fff", lineHeight:1.4, marginTop:5}}>{item.title}</div>
        {item.desc && <div style={{fontSize: fullscreen?13:11, color:"#cbd5e1", lineHeight:1.5, marginTop:6}}>{item.desc}</div>}
        {item.img && <img src={item.img} alt="" style={{ width:"100%", borderRadius:10, marginTop:8, maxHeight: fullscreen?260:120, objectFit:"cover" }} />}
      </div>
      <div style={{ fontSize:9, color:"#67e8f9", fontWeight:800 }}>LIVE FEED — NEW HEADLINES</div>
      <div style={{ maxHeight: fullscreen? 320 : 180, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
        {news.map((n,i)=> (
          <div key={i} onClick={(e)=>{ e.stopPropagation(); setSelected(i); }} style={{ padding:"8px 10px", borderRadius:10, background: i===selected ? "rgba(34,211,238,.18)" : "rgba(255,255,255,.04)", border: i===selected ? "1px solid rgba(34,211,238,.5)" : "1px solid rgba(255,255,255,.07)", cursor:"pointer" }}>
            <div style={{ fontSize:9, color:"#67e8f9", fontWeight:800 }}>{n.source} • {n.time ? new Date(n.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : ""}</div>
            <div style={{ fontSize: fullscreen?13:11, color:"#fff", lineHeight:1.35, marginTop:2 }}>{n.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoresView({ scores, fullscreen=false, big=false }) {
  if(!scores || scores.length===0) return <div style={{fontSize:11,color:"#94a3b8"}}>Checking leagues...</div>;
  if(!big && !fullscreen){
    const s = scores[0];
    return <div><div style={{fontSize:9,color:"#facc15",fontWeight:800}}>{s.league} • {s.status}</div><div style={{fontSize:11, fontWeight:700, marginTop:4, lineHeight:1.3}}>{s.home} {s.homeScore} - {s.awayScore} {s.away}</div></div>;
  }
  const liveGames = scores.filter(s=> s.live);
  const rest = scores.filter(s=> !s.live);
  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
      {liveGames.length>0 && <div><div style={{ fontSize:9, color:"#ef4444", fontWeight:800 }}>LIVE NOW</div>{liveGames.map((s,i)=> (<div key={i} style={{ background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.4)", borderRadius:12, padding:10, marginTop:6 }}><div style={{ fontSize:9, color:"#facc15", fontWeight:800 }}>{s.league} • {s.status}</div><div style={{ fontSize: fullscreen?17:13, fontWeight:800, marginTop:4 }}>{s.home} <span style={{ color:"#22d3ee" }}>{s.homeScore} - {s.awayScore}</span> {s.away}</div></div>))}</div>}
      <div style={{ fontSize:9, color:"#facc15", fontWeight:800 }}>ALL MATCHES TODAY — {scores.length} GAMES</div>
      <div style={{ maxHeight: fullscreen? 420 : 200, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
        {(liveGames.length>0 ? rest : scores).map((s,i)=> (<div key={i} style={{ padding:"9px 10px", borderRadius:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)" }}><div style={{ fontSize:9, color:"#facc15", fontWeight:800 }}>{s.league} • {s.status}</div><div style={{ fontSize: fullscreen?15:12, fontWeight:700, marginTop:3 }}>{s.home} <span style={{ color:"#22d3ee" }}>{s.homeScore} - {s.awayScore}</span> {s.away}</div></div>))}
      </div>
    </div>
  );
}

function ViralView({ viral, fullscreen=false, selected, setSelected, big=false }) {
  const [videoFailed, setVideoFailed] = useState(false);
  if(!viral || viral.length===0) return <div style={{fontSize:11,color:"#94a3b8"}}>Syncing viral...</div>;
  const v = viral[selected % viral.length];
  if(!big && !fullscreen){
    return <div><div style={{fontSize:9,color:"#f472b6",fontWeight:800}}>VIRAL • {v.score} upvotes</div><div style={{fontSize:11, lineHeight:1.35, marginTop:4, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{v.title}</div>{v.thumb && <img src={v.thumb} alt="" style={{ width:"100%", height:54, objectFit:"cover", borderRadius:8, marginTop:6 }} />}</div>;
  }
  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ background:"#000", borderRadius:12, overflow:"hidden", position:"relative" }}>
        {v.video && !videoFailed ? (
          <video key={v.video} src={v.video} controls playsInline preload="metadata" poster={v.thumb || undefined} onError={()=> setVideoFailed(true)} style={{ width:"100%", maxHeight: fullscreen? 380 : 220, display:"block", background:"#000" }} />
        ) : v.thumb ? (
          <a href={v.link} target="_blank" rel="noreferrer"><img src={v.thumb} alt="" style={{ width:"100%", maxHeight: fullscreen? 380 : 180, objectFit:"cover", display:"block" }} /></a>
        ) : (
          <div style={{ padding:14, fontSize:12, color:"#94a3b8" }}>Video loading... Tap below to open</div>
        )}
        {videoFailed && <div style={{ padding:8, fontSize:11, color:"#fda4af", textAlign:"center" }}>Video blocked by source — tap below to watch on Reddit</div>}
      </div>
      <div style={{ fontSize: fullscreen?14:11, fontWeight:700, lineHeight:1.4 }}>{v.title}</div>
      <div style={{ fontSize:10, color:"#f472b6", fontWeight:800 }}>{v.score} upvotes • {v.isVideo ? "TAP PLAY FOR SOUND" : "TAP BELOW TO WATCH"}</div>
      {v.link && <a href={v.link} target="_blank" rel="noreferrer" onClick={(e)=> e.stopPropagation()} style={{ textAlign:"center", background:"rgba(244,114,182,.15)", border:"1px solid rgba(244,114,182,.4)", color:"#fff", padding:"7px", borderRadius:999, fontSize:11, textDecoration:"none" }}>Watch on source</a>}
      <div style={{ fontSize:9, color:"#67e8f9", fontWeight:800 }}>MORE VIRAL</div>
      <div style={{ maxHeight: fullscreen? 220 : 110, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
        {viral.map((it,i)=> (
          <div key={i} onClick={(e)=>{ e.stopPropagation(); setSelected(i); setVideoFailed(false); }} style={{ display:"flex", gap:8, padding:"8px", borderRadius:10, background: i===selected ? "rgba(244,114,182,.18)" : "rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", cursor:"pointer", alignItems:"center" }}>
            {it.thumb && <img src={it.thumb} alt="" style={{ width:56, height:40, objectFit:"cover", borderRadius:6, flexShrink:0 }} />}
            <div style={{ fontSize:11, lineHeight:1.3 }}>{it.isVideo ? "Video " : "Image "}{it.title.slice(0,70)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EvaPhase1() {
  const [boxes, setBoxes] = useState(()=> POOL.slice(0,5).map((p,i)=> ({ ...p, uid: Date.now()+i })));
  const [pinned, setPinned] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [search, setSearch] = useState("");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState("");
  const [live, setLive] = useState({ news:[], scores:[], viral:[], crypto:null, trading:null, date:"" });
  const [syncTime, setSyncTime] = useState("");
  const [selNews, setSelNews] = useState(0);
  const [selViral, setSelViral] = useState(0);
  const [openInside, setOpenInside] = useState(null);
  const longPressRef = useRef(null);
  const startYRef = useRef(0);
  const activeUidRef = useRef(null);

  useEffect(()=>{
    const load = async ()=>{
      try{
        const r = await fetch("/api/live"); const j = await r.json();
        setLive({ news:j.news||[], scores:j.scores||[], viral:j.viral||[], crypto:j.crypto||null, trading:j.trading||null, date:j.date||"" });
        setSyncTime(new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));
      }catch(e){}
    };
    load(); const t=setInterval(load, 30000); return ()=>clearInterval(t);
  },[]);

  const showToast = (t)=> { setToast(t); setTimeout(()=> setToast(""), 1800); };
  const spawnNew = (removeUid) => {
    const usedKinds = boxes.filter(b=> b.uid!==removeUid).map(b=> b.kind);
    const candidates = POOL.filter(p=> !usedKinds.includes(p.kind));
    const pick = candidates[Math.floor(Math.random()*candidates.length)] || POOL[0];
    setBoxes(prev=> [...prev.filter(b=> b.uid!==removeUid), { ...pick, uid: Date.now()+Math.random() }]);
    showToast(`Trashed • New: ${pick.headline}`);
  };
  const handleTrash = (uid) => { spawnNew(uid); if(pinned?.uid===uid){ setPinned(null); setFullscreen(false); setOpenInside(null); } };
  const closeAll = ()=> { setPinned(null); setFullscreen(false); setOpenInside(null); };
  const openPinned = (box)=> { setPinned(box); setOpenInside(null); setFullscreen(false); };
  const onTouchStart = (e, box, isPinned) => {
    const y = e.touches[0].clientY; startYRef.current = y; activeUidRef.current = box.uid; setDragY(0);
    longPressRef.current = setTimeout(()=> { setDragging(true); if(!isPinned) setShowTrash(true); }, 350);
  };
  const onTouchMove = (e, box, isPinned) => {
    if(!dragging) { if(longPressRef.current) clearTimeout(longPressRef.current); return; }
    setDragY(e.touches[0].clientY - startYRef.current);
  };
  const onTouchEnd = (e, box, isPinned) => {
    if(longPressRef.current) clearTimeout(longPressRef.current);
    if(!dragging) { if(!isPinned) openPinned(box); return; }
    if(isPinned) { if(dragY < -100) { closeAll(); showToast("Back to syncing"); } }
    else { if(dragY > 100) { handleTrash(box.uid); } }
    setDragging(false); setDragY(0); setShowTrash(false);
  };

  const renderContent = (box, big=false, fs=false) => {
    if(box.kind==="crypto" || box.kind==="market") return <CryptoChart big={big||fs} realCrypto={live.crypto} trading={live.trading} />;
    if(box.kind==="hacker") return <HackerBox big={big||fs} />;
    if(box.kind==="news" || box.kind==="naija") return <NewsView news={live.news} big={big} fullscreen={fs} selected={selNews} setSelected={setSelNews} openInside={openInside} setOpenInside={setOpenInside} />;
    if(box.kind==="sport") return <ScoresView scores={live.scores} fullscreen={fs} big={big} />;
    if(box.kind==="tiktok" || box.kind==="music" || box.kind==="gaming") return <ViralView viral={live.viral} fullscreen={fs} selected={selViral} setSelected={setSelViral} big={big} />;
    if(box.kind==="space") return <div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.4}}>Earth Orbit • {live.date || "Today"}<br/>Sync {syncTime || "…"}</div>;
    return <NewsView news={live.news} big={big} fullscreen={fs} selected={selNews} setSelected={setSelNews} openInside={openInside} setOpenInside={setOpenInside} />;
  };
  const handleOpenInside = () => {
    if(pinned?.kind==="news" || pinned?.kind==="naija"){
      const n = live.news[selNews % Math.max(1,live.news.length)];
      if(n) setOpenInside({ source:n.source, link:n.link });
    }
    if(pinned?.kind==="tiktok" || pinned?.kind==="music" || pinned?.kind==="gaming"){
      const v = live.viral[selViral % Math.max(1,live.viral.length)];
      if(v) setOpenInside({ source:"Viral", link:v.link });
    }
  };
  const filtered = boxes.filter(b=> b.headline.toLowerCase().includes(search.toLowerCase()));

  const earthCrypto = live.crypto ? { price: live.crypto.price, change: live.crypto.change || 0 } : live.trading?.cryptoList?.find(c=>c.name==="BTC") ? { price: live.trading.cryptoList.find(c=>c.name==="BTC").price, change: live.trading.cryptoList.find(c=>c.name==="BTC").change || 0 } : null;

  return (
    <div style={{ position:"fixed", inset:0, background:"radial-gradient(circle at 50% 50%, #04121f, #000 78%)", overflow:"hidden", fontFamily:"sans-serif", color:"#fff", touchAction:"pan-y" }}>
      <style>{`@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>

      {/* NEW 3D EARTH - FULL SCREEN BEHIND EVERYTHING - Rotating, Standing Boxes, Asteroids, Stars, Cosmic Light */}
      <div style={{ position:"absolute", inset:0, zIndex:1 }}>
        <EarthGlobe
          news={live.news}
          scores={live.scores}
          crypto={earthCrypto}
          trading={live.trading}
          onSelectCity={(city)=>{ showToast(`${city.name}, ${city.country} • Inside Earth`); }}
          onSelectNews={(idx)=>{ setSelNews(idx); const n = live.news[idx]; if(n){ setPinned({ kind:"news", headline:"World Live News", uid: 9999 }); setOpenInside({ source:n.source, link:n.link }); } }}
        />
      </div>

      <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", zIndex:40, display:"flex", gap:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(34,211,238,.3)", borderRadius:999, padding:"6px 6px 6px 14px", backdropFilter:"blur(6px)", width:"min(420px, 92%)" }}>
        <input value={search} onChange={e=> setSearch(e.target.value)} placeholder="Search orbit..." style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontSize:13, minWidth:0 }} />
        <button onClick={()=> setSearch("")} style={{ background:"rgba(34,211,238,.15)", border:"none", borderRadius:999, padding:"8px 14px", fontWeight:800, cursor:"pointer", color:"#fff", flexShrink:0 }}>CLEAR</button>
      </div>

      <div style={{ position:"absolute", top:58, left:"50%", transform:"translateX(-50%)", zIndex:30, fontSize:10, color:"rgba(255,255,255,.6)", letterSpacing:1, whiteSpace:"nowrap", background:"rgba(0,0,0,.35)", padding:"4px 10px", borderRadius:999 }}>
        {live.date ? `TODAY ${live.date} • REAL DATA • SYNC ${syncTime || "…"}` : "TAP BOX TO OPEN • DOUBLE-TAP FOR FULL SCREEN • TAP OUTSIDE TO CLOSE"}
      </div>

      {filtered.map((box,i)=>{
        if(pinned?.uid===box.uid) return null;
        const pos = [{l:"3%",t:"16%"},{l:"62%",t:"15%"},{l:"3%",t:"68%"},{l:"62%",t:"68%"},{l:"32%",t:"84%"}][i%5];
        const isActiveDrag = dragging && activeUidRef.current===box.uid;
        return (
          <div key={box.uid}
            onTouchStart={e=> onTouchStart(e,box,false)} onTouchMove={e=> onTouchMove(e,box,false)} onTouchEnd={e=> onTouchEnd(e,box,false)}
            onClick={()=> { if(!dragging) openPinned(box); }}
            style={{ position:"absolute", left:pos.l, top:pos.t, width:162, padding:10, borderRadius:16, background: isActiveDrag ? "rgba(34,211,238,.15)" : "rgba(2,12,24,.72)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,0.12)", cursor:"grab", animation: isActiveDrag ? "none" : "floaty 4s infinite", animationDelay:`${i*.5}s`, zIndex: isActiveDrag?50:10, transform: isActiveDrag ? `translateY(${dragY}px) scale(1.05)` : "none", transition: isActiveDrag ? "none" : "transform .2s", opacity: isActiveDrag && dragY>80 ? 0.5 : 1 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:.3, lineHeight:1.2 }}>{box.headline}</div>
            <div style={{ marginTop:7 }}>{renderContent(box,false,false)}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.4)", marginTop:6 }}>TAP TO OPEN • DOUBLE-TAP FULL</div>
          </div>
        );
      })}
      {showTrash && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:110, zIndex:60, background: dragY>80 ? "rgba(239,68,68,.35)" : "rgba(239,68,68,.15)", borderTop:"2px dashed #ef4444", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:4 }}>
          <div style={{ fontSize:32 }}>🗑️</div>
          <div style={{ fontSize:12, fontWeight:800 }}>DRAG HERE TO TRASH • NEW BOX WILL COME</div>
        </div>
      )}
      {pinned && !fullscreen && (
        <div onClick={closeAll} style={{ position:"absolute", inset:0, zIndex:40, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:12 }}>
          <div onClick={e=> e.stopPropagation()}
            onDoubleClick={()=> setFullscreen(true)}
            onTouchStart={e=> onTouchStart(e,pinned,true)} onTouchMove={e=> onTouchMove(e,pinned,true)} onTouchEnd={e=> onTouchEnd(e,pinned,true)}
            style={{ width:"min(380px, 100%)", maxHeight:"86vh", overflowY:"auto", background:"rgba(2,12,24,.92)", border:"1px solid rgba(34,211,238,.35)", borderRadius:20, padding:14, backdropFilter:"blur(8px)", boxShadow:"0 0 40px rgba(34,211,238,.2)", transform:`translateY(${dragging?dragY:0}px)` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, fontWeight:900 }}>{pinned.headline} • LIVE</span>
              <span style={{ fontSize:10, color:"#67e8f9", background:"rgba(34,211,238,.12)", padding:"4px 8px", borderRadius:999 }}>● LIVE • TODAY</span>
            </div>
            <div style={{ marginTop:12 }}>{renderContent(pinned,true,false)}</div>
            <div style={{ marginTop:10, fontSize:10, color:"rgba(255,255,255,.5)", textAlign:"center" }}>Double-tap for full screen • Tap outside to close</div>
            <div style={{ display:"flex", gap:6, marginTop:10 }}>
              <button onClick={handleOpenInside} style={{ flex:1, background:"#22d3ee", color:"#000", textAlign:"center", padding:"6px 8px", borderRadius:999, fontWeight:800, fontSize:11, border:"none", cursor:"pointer" }}>OPEN INSIDE</button>
              <button onClick={()=> handleTrash(pinned.uid)} style={{ flex:1, background:"rgba(239,68,68,.15)", border:"1px solid #ef4444", color:"#fff", padding:"6px 8px", borderRadius:999, cursor:"pointer", fontSize:11 }}>TRASH + NEW</button>
            </div>
          </div>
        </div>
      )}
      {pinned && fullscreen && (
        <div onClick={closeAll} style={{ position:"absolute", inset:0, zIndex:90, background:"rgba(0,0,0,.6)" }}>
          <div onClick={e=> e.stopPropagation()} style={{ position:"absolute", inset:0, background:"#020617", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
              <button onClick={closeAll} style={{ background:"rgba(255,255,255,.1)", border:"none", color:"#fff", fontSize:22, width:36, height:36, borderRadius:999, cursor:"pointer", lineHeight:1 }}>←</button>
              <span style={{ fontSize:15, fontWeight:900 }}>{pinned.headline} • LIVE</span>
              <span style={{ marginLeft:"auto", fontSize:10, color:"#67e8f9", background:"rgba(34,211,238,.12)", padding:"4px 8px", borderRadius:999 }}>● LIVE • {syncTime}</span>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:14, paddingBottom:90 }}>{renderContent(pinned,true,true)}</div>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, display:"flex", gap:6, padding:12, background:"rgba(2,6,23,.95)", borderTop:"1px solid rgba(255,255,255,.1)" }}>
              <button onClick={handleOpenInside} style={{ flex:1, background:"#22d3ee", color:"#000", textAlign:"center", padding:"8px", borderRadius:999, fontWeight:800, fontSize:12, border:"none", cursor:"pointer" }}>OPEN INSIDE</button>
              <button onClick={()=> handleTrash(pinned.uid)} style={{ flex:1, background:"rgba(239,68,68,.15)", border:"1px solid #ef4444", color:"#fff", padding:"8px", borderRadius:999, cursor:"pointer", fontSize:12 }}>TRASH + NEW</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:100, background:"rgba(0,0,0,.85)", border:"1px solid rgba(34,211,238,.4)", padding:"9px 16px", borderRadius:999, fontSize:12, whiteSpace:"nowrap" }}>{toast}</div>}
      <div style={{ position:"absolute", bottom:8, width:"100%", textAlign:"center", color:"rgba(103,232,249,.6)", fontSize:9, letterSpacing:3 }}>EVA • PHASE 2 • TAP OUTSIDE TO CLOSE • DOUBLE-TAP FULL</div>
    </div>
  );
    }
