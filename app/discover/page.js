"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Discover() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [playingMovie, setPlayingMovie] = useState(null);
  const [myWatchlist, setMyWatchlist] = useState([]);
  const [uploadedMovies, setUploadedMovies] = useState([]);
  const [topTab, setTopTab] = useState("home");
  const [watchTab, setWatchTab] = useState("saved");
  const [hi, setHi] = useState(0);
  const [expandedCat, setExpandedCat] = useState(null);
  const touchX = useRef(0);

  const [showDetail, setShowDetail] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  // ===== NEW UPLOAD - 5 OPTIONS + UPLOAD BUTTON =====
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTarget, setUploadTarget] = useState("Trending");
  const [upTitle, setUpTitle] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upPosterFile, setUpPosterFile] = useState(null);
  const [upTrailerFile, setUpTrailerFile] = useState(null);
  const [upMovieFile, setUpMovieFile] = useState(null);
  const [upPosterPreview, setUpPosterPreview] = useState("");

  const CATS = ["Nollywood","Hollywood","Comedy","Action","Horror","Romance","Drama","Thriller","Animation","Family","Crime","Documentary"];

  const [heroList, setHeroList] = useState([
    { t: "LAGOS HEIST", d: "A rogue detective and undercover agent must pull off the city's boldest heist before dawn strikes. Loyalty. Cash. Chaos.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
    { t: "OYO CODE", d: "A hacker and a police officer must crack the code before the city shuts down. One code. One night.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
    { t: "MOTHERLAND", d: "She left Lagos for London. Now she must return home to save her family. Home is calling.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
    { t: "WARRI BLOODLINE", d: "Two brothers. One throne. Warri will never be the same again.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
  ]);

  useEffect(() => {
    const id = setInterval(() => setHi((p) => (p + 1) % heroList.length), 4000);
    return () => clearInterval(id);
  }, [heroList.length]);

  useEffect(() => {
    if (showDetail) {
      try { history.pushState({ detail: true }, ''); } catch {}
    }
    const onPop = () => { setShowDetail(null); setShowTrailer(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showDetail]);

  const baseMovies = [
    { id: 1, title: "Test Movie - Big Buck", cat: "Animation • Family", year: "2024", dur: "10 mins", desc: "This na test movie to check if Play dey work.", video: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", img: "", section: "Trending", trailer: null },
    { id: 2, title: "Test Movie 2 - Flower", cat: "Nature • Short", year: "2024", dur: "10 secs", desc: "Second test movie - very fast, small file.", video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", img: "", section: "Trending", trailer: null },
  ];

  const allMovies = [...uploadedMovies, ...baseMovies];
  const trendingMovies = [...uploadedMovies.filter((m) => m.section === "Trending"), ...baseMovies];
  const getCatMovies = (c) => uploadedMovies.filter((m) => m.section === c);
  const filtered = allMovies.filter((m) => (m.title + " " + m.cat).toLowerCase().includes(search.toLowerCase()));
  const isSearching = showSearch && search.trim() !== "";
  const featured = allMovies[0];
  const savedList = allMovies.filter((m) => myWatchlist.includes(m.id));

  const toggleWatchlist = (id) => {
    if (myWatchlist.includes(id)) setMyWatchlist(myWatchlist.filter((x) => x !== id));
    else setMyWatchlist([...myWatchlist, id]);
  };

  const makeHero = (m) => {
    setHeroList((prev) => [{ t: m.title, d: m.desc || m.title, img: m.img || "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80", video: m.video }, ...prev].slice(0, 6));
  };

  // ===== NEW UPLOAD LOGIC =====
  const openUploadFor = (section) => {
    setUploadTarget(section);
    setUpTitle("");
    setUpDesc("");
    setUpPosterFile(null);
    setUpTrailerFile(null);
    setUpMovieFile(null);
    setUpPosterPreview("");
    setShowUpload(true);
  };

  const closeUpload = () => {
    setShowUpload(false);
    setUpTitle("");
    setUpDesc("");
    setUpPosterFile(null);
    setUpTrailerFile(null);
    setUpMovieFile(null);
    setUpPosterPreview("");
  };

  const canUpload = upTitle.trim() !== "" && upMovieFile !== null;

  const doUpload = () => {
    if (!canUpload) return;
    const videoURL = URL.createObjectURL(upMovieFile);
    const trailerURL = upTrailerFile ? URL.createObjectURL(upTrailerFile) : null;
    const posterURL = upPosterFile ? URL.createObjectURL(upPosterFile) : "";

    const finishSave = (finalPoster) => {
      const newMovie = {
        id: Date.now(),
        title: upTitle.trim(),
        cat: "My Upload • " + uploadTarget,
        year: "2026",
        dur: "Your Video",
        desc: upDesc.trim() || "Uploaded to " + uploadTarget,
        video: videoURL,
        trailer: trailerURL,
        img: finalPoster || "",
        section: uploadTarget
      };
      setUploadedMovies((prev) => [newMovie, ...prev]);
      closeUpload();
    };

    if (posterURL) {
      finishSave(posterURL);
      return;
    }
    // No poster - auto-make cover from movie, no popup
    try {
      const vid = document.createElement("video");
      vid.src = videoURL; vid.muted = true; vid.playsInline = true; vid.currentTime = 1;
      vid.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = vid.videoWidth || 300; canvas.height = vid.videoHeight || 450;
          const ctx = canvas.getContext("2d"); ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          finishSave(canvas.toDataURL("image/jpeg", 0.7));
        } catch { finishSave(""); }
      };
      vid.onerror = () => finishSave("");
      setTimeout(() => finishSave(""), 2000);
    } catch { finishSave(""); }
  };

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -50) setHi((p) => (p + 1) % heroList.length);
    if (dx > 50) setHi((p) => (p - 1 + heroList.length) % heroList.length);
  };

  const EmptySlot = ({ section }) => (
    <div onClick={() => openUploadFor(section)} style={{ minWidth: 110, height: 165, background: "#141414", border: "1px dashed #2a2a2a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ width: 42, height: 42, background: "#22c55e", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "white" }}>+</div>
    </div>
  );

  const MoreSlot = ({ section }) => (
    <div onClick={() => setExpandedCat(section)} style={{ minWidth: 110, height: 165, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>→</div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>More</div>
    </div>
  );

  const MovieCard = ({ m }) => (
    <div onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ minWidth: 110, height: 165, background: "#1a1a1a", borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer", flexShrink: 0 }}>
      {m.img ? <img src={m.img} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}><span style={{ fontSize: 28 }}>🎬</span><span style={{ fontSize: 11, padding: "0 8px", textAlign: "center" }}>{m.title}</span></div>}
      {m.img && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.9))", padding: "20px 8px 8px" }}><div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{m.title}</div><div style={{ fontSize: 10, color: "#22c55e" }}>▶ Details</div></div>}
    </div>
  );

  const CatRow = ({ cat }) => {
    const list = getCatMovies(cat);
    const slotsNeeded = Math.max(0, 9 - list.length);
    return (
      <div>
        <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>{cat} Picks</h3>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
          {list.slice(0, 9).map((m) => <MovieCard key={m.id} m={m} />)}
          {Array.from({ length: slotsNeeded }).map((_, i) => <EmptySlot key={i} section={cat} />)}
          <MoreSlot section={cat} />
        </div>
      </div>
    );
  };

  // ===== UPLOAD WINDOW - ALL 6 OPTIONS TOGETHER =====
  const UploadModal = () => {
    if (!showUpload) return null;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "#1a1a1a", width: "100%", maxWidth: 480, borderRadius: 16, padding: 16, maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 18 }}>Upload to {uploadTarget}</b>
            <button onClick={closeUpload} style={{ background: "#000", border: "none", color: "#fff", borderRadius: 999, width: 32, height: 32 }}>X</button>
          </div>

          <div style={{ marginTop: 14, fontSize: 13, color: "#aaa" }}>1. Title *</div>
          <input value={upTitle} onChange={(e) => setUpTitle(e.target.value)} placeholder="e.g. Game" style={{ width: "100%", boxSizing: "border-box", marginTop: 6, background: "#222", border: "1px solid #333", color: "#fff", padding: 12, borderRadius: 10, outline: "none" }} />

          <div style={{ marginTop: 12, fontSize: 13, color: "#aaa" }}>2. Description</div>
          <textarea value={upDesc} onChange={(e) => setUpDesc(e.target.value)} placeholder="Wetin this movie talk about..." rows={3} style={{ width: "100%", boxSizing: "border-box", marginTop: 6, background: "#222", border: "1px solid #333", color: "#fff", padding: 12, borderRadius: 10, outline: "none" }} />

          <div style={{ marginTop: 12, fontSize: 13, color: "#aaa" }}>3. Poster</div>
          <label style={{ display: "block", marginTop: 6, background: upPosterFile ? "#22D464" : "#222", color: upPosterFile ? "#000" : "#fff", textAlign: "center", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
            {upPosterFile ? "✓ Poster Picked - " + upPosterFile.name : "+ Pick Poster"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { setUpPosterFile(f); setUpPosterPreview(URL.createObjectURL(f)); } }} />
          </label>
          {upPosterPreview && <img src={upPosterPreview} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, marginTop: 8 }} />}

          <div style={{ marginTop: 12, fontSize: 13, color: "#aaa" }}>4. Trailer</div>
          <label style={{ display: "block", marginTop: 6, background: upTrailerFile ? "#22D464" : "#222", color: upTrailerFile ? "#000" : "#fff", textAlign: "center", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
            {upTrailerFile ? "✓ Trailer Picked - " + upTrailerFile.name : "+ Pick Trailer"}
            <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) setUpTrailerFile(f); }} />
          </label>

          <div style={{ marginTop: 12, fontSize: 13, color: "#aaa" }}>5. Movie *</div>
          <label style={{ display: "block", marginTop: 6, background: upMovieFile ? "#22D464" : "#222", color: upMovieFile ? "#000" : "#fff", textAlign: "center", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
            {upMovieFile ? "✓ Movie Picked - " + upMovieFile.name : "+ Pick Movie"}
            <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) setUpMovieFile(f); }} />
          </label>

          <button onClick={doUpload} disabled={!canUpload} style={{ width: "100%", marginTop: 16, background: canUpload ? "#22D464" : "#333", color: canUpload ? "#000" : "#888", border: "none", padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 15 }}>
            {canUpload ? "✅ Upload Movie" : "Fill Title + Movie to Upload"}
          </button>
          <div style={{ textAlign: "center", fontSize: 11, color: "#888", marginTop: 8 }}>Title + Movie na must. Poster, Trailer, Description fit empty.</div>
        </div>
      </div>
    );
  };
  if (expandedCat) {
    const list = getCatMovies(expandedCat);
    return (
      <div style={{ background: "black", color: "white", minHeight: "100vh", paddingBottom: 120, fontFamily: "system-ui" }}>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setExpandedCat(null)} style={{ background: "#222", border: "none", color: "white", borderRadius: 999, width: 36, height: 36 }}>←</button>
          <h2 style={{ margin: 0, fontSize: 20 }}>{expandedCat} — All Movies</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 16px" }}>
          {list.map((m) => <div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ height: 165, borderRadius: 12, overflow: "hidden", background: m.img ? `url(${m.img}) center/cover` : "#222", display: "flex", alignItems: "flex-end", padding: 8 }}><b style={{ fontSize: 11 }}>{m.title}</b></div>)}
          {Array.from({ length: 9 }).map((_, i) => <div key={"e"+i} onClick={() => openUploadFor(expandedCat)} style={{ height: 165, borderRadius: 12, background: "#141414", border: "1px dashed #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 42, height: 42, background: "#22c55e", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900 }}>+</div></div>)}
        </div>

        <UploadModal />

        {showDetail && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: "#1a1a1a", width: "100%", maxWidth: 480, borderRadius: 14, overflow: "hidden", position: "relative" }}>
              <button onClick={() => { setShowDetail(null); setShowTrailer(false); if(history.state && history.state.detail) history.back(); }} style={{ position: "absolute", top: 10, right: 12, background: "#000", border: "none", color: "#fff", borderRadius: 999, width: 32, height: 32, zIndex: 2, fontSize: 16 }}>X</button>
              <div style={{ position: "relative", background: "#000" }}>
                {showTrailer && showDetail.trailer ? (
                  <video src={showDetail.trailer} controls autoPlay playsInline style={{ width: "100%", height: 270, objectFit: "cover" }} />
                ) : (
                  <>
                    {showDetail.img ? <img src={showDetail.img} style={{ width: "100%", height: 270, objectFit: "cover" }} /> : <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🎬</div>}
                    {showDetail.trailer && (
                      <div onClick={() => setShowTrailer(true)} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 999, background: "rgba(0,0,0,.6)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, cursor: "pointer" }}>▶️</div>
                    )}
                  </>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <h2 style={{ margin: "0 0 6px" }}>{showDetail.title}</h2>
                <p style={{ fontSize: 13, color: "#ccc", margin: "0 0 8px" }}>{showDetail.desc}</p>
                <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 12px" }}>{showDetail.cat} • {showDetail.year} • {showDetail.dur}</p>
                <button onClick={() => { setPlayingMovie(showDetail); setShowDetail(null); }} style={{ width: "100%", background: "#22D464", border: "none", padding: 13, borderRadius: 8, fontWeight: 800, fontSize: 15 }}>▶ Play Movie</button>
                <p style={{ fontSize: 11, color: "#888", marginTop: 8, textAlign: "center" }}>Center ▶️ = Trailer (if e get) • Down Play = Full Movie</p>
              </div>
            </div>
          </div>
        )}

        {playingMovie && (
          <div style={{ position: "fixed", inset: 0, background: "black", zIndex: 300, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px" }}><b>{playingMovie.title}</b><button onClick={() => setPlayingMovie(null)} style={{ background: "#222", border: "none", color: "white", borderRadius: 999, width: 36, height: 36 }}>✕</button></div>
            <video src={playingMovie.video} controls autoPlay playsInline style={{ width: "100%", flex: 1, background: "black" }} />
            <div style={{ padding: 16 }}><div style={{ fontWeight: 800 }}>{playingMovie.title}</div><div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{playingMovie.cat}</div><button onClick={() => makeHero(playingMovie)} style={{ marginTop: 12, background: "#22D464", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 800 }}>★ Make am Big Box (Only You)</button></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "black", color: "white", minHeight: "100vh", paddingBottom: 120, fontFamily: "system-ui", overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px", position: "sticky", top: 0, background: "black", zIndex: 10 }}>
        <h1 style={{ color: "#22c55e", fontSize: 38, fontWeight: 900, margin: 0, letterSpacing: -2, whiteSpace: "nowrap" }}>✦ EVA <span style={{ fontSize: 14, color: "#A8FFC6", verticalAlign: "top" }}>✦</span></h1>
        <button onClick={() => setShowSearch(!showSearch)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "white", borderRadius: 999, width: 38, height: 38, fontSize: 16 }}>🔍</button>
      </div>
      <div style={{ margin: "6px 16px 12px", background: "#2A2A2A", borderRadius: 10, padding: 4, display: "flex", gap: 4 }}>
        <button onClick={() => setTopTab("home")} style={{ flex: 0.8, border: 0, background: "transparent", color: topTab === "home" ? "#fff" : "#B8B8B8", padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, boxShadow: topTab === "home" ? "inset 0 -3px 0 #22D464" : "none" }}>Home</button>
        <button onClick={() => setTopTab("movies")} style={{ flex: 0.8, border: 0, background: "transparent", color: topTab === "movies" ? "#fff" : "#B8B8B8", padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, boxShadow: topTab === "movies" ? "inset 0 -3px 0 #22D464" : "none" }}>Movies</button>
        <button onClick={() => setTopTab("watchlist")} style={{ flex: 1.5, border: 0, background: "transparent", color: topTab === "watchlist" ? "#fff" : "#B8B8B8", padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", boxShadow: topTab === "watchlist" ? "inset 0 -3px 0 #22D464" : "none" }}>My Watchlist ({myWatchlist.length})</button>
      </div>
      {showSearch && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ display: "flex", gap: 8, background: "#1a1a1a", border: "1px solid #333", borderRadius: 999, padding: "8px 12px", alignItems: "center" }}>
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies..." autoFocus style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 14 }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#888" }}>✕</button>}
          </div>
        </div>
      )}
      {isSearching ? (
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: 12 }}>Results for “{search}” — {filtered.length} found</div>
          {filtered.map((m) => (
            <div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ display: "flex", gap: 12, background: "#111", borderRadius: 12, padding: 10, marginBottom: 10 }}>
              {m.img ? <img src={m.img} style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: 70, height: 100, background: "#222", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
              <div><div style={{ fontWeight: 800 }}>{m.title}</div><div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{m.cat} • {m.dur}</div><div style={{ fontSize: 12, color: "#22c55e", marginTop: 6 }}>▶ Tap for Details</div></div>
            </div>
          ))}
        </div>
      ) : topTab === "watchlist" ? (
        <div style={{ padding: "10px 16px" }}>
          <h1 style={{ fontSize: 26, margin: 0 }}>My Watchlist</h1><p style={{ color: "#999", fontSize: 13 }}>One place — Saved + Downloaded inside Eva only</p>
          <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
            <button onClick={() => setWatchTab("saved")} style={{ flex: 1, padding: 11, borderRadius: 20, border: "1px solid #333", background: watchTab === "saved" ? "#22D464" : "#1A1A1A", color: watchTab === "saved" ? "#000" : "#fff", fontWeight: 700, fontSize: 12 }}>Saved ({savedList.length})</button>
            <button onClick={() => setWatchTab("down")} style={{ flex: 1, padding: 11, borderRadius: 20, border: "1px solid #333", background: watchTab === "down" ? "#22D464" : "#1A1A1A", color: watchTab === "down" ? "#000" : "#fff", fontWeight: 700, fontSize: 12 }}>Downloaded • Offline</button>
          </div>
          {watchTab === "saved" ? (savedList.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#888" }}>No saved yet.<br />Tap + Watchlist on any movie.</div> : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{savedList.map((m) => (<div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ height: 170, borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: m.img ? `url(${m.img}) center/cover` : "#222" }}><b style={{ fontSize: 13 }}>{m.title}</b><span style={{ fontSize: 11, color: "#CCC" }}>{m.cat}</span></div>))}</div>) : (<div style={{ textAlign: "center", padding: 30, color: "#888" }}>Downloaded go show here.<br />For now, Saved movies na the one we get.</div>)}
        </div>
      ) : topTab === "movies" ? (
        <div style={{ padding: "10px 16px" }}>
          <h2 style={{ margin: "6px 0 12px" }}>All Movies — Single List</h2>
          {allMovies.map((m) => (
            <div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ display: "flex", gap: 12, background: "#111", borderRadius: 12, padding: 10, marginBottom: 10 }}>
              {m.img ? <img src={m.img} style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: 70, height: 100, background: "#222", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
              <div><div style={{ fontWeight: 800 }}>{m.title}</div><div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{m.cat} • {m.dur}</div><div style={{ fontSize: 12, color: "#22c55e", marginTop: 6 }}>▶ Tap for Details</div></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ margin: "4px 12px 0", borderRadius: 16, overflow: "hidden", background: "#111" }}>
            <div style={{ height: 280, background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,.85) 78%, #0B0B0B 100%), url('${heroList[hi].img}') center/cover`, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 12px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 0.95, wordBreak: "break-word" }}>{heroList[hi].t}</div>
                <div style={{ fontSize: 11, lineHeight: 1.4, color: "#E6E6E6", margin: "8px 6px 12px" }}>{heroList[hi].d}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => heroList[hi].video && setPlayingMovie({ title: heroList[hi].t, cat: "Hero", dur: "", desc: heroList[hi].d, video: heroList[hi].video, img: heroList[hi].img })} style={{ flex: 1.1, background: "#22D464", border: "none", color: "black", padding: "13px 6px", borderRadius: 8, fontWeight: 800, fontSize: 15 }}>▶ Play</button>
                  <button onClick={() => featured && toggleWatchlist(featured.id)} style={{ flex: 1.4, background: "transparent", border: "1.5px solid white", color: "white", padding: "11px 6px", borderRadius: 8, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}> <span>{featured && myWatchlist.includes(featured.id) ? "✓ Watchlist" : "+ Watchlist"}</span><span>⬇</span></button>
                </div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 6 }}>← Swipe to change →</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "10px 0 8px" }}>{heroList.map((_, i) => <span key={i} onClick={() => setHi(i)} style={{ width: i === hi ? 7 : 6, height: i === hi ? 7 : 6, borderRadius: 50, background: i === hi ? "#22D464" : "#555", cursor: "pointer" }} />)}</div>
          </div>
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Trending Now in Nigeria</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
            {trendingMovies.map((m) => <MovieCard key={m.id} m={m} />)}
            <EmptySlot section="Trending" />
            <MoreSlot section="Trending" />
          </div>
          {CATS.map((c) => <CatRow key={c} cat={c} />)}
        </>
      )}

      <UploadModal />

      {showDetail && !expandedCat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#1a1a1a", width: "100%", maxWidth: 480, borderRadius: 14, overflow: "hidden", position: "relative" }}>
            <button onClick={() => { setShowDetail(null); setShowTrailer(false); if(history.state && history.state.detail) history.back(); }} style={{ position: "absolute", top: 10, right: 12, background: "#000", border: "none", color: "#fff", borderRadius: 999, width: 32, height: 32, zIndex: 2, fontSize: 16 }}>X</button>
            <div style={{ position: "relative", background: "#000" }}>
              {showTrailer && showDetail.trailer ? (
                <video src={showDetail.trailer} controls autoPlay playsInline style={{ width: "100%", height: 270, objectFit: "cover" }} />
              ) : (
                <>
                  {showDetail.img ? <img src={showDetail.img} style={{ width: "100%", height: 270, objectFit: "cover" }} /> : <div style={{ height: 270, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🎬</div>}
                  {showDetail.trailer && (
                    <div onClick={() => setShowTrailer(true)} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 999, background: "rgba(0,0,0,.6)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, cursor: "pointer" }}>▶️</div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{showDetail.title}</div>
              <div style={{ fontSize: 13, color: "#ccc", marginTop: 6 }}>{showDetail.desc}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>{showDetail.cat} • {showDetail.year} • {showDetail.dur}</div>
              <button onClick={() => { setPlayingMovie(showDetail); setShowDetail(null); }} style={{ width: "100%", marginTop: 12, background: "#22D464", border: "none", padding: 13, borderRadius: 8, fontWeight: 800, fontSize: 15 }}>▶ Play Movie</button>
              <button onClick={() => toggleWatchlist(showDetail.id)} style={{ width: "100%", marginTop: 8, background: "transparent", border: "1px solid white", color: "white", padding: 10, borderRadius: 8, fontWeight: 700 }}>{myWatchlist.includes(showDetail.id) ? "✓ In Watchlist" : "+ Watchlist"}</button>
            </div>
          </div>
        </div>
      )}

      {playingMovie && (
        <div style={{ position: "fixed", inset: 0, background: "black", zIndex: 100, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            <b>{playingMovie.title}</b>
            <button onClick={() => setPlayingMovie(null)} style={{ background: "#222", border: "none", color: "white", borderRadius: 999, width: 36, height: 36, fontSize: 18 }}>✕</button>
          </div>
          <video src={playingMovie.video} controls autoPlay playsInline preload="auto" style={{ width: "100%", flex: 1, background: "black", objectFit: "contain" }} />
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800 }}>{playingMovie.title}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{playingMovie.cat} • {playingMovie.dur}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{playingMovie.desc}</div>
            <button onClick={() => toggleWatchlist(playingMovie.id)} style={{ marginTop: 12, background: myWatchlist.includes(playingMovie.id) ? "#22D464" : "transparent", border: "1px solid white", color: "white", padding: "10px 16px", borderRadius: 8, fontWeight: 700, marginRight: 8 }}>{myWatchlist.includes(playingMovie.id) ? "✓ In Watchlist" : "+ Watchlist"}</button>
            <button onClick={() => makeHero(playingMovie)} style={{ marginTop: 12, background: "#22D464", border: "none", color: "black", padding: "10px 16px", borderRadius: 8, fontWeight: 800 }}>★ Make am Big Box (Only You)</button>
          </div>
        </div>
      )}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "black", borderTop: "1px solid #222", display: "flex", justifyContent: "space-around", padding: "10px 0 14px", alignItems: "center", zIndex: 20 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#22c55e", fontSize: 12 }}>🏠<br />Home</button>
        <button style={{ background: "none", border: "none", color: "white", fontSize: 12 }}>✨<br />Discover</button>
        <button onClick={() => openUploadFor("Trending")} style={{ background: "#22c55e", border: "none", color: "white", width: 48, height: 48, borderRadius: 999, fontSize: 24, marginTop: -22 }}>+</button>
        <button style={{ background: "none", border: "none", color: "#888", fontSize: 12 }}>🎬<br />Short</button>
        <button style={{ background: "none", border: "none", color: "#888", fontSize: 12 }}>👤<br />Me</button>
      </div>
    </div>
  );
}
