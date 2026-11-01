/* ==========================================================================
   Echtes 3D-Auto im Hero (three.js + glTF-Modell)
   Modell: „Car Concept“ von Eric Chadwick / Darmstadt Graphics Group,
   CC BY 4.0 (Khronos glTF Sample Assets), angepasst: Lackierung, Kennzeichen,
   Logos entfernt, komprimiert.
   Ohne WebGL (oder wenn etwas nicht lädt) bleibt automatisch das gezeichnete Auto.
   ========================================================================== */
import * as THREE from "three";
import { GLTFLoader } from "../vendor/three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "../vendor/three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "../vendor/three/addons/libs/meshopt_decoder.module.js";

const hero = document.querySelector(".hero");
const drive = hero && hero.querySelector(".hero__car-drive");
const svg = drive && drive.querySelector("svg.hero__car");

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
  catch (e) { return false; }
}

const api = { ready: false, state: { lights: 0, tail: 0, burn: 0 }, anchors: null, canvas: null };
let resolveReady;
api.whenReady = new Promise((r) => (resolveReady = r));
window.AZN3D = api;

const enabled = !(window.AZN_CONFIG && window.AZN_CONFIG.auto3d === false);
if (enabled && hero && drive && svg && webglOK()) init().catch((e) => { console.warn("3D-Auto nicht geladen:", e); resolveReady(false); });
else resolveReady(false);

