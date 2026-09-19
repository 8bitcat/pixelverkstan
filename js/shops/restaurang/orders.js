// Kundernas beställningar: menyer genom epokerna (1955–2026). Varje meny är ett recept – lager
// underifrån – och kunden vill ha exakt de ingredienserna i den ordningen, helst av det som
// finns i kylen. Brödet läggs alltid underst och överst. Ingen DOM här.
import { DB, onSale, retail, CAT_ORDER, BURGER_CATS, PRODUCT_CATS, layerHeight } from './menu.js';
import { productOrder, isProduct } from './products.js';
import { priceIndex } from './upgrades.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const cheapest = (a) => [...a].sort((x, y) => x.cost - y.cost)[0];
const kind = (...k) => (p) => k.includes(p.look?.kind);
const ids = (...i) => (p) => i.includes(p.id);
const not = (...i) => (p) => !i.includes(p.id);
const melt = (p) => p.look?.melt;

// recipe: [{ cat, pick?, p? }] underifrån (utan bröd). sides: sannolikhet för tillbehör/dryck.
// bread: vilka bröd som duger (annars "vanliga" bröd: inte mini, platt eller salladsblad).
const T = [];
const menu = (id, name, years, tier, recipe, o = {}) => T.push({ id, name, years, tier, recipe: recipe.map((r) => (typeof r === 'string' ? { cat: r } : r)), fee: o.fee ?? 20, xp: o.xp ?? 10, msgs: o.msgs || [`Jag tar en ${name.toLowerCase()}, tack!`], sides: o.sides || { tillbehor: 0.5, dryck: 0.6 }, bread: o.bread || null, mini: !!o.mini });
const L = (cat, pick, p) => ({ cat, pick, p });

