// Fysiska föremål i 3D-butiken: saker man tar med händerna, bär med sig, ställer ner och kastar.
//
// Hamburgerbaren använder det för serveringen: när brickan är färdig i köket blir den – och allt som
// står på den: tallriken med burgaren, pommesen, muggen med sugrör, efterrätten – riktiga föremål.
// Man klickar på brickan för att ta den, går ut i lokalen och lämnar den till kunden (klicka på
// kunden, ställ den på kundens bord eller på disken). Varje del går att lyfta av och ställa tillbaka.
// Håller man in musknappen, svänger med musen och släpper så kastas föremålet med handens fart:
// det faller, studsar och landar på bänkar, bord, disk och golv. En bricka som landar hårt tappar
// det som står på den. Mat som legat på golvet ger en anmärkning när den serveras.
//
// Fysiken är medvetet enkel (ingen fysikmotor): varje föremål är en punkt med radie som faller med
// tyngdkraften, stoppas av rummets väggar och av disk och bänkar som block, och landar på plana ytor.
// Vad som är ett föremål och hur det ser ut bestäms av verksamheten: shop.carryKit(order) →
// { parts: [{ kind, name, at: [u, v, z], r | half, draw(R) }] } där draw ritar delen med samma
// lådor som på arbetsbänken (voxlarna byggs av bench.js makeVoxels).
import * as THREE from 'three';
import * as C from './coords.js';
import * as LY from '../core/floor-layout.js';
import { makeVoxels, U } from './bench.js';

const G = 9.8, EYE = 1.62;
export const REACH = 2.6;      // så långt når armen (m)
export const THROW = 1.5;      // handens fart (m/s) över vilken ett släpp blir ett kast
const MAX_THROW = 8.5;
const BOUNCE = 0.28, SKID = 0.55;
const SPILL = 2.6;             // landningsfart (m/s) där det som står på brickan ramlar av
const TRAIL = 0.12;            // sekunder av handens rörelse som avgör kastets fart
let SEQ = 1;

export class Carry {
  constructor(view) {
    this.v = view;
    this.group = new THREE.Group(); this.group.name = 'carry';
    view.scene.add(this.group);
    this.props = new Map();
    this.held = null;
    this.hand = new THREE.Vector3(); this.trail = [];
    this.ray = new THREE.Raycaster();
    this.t = 0; this.armed = false; this.fresh = null; this.syncT = 0;
  }
  get game() { return this.v.game; }

  // ---------- Föremålen ----------
  trayOf(orderId) { for (const p of this.props.values()) if (p.kind === 'tray' && p.orderId === orderId) return p; return null; }
  ofOrder(orderId) { return [...this.props.values()].filter((p) => p.orderId === orderId); }

