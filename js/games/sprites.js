// Sprites för minispelen: hjältar (sidovy), fiender och föremål – så att Mario inte ser ut som
// Sonic och en goomba inte som en krabba. Alla ritas med fötterna vid y.
import { R } from './common.js';

// hjälte: riktning ±1, fr 0/1 = steg, 2 = hopp, 3 = rullar (igelkott)
export function hero(ctx, kind, x, y, dir, fr, col = '#e23b5a') {
  const d = dir >= 0 ? 1 : -1, leg = fr === 1 ? 1 : 0;
  const legs = (c) => { R(ctx, x - 3, y - 4, 2, 4 - leg, c); R(ctx, x + 1, y - 4 + leg, 2, 4 - leg, c); };
  switch (kind) {
    case 'plumber':
      R(ctx, x - 3, y - 15, 7, 2, col); R(ctx, x - 4 + (d < 0 ? 0 : 1), y - 13, 7, 1, col); R(ctx, x - 2, y - 12, 5, 4, '#f6d7bf'); R(ctx, x + d, y - 10, 2, 1, '#3b2619');
      R(ctx, x - 3, y - 8, 6, 3, col); R(ctx, x - 3, y - 6, 6, 3, '#2a4ad8'); R(ctx, x + d * 4, y - 7, 2, 3, '#f6d7bf'); legs('#2a4ad8'); R(ctx, x - 4, y - 1, 3, 1, '#5a3d2b'); R(ctx, x + 1, y - 1, 3, 1, '#5a3d2b'); break;
    case 'hedgehog':
      if (fr === 3) { R(ctx, x - 5, y - 10, 10, 10, col); R(ctx, x - 3, y - 7, 6, 4, '#f6d7bf'); R(ctx, x - 6, y - 8, 1, 4, col); R(ctx, x + 5, y - 8, 1, 4, col); break; }
      R(ctx, x - 3, y - 14, 7, 7, col); R(ctx, x - d * 6, y - 13, 4, 2, col); R(ctx, x - d * 6, y - 10, 4, 2, col); R(ctx, x - d * 5, y - 7, 3, 2, col);
      R(ctx, x + d * 1, y - 12, 3, 3, '#f4f2ec'); R(ctx, x + d * 2, y - 11, 1, 1, '#1a1a1e'); R(ctx, x + d * 3, y - 9, 1, 1, '#1a1a1e');
      R(ctx, x - 2, y - 7, 5, 4, '#f6d7bf'); R(ctx, x - 3, y - 4, 2, 2, col); R(ctx, x + 1, y - 4 + leg, 2, 2, col); R(ctx, x - 5, y - 2, 4, 2, '#e23b5a'); R(ctx, x + 1, y - 2, 4, 2, '#e23b5a'); R(ctx, x - 5, y - 2, 4, 1, '#f4f2ec'); break;
    case 'ninja': R(ctx, x - 2, y - 14, 5, 5, '#1a1a1e'); R(ctx, x - 1, y - 12, 3, 1, '#f6d7bf'); R(ctx, x - 3, y - 9, 6, 5, '#1a1a1e'); R(ctx, x + d * 3, y - 8, 4, 1, '#c8c8d0'); legs('#1a1a1e'); R(ctx, x - d * 5, y - 13, 3, 1, col); break;
    case 'kid': R(ctx, x - 3, y - 14, 7, 6, '#f6d7bf'); R(ctx, x - 5, y - 13, 2, 3, '#f6d7bf'); R(ctx, x + 4, y - 13, 2, 3, '#f6d7bf'); R(ctx, x - 2, y - 15, 5, 2, '#1a1a1e'); R(ctx, x + d, y - 11, 1, 1, '#1a1a1e'); R(ctx, x - 3, y - 8, 6, 5, col); legs(col); break;
    case 'girl': R(ctx, x - 3, y - 15, 7, 3, '#f0e030'); R(ctx, x - 4, y - 13, 2, 6, '#f0e030'); R(ctx, x + 3, y - 13, 2, 6, '#f0e030'); R(ctx, x - 2, y - 12, 5, 4, '#f6d7bf'); R(ctx, x - 3, y - 8, 6, 5, col); legs('#3a78d8'); break;
    case 'ape': R(ctx, x - 6, y - 14, 12, 10, col); R(ctx, x - 3, y - 12, 6, 5, '#e0a97f'); R(ctx, x - 2, y - 11, 1, 1, '#1a1a1e'); R(ctx, x + 1, y - 11, 1, 1, '#1a1a1e'); R(ctx, x - 8, y - 8 + leg, 3, 6, col); R(ctx, x + 5, y - 8 - leg, 3, 6, col); R(ctx, x - 4, y - 4, 3, 4, col); R(ctx, x + 1, y - 4, 3, 4, col); R(ctx, x - 3, y - 7, 6, 2, '#e23b5a'); break;
    case 'link': R(ctx, x - 3, y - 16, 6, 3, col); R(ctx, x - d * 2, y - 18, 3, 2, col); R(ctx, x - 2, y - 13, 5, 4, '#f6d7bf'); R(ctx, x - 3, y - 9, 6, 5, col); R(ctx, x - 2, y - 7, 4, 1, '#5a3d2b'); legs('#c8a24a'); R(ctx, x + d * 4, y - 12, 2, 8, '#c8c8d0'); R(ctx, x + d * 3, y - 6, 4, 1, '#c8a24a'); break;
    case 'marine': R(ctx, x - 3, y - 14, 6, 5, col); R(ctx, x - 2, y - 12, 4, 2, '#3fd0e0'); R(ctx, x - 4, y - 9, 8, 5, col); R(ctx, x + d * 4, y - 8, 4, 2, '#3a3a44'); legs(col); break;
    case 'robot': R(ctx, x - 3, y - 14, 6, 5, col); R(ctx, x - 2, y - 12, 4, 3, '#f6d7bf'); R(ctx, x - 3, y - 9, 6, 5, col); R(ctx, x + d * 4, y - 8, 3, 3, col); legs(col); R(ctx, x - 4, y - 1, 3, 1, col); R(ctx, x + 1, y - 1, 3, 1, col); break;
    case 'turtle': R(ctx, x - 3, y - 13, 6, 5, '#3fb04a'); R(ctx, x - 4, y - 12, 8, 2, col); R(ctx, x - 1, y - 12, 1, 1, '#f4f2ec'); R(ctx, x + 1, y - 12, 1, 1, '#f4f2ec'); R(ctx, x - 4, y - 8, 8, 5, '#5a3d2b'); R(ctx, x - 3, y - 7, 6, 3, '#3fb04a'); legs('#3fb04a'); break;
    case 'crash': R(ctx, x - 3, y - 14, 6, 5, col); R(ctx, x - 4, y - 16, 2, 3, col); R(ctx, x + 2, y - 16, 2, 3, col); R(ctx, x - 2, y - 11, 4, 2, '#e8c26a'); R(ctx, x - 3, y - 9, 6, 5, '#2a4ad8'); legs(col); break;
    case 'knight': R(ctx, x - 3, y - 14, 6, 5, '#c8c8d0'); R(ctx, x - 2, y - 12, 4, 1, '#1a1a1e'); R(ctx, x - 4, y - 9, 8, 5, col); legs('#8a8f9c'); R(ctx, x + d * 4, y - 14, 2, 10, '#e8e6e0'); break;
    case 'soldier': R(ctx, x - 3, y - 14, 6, 4, col); R(ctx, x - 2, y - 11, 4, 3, '#e0a97f'); R(ctx, x - 3, y - 8, 6, 4, col); R(ctx, x + d * 3, y - 7, 5, 2, '#1a1a1e'); legs('#3a4a2a'); break;
    case 'astro': R(ctx, x - 3, y - 14, 6, 6, '#f4f2ec'); R(ctx, x - 2, y - 12, 4, 2, '#3fd0e0'); R(ctx, x - 3, y - 8, 6, 4, '#f4f2ec'); R(ctx, x - 1, y - 7, 2, 2, col); legs('#c8c8d0'); break;
    case 'bat': R(ctx, x - 3, y - 14, 6, 5, '#1a1a1e'); R(ctx, x - 4, y - 15, 1, 2, '#1a1a1e'); R(ctx, x + 3, y - 15, 1, 2, '#1a1a1e'); R(ctx, x - 1, y - 12, 3, 2, '#f6d7bf'); R(ctx, x - 3, y - 9, 6, 5, '#1a1a1e'); R(ctx, x - d * 6, y - 9, 4, 6, '#2a2a34'); legs('#1a1a1e'); break;
    case 'viking': R(ctx, x - 3, y - 15, 6, 3, '#8a8f9c'); R(ctx, x - 5, y - 16, 2, 3, '#e8e6e0'); R(ctx, x + 3, y - 16, 2, 3, '#e8e6e0'); R(ctx, x - 2, y - 12, 5, 3, '#f6d7bf'); R(ctx, x - 2, y - 9, 5, 2, '#c8a24a'); R(ctx, x - 4, y - 8, 8, 4, col); legs('#5a3d2b'); R(ctx, x + d * 4, y - 13, 2, 9, '#c8c8d0'); break;
    case 'car': R(ctx, x - 6, y - 6, 12, 5, col); R(ctx, x - 4, y - 9, 8, 3, '#7ab0e0'); R(ctx, x - 5, y - 1, 3, 1, '#1a1a1e'); R(ctx, x + 2, y - 1, 3, 1, '#1a1a1e'); break;
    default: R(ctx, x - 2, y - 14, 4, 4, '#f6d7bf'); R(ctx, x - 2, y - 14, 4, 1, '#3b2619'); R(ctx, x - 3, y - 10, 6, 6, col); R(ctx, x + d * 3, y - 9, 2, 3, col); legs('#2d3a5c');
  }
}

