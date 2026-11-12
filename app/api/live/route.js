export async function GET() {
  const today = new Date().toISOString().slice(0,10);
  const isToday = (d) => {
    if(!d) return true;
    const dt = new Date(d);
    return dt.toISOString().slice(0,10) === today;
  };

  const RSS = [
    { src:"BBC", url:"https://feeds.bbci.co.uk/news/rss.xml" },
    { src:"Daily Mail", url:"https://www.dailymail.co.uk/news/index.rss" },
    { src:"Punch NG", url:"https://punchng.com/feed/" },
    { src:"Vanguard NG", url:"https://www.vanguardngr.com/feed/" },
    { src:"Sahara Reporters", url:"https://saharareporters.com/rss.xml" },
  ];

  let news = [];
  for (let r of RSS) {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(r.url)}`, { next:{ revalidate: 60 } });
      const j = await res.json();
      (j.items||[]).forEach(it=>{
        if(isToday(it.pubDate)) news.push({ source:r.src, title:it.title, link:it.link, time:it.pubDate, img:it.thumbnail||"" });
      });
    } catch(e){}
  }
  news = news.sort((a,b)=> new Date(b.time)-new Date(a.time)).slice(0,20);

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

  let crypto = { price: null, change: 0 };
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true", { next:{ revalidate: 20 } });
    const j = await res.json();
    crypto = { price: j.bitcoin?.usd, change: j.bitcoin?.usd_24h_change };
  } catch(e){}

  let viral = [];
  try {
    const res = await fetch("https://www.reddit.com/r/funny+Unexpected+MadeMeSmile/top.json?limit=12&t=day", { headers:{ "User-Agent":"EVA/1.0" }, next:{ revalidate: 120 } });
    const j = await res.json();
    viral = (j.data?.children||[]).map(c=>({ title:c.data.title, link:"https://reddit.com"+c.data.permalink, score:c.data.score, img:"" })).slice(0,10);
  } catch(e){}

  return Response.json({ date: today, news, scores, crypto, viral });
}
