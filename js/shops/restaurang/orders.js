// Kundernas beställningar: menyer genom epokerna (1955–2026). Varje meny är ett recept – lager
// underifrån – och kunden vill ha exakt de ingredienserna i den ordningen, helst av det som
// finns i kylen. Brödet läggs alltid underst och överst. Ingen DOM här.
import { DB, onSale, retail, CAT_ORDER, BURGER_CATS, PRODUCT_CATS, layerHeight } from './menu.js';
import { productOrder, isProduct } from './products.js';
import { priceIndex } from './upgrades.js';

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const cheapest = (a) => [...a].sort((x, y) => x.cost - y.cost)[0];
const kind = (...k) => (p) => k.includes(p.look?.kind) && p.look?.shape === 'patty' && !p.look?.mini;   // riktiga biffar (inte lös färs eller strimlor)
const ids = (...i) => (p) => i.includes(p.id);
const not = (...i) => (p) => !i.includes(p.id);
const melt = (p) => p.look?.melt;
const plainBread = (p) => !(p.look?.mini || p.look?.flat || p.look?.lettuce || p.look?.hole || p.look?.novelty || p.look?.square);
const flatOrPlain = (p) => p.look?.flat || plainBread(p);

// recipe: [{ cat, pick?, p? }] underifrån (utan bröd). sides: sannolikhet för tillbehör/dryck.
// bread: vilka bröd som duger (annars "vanliga" bröd: inte mini, platt, salladsblad eller specialbröd).
const T = [];
const menu = (id, name, years, tier, recipe, o = {}) => T.push({ id, name, years, tier, recipe: recipe.map((r) => (typeof r === 'string' ? { cat: r } : r)), fee: o.fee ?? 20, xp: o.xp ?? 10, msgs: o.msgs || [`Jag tar en ${name.toLowerCase()}, tack!`], sides: o.sides || { tillbehor: 0.5, dryck: 0.6 }, bread: o.bread || null, mini: !!o.mini, vegan: !!o.vegan });
const L = (cat, pick, p) => ({ cat, pick, p });

