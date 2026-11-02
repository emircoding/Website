/* ==========================================================================
   Echtes 3D-Auto im Hero (three.js + glTF-Modell) mit Drift
   Modell: Karol Miklas (Sketchfab), CC BY-SA 4.0 – vollständige Angabe
   im Impressum. Bearbeitet: Logos/Wappen/Schriftzüge entfernt, eigenes
   Kennzeichen, Lack seidenmatt, Geometrie vereinfacht und komprimiert.
   Die bearbeitete Fassung (assets/3d/auto.glb) steht unter CC BY-SA 4.0.
   Ablauf: Beim Laden driftet der Wagen von links durch das „NAGOLD“ bis in
   die Mitte. Beim Scrollen: Licht an, Burnout, dann driftet er rechts hinaus.
   Ohne WebGL (oder wenn etwas nicht lädt) bleibt das gezeichnete Auto.
   ========================================================================== */
import * as THREE from "three";
import { GLTFLoader } from "../vendor/three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "../vendor/three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "../vendor/three/addons/libs/meshopt_decoder.module.js";

const root = document.documentElement;
const hero = document.querySelector(".hero");
const stage = hero && hero.querySelector(".hero__car-wrap");
const svg = hero && hero.querySelector("svg.hero__car");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
  catch (e) { return false; }
}

const api = { ready: false, state: { lights: 0, tail: 0, burn: 0, g: 0 }, anchors: null, canvas: null };
let resolveReady;
api.whenReady = new Promise((r) => (resolveReady = r));
window.AZN3D = api;

const enabled = !(window.AZN_CONFIG && window.AZN_CONFIG.auto3d === false);
if (enabled && hero && stage && svg && webglOK()) init().catch((e) => { console.warn("3D-Auto nicht geladen:", e); resolveReady(false); });
else resolveReady(false);

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