async function init() {
  const canvas = document.createElement("canvas");
  canvas.className = "hero__car hero__car3d";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Sportwagen in 3D");
  api.canvas = canvas;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  // Zusatzlicht von oben für Glanzkanten
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 6, 4);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 0.6));

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(new URL("../3d/auto.glb", import.meta.url).href);
  const car = gltf.scene;

  // Ausrichtung bestimmen: Front zeigt nach rechts (+X), Kamera schaut auf die Seite
  car.updateMatrixWorld(true);
  const wp = (name) => { const o = car.getObjectByName(name); const v = new THREE.Vector3(); o.getWorldPosition(v); return v; };
  const fwd = wp("WheelFrontL").sub(wp("WheelRearL")).setY(0).normalize();
  car.rotation.y = Math.atan2(fwd.z, fwd.x); // dreht fwd auf +X
  const pivot = new THREE.Group();
  pivot.add(car);
  scene.add(pivot);
  pivot.updateMatrixWorld(true);
  // Kamera steht immer auf der +Z-Seite → Bildschirm-rechts = +X = Fahrtrichtung
  const camSide = 1;

  // Auto zentrieren und auf den Boden stellen
  const box = new THREE.Box3().setFromObject(pivot);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  car.position.x -= center.x; car.position.z -= center.z; car.position.y -= box.min.y;
  pivot.updateMatrixWorld(true);

  // Materialien veredeln
  const lightMats = { head: [], tail: [] };
  car.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    const m = o.material;
    if (!m) return;
    if (m.transmission > 0) { // Glas: getönt statt teurer Lichtbrechung (schneller auf dem iPhone)
      m.transmission = 0; m.transparent = true; m.opacity = 0.42; m.color.set(0x1b1e24); m.roughness = 0.04; m.metalness = 0.2;
      m.envMapIntensity = 1.8; m.depthWrite = false;
    }
    if (/Paint/.test(m.name)) {
      m.envMapIntensity = 1.35;
      if ("iridescence" in m) m.iridescence = 0; // kein Regenbogen-Schimmer
      if ("clearcoat" in m) { m.clearcoat = Math.max(m.clearcoat, 0.9); m.clearcoatRoughness = 0.06; }
      if (/Paint 1/.test(m.name)) { m.color.set(0xe9e9e6); m.metalness = 0.25; m.roughness = 0.32; }
    }
    if (m.name === "Disc") { m.map = null; m.color.set(0x8a8a8f); m.metalness = 0.9; m.roughness = 0.35; }
    if (m.name === "Headlight") { m.emissive.set(0xdfe9ff); lightMats.head.push(m); }
    if (m.name === "Brakelight") { m.emissive.set(0xff1e1e); lightMats.tail.push(m); }
  });

  // Weicher Schatten unter dem Auto
  const sh = document.createElement("canvas"); sh.width = sh.height = 256;
  const g = sh.getContext("2d"), grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, "rgba(0,0,0,0.6)"); grd.addColorStop(0.45, "rgba(0,0,0,0.28)"); grd.addColorStop(0.85, "rgba(0,0,0,0.04)"); grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 1.15, size.z * 1.25), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002;
  scene.add(shadow);

  // Lichtschein vorne/hinten (leuchtet, wenn das Licht angeht)
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"); const r = x.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = r; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  function glowAt(name, color, scale, dirX) {
    const o = car.getObjectByName(name); if (!o) return null;
    const b = new THREE.Box3().setFromObject(o);
    const p = new THREE.Vector3(dirX > 0 ? b.max.x : b.min.x, (b.min.y + b.max.y) / 2, camSide > 0 ? b.max.z : b.min.z);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    s.position.copy(p); s.scale.set(scale, scale * 0.6, 1); scene.add(s); return s;
  }
  const headGlow = glowAt("BodyHeadlights", 0xe8f0ff, 1.1, 1);
  const tailGlow = glowAt("BodyTaillights", 0xff2a2a, 0.9, -1);

  // Räder: Felge + Reifen + Bremsscheibe drehen sich um die exakte Radmitte, der Bremssattel bleibt stehen
  const wheelNodes = ["WheelFrontL", "WheelFrontR", "WheelRearL", "WheelRearR"].map((n) => car.getObjectByName(n));
  const axleWorld = wp("WheelFrontL").sub(wp("WheelFrontR")).normalize();
  car.updateMatrixWorld(true);
  const wheels = [], wheelAxes = [];
  wheelNodes.forEach((node) => {
    if (!node) { wheels.push(null); wheelAxes.push(null); return; }
    const spinning = node.children.filter((c) => !/BrakePad/i.test(c.name));
    // Radmitte = Mitte des Reifens/der Felge (nicht der Bremssattel)
    const bb = new THREE.Box3();
    spinning.forEach((c) => bb.expandByObject(c));
    const center = bb.getCenter(new THREE.Vector3());
    const pivotG = new THREE.Group();
    pivotG.name = node.name + "Spin";
    node.add(pivotG);
    pivotG.position.copy(node.worldToLocal(center.clone()));
    pivotG.updateMatrixWorld(true);
    spinning.forEach((c) => pivotG.attach(c)); // Lage im Raum bleibt erhalten
    const pq = new THREE.Quaternion(); node.getWorldQuaternion(pq);
    wheels.push(pivotG);
    wheelAxes.push(axleWorld.clone().applyQuaternion(pq.invert()).normalize());
  });
  const qTmp = new THREE.Quaternion();
  const wheelBox = new THREE.Box3().setFromObject(wheels[0] || wheelNodes[0]);
  const wheelR = wheelBox.getSize(new THREE.Vector3()).y / 2;
  const rearContact = () => { const v = wp("WheelRearL"); v.y = 0.02; return v; };

  // Kamera: Seitenansicht leicht von vorne/oben (wie das bisherige Bild)
  const camera = new THREE.PerspectiveCamera(14, 2.4, 0.1, 200);
  function placeCamera() {
    const hHalf = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const dist = (size.x * 0.6) / Math.tan(hHalf); // Auto füllt ~83 % der Breite, wenig Verzerrung
    camera.position.set(size.x * 0.06, size.y * 1.15, camSide * dist);
    camera.lookAt(0, size.y * 0.42, 0);
  }

  // Canvas einsetzen. Ist die Einfahrt schon gelaufen (3D kam spät), sanft überblenden statt erneut einzufahren.
  if (document.documentElement.classList.contains("is-ready")) canvas.classList.add("no-intro");
  drive.appendChild(canvas);
  function resize() {
    const w = drive.clientWidth || svg.clientWidth || 800;
    const h = Math.round(w / 2.4);
    const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 2 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    camera.aspect = w / h; camera.updateProjectionMatrix(); placeCamera();
  }
  resize();
  window.addEventListener("resize", resize);

  // Bildschirm-Positionen für Rauch (Reifen hinten, Auspuff)
  const tmp = new THREE.Vector3();
  api.anchors = () => {
    const r = canvas.getBoundingClientRect();
    const proj = (v) => { tmp.copy(v).project(camera); return { x: r.left + (tmp.x + 1) / 2 * r.width, y: r.top + (1 - tmp.y) / 2 * r.height }; };
    const rc = rearContact();
    const ex = new THREE.Vector3(new THREE.Box3().setFromObject(car).min.x + 0.05, 0.28, rc.z);
    return { tire: proj(rc), exhaust: proj(ex), scale: r.width / 900 };
  };

  // Render-Schleife: Räder drehen passend zur Bewegung, Licht folgt dem Zustand
  let lastLeft = null, visible = true, spinRear = 0;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(hero);
  let lastT = performance.now();
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    if (!visible) return;
    const r = canvas.getBoundingClientRect();
    if (lastLeft === null) lastLeft = r.left;
    const dx = r.left - lastLeft; lastLeft = r.left;
    const pxPerUnit = r.width / (size.x * 1.15);
    const roll = dx / (wheelR * pxPerUnit); // Rollwinkel in Bogenmaß
    spinRear = roll + api.state.burn * 26 * dt;
    // Achse zeigt immer zur Kamera → Vorwärtsfahrt (nach rechts) = im Uhrzeigersinn = negativer Winkel
    wheels.forEach((w, i) => {
      if (!w || !wheelAxes[i]) return;
      qTmp.setFromAxisAngle(wheelAxes[i], -(i >= 2 ? spinRear : roll));
      w.quaternion.premultiply(qTmp);
    });
    const L = api.state.lights, T = api.state.tail;
    lightMats.head.forEach((m) => (m.emissiveIntensity = 0.25 + L * 5));
    lightMats.tail.forEach((m) => (m.emissiveIntensity = 0.35 + T * 6));
    if (headGlow) headGlow.material.opacity = L * 0.9;
    if (tailGlow) tailGlow.material.opacity = T * 0.85;
    renderer.render(scene, camera);
  }
  renderer.render(scene, camera); // erstes Bild sofort
  requestAnimationFrame(frame);

  hero.classList.add("has-3d");
  api.ready = true;
  resolveReady(true);
}
