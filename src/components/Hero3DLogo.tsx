import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";

/**
 * A real, lit 3D badge rendering the Arc Agent Pay mark — not a CSS image with
 * a drop-shadow. Uses actual WebGL lighting, an environment map for reflections,
 * a real ground shadow, and gentle physically-plausible floating motion.
 */
function LogoBadge() {
  const texture = useLoader(THREE.TextureLoader, "/arc-logo.png");
  const meshRef = useRef<THREE.Group>(null);

  // Give the PNG proper color handling so it doesn't look washed out under lighting.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const roundedRectShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 2.6, h = 2.6, r = 0.42;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return shape;
  }, []);

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.045,
      bevelSegments: 8,
      curveSegments: 24,
    }),
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = Math.sin(t * 0.35) * 0.18;
    meshRef.current.rotation.x = Math.sin(t * 0.25) * 0.05 + 0.04;
    // subtle mouse-driven parallax
    meshRef.current.rotation.y += state.pointer.x * 0.1;
    meshRef.current.rotation.x += -state.pointer.y * 0.05;
  });

  return (
    <Float speed={1.4} rotationIntensity={0} floatIntensity={0.7}>
      <group ref={meshRef}>
        <mesh castShadow receiveShadow>
          <extrudeGeometry args={[roundedRectShape, extrudeSettings]} />
          <meshPhysicalMaterial
            color="#0a1220"
            metalness={0.35}
            roughness={0.28}
            clearcoat={0.6}
            clearcoatRoughness={0.25}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* Logo face — rigidly attached to the badge so it rotates together, never drifts */}
        <mesh position={[0, 0, extrudeSettings.depth + 0.002]}>
          <planeGeometry args={[2.15, 2.15]} />
          <meshPhysicalMaterial
            map={texture}
            transparent
            roughness={0.4}
            clearcoat={0.3}
            metalness={0.05}
            envMapIntensity={0.8}
          />
        </mesh>
      </group>
    </Float>
  );
}

export function Hero3DLogo() {
  return (
    <div className="w-full h-[420px] sm:h-[460px] relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.3, 5.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Key light — the main directional highlight, slightly warm */}
          <directionalLight
            position={[3, 4, 4]}
            intensity={2.2}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {/* Rim/fill light using the brand blue, from behind-left */}
          <pointLight position={[-3, 1, -2]} intensity={6} color="#0A84FF" />
          {/* Cool fill from below-right so the underside isn't pure black */}
          <pointLight position={[2, -2, 2]} intensity={2} color="#22F0FF" />
          <ambientLight intensity={0.25} />

          <LogoBadge />

          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={0.55}
            scale={8}
            blur={2.6}
            far={2}
            color="#0A84FF"
          />
          <Environment preset="city" environmentIntensity={0.6} />
        </Suspense>
      </Canvas>
    </div>
  );
}
