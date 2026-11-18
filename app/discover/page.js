"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Discover() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // EMPTY FOR NOW - no movies yet
  const allMovies = [];

  // Real search - e go filter, even if list empty e go work
  const filtered = allMovies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const isSearching = showSearch && search.trim() !== "";

  return (
    <div style={{ background: "black", color: "white", minHeight: "100vh", paddingBottom: 95, fontFamily: "system-ui" }}>

      {/* TOP - EVA + SEARCH ICON */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 16px 8px", position: "sticky", top: 0, background: "black", zIndex: 10 }}>
        <h1 style={{ color: "#22c55e", fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1 }}>EVA</h1>
        <button onClick={() => setShowSearch(!showSearch)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "white", borderRadius: 999, width: 38, height: 38, fontSize: 16 }}>🔍</button>
      </div>

      {/* REAL SEARCH BAR - hidden until you tap search */}
      {showSearch && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ display: "flex", gap: 8, background: "#1a1a1a", border: "1px solid #333", borderRadius: 999, padding: "8px 12px", alignItems: "center" }}>
            <span>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies, Nollywood, Hollywood..."
              autoFocus
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "white", fontSize: 14 }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#888", fontSize: 16 }}>✕</button>}
          </div>
          {isSearching && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#aaa" }}>
              Searching for “{search}”... {filtered.length === 0 ? "— No movie found yet. Movies go appear here when we add them." : `${filtered.length} found`}
            </div>
          )}
        </div>
      )}

      {/* IF SEARCHING - SHOW SEARCH RESULT AREA */}
      {isSearching ? (
        <div style={{ padding: "30px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>🎬</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>No movie found for “{search}”</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 6, lineHeight: 1.5 }}>No movie don dey added yet.<br/>Try another word, or come back later.</div>
          <button onClick={() => { setSearch(""); setShowSearch(false); }} style={{ background: "#22c55e", border: "none", color: "white", padding: "10px 20px", borderRadius: 999, fontWeight: "bold", marginTop: 16 }}>Clear Search</button>
        </div>
      ) : (
        <>
          {/* HERO - EMPTY NOW, NO LAGOS NIGHTS */}
          <div style={{ margin: "4px 16px 0", height: 210, background: "#111", border: "1px dashed #333", borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 36 }}>🎬</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>No Featured Movie Yet</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Featured movie go show here<br/>when we add the first movie</div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => alert("No movie yet — add first movie to play")} style={{ background: "#222", border: "none", color: "#888", padding: "9px 20px", borderRadius: 8, fontWeight: "bold" }}>▶ Play</button>
              <button onClick={() => alert("Your List is empty — no movie saved yet")} style={{ background: "transparent", border: "1px solid #333", color: "#888", padding: "9px 16px", borderRadius: 8 }}>+ My List</button>
            </div>
          </div>

          {/* ROWS - ALL EMPTY */}
          {[
            { title: "Trending Now in Nigeria" },
            { title: "Nollywood Picks" },
            { title: "Hollywood Picks" },
          ].map((row) => (
            <div key={row.title}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 16px 10px" }}>
                <h3 style={{ margin: 0, fontSize: 17 }}>{row.title}</h3>
                <span style={{ fontSize: 12, color: "#666" }}>Empty</span>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ minWidth: 110, height: 165, background: "#141414", border: "1px dashed #2a2a2a", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#555" }}>
                    <span style={{ fontSize: 24 }}>🎞️</span>
                    <span style={{ fontSize: 11 }}>Empty Slot</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ textAlign: "center", color: "#555", fontSize: 12, padding: "24px 16px 10px" }}>
            No movies added yet. This page go fill up when we upload movies.
          </div>
        </>
      )}

      {/* BOTTOM NAV - WITH REAL HOME BUTTON */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "black", borderTop: "1px solid #222", display: "flex", justifyContent: "space-around", padding: "10px 0 14px", alignItems: "center", zIndex: 20 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#22c55e", fontSize: 12, textAlign: "center" }}>🏠<br/>Home</button>
        <button style={{ background: "none", border: "none", color: "white", fontSize: 12, textAlign: "center" }}>✨<br/>Discover</button>
        <button onClick={() => alert("Upload go come later — we dey build page by page")} style={{ background: "#22c55e", border: "none", color: "white", width: 48, height: 48, borderRadius: 999, fontSize: 24, marginTop: -22 }}>+</button>
        <button onClick={() => alert("Shorts go come next step")} style={{ background: "none", border: "none", color: "#888", fontSize: 12, textAlign: "center" }}>🎬<br/>Short</button>
        <button onClick={() => alert("Me page go come later")} style={{ background: "none", border: "none", color: "#888", fontSize: 12, textAlign: "center" }}>👤<br/>Me</button>
      </div>

    </div>
  );
      }
