'use client'
import { useState, useEffect } from 'react';

function getGreeting(){
  const h=new Date().getHours();
  if(h<12) return "Good morning, Boss. I'm here. What do you need?";
  if(h<17) return "Good afternoon, Boss. I'm here. How can I help?";
  if(h<22) return "Good evening, Boss. I'm here. Need anything?";
  return "You're up late, Boss. I'm here if you need me.";
}

function EvaPreview({ files }: { files: any }) {
  const [showCode, setShowCode] = useState(false)
  const code = files?.["/App.tsx"] || files?.["/app.tsx"] || ""
  if (!code) return null
  return (
    <div style={{marginTop:12, borderRadius:12, overflow:'hidden', border:'1px solid #444'}}>
      <div style={{display:'flex', justifyContent:'space-between', background:'#000', padding:8}}>
        <span style={{fontSize:10, color:'white'}}>🔥 EVA Website Built</span>
        <div style={{display:'flex', gap:6}}>
          <button onClick={()=>setShowCode(!showCode)} style={{fontSize:10, background:'white', color:'black', padding:'2px 8px', borderRadius:4}}>{showCode ? "Preview" : "Show Code"}</button>
          <button onClick={()=>{navigator.clipboard.writeText(code)}} style={{fontSize:10, background:'#7c3aed', color:'white', padding:'2px 8px', borderRadius:4}}>Copy</button>
        </div>
      </div>
      {showCode ? (
        <pre style={{background:'black', color:'#22c55e', fontSize:10, padding:12, overflow:'auto', maxHeight:400, whiteSpace:'pre-wrap'}}>{code}</pre>
      ) : (
        <div style={{background:'white', padding:12}}>
          <p style={{fontSize:12, color:'#555', marginBottom:8}}>✅ Code ready! Full modern website generated.</p>
          <div style={{fontSize:10, background:'#f3f3f3', padding:8, borderRadius:6, maxHeight:300, overflow:'auto', color:'black'}}>{code.slice(0,800)}...</div>
        </div>
      )}
    </div>
  )
}

export default function EVA(){
  const [msgs,setMsgs]=useState<any[]>([]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  
  useEffect(()=>{ setMsgs([{role:'eva',text:getGreeting()}]) },[]);
  
  const handleSend=async()=>{
    if(!input.trim()) return;
    const t=input; 
    setMsgs(m=>[...m,{role:'user',text:t}]); 
    setInput(''); 
    setLoading(true);
    try{
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t})});
      const d=await r.json();
      setMsgs(m=>[...m,{role:'eva',text:d.reply||"Sorry Boss.", files: d.files || null}]);
    }catch{ 
      setMsgs(m=>[...m,{role:'eva',text:"Network issue Boss, try again."}]) 
    }
    setLoading(false);
  };
  
  return(
    <div style={{minHeight:'100vh',background:'#0a0a14',color:'white',padding:16,fontFamily:'sans-serif',display:'flex',flexDirection:'column'}}>
      <div style={{fontSize:22,fontWeight:'bold',letterSpacing:4}}>EVA</div>
      <div style={{fontSize:9,color:'#555',letterSpacing:3,marginTop:2}}>YOUR PERSONAL AI</div>
      <div style={{flex:1,marginTop:24,display:'flex',flexDirection:'column',gap:10,overflowY:'auto',marginBottom:20}}>
        {msgs.map((m:any,i:number)=>
          <div key={i} style={{maxWidth:'85%',padding:12,borderRadius:16,fontSize:14,background:m.role==='eva'?'#1a1a2e':'#7c3aed',alignSelf:m.role==='eva'?'flex-start':'flex-end'}}>
            <div>{m.text}</div>
            {m.files && <EvaPreview files={m.files} />}
          </div>
        )}
        {loading && <div style={{padding:'12px 16px',background:'#1a1a2e',borderRadius:18,width:'fit-content'}}>● ● ●</div>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,background:'#1a1a2a',borderRadius:24,padding:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder="Message Eva..." style={{flex:1,background:'transparent',border:'none',outline:'none',color:'white',fontSize:14}} />
        <button onClick={handleSend} style={{width:40,height:40,borderRadius:20,background:'#7c3aed',border:'none',color:'white',fontWeight:'bold'}}>↑</button>
      </div>
    </div>
  )
                  }
