// Epoken bestämmer hur restaurangen och köket ser ut: färger på väggar, golv, disk och neon,
// bord/stolar/lampor i matsalen och stilen på köksutrustningen. Ingen DOM här – används av
// golvet (floor-art.js), köket (rig.js/art.js) och 3D-rummet.
export const ERA_LOOK = [
  { from: 1955, name: 'diner', wall: '#5fbcbc', wallDark: '#c93a3a', floorA: '#f2efe6', floorB: '#2a2a30', counter: '#d8323a', neon: '#ff6f9c', table: 0xf4f1ea, edge: 0xc8ccd6, chair: 0xd8323a, chairHi: 0xf06a70, lamp: 'cone', board: 'felt', steel: 0xd8dce2, trim: 0xc92a2a, kitchen: 'Diner-köket: krom, gjutjärnshäll och en milkshakemixer.' },
  { from: 1965, name: 'sixties', wall: '#e8c060', wallDark: '#8a5a2a', floorA: '#efe4c8', floorB: '#3a2a20', counter: '#c94a3a', neon: '#ffb347', table: 0xf0d060, edge: 0xc8a030, chair: 0xe87a2a, chairHi: 0xf8a860, lamp: 'globe', board: 'felt', steel: 0xd0d4da, trim: 0xe87a2a, kitchen: 'Sextiotalsköket: emalj, gul formica och frityrkorgar i ståltråd.' },
  { from: 1975, name: 'seventies', wall: '#c08040', wallDark: '#5a3a20', floorA: '#d8c8a0', floorB: '#8a6a40', counter: '#8a4a2a', neon: '#ff9a3a', table: 0xa87848, edge: 0x6a4a28, chair: 0x8a5a2a, chairHi: 0xc08a50, lamp: 'orange', board: 'felt', steel: 0xb8bcc2, trim: 0xa8602a, kitchen: 'Grillkiosken: brun plåt, orange detaljer och en gasolgrill.' },
  { from: 1985, name: 'eighties', wall: '#f0a8c8', wallDark: '#2a2a30', floorA: '#f4f1ea', floorB: '#2a2a30', counter: '#3ac8c8', neon: '#ff3a8a', table: 0xf8c8e0, edge: 0x2a2a30, chair: 0x2ab8b8, chairHi: 0x7ae0e0, lamp: 'tube', board: 'lit', steel: 0xc8ccd6, trim: 0x2ab8b8, kitchen: 'Åttiotalsköket: rostfritt med turkosa detaljer och lysrör.' },
  { from: 1996, name: 'chain', wall: '#f5e6c8', wallDark: '#c92a2a', floorA: '#e8e4dc', floorB: '#c8c4bc', counter: '#c92a2a', neon: '#ffd23a', table: 0xf5c542, edge: 0xc92a2a, chair: 0xc92a2a, chairHi: 0xe86a60, lamp: 'tube', board: 'lit', steel: 0xc8ccd6, trim: 0xc92a2a, kitchen: 'Kedjeköket: rostfritt, klamgrill, fritösbatteri och värmelampor.' },
  { from: 2005, name: 'fresh', wall: '#cfe0b0', wallDark: '#5a7a3a', floorA: '#e8e0c8', floorB: '#c8b890', counter: '#6a8a3a', neon: '#8ad04a', table: 0xd8b880, edge: 0xa88850, chair: 0x5a9a3a, chairHi: 0x8ac860, lamp: 'pendant', board: 'lit', steel: 0xc8ccd6, trim: 0x5a9a3a, kitchen: 'Öppet kök bakom glas – rostfritt och gröna detaljer.' },
  { from: 2016, name: 'industrial', wall: '#9a5a48', wallDark: '#3a3a40', floorA: '#8e8e8e', floorB: '#7c7c7c', counter: '#3a3a40', neon: '#ffd08a', table: 0x5a3a26, edge: 0x3a2618, chair: 0x2a2a30, chairHi: 0x5a5a60, lamp: 'edison', board: 'chalk', steel: 0x3a3a40, trim: 0xd8a050, kitchen: 'Gourmetköket: svart stål, gjutjärn och mässing.' },
  { from: 2022, name: 'nordic', wall: '#dfe8d8', wallDark: '#a8c0a0', floorA: '#efe9e0', floorB: '#d8d0c4', counter: '#e8e4dc', neon: '#7ee8a0', table: 0xe8d0a8, edge: 0xc8a878, chair: 0x8ad0b0, chairHi: 0xb8ecd0, lamp: 'led', board: 'digital', steel: 0xe0e4e8, trim: 0x8ad0b0, kitchen: 'Det nya köket: vitt, ljust trä, digitala orderskärmar.' },
];
export const eraLook = (year) => [...ERA_LOOK].reverse().find((e) => year >= e.from) || ERA_LOOK[0];
export function themeFor(year) {
  const e = eraLook(year);
  return { wall: e.wall, wallDark: e.wallDark, floorA: e.floorA, floorB: e.floorB, counter: e.counter, neon: e.neon, workshopSign: 'KÖKET', era: e.name };
}
