// Dansmatta: pilar rullar uppåt, tryck rätt riktning när pilen är i zonen. (Dancing Stage)
import { W, H, R, text, centered, hud, overBox, irnd } from './common.js';

const LANES = [['left', 60], ['down', 100], ['up', 140], ['right', 180]];
const COLS = ['#e23b5a', '#3a78d8', '#3fb04a', '#f0e030'];
export function create(skin = {}) {
  const g = { title: skin.title || 'DANS', score: 0, lives: -1, over: false, t: 0, notes: [], combo: 0, best: 0, hp: 60, bpm: 120, nextBeat: 1, pop: [], songT: 90, judge: '', judgeT: 0 };
  const ZONE = 24;
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    g.songT -= dt;
    if (g.songT <= 0) { g.over = true; g.msg = 'LÅTEN SLUT'; return; }
    // noter genereras på taktslagen
    const beat = 60 / g.bpm;
    while (g.nextBeat < g.t + 2) { if (Math.random() < 0.8) g.notes.push({ lane: irnd(0, 3), t: g.nextBeat }); if (Math.random() < 0.25) g.notes.push({ lane: irnd(0, 3), t: g.nextBeat + beat / 2 }); g.nextBeat += beat; }
    g.judgeT = Math.max(0, g.judgeT - dt);
    // träff: pilen närmast zonen i den riktningen
    for (let i = 0; i < 4; i++) {
      const key = LANES[i][0];
      if (!inp[key + 'Hit']) continue;
      const cand = g.notes.filter((n) => n.lane === i && !n.done && Math.abs(n.t - g.t) < 0.25).sort((a, b) => Math.abs(a.t - g.t) - Math.abs(b.t - g.t))[0];
      if (cand) { const d = Math.abs(cand.t - g.t); cand.done = true; const perfect = d < 0.08; g.combo++; g.best = Math.max(g.best, g.combo); g.score += (perfect ? 100 : 50) * (1 + Math.floor(g.combo / 10)); g.hp = Math.min(100, g.hp + 2); g.judge = perfect ? 'PERFEKT!' : 'BRA'; g.judgeT = 0.4; g.pop.push({ lane: i, t: 0 }); }
    }
    for (const n of g.notes) if (!n.done && n.t < g.t - 0.25) { n.done = true; n.miss = true; g.combo = 0; g.hp -= 6; g.judge = 'MISS'; g.judgeT = 0.4; }
    g.notes = g.notes.filter((n) => n.t > g.t - 0.5);
    for (const p of g.pop) p.t += dt; g.pop = g.pop.filter((p) => p.t < 0.3);
    if (g.hp <= 0) { g.over = true; g.msg = 'UTDANSAD'; }
    g.bpm = 120 + Math.floor((90 - g.songT) / 20) * 10;
  };
  const arrow = (ctx, x, y, dir, col, size = 14) => {
    const s = size, h = s / 2;
    if (dir === 'up') { R(ctx, x - 2, y - h + 4, 4, s - 4, col); R(ctx, x - h + 1, y - h + 6, s - 2, 2, col); R(ctx, x - 3, y - h + 3, 6, 2, col); R(ctx, x - 1, y - h, 2, 3, col); }
    else if (dir === 'down') { R(ctx, x - 2, y - h, 4, s - 4, col); R(ctx, x - h + 1, y + h - 8, s - 2, 2, col); R(ctx, x - 3, y + h - 5, 6, 2, col); R(ctx, x - 1, y + h - 3, 2, 3, col); }
    else if (dir === 'left') { R(ctx, x - h + 4, y - 2, s - 4, 4, col); R(ctx, x - h + 6, y - h + 1, 2, s - 2, col); R(ctx, x - h + 3, y - 3, 2, 6, col); R(ctx, x - h, y - 1, 3, 2, col); }
    else { R(ctx, x - h, y - 2, s - 4, 4, col); R(ctx, x + h - 8, y - h + 1, 2, s - 2, col); R(ctx, x + h - 5, y - 3, 2, 6, col); R(ctx, x + h - 3, y - 1, 3, 2, col); }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, skin.bg || '#1a1030');
    const beat = 60 / g.bpm, pulse = 1 - ((g.t % beat) / beat);
    for (let i = 0; i < 12; i++) R(ctx, i * 20, 150 - pulse * 6 - (i % 3) * 4, 16, 10 + pulse * 6, ['#3a2a6a', '#2a3a6a', '#4a2a5a'][i % 3]);
    // zonen
    LANES.forEach(([dir, x], i) => { R(ctx, x - 10, ZONE - 10, 20, 20, 'rgba(255,255,255,.08)'); arrow(ctx, x, ZONE, dir, 'rgba(255,255,255,.35)'); });
    for (const n of g.notes) {
      if (n.done) continue;
      const y = ZONE + (n.t - g.t) * 90;
      if (y < 0 || y > H + 10) continue;
      arrow(ctx, LANES[n.lane][1], y, LANES[n.lane][0], COLS[n.lane]);
    }
    for (const p of g.pop) { const s = 14 + p.t * 40; R(ctx, LANES[p.lane][1] - s / 2, ZONE - s / 2, s, s, `rgba(255,255,255,${0.5 - p.t * 1.5})`); }
    R(ctx, W - 14, 30, 8, 100, '#1a1a1e'); R(ctx, W - 14, 130 - g.hp, 8, g.hp, g.hp > 30 ? '#3fb04a' : '#e23b5a');
    if (g.judgeT > 0) centered(ctx, g.judge, 44, g.judge === 'MISS' ? '#e23b5a' : '#f0e030', true);
    if (g.combo > 4) centered(ctx, g.combo + ' KOMBO', 60, '#f4f2ec');
    hud(ctx, g.score, -1, `${Math.ceil(g.songT)} S   ${g.bpm} BPM`);
    if (g.over) overBox(ctx, g.msg || 'GAME OVER', `BÄSTA KOMBO ${g.best}`);
  };
  return g;
}
