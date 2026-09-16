// Byggvyns geometri i världsenheter (u åt höger-ned, v åt vänster-ned, z uppåt).
// Chassit ligger ner på arbetsbänken; moderkortet ligger i chassits botten.

export const VIEW = { w: 400, h: 236, k: 8, hz: 6.5, ox: 176, oy: 38 };

export const G = {
  mat:   { u0: -1, u1: 26.5, v0: -1, v1: 21, z: 0 },
  case:  { u0: 0, u1: 26, v0: 0, v1: 20, z0: 0, z1: 0.5, wall: 4.5 },
  board: { u0: 1.5, u1ATX: 17.5, u1mATX: 14.5, v0: 1.5, v1: 17, z0: 0.5, z1: 0.8 },
  socket: { u0: 5, u1: 8.6, v0: 3.8, v1: 7.4 },            // CPU-sockel
  cpu:    { cu: 6.8, cv: 5.6 },
  ramSlots: [10.2, 10.9, 11.6, 12.3],                      // u-position per RAM-slot
  ramV: [3, 9.6],
  m2:    { u0: 3.5, u1: 8.5, v0: 9.4, v1: 10.4 },
  pcie:  { u0: 3, u1: 13, v0: 14.2, v1: 14.8 },
  gpu:   { u0: 2.6, v0: 13.8, v1: 15.4 },
  atx24: { u0: 13.6, u1: 14.2, v0: 3.5, v1: 7 },
  eps8:  { u0: 3.2, u1: 4.4, v0: 1.7, v1: 2.5 },
  psu:   { u0: 18.5, u1: 25.5, v0: 12.5, v1: 19.5 },
  bay:   { u0: 19, u1: 25, v0: 2, v1: 9 },
};

export const BOARD_TOP = G.board.z1;