// fiende 8×8 med fötterna vid y
export function foe(ctx, kind, x, y, fr, col = '#c98a4a') {
  switch (kind) {
    case 'goomba': R(ctx, x, y - 8, 8, 6, col); R(ctx, x + 1, y - 6, 2, 2, '#f4f2ec'); R(ctx, x + 5, y - 6, 2, 2, '#f4f2ec'); R(ctx, x + 2, y - 5, 1, 1, '#1a1a1e'); R(ctx, x + 5, y - 5, 1, 1, '#1a1a1e'); R(ctx, x + fr, y - 2, 3, 2, '#1a1a1e'); R(ctx, x + 5 - fr, y - 2, 3, 2, '#1a1a1e'); break;
    case 'crab': R(ctx, x, y - 6, 8, 4, col); R(ctx, x - 2, y - 8 + fr, 2, 3, col); R(ctx, x + 8, y - 8 + (1 - fr), 2, 3, col); R(ctx, x + 1, y - 2, 2, 2, col); R(ctx, x + 5, y - 2, 2, 2, col); R(ctx, x + 2, y - 5, 1, 1, '#f4f2ec'); R(ctx, x + 5, y - 5, 1, 1, '#f4f2ec'); break;
    case 'barrel': R(ctx, x, y - 8, 8, 8, col); R(ctx, x, y - 6, 8, 1, '#5a3d2b'); R(ctx, x, y - 3, 8, 1, '#5a3d2b'); R(ctx, x + 1 + fr * 2, y - 7, 1, 6, '#e8c26a'); break;
    case 'snail': R(ctx, x, y - 4, 8, 4, col); R(ctx, x + 3, y - 8, 5, 5, '#e8c26a'); R(ctx, x + 4, y - 7, 2, 2, col); R(ctx, x, y - 6, 1, 2, col); break;
    case 'bat': R(ctx, x + 2, y - 7, 4, 4, col); R(ctx, x - 2, y - 8 + fr * 2, 4, 2, col); R(ctx, x + 6, y - 8 + fr * 2, 4, 2, col); R(ctx, x + 3, y - 6, 1, 1, '#e23b5a'); break;
    case 'robot': R(ctx, x + 1, y - 8, 6, 8, col); R(ctx, x + 2, y - 6, 4, 2, '#e23b5a'); R(ctx, x, y - 5 + fr, 1, 3, col); R(ctx, x + 7, y - 5 + (1 - fr), 1, 3, col); break;
    case 'zombie': R(ctx, x + 1, y - 8, 4, 3, '#8aa06a'); R(ctx, x, y - 5, 6, 3, col); R(ctx, x + 5, y - 6, 3, 1, '#8aa06a'); R(ctx, x, y - 2, 2, 2, '#3a3a44'); R(ctx, x + 3, y - 2, 2, 2 - fr, '#3a3a44'); break;
    case 'orc': R(ctx, x + 1, y - 8, 5, 3, '#3fb04a'); R(ctx, x, y - 5, 7, 3, col); R(ctx, x + 6, y - 7, 2, 4, '#8a8f9c'); R(ctx, x + 1, y - 2, 2, 2, '#3a3a44'); R(ctx, x + 4, y - 2, 2, 2, '#3a3a44'); break;
    case 'skull': R(ctx, x + 1, y - 8, 6, 5, '#f4f2ec'); R(ctx, x + 2, y - 7, 1, 2, '#1a1a1e'); R(ctx, x + 5, y - 7, 1, 2, '#1a1a1e'); R(ctx, x + 2, y - 3, 4, 3, '#f4f2ec'); break;
    case 'slime': R(ctx, x, y - 5 + fr, 8, 5 - fr, col); R(ctx, x + 2, y - 3, 1, 1, '#1a1a1e'); R(ctx, x + 5, y - 3, 1, 1, '#1a1a1e'); break;
    case 'croc': R(ctx, x - 2, y - 4, 12, 3, '#2f8f46'); R(ctx, x + 8, y - 6 + fr, 4, 2, '#2f8f46'); R(ctx, x + 9, y - 5, 1, 1, '#f0e030'); R(ctx, x - 1, y - 1, 2, 1, '#2f8f46'); break;
    case 'drone': R(ctx, x + 1, y - 7, 6, 3, col); R(ctx, x, y - 8 + fr, 8, 1, '#8a8f9c'); R(ctx, x + 3, y - 4, 2, 2, '#e23b5a'); break;
    case 'ghost': R(ctx, x, y - 6, 8, 5, col); R(ctx, x + 1, y - 8, 6, 2, col); R(ctx, x, y - 1, 2, 1, col); R(ctx, x + 3, y - 1, 2, 1, col); R(ctx, x + 6, y - 1, 2, 1, col); R(ctx, x + 1, y - 5, 2, 2, '#f4f2ec'); R(ctx, x + 5, y - 5, 2, 2, '#f4f2ec'); break;
    case 'soldier': R(ctx, x + 2, y - 8, 4, 3, col); R(ctx, x + 2, y - 6, 4, 1, '#e0a97f'); R(ctx, x + 1, y - 5, 6, 3, col); R(ctx, x + 6, y - 4, 3, 1, '#1a1a1e'); R(ctx, x + 1, y - 2, 2, 2, '#3a4a2a'); R(ctx, x + 4, y - 2 + fr, 2, 2 - fr, '#3a4a2a'); break;
    case 'thug': R(ctx, x + 2, y - 8, 4, 3, '#e0a97f'); R(ctx, x + 2, y - 8, 4, 1, '#1a1a1e'); R(ctx, x, y - 5, 8, 4, col); R(ctx, x + 1, y - 1, 2, 1, '#1a1a1e'); R(ctx, x + 5, y - 1 + fr, 2, 1, '#1a1a1e'); break;
    case 'duck': R(ctx, x + 1, y - 6, 6, 4, col); R(ctx, x + 6, y - 8, 3, 3, '#3fb04a'); R(ctx, x + 8, y - 7, 2, 1, '#f0e030'); R(ctx, x - 2 + fr * 2, y - 8 + fr * 3, 5, 2, col); break;
    case 'squid': R(ctx, x + 1, y - 8, 6, 5, col); R(ctx, x, y - 3, 2, 3, col); R(ctx, x + 3, y - 3 + fr, 2, 3 - fr, col); R(ctx, x + 6, y - 3, 2, 3, col); R(ctx, x + 2, y - 6, 1, 1, '#f4f2ec'); R(ctx, x + 5, y - 6, 1, 1, '#f4f2ec'); break;
    case 'creeper': R(ctx, x + 1, y - 8, 6, 8, col); R(ctx, x + 2, y - 7, 1, 2, '#1a1a1e'); R(ctx, x + 5, y - 7, 1, 2, '#1a1a1e'); R(ctx, x + 3, y - 5, 2, 3, '#1a1a1e'); R(ctx, x + 2, y - 3, 1, 1, '#1a1a1e'); R(ctx, x + 5, y - 3, 1, 1, '#1a1a1e'); break;
    default: R(ctx, x, y - 8, 8, 8, col); R(ctx, x + 1 + fr, y - 6, 2, 4, '#5a3d2b');
  }
}

