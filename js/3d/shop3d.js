// 3D-läget för butiken: förstapersonsvy i samma butik som 2D-golvet simulerar. Renderar med
// three.js (PBR-material, HDRI, skuggor, GTAO, bloom, SMAA), styrs med mus + WASD (eller
// pekskärm) och klick träffar samma kunder, montrar och lådor som i 2D-läget.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import * as A from './assets.js';
import * as C from './coords.js';
import { buildRoom, MODELS_ROOM } from './room.js';
import { Units, MODELS_UNITS } from './units.js';
import { People } from './people.js';
import * as LY from '../core/floor-layout.js';
import * as WK from '../core/floor-walk.js';

export const QUALITIES = ['hög', 'medel', 'låg'];
const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const EYE = 1.62, RADIUS = 0.12, SPEED = 2.6, RUN = 4.3, REACH = 3.8;
const $ = (s) => document.querySelector(s);

export class Shop3D {
  constructor(canvas, hooks) {
    this.canvas = canvas; this.hooks = hooks;
    this.active = false; this.ready = false; this.placed = false;
    this.keys = new Set(); this.locked = false; this.hover = null; this.hoverT = 0;
    this.yaw = Math.PI; this.pitch = -0.04; this.pos = new THREE.Vector3(0, 0, 3); this.vel = new THREE.Vector3(); this.moving = false; this.bob = 0;
    this.quality = QUALITIES.includes(store.get('pixelverkstan_3dq')) ? store.get('pixelverkstan_3dq') : 'hög';
    this.perf = { t: 0, n: 0, steps: 0, warm: 0, last: 0, avg: 0 };
    this.sig = ''; this.fitSig = ''; this.lokal = 0; this.year = 0; this.envDirty = true; this.envT = 0;
    this.lastPos = new Map(); this.wasAway = false; this.touch = null; this.walkerIds = new WeakMap(); this.nextWalker = 1;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = REACH + 1;
    this.frames = 0;
  }
  attach(game, floor) {
    this.game = game; this.floor = floor;
    this.placed = false;
    if (this.ready) this.rebuildAll();
  }