// ---- 50- och 60-tal: dinern ----
menu('klassiker', 'Klassisk hamburgare', [1955, 2026], [1, 2], [L('biff', kind('not')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat'), 0.8), L('sas', ids('ketchup', 'dressing', 'majonnas'))],
  { fee: 18, xp: 8, msgs: ['En vanlig hamburgare, tack – som förr i tiden.', 'Bara en hamburgare med sallad och tomat.', 'Kan jag få en enkel burgare?'] });
menu('cheese', 'Cheeseburgare', [1955, 2026], [1, 2], [L('biff', kind('not')), L('ost', melt), L('gront', ids('saltgurka')), L('gront', ids('lok', 'rodlok'), 0.7), L('sas', ids('ketchup', 'senap', 'dressing'))],
  { fee: 20, xp: 10, msgs: ['En cheeseburgare med gurka och lök!', 'Cheeseburgare, tack. Extra smält ost om det går.'] });
menu('dubbel-cheese', 'Dubbel cheeseburgare', [1962, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('biff', kind('not')), L('ost', melt), L('gront', ids('saltgurka')), L('sas', ids('dressing', 'ketchup'))],
  { fee: 26, xp: 14, msgs: ['Två biffar, två ostar. Jag är hungrig!', 'Dubbel cheese – det är lördag.'] });
menu('bacon', 'Baconburgare', [1963, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('extra', ids('bacon')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat'), 0.7), L('sas', ids('bbq', 'dressing', 'majonnas'))],
  { fee: 26, xp: 14, msgs: ['Bacon! Mycket bacon.', 'En baconburgare med ost och bbq.'] });
menu('fisk', 'Fiskburgare', [1965, 2026], [2, 3], [L('biff', ids('biff-fisk')), L('ost', ids('ost-amerikansk', 'ost-cheddar'), 0.6), L('gront', ids('sallad', 'romansallad')), L('sas', ids('remoulad', 'dressing', 'majonnas'))],
  { fee: 22, xp: 12, msgs: ['Det är fredag – en fiskburgare!', 'Jag äter inte kött. Har ni fisk?'] });
menu('schweizer', 'Schweizerburgare', [1965, 2026], [2, 3], [L('biff', kind('not')), L('ost', ids('ost-schweizer')), L('extra', ids('champinjoner'), 0.8), L('gront', ids('lok')), L('sas', ids('majonnas', 'dressing'))],
  { fee: 24, xp: 12, msgs: ['Schweizerost och stekta champinjoner, tack.'] });

// ---- 70-tal: grillkiosken ----
menu('kiosk', 'Kioskburgare', [1975, 1998], [1, 2], [L('biff', ids('biff-korv', 'biff-90')), L('gront', ids('lok')), L('sas', ids('senap', 'ketchup'))],
  { fee: 14, xp: 6, msgs: ['En kioskburgare med lök och senap.', 'Något snabbt – jag ska hinna med bussen.'], sides: { tillbehor: 0.3, dryck: 0.7 } });
menu('flask', 'Fläskburgare', [1975, 2026], [2, 3], [L('biff', ids('biff-flask')), L('gront', ids('coleslaw', 'sallad')), L('gront', ids('gurka', 'saltgurka')), L('sas', ids('senap', 'bbq', 'honungssenap'))],
  { fee: 22, xp: 12, msgs: ['Fläskfärsbiff med coleslaw – som farsan gjorde.'] });
menu('frukost', 'Frukostburgaren', [1970, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('extra', ids('bacon')), L('extra', ids('stekt-agg')), L('sas', ids('ketchup', 'hotsauce', 'majonnas'))],
  { fee: 28, xp: 14, msgs: ['Frukost! Ägg, bacon och ost på biffen.', 'Jag missade frukosten – ge mig en med ägg.'] });
menu('barn', 'Barnmeny', [1978, 2026], [1, 1], [L('biff', ids('biff-90', 'biff-120', 'biff-smash')), L('ost', ids('ost-amerikansk', 'ost-cheddar', 'ost-gouda')), L('sas', ids('ketchup'))],
  { fee: 16, xp: 8, msgs: ['En barnmeny – bara ost och ketchup på!', 'Min unge vill ha en liten burgare med ketchup.'], sides: { tillbehor: 0.9, dryck: 0.9 } });

// ---- 80-tal ----
menu('hawaii', 'Hawaiiburgare', [1985, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('extra', ids('skinka')), L('extra', ids('ananas')), L('gront', ids('sallad')), L('sas', ids('dressing', 'majonnas', 'curry'))],
  { fee: 26, xp: 14, msgs: ['Hawaii! Ananas och skinka på burgaren.', 'Kan man verkligen ha ananas på en burgare? Jag vill prova!'] });
menu('kyckling', 'Kycklingburgare', [1985, 2026], [2, 3], [L('biff', ids('biff-kyckling')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat'), 0.7), L('sas', ids('majonnas', 'dressing', 'ranch'))],
  { fee: 22, xp: 12, msgs: ['En kycklingburgare, panerad.', 'Kyckling, tack – jag försöker äta mindre rött kött.'] });
menu('texas', 'Texas BBQ', [1985, 2026], [3, 4], [L('biff', ids('biff-150', 'biff-180', 'biff-angus')), L('ost', ids('ost-cheddar', 'ost-amerikansk')), L('extra', ids('bacon')), L('extra', ids('lokringar-topping', 'krispig-lok')), L('sas', ids('bbq'))],
  { fee: 32, xp: 18, msgs: ['Texas BBQ! Stor biff, bacon och lökringar.', 'Yeehaw – en Texas!'] });
menu('cordon', 'Cordon bleu-burgaren', [1985, 2026], [2, 3], [L('biff', ids('biff-kyckling', 'biff-kyckling-grill')), L('extra', ids('skinka')), L('ost', ids('ost-schweizer', 'ost-amerikansk', 'ost-gouda')), L('gront', ids('sallad')), L('sas', ids('majonnas', 'dressing'))],
  { fee: 26, xp: 14, msgs: ['Kyckling med skinka och ost – som cordon bleu!'] });
menu('curry', 'Curryburgaren', [1985, 2026], [2, 3], [L('biff', ids('biff-kyckling', 'biff-kyckling-grill', 'biff-kalkon')), L('gront', ids('sallad')), L('gront', ids('ananas'), 0), L('sas', ids('curry'))],
  { fee: 22, xp: 12, msgs: ['En kycklingburgare med currysås, tack.'] });

// ---- 90-tal: kedjan ----
menu('vego', 'Vegoburgare', [1990, 2026], [2, 3], [L('biff', ids('biff-vego', 'biff-soja', 'biff-falafel')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('gront', ids('lok', 'rodlok'), 0.6), L('sas', ids('aioli', 'dressing', 'majonnas', 'tzatziki'))],
  { fee: 24, xp: 12, msgs: ['Finns det något vegetariskt? En vegoburgare!', 'Jag är vegetarian – vad har ni?'] });
menu('trippel', 'Trippelburgare', [1990, 2026], [3, 4], [L('biff', kind('not')), L('ost', melt), L('biff', kind('not')), L('ost', melt), L('biff', kind('not')), L('ost', melt), L('gront', ids('saltgurka')), L('sas', ids('bbq', 'dressing'))],
  { fee: 36, xp: 20, msgs: ['TRE biffar. Tre ostar. Jag har tränat hela dagen.', 'Trippel! Jag är inte rädd.'] });
menu('chilicheese', 'Chili cheese-burgare', [1995, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-cheddar', 'ost-pepperjack', 'ost-amerikansk')), L('extra', ids('chili')), L('extra', ids('jalapeno'), 0.8), L('extra', ids('krispig-lok'), 0.6), L('sas', ids('bbq', 'chipotle', 'hotsauce'))],
  { fee: 30, xp: 16, msgs: ['Chili cheese! Så het den kan bli.', 'Chili på burgaren, tack – och jalapeños.'] });
menu('bearnaise', 'Bearnaiseburgaren', [1990, 2026], [2, 3], [L('biff', ids('biff-150', 'biff-180', 'biff-120')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('sas', ids('bearnaise'))],
  { fee: 26, xp: 14, msgs: ['Bearnaise på burgaren – så svenskt.', 'En stor biff med bea, tack!'] });
menu('grekisk', 'Grekiska burgaren', [1995, 2026], [2, 3], [L('biff', ids('biff-lamm', 'biff-flask', 'biff-90', 'biff-120')), L('gront', ids('gurka')), L('gront', ids('rodlok', 'lok')), L('gront', ids('tomat')), L('sas', ids('tzatziki'))],
  { fee: 26, xp: 14, msgs: ['Grekiska – med tzatziki och rödlök!'], bread: (p) => p.look?.flat || !p.look?.mini });
menu('pizza', 'Pizzaburgaren', [1998, 2026], [2, 3], [L('biff', kind('not')), L('ost', ids('ost-mozzarella', 'ost-amerikansk')), L('extra', ids('champinjoner')), L('extra', ids('skinka'), 0.7), L('sas', ids('ketchup', 'pesto'))],
  { fee: 26, xp: 14, msgs: ['Pizzaburgare! Mozzarella, champinjoner och skinka.'] });
menu('kyckling-grill', 'Grillad kycklingburgare', [1995, 2026], [2, 3], [L('biff', ids('biff-kyckling-grill')), L('gront', ids('romansallad', 'sallad')), L('gront', ids('tomat')), L('sas', ids('tzatziki', 'ranch', 'honungssenap'))],
  { fee: 24, xp: 12, msgs: ['Grillad kyckling – inte panerad.', 'Något lite lättare: grillad kycklingburgare.'] });
menu('lamm', 'Lammburgaren', [1998, 2026], [3, 4], [L('biff', ids('biff-lamm')), L('ost', ids('ost-getost', 'ost-schweizer', 'ost-brie'), 0.7), L('gront', ids('rodlok')), L('gront', ids('spenat', 'ruccola', 'sallad')), L('sas', ids('tzatziki', 'chimichurri', 'aioli'))],
  { fee: 32, xp: 18, msgs: ['Lammburgare med getost, tack.', 'Har ni lamm? Med tzatziki!'] });

// ---- 2000-tal ----
menu('falafel', 'Falafelburgare', [2000, 2026], [2, 3], [L('biff', ids('biff-falafel')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('gront', ids('gurka')), L('sas', ids('tzatziki', 'aioli', 'hotsauce'))],
  { fee: 22, xp: 12, msgs: ['Falafelburgare – vegansk om det går!'], bread: (p) => !p.look?.mini });
menu('kalkon', 'Kalkonburgaren', [2000, 2026], [2, 3], [L('biff', ids('biff-kalkon')), L('ost', ids('ost-cheddar', 'ost-gouda')), L('gront', ids('spenat', 'sallad', 'romansallad')), L('sas', ids('honungssenap', 'ranch', 'majonnas'))],
  { fee: 24, xp: 12, msgs: ['Kalkon i stället för nöt – magrare.'] });
menu('mexicana', 'Mexicana', [2005, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-pepperjack', 'ost-cheddar')), L('extra', ids('guacamole')), L('extra', ids('jalapeno')), L('gront', ids('tomat')), L('sas', ids('chipotle', 'hotsauce'))],
  { fee: 30, xp: 16, msgs: ['Mexicana! Guacamole, jalapeños och chipotle.', 'Något med guacamole, tack.'] });
menu('bla', 'Blue cheese-burgaren', [2005, 2026], [3, 4], [L('biff', ids('biff-angus', 'biff-150', 'biff-180', 'biff-chuck')), L('ost', ids('ost-bla')), L('gront', ids('karamelliserad-lok', 'lok')), L('gront', ids('ruccola', 'sallad')), L('sas', ids('majonnas', 'aioli'))],
  { fee: 32, xp: 18, msgs: ['Blåmögelost på en stor biff – vuxenburgaren.', 'Blue cheese, tack. Och karamelliserad lök om ni har.'] });
menu('raka', 'Räkburgare', [2006, 2026], [3, 4], [L('biff', ids('biff-raka')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('gurka')), L('sas', ids('aioli', 'remoulad', 'sriracha'))],
  { fee: 30, xp: 16, msgs: ['Räkburgare med aioli!', 'Skaldjur! Har ni räkburgare?'] });
menu('spicy', 'Spicy chicken', [2008, 2026], [3, 4], [L('biff', ids('biff-kyckling-spicy')), L('extra', ids('jalapeno'), 0.7), L('gront', ids('sallad', 'romansallad')), L('gront', ids('saltgurka'), 0.6), L('sas', ids('sriracha', 'chipotle', 'hotsauce', 'ranch'))],
  { fee: 28, xp: 14, msgs: ['Spicy chicken – så het ni vågar göra den!', 'Kyckling med hetta, tack.'] });
menu('portobello', 'Portobelloburgare', [2009, 2026], [3, 4], [L('biff', ids('biff-portobello')), L('ost', ids('ost-mozzarella', 'ost-brie', 'ost-getost')), L('gront', ids('spenat', 'ruccola')), L('sas', ids('pesto', 'aioli'))],
  { fee: 28, xp: 14, msgs: ['Portobello i stället för biff – vegetariskt!'] });
menu('slider', 'Sliders (mini)', [2008, 2026], [2, 3], [L('biff', ids('biff-90', 'biff-smash')), L('ost', melt), L('gront', ids('saltgurka')), L('sas', ids('ketchup', 'dressing'))],
  { fee: 18, xp: 10, msgs: ['Små sliders till barnkalaset!', 'En miniburgare bara – jag ska äta middag sen.'], bread: (p) => p.look?.mini, mini: true });

// ---- 2010-tal: gourmet ----
menu('halloumi', 'Halloumiburgare', [2010, 2026], [3, 4], [L('biff', ids('biff-halloumi')), L('gront', ids('ruccola', 'sallad', 'spenat')), L('gront', ids('tomat')), L('gront', ids('rodlok')), L('sas', ids('aioli', 'tzatziki', 'pesto'))],
  { fee: 28, xp: 14, msgs: ['Halloumiburgare med aioli!', 'Grillad halloumi – ja tack.'] });
menu('lax', 'Laxburgare', [2010, 2026], [4, 5], [L('biff', ids('biff-lax')), L('extra', ids('avokado'), 0.7), L('gront', ids('spenat', 'ruccola')), L('sas', ids('remoulad', 'aioli', 'tzatziki'))],
  { fee: 34, xp: 18, msgs: ['Laxburgare med avokado, tack.'] });
menu('pulled', 'Pulled pork-burgare', [2012, 2026], [3, 4], [L('biff', ids('biff-pulledpork')), L('gront', ids('coleslaw')), L('extra', ids('picklad-rodlok'), 0.6), L('sas', ids('bbq'))],
  { fee: 30, xp: 16, msgs: ['Pulled pork med coleslaw!', 'Långkokt fläsk – jag såg det på nätet.'] });
menu('gourmet', 'Gourmetburgaren', [2012, 2026], [4, 5], [L('biff', ids('biff-chuck', 'biff-angus', 'biff-180')), L('ost', ids('ost-cheddar', 'ost-brie', 'ost-rokt')), L('gront', ids('karamelliserad-lok')), L('gront', ids('ruccola')), L('sas', ids('tryffelmajo', 'aioli', 'chimichurri'))],
  { fee: 42, xp: 22, msgs: ['Gourmetburgaren – på brioche, tack!', 'Jag vill ha det finaste ni har.'], bread: ids('brod-brioche', 'brod-surdeg', 'brod-potatis'), sides: { tillbehor: 0.7, dryck: 0.7 } });
menu('avokado', 'Avokadoburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-kyckling-grill', 'biff-plant', 'biff-halloumi')), L('extra', ids('avokado')), L('gront', ids('tomat')), L('gront', ids('ruccola', 'spenat')), L('sas', ids('aioli', 'sriracha'))],
  { fee: 30, xp: 16, msgs: ['Något med avokado – brunchburgaren!'] });
menu('teriyaki', 'Teriyakiburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-kyckling-grill', 'biff-90', 'biff-120', 'biff-tofu')), L('extra', ids('ananas'), 0.5), L('gront', ids('sallad', 'gurka')), L('sas', ids('teriyaki'))],
  { fee: 28, xp: 14, msgs: ['Teriyaki – söt soja på burgaren!'] });
menu('tofu', 'Tofuburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-tofu')), L('extra', ids('kimchi'), 0.5), L('gront', ids('coleslaw', 'gurka')), L('sas', ids('teriyaki', 'sriracha', 'gochujang'))],
  { fee: 26, xp: 14, msgs: ['Rökt tofu – vegansk, tack!'] });
menu('lowcarb', 'Low carb-burgaren', [2015, 2026], [3, 4], [L('biff', ids('biff-150', 'biff-kyckling-grill', 'biff-angus')), L('ost', ids('ost-cheddar', 'ost-amerikansk')), L('gront', ids('tomat')), L('gront', ids('rodlok')), L('sas', ids('aioli', 'majonnas'))],
  { fee: 28, xp: 14, msgs: ['Utan bröd! I ett salladsblad i stället.', 'Low carb – salladsblad som bröd, tack.'], bread: ids('brod-sallad'), sides: { tillbehor: 0.3, dryck: 0.6 } });
menu('smash', 'Smash Classic', [2016, 2026], [3, 4], [L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('gront', ids('saltgurka')), L('gront', ids('lok')), L('sas', ids('dressing'))],
  { fee: 26, xp: 14, msgs: ['Smash! Tunn biff, knaprig kant.', 'En smashburgare på potatisbröd, tack.'], bread: ids('brod-potatis', 'brod-klassiskt', 'brod-sesam') });
menu('smash-dubbel', 'Dubbel smash', [2016, 2026], [3, 4], [L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('gront', ids('picklad-rodlok', 'saltgurka')), L('sas', ids('dressing', 'chipotle'))],
  { fee: 32, xp: 18, msgs: ['Dubbel smash – två tunna biffar!'], bread: ids('brod-potatis', 'brod-klassiskt', 'brod-sesam') });
menu('svart', 'Svarta burgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-150', 'biff-angus', 'biff-chuck')), L('ost', ids('ost-cheddar')), L('extra', ids('bacon')), L('extra', ids('jalapeno'), 0.6), L('sas', ids('bbq', 'chipotle'))],
  { fee: 36, xp: 20, msgs: ['Den svarta burgaren – med kolbröd!', 'Jag såg bilden på nätet. Det svarta brödet!'], bread: ids('brod-svart') });
