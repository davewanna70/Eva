"use client";
import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
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

const CITIES = [
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, color: "#facc15" },
  { name: "Abuja", country: "Nigeria", lat: 9.0765, lng: 7.3986, color: "#facc15" },
  { name: "Benin City", country: "Nigeria", lat: 6.335, lng: 5.603, color: "#facc15" },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006, color: "#22d3ee" },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, color: "#22d3ee" },
  { name: "Washington", country: "USA", lat: 38.9072, lng: -77.0369, color: "#22d3ee" },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, color: "#ef4444" },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, color: "#ef4444" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, color: "#a78bfa" },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, color: "#a78bfa" },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, color: "#a78bfa" },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, color: "#f472b6" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, color: "#f472b6" },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, color: "#a78bfa" },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.187, color: "#22c55e" },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, color: "#22c55e" },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, color: "#22c55e" },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, color: "#f472b6" },
];

const ARCS = [
  { from: [6.5244, 3.3792], to: [40.7128, -74.006] },
  { from: [40.7128, -74.006], to: [39.9042, 116.4074] },
  { from: [51.5074, -0.1278], to: [31.2304, 121.4737] },
  { from: [6.5244, 3.3792], to: [51.5074, -0.1278] },
  { from: [35.6762, 139.6503], to: [34.0522, -118.2437] },
  { from: [25.2048, 55.2708], to: [19.076, 72.8777] },
];

function ArcLine({ from, to }) {
  const points = useMemo(() => {
    const start = latLngToVec3(from[0], from[1], 2);
    const end = latLngToVec3(to[0], to[1], 2);
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.9);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(50);
  }, [from, to]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return <line geometry={geometry}><lineBasicMaterial color="#22d3ee" transparent opacity={0.55} /></line>;
}

