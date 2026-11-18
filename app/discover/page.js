"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Discover() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [playingMovie, setPlayingMovie] = useState(null);
  const [myList, setMyList] = useState([]);
  const [uploadedMovies, setUploadedMovies] = useState([]);
  const [uploadTarget, setUploadTarget] = useState("Trending");
  const fileRef = useRef(null);

  const baseMovies = [
    {
      id: 1,
      title: "Test Movie - Big Buck",
      cat: "Animation • Family",
      year: "2024",
      dur: "10 mins",
      desc: "This na test movie to check if Play dey work.",
      video: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      img: "",
      section: "Trending",
    },
    {
      id: 2,
      title: "Test Movie 2 - Flower",
      cat: "Nature • Short",
      year: "2024",
      dur: "10 secs",
      desc: "Second test movie - very fast, small file.",
      video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      img: "",
      section: "Trending",
    },
  ];

  // Split uploads by section
  const trendingUploads = uploadedMovies.filter(m => m.section === "Trending");
  const nollywoodUploads = uploadedMovies.filter(m => m.section === "Nollywood");
  const hollywoodUploads = uploadedMovies.filter(m => m.section === "Hollywood");

  const allMovies = [...uploadedMovies, ...baseMovies];

  const trendingMovies = [...trendingUploads, ...baseMovies];
  const nollywoodMovies = [...nollywoodUploads];
  const hollywoodMovies = [...hollywoodUploads];

  const filtered = allMovies.filter((m) =>
    (m.title + " " + m.cat).toLowerCase().includes(search.toLowerCase())
  );

  const isSearching = showSearch && search.trim() !== "";
  const featured = allMovies[0];

  const toggleMyList = (id) => {
    if (myList.includes(id)) {
      setMyList(myList.filter((x) => x !== id));
    } else {
      setMyList([...myList, id]);
      alert("Added to My List ✅");
    }
  };

  // OPEN GALLERY FOR SPECIFIC SECTION
  const openUploadFor = (section) => {
    setUploadTarget(section);
    setTimeout(() => fileRef.current?.click(), 50);
  };

  // HANDLE UPLOAD
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const videoURL = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

    const newMovie = {
      id: Date.now(),
      title: cleanName,
      cat: "My Upload • 📱 • " + uploadTarget,
      year: "2026",
      dur: "Your Video",
      desc: "Uploaded from your phone to " + uploadTarget + ". File: " + file.name,
      video: videoURL,
      img: "",
      section: uploadTarget,
    };

    setUploadedMovies((prev) => [newMovie, ...prev]);
    alert("✅ " + cleanName + " don enter " + uploadTarget + "!");
    e.target.value = "";
  };

  // REUSABLE EMPTY SLOT WITH PLUS
  const EmptySlot = ({ section }) => (
    <div
      onClick={() => openUploadFor(section)}
      style={{ minWidth: 110, height: 165, background: "#141414", border: "1px dashed #2a2a2a", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}
    >
      <div style={{ width: 38, height: 38, background: "#22c55e", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "white" }}>+</div>
      <span style={{ color: "#888", fontSize: 11, textAlign: "center", padding: "0 8px" }}>Tap to Upload<br/>to {section}</span>
    </div>
  );

  const MovieCard = ({ m }) => (
    <div key={m.id} onClick={() => setPlayingMovie(m)} style={{ minWidth: 110, height: 165, background: "#1a1a1a", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
      <span style={{ fontSize: 28 }}>{m.section !== "Trending" || m.cat.includes("My Upload") ? "📱" : "🎬"}</span>
      <span style={{ fontSize: 11, padding: "0 8px", textAlign: "center" }}>{m.title}</span>
      <span style={{ fontSize: 10, color: "#22c55e" }}>▶ Play</span>
    </div>
  );

  return (
    <div style={{ background: "black", color: "white", minHeight: "100vh", paddingBottom: 95, fontFamily: "system-ui" }}>

      <input type="file" accept="video/*" ref={fileRef} onChange={handleUpload} style={{ display: "none" }} />

      {/* TOP */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", position: "sticky", top: 0, background: "black", zIndex: 10 }}>
        <h1 style={{ color: "#22c55e", fontSize: 32, fontWeight: 900, margin: 0 }}>EVA</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => openUploadFor("Trending")} style={{ background: "#22c55e", border: "none", color: "white", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: "bold" }}>+ Upload</button>
          <button onClick={() => setShowSearch(!showSearch)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "white", borderRadius: 999, width: 38, height: 38, fontSize: 16 }}>🔍</button>
        </div>
      </div>

      {/* SEARCH */}
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
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 48 }}>🎬</div>
              <div style={{ fontWeight: 800, marginTop: 10 }}>No movie found for “{search}”</div>
              <button onClick={() => setSearch("")} style={{ background: "#22c55e", border: "none", color: "white", padding: "10px 20px", borderRadius: 999, marginTop: 14, fontWeight: "bold" }}>Clear</button>
            </div>
          ) : filtered.map((m) => (
            <div key={m.id} onClick={() => setPlayingMovie(m)} style={{ display: "flex", gap: 12, background: "#111", borderRadius: 12, padding: 10, marginBottom: 10 }}>
              <div style={{ width: 70, height: 100, background: "#222", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>
              <div><div style={{ fontWeight: 800 }}>{m.title}</div><div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{m.cat} • {m.dur}</div><div style={{ fontSize: 12, color: "#22c55e", marginTop: 6 }}>▶ Tap to Play</div></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* HERO */}
          <div style={{ margin: "4px 16px 0", height: 240, background: "#1a1a1a", borderRadius: 16, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 16 }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, opacity: 0.3 }}>🎬</div>
            <div style={{ position: "relative", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{featured.title}</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{featured.cat} • {featured.year} • {featured.dur}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "center" }}>
                <button onClick={() => setPlayingMovie(featured)} style={{ background: "#22c55e", border: "none", color: "white", padding: "9px 22px", borderRadius: 8, fontWeight: "bold" }}>▶ Play</button>
                <button onClick={() => toggleMyList(featured.id)} style={{ background: "transparent", border: "1px solid white", color: "white", padding: "9px 16px", borderRadius: 8 }}>{myList.includes(featured.id) ? "✓ In My List" : "+ My List"}</button>
              </div>
            </div>
          </div>

          {/* TRENDING */}
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Trending Now in Nigeria</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
            {trendingMovies.map((m) => <MovieCard key={m.id} m={m} />)}
            <EmptySlot section="Trending" />
            <EmptySlot section="Trending" />
          </div>

          {/* NOLLYWOOD */}
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Nollywood Picks</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
            {nollywoodMovies.map((m) => <MovieCard key={m.id} m={m} />)}
            <EmptySlot section="Nollywood" />
            <EmptySlot section="Nollywood" />
            <EmptySlot section="Nollywood" />
          </div>

          {/* HOLLYWOOD */}
          <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Hollywood Picks</h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
            {hollywoodMovies.map((m) => <MovieCard key={m.id} m={m} />)}
            <EmptySlot section="Hollywood" />
            <EmptySlot section="Hollywood" />
            <EmptySlot section="Hollywood" />
          </div>
        </>
      )}

      {/* VIDEO PLAYER */}
      {playingMovie && (
        <div style={{ position: "fixed", inset: 0, background: "black", zIndex: 100, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            <b>{playingMovie.title}</b>
            <button onClick={() => setPlayingMovie(null)} style={{ background: "#222", border: "none", color: "white", borderRadius: 999, width: 36, height: 36, fontSize: 18 }}>✕</button>
          </div>
          <video src={playingMovie.video} controls autoPlay playsInline preload="auto" style={{ width: "100%", flex: 1, background: "black" }} />
          <div style={{ padding: 16 }}>
            <div style={{ fontWeight: 800 }}>{playingMovie.title}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{playingMovie.cat} • {playingMovie.dur}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{playingMovie.desc}</div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "black", borderTop: "1px solid #222", display: "flex", justifyContent: "space-around", padding: "10px 0 14px", alignItems: "center", zIndex: 20 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#22c55e", fontSize: 12 }}>🏠<br/>Home</button>
        <button style={{ background: "none", border: "none", color: "white", fontSize: 12 }}>✨<br/>Discover</button>
        <button onClick={() => openUploadFor("Trending")} style={{ background: "#22c55e", border: "none", color: "white", width: 48, height: 48, borderRadius: 999, fontSize: 24, marginTop: -22 }}>+</button>
        <button style={{ background: "none", border: "none", color: "#888", fontSize: 12 }}>🎬<br/>Short</button>
        <button style={{ background: "none", border: "none", color: "#888", fontSize: 12 }}>👤<br/>Me</button>
      </div>

    </div>
  );
}
