"use client";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Html, Billboard, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Convert lat/lng to 3D position on globe
function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Real cities with real lat/lng
const CITIES = [
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, type: "naija" },
  { name: "Abuja", country: "Nigeria", lat: 9.0765, lng: 7.3986, type: "naija" },
  { name: "Benin City", country: "Nigeria", lat: 6.335, lng: 5.603, type: "naija" },
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.006, type: "usa" },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, type: "usa" },
  { name: "Washington", country: "USA", lat: 38.9072, lng: -77.0369, type: "usa" },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, type: "china" },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, type: "china" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, type: "europe" },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, type: "europe" },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, type: "europe" },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, type: "asia" },
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, type: "asia" },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, type: "europe" },
  { name: "Accra", country: "Ghana", lat: 5.6037, lng: -0.187, type: "africa" },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, type: "africa" },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, type: "africa" },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, type: "asia" },
];

// Arcs - sync lines between cities
const ARCS = [
  { from: [6.5244, 3.3792], to: [40.7128, -74.006] }, // Lagos -> New York
  { from: [40.7128, -74.006], to: [39.9042, 116.4074] }, // NY -> Beijing
  { from: [51.5074, -0.1278], to: [31.2304, 121.4737] }, // London -> Shanghai
  { from: [6.5244, 3.3792], to: [51.5074, -0.1278] }, // Lagos -> London
  { from: [35.6762, 139.6503], to: [34.0522, -118.2437] }, // Tokyo -> LA
  { from: [25.2048, 55.2708], to: [19.076, 72.8777] }, // Dubai -> Mumbai
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
  return <line geometry={geometry}><lineBasicMaterial color="#22d3ee" transparent opacity={0.6} /></line>;
}

function CityDot({ city, onSelect }) {
  const pos = latLngToVec3(city.lat, city.lng, 2.02);
  const [hover, setHover] = useState(false);
  return (
    <group position={pos}>
      <mesh onClick={() => onSelect && onSelect(city)} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <sphereGeometry args={[hover ? 0.045 : 0.028, 12, 12]} />
        <meshBasicMaterial color={city.type === "naija" ? "#facc15" : city.type === "usa" ? "#22d3ee" : city.type === "china" ? "#ef4444" : "#4ade80"} />
      </mesh>
      {/* Glow ring around dot */}
      <mesh>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

// STANDING BOX - This is the key: it stands on earth, rotates with earth, but faces you
function StandingBox({ position, title, subtitle, color = "#22d3ee", onClick }) {
  return (
    <Billboard position={position}>
      <Html center distanceFactor={10} style={{ pointerEvents: "auto" }} zIndexRange={[30, 0]}>
        <div
          onClick={onClick}
          style={{
            width: 118,
            background: "rgba(2,12,24,0.92)",
            border: `1px solid ${color}`,
            borderRadius: 12,
            padding: "7px 8px",
            color: "#fff",
            fontFamily: "sans-serif",
            boxShadow: `0 0 18px ${color}66`,
            cursor: "pointer",
            textAlign: "left",
            backdropFilter: "blur(4px)",
          }}
        >
          <div style={{ fontSize: 8, color, fontWeight: 800, letterSpacing: 0.5 }}>{subtitle}</div>
          <div style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.25, marginTop: 3, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>● LIVE • TAP</div>
        </div>
      </Html>
    </Billboard>
  );
}

// ASTEROIDS / METEOROIDS - Big and small stones around earth
function AsteroidBelt() {
  const group = useRef();
  const asteroids = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 140; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.2 + Math.random() * 2.8; // 3.2 to 6.0 away from earth
      const y = (Math.random() - 0.5) * 2.2; // spread up/down
      const size = Math.random() < 0.12 ? 0.18 + Math.random() * 0.18 : 0.03 + Math.random() * 0.1; // 12% big stones, rest small
      arr.push({
        pos: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
        size,
        rot: [Math.random() * 3, Math.random() * 3, Math.random() * 3],
        speed: 0.1 + Math.random() * 0.4,
      });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.03; // Whole belt rotates slowly
      group.current.children.forEach((child, i) => {
        child.rotation.x += delta * 0.2;
        child.rotation.y += delta * 0.2;
      });
    }
  });

  return (
    <group ref={group}>
      {asteroids.map((a, i) => (
        <mesh key={i} position={a.pos} rotation={a.rot}>
          <dodecahedronGeometry args={[a.size, 0]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#8a7a6a" : i % 3 === 1 ? "#6b625c" : "#4a4a52"} roughness={0.9} metalness={0.1} flatShading />
        </mesh>
      ))}
      {/* A few very big hero asteroids like in your video - close to camera */}
      <mesh position={[2.8, 1.2, 2.2]} rotation={[0.5, 0.3, 0]}>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-3.1, -1.0, 1.8]} rotation={[1, 0.5, 0]}>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#5a5a62" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

