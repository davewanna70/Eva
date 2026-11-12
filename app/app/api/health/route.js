import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const start = Date.now();
  const checks = [];

  // 1. Check Supabase DB - real
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const t0 = Date.now();
    const { data, error } = await supabase.from("messages").select("id").limit(1);
    checks.push({ name:"Supabase DB", status: error ? "FAIL" : "OK", ms: Date.now()-t0, detail: error ? error.message.slice(0,40) : "DB connected" });
  } catch(e){ checks.push({ name:"Supabase DB", status:"FAIL", ms:0, detail:"no env" }); }

  // 2. Check Live API - real
  try {
    const t0 = Date.now();
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const r = await fetch(`${base}/api/live`, { cache:"no-store" }).catch(()=>null);
    checks.push({ name:"Live API /api/live", status: r?.ok ? "OK" : "FAIL", ms: Date.now()-t0, detail: r?.ok ? "news+scores+crypto up" : "down" });
  } catch(e){ checks.push({ name:"Live API", status:"FAIL", ms:0, detail:"error" }); }

  // 3. Check CoinGecko - real internet
  try {
    const t0 = Date.now();
    const r = await fetch("https://api.coingecko.com/api/v3/ping", { cache:"no-store" });
    checks.push({ name:"CoinGecko", status: r.ok ? "OK" : "FAIL", ms: Date.now()-t0, detail:"BTC price source" });
  } catch(e){ checks.push({ name:"CoinGecko", status:"FAIL", ms:0, detail:"no net" }); }

  // 4. System info - real
  checks.push({ name:"EVA Server", status:"OK", ms: Date.now()-start, detail:`Vercel • ${new Date().toLocaleTimeString()}` });

  const allOk = checks.every(c=>c.status==="OK");
  return Response.json({ ok: allOk, time: new Date().toISOString(), uptime_ms: Date.now()-start, checks });
}
