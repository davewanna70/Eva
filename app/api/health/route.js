export async function GET() {
  const start = Date.now();
  const checks = [];
  checks.push({ name:"EVA Server", status:"OK", ms: Date.now()-start, detail:"Vercel • Server running" });
  try {
    const t0 = Date.now();
    const r = await fetch("https://api.coingecko.com/api/v3/ping", { cache:"no-store" });
    checks.push({ name:"CoinGecko", status: r.ok ? "OK" : "FAIL", ms: Date.now()-t0, detail:"BTC price source" });
  } catch(e){ checks.push({ name:"CoinGecko", status:"FAIL", ms:0, detail:"no net" }); }
  try {
    const t0 = Date.now();
    const r = await fetch("https://feeds.bbci.co.uk/news/rss.xml", { cache:"no-store" });
    checks.push({ name:"BBC News Feed", status: r.ok ? "OK" : "FAIL", ms: Date.now()-t0, detail:"News source" });
  } catch(e){ checks.push({ name:"BBC News Feed", status:"FAIL", ms:0, detail:"no net" }); }
  try {
    const t0 = Date.now();
    const r = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard", { cache:"no-store" });
    checks.push({ name:"ESPN Scores", status: r.ok ? "OK" : "FAIL", ms: Date.now()-t0, detail:"Scores source" });
  } catch(e){ checks.push({ name:"ESPN Scores", status:"FAIL", ms:0, detail:"no net" }); }
  return Response.json({ ok:true, time: new Date().toISOString(), uptime_ms: Date.now()-start, checks });
}