// ---- 50-tal: dinern och svenska klassiker ----
menu('klassiker', 'Klassisk hamburgare', [1955, 2026], [1, 2], [L('biff', kind('not')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat'), 0.8), L('sas', ids('ketchup', 'dressing', 'majonnas'))],
  { fee: 18, xp: 8, msgs: ['En vanlig hamburgare, tack – som förr i tiden.', 'Bara en hamburgare med sallad och tomat.', 'Kan jag få en enkel burgare?'] });
menu('cheese', 'Cheeseburgare', [1955, 2026], [1, 2], [L('biff', kind('not')), L('ost', melt), L('gront', ids('saltgurka')), L('gront', ids('lok', 'rodlok'), 0.7), L('sas', ids('ketchup', 'senap', 'dressing'))],
  { fee: 20, xp: 10, msgs: ['En cheeseburgare med gurka och lök!', 'Cheeseburgare, tack. Extra smält ost om det går.'] });
menu('plain', 'Bara biff och bröd', [1955, 2026], [1, 1], [L('biff', kind('not')), L('sas', ids('ketchup'), 0.5)],
  { fee: 12, xp: 5, msgs: ['Bara biff och bröd – inget grönt!', 'Min son vill inte ha något på. Bara biffen.'], sides: { tillbehor: 0.4, dryck: 0.6 } });
menu('diner-deluxe', 'Diner Deluxe', [1955, 2026], [1, 2], [L('biff', kind('not')), L('ost', ids('ost-amerikansk', 'ost-hushall', 'ost-cheddar')), L('gront', ids('sallad', 'krispsallad')), L('gront', ids('tomat')), L('gront', ids('lok')), L('gront', ids('sotsur-gurka', 'saltgurka')), L('sas', ids('tusen-o', 'dressing', 'majonnas'))],
  { fee: 24, xp: 12, msgs: ['Deluxe – med allt som finns!', 'Den stora dinerburgaren, med ost och allt grönt.'] });
menu('big-diner', 'Stora dinerburgaren', [1957, 2026], [2, 3], [L('biff', ids('biff-diner', 'biff-150', 'biff-180')), L('gront', ids('sallad', 'krispsallad')), L('gront', ids('tomat')), L('gront', ids('lok')), L('gront', ids('sotsur-gurka', 'saltgurka')), L('sas', ids('majonnas', 'dressing', 'tusen-o'))],
  { fee: 24, xp: 12, msgs: ['Den stora – med stor biff och allt grönt!', 'En riktig diner-burgare, stor biff.'] });
menu('pannbiff', 'Pannbiffsburgaren', [1955, 2026], [1, 2], [L('biff', ids('biff-pannbiff')), L('gront', ids('stekt-lok')), L('sas', ids('lingon', 'ketchup'))],
  { fee: 18, xp: 9, msgs: ['Pannbiff med lök och lingon – i bröd!', 'Något svenskt: pannbiff, stekt lök och lingon.'], bread: ids('brod-fralla', 'brod-klassiskt', 'brod-sesam', 'brod-grovt') });
menu('rodbeta', 'Rödbetsburgaren', [1955, 2026], [1, 2], [L('biff', kind('not')), L('extra', ids('rodbetssallad')), L('gront', ids('stekt-lok', 'lok')), L('sas', ids('senap', 'majonnas'), 0.5)],
  { fee: 18, xp: 9, msgs: ['Rödbetssallad på biffen, som hemma hos mormor.', 'Biff med rödbetssallad och lök!'] });
menu('rostad-lok', 'Burgare med rostad lök', [1955, 2026], [1, 2], [L('biff', kind('not')), L('extra', ids('rostad-lok')), L('gront', ids('saltgurka', 'sotsur-gurka')), L('sas', ids('ketchup', 'senap'))],
  { fee: 16, xp: 8, msgs: ['Rostad lök på – massor!', 'Med rostad lök och gurka, tack.'] });
menu('patty-melt', 'Patty melt', [1955, 2026], [1, 2], [L('biff', kind('not')), L('ost', ids('ost-amerikansk', 'ost-hushall', 'ost-schweizer', 'ost-emmentaler')), L('gront', ids('stekt-lok')), L('sas', ids('tusen-o', 'majonnas'), 0.6)],
  { fee: 20, xp: 10, msgs: ['Patty melt – på rostat formbröd!', 'Biff, smält ost och stekt lök mellan två rostade skivor.'], bread: ids('brod-formbrod') });
menu('oklahoma', 'Oklahoma onion burger', [1955, 2026], [1, 2], [L('biff', ids('biff-90', 'biff-smash')), L('ost', ids('ost-amerikansk'), 0.7), L('gront', ids('stekt-lok')), L('gront', ids('saltgurka', 'sotsur-gurka')), L('sas', ids('senap'))],
  { fee: 18, xp: 9, msgs: ['Lök pressad i biffen – Oklahoma-stil!', 'En lökburgare som i Oklahoma.'] });
menu('sloppy', 'Sloppy Joe', [1955, 2026], [1, 2], [L('biff', ids('biff-los')), L('ost', ids('ost-amerikansk'), 0.4), L('gront', ids('lok'), 0.5), L('sas', ids('ketchup'), 0.3)],
  { fee: 16, xp: 8, msgs: ['En Sloppy Joe – ta med servetter!', 'Lös köttfärs i bröd, tack.'], sides: { tillbehor: 0.6, dryck: 0.6 } });
menu('kalv', 'Kalvburgaren', [1958, 2026], [2, 3], [L('biff', ids('biff-kalv')), L('gront', ids('sallad', 'krispsallad')), L('gront', ids('gurka')), L('sas', ids('remoulad', 'majonnas', 'tartar'))],
  { fee: 24, xp: 12, msgs: ['Kalvfärs – finare än vanlig.', 'Kalvburgare med remoulad, tack.'] });
menu('bland', 'Blandfärsburgaren', [1960, 2026], [1, 1], [L('biff', ids('biff-bland')), L('gront', ids('lok')), L('gront', ids('tomat'), 0.6), L('sas', ids('ketchup', 'senap'))],
  { fee: 14, xp: 6, msgs: ['Billigaste ni har – blandfärs går bra.', 'Blandfärsbiff med lök.'] });
menu('agg-kokt', 'Äggburgaren', [1960, 2026], [1, 2], [L('biff', kind('not')), L('extra', ids('kokt-agg')), L('gront', ids('sallad')), L('sas', ids('majonnas', 'tusen-o'))],
  { fee: 20, xp: 10, msgs: ['Kokt ägg på burgaren, tack.', 'Med äggskivor och majonnäs.'] });
menu('skink', 'Skinkburgaren', [1962, 2026], [1, 2], [L('biff', ids('biff-skinka')), L('ost', ids('ost-amerikansk', 'ost-cheddar', 'ost-hushall'), 0.6), L('gront', ids('sotsur-gurka', 'saltgurka')), L('sas', ids('senap', 'majonnas'))],
  { fee: 18, xp: 9, msgs: ['Stekt skinka i bröd – med senap.', 'Skinkburgare, tack!'] });
menu('dubbel-cheese', 'Dubbel cheeseburgare', [1962, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('biff', kind('not')), L('ost', melt), L('gront', ids('saltgurka')), L('sas', ids('dressing', 'ketchup'))],
  { fee: 26, xp: 14, msgs: ['Två biffar, två ostar. Jag är hungrig!', 'Dubbel cheese – det är lördag.'] });
menu('bacon', 'Baconburgare', [1963, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('extra', ids('bacon')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat'), 0.7), L('sas', ids('bbq', 'dressing', 'majonnas'))],
  { fee: 26, xp: 14, msgs: ['Bacon! Mycket bacon.', 'En baconburgare med ost och bbq.'] });
menu('chili-burger', 'Chiliburgaren', [1965, 2026], [2, 3], [L('biff', kind('not')), L('ost', ids('ost-cheddar', 'ost-amerikansk'), 0.5), L('extra', ids('chili')), L('gront', ids('lok')), L('sas', ids('senap'), 0.4)],
  { fee: 24, xp: 12, msgs: ['Chili på burgaren – med lök.', 'En chiliburgare, kladdig är bra.'] });
menu('fisk', 'Fiskburgare', [1965, 2026], [2, 3], [L('biff', ids('biff-fisk')), L('ost', ids('ost-amerikansk', 'ost-cheddar'), 0.6), L('gront', ids('sallad', 'romansallad')), L('sas', ids('remoulad', 'dressing', 'majonnas', 'tartar'))],
  { fee: 22, xp: 12, msgs: ['Det är fredag – en fiskburgare!', 'Jag äter inte kött. Har ni fisk?'] });
menu('fiskbiff', 'Fiskbiffsburgaren', [1960, 2026], [1, 2], [L('biff', ids('biff-fiskbiff')), L('gront', ids('gurka')), L('sas', ids('remoulad', 'majonnas', 'tartar'))],
  { fee: 18, xp: 9, msgs: ['Fiskbiff i bröd med remoulad.', 'Något med fisk, enkelt.'] });
menu('schweizer', 'Schweizerburgare', [1965, 2026], [2, 3], [L('biff', kind('not')), L('ost', ids('ost-schweizer', 'ost-emmentaler', 'ost-greve')), L('extra', ids('champinjoner'), 0.8), L('gront', ids('lok')), L('sas', ids('majonnas', 'dressing'))],
  { fee: 24, xp: 12, msgs: ['Schweizerost och stekta champinjoner, tack.'] });
menu('kottbulle', 'Köttbullsburgaren', [1965, 2026], [1, 2], [L('biff', ids('biff-kottbulle')), L('gront', ids('stekt-lok'), 0.5), L('gront', ids('sotsur-gurka', 'saltgurka')), L('sas', ids('lingon'))],
  { fee: 18, xp: 9, msgs: ['Köttbullar i bröd med lingon – hur svenskt som helst.', 'Köttbullsbiff, gurka och lingon!'] });

// ---- 70-tal: grillkiosken ----
menu('kiosk', 'Kioskburgare', [1975, 1998], [1, 2], [L('biff', ids('biff-korv', 'biff-90')), L('gront', ids('lok')), L('sas', ids('senap', 'ketchup'))],
  { fee: 14, xp: 6, msgs: ['En kioskburgare med lök och senap.', 'Något snabbt – jag ska hinna med bussen.'], sides: { tillbehor: 0.3, dryck: 0.7 } });
menu('kioskspecial', 'Kioskspecial', [1975, 2026], [1, 2], [L('biff', ids('biff-korv', 'biff-90')), L('extra', ids('rostad-lok')), L('gront', ids('saltgurka')), L('sas', ids('bostongurka', 'senap', 'ketchup'))],
  { fee: 16, xp: 8, msgs: ['Special – med rostad lök och bostongurka.', 'Kioskspecial, allt på!'], sides: { tillbehor: 0.4, dryck: 0.7 } });
menu('flask', 'Fläskburgare', [1975, 2026], [2, 3], [L('biff', ids('biff-flask')), L('gront', ids('coleslaw', 'sallad')), L('gront', ids('gurka', 'saltgurka')), L('sas', ids('senap', 'bbq', 'honungssenap'))],
  { fee: 22, xp: 12, msgs: ['Fläskfärsbiff med coleslaw – som farsan gjorde.'] });
menu('frukost', 'Frukostburgaren', [1970, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('extra', ids('bacon')), L('extra', ids('stekt-agg')), L('sas', ids('ketchup', 'hotsauce', 'majonnas'))],
  { fee: 28, xp: 14, msgs: ['Frukost! Ägg, bacon och ost på biffen.', 'Jag missade frukosten – ge mig en med ägg.'] });
menu('barn', 'Barnmeny', [1978, 2026], [1, 1], [L('biff', ids('biff-90', 'biff-120', 'biff-smash')), L('ost', ids('ost-amerikansk', 'ost-cheddar', 'ost-gouda', 'ost-hushall')), L('sas', ids('ketchup'))],
  { fee: 16, xp: 8, msgs: ['En barnmeny – bara ost och ketchup på!', 'Min unge vill ha en liten burgare med ketchup.'], sides: { tillbehor: 0.9, dryck: 0.9 } });
menu('raksallad', 'Räksalladsburgaren', [1975, 2026], [2, 3], [L('biff', ids('biff-90', 'biff-120', 'biff-korv')), L('extra', ids('raksallad')), L('gront', ids('sallad'), 0.6)],
  { fee: 22, xp: 11, msgs: ['Räksallad på burgaren – kioskens lyx!', 'Med räksallad. Mycket räksallad.'] });
menu('bostongurka', 'Bostongurkeburgaren', [1970, 2026], [1, 2], [L('biff', kind('not')), L('ost', ids('ost-amerikansk', 'ost-hushall', 'ost-prast'), 0.6), L('gront', ids('lok')), L('sas', ids('bostongurka')), L('sas', ids('senap'), 0.5)],
  { fee: 18, xp: 9, msgs: ['Bostongurka och lök – som på kiosken.', 'Med bostongurka, tack!'] });
menu('rhode', 'Rhode Island-burgaren', [1972, 2026], [1, 2], [L('biff', kind('not')), L('gront', ids('sallad')), L('gront', ids('tomat')), L('sas', ids('rhode-island'))],
  { fee: 18, xp: 9, msgs: ['Rhode Island på burgaren – sjuttiotal!', 'Sallad, tomat och Rhode Island.'] });
menu('tunnbrod', 'Tunnbrödsburgaren', [1978, 2026], [1, 2], [L('biff', ids('biff-korv', 'biff-90')), L('extra', ids('potatismos')), L('extra', ids('raksallad'), 0.6), L('sas', ids('bostongurka', 'senap'))],
  { fee: 20, xp: 10, msgs: ['Tunnbröd med korv, mos och räksallad – som en rulle fast platt!', 'En tunnbrödsburgare med mos.'], bread: ids('brod-tunnbrod') });
menu('halso', 'Hälsoburgaren', [1975, 2026], [2, 3], [L('biff', kind('not', 'kyckling', 'vego')), L('gront', ids('rivna-morotter')), L('gront', ids('sallad', 'krispsallad')), L('gront', ids('tomat'), 0.5), L('sas', ids('yoghurtsas', 'majonnas'))],
  { fee: 20, xp: 10, msgs: ['Något nyttigare – på grovt bröd med morötter.', 'Grovt bröd och rivna morötter, tack.'], bread: ids('brod-grovt', 'brod-fullkorn', 'brod-rag') });

// ---- 80-tal ----
menu('dubbel-bacon', 'Dubbel baconburgare', [1980, 2026], [3, 4], [L('biff', kind('not')), L('ost', melt), L('extra', ids('bacon')), L('biff', kind('not')), L('ost', melt), L('extra', ids('bacon')), L('sas', ids('bbq', 'dressing', 'majonnas'))],
  { fee: 34, xp: 18, msgs: ['Dubbelt av allt – två biffar, dubbelt bacon.', 'Dubbel bacon. Jag har sprungit hit.'] });
menu('steak', 'Steak sandwich', [1980, 2026], [3, 4], [L('biff', ids('biff-ryggbiff')), L('ost', ids('ost-provolone', 'ost-emmentaler', 'ost-schweizer'), 0.6), L('gront', ids('stekt-lok')), L('gront', ids('paprika'), 0.5), L('sas', ids('pepparsas', 'kryddsmor', 'bearnaise'))],
  { fee: 34, xp: 18, msgs: ['Skivad ryggbiff i bröd, med kryddsmör.', 'Steak sandwich med pepparsås!'], bread: ids('brod-kaiser', 'brod-baguette', 'brod-ciabatta') });
menu('kryddsmor', 'Kryddsmörsburgaren', [1980, 2026], [2, 3], [L('biff', ids('biff-150', 'biff-120', 'biff-180')), L('gront', ids('sallad')), L('gront', ids('tomat')), L('sas', ids('kryddsmor'))],
  { fee: 24, xp: 12, msgs: ['Kryddsmör som smälter på biffen, tack.'] });
menu('hawaii', 'Hawaiiburgare', [1985, 2026], [2, 3], [L('biff', kind('not')), L('ost', melt), L('extra', ids('skinka')), L('extra', ids('ananas')), L('gront', ids('sallad')), L('sas', ids('dressing', 'majonnas', 'curry'))],
  { fee: 26, xp: 14, msgs: ['Hawaii! Ananas och skinka på burgaren.', 'Kan man verkligen ha ananas på en burgare? Jag vill prova!'] });
menu('kyckling', 'Kycklingburgare', [1985, 2026], [2, 3], [L('biff', ids('biff-kyckling')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat'), 0.7), L('sas', ids('majonnas', 'dressing', 'ranch'))],
  { fee: 22, xp: 12, msgs: ['En kycklingburgare, panerad.', 'Kyckling, tack – jag försöker äta mindre rött kött.'] });
menu('texas', 'Texas BBQ', [1990, 2026], [3, 4], [L('biff', ids('biff-150', 'biff-180', 'biff-angus')), L('ost', ids('ost-cheddar', 'ost-amerikansk')), L('extra', ids('bacon')), L('extra', ids('lokringar-topping', 'krispig-lok')), L('sas', ids('bbq'))],
  { fee: 32, xp: 18, msgs: ['Texas BBQ! Stor biff, bacon och lökringar.', 'Yeehaw – en Texas!'] });
menu('cordon', 'Cordon bleu-burgaren', [1985, 2026], [2, 3], [L('biff', ids('biff-kyckling', 'biff-kyckling-grill')), L('extra', ids('skinka')), L('ost', ids('ost-schweizer', 'ost-amerikansk', 'ost-gouda')), L('gront', ids('sallad')), L('sas', ids('majonnas', 'dressing'))],
  { fee: 26, xp: 14, msgs: ['Kyckling med skinka och ost – som cordon bleu!'] });
menu('curry', 'Curryburgaren', [1985, 2026], [2, 3], [L('biff', ids('biff-kyckling', 'biff-kyckling-grill', 'biff-kalkon')), L('gront', ids('sallad')), L('sas', ids('curry'))],
  { fee: 22, xp: 12, msgs: ['En kycklingburgare med currysås, tack.'] });
menu('peppar', 'Pepparburgaren', [1985, 2026], [2, 3], [L('biff', ids('biff-150', 'biff-180', 'biff-diner')), L('gront', ids('stekt-lok', 'karamelliserad-lok')), L('sas', ids('pepparsas'))],
  { fee: 26, xp: 13, msgs: ['Pepparsås på burgaren – krogens klassiker.', 'Stor biff, stekt lök och pepparsås.'] });
menu('california', 'Kalifornien', [1985, 2026], [2, 3], [L('biff', ids('biff-90', 'biff-120', 'biff-kyckling', 'biff-kyckling-grill')), L('ost', ids('ost-monterey')), L('gront', ids('bongroddar')), L('gront', ids('tomat')), L('sas', ids('majonnas', 'ranch'))],
  { fee: 24, xp: 12, msgs: ['Böngroddar och Monterey Jack – hälsning från Kalifornien.', 'Något kaliforniskt, med groddar!'] });
menu('bratwurst', 'Bratwurstburgaren', [1985, 2026], [1, 2], [L('biff', ids('biff-bratwurst')), L('gront', ids('stekt-lok', 'lok')), L('sas', ids('senap', 'dijon'))],
  { fee: 16, xp: 8, msgs: ['Tysk grillkorv i bröd med senap.', 'Bratwurst – med mycket senap!'] });
menu('currywurst', 'Currywurst-burgaren', [1990, 2026], [1, 2], [L('biff', ids('biff-bratwurst', 'biff-korv')), L('gront', ids('lok'), 0.5), L('sas', ids('ketchup')), L('sas', ids('curry'))],
  { fee: 16, xp: 8, msgs: ['Currywurst i bröd – ketchup och curry över korven!'] });
menu('ost-lok', 'Ost- och lökburgaren', [1985, 2026], [1, 2], [L('biff', kind('not')), L('ost', ids('ost-cheddar', 'ost-amerikansk', 'ost-gouda')), L('extra', ids('rostad-lok'), 0.5), L('gront', ids('stekt-lok')), L('sas', ids('ketchup'))],
  { fee: 18, xp: 9, msgs: ['Ost och lök – både stekt och rostad!'] });
menu('fest', 'Festburgaren', [1985, 2026], [2, 3], [L('biff', ids('biff-150', 'biff-120')), L('ost', ids('ost-amerikansk', 'ost-cheddar'), 0.6), L('gront', ids('sallad')), L('gront', ids('tomat')), L('gront', ids('lok')), L('gront', ids('saltgurka')), L('sas', ids('dressing', 'majonnas'))],
  { fee: 24, xp: 12, msgs: ['Festburgaren – med allt grönt och dressing!', 'Den där med sallad, tomat, lök och gurka.'] });

// ---- 90-tal: kedjan och kebaben ----
menu('kebab', 'Kebabburgaren', [1990, 2026], [2, 3], [L('biff', ids('biff-kebab')), L('gront', ids('vitkal', 'sallad')), L('gront', ids('tomat')), L('gront', ids('lok', 'rodlok')), L('sas', ids('vitlokssas', 'kebabsas'))],
  { fee: 22, xp: 11, msgs: ['Kebab i bröd med vitlökssås – och stark sås om ni har!', 'Kebabburgare, blandad sås.'], bread: flatOrPlain });
menu('vego', 'Vegoburgare', [1990, 2026], [2, 3], [L('biff', ids('biff-vego', 'biff-soja', 'biff-falafel')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('gront', ids('lok', 'rodlok'), 0.6), L('sas', ids('aioli', 'dressing', 'majonnas', 'tzatziki'))],
  { fee: 24, xp: 12, msgs: ['Finns det något vegetariskt? En vegoburgare!', 'Jag är vegetarian – vad har ni?'] });
menu('gronsak', 'Grönsaksburgaren', [1992, 2026], [2, 3], [L('biff', ids('biff-gronsak')), L('gront', ids('sallad')), L('gront', ids('tomat')), L('gront', ids('gurka')), L('sas', ids('tzatziki', 'yoghurtsas', 'majonnas'))],
  { fee: 22, xp: 11, msgs: ['Grönsaksbiffen med morötter, tack.'] });
menu('trippel', 'Trippelburgare', [1990, 2026], [3, 4], [L('biff', kind('not')), L('ost', melt), L('biff', kind('not')), L('ost', melt), L('biff', kind('not')), L('ost', melt), L('gront', ids('saltgurka')), L('sas', ids('bbq', 'dressing'))],
  { fee: 36, xp: 20, msgs: ['TRE biffar. Tre ostar. Jag har tränat hela dagen.', 'Trippel! Jag är inte rädd.'] });
menu('alg', 'Älgburgaren', [1990, 2026], [3, 4], [L('biff', ids('biff-alg')), L('ost', ids('ost-prast', 'ost-vasterbotten'), 0.5), L('extra', ids('champinjoner'), 0.6), L('gront', ids('stekt-lok', 'karamelliserad-lok')), L('sas', ids('lingon'))],
  { fee: 34, xp: 18, msgs: ['Älg med lingon – smakar skog.', 'Har ni älg? Med svamp och lingon!'] });
menu('western', 'Westernburgaren', [1990, 2026], [2, 3], [L('biff', ids('biff-150', 'biff-120', 'biff-180')), L('ost', ids('ost-cheddar')), L('extra', ids('krispig-lok')), L('gront', ids('saltgurka')), L('sas', ids('bbq', 'carolina-bbq'))],
  { fee: 26, xp: 13, msgs: ['Western – cheddar, krispig lök och bbq.'] });
menu('reuben', 'Reubenburgaren', [1990, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-schweizer', 'ost-emmentaler')), L('extra', ids('pastrami')), L('extra', ids('surkal')), L('sas', ids('tusen-o', 'dressing'))],
  { fee: 32, xp: 16, msgs: ['Reuben – pastrami, surkål och schweizerost på rågbröd.', 'New York-deli, tack: en Reuben!'], bread: ids('brod-rag', 'brod-pretzel', 'brod-formbrod') });
menu('chilicheese', 'Chili cheese-burgare', [1995, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-cheddar', 'ost-pepperjack', 'ost-amerikansk')), L('extra', ids('chili')), L('extra', ids('jalapeno'), 0.8), L('extra', ids('krispig-lok'), 0.6), L('sas', ids('bbq', 'chipotle', 'hotsauce'))],
  { fee: 30, xp: 16, msgs: ['Chili cheese! Så het den kan bli.', 'Chili på burgaren, tack – och jalapeños.'] });
menu('bearnaise', 'Bearnaiseburgaren', [1990, 2026], [2, 3], [L('biff', ids('biff-150', 'biff-180', 'biff-120')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('sas', ids('bearnaise'))],
  { fee: 26, xp: 14, msgs: ['Bearnaise på burgaren – så svenskt.', 'En stor biff med bea, tack!'] });
menu('grekisk', 'Grekiska burgaren', [1995, 2026], [2, 3], [L('biff', ids('biff-lamm', 'biff-flask', 'biff-90', 'biff-120')), L('ost', ids('ost-feta'), 0.5), L('gront', ids('gurka')), L('gront', ids('rodlok', 'lok')), L('gront', ids('tomat')), L('sas', ids('tzatziki'))],
  { fee: 26, xp: 14, msgs: ['Grekiska – med tzatziki och rödlök!', 'Grekisk, med fetaost om ni har.'], bread: flatOrPlain });
menu('gyros', 'Gyrosburgaren', [1995, 2026], [2, 3], [L('biff', ids('biff-gyros')), L('gront', ids('tomat')), L('gront', ids('lok', 'rodlok')), L('gront', ids('vitkal'), 0.5), L('sas', ids('tzatziki', 'vitlokssas'))],
  { fee: 22, xp: 11, msgs: ['Gyros i bröd med tzatziki!'], bread: flatOrPlain });
menu('blt', 'BLT-burgaren', [1995, 2026], [2, 3], [L('biff', kind('not')), L('extra', ids('bacon')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('sas', ids('majonnas', 'aioli'))],
  { fee: 24, xp: 12, msgs: ['Bacon, sallad och tomat – en BLT med biff.'] });
menu('frisco', 'Frisco', [1996, 2026], [2, 3], [L('biff', ids('biff-150', 'biff-120')), L('ost', ids('ost-cheddar', 'ost-amerikansk')), L('extra', ids('bacon')), L('gront', ids('sallad')), L('gront', ids('tomat')), L('gront', ids('lok')), L('sas', ids('dressing', 'majonnas'))],
  { fee: 28, xp: 14, msgs: ['En Frisco – bacon, ost och dressing!', 'Den där med bacon och allt grönt.'] });
menu('pizza', 'Pizzaburgaren', [1998, 2026], [2, 3], [L('biff', kind('not')), L('ost', ids('ost-mozzarella', 'ost-amerikansk')), L('extra', ids('champinjoner')), L('extra', ids('skinka', 'pepperoni'), 0.7), L('sas', ids('ketchup', 'pesto'))],
  { fee: 26, xp: 14, msgs: ['Pizzaburgare! Mozzarella, champinjoner och skinka.'] });
menu('kyckling-grill', 'Grillad kycklingburgare', [1995, 2026], [2, 3], [L('biff', ids('biff-kyckling-grill')), L('gront', ids('romansallad', 'sallad')), L('gront', ids('tomat')), L('sas', ids('tzatziki', 'ranch', 'honungssenap'))],
  { fee: 24, xp: 12, msgs: ['Grillad kyckling – inte panerad.', 'Något lite lättare: grillad kycklingburgare.'] });
menu('lamm', 'Lammburgaren', [1998, 2026], [3, 4], [L('biff', ids('biff-lamm')), L('ost', ids('ost-getost', 'ost-schweizer', 'ost-brie', 'ost-feta'), 0.7), L('gront', ids('rodlok')), L('gront', ids('spenat', 'ruccola', 'sallad')), L('sas', ids('tzatziki', 'chimichurri', 'aioli'))],
  { fee: 32, xp: 18, msgs: ['Lammburgare med getost, tack.', 'Har ni lamm? Med tzatziki!'] });
menu('quorn', 'Quornburgaren', [1998, 2026], [2, 3], [L('biff', ids('biff-quorn')), L('ost', ids('ost-cheddar', 'ost-gouda'), 0.5), L('gront', ids('krispsallad', 'sallad')), L('gront', ids('tomat')), L('sas', ids('honungssenap', 'ranch', 'majonnas'))],
  { fee: 24, xp: 12, msgs: ['Quorn – vegetariskt men nästan som kyckling.'] });
menu('jalapeno', 'Jalapeñoburgaren', [1998, 2026], [2, 3], [L('biff', kind('not')), L('ost', ids('ost-pepperjack', 'ost-cheddar')), L('extra', ids('jalapeno')), L('gront', ids('lok')), L('sas', ids('chipotle', 'hotsauce', 'majonnas'))],
  { fee: 26, xp: 13, msgs: ['Så många jalapeños som får plats!', 'Jalapeño och pepper jack – het, tack.'] });
menu('ranch', 'Ranchburgaren', [1998, 2026], [2, 3], [L('biff', ids('biff-kyckling', 'biff-kyckling-grill', 'biff-120')), L('extra', ids('bacon'), 0.6), L('gront', ids('sallad')), L('gront', ids('tomat')), L('sas', ids('ranch'))],
  { fee: 24, xp: 12, msgs: ['Med ranchdressing – amerikanskt!'] });

// ---- 2000-tal ----
menu('falafel', 'Falafelburgare', [2000, 2026], [2, 3], [L('biff', ids('biff-falafel')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('gront', ids('gurka')), L('sas', ids('tzatziki', 'aioli', 'hotsauce', 'tahini'))],
  { fee: 22, xp: 12, msgs: ['Falafelburgare – vegansk om det går!'], bread: flatOrPlain });
menu('kalkon', 'Kalkonburgaren', [2000, 2026], [2, 3], [L('biff', ids('biff-kalkon')), L('ost', ids('ost-cheddar', 'ost-gouda')), L('gront', ids('spenat', 'sallad', 'romansallad')), L('sas', ids('honungssenap', 'ranch', 'majonnas'))],
  { fee: 24, xp: 12, msgs: ['Kalkon i stället för nöt – magrare.'] });
menu('club', 'Clubburgaren', [2000, 2026], [2, 3], [L('biff', ids('biff-kyckling-grill', 'biff-kyckling')), L('extra', ids('bacon')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat')), L('sas', ids('majonnas', 'aioli'))],
  { fee: 26, xp: 13, msgs: ['Som en club sandwich – kyckling, bacon och tomat.'] });
menu('philly', 'Philly cheesesteak', [2000, 2026], [3, 4], [L('biff', ids('biff-ryggbiff')), L('ost', ids('ost-provolone', 'ost-ostsas', 'ost-amerikansk')), L('gront', ids('stekt-lok')), L('gront', ids('paprika')), L('sas', ids('majonnas'), 0.3)],
  { fee: 34, xp: 18, msgs: ['Philly! Strimlad biff, provolone, lök och paprika.', 'En cheesesteak i bröd, tack.'], bread: ids('brod-baguette', 'brod-kaiser', 'brod-ciabatta') });
menu('hjort', 'Hjortburgaren', [2000, 2026], [4, 5], [L('biff', ids('biff-hjort')), L('ost', ids('ost-rokt', 'ost-prast'), 0.5), L('extra', ids('champinjoner')), L('gront', ids('stekt-lok', 'karamelliserad-lok')), L('sas', ids('lingon', 'pepparsas'))],
  { fee: 38, xp: 20, msgs: ['Hjort med svamp och lingon – jaktsäsong!'] });
menu('mexicana', 'Mexicana', [2005, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-pepperjack', 'ost-cheddar')), L('extra', ids('guacamole')), L('extra', ids('jalapeno')), L('gront', ids('tomat')), L('sas', ids('chipotle', 'hotsauce'))],
  { fee: 30, xp: 16, msgs: ['Mexicana! Guacamole, jalapeños och chipotle.', 'Något med guacamole, tack.'] });
menu('bla', 'Blue cheese-burgaren', [2005, 2026], [3, 4], [L('biff', ids('biff-angus', 'biff-150', 'biff-180', 'biff-chuck')), L('ost', ids('ost-bla')), L('gront', ids('karamelliserad-lok', 'lok')), L('gront', ids('ruccola', 'sallad')), L('sas', ids('majonnas', 'aioli'))],
  { fee: 32, xp: 18, msgs: ['Blåmögelost på en stor biff – vuxenburgaren.', 'Blue cheese, tack. Och karamelliserad lök om ni har.'] });
menu('caprese', 'Capreseburgaren', [2005, 2026], [3, 4], [L('biff', ids('biff-90', 'biff-120', 'biff-kyckling-grill')), L('ost', ids('ost-mozzarella')), L('gront', ids('tomat', 'grillad-tomat')), L('gront', ids('basilika')), L('sas', ids('pesto', 'balsamico'))],
  { fee: 28, xp: 14, msgs: ['Caprese – mozzarella, tomat och basilika på ciabatta.'], bread: ids('brod-ciabatta', 'brod-focaccia', 'brod-vitlok') });
menu('buffalo', 'Buffalo chicken', [2005, 2026], [3, 4], [L('biff', ids('biff-kyckling-spicy', 'biff-kyckling')), L('gront', ids('sallad')), L('sas', ids('buffalo')), L('sas', ids('blue-cheese', 'ranch'))],
  { fee: 28, xp: 14, msgs: ['Buffalo chicken – som vingarna fast i bröd!', 'Buffalosås och blue cheese-dressing, tack.'] });
menu('chorizo', 'Chorizoburgaren', [2005, 2026], [3, 4], [L('biff', ids('biff-chorizo')), L('ost', ids('ost-monterey', 'ost-pepperjack')), L('extra', ids('grillad-paprika')), L('gront', ids('ruccola', 'sallad')), L('sas', ids('aioli'))],
  { fee: 30, xp: 15, msgs: ['Chorizo med grillad paprika och aioli – spanskt!'] });
menu('hangover', 'Bakfylleburgaren', [2005, 2026], [3, 4], [L('biff', ids('biff-150', 'biff-180')), L('ost', ids('ost-cheddar', 'ost-amerikansk')), L('extra', ids('bacon')), L('extra', ids('stekt-agg')), L('extra', ids('hashbrown')), L('sas', ids('hotsauce', 'chiliketchup', 'majonnas'))],
  { fee: 36, xp: 18, msgs: ['Allt på en gång: ägg, bacon och hash brown.', 'Jag behöver en burgare som räddar dagen.'] });
menu('bagel', 'Bagelburgaren', [2005, 2026], [3, 4], [L('biff', ids('biff-90', 'biff-120', 'biff-kyckling-grill')), L('ost', ids('ost-farskost')), L('gront', ids('rodlok')), L('gront', ids('tomat'))],
  { fee: 26, xp: 13, msgs: ['På bagel med färskost, tack.', 'New York-frukost: bagel med biff.'], bread: ids('brod-bagel') });
menu('torsk', 'Torskburgaren', [2005, 2026], [3, 4], [L('biff', ids('biff-torsk')), L('gront', ids('krispsallad', 'sallad')), L('gront', ids('gurka')), L('sas', ids('remoulad', 'tartar', 'aioli'))],
  { fee: 30, xp: 15, msgs: ['Grillad torsk i bröd – med remoulad.'] });
menu('ren', 'Renburgaren', [2005, 2026], [4, 5], [L('biff', ids('biff-ren')), L('ost', ids('ost-vasterbotten', 'ost-prast', 'ost-rokt')), L('extra', ids('champinjoner'), 0.5), L('gront', ids('karamelliserad-lok', 'stekt-lok')), L('sas', ids('lingon'))],
  { fee: 44, xp: 22, msgs: ['Ren med Västerbottensost och lingon – Norrland på bricka.', 'Renburgaren, tack. Med lingon!'] });
menu('raka', 'Räkburgare', [2006, 2026], [3, 4], [L('biff', ids('biff-raka')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('gurka')), L('sas', ids('aioli', 'remoulad', 'sriracha'))],
  { fee: 30, xp: 16, msgs: ['Räkburgare med aioli!', 'Skaldjur! Har ni räkburgare?'] });
menu('spicy', 'Spicy chicken', [2008, 2026], [3, 4], [L('biff', ids('biff-kyckling-spicy')), L('extra', ids('jalapeno'), 0.7), L('gront', ids('sallad', 'romansallad')), L('gront', ids('saltgurka'), 0.6), L('sas', ids('sriracha', 'chipotle', 'hotsauce', 'ranch'))],
  { fee: 28, xp: 14, msgs: ['Spicy chicken – så het ni vågar göra den!', 'Kyckling med hetta, tack.'] });
menu('taco', 'Tacoburgaren', [2008, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-pepperjack', 'ost-cheddar')), L('extra', ids('tomatsalsa')), L('extra', ids('nachos')), L('extra', ids('guacamole'), 0.6), L('gront', ids('sallad')), L('sas', ids('chipotle', 'hotsauce', 'majonnas'))],
  { fee: 30, xp: 16, msgs: ['Tacoburgare – salsa, nachos och guacamole i burgaren!', 'Fredagsmys: tacoburgaren.'] });
menu('aussie', 'Aussieburgaren', [2008, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-cheddar'), 0.5), L('extra', ids('bacon')), L('extra', ids('stekt-agg')), L('extra', ids('ananas'), 0.5), L('gront', ids('rodbeta')), L('gront', ids('sallad')), L('sas', ids('bbq', 'ketchup'))],
  { fee: 34, xp: 18, msgs: ['Rödbeta, ägg och bacon – som i Australien!', 'En Aussie burger med "the lot"!'] });
menu('naan', 'Naanburgaren', [2008, 2026], [3, 4], [L('biff', ids('biff-kyckling-grill', 'biff-lamm', 'biff-kofta')), L('gront', ids('gurka')), L('gront', ids('rodlok')), L('gront', ids('koriander'), 0.5), L('sas', ids('mango-chutney', 'curry', 'yoghurtsas'))],
  { fee: 28, xp: 14, msgs: ['Indisk – på naanbröd med mangochutney.'], bread: ids('brod-naan') });
menu('brie', 'Brieburgaren', [2008, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-brie')), L('extra', ids('bacon'), 0.5), L('gront', ids('ruccola', 'spenat')), L('sas', ids('honungssenap', 'fikonmarmelad'))],
  { fee: 30, xp: 15, msgs: ['Brie på burgaren, med honungssenap.'] });
menu('tonfisk', 'Tonfiskburgaren', [2008, 2026], [4, 5], [L('biff', ids('biff-tonfisk')), L('extra', ids('avokado'), 0.6), L('gront', ids('gurka')), L('gront', ids('ruccola')), L('sas', ids('wasabimajo', 'teriyaki', 'aioli'))],
  { fee: 38, xp: 20, msgs: ['Tonfisk – rosa i mitten, med wasabimajo!'] });
menu('portobello', 'Portobelloburgare', [2009, 2026], [3, 4], [L('biff', ids('biff-portobello')), L('ost', ids('ost-mozzarella', 'ost-brie', 'ost-getost')), L('gront', ids('spenat', 'ruccola')), L('sas', ids('pesto', 'aioli'))],
  { fee: 28, xp: 14, msgs: ['Portobello i stället för biff – vegetariskt!'] });
menu('slider', 'Sliders (mini)', [2008, 2026], [2, 3], [L('biff', ids('biff-slider-60', 'biff-90', 'biff-smash')), L('ost', melt), L('gront', ids('saltgurka')), L('sas', ids('ketchup', 'dressing'))],
  { fee: 18, xp: 10, msgs: ['Små sliders till barnkalaset!', 'En miniburgare bara – jag ska äta middag sen.'], bread: (p) => p.look?.mini, mini: true });

// ---- 2010-tal: gourmet, vego och hela världen ----
menu('halloumi', 'Halloumiburgare', [2010, 2026], [3, 4], [L('biff', ids('biff-halloumi')), L('gront', ids('ruccola', 'sallad', 'spenat')), L('gront', ids('tomat')), L('gront', ids('rodlok')), L('sas', ids('aioli', 'tzatziki', 'pesto'))],
  { fee: 28, xp: 14, msgs: ['Halloumiburgare med aioli!', 'Grillad halloumi – ja tack.'] });
menu('lax', 'Laxburgare', [2010, 2026], [4, 5], [L('biff', ids('biff-lax')), L('extra', ids('avokado'), 0.7), L('gront', ids('spenat', 'ruccola')), L('sas', ids('remoulad', 'aioli', 'tzatziki', 'dillmajo'))],
  { fee: 34, xp: 18, msgs: ['Laxburgare med avokado, tack.'] });
menu('lax-bagel', 'Laxbagel', [2010, 2026], [4, 5], [L('biff', ids('biff-lax')), L('ost', ids('ost-farskost')), L('extra', ids('rokt-lax'), 0.5), L('gront', ids('rodlok')), L('gront', ids('dill')), L('gront', ids('kapris')), L('sas', ids('dillmajo', 'pepparrotsmajo'))],
  { fee: 40, xp: 20, msgs: ['Laxbagel med färskost, kapris och dill!'], bread: ids('brod-bagel') });
menu('elvis', 'Elvisburgaren', [2010, 2026], [3, 4], [L('biff', kind('not')), L('extra', ids('bacon')), L('extra', ids('banan')), L('sas', ids('jordnotssmor'))],
  { fee: 28, xp: 14, msgs: ['Bacon, banan och jordnötssmör – Elvis favorit!', 'Den galna med banan. Jag måste prova.'] });
menu('bison', 'Bisonburgaren', [2010, 2026], [4, 5], [L('biff', ids('biff-bison')), L('ost', ids('ost-cheddar', 'ost-monterey')), L('gront', ids('stekt-lok', 'karamelliserad-lok')), L('gront', ids('saltgurka')), L('sas', ids('bbq', 'carolina-bbq'))],
  { fee: 40, xp: 20, msgs: ['Bison! Magrare än nöt, säger de.'] });
menu('krabba', 'Krabbkaksburgaren', [2010, 2026], [4, 5], [L('biff', ids('biff-krabba')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('tomat'), 0.5), L('sas', ids('remoulad', 'tartar', 'dillmajo'))],
  { fee: 40, xp: 20, msgs: ['Krabbkaka i bröd – som i Maryland!'] });
menu('fish-chips', 'Fish & chips-burgaren', [2010, 2026], [3, 4], [L('biff', ids('biff-fisk', 'biff-torsk')), L('extra', ids('pommes-i')), L('gront', ids('sallad', 'krispsallad')), L('sas', ids('tartar', 'remoulad'))],
  { fee: 30, xp: 15, msgs: ['Fisk, pommes och tartarsås – i bröd!'] });
menu('getost', 'Chèvreburgaren', [2010, 2026], [3, 4], [L('biff', kind('not', 'lamm')), L('ost', ids('ost-getost')), L('gront', ids('karamelliserad-lok')), L('gront', ids('spenat', 'ruccola')), L('sas', ids('honung', 'balsamico', 'fikonmarmelad'))],
  { fee: 32, xp: 16, msgs: ['Chèvre och karamelliserad lök – med honung över.'] });
menu('camembert', 'Friterad camembert-burgaren', [2010, 2026], [4, 5], [L('biff', ids('biff-90', 'biff-120', 'biff-kyckling-grill')), L('ost', ids('ost-camembert')), L('gront', ids('ruccola')), L('sas', ids('fikonmarmelad', 'lingon', 'honung'))],
  { fee: 36, xp: 18, msgs: ['Friterad camembert på biffen – med lingon!'] });
menu('lins', 'Linsburgaren', [2010, 2026], [2, 3], [L('biff', ids('biff-lins')), L('gront', ids('mixsallad', 'sallad')), L('gront', ids('tomat')), L('gront', ids('rodlok')), L('sas', ids('tzatziki', 'yoghurtsas', 'tahini'))],
  { fee: 24, xp: 12, msgs: ['Linsbiff – vegetariskt och mättande.'] });
menu('kofta', 'Koftaburgaren', [2010, 2026], [3, 4], [L('biff', ids('biff-kofta')), L('gront', ids('tomat')), L('gront', ids('rodlok')), L('gront', ids('persilja')), L('sas', ids('tahini', 'tzatziki', 'harissa'))],
  { fee: 30, xp: 15, msgs: ['Lammkofta med tahini – Mellanöstern i bröd.'], bread: flatOrPlain });
menu('loaded', 'Loaded burger', [2010, 2026], [3, 4], [L('biff', kind('not')), L('ost', ids('ost-cheddar', 'ost-ostsas')), L('extra', ids('pommes-i')), L('extra', ids('bacon'), 0.5), L('sas', ids('bbq', 'ketchup'))],
  { fee: 30, xp: 15, msgs: ['Pommes INUTI burgaren!', 'Loaded – med pommes och ostsås i.'] });
menu('glutenfri', 'Glutenfria burgaren', [2010, 2026], [2, 3], [L('biff', ids('biff-90', 'biff-120', 'biff-kyckling-grill')), L('ost', ids('ost-cheddar'), 0.5), L('gront', ids('sallad')), L('gront', ids('tomat')), L('sas', ids('majonnas', 'aioli'))],
  { fee: 26, xp: 13, msgs: ['Glutenfritt bröd, tack – jag tål inte gluten.'], bread: ids('brod-glutenfritt') });
menu('jul', 'Julburgaren', [2010, 2026], [3, 4], [L('biff', ids('biff-kottbulle', 'biff-90', 'biff-120')), L('ost', ids('ost-prast', 'ost-cheddar'), 0.5), L('gront', ids('rodkal')), L('gront', ids('gronkal'), 0.5), L('sas', ids('senap', 'grov-senap', 'lingon'))],
  { fee: 30, xp: 15, msgs: ['Julburgaren – köttbullsbiff, rödkål och senap. Och julmust!', 'God jul! Julburgaren, tack.'], sides: { tillbehor: 0.5, dryck: 0.9 } });
menu('pulled', 'Pulled pork-burgare', [2012, 2026], [3, 4], [L('biff', ids('biff-pulledpork')), L('gront', ids('coleslaw')), L('extra', ids('picklad-rodlok'), 0.6), L('sas', ids('bbq'))],
  { fee: 30, xp: 16, msgs: ['Pulled pork med coleslaw!', 'Långkokt fläsk – jag såg det på nätet.'] });
menu('cubano', 'Cubanoburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-pulledpork')), L('ost', ids('ost-schweizer', 'ost-emmentaler')), L('extra', ids('skinka')), L('gront', ids('saltgurka')), L('sas', ids('senap', 'dijon'))],
  { fee: 32, xp: 16, msgs: ['Cubano – fläsk, skinka, ost och senap, pressad!'], bread: ids('brod-ciabatta', 'brod-klassiskt', 'brod-kaiser', 'brod-baguette') });
menu('gourmet', 'Gourmetburgaren', [2012, 2026], [4, 5], [L('biff', ids('biff-chuck', 'biff-angus', 'biff-180')), L('ost', ids('ost-cheddar', 'ost-brie', 'ost-rokt')), L('gront', ids('karamelliserad-lok')), L('gront', ids('ruccola')), L('sas', ids('tryffelmajo', 'aioli', 'chimichurri'))],
  { fee: 42, xp: 22, msgs: ['Gourmetburgaren – på brioche, tack!', 'Jag vill ha det finaste ni har.'], bread: ids('brod-brioche', 'brod-surdeg', 'brod-potatis'), sides: { tillbehor: 0.7, dryck: 0.7 } });
menu('avokado', 'Avokadoburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-kyckling-grill', 'biff-plant', 'biff-halloumi')), L('extra', ids('avokado')), L('gront', ids('tomat')), L('gront', ids('ruccola', 'spenat')), L('sas', ids('aioli', 'sriracha'))],
  { fee: 30, xp: 16, msgs: ['Något med avokado – brunchburgaren!'] });
menu('teriyaki', 'Teriyakiburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-kyckling-grill', 'biff-90', 'biff-120', 'biff-tofu')), L('extra', ids('ananas'), 0.5), L('gront', ids('sallad', 'gurka')), L('sas', ids('teriyaki'))],
  { fee: 28, xp: 14, msgs: ['Teriyaki – söt soja på burgaren!'] });
menu('tofu', 'Tofuburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-tofu')), L('extra', ids('kimchi'), 0.5), L('gront', ids('coleslaw', 'gurka')), L('sas', ids('teriyaki', 'sriracha', 'gochujang'))],
  { fee: 26, xp: 14, msgs: ['Rökt tofu – vegansk, tack!'], vegan: true });
menu('donut-burger', 'Luther burger', [2012, 2026], [4, 5], [L('biff', kind('not')), L('ost', ids('ost-amerikansk', 'ost-cheddar')), L('extra', ids('bacon'))],
  { fee: 36, xp: 18, msgs: ['Glaserad donut som bröd. Jag har hört att det är gott!', 'Luther burger – för bilden!'], bread: ids('brod-donut') });
menu('umami', 'Umamiburgaren', [2012, 2026], [4, 5], [L('biff', ids('biff-chuck', 'biff-angus', 'biff-150')), L('ost', ids('ost-parmesan')), L('extra', ids('stekt-shiitake', 'champinjoner')), L('gront', ids('grillad-tomat')), L('gront', ids('karamelliserad-lok')), L('sas', ids('tryffelmajo', 'aioli', 'misomajo'))],
  { fee: 44, xp: 22, msgs: ['Umami – svamp, parmesan och grillad tomat.'] });
menu('skagen', 'Skagenburgaren', [2012, 2026], [4, 5], [L('biff', ids('biff-raka', 'biff-lax', 'biff-torsk')), L('gront', ids('sallad', 'romansallad'), 0.5), L('gront', ids('dill')), L('sas', ids('skagenrora'))],
  { fee: 44, xp: 22, msgs: ['Skagenröra på en räkburgare – lyx!', 'Skagen! Räkor och dill.'] });
menu('vildsvin', 'Vildsvinsburgaren', [2012, 2026], [4, 5], [L('biff', ids('biff-vildsvin', 'biff-hjort')), L('ost', ids('ost-rokt', 'ost-cheddar-lagrad'), 0.6), L('extra', ids('bacon'), 0.5), L('gront', ids('balsamicolok', 'karamelliserad-lok')), L('sas', ids('lingon', 'bbq'))],
  { fee: 40, xp: 20, msgs: ['Vildsvin – med balsamicolök och lingon.'] });
menu('vasterbotten', 'Västerbottenburgaren', [2012, 2026], [4, 5], [L('biff', ids('biff-chuck', 'biff-angus', 'biff-150')), L('ost', ids('ost-vasterbotten')), L('gront', ids('karamelliserad-lok')), L('gront', ids('ruccola'), 0.5), L('sas', ids('tryffelmajo', 'dijon', 'honungssenap'))],
  { fee: 40, xp: 20, msgs: ['Västerbottensost på burgaren – norrländskt guld.'] });
menu('rodbeta-vego', 'Rödbetsbiffsburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-rodbeta')), L('ost', ids('ost-getost', 'ost-feta')), L('gront', ids('ruccola', 'spenat')), L('sas', ids('honung', 'aioli'))],
  { fee: 28, xp: 14, msgs: ['Rödbetsbiff med chèvre – rosa och gott!'] });
menu('mango', 'Mangoburgaren', [2012, 2026], [3, 4], [L('biff', ids('biff-kyckling-grill', 'biff-kyckling-spicy', 'biff-raka')), L('extra', ids('mango-salsa')), L('gront', ids('koriander')), L('gront', ids('sallad')), L('sas', ids('sriracha', 'aioli', 'sweetchili'))],
  { fee: 30, xp: 15, msgs: ['Mangosalsa och koriander – tropiskt!'] });
menu('ramen-burger', 'Ramenburgaren', [2013, 2026], [4, 5], [L('biff', ids('biff-90', 'biff-120', 'biff-kyckling-grill')), L('gront', ids('ruccola', 'varlok')), L('sas', ids('teriyaki', 'misomajo', 'sriracha'))],
  { fee: 34, xp: 18, msgs: ['Ramenbröd – nudlar i stället för bröd!'], bread: ids('brod-ramen') });
menu('pretzel', 'Oktoberfestburgaren', [2013, 2026], [3, 4], [L('biff', ids('biff-bratwurst', 'biff-90', 'biff-120')), L('ost', ids('ost-emmentaler', 'ost-schweizer', 'ost-cheddar')), L('extra', ids('surkal'), 0.5), L('gront', ids('lok')), L('sas', ids('dijon', 'grov-senap', 'honungssenap'))],
  { fee: 30, xp: 15, msgs: ['På pretzelbröd med senap – Oktoberfest!'], bread: ids('brod-pretzel') });
menu('banh-mi', 'Bánh mì-burgaren', [2014, 2026], [3, 4], [L('biff', ids('biff-flask', 'biff-kyckling-grill', 'biff-tofu')), L('gront', ids('picklad-morot')), L('gront', ids('gurka')), L('gront', ids('koriander')), L('gront', ids('chili-farsk'), 0.5), L('sas', ids('sriracha'))],
  { fee: 30, xp: 15, msgs: ['Bánh mì – picklade morötter, koriander och sriracha.'], bread: ids('brod-baguette', 'brod-ciabatta', 'brod-klassiskt') });
menu('tempeh', 'Tempehburgaren', [2014, 2026], [3, 4], [L('biff', ids('biff-tempeh')), L('gront', ids('picklad-morot')), L('gront', ids('koriander')), L('gront', ids('gurka')), L('sas', ids('sriracha', 'hoisin', 'teriyaki'))],
  { fee: 28, xp: 14, msgs: ['Tempeh – vegansk och fermenterad!'], vegan: true });
menu('brunch-vaffla', 'Våffelburgaren', [2014, 2026], [4, 5], [L('biff', ids('biff-smash', 'biff-90', 'biff-kyckling')), L('ost', ids('ost-amerikansk')), L('extra', ids('stekt-agg')), L('extra', ids('bacon', 'sidflask')), L('sas', ids('hollandaise', 'hot-honey', 'honung'))],
  { fee: 36, xp: 18, msgs: ['Brunch: våffelbröd, ägg och bacon!', 'Våffla som bröd – jag såg den på Instagram.'], bread: ids('brod-vaffla') });
menu('lowcarb', 'Low carb-burgaren', [2015, 2026], [3, 4], [L('biff', ids('biff-150', 'biff-kyckling-grill', 'biff-angus')), L('ost', ids('ost-cheddar', 'ost-amerikansk')), L('gront', ids('tomat')), L('gront', ids('rodlok')), L('sas', ids('aioli', 'majonnas'))],
  { fee: 28, xp: 14, msgs: ['Utan bröd! I ett salladsblad i stället.', 'Low carb – salladsblad som bröd, tack.'], bread: ids('brod-sallad'), sides: { tillbehor: 0.3, dryck: 0.6 } });
menu('bao', 'Baoburgaren', [2015, 2026], [3, 4], [L('biff', ids('biff-pulledpork', 'biff-pulled-chicken', 'biff-anka')), L('gront', ids('gurka')), L('gront', ids('varlok', 'koriander')), L('sas', ids('hoisin', 'gochujang', 'sriracha'))],
  { fee: 30, xp: 15, msgs: ['Bao – ångat bröd med pulled pork och hoisin.'], bread: ids('brod-bao') });
menu('shawarma', 'Shawarmaburgaren', [2015, 2026], [3, 4], [L('biff', ids('biff-kyckling-grill', 'biff-kyckling-lar', 'biff-lamm')), L('gront', ids('tomat')), L('gront', ids('saltgurka')), L('gront', ids('rodlok')), L('sas', ids('tahini', 'vitlokssas', 'harissa'))],
  { fee: 28, xp: 14, msgs: ['Shawarma i bröd – med tahini och vitlök.'], bread: flatOrPlain });
menu('krafta', 'Kräftburgaren', [2015, 2026], [4, 5], [L('biff', ids('biff-raka', 'biff-lax')), L('extra', ids('kraftstjartar')), L('gront', ids('dill')), L('sas', ids('dillmajo', 'aioli'))],
  { fee: 46, xp: 22, msgs: ['Kräftstjärtar och dill – augustiburgaren!', 'Kräftskiva i bröd!'] });
menu('seitan', 'Seitanburgaren', [2015, 2026], [3, 4], [L('biff', ids('biff-seitan')), L('ost', ids('ost-vegansk', 'ost-cheddar-vegansk'), 0.5), L('gront', ids('sallad')), L('gront', ids('tomat')), L('gront', ids('picklad-rodlok', 'rodlok')), L('sas', ids('vegansk-majo', 'aioli', 'chipotle'))],
  { fee: 28, xp: 14, msgs: ['Seitan – segt som kött, helt veganskt.'], vegan: true });
menu('halloumi-fikon', 'Halloumi & fikon', [2015, 2026], [4, 5], [L('biff', ids('biff-halloumi')), L('gront', ids('ruccola')), L('gront', ids('rodlok')), L('sas', ids('fikonmarmelad')), L('sas', ids('honung'), 0.5)],
  { fee: 32, xp: 16, msgs: ['Halloumi med fikonmarmelad – sött och salt!'] });
menu('smash', 'Smash Classic', [2016, 2026], [3, 4], [L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('gront', ids('saltgurka')), L('gront', ids('lok')), L('sas', ids('dressing'))],
  { fee: 26, xp: 14, msgs: ['Smash! Tunn biff, knaprig kant.', 'En smashburgare på potatisbröd, tack.'], bread: ids('brod-potatis', 'brod-klassiskt', 'brod-sesam') });
menu('smash-dubbel', 'Dubbel smash', [2016, 2026], [3, 4], [L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('gront', ids('picklad-rodlok', 'saltgurka')), L('sas', ids('dressing', 'chipotle'))],
  { fee: 32, xp: 18, msgs: ['Dubbel smash – två tunna biffar!'], bread: ids('brod-potatis', 'brod-klassiskt', 'brod-sesam') });
menu('svart', 'Svarta burgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-150', 'biff-angus', 'biff-chuck')), L('ost', ids('ost-cheddar')), L('extra', ids('bacon')), L('extra', ids('jalapeno'), 0.6), L('sas', ids('bbq', 'chipotle'))],
  { fee: 36, xp: 20, msgs: ['Den svarta burgaren – med kolbröd!', 'Jag såg bilden på nätet. Det svarta brödet!'], bread: ids('brod-svart') });