// föremål 6×6 vid x, y (övre vänstra)
export function item(ctx, kind, x, y, t) {
  const sq = Math.floor(t * 6 + x) % 3;
  switch (kind) {
    case 'ring': R(ctx, x + sq, y, 6 - sq * 2, 6, '#f0e030'); if (sq === 0) R(ctx, x + 2, y + 2, 2, 2, '#1a1a1e'); break;
    case 'gem': R(ctx, x + 1, y, 4, 2, '#3fd0e0'); R(ctx, x, y + 2, 6, 2, '#3fd0e0'); R(ctx, x + 2, y + 4, 2, 2, '#3fd0e0'); R(ctx, x + 1, y + 1, 1, 1, '#f4f2ec'); break;
    case 'banana': R(ctx, x + 1, y, 2, 2, '#f0e030'); R(ctx, x + 2, y + 2, 3, 2, '#f0e030'); R(ctx, x + 4, y + 4, 2, 2, '#f0e030'); R(ctx, x + 1, y, 1, 1, '#5a3d2b'); break;
    case 'heart': R(ctx, x, y, 2, 2, '#e23b5a'); R(ctx, x + 4, y, 2, 2, '#e23b5a'); R(ctx, x, y + 2, 6, 2, '#e23b5a'); R(ctx, x + 1, y + 4, 4, 1, '#e23b5a'); R(ctx, x + 2, y + 5, 2, 1, '#e23b5a'); break;
    case 'star': R(ctx, x + 2, y, 2, 6, '#f0e030'); R(ctx, x, y + 2, 6, 2, '#f0e030'); R(ctx, x + 1, y + 1, 4, 4, '#f0e030'); break;
    case 'bolt': R(ctx, x + 3, y, 2, 3, '#f0e030'); R(ctx, x + 1, y + 3, 2, 3, '#f0e030'); R(ctx, x + 2, y + 2, 3, 1, '#f0e030'); break;
    case 'fruit': R(ctx, x + 1, y + 1, 4, 5, '#e23b5a'); R(ctx, x + 3, y, 1, 2, '#3fb04a'); break;
    case 'gold': R(ctx, x, y + 2, 6, 4, '#f0e030'); R(ctx, x + 1, y + 1, 4, 1, '#f0e030'); R(ctx, x + 1, y + 3, 2, 1, '#f4f2ec'); break;
    default: R(ctx, x + sq, y, 6 - sq * 2, 6, '#f0e030'); if (sq === 0) R(ctx, x + 2, y + 1, 2, 4, '#c8a24a');
  }
}
