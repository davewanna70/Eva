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

function makeFallbackTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a2a5e"; ctx.fillRect(0, 0, 1024, 512);
  const continents = [[120,130,140,70,"#2d7a3a"],[220,180,110,60,"#4a8a3a"],[480,110,180,90,"#3a7a3a"],[600,220,140,80,"#6a8a4a"],[800,150,120,70,"#2d7a3a"],[300,320,130,80,"#8a7a3a"],[700,340,110,60,"#4a8a3a"]];
  continents.forEach(([x,y,w,h,col]) => {
    ctx.fillStyle = col;
    for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.ellipse(x + (Math.random()-0.5)*w, y + (Math.random()-0.5)*h, 15+Math.random()*35, 10+Math.random()*25, 0, 0, Math.PI*2); ctx.fill(); }
  });
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(0,0,1024,22); ctx.fillRect(0,490,1024,22);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function useRealEarthTextures() {
  const loader = useMemo(() => new THREE.TextureLoader(), []);
  const [textures, setTextures] = useState({ map: null, clouds: null, night: null });
  useMemo(() => {
    if (typeof window === "undefined") return;
    const fallback = makeFallbackTexture();
    loader.load("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg", (t) => { t.colorSpace = THREE.SRGBColorSpace; setTextures((p) => ({ ...p, map: t })); }, undefined, () => setTextures((p) => ({ ...p, map: fallback })));
    loader.load("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-clouds.png", (t) => setTextures((p) => ({ ...p, clouds: t })), undefined, () => {});
    loader.load("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg", (t) => { t.colorSpace = THREE.SRGBColorSpace; setTextures((p) => ({ ...p, night: t })); }, undefined, () => {});
  }, [loader]);
  return textures;
}

const CITIES = [
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, color: "#facc15", activity: "Market • Traffic • Music" },
  { name: "Abuja", country: "Nigeria", lat: 9.0765, lng: 7.3986, color: "#facc15", activity: "Govt • Meetings" },
  { name: "Benin City", country: "Nigeria", lat: 6.335, lng: 5.603, color: "#facc15", activity: "Culture • Trade" },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006, color: "#22d3ee", activity: "Trading • Wall Street" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, color: "#a78bfa", activity: "Finance • Football" },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, color: "#a78bfa", activity: "Fashion • Tourism" },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, color: "#ef4444", activity: "Tech • Trade" },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, color: "#f472b6", activity: "Anime • Tech" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, color: "#f472b6", activity: "Trade • Tourism" },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, color: "#f472b6", activity: "Film • Market" },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.187, color: "#22c55e", activity: "Music • Trade" },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, color: "#22c55e", activity: "Tech • Safari" },
];

const ARCS = [
  { from: [6.5244, 3.3792], to: [40.7128, -74.006], color: "#22d3ee" },
  { from: [40.7128, -74.006], to: [39.9042, 116.4074], color: "#facc15" },
  { from: [51.5074, -0.1278], to: [31.2304, 121.4737], color: "#a78bfa" },
  { from: [6.5244, 3.3792], to: [51.5074, -0.1278], color: "#22c55e" },
  { from: [35.6762, 139.6503], to: [34.0522, -118.2437], color: "#f472b6" },
  { from: [25.2048, 55.2708], to: [19.076, 72.8777], color: "#ef4444" },
];

