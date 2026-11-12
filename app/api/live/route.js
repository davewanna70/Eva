export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const today = new Date().toISOString().slice(0,10);
  const isToday = (d) => { if(!d) return true; return new Date(d).toISOString().slice(0,10) === today; };

  // NEWS - if search, use Google News for that query, else BBC etc
  let news = [];
  const RSS = q
    ? [{ src:`Search: ${q}`, url:`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-NG&gl=NG&ceid=NG:en` }]
    : [
      { src:"BBC", url:"https://feeds.bbci.co.uk/news/rss.xml" },
      { src:"Daily Mail", url:"https://www.dailymail.co.uk/news/index.rss" },
      { src:"Punch NG", url:"https://punchng.com/feed/" },
      { src:"Vanguard NG", url:"https://www.vanguardngr.com/feed/" },
      { src:"Sahara Reporters", url:"https://saharareporters.com/rss.xml" },
    ];
  for (let r of RSS) {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(r.url)}`, { next:{ revalidate: 30 } });
      const j = await res.json();
      (j.items||[]).forEach(it=>{
        if(q || isToday(it.pubDate)) news.push({ source:r.src, title:it.title, link:it.link, time:it.pubDate });
      });
    } catch(e){}
  }
  news = news.sort((a,b)=> new Date(b.time)-new Date(a.time)).slice(0,20);

  // CRYPTO - ALL POPULAR COINS, NOT ONLY BTC
  let coins = [];
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin,tether,cardano,binancecoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true", { next:{ revalidate: 20 } });
    const j = await res.json();
    const names = { bitcoin:"Bitcoin BTC", ethereum:"Ethereum ETH", solana:"Solana SOL", dogecoin:"Dogecoin DOGE", tether:"Tether USDT", cardano:"Cardano ADA", binancecoin:"BNB" };
    coins = Object.keys(j).map(k=>({ id:k, name:names[k]||k, price:j[k].usd, change:j[k].usd_24h_change, vol:j[k].usd_24h_vol, cap:j[k].usd_market_cap }));
  } catch(e){}
  let crypto = coins.find(c=>c.id==="bitcoin") || { price:null, change:0 };

  // SCORES
  let scores = [];
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=${today.replaceAll("-","")}`, { next:{ revalidate: 30 } });
    const j = await res.json();
    (j.events||[]).forEach(ev=>{
      const c = ev.competitions?.[0];
      const home = c?.competitors?.find(x=>x.homeAway==="home");
      const away = c?.competitors?.find(x=>x.homeAway==="away");
      scores.push({ league:"EPL", home:home?.team?.displayName, away:away?.team?.displayName, homeScore:home?.score, awayScore:away?.score, status:c?.status?.type?.shortDetail||"Today", live:c?.status?.type?.state==="in" });
    });
  } catch(e){}

  // VIRAL - if search, filter by search word
  let viral = [];
  try {
    const res = await fetch("https://www.reddit.com/r/funny+Unexpected+MadeMeSmile/top.json?limit=20&t=day", { headers:{ "User-Agent":"EVA/1.0" }, next:{ revalidate: 120 } });
    const j = await res.json();
    viral = (j.data?.children||[]).map(c=>({ title:c.data.title, link:"https://reddit.com"+c.data.permalink, score:c.data.score, hasVideo: !!c.data.is_video, videoUrl: c.data.media?.reddit_video?.fallback_url || "" })).filter(v=> !q || v.title.toLowerCase().includes(q.toLowerCase())).slice(0,10);
  } catch(e){}

  return Response.json({ date: today, news, scores, crypto, coins, viral, query:q });
}
