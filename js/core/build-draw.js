// Byggvyns canvas-lager ovanpå pixelrastern: markeringar, kablar, etiketter
// (röda rutor som i referensbilden) och uppstartsanimationen.

const RED = '#9e1b22', INK = '#17151a', PAPER = '#f1ebe0';
const FONT = '"VT323", ui-monospace, monospace';
const HEAD = '"Jersey 10", "VT323", sans-serif';

export function proj(view, u, v, z) {
  const R = view.R;
  const [x, y] = R.proj(u, v, z);
  return [view.ox + x * view.s, view.oy + y * view.s];
}

export function slotPoly(view, slot) {
  const [u0, u1, v0, v1, z] = slot.hl;
  return [proj(view, u0, v0, z), proj(view, u1, v0, z), proj(view, u1, v1, z), proj(view, u0, v1, z)];
}

export function inPoly(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function drawHighlight(ctx, view, slot, t, color = '#f5c542') {
  const poly = slotPoly(view, slot);
  const a = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.save();
  ctx.beginPath(); poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  ctx.fillStyle = color; ctx.globalAlpha = 0.18 + 0.2 * a; ctx.fill();
  ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.setLineDash([8, 5]); ctx.lineDashOffset = -t * 30; ctx.stroke();
  ctx.restore();
}

export function drawHotspot(ctx, x, y, t, icon, label) {
  const r = 17 + Math.sin(t * 5) * 2;
  ctx.save();
  ctx.fillStyle = 'rgba(245,197,66,.35)'; ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5c542'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.font = `17px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, x, y + 1);
  if (label) {
    ctx.font = `17px ${FONT}`;
    const w = ctx.measureText(label).width + 12;
    ctx.fillStyle = INK; ctx.fillRect(x - w / 2, y + 21, w, 20);
    ctx.fillStyle = '#fff'; ctx.fillText(label, x, y + 31);
  }
  ctx.restore();
}

export function drawCable(ctx, view, from, to, color, progress = 1) {
  const a = proj(view, ...from), b = proj(view, ...to);
  const m1 = proj(view, from[0], from[1], from[2] + 3), m2 = proj(view, to[0], to[1], to[2] + 3);
  ctx.save();
  ctx.lineCap = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(...a); ctx.bezierCurveTo(...m1, ...m2, ...b); };
  if (progress < 1) { ctx.setLineDash([2000]); ctx.lineDashOffset = 2000 * (1 - progress); }
  path(); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(5, view.s * 2.4); ctx.stroke();
  path(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, view.s * 1.1); ctx.stroke();
  ctx.restore();
  if (progress >= 1) { ctx.fillStyle = INK; ctx.fillRect(b[0] - 5, b[1] - 4, 10, 8); ctx.fillStyle = color; ctx.fillRect(b[0] - 3, b[1] - 2, 6, 4); }
}

