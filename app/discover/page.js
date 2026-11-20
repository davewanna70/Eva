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
  const [uploadTarget, setUploadTarget] = useState("Trending");
  const [pendingVideo, setPendingVideo] = useState(null);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [watchTab, setWatchTab] = useState("saved");
  const [hi, setHi] = useState(0);
  const videoRef = useRef(null);
  const coverRef = useRef(null);

  const heroes = [
    { t: "LAGOS HEIST", d: "A rogue detective and undercover agent must pull off the city's boldest heist before dawn strikes. Loyalty. Cash. Chaos." },
    { t: "OYO CODE", d: "A hacker and a police officer must crack the code before the city shuts down. One code. One night." },
    { t: "MOTHERLAND", d: "She left Lagos for London. Now she must return home to save her family. Home is calling." },
    { t: "WARRI BLOODLINE", d: "Two brothers. One throne. Warri will never be the same again." },
  ];

  useEffect(() => {
    const id = setInterval(() => setHi((p) => (p + 1) % heroes.length), 4000);
    return () => clearInterval(id);
  }, []);

  const baseMovies = [
    { id: 1, title: "Test Movie - Big Buck", cat: "Animation • Family", year: "2024", dur: "10 mins", desc: "This na test movie to check if Play dey work.", video: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", img: "", section: "Trending" },
    { id: 2, title: "Test Movie 2 - Flower", cat: "Nature • Short", year: "2024", dur: "10 secs", desc: "Second test movie - very fast, small file.", video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", img: "", section: "Trending" },
  ];

  const trendingUploads = uploadedMovies.filter((m) => m.section === "Trending");
  const nollywoodUploads = uploadedMovies.filter((m) => m.section === "Nollywood");
  const hollywoodUploads = uploadedMovies.filter((m) => m.section === "Hollywood");
  const allMovies = [...uploadedMovies, ...baseMovies];
  const trendingMovies = [...trendingUploads, ...baseMovies];
  const nollywoodMovies = [...nollywoodUploads];
  const hollywoodMovies = [...hollywoodUploads];
  const filtered = allMovies.filter((m) => (m.title + " " + m.cat).toLowerCase().includes(search.toLowerCase()));
  const isSearching = showSearch && search.trim() !== "";
  const featured = allMovies[0];

  const toggleWatchlist = (id) => {
    if (myWatchlist.includes(id)) setMyWatchlist(myWatchlist.filter((x) => x !== id));
    else { setMyWatchlist([...myWatchlist, id]); alert("Added to My Watchlist ✅\nGo My Watchlist to see Saved + Downloaded"); }
  };

  const openUploadFor = (section) => { setUploadTarget(section); setTimeout(() => videoRef.current?.click(), 50); };
  const handleVideoPick = (e) => {
    const file = e.target.files[0]; if (!file) return; setPendingVideo(file); e.target.value = "";
    setTimeout(() => {
      if (confirm("✅ Video picked: " + file.name + "\n\nNow pick COVER PHOTO?\n\nOK = Pick Cover\nCancel = Eva go auto-make cover")) coverRef.current?.click();
      else makeAutoCoverAndSave(file, null);
    }, 100);
  };
  const handleCoverPick = (e) => {
    const coverFile = e.target.files[0]; e.target.value = ""; if (!pendingVideo) return;
    if (coverFile) saveMovie(pendingVideo, URL.createObjectURL(coverFile));
    else makeAutoCoverAndSave(pendingVideo, null);
    setPendingVideo(null);
  };
  const makeAutoCoverAndSave = (videoFile) => {
    const videoURL = URL.createObjectURL(videoFile);
    const vid = document.createElement("video"); vid.src = videoURL; vid.muted = true; vid.playsInline = true; vid.currentTime = 1;
    vid.onseeked = () => { try { const canvas = document.createElement("canvas"); canvas.width = vid.videoWidth || 300; canvas.height = vid.videoHeight || 450; const ctx = canvas.getContext("2d"); ctx.drawImage(vid, 0, 0, canvas.width, canvas.height); saveMovie(videoFile, canvas.toDataURL("image/jpeg", 0.7), videoURL); } catch { saveMovie(videoFile, "", videoURL); } };
    vid.onerror = () => saveMovie(videoFile, "", videoURL);
  };
  const saveMovie = (videoFile, coverURL, existingVideoURL = null) => {
    const videoURL = existingVideoURL || URL.createObjectURL(videoFile);
    let cleanName = videoFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    if (cleanName.length > 20) cleanName = cleanName.slice(0, 20) + "...";
    const newMovie = { id: Date.now(), title: cleanName, cat: "My Upload • 📱 • " + uploadTarget, year: "2026", dur: "Your Video", desc: "Uploaded to " + uploadTarget + ". File: " + videoFile.name, video: videoURL, img: coverURL || "", section: uploadTarget };
    setUploadedMovies((prev) => [newMovie, ...prev]);
    alert("✅ " + cleanName + " don enter " + uploadTarget + " with cover!");
  };

  const EmptySlot = ({ section }) => (
    <div onClick={() => openUploadFor(section)} style={{ minWidth: 110, height: 165, background: "#141414", border: "1px dashed #2a2a2a", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
      <div style={{ width: 38, height: 38, background: "#22c55e", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "white" }}>+</div>
      <span style={{ color: "#888", fontSize: 11, textAlign: "center", padding: "0 8px" }}>Tap to Upload<br />to {section}</span>
    </div>
  );

  const MovieCard = ({ m }) => (
    <div onClick={() => setPlayingMovie(m)} style={{ minWidth: 110, height: 165, background: "#1a1a1a", borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer", flexShrink: 0 }}>
      {m.img ? <img src={m.img} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}><span style={{ fontSize: 28 }}>🎬</span><span style={{ fontSize: 11, padding: "0 8px", textAlign: "center" }}>{m.title}</span></div>}
      {m.img && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.9))", padding: "20px 8px 8px" }}><div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{m.title}</div><div style={{ fontSize: 10, color: "#22c55e" }}>▶ Play</div></div>}
    </div>
  );
  // MY WATCHLIST PAGE - ONE BUTTON, TWO SECTIONS - FIXED NO CUT
  if (showWatchlist) {
    const savedList = allMovies.filter((m) => myWatchlist.includes(m.id));
    return (
      <div style={{ background: "#0B0B0B", color: "#fff", minHeight: "100vh", paddingBottom: 120, overflowX: "hidden", fontFamily: "system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px" }}>
          <div style={{ fontSize: 38, fontWeight: 900, color: "#22D464", letterSpacing: -2, lineHeight: 1, whiteSpace: "nowrap" }}>✦ EVA <span style={{ fontSize: 14, color: "#A8FFC6", verticalAlign: "top" }}>✦</span></div>
          <div style={{ fontSize: 26 }}>⌕</div>
        </div>
        <div style={{ padding: "10px 16px" }}><h1 style={{ fontSize: 26, margin: 0 }}>My Watchlist</h1><p style={{ color: "#999", fontSize: 13, marginTop: 4 }}>One place — Saved + Downloaded inside Eva only</p></div>
        <div style={{ display: "flex", gap: 8, margin: "14px 16px" }}>
          <button onClick={() => setWatchTab("saved")} style={{ flex: 1, minWidth: 0, padding: "11px 4px", borderRadius: 20, border: "1px solid #333", background: watchTab === "saved" ? "#22D464" : "#1A1A1A", color: watchTab === "saved" ? "#000" : "#fff", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>Saved ({savedList.length})</button>
          <button onClick={() => setWatchTab("down")} style={{ flex: 1, minWidth: 0, padding: "11px 4px", borderRadius: 20, border: "1px solid #333", background: watchTab === "down" ? "#22D464" : "#1A1A1A", color: watchTab === "down" ? "#000" : "#fff", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>Downloaded • Offline</button>
        </div>
        {watchTab === "saved" ? (
          savedList.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#888" }}>No saved yet.<br />Tap + My Watchlist on any movie.</div> :
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 16px" }}>{savedList.map((m) => (<div key={m.id} onClick={() => setPlayingMovie(m)} style={{ height: 170, borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: m.img ? `url(${m.img}) center/cover` : "#222" }}><b style={{ fontSize: 13 }}>{m.title}</b><span style={{ fontSize: 11, color: "#CCC" }}>{m.cat}</span></div>))}</div>
        ) : (
          <div style={{ textAlign: "center", padding: 30, color: "#888" }}>Downloaded go show here.<br />For now, Saved movies na the one we get.<br />Download (inside Eva only) na next step.</div>
        )}
        <div style={{ textAlign: "center", margin: 16 }}><button onClick={() => setShowWatchlist(false)} style={{ background: "#22D464", border: 0, padding: "11px 22px", borderRadius: 20, fontWeight: 800 }}>← Back to Discover</button></div>
        <div style={{ position: "fixed", left: 10, right: 10, bottom: 10, background: "#1F1F1F", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 6px 8px", zIndex: 30 }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#999", fontSize: 12 }}>🏠<br />Home</button>
          <button style={{ background: "none", border: "none", color: "#22D464", fontSize: 12 }}>◎<br />Discover</button>
          <button onClick={() => openUploadFor("Trending")} style={{ background: "#22D464", border: "none", color: "white", width: 58, height: 58, borderRadius: 999, fontSize: 34, marginTop: -34, border: "4px solid #0B0B0B" }}>+</button>
          <button style={{ background: "none", border: "none", color: "#999", fontSize: 12 }}>♾<br />Short</button>
          <button style={{ background: "none", border: "none", color: "#999", fontSize: 12 }}>◯<br />Me</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "black", color: "white", minHeight: "100vh", paddingBottom: 120, fontFamily: "system-ui", overflowX: "hidden" }}>
      <input type="file" accept="video/*" ref={videoRef} onChange={handleVideoPick} style={{ display: "none" }} />
      <input type="file" accept="image/*" ref={coverRef} onChange={handleCoverPick} style={{ display: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px", position: "sticky", top: 0, background: "black", zIndex: 10 }}>
        <h1 style={{ color: "#22c55e", fontSize: 38, fontWeight: 900, margin: 0, letterSpacing: -2, whiteSpace: "nowrap" }}>✦ EVA <span style={{ fontSize: 14, color: "#A8FFC6", verticalAlign: "top" }}>✦</span></h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => openUploadFor("Trending")} style={{ background: "#22c55e", border: "none", color: "white", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: "bold" }}>+ Upload</button>
          <button onClick={() => setShowSearch(!showSearch)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "white", borderRadius: 999, width: 38, height: 38, fontSize: 16 }}>🔍</button>
        </div>
      </div>
      <div style={{ margin: "6px 16px 12px", background: "#2A2A2A", borderRadius: 10, padding: 4, display: "flex", gap: 4 }}>
        <button onClick={() => router.push("/")} style={{ flex: 0.8, minWidth: 0, border: 0, background: "transparent", color: "#B8B8B8", padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>Home</button>
        <button style={{ flex: 0.8, minWidth: 0, border: 0, background: "transparent", color: "#fff", padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, boxShadow: "inset 0 -3px 0 #22D464" }}>Movies</button>
        <button onClick={() => setShowWatchlist(true)} style={{ flex: 1.5, minWidth: 0, border: 0, background: "transparent", color: "#B8B8B8", padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>My Watchlist ({myWatchlist.length})</button>
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
          {filtered.length === 0 ? <div style={{ textAlign: "center", padding: 30 }}><div style={{ fontSize: 48 }}>🎬</div><div style={{ fontWeight: 800, marginTop: 10 }}>No movie found for “{search}”</div><button onClick={() => setSearch("")} style={{ background: "#22c55e", border: "none", color: "white", padding: "10px 20px", borderRadius: 999, marginTop: 14, fontWeight: "bold" }}>Clear</button></div> : filtered.map((m) => (
            <div key={m.id} onClick={() => setPlayingMovie(m)} style={{ display: "flex", gap: 12, background: "#111", borderRadius: 12, padding: 10, marginBottom: 10 }}>
              {m.img ? <img src={m.img} style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: 70, height: 100, background: "#222", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
              <div><div style={{ fontWeight: 800 }}>{m.title}</div><div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{m.cat} • {m.dur}</div><div style={{ fontSize: 12, color: "#22c55e", marginTop: 6 }}>▶ Tap to Play</div></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ margin: "4px 12px 0", borderRadius: 16, overflow: "hidden", background: "#111" }}>
            <div style={{ height: 280, background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,.85) 78%, #0B0B0B 100%), url('https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80') center/cover`, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 12px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 0.95, wordBreak: "break-word" }}>{heroes[hi].t}</div>
                <div style={{ fontSize: 11, lineHeight: 1.4, color: "#E6E6E6", margin: "8px 6px 12px" }}>{heroes[hi].d}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPlayingMovie(featured)} style={{ flex: 1.1, minWidth: 0, background: "#22D464", border: "none", color: "black", padding: "13px 6px", borderRadius: 8, fontWeight: 800, fontSize: 15, whiteSpace: "nowrap" }}>▶ Play</button>
                  <button onClick={() => toggleWatchlist(featured.id)} style={{ flex: 1.4, minWidth: 0, background: "transparent", border: "1.5px solid white", color: "white", padding: "11px 6px", borderRadius: 8, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, whiteSpace: "nowrap" }}><span>{myWatchlist.includes(featured.id) ? "✓ Watchlist" : "+ Watchlist"}</span><span>⬇</span></button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "10px 0 8px" }}>{heroes.map((_, i) => <span key={i} style={{ width: i === hi ? 7 : 6, height: i === hi ? 7 : 6, borderRadius: 50, background: i === hi ? "#22D464" : "#555" }} />)}</div>
          </div>
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Trending Now in Nigeria</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
            {trendingMovies.map((m) => <MovieCard key={m.id} m={m} />)}
            <EmptySlot section="Trending" />
            <EmptySlot section="Trending" />
          </div>
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Nollywood Picks</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
            {nollywoodMovies.map((m) => <MovieCard key={m.id} m={m} />)}
            <EmptySlot section="Nollywood" />
            <EmptySlot section="Nollywood" />
            <EmptySlot section="Nollywood" />
          </div>
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Hollywood Picks</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
            {hollywoodMovies.map((m) => <MovieCard key={m.id} m={m} />)}
            <EmptySlot section="Hollywood" />
            <EmptySlot section="Hollywood" />
            <EmptySlot section="Hollywood" />
          </div>
        </>
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
            <button onClick={() => toggleWatchlist(playingMovie.id)} style={{ marginTop: 12, background: myWatchlist.includes(playingMovie.id) ? "#22D464" : "transparent", border: "1px solid white", color: "white", padding: "10px 16px", borderRadius: 8, fontWeight: 700 }}>{myWatchlist.includes(playingMovie.id) ? "✓ In My Watchlist" : "+ My Watchlist"}</button>
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
