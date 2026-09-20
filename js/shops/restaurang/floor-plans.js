// Hamburgerbarens planlösningar: samma kanoniska platser (montrar/automater) som datorbutiken
// på vänsterväggen och längst ner, men i stället för stjärnmonter och soffgrupp står det matbord
// med stolar (eller sittbås) där kunderna sätter sig och äter. Ingen DOM här.
import { SLOT_SIZES } from '../../core/floor-plans.js';

const S = (i, x0, x1, base) => ({ i, x0, x1, base, size: SLOT_SIZES[i] });
const LEFT = [S(0, 14, 170, 162), S(1, 14, 132, 258), S(2, 14, 132, 354), S(3, 14, 132, 450)];
const BOTTOM = [S(4, 148, 280, 450), S(5, 296, 348, 450), S(6, 358, 500, 450)];
const PLANTS = [[268, 106], [496, 474]], EXTRA = [[140, 474], [290, 474]];
// bord: x0..x1 = bordsskivan, base = framkantens fot; två stolar bakom bordet (kunderna sitter vända mot rummet)
const T = (x0, base, booth = false) => ({ x0, x1: x0 + 44, base, booth });

export const PLANS = {
  // Gatuköket i källaren: förråd bakom plywoodväggen, två bord i högra delen
  1: { name: 'Gatuköket', style: 'wood', partition: 176, blocked: [[0, 86, 176, 480]], junk: true,
    slots: [S(0, 182, 282, 250), S(1, 182, 282, 350), S(5, 296, 348, 450), S(6, 358, 500, 450)],
    tables: [T(362, 300), T(362, 380)], plants: [], props: [{ kind: 'crates', x0: 468, y0: 222, x1: 502, y1: 246 }] },
  // Gatuköket renoverat: hela rummet, fyra bord
  2: { name: 'Gatuköket', style: 'metal', slots: [...LEFT, ...BOTTOM], tables: [T(176, 262), T(176, 340), T(360, 300), T(360, 380)], plants: PLANTS, props: [{ kind: 'bin', x0: 470, y0: 292, x1: 486, y1: 306 }] },
  // Kvartersbaren: sex bord
  3: { name: 'Kvartersbaren', style: 'glass', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254)], tables: [T(176, 262), T(176, 340), T(240, 262), T(240, 340), T(360, 300), T(360, 380)], plants: PLANTS, extraPlants: EXTRA },
  // Hörnrestaurangen: sittbås längs högerväggen
  4: { name: 'Hörnrestaurangen', style: 'glass', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254), S(8, 356, 396, 254)], tables: [T(176, 262), T(176, 340), T(240, 262), T(240, 340), T(360, 320, true), T(360, 400, true), T(424, 320, true), T(424, 400, true)], plants: PLANTS, extraPlants: EXTRA },
  // Burgarpalatset
  5: { name: 'Burgarpalatset', style: 'led', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254), S(8, 356, 396, 254), S(9, 466, 506, 380)], tables: [T(176, 262), T(176, 340), T(240, 262), T(240, 340), T(176, 418), T(240, 418), T(360, 320, true), T(360, 400, true)], plants: PLANTS, extraPlants: EXTRA },
  // Megaburger: ö-monter mitt i rummet och bord runt om
  6: { name: 'Megaburger', style: 'led', slots: [...LEFT, ...BOTTOM, S(7, 466, 506, 254), S(8, 356, 396, 254), S(9, 466, 506, 380), S(10, 148, 280, 236)], tables: [T(176, 300), T(240, 300), T(176, 378), T(240, 378), T(360, 320, true), T(360, 400, true), T(424, 320, true)], plants: PLANTS, extraPlants: EXTRA },
};
// luckan (utlämning) ovanpå kyldisken till vänster, kassan till höger – i alla lokaler
for (const p of Object.values(PLANS)) p.pickupLeft = true;
export const planFor = (lokal) => PLANS[lokal] || PLANS[3];