menu('mac', 'Mac & cheese-burgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-150', 'biff-180', 'biff-chuck')), L('extra', ids('mac-cheese')), L('extra', ids('bacon')), L('sas', ids('bbq', 'chipotle'))],
  { fee: 38, xp: 20, msgs: ['Mac & cheese PÅ burgaren. Ja.', 'Den galna med makaroner!'] });
menu('sushi', 'Sushiburgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-lax', 'biff-tonfisk')), L('extra', ids('avokado')), L('gront', ids('gurka')), L('sas', ids('wasabimajo', 'teriyaki', 'sriracha'))],
  { fee: 44, xp: 22, msgs: ['Sushiburgare – risbullar som bröd, lax och wasabi!'], bread: ids('brod-ris') });
menu('katsu', 'Katsuburgaren', [2016, 2026], [3, 4], [L('biff', ids('biff-katsu')), L('gront', ids('vitkal')), L('sas', ids('tonkatsu')), L('sas', ids('misomajo', 'wasabimajo', 'majonnas'), 0.5)],
  { fee: 30, xp: 15, msgs: ['Katsu – pankopanerad kyckling med tonkatsusås och kål.'], bread: ids('brod-mjolkbrod', 'brod-klassiskt', 'brod-potatis', 'brod-brioche') });