menu('mac', 'Mac & cheese-burgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-150', 'biff-180', 'biff-chuck')), L('extra', ids('mac-cheese')), L('extra', ids('bacon')), L('sas', ids('bbq', 'chipotle'))],
  { fee: 38, xp: 20, msgs: ['Mac & cheese PÅ burgaren. Ja.', 'Den galna med makaroner!'] });
menu('tryffel', 'Tryffelburgaren', [2018, 2026], [5, 5], [L('biff', ids('biff-wagyu', 'biff-chuck', 'biff-dryaged')), L('ost', ids('ost-raclette', 'ost-brie')), L('extra', ids('tryffelost-krisp')), L('gront', ids('ruccola')), L('sas', ids('tryffelmajo'))],
  { fee: 58, xp: 28, msgs: ['Tryffelburgaren. Pengar spelar ingen roll.', 'Wagyu och tryffel – det ska firas!'], bread: ids('brod-brioche', 'brod-surdeg'), sides: { tillbehor: 0.8, dryck: 0.8 } });
menu('korean', 'Koreanska burgaren', [2018, 2026], [4, 5], [L('biff', ids('biff-kyckling-spicy', 'biff-150', 'biff-plant')), L('extra', ids('kimchi')), L('gront', ids('gurka')), L('sas', ids('gochujang', 'sriracha'))],
  { fee: 34, xp: 18, msgs: ['Koreansk med kimchi och gochujang!'] });