// COSMIC RING - Thin glowing ring around earth like in video
function CosmicRing() {
  const ref = useRef();
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.z += delta * 0.02; });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.2, 0, 0.3]}>
      <ringGeometry args={[3.05, 3.15, 128]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

function EarthGroup({ news, scores, crypto, trading, onSelectCity, onSelectNews }) {
  const earthRef = useRef();
  const innerRef = useRef();

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05; // Earth rotates slowly
    if (innerRef.current) innerRef.current.rotation.y += delta * 0.05;
  });

  // Top 3 news for standing boxes - they appear as new news comes
  const topNews = (news || []).slice(0, 3);
  const liveScore = (scores || []).find((s) => s.live) || (scores || [])[0];

  return (
    <group ref={earthRef}>
      {/* Main Earth - Transparent, dark, glowing */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#0a1a2f" transparent opacity={0.92} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Wireframe continents - makes it look like virtual world, you can see through */}
      <mesh>
        <sphereGeometry args={[2.01, 24, 24]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.08} />
      </mesh>
      {/* Atmosphere glow - outer glow */}
      <mesh>
        <sphereGeometry args={[2.18, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.35, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>

      {/* Cities inside earth group - so they rotate with earth */}
      <group ref={innerRef}>
        {CITIES.map((c, i) => (
          <CityDot key={i} city={c} onSelect={onSelectCity} />
        ))}
        {ARCS.map((a, i) => (
          <ArcLine key={i} from={a.from} to={a.to} />
        ))}
      </group>

      {/* STANDING BOXES - They rotate with earth, but face you */}
      {topNews[0] && (
        <StandingBox
          position={latLngToVec3(40.7, -74, 2.45)}
          title={topNews[0].title}
          subtitle={`${topNews[0].source} • WORLD TOP`}
          color="#22d3ee"
          onClick={() => onSelectNews && onSelectNews(0)}
        />
      )}
      {topNews[1] && (
        <StandingBox
          position={latLngToVec3(6.5, 3.3, 2.45)}
          title={topNews[1].title}
          subtitle={`${topNews[1].source} • NAIJA / WORLD`}
          color="#facc15"
          onClick={() => onSelectNews && onSelectNews(1)}
        />
      )}
      {topNews[2] && (
        <StandingBox
          position={latLngToVec3(39.9, 116.4, 2.45)}
          title={topNews[2].title}
          subtitle={`${topNews[2].source} • CHINA / WORLD`}
          color="#ef4444"
          onClick={() => onSelectNews && onSelectNews(2)}
        />
      )}
      {crypto?.price && (
        <StandingBox
          position={latLngToVec3(51.5, -0.12, 2.45)}
          title={`BTC $${Number(crypto.price).toLocaleString()} • ${Number(crypto.change || 0).toFixed(2)}%`}
          subtitle="CRYPTO • LIVE"
          color="#22c55e"
        />
      )}
      {liveScore && (
        <StandingBox
          position={latLngToVec3(48.85, 2.35, 2.45)}
          title={`${liveScore.home} ${liveScore.homeScore} - ${liveScore.awayScore} ${liveScore.away}`}
          subtitle={`${liveScore.league} • ${liveScore.status}`}
          color="#f472b6"
        />
      )}
    </group>
  );
}

export default function EarthGlobe({ news, scores, crypto, trading, onSelectCity, onSelectNews }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas camera={{ position: [0, 0.5, 5.2], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#67e8f9" />
        <pointLight position={[-5, -2, -5]} intensity={0.6} color="#3b82f6" />

        {/* Stars - shining stars around earth */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

        {/* Cosmic blue light - big soft glow behind earth */}
        <mesh position={[0, 0, -3]}>
          <planeGeometry args={[12, 12]} />
          <meshBasicMaterial color="#1e3a8a" transparent opacity={0.15} />
        </mesh>

        <EarthGroup news={news} scores={scores} crypto={crypto} trading={trading} onSelectCity={onSelectCity} onSelectNews={onSelectNews} />

        {/* Asteroids + Cosmic Ring - OUTSIDE earth group so they rotate on their own slow orbit, not with earth spin */}
        <AsteroidBelt />
        <CosmicRing />

        <OrbitControls enableZoom enablePan={false} minDistance={3.2} maxDistance={8} enableDamping autoRotate={false} />
      </Canvas>
    </div>
  );
}
