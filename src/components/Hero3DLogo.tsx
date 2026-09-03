import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * A simple, robust circular 3D badge showing the Arc Agent Pay logo.
 * Deliberately avoids: environment-map reflections (external CDN fetch that
 * can fail in production and render materials near-black), and any rotation
 * around the vertical axis (which turns the flat logo face away from camera
 * and makes it appear to "disappear"). The only motion is a gentle vertical
 * float — the logo faces the camera at all times.
 */
function LogoBadge() {
  const texture = useLoader(THREE.TextureLoader, "/arc-logo.png");
  const groupRef = useRef<THREE.Group>(null);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  useFrame((state) => {
    if (!groupRef.current) return;
    // Tiny, subtle tilt only — never enough to turn the face away from camera.
    groupRef.current.rotation.y = state.pointer.x * 0.06;
    groupRef.current.rotation.x = -state.pointer.y * 0.04;
  });

  return (
    <Float speed={1.2} rotationIntensity={0} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Disc base — simple matte material, no environment-map dependency */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.05, 0.14, 64]} />
          <meshStandardMaterial color="#0a1220" metalness={0.15} roughness={0.55} />
        </mesh>
        {/* Logo face — flat circular plane, always facing forward */}
        <mesh position={[0, 0, 0.071]}>
          <circleGeometry args={[0.98, 64]} />
          <meshStandardMaterial map={texture} transparent roughness={0.5} metalness={0.05} />
        </mesh>
      </group>
    </Float>
  );
}

export function Hero3DLogo() {
  return (
    <div className="w-full h-[220px] sm:h-[240px] relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.2], fov: 32 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <directionalLight
            position={[3, 4, 4]}
            intensity={2}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-3, 1, 2]} intensity={5} color="#0A84FF" />
          <pointLight position={[2, -1, 3]} intensity={2} color="#22F0FF" />
          <ambientLight intensity={0.5} />

          <LogoBadge />
        </Suspense>
      </Canvas>
    </div>
  );
}