menu('anka', 'Ankburgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-anka')), L('gront', ids('gurka')), L('gront', ids('varlok')), L('sas', ids('hoisin'))],
  { fee: 44, xp: 22, msgs: ['Pekinganka som burgare – med hoisin och gurka.'], bread: ids('brod-bao', 'brod-brioche', 'brod-klassiskt') });
menu('bacon-jam', 'Bacon jam-burgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-chuck', 'biff-angus', 'biff-smash')), L('ost', ids('ost-cheddar-lagrad', 'ost-cheddar')), L('extra', ids('bacon-jam')), L('gront', ids('ruccola')), L('sas', ids('aioli'), 0.5)],
  { fee: 38, xp: 19, msgs: ['Baconmarmelad – sött, salt och rökigt.'] });
menu('svamp', 'Svampburgaren', [2016, 2026], [3, 4], [L('biff', ids('biff-svamp', 'biff-portobello')), L('ost', ids('ost-gruyere', 'ost-schweizer'), 0.6), L('gront', ids('spenat', 'ruccola')), L('sas', ids('tryffelmajo', 'aioli', 'misomajo'))],
  { fee: 30, xp: 15, msgs: ['Svampbiff med gruyère – skogens burgare.'] });
menu('knas', 'Knasburgaren', [2016, 2026], [3, 4], [L('biff', ids('biff-smash', 'biff-90')), L('ost', ids('ost-amerikansk')), L('extra', ids('chips-krossade')), L('gront', ids('saltgurka')), L('sas', ids('dressing', 'sriracha'))],
  { fee: 26, xp: 13, msgs: ['Med krossade chips i – för knaset!'] });
