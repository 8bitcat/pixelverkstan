// Själva lokalen i 3D: golv, tak, väggar med skyltfönster och skjutdörr, disk med kassa,
// skåp bakom disken, verkstadsdörr, ljus (sol genom fönstren, takarmaturer, spotar), neon
// och gatan utanför. Byggs från samma planlösning som 2D-golvet (floor-plans/floor-layout).
import * as THREE from 'three';
import * as A from './assets.js';
import * as C from './coords.js';
import { plate, neon } from './textures.js';
import * as LY from '../core/floor-layout.js';

const R = C.ROOM;
const TEX_M = 2.4;   // en Poly Haven-textur täcker ungefär så många meter
const rep = (w, h) => [Math.max(0.05, +(w / TEX_M).toFixed(2)), Math.max(0.05, +(h / TEX_M).toFixed(2))];

const STYLE = {
  wood:  { wall: 'beige_wall_001', wallColor: 0xe8dcc8, ceiling: 'plywood', frame: 0x7a5a3a },
  metal: { wall: 'plastered_wall_04', wallColor: 0xd9dbe0, ceiling: 'ceiling_interior', frame: 0x2a2d33 },
  glass: { wall: 'white_plaster_02', wallColor: 0xf4f1ea, ceiling: 'ceiling_interior', frame: 0x1b1d22 },
  led:   { wall: 'plastered_wall_04', wallColor: 0x7d8290, ceiling: 'ceiling_interior', frame: 0x101216 },
};
const FLOORS = { 1: ['concrete_floor_worn_001', 0.9], 2: ['laminate_floor_02', 1], 3: ['floor_tiles_06', 1], 4: ['terrazzo_tiles', 1], 5: ['terrazzo_tiles', 0.75], 6: ['floor_tiles_06', 0.8] };

export const glassMat = (tint = 0xe6f0f4, transmission = 0.92) => new THREE.MeshPhysicalMaterial({ color: tint, transmission, roughness: 0.04, metalness: 0, ior: 1.5, thickness: 0.02, envMapIntensity: 1.2, side: THREE.DoubleSide, depthWrite: false });
export const metalMat = (color = 0x1b1d22, rough = 0.32) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.85 });
export const paintMat = (color, rough = 0.55) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05 });