  // ---------- Start ----------
  async init(onProgress = () => {}) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    r.info.autoReset = false;
    r.outputColorSpace = THREE.SRGBColorSpace;
    A.setAnisotropy(Math.min(8, r.capabilities.getMaxAnisotropy()));
    RectAreaLightUniformsLib.init();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.05, 90);
    this.camera.rotation.order = 'YXZ';
    this.pmrem = new THREE.PMREMGenerator(r);
    this.pmrem.compileEquirectangularShader();
    // ladda allt parallellt och rapportera förloppet
    const hdriP = A.loadHdri('docklands_02_1k');
    const modelsP = A.preload([...MODELS_ROOM, ...MODELS_UNITS]);
    this.people = new People(this.scene);
    const rigP = this.people.load();
    const tick = setInterval(() => onProgress(A.progress().frac * 0.9), 120);
    const hdri = await hdriP;
    await Promise.all([modelsP, rigP, A.whenLoaded()]);
    clearInterval(tick);
    onProgress(0.92);
    if (hdri) {
      this.scene.background = hdri;
      this.scene.backgroundBlurriness = 0.0;
      this.scene.backgroundIntensity = 1.0;
      this.hdriEnv = this.pmrem.fromEquirectangular(hdri).texture;
      this.scene.environment = this.hdriEnv;
      this.scene.environmentIntensity = 0.45;
    } else this.scene.background = new THREE.Color(0x8fb4d8);
    this.rebuildAll();
    this.setQuality(this.quality);
    this.bindInput();
    this.ready = true;
    onProgress(1);
  }
  ctx() { const g = this.game; return { game: g, floor: this.floor, plan: LY.PLAN, lokal: this.floor.lokal, year: g.year, shop: g.shop, theme: g.shop.theme || {} }; }
  rebuildAll() {
    this.room?.dispose(); this.units?.dispose();
    const ctx = this.ctx();
    this.room = buildRoom(this.scene, ctx);
    ctx.room = this.room;
    this.units = new Units(this.scene, ctx);
    this.units.rebuild();
    this.lokal = this.floor.lokal; this.fitSig = this.floor.fitSig; this.sig = this.floor.sig; this.year = this.game.year;
    this.envDirty = true; this.envT = 0;
    if (!this.placed) { this.pos.set(C.toX(WK.SPOTS.home[0]), 0, C.toZ(WK.SPOTS.home[1])); this.yaw = Math.PI; this.pitch = -0.04; this.placed = true; }
    this.applyShadowQuality();
  }
  // rummets egna reflektioner: en kubkamera mitt i butiken → miljökarta
  bakeEnv() {
    const r = this.renderer;
    const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cc = new THREE.CubeCamera(0.1, 60, rt);
    cc.position.set(0.3, 1.6, C.ROOM.D * 0.45);
    this.scene.add(cc);
    const vis = this.people.group.visible; this.people.group.visible = false;
    this.scene.environment = this.hdriEnv || null;
    cc.update(r, this.scene);
    this.people.group.visible = vis;
    this.scene.remove(cc);
    const env = this.pmrem.fromCubemap(rt.texture).texture;
    if (this.roomEnv) this.roomEnv.dispose();
    this.roomEnv = env;
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.75;
    rt.dispose();
  }

  // ---------- Kvalitet ----------
  setQuality(q) {
    this.quality = q; store.set('pixelverkstan_3dq', q);
    const r = this.renderer, w = Math.max(2, this.canvas.clientWidth), h = Math.max(2, this.canvas.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, q === 'låg' ? 1 : 1.5);
    r.setPixelRatio(dpr); r.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.composer) { for (const p of this.composer.passes) p.dispose?.(); this.composer.dispose?.(); this.composer = null; this.gtao = null; }
    this.applyShadowQuality();
    if (q === 'låg') return;
    const comp = this.composer = new EffectComposer(r);
    comp.setPixelRatio(dpr); comp.setSize(w, h);
    comp.addPass(new RenderPass(this.scene, this.camera));
    if (q === 'hög') {
      const gtao = this.gtao = new GTAOPass(this.scene, this.camera, w, h);
      gtao.output = GTAOPass.OUTPUT.Default;
      gtao.updateGtaoMaterial({ radius: 0.3, distanceExponent: 1, thickness: 1, scale: 1.1, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 });
      gtao.blendIntensity = 0.85;
      comp.addPass(gtao);
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.32, 0.55, 0.92);
    comp.addPass(this.bloom);
    comp.addPass(new OutputPass());
    comp.addPass(new SMAAPass(w * dpr, h * dpr));
  }
  applyShadowQuality() {
    if (!this.room) return;
    for (const s of this.room.lights.spots || []) s.castShadow = this.quality !== 'låg';
  }
  resize() {
    if (!this.renderer) return;
    const w = Math.max(2, this.canvas.clientWidth), h = Math.max(2, this.canvas.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.composer?.setSize(w, h);
  }

  // ---------- In/ut ----------
  enter() {
    this.active = true;
    this.canvas.classList.remove('hidden'); $('#hud3d')?.classList.remove('hidden');
    document.body.classList.add('view3d');
    requestAnimationFrame(() => this.resize());
    this.hint();
  }
  leave() {
    this.active = false;
    if (this.locked) document.exitPointerLock?.();
    this.canvas.classList.add('hidden'); $('#hud3d')?.classList.add('hidden');
    document.body.classList.remove('view3d');
    this.keys.clear();
  }

  // ---------- Inmatning ----------
  bindInput() {
    const c = this.canvas;
    c.addEventListener('click', () => {
      if (!this.active || this.hooks.modalOpen()) return;
      if (!this.locked) { c.requestPointerLock?.(); return; }
      this.interact();
    });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === c; this.hint(); });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.active) return;
      this.yaw -= e.movementX * 0.0022; this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - e.movementY * 0.0022));
    });
    const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    window.addEventListener('keydown', (e) => {
      if (!this.active || this.hooks.modalOpen() || typing()) return;
      this.keys.add(e.code);
      if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); this.interact(); }
      if (e.code === 'KeyQ') { const i = QUALITIES.indexOf(this.quality); this.setQuality(QUALITIES[(i + 1) % QUALITIES.length]); this.hooks.toast(`Grafik: ${this.quality}`); }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    // pekskärm: dra för att titta, dubbeltryck för att använda, knappar för att gå
    c.addEventListener('touchstart', (e) => { const t = e.touches[0]; this.touch = { x: t.clientX, y: t.clientY, t: performance.now(), moved: 0 }; }, { passive: true });
    c.addEventListener('touchmove', (e) => {
      if (!this.touch) return; const t = e.touches[0];
      const dx = t.clientX - this.touch.x, dy = t.clientY - this.touch.y;
      this.yaw -= dx * 0.005; this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - dy * 0.005));
      this.touch.x = t.clientX; this.touch.y = t.clientY; this.touch.moved += Math.abs(dx) + Math.abs(dy);
    }, { passive: true });
    c.addEventListener('touchend', () => { if (this.touch && this.touch.moved < 12 && performance.now() - this.touch.t < 400) { this.updateHover(); this.interact(); } this.touch = null; });
    const pad = $('#pad3d');
    if (pad) for (const b of pad.querySelectorAll('[data-k]')) {
      const code = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', use: 'KeyE' }[b.dataset.k];
      const on = (e) => { e.preventDefault(); if (code === 'KeyE') this.interact(); else this.keys.add(code); };
      const off = (e) => { e.preventDefault(); this.keys.delete(code); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    }
  }
  hint(text = null) {
    const el = $('#hint3d'); if (!el) return;
    if (text !== null) { el.textContent = text; el.classList.toggle('hidden', !text); return; }
    el.textContent = this.locked ? '' : 'Klicka i bilden för att styra · W A S D går · musen tittar · klicka på kunder, montrar och lådor · Esc släpper musen · Q byter grafikkvalitet';
    el.classList.toggle('hidden', this.locked);
  }

  // ---------- Rörelse ----------
  canStand(x, z) {
    if (x < C.ROOM.X0 + RADIUS || x > C.ROOM.X1 - RADIUS || z > C.ROOM.D - RADIUS) return false;
    for (const [dx, dz] of [[RADIUS, 0], [-RADIUS, 0], [0, RADIUS], [0, -RADIUS], [0, 0]]) {
      if (!WK.walkable(C.fromX(x + dx), C.fromZ(z + dz))) return false;
    }
    return true;
  }
  move(dt) {
    const k = this.keys, fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    const str = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const run = k.has('ShiftLeft') || k.has('ShiftRight');
    const sp = run ? RUN : SPEED;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let vx = (fx * fwd + rx * str), vz = (fz * fwd + rz * str);
    const l = Math.hypot(vx, vz); if (l > 1) { vx /= l; vz /= l; }
    const tx = vx * sp, tz = vz * sp, a = Math.min(1, dt * 12);
    this.vel.x += (tx - this.vel.x) * a; this.vel.z += (tz - this.vel.z) * a;
    const nx = this.pos.x + this.vel.x * dt, nz = this.pos.z + this.vel.z * dt;
    if (this.canStand(nx, nz)) { this.pos.x = nx; this.pos.z = nz; }
    else if (this.canStand(nx, this.pos.z)) { this.pos.x = nx; this.vel.z = 0; }
    else if (this.canStand(this.pos.x, nz)) { this.pos.z = nz; this.vel.x = 0; }
    else { this.vel.set(0, 0, 0); }
    this.moving = Math.hypot(this.vel.x, this.vel.z) > 0.15;
    this.bob = this.moving ? this.bob + dt * (run ? 11 : 8) : 0;
    this.camera.position.set(this.pos.x, EYE + (this.moving ? Math.sin(this.bob) * 0.025 : 0), this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
  syncLocal() {
    const pl = this.floor.localPlayer();
    if (!pl) return;
    if (pl.away) { this.wasAway = true; return; }
    if (this.wasAway) { this.wasAway = false; const [nx, ny] = WK.nearestFree(pl.x, pl.y); this.pos.set(C.toX(nx), 0, C.toZ(ny)); this.vel.set(0, 0, 0); }
    pl.x = C.fromX(this.pos.x); pl.y = C.fromZ(this.pos.z);
    pl.moving = this.moving; pl.walk = (pl.walk || 0) + (this.moving ? 0.16 : 0);
    const f = this.yaw + Math.PI, sx = Math.sin(f), cz = Math.cos(f);
    pl.dir = Math.abs(sx) > Math.abs(cz) ? (sx > 0 ? 'right' : 'left') : (cz > 0 ? 'down' : 'up');
    pl.path = []; pl.act = null;
  }

  // ---------- Människorna ----------
  yawFor(key, x, z, dir) {
    const last = this.lastPos.get(key);
    let yaw = null;
    if (last) { const dx = x - last.x, dz = z - last.z; if (Math.hypot(dx, dz) > 0.004) yaw = Math.atan2(dx, dz); else yaw = last.yaw; }
    this.lastPos.set(key, { x, z, yaw: yaw ?? C.yawOf(dir) });
    return yaw ?? C.yawOf(dir);
  }
  peopleList() {
    const g = this.game, fl = this.floor, out = [], seen = new Set();
    const say = (c) => (typeof c.say === 'string' ? c.say : c.say?.text && (!c.say.until || performance.now() < c.say.until) ? c.say.text : '');
    for (const c of g.customers) {
      if (c.x === undefined) continue;
      const key = 'c' + c.id, x = C.toX(c.x), z = C.toZ(c.y) + (c._sit ? 0.32 : 0), yaw = c.moving ? this.yawFor(key, x, z, c.dir) : (this.lastPos.get(key)?.yaw ?? C.yawOf(c.dir));
      if (!c.moving) this.lastPos.set(key, { x, z, yaw: C.yawOf(c.dir) });
      const cl = fl.clickable(c);
      const want = c.order?.title || c.order?.want || '';
      const mood = c.phase === 'leaving' ? (c.mood === 'angry' ? ' 😠' : c.mood === 'happy' ? ' 😊' : '') : '';
      const label = cl ? (want ? `${c.name}: ${want}` : c.name) : say(c) || (c.phase === 'ready' ? c.name + ' hämtar' : c.phase === 'leaving' && mood ? c.name + mood : '');
      out.push({ key, x, z, yaw: c.moving ? yaw : C.yawOf(c.dir), moving: c.moving, kid: !!c.look?.kid, color: c.look?.shirt || '#7ea0c8', look: c.look, label, labelColor: cl ? '#f5c542' : c.mood === 'angry' ? '#e23b5a' : '#7ee8fa', mark: cl });
      seen.add(key);
    }
    for (const pl of fl.players) {
      if (pl.local || pl.away || pl.x === undefined) continue;
      const key = 'p' + pl.id, x = C.toX(pl.x), z = C.toZ(pl.y);
      out.push({ key, x, z, yaw: pl.moving ? this.yawFor(key, x, z, pl.dir) : C.yawOf(pl.dir), moving: !!pl.moving, kid: !!pl.look?.kid, color: pl.color || '#7ee8fa', look: pl.look, label: pl.say && performance.now() < pl.say.until ? pl.say.text : pl.name, labelColor: pl.color || '#7ee8fa', big: !!(pl.say && performance.now() < pl.say.until) });
    }
    for (const s of g.staff || []) {
      if (s.course) continue;
      const p = fl.staffPos(s), key = 's' + s.id;
      out.push({ key, x: C.toX(p.x), z: C.toZ(p.y), yaw: C.yawOf(p.dir), moving: !!s.job, kid: false, color: s.role === 'tekniker' ? '#f5a142' : '#8be36b', look: s.look, label: `${s.name.split(' ')[0]} · ${s.role}${s.job ? ' ' + Math.round((s.progress || 0) * 100) + ' %' : ''}`, labelColor: s.role === 'tekniker' ? '#f5a142' : '#8be36b' });
    }
    for (const w of fl.walkers || []) {
      let id = this.walkerIds.get(w); if (!id) { id = this.nextWalker++; this.walkerIds.set(w, id); }
      const key = 'w' + id, x = C.toX(w.x), z = C.toZ(w.y);
      out.push({ key, x, z, yaw: this.yawFor(key, x, z, w.dir > 0 ? 'right' : 'left'), moving: true, kid: !!w.look?.kid, color: w.look?.shirt || '#8899aa', look: w.look });
    }
    return out;
  }

  // ---------- Sikte och interaktion ----------
  updateHover() {
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const targets = [...this.units.pickTargets(), this.people.group, ...this.room.group.children.filter((o) => o.userData.pick)];
    const hits = this.raycaster.intersectObjects(targets, true);
    let found = null;
    for (const h of hits) {
      let o = h.object, pick = null;
      while (o) { if (o.userData.pick) { pick = o.userData.pick; break; } o = o.parent; }
      if (!pick) { const key = this.people.keyOf(h.object); if (key) pick = this.pickPerson(key); }
      if (pick && pick.type !== 'counter') { found = { ...pick, dist: h.distance }; break; }
      if (pick?.type === 'counter') continue;
      if (!pick) break;   // vägg/golv/möbel först i strålen
    }
    this.hover = found;
    this.canvas.style.cursor = found ? 'pointer' : 'default';
    this.hint(this.locked || this.touch ? this.hoverText(found) : null);
  }
  pickPerson(key) {
    if (key[0] === 'c') { const c = this.game.customers.find((x) => 'c' + x.id === key); return c ? { type: 'customer', c } : null; }
    if (key[0] === 'p') { const p = this.floor.players.find((x) => 'p' + x.id === key); return p ? { type: 'player', p } : null; }
    if (key[0] === 's') { const s = (this.game.staff || []).find((x) => 's' + x.id === key); return s ? { type: 'staff', s } : null; }
    return null;
  }
  hoverText(h) {
    if (!h) return '';
    const far = h.dist > REACH ? ' (gå närmare)' : '';
    if (h.type === 'customer') return (this.floor.clickable(h.c) ? `${h.c.name} vill beställa – klicka för att ta emot` : `${h.c.name}${h.c.phase === 'waiting' ? ' väntar på sin dator' : h.c.phase === 'ready' ? ' hämtar sin dator' : ''}`) + far;
    if (h.type === 'box') return 'Leverans från grossisten – klicka för att packa upp' + far;
    if (h.type === 'workshop') return 'Verkstaden – öppna en beställning i listan för att gå in';
    if (h.type === 'player') return h.p.name;
    if (h.type === 'staff') return `${h.s.name} (${h.s.role})`;
    if (h.type === 'unit') {
      const w = h.what;
      if (w.hero) return 'Stjärnobjektet – klicka för att se' + far;
      if (w.empty) return `Ledig plats ${w.slot + 1} – klicka för att köpa inredning` + far;
      if (w.unit === 'tv') return 'TV-hörnan – klicka för att spela' + far;
      if (w.unit === 'spelbord') return 'Spelbordet – klicka för att spela' + far;
      if (w.unit === 'arkad') return (w.title || 'Arkadskåp') + ' – klicka för att spela' + far;
      return (w.title || 'Monter') + ' – klicka för att titta' + far;
    }
    return '';
  }
  interact() {
    if (!this.active || this.hooks.modalOpen()) return;
    this.updateHover();
    const h = this.hover;
    if (!h) return;
    if (h.dist > REACH) { this.hooks.toast('Gå lite närmare.'); return; }
    if (h.type === 'customer') return this.hooks.onCustomerClick(h.c);
    if (h.type === 'box') return this.hooks.onBoxClick(h.d);
    if (h.type === 'unit') return this.hooks.onShowcaseClick(h.what);
    if (h.type === 'workshop') return this.hooks.toast('Öppna en beställning i listan till höger så går du in i verkstaden.');
    if (h.type === 'staff') return this.hooks.onStaff?.();
  }

  // ---------- Per bildruta ----------
  update(dt) {
    if (!this.ready || !this.active) return;
    const fl = this.floor;
    fl.refreshStock();
    if (fl.lokal !== this.lokal || fl.fitSig !== this.fitSig || this.game.year !== this.year) this.rebuildAll();
    else if (fl.sig !== this.sig) { this.sig = fl.sig; this.units.rebuild(); this.envDirty = true; this.envT = 0; }
    if (this.hooks.modalOpen() && this.locked) document.exitPointerLock?.();
    this.move(dt);
    this.syncLocal();
    this.room.update(dt, fl);
    this.units.update(dt);
    this.people.sync(this.peopleList(), dt);
    this.hoverT -= dt;
    if (this.hoverT <= 0) { this.hoverT = 0.08; this.updateHover(); }
    if (this.envDirty) { this.envT += dt; if (this.envT > 0.6) { this.bakeEnv(); this.envDirty = false; } }
    // frivilligt: sänk kvaliteten om bilden hackar
    const p = this.perf, now = performance.now();
    if (p.last) { const ft = (now - p.last) / 1000; p.warm += ft; if (p.warm > 3 && ft < 0.5) { p.t += ft; p.n++; } }
    p.last = now;
    if (p.n >= 90) {
      p.avg = p.t / p.n; p.t = 0; p.n = 0;
      const i = QUALITIES.indexOf(this.quality);
      if (p.avg > 0.04 && i < QUALITIES.length - 1 && p.steps < 2) { p.steps++; this.setQuality(QUALITIES[i + 1]); this.hooks.toast(`3D: sänkte grafiken till "${this.quality}" för jämnare bild (Q byter).`); }
    }
  }
  render() {
    if (!this.ready || !this.active) return;
    this.renderer.info.reset();
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
    this.frames++;
  }
  // för tester: ställ kameran
  setPose(x, z, yaw = this.yaw, pitch = this.pitch) { this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = pitch; this.vel.set(0, 0, 0); }
  info() { return { ready: this.ready, quality: this.quality, lokal: this.lokal, people: this.people?.actors.size || 0, pick: this.units?.pickables.length || 0, boxes: this.units?.boxes.size || 0, products: this.units?.boxCount || 0, models: A.stats(), frames: this.frames, avg: this.perf.avg, drawCalls: this.renderer?.info.render.calls, tris: this.renderer?.info.render.triangles }; }
}
