// Procedurgenererade pixelpersoner. Ritas med fillRect på heltalskoordinater
// (skarpt när canvasen skalas upp). Figuren är 10×20 pixlar, fötterna vid (x, y).

const SKIN = ['#f5d3b5', '#eabf98', '#d19a6c', '#a86e45', '#7a4a2a', '#5b3620'];
const HAIR = ['#1f1a17', '#4a2f1d', '#7b4a24', '#c58b3c', '#e3c16f', '#b3b0aa', '#a5352a', '#3b3b8a', '#d06aa8'];
const SHIRT = ['#d9433b', '#3a7bd5', '#46a35a', '#f0b429', '#8e5bd1', '#2f3440', '#e8e3d6', '#e07a2e', '#2aa39a', '#b83d7a'];
const PANTS = ['#2d3a5c', '#3b3b3b', '#5a4632', '#6f7c8a', '#1f2a44', '#7a2e2e'];
const SHOES = ['#1c1c1c', '#f2f2f2', '#6b3e1e', '#c23b3b'];
const STYLES = ['short', 'short', 'long', 'bun', 'spiky', 'bald', 'cap', 'long', 'mohawk', 'curly'];

export const FIRST_NAMES = ['Alva', 'Elsa', 'Maja', 'Ella', 'Wilma', 'Saga', 'Nora', 'Vera', 'Liv', 'Stina', 'Ines', 'Greta',
  'Oscar', 'Liam', 'Noah', 'Hugo', 'William', 'Elias', 'Ludvig', 'Sixten', 'Vincent', 'Frans', 'Kalle', 'Bosse',
  'Ahmed', 'Leila', 'Yusuf', 'Mira', 'Kenji', 'Aiko', 'Mateo', 'Sofia', 'Ivan', 'Olga', 'Birgitta', 'Gunnar', 'Sven', 'Agneta'];

const pick = (rng, a) => a[Math.floor(rng() * a.length)];

export function makeLook(rng = Math.random) {
  return {
    skin: pick(rng, SKIN), hair: pick(rng, HAIR), style: pick(rng, STYLES),
    shirt: pick(rng, SHIRT), pants: pick(rng, PANTS), shoes: pick(rng, SHOES),
    cap: pick(rng, SHIRT), glasses: rng() < 0.28, beard: rng() < 0.15, phones: rng() < 0.12,
    kid: rng() < 0.18,
  };
}

export const SHOPKEEPER = {
  skin: '#eabf98', hair: '#4a2f1d', style: 'cap', cap: '#c9323a', shirt: '#c9323a', pants: '#2d3a5c',
  shoes: '#1c1c1c', glasses: false, beard: false, phones: false, kid: false, apron: true,
};