menu('plant', 'Plantburgaren', [2019, 2026], [3, 4], [L('biff', ids('biff-plant', 'biff-kyckling-plant')), L('ost', ids('ost-vegansk')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('picklad-rodlok', 'rodlok')), L('sas', ids('aioli', 'chipotle', 'dressing'))],
  { fee: 30, xp: 16, msgs: ['Helt vegansk, tack – plantbaserad biff och vegansk ost.', 'Kan ni göra den helt utan djur?'] });
menu('dryaged', 'Dry aged deluxe', [2022, 2026], [5, 5], [L('biff', ids('biff-dryaged', 'biff-wagyu')), L('ost', ids('ost-raclette', 'ost-cheddar')), L('gront', ids('karamelliserad-lok')), L('sas', ids('chimichurri', 'tryffelmajo'))],
  { fee: 62, xp: 30, msgs: ['Dry aged – hängmörat i 40 dagar, står det på skylten.'], bread: ids('brod-brioche', 'brod-surdeg'), sides: { tillbehor: 0.8, dryck: 0.9 } });

export const TEMPLATES = T;
export const TEMPLATE = Object.fromEntries(T.map((t) => [t.id, t]));
export const templatesFor = (year) => T.filter((t) => year >= t.years[0] && year <= t.years[1]);