menu('persika', 'Persikoburgaren', [2016, 2026], [4, 5], [L('biff', ids('biff-kyckling-lar', 'biff-kyckling-grill', 'biff-halloumi')), L('ost', ids('ost-brie', 'ost-getost'), 0.5), L('extra', ids('grillad-persika')), L('gront', ids('ruccola')), L('sas', ids('hot-honey', 'honung', 'balsamico'))],
  { fee: 34, xp: 17, msgs: ['Grillad persika på burgaren – sommar!'] });
menu('jackfruit', 'Pulled jackfruit-burgaren', [2017, 2026], [3, 4], [L('biff', ids('biff-jackfruit')), L('gront', ids('coleslaw')), L('extra', ids('picklad-rodlok'), 0.6), L('sas', ids('bbq', 'vegansk-majo'))],
  { fee: 28, xp: 14, msgs: ['Pulled jackfruit – vegansk pulled pork!'], vegan: true });
menu('tryffel', 'Tryffelburgaren', [2018, 2026], [5, 5], [L('biff', ids('biff-wagyu', 'biff-chuck', 'biff-dryaged')), L('ost', ids('ost-raclette', 'ost-brie', 'ost-tryffel')), L('extra', ids('tryffelost-krisp', 'tryffelskivor')), L('gront', ids('ruccola')), L('sas', ids('tryffelmajo'))],
  { fee: 58, xp: 28, msgs: ['Tryffelburgaren. Pengar spelar ingen roll.', 'Wagyu och tryffel – det ska firas!'], bread: ids('brod-brioche', 'brod-surdeg'), sides: { tillbehor: 0.8, dryck: 0.8 } });