  // brickan för en färdig beställning, med allt som står på den. held: rakt i händerna; annars på disken i köket
  spawnOrder(order, { held = false } = {}) {
    const old = this.trayOf(order.id);
    if (old) { if (held && !this.held) this.take(old); return old; }
    const kit = this.game.shop.carryKit?.(order);
    const trayDef = kit?.parts.find((p) => p.kind === 'tray');
    if (!trayDef) return null;
    const tray = this.make(order, trayDef, trayDef);
    for (const d of kit.parts) if (d !== trayDef) this.attach(this.make(order, d, trayDef), tray);
    if (held && !this.held) this.take(tray);
    else { this.setDown(tray, this.freeSpot()); tray.mesh.rotation.y = Math.PI / 2; }
    return tray;
  }
  make(order, def, trayDef) {
    const vox = makeVoxels({ unit: U });
    if (this.v.bench?.cache) vox.cache = new Map(this.v.bench.cache);   // samma lådor ritades nyss på bänken → ingen ny rastrering
    vox.render(def.draw);
    const root = new THREE.Group();
    // voxlarnas origo flyttas så att delens fot hamnar i rotens origo (u → x, z → y, v → z)
    vox.group.position.set(-def.at[0] * U, -def.at[2] * U, -def.at[1] * U);
    root.add(vox.group);
    const p = {
      id: SEQ++, kind: def.kind, orderId: order.id, name: def.name || def.kind, mesh: root, vox, pos: root.position,
      r: (def.r ?? Math.max(...(def.half || [4]))) * U, half: def.half ? [def.half[0] * U, def.half[1] * U] : null,
      // platsen på brickan: i brickans egna koordinater, med foten på brickans ovansida
      slot: new THREE.Vector3((def.at[0] - trayDef.at[0]) * U, (def.at[2] - trayDef.at[2]) * U, (def.at[1] - trayDef.at[1]) * U),
      vel: new THREE.Vector3(), spin: new THREE.Vector3(), rest: true, parent: null, kids: new Set(), on: null, floor: false, thrown: false,
    };
    root.userData.prop = p;
    this.group.add(root);
    this.props.set(p.id, p);
    return p;
  }
  remove(p) {
    if (this.held === p) this.held = null;
    for (const k of [...p.kids]) this.remove(k);
    if (p.parent) p.parent.kids.delete(p);
    p.mesh.parent?.remove(p.mesh);
    p.vox.dispose();
    this.props.delete(p.id);
  }
  removeOrder(orderId) { for (const p of this.ofOrder(orderId)) if (this.props.has(p.id)) this.remove(p); }
  attach(p, tray) {
    if (p.parent) this.detach(p);
    if (this.held === p) this.held = null;
    p.parent = tray; tray.kids.add(p);
    tray.mesh.add(p.mesh);
    p.mesh.position.copy(p.slot); p.mesh.rotation.set(0, 0, 0);
    p.vel.set(0, 0, 0); p.spin.set(0, 0, 0); p.rest = true; p.on = null;
  }
  detach(p) {
    const tray = p.parent; if (!tray) return;
    tray.kids.delete(p); p.parent = null;
    this.group.attach(p.mesh);   // behåller platsen i världen
    p.mesh.rotation.x = p.mesh.rotation.z = 0;
  }
  // allt som hör till beställningen står på brickan
  complete(tray) {
    const kit = this.game.shop.carryKit?.(this.game.orders.find((o) => o.id === tray.orderId) || {});
    const need = (kit?.parts || []).filter((d) => d.kind !== 'tray');
    const have = new Set([...tray.kids].map((k) => k.kind));
    return need.filter((d) => !have.has(d.kind));
  }

