// Laddning av 3D-tillgångar: PBR-material (Poly Haven-texturer), glTF-modeller och HDRI.
// Allt cachas; modeller normaliseras så att origo står på golvet mitt under modellen.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const BASE = new URL('../../assets/3d/', import.meta.url).href;
const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();
const texCache = new Map(), matCache = new Map(), modelCache = new Map();
let anisotropy = 8;
export const setAnisotropy = (n) => { anisotropy = n; };

// Alla laddningar registreras så att vi kan visa förlopp och vänta in allt
const pending = new Set();
let done = 0, total = 0;
export const progress = () => ({ done, total, frac: total ? done / total : 1 });
function track(p) {
  total++; pending.add(p);
  const fin = () => { done++; pending.delete(p); };
  p.then(fin, fin);
  return p;
}
export const whenLoaded = () => Promise.all([...pending]).then(() => undefined);

export function loadTex(path, { srgb = false, repeat = null, wrap = true } = {}) {
  const key = path + (srgb ? '#s' : '');
  let t = texCache.get(key);
  if (!t) {
    let resolve;
    const p = new Promise((r) => (resolve = r));
    t = texLoader.load(BASE + path, () => resolve(), undefined, () => { console.warn('3D: kunde inte ladda ' + path); resolve(); });
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    if (wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    texCache.set(key, t);
    track(p);
  }
  if (repeat) { t = t.clone(); t.repeat.set(repeat[0], repeat[1]); t.needsUpdate = true; }
  return t;
}

// PBR-material ur en Poly Haven-textur (diff + nor_gl + arm = ao/rough/metal i R/G/B)
export function pbr(name, { repeat = [1, 1], color = 0xffffff, roughness = 1, metalness = 1, normalScale = 1, envMapIntensity = 1, ...rest } = {}) {
  const key = name + ':' + repeat.join('x') + ':' + color + ':' + roughness + ':' + metalness + ':' + normalScale;
  let m = matCache.get(key);
  if (m) return m;
  const dir = `tex/${name}/${name}_`;
  m = new THREE.MeshStandardMaterial({
    map: loadTex(dir + 'diff_1k.jpg', { srgb: true, repeat }),
    normalMap: loadTex(dir + 'nor_gl_1k.jpg', { repeat }),
    aoMap: loadTex(dir + 'arm_1k.jpg', { repeat }),
    color, roughness, metalness, envMapIntensity, ...rest,
  });
  m.roughnessMap = m.aoMap; m.metalnessMap = m.aoMap;
  m.normalScale.set(normalScale, normalScale);
  matCache.set(key, m);
  return m;
}

// Modell (Poly Haven glTF 1k): Group med origo på golvet, x/z-centrerad, skuggor på
export function loadModel(name) {
  let p = modelCache.get(name);
  if (p) return p;
  p = new Promise((resolve) => {
    gltfLoader.load(`${BASE}models/${name}/${name}_1k.gltf`, (g) => {
      const obj = g.scene;
      obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material?.map) o.material.map.anisotropy = anisotropy; } });
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3(); box.getSize(size);
      const pivot = new THREE.Group();
      obj.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
      pivot.add(obj);
      pivot.userData.size = size;
      pivot.userData.model = name;
      resolve(pivot);
    }, undefined, (e) => { console.warn('3D: kunde inte ladda modellen ' + name, e); resolve(null); });
  });
  modelCache.set(name, p);
  track(p);
  return p;
}
export const modelSize = (obj) => obj?.userData?.size || new THREE.Vector3(1, 1, 1);

// En kopia av en laddad modell (delar geometri och material) i önskad storlek
// fit: { w, h, d } – skalar likformigt så att måttet som anges passar (första som finns)
export function instance(model, { fit = null, scale = 1, rotY = 0 } = {}) {
  if (!model) return null;
  const c = model.clone();
  const size = modelSize(model);
  let s = scale;
  if (fit) {
    if (fit.h) s = fit.h / size.y;
    else if (fit.w) s = fit.w / size.x;
    else if (fit.d) s = fit.d / size.z;
  }
  c.scale.setScalar(s);
  c.rotation.y = rotY;
  c.userData.size = size.clone().multiplyScalar(s);
  return c;
}

export function loadHdri(name) {
  const p = new Promise((resolve) => {
    rgbeLoader.load(`${BASE}hdri/${name}.hdr`, (t) => { t.mapping = THREE.EquirectangularReflectionMapping; resolve(t); }, undefined, (e) => { console.warn('3D: kunde inte ladda HDRI ' + name, e); resolve(null); });
  });
  track(p);
  return p;
}

// Rigg-modell (glb) med animationer – returnerar { scene, animations }
export function loadRig(path) {
  const p = new Promise((resolve) => {
    gltfLoader.load(BASE + path, (g) => resolve(g), undefined, (e) => { console.warn('3D: kunde inte ladda ' + path, e); resolve(null); });
  });
  track(p);
  return p;
}

// Förladdade modeller hämtas synkront med get(name) när rummet byggs om
const MODELS = {};
export async function preload(names) {
  const rs = await Promise.all(names.map(loadModel));
  names.forEach((n, i) => { MODELS[n] = rs[i]; });
}
export const get = (name) => MODELS[name] || null;
export function stats() {
  const out = {};
  for (const [n, m] of Object.entries(MODELS)) {
    if (!m) { out[n] = null; continue; }
    let tris = 0, meshes = 0;
    m.traverse((o) => { if (o.isMesh) { meshes++; const g = o.geometry; tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3; } });
    out[n] = { tris: Math.round(tris), meshes };
  }
  return out;
}
