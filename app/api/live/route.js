export async function GET() {
  const today = new Date().toISOString().slice(0,10);
  const isToday = (d) => { if(!d) return true; return new Date(d).toISOString().slice(0,10) === today; };

  const RSS = [
    { src:"BBC", url:"https://feeds.bbci.co.uk/news/rss.xml" },
    { src:"Daily Mail", url:"https://www.dailymail.co.uk/news/index.rss" },
    { src:"Punch NG", url:"https://punchng.com/feed/" },
    { src:"Vanguard NG", url:"https://www.vanguardngr.com/feed/" },
    { src:"Sahara Reporters", url:"https://saharareporters.com/rss.xml" },
    { src:"CNN", url:"http://rss.cnn.com/rss/edition.rss" },
  ];

  let news = [];
  for (let r of RSS) {
    try {
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(r.url)}`, { next:{ revalidate: 60 } });
      const j = await res.json();
      (j.items||[]).forEach(it=>{
        if(!isToday(it.pubDate)) return;
        const raw = (it.content || it.description || "").replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").trim();
        news.push({ source:r.src, title:it.title, link:it.link, time:it.pubDate, img:it.thumbnail||it.enclosure?.link||"", desc: raw.slice(0,1200), full: raw.slice(0,2500) });
      });
    } catch(e){}
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
  for (let lg of leagues) {
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg.id}/scoreboard?dates=${today.replaceAll("-","")}`, { next:{ revalidate: 30 } });
      const j = await res.json();
      (j.events||[]).forEach(ev=>{
        const c = ev.competitions?.[0];
        const home = c?.competitors?.find(x=>x.homeAway==="home");
        const away = c?.competitors?.find(x=>x.homeAway==="away");
        scores.push({ league:lg.name, home:home?.team?.displayName, away:away?.team?.displayName, homeScore:home?.score ?? "-", awayScore:away?.score ?? "-", status:c?.status?.type?.shortDetail||"Today", live:c?.status?.type?.state==="in", link:ev.links?.[0]?.href||"" });
      });
    } catch(e){}
  }
  if(scores.length===0){
    try{
      const d = new Date(); d.setDate(d.getDate()-1); const y = d.toISOString().slice(0,10).replaceAll("-","");
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=${y}`, { next:{ revalidate: 30 } });
      const j = await res.json();
      (j.events||[]).slice(0,6).forEach(ev=>{
        const c = ev.competitions?.[0];
        const home = c?.competitors?.find(x=>x.homeAway==="home");
        const away = c?.competitors?.find(x=>x.homeAway==="away");
        scores.push({ league:"EPL • Yesterday", home:home?.team?.displayName, away:away?.team?.displayName, homeScore:home?.score ?? "-", awayScore:away?.score ?? "-", status:"FT", live:false });
      });
    }catch(e){}
  }

  let crypto = { price: null, change: 0 };
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true", { next:{ revalidate: 20 } });
    const j = await res.json(); crypto = { price: j.bitcoin?.usd, change: j.bitcoin?.usd_24h_change };
  } catch(e){}

  // TRADING - EDITED: real sparkline for live chart, no SIGNAL text, Gold via Binance
  let trading = { cryptoList:[], forex:[], gold:0 };
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,dogecoin,tether,binancecoin&order=market_cap_desc&per_page=6&page=1&sparkline=true&price_change_percentage=24h", { next:{ revalidate: 20 } });
    const j = await r.json();
    trading.cryptoList = (Array.isArray(j) ? j : []).map(c=> ({
      name:c.symbol.toUpperCase(),
      full:c.name,
      price:c.current_price,
      change:c.price_change_percentage_24h,
      spark: c.sparkline_in_7d?.price?.slice(-40) || []
    }));
    if(trading.cryptoList.length>0){
      const btc = trading.cryptoList.find(c=> c.name==="BTC");
      if(btc) crypto = { price: btc.price, change: btc.change };
    }
  } catch(e){}
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD", { next:{ revalidate: 60 } });
    const j = await r.json();
    const rates = j.rates || {};
    trading.forex = [
      { pair:"USD / NGN", price: rates.NGN || 0 },
      { pair:"EUR / USD", price: rates.EUR ? 1/rates.EUR : 0 },
      { pair:"GBP / USD", price: rates.GBP ? 1/rates.GBP : 0 },
      { pair:"USD / JPY", price: rates.JPY || 0 },
    ];
  } catch(e){}
  // Gold via Binance PAXG - real live, no fail
  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT", { next:{ revalidate: 20 } });
    const j = await r.json(); trading.gold = Number(j.price) || 0;
  } catch(e){}
  // Fallback for Gold if Binance fails
  if(!trading.gold){
    try {
      const r = await fetch("https://data-asg.goldprice.org/db/XAUUSD.json", { next:{ revalidate: 60 } });
      const j = await r.json(); trading.gold = j.items?.[0]?.curr || 0;
    } catch(e){}
  }

  let viral = [];
  try {
    const res = await fetch("https://www.reddit.com/r/funny+Unexpected+MadeMeSmile+NextFuckingLevel+PublicFreakout+videos+TikTokCringe+ContagiousLaughter/top.json?limit=30&t=day&raw_json=1", { headers:{ "User-Agent":"EVA/1.0" }, next:{ revalidate: 120 } });
    const j = await res.json();
    viral = (j.data?.children||[]).map(c=>{
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
    viral = [...viral.filter(v=> v.isVideo), ...viral.filter(v=> !v.isVideo)].slice(0,18);
  } catch(e){}

  return Response.json({ date: today, news, scores, crypto, viral, trading });
       }
