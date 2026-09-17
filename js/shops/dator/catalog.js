// Datorbutikens kategorier, epoker och beskrivningar.
// Själva delarna (5000+, 1983–2026) ligger i parts/<kategori>.js och laddas av parts/index.js.
// PARTS nedan är de ursprungliga moderna delarna – används som reserv om en kategorifil saknas.

export const CATS = {
  case:    { name: 'Chassi', icon: '🗄️', color: '#6b7684' },
  mb:      { name: 'Moderkort', icon: '🟩', color: '#2f8f46' },
  cpu:     { name: 'Processor (CPU)', icon: '🧠', color: '#2c6fb7' },
  cooler:  { name: 'CPU-kylare', icon: '❄️', color: '#58a6c9' },
  ram:     { name: 'RAM-minne', icon: '📏', color: '#c9323a' },
  storage: { name: 'Hårddisk/SSD', icon: '💾', color: '#7a5bc9' },
  media:   { name: 'Diskett/CD/DVD', icon: '💿', color: '#b88a3e' },
  gpu:     { name: 'Grafikkort', icon: '🎮', color: '#3f9b3a' },
  sound:   { name: 'Ljudkort', icon: '🔊', color: '#c86a2a' },
  psu:     { name: 'Nätaggregat', icon: '🔌', color: '#e0a02a' },
  fans:    { name: 'Chassifläktar', icon: '🌀', color: '#8fa3b8' },
};

export const CAT_ORDER = ['case', 'mb', 'cpu', 'cooler', 'ram', 'storage', 'media', 'gpu', 'sound', 'psu', 'fans'];

// Epoker (visas i HUD och när ett nytt år börjar)
export const ERAS = [
  { from: 1983, title: 'PC-klonernas tid', emoji: '💾' },
  { from: 1987, title: '386 och VGA', emoji: '🖥️' },
  { from: 1991, title: 'Multimedia och DOOM', emoji: '💿' },
  { from: 1996, title: '3D-kort och internet', emoji: '🌐' },
  { from: 2000, title: 'Gigahertz-kriget', emoji: '⚡' },
  { from: 2005, title: 'Flera kärnor', emoji: '🧠' },
  { from: 2010, title: 'SSD-revolutionen', emoji: '🚀' },
  { from: 2017, title: 'Ryzen och RGB', emoji: '🌈' },
  { from: 2021, title: 'AI och ray tracing', emoji: '🤖' },
];
export const eraOf = (y) => [...ERAS].reverse().find((e) => y >= e.from) || ERAS[0];

// Äldre nivåsystem (behålls för sparfiler); spelet använder årtal
export const LEVELS = [
  { xp: 0, title: 'Garagebutik' },
  { xp: 45, title: 'Kvartersbutik' },
  { xp: 130, title: 'Datorbutik' },
  { xp: 260, title: 'Proffsbutik' },
  { xp: 440, title: 'Megastore' },
];

const P = [];
const add = (cat, id, name, cost, lvl, spec, look = {}) => P.push({ cat, id, name, cost, lvl, rgb: false, ...spec, look });

// ---- Processorer ----
add('cpu', 'i3-12100', 'Intel Core i3-12100', 1100, 1, { socket: 'LGA1700', cores: 4, watt: 60, igpu: true, tier: 1 }, { brand: 'intel' });
add('cpu', 'r5-5600g', 'AMD Ryzen 5 5600G', 1300, 1, { socket: 'AM4', cores: 6, watt: 65, igpu: true, tier: 1 }, { brand: 'amd' });
add('cpu', 'r5-5600', 'AMD Ryzen 5 5600', 1150, 2, { socket: 'AM4', cores: 6, watt: 65, igpu: false, tier: 2 }, { brand: 'amd' });
add('cpu', 'i5-13400f', 'Intel Core i5-13400F', 2100, 2, { socket: 'LGA1700', cores: 10, watt: 65, igpu: false, tier: 2 }, { brand: 'intel' });
add('cpu', 'r5-7600', 'AMD Ryzen 5 7600', 2200, 3, { socket: 'AM5', cores: 6, watt: 65, igpu: true, tier: 3 }, { brand: 'amd' });
add('cpu', 'i7-14700k', 'Intel Core i7-14700K', 4300, 4, { socket: 'LGA1700', cores: 20, watt: 190, igpu: true, tier: 4 }, { brand: 'intel' });
add('cpu', 'r7-9800x3d', 'AMD Ryzen 7 9800X3D', 5200, 4, { socket: 'AM5', cores: 8, watt: 120, igpu: true, tier: 4 }, { brand: 'amd' });
add('cpu', 'ultra7-265k', 'Intel Core Ultra 7 265K', 3900, 4, { socket: 'LGA1851', cores: 20, watt: 125, igpu: true, tier: 4 }, { brand: 'intel', ultra: true });
add('cpu', 'ultra9-285k', 'Intel Core Ultra 9 285K', 6300, 5, { socket: 'LGA1851', cores: 24, watt: 250, igpu: true, tier: 5 }, { brand: 'intel', ultra: true });
add('cpu', 'r9-9950x3d', 'AMD Ryzen 9 9950X3D', 7400, 5, { socket: 'AM5', cores: 16, watt: 170, igpu: true, tier: 5 }, { brand: 'amd' });