// låda som spänner x0..x1, y0..y1, z0..z1
export function slab(g, x0, x1, y0, y1, z0, z1, mat, { cast = true, recv = true, pick = null } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = cast; m.receiveShadow = recv;
  if (pick) m.userData.pick = pick;
  g.add(m);
  return m;
}
// vägg längs x (vid djupet z, tjocklek t, mot −z) med hål [{ x0, x1, y0, y1 }]
function wallX(g, tex, color, z, t, x0, x1, holes, H) {
  const xs = [...new Set([x0, x1, ...holes.flatMap((h) => [h.x0, h.x1])].map((v) => +v.toFixed(3)))].filter((v) => v >= x0 && v <= x1).sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i], b = xs[i + 1];
    if (b - a < 0.002) continue;
    const h = holes.find((k) => k.x0 <= a + 0.001 && k.x1 >= b - 0.001);
    const piece = (y0, y1) => slab(g, a, b, y0, y1, z - t, z, A.pbr(tex, { repeat: rep(b - a, y1 - y0), color }));
    if (!h) piece(0, H);
    else { if (h.y0 > 0.001) piece(0, h.y0); if (h.y1 < H - 0.001) piece(h.y1, H); }
  }
}
// vägg längs z (vid x, tjocklek t utåt i +dir) med hål [{ z0, z1, y0, y1 }]
function wallZ(g, tex, color, x, t, z0, z1, holes, H, dir = 1) {
  const zs = [...new Set([z0, z1, ...holes.flatMap((h) => [h.z0, h.z1])].map((v) => +v.toFixed(3)))].filter((v) => v >= z0 && v <= z1).sort((a, b) => a - b);
  for (let i = 0; i < zs.length - 1; i++) {
    const a = zs[i], b = zs[i + 1];
    if (b - a < 0.002) continue;
    const h = holes.find((k) => k.z0 <= a + 0.001 && k.z1 >= b - 0.001);
    const piece = (y0, y1) => slab(g, dir > 0 ? x : x - t, dir > 0 ? x + t : x, y0, y1, a, b, A.pbr(tex, { repeat: rep(b - a, y1 - y0), color }));
    if (!h) piece(0, H);
    else { if (h.y0 > 0.001) piece(0, h.y0); if (h.y1 < H - 0.001) piece(h.y1, H); }
  }
}
// skylt: mörk platta + tryckt framsida (mot +z)
export function signBoard(text, w, h, { bg = '#17151a', sub = '', thick = 0.06, fg = null, twoSided = true } = {}) {
  const g = new THREE.Group();
  slab(g, -w / 2, w / 2, -h / 2, h / 2, -thick, 0, paintMat(0x17151a, 0.6));
  const mat = new THREE.MeshStandardMaterial({ map: plate(text, { bg, sub, w: Math.round(512 * Math.max(1, w / h)), h: 512, fg }), roughness: 0.5, metalness: 0 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  face.position.z = 0.002; face.receiveShadow = true;
  g.add(face);
  if (twoSided) { const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); back.position.z = -thick - 0.002; back.rotation.y = Math.PI; back.receiveShadow = true; g.add(back); }
  return g;
}
export function neonSign(text, color, w, h, glow = 2.2) {
  const m = new THREE.MeshBasicMaterial({ map: neon(text, color), transparent: true, side: THREE.DoubleSide, depthWrite: false });
  m.color.setScalar(glow);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  p.renderOrder = 5;
  return p;
}
function chainSign(g, text, x, y, z, w, h, bg) {
  const s = signBoard(text, w, h, { bg });
  s.position.set(x, y, z);
  g.add(s);
  const ch = metalMat(0x8a8f96, 0.4);
  for (const dx of [-w * 0.4, w * 0.4]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, R.H - y - h / 2, 6), ch);
    c.position.set(x + dx, y + h / 2 + (R.H - y - h / 2) / 2, z - 0.03);
    g.add(c);
  }
  return s;
}

