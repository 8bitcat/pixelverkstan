// Datorbutikens delar – riktiga produktnamn, ungefärliga inköpspriser i kronor.
// lvl = butiksnivå då delen dyker upp hos grossisten.

export const CATS = {
  case:    { name: 'Chassi', icon: '🗄️', color: '#6b7684' },
  mb:      { name: 'Moderkort', icon: '🟩', color: '#2f8f46' },
  cpu:     { name: 'Processor (CPU)', icon: '🧠', color: '#2c6fb7' },
  cooler:  { name: 'CPU-kylare', icon: '❄️', color: '#58a6c9' },
  ram:     { name: 'RAM-minne', icon: '📏', color: '#c9323a' },
  storage: { name: 'Lagring', icon: '💾', color: '#7a5bc9' },
  gpu:     { name: 'Grafikkort (GPU)', icon: '🎮', color: '#3f9b3a' },
  psu:     { name: 'Nätaggregat (PSU)', icon: '🔌', color: '#e0a02a' },
};

export const CAT_ORDER = ['case', 'mb', 'cpu', 'cooler', 'ram', 'storage', 'gpu', 'psu'];

export const LEVELS = [
  { xp: 0, title: 'Garagebutik' },
  { xp: 45, title: 'Kvartersbutik' },
  { xp: 130, title: 'Datorbutik' },
  { xp: 260, title: 'Proffsbutik' },
  { xp: 440, title: 'Megastore' },
];

const P = [];
const add = (cat, id, name, cost, lvl, spec, look = {}) => P.push({ cat, id, name, cost, lvl, ...spec, look });

// ---- Processorer ----
add('cpu', 'i3-12100', 'Intel Core i3-12100', 1100, 1, { socket: 'LGA1700', cores: 4, watt: 60, igpu: true, tier: 1 }, { brand: 'intel' });
add('cpu', 'r5-5600g', 'AMD Ryzen 5 5600G', 1300, 1, { socket: 'AM4', cores: 6, watt: 65, igpu: true, tier: 1 }, { brand: 'amd' });
add('cpu', 'r5-5600', 'AMD Ryzen 5 5600', 1150, 2, { socket: 'AM4', cores: 6, watt: 65, igpu: false, tier: 2 }, { brand: 'amd' });
add('cpu', 'i5-13400f', 'Intel Core i5-13400F', 2100, 2, { socket: 'LGA1700', cores: 10, watt: 65, igpu: false, tier: 2 }, { brand: 'intel' });
add('cpu', 'r5-7600', 'AMD Ryzen 5 7600', 2200, 3, { socket: 'AM5', cores: 6, watt: 65, igpu: true, tier: 3 }, { brand: 'amd' });
add('cpu', 'r7-7800x3d', 'AMD Ryzen 7 7800X3D', 4300, 4, { socket: 'AM5', cores: 8, watt: 120, igpu: true, tier: 4 }, { brand: 'amd' });
add('cpu', 'i7-14700k', 'Intel Core i7-14700K', 4600, 4, { socket: 'LGA1700', cores: 20, watt: 190, igpu: true, tier: 4 }, { brand: 'intel' });
add('cpu', 'i9-14900k', 'Intel Core i9-14900K', 6200, 5, { socket: 'LGA1700', cores: 24, watt: 253, igpu: true, tier: 5 }, { brand: 'intel' });
add('cpu', 'r9-7950x', 'AMD Ryzen 9 7950X', 6500, 5, { socket: 'AM5', cores: 16, watt: 170, igpu: true, tier: 5 }, { brand: 'amd' });