// ---- Moderkort ----
add('mb', 'prime-h610m-e', 'ASUS PRIME H610M-E D4', 900, 1, { socket: 'LGA1700', ram: 'DDR4', size: 'mATX', tier: 1 }, { pcb: '#2e6b3c', accent: '#8fa3b8' });
add('mb', 'b550m-pro-vdh', 'MSI B550M PRO-VDH WIFI', 1100, 1, { socket: 'AM4', ram: 'DDR4', size: 'mATX', tier: 1 }, { pcb: '#2b2f36', accent: '#9aa4ae' });
add('mb', 'pro-b760m-p', 'MSI PRO B760M-P DDR4', 1200, 2, { socket: 'LGA1700', ram: 'DDR4', size: 'mATX', tier: 2 }, { pcb: '#2b2f36', accent: '#c0c6cc' });
add('mb', 'b650-gaming-x', 'Gigabyte B650 GAMING X AX', 2000, 3, { socket: 'AM5', ram: 'DDR5', size: 'ATX', tier: 3 }, { pcb: '#23262b', accent: '#e07a2e' });
add('mb', 'tuf-z790-plus', 'ASUS TUF GAMING Z790-PLUS WIFI', 3200, 4, { socket: 'LGA1700', ram: 'DDR5', size: 'ATX', tier: 4 }, { pcb: '#262626', accent: '#d8b24a' });
add('mb', 'b850-tomahawk', 'MSI MAG B850 TOMAHAWK WIFI', 2900, 4, { socket: 'AM5', ram: 'DDR5', size: 'ATX', tier: 4 }, { pcb: '#1f2124', accent: '#8a9199' });
add('mb', 'pro-z890-a', 'MSI PRO Z890-A WIFI', 2800, 4, { socket: 'LGA1851', ram: 'DDR5', size: 'ATX', tier: 4 }, { pcb: '#202226', accent: '#aab1b8' });
add('mb', 'z890-strix-e', 'ASUS ROG STRIX Z890-E GAMING WIFI', 5600, 5, { socket: 'LGA1851', ram: 'DDR5', size: 'ATX', tier: 5, rgb: true }, { pcb: '#1b1d22', accent: '#c9323a' });
add('mb', 'x870e-hero', 'ASUS ROG CROSSHAIR X870E HERO', 7200, 5, { socket: 'AM5', ram: 'DDR5', size: 'ATX', tier: 5, rgb: true }, { pcb: '#18191d', accent: '#b8bcc2' });

// ---- RAM ----
add('ram', 'fury-8-ddr4', 'Kingston FURY Beast 8GB DDR4', 250, 1, { type: 'DDR4', gb: 8, sticks: 1, tier: 1 }, { color: '#1e1e1e', accent: '#c9323a', style: 'fury' });
add('ram', 'lpx-16-ddr4', 'Corsair Vengeance LPX 16GB DDR4', 450, 1, { type: 'DDR4', gb: 16, sticks: 2, tier: 2 }, { color: '#1b1b1b', accent: '#e8c030', style: 'lpx' });
add('ram', 'fury-rgb-16-ddr4', 'Kingston FURY Beast RGB 16GB DDR4', 550, 2, { type: 'DDR4', gb: 16, sticks: 2, tier: 2, rgb: true }, { color: '#1e1e1e', accent: '#c9323a', style: 'fury' });
add('ram', 'fury-16-ddr5', 'Kingston FURY Beast 16GB DDR5', 650, 3, { type: 'DDR5', gb: 16, sticks: 2, tier: 3 }, { color: '#1e1e1e', accent: '#c9323a', style: 'fury' });
add('ram', 'vengeance-32-ddr5', 'Corsair Vengeance 32GB DDR5', 1150, 3, { type: 'DDR5', gb: 32, sticks: 2, tier: 4 }, { color: '#26282c', accent: '#e8c030', style: 'lpx' });
add('ram', 'vengeance-rgb-32-ddr5', 'Corsair Vengeance RGB 32GB DDR5', 1350, 4, { type: 'DDR5', gb: 32, sticks: 2, tier: 4, rgb: true }, { color: '#e9e9e6', accent: '#9aa0a6', style: 'rgbbar' });
add('ram', 'tridentz5-64-ddr5', 'G.Skill Trident Z5 RGB 64GB DDR5', 2400, 5, { type: 'DDR5', gb: 64, sticks: 2, tier: 5, rgb: true }, { color: '#bfc4c9', accent: '#222', style: 'trident' });

