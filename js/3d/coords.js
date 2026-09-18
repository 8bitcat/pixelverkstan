// Från butiksgolvets logiska pixlar (512×480, y = fötter) till meter i 3D-rummet.
// x: 1 px = 2 cm, mitten av bilden = x 0. z: 0 vid framväggen (fönstren), växer inåt i rummet.
// Området framför/bakom disken (y 86–150) är trångt i 2D och sträcks ut (3 cm/px) så att
// disken, skåpet och expediten får plats – därefter 2 cm/px. Allt är monotont, så
// simuleringens positioner (kö, väntplatser, hyllor) hamnar konsekvent i 3D.
import * as LY from '../core/floor-layout.js';

export const S = 0.02, S2 = 0.03;
export const ZC = (LY.COUNTER.base - LY.WALL_Y) * S2;   // z vid diskens framkant (1.92)
export const toX = (px) => (px - LY.FW / 2) * S;
export const toZ = (py) => (py < LY.COUNTER.base ? (py - LY.WALL_Y) * S2 : ZC + (py - LY.COUNTER.base) * S);
export const fromX = (x) => x / S + LY.FW / 2;
export const fromZ = (z) => (z < ZC ? LY.WALL_Y + z / S2 : LY.COUNTER.base + (z - ZC) / S);
// rummet är en meter djupare i 3D än 2D-golvet: en gång längs bakväggen bakom montrarna
export const ROOM = { W: LY.FW * S, D: toZ(LY.FH) + 1.0, H: 3.1, X0: toX(0), X1: toX(LY.FW) };
// avatarerna tittar i +z när rotation.y = 0
export const yawOf = (dir) => ({ up: Math.PI, down: 0, left: -Math.PI / 2, right: Math.PI / 2 })[dir] ?? 0;
// [x0, y0, x1, y1] i pixlar → { x, z, w, d } (mitt + mått) i meter
export function rect(r) {
  const x0 = toX(r[0]), x1 = toX(r[2]), z0 = toZ(r[1]), z1 = toZ(r[3]);
  return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, x0, x1, z0, z1 };
}
