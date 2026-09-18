// Grossister och märkesprogram. Grossisten avgör pris, leveranstid, månadsavgift och risk för
// en trasig del i lådan; ett märkesprogram kräver ett märkesbås (nivå 2+) och ger rabatt på
// märkets delar plus en skylt som drar kunder – mot en avgift i månaden. Ingen DOM här.
// Avgifter i grundårets kronor (räknas upp med prisindex), time = faktor på leveranstiden.
export const SUPPLIERS = [
  { id: 'lokal', name: 'Datagrossisten AB', icon: '🏭', year: 1983, disc: 0, time: 1, fee: 0, risk: 0, desc: 'Lagret i stan. Lådan står vid dörren på nolltid. Inga rabatter.' },
  { id: 'import', name: 'Fjärran Östern Import', icon: '🚢', year: 1988, disc: 0.12, time: 2.5, fee: 0, risk: 0.07, desc: 'Billigt – men lådan tar lång tid, och ibland är något trasigt i den.' },
  { id: 'kedja', name: 'Nordisk Datalogistik', icon: '🚚', year: 1995, disc: 0.07, time: 1.4, fee: 800, risk: 0.01, desc: 'Stora volymer, rabatt på allt, månadsavgift för kontot.' },
  { id: 'nat', name: 'Grossist.se', icon: '💻', year: 2001, disc: 0.1, time: 1, fee: 600, risk: 0.02, desc: 'Beställ på nätet, leverans i morgon. Kontoavgift varje månad.' },
];
export const SUPPLIER = Object.fromEntries(SUPPLIERS.map((s) => [s.id, s]));
export const suppliersFor = (year) => SUPPLIERS.filter((s) => s.year <= year);

export const PARTNERS = [
  { brand: 'intel', name: 'Intel Channel Partner', icon: '🔵', year: 1994, until: 2026, disc: 0.12, fee: 1200, drag: 1, desc: 'Skylten "Intel Inside" i fönstret och rabatt på Intel-delar.' },
  { brand: 'ati', name: 'ATI Certified Reseller', icon: '🟥', year: 1996, until: 2012, disc: 0.15, fee: 1000, drag: 1, desc: 'Rabatt på ATI-kort och demoskivor till montern.' },
  { brand: '3dfx', name: '3dfx Voodoo Partner', icon: '🟧', year: 1998, until: 2001, disc: 0.2, fee: 900, drag: 1, desc: 'Störst rabatt av alla – så länge 3dfx finns kvar.' },
  { brand: 'nvidia', name: 'NVIDIA Partner Program', icon: '🟩', year: 1999, until: 2026, disc: 0.15, fee: 1200, drag: 1, desc: 'Grön skylt, förtur på nya kort och rabatt på hela sortimentet.' },
  { brand: 'amd', name: 'AMD Elite Partner', icon: '🔴', year: 2004, until: 2026, disc: 0.15, fee: 1000, drag: 1, desc: 'Rabatt på både Ryzen/Athlon och Radeon.' },
];
export const PARTNER = Object.fromEntries(PARTNERS.map((p) => [p.brand, p]));
export const partnersFor = (year) => PARTNERS.filter((p) => p.year <= year && p.until >= year);
// kravet: ett märkesbås av märket, nivå 2 eller högre
export const hasBooth = (fit, brand) => (fit?.slots || []).some((s) => s && s.kind === 'brand' && s.brand === brand && s.level >= 2);
