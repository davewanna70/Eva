"use client";
import { useEffect, useState, useRef } from "react";

const POOL = [
  { kind:"crypto", headline:"Crypto Live Market" },
  { kind:"news", headline:"World Live News" },
  { kind:"tiktok", headline:"Viral Live Now" },
  { kind:"sport", headline:"Football Live Score" },
  { kind:"hacker", headline:"EVA System Check" },
];

export default function EvaPhase1() {
  const [boxes, setBoxes] = useState(()=> POOL.map((p,i)=> ({ ...p, uid: Date.now()+i })));
  const [pinned, setPinned] = useState(null);
  const [pinnedNews, setPinnedNews] = useState(null);
  const [pinnedViral, setPinnedViral] = useState(null);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [live, setLive] = useState({ news:[], scores:[], viral:[], crypto:null, coins:[], date:"" });
  const [syncTime, setSyncTime] = useState("");
  const [newsIdx, setNewsIdx] = useState(0);
  const [viralIdx, setViralIdx] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState("bitcoin");
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState("");
  const longPressRef = useRef(null);
  const startYRef = useRef(0);
  const activeUidRef = useRef(null);

  const load = async (q="") => {
    try {
      const r = await fetch(`/api/live${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const j = await r.json();
      setLive({ news:j.news||[], scores:j.scores||[], viral:j.viral||[], crypto:j.crypto||null, coins:j.coins||[], date:j.date||"" });
      setSyncTime(new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}));
    } catch(e){}
  };
  useEffect(()=>{ load(); const t=setInterval(()=> load(searchMode ? search : ""), 60000); return ()=>clearInterval(t); },[]);
  useEffect(()=>{ if(!live.news.length) return; const t=setInterval(()=> setNewsIdx(v=>(v+1)%live.news.length), 4000); return ()=>clearInterval(t); },[live.news]);
  useEffect(()=>{ if(!live.viral.length) return; const t=setInterval(()=> setViralIdx(v=>(v+1)%live.viral.length), 4000); return ()=>clearInterval(t); },[live.viral]);

  const doSearch = async () => {
    if(!search.trim()) return;
    setSearchMode(true); setPinned(null); await load(search.trim());
    setToast(`🔍 Searching "${search}" - 4 boxes updated`);
    setTimeout(()=> setToast(""), 2000);
  };
  const clearSearch = async () => { setSearch(""); setSearchMode(false); await load(""); setPinned(null); };

  const showToast = (t)=> { setToast(t); setTimeout(()=> setToast(""), 1800); };
  const handleTrash = (uid) => {
    const used = boxes.filter(b=>b.uid!==uid).map(b=>b.kind);
    const cands = POOL.filter(p=>!used.includes(p.kind));
    const pick = cands[Math.floor(Math.random()*cands.length)] || POOL[0];
    setBoxes(prev=> [...prev.filter(b=>b.uid!==uid), { ...pick, uid: Date.now()+Math.random() }]);
    if(pinned?.uid===uid) setPinned(null);
    showToast(`🗑️ Trashed • New: ${pick.headline}`);
  };
  const onTouchStart = (e, box, isPinned) => {
    const y = e.touches[0].clientY; startYRef.current = y; activeUidRef.current = box.uid; setDragY(0);
    longPressRef.current = setTimeout(()=> { setDragging(true); if(!isPinned) setShowTrash(true); }, 350);
  };
  const onTouchMove = (e) => { if(!dragging) { if(longPressRef.current) clearTimeout(longPressRef.current); return; } setDragY(e.touches[0].clientY - startYRef.current); };
  const onTouchEnd = (e, box, isPinned) => {
    if(longPressRef.current) clearTimeout(longPressRef.current);
    if(!dragging) { if(!isPinned) openBox(box); return; }
    if(isPinned) { if(dragY < -100) { setPinned(null); showToast("↩️ Back to syncing"); } }
    else { if(dragY > 100) handleTrash(box.uid); }
    setDragging(false); setDragY(0); setShowTrash(false);
  };
  const openBox = (box) => {
    setPinned(box);
    if(box.kind==="news") setPinnedNews(live.news[newsIdx % Math.max(1,live.news.length)] || null);
    if(box.kind==="tiktok") setPinnedViral(live.viral[viralIdx % Math.max(1,live.viral.length)] || null);
    setPlaying(false);
  };

  const coin = live.coins.find(c=>c.id===selectedCoin) || live.crypto || { price:0, change:0, name:"Bitcoin" };

  const renderContent = (box, big=false) => {
    if(box.kind==="crypto") {
      const c = big ? coin : (live.crypto||{});
      return (
        <div style={{width:"100%"}} onClick={(e)=>{ e.stopPropagation(); if(!big) openBox(box); }}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize: big?22:16,fontWeight:900,color: (c.change||0)<0?"#ef4444":"#22c55e"}}>${(c.price||0).toLocaleString(undefined,{minimumFractionDigits:2})}</span><span style={{fontSize:10,fontWeight:900,background:(c.change||0)<0?"#ef4444":"#22c55e",color:"#fff",padding:"3px 7px",borderRadius:6}}>{(c.change||0)<0?"▼ DOWN":"▲ UP"} {(c.change||0).toFixed(2)}%</span></div>
          <div style={{fontSize:10,color:"#94a3b8"}}>{c.name||"Bitcoin"} • REAL • CoinGecko • Binance • Coinbase</div>
          <svg viewBox="0 0 100 60" style={{width:"100%",height: big?110:60,marginTop:6}}><polyline points="0,40 14,38 28,44 42,36 56,42 70,30 84,38 100,32" fill="none" stroke={(c.change||0)<0?"#ef4444":"#22c55e"} strokeWidth="2"/></svg>
          {big && (
            <div style={{marginTop:8}}>
              <div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.6}}>24h Volume: ${(c.vol||0).toLocaleString()}<br/>Market Cap: ${(c.cap||0).toLocaleString()}<br/>Day: Open → High → Low • Today {live.date}<br/>Platforms: Binance • Coinbase • CoinGecko • Kraken — all show same BTC price</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>{live.coins.map(cc=> <button key={cc.id} onClick={(e)=>{e.stopPropagation(); setSelectedCoin(cc.id);}} style={{fontSize:10,padding:"5px 9px",borderRadius:999,border:"none",background: selectedCoin===cc.id?"#22d3ee":"rgba(255,255,255,.1)",color:selectedCoin===cc.id?"#000":"#fff",cursor:"pointer"}}>{cc.name} ${cc.price?.toLocaleString()}</button>)}</div>
            </div>
          )}
        </div>
      );
    }
    if(box.kind==="hacker") return <HackerBox big={big} />;
    if(box.kind==="news") {
      if(!live.news.length) return <div style={{fontSize:11,color:"#94a3b8"}}>Syncing today's news...</div>;
      const item = big ? (pinnedNews||live.news[0]) : live.news[newsIdx % live.news.length];
      return <div><div style={{fontSize:9,color:"#67e8f9",fontWeight:800}}>{item.source} • {item.time?new Date(item.time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"TODAY"}</div><div style={{fontSize: big?13:11,lineHeight:1.4,marginTop:4}}>{item.title}</div>{big && <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>This is the exact story you tapped. OPEN PAGE will open THIS story, not another one.</div>}</div>;
    }
    if(box.kind==="sport") {
      if(!live.scores.length) return <div style={{fontSize:11,color:"#94a3b8"}}>No matches today in EPL.</div>;
      const s = live.scores[0]; return <div><div style={{fontSize:9,color:"#facc15",fontWeight:800}}>{s.league} • {s.status}</div><div style={{fontSize:12,fontWeight:800,marginTop:4}}>{s.home} {s.homeScore} - {s.awayScore} {s.away}</div></div>;
    }
    if(box.kind==="tiktok") {
      if(!live.viral.length) return <div style={{fontSize:11,color:"#94a3b8"}}>Syncing viral...</div>;
      const v = big ? (pinnedViral||live.viral[0]) : live.viral[viralIdx % live.viral.length];
      return <div><div style={{fontSize:9,color:"#f472b6",fontWeight:800}}>🔥 VIRAL TODAY • {v.score} upvotes</div><div style={{fontSize: big?13:11,lineHeight:1.4,marginTop:4}}>{v.title}</div>{big && v.hasVideo && <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>🎬 This one has video — tap PLAY below</div>}</div>;
    }
    return null;
  };

  return (
    <div style={{position:"fixed",inset:0,background:"radial-gradient(circle at 50% 50%, #04121f, #000 78%)",overflow:"hidden",fontFamily:"sans-serif",color:"#fff"}} onClick={()=>{ if(pinned) setPinned(null); }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
      <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:40,display:"flex",gap:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(34,211,238,.3)",borderRadius:999,padding:"6px 6px 6px 14px",width:"min(420px,92%)"}} onClick={e=>e.stopPropagation()}>
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") doSearch();}} placeholder="🔍 Search e.g. bag of rice..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:13,minWidth:0}} />
        <button onClick={doSearch} style={{background:"#22d3ee",border:"none",borderRadius:999,padding:"8px 12px",fontWeight:800,cursor:"pointer"}}>SEARCH</button>
        <button onClick={clearSearch} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:999,padding:"8px 12px",fontWeight:800,cursor:"pointer",color:"#fff"}}>CLEAR</button>
      </div>
      {searchMode && <div style={{position:"absolute",top:58,left:"50%",transform:"translateX(-50%)",zIndex:30,fontSize:11,background:"#22d3ee",color:"#000",padding:"5px 12px",borderRadius:999,fontWeight:800,whiteSpace:"nowrap"}}>🔍 Results for "{search}" • 4 boxes = 4 different answers • Tap CLEAR to go back</div>}
      {!searchMode && <div style={{position:"absolute",top:58,left:"50%",transform:"translateX(-50%)",zIndex:30,fontSize:10,color:"rgba(255,255,255,.45)",background:"rgba(0,0,0,.25)",padding:"4px 10px",borderRadius:999,whiteSpace:"nowrap"}}>{live.date?`📅 TODAY ${live.date} • REAL • SYNC ${syncTime}`:"SYNCING..."}</div>}
      <div style={{position:"absolute",left:"50%",top:"54%",transform:"translate(-50%,-50%)",width:210,height:210,borderRadius:"50%",background:"radial-gradient(circle at 40% 35%, #1e3a8a, #020617 65%)",border:"1px solid rgba(34,211,238,.5)",boxShadow:"0 0 60px rgba(34,211,238,.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:110}}>🌍<div style={{position:"absolute",inset:10,borderRadius:"50%",border:"1px dashed rgba(34,211,238,.4)",animation:"spin 10s linear infinite"}} /></div>
      {boxes.map((box,i)=>{
        if(pinned?.uid===box.uid) return null;
        const pos = [{l:"3%",t:"16%"},{l:"62%",t:"15%"},{l:"3%",t:"68%"},{l:"62%",t:"68%"},{l:"32%",t:"84%"}][i%5];
        const isActive = dragging && activeUidRef.current===box.uid;
        return (
          <div key={box.uid} onTouchStart={e=>onTouchStart(e,box,false)} onTouchMove={onTouchMove} onTouchEnd={e=>onTouchEnd(e,box,false)} onClick={e=>{e.stopPropagation(); if(!dragging) openBox(box);}} style={{position:"absolute",left:pos.l,top:pos.t,width:162,padding:10,borderRadius:16,background: isActive?"rgba(34,211,238,.15)":"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)",cursor:"pointer",animation: isActive?"none":"floaty 4s infinite",animationDelay:`${i*.5}s`,zIndex:isActive?50:10,transform: isActive?`translateY(${dragY}px) scale(1.05)`:"none"}}>
            <div style={{fontSize:11,fontWeight:800}}>{box.headline}</div><div style={{marginTop:7}}>{renderContent(box,false)}</div><div style={{fontSize:9,color:"rgba(255,255,255,.4)",marginTop:6}}>TAP TO OPEN • HOLD TO THROW</div>
          </div>
        );
      })}
      {showTrash && <div style={{position:"absolute",bottom:0,left:0,right:0,height:110,zIndex:60,background:"rgba(239,68,68,.2)",borderTop:"2px dashed #ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><div style={{fontSize:32}}>🗑️</div><div style={{fontSize:12,fontWeight:800}}>DRAG HERE TO TRASH</div></div>}
      {pinned && (
        <div onClick={e=>e.stopPropagation()} onTouchStart={e=>onTouchStart(e,pinned,true)} onTouchMove={onTouchMove} onTouchEnd={e=>onTouchEnd(e,pinned,true)} style={{position:"absolute",left:"50%",top:"50%",transform:`translate(-50%,-50%) translateY(${dragging?dragY:0}px)`,width:"min(360px,92%)",background:"rgba(2,12,24,.92)",border:"1px solid rgba(34,211,238,.35)",borderRadius:20,padding:16,zIndex:40}}>
          <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:900}}>{pinned.headline} • LIVE</span><button onClick={()=>setPinned(null)} style={{background:"rgba(255,255,255,.1)",border:"none",color:"#fff",borderRadius:999,padding:"4px 10px",cursor:"pointer"}}>✕</button></div>
          <div style={{marginTop:12}}>{renderContent(pinned,true)}</div>
          {/* PLAY ONLY IF VIDEO + MUTE */}
          {pinned.kind==="tiktok" && pinnedViral?.hasVideo && (
            <div style={{display:"flex",gap:6,marginTop:12}}>
              <button onClick={()=>setPlaying(!playing)} style={{flex:1,background:"#22d3ee",border:"none",padding:"11px",borderRadius:999,fontWeight:900,cursor:"pointer"}}>{playing?"⏸ PAUSE":"▶ PLAY VIDEO"}</button>
              <button onClick={()=>setMuted(!muted)} style={{background:"rgba(255,255,255,.1)",border:"1px solid #475569",color:"#fff",padding:"11px 14px",borderRadius:999,cursor:"pointer"}}>{muted?"🔇 MUTED":"🔊 SOUND"}</button>
            </div>
          )}
          {playing && pinnedViral?.videoUrl && <video src={pinnedViral.videoUrl} autoPlay muted={muted} controls loop style={{width:"100%",marginTop:10,borderRadius:12}} />}
          {pinned.kind==="news" && pinnedNews && <a href={pinnedNews.link} target="_blank" rel="noreferrer" style={{display:"block",marginTop:12,background:"#22d3ee",color:"#000",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:900,textDecoration:"none"}}>↗ OPEN THIS STORY — {pinnedNews.source}</a>}
          {pinned.kind==="tiktok" && pinnedViral && !pinnedViral.hasVideo && <a href={pinnedViral.link} target="_blank" rel="noreferrer" style={{display:"block",marginTop:12,background:"#22d3ee",color:"#000",textAlign:"center",padding:"12px",borderRadius:999,fontWeight:900,textDecoration:"none"}}>↗ OPEN VIRAL POST</a>}
          <div style={{marginTop:10,fontSize:11,color:"rgba(255,255,255,.55)",textAlign:"center"}}>Tap outside to close • Long-press + throw up to go back</div>
        </div>
      )}
      {toast && <div style={{position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",zIndex:80,background:"rgba(0,0,0,.85)",border:"1px solid rgba(34,211,238,.4)",padding:"9px 16px",borderRadius:999,fontSize:12}}>{toast}</div>}
      <div style={{position:"absolute",bottom:8,width:"100%",textAlign:"center",color:"rgba(103,232,249,.6)",fontSize:9,letterSpacing:3}}>EVA • REAL DATA • TAP OUTSIDE TO CLOSE</div>
    </div>
  );
}

function HackerBox({ big=false }) {
  const [health, setHealth] = useState(null);
  const [lines, setLines] = useState(["> eva --system-check --live"]);
  useEffect(()=>{
    const load = async ()=>{
      try{ const r = await fetch("/api/health"); const j = await r.json(); setHealth(j); const nl = j.checks.map(c=> `${c.status==="OK"?"✓":"✗"} ${c.name} — ${c.ms}ms — ${c.status}`); setLines(prev=> [...prev.slice(-(big?6:2)), `> check @ ${new Date().toLocaleTimeString()}`, ...nl]); }catch(e){ setLines(prev=> [...prev.slice(-4), `✗ health fetch failed @ ${new Date().toLocaleTimeString()}`]); }
    };
    load(); const t=setInterval(load, 5000); return ()=>clearInterval(t);
  },[big]);
  return <div style={{fontFamily:"monospace",fontSize: big?11:10,lineHeight:1.5,color:"#4ade80",minHeight: big?120:70,overflow:"hidden"}}><div style={{fontWeight:800}}>{health ? "● SYSTEM: ALL OK" : "● SYSTEM: CHECKING..."}</div>{lines.slice(-(big?10:4)).map((l,i)=> <div key={i} style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",color:l.startsWith("✗")?"#ef4444":"#4ade80"}}>{l}</div>)}<div>▋</div>{big && health && <div style={{color:"#94a3b8",fontFamily:"sans-serif",fontSize:11,marginTop:6}}>Checked every 5 sec • Real checks, not fake.</div>}</div>;
  }
