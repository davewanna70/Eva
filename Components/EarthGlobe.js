"use client";
import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Html, Billboard, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Make Earth texture INSIDE phone - no download, no crash
function makeEarthTexture() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1a4d9e"; ctx.fillRect(0, 0, 1024, 512);
  // Oceans - deep blue with variation
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(20,80,160,${0.1 + Math.random() * 0.2})`;
    ctx.beginPath(); ctx.arc(Math.random() * 1024, Math.random() * 512, 20 + Math.random() * 80, 0, Math.PI * 2); ctx.fill();
  }
  // Continents - green / brown blobs (fake but looks like Earth from far)
  const continents = [
    [120, 130, 140, 70, "#2d7a3a"], [220, 180, 110, 60, "#4a8a3a"],
    [480, 110, 180, 90, "#3a7a3a"], [600, 220, 140, 80, "#6a8a4a"],
    [800, 150, 120, 70, "#2d7a3a"], [300, 320, 130, 80, "#8a7a3a"],
    [700, 340, 110, 60, "#4a8a3a"], [150, 250, 90, 60, "#7a8a4a"],
  ];
  continents.forEach(([x, y, w, h, col]) => {
    ctx.fillStyle = col;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.ellipse(x + (Math.random() - 0.5) * w, y + (Math.random() - 0.5) * h, 15 + Math.random() * 35, 10 + Math.random() * 25, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // Ice caps
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(0, 0, 1024, 22); ctx.fillRect(0, 490, 1024, 22);
  // Clouds - white streaks
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 80; i++) {
    ctx.beginPath(); ctx.ellipse(Math.random() * 1024, Math.random() * 512, 30 + Math.random() * 70, 4 + Math.random() * 8, 0, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const CITIES = [
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, color: "#facc15" },
  { name: "Abuja", country: "Nigeria", lat: 9.0765, lng: 7.3986, color: "#facc15" },
  { name: "Benin City", country: "Nigeria", lat: 6.335, lng: 5.603, color: "#facc15" },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006, color: "#22d3ee" },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, color: "#ef4444" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, color: "#a78bfa" },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, color: "#a78bfa" },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, color: "#f472b6" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, color: "#f472b6" },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.187, color: "#22c55e" },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, color: "#22c55e" },
];

function CityDot({ city, onSelect }) {
  const pos = latLngToVec3(city.lat, city.lng, 2.02);
  const [hover, setHover] = useState(false);
  return (
    <group position={pos}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect && onSelect(city); }}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color={city.color} />
      </mesh>
      <mesh><sphereGeometry args={[0.07, 10, 10]} /><meshBasicMaterial color={city.color} transparent opacity={0.25} /></mesh>
      {hover && <Billboard><Html center distanceFactor={10} style={{ pointerEvents: "none" }}><div style={{ background: "rgba(0,0,0,0.85)", color: "#fff", fontSize: 10, padding: "4px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{city.name}</div></Html></Billboard>}
    </group>
  );
}

function StandingBox({ position, title, subtitle, color = "#22d3ee", onClick }) {
  return (
    <Billboard position={position}>
      <Html center distanceFactor={10} style={{ pointerEvents: "auto" }} zIndexRange={[30, 0]}>
        <div onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} style={{ width: 102, background: "rgba(2,12,24,0.62)", border: `1px solid ${color}`, borderRadius: 10, padding: "6px 7px", color: "#fff", fontFamily: "sans-serif", boxShadow: `0 0 14px ${color}55`, cursor: "pointer", backdropFilter: "blur(3px)" }}>
          <div style={{ fontSize: 7, color, fontWeight: 800 }}>{subtitle}</div>
          <div style={{ fontSize: 9, fontWeight: 800, lineHeight: 1.25, marginTop: 3, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>● LIVE • TAP TO OPEN</div>
        </div>
      </Html>
    </Billboard>
  );
}

function RealAsteroid({ pos, size, color }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(size, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.multiplyScalar(1 + (Math.random() - 0.5) * 0.4);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [size]);
  useFrame((_, delta) => { if (ref.current) { ref.current.rotation.x += delta * 0.4; ref.current.rotation.y += delta * 0.3; } });
  return (
    <group position={pos}>
      <mesh ref={ref} geometry={geo}><meshStandardMaterial color={color} roughness={1} metalness={0.05} flatShading /></mesh>
      <mesh position={[size * 0.4, size * 0.3, size * 0.2]}><sphereGeometry args={[size * 0.18, 6, 6]} /><meshStandardMaterial color="#1a1a1a" roughness={1} /></mesh>
    </group>
  );
}

function AsteroidBelt() {
  const group = useRef();
  const asteroids = useMemo(() => {
    const arr = [];
    const colors = ["#6b625c", "#8a7a6a", "#4a4a52", "#7a6a5a", "#5a534e"];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.4 + Math.random() * 2.2;
      arr.push({ pos: [Math.cos(angle) * radius, (Math.random() - 0.5) * 2.2, Math.sin(angle) * radius], size: 0.04 + Math.random() * 0.1, color: colors[i % colors.length] });
    }
    return arr;
  }, []);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.03; });
  return (
    <group ref={group}>
      {asteroids.map((a, i) => <RealAsteroid key={i} pos={a.pos} size={a.size} color={a.color} />)}
      <RealAsteroid pos={[2.9, 1.3, 2.1]} size={0.32} color="#7a6a5a" />
      <RealAsteroid pos={[-3.2, -1.1, 1.9]} size={0.26} color="#5a5a62" />
    </group>
  );
}

function EarthGroup({ news, scores, crypto, trading, onSelectCity, onSelectEarthBox }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const earthTex = useMemo(() => { try { return makeEarthTexture(); } catch (e) { return null; } }, []);
  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.07;
  });
  const topNews = (news || []).slice(0, 3);
  const liveScore = (scores || []).find((s) => s.live) || (scores || [])[0];
  const btcPrice = crypto?.price || trading?.cryptoList?.find(c => c.name === "BTC")?.price || 0;
  const btcChange = crypto?.change ?? trading?.cryptoList?.find(c => c.name === "BTC")?.change ?? 0;

  return (
    <group ref={earthRef}>
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        {earthTex ? <meshStandardMaterial map={earthTex} roughness={0.7} metalness={0.05} /> : <meshStandardMaterial color="#1a4d9e" roughness={0.7} />}
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 24, 24]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh><sphereGeometry args={[2.18, 24, 24]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.12} side={THREE.BackSide} /></mesh>
      <mesh><sphereGeometry args={[2.35, 24, 24]} /><meshBasicMaterial color="#22d3ee" transparent opacity={0.05} side={THREE.BackSide} /></mesh>

      {CITIES.map((c, i) => <CityDot key={i} city={c} onSelect={onSelectCity} />)}

      <StandingBox position={latLngToVec3(40.7, -74, 2.45)} title={`Trading Live Market - BTC $${Number(btcPrice).toLocaleString()} ${Number(btcChange).toFixed(2)}%`} subtitle="TRADING LIVE MARKET" color="#22c55e" onClick={() => onSelectEarthBox && onSelectEarthBox("crypto")} />
      <StandingBox position={latLngToVec3(6.5, 3.3, 2.45)} title={topNews[1]?.title || topNews[0]?.title || "World Live News"} subtitle={`${topNews[1]?.source || "BBC"} • NAIJA / WORLD`} color="#facc15" onClick={() => onSelectEarthBox && onSelectEarthBox("news", 1)} />
      <StandingBox position={latLngToVec3(39.9, 116.4, 2.45)} title={topNews[2]?.title || "China / World News"} subtitle={`${topNews[2]?.source || "BBC"} • CHINA / WORLD`} color="#ef4444" onClick={() => onSelectEarthBox && onSelectEarthBox("news", 2)} />
      <StandingBox position={latLngToVec3(51.5, -0.12, 2.45)} title="Viral Live Now - Tap to watch viral videos" subtitle="VIRAL • LIVE NOW" color="#f472b6" onClick={() => onSelectEarthBox && onSelectEarthBox("tiktok")} />
      <StandingBox position={latLngToVec3(48.85, 2.35, 2.45)} title={liveScore ? `${liveScore.home} ${liveScore.homeScore} - ${liveScore.awayScore} ${liveScore.away}` : "Football Live Score - Checking leagues..."} subtitle={`${liveScore?.league || "FOOTBALL"} • ${liveScore?.status || "LIVE"}`} color="#facc15" onClick={() => onSelectEarthBox && onSelectEarthBox("sport")} />
      <StandingBox position={latLngToVec3(-26.2, 28.04, 2.45)} title="EVA System Check - All OK" subtitle="EVA SYSTEM • CHECK" color="#4ade80" onClick={() => onSelectEarthBox && onSelectEarthBox("hacker")} />
    </group>
  );
}

export default function EarthGlobe({ news, scores, crypto, trading, onSelectCity, onSelectEarthBox }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas camera={{ position: [0, 0.5, 5.2], fov: 45 }} gl={{ antialias: false, alpha: true, powerPreference: "low-power" }} dpr={[1, 1.5]} style={{ background: "transparent" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.8} />
          <pointLight position={[5, 5, 5]} intensity={1.2} />
          <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={0.5} />
          <EarthGroup news={news} scores={scores} crypto={crypto} trading={trading} onSelectCity={onSelectCity} onSelectEarthBox={onSelectEarthBox} />
          <AsteroidBelt />
          <OrbitControls enableZoom enablePan={false} minDistance={3.2} maxDistance={8} enableDamping />
        </Suspense>
      </Canvas>
    </div>
  );
                      }
