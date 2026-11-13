"use client";
import { useRef, useMemo, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Html, Billboard, OrbitControls, useTexture } from "@react-three/drei";
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
];

function Particles() {
  const ref = useRef();
  const { positions } = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.6 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return { positions };
  }, []);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#bae6fd" transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function OrbitRing({ onSelectCity }) {
  const ringRef = useRef();
  useFrame((_, delta) => { if (ringRef.current) ringRef.current.rotation.z += delta * 0.02; });
  return (
    <group ref={ringRef} rotation={[Math.PI / 2.35, 0, 0.25]}>
      <mesh>
        <torusGeometry args={[3.15, 0.012, 8, 140]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[3.15, 0.05, 8, 140]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {CITIES.slice(0, 8).map((c, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 3.15, Math.sin(angle) * 3.15, 0]}>
            <mesh onClick={(e) => { e.stopPropagation(); onSelectCity && onSelectCity(c); }}>
              <sphereGeometry args={[0.07, 12, 12]} />
              <meshBasicMaterial color={c.color} />
            </mesh>
            <mesh><sphereGeometry args={[0.14, 12, 12]} /><meshBasicMaterial color={c.color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

function FlyingDot({ from, to, color, speed = 0.25 }) {
  const ref = useRef();
  const curve = useMemo(() => {
    const s = latLngToVec3(from[0], from[1], 2.0);
    const e = latLngToVec3(to[0], to[1], 2.0);
    const mid = s.clone().add(e).multiplyScalar(0.5).normalize().multiplyScalar(2.6);
    return new THREE.QuadraticBezierCurve3(s, mid, e);
  }, [from, to]);
  useFrame((state) => {
    const t = (state.clock.elapsedTime * speed) % 1;
    if (ref.current) ref.current.position.copy(curve.getPoint(t));
  });
  return <mesh ref={ref}><sphereGeometry args={[0.045, 8, 8]} /><meshBasicMaterial color={color} /></mesh>;
}

function ArcLine({ from, to, color }) {
  const points = useMemo(() => {
    const start = latLngToVec3(from[0], from[1], 2.0);
    const end = latLngToVec3(to[0], to[1], 2.0);
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.6);
    return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(40);
  }, [from, to]);
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return <line geometry={geo}><lineBasicMaterial color={color} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} /></line>;
}

function CityDot({ city, onSelect }) {
  const pos = latLngToVec3(city.lat, city.lng, 2.0);
  const [hover, setHover] = useState(false);
  const ref = useRef();
  useFrame((state) => { if (ref.current) ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2 + city.lat) * 0.3); });
  return (
    <group position={pos}>
      <mesh ref={ref} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(city); }} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color={city.color} />
      </mesh>
      <mesh><sphereGeometry args={[0.13, 12, 12]} /><meshBasicMaterial color={city.color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {hover && <Billboard><Html center distanceFactor={10} style={{ pointerEvents: "none" }}><div style={{ background: "rgba(0,0,0,0.92)", color: "#fff", fontSize: 10, padding: "5px 8px", borderRadius: 10, whiteSpace: "nowrap", border: `1px solid ${city.color}` }}><div style={{ fontWeight: 800 }}>{city.name}, {city.country}</div><div style={{ fontSize: 9, color: city.color }}>{city.activity}</div></div></Html></Billboard>}
    </group>
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
    <mesh ref={ref} position={pos} geometry={geo}>
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function AsteroidBelt() {
  const group = useRef();
  const asteroids = useMemo(() => {
    const arr = [];
    const colors = ["#9a8a7a", "#6b625c", "#8a7a6a", "#5a534e"];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.6 + Math.random() * 2.0;
      arr.push({ pos: [Math.cos(angle) * radius, (Math.random() - 0.5) * 1.8, Math.sin(angle) * radius], size: 0.07 + Math.random() * 0.12, color: colors[i % colors.length] });
    }
    return arr;
  }, []);
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.03; });
  return (
    <group ref={group}>
      {asteroids.map((a, i) => <RealAsteroid key={i} pos={a.pos} size={a.size} color={a.color} />)}
      <RealAsteroid pos={[2.9, 1.2, 2.1]} size={0.32} color="#9a8a7a" />
      <RealAsteroid pos={[-3.2, -1.0, 1.9]} size={0.28} color="#6b625c" />
      <RealAsteroid pos={[0.4, -2.7, -3.3]} size={0.24} color="#8a7a6a" />
    </group>
  );
}

function EarthGroup({ onSelectCity }) {
  const earthRef = useRef();
  const shellRef = useRef();
  const floatRef = useRef();
  const earthTexture = useTexture("/earth.jpg");
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  useFrame((state, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.05;
    if (shellRef.current) shellRef.current.rotation.y -= delta * 0.015;
    if (floatRef.current) floatRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });

  return (
    <group ref={floatRef}>
      {/* SPINNING GROUP - Real Earth + Cities + Arcs spin together */}
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[1.95, 64, 64]} />
          <meshBasicMaterial map={earthTexture} transparent={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.9, 32, 32]} />
          <meshBasicMaterial color="#0a2a6b" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {CITIES.map((c, i) => <CityDot key={i} city={c} onSelect={onSelectCity} />)}
        {ARCS.map((a, i) => <ArcLine key={i} from={a.from} to={a.to} color={a.color} />)}
        {ARCS.map((a, i) => <FlyingDot key={`f${i}`} from={a.from} to={a.to} color={a.color} speed={0.18 + i * 0.04} />)}
      </group>

      {/* HEXAGON HOLOGRAM SHELL */}
      <group ref={shellRef}>
        <mesh>
          <icosahedronGeometry args={[2.12, 3]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.15, 18, 12]} />
          <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.18, 32, 32]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0.05} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ATMOSPHERE HALO */}
      <mesh><sphereGeometry args={[2.32, 32, 32]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.12} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[2.55, 32, 32]} /><meshBasicMaterial color="#22d3ee" transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>

      {/* NO BOXES HERE - CLEAN EARTH ONLY */}
    </group>
  );
}

export default function EarthGlobe({ onSelectCity }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas camera={{ position: [0, 0.4, 5.6], fov: 42 }} gl={{ antialias: false, alpha: true, powerPreference: "low-power" }} dpr={[1, 1.5]} style={{ background: "transparent" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <Stars radius={100} depth={50} count={800} factor={4} saturation={0} fade speed={0.5} />
          <EarthGroup onSelectCity={onSelectCity} />
          <Particles />
          <OrbitRing onSelectCity={onSelectCity} />
          <AsteroidBelt />
          <OrbitControls enableZoom enablePan={false} minDistance={3.4} maxDistance={8} enableDamping />
        </Suspense>
      </Canvas>
    </div>
  );
        }
