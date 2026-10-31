"use client"
import { useState } from "react"

export default function EvaWebsitePreview({ files }: { files: any }) {
  const [showCode, setShowCode] = useState(false)
  const code = files?.["/App.tsx"] || ""

  if (!code) return null

  // Create preview HTML with Tailwind CDN
  const html = `
    <html>
      <head><script src="https://cdn.tailwindcss.com"></script></head>
      <body><div id="root"></div>
      <script type="importmap">{"imports":{"react":"https://esm.sh/react@18","react-dom":"https://esm.sh/react-dom@18"}}</script>
      <script type="module">
        import React from "react"
        import { createRoot } from "react-dom/client"
        // Simple render - your App.tsx code already has Tailwind
        document.getElementById('root').innerHTML = \`<div style="padding:20px; font-family:sans-serif">\${\`Preview ready — copy code to your project\`}</div>\`;
      </script>
      </body>
    </html>
  `

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
      <div className="flex justify-between bg-black/50 p-2">
        <span className="text-xs text-white">🔥 EVA Website Built</span>
        <div className="flex gap-2">
          <button onClick={()=>setShowCode(!showCode)} className="text-xs bg-white text-black px-2 py-1 rounded">{showCode ? "Preview" : "Show Code"}</button>
          <button onClick={()=>navigator.clipboard.writeText(code)} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Copy</button>
        </div>
      </div>
      {showCode ? (
        <pre className="bg-black text-green-400 text-xs p-4 overflow-auto max-h-[400px]">{code}</pre>
      ) : (
        <div className="bg-white p-4">
          <p className="text-sm text-gray-600 mb-2">✅ Code ready! Full modern website generated. Copy & paste in your Next.js App.tsx</p>
          <div className="text-xs bg-gray-100 p-3 rounded max-h-[300px] overflow-auto">{code.slice(0,1000)}...</div>
        </div>
      )}
    </div>
  )
}