// ORBIT RING with real cities on it - like in your photo
function OrbitRing({ onSelectCity }) {
  const ringRef = useRef();
  useFrame((_, delta) => { if (ringRef.current) ringRef.current.rotation.z += delta * 0.02; });
  return (
    <group ref={ringRef} rotation={[Math.PI / 2.4, 0, 0.2]}>
      {/* Thin clean ring */}
      <mesh>
        <torusGeometry args={[3.1, 0.015, 8, 120]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.45} />
      </mesh>
      <mesh>
        <torusGeometry args={[3.1, 0.05, 8, 120]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} />
      </mesh>
      {/* Cities ON the orbit - glowing dots */}
      {CITIES.slice(0, 8).map((c, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 3.1;
        const y = Math.sin(angle) * 3.1;
        return (
          <group key={i} position={[x, y, 0]}>
            <mesh onClick={(e) => { e.stopPropagation(); onSelectCity && onSelectCity(c); }}>
              <sphereGeometry args={[0.06, 10, 10]} />
              <meshBasicMaterial color={c.color} />
            </mesh>
            <mesh><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color={c.color} transparent opacity={0.25} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

function FlyingDot({ from, to, color, speed = 0.3 }) {
  const ref = useRef();
  const curve = useMemo(() => {
    const s = latLngToVec3(from[0], from[1], 1.6);
    const e = latLngToVec3(to[0], to[1], 1.6);
    const mid = s.clone().add(e).multiplyScalar(0.5).normalize().multiplyScalar(2.3);
    return new THREE.QuadraticBezierCurve3(s, mid, e);
  }, [from, to]);
  useFrame((state) => {
    const t = (state.clock.elapsedTime * speed) % 1;
    if (ref.current) ref.current.position.copy(curve.getPoint(t));
  });
  return <mesh ref={ref}><sphereGeometry args={[0.04, 8, 8]} /><meshBasicMaterial color={color} /></mesh>;
}

function ArcLine({ from, to, color }) {
  const points = useMemo(() => {
    const start = latLngToVec3(from[0], from[1], 1.6);
    const end = latLngToVec3(to[0], to[1], 1.6);
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.3);
    return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(40);
  }, [from, to]);
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return <line geometry={geo}><lineBasicMaterial color={color} transparent opacity={0.6} /></line>;
}

function CityInside({ city, onSelect }) {
  const pos = latLngToVec3(city.lat, city.lng, 1.6);
  const [hover, setHover] = useState(false);
  const ref = useRef();
  useFrame((state) => { if (ref.current) ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + city.lat) * 0.2); });
  return (
    <group position={pos}>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(city); }}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={city.color} />
      </mesh>
      <mesh><sphereGeometry args={[0.11, 12, 12]} /><meshBasicMaterial color={city.color} transparent opacity={0.22} /></mesh>
      {hover && <Billboard><Html center distanceFactor={10} style={{ pointerEvents: "none" }}><div style={{ background: "rgba(0,0,0,0.9)", color: "#fff", fontSize: 10, padding: "5px 8px", borderRadius: 10, whiteSpace: "nowrap", border: `1px solid ${city.color}` }}><div style={{ fontWeight: 800 }}>{city.name}, {city.country}</div><div style={{ fontSize: 9, color: city.color }}>{city.activity}</div></div></Html></Billboard>}
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
    const g = new THREE.DodecahedronGeometry(size, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.multiplyScalar(1 + (Math.random() - 0.5) * 0.5);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [size]);
  useFrame((_, delta) => { if (ref.current) { ref.current.rotation.x += delta * 0.4; ref.current.rotation.y += delta * 0.3; } });
  return (
    <group position={pos}>
      <mesh ref={ref} geometry={geo}><meshStandardMaterial color={color} roughness={1} metalness={0.08} flatShading /></mesh>
      <mesh position={[size * 0.4, size * 0.3, size * 0.25]}><sphereGeometry args={[size * 0.2, 8, 8]} /><meshStandardMaterial color="#151515" roughness={1} /></mesh>
      <mesh position={[-size * 0.3, -size * 0.35, size * 0.2]}><sphereGeometry args={[size * 0.14, 8, 8]} /><meshStandardMaterial color="#151515" roughness={1} /></mesh>
    </group>
  );
}

function AsteroidBelt() {
  const group = useRef();
  const asteroids = useMemo(() => {
    const arr = [];
    const colors = ["#6b625c", "#8a7a6a", "#4a4a52", "#7a6a5a", "#5a534e", "#9a8a7a"];
    for (let i = 0; i < 55; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.5 + Math.random() * 2.4;
      arr.push({ pos: [Math.cos(angle) * radius, (Math.random() - 0.5) * 2.4, Math.sin(angle) * radius], size: Math.random() < 0.08 ? 0.2 + Math.random() * 0.15 : 0.04 + Math.random() * 0.11, color: colors[i % colors.length] });
    }
    return arr;
  }, []);
  // Stones rotate SLOWLY - 0.03
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.03; });
  return (
    <group ref={group}>
      {asteroids.map((a, i) => <RealAsteroid key={i} pos={a.pos} size={a.size} color={a.color} />)}
      <RealAsteroid pos={[2.9, 1.3, 2.1]} size={0.38} color="#7a6a5a" />
      <RealAsteroid pos={[-3.2, -1.1, 1.9]} size={0.3} color="#5a5a62" />
      <RealAsteroid pos={[0.5, -2.8, -3.4]} size={0.26} color="#8a7a6a" />
    </group>
  );
}

