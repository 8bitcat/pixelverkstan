// Byggläget i 3D: datorn byggs på arbetsbänken bakom disken. Kameran är låst i samma vinkel som
// 2D-byggvyn (snett uppifrån, u−v åt höger, u+v nedåt, z uppåt) men är en perspektivkamera med
// riktiga höjder, så att djupet syns. Byggvyns hela pekarlogik (platser, handgrepp, uttag,
// kablar, kompisars pekare, zoom) fungerar oförändrad: dess P.proj byts ut mot projektion genom
// 3D-kameran. Scenen ritas av samma kod som i 2D (rig.drawScene) – men varje "låda" blir en
// riktig 3D-låda med pixelgrafiken som textur på de tre synliga sidorna, packad i en
// texturatlas så att hela bygget blir ett par draw calls.
// Finalen (datorn står på skrivbordet, desk.js) ritas på samma sätt på bänken i verklig skala:
// skärmen och chassits sidofönster är levande texturer, sladdarna är 3D-rör.
import * as THREE from 'three';

export const U = 0.0175;                       // meter per byggenhet (chassit 26 enheter ≈ 45 cm)
export const U_DESK = 0.046;                   // meter per skrivbordsenhet (skrivbordet 32 enheter ≈ 1,5 m)
const ELEV = Math.PI / 6;                      // 30° – samma lutning som 2D-vyns (u+v)/2
const FOV = 32;
const ORBIT = { yaw: Math.PI * 0.55, pitchUp: 0.6, pitchDown: 0.35, elevMin: 0.12, elevMax: 1.25 };   // så långt får spelaren snurra kameran runt bygget                                // perspektiv, men måttligt så att bänken inte förvrängs
const PPU = 32;                                // texturpixlar per enhet (max)
const MAX_FACE = 560 * 560;                    // pixlar per sida (stora ytor får lägre upplösning)
const ATLAS_W = 2048;
const PAD = 2;
// Pixelgrafiken ska ha sina egna färger oavsett lampor: drygt hälften av färgen lyser av sig själv
// (samma textur som emissiveMap) och resten belyses, så att formerna fortfarande skuggas. Uppmätt mot
// ingrediensernas färger i 3D-köket: fel i mättnad 0,35 → 0,01 och i ljushet 0,17 → 0,01.
// (envMapIntensity lågt: speglingen av himlen la vitt ovanpå färgen och drog ner mättnaden)
const OWN_COLOR = { color: 0x7c7c7c, emissive: 0xffffff, emissiveIntensity: 0.47, envMapIntensity: 0.2 };   // avvägt mot exponeringen 1,3
const DIR_LOCAL = new THREE.Vector3(Math.cos(ELEV) / Math.SQRT2, Math.sin(ELEV), Math.cos(ELEV) / Math.SQRT2);   // mot kameran, i bänkens koordinater

// Samlar in lådorna som rig.drawScene ritar – samma gränssnitt som core/raster.js
class Recorder {
  constructor() { this.boxes = []; this.k = 16; this.hz = 13; this.ox = 0; this.oy = 0; this.edges = false; this.defaultId = 0; this.w = 4096; this.h = 4096; this.ids = null; }
  proj(u, v, z = 0) { return [this.ox + (u - v) * this.k, this.oy + (u + v) * this.k / 2 - z * this.hz]; }
  clear() { this.boxes.length = 0; }
  box(u0, u1, v0, v1, z0, z1, tex, id = this.defaultId || 0, opt = {}) {
    if (!(u1 > u0) || !(v1 > v0) || !(z1 >= z0)) return;
    this.boxes.push({ u0, u1, v0, v1, z0, z1, tex, id, alpha: opt.alpha ?? 1 });
  }
  px() {}
  flush() { return null; }
  idAt() { return 0; }
}

