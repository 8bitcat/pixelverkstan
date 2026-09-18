// Tjänster: kunder som inte vill ha en ny dator utan hjälp med den de har. Varje tjänst
// (utom systeminstallation) kräver en pryl i verkstaden (upgrades.js, gruppen verkstad).
// Utförs av spelaren från beställningskortet eller av en tekniker. Ingen DOM här.
export const SERVICES = [
  { id: 'install', name: 'Systeminstallation', icon: '💽', year: 1983, fee: 300, time: 25, needs: null, stat: 'service', desc: 'Operativsystem, drivrutiner och program på plats.',
    msgs: ['Kan ni installera systemet åt mig? Jag vågar inte själv.', 'Disketterna kom med datorn, men jag fattar ingenting.', 'Den nya disken är tom – kan ni lägga in allt?'] },
  { id: 'data', name: 'Dataräddning', icon: '🧲', year: 1990, fee: 900, time: 40, needs: 'dataradd', stat: 'service', desc: 'Hårddisken klickar. Rädda det som går.',
    msgs: ['Hårddisken klickar och min uppsats ligger på den!', 'Bilderna från semestern – snälla, rädda dem.', 'Bokföringen ligger på disken som dog i går.'] },
  { id: 'virus', name: 'Virussanering', icon: '🦠', year: 1996, fee: 500, time: 30, needs: 'antivirus', stat: 'service', desc: 'Popuper, seghet och konstiga mejl.',
    msgs: ['Det poppar upp saker hela tiden och den är segare än sirap.', 'Min son laddade ner något. Nu skickar datorn mejl själv.', 'Alla ikoner har blivit rosa. Är det ett virus?'] },
  { id: 'natverk', name: 'Nätverksinstallation', icon: '🔌', year: 1998, fee: 1200, time: 45, needs: 'natverkskit', stat: 'service', desc: 'Kablar, router och delad skrivare.',
    msgs: ['Vi vill ha nätverk hemma så att alla kan skriva ut.', 'Kontoret ska kopplas ihop – tre datorer och en skrivare.', 'Kan ni dra kabel till pojkrummet? Han vill spela mot kompisarna.'] },
  { id: 'kylning', name: 'Vattenkylning', icon: '💧', year: 2008, fee: 1500, time: 50, needs: 'kylstation', stat: 'bygg', desc: 'Tyst, kallt och snyggt.',
    msgs: ['Den låter som en dammsugare – kan ni sätta vattenkylning?', 'Jag vill ha en custom loop med RGB i slangarna.'] },
];
export const SERVICE = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
export const servicesFor = (year) => SERVICES.filter((s) => s.year <= year);
export const canDo = (game, s) => !!s && (!s.needs || !!game.fit?.items?.[s.needs]);
const rnd = (a) => a[Math.floor(Math.random() * a.length)];

// en kund med ett jobb; ibland ett som butiken inte har utrustning för (efterfrågantavlan)
export function serviceOrder(game, names) {
  const list = servicesFor(game.year);
  if (!list.length) return null;
  const can = list.filter((s) => canDo(game, s)), cant = list.filter((s) => !canDo(game, s));
  const pool = cant.length && Math.random() < 0.3 ? cant : can;
  if (!pool.length) return null;
  const s = rnd(pool), idx = game.priceIdx || 1;
  return { template: 'tjanst', service: s.id, title: s.name, name: rnd(names), msg: rnd(s.msgs), items: [], year: game.year, price: Math.round(s.fee * idx / 50) * 50 };
}
