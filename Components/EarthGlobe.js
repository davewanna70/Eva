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
  return <line geometry={geo}><lineBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} /></line>;
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
      <mesh><sphereGeometry args={[0.13, 12, 12]} /><meshBasicMaterial color={city.color} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {hover && <Billboard><Html center distanceFactor={10} style={{ pointerEvents: "none" }}><div style={{ background: "rgba(0,0,0,0.92)", color: "#fff", fontSize: 10, padding: "5px 8px", borderRadius: 10, whiteSpace: "nowrap", border: `1px solid ${city.color}` }}><div style={{ fontWeight: 800 }}>{city.name}, {city.country}</div><div style={{ fontSize: 9, color: city.color }}>{city.activity}</div></div></Html></Billboard>}
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
      {/* DIMMER EARTH - No more too bright */}
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[1.95, 64, 64]} />
          <meshBasicMaterial map={earthTexture} color="#8fa8c8" toneMapped={true} transparent={false} />
        </mesh>
        {CITIES.map((c, i) => <CityDot key={i} city={c} onSelect={onSelectCity} />)}
        {ARCS.map((a, i) => <ArcLine key={i} from={a.from} to={a.to} color={a.color} />)}
        {ARCS.map((a, i) => <FlyingDot key={`f${i}`} from={a.from} to={a.to} color={a.color} speed={0.18 + i * 0.04} />)}
      </group>

      {/* SECOND TRANSPARENT LAYER - BIGGER + MORE VISIBLE, NO LINES, NO WIREFRAME */}
      <group ref={shellRef}>
        <mesh>
          <sphereGeometry args={[2.35, 32, 32]} />
          <meshBasicMaterial color="#a5f3fc" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.45, 32, 32]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ATMOSPHERE HALO - Softer now */}
      <mesh><sphereGeometry args={[2.55, 32, 32]} /><meshBasicMaterial color="#3b82f6" transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[2.75, 32, 32]} /><meshBasicMaterial color="#22d3ee" transparent opacity={0.03} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  );
}

export default function EarthGlobe({ onSelectCity }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas camera={{ position: [0, 0.4, 5.6], fov: 42 }} gl={{ antialias: false, alpha: true, powerPreference: "low-power" }} dpr={[1, 1.5]} style={{ background: "transparent" }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.6} />
          <EarthGroup onSelectCity={onSelectCity} />
          <OrbitControls enableZoom enablePan={false} minDistance={3.4} maxDistance={8} enableDamping />
        </Suspense>
      </Canvas>
    </div>
  );
        }
