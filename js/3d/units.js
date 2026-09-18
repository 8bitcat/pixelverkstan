// Inredningen på platserna (montrar, torn, TV-hörna, spelhylla, spelbord, arkadskåp,
// automater, lediga platser), stjärnobjektet med avspärrning, möbler, prylar och
// leveranslådor – byggt i 3D från samma data som 2D-golvet (floor.unitList, floor-layout).
import * as THREE from 'three';
import * as A from './assets.js';
import * as C from './coords.js';
import { boxArt, coverArt, plate, boxGeo, canvasTex } from './textures.js';
import { slab, glassMat, metalMat, paintMat, signBoard, neonSign } from './room.js';
import * as LY from '../core/floor-layout.js';
import * as WK from '../core/floor-walk.js';
import { consoleSprite, coverSprite, marqueeText, attractFrame, ATTRACT_FOR_ENGINE } from '../shops/dator/art-products.js';

const BOX = { gpu: [0.3, 0.24, 0.08], cpu: [0.11, 0.11, 0.1], ram: [0.15, 0.1, 0.03], storage: [0.16, 0.13, 0.05], sound: [0.22, 0.17, 0.06], mb: [0.32, 0.27, 0.09], case: [0.34, 0.42, 0.22], psu: [0.19, 0.17, 0.13], cooler: [0.15, 0.16, 0.14], fans: [0.13, 0.13, 0.05], media: [0.14, 0.13, 0.02], konsol: [0.36, 0.26, 0.13], spel: [0.14, 0.19, 0.02] };
const DEF_BOX = [0.2, 0.16, 0.08];
const ledStrip = () => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.5, 1.4) });

export class Units {
  constructor(scene, ctx) {
    this.scene = scene; this.ctx = ctx;
    this.group = new THREE.Group(); this.group.name = 'units';
    scene.add(this.group);
    this.pickables = [];
    this.anim = [];
    this.boxes = new Map();
    this.boxGroup = new THREE.Group(); scene.add(this.boxGroup);
    this.t = 0;
    this.matCache = new Map();
  }
  get shop() { return this.ctx.game.shop; }
  get floor() { return this.ctx.floor; }
  get year() { return this.ctx.game.year; }