menu('wagyu', 'Wagyuburgaren', [2018, 2026], [5, 5], [L('biff', ids('biff-wagyu')), L('ost', ids('ost-cheddar-lagrad', 'ost-vasterbotten'), 0.5), L('gront', ids('karamelliserad-lok')), L('sas', ids('tryffelmajo', 'misomajo', 'chimichurri'))],
  { fee: 70, xp: 32, msgs: ['Wagyu. Bara wagyu. Och kanske lite tryffelmajo.'], bread: ids('brod-brioche', 'brod-mjolkbrod', 'brod-potatis'), sides: { tillbehor: 0.8, dryck: 0.8 } });
menu('korean', 'Koreanska burgaren', [2018, 2026], [4, 5], [L('biff', ids('biff-kyckling-korean', 'biff-kyckling-spicy', 'biff-150', 'biff-plant')), L('extra', ids('kimchi')), L('gront', ids('gurka')), L('sas', ids('gochujang', 'sriracha', 'kimchimajo'))],
  { fee: 34, xp: 18, msgs: ['Koreansk med kimchi och gochujang!'] });
menu('nashville', 'Nashville hot', [2018, 2026], [4, 5], [L('biff', ids('biff-nashville')), L('gront', ids('saltgurka')), L('gront', ids('coleslaw')), L('sas', ids('majonnas', 'ranch'))],
  { fee: 34, xp: 17, msgs: ['Nashville hot chicken – jag tål hetta!'], bread: ids('brod-potatis', 'brod-brioche', 'brod-klassiskt') });
