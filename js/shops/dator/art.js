// Samlar pixelgrafiken + gör ikoner till menyer, lådan och montrarna.
import { Raster } from '../../core/raster.js';
import { VIEW } from './geom.js';
import { drawMat, drawCase, drawBoard } from './art-base.js';
import { drawCpu, drawCooler, drawRam, drawStorage, drawGpu, drawPsu, drawFans, drawScrews } from './art-parts.js';
import { drawCaseStanding } from './art-case.js';

export { drawMat, drawScrews, drawCaseStanding };

export function drawPart(R, part, o) {
  switch (part.cat) {
    case 'case': return drawCase(R, part, o);
    case 'mb': return drawBoard(R, part, o);
    case 'cpu': return drawCpu(R, part, o);
    case 'cooler': return drawCooler(R, part, o);
    case 'ram': return drawRam(R, part, o);
    case 'storage': return drawStorage(R, part, o);
    case 'gpu': return drawGpu(R, part, o);
    case 'psu': return drawPsu(R, part, o);
    case 'fans': return drawFans(R, part, o);
  }
}

// ---------- Ikoner ----------
const ICONS = new Map();

function makeRaster(scale = 1) {
  const R = new Raster(VIEW.w + 40, VIEW.h + 60);
  R.k = VIEW.k * scale; R.hz = VIEW.hz * scale; R.ox = VIEW.ox + 20; R.oy = VIEW.oy + 40;
  R.clear();
  return R;
}
function bbox(R) {
  let x0 = R.w, y0 = R.h, x1 = -1, y1 = -1;
  for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) {
    if (R.data[(y * R.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return x1 < 0 ? { x: 0, y: 0, w: 1, h: 1 } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
function drawIconPart(R, part, o) {
  if (part.cat === 'case') return drawCaseStanding(R, part, o, [0, 0, 0]);
  if (part.cat === 'ram') return drawRam(R, { ...part, sticks: 1 }, o);
  if (part.cat === 'fans') return drawFans(R, { ...part, count: 1 }, o);
  if (part.cat === 'cooler' && part.look.type === 'aio') return drawCooler(R, part, o);
  return drawPart(R, part, o);
}

// Ritar delen isolerat (RGB tänt som i en butiksmonter) och beskär till W×H.
export function iconCanvas(part, W = 64, H = 54) {
  const key = part.id + ':' + W + 'x' + H;
  let src = ICONS.get(key);
  if (!src) {
    const o = { ids: {}, id: 0, spin: 0.4, t: 1.2, showroom: true, leverClosed: true };
    let R = makeRaster(1); drawIconPart(R, part, o); R.flush();
    let bb = bbox(R);
    const f = Math.min((W - 2) / bb.w, (H - 2) / bb.h);
    if (f < 1) { R = makeRaster(f); drawIconPart(R, part, o); R.flush(); bb = bbox(R); }
    const s = f >= 2 ? Math.min(4, Math.floor(f)) : 1;
    src = document.createElement('canvas'); src.width = W; src.height = H;
    const cx = src.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(R.canvas, bb.x, bb.y, bb.w, bb.h, Math.round((W - bb.w * s) / 2), Math.round((H - bb.h * s) / 2), bb.w * s, bb.h * s);
    ICONS.set(key, src);
  }
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}
