'use client'
import { useState, useEffect } from 'react';

export default function EVA(){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  useEffect(()=>{ 
    const h=new Date().getHours();
    let g="Good morning, Boss.";
    if(h>=12) g="Good afternoon, Boss.";
    if(h>=17) g="Good evening, Boss.";
    setMsgs([{role:'eva',text:g}]) 
  },[]);
  const handleSend=async()=>{
    if(!input.trim()) return;
    const t=input; 
    setMsgs(m=>[...m,{role:'user',text:t}]); 
    setInput(''); setLoading(true);
    try{
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t})});
      const d=await r.json();
      setMsgs(m=>[...m,{role:'eva',text:d.reply||"Sorry Boss."}]);
    }catch{ setMsgs(m=>[...m,{role:'eva',text:"Network issue."}]) }
    setLoading(false);
  };
  return(
    <div style={{minHeight:'100vh',background:'#0a0a14',color:'white',padding:16,fontFamily:'sans-serif',display:'flex',flexDirection:'column'}}>
      <div style={{fontSize:22,fontWeight:'bold',letterSpacing:4}}>EVA</div>
      <div style={{flex:1,marginTop:24,display:'flex',flexDirection:'column',gap:10,overflowY:'auto',marginBottom:20}}>
        {msgs.map((m,i)=><div key={i} style={{maxWidth:'85%',padding:12,borderRadius:16,fontSize:14,background:m.role==='eva'?'#1a1a2e':'#7c3aed',alignSelf:m.role==='eva'?'flex-start':'flex-end'}}>{m.text}</div>)}
        {loading && <div style={{padding:'12px 16px',background:'#1a1a2e',borderRadius:18,width:'fit-content'}}>● ● ●</div>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,background:'#1a1a2a',borderRadius:24,padding:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder="Message Eva..." style={{flex:1,background:'transparent',border:'none',outline:'none',color:'white',fontSize:14}} />
        <button onClick={handleSend} style={{width:40,height:40,borderRadius:20,background:'#7c3aed',border:'none',color:'white',fontWeight:'bold'}}>↑</button>
      </div>
    </div>
  )
}