// ---- Lagring ----
add('storage', 'barracuda-1tb', 'Seagate BarraCuda 1TB', 450, 1, { kind: 'hdd', gb: 1000, tier: 1 }, { label: '#3f9b3a' });
add('storage', 'nv2-500', 'Kingston NV2 500GB', 350, 1, { kind: 'nvme', gb: 500, tier: 1 }, { label: '#2c6fb7' });
add('storage', 'sn580-1tb', 'WD Blue SN580 1TB', 700, 2, { kind: 'nvme', gb: 1000, tier: 2 }, { label: '#3a8fd8' });
add('storage', 'mx500-1tb', 'Crucial MX500 1TB', 700, 3, { kind: 'ssd', gb: 1000, tier: 2 }, { label: '#6a6f76' });
add('storage', '990pro-2tb', 'Samsung 990 PRO 2TB', 1800, 4, { kind: 'nvme', gb: 2000, tier: 4 }, { label: '#e07a2e' });
add('storage', '9100pro-4tb', 'Samsung 9100 PRO 4TB', 4200, 5, { kind: 'nvme', gb: 4000, tier: 5 }, { label: '#1d1d1d', heatsink: true });

// ---- Grafikkort (pwr = strömkontakt) ----
add('gpu', 'gtx-1650', 'NVIDIA GeForce GTX 1650', 1700, 2, { watt: 75, len: 1, pwr: null, tier: 2 }, { brand: 'nvidia', fans: 1, color: '#2d2f33' });
add('gpu', 'rtx-5060', 'NVIDIA GeForce RTX 5060', 3500, 2, { watt: 145, len: 2, pwr: 'pcie8', tier: 3 }, { brand: 'nvidia', fans: 2, color: '#2a2c30' });
add('gpu', 'rx-9060xt', 'AMD Radeon RX 9060 XT 16GB', 4200, 3, { watt: 180, len: 2, pwr: 'pcie8', tier: 3 }, { brand: 'amd', fans: 2, color: '#303236' });
add('gpu', 'rtx-5070', 'NVIDIA GeForce RTX 5070 Founders Edition', 6500, 3, { watt: 250, len: 2, pwr: '12vhpwr', tier: 4 }, { brand: 'nvidia', fans: 2, color: '#9aa0a6', fe: true });
add('gpu', 'red-devil-9070xt', 'PowerColor Red Devil Radeon RX 9070 XT', 8200, 4, { watt: 304, len: 3, pwr: 'pcie8', tier: 4, rgb: true }, { brand: 'amd', fans: 3, color: '#1c1c1f', accent: '#c9323a' });
add('gpu', 'rtx-5070ti-trio', 'MSI GeForce RTX 5070 Ti GAMING TRIO OC', 10200, 4, { watt: 300, len: 3, pwr: '12vhpwr', tier: 4, rgb: true }, { brand: 'nvidia', fans: 3, color: '#26282c', accent: '#b8bcc2' });
add('gpu', 'rtx-5080-fe', 'NVIDIA GeForce RTX 5080 Founders Edition', 12900, 5, { watt: 360, len: 2, pwr: '12vhpwr', tier: 5 }, { brand: 'nvidia', fans: 2, color: '#a3a8ad', fe: true });
add('gpu', 'astral-5080', 'ASUS ROG Astral GeForce RTX 5080 OC', 17900, 5, { watt: 360, len: 3, pwr: '12vhpwr', tier: 5, rgb: true }, { brand: 'nvidia', fans: 3, color: '#15161a', accent: '#c9323a', astral: true });