menu('smash-trippel', 'Trippel smash', [2018, 2026], [4, 5], [L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('biff', ids('biff-smash')), L('ost', ids('ost-amerikansk')), L('gront', ids('picklad-rodlok', 'saltgurka')), L('sas', ids('dressing'))],
  { fee: 40, xp: 20, msgs: ['Trippel smash – tre tunna biffar med ost emellan!'], bread: ids('brod-potatis', 'brod-klassiskt') });
menu('burrata', 'Burrataburgaren', [2018, 2026], [5, 5], [L('biff', ids('biff-angus', 'biff-chuck', 'biff-dryaged')), L('ost', ids('ost-burrata')), L('gront', ids('grillad-tomat', 'tomat')), L('gront', ids('basilika')), L('sas', ids('pesto', 'balsamico'))],
  { fee: 52, xp: 24, msgs: ['Burrata på burgaren – den rinner när man biter!'], bread: ids('brod-brioche', 'brod-ciabatta', 'brod-focaccia') });
menu('plant', 'Plantburgaren', [2019, 2026], [3, 4], [L('biff', ids('biff-plant', 'biff-kyckling-plant')), L('ost', ids('ost-vegansk', 'ost-cheddar-vegansk')), L('gront', ids('sallad', 'romansallad')), L('gront', ids('picklad-rodlok', 'rodlok')), L('sas', ids('aioli', 'chipotle', 'dressing', 'vegansk-majo'))],
  { fee: 30, xp: 16, msgs: ['Helt vegansk, tack – plantbaserad biff och vegansk ost.', 'Kan ni göra den helt utan djur?'], vegan: true });