// ---------- Sätta ihop en beställning ur en meny ----------
const okBread = (t) => (p) => (t.bread ? t.bread(p) : !(p.look?.mini || p.look?.flat || p.look?.lettuce || p.look?.hole));
export function composeBuild(t, year, pick = rnd, allow = null) {
  const sale = onSale(year), [lo, hi] = t.tier;
  const cands = (cat, f) => sale.filter((p) => p.cat === cat && (!f || f(p)) && (!allow || allow(p)));
  const inTier = (list) => { const a = list.filter((p) => p.tier >= lo - 1 && p.tier <= hi + 1); return a.length ? a : list; };
  const breads = inTier(cands('brod', okBread(t)));
  if (!breads.length) return null;
  const bread = pick(breads);
  const out = [bread];
  for (const r of t.recipe) {
    if (r.p !== undefined && Math.random() > r.p) continue;
    const list = inTier(cands(r.cat, r.pick));
    if (!list.length) continue;   // ingrediensen finns inte det här året – burgaren blir enklare
    out.push(pick(list));
  }
  if (!out.some((p) => p.cat === 'biff')) return null;
  out.push(bread);
  return out;
}
// tillbehör och dryck till menyn (helst det som finns framme)
function sidesFor(t, year, game, pick = rnd) {
  const out = [], sale = onSale(year);
  const shown = (p) => (game?.shownFree ? game.shownFree(p.id) : 0) > 0;
  const choose = (cat) => { const list = sale.filter((p) => p.cat === cat && (!game?.canSell || game.canSell(p))); if (!list.length) return null; const have = list.filter(shown); return pick(have.length && Math.random() < 0.8 ? have : list); };
  if (Math.random() < (t.sides.tillbehor ?? 0.5)) { const p = choose('tillbehor'); if (p) out.push(p); }
  if (Math.random() < (t.sides.dryck ?? 0.6)) { const p = choose('dryck'); if (p) out.push(p); }
  return out;
}

