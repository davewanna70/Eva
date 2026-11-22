"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ===== WATER GLASS STYLE (Discover only) =====
const WATER_BG = "radial-gradient(circle at 15% 8%, rgba(20,184,166,0.75) 0, transparent 45%), radial-gradient(circle at 90% 35%, rgba(37,99,235,0.65) 0, transparent 48%), radial-gradient(circle at 25% 95%, rgba(34,197,94,0.6) 0, transparent 52%), #06222b";
const GLASS = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.35)",
};
const GLASS_BLUR = {
  background: "rgba(255,255,255,0.13)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)",
};
const GLASS_POP = {
  background: "rgba(10,40,50,0.55)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.35)",
};
const GLASS_FIELD = {
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.3)",
};
const GLASS_TOP = {
  background: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderBottom: "1px solid rgba(255,255,255,0.25)",
};
const GLASS_BOTTOM = {
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderTop: "1px solid rgba(255,255,255,0.3)",
};
const OVERLAY = {
  background: "rgba(4,20,28,0.55)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};
const SOFT_TEXT = "rgba(255,255,255,0.78)";

// NO BOUNCE STYLE FOR HORIZONTAL ROWS - STAYS WHERE YOU LEFT IT
const ROW_STYLE = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  overflowY: "hidden",
  padding: "0 16px 4px",
  overscrollBehaviorX: "contain",
  overscrollBehaviorY: "none",
  WebkitOverflowScrolling: "touch",
  touchAction: "pan-x pan-y",
  scrollBehavior: "auto",
};

const BgLayer = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: -1, background: WATER_BG, pointerEvents: "none" }} />
);