// ---- CPU-kylare ----
add('cooler', 'freezer-7x', 'ARCTIC Freezer 7 X', 200, 1, { maxW: 100, tier: 1 }, { type: 'low', fan: '#1d1d1d', blade: '#d8d8d8', fin: '#c8ccd0' });
add('cooler', 'hyper-212', 'Cooler Master Hyper 212 Black', 450, 2, { maxW: 150, tier: 2 }, { type: 'tower', fan: '#1a1a1a', blade: '#2a2a2a', fin: '#2e2f33' });
add('cooler', 'hyper-212-rgb', 'Cooler Master Hyper 212 RGB Black Edition', 550, 2, { maxW: 150, tier: 2, rgb: true }, { type: 'tower', fan: '#1a1a1a', blade: '#3a3a3a', fin: '#2e2f33' });
add('cooler', 'nh-d15', 'Noctua NH-D15', 1200, 4, { maxW: 250, tier: 4 }, { type: 'tower', fan: '#d8c7a7', blade: '#8a4b34', fin: '#c8ccd0' });
add('cooler', 'lf3-360', 'ARCTIC Liquid Freezer III 360', 1300, 4, { maxW: 300, tier: 4 }, { type: 'aio', fan: '#1d1d1d', blade: '#e6e6e6', fin: '#2a2a2a' });
add('cooler', 'kraken-elite-360', 'NZXT Kraken Elite 360 RGB', 3200, 5, { maxW: 300, tier: 5, rgb: true }, { type: 'aio', fan: '#e9e9e6', blade: '#f5f5f5', fin: '#e9e9e6', screen: true });

// ---- Nätaggregat ----
add('psu', 'cv550', 'Corsair CV550', 550, 1, { watt: 550, tier: 1 }, { color: '#1c1c1c', accent: '#e8c030' });
add('psu', 'focus-gx-750', 'Seasonic FOCUS GX-750', 1200, 3, { watt: 750, tier: 3 }, { color: '#222326', accent: '#9aa4ae' });
add('psu', 'rm850x', 'Corsair RM850x', 1500, 4, { watt: 850, tier: 4 }, { color: '#1a1a1a', accent: '#e8c030' });
add('psu', 'dark-power-13', 'be quiet! Dark Power 13 1000W', 2900, 5, { watt: 1000, tier: 5 }, { color: '#1b1b1d', accent: '#e07a2e' });

// ---- Chassin (fans = inbyggda fläktplatser) ----
add('case', 'pop-mini-silent', 'Fractal Design Pop Mini Silent', 800, 1, { fits: ['mATX'], fans: ['front2', 'rear'], tier: 1 }, { color: '#26282c', inner: '#34373c', front: 'solid' });
add('case', 'pop-mini-air', 'Fractal Design Pop Mini Air RGB', 900, 1, { fits: ['mATX'], fans: ['front1', 'front2', 'front3', 'rear'], tier: 1, rgb: true }, { color: '#2a2c30', inner: '#3a3d42', front: 'honeycomb' });
add('case', '4000d-airflow', 'Corsair 4000D Airflow', 1000, 2, { fits: ['mATX', 'ATX'], fans: ['front1', 'rear'], tier: 2 }, { color: '#e9e9e6', inner: '#d4d4d0', front: 'triangles' });
add('case', 'h5-flow', 'NZXT H5 Flow', 950, 3, { fits: ['mATX', 'ATX'], fans: ['front2', 'rear'], tier: 3 }, { color: '#1f2023', inner: '#2e3035', front: 'perforated' });
add('case', 'lancool-216-rgb', 'Lian Li LANCOOL 216 RGB', 1150, 3, { fits: ['mATX', 'ATX'], fans: ['front1', 'front3', 'rear'], tier: 3, rgb: true }, { color: '#1d1e21', inner: '#2b2d31', front: 'mesh' });
add('case', '4000x-rgb', 'Corsair iCUE 4000X RGB', 1500, 4, { fits: ['mATX', 'ATX'], fans: ['front1', 'front2', 'front3'], tier: 4, rgb: true }, { color: '#1a1b1e', inner: '#2a2c30', front: 'glass' });
add('case', 'o11-evo', 'Lian Li O11 Dynamic EVO', 1700, 5, { fits: ['mATX', 'ATX'], fans: [], tier: 5 }, { color: '#dcdcd8', inner: '#c6c6c2', front: 'glass' });

// ---- Chassifläktar (sätts i taket) ----
add('fans', 'p12-pwm-3', 'ARCTIC P12 PWM PST (3-pack)', 250, 1, { count: 3, tier: 1 }, { frame: '#1d1d1d', blade: '#2a2a2a' });
add('fans', 'sp120-rgb-3', 'Corsair iCUE SP120 RGB ELITE (3-pack)', 700, 2, { count: 3, tier: 2, rgb: true }, { frame: '#161616', blade: '#e9e9e9' });
add('fans', 'uni-sl120-3', 'Lian Li UNI FAN SL120 V2 RGB (3-pack)', 1100, 3, { count: 3, tier: 3, rgb: true }, { frame: '#ececea', blade: '#f7f7f7' });
add('fans', 'nf-a12x25-3', 'Noctua NF-A12x25 PWM (3 st)', 1000, 4, { count: 3, tier: 4 }, { frame: '#d8c7a7', blade: '#8a4b34' });

