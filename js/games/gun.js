// Ljuspistol: fiender dyker upp i fönster och dörrar – sikta och skjut innan de skjuter dig.
// Sikte med piltangenter eller mus/touch (inp.mx, inp.my i skärmpixlar). (Operation Wolf, Time Crisis …)
import { W, H, R, hud, overBox, rnd, irnd, clamp } from './common.js';

const SPOTS = [[20, 40], [70, 34], [120, 46], [170, 34], [215, 44], [45, 80], [110, 88], [180, 82]];
export function create(skin = {}) {
  const g = { title: skin.title || 'LJUSPISTOL', score: 0, lives: 3, over: false, t: 0, cx: W / 2, cy: H / 2, foes: [], ammo: 6, reload: 0, flash: 0, hurt: 0, wave: 1, spawnT: 0 };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (inp.mx !== undefined) { g.cx = inp.mx; g.cy = inp.my; }
    else { const s = 140 * dt; if (inp.left) g.cx -= s; if (inp.right) g.cx += s; if (inp.up) g.cy -= s; if (inp.down) g.cy += s; }
    g.cx = clamp(g.cx, 0, W); g.cy = clamp(g.cy, 0, H);
    g.reload = Math.max(0, g.reload - dt); g.flash = Math.max(0, g.flash - dt); g.hurt = Math.max(0, g.hurt - dt);
    if (inp.b && g.ammo < 6 && g.reload <= 0) { g.reload = 0.6; g.ammo = 6; }
    if (inp.hit && g.reload <= 0) {
      if (g.ammo <= 0) g.reload = 0.6, g.ammo = 6;
      else {
        g.ammo--; g.flash = 0.06;
        for (const f of g.foes) if (!f.dead && Math.abs(f.x + 8 - g.cx) < 11 && Math.abs(f.y + 10 - g.cy) < 13) { f.dead = true; f.deadT = 0.3; g.score += f.fast ? 300 : 100; break; }
      }
    }
    g.spawnT -= dt;
    if (g.spawnT <= 0 && g.foes.filter((f) => !f.dead).length < 2 + Math.min(3, g.wave)) {
      const sp = SPOTS[irnd(0, SPOTS.length - 1)];
      if (!g.foes.some((f) => !f.dead && f.x === sp[0])) g.foes.push({ x: sp[0], y: sp[1], t: 0, fire: rnd(1.6, 2.6) - Math.min(1, g.wave * 0.15), fast: Math.random() < 0.2 });
      g.spawnT = rnd(0.5, 1.4);
    }
    for (const f of g.foes) {
      f.t += dt;
      if (f.dead) { f.deadT -= dt; if (f.deadT <= 0) f.gone = true; continue; }
      if (f.t > f.fire) { g.hurt = 0.4; g.lives--; f.dead = true; f.deadT = 0.2; if (g.lives <= 0) g.over = true; }
      if (f.t > 4) f.gone = true;
    }
    g.foes = g.foes.filter((f) => !f.gone);
    if (g.score >= g.wave * 1500) g.wave++;
  };
  g.draw = (ctx) => {
    // gata med hus, fönster och dörrar
    R(ctx, 0, 0, W, 100, skin.sky || '#2a3a5a'); R(ctx, 0, 100, W, 60, skin.ground || '#4a3a2a');
    for (let i = 0; i < 5; i++) { const hx = i * 50; R(ctx, hx, 24, 46, 78, ['#5a4a3a', '#4a5a6a', '#6a4a4a'][i % 3]); R(ctx, hx, 24, 46, 3, '#8a7a6a'); for (const [wx, wy] of [[6, 30], [26, 30], [6, 58], [26, 58]]) R(ctx, hx + wx, wy, 14, 16, '#1a1a24'); R(ctx, hx + 16, 80, 14, 22, '#2a1a14'); }
    for (const f of g.foes) {
      if (f.dead) { R(ctx, f.x + 2, f.y + 6, 12, 8, '#f0e030'); continue; }
      const warn = f.t > f.fire - 0.5 && Math.floor(g.t * 10) % 2;
      R(ctx, f.x + 4, f.y, 8, 6, '#e0a97f'); R(ctx, f.x + 2, f.y + 6, 12, 10, warn ? '#f4f2ec' : (skin.foe || '#2f6f3a')); R(ctx, f.x + 4, f.y + 16, 3, 6, '#2a2a34'); R(ctx, f.x + 9, f.y + 16, 3, 6, '#2a2a34');
      R(ctx, f.x + 12, f.y + 8, 8, 2, '#1a1a1e');
      if (warn) R(ctx, f.x + 20, f.y + 7, 3, 3, '#f0e030');
    }
    if (g.flash) R(ctx, 0, 0, W, H, 'rgba(255,255,255,.35)');
    if (g.hurt) R(ctx, 0, 0, W, H, `rgba(220,40,40,${g.hurt})`);
    // sikte
    const cx = Math.round(g.cx), cy = Math.round(g.cy);
    R(ctx, cx - 8, cy, 5, 1, '#e23b5a'); R(ctx, cx + 4, cy, 5, 1, '#e23b5a'); R(ctx, cx, cy - 8, 1, 5, '#e23b5a'); R(ctx, cx, cy + 4, 1, 5, '#e23b5a');
    R(ctx, cx - 4, cy - 4, 9, 1, 'rgba(226,59,90,.5)'); R(ctx, cx - 4, cy + 4, 9, 1, 'rgba(226,59,90,.5)');
    // ammo
    for (let i = 0; i < 6; i++) R(ctx, 4 + i * 6, H - 10, 4, 7, i < g.ammo ? '#f0e030' : '#3a3a44');
    if (g.reload > 0) R(ctx, 4, H - 14, 36 * (1 - g.reload / 0.6), 2, '#f4f2ec');
    hud(ctx, g.score, g.lives, 'VÅG ' + g.wave + '   B = LADDA OM');
    if (g.over) overBox(ctx);
  };
  return g;
}
