// Gemensamt för minispelen: intern skärm 240×160, ritverktyg, slump och en liten font.
// Varje motor exporterar create(skin, opts) → { update(dt, inp), draw(ctx), score, lives, over, title }
// inp = { left, right, up, down, a, b, start } (booleans) + inp.hit (a-knappen precis tryckt)
import { SMALL, BIG, textW, eachTextPixel } from '../core/floor-pix.js';

export const W = 240, H = 160;

export function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
export function text(ctx, s, x, y, c, big = false, scale = 1) {
  ctx.fillStyle = c;
  eachTextPixel(big ? BIG : SMALL, s, x, y, scale, (px, py) => ctx.fillRect(px, py, scale, scale));
}
export function centered(ctx, s, y, c, big = false, scale = 1) { text(ctx, s, Math.round((W - textW(big ? BIG : SMALL, s, scale)) / 2), y, c, big, scale); }
export const tw = (s, big = false, scale = 1) => textW(big ? BIG : SMALL, s, scale);
export const rnd = (a, b) => a + Math.random() * (b - a);
export const irnd = (a, b) => Math.floor(rnd(a, b + 1));
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// standard-HUD överst: poäng, liv (och valfri extra text)
export function hud(ctx, score, lives, extra = '', col = '#f4f2ec') {
  R(ctx, 0, 0, W, 9, 'rgba(0,0,0,.55)');
  text(ctx, 'POÄNG ' + String(score).padStart(6, '0'), 3, 2, col);
  if (lives >= 0) { for (let i = 0; i < lives; i++) R(ctx, W - 8 - i * 6, 2, 4, 5, '#e23b5a'); }
  if (extra) text(ctx, extra, Math.round((W - tw(extra)) / 2), 2, '#f0e030');
}
// game over-ruta
export function overBox(ctx, title = 'GAME OVER', sub = '') {
  R(ctx, 40, 56, W - 80, 44, 'rgba(0,0,0,.8)'); R(ctx, 40, 56, W - 80, 1, '#f4f2ec'); R(ctx, 40, 99, W - 80, 1, '#f4f2ec');
  centered(ctx, title, 64, '#e23b5a', true);
  if (sub) centered(ctx, sub, 80, '#f4f2ec');
  centered(ctx, 'ENTER = IGEN   ESC = SLUTA', 90, '#8a8f9c');
}
// liten pixelfigur (sidovy), riktning ±1, frame 0-1
export function dude(ctx, x, y, dir, frame, col, skin = '#f6d7bf', h = 14) {
  R(ctx, x - 2, y - h, 4, 4, skin);            // huvud
  R(ctx, x - 2, y - h, 4, 1, '#3b2619');
  R(ctx, x - 3, y - h + 4, 6, 6, col);          // kropp
  R(ctx, x + dir * 3, y - h + 5, 2, 3, col);    // arm
  R(ctx, x - 3, y - 4, 2, 4 - (frame ? 1 : 0), '#2d3a5c');
  R(ctx, x + 1, y - 4 + (frame ? 1 : 0), 2, 4 - (frame ? 1 : 0), '#2d3a5c');
}
