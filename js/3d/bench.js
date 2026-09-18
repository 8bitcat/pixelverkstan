// Byggläget i 3D: datorn byggs på arbetsbänken bakom disken. Kameran är ortografisk och låst i
// exakt samma vinkel som 2D-byggvyn (u−v åt höger, (u+v)/2 nedåt, z uppåt), så att byggvyns
// hela pekarlogik (platser, handgrepp, uttag, kablar, kompisars pekare, zoom) fungerar
// oförändrad ovanpå 3D-bilden. Scenen ritas av samma kod som i 2D (rig.drawScene) – men varje
// "låda" blir en riktig 3D-låda med pixelgrafiken som textur på de tre synliga sidorna, packad
// i en texturatlas så att hela bygget blir ett par draw calls.
import * as THREE from 'three';

export const U = 0.0175;                       // meter per byggenhet (chassit 26 enheter ≈ 45 cm)
const ELEV = Math.PI / 6;                      // 30° – vinkeln där (u+v)/2-projektionen blir exakt
const ISO_Z = Math.SQRT2 * Math.cos(ELEV);     // 1.2247: så många k-pixlar en enhet i höjd får i äkta 30°-vy
const PPU = 32;                                // texturpixlar per enhet (max)
const MAX_FACE = 560 * 560;                    // pixlar per sida (stora ytor får lägre upplösning)
const ATLAS_W = 2048;
const PAD = 2;
const DIR_LOCAL = new THREE.Vector3(Math.cos(ELEV) / Math.SQRT2, Math.sin(ELEV), Math.cos(ELEV) / Math.SQRT2);   // mot kameran, i bänkens koordinater

