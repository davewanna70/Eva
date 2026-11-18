"use client";
export default function Discover() {
  const emptyMovies = [1, 2, 3, 4, 5];
  return (
    <div style={{ background: "black", color: "white", minHeight: "100vh", paddingBottom: 90 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
        <h1 style={{ color: "#22c55e", fontSize: 32, fontWeight: 900, margin: 0 }}>EVA</h1>
        <span style={{ fontSize: 22 }}>🔍</span>
      </div>

      <div style={{ margin: "0 16px", height: 220, background: "#1a1a1a", borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", paddingBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 800 }}>Lagos Nights</div>
        <div style={{ fontSize: 12, color: "#aaa" }}>Nollywood • 2024 • Thriller • Drama</div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button style={{ background: "#22c55e", border: "none", color: "white", padding: "8px 22px", borderRadius: 6, fontWeight: "bold" }}>▶ Play</button>
          <button style={{ background: "transparent", border: "1px solid white", color: "white", padding: "8px 18px", borderRadius: 6 }}>+ My List</button>
        </div>
      </div>

      <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Trending Now in Nigeria</h3>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
        {emptyMovies.map((i) => (
          <div key={i} style={{ minWidth: 105, height: 160, background: "#222", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Movie {i}</div>
        ))}
      </div>

      <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Nollywood Picks</h3>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
        {emptyMovies.map((i) => (
          <div key={i} style={{ minWidth: 105, height: 160, background: "#222", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Movie {i}</div>
        ))}
      </div>

      <h3 style={{ padding: "20px 16px 10px", margin: 0 }}>Hollywood Picks</h3>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px" }}>
        {emptyMovies.map((i) => (
          <div key={i} style={{ minWidth: 105, height: 160, background: "#222", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Movie {i}</div>
        ))}
      </div>
    </div>
  );
        }
