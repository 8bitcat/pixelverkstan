// Byggvyns geometri i världsenheter. Chassit ligger på höger sida på bänken:
// u = bak (0) → fram (26), v = tak (0) → botten (24), z = uppåt mot betraktaren.
// Nätagg och hårddisk bor i "källaren" längst ner (v > 18), som i riktiga chassin.

// Upplösning: 16 px per enhet (dubbelt så detaljerat som från början)
export const VIEW = { w: 872, h: 504, k: 16, hz: 13, ox: 424, oy: 80 };

export const G = {
  mat:   { u0: -1, u1: 26.5, v0: -1, v1: 25 },
  case:  { u0: 0, u1: 26, v0: 0, v1: 24, z0: 0, z1: 0.5, wall: 5 },
  board: { u0: 1.5, u1ATX: 17.5, u1mATX: 14.5, v0: 1.5, v1: 17, z0: 0.5, z1: 0.8 },
  socket: { u0: 5, u1: 8.6, v0: 3.8, v1: 7.4 },
  cpu:    { cu: 6.8, cv: 5.6 },
  lever:  { u0: 8.75, u1: 8.95, v0: 3.8, v1: 7.4 },
  ramSlots: [10.2, 10.9, 11.6, 12.3],
  ramV: [3, 9.6],
  m2:    { u0: 3.5, u1: 8.5, v0: 9.4, v1: 10.4 },
  pcie:  { u0: 3, u1: 13, v0: 14.2, v1: 14.8 },
  gpu:   { u0: 1.0, v0: 13.8, v1: 15.4, z0: 1.15, z1: 3.9 },
  psu:   { u0: 0.8, u1: 7.8, v0: 18.3, v1: 23.3, z0: 0.5, z1: 3.4 },
  bay:   { u0: 16.5, u1: 25, v0: 18.3, v1: 23.3 },
  shroud: { v0: 17.7, v1: 18.1 },
};

export const BOARD_TOP = G.board.z1;
export const GPU_LEN = [6.5, 9.5, 12.5];

// Fläktplatser: fram (på insidan av fronten), bak och tak
export const FAN_SLOTS = {
  front1: { u0: 24.2, u1: 25.4, v0: 1.6, v1: 6.4, face: 'right' },
  front2: { u0: 24.2, u1: 25.4, v0: 7.1, v1: 11.9, face: 'right' },
  front3: { u0: 24.2, u1: 25.4, v0: 12.6, v1: 17.4, face: 'right' },
  rear:   { u0: 0.5, u1: 1.45, v0: 7.6, v1: 12.4, face: 'right' },
  top1:   { u0: 5.4, u1: 10.2, v0: 0.5, v1: 1.5, face: 'left' },
  top2:   { u0: 11.0, u1: 15.8, v0: 0.5, v1: 1.5, face: 'left' },
  top3:   { u0: 16.6, u1: 21.4, v0: 0.5, v1: 1.5, face: 'left' },
};

// Uttag på moderkort och delar. type = kontaktform. box = utritad kontakt (u0,u1,v0,v1,höjd)
export const PORTS = {
  ATX_24PIN: { type: 'atx24', owner: 'mb', label: 'ATX 24-pin', box: [13.6, 14.2, 3.5, 7, 0.5] },
  CPU_PWR:   { type: 'eps8', owner: 'mb', label: 'CPU_PWR', box: [3.2, 4.4, 1.7, 2.5, 0.45] },
  CPU_FAN:   { type: 'fan4', owner: 'mb', label: 'CPU_FAN', box: [9.4, 10.0, 2.05, 2.35, 0.3] },
  SYS_FAN1:  { type: 'fan4', owner: 'mb', label: 'SYS_FAN1', box: [1.65, 1.95, 8.0, 8.6, 0.3] },
  SYS_FAN2:  { type: 'fan4', owner: 'mb', label: 'SYS_FAN2', box: [10.6, 11.2, 16.25, 16.55, 0.3] },
  ARGB_1:    { type: 'argb', owner: 'mb', label: 'ARGB_1', box: [9.3, 9.75, 16.25, 16.55, 0.3] },
  ARGB_2:    { type: 'argb', owner: 'mb', label: 'ARGB_2', box: [13.7, 14.0, 8.05, 8.5, 0.3] },
  ARGB_3:    { type: 'argb', owner: 'mb', label: 'ARGB_3', box: [13.7, 14.0, 7.35, 7.8, 0.3] },
  F_PANEL:   { type: 'fpanel', owner: 'mb', label: 'F_PANEL', box: [11.9, 13.2, 16.1, 16.7, 0.3] },
  USB3_FRONT: { type: 'usb3', owner: 'mb', label: 'USB 3.0', box: [13.55, 14.15, 9.5, 11.0, 0.45] },
  HD_AUDIO:  { type: 'audio', owner: 'mb', label: 'HD_AUDIO', box: [2.1, 3.1, 16.1, 16.7, 0.35] },
  SATA_1:    { type: 'satad', owner: 'mb', label: 'SATA 1', box: [13.4, 14.2, 11.3, 12.1, 0.35] },
  SATA_2:    { type: 'satad', owner: 'mb', label: 'SATA 2', box: [13.4, 14.2, 12.1, 12.9, 0.35] },
  GPU_PWR:   { type: 'gpu', owner: 'gpu', label: 'GPU-ström' },
  DRIVE_DATA: { type: 'satad', owner: 'bay', label: 'SATA-data' },
  DRIVE_PWR: { type: 'satap', owner: 'bay', label: 'SATA-ström' },
};

// Skruvhål (u, v, z)
export const SCREWS = {
  mb: [[2.5, 2.5], [2.5, 9], [2.5, 16], [13.8, 2.5], [13.8, 9], [13.8, 16]].map(([u, v]) => [u, v, 0.82]),
  m2: [[3.62, 9.9, 0.95]],
  gpu: [[0.45, 14.6, 4.62]],
  psu: [[0.52, 19.2, 4.3], [0.52, 22.4, 4.3]],
};

// Enhetens (hårddiskens) mått + var uttagen sitter
export function driveBox(p) {
  const b = G.bay, cu = (b.u0 + b.u1) / 2, cv = (b.v0 + b.v1) / 2;
  const [U, V, Z] = p.kind === 'hdd' ? [5.8, 4.2, 1.1] : [3.9, 2.8, 0.4];
  return { u0: cu - U / 2, u1: cu + U / 2, v0: cv - V / 2, v1: cv + V / 2, z0: G.case.z1 + 0.05, z1: G.case.z1 + 0.05 + Z };
}