const templateWeight = (t, game) => {
  const y = game.year, span = t.years[1] - t.years[0];
  let w = 1;
  if (y - t.years[0] < 3) w += 1.5;                       // nytt på menyn
  if (span > 30 && y - t.years[0] > 25) w *= 0.7;         // gamla klassiker lite mer sällan
  return w;
};
function pickWeighted(list, wf) { let r = Math.random() * list.reduce((s, x) => s + wf(x), 0); for (const x of list) { r -= wf(x); if (r <= 0) return x; } return list[list.length - 1]; }

export function generateOrder(game, names) {
  const year = game.year;
  const em = (k, s) => (game.eventMul ? game.eventMul(k, s) : 1);
  // bara något att dricka eller en efterrätt
  if (Math.random() < 0.18 * em('products')) { const o = productOrder(game, names); if (o) return o; }
  const pool = templatesFor(year);
  if (!pool.length) return null;
  const t = pickWeighted(pool, (x) => templateWeight(x, game));
  const wantMissing = Math.random() < 0.28;
  const allow = game.canSell ? (p) => game.canSell(p) : null;
  const wantLocked = allow && Math.random() < 0.15;
  let best = null, bestScore = -1e9;
  for (let i = 0; i < 30; i++) {
    const b = composeBuild(t, year, rnd, wantLocked ? null : allow);
    if (!b) continue;
    if (wantLocked && !b.some((p) => !allow(p))) continue;
    const missing = b.filter((p) => (game.shownFree ? game.shownFree(p.id) : game.stockFree(p.id)) < 1).length;
    const score = wantMissing ? -Math.abs(missing - 1) * 10 + Math.random() : -missing * 10 + Math.random();
    if (score > bestScore) { bestScore = score; best = b; }
  }
  if (!best && wantLocked) for (let i = 0; i < 30 && !best; i++) best = composeBuild(t, year, rnd, allow);
  if (!best) for (let i = 0; i < 30 && !best; i++) best = composeBuild(t, year);
  if (!best) return null;
  const items = best.map((p) => ({ cat: p.cat, part: p.id }));
  const sides = sidesFor(t, year, game);
  for (const p of sides) items.push({ cat: p.cat, part: p.id });
  // ibland får du välja drycken själv
  const drink = items.find((it) => it.cat === 'dryck');
  if (drink && Math.random() < 0.3 && onSale(year).some((p) => p.cat === 'dryck' && game.stockFree(p.id) > 0)) { drink.part = null; drink.choice = true; }
  let msg = rnd(t.msgs);
  if (sides.length) msg += ' ' + (sides.length === 2 ? `Och ${sides[0].name.toLowerCase()} och en ${sides[1].name.toLowerCase()}.` : `Och ${sides[0].name.toLowerCase()}.`);
  if (drink?.choice) msg += ' Drycken får du välja!';
  return { template: t.id, title: t.name, name: rnd(names), msg, items, year };
}