menu('blend', 'Blendburgaren', [2019, 2026], [3, 4], [L('biff', ids('biff-blend')), L('ost', ids('ost-cheddar')), L('gront', ids('karamelliserad-lok')), L('gront', ids('ruccola')), L('sas', ids('aioli', 'dijon'))],
  { fee: 30, xp: 15, msgs: ['Halv svamp, halv kött – för klimatet.'] });
menu('raclette', 'Racletteburgaren', [2019, 2026], [4, 5], [L('biff', ids('biff-chuck', 'biff-angus', 'biff-smash')), L('ost', ids('ost-raclette')), L('gront', ids('saltgurka', 'silverlok')), L('gront', ids('karamelliserad-lok'), 0.5), L('sas', ids('dijon', 'grov-senap'))],
  { fee: 40, xp: 20, msgs: ['Raclette skrapad över biffen – schweizisk lyx.'] });
menu('rosa', 'Rosa burgaren', [2019, 2026], [4, 5], [L('biff', ids('biff-rodbeta', 'biff-plant', 'biff-halloumi')), L('ost', ids('ost-getost', 'ost-feta')), L('gront', ids('ruccola')), L('sas', ids('honung', 'balsamico'))],
  { fee: 32, xp: 16, msgs: ['Rosa bröd, rosa biff – för bilden!'], bread: ids('brod-rodbeta') });
menu('hot-honey', 'Hot honey chicken', [2020, 2026], [4, 5], [L('biff', ids('biff-nashville', 'biff-kyckling-spicy', 'biff-kyckling-korean')), L('gront', ids('saltgurka')), L('gront', ids('coleslaw'), 0.5), L('sas', ids('hot-honey')), L('sas', ids('ranch'), 0.5)],
  { fee: 34, xp: 17, msgs: ['Hot honey på friterad kyckling – sött och hett!'] });
menu('plant-dubbel', 'Dubbel plantburgare', [2020, 2026], [4, 5], [L('biff', ids('biff-plant')), L('ost', ids('ost-cheddar-vegansk')), L('biff', ids('biff-plant')), L('ost', ids('ost-cheddar-vegansk')), L('extra', ids('vegansk-bacon'), 0.6), L('gront', ids('saltgurka')), L('sas', ids('vegansk-majo', 'dressing'))],
  { fee: 38, xp: 19, msgs: ['Dubbel plant med veganskt bacon – ingen märker skillnad!'], vegan: true });
menu('kimchi-cheese', 'Kimchi cheese', [2020, 2026], [4, 5], [L('biff', ids('biff-smash', 'biff-chuck')), L('ost', ids('ost-amerikansk', 'ost-cheddar')), L('extra', ids('kimchi')), L('sas', ids('kimchimajo', 'gochujang'))],
  { fee: 32, xp: 16, msgs: ['Kimchi och smält ost – syrligt och hett.'] });
menu('japan', 'Japanska burgaren', [2020, 2026], [4, 5], [L('biff', ids('biff-katsu', 'biff-kyckling-lar', 'biff-wagyu')), L('gront', ids('vitkal')), L('sas', ids('tonkatsu', 'misomajo', 'wasabimajo'))],
  { fee: 36, xp: 18, msgs: ['På mjölkbröd med tonkatsusås – Tokyo!'], bread: ids('brod-mjolkbrod', 'brod-bao') });
menu('chili-crisp', 'Chili crisp-burgaren', [2021, 2026], [4, 5], [L('biff', ids('biff-smash', 'biff-plant', 'biff-kyckling-korean')), L('ost', ids('ost-amerikansk'), 0.5), L('gront', ids('gurka')), L('gront', ids('varlok')), L('sas', ids('chili-crisp')), L('sas', ids('kimchimajo', 'misomajo'))],
  { fee: 34, xp: 17, msgs: ['Chili crisp över allt – knaprigt och hett!'] });
menu('vegansk-fisk', 'Vegansk fiskburgare', [2022, 2026], [4, 5], [L('biff', ids('biff-vegansk-fisk')), L('gront', ids('sallad')), L('gront', ids('gurka')), L('sas', ids('vegansk-majo', 'tartar', 'remoulad'))],
  { fee: 30, xp: 15, msgs: ['Vegansk "fisk" – smakar hav utan fisk.'], vegan: true });
menu('dryaged', 'Dry aged deluxe', [2022, 2026], [5, 5], [L('biff', ids('biff-dryaged', 'biff-wagyu')), L('ost', ids('ost-raclette', 'ost-cheddar')), L('gront', ids('karamelliserad-lok')), L('sas', ids('chimichurri', 'tryffelmajo'))],
  { fee: 62, xp: 30, msgs: ['Dry aged – hängmörat i 40 dagar, står det på skylten.'], bread: ids('brod-brioche', 'brod-surdeg'), sides: { tillbehor: 0.8, dryck: 0.9 } });

export const TEMPLATES = T;
export const TEMPLATE = Object.fromEntries(T.map((t) => [t.id, t]));
export const templatesFor = (year) => T.filter((t) => year >= t.years[0] && year <= t.years[1]);

// ---------- Sätta ihop en beställning ur en meny ----------
const okBread = (t) => (t.bread ? t.bread : plainBread);
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