  clear() {
    this.group.traverse((o) => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); });
    this.scene.remove(this.group);
    this.group = new THREE.Group(); this.group.name = 'units'; this.scene.add(this.group);
    this.pickables = []; this.anim = [];
  }
  add(obj, pick = null) {
    if (pick) { obj.userData.pick = pick; this.pickables.push(obj); }
    this.group.add(obj);
    return obj;
  }

  // ---------- Produkter ----------
  boxMesh(part, dims = null) {
    const cat = this.shop.cats?.[part.cat];
    const [w, h, d] = dims || BOX[part.cat] || DEF_BOX;
    let tex;
    if (part.cat === 'spel' || part.cat === 'konsol') {
      const sp = part.cat === 'spel' ? coverSprite(part, 6) : consoleSprite(part, 6);
      tex = coverArt(part, sp, { color: cat?.color || '#3a78d8', label: cat?.name || '' });
    } else {
      const F = this.shop.fit, bkey = F?.brandKey ? F.brandKey(part) : null, b = bkey && F.brandInfo ? F.brandInfo(part.cat, bkey) : null;
      let icon = null; try { icon = this.floor.icon(part, 96, 72); } catch { icon = null; }
      tex = boxArt(part, { catName: F?.CAT_NAME?.[part.cat] || cat?.name || part.cat, color: b?.color || cat?.color || '#3a78d8', brandName: b?.name || '', icon, year: part.year || null, sub: part.desc ? String(part.desc).slice(0, 30) : '' });
    }
    let m = this.matCache.get(tex);
    if (!m) { m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.02 }); this.matCache.set(tex, m); }
    const mesh = new THREE.Mesh(boxGeo(w, h, d), m);
    this.boxCount = (this.boxCount || 0) + 1;
    mesh.geometry.userData.shared = true; mesh.userData.shared = true;
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.dims = [w, h, d];
    return mesh;
  }
  // rad med lådor centrerad på en hylla (lokala koordinater i enheten)
  row(g, parts, y, W, { z = 0, gap = 0.05, jitter = 0.06, front = false } = {}) {
    if (!parts.length) return;
    const meshes = parts.map((p) => this.boxMesh(p));
    const total = meshes.reduce((s, m) => s + m.userData.dims[0], 0) + gap * (meshes.length - 1);
    let x = -Math.min(total, W - 0.08) / 2;
    const k = total > W - 0.08 ? (W - 0.08) / total : 1;
    for (const m of meshes) {
      const [w, h, d] = m.userData.dims;
      m.position.set(x + w * k / 2, y + h / 2 + 0.004, z + (front ? 0 : 0));
      m.rotation.y = (Math.random() - 0.5) * jitter;
      x += w * k + gap * k;
      g.add(m);
    }
  }
  fitsPerRow(cat, W, gap = 0.05) { const w = (BOX[cat] || DEF_BOX)[0]; return Math.max(1, Math.floor((W - 0.08 + gap) / (w + gap))); }

  // ---------- Monter/torn (kategori eller märke) ----------
  vitrine(u) {
    const sl = u.slot, style = LY.PLAN.style, small = sl.size === 'small';
    const W = (sl.x1 - sl.x0) * C.S, z0 = C.toZ(sl.base - LY.SLOT_DEPTH[sl.size]), z1 = C.toZ(sl.base), D = z1 - z0, H = small ? 2.0 : 1.9;
    const g = new THREE.Group();
    g.position.set(C.toX((sl.x0 + sl.x1) / 2), 0, (z0 + z1) / 2);
    const glass = style === 'glass' || style === 'led';
    const frame = style === 'wood' ? A.pbr('wood_table_001', { repeat: [0.5, 1], color: 0xb08a5a }) : style === 'metal' ? metalMat(0xc9ced3, 0.45) : metalMat(style === 'led' ? 0x0f1114 : 0x1b1d22, 0.3);
    const back = style === 'wood' ? A.pbr('plywood', { repeat: [W / 2.4, H / 2.4], color: 0xd9c39a }) : style === 'metal' ? paintMat(0xdfe3e6, 0.7) : paintMat(style === 'led' ? 0x14161a : 0x23262b, 0.6);
    const cat = this.shop.cats?.[u.cat], brand = u.brand;
    const col = brand?.color || cat?.color || '#3a78d8';
    // sockel, lågt bakstycke (glasmontrar är genomsiktliga från alla håll), stolpar, topp
    slab(g, -W / 2, W / 2, 0, 0.12, -D / 2, D / 2, frame);
    slab(g, -W / 2, W / 2, 0.12, 0.42, -D / 2, -D / 2 + 0.03, back);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) slab(g, sx * (W / 2 - 0.04) - 0.02, sx * (W / 2 - 0.04) + 0.02, 0.12, H, sz * (D / 2 - 0.04) - 0.02, sz * (D / 2 - 0.04) + 0.02, frame);
    slab(g, -W / 2, W / 2, H - 0.05, H, -D / 2, D / 2, frame);
    // hyllplan (glas eller trä/plåt) med ljuslist under framkanten
    const ys = small ? [0.38, 0.82, 1.26, 1.66] : [0.5, 0.95, 1.4];
    const shelfMat = glass ? glassMat(0xe8f4f8, 0.75) : style === 'wood' ? A.pbr('wood_table_001', { repeat: [1, 0.4], color: 0xc7a06a }) : paintMat(0xe8ebee, 0.5);
    const led = ledStrip();
    if (style === 'led') led.color.set(col).multiplyScalar(1.6);
    const parts = (this.floor.partsFor ? this.floor.partsFor(u) : []).slice(0, ys.length * this.fitsPerRow(u.cat, W));
    const per = this.fitsPerRow(u.cat, W);
    ys.forEach((y, i) => {
      slab(g, -W / 2 + 0.05, W / 2 - 0.05, y - 0.012, y, -D / 2 + 0.04, D / 2 - 0.03, shelfMat, { cast: false });
      if (glass || style === 'led') slab(g, -W / 2 + 0.08, W / 2 - 0.08, y - 0.03, y - 0.015, D / 2 - 0.06, D / 2 - 0.04, led, { cast: false, recv: false });
      this.row(g, parts.slice(i * per, (i + 1) * per), y, W, { z: 0.02 });
    });
    // glas runt om (fram och sidor) – bara i glas-/led-stil
    if (glass) {
      const gm = glassMat(0xe4eef2, 0.9), gh = H - 0.12 - 0.3;
      const front = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, gh), gm); front.position.set(0, 0.12 + gh / 2, D / 2 - 0.02); g.add(front);
      const rear = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, gh - 0.3), gm); rear.position.set(0, 0.42 + (gh - 0.3) / 2, -D / 2 + 0.035); g.add(rear);
      for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.PlaneGeometry(D - 0.1, gh), gm); side.rotation.y = Math.PI / 2; side.position.set(sx * (W / 2 - 0.02), 0.12 + gh / 2, 0); g.add(side); }
    }
    // skylt högst upp
    const title = brand ? brand.name : (this.shop.fit?.CAT_NAME?.[u.cat] || cat?.name || u.cat);
    const s = signBoard(title.toUpperCase(), Math.min(W - 0.06, 2.2), 0.24, { bg: col, sub: brand ? (this.shop.fit?.CAT_NAME?.[u.cat] || '') : (u.def?.level ? 'nivå ' + u.def.level : ''), thick: 0.05 });
    s.position.set(0, H - 0.17, D / 2 + 0.01); g.add(s);
    const s2 = signBoard(title.toUpperCase(), Math.min(W - 0.06, 2.2), 0.24, { bg: col, sub: brand ? (this.shop.fit?.CAT_NAME?.[u.cat] || '') : '', thick: 0.05 });
    s2.position.set(0, H - 0.17, -D / 2 - 0.01); s2.rotation.y = Math.PI; g.add(s2);
    // liten prislapp-remsa på hyllkanten
    if (style !== 'wood') slab(g, -W / 2 + 0.06, W / 2 - 0.06, ys[0] - 0.05, ys[0] - 0.012, D / 2 - 0.035, D / 2 - 0.03, paintMat(0xf4f1ea, 0.6), { cast: false });
    this.add(g, { type: 'unit', what: { slot: u.i, cat: u.cat, brand: u.def?.brand || null, title: this.shop.fit?.slotTitle?.(u.def) } });
  }

  // ---------- TV-hörnan ----------
  screenTex(kind) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 192;
    const tex = canvasTex(c); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.NearestFilter;
    const ctx = c.getContext('2d');
    const draw = (t) => { attractFrame(ctx, kind, 0, 0, 256, 192, t); ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < 192; y += 3) ctx.fillRect(0, y, 256, 1); tex.needsUpdate = true; };
    draw(0);
    this.anim.push({ every: 0.11, acc: 0, fn: draw });
    return tex;
  }
  tvSet(g, x, y, z, w, kind, crt) {
    const sm = new THREE.MeshBasicMaterial({ map: this.screenTex(kind) }); sm.color.setScalar(1.35);
    if (crt) {
      const h = w * 0.82, d = w * 0.85;
      slab(g, x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2, paintMat(0x3b3a3e, 0.6));
      slab(g, x - w / 2 + 0.02, x + w / 2 - 0.02, y + 0.03, y + h - 0.03, z + d / 2 - 0.01, z + d / 2 + 0.02, paintMat(0x1a1a1e, 0.4));
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.76, h * 0.72), sm); scr.position.set(x, y + h * 0.52, z + d / 2 + 0.022); g.add(scr);
      slab(g, x + w / 2 - 0.11, x + w / 2 - 0.04, y + h * 0.3, y + h * 0.36, z + d / 2 + 0.02, z + d / 2 + 0.025, paintMat(0xc9c0b0, 0.6), { cast: false });
    } else {
      const h = w * 0.58;
      slab(g, x - w / 2, x + w / 2, y + 0.08, y + 0.08 + h, z - 0.02, z + 0.02, paintMat(0x101114, 0.35));
      slab(g, x - 0.2, x + 0.2, y, y + 0.09, z - 0.12, z + 0.12, metalMat(0x2a2c31, 0.4));
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, h - 0.04), sm); scr.position.set(x, y + 0.08 + h / 2, z + 0.021); g.add(scr);
    }
  }
  tvCorner(u) {
    const sl = u.slot, W = (sl.x1 - sl.x0) * C.S, z0 = C.toZ(sl.base - LY.SLOT_DEPTH[sl.size]), z1 = C.toZ(sl.base), D = z1 - z0;
    const g = new THREE.Group(); g.position.set(C.toX((sl.x0 + sl.x1) / 2), 0, (z0 + z1) / 2);
    slab(g, -W / 2 + 0.05, W / 2 - 0.05, 0, 0.55, -D / 2 + 0.05, D / 2 - 0.15, A.pbr('dark_wood', { repeat: [1.2, 0.3], roughness: 0.4 }));
    slab(g, -W / 2 + 0.03, W / 2 - 0.03, 0.55, 0.59, -D / 2 + 0.03, D / 2 - 0.13, A.pbr('dark_wood', { repeat: [1.2, 0.3], roughness: 0.35 }));
    const game = this.floor.productsShown('spel', 1)[0];
    const kind = game ? (ATTRACT_FOR_ENGINE[game.engine] || game.attract || 'platform') : 'platform';
    const crt = this.year < 2008;
    this.tvSet(g, -W / 4, 0.59, -0.02, crt ? 0.62 : Math.min(1.1, W * 0.55), kind, crt);
    // konsolerna: kartonger på skåpet och en modern konsol som modell
    const cons = u.shownCons || this.floor.productsShown('konsol', 4);
    u.shownCons = cons;
    const gm = new THREE.Group(); gm.position.set(W / 4, 0.59, 0); g.add(gm);
    this.row(gm, cons.slice(0, 2), 0, W / 2 - 0.1, { jitter: 0.1 });
    if (cons.length > 2) { const gf = new THREE.Group(); gf.position.set(W / 4, 0, D / 2 - 0.1); g.add(gf); this.row(gf, cons.slice(2, 4), 0, W / 2, { jitter: 0.2 }); }
    const pad = A.instance(A.get('gamepad'), { fit: { w: 0.16 } });
    if (pad && this.year >= 1985) { pad.position.set(-W / 4 + 0.35, 0.59, D / 2 - 0.22); pad.rotation.y = 0.5; g.add(pad); }
    const con = A.instance(A.get('gaming_console'), { fit: { w: 0.3 } });
    if (con && this.year >= 2006) { con.position.set(-W / 4 + 0.05, 0.59, D / 2 - 0.2); g.add(con); }
    const s = signBoard('TV-HÖRNAN', Math.min(W - 0.2, 1.6), 0.24, { bg: '#e23b5a', sub: 'prova konsolerna' });
    s.position.set(0, 1.95, -D / 2 + 0.06); g.add(s);
    slab(g, -W / 2 + 0.1, W / 2 - 0.1, 1.8, 2.1, -D / 2 + 0.0, -D / 2 + 0.02, paintMat(0x2a2430, 0.6), { cast: false });
    this.add(g, { type: 'unit', what: { slot: u.i, unit: 'tv', title: this.shop.fit?.slotTitle?.(u.def) } });
  }

  // ---------- Spelhyllan ----------
  gameShelf(u) {
    const sl = u.slot, W = (sl.x1 - sl.x0) * C.S, z0 = C.toZ(sl.base - LY.SLOT_DEPTH[sl.size]), z1 = C.toZ(sl.base), D = Math.min(0.42, z1 - z0);
    const g = new THREE.Group(); g.position.set(C.toX((sl.x0 + sl.x1) / 2), 0, z1 - D / 2);
    const wood = A.pbr('oak_veneer_01', { repeat: [W / 2.4, 0.5], color: 0xd8b98a });
    slab(g, -W / 2, -W / 2 + 0.03, 0, 1.9, -D / 2, D / 2, wood); slab(g, W / 2 - 0.03, W / 2, 0, 1.9, -D / 2, D / 2, wood);
    slab(g, -W / 2, W / 2, 0.02, 1.9, -D / 2, -D / 2 + 0.02, A.pbr('plywood', { repeat: [W / 2.4, 0.8], color: 0x3a3040 }));
    slab(g, -W / 2, W / 2, 1.9, 1.94, -D / 2, D / 2, wood);
    const ys = [0.15, 0.62, 1.09, 1.56];
    const per = Math.max(1, Math.floor((W - 0.08) / 0.19));
    const games = this.floor.productsShown('spel', ys.length * per);
    ys.forEach((y, i) => {
      slab(g, -W / 2 + 0.03, W / 2 - 0.03, y - 0.03, y, -D / 2 + 0.02, D / 2 - 0.02, wood);
      slab(g, -W / 2 + 0.05, W / 2 - 0.05, y + 0.4, y + 0.415, D / 2 - 0.08, D / 2 - 0.06, ledStrip(), { cast: false, recv: false });
      const gg = new THREE.Group(); gg.position.z = 0.04; g.add(gg);
      this.row(gg, games.slice(i * per, (i + 1) * per), y, W, { gap: 0.04, jitter: 0.08 });
    });
    const s = signBoard('SPEL', Math.min(W - 0.1, 1.4), 0.24, { bg: '#3a78d8', sub: `${games.length} titlar` });
    s.position.set(0, 2.07, D / 2 - 0.05); g.add(s);
    this.add(g, { type: 'unit', what: { slot: u.i, unit: 'spelhylla', title: this.shop.fit?.slotTitle?.(u.def) } });
  }

  // ---------- Spelbordet ----------
  desk(u) {
    const sl = u.slot, W = (sl.x1 - sl.x0) * C.S, z0 = C.toZ(sl.base - LY.SLOT_DEPTH[sl.size]), z1 = C.toZ(sl.base), D = z1 - z0;
    const g = new THREE.Group(); g.position.set(C.toX((sl.x0 + sl.x1) / 2), 0, (z0 + z1) / 2);
    const wood = A.pbr('wood_table_001', { repeat: [W / 2.4, 0.3], color: 0xc9a06a });
    const dw = Math.min(W - 0.1, 1.6), dd = Math.min(D - 0.05, 0.75);
    slab(g, -dw / 2, dw / 2, 0.72, 0.76, -dd / 2, dd / 2, wood);
    for (const sx of [-1, 1]) slab(g, sx * (dw / 2 - 0.05) - 0.03, sx * (dw / 2 - 0.05) + 0.03, 0, 0.72, -dd / 2 + 0.05, dd / 2 - 0.05, metalMat(0x2a2c31, 0.5));
    const pc = this.ctx.game.deskPc;
    const kind = 'platform';
    if (this.year < 2004) {
      // beige dator med CRT-skärm och tangentbord
      slab(g, -0.28, 0.28, 0.76, 0.9, -dd / 2 + 0.05, dd / 2 - 0.25, paintMat(0xd9d2c0, 0.6));
      this.tvSet(g, 0, 0.9, -0.08, 0.42, kind, true);
      slab(g, -0.22, 0.22, 0.76, 0.79, dd / 2 - 0.2, dd / 2 - 0.05, paintMat(0xcfc8b8, 0.7));
    } else {
      slab(g, dw / 2 - 0.3, dw / 2 - 0.08, 0.76, 1.2, -dd / 2 + 0.05, dd / 2 - 0.3, paintMat(0x1c1d21, 0.35));
      this.tvSet(g, -0.05, 0.76, -0.12, 0.6, kind, false);
      slab(g, -0.25, 0.2, 0.76, 0.78, dd / 2 - 0.22, dd / 2 - 0.06, paintMat(0x2b2c30, 0.6));
    }
    // pall
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 20), A.pbr('fabric_leather_02', { repeat: [0.5, 0.5], color: 0x8a2a2a }));
    st.position.set(0, 0.5, dd / 2 + 0.3); st.castShadow = true; g.add(st);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 10), metalMat(0xbfc4c9, 0.3)); leg.position.set(0, 0.24, dd / 2 + 0.3); g.add(leg);
    const s = signBoard(pc ? 'SPELDATORN' : 'SPELBORD', Math.min(W - 0.1, 1.4), 0.24, { bg: '#7a5bc9', sub: pc ? 'prova och spela' : 'bygg butikens egen dator' });
    s.position.set(0, 1.85, -D / 2 + 0.06); g.add(s);
    this.add(g, { type: 'unit', what: { slot: u.i, unit: 'spelbord', title: this.shop.fit?.slotTitle?.(u.def) } });
  }

  // ---------- Arkadskåp ----------
  arcade(u) {
    const sl = u.slot, p = u.prod, z1 = C.toZ(sl.base);
    const g = new THREE.Group(); g.position.set(C.toX((sl.x0 + sl.x1) / 2), 0, z1 - 0.42);
    const side = p?.look?.side || '#2a2a34';
    const body = paintMat(0x1c1c22, 0.5);
    slab(g, -0.36, 0.36, 0, 1.85, -0.42, 0.1, body);
    slab(g, -0.37, -0.35, 0.05, 1.8, -0.4, 0.08, paintMat(side, 0.55)); slab(g, 0.35, 0.37, 0.05, 1.8, -0.4, 0.08, paintMat(side, 0.55));
    slab(g, -0.36, 0.36, 1.0, 1.1, 0.1, 0.4, body);
    slab(g, -0.34, 0.34, 1.1, 1.13, 0.12, 0.38, paintMat(0x2f2f38, 0.5));
    for (const bx of [-0.12, 0.02, 0.16]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 12), paintMat(['#e23b5a', '#f0e030', '#3fb04a'][Math.round(bx * 10 + 1)] || '#e23b5a', 0.3)); b.position.set(bx, 1.14, 0.3); g.add(b); }
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), metalMat(0xbfc4c9, 0.3)); stick.position.set(-0.22, 1.17, 0.28); g.add(stick);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), paintMat('#e23b5a', 0.3)); ball.position.set(-0.22, 1.23, 0.28); g.add(ball);
    const kind = p ? (ATTRACT_FOR_ENGINE[p.attract] || p.attract || 'platform') : 'platform';
    const sm = new THREE.MeshBasicMaterial({ map: this.screenTex(kind) }); sm.color.setScalar(1.4);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.44), sm); scr.position.set(0, 1.45, 0.101); scr.rotation.x = -0.12; g.add(scr);
    const mq = neonSign(p ? marqueeText(p) : 'ARCADE', '#f0e030', 0.68, 0.22, 1.9); mq.position.set(0, 1.95, 0.05); g.add(mq);
    slab(g, -0.36, 0.36, 1.85, 2.05, -0.42, 0.1, body);
    this.add(g, { type: 'unit', what: { slot: u.i, unit: 'arkad', title: this.shop.fit?.slotTitle?.(u.def) } });
  }

  // ---------- Automater (kaffe, godis …) ----------
  vendor(u) {
    const sl = u.slot, z1 = C.toZ(sl.base), kind = u.def?.unit || 'kaffe';
    const g = new THREE.Group(); g.position.set(C.toX((sl.x0 + sl.x1) / 2), 0, z1 - 0.32);
    const col = kind === 'kaffe' ? '#6b3e2a' : '#e23b5a';
    slab(g, -0.32, 0.32, 0, 1.75, -0.3, 0.3, paintMat(col, 0.5));
    const win = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.2, 1.1) });
    slab(g, -0.24, 0.24, 0.85, 1.4, 0.3, 0.31, win, { cast: false });
    slab(g, -0.2, 0.2, 0.3, 0.5, 0.3, 0.32, paintMat(0x111214, 0.4), { cast: false });
    const s = signBoard(kind.toUpperCase(), 0.6, 0.2, { bg: col }); s.position.set(0, 1.58, 0.31); g.add(s);
    this.add(g, { type: 'unit', what: { slot: u.i, unit: kind, title: this.shop.fit?.slotTitle?.(u.def) } });
  }

  // ---------- Ledig plats ----------
  empty(u) {
    const sl = u.slot, r = C.rect([sl.x0, sl.base - LY.SLOT_DEPTH[sl.size], sl.x1, sl.base]);
    const g = new THREE.Group(); g.position.set(r.x, 0, r.z);
    const tape = new THREE.MeshBasicMaterial({ color: 0xf5c542 });
    const w = r.w, d = r.d;
    slab(g, -w / 2, w / 2, 0.002, 0.005, -d / 2, -d / 2 + 0.04, tape, { cast: false }); slab(g, -w / 2, w / 2, 0.002, 0.005, d / 2 - 0.04, d / 2, tape, { cast: false });
    slab(g, -w / 2, -w / 2 + 0.04, 0.002, 0.005, -d / 2, d / 2, tape, { cast: false }); slab(g, w / 2 - 0.04, w / 2, 0.002, 0.005, -d / 2, d / 2, tape, { cast: false });
    const s = signBoard(`LEDIG PLATS ${u.i + 1}`, 0.7, 0.26, { bg: '#f5c542', sub: 'köp inredning under Butiken' });
    s.position.set(0, 0.95, 0); g.add(s);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.82, 8), metalMat(0x8a8f96, 0.4)); post.position.set(0, 0.41, -0.02); g.add(post);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), metalMat(0x8a8f96, 0.4)); foot.position.set(0, 0.01, -0.02); g.add(foot);
    this.add(g, { type: 'unit', what: { slot: u.i, empty: true } });
  }

  // ---------- Stjärnobjektet ----------
  hero() {
    const H = LY.HERO, part = this.floor.heroPart;
    if (!H || !part) return;
    const g = new THREE.Group(); g.position.set(C.toX(H.cx), 0, C.toZ(H.base) - 0.35);
    slab(g, -0.4, 0.4, 0, 0.95, -0.4, 0.4, A.pbr('dark_wood', { repeat: [0.4, 0.5], roughness: 0.35 }));
    slab(g, -0.42, 0.42, 0.95, 0.99, -0.42, 0.42, metalMat(0x1b1d22, 0.3));
    const dome = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.62, 0.7), glassMat(0xe8f4f8, 0.94)); dome.position.y = 1.3; g.add(dome);
    slab(g, -0.36, 0.36, 1.61, 1.66, -0.36, 0.36, metalMat(0x1b1d22, 0.3));
    slab(g, -0.3, 0.3, 1.6, 1.61, -0.3, 0.3, ledStrip(), { cast: false, recv: false });
    const box = this.boxMesh(part); box.position.y = 0.99 + box.userData.dims[1] / 2 + 0.05; g.add(box);
    this.anim.push({ every: 0, acc: 0, fn: (t) => { box.rotation.y = t * 0.6; box.position.y = 0.99 + box.userData.dims[1] / 2 + 0.05 + Math.sin(t * 1.5) * 0.015; } });
    const s = signBoard(this.floor.heroTitle || part.name, 0.78, 0.26, { bg: this.ctx.theme.neon || '#7ee8fa', sub: 'stjärnobjektet' });
    s.position.set(0, 0.6, 0.41); g.add(s);
    this.add(g, { type: 'unit', what: { hero: part.id } });
    // avspärrning: kromstolpar med sammetsrep
    const R = LY.ROPE, zb = C.toZ(R.back), zf = C.toZ(R.front), xa = C.toX(R.x0), xb = C.toX(R.x1), xm = C.toX(H.cx);
    const posts = [[xa, zb], [xb, zb], [xa, zf], [xm, zf], [xb, zf]];
    const chrome = metalMat(0xd6dadf, 0.18), rope = new THREE.MeshStandardMaterial({ color: 0x9e1b22, roughness: 0.95 });
    const pg = new THREE.Group();
    for (const [x, z] of posts) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 12), chrome); p.position.set(x, 0.475, z); p.castShadow = true; pg.add(p);
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.02, 20), chrome); f.position.set(x, 0.01, z); pg.add(f);
      const k = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), chrome); k.position.set(x, 0.97, z); pg.add(k);
    }
    const link = (a, b) => {
      const mid = new THREE.Vector3((a[0] + b[0]) / 2, 0.72, (a[1] + b[1]) / 2);
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], 0.9, a[1]), mid, new THREE.Vector3(b[0], 0.9, b[1]));
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.022, 8, false), rope); m.castShadow = true; pg.add(m);
    };
    link(posts[0], posts[2]); link(posts[2], posts[3]); link(posts[3], posts[4]); link(posts[4], posts[1]);
    this.group.add(pg);
  }

  // ---------- Möbler och prylar ----------
  furniture() {
    const items = this.ctx.game.fit?.items || {};
    const put = (name, r, rotY = 0, fit = null) => {
      const m = A.instance(A.get(name), { fit }); if (!m) return null;
      m.position.set(r.x, 0, r.z); m.rotation.y = rotY; this.group.add(m); return m;
    };
    if (LY.SOFA) put('sofa_02', C.rect([LY.SOFA.x0, LY.SOFA.base - 24, LY.SOFA.x1, LY.SOFA.base]), 0, { w: (LY.SOFA.x1 - LY.SOFA.x0) * C.S });
    if (LY.ARMCHAIR) put('modern_arm_chair_01', C.rect([LY.ARMCHAIR.x0, LY.ARMCHAIR.base - 22, LY.ARMCHAIR.x1, LY.ARMCHAIR.base]), -0.2, { w: 0.85 });
    if (LY.TABLE) put('coffee_table_round_01', C.rect([LY.TABLE.x0, LY.TABLE.base - 14, LY.TABLE.x1, LY.TABLE.base]), 0, { w: 0.8 });
    if (LY.BENCH) {
      const r = C.rect([LY.BENCH.x0, LY.BENCH.base - 16, LY.BENCH.x1, LY.BENCH.base]);
      const g = new THREE.Group(); g.position.set(r.x, 0, r.z);
      const wood = A.pbr('wood_table_001', { repeat: [1, 0.3], color: 0xb08a5a });
      for (const dz of [-0.14, 0, 0.14]) slab(g, -r.w / 2, r.w / 2, 0.42, 0.46, dz - 0.06, dz + 0.06, wood);
      for (const sx of [-1, 1]) slab(g, sx * (r.w / 2 - 0.1) - 0.03, sx * (r.w / 2 - 0.1) + 0.03, 0, 0.42, -0.2, 0.2, metalMat(0x2a2c31, 0.5));
      this.group.add(g);
    }
    const plants = [...LY.PLANTS, ...(items.vaxter ? LY.EXTRA_PLANTS : [])];
    plants.forEach(([x, y], i) => put(i % 2 ? 'potted_plant_02' : 'potted_plant_02', { x: C.toX(x), z: C.toZ(y) - 0.1 }, i * 1.7, { h: 1.1 + (i % 3) * 0.15 }));
    for (const p of LY.PLAN.props || []) {
      const r = C.rect([p.x0, p.y0, p.x1, p.y1]);
      if (p.kind === 'crates') { const a = put('plastic_crate_02', r, 0.1, { w: 0.5 }); const b = put('plastic_crate_02', { x: r.x + 0.05, z: r.z }, -0.15, { w: 0.5 }); if (a && b) b.position.y = A.modelSize(a).y; }
      else if (p.kind === 'barrel') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.86, 20), A.pbr('blue_metal_plate', { repeat: [1, 1] })); m.position.set(r.x, 0.43, r.z); m.castShadow = true; this.group.add(m); }
      else if (p.kind === 'bin') { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.6, 16), metalMat(0x3a3d42, 0.5)); m.position.set(r.x, 0.3, r.z); m.castShadow = true; this.group.add(m); }
      else if (p.kind === 'stand') put('standing_chalkboard_01', r, 0.3, { h: 1.0 });
      else if (p.kind === 'pillar') slab(this.group, r.x0, r.x1, 0, C.ROOM.H, r.z0, r.z1, A.pbr('white_plaster_02', { repeat: [0.5, 1.3] }));
    }
    // trottoarskylten utanför dörren
    const af = put('standing_chalkboard_01', { x: C.toX(LY.AFRAME[0]), z: -1.2 }, 0.35, { h: 1.0 });
    if (af) af.position.z = -1.0;
    // Källarhålan: bråte i förrådsdelen
    if (LY.PLAN.junk) {
      const px = C.toX(LY.PLAN.partition);
      put('cardboard_box_01', { x: px - 1.2, z: 2.0 }, 0.4, { w: 0.6 }); put('cardboard_box_01', { x: px - 2.0, z: 3.2 }, -0.3, { w: 0.5 });
      put('plastic_crate_02', { x: px - 1.0, z: 5.5 }, 0.2, { w: 0.5 });
      put('steel_frame_shelves_01', { x: C.ROOM.X0 + 0.5, z: 5.0 }, Math.PI / 2, { h: 2.0 });
      put('wooden_display_shelves_01', { x: px - 0.6, z: 7.6 }, 0, { h: 1.9 });
    }
    // dammsugare/skyltar: "Vått golv" nära dörren ibland
    if (this.ctx.game.year % 3 === 0) put('WetFloorSign_01', { x: C.toX(LY.DOOR.cx) + 0.8, z: 1.6 }, 0.6, { h: 0.6 });
  }

  rebuild() {
    this.clear();
    this.boxCount = 0;
    for (const u of this.floor.unitList || []) {
      if (u.empty) this.empty(u);
      else if (u.unit === 'tv') this.tvCorner(u);
      else if (u.unit === 'spelhylla') this.gameShelf(u);
      else if (u.unit === 'spelbord') this.desk(u);
      else if (u.unit === 'arkad') this.arcade(u);
      else if (u.frame) this.vitrine(u);
      else if (u.def) this.vendor(u);
    }
    this.hero();
    this.furniture();
  }

  // leveranslådor vid dörren (följer game.deliveries)
  syncBoxes(dt) {
    const boxes = this.floor.arrivedBoxes();
    const seen = new Set();
    boxes.forEach((d, i) => {
      seen.add(d.id);
      let b = this.boxes.get(d.id);
      const [px, py] = this.floor.boxPos(i);
      if (!b) {
        const m = A.instance(A.get('cardboard_box_01'), { fit: { w: 0.55 } }) || new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), paintMat(0xb08a5a, 0.9));
        m.rotation.y = (i * 1.3) % 1.2 - 0.6;
        m.userData.pick = { type: 'box', d };
        this.boxGroup.add(m);
        b = { m, t: 0 };
        this.boxes.set(d.id, b);
      }
      b.t += dt;
      const drop = Math.max(0, 1 - b.t * 2.2);
      b.m.position.set(C.toX(px), drop * drop * 1.2, C.toZ(py));
    });
    for (const [id, b] of this.boxes) if (!seen.has(id)) { this.boxGroup.remove(b.m); this.boxes.delete(id); }
  }
  update(dt) {
    this.t += dt;
    for (const a of this.anim) { a.acc += dt; if (a.acc >= a.every) { a.acc = 0; a.fn(this.t); } }
    this.syncBoxes(dt);
  }
  pickTargets() { return [...this.pickables, ...[...this.boxes.values()].map((b) => b.m)]; }
  dispose() { this.clear(); this.scene.remove(this.group); this.scene.remove(this.boxGroup); }
}

export const MODELS_UNITS = ['sofa_02', 'modern_arm_chair_01', 'coffee_table_round_01', 'potted_plant_02', 'cardboard_box_01', 'plastic_crate_02', 'standing_chalkboard_01', 'gamepad', 'gaming_console', 'steel_frame_shelves_01', 'wooden_display_shelves_01', 'WetFloorSign_01'];