// dir: 'down' | 'up' | 'left' | 'right'; frame: 0 stå, 1/2 gång
export function drawPerson(ctx, fx, fy, L, dir = 'down', frame = 0) {
  const kid = L.kid ? 3 : 0;
  const x0 = Math.round(fx) - 5, y0 = Math.round(fy) - 20 + kid;
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x0 + x, y0 + y, w, h); };
  const side = dir === 'left' || dir === 'right';
  const flip = dir === 'left';
  const S = (x, y, w, h, c) => R(flip ? 10 - x - w : x, y, w, h, c); // spegling för sidovy
  const legLen = 5 - (L.kid ? 2 : 0);
  const ty = 8, tyEnd = 14 - (L.kid ? 2 : 0) + 0; // torso
  const legY = tyEnd;

  // skugga
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(x0 + 1, Math.round(fy) - 1, 8, 2);

  // ben
  const lf = frame === 1 ? 1 : 0, rf = frame === 2 ? 1 : 0;
  if (!side) {
    R(2, legY, 3, legLen - lf, L.pants); R(5, legY, 3, legLen - rf, L.pants);
    R(2, legY + legLen - lf, 3, 1, L.shoes); R(5, legY + legLen - rf, 3, 1, L.shoes);
  } else {
    const a = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    S(4 + a, legY, 3, legLen, L.pants); S(4 - a, legY, 3, legLen, L.pants);
    S(4 + a, legY + legLen, 4, 1, L.shoes); S(4 - a, legY + legLen, 4, 1, L.shoes);
  }
  // kropp
  if (!side) {
    R(2, ty, 6, tyEnd - ty, L.shirt);
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    R(1, ty, 1, 4 + swing, L.shirt); R(8, ty, 1, 4 - swing, L.shirt);
    R(1, ty + 4 + swing, 1, 1, L.skin); R(8, ty + 4 - swing, 1, 1, L.skin);
    if (L.apron && dir === 'down') { R(3, ty + 2, 4, tyEnd - ty - 2, '#f2eee4'); R(3, ty + 1, 1, 1, '#f2eee4'); R(6, ty + 1, 1, 1, '#f2eee4'); }
  } else {
    S(3, ty, 5, tyEnd - ty, L.shirt);
    const sw = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    S(5 + sw, ty + 1, 2, 4, shadeHex(L.shirt, 0.8)); S(5 + sw, ty + 5, 2, 1, L.skin);
  }
  // hals + huvud
  R(4, 7, 2, 1, L.skin);
  if (!side) R(2, 1, 6, 6, L.skin); else S(3, 1, 5, 6, L.skin);

  const H = L.hair;
  if (dir === 'up') {
    // bakifrån: mest hår
    if (L.style !== 'bald') R(2, 0, 6, L.style === 'long' ? 9 : 5, H);
    else R(2, 3, 6, 2, H);
    if (L.style === 'cap') R(2, 0, 6, 3, L.cap);
    if (L.style === 'bun') R(4, -2, 2, 2, H);
    if (L.phones) { R(1, 2, 1, 3, '#222'); R(8, 2, 1, 3, '#222'); R(2, 0, 6, 1, '#222'); }
    return;
  }
  // hår framifrån/sidan
  const hx = side ? 3 : 2, hw = side ? 5 : 6;
  const H2 = (x, y, w, h, c) => side ? S(x, y, w, h, c) : R(x, y, w, h, c);
  switch (L.style) {
    case 'short': H2(hx, 0, hw, 2, H); H2(hx, 2, 1, 1, H); if (!side) R(7, 2, 1, 1, H); else S(3, 2, 2, 2, H); break;
    case 'long': H2(hx, 0, hw, 2, H); if (!side) { R(1, 1, 1, 8, H); R(8, 1, 1, 8, H); R(2, 2, 1, 1, H); R(7, 2, 1, 1, H); } else S(2, 1, 2, 8, H); break;
    case 'bun': H2(hx, 0, hw, 2, H); H2(4, -2, 2, 2, H); break;
    case 'spiky': H2(hx, 0, hw, 2, H); for (let i = 0; i < hw; i += 2) H2(hx + i, -1, 1, 1, H); break;
    case 'bald': H2(hx, 2, 1, 2, H); if (!side) R(7, 2, 1, 2, H); break;
    case 'mohawk': H2(4, -2, 2, 3, H); break;
    case 'curly': H2(hx - 1, -1, hw + 2, 3, H); H2(hx - 1, 2, 1, 2, H); if (!side) R(8, 2, 1, 2, H); break;
    case 'cap': H2(hx, 0, hw, 2, L.cap); if (!side) R(2, 2, 6, 1, shadeHex(L.cap, 0.75)); else S(6, 2, 3, 1, shadeHex(L.cap, 0.75)); H2(hx, 2, 1, 1, H); break;
  }
  // ansikte
  const eye = '#1b1b1b';
  if (!side) {
    if (L.glasses) { R(2, 3, 6, 1, '#222'); R(3, 4, 1, 1, eye); R(6, 4, 1, 1, eye); R(2, 4, 1, 1, '#222'); R(7, 4, 1, 1, '#222'); R(4, 4, 2, 1, '#222'); }
    else { R(3, 4, 1, 1, eye); R(6, 4, 1, 1, eye); }
    R(4, 6, 2, 1, shadeHex(L.skin, 0.72));
    if (L.beard) R(2, 5, 6, 2, H);
  } else {
    S(6, 4, 1, 1, eye); if (L.glasses) S(5, 3, 3, 1, '#222');
    S(8, 5, 1, 1, L.skin);
    if (L.beard) S(4, 5, 4, 2, H);
  }
  if (L.phones) { if (!side) { R(1, 3, 1, 3, '#222'); R(8, 3, 1, 3, '#222'); R(2, -1, 6, 1, '#222'); } else { S(4, 3, 2, 3, '#222'); S(4, -1, 3, 1, '#222'); } }
}

export function shadeHex(h, f) {
  const n = parseInt(h.slice(1), 16);
  const r = Math.min(255, (n >> 16 & 255) * f) | 0, g = Math.min(255, (n >> 8 & 255) * f) | 0, b = Math.min(255, (n & 255) * f) | 0;
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Porträtt (för dialoger/kort) – 20×24 canvas, visas uppskalad via CSS
export function portrait(L, bg = '#d8cdb8') {
  const c = document.createElement('canvas');
  c.width = 20; c.height = 24;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 20, 24);
  ctx.save();
  ctx.scale(2, 2);
  drawPerson(ctx, 5, L.kid ? 19 : 22, L, 'down', 0);
  ctx.restore();
  return c;
}