// ---- Moderkort ----
add('mb', 'prime-h610m-e', 'ASUS PRIME H610M-E D4', 900, 1, { socket: 'LGA1700', ram: 'DDR4', size: 'mATX', tier: 1 }, { pcb: '#2e6b3c', accent: '#8fa3b8' });
add('mb', 'b550m-pro-vdh', 'MSI B550M PRO-VDH WIFI', 1100, 1, { socket: 'AM4', ram: 'DDR4', size: 'mATX', tier: 1 }, { pcb: '#2b2f36', accent: '#9aa4ae' });
add('mb', 'pro-b760m-p', 'MSI PRO B760M-P DDR4', 1200, 2, { socket: 'LGA1700', ram: 'DDR4', size: 'mATX', tier: 2 }, { pcb: '#2b2f36', accent: '#c0c6cc' });
add('mb', 'b650-gaming-x', 'Gigabyte B650 GAMING X AX', 2000, 3, { socket: 'AM5', ram: 'DDR5', size: 'ATX', tier: 3 }, { pcb: '#23262b', accent: '#e07a2e' });
add('mb', 'tuf-z790-plus', 'ASUS TUF GAMING Z790-PLUS WIFI', 3200, 4, { socket: 'LGA1700', ram: 'DDR5', size: 'ATX', tier: 4 }, { pcb: '#262626', accent: '#d8b24a' });
add('mb', 'rog-x670e-e', 'ASUS ROG STRIX X670E-E GAMING WIFI', 5200, 5, { socket: 'AM5', ram: 'DDR5', size: 'ATX', tier: 5 }, { pcb: '#1d1f24', accent: '#d8343c' });

// ---- RAM ----
add('ram', 'fury-8-ddr4', 'Kingston FURY Beast 8GB DDR4', 250, 1, { type: 'DDR4', gb: 8, sticks: 1, tier: 1 }, { color: '#1e1e1e', accent: '#c9323a' });
add('ram', 'lpx-16-ddr4', 'Corsair Vengeance LPX 16GB DDR4', 450, 1, { type: 'DDR4', gb: 16, sticks: 2, tier: 2 }, { color: '#1b1b1b', accent: '#e8c030' });
add('ram', 'fury-16-ddr5', 'Kingston FURY Beast 16GB DDR5', 650, 3, { type: 'DDR5', gb: 16, sticks: 2, tier: 3 }, { color: '#1e1e1e', accent: '#c9323a' });
add('ram', 'vengeance-32-ddr5', 'Corsair Vengeance 32GB DDR5', 1150, 3, { type: 'DDR5', gb: 32, sticks: 2, tier: 4 }, { color: '#26282c', accent: '#e8c030' });
add('ram', 'tridentz5-64-ddr5', 'G.Skill Trident Z5 RGB 64GB DDR5', 2400, 5, { type: 'DDR5', gb: 64, sticks: 2, tier: 5 }, { color: '#bfc4c9', accent: '#222', rgb: true });

// ---- Lagring ----
add('storage', 'barracuda-1tb', 'Seagate BarraCuda 1TB', 450, 1, { kind: 'hdd', gb: 1000, tier: 1 }, { label: '#3f9b3a' });
add('storage', 'nv2-500', 'Kingston NV2 500GB', 350, 1, { kind: 'nvme', gb: 500, tier: 1 }, { label: '#2c6fb7' });
add('storage', 'sn580-1tb', 'WD Blue SN580 1TB', 700, 2, { kind: 'nvme', gb: 1000, tier: 2 }, { label: '#3a8fd8' });
add('storage', 'mx500-1tb', 'Crucial MX500 1TB', 700, 3, { kind: 'ssd', gb: 1000, tier: 2 }, { label: '#6a6f76' });
add('storage', '990pro-2tb', 'Samsung 990 PRO 2TB', 1800, 4, { kind: 'nvme', gb: 2000, tier: 4 }, { label: '#e07a2e' });

// ---- Grafikkort ----
add('gpu', 'gtx-1650', 'NVIDIA GeForce GTX 1650', 1700, 2, { watt: 75, len: 1, tier: 2 }, { brand: 'nvidia', fans: 1, color: '#2d2f33' });
add('gpu', 'rtx-4060', 'NVIDIA GeForce RTX 4060', 3200, 2, { watt: 115, len: 2, tier: 3 }, { brand: 'nvidia', fans: 2, color: '#2a2c30' });
add('gpu', 'rx-7700xt', 'AMD Radeon RX 7700 XT', 4700, 3, { watt: 245, len: 2, tier: 3 }, { brand: 'amd', fans: 2, color: '#303236' });
add('gpu', 'rtx-4070s', 'NVIDIA GeForce RTX 4070 SUPER', 6500, 4, { watt: 220, len: 3, tier: 4 }, { brand: 'nvidia', fans: 2, color: '#9aa0a6' });
add('gpu', 'rx-7900xtx', 'AMD Radeon RX 7900 XTX', 10000, 5, { watt: 355, len: 3, tier: 5 }, { brand: 'amd', fans: 3, color: '#2b2d31' });
add('gpu', 'rtx-4090', 'NVIDIA GeForce RTX 4090', 21000, 5, { watt: 450, len: 3, tier: 5 }, { brand: 'nvidia', fans: 3, color: '#a3a8ad' });

