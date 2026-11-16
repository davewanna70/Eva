import { NextResponse } from 'next/server';
const SNIPPETS = [
  { id: "react-useEffect", lang: "javascript", tags: ["react","hooks","useeffect"], code: "useEffect(() => {\n  // your code\n}, []);" },
  { id: "kore-voice", lang: "javascript", tags: ["voice","kore","speak","audio"], code: "fetch('/api/voice', { method: 'POST', body: JSON.stringify({ text }) })" },
  { id: "sql-select", lang: "sql", tags: ["select","sql","filter"], code: "SELECT * FROM users WHERE age > 30;" },
];
export async function POST(req){
  const { message } = await req.json();
  const t = (message||"").toLowerCase();
  const isCode = /voice|kore|code|function|useeffect|supabase|api|error|fetch|sql|select/.test(t);
  if(!isCode) return NextResponse.json({ suggestions: [] });
  const keywords = t.match(/\b\w+\b/g) || [];
  const suggestions = SNIPPETS.filter(sn => keywords.some(k => sn.tags.includes(k)));
  return NextResponse.json({ suggestions });
}