async function init() {
  const canvas = document.createElement("canvas");
  canvas.className = "hero__car3d";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Sportwagen in 3D, der ins Bild driftet");
  api.canvas = canvas;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.06).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 7, 5);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 0.7));

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(new URL("../3d/auto.glb", import.meta.url).href);
  const car = gltf.scene;
  car.updateMatrixWorld(true);

  // --- Ausrichtung: Front zeigt nach +X (rechts), Kamera steht auf +Z ---
  const centerOf = (o) => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
  const find = (...names) => { for (const n of names) { const o = car.getObjectByName(n); if (o) return o; } return null; };
  const axleA = find("Cylinder000", "Cylinder.000");
  const axleB = find("Cylinder001", "Cylinder.001");
  const bumper = find("bumper_front001", "bumper_front.001");
  if (!axleA || !axleB) throw new Error("Räder nicht gefunden");
  const cA = centerOf(axleA), cB = centerOf(axleB), cBump = bumper ? centerOf(bumper) : cA;
  const frontAxle = cA.distanceTo(cBump) < cB.distanceTo(cBump) ? axleA : axleB;
  const rearAxle = frontAxle === axleA ? axleB : axleA;
  const fwd = centerOf(frontAxle).sub(centerOf(rearAxle)).setY(0).normalize();
  car.rotation.y = Math.atan2(fwd.z, fwd.x);
  const rig = new THREE.Group(); // bewegt/dreht das ganze Auto (Drift)
  rig.add(car);
  scene.add(rig);
  rig.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(car);
  const c0 = box.getCenter(new THREE.Vector3());
  car.position.x -= c0.x; car.position.z -= c0.z; car.position.y -= box.min.y;
  rig.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(car);
  const size = box.getSize(new THREE.Vector3()); // x = Länge, y = Höhe, z = Breite

  // --- Materialien: seidenmatt statt Hochglanz ---
  const lights = { head: [], tail: [] };
  car.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    const m = o.material; if (!m) return;
    switch (m.name) {
      case "paint":
        m.color.set(0x8c8f94); m.metalness = 0.5; m.roughness = 0.46; m.metalnessMap = null; m.roughnessMap = null;
        m.envMapIntensity = 0.85; if ("clearcoat" in m) m.clearcoat = 0; m.needsUpdate = true; break;
      case "coat": o.visible = false; break; // Klarlack-Schicht = starker Glanz → aus
      case "silver": m.roughness = 0.38; m.envMapIntensity = 0.9; break;
      case "window": m.envMapIntensity = 0.8; break;
      case "lights": m.emissive = new THREE.Color(0xeef3ff); lights.head.push(m); break;
      case "tex_shiny": lights.tail.push(m); break;
    }
  });

  // --- Räder: Felge/Reifen drehen um die Achsmitte, Bremssättel (Material.001) bleiben stehen ---
  const axleWorld = new THREE.Vector3(0, 0, 1); // Querachse zeigt zur Kamera
  function makeSpinner(axle) {
    const isCaliper = (c) => { let k = false; c.traverse((x) => { if (x.isMesh && x.material && x.material.name === "Material.001") k = true; }); return k; };
    const spinParts = axle.children.filter((c) => !isCaliper(c));
    const bb = new THREE.Box3(); spinParts.forEach((c) => bb.expandByObject(c));
    const center = bb.getCenter(new THREE.Vector3());
    const pivot = new THREE.Group();
    axle.add(pivot);
    pivot.position.copy(axle.worldToLocal(center.clone()));
    pivot.updateMatrixWorld(true);
    spinParts.forEach((c) => pivot.attach(c));
    const pq = new THREE.Quaternion(); axle.getWorldQuaternion(pq);
    return { pivot, axis: axleWorld.clone().applyQuaternion(pq.invert()).normalize(), radius: bb.getSize(new THREE.Vector3()).y / 2 };
  }
  const front = makeSpinner(frontAxle), rear = makeSpinner(rearAxle);
  const wheelR = rear.radius || size.y * 0.33;
  const qTmp = new THREE.Quaternion();
  const spin = (w, a) => { qTmp.setFromAxisAngle(w.axis, -a); w.pivot.quaternion.premultiply(qTmp); };

  // --- Schatten (dreht und fährt mit) ---
  const sh = document.createElement("canvas"); sh.width = sh.height = 256;
  const g2 = sh.getContext("2d"), grd = g2.createRadialGradient(128, 128, 8, 128, 128, 128);
  grd.addColorStop(0, "rgba(0,0,0,0.6)"); grd.addColorStop(0.5, "rgba(0,0,0,0.26)"); grd.addColorStop(0.85, "rgba(0,0,0,0.04)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  g2.fillStyle = grd; g2.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 1.2, size.z * 1.45), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.003;
  rig.add(shadow);

  // --- Lichtschein vorne/hinten ---
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const r = x.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = r; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const glow = (color, x, y, z, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); sp.position.set(x, y, z); sp.scale.set(s, s * 0.55, 1); rig.add(sp); return sp; };
  const headGlow = glow(0xeef3ff, size.x * 0.47, size.y * 0.42, size.z * 0.36, size.x * 0.22);
  const tailGlow = glow(0xff2a2a, -size.x * 0.48, size.y * 0.5, size.z * 0.3, size.x * 0.18);

  // --- Bühne: Canvas über die ganze Startfläche, Auto parkt dort, wo vorher das gezeichnete Auto stand ---
  hero.appendChild(canvas);
  const camera = new THREE.PerspectiveCamera(14, 2, 0.1, 400);
  let W = 1, H = 1, startX = -10, exitX = 10, carPx = 600, dirty = true;
  const letter = hero.querySelector(".hero__word:not(.hero__word--outline) span");
  const offTop = (el) => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
  function layout() {
    W = hero.clientWidth; H = hero.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 2 : 1.6);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    const hr = hero.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    carPx = Math.min(sr.width * 0.92, W * (W < 700 ? 0.94 : 0.98));
    const tx = sr.left - hr.left + sr.width / 2;
    let ty = sr.bottom - hr.top - sr.height * 0.06;
    // Dach soll im oberen Drittel der Buchstaben stehen → Auto steht sichtbar VOR dem Schriftzug
    // (offsetTop statt getBoundingClientRect: unabhängig von Buchstaben-Animation und Parallax)
    if (letter) {
      const lt = offTop(letter) - offTop(hero), lh = letter.offsetHeight;
      ty = Math.min(ty, lt + lh * 0.3 + carPx * (size.y / size.x) * 1.08);
    }
    camera.aspect = W / H;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const d = (H * size.x) / (2 * tanHalf * carPx);
    camera.clearViewOffset();
    camera.position.set(0, size.y * 1.7, d);
    camera.lookAt(0, size.y * 0.4, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    // Bodenmitte des Autos genau auf den Zielpunkt schieben
    const p = new THREE.Vector3(0, 0, 0).project(camera);
    const sx = (p.x + 1) / 2 * W, sy = (1 - p.y) / 2 * H;
    camera.setViewOffset(W, H, sx - tx, sy - ty, W, H);
    const pxPerUnit = H / (2 * d * tanHalf);
    startX = -(tx + carPx * 0.9) / pxPerUnit;   // links außerhalb
    exitX = (W - tx + carPx * 0.9) / pxPerUnit; // rechts außerhalb
    dirty = true;
  }
  layout();
  window.addEventListener("resize", layout);

  // --- Rauch über die 2D-Rauchschicht von main.js ---
  const v = new THREE.Vector3();
  const toScreen = (local) => { v.copy(local); rig.localToWorld(v); v.project(camera); const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; };
  const rearX = rig.worldToLocal(centerOf(rearAxle).clone()).x;
  const tireNear = new THREE.Vector3(rearX, 0.03, size.z * 0.42), tireFar = new THREE.Vector3(rearX, 0.03, -size.z * 0.42);
  const exhaust = new THREE.Vector3(-size.x * 0.5, size.y * 0.22, 0);
  api.anchors = () => ({ tire: toScreen(tireNear), exhaust: toScreen(exhaust), scale: carPx / 900 });
  const smoke = (kind, p, k) => { if (window.AZN_SMOKE) window.AZN_SMOKE(kind, p.x, p.y, k); };

  // --- Ablauf ---
  const INTRO = window.AZN_INTRO_S || 3.1; // Sekunden Drift-Einfahrt
  const A = 0.6;     // Driftwinkel (~34°)
  let introT0 = null, introDone = false, lastX = 0, acc = 0, lastT = performance.now(), visible = true;
  if (root.classList.contains("is-ready") || reduce) introDone = true; // spät geladen → direkt parken
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(hero);

  function introPose(u) {
    const x = startX * (1 - easeOutCubic(u));
    // Heck kommt rein, Gegenlenken, kleiner Überschwinger, gerade stehen
    let yaw = A * (1 - Math.exp(-u * 14)) * Math.exp(-Math.max(0, u - 0.5) * 6.5);
    if (u > 0.72) yaw -= 0.09 * A * Math.sin(Math.PI * smooth(0.72, 1, u));
    return { x, yaw, drift: Math.abs(yaw) / A };
  }

  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    if (!visible) return;
    if (!introDone && introT0 === null && root.classList.contains("is-ready")) introT0 = t;

    let x = 0, yaw = 0, drift = 0;
    if (!introDone) {
      if (introT0 === null) x = startX;
      else {
        const u = clamp01((t - introT0) / 1000 / INTRO);
        const p = introPose(u); x = p.x; yaw = p.yaw; drift = p.drift;
        if (u >= 1) { introDone = true; document.dispatchEvent(new CustomEvent("azn:carparked")); }
      }
    }
    // Scrollen: Burnout (leichtes Schwänzeln), dann seitlich hinausdriften
    const S = api.state, g = clamp01(S.g || 0), burn = S.burn || 0;
    const go = Math.pow(g, 2.1);
    x += exitX * go;
    yaw += 0.55 * smooth(0, 0.45, g) * (1 - 0.35 * g) + Math.sin(t / 55) * 0.03 * burn;
    drift = Math.max(drift, smooth(0, 0.35, g) * (1 - g));

    rig.position.x = x;
    rig.rotation.y = yaw;
    rig.position.y = burn > 0.05 ? (Math.random() - 0.5) * 0.004 * burn : 0;

    // Räder: Abrollen + Durchdrehen hinten beim Driften/Burnout
    const dx = x - lastX; lastX = x;
    const roll = dx / wheelR;
    spin(front, roll);
    spin(rear, roll + (drift * 22 + burn * 26) * dt);

    // Reifenqualm beim Driften (Einfahrt) – beim Scrollen erzeugt main.js den Qualm
    if (!introDone && introT0 !== null && drift > 0.08) {
      acc += drift * 85 * dt;
      while (acc >= 1) { acc--; smoke("tire", toScreen(Math.random() < 0.6 ? tireNear : tireFar), carPx / 900); }
    }

    // Licht
    const L = S.lights || 0, T = S.tail || 0;
    lights.head.forEach((m) => (m.emissiveIntensity = L * 4));
    lights.tail.forEach((m) => (m.emissiveIntensity = 0.35 + T * 3));
    headGlow.material.opacity = L * 0.85;
    tailGlow.material.opacity = T * 0.8;

    // Nur neu zeichnen, wenn sich etwas bewegt (spart Akku, wenn das Auto steht)
    const key = x.toFixed(4) + "|" + yaw.toFixed(4) + "|" + rig.position.y.toFixed(5) + "|" + L.toFixed(3) + "|" + T.toFixed(3);
    if (!dirty && key === lastKey && drift < 0.02) return;
    lastKey = key; dirty = false;
    renderer.render(scene, camera);
  }
  let lastKey = "";
  rig.position.x = introDone ? 0 : startX;
  lastX = rig.position.x;
  // Shader vorab übersetzen – sonst ruckelt es, wenn das Auto zum ersten Mal ins Bild fährt
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, camera); else renderer.compile(scene, camera); } catch (e) { /* zeichnet trotzdem */ }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);

  hero.classList.add("has-3d");
  api.ready = true;
  api.parked = () => introDone;
  api.pose = () => ({ x: +rig.position.x.toFixed(3), yaw: +rig.rotation.y.toFixed(3), parked: introDone });
  resolveReady(true);
}