// ---------- Start för ett valt år ----------
export function startFor(year) {
  const sorted = templatesFor(year).filter((t) => t.tier[0] <= 2).sort((a, b) => a.tier[0] - b.tier[0] || a.recipe.length - b.recipe.length);
  const t = sorted.find((x) => x.id === 'cheese') || sorted[0] || TEMPLATES[0];
  let a = null, b = null;
  const low = (p) => p.tier <= 2;
  for (let i = 0; i < 12 && !a; i++) a = composeBuild(t, year, cheapest, low);
  for (let i = 0; i < 12 && !a; i++) a = composeBuild(t, year, cheapest);
  for (let i = 0; i < 20 && !b; i++) b = composeBuild(t, year, rnd, low);
  b ||= a;
  // startkassan räcker till startpaketet, pommes och läsk till de första kunderna och lite till
  const kit = {};
  for (const p of [...(a || []), ...(b || [])]) kit[p.id] = (kit[p.id] || 0) + 1;
  const pommes = onSale(year).find((p) => p.id === 'pommes'), cola = onSale(year).find((p) => p.id === 'cola');
  for (const p of [pommes, cola]) if (p) kit[p.id] = (kit[p.id] || 0) + 3;
  const kitCost = Object.entries(kit).reduce((s, [id, n]) => s + DB.part[id].cost * n, 0);
  return { money: Math.round((kitCost * priceIndex(year) + 350) / 50) * 50, stock: {}, kit, builds: [a, b], template: t.id };
}