// Fristående voxelgrupp: samma lådor → 3D-lådor med atlas som på bänken, men med alla sidor (man kan gå
// runt den) och egen skala – t.ex. råvarorna i kyldiskens kantiner. render(drawFn) ritar om, group hängs in i scenen.
export function makeVoxels({ ppu = PPU, unit = U } = {}) {
  const v = {
    group: new THREE.Group(), rec: new Recorder(), cache: new Map(), meshes: [], atlas: null, atlasData: null, atlasCanvas: null, atlasSize: null,
    filter: null, ppu, allFaces: true, bench: null, stats: { boxes: 0, faces: 0, atlas: [0, 0], ms: 0, cached: 0 },
    mats: {
      opaque: new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.02, alphaTest: 0.5, side: THREE.DoubleSide, ...OWN_COLOR }),
      glass: new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    },
    clearMeshes() { Bench3D.prototype.clearMeshes.call(this); },
    render(drawFn) { Bench3D.prototype.renderWith.call(this, drawFn); return this.stats; },
    dispose() { this.clearMeshes(); this.atlas?.dispose(); this.mats.opaque.dispose(); this.mats.glass.dispose(); },
  };
  v.group.name = 'voxels'; v.group.scale.setScalar(unit);
  return v;
}

// sidans mått i enheter: [bredd, höjd]
function faceSize(b, face) {
  if (face === 'top') return [b.u1 - b.u0, b.v1 - b.v0];
  if (face === 'left') return [b.u1 - b.u0, b.z1 - b.z0];
  return [b.v1 - b.v0, b.z1 - b.z0];
}
// fingeravtryck på en sida: mått, id, texturfunktionens källkod och några provpunkter
function faceKey(b, face, W, H) {
  const t = b.tex;
  let src = t._src; if (!src) { src = t.toString(); t._src = src; }
  let h = 0; for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) | 0;
  let s = '';
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const c = t(face, W * (i + 0.5) / 4, H * (j + 0.5) / 4, W, H); s += (c == null ? -1 : c) + ','; }
  return `${face}|${b.u0},${b.u1},${b.v0},${b.v1},${b.z0},${b.z1}|${b.id}|${b.alpha}|${h}|${s}`;
}
// rastrera en sida med texturfunktionen → { data (RGBA), w, h, any, holes }
function rasterFace(b, face, W, H, ppuMax = PPU) {
  const ppu = Math.max(6, Math.min(ppuMax, Math.sqrt(MAX_FACE / Math.max(0.0001, W * H))));
  const cw = Math.max(1, Math.ceil(W * ppu)), ch = Math.max(1, Math.ceil(H * ppu));
  const data = new Uint8ClampedArray(cw * ch * 4);
  const a = Math.round(b.alpha * 255);
  let any = false, holes = false;
  for (let j = 0; j < ch; j++) {
    const sy = (j + 0.5) / ppu;
    for (let i = 0; i < cw; i++) {
      const c = b.tex(face, (i + 0.5) / ppu, sy, W, H);
      if (c == null || c < 0) { holes = true; continue; }
      const p = (j * cw + i) * 4;
      data[p] = (c >> 16) & 255; data[p + 1] = (c >> 8) & 255; data[p + 2] = c & 255; data[p + 3] = a;
      any = true;
    }
  }
  return { data, w: cw, h: ch, any, holes };
}
const cssHex = (s) => parseInt(String(s).replace('#', ''), 16);