function wrap(ctx, text, maxW) {
  const words = text.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Etiketter i marginalerna med streck till delen – { title, text, anchor:[u,v,z], side }
export function drawLabels(ctx, view, labels, W, H, alpha = 1) {
  const boxW = view.labelW - 16;
  if (boxW < 90) return;
  for (const side of ['left', 'right']) {
    const list = labels.filter((l) => l.side === side).map((l) => ({ ...l, pt: proj(view, ...l.anchor) }));
    list.sort((a, b) => a.pt[1] - b.pt[1]);
    // mät, placera nära delen utan överlapp, tryck upp om det tar slut nedtill
    for (const l of list) {
      ctx.font = `18px ${HEAD}`; l.tl = wrap(ctx, l.title, boxW - 14);
      ctx.font = `16px ${FONT}`; l.bl = l.text ? wrap(ctx, l.text, boxW - 14) : [];
      l.h = 8 + l.tl.length * 17 + l.bl.length * 15 + 6;
    }
    let y = 10;
    for (const l of list) { l.by = Math.max(y, l.pt[1] - l.h / 2); y = l.by + l.h + 10; }
    let limit = H - 76;
    for (let i = list.length - 1; i >= 0; i--) { const l = list[i]; if (l.by + l.h > limit) l.by = limit - l.h; limit = l.by - 10; }
    for (const l of list) {
      ctx.save(); ctx.globalAlpha = alpha * (l.alpha ?? 1);
      const tl = l.tl, bl = l.bl, h = l.h, by = l.by;
      const x = side === 'left' ? 8 : W - 8 - boxW;
      // streck
      const ex = side === 'left' ? x + boxW : x;
      ctx.strokeStyle = RED; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ex, by + h / 2); ctx.lineTo(ex + (side === 'left' ? 14 : -14), by + h / 2); ctx.lineTo(l.pt[0], l.pt[1]); ctx.stroke();
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(l.pt[0], l.pt[1], 4, 0, Math.PI * 2); ctx.fill();
      // ruta
      ctx.fillStyle = INK; ctx.fillRect(x + 3, by + 3, boxW, h);
      ctx.fillStyle = l.dark ? RED : PAPER; ctx.fillRect(x, by, boxW, h);
      ctx.strokeStyle = l.dark ? INK : RED; ctx.lineWidth = 2; ctx.strokeRect(x + 1, by + 1, boxW - 2, h - 2);
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.font = `18px ${HEAD}`; ctx.fillStyle = l.dark ? '#fff' : RED;
      tl.forEach((s, i) => ctx.fillText(s, x + 7, by + 6 + i * 17));
      ctx.font = `16px ${FONT}`; ctx.fillStyle = l.dark ? '#ffe9e9' : INK;
      bl.forEach((s, i) => ctx.fillText(s, x + 7, by + 6 + tl.length * 17 + i * 15));
      ctx.restore();
    }
  }
}

// Data som flyger längs systembussen
export function drawBus(ctx, view, bus, t) {
  for (const [bi, b] of bus.entries()) {
    const pts = b.pts.map((p) => proj(view, ...p));
    ctx.save();
    ctx.strokeStyle = 'rgba(126,232,250,.55)'; ctx.lineWidth = Math.max(3, view.s * 1.2);
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    const lens = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); total += l; }
    for (let k = 0; k < 3; k++) {
      let d = ((t * 90 + bi * 40 + k * total / 3) % total);
      if (bi % 2) d = total - d;
      for (let i = 0; i < lens.length; i++) {
        if (d <= lens[i]) {
          const f = d / lens[i], x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
          ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 4, 8, 8);
          ctx.fillStyle = '#7ee8fa'; ctx.fillRect(x - 3, y - 3, 6, 6);
          break;
        }
        d -= lens[i];
      }
    }
    ctx.restore();
  }
}

// Pipeline-diagram: fem steg, instruktioner som vandrar igenom
export function drawPipeline(ctx, W, t) {
  const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
  const names = ['Hämta', 'Avkoda', 'Utför', 'Minne', 'Skriv'];
  const bw = Math.min(74, (W - 40) / 5), x0 = (W - bw * 5) / 2, y = 10;
  const step = Math.floor(t * 2.5);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  stages.forEach((s, i) => {
    const x = x0 + i * bw;
    const instr = step - i;
    ctx.fillStyle = INK; ctx.fillRect(x + 3, y + 3, bw - 4, 46);
    ctx.fillStyle = instr >= 0 ? ['#2c6fb7', '#2f8f46', '#c9323a', '#7a5bc9', '#e0a02a'][instr % 5] : '#ccc';
    ctx.fillRect(x, y, bw - 4, 46);
    ctx.fillStyle = '#fff'; ctx.font = `20px ${HEAD}`; ctx.fillText(s, x + bw / 2 - 2, y + 15);
    ctx.font = `16px ${FONT}`; ctx.fillText(instr >= 0 ? `instr ${instr % 9 + 1}` : names[i], x + bw / 2 - 2, y + 34);
  });
  ctx.restore();
}
