export async function GET() {
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  const isToday = (d) => { if(!d) return true; const s = new Date(d).toISOString().slice(0,10); return s === today || s === yesterday; };

  const RSS = [
    { src:"BBC", url:"https://feeds.bbci.co.uk/news/rss.xml" },
    { src:"Daily Mail", url:"https://www.dailymail.co.uk/news/index.rss" },
    { src:"Punch NG", url:"https://punchng.com/feed/" },
    { src:"Vanguard NG", url:"https://www.vanguardngr.com/feed/" },
    { src:"Sahara Reporters", url:"https://saharareporters.com/rss.xml" },
    { src:"CNN", url:"http://rss.cnn.com/rss/edition.rss" },
  ];

  let news = [];
  let newsAll = [];
  for (let r of RSS) {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(r.url)}`, { next:{ revalidate: 60 } });
      const j = await res.json();
      (j.items||[]).forEach(it=>{
        const raw = (it.content || it.description || "").replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").trim();
        const item = { source:r.src, title:it.title, link:it.link, time:it.pubDate, img:it.thumbnail||it.enclosure?.link||"", desc: raw.slice(0,1200), full: raw.slice(0,2500) };
        newsAll.push(item);
        if(isToday(it.pubDate)) news.push(item);
      });
    } catch(e){}
  }
  // If today has too few stories, fill with latest stories so box is never empty
  if(news.length < 5){
    const seen = new Set(news.map(n=> n.title));
    const extra = newsAll.filter(n=> !seen.has(n.title)).sort((a,b)=> new Date(b.time)-new Date(a.time)).slice(0, 20 - news.length);
    news = [...news, ...extra];
  }
  news = news.sort((a,b)=> new Date(b.time)-new Date(a.time)).slice(0,30);

  const leagues = [
    { id:"eng.1", name:"EPL" },
    { id:"esp.1", name:"La Liga" },
    { id:"ita.1", name:"Serie A" },
    { id:"ger.1", name:"Bundesliga" },
    { id:"fra.1", name:"Ligue 1" },
    { id:"uefa.champions", name:"UCL" },
    { id:"ned.1", name:"Eredivisie" },
    { id:"por.1", name:"Primeira" },
  ];
  let scores = [];
  const fetchScoresForDate = async (dateStr) => {
    const out = [];
    for (let lg of leagues) {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg.id}/scoreboard?dates=${dateStr.replaceAll("-","")}`, { next:{ revalidate: 30 } });
        const j = await res.json();
        (j.events||[]).forEach(ev=>{
          const c = ev.competitions?.[0];
          const home = c?.competitors?.find(x=>x.homeAway==="home");
          const away = c?.competitors?.find(x=>x.homeAway==="away");
          out.push({ league:lg.name, home:home?.team?.displayName, away:away?.team?.displayName, homeScore:home?.score ?? "-", awayScore:away?.score ?? "-", status:c?.status?.type?.shortDetail||"Today", live:c?.status?.type?.state==="in", link:ev.links?.[0]?.href||"" });
        });
      } catch(e){}
    }
    return out;
  };
  scores = await fetchScoresForDate(today);
  if(scores.length===0){
    scores = await fetchScoresForDate(yesterday);
    scores = scores.map(s=> ({ ...s, league: s.league + " • Yesterday" }));
  }
  if(scores.length===0){
    // Last resort: 2 days ago, so box is never empty
    const d2 = new Date(Date.now() - 2*86400000).toISOString().slice(0,10);
    scores = await fetchScoresForDate(d2);
    scores = scores.map(s=> ({ ...s, league: s.league + " • 2 Days Ago" }));
  }

  let crypto = { price: null, change: 0 };
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true", { next:{ revalidate: 20 } });
    const j = await res.json(); crypto = { price: j.bitcoin?.usd, change: j.bitcoin?.usd_24h_change };
  } catch(e){}

  // TRADING - real sparkline, fixed order, full forex for calculator
  let trading = { cryptoList:[], forex:[], gold:0, rates:{} };
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,dogecoin,tether,binancecoin&order=market_cap_desc&per_page=6&page=1&sparkline=true&price_change_percentage=24h", { next:{ revalidate: 20 } });
    const j = await r.json();
    const mapped = (Array.isArray(j) ? j : []).map(c=> ({
      name:c.symbol.toUpperCase(),
      full:c.name,
      price:c.current_price,
      change:c.price_change_percentage_24h,
      spark: c.sparkline_in_7d?.price?.slice(-40) || []
    }));
    // Force stable order: BTC, ETH, BNB, SOL, DOGE, USDT
    const order = ["BTC","ETH","BNB","SOL","DOGE","USDT"];
    trading.cryptoList = order.map(n=> mapped.find(m=> m.name===n)).filter(Boolean);
    // Add any missing ones at the end
    mapped.forEach(m=> { if(!trading.cryptoList.find(x=> x.name===m.name)) trading.cryptoList.push(m); });
    if(trading.cryptoList.length>0){
      const btc = trading.cryptoList.find(c=> c.name==="BTC");
      if(btc) crypto = { price: btc.price, change: btc.change };
    }
  } catch(e){}
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { next:{ revalidate: 60 } });
    const j = await r.json();
    const rates = j.rates || {};
    trading.rates = rates;
    trading.forex = [
      { pair:"USD / NGN", price: rates.NGN || 0 },
      { pair:"EUR / USD", price: rates.EUR ? 1/rates.EUR : 0 },
      { pair:"GBP / USD", price: rates.GBP ? 1/rates.GBP : 0 },
      { pair:"USD / JPY", price: rates.JPY || 0 },
      { pair:"USD / CAD", price: rates.CAD || 0 },
      { pair:"USD / AUD", price: rates.AUD || 0 },
      { pair:"USD / CHF", price: rates.CHF || 0 },
      { pair:"USD / CNY", price: rates.CNY || 0 },
      { pair:"USD / INR", price: rates.INR || 0 },
      { pair:"USD / AED", price: rates.AED || 0 },
      { pair:"USD / ZAR", price: rates.ZAR || 0 },
      { pair:"USD / KES", price: rates.KES || 0 },
      { pair:"USD / GHS", price: rates.GHS || 0 },
    ];
  } catch(e){}
  // Gold - Binance first, CoinGecko second, GoldPrice third
  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT", { next:{ revalidate: 20 } });
    const j = await r.json(); trading.gold = Number(j.price) || 0;
  } catch(e){}
  if(!trading.gold){
    try {
      const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd", { next:{ revalidate: 20 } });
      const j = await r.json(); trading.gold = j["pax-gold"]?.usd || 0;
    } catch(e){}
  }
  if(!trading.gold){
    try {
      const r = await fetch("https://data-asg.goldprice.org/db/XAUUSD.json", { next:{ revalidate: 60 } });
      const j = await r.json(); trading.gold = j.items?.[0]?.curr || 0;
    } catch(e){}
  }

  let viral = [];
  const parseReddit = (j) => {
    return (j.data?.children||[]).map(c=>{
      const d = c.data;
      let video = "";
      if(d.secure_media?.reddit_video?.fallback_url) video = d.secure_media.reddit_video.fallback_url;
      else if(d.media?.reddit_video?.fallback_url) video = d.media.reddit_video.fallback_url;
      else if(d.preview?.reddit_video?.fallback_url) video = d.preview.reddit_video.fallback_url;
      else if(d.crosspost_parent_list?.[0]?.secure_media?.reddit_video?.fallback_url) video = d.crosspost_parent_list[0].secure_media.reddit_video.fallback_url;
      else if(d.crosspost_parent_list?.[0]?.media?.reddit_video?.fallback_url) video = d.crosspost_parent_list[0].media.reddit_video.fallback_url;
      else if(d.url && d.url.includes("v.redd.it")) video = d.url + "/DASH_720.mp4";
      let thumb = d.thumbnail && d.thumbnail.startsWith("http") ? d.thumbnail : "";
      if(d.preview?.images?.[0]?.source?.url) thumb = d.preview.images[0].source.url.replace(/&amp;/g,"&");
      if(!thumb && d.crosspost_parent_list?.[0]?.preview?.images?.[0]?.source?.url) thumb = d.crosspost_parent_list[0].preview.images[0].source.url.replace(/&amp;/g,"&");
      return { title:d.title, link:"https://reddit.com"+d.permalink, score:d.score, video, thumb, isVideo: !!video };
    });
  };
  try {
    const res = await fetch("https://www.reddit.com/r/funny+Unexpected+MadeMeSmile+NextFuckingLevel+PublicFreakout+videos+TikTokCringe+ContagiousLaughter/top.json?limit=30&t=day&raw_json=1", { headers:{ "User-Agent":"EVA/1.0" }, next:{ revalidate: 120 } });
    const j = await res.json();
    viral = parseReddit(j);
  } catch(e){}
  if(viral.length===0){
    try {
      const res = await fetch("https://www.reddit.com/r/popular/top.json?limit=20&t=day&raw_json=1", { headers:{ "User-Agent":"EVA/1.0" }, next:{ revalidate: 120 } });
      const j = await res.json();
      viral = parseReddit(j);
    } catch(e){}
  }
  if(viral.length>0){
    viral = [...viral.filter(v=> v.isVideo), ...viral.filter(v=> !v.isVideo)].slice(0,18);
  } else {
    // Fallback so Viral box is never empty
    viral = [
      { title:"Viral videos are syncing. Tap to retry in a moment.", link:"https://www.reddit.com/r/funny/top/", score: 1240, video:"", thumb:"", isVideo:false },
      { title:"Funny moments from around the world", link:"https://www.reddit.com/r/funny/top/", score: 980, video:"", thumb:"", isVideo:false },
    ];
  }

  return Response.json({ date: today, news, scores, crypto, viral, trading });
         }