export const PARTS = P;
export const PART = Object.fromEntries(P.map((p) => [p.id, p]));

const PWR_NAME = { molex: 'Molex-ström', pcie6: '6-pin PCIe', pcie8: '8-pin PCIe', '2xpcie8': '2× 8-pin PCIe', '3xpcie8': '3× 8-pin PCIe', '12vhpwr': '12V-2x6 (16-pin)' };
const SOCKET_NAME = { DIP40: 'DIP-40', S286: '286-sockel', S386: '386-sockel', S486: '486-sockel', AM3plus: 'AM3+', LGA1151v2: 'LGA1151 v2', LGA2011v3: 'LGA2011-3' };
const MEDIA_NAME = { floppy525: '5,25"-diskett', floppy35: '3,5"-diskett', cdrom: 'CD-ROM', cdrw: 'CD-brännare', dvd: 'DVD-ROM', dvdrw: 'DVD-brännare', bd: 'Blu-ray' };
const KIND_NAME = { hdd: 'hårddisk', ssd: 'SATA-SSD', nvme: 'M.2 NVMe' };

export const socketName = (s) => SOCKET_NAME[s] || s.replace(/^Socket(\d)/, 'Socket $1').replace(/^Slot/, 'Slot ');
export function sizeText(mb, decimal = false) {
  if (mb < 1) return `${Math.round(mb * (decimal ? 1000 : 1024))} KB`;
  const k = decimal ? 1000 : 1024;
  if (mb < k) return `${+mb.toFixed(1)} MB`;
  if (mb < k * k) return `${+(mb / k).toFixed(1)} GB`;
  return `${+(mb / k / k).toFixed(1)} TB`;
}
const mhzText = (m) => m >= 1000 ? `${(m / 1000).toFixed(m % 1000 ? 1 : 0)} GHz` : `${+m.toFixed(2)} MHz`;

export function specLine(p) {
  const rgb = p.rgb ? ' · RGB' : '';
  switch (p.cat) {
    case 'cpu': return `${socketName(p.socket)} · ${mhzText(p.mhz)} · ${p.cores} ${p.cores === 1 ? 'kärna' : 'kärnor'} · ${p.watt} W${p.igpu ? ' · inbyggd grafik' : ''}`;
    case 'mb': return `${socketName(p.socket)} · ${p.chipset ? p.chipset + ' · ' : ''}${p.ram} · ${p.form}${rgb}`;
    case 'ram': return `${p.type} · ${sizeText(p.mb)}${p.sticks > 1 ? ` (${p.sticks} st)` : ''} · ${p.speed}${rgb}`;
    case 'storage': return `${p.iface} · ${KIND_NAME[p.kind] || p.kind} · ${sizeText(p.mb, true)}`;
    case 'media': return `${MEDIA_NAME[p.kind] || p.kind} · ${p.iface}`;
    case 'gpu': return `${p.bus} · ${p.std} · ${sizeText(p.vram)} · ${p.watt} W${p.pwr ? ' · ' + PWR_NAME[p.pwr] : ''}${rgb}`;
    case 'sound': return `${p.bus}-kort`;
    case 'cooler': return `${{ heatsink: 'kylfläns', 'heatsink-fan': 'fläkt på kylfläns', low: 'låg kylare', tower: 'tornkylare', aio: 'vattenkylning' }[p.look.type] || 'kylare'} · klarar ${p.maxW} W${rgb}`;
    case 'psu': return `${p.form} · ${p.watt} W${p.eff && p.eff !== 'none' ? ' · 80 PLUS ' + (p.eff === '80plus' ? '' : p.eff[0].toUpperCase() + p.eff.slice(1)) : ''}${p.modular ? ' · modulärt' : ''}`;
    case 'case': return `${(p.forms || p.fits).join('/')} · ${{ desktop: 'skrivbordslåda', minitower: 'minitorn', tower: 'torn', midi: 'miditorn', full: 'fulltorn', sff: 'litet' }[p.style] || ''} · ${p.fans.length} fläktar${rgb}`;
    case 'fans': return `${p.count} st ${p.size || 120} mm${rgb}`;
  }
  return '';
}

// Försäljningspris till kund (delens värde + butikens påslag)
export const MARKUP = 1.3;
export const retail = (p) => Math.round(p.cost * MARKUP / 10) * 10;
