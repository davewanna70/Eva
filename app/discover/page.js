"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const MOVIES = [
  { id: 1, title: "The Hollow", cat: "Thriller", dur: "1h 35m", rate: "4.8", time: "1:55:12", img: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  { id: 2, title: "Chef's Journey", cat: "Documentary", dur: "1h 22m", rate: "4.6", time: "1:22:05", img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
  { id: 3, title: "Loop & Lumi", cat: "Animation • Family", dur: "1h 30m", rate: "4.9", time: "1:30:20", img: "https://images.unsplash.com/photo-1560859251-d563a49c5e4a?w=800", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
];

const SOUNDS = [
  { id: 1, name: "Lagos Nights", creator: "EVA Beats", cat: "Afrobeats", uses: "12.4K", dur: "0:30", emoji: "🥁" },
  { id: 2, name: "Amapiano Groove", creator: "EVA Beats", cat: "Amapiano", uses: "8.2K", dur: "0:30", emoji: "🎹" },
  { id: 3, name: "Gospel Lift", creator: "Free Worship", cat: "Gospel", uses: "5.1K", dur: "0:30", emoji: "🙏" },
  { id: 4, name: "Funny Wahala", creator: "EVA Comedy", cat: "Comedy", uses: "22K", dur: "0:15", emoji: "😂" },
  { id: 5, name: "Chill Lo-fi", creator: "Pixabay Free", cat: "Lo-fi", uses: "9.8K", dur: "0:60", emoji: "🌙" },
  { id: 6, name: "Ocean Waves", creator: "Nature Free", cat: "Nature", uses: "3.4K", dur: "0:60", emoji: "🌊" },
  { id: 7, name: "Trending Beat", creator: "EVA Beats", cat: "Trending", uses: "45K", dur: "0:15", emoji: "🔥" },
  { id: 8, name: "Soft Piano", creator: "Free Library", cat: "Trending", uses: "18K", dur: "0:30", emoji: "🎼" },
];
const SOUND_CATS = ["Trending", "Afrobeats", "Amapiano", "Gospel", "Comedy", "Lo-fi", "Nature"];

const INITIAL_SHORTS = [
  { id: 1, user: "@travelbites", avatar: "🍝", caption: "30s pasta recipe you need to try 🔥 #foodhacks #quickmeals", likes: 24600, comments: 312, img: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", verified: 80, sound: "Lagos Nights", durationSec: 32, sources: [{ n: "Ocean Agency 2026", d: "Water temperature data confirms whale migration shift +200km north vs. 2020", l: "ocean-agency.gov" }, { n: "Marine Biology Institute", d: "Documented feeding behavior in deep-water currents", l: "marinebio.org" }, { n: "Peer-reviewed study", d: "Population recovery +12% since 2024", l: "doi.org/10.101.1123" }] },
  { id: 2, user: "@oceanfacts", avatar: "🐋", caption: "Whales are moving north! Here's why 🌊 #ocean #science", likes: 18200, comments: 128, img: "https://images.unsplash.com/photo-1518877593221-1f28583780b5?w=600", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", verified: 80, sound: "Ocean Waves", durationSec: 45, sources: [{ n: "Ocean Agency 2026", d: "Water temperature data confirms whale migration shift +200km north vs. 2020", l: "ocean-agency.gov" }, { n: "Marine Biology Institute", d: "Documented feeding behavior in deep-water currents", l: "marinebio.org" }, { n: "Peer-reviewed study", d: "Population recovery +12% since 2024", l: "doi.org/10.101.1123" }] },
  { id: 3, user: "@evabuilds", avatar: "✨", caption: "I built this with EVA in 1 day! #build #eva", likes: 9800, comments: 89, img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600", video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", verified: 60, sound: "Original Sound", durationSec: 28, sources: [{ n: "EVA Build Log", d: "Project created with EVA on this date", l: "eva.app" }, { n: "User Proof", d: "Screen recording available", l: "eva.app" }] },
];

const BASE_COMMENTS = [
  { id: 1, user: "@marine_lover", time: "2h ago", text: "Incredible footage! They're so gentle.", likes: 342, replies: [{ id: 11, user: "@sciencefan", text: "Yes! They moved north for cooler waters 🌊", likes: 57 }] },
  { id: 2, user: "@sciencefan", time: "1h ago", text: "This matches the new migration study 🌊", likes: 57, replies: [] },
];
export default function DiscoverPage() {
  const router = useRouter();
  const [mainTab, setMainTab] = useState("movies");
  const [shortTab, setShortTab] = useState("Discover");
  const [shorts, setShorts] = useState(INITIAL_SHORTS);
  const [shortIdx, setShortIdx] = useState(0);
  const [liked, setLiked] = useState({}); const [saved, setSaved] = useState({}); const [followed, setFollowed] = useState({});
  const [showComments, setShowComments] = useState(false); const [showSource, setShowSource] = useState(false);
  const [comments, setComments] = useState(BASE_COMMENTS); const [commentText, setCommentText] = useState("");
  const [commentSticker, setCommentSticker] = useState(""); const [commentPhoto, setCommentPhoto] = useState(null);
  const [replyToId, setReplyToId] = useState(null); const [showEmojiBox, setShowEmojiBox] = useState(false); const [showStickerBox, setShowStickerBox] = useState(false);
  const [showBigHeart, setShowBigHeart] = useState(false); const [muted, setMuted] = useState(false); const [watchlist, setWatchlist] = useState(false);
  const [playing, setPlaying] = useState(true); const [moviePlaying, setMoviePlaying] = useState(null); const [movieTime, setMovieTime] = useState(0);
  const [isHorizontal, setIsHorizontal] = useState(false); const [seekFlash, setSeekFlash] = useState(""); const [seekSide, setSeekSide] = useState("");
  const [showUpload, setShowUpload] = useState(false); const [uploadStep, setUploadStep] = useState(1);
  const [uploadFile, setUploadFile] = useState(null); const [uploadPreview, setUploadPreview] = useState(""); const [uploadCaption, setUploadCaption] = useState(""); const [uploadHashtags, setUploadHashtags] = useState("");
  const [selectedSound, setSelectedSound] = useState(null); const [soundCat, setSoundCat] = useState("Trending"); const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [whoCanSee, setWhoCanSee] = useState("Everyone"); const [allowComments, setAllowComments] = useState(true); const [allowDownload, setAllowDownload] = useState(true); const [uploadProgress, setUploadProgress] = useState(0);
  const [myUploads, setMyUploads] = useState([]);
  // EVA STUDIO
const [isEVA, setIsEVA] = useState(true);
const [showEvaStudio, setShowEvaStudio] = useState(false);
const [movieTitle, setMovieTitle] = useState("");
const [movieCat, setMovieCat] = useState("Nollywood Drama");
const [movieFile, setMovieFile] = useState(null);
const [movieCover, setMovieCover] = useState(null);
const [ownRights, setOwnRights] = useState(false);
const [licenseType, setLicenseType] = useState("My Own Movie");
const [creatorName, setCreatorName] = useState("");
  const pressTimer = useRef(null); const galleryRef = useRef(null); const uploadRef = useRef(null); const movieVideoRef = useRef(null); const lastTap = useRef(0);
  const cur = shorts[shortIdx] || shorts[0];
  const likeCount = cur ? cur.likes + (liked[cur.id] ? 1 : 0) : 0;
  useEffect(() => {
    shorts.slice(shortIdx + 1, shortIdx + 4).forEach(s => { const v = document.createElement("video"); v.src = s.video; v.preload = "auto"; v.load(); const img = new Image(); img.src = s.img; });
  }, [shortIdx, shorts]);
  const handleDoubleTap = () => { setLiked(p => ({ ...p, [cur.id]: !p[cur.id] })); if (!liked[cur.id]) { setShowBigHeart(true); setTimeout(() => setShowBigHeart(false), 800); } };
  const startLongPress = () => { pressTimer.current = setTimeout(() => setShowComments(true), 500); };
  const endLongPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };
  const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n;
  const onMovieClick = (e, movie) => {
    const rect = e.currentTarget.getBoundingClientRect(); const x = e.clientX - rect.left; const now = Date.now(); const isDouble = now - lastTap.current < 300; lastTap.current = now;
    if (isDouble) { const v = movieVideoRef.current; if (!v) return; if (x > rect.width * 0.6) { v.currentTime += 10; setSeekFlash("+10s"); setSeekSide("right"); } else if (x < rect.width * 0.4) { v.currentTime = Math.max(0, v.currentTime - 10); setSeekFlash("-10s"); setSeekSide("left"); } setTimeout(() => { setSeekFlash(""); setSeekSide(""); }, 700); }
    else setTimeout(() => { if (Date.now() - lastTap.current >= 280) setMoviePlaying(p => p === movie.id ? null : movie.id); }, 300);
  };
  const sendComment = () => {
    if (!commentText.trim() && !commentSticker && !commentPhoto) return;
    const low = (commentText || "").toLowerCase(); if (low.includes("nude") || low.includes("porn") || low.includes("sex")) { alert("Boss, EVA no allow that kind of comment."); return; }
    if (replyToId) { setComments(prev => prev.map(c => c.id === replyToId ? { ...c, replies: [...c.replies, { id: Date.now(), user: "@you", text: commentText, likes: 0 }] } : c)); setReplyToId(null); }
    else setComments(prev => [{ id: Date.now(), user: "@you", time: "now", text: commentText, sticker: commentSticker, photo: commentPhoto, likes: 0, replies: [] }, ...prev]);
    setCommentText(""); setCommentSticker(""); setCommentPhoto(null); setShowEmojiBox(false); setShowStickerBox(false);
  };
  const onPhotoPick = (e) => { const f = e.target.files?.[0]; if (!f) return; e.target.value = ""; const r = new FileReader(); r.onload = () => setCommentPhoto(r.result); r.readAsDataURL(f); };
  const onUploadPick = (e) => {
    const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
    if (!f.type.startsWith("video/") && !f.type.startsWith("image/")) { alert("Only video or photo allowed"); return; }
    const url = URL.createObjectURL(f); setUploadFile(f); setUploadPreview(url); setUploadStep(2);
  };
  const doPost = () => {
    if (!uploadFile) { alert("Pick video or photo first"); return; }
    setUploadStep(4); let p = 0; const iv = setInterval(() => { p += 20; setUploadProgress(p); if (p >= 100) { clearInterval(iv); const newShort = { id: Date.now(), user: "@you", avatar: "😎", caption: uploadCaption + " " + uploadHashtags, likes: 0, comments: 0, img: uploadPreview, video: uploadPreview, verified: 0, sound: selectedSound ? selectedSound.name : "Original Sound", durationSec: 30, sources: [] }; setShorts(prev => [newShort, ...prev]); setMyUploads(prev => [newShort, ...prev]); setShowUpload(false); setUploadStep(1); setUploadCaption(""); setUploadHashtags(""); setSelectedSound(null); setUploadProgress(0); setMainTab("shorts"); setShortIdx(0); alert("Posted! Your Short is live for For You"); } }, 300);
  };
    const bottomNav = (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0 calc(10px + env(safe-area-inset-bottom))", background: "#000", borderTop: "1px solid #222", zIndex: 40 }}>
      <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#00a884" }}>🏠<div style={{ fontSize: 11 }}>Home</div></button>
      <button onClick={() => setMainTab("movies")} style={{ background: "none", border: "none", color: mainTab === "movies" ? "#fff" : "#aaa" }}>✨<div style={{ fontSize: 11 }}>Discover</div></button>
      <button onClick={() => setShowUpload(true)} style={{ background: "#00a884", border: "none", color: "#fff", borderRadius: 12, width: 44, height: 32, fontSize: 20, fontWeight: 800 }}>+</button>
      <button onClick={() => setMainTab("shorts")} style={{ background: "none", border: "none", color: mainTab === "shorts" ? "#fff" : "#aaa" }}>🎬<div style={{ fontSize: 11 }}>Shorts</div></button>
      <button style={{ background: "none", border: "none", color: "#aaa" }}>👤<div style={{ fontSize: 11 }}>You</div></button>
    </div>
  );
  const uploadSheet = showUpload && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: "#111", borderRadius: "20px 20px 0 0", padding: 16, maxHeight: "92%", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><b>Upload Short — Max 10 mins</b><button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20 }}>✕</button></div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Only EVA can upload long movies. You can upload Shorts up to 10 mins. Later we expand to 20 mins.</div>
        {uploadStep === 1 && <div style={{ marginTop: 14 }}>
          <div onClick={() => uploadRef.current?.click()} style={{ border: "2px dashed #333", borderRadius: 16, padding: 30, textAlign: "center", cursor: "pointer" }}><div style={{ fontSize: 40 }}>📹</div><div style={{ fontWeight: 700, marginTop: 8 }}>Pick Video or Photo(s)</div><div style={{ fontSize: 12, color: "#aaa" }}>Video max 10 mins • Photos 1-10 • No nudes / No children sexual / No porn — EVA will block</div></div>
          <input ref={uploadRef} type="file" accept="video/*,image/*" style={{ display: "none" }} onChange={onUploadPick} />
          <div style={{ marginTop: 12, background: "#1a1a1a", padding: 12, borderRadius: 12, fontSize: 13 }}>Tip: Use free sounds. No stolen full song.</div>
        </div>}
        {uploadStep === 2 && <div style={{ marginTop: 14 }}>
          {uploadPreview && (uploadFile?.type?.startsWith("video/") ? <video src={uploadPreview} controls style={{ width: "100%", borderRadius: 12, maxHeight: 220 }} /> : <img src={uploadPreview} style={{ width: "100%", borderRadius: 12, maxHeight: 220, objectFit: "cover" }} />)}
          <input value={uploadCaption} onChange={e => setUploadCaption(e.target.value)} placeholder="Write caption..." style={{ width: "100%", background: "#222", border: "none", borderRadius: 10, padding: "12px", color: "#fff", marginTop: 12, outline: "none" }} />
          <input value={uploadHashtags} onChange={e => setUploadHashtags(e.target.value)} placeholder="#food #science" style={{ width: "100%", background: "#222", border: "none", borderRadius: 10, padding: "12px", color: "#fff", marginTop: 8, outline: "none" }} />
          <button onClick={() => setShowSoundPicker(true)} style={{ width: "100%", background: "#222", border: "none", color: "#fff", borderRadius: 10, padding: 12, marginTop: 10, textAlign: "left" }}>Add Sound: {selectedSound ? `${selectedSound.emoji} ${selectedSound.name} • ${selectedSound.creator}` : "Original Sound (my video sound)"} →</button>
          <button onClick={() => setUploadStep(3)} style={{ width: "100%", background: "#00a884", border: "none", color: "#fff", borderRadius: 12, padding: 12, marginTop: 12, fontWeight: 700 }}>Next → Settings</button>
        </div>}
        {uploadStep === 3 && <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 700 }}>Who can see?</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>{["Everyone", "Friends", "Only Me"].map(w => <button key={w} onClick={() => setWhoCanSee(w)} style={{ background: whoCanSee === w ? "#00a884" : "#222", border: "none", color: "#fff", borderRadius: 999, padding: "8px 14px" }}>{w}</button>)}</div>
          <label style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>Allow Comments <input type="checkbox" checked={allowComments} onChange={e => setAllowComments(e.target.checked)} /></label>
          <label style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>Allow Download <input type="checkbox" checked={allowDownload} onChange={e => setAllowDownload(e.target.checked)} /></label>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>Allow Verify: ON — EVA will check your video for truth.</div>
          <button onClick={doPost} style={{ width: "100%", background: "#00a884", border: "none", color: "#fff", borderRadius: 12, padding: 12, marginTop: 14, fontWeight: 700 }}>Post Short →</button>
        </div>}
        {uploadStep === 4 && <div style={{ marginTop: 14, textAlign: "center" }}><div>Uploading... {uploadProgress}%</div><div style={{ height: 8, background: "#222", borderRadius: 999, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${uploadProgress}%`, height: "100%", background: "#00a884" }} /></div></div>}
        {showSoundPicker && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 120, display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: "100%", background: "#1a1a1a", borderRadius: "20px 20px 0 0", padding: 16, maxHeight: "85%", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><b>Add Sound — Free Sounds Only</b><button onClick={() => setShowSoundPicker(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20 }}>✕</button></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>{SOUND_CATS.map(c => <button key={c} onClick={() => setSoundCat(c)} style={{ background: soundCat === c ? "#00a884" : "#222", border: "none", color: "#fff", borderRadius: 999, padding: "6px 12px", fontSize: 12 }}>{c}</button>)}</div>
            <button onClick={() => { setSelectedSound(null); setShowSoundPicker(false); }} style={{ width: "100%", background: "#222", border: "none", color: "#fff", borderRadius: 10, padding: 10, marginTop: 10, textAlign: "left" }}>Original Sound — Use my video sound</button>
            {SOUNDS.filter(s => s.cat === soundCat || soundCat === "Trending").map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#222", borderRadius: 10, padding: 10, marginTop: 8 }}>
                <span style={{ fontSize: 24 }}>{s.emoji}</span><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div><div style={{ fontSize: 11, color: "#aaa" }}>{s.creator} • {s.uses} uses • {s.dur}</div></div>
                <button onClick={() => alert("Playing preview: " + s.name)}>▶️</button>
                <button onClick={() => { setSelectedSound(s); setShowSoundPicker(false); }} style={{ background: "#00a884", border: "none", color: "#fff", borderRadius: 999, padding: "6px 12px" }}>Use</button>
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>Upload My Sound: Only your own beat / voice. If na stolen song, EVA go block am.</div>
            <button onClick={() => { setSelectedSound({ name: "My Original Sound", creator: "@you", emoji: "🎤" }); setShowSoundPicker(false); }} style={{ width: "100%", background: "#333", border: "none", color: "#fff", borderRadius: 10, padding: 10, marginTop: 8 }}>Upload My Sound (My own beat)</button>
          </div>
        </div>}
      </div>
    </div>
  );
  if (mainTab === "shorts") {
    return (
      <div style={{ height: "100dvh", background: "#000", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "system-ui", position: "fixed", inset: 0 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, padding: "12px 10px 6px", zIndex: 20, background: "linear-gradient(to bottom, rgba(0,0,0,.7), transparent)" }}>
          {["For You", "Following", "Friends", "Discover"].map(t => <button key={t} onClick={() => setShortTab(t)} style={{ background: "none", border: "none", color: shortTab === t ? "#fff" : "#aaa", fontWeight: shortTab === t ? 800 : 500, fontSize: 15, borderBottom: shortTab === t ? "2px solid #00a884" : "none", paddingBottom: 4 }}>{t}</button>)}
        </div>
        <div onDoubleClick={handleDoubleTap} onTouchStart={startLongPress} onTouchEnd={endLongPress} onMouseDown={startLongPress} onMouseUp={endLongPress} onClick={() => setPlaying(!playing)} style={{ flex: 1, position: "relative", overflow: "hidden", cursor: "pointer" }}>
          {shorts.slice(shortIdx, shortIdx + 3).map((s, i) => <video key={s.id} src={s.video} poster={s.img} autoPlay={i === 0 && playing} muted={muted} loop playsInline preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: i === 0 ? "block" : "none" }} />)}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.75), transparent 40%, rgba(0,0,0,.3))", pointerEvents: "none" }} />
          <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} style={{ position: "absolute", top: 50, left: 12, background: "rgba(0,0,0,.5)", border: "none", color: "#fff", borderRadius: 999, width: 36, height: 36 }}>{muted ? "🔇" : "🔊"}</button>
          {!playing && <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 60 }}>▶️</div>}
          {showBigHeart && <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 100 }}>❤️</div>}
          <div style={{ position: "absolute", bottom: 90, left: 12, right: 80 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{cur.user}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{cur.caption}</div>
            <div style={{ fontSize: 11, color: "#00e5a0", marginTop: 6 }}>{cur.sound} • {cur.verified}% Verified • Tap Verify</div>
          </div>
          <div style={{ position: "absolute", right: 10, bottom: 100, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
            <button onClick={(e) => { e.stopPropagation(); setFollowed(p => ({ ...p, [cur.id]: !p[cur.id] })); }} style={{ background: "none", border: "none", textAlign: "center" }}><div style={{ width: 48, height: 48, borderRadius: 999, background: "#00a884", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, border: "2px solid #fff" }}>{cur.avatar}</div><div style={{ background: followed[cur.id] ? "#555" : "#ff3b30", color: "#fff", borderRadius: 999, width: 20, height: 20, margin: "-10px auto 0", fontSize: 14 }}>{followed[cur.id] ? "✓" : "+"}</div><div style={{ fontSize: 11, marginTop: 2, color: "#fff" }}>{followed[cur.id] ? "Following" : "Follow"}</div></button>
            <button onClick={(e) => { e.stopPropagation(); handleDoubleTap(); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 28 }}>{liked[cur.id] ? "❤️" : "🤍"}<div style={{ fontSize: 12 }}>{fmt(likeCount)}</div></button>
            <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 26 }}>💬<div style={{ fontSize: 12 }}>{cur.comments}</div></button>
            <button onClick={(e) => { e.stopPropagation(); setSaved(p => ({ ...p, [cur.id]: !p[cur.id] })); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 24 }}>{saved[cur.id] ? "🔖" : "📑"}<div style={{ fontSize: 12 }}>Save</div></button>
            <button onClick={(e) => { e.stopPropagation(); alert("Downloaded"); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 24 }}>⬇️<div style={{ fontSize: 12 }}>Download</div></button>
            <button onClick={(e) => { e.stopPropagation(); if (navigator.share) navigator.share({ text: cur.caption, url: window.location.href }); else alert("Link copied"); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 24 }}>↗️<div style={{ fontSize: 12 }}>Share</div></button>
            <button onClick={(e) => { e.stopPropagation(); setShowSource(true); }} style={{ background: cur.verified >= 70 ? "#00a884" : "#ff9800", border: "2px solid #fff", color: "#fff", borderRadius: 999, width: 48, height: 48, fontSize: 20, fontWeight: 800 }}>✓<div style={{ fontSize: 9 }}>Verify</div></button>
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "rgba(255,255,255,.2)" }}><div style={{ width: "45%", height: "100%", background: "#00a884" }} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: "6px", background: "#000" }}>
          <button disabled={shortIdx === 0} onClick={() => setShortIdx(shortIdx - 1)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: 999, padding: "6px 14px" }}>↑ Prev</button>
          <button onClick={() => setShowUpload(true)} style={{ background: "#00a884", border: "none", color: "#fff", borderRadius: 999, padding: "6px 14px" }}>+ Upload</button>
          <button disabled={shortIdx === shorts.length - 1} onClick={() => setShortIdx(shortIdx + 1)} style={{ background: "#00a884", border: "none", color: "#fff", borderRadius: 999, padding: "6px 14px" }}>Next ↓</button>
        </div>
        {showComments && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 60, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", background: "#111", borderRadius: "20px 20px 0 0", maxHeight: "80%", display: "flex", flexDirection: "column" }}><div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #222" }}><b>Comments {cur.comments}</b><button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20 }}>✕</button></div><div style={{ flex: 1, overflowY: "auto", padding: 12 }}>{comments.map(c => <div key={c.id} style={{ marginBottom: 14 }}><div style={{ display: "flex", gap: 8 }}><div style={{ width: 36, height: 36, borderRadius: 999, background: "#333", display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div><div style={{ flex: 1 }}><div style={{ fontSize: 13, color: "#aaa" }}>{c.user} • {c.time}</div><div style={{ fontSize: 14, marginTop: 2 }}>{c.text} {c.sticker && <span style={{ fontSize: 22 }}>{c.sticker}</span>}</div>{c.photo && <img src={c.photo} style={{ width: 120, borderRadius: 10, marginTop: 6 }} />}<div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Like {c.likes} • <span onClick={() => setReplyToId(c.id)} style={{ color: "#00a884", cursor: "pointer" }}>Reply</span></div>{c.replies.map(r => <div key={r.id} style={{ marginLeft: 16, marginTop: 8, background: "#1c1c1c", padding: 8, borderRadius: 10 }}><b style={{ fontSize: 12 }}>{r.user}</b><div style={{ fontSize: 13 }}>{r.text}</div></div>)}</div></div></div>)}</div>{replyToId && <div style={{ padding: "6px 12px", fontSize: 12, color: "#00a884", background: "#1c1c1c" }}>Replying... <span onClick={() => setReplyToId(null)} style={{ color: "#fff" }}>Cancel</span></div>}{commentSticker && <div style={{ padding: "6px 12px", fontSize: 26 }}>{commentSticker} <span onClick={() => setCommentSticker("")} style={{ fontSize: 12, color: "#fff" }}>Remove</span></div>}{commentPhoto && <div style={{ padding: "6px 12px" }}><img src={commentPhoto} style={{ width: 80, borderRadius: 10 }} /> <span onClick={() => setCommentPhoto(null)} style={{ fontSize: 12 }}>Remove</span></div>}{(showEmojiBox || showStickerBox) && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 12px", background: "#1c1c1c" }}>{(showEmojiBox ? ["😂", "❤️", "🔥", "😍", "😭", "👏", "🥺", "😎"] : ["🔥", "✨", "🌊", "🐋", "🎉", "💯", "🦁", "🚀"]).map(e => <button key={e} onClick={() => { if (showEmojiBox) setCommentText(t => t + e + " "); else setCommentSticker(e); setShowEmojiBox(false); setShowStickerBox(false); }} style={{ background: "none", border: "none", fontSize: 26 }}>{e}</button>)}</div>}<div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px", borderTop: "1px solid #222" }}><button onClick={() => galleryRef.current?.click()} style={{ background: "none", border: "none", fontSize: 22 }}>🖼️</button><button onClick={() => { setShowEmojiBox(!showEmojiBox); setShowStickerBox(false); }} style={{ background: "none", border: "none", fontSize: 22 }}>😊</button><button onClick={() => { setShowStickerBox(!showStickerBox); setShowEmojiBox(false); }} style={{ background: "none", border: "none", fontSize: 22 }}>✨</button><input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={replyToId ? "Reply..." : "Add a comment..."} style={{ flex: 1, background: "#222", border: "none", borderRadius: 20, padding: "10px 14px", color: "#fff", outline: "none" }} /><button onClick={sendComment} style={{ background: "#00a884", border: "none", color: "#fff", borderRadius: 999, width: 40, height: 40 }}>➤</button></div></div></div>}
        {bottomNav}
        {uploadSheet}
        <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhotoPick} />
      </div>
    );
  }
  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100dvh", paddingBottom: 90, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}><div><div style={{ fontWeight: 800, fontSize: 20 }}>Discover</div><div style={{ fontSize: 12, color: "#aaa" }}>Movies • Shorts • Sounds</div></div><div style={{ display: "flex", gap: 8 }}><button style={{ background: "#222", border: "none", color: "#fff", borderRadius: 999, width: 36, height: 36 }}>🔍</button><button style={{ background: "#222", border: "none", color: "#fff", borderRadius: 999, width: 36, height: 36 }}>🔔</button></div></div>
      <div style={{ display: "flex", gap: 8, padding: "0 16px 12px" }}>{["movies", "shorts", "sounds"].map(t => <button key={t} onClick={() => setMainTab(t)} style={{ background: mainTab === t ? "#00a884" : "#222", border: "none", color: "#fff", borderRadius: 999, padding: "8px 16px", textTransform: "capitalize" }}>{t}</button>)}</div>
      {myUploads.length > 0 && <div style={{ padding: "0 16px 12px" }}><div style={{ fontWeight: 800, marginBottom: 8 }}>My Shorts</div><div style={{ display: "flex", gap: 10, overflowX: "auto" }}>{myUploads.map(s => <div key={s.id} onClick={() => { setMainTab("shorts"); setShortIdx(0); }} style={{ minWidth: 110, cursor: "pointer" }}><img src={s.img} style={{ width: 110, height: 150, objectFit: "cover", borderRadius: 12 }} /><div style={{ fontSize: 12, marginTop: 4 }}>{s.caption.slice(0, 20)}</div></div>)}</div></div>}
      <div style={{ padding: "0 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Trending Movies</div>
        {MOVIES.map(m => (
          <div key={m.id} style={{ background: "#111", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            <div onClick={(e) => onMovieClick(e, m)} style={{ position: "relative", cursor: "pointer" }}>
              {moviePlaying === m.id ? <video ref={movieVideoRef} src={m.video} autoPlay controls onTimeUpdate={(e) => setMovieTime(e.target.currentTime)} style={{ width: "100%", height: 220, objectFit: "cover", background: "#000" }} /> : <img src={m.img} style={{ width: "100%", height: 220, objectFit: "cover" }} />}
              {moviePlaying !== m.id && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>▶️</div>}
              {seekFlash && moviePlaying === m.id && <div style={{ position: "absolute", top: "40%", [seekSide === "right" ? "right" : "left"]: 20, background: "rgba(0,0,0,.7)", padding: "8px 14px", borderRadius: 999, fontWeight: 800 }}>{seekFlash}</div>}
              <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.7)", padding: "4px 8px", borderRadius: 999, fontSize: 11 }}>{m.time} • Tap = Play • Double-tap side = ±10s</div>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><b>{m.title}</b><span>⭐ {m.rate}</span></div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{m.cat} • {m.dur}</div>
              {moviePlaying === m.id && <div style={{ marginTop: 8 }}><input type="range" min="0" max="100" value={movieTime} onChange={(e) => { const v = movieVideoRef.current; if (v) v.currentTime = Number(e.target.value); setMovieTime(Number(e.target.value)); }} style={{ width: "100%" }} /><button onClick={() => setIsHorizontal(!isHorizontal)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: 999, padding: "6px 12px", marginTop: 6, fontSize: 12 }}>{isHorizontal ? "Exit Fullscreen" : "⛶ Fullscreen"}</button></div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => setMoviePlaying(moviePlaying === m.id ? null : m.id)} style={{ flex: 1, background: "#00a884", border: "none", color: "#fff", borderRadius: 10, padding: 10, fontWeight: 700 }}>{moviePlaying === m.id ? "Pause" : "▶ Watch"}</button>
                <button onClick={() => setWatchlist(!watchlist)} style={{ background: "#222", border: "none", color: "#fff", borderRadius: 10, padding: "10px 14px" }}>{watchlist ? "✓ Saved" : "+ List"}</button>
                <button onClick={() => { setMainTab("shorts"); setShortIdx(0); }} style={{ background: "#222", border: "none", color: "#fff", borderRadius: 10, padding: "10px 14px" }}>Shorts →</button>
              </div>
            </div>
          </div>
        ))}
        <div style={{ background: "#111", borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: 800 }}>Top Sounds — Free</div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Use for your Shorts. No stolen song.</div>
          {SOUNDS.slice(0, 4).map(s => <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}><div>{s.emoji} <b style={{ fontSize: 13 }}>{s.name}</b> <span style={{ fontSize: 11, color: "#aaa" }}>• {s.creator} • {s.uses}</span></div><button onClick={() => { setSelectedSound(s); setShowUpload(true); }} style={{ background: "#00a884", border: "none", color: "#fff", borderRadius: 999, padding: "6px 12px" }}>Use</button></div>)}
        </div>
      </div>
      {bottomNav}
      {uploadSheet}
{isEVA && (
  <button onClick={() => setShowEvaStudio(true)} style={{ position: "fixed", bottom: 90, right: 16, background: "#00a884", color: "#fff", border: "none", borderRadius: 999, padding: "12px 16px", fontWeight: 800, zIndex: 90, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>+ Upload Movie (EVA)</button>
)}
{showEvaStudio && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 99, display: "flex", alignItems: "flex-end" }}>
    <div style={{ background: "#1a1a1a", width: "100%", borderRadius: "20px 20px 0 0", padding: 16, maxHeight: "90vh", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>🎬 EVA Studio — Upload Movie</div>
        <button onClick={() => setShowEvaStudio(false)} style={{ background: "#333", color: "#fff", border: "none", borderRadius: 999, padding: "6px 12px" }}>✕</button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>Only EVA fit upload movie. Legal only — no pirated film.</div>

      <input value={movieTitle} onChange={e => setMovieTitle(e.target.value)} placeholder="Movie Title *" style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 10, border: "none", background: "#222", color: "#fff" }} />

      <input value={creatorName} onChange={e => setCreatorName(e.target.value)} placeholder="Creator Name" style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: "#222", color: "#fff" }} />

      <select value={movieCat} onChange={e => setMovieCat(e.target.value)} style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: "#222", color: "#fff" }}>
        <option>Nollywood Drama</option>
        <option>Thriller</option>
        <option>Comedy</option>
        <option>Family</option>
        <option>Action</option>
      </select>

      <select value={licenseType} onChange={e => setLicenseType(e.target.value)} style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 10, border: "none", background: "#222", color: "#fff" }}>
        <option>My Own Movie</option>
        <option>I Have License</option>
        <option>Public Domain</option>
      </select>

      <div style={{ marginTop: 12, fontSize: 13 }}>Movie File *</div>
      <input type="file" accept="video/*" onChange={e => setMovieFile(e.target.files[0])} style={{ width: "100%", marginTop: 6, color: "#fff" }} />

      <div style={{ marginTop: 12, fontSize: 13 }}>Cover Photo</div>
      <input type="file" accept="image/*" onChange={e => setMovieCover(e.target.files[0])} style={{ width: "100%", marginTop: 6, color: "#fff" }} />

      <label style={{ display: "flex", gap: 8, marginTop: 14, fontSize: 13 }}>
        <input type="checkbox" checked={ownRights} onChange={e => setOwnRights(e.target.checked)} />
        I own rights / I have license to post this movie
      </label>

      <button onClick={() => {
        if (!movieTitle.trim()) return alert("Put movie title first, Boss");
        if (!movieFile) return alert("Pick movie file first");
        if (!ownRights) return alert("Tick I own rights first");
        alert("Posted! Legal Movie Live — " + licenseType);
        setShowEvaStudio(false);
        setMovieTitle(""); setCreatorName(""); setOwnRights(false); setMovieFile(null); setMovieCover(null);
      }} style={{ width: "100%", marginTop: 16, background: "#00a884", color: "#fff", border: "none", borderRadius: 999, padding: "12px", fontWeight: 800 }}>Post Movie</button>
    </div>
  </div>
)}
    </div>
  );
}
