// Planlösning per lokal: vilka platser som finns (kanoniska index 0–10 med fast storlek, så att
// inredningen följer med när man byter lokal), var de står, möbler, avspärrade delar av rummet
// och hyllornas stil. Ingen DOM här (tools/lokaler.mjs och floor2nav.mjs kör i Node).
export const SLOT_SIZES = ['wide', 'medium', 'medium', 'medium', 'wide', 'small', 'wide', 'small', 'small', 'small', 'wide'];
export const MAX_SLOTS = SLOT_SIZES.length;
const S = (i, x0, x1, base) => ({ i, x0, x1, base, size: SLOT_SIZES[i] });
const LEFT = [S(0, 14, 170, 162), S(1, 14, 132, 258), S(2, 14, 132, 354), S(3, 14, 132, 450)];
const BOTTOM = [S(4, 148, 280, 450), S(5, 296, 348, 450), S(6, 358, 500, 450)];
const SOFA = { x0: 356, x1: 452, base: 306 }, ARMCHAIR = { x0: 462, x1: 496, base: 306 }, TABLE = { x0: 388, x1: 444, base: 348 };
const PLANTS = [[268, 106], [496, 474]], EXTRA = [[140, 474], [290, 474]];
const STAND = { kind: 'stand', x0: 300, y0: 350, x1: 314, y1: 362 };

export const PLANS = {
  // Källarhålan: vänstra delen är förråd bakom en plywoodvägg – bara högra halvan är butik
  1: { name: 'Källarhålan', style: 'wood', partition: 176, blocked: [[0, 86, 176, 480]], junk: true,
    slots: [S(0, 182, 282, 250), S(1, 182, 282, 350), S(2, 182, 282, 450), S(5, 296, 348, 450), S(6, 358, 500, 450)],
    plants: [], props: [{ kind: 'crates', x0: 468, y0: 282, x1: 502, y1: 306 }, { kind: 'barrel', x0: 470, y0: 222, x1: 490, y1: 240 }] },
  // Gatuplan: hela rummet, enkla plåthyllor, en träbänk i stället för soffa
  2: { name: 'Gatuplan', style: 'metal', slots: [...LEFT, ...BOTTOM], bench: SOFA, plants: PLANTS, props: [{ kind: 'bin', x0: 470, y0: 292, x1: 486, y1: 306 }] },
  // Kvartersbutiken: glasmontrar, stjärnobjektet, soffgrupp
  3: { name: 'Kvartersbutiken', style: 'glass', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254)], hero: { cx: 214, base: 318 }, sofa: SOFA, armchair: ARMCHAIR, table: TABLE, plants: PLANTS, extraPlants: EXTRA },
  // Hörnbutiken: ett torn till vid soffan
  4: { name: 'Hörnbutiken', style: 'glass', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254), S(8, 356, 396, 254)], hero: { cx: 214, base: 318 }, sofa: SOFA, armchair: ARMCHAIR, table: TABLE, plants: PLANTS, extraPlants: EXTRA },
  // Datorhuset: LED-montrar, ännu ett torn, en skylt på golvet
  5: { name: 'Datorhuset', style: 'led', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254), S(8, 356, 396, 254), S(9, 466, 506, 380)], hero: { cx: 214, base: 318 }, sofa: SOFA, armchair: ARMCHAIR, table: TABLE, plants: PLANTS, extraPlants: EXTRA, props: [STAND] },
  // Megastore: en ö-monter mitt i rummet, stjärnobjektet lite längre fram
  6: { name: 'Megastore', style: 'led', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254), S(8, 356, 396, 254), S(9, 466, 506, 380), S(10, 148, 280, 236)], hero: { cx: 214, base: 330 }, sofa: SOFA, armchair: ARMCHAIR, table: TABLE, plants: PLANTS, extraPlants: EXTRA, props: [STAND] },
};
export const planFor = (lokal) => PLANS[lokal] || PLANS[3];
export const openIndices = (lokal) => planFor(lokal).slots.map((s) => s.i);