function EarthGroup({ news, scores, crypto, trading, onSelectCity, onSelectEarthBox }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const innerRef = useRef();
  const { map, clouds, night } = useRealEarthTextures();
  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.07;
    if (innerRef.current) innerRef.current.rotation.y += delta * 0.05;
  });
  const topNews = (news || []).slice(0, 3);
  const liveScore = (scores || []).find((s) => s.live) || (scores || [])[0];
  const btcPrice = crypto?.price || trading?.cryptoList?.find(c => c.name === "BTC")?.price || 69234;
  const btcChange = crypto?.change ?? trading?.cryptoList?.find(c => c.name === "BTC")?.change ?? 0;
  return (
    <group ref={earthRef}>
      <mesh><sphereGeometry args={[1.55, 32, 32]} /><meshBasicMaterial color="#020617" /></mesh>
      {night && <mesh><sphereGeometry args={[1.58, 32, 32]} /><meshBasicMaterial map={night} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>}
      {/* VERY TRANSPARENT REAL EARTH - 0.35 */}
      <mesh><sphereGeometry args={[2, 48, 48]} />{map ? <meshStandardMaterial map={map} transparent opacity={0.35} roughness={0.6} metalness={0.05} depthWrite={false} /> : <meshStandardMaterial color="#1a4d9e" transparent opacity={0.35} roughness={0.6} />}</mesh>
      <mesh ref={cloudsRef}><sphereGeometry args={[2.05, 32, 32]} />{clouds ? <meshStandardMaterial map={clouds} transparent opacity={0.22} depthWrite={false} /> : <meshStandardMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />}</mesh>
      <mesh><sphereGeometry args={[2.18, 32, 32]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.14} side={THREE.BackSide} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[2.4, 32, 32]} /><meshBasicMaterial color="#22d3ee" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} /></mesh>
      <group ref={innerRef}>
        {CITIES.map((c, i) => <CityInside key={i} city={c} onSelect={onSelectCity} />)}
        {ARCS.map((a, i) => <ArcLine key={i} from={a.from} to={a.to} color={a.color} />)}
        {ARCS.map((a, i) => <FlyingDot key={`f${i}`} from={a.from} to={a.to} color={a.color} speed={0.15 + i * 0.05} />)}
      </group>
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
          <ambientLight intensity={0.9} />
          <pointLight position={[5, 5, 5]} intensity={1.3} />
          <pointLight position={[-5, -2, -5]} intensity={0.7} color="#3b82f6" />
          <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={0.5} />
          <EarthGroup news={news} scores={scores} crypto={crypto} trading={trading} onSelectCity={onSelectCity} onSelectEarthBox={onSelectEarthBox} />
          <OrbitRing onSelectCity={onSelectCity} />
          <AsteroidBelt />
          <OrbitControls enableZoom enablePan={false} minDistance={3.2} maxDistance={8} enableDamping />
        </Suspense>
      </Canvas>
    </div>
  );
}