// ---- CPU-kylare ----
add('cooler', 'freezer-7x', 'ARCTIC Freezer 7 X', 200, 1, { maxW: 100, tier: 1 }, { type: 'low', fan: '#1d1d1d', blade: '#d8d8d8', fin: '#c8ccd0' });
add('cooler', 'hyper-212', 'Cooler Master Hyper 212 Black', 450, 2, { maxW: 150, tier: 2 }, { type: 'tower', fan: '#1a1a1a', blade: '#2a2a2a', fin: '#2e2f33' });
add('cooler', 'nh-d15', 'Noctua NH-D15', 1200, 4, { maxW: 250, tier: 4 }, { type: 'tower', fan: '#d8c7a7', blade: '#8a4b34', fin: '#c8ccd0' });
add('cooler', 'lf2-360', 'ARCTIC Liquid Freezer II 360', 1300, 5, { maxW: 300, tier: 5 }, { type: 'aio', fan: '#1d1d1d', blade: '#e6e6e6', fin: '#2a2a2a' });

// ---- Nätaggregat ----
add('psu', 'cv550', 'Corsair CV550', 550, 1, { watt: 550, tier: 1 }, { color: '#1c1c1c', accent: '#e8c030' });
add('psu', 'focus-gx-750', 'Seasonic FOCUS GX-750', 1200, 3, { watt: 750, tier: 3 }, { color: '#222326', accent: '#9aa4ae' });
add('psu', 'rm850x', 'Corsair RM850x', 1500, 4, { watt: 850, tier: 4 }, { color: '#1a1a1a', accent: '#e8c030' });
add('psu', 'dark-power-13', 'be quiet! Dark Power 13 1000W', 2900, 5, { watt: 1000, tier: 5 }, { color: '#1b1b1d', accent: '#e07a2e' });

// ---- Chassin ----
add('case', 'pop-mini-air', 'Fractal Design Pop Mini Air', 700, 1, { fits: ['mATX'], tier: 1 }, { color: '#2a2c30', inner: '#3a3d42' });
add('case', '4000d-airflow', 'Corsair 4000D Airflow', 1000, 2, { fits: ['mATX', 'ATX'], tier: 2 }, { color: '#e9e9e6', inner: '#d4d4d0' });
add('case', 'h5-flow', 'NZXT H5 Flow', 950, 3, { fits: ['mATX', 'ATX'], tier: 3 }, { color: '#1f2023', inner: '#2e3035' });
add('case', 'o11-evo', 'Lian Li O11 Dynamic EVO', 1700, 5, { fits: ['mATX', 'ATX'], tier: 5 }, { color: '#dcdcd8', inner: '#c6c6c2' });

export const PARTS = P;
export const PART = Object.fromEntries(P.map((p) => [p.id, p]));

export function specLine(p) {
  switch (p.cat) {
    case 'cpu': return `${p.socket} · ${p.cores} kärnor · ${p.watt} W${p.igpu ? ' · inbyggd grafik' : ' · ingen inbyggd grafik'}`;
    case 'mb': return `${p.socket} · ${p.ram} · ${p.size}`;
    case 'ram': return `${p.type} · ${p.gb} GB${p.sticks > 1 ? ` (${p.sticks} st)` : ''}`;
    case 'storage': return `${{ hdd: 'Hårddisk (SATA)', nvme: 'M.2 NVMe SSD', ssd: 'SATA SSD 2,5"' }[p.kind]} · ${p.gb >= 1000 ? p.gb / 1000 + ' TB' : p.gb + ' GB'}`;
    case 'gpu': return `${p.watt} W`;
    case 'cooler': return `klarar upp till ${p.maxW} W`;
    case 'psu': return `${p.watt} W`;
    case 'case': return `passar ${p.fits.join(' + ')}`;
  }
  return '';
}

// Försäljningspris till kund (delens värde + butikens påslag)
export const MARKUP = 1.3;
export const retail = (p) => Math.round(p.cost * MARKUP / 10) * 10;