export function buildRoom(scene, ctx) {
  const { plan, lokal, year, shop, theme } = ctx;
  const st = STYLE[plan.style] || STYLE.glass;
  const g = new THREE.Group(); g.name = 'room';
  const H = R.H, X0 = R.X0, X1 = R.X1, D = R.D, T = 0.25;
  const out = { group: g, lights: {}, anim: [] };

  // golv och tak
  const [ftex, fk] = FLOORS[lokal] || FLOORS[3];
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R.W, D), A.pbr(ftex, { repeat: rep(R.W, D), color: new THREE.Color(fk, fk, fk), roughness: plan.style === 'led' ? 0.55 : 0.8 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, D / 2); floor.receiveShadow = true;
  g.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(R.W, D), A.pbr(st.ceiling, { repeat: rep(R.W, D), color: 0xf2efe9 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, D / 2); ceil.receiveShadow = true;
  g.add(ceil);

  // väggar: vänster, höger (med verkstadsdörr), bakre
  const doorZ = C.toZ(LY.KEEPER_PICKUP[1]) - 0.2;   // verkstadsdörren på högerväggen vid disken
  wallZ(g, st.wall, st.wallColor, X0, T, 0, D, [], H, -1);
  wallZ(g, st.wall, st.wallColor, X1, T, 0, D, [{ z0: doorZ - 0.5, z1: doorZ + 0.5, y0: 0, y1: 2.15 }], H, 1);
  wallX(g, st.wall, st.wallColor, D + T, T, X0 - T, X1 + T, [], H);
  // verkstadsdörren (stängd) + skylt
  slab(g, X1 + 0.02, X1 + 0.08, 0, 2.12, doorZ - 0.47, doorZ + 0.47, A.pbr('wood_table_001', { repeat: [0.4, 1], color: 0x8a6a4a }), { pick: { type: 'workshop' } });
  slab(g, X1 - 0.02, X1 + 0.03, 1.05, 1.6, doorZ - 0.28, doorZ + 0.28, glassMat(0xdfe8ee, 0.7));
  { const s = signBoard('VERKSTAD', 0.9, 0.22, { bg: '#f5a142' }); s.rotation.y = -Math.PI / 2; s.position.set(X1 - 0.03, 2.4, doorZ); g.add(s); }
  // golvlister
  const base = paintMat(0x2c2a2e, 0.6);
  slab(g, X0, X0 + 0.02, 0, 0.1, 0, D, base, { cast: false }); slab(g, X1 - 0.02, X1, 0, 0.1, 0, D, base, { cast: false }); slab(g, X0, X1, 0, 0.1, D - 0.02, D, base, { cast: false });

  // framväggen: dörr + två skyltfönster (höger fönster sitter högre, ovanför skåpet)
  const door = { x0: C.toX(LY.DOOR.x0), x1: C.toX(LY.DOOR.x1), h: 2.35 };
  const winL = { x0: X0 + 0.45, x1: door.x0 - 0.35, y0: 0.6, y1: 2.7 };
  const winR = { x0: door.x1 + 0.45, x1: X1 - 0.45, y0: 1.35, y1: 2.7 };
  const holes = [{ x0: door.x0, x1: door.x1, y0: 0, y1: door.h }, winL, winR].filter((h) => h.x1 - h.x0 > 0.5);
  wallX(g, st.wall, st.wallColor, 0, T, X0 - T, X1 + T, holes, H);
  // fasaden ovanför (utsidan) och gatan
  slab(g, X0 - 0.4, X1 + 0.4, H, H + 2.6, -T - 0.05, 0, A.pbr('plastered_wall_04', { repeat: rep(R.W, 2.6), color: 0xb8c0c8 }));
  { const s = signBoard(shop.sign || 'BUTIKEN', 4.2, 0.8, { bg: theme.counter || '#9e1b22' }); s.rotation.y = Math.PI; s.position.set(door.x1 + 0.6, H + 0.75, -T - 0.08); g.add(s); }
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(R.W + 8, 4.2), A.pbr('square_tiles', { repeat: [(R.W + 8) / 1.6, 4.2 / 1.6], color: 0xbdbab2 }));
  walk.rotation.x = -Math.PI / 2; walk.position.set(0, -0.005, -T - 2.1); walk.receiveShadow = true; g.add(walk);
  slab(g, X0 - 4, X1 + 4, -0.16, 0.0, -T - 4.32, -T - 4.2, paintMat(0x8d8a84, 0.9), { cast: false });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(R.W + 8, 9), A.pbr('asphalt_floor', { repeat: [(R.W + 8) / 3, 3], color: 0x9a9a98 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, -0.16, -T - 4.3 - 4.5); road.receiveShadow = true; g.add(road);
  // fönster: glas, karm, spröjs
  const frame = metalMat(st.frame, 0.4);
  for (const w of [winL, winR]) {
    if (w.x1 - w.x0 < 0.5) continue;
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0, w.y1 - w.y0), glassMat());
    pane.position.set((w.x0 + w.x1) / 2, (w.y0 + w.y1) / 2, -T / 2); g.add(pane);
    const fw = 0.06;
    slab(g, w.x0 - fw, w.x1 + fw, w.y0 - fw, w.y0, -T + 0.04, -0.04, frame); slab(g, w.x0 - fw, w.x1 + fw, w.y1, w.y1 + fw, -T + 0.04, -0.04, frame);
    slab(g, w.x0 - fw, w.x0, w.y0, w.y1, -T + 0.04, -0.04, frame); slab(g, w.x1, w.x1 + fw, w.y0, w.y1, -T + 0.04, -0.04, frame);
    const n = Math.max(1, Math.round((w.x1 - w.x0) / 1.3));
    for (let i = 1; i < n; i++) { const x = w.x0 + (w.x1 - w.x0) * i / n; slab(g, x - 0.02, x + 0.02, w.y0, w.y1, -T / 2 - 0.02, -T / 2 + 0.02, frame); }
    // fönsterbräda
    slab(g, w.x0 - 0.08, w.x1 + 0.08, w.y0 - 0.04, w.y0, -T, 0.06, paintMat(0xf4f1ea, 0.5));
  }
  // ÖPPET-neon i vänstra fönstret
  if (winL.x1 - winL.x0 > 0.5) { const n = neonSign('ÖPPET', '#ff4d6d', 1.05, 0.34, 2.4); n.position.set(winL.x1 - 0.7, winL.y1 - 0.35, -0.05); g.add(n); out.open = n; }
  // skjutdörren: två glasblad i en karm
  const dw = door.x1 - door.x0, half = dw / 2 + 0.03;
  slab(g, door.x0 - 0.07, door.x0, 0, door.h + 0.07, -T + 0.03, -0.03, frame); slab(g, door.x1, door.x1 + 0.07, 0, door.h + 0.07, -T + 0.03, -0.03, frame);
  slab(g, door.x0 - 0.07, door.x1 + 0.07, door.h, door.h + 0.12, -T + 0.03, -0.03, frame);
  const mkLeaf = () => { const lg = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(half - 0.06, door.h - 0.08), glassMat(0xe0ecf2, 0.9)); p.position.y = door.h / 2; lg.add(p);
    slab(lg, -half / 2, half / 2, 0, 0.05, -0.02, 0.02, frame); slab(lg, -half / 2, half / 2, door.h - 0.06, door.h - 0.02, -0.02, 0.02, frame);
    slab(lg, -half / 2, -half / 2 + 0.03, 0, door.h - 0.02, -0.02, 0.02, frame); slab(lg, half / 2 - 0.03, half / 2, 0, door.h - 0.02, -0.02, 0.02, frame);
    slab(lg, -0.015, 0.015, 0.9, 1.15, -0.03, 0.03, metalMat(0xbfc4c9, 0.3)); return lg; };
  const leafL = mkLeaf(), leafR = mkLeaf();
  leafL.position.set(door.x0 + half / 2, 0, -T / 2); leafR.position.set(door.x1 - half / 2, 0, -T / 2);
  g.add(leafL, leafR);
  out.door = { leafL, leafR, x0: door.x0 + half / 2, x1: door.x1 - half / 2, slide: half - 0.05 };
  // dörrmatta
  slab(g, door.x0 + 0.05, door.x1 - 0.05, 0, 0.012, 0.05, 0.85, A.pbr('fabric_leather_02', { repeat: [0.5, 0.4], color: 0x4a4744, roughness: 1 }), { cast: false });

  // Källarhålan: plywoodvägg som stänger av förrådsdelen
  if (plan.partition) {
    const px = C.toX(plan.partition);
    slab(g, px - 0.03, px + 0.03, 0, 2.45, 0.02, D - 0.02, A.pbr('plywood', { repeat: rep(D, 2.45), color: 0xd9c39a }));
    slab(g, px - 0.05, px + 0.05, 2.45, 2.5, 0.02, D - 0.02, paintMat(0x6f5a3e, 0.7));
  }

  // disken (röd panel + mörk skiva) och skåpet bakom
  const cx0 = C.toX(LY.COUNTER.x0), cx1 = C.toX(LY.COUNTER.x1), cz1 = C.ZC + 0.06, cz0 = cz1 - 0.58;
  const panel = A.pbr('wood_table_001', { repeat: [1.8, 0.5], color: new THREE.Color(theme.counter || '#9e1b22').multiplyScalar(1.6), roughness: 0.5 });
  slab(g, cx0, cx1, 0.08, 0.98, cz0, cz1, panel, { pick: { type: 'counter' } });
  slab(g, cx0, cx1, 0, 0.08, cz0 + 0.05, cz1 - 0.05, paintMat(0x1a1a1c, 0.6), { cast: false });
  slab(g, cx0 - 0.04, cx1 + 0.04, 0.98, 1.04, cz0 - 0.04, cz1 + 0.06, A.pbr('dark_wood', { repeat: [2, 0.3], roughness: 0.35 }));
  // sida mot dörren
  slab(g, cx0 - 0.02, cx0, 0.08, 0.98, cz0, cz1, panel);
  // kassaapparaten vid BESTÄLL och kortterminal vid UTLÄMNING
  const qx = C.toX(LY.QUEUE[0][0]), px = C.toX(LY.PICKUP[0][0]);
  const reg = A.instance(A.get('CashRegister_01'), { fit: { h: 0.42 } });
  if (reg) { reg.position.set(qx + 0.02, 1.04, (cz0 + cz1) / 2); reg.rotation.y = Math.PI; g.add(reg); }
  slab(g, px - 0.06, px + 0.06, 1.04, 1.07, (cz0 + cz1) / 2 - 0.09, (cz0 + cz1) / 2 + 0.09, paintMat(0x202226, 0.4));
  slab(g, px - 0.05, px + 0.05, 1.07, 1.075, (cz0 + cz1) / 2 - 0.06, (cz0 + cz1) / 2 + 0.02, new THREE.MeshBasicMaterial({ color: 0x6fe3ff }));
  chainSign(g, 'BESTÄLL', qx, 2.25, cz1 + 0.15, 1.1, 0.3, '#2f8f46');
  chainSign(g, 'UTLÄMNING', px, 2.25, cz1 + 0.15, 1.3, 0.3, '#2c6fb7');
  // skåpen längs väggen bakom disken (lådhurtsar) + hylla ovanpå
  const cab = A.get('drawer_cabinet');
  if (cab) {
    const cw = A.modelSize(cab).x || 0.8, n = Math.max(1, Math.floor((cx1 - cx0 - 0.2) / cw));
    for (let i = 0; i < n; i++) { const c = A.instance(cab); c.position.set(cx0 + 0.1 + cw * (i + 0.5), 0, A.modelSize(cab).z / 2 + 0.02); g.add(c); }
    out.cabinetTop = { y: A.modelSize(cab).y, x0: cx0 + 0.1, x1: cx0 + 0.1 + cw * n, z: A.modelSize(cab).z / 2 + 0.02 };
  } else {
    slab(g, cx0 + 0.1, cx1 - 0.1, 0, 0.9, 0.02, 0.5, A.pbr('oak_veneer_01', { repeat: [2, 0.4] }));
    out.cabinetTop = { y: 0.9, x0: cx0 + 0.1, x1: cx1 - 0.1, z: 0.26 };
  }

  // neonskylten på bakväggen och en affisch
  { const n = neonSign(shop.sign || 'BUTIKEN', theme.neon || '#7ee8fa', 3.8, 0.95, 2.0); n.position.set(0.2, 2.55, D - 0.03); n.rotation.y = Math.PI; g.add(n); out.neon = n; }
  const pic = A.instance(A.get('hanging_picture_frame_01'), { fit: { h: 0.9 } });
  if (pic) { pic.position.set(X1 - 0.02, 1.4, D * 0.62); pic.rotation.y = -Math.PI / 2; g.add(pic); }
  const clock = A.instance(A.get('wall_clock'), { fit: { h: 0.4 } });
  if (clock) { clock.position.set(X0 + 0.04, 2.25, D * 0.5); clock.rotation.y = Math.PI / 2; g.add(clock); }
  const cam = A.instance(A.get('security_camera_01'), { fit: { h: 0.22 } });
  if (cam && year >= 1995) { cam.position.set(X1 - 0.12, H - 0.3, 0.2); cam.rotation.y = -Math.PI * 0.75; g.add(cam); }

  // ljus: sol genom fönstren, himmelsfyllnad, takarmaturer, spotar
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(-3.5, 7.5, -8); sun.target.position.set(0.5, 0, 3.5); g.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  out.lights.sun = sun;
  const hemi = new THREE.HemisphereLight(0xdbe8ff, 0x6a6058, 0.75); g.add(hemi);
  g.add(new THREE.AmbientLight(0xfff4e6, 0.22));
  const fix = A.get('mounted_fluorescent_lights');
  const panelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.35, 1.32, 1.22) });
  out.lights.panels = [];
  const cols = R.W > 9 ? [-3.4, 0, 3.4] : [-2.4, 2.4], rows = [D * 0.22, D * 0.5, D * 0.78];
  for (const x of cols) for (const z of rows) {
    if (fix) { const f = A.instance(fix, { fit: { w: 1.3 } }); const fs = A.modelSize(f); f.position.set(x, H - fs.y - 0.01, z); f.rotation.y = Math.PI / 2; g.add(f); }
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 1.25), panelMat); p.rotation.x = Math.PI / 2; p.position.set(x, H - 0.13, z); g.add(p);
    const l = new THREE.RectAreaLight(0xfff4e6, plan.style === 'led' ? 4.5 : 6.5, 0.3, 1.25); l.position.set(x, H - 0.14, z); l.lookAt(x, 0, z); g.add(l);
    out.lights.panels.push(l);
  }
  const spot = (x, z, i = 45, col = 0xfff0dd) => { const s = new THREE.SpotLight(col, i, 11, 0.62, 0.55, 2); s.position.set(x, H - 0.05, z); s.target.position.set(x, 0, z + 0.2); s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0005; s.shadow.normalBias = 0.02; g.add(s, s.target); return s; };
  out.lights.spots = [spot((cx0 + cx1) / 2, cz1 + 0.6)];
  if (plan.hero) out.lights.spots.push(spot(C.toX(plan.hero.cx), C.toZ(plan.hero.base) - 0.3, 60));
  if (plan.sofa) out.lights.spots.push(spot(C.toX((plan.sofa.x0 + plan.sofa.x1) / 2), C.toZ(plan.sofa.base) - 0.3, 30));
  // led-stil: färgat ljus i taket
  if (plan.style === 'led') { const l1 = new THREE.PointLight(0x7ee8fa, 6, 8, 2); l1.position.set(X0 + 1, 2.7, D * 0.5); const l2 = new THREE.PointLight(0xff4d9a, 5, 8, 2); l2.position.set(X1 - 1, 2.7, D * 0.8); g.add(l1, l2); }

  // hylla längs bakväggen (gången bakom montrarna)
  slab(g, X0 + 0.3, X1 - 0.3, 1.5, 1.53, D - 0.32, D - 0.02, A.pbr('oak_veneer_01', { repeat: [4, 0.2], color: 0xd8b98a }));
  slab(g, X0 + 0.3, X1 - 0.3, 2.1, 2.13, D - 0.32, D - 0.02, A.pbr('oak_veneer_01', { repeat: [4, 0.2], color: 0xd8b98a }));
  for (let x = X0 + 0.4; x < X1 - 0.3; x += 1.6) { slab(g, x - 0.02, x + 0.02, 1.53, 2.1, D - 0.3, D - 0.04, metalMat(0x8a8f96, 0.4)); }
  scene.add(g);
  out.update = (dt, floor) => {
    const k = floor ? floor.door : 0;
    leafL.position.x = out.door.x0 - out.door.slide * k;
    leafR.position.x = out.door.x1 + out.door.slide * k;
  };
  out.dispose = () => { scene.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); };
  return out;
}

export const MODELS_ROOM = ['CashRegister_01', 'drawer_cabinet', 'hanging_picture_frame_01', 'wall_clock', 'security_camera_01', 'mounted_fluorescent_lights'];
