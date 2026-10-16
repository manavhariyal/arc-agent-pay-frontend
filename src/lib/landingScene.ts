// @ts-nocheck
// Landing hero: a real 3D extrusion of the logo, orbiting coins, rings and particles. Loaded lazily by Landing.tsx.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

function canvasTex(size, draw){
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export function startLandingScene({ stage, canvas, state: st, base }: { stage: HTMLElement; canvas: HTMLCanvasElement; state: any; base: string }) {
  let disposed = false;
  let cleanup: (() => void) | undefined;
  (async () => {
    try {

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0, 7.2);

  const key = new THREE.PointLight(0x2f8bff, 70, 20, 2); key.position.set(-3.2, 2.2, 3.4); scene.add(key);
  const fill = new THREE.PointLight(0x22f0ff, 60, 20, 2); fill.position.set(3.4, -1.2, 3.2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xbfe6ff, 1.6); rim.position.set(0, 3, -3); scene.add(rim);

  const [shapes, tex] = await Promise.all([
    fetch(base + 'lp/shape.json').then(r => r.json()),
    new THREE.TextureLoader().loadAsync(base + 'lp/logo.png')
  ]);
  if (disposed) { renderer.dispose(); return; }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  /* the logo outline, extruded into a solid object */
  const K = 0.003485, CX = 548.4, CY = 437.4, DEPTH = 0.22;
  const mk = pts => pts.map(([x, y]) => new THREE.Vector2((x - CX) * K, -(y - CY) * K));
  const shapeObjs = shapes.map(s => { const sh = new THREE.Shape(mk(s.outer)); s.holes.forEach(h => sh.holes.push(new THREE.Path(mk(h)))); return sh; });
  const geo = new THREE.ExtrudeGeometry(shapeObjs, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.02, bevelSegments: 3, curveSegments: 1, steps: 1 });
  geo.translate(0, 0, -DEPTH / 2);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    uv.setXY(i, (x / K + CX) / 1024, 1 - (CY - y / K) / 1024);
  }
  uv.needsUpdate = true;

  const faceMat = new THREE.MeshPhysicalMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.16, roughness: 0.4, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.18, envMapIntensity: 0.45 });
  const sideMat = new THREE.MeshPhysicalMaterial({ color: 0x0f7bff, emissive: 0x0a4fd8, emissiveIntensity: 0.6, roughness: 0.22, metalness: 0.65, clearcoat: 1, envMapIntensity: 1.4 });
  const logo = new THREE.Mesh(geo, [faceMat, sideMat]);
  const rig = new THREE.Group(); rig.add(logo);

  /* orbiting coins */
  const coinTex = canvasTex(256, (g, s) => {
    const r = g.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2);
    r.addColorStop(0, '#0d2a6b'); r.addColorStop(1, '#06143a'); g.fillStyle = r; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#22f0ff'; g.lineWidth = 14; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 16, 0, 7); g.stroke();
    g.fillStyle = '#22f0ff'; g.font = '800 150px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', s / 2, s / 2 + 8);
  });
  const coinGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.05, 48); coinGeo.rotateX(Math.PI / 2);
  const sideC = new THREE.MeshStandardMaterial({ color: 0x22d8ff, metalness: 0.8, roughness: 0.25, emissive: 0x0a7fb8, emissiveIntensity: 0.6 });
  const faceC = new THREE.MeshStandardMaterial({ map: coinTex, emissiveMap: coinTex, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.35, metalness: 0.3 });
  const orbit = new THREE.Group(); orbit.rotation.x = 0.35; orbit.rotation.z = 0.12;
  const coins = [];
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(coinGeo, [sideC, faceC, faceC]); orbit.add(c); coins.push(c); }

  const hero = new THREE.Group(); hero.add(rig); hero.add(orbit); scene.add(hero);

  /* stage floor: rings, light pool, beam, rising particles */
  const ground = new THREE.Group(); scene.add(ground);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.016, 12, 200), new THREE.MeshBasicMaterial({ color: 0x7fe0ff })); ring.rotation.x = Math.PI / 2; ground.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.01, 8, 200), new THREE.MeshBasicMaterial({ color: 0x2f8bff, transparent: true, opacity: 0.55 })); ring2.rotation.x = Math.PI / 2; ground.add(ring2);
  const poolTex = canvasTex(256, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(70,170,255,.9)'); r.addColorStop(.5, 'rgba(30,110,255,.35)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.3, 64), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 })); pool.rotation.x = -Math.PI / 2; pool.position.y = -0.01; ground.add(pool);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.25, 1.9, 64, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { c: { value: new THREE.Color(0x2aa8ff) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 c; void main(){ float a = pow(1.0 - vUv.y, 1.7) * 0.26; gl_FragColor = vec4(c * a, a); }'
  }));
  beam.position.y = 0.95; ground.add(beam);

  const PN = 150, pPos = new Float32Array(PN * 3), pSpd = new Float32Array(PN), pPh = new Float32Array(PN);
  for (let i = 0; i < PN; i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 1.55; pPos[i * 3] = Math.cos(a) * r; pPos[i * 3 + 1] = Math.random() * 3.2; pPos[i * 3 + 2] = Math.sin(a) * r * 0.5; pSpd[i] = 0.14 + Math.random() * 0.36; pPh[i] = Math.random() * 6.283; }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const dotTex = canvasTex(64, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(120,220,255,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.07, map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x9fe6ff, sizeAttenuation: true }));
  ground.add(particles);

  /* post: soft bloom, composited over the photo layers with a screen blend */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.6, 0.92); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let baseY = 0, fit = 1, viewH = 4.13;
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    viewH = 2 * 7.2 * Math.tan(THREE.MathUtils.degToRad(16));
    fit = Math.min(0.82, 1.1 * camera.aspect);
    baseY = (0.5 - 0.5) * viewH;
  }
  const ro = new ResizeObserver(layout); ro.observe(stage); layout();

  const clock = new THREE.Clock(); let last = 0; let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime(), dt = Math.min(0.05, t - last); last = t;
    if (disposed || st.ps > 0.985 || document.hidden) return;
    const p = st.ps;
    const bob = Math.sin(t * 0.9) * 0.05;
    hero.position.set(0, baseY + bob + p * 1.0, 0);
    hero.scale.setScalar(fit * (1 + p * 0.16));
    rig.rotation.y = Math.sin(t * 0.5) * 0.3 + st.mx * 0.45;
    rig.rotation.x = Math.cos(t * 0.37) * 0.05 + st.my * 0.16;
    ground.position.set(0, baseY - 0.72 * fit + p * 1.0, 0);
    ground.scale.setScalar(fit);
    ring.material.color.setHSL(0.54, 1, 0.65 + Math.sin(t * 2) * 0.05);
    for (let i = 0; i < PN; i++) {
      pPos[i * 3 + 1] += pSpd[i] * dt; pPos[i * 3] += Math.sin(t + pPh[i]) * 0.0012;
      if (pPos[i * 3 + 1] > 3.2) pPos[i * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;
    const R = 1.9;
    coins.forEach((c, i) => {
      const a = t * 0.5 + i * Math.PI / 2;
      c.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
      c.lookAt(camera.position); c.rotateY(Math.sin(t * 1.7 + i) * 0.5);
    });
    key.position.x = -3.2 + st.mx * 1.2; key.position.y = 2.2 - st.my * 0.8;
    camera.position.z = 7.2 - p * 1.4;
    composer.render();
  }
  frame();
  cleanup = () => { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); composer.dispose(); renderer.dispose(); geo.dispose(); pmrem.dispose(); };
    } catch (err) {
      console.warn("3D hero unavailable", err);
      stage.classList.add("no-gl");
    }
  })();
  return () => { disposed = true; cleanup?.(); };
}