const TUTOR_NAMES = ['Birgitta', 'Oscar', 'Wilma'];
export const TUTORIAL_COUNT = 3;
export function tutorialOrder(i, game) {
  if (i >= TUTORIAL_COUNT) return null;
  const year = game.year, st = game.startInfo || startFor(year);
  const tpl = TEMPLATE[st.template] || TEMPLATES[0];
  let build = st.builds?.[Math.min(i, 1)];
  if (!build) return null;
  build = build.map((p) => DB.part[p.id] || p);
  const items = build.map((p) => ({ cat: p.cat, part: p.id }));
  if (i === 1) { const pommes = DB.part.pommes; if (pommes && year >= pommes.year) items.push({ cat: 'tillbehor', part: 'pommes' }); }
  if (i === 2) {
    // tredje kunden vill ha något som inte finns hemma – dags att handla hos grossisten
    const want = onSale(year).filter((p) => (p.cat === 'ost' || p.cat === 'extra') && game.stockFree(p.id) < 1 && (!game.canSell || game.canSell(p)) && p.cost <= (game.money || 0) * 0.5).sort((x, y) => x.cost - y.cost)[0];
    if (want) { const at = Math.max(1, items.findIndex((it) => it.cat === 'gront' || it.cat === 'sas')); items.splice(at, 0, { cat: want.cat, part: want.id }); }
    const cola = DB.part.cola; if (cola) items.push({ cat: 'dryck', part: 'cola' });
  }
  const msgs = {
    0: `Hej! Jag tar en ${tpl.name.toLowerCase()} – min första här. Kan du visa hur ni gör?`,
    1: 'Tjena! Jag tar samma som hon före mig – och pommes till.',
    2: `Jag vill ha en ${tpl.name.toLowerCase()} med lite extra på – och en cola. Går det?`,
  };
  return { template: tpl.id, title: tpl.name, name: TUTOR_NAMES[i], msg: msgs[i], guided: i === 0, tutorial: i, year, items };
}

// ---------- Laga en beställning ----------
export function fitsWith() { return true; }
export function replacementFor(order, item, year) {
  const cur = DB.part[item.part];
  const list = onSale(year).filter((p) => p.cat === item.cat && p.id !== item.part).sort((a, b) => Math.abs(a.cost - (cur?.cost || 0)) - Math.abs(b.cost - (cur?.cost || 0)));
  return list[0] || null;
}
export function fixOrder(order, year, stockFree = () => 0) {
  const sale = new Set(onSale(year).map((p) => p.id));
  let changed = false;
  for (const it of order.items) {
    if (!it.part || sale.has(it.part)) continue;
    const r = replacementFor(order, it, year);
    if (r) { it.part = r.id; changed = true; }
  }
  return changed;
}

// ---------- Pris, xp, avgifter ----------
export function feeFor(order) { return order.product ? 0 : (TEMPLATE[order.template]?.fee || 20); }
export function xpFor(order) { return order.product ? 2 : (TEMPLATE[order.template]?.xp || 10); }
export const OPTS = [];
export const optsFor = () => [];
export function priceFor(order, chosen = {}) {
  let sum = feeFor(order) * priceIndex(order.year || 1990);
  for (const it of order.items) {
    const p = it.part ? DB.part[it.part] : chosen[it.cat] ? DB.part[chosen[it.cat]] : null;
    if (p) sum += retail(p);
  }
  return Math.round(sum);
}
export const START = { money: 500, stock: {} };
export const DIAGNOSIS_FEE = 0;
