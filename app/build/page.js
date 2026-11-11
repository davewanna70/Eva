"use client";
import { useState } from "react";

export default function Build() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("Website");

  return (
    <div style={{minHeight:"100dvh", background:"#030014", color:"white", padding:20, fontFamily:"sans-serif"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <b style={{fontSize:22}}>💧 EVA</b>
        <button onClick={()=> window.location.href='/'} style={{background:"rgba(255,255,255,0.15)", border:"none", color:"white", padding:"8px 14px", borderRadius:999}}>← Back to Chat</button>
      </div>

      <h1 style={{color:"#c084fc", fontSize:28, lineHeight:1.2, marginTop:30}}>
        What should EVA create<br/>for you today?
      </h1>

      <textarea value={prompt} onChange={(e)=> setPrompt(e.target.value)}
        placeholder="Describe your website, shop, or idea..."
        style={{width:"100%", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:16, color:"white", padding:14, fontSize:15, minHeight:80, marginTop:16}}
      />

      <p style={{marginTop:20, opacity:0.8}}>Suggestions</p>
      <div style={{display:"flex", flexWrap:"wrap", gap:10}}>
        {["Fashion store","Restaurant","Portfolio","Church site"].map(i=>(
          <button key={i} onClick={()=> setPrompt(`Build me a ${i.toLowerCase()} website`)} style={{background:"transparent", border:"1px solid #a78bfa", color:"white", padding:"8px 14px", borderRadius:999}}>{i}</button>
        ))}
      </div>

      <p style={{marginTop:24}}>Create</p>
      <div style={{display:"flex", gap:10}}>
        {["Website","Image","Video"].map(m=>(
          <button key={m} onClick={()=> setMode(m)} style={{flex:1, background: mode===m ? "#c084fc":"rgba(255,255,255,0.12)", border:"none", color: mode===m ? "black":"white", padding:14, borderRadius:14, fontWeight:"bold"}}>{m}</button>
        ))}
      </div>

      <button onClick={()=> alert(`EVA go build ${mode}: ${prompt}`)} style={{width:"100%", background:"#c084fc", border:"none", color:"black", padding:14, borderRadius:999, fontWeight:"bold", marginTop:20, fontSize:16}}>
        Create {mode} →
      </button>

      <p style={{textAlign:"center", fontSize:12, opacity:0.6, marginTop:12}}>EVA will generate and you can edit anytime</p>
    </div>
  );
}
