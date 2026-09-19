// Det som säljs över disk utan att byggas: drycker och efterrätter. hype = [lansering, topp,
// utfasning] – kunderna frågar efter det som är hett just nu. Ingen DOM här.
import { DB, PRODUCT_CATS, onSale } from './menu.js';

export { PRODUCT_CATS };
export const isProduct = (p) => !!p && PRODUCT_CATS.includes(p.cat);
export const PRODUCTS = DB.parts.filter(isProduct);

// hur het en produkt är ett visst år: 0–1
export function hypeAt(p, year) {
  const [y0, peak, y1] = p.hype || [p.year, p.year + 3, p.until || 2026];
  if (year < y0) return 0;
  if (year <= peak) return 0.55 + 0.45 * (year - y0) / Math.max(1, peak - y0);
  if (year <= y1) return 1 - 0.4 * (year - peak) / Math.max(1, y1 - peak);
  return Math.max(0.1, 0.6 - 0.1 * (year - y1));
}
// mat tappar inte värde med åren (inköpspriset följer prisindex i stället)
export const valueAt = () => 1;

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
// En kund som bara vill ha något att dricka eller en efterrätt
export function productOrder(game, names) {
  const year = game.year;
  const shown = (p) => (game.shownFree ? game.shownFree(p.id) : 0) > 0;
  const list = onSale(year).filter((p) => isProduct(p) && (!game.canSell || game.canSell(p)));
  if (!list.length) return null;
  const weight = (p) => hypeAt(p, year) * (shown(p) ? 3 : 0.6);
  let r = Math.random() * list.reduce((s, p) => s + weight(p), 0), p = list[list.length - 1];
  for (const q of list) { r -= weight(q); if (r <= 0) { p = q; break; } }
  const msg = p.cat === 'dessert'
    ? rnd([`Bara en ${p.name.toLowerCase()}, tack!`, `Jag är sugen på något sött – har ni ${p.name.toLowerCase()}?`, `${p.name}! Får jag en?`])
    : rnd([`En ${p.name.toLowerCase()}, tack.`, `Jag är törstig – en ${p.name.toLowerCase()}!`, `Kan jag få en ${p.name.toLowerCase()} att ta med?`]);
  return { template: 'produkt', title: p.name, name: rnd(names), msg, items: [{ cat: p.cat, part: p.id }], year, product: p.id };
}