export class Bench3D {
  constructor(view3d) {
    this.v = view3d;
    this.group = new THREE.Group(); this.group.name = 'bench';
    this.rotY = -Math.PI / 4;                  // byggläget: chassit diagonalt på bänken (u snett höger-mot-kameran, v snett vänster)
    this.group.rotation.y = this.rotY;
    this.group.visible = false;
    view3d.scene.add(this.group);
    this.camera = this.ownCamera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 30);
    this.orbit = { yaw: 0, pitch: 0 };            // spelarens vridning av kameran runt bygget (radianer), inom ORBIT-gränserna
    this.camSig = ''; this._v = new THREE.Vector3();
    this.dirWorld = DIR_LOCAL.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y).normalize();
    this.rec = new Recorder();
    this.raycaster = new THREE.Raycaster();   // egen: butikens har kort räckvidd
    this.cache = new Map();          // sidans nyckel → raster
    this.meshes = []; this.atlas = null; this.atlasData = null;
    this.view = null; this.desk = null; this.origProj = null; this.center = new THREE.Vector3();
    this.U = U; this.off = new THREE.Vector3(13, 0, 12); this.pSrc = null; this.filter = null; this.ppu = PPU;
    this.stats = { boxes: 0, faces: 0, atlas: [0, 0], ms: 0, cached: 0 };
    // Byggljus: en mjuk "lampa" snett uppifrån vänster (som 2D-skuggningen antyder) – rummets
    // lampor och bänklampan ger resten. Ljuset ligger i scenen, inte i bänkgruppen, och släcks i
    // stället för att döljas: antalet ljus ingår i shadernas nyckel, så om det kom och gick måste
    // webbläsaren kompilera om alla material i hela butiken just när man ska börja laga maten.
    this.key = new THREE.DirectionalLight(0xfff6ea, 0);
    this.keyTarget = new THREE.Object3D();
    view3d.scene.add(this.key, this.keyTarget);
    this.key.target = this.keyTarget;
    this.mats = {
      opaque: new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.02, alphaTest: 0.5, side: THREE.FrontSide, ...OWN_COLOR }),
      glass: new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1, transparent: true, depthWrite: false, side: THREE.FrontSide }),
    };
    // finalen: levande texturer (skärm, sidofönster) och sladdar
    this.quads = new Map(); this.cableGroup = new THREE.Group(); this.group.add(this.cableGroup);
  }
  // bänkens plats i rummet: skiva-mitten (x, y, z) i meter – scenens mitt hamnar där
  place(bench) {
    if (!bench) { this.group.visible = false; this.bench = null; return; }
    this.bench = bench;
    this.center.set(bench.x, bench.y, bench.z);
    if (this.view || this.desk) this.layout();
  }
  layout() {
    this.group.rotation.y = this.rotY;
    this.dirWorld = DIR_LOCAL.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotY).normalize();
    this.group.scale.set(this.U, this.U, this.U);
    const off = this.off.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y).multiply(this.group.scale);
    this.group.position.copy(this.center).sub(off);
    this.group.visible = true;
    this.camSig = '';
    // byggljuset följer bänken (det ligger i scenen, se konstruktorn)
    this.group.updateMatrixWorld(true);
    this.key.position.copy(this.group.localToWorld(new THREE.Vector3(-6, 14, 9)));
    this.keyTarget.position.copy(this.group.localToWorld(new THREE.Vector3(13, 0, 12)));
    this.key.intensity = this.view || this.desk ? 0.35 : 0;   // lyser bara när man bygger – inte i butiken
  }
  // ---------- Byggläget (chassit på bänken) ----------
  attach(view, opts = {}) {
    this.detachDesk();
    this.view = view;
    view.gl = this;
    this.free = !!opts.free;   // köket: ingen låst kamera – spelarens egen kamera används
    view.dirty = true;
    this.key.intensity = 0.35;
    this.U = U; this.off.set(13, 0, 12); this.filter = null; this.ppu = PPU; this.rotY = -Math.PI / 4;
    this.pSrc = () => view.P;
    // byggvyns projektion går genom 3D-kameran (markeringar, uttag, kablar, pekare hamnar rätt)
    if (!this.origProj) this.origProj = view.P.proj;
    view.P.proj = (u, v, z = 0) => this.project(u, v, z);
    this.layout();
  }
  // ---------- Finalen (datorn på skrivbordet – på bänken i verklig skala) ----------
  attachDesk(desk) {
    if (this.desk === desk) return;
    this.detachDesk();
    this.desk = desk;
    const DV = desk.constructor.DV || { w: 840, h: 612, k: 18, hz: 14, ox: 256, oy: 200 };
    // skrivbordet läggs rakt längs bänken (u längs väggen, v ut i rummet) – kameran vrids i stället, så att
    // bordet (1,5 × 0,6 m) får plats; skrivbordets ovansida (z = 6) ligger på bänkskivan
    this.U = U_DESK; this.off.set(16, 6, 6.5); this.ppu = 20; this.rotY = 0;
    this.filter = (b) => !(b.u0 === 0 && b.u1 === 32 && b.v0 === 0 && b.v1 === 13 && b.z0 === 0);   // själva skrivbordslådan är bänken
    this.pSrc = () => ({ k: DV.k * desk.s, hz: DV.hz * desk.s, ox: desk.ox + DV.ox * desk.s, oy: desk.oy + DV.oy * desk.s });
    desk.proj = (u, v, z = 0) => this.project(u, v, z);   // skuggar prototypens proj medan 3D är aktivt
    desk.gl = this;
    this.clearMeshes();
    this.layout();
  }
  detachDesk() {
    const d = this.desk; if (!d) return;
    delete d.proj; d.gl = null; this.desk = null;
    for (const q of this.quads.values()) { this.group.remove(q.mesh); q.mesh.geometry.dispose(); q.tex.dispose(); q.mesh.material.dispose(); }
    this.quads.clear();
    this.setCables([]);
    this.clearMeshes();
    if (this.view) { this.U = U; this.off.set(13, 0, 12); this.filter = null; this.ppu = PPU; this.rotY = -Math.PI / 4; this.pSrc = () => this.view.P; this.layout(); this.view.dirty = true; }
  }
  detach() {
    this.free = false;
    this.detachDesk();
    if (this.view) { this.view.gl = null; this.view.dirty = true; if (this.origProj) this.view.P.proj = this.origProj; }
    this.view = null; this.pSrc = null;
    this.group.visible = false;
    this.key.intensity = 0;   // släck, men låt ljuset vara kvar i scenen (shadernas nyckel)
    this.clearMeshes();
    if (this.bench?.lamp) this.bench.lamp.shadow.needsUpdate = true;
  }
  get active() { return !!this.view; }

  // ---------- Kameran följer byggvyns kamera (P.k = zoom, P.ox/oy = panorering, i css-px på #board) ----------
  // Punkten som 2D-formeln lägger mitt i fönstret blir kamerans mål; avståndet väljs så att skalan
  // i målplanet blir densamma som 2D-vyns (k√2 px per enhet).
  updateCamera(force = false) {
    if (this.free) { this.camera = this.v.camera; return; }   // fri kamera: spelaren tittar själv
    if (this.camera === this.v.camera) this.camera = this.ownCamera;
    const view = this.view; if (!view || !this.pSrc) return;
    const P = this.pSrc(), cv = this.v.canvas, board = view.canvas;
    const W = Math.max(2, cv.clientWidth), H = Math.max(2, cv.clientHeight);
    const r = board.getBoundingClientRect();
    const rear = !!(this.desk?.showRear && this.desk.rearFace);
    const sig = [P.k, P.ox, P.oy, W, H, r.left, r.top, this.group.position.x, this.group.position.z, this.U, rear ? 1 : 0, this.orbit.yaw, this.orbit.pitch].map((n) => Math.round(n * 1000)).join(',');
    if (!force && sig === this.camSig) return;
    this.camSig = sig;
    const cam = this.camera;
    if (rear) {
      // bakom datorn: kameran tittar rakt på baksidan (−u), lite uppifrån vänster, så nära att baksidan fyller bilden
      const [A, B, D] = this.desk.rearFace();
      const mid = new THREE.Vector3((A[0] + B[0] + D[0] + (B[0] + D[0] - A[0])) / 4, (A[2] + D[2]) / 2, (A[1] + B[1]) / 2);
      const target = this.group.localToWorld(mid.clone());
      const faceH = (A[2] - D[2]) * this.U, dist = Math.max(0.4, faceH / 0.62 / (2 * Math.tan(FOV * Math.PI / 360)));
      const dir = this.orbited(new THREE.Vector3(-1, 0.42, 0.3).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotY));
      cam.position.copy(target).addScaledVector(dir, dist);
      cam.up.set(0, 1, 0); cam.lookAt(target);
      cam.aspect = W / H; cam.near = 0.05; cam.far = dist + 16;
      cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      return;
    }
    const bx = W / 2 - r.left, by = H / 2 - r.top;
    const a = (bx - P.ox) / P.k, b2 = (by - P.oy) * 2 / P.k;
    const u = (a + b2) / 2, v = (b2 - a) / 2;
    const target = this.group.localToWorld(new THREE.Vector3(u, this.desk ? 6 : 0, v));
    const pxPerM = P.k * Math.SQRT2 / this.U;
    const dist = Math.max(0.6, H / (2 * Math.tan(FOV * Math.PI / 360) * pxPerM));
    cam.position.copy(target).addScaledVector(this.orbited(this.dirWorld), dist);
    cam.up.set(0, 1, 0); cam.lookAt(target);
    cam.aspect = W / H; cam.near = Math.max(0.05, dist - 1.2); cam.far = dist + 16;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }
  // kamerariktningen vriden med spelarens yaw (runt lodlinjen) och pitch (upp/ner), begränsat så man
  // bara går runt bygget – inte under bänken eller bakom väggen
  orbited(dir) {
    const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.orbit.yaw);
    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize();
    const elev = Math.asin(Math.max(-1, Math.min(1, d.y)));
    const pitch = Math.max(ORBIT.elevMin - elev, Math.min(ORBIT.elevMax - elev, this.orbit.pitch));
    return d.applyAxisAngle(side, -pitch).normalize();
  }
  orbitBy(dYaw, dPitch) {
    if (this.free) { const v = this.v; v.yaw += dYaw; v.pitch = Math.max(-1.35, Math.min(1.35, v.pitch - dPitch)); return; }
    this.orbit.yaw = Math.max(-ORBIT.yaw, Math.min(ORBIT.yaw, this.orbit.yaw + dYaw));
    this.orbit.pitch = Math.max(-ORBIT.pitchDown, Math.min(ORBIT.pitchUp, this.orbit.pitch + dPitch));
    this.updateCamera(true);
  }
  resetOrbit() { this.orbit.yaw = 0; this.orbit.pitch = 0; this.updateCamera(true); }
  update(dt) { this.updateCamera(); }
  // scenens (u, v, z) → css-px på #board (byggvyns P.proj / finalens proj i 3D-läget)
  project(u, v, z = 0) {
    this.updateCamera();
    const view = this.view, cv = this.v.canvas, r = view.canvas.getBoundingClientRect();
    const p = this._v.set(u, z, v); this.group.localToWorld(p); p.project(this.camera);
    return [(p.x + 1) / 2 * cv.clientWidth - r.left, (1 - p.y) / 2 * cv.clientHeight - r.top];
  }
  // css-px på #board → (u, v) i planet z (för kompisars pekare)
  unproject(x, y, z = 1) {
    this.updateCamera();
    const view = this.view, cv = this.v.canvas, r = view.canvas.getBoundingClientRect();
    const nx = ((r.left + x) / cv.clientWidth) * 2 - 1, ny = -((r.top + y) / cv.clientHeight) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const o = this.group.localToWorld(new THREE.Vector3(0, z, 0)), n = new THREE.Vector3(0, 1, 0);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, o), hit = new THREE.Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) return null;
    this.group.worldToLocal(hit);
    return [hit.x, hit.z];
  }

  // ---------- Scenen: lådor → atlas + geometri ----------
  clearMeshes() {
    for (const m of this.meshes) { this.group.remove(m); m.geometry.dispose(); }
    this.meshes = [];
  }
  render(L, b, anim) { this.renderWith((rec) => L.drawScene(rec, b, anim)); }
  renderWith(drawFn) {
    const t0 = performance.now();
    const rec = this.rec;
    rec.clear(); rec.defaultId = 0;
    drawFn(rec);
    this.clearMeshes();
    // sidor att visa: topp, vänster (v = v1) och höger (u = u1) – de tre kameran ser
    const faces = [];
    let cached = 0;
    const fresh = new Map();
    rec.boxes.forEach((box, i) => {
      if (this.filter && !this.filter(box)) return;
      const thin = box.z1 - box.z0 < 0.02;
      // (allFaces: även baksidan och bortre sidan, för saker man kan gå runt – de delar textur med framsidorna)
      for (const face of (this.allFaces ? ['top', 'left', 'right', 'back', 'far'] : ['top', 'left', 'right'])) {
        if (face !== 'top' && thin) continue;
        const rf = face === 'back' ? 'left' : face === 'far' ? 'right' : face;
        const [W, H] = faceSize(box, rf);
        if (W <= 0 || H <= 0) continue;
        const key = faceKey(box, rf, W, H);
        let ras = this.cache.get(key) || fresh.get(key);
        if (ras) cached++;
        else { ras = rasterFace(box, rf, W, H, this.ppu); if (!ras.any) ras = null; fresh.set(key, ras); }
        if (!ras) continue;
        faces.push({ box, face, rf, W, H, ras, i, glass: box.alpha < 1 });
      }
    });
    // cachen innehåller bara det som syns just nu (plus det nya)
    const next = new Map();
    for (const f of faces) next.set(faceKey(f.box, f.rf, f.W, f.H), f.ras);
    this.cache = next;
    // packa i en atlas (hyllpackning, högsta först)
    const order = [...faces].sort((a, c) => c.ras.h - a.ras.h);
    let x = PAD, y = PAD, rowH = 0, AW = ATLAS_W;
    const totalArea = faces.reduce((s, f) => s + (f.ras.w + PAD) * (f.ras.h + PAD), 0);
    if (totalArea > AW * AW * 0.8) AW = 4096;
    for (const f of order) {
      const w = Math.min(f.ras.w, AW - 2 * PAD), h = f.ras.h;
      if (x + w + PAD > AW) { x = PAD; y += rowH + PAD; rowH = 0; }
      f.ax = x; f.ay = y; f.aw = w; f.ah = h;
      x += w + PAD; rowH = Math.max(rowH, h);
    }
    const AH = Math.max(4, y + rowH + PAD);
    const data = new Uint8ClampedArray(AW * AH * 4);
    for (const f of order) {
      const { ras, ax, ay, aw } = f;
      for (let j = 0; j < ras.h; j++) data.set(ras.data.subarray(j * ras.w * 4, (j * ras.w + aw) * 4), ((ay + j) * AW + ax) * 4);
    }
    // texturen
    if (!this.atlasCanvas) { this.atlasCanvas = document.createElement('canvas'); }
    const c = this.atlasCanvas;
    if (c.width !== AW || c.height !== AH) { c.width = AW; c.height = AH; }
    c.getContext('2d').putImageData(new ImageData(data, AW, AH), 0, 0);
    // Texture-objektet skapas en gång och sitter kvar på materialen: att byta objekt och sätta
    // material.needsUpdate kastar bort materialets kompilerade shader, som då måste byggas om (det fick
    // bilden att frysa när köket öppnades). Men grafikkortets textur kan INTE byta storlek i efterhand –
    // växer atlasen måste den skapas om, annars hamnar nya bilder utanför och alla ytor får fel textur.
    // dispose() släpper bara grafikkortets kopia; objektet och materialens koppling till det är kvar.
    if (this.atlas && (this.atlasSize?.[0] !== AW || this.atlasSize?.[1] !== AH)) this.atlas.dispose();
    if (!this.atlas) {
      this.atlas = new THREE.CanvasTexture(c);
      this.atlas.colorSpace = THREE.SRGBColorSpace; this.atlas.flipY = false;
      this.atlas.magFilter = THREE.NearestFilter; this.atlas.minFilter = THREE.LinearMipmapLinearFilter;
      this.atlas.anisotropy = 4; this.atlas.generateMipmaps = true;
      this.mats.opaque.map = this.atlas; this.mats.glass.map = this.atlas;
      this.mats.opaque.emissiveMap = this.atlas;
      this.mats.opaque.needsUpdate = true; this.mats.glass.needsUpdate = true;
    }
    this.atlas.needsUpdate = true;
    this.atlasSize = [AW, AH];
    this.atlasData = data; this.atlasW = AW; this.atlasH = AH;
    // geometri: en mesh för ogenomskinligt, en för glas
    const build = (list, glass) => {
      if (!list.length) return;
      const n = list.length;
      const pos = new Float32Array(n * 12), nor = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
      const ids = [];
      list.forEach((f, k) => {
        const b = f.box, lift = f.i * 0.0002;   // ritordningen avgör vem som ligger överst på samma plan
        const u0 = (f.ax) / AW, u1 = (f.ax + f.aw) / AW, v0 = f.ay / AH, v1 = (f.ay + f.ah) / AH;
        let P, N;
        if (f.face === 'top') { const z = b.z1 + lift; P = [b.u0, z, b.v0, b.u1, z, b.v0, b.u1, z, b.v1, b.u0, z, b.v1]; N = [0, 1, 0]; }
        else if (f.face === 'left') { const v = b.v1 + lift; P = [b.u0, b.z1, v, b.u1, b.z1, v, b.u1, b.z0, v, b.u0, b.z0, v]; N = [0, 0, 1]; }
        else if (f.face === 'back') { const v = b.v0 - lift; P = [b.u1, b.z1, v, b.u0, b.z1, v, b.u0, b.z0, v, b.u1, b.z0, v]; N = [0, 0, -1]; }
        else if (f.face === 'far') { const u = b.u0 - lift; P = [u, b.z1, b.v1, u, b.z1, b.v0, u, b.z0, b.v0, u, b.z0, b.v1]; N = [-1, 0, 0]; }
        else { const u = b.u1 + lift; P = [u, b.z1, b.v0, u, b.z1, b.v1, u, b.z0, b.v1, u, b.z0, b.v0]; N = [1, 0, 0]; }
        pos.set(P, k * 12);
        for (let m = 0; m < 4; m++) nor.set(N, k * 12 + m * 3);
        uv.set([u0, v0, u1, v0, u1, v1, u0, v1], k * 8);
        const o = k * 4;
        if (f.face === 'right' || f.face === 'far') idx.set([o, o + 1, o + 2, o, o + 2, o + 3], k * 6);
        else idx.set([o, o + 2, o + 1, o, o + 3, o + 2], k * 6);
        ids.push(b.id, b.id);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, glass ? this.mats.glass : this.mats.opaque);
      mesh.castShadow = !glass; mesh.receiveShadow = true; mesh.frustumCulled = false;
      mesh.userData.ids = ids; mesh.renderOrder = glass ? 2 : 0;
      this.group.add(mesh); this.meshes.push(mesh);
    };
    build(faces.filter((f) => !f.glass), false);
    build(faces.filter((f) => f.glass), true);
    this.stats = { boxes: rec.boxes.length, faces: faces.length, atlas: [AW, AH], ms: Math.round(performance.now() - t0), cached };
    if (this.bench?.lamp) this.bench.lamp.shadow.needsUpdate = true;
  }

  // ---------- Finalen: levande ytor (skärmen, sidofönstret) och sladdar ----------
  // quad från tre hörn i scenens enheter: [övre vänster, övre höger, nedre vänster] – ytan ligger
  // i ett v-plan (mot betraktaren) och skjuts ut en aning så den inte slåss med lådan bakom
  setQuad(key, canvas, p00, p10, p01, { emissive = false } = {}) {
    const mkTex = (cv) => { const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; return tex; };
    let q = this.quads.get(key);
    if (!q) {
      const tex = mkTex(canvas);
      const mat = emissive ? new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.05 });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), 2));
      g.setIndex([0, 2, 1, 0, 3, 2]);
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
      this.group.add(mesh);
      q = { mesh, tex, canvas, sig: '' };
      this.quads.set(key, q);
    }
    if (q.canvas !== canvas) { q.tex.dispose(); q.tex = mkTex(canvas); q.mesh.material.map = q.tex; q.mesh.material.needsUpdate = true; q.canvas = canvas; }
    const sig = [...p00, ...p10, ...p01].join(',');
    if (sig !== q.sig) {
      q.sig = sig;
      const A0 = new THREE.Vector3(p00[0], p00[2], p00[1]), B0 = new THREE.Vector3(p10[0], p10[2], p10[1]), D0 = new THREE.Vector3(p01[0], p01[2], p01[1]);
      const n = new THREE.Vector3().subVectors(D0, A0).cross(new THREE.Vector3().subVectors(B0, A0)).normalize();
      const e = 0.04, A = A0.addScaledVector(n, e), B = B0.addScaledVector(n, e), D = D0.addScaledVector(n, e), C = new THREE.Vector3().addVectors(B, D).sub(A);
      q.mesh.geometry.attributes.position.set([...A.toArray(), ...B.toArray(), ...C.toArray(), ...D.toArray()]); q.mesh.geometry.attributes.position.needsUpdate = true;
      const na = q.mesh.geometry.attributes.normal; for (let i = 0; i < 4; i++) na.setXYZ(i, n.x, n.y, n.z); na.needsUpdate = true;
      q.mesh.geometry.computeBoundingSphere();
    }
    q.tex.needsUpdate = true;
  }
  // sladdar: [{ pts: [[u,v,z] …], color: '#rrggbb', r }] → rör; kontakter: [{ at: [u,v,z], color }]
  setCables(list, plugs = []) {
    for (const o of [...this.cableGroup.children]) { this.cableGroup.remove(o); o.geometry.dispose(); o.material.dispose(); }
    for (const c of list) {
      const pts = c.pts.map(([u, v, z]) => new THREE.Vector3(u, z, v));
      if (pts.length < 2) continue;
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
      const geo = new THREE.TubeGeometry(curve, Math.max(12, pts.length * 8), c.r || 0.09, 7, false);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cssHex(c.color || '#26262b'), roughness: 0.75, metalness: 0.05 }));
      mesh.castShadow = true;
      this.cableGroup.add(mesh);
    }
    for (const p of plugs) {
      const [u, v, z] = p.at;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.7), new THREE.MeshStandardMaterial({ color: cssHex(p.color || '#26262b'), roughness: 0.6 }));
      mesh.position.set(u, z + 0.28, v); mesh.castShadow = true;
      this.cableGroup.add(mesh);
    }
  }

  // kablarna i byggläget ritas som i 2D – ovanpå bilden, i #board-canvasens upplösning
  cables(view) {
    const dpr = view.dpr || 1, cw = Math.max(2, Math.round(view.cw * dpr)), ch = Math.max(2, Math.round(view.ch * dpr));
    if (view.cableCanvas.width !== cw || view.cableCanvas.height !== ch) { view.cableCanvas.width = cw; view.cableCanvas.height = ch; }
    const P = view.P;
    const R2 = { k: P.k * dpr, hz: P.hz * dpr, proj: (u, v, z = 0) => { const [x, y] = P.proj(u, v, z); return [x * dpr, y * dpr]; } };
    view.L.drawCables(view.cableCtx, R2, view.b, { plug: view.plugAnim });
  }

  // vilket objekt (platsens nummer) ligger under en punkt på #board (css-px)?
  idAt(x, y) {
    const view = this.view; if (!view || !this.meshes.length) return 0;
    const r = view.canvas.getBoundingClientRect(), cv = this.v.canvas;
    const nx = ((r.left + x) / cv.clientWidth) * 2 - 1, ny = -((r.top + y) / cv.clientHeight) * 2 + 1;
    this.updateCamera();
    const rc = this.raycaster;
    rc.setFromCamera(new THREE.Vector2(nx, ny), this.camera);
    const hits = rc.intersectObjects(this.meshes, false);
    for (const h of hits) {
      // genomskinliga texturpixlar (hål i grafiken) räknas inte
      if (h.uv && this.atlasData) {
        const px = Math.min(this.atlasW - 1, Math.max(0, Math.floor(h.uv.x * this.atlasW))), py = Math.min(this.atlasH - 1, Math.max(0, Math.floor(h.uv.y * this.atlasH)));
        if (this.atlasData[(py * this.atlasW + px) * 4 + 3] === 0) continue;
      }
      const id = h.object.userData.ids[h.faceIndex];
      if (id) return id;
    }
    return 0;
  }
  // världspunkt för (u, v, z) – för tester
  worldOf(u, v, z = 0) { return this.group.localToWorld(new THREE.Vector3(u, z, v)); }
  // skärmpunkt (fönster-px) för (u, v, z) genom kameran – för tester
  screenOf(u, v, z = 0) {
    this.updateCamera();
    const p = this.worldOf(u, v, z).project(this.camera), cv = this.v.canvas;
    return [(p.x + 1) / 2 * cv.clientWidth, (1 - p.y) / 2 * cv.clientHeight];
  }
  // 2D-formelns punkt (så som rastern hade lagt den) – för tester: hur mycket perspektivet avviker
  isoOf(u, v, z = 0) { const P = this.pSrc(); return [P.ox + (u - v) * P.k, P.oy + (u + v) * P.k / 2 - z * P.hz]; }
  info() { return { ...this.stats, active: this.active, desk: !!this.desk, quads: this.quads.size, cables: this.cableGroup.children.length, cache: this.cache.size }; }
  dispose() { this.detach(); this.atlas?.dispose(); this.v.scene.remove(this.group); this.v.scene.remove(this.key, this.keyTarget); }
}