  // ---------- Ta, ställa ner, kasta ----------
  take(p) {
    if (this.held || !p) return false;
    if (p.parent) this.detach(p);
    this.held = p; p.rest = false; p.on = null;
    p.vel.set(0, 0, 0); p.spin.set(0, 0, 0);
    p.mesh.rotation.x = p.mesh.rotation.z = 0;
    this.trail.length = 0;
    return true;
  }
  release(vel = null, spin = null) {
    const p = this.held; if (!p) return null;
    this.held = null; this.armed = false; this.fresh = null;
    p.rest = false; p.on = null;
    p.vel.copy(vel || new THREE.Vector3());
    p.spin.copy(spin || new THREE.Vector3());
    return p;
  }
  setDown(p, pt) {
    if (this.held === p) this.release();
    p.pos.set(pt.x, pt.y + 0.05, pt.z);
    p.vel.set(0, -0.3, 0); p.spin.set(0, 0, 0); p.rest = false; p.on = null;
    p.mesh.rotation.x = p.mesh.rotation.z = 0;
  }
  handVel() {
    const tr = this.trail;
    if (tr.length < 2) return new THREE.Vector3();
    const a = tr[0], b = tr[tr.length - 1], dt = Math.max(0.03, b.t - a.t);
    return b.p.clone().sub(a.p).divideScalar(dt);
  }
  throwHeld() {
    const vel = this.handVel().multiplyScalar(1.35);
    vel.y += 1.1;
    if (vel.length() > MAX_THROW) vel.setLength(MAX_THROW);
    const p = this.release(vel, new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3));
    if (p) p.thrown = true;
    return p;
  }
  // ställ ner det man håller: ge till kunden, ställ på brickan, på ytan man siktar på – annars släpps det
  put() {
    const p = this.held, v = this.v; if (!p) return false;
    const h = v.hover;
    if (p.kind === 'tray' && h?.type === 'customer' && h.dist <= 3.2) { this.deliver(p, h.c, { direct: true }); return true; }
    const a = this.aim();
    if (p.kind !== 'tray' && a.prop && a.dist <= REACH) {
      const tray = a.prop.kind === 'tray' ? a.prop : a.prop.parent;
      if (tray && tray.orderId === p.orderId && ![...tray.kids].some((k) => k.kind === p.kind)) { this.release(); this.attach(p, tray); return true; }
    }
    if (a.surface && a.sdist <= REACH) { this.setDown(p, this.clampTo(a.surface, a.point, p)); p.mesh.rotation.y = v.yaw; return true; }
    this.release(new THREE.Vector3(v.vel.x, 0, v.vel.z));
    return true;
  }
  // klick / E / tryck: ta det man siktar på, eller ställ ner det man håller
  use() {
    if (this.held) return this.put();
    const a = this.aim();
    if (a.prop && a.dist <= REACH) return this.take(a.prop);
    return false;
  }
  // musknappen ner/upp (med muslås): håll in, sväng och släpp = kast
  down() {
    if (this.held) { this.armed = true; return true; }
    const a = this.aim();
    if (a.prop && a.dist <= REACH && this.take(a.prop)) { this.fresh = this.t; return true; }
    return false;
  }
  up() {
    if (!this.held) { this.armed = false; this.fresh = null; return false; }
    const fast = this.handVel().length() > THROW;
    if (this.fresh !== null) { this.fresh = null; if (fast) this.throwHeld(); return true; }   // kort klick: behåll i handen
    if (this.armed) { this.armed = false; if (fast) this.throwHeld(); else this.put(); return true; }
    return false;
  }

  // ---------- Sikte ----------
  aim() {
    const v = this.v, out = { prop: null, dist: Infinity, surface: null, sdist: Infinity, point: null };
    v.camera.updateMatrixWorld();
    this.ray.setFromCamera(new THREE.Vector2(0, 0), v.camera);
    this.ray.far = REACH + 1.5;
    const tops = [...this.props.values()].filter((p) => !p.parent && p !== this.held).map((p) => p.mesh);
    const hit = this.ray.intersectObjects(tops, true)[0];
    if (hit) { let o = hit.object; while (o && !o.userData.prop) o = o.parent; if (o) { out.prop = o.userData.prop; out.dist = hit.distance; } }
    // ytan under siktet (strålen mot varje ytas plan)
    const o = this.ray.ray.origin, d = this.ray.ray.direction;
    if (d.y < -0.02) for (const s of this.surfaces(this.held)) {
      const t = (s.y - o.y) / d.y;
      if (t <= 0 || t >= out.sdist) continue;
      const x = o.x + d.x * t, z = o.z + d.z * t;
      if (this.inside(s, x, z, 0)) { out.surface = s; out.sdist = t; out.point = new THREE.Vector3(x, s.y, z); }
    }
    return out;
  }
  hoverText() {
    const v = this.v, p = this.held;
    if (p) {
      const h = v.hover;
      if (p.kind === 'tray' && h?.type === 'customer' && h.dist <= 3.2) return `Ge brickan till ${h.c.name} – klicka`;
      const a = this.aim();
      if (p.kind !== 'tray' && a.prop && a.dist <= REACH && (a.prop.kind === 'tray' || a.prop.parent)) return `Ställ ${p.name} på brickan – klicka`;
      if (a.surface && a.sdist <= REACH) return a.surface.kind === 'table' ? `Ställ ${p.name} på bordet – klicka` : a.surface.kind === 'pass' ? `Ställ ${p.name} på disken – kunden hämtar den där` : a.surface.kind === 'floor' ? `Klicka för att släppa ${p.name} · håll in, sväng med musen och släpp för att kasta` : `Ställ ner ${p.name} – klicka`;
      return `Du bär ${p.name} · klicka för att släppa · håll in, sväng med musen och släpp för att kasta`;
    }
    const a = this.aim();
    if (a.prop && a.dist <= REACH) { const o = this.game.orders.find((x) => x.id === a.prop.orderId); return `Ta ${a.prop.name}${a.prop.kind === 'tray' && o ? ` till ${o.name}` : ''} – klicka (håll in och sväng för att kasta)`; }
    return '';
  }

  // ---------- Ytor och block ----------
  // plana ytor att landa och ställa saker på: { kind, y, x0, x1, z0, z1 } eller en bricka { prop }
  surfaces(skip = null) {
    const v = this.v, R = C.ROOM, room = v.room, out = [];
    out.push({ kind: 'floor', y: 0, x0: R.X0, x1: R.X1, z0: 0, z1: R.D });
    if (room?.bench) { const b = room.bench; out.push({ kind: 'bench', y: b.y, x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }); }
    if (room?.cabinetTop) { const c = room.cabinetTop; out.push({ kind: 'kitchen', y: c.y + 0.03, x0: c.x0, x1: c.x1, z0: c.z - 0.31, z1: c.z + 0.31 }); }
    if (room?.counter) out.push({ kind: 'counter', ...room.counter });
    if (room?.displayCase) { const d = room.displayCase; out.push({ kind: 'pass', y: d.top, x0: d.x0, x1: d.x1, z0: d.z0, z1: d.z1 }); }
    LY.TABLES.forEach((t, i) => { const r = C.rect([t.x0, t.base - 16, t.x1, t.base]), w = (t.x1 - t.x0) * C.S / 2; out.push({ kind: 'table', table: i, y: 0.76, x0: r.x - w, x1: r.x + w, z0: r.z - 0.31, z1: r.z + 0.31 }); });
    // brickor som står stilla tar emot det man ställer på dem
    if (!skip || skip.kind !== 'tray') for (const p of this.props.values()) if (p.kind === 'tray' && p.rest && p !== skip && !p.parent) out.push({ kind: 'tray', prop: p, y: p.pos.y + p.slot.y + 0.35 * U });
    return out.sort((a, b) => b.y - a.y);
  }
  inside(s, x, z, pad = 0) {
    if (s.prop) { const p = s.prop, dx = x - p.pos.x, dz = z - p.pos.z, c = Math.cos(-p.mesh.rotation.y), sn = Math.sin(-p.mesh.rotation.y); const lx = dx * c + dz * sn, lz = -dx * sn + dz * c; return Math.abs(lx) <= p.half[0] + pad && Math.abs(lz) <= p.half[1] + pad; }
    return x >= s.x0 - pad && x <= s.x1 + pad && z >= s.z0 - pad && z <= s.z1 + pad;
  }
  clampTo(s, pt, p) {
    if (s.prop) return new THREE.Vector3(pt.x, s.y, pt.z);
    const m = Math.min(p.r * 0.6, (s.x1 - s.x0) / 2 - 0.01, (s.z1 - s.z0) / 2 - 0.01);
    return new THREE.Vector3(Math.max(s.x0 + m, Math.min(s.x1 - m, pt.x)), s.y, Math.max(s.z0 + m, Math.min(s.z1 - m, pt.z)));
  }
  // disk och bänkar som block: sidorna stoppar det som flyger
  blocks() {
    const room = this.v.room, out = [];
    if (room?.counter) out.push(room.counter);
    if (room?.displayCase) { const d = room.displayCase; out.push({ y: d.top, x0: d.x0, x1: d.x1, z0: d.z0, z1: d.z1 }); }
    if (room?.cabinetTop) { const c = room.cabinetTop; out.push({ y: c.y, x0: c.x0, x1: c.x1, z0: 0, z1: c.z + 0.31 }); }
    if (room?.bench) { const b = room.bench; out.push({ y: b.y, x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }); }
    return out;
  }
  // en ledig plats för en bricka som väntar på att bäras ut: längst till vänster på arbetsbänken (bygget
  // står i mitten), annars på disken
  freeSpot() {
    const b = this.v.room?.bench, s = b || this.v.room?.counter;
    if (!s) return new THREE.Vector3(this.v.pos.x, 0, this.v.pos.z);
    const n = [...this.props.values()].filter((p) => p.kind === 'tray' && !p.parent && p !== this.held).length - 1;
    return new THREE.Vector3(s.x0 + 0.17, s.y, s.z0 + 0.26 + (Math.max(0, n) % 2) * 0.44);
  }

  // ---------- Varje bildruta ----------
  update(dt) {
    this.t += dt;
    const v = this.v, p = this.held;
    // handen: framför kroppen, en bit under blicken (brickan rakt fram, småsaker i höger hand)
    const yaw = v.yaw, pitch = v.pitch, fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const big = p?.kind === 'tray', dist = (big ? 0.68 : 0.55) + 0.1 * Math.cos(pitch), side = big ? 0 : 0.2;
    const hy = Math.max(0.3, Math.min(2.1, EYE - (big ? 0.4 : 0.32) + Math.sin(pitch) * 0.5));
    this.hand.set(v.pos.x + fx * dist + rx * side, hy, v.pos.z + fz * dist + rz * side);
    this.trail.push({ t: this.t, p: this.hand.clone() });
    while (this.trail.length > 2 && this.t - this.trail[0].t > TRAIL) this.trail.shift();
    if (p) { p.pos.copy(this.hand); p.mesh.rotation.set(0, yaw, 0); }
    // fysiken i små steg (bildrutorna kan vara långa)
    const n = Math.max(1, Math.min(10, Math.ceil(dt / 0.016))), h = Math.min(0.033, dt / n);
    for (let i = 0; i < n; i++) for (const q of [...this.props.values()]) if (this.props.has(q.id)) this.step(q, h);
    this.syncT -= dt;
    if (this.syncT <= 0) { this.syncT = 0.5; this.syncOrders(); }
  }
  step(p, dt) {
    if (p.rest || p.parent || p === this.held) return;
    const prevX = p.pos.x, prevY = p.pos.y, prevZ = p.pos.z, R = C.ROOM, rad = Math.min(p.r, 0.2);
    p.vel.y -= G * dt;
    p.pos.addScaledVector(p.vel, dt);
    p.mesh.rotation.x += p.spin.x * dt; p.mesh.rotation.y += p.spin.y * dt; p.mesh.rotation.z += p.spin.z * dt;
    // rummets väggar och tak
    if (p.pos.x < R.X0 + rad) { p.pos.x = R.X0 + rad; p.vel.x = Math.abs(p.vel.x) * 0.35; }
    if (p.pos.x > R.X1 - rad) { p.pos.x = R.X1 - rad; p.vel.x = -Math.abs(p.vel.x) * 0.35; }
    if (p.pos.z < 0.06 + rad) { p.pos.z = 0.06 + rad; p.vel.z = Math.abs(p.vel.z) * 0.35; }
    if (p.pos.z > R.D - rad) { p.pos.z = R.D - rad; p.vel.z = -Math.abs(p.vel.z) * 0.35; }
    if (p.pos.y > R.H - 0.15) { p.pos.y = R.H - 0.15; p.vel.y = -Math.abs(p.vel.y) * 0.3; }
    // disk och bänkar: flyger man in i sidan studsar man tillbaka
    for (const b of this.blocks()) {
      if (p.pos.y >= b.y - 0.02 || !this.inside(b, p.pos.x, p.pos.z, 0)) continue;
      if (prevY >= b.y - 0.02 && this.inside(b, prevX, prevZ, 0)) continue;   // kom uppifrån – ytan tar hand om det
      if (!(prevX >= b.x0 && prevX <= b.x1)) { p.pos.x = prevX; p.vel.x *= -0.35; }
      if (!(prevZ >= b.z0 && prevZ <= b.z1)) { p.pos.z = prevZ; p.vel.z *= -0.35; }
    }
    if (p.thrown && this.hitCustomer(p)) return;
    // landa på den högsta ytan som passerades
    for (const s of this.surfaces(p)) {
      if (s.prop && (p.kind === 'tray' || s.prop.orderId !== p.orderId)) continue;
      if (prevY >= s.y - 1e-4 && p.pos.y <= s.y && this.inside(s, p.pos.x, p.pos.z, s.prop ? 0 : rad * 0.5)) { this.land(p, s); break; }
    }
  }
  land(p, s) {
    const vy = Math.abs(p.vel.y), speed = p.vel.length();
    p.pos.y = s.y;
    if (s.kind === 'floor') p.floor = true;
    if (p.kind === 'tray' && p.kids.size && speed > SPILL) this.spill(p);
    if (vy > 1.7) { p.vel.y = vy * BOUNCE; p.vel.x *= SKID; p.vel.z *= SKID; p.spin.multiplyScalar(0.5); return; }
    p.vel.set(0, 0, 0); p.spin.set(0, 0, 0); p.rest = true; p.on = s;
    p.mesh.rotation.x = p.mesh.rotation.z = 0;
    this.settled(p, s);
  }
  // det som står på brickan flyger av
  spill(tray) {
    for (const k of [...tray.kids]) {
      this.detach(k);
      k.rest = false; k.thrown = true;
      k.vel.set(tray.vel.x * 0.5 + (Math.random() - 0.5) * 2.2, 1.4 + Math.random() * 1.4, tray.vel.z * 0.5 + (Math.random() - 0.5) * 2.2);
      k.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 8);
    }
    this.v.hooks.toast?.('Hoppsan! Allt på brickan for av.', 'err');
  }
  // föremålet har lagt sig till ro: på brickan, på kundens bord eller på disken
  settled(p, s) {
    if (s.prop && p.kind !== 'tray') {
      if (![...s.prop.kids].some((k) => k.kind === p.kind)) this.attach(p, s.prop);
      return;
    }
    if (p.kind !== 'tray') return;
    if (s.kind === 'table') { const c = this.customerAt(s.table, p.orderId); if (c) this.deliver(p, c, { direct: true, thrown: p.thrown }); }
    else if (s.kind === 'pass') this.deliver(p, null, { direct: false, thrown: p.thrown });
  }
  customerAt(table, orderId) {
    const o = this.game.orders.find((x) => x.id === orderId);
    return this.game.customers.find((c) => c.id === o?.customerId && c._spot >= 0 && LY.SPOTS[c._spot]?.table === table) || null;
  }
  // ett kastat föremål träffar en kund: rätt bricka fångas, allt annat studsar av
  hitCustomer(p) {
    if (p.vel.length() < 1.2 || p.pos.y < 0.25 || p.pos.y > 1.85) return false;
    const o = this.game.orders.find((x) => x.id === p.orderId);
    // den som väntar på just den här brickan prövas först (står två nära varandra ska rätt kund fånga den)
    const list = [...this.game.customers].sort((a, b) => (b.id === o?.customerId) - (a.id === o?.customerId));
    for (const c of list) {
      if (c.x === undefined || c.y < LY.WALL_Y) continue;
      const dx = p.pos.x - C.toX(c.x), dz = p.pos.z - C.toZ(c.y);
      if (Math.hypot(dx, dz) > 0.4) continue;
      if (p.kind === 'tray' && o?.customerId === c.id && !this.complete(p).length) { this.deliver(p, c, { direct: true, thrown: true }); return true; }
      p.vel.x *= -0.35; p.vel.z *= -0.35; p.vel.y = Math.max(p.vel.y, 0.6);
      p.pos.x = C.toX(c.x) + dx / (Math.hypot(dx, dz) || 1) * 0.42; p.pos.z = C.toZ(c.y) + dz / (Math.hypot(dx, dz) || 1) * 0.42;
      c._yell = { text: ['Hallå där! 😠', 'Aj! Se dig för!', 'Oj! Vad gör du?'][c.id % 3], until: performance.now() + 2600 };
      return false;
    }
    return false;
  }

  // ---------- Servering ----------
  deliver(tray, c, { direct = true, thrown = false } = {}) {
    const g = this.game, order = g.orders.find((o) => o.id === tray.orderId);
    if (!order) { this.removeOrder(tray.orderId); return false; }
    const yell = (text) => { if (c) c._yell = { text, until: performance.now() + 3000 }; this.v.hooks.toast?.(text, 'err'); };
    if (c && order.customerId !== c.id) { yell(`${c.name}: Det där är inte min beställning!`); return false; }
    const missing = this.complete(tray);
    if (missing.length) { yell(`${c ? c.name : order.name}: Var är ${missing.map((d) => d.name).join(' och ')}?`); return false; }
    const warnings = [];
    if ([tray, ...tray.kids].some((p) => p.floor && p.kind !== 'tray')) warnings.push('Den har ju legat på golvet!');
    this.removeOrder(order.id);
    this.v.hooks.onServe?.(order, { direct, thrown, warnings });
    return true;
  }
  // brickor för färdiga beställningar ställs fram på disken i köket; föremål vars beställning är borta försvinner
  syncOrders() {
    const g = this.game; if (!g?.shop.carryKit) { for (const p of [...this.props.values()]) this.remove(p); return; }
    const open = this.v.hooks.openOrderId?.();
    for (const o of g.orders) if (o.build?.phase === 'desk' && !o.service && o.id !== open && !this.trayOf(o.id)) this.spawnOrder(o);
    for (const p of [...this.props.values()]) if (this.props.has(p.id) && !g.orders.some((o) => o.id === p.orderId)) this.remove(p);
  }
  clear() { for (const p of [...this.props.values()]) if (this.props.has(p.id)) this.remove(p); this.held = null; }
  info() { return { held: this.held ? this.held.kind : null, props: [...this.props.values()].map((p) => ({ id: p.id, kind: p.kind, order: p.orderId, rest: p.rest, parent: p.parent?.id || null, y: +p.pos.y.toFixed(2), floor: p.floor })) }; }
}