// Samlar in lådorna som rig.drawScene ritar – samma gränssnitt som core/raster.js
class Recorder {
  constructor() { this.boxes = []; this.k = 16; this.hz = 13; this.ox = 0; this.oy = 0; this.edges = false; this.defaultId = 0; this.w = 4096; this.h = 4096; }
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
function rasterFace(b, face, W, H) {
  const ppu = Math.max(6, Math.min(PPU, Math.sqrt(MAX_FACE / Math.max(0.0001, W * H))));
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

export class Bench3D {
  constructor(view3d) {
    this.v = view3d;
    this.group = new THREE.Group(); this.group.name = 'bench';
    this.group.rotation.y = -Math.PI / 4;      // u-axeln pekar snett höger-mot-kameran, v snett vänster
    this.group.visible = false;
    view3d.scene.add(this.group);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 30);
    this.dirWorld = DIR_LOCAL.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y).normalize();
    this.rec = new Recorder();
    this.raycaster = new THREE.Raycaster();   // egen: butikens har kort räckvidd
    this.cache = new Map();          // sidans nyckel → raster
    this.meshes = []; this.atlas = null; this.atlasData = null; this.faceIds = [];
    this.view = null; this.center = new THREE.Vector3(); this.q = 1;
    this.stats = { boxes: 0, faces: 0, atlas: [0, 0], ms: 0, cached: 0 };
    // byggljus: en mjuk "lampa" snett uppifrån vänster (som 2D-skuggningen antyder) – rummets
    // lampor och bänklampan ger resten
    const key = new THREE.DirectionalLight(0xfff6ea, 0.35);
    key.position.set(-6, 14, 9); key.target.position.set(13, 0, 12);
    this.group.add(key, key.target);
    this.mats = {
      opaque: new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.02, alphaTest: 0.5, side: THREE.FrontSide }),
      glass: new THREE.MeshStandardMaterial({ roughness: 0.15, metalness: 0.1, transparent: true, depthWrite: false, side: THREE.FrontSide }),
    };
  }
  // bänkens plats i rummet: skiva-mitten (x, y, z) i meter – byggets mitt (chassit) hamnar där
  place(bench) {
    if (!bench) { this.group.visible = false; this.bench = null; return; }
    this.bench = bench;
    this.center.set(bench.x, bench.y, bench.z);
  }
  attach(view) {
    this.view = view;
    view.gl = this;
    view.dirty = true;
    this.q = (view.hzRatio || 0.8125) / ISO_Z;          // höjder trycks ihop så att z-projektionen blir pixelexakt
    this.group.scale.set(U, U * this.q, U);
    const off = new THREE.Vector3(13, 0, 12).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y).multiply(this.group.scale);
    this.group.position.copy(this.center).sub(off);
    this.group.visible = true;
  }
  detach() {
    if (this.view) { this.view.gl = null; this.view.dirty = true; }
    this.view = null;
    this.group.visible = false;
    this.clearMeshes();
    if (this.bench?.lamp) this.bench.lamp.shadow.needsUpdate = true;
  }
  get active() { return !!this.view; }

  // ---------- Kameran följer byggvyns projektion P (k, hz, ox, oy i css-px på #board) ----------
  updateCamera() {
    const view = this.view; if (!view) return;
    const P = view.P, cv = this.v.canvas, board = view.canvas;
    const W = Math.max(2, cv.clientWidth), H = Math.max(2, cv.clientHeight);
    const r = board.getBoundingClientRect();
    // fönstrets mitt i bänkens enheter (z = 0)
    const bx = W / 2 - r.left, by = H / 2 - r.top;
    const a = (bx - P.ox) / P.k, b2 = (by - P.oy) * 2 / P.k;
    const u = (a + b2) / 2, v = (b2 - a) / 2;
    const target = this.group.localToWorld(new THREE.Vector3(u, 0, v));
    const dist = 6;
    const cam = this.camera;
    cam.position.copy(target).addScaledVector(this.dirWorld, dist);
    cam.up.set(0, 1, 0); cam.lookAt(target);
    const pxPerM = P.k * Math.SQRT2 / U;
    const hw = W / 2 / pxPerM, hh = H / 2 / pxPerM;
    cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh;
    cam.near = dist - 0.9; cam.far = dist + 14;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }
  update(dt) { this.updateCamera(); }

  // ---------- Scenen: rig.drawScene → lådor → atlas + geometri ----------
  clearMeshes() {
    for (const m of this.meshes) { this.group.remove(m); m.geometry.dispose(); }
    this.meshes = [];
    this.faceIds = [];
  }
  render(L, b, anim) {
    const t0 = performance.now();
    const rec = this.rec;
    rec.clear();
    L.drawScene(rec, b, anim);
    this.clearMeshes();
    // sidor att visa: topp, vänster (v = v1) och höger (u = u1) – de tre kameran ser
    const faces = [];
    let cached = 0;
    const fresh = new Map();
    rec.boxes.forEach((box, i) => {
      const thin = box.z1 - box.z0 < 0.02;
      for (const face of ['top', 'left', 'right']) {
        if (face !== 'top' && thin) continue;
        const [W, H] = faceSize(box, face);
        if (W <= 0 || H <= 0) continue;
        const key = faceKey(box, face, W, H);
        let ras = this.cache.get(key) || fresh.get(key);
        if (ras) cached++;
        else { ras = rasterFace(box, face, W, H); if (!ras.any) ras = null; fresh.set(key, ras); }
        if (!ras) continue;
        faces.push({ box, face, W, H, ras, i, glass: box.alpha < 1 });
      }
    });
    // cachen innehåller bara det som syns just nu (plus det nya)
    const next = new Map();
    for (const f of faces) next.set(faceKey(f.box, f.face, f.W, f.H), f.ras);
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
    if (!this.atlas || this.atlas.image !== c || this.atlasSize?.[0] !== AW || this.atlasSize?.[1] !== AH) {
      this.atlas?.dispose();
      this.atlas = new THREE.CanvasTexture(c);
      this.atlas.colorSpace = THREE.SRGBColorSpace; this.atlas.flipY = false;
      this.atlas.magFilter = THREE.NearestFilter; this.atlas.minFilter = THREE.LinearMipmapLinearFilter;
      this.atlas.anisotropy = 4; this.atlas.generateMipmaps = true;
      this.mats.opaque.map = this.atlas; this.mats.glass.map = this.atlas;
      this.mats.opaque.needsUpdate = true; this.mats.glass.needsUpdate = true;
      this.atlasSize = [AW, AH];
    } else this.atlas.needsUpdate = true;
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
        else { const u = b.u1 + lift; P = [u, b.z1, b.v0, u, b.z1, b.v1, u, b.z0, b.v1, u, b.z0, b.v0]; N = [1, 0, 0]; }
        pos.set(P, k * 12);
        for (let m = 0; m < 4; m++) nor.set(N, k * 12 + m * 3);
        uv.set([u0, v0, u1, v0, u1, v1, u0, v1], k * 8);
        const o = k * 4;
        // medurs sett från normalens håll = framsida i three.js (se härledningen i commit-texten)
        if (f.face === 'right') idx.set([o, o + 1, o + 2, o, o + 2, o + 3], k * 6);
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

  // kablarna ritas som i 2D – ovanpå bilden, i #board-canvasens upplösning
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
  info() { return { ...this.stats, active: this.active, cache: this.cache.size }; }
  dispose() { this.detach(); this.atlas?.dispose(); this.v.scene.remove(this.group); }
}