function UploadModal({ open, target, title, setTitle, desc, setDesc, posterFile, setPosterFile, posterPreview, setPosterPreview, trailerFile, setTrailerFile, movieFile, setMovieFile, onClose, onUpload, canUpload, uploading }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, ...OVERLAY, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ ...GLASS_POP, width: "100%", maxWidth: 480, borderRadius: 16, padding: 16, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b style={{ fontSize: 18 }}>Upload to {target}</b>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 999, width: 32, height: 32 }}>X</button>
        </div>
        <div style={{ marginTop: 14, fontSize: 13, color: SOFT_TEXT }}>Title</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ width: "100%", boxSizing: "border-box", marginTop: 6, ...GLASS_FIELD, color: "#fff", padding: 12, borderRadius: 10, outline: "none" }} />
        <div style={{ marginTop: 12, fontSize: 13, color: SOFT_TEXT }}>Description</div>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" rows={3} style={{ width: "100%", boxSizing: "border-box", marginTop: 6, ...GLASS_FIELD, color: "#fff", padding: 12, borderRadius: 10, outline: "none" }} />
        <div style={{ marginTop: 12, fontSize: 13, color: SOFT_TEXT }}>Poster</div>
        <label style={{ display: "block", marginTop: 6, background: posterFile ? "#22D464" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: posterFile ? "#000" : "#fff", textAlign: "center", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
          {posterFile ? posterFile.name : "Select Poster"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) { setPosterFile(f); setPosterPreview(URL.createObjectURL(f)); } }} />
        </label>
        {posterPreview && <img src={posterPreview} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, marginTop: 8 }} />}
        <div style={{ marginTop: 12, fontSize: 13, color: SOFT_TEXT }}>Trailer</div>
        <label style={{ display: "block", marginTop: 6, background: trailerFile ? "#22D464" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: trailerFile ? "#000" : "#fff", textAlign: "center", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
          {trailerFile ? trailerFile.name : "Select Trailer"}
          <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) setTrailerFile(f); }} />
        </label>
        <div style={{ marginTop: 12, fontSize: 13, color: SOFT_TEXT }}>Movie</div>
        <label style={{ display: "block", marginTop: 6, background: movieFile ? "#22D464" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", color: movieFile ? "#000" : "#fff", textAlign: "center", padding: 12, borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>
          {movieFile ? movieFile.name : "Select Movie"}
          <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files[0]; if (f) setMovieFile(f); }} />
        </label>
        <button onClick={onUpload} disabled={!canUpload || uploading} style={{ width: "100%", marginTop: 16, background: canUpload && !uploading ? "#22D464" : "rgba(255,255,255,0.15)", color: canUpload && !uploading ? "#000" : "rgba(255,255,255,0.55)", border: "none", padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 15 }}>
          {uploading ? "Uploading to Supabase..." : "Upload"}
        </button>
      </div>
    </div>
  );
}

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
  const [vol, setVol] = useState(1);
  const [bright, setBright] = useState(1);
  const [gestureInfo, setGestureInfo] = useState(null);
  const gestureRef = useRef({ startY: 0, startVol: 1, startBright: 1, side: "right", active: false });
  const videoRef = useRef(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTarget, setUploadTarget] = useState("Trending");
  const [upTitle, setUpTitle] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upPosterFile, setUpPosterFile] = useState(null);
  const [upTrailerFile, setUpTrailerFile] = useState(null);
  const [upMovieFile, setUpMovieFile] = useState(null);
  const [upPosterPreview, setUpPosterPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const CATS = ["Nollywood","Hollywood","Comedy","Action","Horror","Romance","Drama","Thriller","Animation","Family","Crime","Documentary"];
  const [heroList, setHeroList] = useState([
    { t: "LAGOS HEIST", d: "A rogue detective and undercover agent must pull off the city's boldest heist before dawn strikes. Loyalty. Cash. Chaos.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
    { t: "OYO CODE", d: "A hacker and a police officer must crack the code before the city shuts down. One code. One night.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
    { t: "MOTHERLAND", d: "She left Lagos for London. Now she must return home to save her family. Home is calling.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
    { t: "WARRI BLOODLINE", d: "Two brothers. One throne. Warri will never be the same again.", img: "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80" },
  ]);
    useEffect(() => {
    if (showUpload) return;
    const id = setInterval(() => setHi((p) => (p + 1) % heroList.length), 4000);
    return () => clearInterval(id);
  }, [heroList.length, showUpload]);

  useEffect(() => {
    if (showDetail) {
      try { history.pushState({ detail: true }, ''); } catch {}
    }
    const onPop = () => { setShowDetail(null); setShowTrailer(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showDetail]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = vol;
  }, [vol, playingMovie]);

  useEffect(() => {
    if (!gestureInfo) return;
    const t = setTimeout(() => setGestureInfo(null), 800);
    return () => clearTimeout(t);
  }, [gestureInfo]);

  // LOAD MOVIES FROM SUPABASE - PERMANENT
  useEffect(() => {
    const loadMovies = async () => {
      setLoadingMovies(true);
      const { data, error } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
      if (error) {
        console.log("Load error:", error);
        setLoadingMovies(false);
        return;
      }
      const mapped = (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        cat: row.category || "My Upload • " + row.section,
        year: "2026",
        dur: "Uploaded Video",
        desc: row.description || "",
        video: row.video_url,
        trailer: row.trailer_url,
        img: row.poster_url || "",
        section: row.section,
      }));
      setUploadedMovies(mapped);
      setLoadingMovies(false);
    };
    loadMovies();
  }, []);

  const baseMovies = [];
  const allMovies = [...uploadedMovies, ...baseMovies];
  const trendingMovies = [...uploadedMovies.filter((m) => m.section === "Trending"), ...baseMovies];
  const getCatMovies = (c) => uploadedMovies.filter((m) => m.section === c);
  const filtered = allMovies.filter((m) => (m.title + " " + m.cat).toLowerCase().includes(search.toLowerCase()));
  const isSearching = showSearch && search.trim() !== "";
  const featured = allMovies[0];
  const savedList = allMovies.filter((m) => myWatchlist.includes(m.id));
  const isAdmin = true;

  const toggleWatchlist = (id) => {
    if (myWatchlist.includes(id)) setMyWatchlist(myWatchlist.filter((x) => x !== id));
    else setMyWatchlist([...myWatchlist, id]);
  };

  const makeHero = (m) => {
    setHeroList((prev) => [{ t: m.title, d: m.desc || m.title, img: m.img || "https://images.unsplash.com/photo-1543794327-59a91fb815d1?w=900&q=80", video: m.video }, ...prev].slice(0, 6));
  };

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
    setUploading(false);
  };

  const canUpload = upTitle.trim() !== "" && upMovieFile !== null;

  // DELETE FROM BOTH SIDES - TABLE + STORAGE
  const deleteMovie = async (id) => {
    const movie = uploadedMovies.find((m) => m.id === id);
    if (movie) {
      const getFileName = (url) => {
        if (!url || !url.includes("/movies/")) return null;
        return url.split("/movies/")[1];
      };
      const filesToDelete = [movie.video, movie.trailer, movie.img].map(getFileName).filter(Boolean);
      if (filesToDelete.length > 0) {
        await supabase.storage.from("movies").remove(filesToDelete);
      }
    }
    await supabase.from("movies").delete().eq("id", id);
    setUploadedMovies((prev) => prev.filter((m) => m.id !== id));
    setMyWatchlist((prev) => prev.filter((x) => x !== id));
    setShowDetail(null);
    setShowTrailer(false);
  };

  // UPLOAD TO SUPABASE - PERMANENT SAVE FOR ALL 5 FIELDS
  const doUpload = async () => {
    if (!canUpload || uploading) return;
    setUploading(true);
    try {
      const uploadFile = async (file, prefix) => {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${prefix}_${Date.now()}_${cleanName}`;
        const { error } = await supabase.storage.from("movies").upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from("movies").getPublicUrl(fileName);
        return data.publicUrl;
      };

      const videoURL = await uploadFile(upMovieFile, "movie");
      const trailerURL = upTrailerFile ? await uploadFile(upTrailerFile, "trailer") : null;
      const posterURL = upPosterFile ? await uploadFile(upPosterFile, "poster") : "";

      const { data, error } = await supabase.from("movies").insert({
        title: upTitle.trim(),
        description: upDesc.trim() || "Uploaded to " + uploadTarget,
        section: uploadTarget,
        category: "My Upload • " + uploadTarget,
        video_url: videoURL,
        trailer_url: trailerURL,
        poster_url: posterURL,
      }).select().single();

      if (error) throw error;

      const newMovie = {
        id: data.id,
        title: data.title,
        cat: data.category,
        year: "2026",
        dur: "Uploaded Video",
        desc: data.description,
        video: data.video_url,
        trailer: data.trailer_url,
        img: data.poster_url || "",
        section: data.section,
      };
      setUploadedMovies((prev) => [newMovie, ...prev]);
      closeUpload();
    } catch (e) {
      alert("Upload failed: " + (e.message || "Unknown error"));
      setUploading(false);
    }
  };

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx < -50) setHi((p) => (p + 1) % heroList.length);
    if (dx > 50) setHi((p) => (p - 1 + heroList.length) % heroList.length);
  };
  const onVideoTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const side = touch.clientX - rect.left > rect.width / 2 ? "right" : "left";
    gestureRef.current = { startY: touch.clientY, startVol: vol, startBright: bright, side, active: true };
  };
  const onVideoTouchMove = (e) => {
    if (!gestureRef.current.active) return;
    const touch = e.touches[0];
    const dy = gestureRef.current.startY - touch.clientY;
    const change = dy / 200;
    if (gestureRef.current.side === "right") {
      const nv = Math.max(0, Math.min(1, gestureRef.current.startVol + change));
      setVol(nv);
      setGestureInfo({ icon: nv === 0 ? "🔇" : "🔊", label: "Volume", value: Math.round(nv * 100) + "%" });
    } else {
      const nb = Math.max(0.3, Math.min(1.8, gestureRef.current.startBright + change));
      setBright(nb);
      setGestureInfo({ icon: "☀️", label: "Brightness", value: Math.round(((nb - 0.3) / 1.5) * 100) + "%" });
    }
  };
  const onVideoTouchEnd = () => { gestureRef.current.active = false; };

  const EmptySlot = ({ section }) => (
    <div onClick={() => openUploadFor(section)} style={{ minWidth: 110, height: 165, ...GLASS, border: "1px dashed rgba(255,255,255,0.4)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ width: 42, height: 42, background: "#22c55e", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "white" }}>+</div>
    </div>
  );
  const MoreSlot = ({ section }) => (
    <div onClick={() => setExpandedCat(section)} style={{ minWidth: 110, height: 165, ...GLASS, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>→</div>
      <div style={{ fontSize: 12, fontWeight: 700 }}>More</div>
    </div>
  );
  const MovieCard = ({ m }) => (
    <div onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ minWidth: 110, height: 165, ...GLASS, borderRadius: 12, overflow: "hidden", position: "relative", cursor: "pointer", flexShrink: 0 }}>
      {m.img ? <img src={m.img} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}><span style={{ fontSize: 28 }}>🎬</span><span style={{ fontSize: 11, padding: "0 8px", textAlign: "center" }}>{m.title}</span></div>}
    </div>
  );
  const CatRow = ({ cat }) => {
    const list = getCatMovies(cat);
    const slotsNeeded = Math.max(0, 9 - list.length);
    return (
      <div>
        <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>{cat} Picks</h3>
        <div style={{ ...ROW_STYLE }}>
          {list.slice(0, 9).map((m) => <MovieCard key={m.id} m={m} />)}
          {Array.from({ length: slotsNeeded }).map((_, i) => <EmptySlot key={i} section={cat} />)}
          <MoreSlot section={cat} />
        </div>
      </div>
    );
  };
  const uploadProps = {
    open: showUpload,
    target: uploadTarget,
    title: upTitle,
    setTitle: setUpTitle,
    desc: upDesc,
    setDesc: setUpDesc,
    posterFile: upPosterFile,
    setPosterFile: setUpPosterFile,
    posterPreview: upPosterPreview,
    setPosterPreview: setUpPosterPreview,
    trailerFile: upTrailerFile,
    setTrailerFile: setUpTrailerFile,
    movieFile: upMovieFile,
    setMovieFile: setUpMovieFile,
    onClose: closeUpload,
    onUpload: doUpload,
    canUpload: canUpload,
    uploading: uploading,
  };
  if (expandedCat) {
    const list = getCatMovies(expandedCat);
    return (
      <div style={{ background: "#06222b", position: "relative", zIndex: 0, color: "white", minHeight: "100vh", paddingBottom: 120, fontFamily: "system-ui", overscrollBehavior: "contain" }}>
        <BgLayer />
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setExpandedCat(null)} style={{ ...GLASS, color: "white", borderRadius: 999, width: 36, height: 36 }}>←</button>
          <h2 style={{ margin: 0, fontSize: 20 }}>{expandedCat} — All Movies</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 16px" }}>
          {list.map((m) => <div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ height: 165, borderRadius: 12, overflow: "hidden", background: m.img ? `url(${m.img}) center/cover` : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "flex-end", padding: 8 }}></div>)}
          {Array.from({ length: 9 }).map((_, i) => <div key={"e"+i} onClick={() => openUploadFor(expandedCat)} style={{ height: 165, borderRadius: 12, ...GLASS, border: "1px dashed rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 42, height: 42, background: "#22c55e", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900 }}>+</div></div>)}
        </div>
        <UploadModal {...uploadProps} />
        {showDetail && (
          <div style={{ position: "fixed", inset: 0, ...OVERLAY, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ ...GLASS_POP, width: "100%", maxWidth: 480, borderRadius: 14, overflow: "hidden", position: "relative" }}>
              <button onClick={() => { setShowDetail(null); setShowTrailer(false); if(history.state && history.state.detail) history.back(); }} style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 999, width: 32, height: 32, zIndex: 2, fontSize: 16 }}>X</button>
              <div style={{ position: "relative", background: "rgba(0,0,0,0.25)" }}>
                {showTrailer && showDetail.trailer ? (
                  <video src={showDetail.trailer} controls autoPlay playsInline style={{ width: "100%", height: 270, objectFit: "cover" }} />
                ) : (
                  <>
                    {showDetail.img ? <img src={showDetail.img} style={{ width: "100%", height: 380, objectFit: "contain", background: "transparent" }} /> : <div style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🎬</div>}
                    {showDetail.trailer && (
                      <div onClick={() => setShowTrailer(true)} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 999, background: "rgba(0,0,0,.6)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, cursor: "pointer" }}>▶️</div>
                    )}
                  </>
                )}
              </div>
              <div style={{ padding: 16 }}>
                <h2 style={{ margin: "0 0 6px" }}>{showDetail.title}</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", margin: "0 0 8px" }}>{showDetail.desc}</p>
                <p style={{ fontSize: 12, color: SOFT_TEXT, margin: "0 0 12px" }}>{showDetail.cat} • {showDetail.year} • {showDetail.dur}</p>
                <button onClick={() => { setPlayingMovie(showDetail); setShowDetail(null); }} style={{ width: "100%", background: "#22D464", border: "none", padding: 13, borderRadius: 8, fontWeight: 800, fontSize: 15 }}>▶ Play Movie</button>
                {isAdmin && <button onClick={() => deleteMovie(showDetail.id)} style={{ width: "100%", marginTop: 8, background: "#ef4444", border: "none", padding: 13, borderRadius: 8, fontWeight: 800, fontSize: 15, color: "#fff" }}>X Delete Movie</button>}
              </div>
            </div>
          </div>
        )}
        {playingMovie && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(4,20,28,0.9)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", zIndex: 300, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px" }}><b>{playingMovie.title}</b><button onClick={() => setPlayingMovie(null)} style={{ ...GLASS, color: "white", borderRadius: 999, width: 36, height: 36 }}>✕</button></div>
            <div onTouchStart={onVideoTouchStart} onTouchMove={onVideoTouchMove} onTouchEnd={onVideoTouchEnd} style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", background: "transparent" }}>
              <video ref={videoRef} src={playingMovie.video} controls autoPlay playsInline style={{ width: "100%", height: "100%", background: "black", filter: `brightness(${bright})` }} />
              {gestureInfo && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", ...GLASS_POP, padding: "14px 20px", borderRadius: 12, textAlign: "center", pointerEvents: "none" }}><div style={{ fontSize: 30 }}>{gestureInfo.icon}</div><div style={{ fontSize: 12, color: SOFT_TEXT, marginTop: 4 }}>{gestureInfo.label}</div><div style={{ fontSize: 18, fontWeight: 800 }}>{gestureInfo.value}</div></div>}
            </div>
            <div style={{ padding: 16 }}><div style={{ fontWeight: 800 }}>{playingMovie.title}</div><div style={{ fontSize: 13, color: SOFT_TEXT, marginTop: 4 }}>{playingMovie.cat}</div><button onClick={() => makeHero(playingMovie)} style={{ marginTop: 12, background: "#22D464", border: "none", padding: "10px 16px", borderRadius: 8, fontWeight: 800 }}>Make Featured (Admin Only)</button></div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ background: "#06222b", position: "relative", zIndex: 0, color: "white", minHeight: "100vh", paddingBottom: 120, fontFamily: "system-ui", overflowX: "hidden", overscrollBehavior: "contain" }}>
      <BgLayer />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px", position: "sticky", top: 0, ...GLASS_TOP, zIndex: 10 }}>
        <h1 style={{ color: "#22c55e", fontSize: 38, fontWeight: 900, margin: 0, letterSpacing: -2, whiteSpace: "nowrap" }}>✦ EVA <span style={{ fontSize: 14, color: "#A8FFC6", verticalAlign: "top" }}>✦</span></h1>
        <button onClick={() => setShowSearch(!showSearch)} style={{ ...GLASS, color: "white", borderRadius: 999, width: 38, height: 38, fontSize: 16 }}>🔍</button>
      </div>
      <div style={{ margin: "6px 16px 12px", ...GLASS_BLUR, borderRadius: 10, padding: 4, display: "flex", gap: 4 }}>
        <button onClick={() => setTopTab("home")} style={{ flex: 0.8, border: 0, background: "transparent", color: topTab === "home" ? "#fff" : SOFT_TEXT, padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, boxShadow: topTab === "home" ? "inset 0 -3px 0 #22D464" : "none" }}>Home</button>
        <button onClick={() => setTopTab("movies")} style={{ flex: 0.8, border: 0, background: "transparent", color: topTab === "movies" ? "#fff" : SOFT_TEXT, padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, boxShadow: topTab === "movies" ? "inset 0 -3px 0 #22D464" : "none" }}>Movies</button>
        <button onClick={() => setTopTab("watchlist")} style={{ flex: 1.5, border: 0, background: "transparent", color: topTab === "watchlist" ? "#fff" : SOFT_TEXT, padding: "10px 2px", borderRadius: 8, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", boxShadow: topTab === "watchlist" ? "inset 0 -3px 0 #22D464" : "none" }}>My Watchlist ({myWatchlist.length})</button>
      </div>
      {showSearch && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ display: "flex", gap: 8, ...GLASS_BLUR, borderRadius: 999, padding: "8px 12px", alignItems: "center" }}>
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies..." autoFocus style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 14 }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: SOFT_TEXT }}>✕</button>}
          </div>
        </div>
      )}
      {loadingMovies && <div style={{ textAlign: "center", padding: 20, color: SOFT_TEXT }}>Loading movies from Supabase...</div>}
      {isSearching ? (
        <div style={{ padding: "10px 16px" }}>
          <div style={{ fontSize: 13, color: SOFT_TEXT, marginBottom: 12 }}>Results for “{search}” — {filtered.length} found</div>
          {filtered.map((m) => (
            <div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ display: "flex", gap: 12, ...GLASS, borderRadius: 12, padding: 10, marginBottom: 10 }}>
              {m.img ? <img src={m.img} style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: 70, height: 100, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
              <div><div style={{ fontWeight: 800 }}>{m.title}</div><div style={{ fontSize: 12, color: SOFT_TEXT, marginTop: 4 }}>{m.cat} • {m.dur}</div></div>
            </div>
          ))}
        </div>
      ) : topTab === "watchlist" ? (
        <div style={{ padding: "10px 16px" }}>
          <h1 style={{ fontSize: 26, margin: 0 }}>My Watchlist</h1>
          <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
            <button onClick={() => setWatchTab("saved")} style={{ flex: 1, padding: 11, borderRadius: 20, border: "1px solid rgba(255,255,255,0.3)", background: watchTab === "saved" ? "#22D464" : "rgba(255,255,255,0.12)", color: watchTab === "saved" ? "#000" : "#fff", fontWeight: 700, fontSize: 12 }}>Saved ({savedList.length})</button>
            <button onClick={() => setWatchTab("down")} style={{ flex: 1, padding: 11, borderRadius: 20, border: "1px solid rgba(255,255,255,0.3)", background: watchTab === "down" ? "#22D464" : "rgba(255,255,255,0.12)", color: watchTab === "down" ? "#000" : "#fff", fontWeight: 700, fontSize: 12 }}>Downloaded • Offline</button>
          </div>
          {watchTab === "saved" ? (savedList.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: SOFT_TEXT }}>No saved yet.</div> : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{savedList.map((m) => (<div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ height: 170, borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: m.img ? `url(${m.img}) center/cover` : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.3)" }}></div>))}</div>) : (<div style={{ textAlign: "center", padding: 30, color: SOFT_TEXT }}>Downloaded movies will appear here.</div>)}
        </div>
      ) : topTab === "movies" ? (
        <div style={{ padding: "10px 16px" }}>
          <h2 style={{ margin: "6px 0 12px" }}>All Movies — Single List</h2>
          {allMovies.map((m) => (
            <div key={m.id} onClick={() => { setShowDetail(m); setShowTrailer(false); }} style={{ display: "flex", gap: 12, ...GLASS, borderRadius: 12, padding: 10, marginBottom: 10 }}>
              {m.img ? <img src={m.img} style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: 70, height: 100, background: "rgba(255,255,255,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
              <div><div style={{ fontWeight: 800 }}>{m.title}</div><div style={{ fontSize: 12, color: SOFT_TEXT, marginTop: 4 }}>{m.cat} • {m.dur}</div></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ margin: "4px 12px 0", borderRadius: 16, overflow: "hidden", ...GLASS_BLUR, overscrollBehavior: "contain" }}>
            <div style={{ height: 280, background: `linear-gradient(180deg, transparent 30%, rgba(4,28,36,.7) 75%, rgba(4,28,36,.92) 100%), url('${heroList[hi].img}') center/cover`, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 12px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 0.95, wordBreak: "break-word" }}>{heroList[hi].t}</div>
                <div style={{ fontSize: 11, lineHeight: 1.4, color: "#F2F2F2", margin: "8px 6px 12px" }}>{heroList[hi].d}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => heroList[hi].video && setPlayingMovie({ title: heroList[hi].t, cat: "Hero", dur: "", desc: heroList[hi].d, video: heroList[hi].video, img: heroList[hi].img })} style={{ flex: 1.1, background: "#22D464", border: "none", color: "black", padding: "13px 6px", borderRadius: 8, fontWeight: 800, fontSize: 15 }}>▶ Play</button>
                  <button onClick={() => featured && toggleWatchlist(featured.id)} style={{ flex: 1.4, background: "rgba(255,255,255,0.14)", border: "1.5px solid rgba(255,255,255,0.8)", color: "white", padding: "11px 6px", borderRadius: 8, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}> <span>{featured && myWatchlist.includes(featured.id) ? "✓ Watchlist" : "+ Watchlist"}</span><span>⬇</span></button>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, margin: "10px 0 8px" }}>{heroList.map((_, i) => <span key={i} onClick={() => setHi(i)} style={{ width: i === hi ? 7 : 6, height: i === hi ? 7 : 6, borderRadius: 50, background: i === hi ? "#22D464" : "rgba(255,255,255,0.45)", cursor: "pointer" }} />)}</div>
          </div>
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Trending Now in Nigeria</h3>
          <div style={{ ...ROW_STYLE }}>
            {trendingMovies.slice(0, 9).map((m) => <MovieCard key={m.id} m={m} />)}
            {Array.from({ length: Math.max(0, 9 - trendingMovies.length) }).map((_, i) => <EmptySlot key={i} section="Trending" />)}
            <MoreSlot section="Trending" />
          </div>
          {CATS.map((c) => <CatRow key={c} cat={c} />)}
        </>
      )}
      <UploadModal {...uploadProps} />
      {showDetail && !expandedCat && (
        <div style={{ position: "fixed", inset: 0, ...OVERLAY, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ ...GLASS_POP, width: "100%", maxWidth: 480, borderRadius: 14, overflow: "hidden", position: "relative" }}>
            <button onClick={() => { setShowDetail(null); setShowTrailer(false); if(history.state && history.state.detail) history.back(); }} style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 999, width: 32, height: 32, zIndex: 2, fontSize: 16 }}>X</button>
            <div style={{ position: "relative", background: "rgba(0,0,0,0.25)" }}>
              {showTrailer && showDetail.trailer ? (
                <video src={showDetail.trailer} controls autoPlay playsInline style={{ width: "100%", height: 270, objectFit: "cover" }} />
              ) : (
                <>
                  {showDetail.img ? <img src={showDetail.img} style={{ width: "100%", height: 380, objectFit: "contain", background: "transparent" }} /> : <div style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🎬</div>}
                  {showDetail.trailer && (
                    <div onClick={() => setShowTrailer(true)} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 999, background: "rgba(0,0,0,.6)", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, cursor: "pointer" }}>▶️</div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{showDetail.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 6 }}>{showDetail.desc}</div>
              <div style={{ fontSize: 12, color: SOFT_TEXT, marginTop: 6 }}>{showDetail.cat} • {showDetail.year} • {showDetail.dur}</div>
              <button onClick={() => { setPlayingMovie(showDetail); setShowDetail(null); }} style={{ width: "100%", marginTop: 12, background: "#22D464", border: "none", padding: 13, borderRadius: 8, fontWeight: 800, fontSize: 15 }}>▶ Play Movie</button>
              {isAdmin && <button onClick={() => deleteMovie(showDetail.id)} style={{ width: "100%", marginTop: 8, background: "#ef4444", border: "none", padding: 13, borderRadius: 8, fontWeight: 800, fontSize: 15, color: "#fff" }}>X Delete Movie</button>}
              <button onClick={() => toggleWatchlist(showDetail.id)} style={{ width: "100%", marginTop: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.8)", color: "white", padding: 10, borderRadius: 8, fontWeight: 700 }}>{myWatchlist.includes(showDetail.id) ? "✓ In Watchlist" : "+ Watchlist"}</button>
            </div>
          </div>
        </div>
      )}
      {playingMovie && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,20,28,0.9)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", zIndex: 100, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            <b>{playingMovie.title}</b>
            <button onClick={() => setPlayingMovie(null)} style={{ ...GLASS, color: "white", borderRadius: 999, width: 36, height: 36, fontSize: 18 }}>✕</button>
          </div>
          <div onTouchStart={onVideoTouchStart} onTouchMove={onVideoTouchMove} onTouchEnd={onVideoTouchEnd} style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", background: "transparent" }}>
            <video ref={videoRef} src={playingMovie.video} controls autoPlay playsInline preload="auto" style={{ width: "100%", height: "100%", background: "black", objectFit: "contain", filter: `brightness(${bright})` }} />
            {gestureInfo && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", ...GLASS_POP, padding: "14px 20px", borderRadius: 12, textAlign: "center", pointerEvents: "none" }}><div style={{ fontSize: 30 }}>{gestureInfo.icon}</div><div style={{ fontSize: 12, color: SOFT_TEXT, marginTop: 4 }}>{gestureInfo.label}</div><div style={{ fontSize: 18, fontWeight: 800 }}>{gestureInfo.value}</div></div>}
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800 }}>{playingMovie.title}</div>
            <div style={{ fontSize: 13, color: SOFT_TEXT, marginTop: 4 }}>{playingMovie.cat} • {playingMovie.dur}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{playingMovie.desc}</div>
            <button onClick={() => toggleWatchlist(playingMovie.id)} style={{ marginTop: 12, background: myWatchlist.includes(playingMovie.id) ? "#22D464" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.8)", color: "white", padding: "10px 16px", borderRadius: 8, fontWeight: 700, marginRight: 8 }}>{myWatchlist.includes(playingMovie.id) ? "✓ In Watchlist" : "+ Watchlist"}</button>
            <button onClick={() => makeHero(playingMovie)} style={{ marginTop: 12, background: "#22D464", border: "none", color: "black", padding: "10px 16px", borderRadius: 8, fontWeight: 800 }}>Make Featured (Admin Only)</button>
          </div>
        </div>
      )}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, ...GLASS_BOTTOM, display: "flex", justifyContent: "space-around", padding: "10px 0 14px", alignItems: "center", zIndex: 20 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#22c55e", fontSize: 12 }}>🏠<br />Home</button>
        <button style={{ background: "none", border: "none", color: "white", fontSize: 12 }}>✨<br />Discover</button>
        <button onClick={() => openUploadFor("Trending")} style={{ background: "#22c55e", border: "none", color: "white", width: 48, height: 48, borderRadius: 999, fontSize: 24, marginTop: -22 }}>+</button>
        <button style={{ background: "none", border: "none", color: SOFT_TEXT, fontSize: 12 }}>🎬<br />Short</button>
        <button style={{ background: "none", border: "none", color: SOFT_TEXT, fontSize: 12 }}>👤<br />Me</button>
      </div>
    </div>
  );
}