function CityDot({ city, onSelect }) {
  const pos = latLngToVec3(city.lat, city.lng, 2.02);
  const [hover, setHover] = useState(false);
  return (
    <group position={pos}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect && onSelect(city); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <sphereGeometry args={[hover ? 0.05 : 0.032, 12, 12]} />
        <meshBasicMaterial color={city.color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={city.color} transparent opacity={0.25} />
      </mesh>
      {hover && (
        <Billboard>
          <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
            <div style={{ background: "rgba(0,0,0,0.85)", color: "#fff", fontSize: 10, padding: "4px 8px", borderRadius: 999, whiteSpace: "nowrap", border: `1px solid ${city.color}` }}>{city.name}, {city.country}</div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}

// STANDING BOX - Smaller, Transparent, Tappable
function StandingBox({ position, title, subtitle, color = "#22d3ee", onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <Billboard position={position}>
      <Html center distanceFactor={10} style={{ pointerEvents: "auto" }} zIndexRange={[30, 0]}>
        <div
          onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
          style={{
            width: hover ? 112 : 102,
            background: "rgba(2,12,24,0.62)",
            border: `1px solid ${color}`,
            borderRadius: 10,
            padding: "6px 7px",
            color: "#fff",
            fontFamily: "sans-serif",
            boxShadow: `0 0 14px ${color}55`,
            cursor: "pointer",
            textAlign: "left",
            backdropFilter: "blur(3px)",
            transform: hover ? "scale(1.05)" : "scale(1)",
            transition: "all 0.15s",
          }}
        >
          <div style={{ fontSize: 7, color, fontWeight: 800, letterSpacing: 0.5 }}>{subtitle}</div>
          <div style={{ fontSize: 9, fontWeight: 800, lineHeight: 1.25, marginTop: 3, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>● LIVE • TAP TO OPEN</div>
        </div>
      </Html>
    </Billboard>
  );
}

// REAL STONES - Rocky, bumpy, cratered
function RealAsteroid({ pos, size, color }) {
  const ref = useRef();
  const geo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(size, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const n = 1 + (Math.random() - 0.5) * 0.45;
      v.multiplyScalar(n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [size]);
  useFrame((_, delta) => { if (ref.current) { ref.current.rotation.x += delta * 0.4; ref.current.rotation.y += delta * 0.3; } });
  return (
    <group position={pos}>
      <mesh ref={ref} geometry={geo}>
        <meshStandardMaterial color={color} roughness={1} metalness={0.05} flatShading />
      </mesh>
      <mesh position={[size * 0.4, size * 0.3, size * 0.2]}>
        <sphereGeometry args={[size * 0.18, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={1} />
      </mesh>
    </group>
  );
}

function AsteroidBelt() {
  const group = useRef();
  const asteroids = useMemo(() => {
    const arr = [];
    const colors = ["#6b625c", "#8a7a6a", "#4a4a52", "#7a6a5a", "#5a534e", "#9a8a7a"];
    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.4 + Math.random() * 2.6;
      const y = (Math.random() - 0.5) * 2.4;
      const size = Math.random() < 0.08 ? 0.22 + Math.random() * 0.18 : 0.04 + Math.random() * 0.12;
      arr.push({ pos: [Math.cos(angle) * radius, y, Math.sin(angle) * radius], size, color: colors[i % colors.length] });
    }
    return arr;
  }, []);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.03; });
  return (
    <group ref={group}>
      {asteroids.map((a, i) => <RealAsteroid key={i} pos={a.pos} size={a.size} color={a.color} />)}
      <RealAsteroid pos={[2.9, 1.3, 2.1]} size={0.42} color="#7a6a5a" />
      <RealAsteroid pos={[-3.2, -1.1, 1.9]} size={0.34} color="#5a5a62" />
      <RealAsteroid pos={[0.5, -2.8, -3.4]} size={0.28} color="#8a7a6a" />
    </group>
  );
}

function EarthGroup({ news, scores, crypto, trading, onSelectCity, onSelectEarthBox }) {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const innerRef = useRef();

  const [earthMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    "https://unpkg.com/three-globe/example/img/earth-clouds.png",
  ]);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.07;
    if (innerRef.current) innerRef.current.rotation.y += delta * 0.05;
  });

  const topNews = (news || []).slice(0, 3);
  const liveScore = (scores || []).find((s) => s.live) || (scores || [])[0];
  const btcPrice = crypto?.price || trading?.cryptoList?.find(c => c.name === "BTC")?.price || 69330;
  const btcChange = crypto?.change ?? trading?.cryptoList?.find(c => c.name === "BTC")?.change ?? -5.6;

  return (
    <group ref={earthRef}>
      {/* REAL EARTH - Blue marble with continents */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial map={earthMap} roughness={0.7} metalness={0.05} />
      </mesh>
      {/* CLOUDS */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 48, 48]} />
        <meshStandardMaterial map={cloudsMap} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {/* ATMOSPHERE GLOW - Blue halo */}
      <mesh>
        <sphereGeometry args={[2.18, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.35, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
      {/* Subtle grid */}
      <mesh>
        <sphereGeometry args={[2.01, 24, 24]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.05} />
      </mesh>

      <group ref={innerRef}>
        {CITIES.map((c, i) => <CityDot key={i} city={c} onSelect={onSelectCity} />)}
        {ARCS.map((a, i) => <ArcLine key={i} from={a.from} to={a.to} />)}
      </group>

      {/* 1 - TRADING - FIXED */}
      <StandingBox
        position={latLngToVec3(40.7, -74, 2.45)}
        title={`Trading Live Market - BTC $${Number(btcPrice).toLocaleString()} ${Number(btcChange).toFixed(2)}%`}
        subtitle="TRADING LIVE MARKET"
        color="#22c55e"
        onClick={() => onSelectEarthBox && onSelectEarthBox("crypto")}
      />
      {/* 2 - WORLD NEWS - NAIJA */}
      <StandingBox
        position={latLngToVec3(6.5, 3.3, 2.45)}
        title={topNews[1]?.title || topNews[0]?.title || "World Live News"}
        subtitle={`${topNews[1]?.source || "BBC"} • NAIJA / WORLD`}
        color="#facc15"
        onClick={() => onSelectEarthBox && onSelectEarthBox("news", 1)}
      />
      {/* 3 - CHINA / WORLD NEWS */}
      <StandingBox
        position={latLngToVec3(39.9, 116.4, 2.45)}
        title={topNews[2]?.title || "China / World News"}
        subtitle={`${topNews[2]?.source || "BBC"} • CHINA / WORLD`}
        color="#ef4444"
        onClick={() => onSelectEarthBox && onSelectEarthBox("news", 2)}
      />
      {/* 4 - VIRAL */}
      <StandingBox
        position={latLngToVec3(51.5, -0.12, 2.45)}
        title="Viral Live Now - Tap to watch viral videos"
        subtitle="VIRAL • LIVE NOW"
        color="#f472b6"
        onClick={() => onSelectEarthBox && onSelectEarthBox("tiktok")}
      />
      {/* 5 - FOOTBALL */}
      <StandingBox
        position={latLngToVec3(48.85, 2.35, 2.45)}
        title={liveScore ? `${liveScore.home} ${liveScore.homeScore} - ${liveScore.awayScore} ${liveScore.away}` : "Football Live Score - Checking leagues..."}
        subtitle={`${liveScore?.league || "FOOTBALL"} • ${liveScore?.status || "LIVE"}`}
        color="#facc15"
        onClick={() => onSelectEarthBox && onSelectEarthBox("sport")}
      />
      {/* 6 - SYSTEM */}
      <StandingBox
        position={latLngToVec3(-26.2, 28.04, 2.45)}
        title="EVA System Check - All OK"
        subtitle="EVA SYSTEM • CHECK"
        color="#4ade80"
        onClick={() => onSelectEarthBox && onSelectEarthBox("hacker")}
      />
    </group>
  );
}

export default function EarthGlobe({ news, scores, crypto, trading, onSelectCity, onSelectNews, onSelectEarthBox }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas camera={{ position: [0, 0.5, 5.2], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-5, -2, -5]} intensity={0.6} color="#3b82f6" />
        <Stars radius={100} depth={50} count={3500} factor={4} saturation={0} fade speed={0.5} />
        <EarthGroup news={news} scores={scores} crypto={crypto} trading={trading} onSelectCity={onSelectCity} onSelectEarthBox={onSelectEarthBox} />
        <AsteroidBelt />
        <OrbitControls enableZoom enablePan={false} minDistance={3.2} maxDistance={8} enableDamping autoRotate={false} />
      </Canvas>
    </div>
  );
    }
