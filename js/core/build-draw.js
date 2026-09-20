// Byggvyns canvas-lager ovanpå pixelrastern: markeringar, handgrepp, uttagsetiketter
// och etikettrutor (röda rutor som i referensbilden).

const RED = '#9e1b22', INK = '#17151a', PAPER = '#f1ebe0';
export const FONT = '"VT323", ui-monospace, monospace';
export const HEAD = '"Jersey 10", "VT323", sans-serif';

// värld → skärm (css-px) via byggvyns kamera
export function proj(view, u, v, z) {
  return view.P.proj(u, v, z);
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
  // ring = bara en streckad kant (lager i en stapel – fyllningen skulle täcka det som redan ligger där)
  if (!slot.ring) { ctx.fillStyle = color; ctx.globalAlpha = 0.16 + 0.18 * a; ctx.fill(); }
  ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeStyle = color; ctx.setLineDash([8, 5]); ctx.lineDashOffset = -t * 30; ctx.stroke();
  ctx.restore();
}

export function drawHotspot(ctx, x, y, t, icon, label, small = false) {
  const r = small ? 9 : 15;
  ctx.save();
  ctx.fillStyle = 'rgba(245,197,66,.35)';
  ctx.beginPath(); ctx.arc(x, y, r + 5 + Math.sin(t * 5) * 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f5c542'; ctx.strokeStyle = INK; ctx.lineWidth = small ? 2 : 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (icon) { ctx.font = `${small ? 12 : 17}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, x, y + 1); }
  if (label) {
    ctx.font = `17px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(label).width + 12;
    ctx.fillStyle = INK; ctx.fillRect(x - w / 2, y + r + 6, w, 20);
    ctx.fillStyle = '#fff'; ctx.fillText(label, x, y + r + 16);
  }
  ctx.restore();
}

// Hand som guppar över det som ligger färdigt på en station och går att ta
export function drawHand(ctx, x, y, t, label = '') {
  const dy = Math.sin(t * 4) * 3;
  ctx.save();
  ctx.font = `22px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.fillText('✋', x, y - 22 + dy);
  ctx.shadowColor = 'transparent';
  if (label) {
    ctx.font = `17px ${FONT}`;
    const w = ctx.measureText(label).width + 12;
    ctx.fillStyle = INK; ctx.fillRect(x - w / 2, y - 48 + dy, w, 20);
    ctx.fillStyle = '#fff'; ctx.fillText(label, x, y - 38 + dy);
  }
  ctx.restore();
}

// Skruvmejsel som snurrar på en punkt
export function drawScrewdriver(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 30) * 0.5);
  ctx.fillStyle = INK; ctx.fillRect(-3, -34, 6, 22);
  ctx.fillStyle = '#c9323a'; ctx.fillRect(-7, -58, 14, 26);
  ctx.fillStyle = '#e8565e'; ctx.fillRect(-5, -56, 3, 22);
  ctx.fillStyle = '#b9bdc2'; ctx.fillRect(-2, -14, 4, 12);
  ctx.restore();
}

// Silkscreen-etiketter för uttag medan man håller en kabel
export function drawPortTags(ctx, list, t) {
  ctx.save();
  ctx.font = `15px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of list) {
    const [x, y] = p.pt;
    if (p.want) {
      ctx.strokeStyle = '#f5c542'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = p.busy ? 'rgba(120,120,120,.8)' : 'rgba(255,255,255,.9)';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    const w = ctx.measureText(p.label).width + 8;
    ctx.fillStyle = p.want ? '#f5c542' : p.busy ? 'rgba(40,40,40,.75)' : 'rgba(23,21,26,.85)';
    ctx.fillRect(x - w / 2, y - 24, w, 15);
    ctx.fillStyle = p.want ? INK : '#fff';
    ctx.fillText(p.label, x, y - 16);
  }
  ctx.restore();
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

// Etiketter i marginalerna med streck till delen – { title, text, pt:[x,y], side, dark }
export function drawLabels(ctx, view, labels, W, H) {
  const boxW = view.labelW - 16;
  if (boxW < 90) return;
  for (const side of ['left', 'right']) {
    const list = labels.filter((l) => l.side === side);
    list.sort((a, b) => a.pt[1] - b.pt[1]);
    for (const l of list) {
      ctx.font = `18px ${HEAD}`; l.tl = wrap(ctx, l.title, boxW - 14);
      ctx.font = `16px ${FONT}`; l.bl = l.text ? wrap(ctx, l.text, boxW - 14) : [];
      l.h = 8 + l.tl.length * 17 + l.bl.length * 15 + 6;
    }
    let y = 10;
    for (const l of list) { l.by = Math.max(y, l.pt[1] - l.h / 2); y = l.by + l.h + 8; }
    let limit = H - 76;
    for (let i = list.length - 1; i >= 0; i--) { const l = list[i]; if (l.by + l.h > limit) l.by = limit - l.h; limit = l.by - 8; }
    for (const l of list) {
      ctx.save(); ctx.globalAlpha = l.alpha ?? 1;
      const x = side === 'left' ? 8 : W - 8 - boxW, ex = side === 'left' ? x + boxW : x;
      ctx.strokeStyle = RED; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ex, l.by + l.h / 2); ctx.lineTo(ex + (side === 'left' ? 14 : -14), l.by + l.h / 2); ctx.lineTo(l.pt[0], l.pt[1]); ctx.stroke();
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(l.pt[0], l.pt[1], 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = INK; ctx.fillRect(x + 3, l.by + 3, boxW, l.h);
      ctx.fillStyle = l.dark ? RED : PAPER; ctx.fillRect(x, l.by, boxW, l.h);
      ctx.strokeStyle = l.dark ? INK : RED; ctx.lineWidth = 2; ctx.strokeRect(x + 1, l.by + 1, boxW - 2, l.h - 2);
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.font = `18px ${HEAD}`; ctx.fillStyle = l.dark ? '#fff' : RED;
      l.tl.forEach((s, i) => ctx.fillText(s, x + 7, l.by + 6 + i * 17));
      ctx.font = `16px ${FONT}`; ctx.fillStyle = l.dark ? '#ffe9e9' : INK;
      l.bl.forEach((s, i) => ctx.fillText(s, x + 7, l.by + 6 + l.tl.length * 17 + i * 15));
      ctx.restore();
    }
  }
}
