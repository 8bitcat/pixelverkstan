// Grafikkort 1983–2026 – riktiga produkter, svenska butikspriser det året.
// Äldre kort (1983–2006) är handskrivna rader; moderna PCIe-kort genereras
// från en kretstabell (pris, TDP, minne) × tillverkarnas riktiga serier.
import { SEK_PER_USD } from './canon.js';

const G = [];
const seen = new Set();
const rate = (y) => SEK_PER_USD[Math.min(2026, Math.max(1983, y))];
// USD-lanseringspris → svenska kronor inkl. moms det året (avrundat till tior)
const kr = (usd, y) => Math.max(50, Math.round((usd * rate(y) * 1.25) / 10) * 10);
const slug = (s) => s.toLowerCase()
  .replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/é/g, 'e')
  .replace(/\+/g, '-plus').replace(/@/g, '-at-').replace(/!/g, '')
  .replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '');

// Kort som redan fanns i catalog.js: samma id, namn och look (plus nya fält).
// Pris/segment/watt/kontakt behålls som i den gamla katalogen.
const LEG = {
  'NVIDIA GeForce GTX 1650': { id: 'gtx-1650', cost: 1700, tier: 2, watt: 75, len: 1, pwr: null, rgb: false, look: { brand: 'nvidia', fans: 1, color: '#2d2f33' } },
  'NVIDIA GeForce RTX 5060': { id: 'rtx-5060', cost: 3500, tier: 3, watt: 145, len: 2, pwr: 'pcie8', rgb: false, look: { brand: 'nvidia', fans: 2, color: '#2a2c30' } },
  'AMD Radeon RX 9060 XT 16GB': { id: 'rx-9060xt', cost: 4200, tier: 3, watt: 180, len: 2, pwr: 'pcie8', rgb: false, look: { brand: 'amd', fans: 2, color: '#303236' } },
  'NVIDIA GeForce RTX 5070 Founders Edition': { id: 'rtx-5070', cost: 6500, tier: 4, watt: 250, len: 2, pwr: '12vhpwr', rgb: false, look: { brand: 'nvidia', fans: 2, color: '#9aa0a6', fe: true } },
  'PowerColor Red Devil Radeon RX 9070 XT': { id: 'red-devil-9070xt', cost: 8200, tier: 4, watt: 304, len: 3, pwr: 'pcie8', rgb: true, look: { brand: 'amd', fans: 3, color: '#1c1c1f', accent: '#c9323a' } },
  'MSI GeForce RTX 5070 Ti GAMING TRIO OC': { id: 'rtx-5070ti-trio', cost: 10200, tier: 4, watt: 300, len: 3, pwr: '12vhpwr', rgb: true, look: { brand: 'nvidia', fans: 3, color: '#26282c', accent: '#b8bcc2' } },
  'NVIDIA GeForce RTX 5080 Founders Edition': { id: 'rtx-5080-fe', cost: 12900, tier: 5, watt: 360, len: 2, pwr: '12vhpwr', rgb: false, look: { brand: 'nvidia', fans: 2, color: '#a3a8ad', fe: true } },
  'ASUS ROG Astral GeForce RTX 5080 OC': { id: 'astral-5080', cost: 17900, tier: 5, watt: 360, len: 3, pwr: '12vhpwr', rgb: true, look: { brand: 'nvidia', fans: 3, color: '#15161a', accent: '#c9323a', astral: true } },
};
const legacyUsed = new Set();

function push(p) {
  const lg = LEG[p.name];
  if (lg) {
    legacyUsed.add(p.name);
    const style = lg.look.fe ? 'fe' : lg.look.astral ? 'astral' : lg.look.fans >= 3 ? 'triple' : lg.look.fans === 2 ? 'dual' : 'single-fan';
    p = { ...p, ...lg, look: { ...lg.look, style, pcb: p.look?.pcb || '#1b1c1f' } };
  }
  const base = p.id || 'gpu-' + slug(p.name);
  let id = base, i = 2;
  while (seen.has(id)) id = `${base}-${i++}`;
  seen.add(id);
  G.push({ cat: 'gpu', rgb: false, ...p, id });
}

const PCB = { g80: '#2f6b3a', g90: '#2c7a45', g00: '#2d6e3e', blue: '#1f3f8f', red: '#8e2a2a', black: '#1b1c1f', brown: '#6b4a2a' };
const STD_OUT = { MDA: ['DE9'], CGA: ['DE9'], HGC: ['DE9'], EGA: ['DE9'] };

// Äldre kort: namn, tillverkare, kretsmärke (look.brand), standard, buss, år, sista år, VRAM (MB), USD, segment, extra
function o(name, brand, lb, std, bus, year, until, vram, usd, tier, x = {}) {
  const old = STD_OUT[std];
  const isa = bus === 'ISA8' || bus === 'ISA16';
  const style = x.style || (isa ? (old || x.long ? 'isa-full' : 'isa-short') : bus === 'VLB' ? 'vlb' : bus === 'PCI' ? 'pci-bare' : 'agp-bare');
  const len = x.len || (style === 'isa-full' || style === 'vlb' ? 3 : 2);
  const pcb = x.pcb || (year < 1990 ? PCB.g80 : year < 1998 ? PCB.g90 : PCB.g00);
  const fans = x.fans ?? (style === 'agp-fan' || style === 'single-fan' ? 1 : 0);
  push({
    id: x.id, name, brand, year, until, cost: x.sek || kr(usd, year), tier,
    bus, std, vram, watt: x.watt || (std === '3D' ? 15 : isa ? 8 : 10), pwr: x.pwr || null, len,
    out: x.out || old || ['VGA'], rgb: false,
    look: { brand: lb, style, fans, color: x.color || pcb, accent: x.accent || '#b9bec4', pcb },
  });
}

// ---------------- 1983–1991: MDA, Hercules, CGA, EGA, PGC ----------------
o('IBM Monochrome Display and Printer Adapter', 'IBM', 'ibm', 'MDA', 'ISA8', 1983, 1987, 0.004, 335, 2);
o('IBM Color Graphics Adapter', 'IBM', 'ibm', 'CGA', 'ISA8', 1983, 1988, 0.016, 300, 3);
o('Hercules Graphics Card', 'Hercules', 'hercules', 'HGC', 'ISA8', 1983, 1987, 0.064, 499, 4);
o('Plantronics ColorPlus', 'Plantronics', 'ibm', 'CGA', 'ISA8', 1983, 1986, 0.032, 395, 4);
o('Paradise Modular Graphics Card', 'Paradise', 'paradise', 'CGA', 'ISA8', 1983, 1986, 0.016, 295, 3);
o('Tecmar Graphics Master', 'Tecmar', 'ibm', 'CGA', 'ISA8', 1984, 1987, 0.128, 695, 5);
o('Quadram Quadcolor I', 'Quadram', 'ibm', 'CGA', 'ISA8', 1983, 1986, 0.016, 275, 3);
o('AST Preview!', 'AST Research', 'hercules', 'HGC', 'ISA8', 1984, 1987, 0.064, 399, 3);
o('Tseng Labs UltraPAK', 'Tseng Labs', 'tseng', 'HGC', 'ISA8', 1984, 1987, 0.064, 495, 4);
o('STB Graphix Plus II', 'STB', 'ibm', 'CGA', 'ISA8', 1984, 1987, 0.064, 395, 3);
o('Sigma Designs Color 400', 'Sigma Designs', 'ibm', 'CGA', 'ISA8', 1985, 1988, 0.128, 595, 4);
o('IBM Enhanced Graphics Adapter 64KB', 'IBM', 'ibm', 'EGA', 'ISA8', 1984, 1988, 0.064, 524, 4);
o('IBM Enhanced Graphics Adapter + Graphics Memory Expansion 256KB', 'IBM', 'ibm', 'EGA', 'ISA8', 1984, 1988, 0.256, 950, 5);
o('IBM Professional Graphics Controller', 'IBM', 'ibm', 'EGA', 'ISA8', 1984, 1987, 0.32, 2995, 5, { watt: 25 });
o('Hercules Color Card', 'Hercules', 'hercules', 'CGA', 'ISA8', 1984, 1988, 0.016, 245, 2);
o('Paradise PEGA', 'Paradise', 'paradise', 'EGA', 'ISA8', 1985, 1989, 0.256, 499, 4);
o('Everex Graphics Edge', 'Everex', 'ibm', 'CGA', 'ISA8', 1985, 1988, 0.064, 299, 2);
o('Quadram QuadEGA+', 'Quadram', 'ibm', 'EGA', 'ISA8', 1985, 1988, 0.256, 549, 4);
o('ATI Graphics Solution', 'ATI', 'ati', 'CGA', 'ISA8', 1986, 1989, 0.064, 199, 2);
o('ATI EGA Wonder', 'ATI', 'ati', 'EGA', 'ISA8', 1986, 1990, 0.256, 399, 3);
o('Genoa SuperEGA HiRes', 'Genoa', 'ibm', 'EGA', 'ISA8', 1986, 1990, 0.256, 499, 4);
o('Video Seven Vega', 'Video Seven', 'ibm', 'EGA', 'ISA8', 1986, 1990, 0.256, 449, 4);
o('Tseng Labs EVA/480', 'Tseng Labs', 'tseng', 'EGA', 'ISA8', 1986, 1990, 0.256, 469, 4);
o('Hercules Graphics Card Plus', 'Hercules', 'hercules', 'HGC', 'ISA8', 1986, 1990, 0.064, 299, 2);
o('Paradise Autoswitch EGA 480', 'Paradise', 'paradise', 'EGA', 'ISA8', 1986, 1990, 0.256, 399, 3);
o('Matrox PG-640A', 'Matrox', 'matrox', 'EGA', 'ISA16', 1986, 1989, 0.64, 1995, 5, { watt: 25 });
o('Orchid TurboPGA', 'Orchid', 'ibm', 'EGA', 'ISA16', 1986, 1989, 0.64, 1795, 5, { watt: 25 });
o('ATI Small Wonder Graphics Solution', 'ATI', 'ati', 'CGA', 'ISA8', 1987, 1989, 0.064, 149, 1);
o('ATI EGA Wonder 800', 'ATI', 'ati', 'EGA', 'ISA8', 1987, 1991, 0.256, 399, 4);
o('Video Seven Vega Deluxe', 'Video Seven', 'ibm', 'EGA', 'ISA8', 1987, 1991, 0.256, 399, 4);
o('Genoa SuperEGA HiRes+', 'Genoa', 'ibm', 'EGA', 'ISA8', 1987, 1991, 0.256, 449, 3);
o('Hercules InColor Card', 'Hercules', 'hercules', 'HGC', 'ISA8', 1987, 1990, 0.256, 499, 4);
o('ATI EGA Wonder 800+', 'ATI', 'ati', 'EGA', 'ISA16', 1988, 1991, 0.256, 299, 3);

// ---------------- 1987–1992: VGA ----------------
o('IBM PS/2 Display Adapter', 'IBM', 'ibm', 'VGA', 'ISA8', 1987, 1990, 0.256, 595, 5);
o('Paradise VGA Plus', 'Paradise', 'paradise', 'VGA', 'ISA8', 1987, 1991, 0.256, 499, 4);
o('Video Seven VEGA VGA', 'Video Seven', 'cirrus', 'VGA', 'ISA8', 1987, 1990, 0.256, 499, 4);
o('ATI VIP VGA Improved Performance', 'ATI', 'ati', 'VGA', 'ISA16', 1987, 1989, 0.256, 499, 4);
o('Genoa SuperVGA 5100', 'Genoa', 'tseng', 'VGA', 'ISA8', 1988, 1991, 0.256, 399, 3);
o('Orchid ProDesigner VGA', 'Orchid', 'tseng', 'VGA', 'ISA8', 1988, 1991, 0.512, 495, 4);
o('ATI VGA Wonder', 'ATI', 'ati', 'VGA', 'ISA8', 1988, 1991, 0.256, 499, 4);
o('STB VGA Extra/EM', 'STB', 'tseng', 'VGA', 'ISA8', 1988, 1991, 0.256, 299, 3);
o('ATI VGA Wonder 16', 'ATI', 'ati', 'VGA', 'ISA16', 1988, 1991, 0.512, 699, 5);
o('Paradise VGA Plus 16', 'Paradise', 'paradise', 'VGA', 'ISA16', 1988, 1991, 0.256, 449, 3);
o('Paradise VGA Professional', 'Paradise', 'paradise', 'VGA', 'ISA16', 1988, 1991, 0.512, 599, 4);
o('Video Seven VRAM VGA', 'Video Seven', 'cirrus', 'VGA', 'ISA16', 1988, 1991, 0.512, 799, 5);
o('Hercules Graphics Station Card', 'Hercules', 'hercules', 'VGA', 'ISA16', 1988, 1991, 1, 1995, 5, { long: true, watt: 20 });
o('ATI VGA Edge', 'ATI', 'ati', 'VGA', 'ISA8', 1989, 1992, 0.256, 199, 2);
o('Trident TVGA 8800CS', 'Trident', 'trident', 'VGA', 'ISA8', 1989, 1993, 0.256, 159, 1);
o('Orchid ProDesigner Plus', 'Orchid', 'tseng', 'VGA', 'ISA16', 1989, 1992, 0.512, 599, 4);
o('Sigma Designs SigmaVGA Legend', 'Sigma Designs', 'tseng', 'VGA', 'ISA16', 1989, 1992, 1, 599, 4);
o('ATI VGA Edge-16', 'ATI', 'ati', 'VGA', 'ISA16', 1990, 1993, 0.256, 249, 2);

// ---------------- 1990–1996: Super VGA och 2D-acceleratorer (ISA16) ----------------
o('Orchid ProDesigner II', 'Orchid', 'tseng', 'SVGA', 'ISA16', 1990, 1993, 1, 499, 4);
o('STB PowerGraph VGA', 'STB', 'tseng', 'SVGA', 'ISA16', 1990, 1993, 1, 349, 3);
o('ATI VGA Wonder XL', 'ATI', 'ati', 'SVGA', 'ISA16', 1990, 1993, 1, 449, 4);
o('ATI 8514/Ultra', 'ATI', 'ati', 'SVGA', 'ISA16', 1990, 1992, 1, 899, 5, { long: true });
o('Video Seven VRAM II', 'Video Seven', 'cirrus', 'SVGA', 'ISA16', 1990, 1993, 1, 599, 4);
o('Trident TVGA 8900C 1MB', 'Trident', 'trident', 'SVGA', 'ISA16', 1990, 1994, 1, 179, 1);
o('Diamond SpeedStar Plus', 'Diamond', 'tseng', 'SVGA', 'ISA16', 1990, 1993, 1, 299, 3);
o('Diamond SpeedStar 24', 'Diamond', 'tseng', 'SVGA', 'ISA16', 1991, 1994, 1, 399, 4);
o('Diamond SpeedStar HiColor', 'Diamond', 'tseng', 'SVGA', 'ISA16', 1991, 1994, 1, 349, 3);
o('ATI Graphics Ultra', 'ATI', 'ati', 'SVGA', 'ISA16', 1991, 1993, 1, 899, 5, { long: true });
o('ATI Graphics Vantage', 'ATI', 'ati', 'SVGA', 'ISA16', 1991, 1993, 1, 599, 4, { long: true });
o('Diamond Stealth VRAM', 'Diamond', 's3', 'SVGA', 'ISA16', 1991, 1994, 1, 699, 5, { long: true });
o('Orchid Fahrenheit 1280', 'Orchid', 's3', 'SVGA', 'ISA16', 1992, 1994, 1, 699, 4);
o('Paradise Accelerator 24', 'Paradise', 'paradise', 'SVGA', 'ISA16', 1992, 1995, 1, 449, 3);
o('Diamond SpeedStar 24X', 'Diamond', 'paradise', 'SVGA', 'ISA16', 1992, 1995, 1, 299, 3);
o('ATI Graphics Ultra Pro ISA 2MB', 'ATI', 'ati', 'SVGA', 'ISA16', 1992, 1995, 2, 899, 5, { long: true });
o('Number Nine #9GXE Level 12 ISA', 'Number Nine', 's3', 'SVGA', 'ISA16', 1992, 1995, 3, 999, 5, { long: true });
o('Trident TVGA 8900D 1MB', 'Trident', 'trident', 'SVGA', 'ISA16', 1992, 1996, 1, 129, 1);
o('STB Powergraph X-24 ISA', 'STB', 's3', 'SVGA', 'ISA16', 1993, 1996, 1, 249, 2);
o('Diamond Stealth 24 ISA', 'Diamond', 's3', 'SVGA', 'ISA16', 1993, 1995, 1, 299, 3);
o('Hercules Dynamite', 'Hercules', 'tseng', 'SVGA', 'ISA16', 1993, 1995, 1, 299, 3);
o('Diamond SpeedStar Pro', 'Diamond', 'cirrus', 'SVGA', 'ISA16', 1993, 1996, 1, 199, 2);
o('STB Horizon Plus', 'STB', 'cirrus', 'SVGA', 'ISA16', 1993, 1996, 1, 179, 2);
o('ATI Graphics Ultra Plus', 'ATI', 'ati', 'SVGA', 'ISA16', 1993, 1995, 2, 499, 4, { long: true });
o('Trident TVGA 9000i 512KB', 'Trident', 'trident', 'SVGA', 'ISA16', 1993, 1996, 0.512, 89, 1);
o('ATI Graphics Xpression ISA', 'ATI', 'ati', 'SVGA', 'ISA16', 1995, 1996, 1, 199, 2);

// ---------------- 1992–1995: VESA Local Bus ----------------
o('ATI Graphics Ultra Pro VLB 2MB', 'ATI', 'ati', 'SVGA', 'VLB', 1992, 1995, 2, 899, 5);
o('Orchid Fahrenheit VLB', 'Orchid', 's3', 'SVGA', 'VLB', 1992, 1994, 1, 399, 4);
o('Number Nine #9GXE Level 12 VLB', 'Number Nine', 's3', 'SVGA', 'VLB', 1992, 1995, 3, 999, 5);
o('ELSA Winner 1000 VL', 'ELSA', 's3', 'SVGA', 'VLB', 1993, 1995, 2, 599, 4);
o('STB Powergraph X-24 VLB', 'STB', 's3', 'SVGA', 'VLB', 1993, 1995, 1, 249, 2);
o('Diamond Stealth 24 VLB', 'Diamond', 's3', 'SVGA', 'VLB', 1993, 1995, 1, 299, 3);
o('Diamond SpeedStar Pro VLB', 'Diamond', 'cirrus', 'SVGA', 'VLB', 1993, 1995, 1, 199, 2);
o('ATI Graphics Ultra Pro VLB 1MB', 'ATI', 'ati', 'SVGA', 'VLB', 1993, 1995, 1, 499, 4);
o('Hercules Dynamite Pro VLB', 'Hercules', 'tseng', 'SVGA', 'VLB', 1994, 1995, 2, 349, 3);
o('STB Lightspeed VL', 'STB', 'tseng', 'SVGA', 'VLB', 1994, 1995, 2, 399, 4);
o('Orchid Kelvin 64 VLB', 'Orchid', 'cirrus', 'SVGA', 'VLB', 1994, 1995, 2, 299, 3);
o('Diamond Stealth 64 VLB', 'Diamond', 's3', 'SVGA', 'VLB', 1994, 1995, 2, 399, 4);
o('Number Nine #9GXE64 VLB', 'Number Nine', 's3', 'SVGA', 'VLB', 1994, 1995, 2, 449, 4);
o('ATI Graphics Pro Turbo VLB', 'ATI', 'ati', 'SVGA', 'VLB', 1994, 1995, 2, 599, 5);
o('Matrox MGA Impression Plus VLB', 'Matrox', 'matrox', 'SVGA', 'VLB', 1994, 1995, 2, 499, 4);
o('Trident TGUI9440AGi VLB', 'Trident', 'trident', 'SVGA', 'VLB', 1994, 1995, 1, 99, 1);
o('Cardex Challenger ET4000/W32p VLB', 'Cardex', 'tseng', 'SVGA', 'VLB', 1994, 1995, 2, 179, 2);

// ---------------- 1994–1997: PCI 2D och tidig 3D ----------------
o('Diamond Stealth 64 PCI', 'Diamond', 's3', 'SVGA', 'PCI', 1994, 1996, 2, 399, 4);
o('Number Nine #9GXE64 Pro PCI', 'Number Nine', 's3', 'SVGA', 'PCI', 1994, 1996, 4, 699, 5);
o('ATI Graphics Pro Turbo PCI', 'ATI', 'ati', 'SVGA', 'PCI', 1994, 1997, 2, 599, 5);
o('STB Powergraph 64 PCI', 'STB', 's3', 'SVGA', 'PCI', 1994, 1997, 1, 199, 2);
o('Orchid Kelvin 64 PCI', 'Orchid', 'cirrus', 'SVGA', 'PCI', 1994, 1996, 2, 299, 3);
o('Hercules Dynamite Pro PCI', 'Hercules', 'tseng', 'SVGA', 'PCI', 1994, 1996, 2, 329, 3);
o('ELSA Winner 1000 Pro PCI', 'ELSA', 's3', 'SVGA', 'PCI', 1995, 1997, 2, 399, 4);
o('Matrox Millennium 2MB', 'Matrox', 'matrox', 'SVGA', 'PCI', 1995, 1998, 2, 449, 5);
o('Matrox Millennium 4MB', 'Matrox', 'matrox', 'SVGA', 'PCI', 1995, 1998, 4, 599, 5);
o('ATI Graphics Xpression PCI', 'ATI', 'ati', 'SVGA', 'PCI', 1995, 1997, 2, 249, 3);
o('ATI WinTurbo PCI', 'ATI', 'ati', 'SVGA', 'PCI', 1995, 1997, 2, 399, 4);
o('Diamond Stealth 64 Video 2001', 'Diamond', 's3', 'SVGA', 'PCI', 1995, 1997, 2, 299, 3);
o('STB Powergraph 64 Video', 'STB', 's3', 'SVGA', 'PCI', 1995, 1998, 2, 179, 2);
o('Hercules Terminator 64/Video', 'Hercules', 's3', 'SVGA', 'PCI', 1995, 1997, 2, 249, 3);
o('Number Nine #9FX Motion 771', 'Number Nine', 's3', 'SVGA', 'PCI', 1995, 1997, 4, 599, 5);
o('Diamond SpeedStar 64 PCI', 'Diamond', 'cirrus', 'SVGA', 'PCI', 1995, 1997, 2, 199, 2);
o('Trident TGUI9680 PCI 2MB', 'Trident', 'trident', 'SVGA', 'PCI', 1995, 1998, 2, 79, 1);
o('STB Horizon 64 Video', 'STB', 'cirrus', 'SVGA', 'PCI', 1996, 1998, 2, 139, 1);
o('Hercules Dynamite 128/Video', 'Hercules', 'tseng', 'SVGA', 'PCI', 1996, 1998, 2, 199, 3);
o('STB Lightspeed 128', 'STB', 'tseng', 'SVGA', 'PCI', 1996, 1998, 2, 249, 3);
o('Diamond Stealth 3D 2000', 'Diamond', 's3', '3D', 'PCI', 1996, 1998, 2, 199, 2);
o('Diamond Stealth 3D 3000', 'Diamond', 's3', '3D', 'PCI', 1996, 1998, 4, 399, 4);
o('Number Nine 9FX Reality 332', 'Number Nine', 's3', '3D', 'PCI', 1996, 1998, 2, 199, 2);
o('Hercules Terminator 3D', 'Hercules', 's3', '3D', 'PCI', 1996, 1998, 2, 219, 2);
o('ELSA Victory 3D', 'ELSA', 's3', '3D', 'PCI', 1996, 1998, 2, 229, 2);
o('STB Nitro 3D', 'STB', 's3', '3D', 'PCI', 1997, 1999, 4, 169, 2);
o('Matrox Mystique 2MB', 'Matrox', 'matrox', '3D', 'PCI', 1996, 1998, 2, 199, 3);
o('Matrox Mystique 220 4MB', 'Matrox', 'matrox', '3D', 'PCI', 1997, 1999, 4, 179, 3);
o('Matrox Millennium II PCI 4MB', 'Matrox', 'matrox', '3D', 'PCI', 1996, 1999, 4, 399, 5);
o('ATI 3D Xpression', 'ATI', 'ati', '3D', 'PCI', 1996, 1997, 2, 199, 2);
o('ATI 3D Xpression+', 'ATI', 'ati', '3D', 'PCI', 1996, 1998, 2, 199, 3);
o('ATI 3D Pro Turbo', 'ATI', 'ati', '3D', 'PCI', 1996, 1998, 4, 349, 4);
o('Creative 3D Blaster PCI', 'Creative', 'rendition', '3D', 'PCI', 1996, 1998, 4, 199, 3);
o('Canopus Total3D', 'Canopus', 'rendition', '3D', 'PCI', 1996, 1998, 4, 299, 4);
o('Sierra Screamin\' 3D', 'Sierra', 'rendition', '3D', 'PCI', 1996, 1998, 4, 199, 3);
o('Trident 3DImage 9750 PCI', 'Trident', 'trident', '3D', 'PCI', 1997, 1999, 4, 69, 1);

// ---------------- 1997–2009: 3D-eran på PCI och AGP ----------------
const BRAND_PCB = {
  ATI: PCB.red, Sapphire: PCB.blue, 'Hercules': PCB.blue, Gigabyte: PCB.blue, MSI: PCB.red, Gainward: PCB.red,
  Albatron: PCB.red, XFX: PCB.black, HIS: PCB.blue, PowerColor: PCB.red, 'Club 3D': PCB.blue, Matrox: PCB.g00,
  '3dfx': PCB.g00, ELSA: PCB.g00, Creative: PCB.g00, Diamond: PCB.g00, Leadtek: PCB.g00, ASUS: PCB.g00,
  Guillemot: PCB.g00, BFG: PCB.g00, PNY: PCB.g00, VisionTek: PCB.g00, Canopus: PCB.g00, STB: PCB.g00, Palit: PCB.g00,
  Zotac: PCB.black, EVGA: PCB.g00, Sparkle: PCB.g00,
};
const BRAND_ACC = {
  ATI: '#c9323a', Sapphire: '#3a8fd8', Hercules: '#c9a227', Gigabyte: '#e07a2e', MSI: '#c9323a', Gainward: '#e8c030',
  Albatron: '#c0c6cc', XFX: '#76b900', HIS: '#3a8fd8', PowerColor: '#c9323a', ASUS: '#c0c6cc', Leadtek: '#e8c030',
  ELSA: '#3a8fd8', Creative: '#c0c6cc', Guillemot: '#c9a227', BFG: '#76b900', PNY: '#c0c6cc', Matrox: '#9aa4ae',
  '3dfx': '#3a6fd8', VisionTek: '#c9323a', Canopus: '#c0c6cc', Diamond: '#c0c6cc', STB: '#c0c6cc', Zotac: '#e8c030',
};

// t(): namn, tillverkare, krets, buss, år, sista år, VRAM MB, USD, segment, watt, kylning ('b' bar, 'h' kylfläns, 'f' fläkt, 'D' dubbelslot), extra
function t(name, brand, lb, bus, year, until, vram, usd, tier, watt, cool, x = {}) {
  const pci = bus === 'PCI';
  const style = cool === 'D' ? 'blower'
    : cool === 'b' ? (pci ? 'pci-bare' : 'agp-bare')
      : cool === 'h' ? 'agp-heatsink'
        : pci || bus === 'PCIe' ? 'single-fan' : 'agp-fan';
  const pcb = x.pcb || BRAND_PCB[brand] || PCB.g00;
  push({
    name, brand, year, until, cost: kr(usd, year), tier, bus, std: '3D', vram, watt,
    pwr: x.pwr || null, len: x.len || (cool === 'D' || vram >= 256 ? 3 : 2),
    out: x.out || (year >= 2002 ? ['VGA', 'DVI'] : ['VGA']),
    look: { brand: lb, style, fans: cool === 'f' || cool === 'D' ? 1 : 0, color: x.color || pcb, accent: x.accent || BRAND_ACC[brand] || '#c0c6cc', pcb },
  });
}
const M = { pwr: 'molex' };
const VD = { out: ['VGA', 'DVI'] };

// 1997–1998: RIVA 128, Rage Pro, Vérité, i740, TNT, G200, Banshee, Savage3D
t('Diamond Viper V330 PCI', 'Diamond', 'nvidia', 'PCI', 1997, 1999, 4, 199, 4, 8, 'h');
t('Diamond Viper V330 AGP', 'Diamond', 'nvidia', 'AGP', 1997, 1999, 4, 199, 4, 8, 'h');
t('STB Velocity 128 PCI', 'STB', 'nvidia', 'PCI', 1997, 1999, 4, 179, 3, 8, 'h');
t('STB Velocity 128 AGP', 'STB', 'nvidia', 'AGP', 1997, 1999, 4, 179, 3, 8, 'h');
t('ELSA Victory Erazor AGP', 'ELSA', 'nvidia', 'AGP', 1997, 1999, 4, 199, 3, 8, 'h');
t('ASUS AGP-V3000 3D Explorer', 'ASUS', 'nvidia', 'AGP', 1998, 1999, 4, 149, 3, 8, 'h');
t('Canopus Total3D 128V', 'Canopus', 'nvidia', 'AGP', 1998, 1999, 4, 249, 4, 8, 'h');
t('ATI Xpert@Work AGP', 'ATI', 'ati', 'AGP', 1997, 1999, 4, 149, 3, 6, 'b');
t('ATI Xpert@Play AGP', 'ATI', 'ati', 'AGP', 1997, 1999, 4, 199, 4, 6, 'b');
t('ATI Xpert@Play PCI', 'ATI', 'ati', 'PCI', 1997, 1999, 4, 199, 4, 6, 'b');
t('ATI All-in-Wonder Pro AGP', 'ATI', 'ati', 'AGP', 1998, 2000, 8, 299, 4, 8, 'b');
t('ATI Xpert 98 AGP', 'ATI', 'ati', 'AGP', 1998, 2000, 8, 99, 2, 6, 'b');
t('Matrox Millennium II AGP 4MB', 'Matrox', 'matrox', 'AGP', 1997, 1999, 4, 299, 5, 8, 'b');
t('Intergraph Intense 3D 100', 'Intergraph', 'rendition', 'PCI', 1997, 1999, 8, 199, 4, 10, 'h');
t('Diamond Stealth II S220', 'Diamond', 'rendition', 'PCI', 1997, 1999, 4, 149, 3, 8, 'h');
t('Hercules Thriller 3D PCI', 'Hercules', 'rendition', 'PCI', 1997, 1999, 8, 199, 4, 10, 'h');
t('Hercules Thriller 3D AGP', 'Hercules', 'rendition', 'AGP', 1998, 1999, 8, 199, 4, 10, 'h');
t('Diamond Stealth 3D 4000 AGP', 'Diamond', 's3', 'AGP', 1997, 1999, 4, 149, 2, 6, 'b');
t('Trident 3DImage 9750 AGP', 'Trident', 'trident', 'AGP', 1997, 1999, 4, 69, 1, 5, 'b');
t('Real3D StarFighter AGP 8MB', 'Real3D', 'intel', 'AGP', 1998, 1999, 8, 129, 3, 8, 'h');
t('Real3D StarFighter PCI 16MB', 'Real3D', 'intel', 'PCI', 1998, 2000, 16, 169, 3, 10, 'h');
t('Diamond Stealth II G460', 'Diamond', 'intel', 'AGP', 1998, 1999, 8, 119, 2, 8, 'h');
t('ELSA WINNER II AGP', 'ELSA', 'intel', 'AGP', 1998, 1999, 8, 129, 2, 8, 'h');
t('Diamond Viper V550 AGP', 'Diamond', 'nvidia', 'AGP', 1998, 2000, 16, 199, 4, 12, 'h');
t('Diamond Viper V550 PCI', 'Diamond', 'nvidia', 'PCI', 1998, 2000, 16, 199, 4, 12, 'h');
t('STB Velocity 4400 AGP', 'STB', 'nvidia', 'AGP', 1998, 2000, 16, 179, 4, 12, 'h');
t('STB Velocity 4400 PCI', 'STB', 'nvidia', 'PCI', 1998, 2000, 16, 179, 4, 12, 'h');
t('Creative Graphics Blaster RIVA TNT', 'Creative', 'nvidia', 'AGP', 1998, 2000, 16, 199, 4, 12, 'f');
t('ELSA ERAZOR II', 'ELSA', 'nvidia', 'AGP', 1998, 2000, 16, 199, 4, 12, 'f');
t('Canopus Spectra 2500', 'Canopus', 'nvidia', 'AGP', 1998, 2000, 16, 249, 5, 12, 'f');
t('Hercules Dynamite TNT', 'Hercules', 'nvidia', 'AGP', 1998, 2000, 16, 199, 4, 12, 'h');
t('ASUS AGP-V3400TNT', 'ASUS', 'nvidia', 'AGP', 1998, 2000, 16, 189, 4, 12, 'f');
t('Leadtek WinFast 3D S320', 'Leadtek', 'nvidia', 'AGP', 1998, 2000, 16, 169, 3, 12, 'h');
t('Matrox Millennium G200 AGP 8MB', 'Matrox', 'matrox', 'AGP', 1998, 2000, 8, 149, 3, 6, 'h');
t('Matrox Mystique G200 AGP', 'Matrox', 'matrox', 'AGP', 1998, 2000, 8, 129, 3, 6, 'h');
t('Matrox Marvel G200-TV', 'Matrox', 'matrox', 'AGP', 1998, 2000, 8, 299, 4, 8, 'h');
t('Matrox Millennium G200 PCI 8MB', 'Matrox', 'matrox', 'PCI', 1998, 2001, 8, 179, 3, 6, 'h');
t('Creative 3D Blaster Banshee PCI', 'Creative', '3dfx', 'PCI', 1998, 2000, 16, 149, 3, 10, 'h');
t('Creative 3D Blaster Banshee AGP', 'Creative', '3dfx', 'AGP', 1998, 2000, 16, 149, 3, 10, 'h');
t('Diamond Monster Fusion PCI', 'Diamond', '3dfx', 'PCI', 1998, 2000, 16, 139, 3, 10, 'h');
t('Guillemot Maxi Gamer Phoenix PCI', 'Guillemot', '3dfx', 'PCI', 1998, 2000, 16, 149, 3, 10, 'h');
t('ELSA Victory II PCI', 'ELSA', '3dfx', 'PCI', 1998, 2000, 16, 149, 3, 10, 'h');
t('Hercules Terminator BEAST', 'Hercules', 's3', 'AGP', 1998, 1999, 8, 129, 3, 8, 'h');

// 1999: TNT2, Voodoo3, G400, Savage4, Rage 128, GeForce 256, PowerVR Series2
t('Diamond Viper V770 32MB', 'Diamond', 'nvidia', 'AGP', 1999, 2001, 32, 199, 4, 15, 'h');
t('Diamond Viper V770 Ultra', 'Diamond', 'nvidia', 'AGP', 1999, 2001, 32, 249, 5, 18, 'f');
t('Creative 3D Blaster RIVA TNT2', 'Creative', 'nvidia', 'AGP', 1999, 2001, 32, 199, 4, 15, 'f');
t('Creative 3D Blaster RIVA TNT2 Ultra', 'Creative', 'nvidia', 'AGP', 1999, 2001, 32, 249, 5, 18, 'f');
t('Creative 3D Blaster RIVA TNT2 Value', 'Creative', 'nvidia', 'AGP', 1999, 2001, 16, 119, 2, 10, 'h');
t('ELSA ERAZOR III', 'ELSA', 'nvidia', 'AGP', 1999, 2001, 32, 229, 4, 15, 'f');
t('Hercules Dynamite TNT2 Ultra', 'Hercules', 'nvidia', 'AGP', 1999, 2001, 32, 249, 5, 18, 'f');
t('Guillemot Maxi Gamer Xentor 32', 'Guillemot', 'nvidia', 'AGP', 1999, 2001, 32, 249, 5, 18, 'f');
t('Guillemot Maxi Gamer Cougar', 'Guillemot', 'nvidia', 'AGP', 1999, 2001, 16, 129, 2, 10, 'h');
t('ASUS AGP-V3800 Ultra Deluxe', 'ASUS', 'nvidia', 'AGP', 1999, 2001, 32, 269, 5, 18, 'f');
t('ASUS AGP-V3800 32MB', 'ASUS', 'nvidia', 'AGP', 1999, 2001, 32, 199, 4, 15, 'f');
t('Leadtek WinFast 3D S320 II', 'Leadtek', 'nvidia', 'AGP', 1999, 2001, 32, 199, 4, 15, 'f');
t('Canopus Spectra 5400 Premium Edition', 'Canopus', 'nvidia', 'AGP', 1999, 2001, 32, 279, 5, 18, 'f');
t('MSI MS-8808 RIVA TNT2 M64', 'MSI', 'nvidia', 'AGP', 1999, 2001, 16, 99, 2, 10, 'h');
t('3dfx Voodoo3 1000 AGP', '3dfx', '3dfx', 'AGP', 1999, 2001, 16, 99, 2, 12, 'h');
t('3dfx Voodoo3 2000 PCI', '3dfx', '3dfx', 'PCI', 1999, 2001, 16, 129, 3, 12, 'h');
t('3dfx Voodoo3 2000 AGP', '3dfx', '3dfx', 'AGP', 1999, 2001, 16, 129, 3, 12, 'h');
t('3dfx Voodoo3 3000 PCI', '3dfx', '3dfx', 'PCI', 1999, 2001, 16, 179, 4, 15, 'h');
t('3dfx Voodoo3 3000 AGP', '3dfx', '3dfx', 'AGP', 1999, 2001, 16, 179, 4, 15, 'h');
t('3dfx Voodoo3 3500 TV AGP', '3dfx', '3dfx', 'AGP', 1999, 2001, 16, 249, 5, 18, 'h');
t('Matrox Millennium G400 16MB', 'Matrox', 'matrox', 'AGP', 1999, 2001, 16, 199, 4, 10, 'h');
t('Matrox Millennium G400 DualHead 32MB', 'Matrox', 'matrox', 'AGP', 1999, 2001, 32, 249, 4, 10, 'h');
t('Matrox Millennium G400 MAX', 'Matrox', 'matrox', 'AGP', 1999, 2001, 32, 299, 5, 12, 'f');
t('Matrox Marvel G400-TV', 'Matrox', 'matrox', 'AGP', 1999, 2001, 16, 349, 5, 12, 'h');
t('Creative 3D Blaster Savage4', 'Creative', 's3', 'AGP', 1999, 2001, 32, 129, 3, 8, 'h');
t('Diamond Stealth III S540', 'Diamond', 's3', 'AGP', 1999, 2001, 32, 129, 3, 8, 'h');
t('Diamond Viper II Z200', 'Diamond', 's3', 'AGP', 1999, 2001, 32, 199, 4, 12, 'f');
t('ATI Rage Fury 32MB', 'ATI', 'ati', 'AGP', 1999, 2001, 32, 199, 4, 10, 'h');
t('ATI Rage Fury MAXX', 'ATI', 'ati', 'AGP', 1999, 2001, 64, 249, 5, 20, 'f', { len: 3 });
t('ATI Xpert 2000 AGP', 'ATI', 'ati', 'AGP', 1999, 2001, 32, 119, 2, 8, 'h');
t('ATI Xpert 2000 PCI', 'ATI', 'ati', 'PCI', 1999, 2002, 32, 119, 2, 8, 'h');
t('ATI All-in-Wonder 128', 'ATI', 'ati', 'AGP', 1999, 2001, 16, 199, 4, 10, 'h');
t('VideoLogic Neon 250', 'VideoLogic', 'powervr', 'AGP', 1999, 2001, 32, 149, 3, 8, 'h');
t('Creative 3D Blaster Annihilator', 'Creative', 'nvidia', 'AGP', 1999, 2001, 32, 249, 5, 16, 'f');
t('ELSA ERAZOR X', 'ELSA', 'nvidia', 'AGP', 1999, 2001, 32, 279, 5, 16, 'f');
t('Guillemot 3D Prophet', 'Guillemot', 'nvidia', 'AGP', 1999, 2001, 32, 249, 5, 16, 'f');
t('ASUS AGP-V6600 Deluxe', 'ASUS', 'nvidia', 'AGP', 1999, 2001, 32, 279, 5, 16, 'f');
t('Leadtek WinFast GeForce 256', 'Leadtek', 'nvidia', 'AGP', 1999, 2001, 32, 249, 5, 16, 'f');

// 2000–2001: GeForce2, Radeon, Voodoo4/5, G450, Kyro, GeForce3, Radeon 8500, G550
t('Creative 3D Blaster Annihilator Pro', 'Creative', 'nvidia', 'AGP', 2000, 2001, 32, 299, 5, 18, 'f');
t('ELSA ERAZOR X²', 'ELSA', 'nvidia', 'AGP', 2000, 2001, 32, 329, 5, 18, 'f');
t('Guillemot 3D Prophet DDR-DVI', 'Guillemot', 'nvidia', 'AGP', 2000, 2001, 32, 299, 5, 18, 'f', VD);
t('ASUS AGP-V6800 Deluxe', 'ASUS', 'nvidia', 'AGP', 2000, 2001, 32, 329, 5, 18, 'f');
t('ASUS AGP-V7100 32MB', 'ASUS', 'nvidia', 'AGP', 2000, 2002, 32, 119, 2, 10, 'h');
t('Creative 3D Blaster GeForce2 MX', 'Creative', 'nvidia', 'AGP', 2000, 2002, 32, 129, 2, 10, 'h');
t('ELSA GLADIAC MX', 'ELSA', 'nvidia', 'AGP', 2000, 2002, 32, 129, 2, 10, 'h');
t('Hercules 3D Prophet II MX', 'Hercules', 'nvidia', 'AGP', 2000, 2002, 32, 119, 2, 10, 'h');
t('Leadtek WinFast GeForce2 MX', 'Leadtek', 'nvidia', 'AGP', 2000, 2002, 32, 119, 2, 10, 'h');
t('Leadtek WinFast GeForce2 MX PCI', 'Leadtek', 'nvidia', 'PCI', 2000, 2003, 32, 129, 2, 10, 'h');
t('Creative 3D Blaster GeForce2 GTS', 'Creative', 'nvidia', 'AGP', 2000, 2002, 32, 299, 5, 20, 'f');
t('ELSA GLADIAC GeForce2 GTS', 'ELSA', 'nvidia', 'AGP', 2000, 2002, 32, 299, 5, 20, 'f');
t('Hercules 3D Prophet II GTS 32MB', 'Hercules', 'nvidia', 'AGP', 2000, 2002, 32, 299, 5, 20, 'f');
t('Hercules 3D Prophet II GTS 64MB', 'Hercules', 'nvidia', 'AGP', 2000, 2002, 64, 399, 5, 22, 'f');
t('ASUS AGP-V7700 Deluxe', 'ASUS', 'nvidia', 'AGP', 2000, 2002, 32, 349, 5, 20, 'f');
t('Leadtek WinFast GeForce2 GTS', 'Leadtek', 'nvidia', 'AGP', 2000, 2002, 32, 299, 5, 20, 'f');
t('Hercules 3D Prophet II Ultra', 'Hercules', 'nvidia', 'AGP', 2000, 2002, 64, 499, 5, 25, 'f');
t('ELSA GLADIAC Ultra', 'ELSA', 'nvidia', 'AGP', 2000, 2002, 64, 499, 5, 25, 'f');
t('ASUS AGP-V7700 Ultra Deluxe', 'ASUS', 'nvidia', 'AGP', 2000, 2002, 64, 499, 5, 25, 'f');
t('Hercules 3D Prophet II Pro', 'Hercules', 'nvidia', 'AGP', 2001, 2002, 64, 299, 4, 22, 'f');
t('Leadtek WinFast GeForce2 Pro', 'Leadtek', 'nvidia', 'AGP', 2001, 2002, 64, 249, 4, 22, 'f');
t('ATI Radeon 32MB SDR', 'ATI', 'ati', 'AGP', 2000, 2002, 32, 149, 3, 15, 'h');
t('ATI Radeon 32MB DDR', 'ATI', 'ati', 'AGP', 2000, 2002, 32, 249, 4, 18, 'h');
t('ATI Radeon 64MB DDR VIVO', 'ATI', 'ati', 'AGP', 2000, 2002, 64, 399, 5, 20, 'h');
t('ATI All-in-Wonder Radeon', 'ATI', 'ati', 'AGP', 2000, 2002, 32, 299, 5, 18, 'h');
t('ATI Radeon VE', 'ATI', 'ati', 'AGP', 2001, 2003, 32, 99, 2, 8, 'h');
t('3dfx Voodoo4 4500 AGP', '3dfx', '3dfx', 'AGP', 2000, 2001, 32, 179, 3, 15, 'h');
t('3dfx Voodoo4 4500 PCI', '3dfx', '3dfx', 'PCI', 2000, 2002, 32, 179, 3, 15, 'h');
t('3dfx Voodoo5 5500 AGP', '3dfx', '3dfx', 'AGP', 2000, 2001, 64, 299, 5, 45, 'f', { ...M, len: 3 });
t('3dfx Voodoo5 5500 PCI', '3dfx', '3dfx', 'PCI', 2000, 2002, 64, 299, 5, 45, 'f', { ...M, len: 3 });
t('Matrox Millennium G450 32MB', 'Matrox', 'matrox', 'AGP', 2000, 2003, 32, 149, 3, 8, 'b');
t('Matrox Millennium G450 PCI 16MB', 'Matrox', 'matrox', 'PCI', 2001, 2004, 16, 179, 3, 8, 'b');
t('VideoLogic Vivid!', 'VideoLogic', 'powervr', 'AGP', 2000, 2002, 32, 129, 3, 8, 'h');
t('Hercules 3D Prophet 4000XT PCI', 'Hercules', 'powervr', 'PCI', 2001, 2002, 32, 99, 2, 8, 'h');
t('Hercules 3D Prophet 4500', 'Hercules', 'powervr', 'AGP', 2001, 2003, 64, 149, 3, 10, 'f');
t('VideoLogic Vivid!XS', 'VideoLogic', 'powervr', 'AGP', 2001, 2003, 32, 99, 2, 8, 'h');
t('ELSA GLADIAC 920', 'ELSA', 'nvidia', 'AGP', 2001, 2003, 64, 499, 5, 30, 'f', VD);
t('Hercules 3D Prophet III', 'Hercules', 'nvidia', 'AGP', 2001, 2003, 64, 499, 5, 30, 'f');
t('ASUS AGP-V8200 Deluxe', 'ASUS', 'nvidia', 'AGP', 2001, 2003, 64, 549, 5, 30, 'f', VD);
t('Leadtek WinFast GeForce3 TD', 'Leadtek', 'nvidia', 'AGP', 2001, 2003, 64, 499, 5, 30, 'f');
t('VisionTek Xtasy GeForce3', 'VisionTek', 'nvidia', 'AGP', 2001, 2003, 64, 449, 5, 30, 'f');
t('Leadtek WinFast GeForce3 Ti 200 TDH', 'Leadtek', 'nvidia', 'AGP', 2001, 2003, 64, 199, 4, 28, 'f');
t('MSI G3Ti500-VTG', 'MSI', 'nvidia', 'AGP', 2001, 2003, 64, 349, 5, 32, 'f', VD);
t('MSI GeForce2 MX 400 64MB', 'MSI', 'nvidia', 'AGP', 2001, 2003, 64, 99, 2, 10, 'h');
t('ASUS AGP-V7100 Pro', 'ASUS', 'nvidia', 'AGP', 2001, 2003, 64, 109, 2, 10, 'h');
t('Leadtek WinFast GeForce2 MX 400 PCI', 'Leadtek', 'nvidia', 'PCI', 2001, 2004, 64, 109, 2, 10, 'h');
t('PNY Verto GeForce2 MX 400 PCI', 'PNY', 'nvidia', 'PCI', 2001, 2004, 64, 99, 2, 10, 'h');
t('ATI Radeon 7000 PCI 64MB', 'ATI', 'ati', 'PCI', 2001, 2004, 64, 69, 1, 8, 'h');
t('ATI Radeon 7500 64MB', 'ATI', 'ati', 'AGP', 2001, 2003, 64, 149, 3, 20, 'h', VD);
t('ATI Radeon 8500 64MB', 'ATI', 'ati', 'AGP', 2001, 2003, 64, 299, 5, 30, 'f', VD);
t('ATI Radeon 8500LE 64MB', 'ATI', 'ati', 'AGP', 2001, 2003, 64, 199, 4, 28, 'f', VD);
t('ATI All-in-Wonder Radeon 8500DV', 'ATI', 'ati', 'AGP', 2001, 2003, 64, 399, 5, 30, 'f');
t('Matrox Millennium G550 32MB', 'Matrox', 'matrox', 'AGP', 2001, 2004, 32, 149, 3, 8, 'h', VD);

// 2002–2003: GeForce4, Radeon 9000–9800, Parhelia, GeForce FX
t('Hercules 3D Prophet 7500', 'Hercules', 'ati', 'AGP', 2002, 2003, 64, 129, 3, 20, 'h', VD);
t('Hercules 3D Prophet 8500 128MB', 'Hercules', 'ati', 'AGP', 2002, 2003, 128, 299, 5, 30, 'f', VD);
t('ASUS V8420 Deluxe', 'ASUS', 'nvidia', 'AGP', 2002, 2004, 64, 199, 4, 35, 'f');
t('ASUS V8440 Deluxe', 'ASUS', 'nvidia', 'AGP', 2002, 2004, 128, 299, 5, 38, 'f');
t('ASUS V8460 Ultra Deluxe', 'ASUS', 'nvidia', 'AGP', 2002, 2004, 128, 399, 5, 40, 'f');
t('MSI G4Ti4200-TD', 'MSI', 'nvidia', 'AGP', 2002, 2004, 64, 179, 4, 35, 'f');
t('MSI G4Ti4600-VTD', 'MSI', 'nvidia', 'AGP', 2002, 2004, 128, 399, 5, 40, 'f');
t('Leadtek WinFast A250 TD', 'Leadtek', 'nvidia', 'AGP', 2002, 2004, 128, 199, 4, 35, 'f');
t('Leadtek WinFast A250 Ultra TD', 'Leadtek', 'nvidia', 'AGP', 2002, 2004, 128, 399, 5, 40, 'f');
t('Gainward PowerPack! Ultra/750 XP', 'Gainward', 'nvidia', 'AGP', 2002, 2004, 128, 419, 5, 40, 'f');
t('PNY Verto GeForce4 Ti 4200', 'PNY', 'nvidia', 'AGP', 2002, 2004, 64, 179, 4, 35, 'f');
t('VisionTek Xtasy GeForce4 Ti 4600', 'VisionTek', 'nvidia', 'AGP', 2002, 2004, 128, 399, 5, 40, 'f');
t('Albatron GeForce4 Ti 4200P Turbo', 'Albatron', 'nvidia', 'AGP', 2002, 2004, 64, 169, 4, 35, 'f');
t('ELSA GLADIAC 925', 'ELSA', 'nvidia', 'AGP', 2002, 2003, 128, 399, 5, 40, 'f');
t('ASUS V8170 Deluxe', 'ASUS', 'nvidia', 'AGP', 2002, 2004, 64, 119, 2, 15, 'h');
t('MSI G4MX440-T', 'MSI', 'nvidia', 'AGP', 2002, 2004, 64, 99, 2, 15, 'h');
t('Leadtek WinFast A170 DDR T', 'Leadtek', 'nvidia', 'AGP', 2002, 2004, 64, 99, 2, 15, 'h');
t('PNY Verto GeForce4 MX 440 PCI', 'PNY', 'nvidia', 'PCI', 2002, 2004, 64, 99, 2, 15, 'h');
t('ASUS V9180 Magic', 'ASUS', 'nvidia', 'AGP', 2003, 2005, 64, 79, 1, 15, 'h');
t('ATI Radeon 9000 PRO 64MB', 'ATI', 'ati', 'AGP', 2002, 2004, 64, 129, 3, 25, 'h');
t('Hercules 3D Prophet 9000 PRO', 'Hercules', 'ati', 'AGP', 2002, 2004, 64, 129, 3, 25, 'f');
t('Sapphire Atlantis Radeon 9000 64MB', 'Sapphire', 'ati', 'AGP', 2002, 2004, 64, 99, 2, 22, 'h');
t('ATI Radeon 9700 PRO 128MB', 'ATI', 'ati', 'AGP', 2002, 2004, 128, 399, 5, 55, 'f', M);
t('ATI All-in-Wonder 9700 PRO', 'ATI', 'ati', 'AGP', 2002, 2004, 128, 449, 5, 55, 'f', M);
t('Hercules 3D Prophet 9700 PRO', 'Hercules', 'ati', 'AGP', 2002, 2004, 128, 399, 5, 55, 'f', M);
t('Sapphire Atlantis Radeon 9700 PRO', 'Sapphire', 'ati', 'AGP', 2002, 2004, 128, 379, 5, 55, 'f', M);
t('Gigabyte GV-R9700 PRO', 'Gigabyte', 'ati', 'AGP', 2002, 2004, 128, 379, 5, 55, 'f', M);
t('ATI Radeon 9700 128MB', 'ATI', 'ati', 'AGP', 2003, 2004, 128, 299, 4, 50, 'f', M);
t('Matrox Parhelia-512 128MB', 'Matrox', 'matrox', 'AGP', 2002, 2004, 128, 399, 5, 35, 'h', { out: ['DVI'] });
t('Sapphire Radeon 9200 PCI 128MB', 'Sapphire', 'ati', 'PCI', 2003, 2006, 128, 79, 1, 20, 'h');
t('ASUS V9520 Magic', 'ASUS', 'nvidia', 'AGP', 2003, 2005, 128, 99, 2, 22, 'h');
t('MSI FX5200-T128', 'MSI', 'nvidia', 'AGP', 2003, 2005, 128, 89, 2, 22, 'h');
t('XFX GeForce FX 5200 128MB', 'XFX', 'nvidia', 'AGP', 2003, 2005, 128, 89, 2, 22, 'h');
t('PNY Verto GeForce FX 5200 PCI', 'PNY', 'nvidia', 'PCI', 2003, 2006, 128, 99, 2, 22, 'h');
t('ASUS V9560 Video Suite', 'ASUS', 'nvidia', 'AGP', 2003, 2004, 128, 179, 3, 30, 'f');
t('MSI FX5600-VTDR128', 'MSI', 'nvidia', 'AGP', 2003, 2004, 128, 169, 3, 30, 'f');
t('ASUS V9570', 'ASUS', 'nvidia', 'AGP', 2003, 2005, 128, 149, 3, 35, 'f');
t('MSI FX5700-TD128', 'MSI', 'nvidia', 'AGP', 2003, 2005, 128, 149, 3, 35, 'f');
t('MSI FX5700 Ultra-TD128', 'MSI', 'nvidia', 'AGP', 2003, 2005, 128, 199, 4, 45, 'f', M);
t('XFX GeForce FX 5700 Ultra', 'XFX', 'nvidia', 'AGP', 2003, 2005, 128, 199, 4, 45, 'f', M);
t('PNY Verto GeForce FX 5700 LE', 'PNY', 'nvidia', 'AGP', 2004, 2005, 128, 99, 2, 30, 'h');
t('ASUS V9900 Ultra', 'ASUS', 'nvidia', 'AGP', 2003, 2004, 128, 399, 5, 75, 'D', M);
t('Leadtek WinFast A300 Ultra TD', 'Leadtek', 'nvidia', 'AGP', 2003, 2004, 128, 399, 5, 75, 'D', M);
t('ASUS V9950', 'ASUS', 'nvidia', 'AGP', 2003, 2005, 128, 299, 4, 60, 'f', M);
t('MSI FX5900-VTD128', 'MSI', 'nvidia', 'AGP', 2003, 2005, 128, 299, 4, 60, 'f', M);
t('Leadtek WinFast A350 TDH', 'Leadtek', 'nvidia', 'AGP', 2003, 2005, 128, 299, 4, 60, 'f', M);
t('PNY Verto GeForce FX 5900 XT', 'PNY', 'nvidia', 'AGP', 2003, 2005, 128, 199, 4, 55, 'f', M);
t('Gainward FX PowerPack! Ultra/1600 XP Golden Sample', 'Gainward', 'nvidia', 'AGP', 2003, 2004, 256, 499, 5, 70, 'D', M);
t('ASUS V9980 Ultra', 'ASUS', 'nvidia', 'AGP', 2003, 2005, 256, 499, 5, 75, 'D', M);
t('Leadtek WinFast A380 Ultra TDH', 'Leadtek', 'nvidia', 'AGP', 2003, 2005, 256, 499, 5, 75, 'D', M);
t('MSI FX5950 Ultra-VTD256', 'MSI', 'nvidia', 'AGP', 2003, 2005, 256, 499, 5, 75, 'D', M);
t('ATI Radeon 9600 PRO 128MB', 'ATI', 'ati', 'AGP', 2003, 2005, 128, 169, 3, 25, 'h');
t('ATI Radeon 9600 XT 128MB', 'ATI', 'ati', 'AGP', 2003, 2005, 128, 199, 3, 30, 'f');
t('Sapphire Atlantis Radeon 9600 128MB', 'Sapphire', 'ati', 'AGP', 2003, 2005, 128, 129, 2, 22, 'h');
t('PowerColor Radeon 9600 XT', 'PowerColor', 'ati', 'AGP', 2003, 2005, 128, 179, 3, 30, 'f');
t('Club 3D Radeon 9600 128MB', 'Club 3D', 'ati', 'AGP', 2003, 2005, 128, 119, 2, 22, 'h');
t('Gigabyte GV-R96P128D', 'Gigabyte', 'ati', 'AGP', 2003, 2005, 128, 159, 3, 25, 'h');
t('HIS Excalibur Radeon 9600 XT IceQ', 'HIS', 'ati', 'AGP', 2004, 2005, 128, 199, 3, 30, 'D');
t('ATI Radeon 9800 PRO 128MB', 'ATI', 'ati', 'AGP', 2003, 2005, 128, 399, 5, 60, 'f', M);
t('ATI Radeon 9800 XT 256MB', 'ATI', 'ati', 'AGP', 2003, 2005, 256, 499, 5, 65, 'f', M);
t('Sapphire Atlantis Radeon 9800 PRO 128MB', 'Sapphire', 'ati', 'AGP', 2003, 2005, 128, 349, 5, 60, 'f', M);
t('Hercules 3D Prophet 9800 PRO', 'Hercules', 'ati', 'AGP', 2003, 2004, 128, 379, 5, 60, 'f', M);
t('HIS Excalibur Radeon 9800 PRO IceQ', 'HIS', 'ati', 'AGP', 2003, 2005, 128, 379, 5, 60, 'D', M);
t('ATI All-in-Wonder 9800 PRO', 'ATI', 'ati', 'AGP', 2003, 2005, 128, 449, 5, 60, 'f', M);
t('Sapphire Radeon 9800 SE 128MB', 'Sapphire', 'ati', 'AGP', 2004, 2005, 128, 179, 3, 50, 'f', M);
t('Sapphire Radeon 9550 128MB', 'Sapphire', 'ati', 'AGP', 2004, 2006, 128, 79, 1, 20, 'h');
t('Sapphire Radeon 9250 128MB', 'Sapphire', 'ati', 'AGP', 2004, 2006, 128, 59, 1, 18, 'h');
t('Sapphire Radeon 9250 PCI 128MB', 'Sapphire', 'ati', 'PCI', 2004, 2007, 128, 69, 1, 18, 'h');
t('PNY Verto GeForce FX 5500 PCI 256MB', 'PNY', 'nvidia', 'PCI', 2004, 2007, 256, 79, 1, 22, 'h');

// 2004–2009: sista AGP-korten (GeForce 6/7, Radeon X800–HD 4650)
t('ASUS V9999 Ultra Deluxe', 'ASUS', 'nvidia', 'AGP', 2004, 2006, 256, 499, 5, 100, 'D', M);
t('Leadtek WinFast A400 Ultra TDH', 'Leadtek', 'nvidia', 'AGP', 2004, 2006, 256, 499, 5, 100, 'D', M);
t('MSI NX6800 Ultra-T2D256', 'MSI', 'nvidia', 'AGP', 2004, 2006, 256, 499, 5, 100, 'D', M);
t('Gainward PowerPack! Ultra/2600 Golden Sample', 'Gainward', 'nvidia', 'AGP', 2004, 2005, 256, 549, 5, 100, 'D', M);
t('BFG GeForce 6800 Ultra OC AGP', 'BFG', 'nvidia', 'AGP', 2004, 2006, 256, 529, 5, 100, 'D', M);
t('ASUS V9999 GT', 'ASUS', 'nvidia', 'AGP', 2004, 2006, 256, 399, 5, 75, 'f', M);
t('Leadtek WinFast A400 GT TDH', 'Leadtek', 'nvidia', 'AGP', 2004, 2006, 256, 399, 5, 75, 'D', M);
t('MSI NX6800GT-T2D256', 'MSI', 'nvidia', 'AGP', 2004, 2006, 256, 399, 5, 75, 'f', M);
t('Gigabyte GV-N68T256D', 'Gigabyte', 'nvidia', 'AGP', 2004, 2006, 256, 399, 5, 75, 'f', M);
t('Leadtek WinFast A400 TDH', 'Leadtek', 'nvidia', 'AGP', 2004, 2006, 128, 299, 4, 60, 'f', M);
t('XFX GeForce 6800 GS AGP', 'XFX', 'nvidia', 'AGP', 2005, 2007, 256, 249, 4, 65, 'f', M);
t('Leadtek WinFast A6600 GT TDH', 'Leadtek', 'nvidia', 'AGP', 2005, 2007, 128, 199, 3, 50, 'f', M);
t('XFX GeForce 6600 GT AGP', 'XFX', 'nvidia', 'AGP', 2005, 2007, 128, 199, 3, 50, 'f', M);
t('MSI NX6600GT-VTD128 AGP', 'MSI', 'nvidia', 'AGP', 2005, 2007, 128, 199, 3, 50, 'f', M);
t('XFX GeForce 6200 AGP 256MB', 'XFX', 'nvidia', 'AGP', 2005, 2007, 256, 69, 1, 20, 'h', { len: 2 });
t('XFX GeForce 7800 GS AGP', 'XFX', 'nvidia', 'AGP', 2006, 2007, 256, 299, 4, 75, 'f', M);
t('BFG GeForce 7800 GS OC AGP', 'BFG', 'nvidia', 'AGP', 2006, 2007, 256, 299, 4, 75, 'f', M);
t('Gainward BLISS 7800 GS+ AGP', 'Gainward', 'nvidia', 'AGP', 2006, 2007, 512, 399, 5, 80, 'f', M);
t('XFX GeForce 7600 GT AGP', 'XFX', 'nvidia', 'AGP', 2006, 2008, 256, 179, 3, 40, 'f');
t('Palit GeForce 7600 GS AGP', 'Palit', 'nvidia', 'AGP', 2006, 2008, 256, 99, 2, 30, 'h', { len: 2 });
t('XFX GeForce 7950 GT AGP', 'XFX', 'nvidia', 'AGP', 2007, 2008, 512, 249, 4, 65, 'f', M);
t('BFG GeForce 7950 GT OC AGP', 'BFG', 'nvidia', 'AGP', 2007, 2008, 512, 249, 4, 65, 'f', M);
t('ATI Radeon X800 PRO AGP', 'ATI', 'ati', 'AGP', 2004, 2006, 256, 399, 5, 55, 'f', M);
t('Sapphire Radeon X800 PRO AGP', 'Sapphire', 'ati', 'AGP', 2004, 2006, 256, 379, 5, 55, 'f', M);
t('HIS Excalibur Radeon X800 PRO IceQ II AGP', 'HIS', 'ati', 'AGP', 2004, 2006, 256, 399, 5, 55, 'D', M);
t('ATI Radeon X800 XT Platinum Edition AGP', 'ATI', 'ati', 'AGP', 2004, 2006, 256, 499, 5, 70, 'f', M);
t('Sapphire Radeon X800 XL AGP', 'Sapphire', 'ati', 'AGP', 2005, 2006, 256, 299, 4, 60, 'f', M);
t('Sapphire Radeon X800 GTO AGP', 'Sapphire', 'ati', 'AGP', 2005, 2007, 256, 249, 4, 55, 'f', M);
t('Sapphire Radeon X850 XT AGP', 'Sapphire', 'ati', 'AGP', 2005, 2006, 256, 449, 5, 70, 'D', M);
t('ATI Radeon X850 XT Platinum Edition AGP', 'ATI', 'ati', 'AGP', 2005, 2006, 256, 549, 5, 75, 'D', M);
t('Sapphire Radeon X1550 AGP 512MB', 'Sapphire', 'ati', 'AGP', 2006, 2008, 512, 79, 1, 30, 'h');
t('Sapphire Radeon X1600 PRO AGP', 'Sapphire', 'ati', 'AGP', 2006, 2007, 256, 149, 3, 40, 'f');
t('HIS Radeon X1600 PRO IceQ Turbo AGP', 'HIS', 'ati', 'AGP', 2006, 2007, 256, 159, 3, 40, 'D');
t('Sapphire Radeon X1650 PRO AGP', 'Sapphire', 'ati', 'AGP', 2006, 2008, 256, 129, 3, 45, 'f');
t('PowerColor Radeon X1650 PRO AGP', 'PowerColor', 'ati', 'AGP', 2006, 2008, 512, 139, 3, 45, 'f');
t('Sapphire Radeon X1950 PRO AGP', 'Sapphire', 'ati', 'AGP', 2006, 2008, 512, 249, 4, 90, 'f', M);
t('HIS Radeon X1950 PRO IceQ3 AGP', 'HIS', 'ati', 'AGP', 2006, 2008, 512, 259, 4, 90, 'D', M);
t('PowerColor Radeon X1950 PRO AGP', 'PowerColor', 'ati', 'AGP', 2006, 2008, 512, 239, 4, 90, 'f', M);
t('Sapphire Radeon X1950 GT AGP', 'Sapphire', 'ati', 'AGP', 2007, 2008, 512, 179, 3, 70, 'f', M);
t('Sapphire Radeon HD 2600 XT AGP', 'Sapphire', 'ati', 'AGP', 2007, 2008, 512, 149, 3, 50, 'f', M);
t('HIS Radeon HD 2600 XT IceQ Turbo AGP', 'HIS', 'ati', 'AGP', 2007, 2008, 512, 159, 3, 50, 'D', M);
t('PowerColor Radeon HD 2600 PRO AGP', 'PowerColor', 'ati', 'AGP', 2007, 2009, 512, 99, 2, 40, 'f');
t('Sapphire Radeon HD 3650 AGP', 'Sapphire', 'ati', 'AGP', 2008, 2009, 512, 99, 2, 50, 'f', M);
t('HIS Radeon HD 3650 IceQ Turbo AGP', 'HIS', 'ati', 'AGP', 2008, 2009, 512, 109, 2, 50, 'D', M);
t('Sapphire Radeon HD 3850 AGP', 'Sapphire', 'ati', 'AGP', 2008, 2009, 512, 179, 3, 75, 'f', M);
t('HIS Radeon HD 3850 IceQ Turbo AGP', 'HIS', 'ati', 'AGP', 2008, 2009, 512, 189, 3, 75, 'D', M);
t('HIS Radeon HD 4650 AGP 1GB', 'HIS', 'ati', 'AGP', 2009, 2010, 1024, 89, 2, 50, 'f');
t('Sapphire Radeon HD 4650 AGP 512MB', 'Sapphire', 'ati', 'AGP', 2009, 2010, 512, 79, 2, 50, 'f');

// Sena PCI-kort för gamla datorer utan AGP/PCIe
t('XFX GeForce 6200 PCI 256MB', 'XFX', 'nvidia', 'PCI', 2005, 2008, 256, 69, 1, 20, 'h', { len: 2 });
t('BFG GeForce 6200 OC PCI', 'BFG', 'nvidia', 'PCI', 2005, 2008, 256, 79, 1, 20, 'h', { len: 2 });
t('Zotac GeForce 8400 GS PCI 512MB', 'Zotac', 'nvidia', 'PCI', 2008, 2011, 512, 59, 1, 25, 'h', { len: 2 });
t('VisionTek Radeon HD 5450 PCI 1GB', 'VisionTek', 'ati', 'PCI', 2010, 2012, 1024, 69, 1, 19, 'h', { len: 2, out: ['VGA', 'DVI', 'HDMI'] });
t('Zotac GeForce GT 610 PCI 512MB', 'Zotac', 'nvidia', 'PCI', 2012, 2012, 512, 59, 1, 29, 'h', { len: 2, out: ['VGA', 'DVI', 'HDMI'] });

// ================= PCI Express 2004–2026: kretstabell × tillverkarserier =================
const UPPWR = { null: 'pcie6', pcie6: 'pcie8', pcie8: '2xpcie8', '2xpcie8': '3xpcie8', '3xpcie8': '3xpcie8', '12vhpwr': '12vhpwr' };
// Håll strömkontakten inom kanon-årtalen (6+2-pin ersätter 6-pin efter 2014 osv.)
function canonPwr(p, y) {
  if (!p) return null;
  if (p === 'molex') return y <= 2006 ? p : 'pcie6';
  if (p === '12vhpwr' && y < 2022) p = '3xpcie8';
  if (p === '3xpcie8' && y < 2016) p = '2xpcie8';
  if (p === '2xpcie8' && y < 2009) p = 'pcie8';
  if (p === 'pcie8' && y < 2007) p = 'pcie6';
  if (p === 'pcie6' && y > 2014) p = 'pcie8';
  return p;
}
const STYLE_LEN = { 'single-fan': 1, 'agp-heatsink': 1, blower: 2, dual: 2, triple: 3, fe: 2, astral: 3 };
const oldPcb = (b, y) => (y < 2012 ? BRAND_PCB[b] || PCB.black : PCB.black);

// chips: nyckel → [namn, år, sista år, USD, segment, watt, kontakt, VRAM MB, { tag, len, out, st, f }]
// lines: serier S(tillverkare, namnfunktion, stil, fläktar, färg, accent, 'nycklar' | '*', extra)
function gen(lb, out0, chips, lines, pcbFn = oldPcb) {
  const C = {};
  for (const [k, a] of Object.entries(chips)) {
    const [l, y, u, usd, tier, w, p, m, x = {}] = a;
    const s = l.replace(/^(GeForce|Radeon|NVIDIA|Intel Arc) /, '');
    const gb = +(m / 1024).toFixed(1);
    C[k] = { key: k, l, L: l + (x.tag || ''), s, S: s + (x.tag || ''), code: s.replace(/ /g, ''), num: (s.match(/\d+/) || [''])[0], y, u, usd, tier, w, p, m, g: String(gb), mem: m >= 1024 ? `${gb}GB` : `${m}MB`, ...x };
  }
  for (const s of lines) {
    const keys = s.only === '*' ? Object.keys(C) : s.only.split(/\s+/).filter(Boolean);
    for (const k of keys) {
      const c = C[k];
      if (!c) throw new Error(`gpu.js: okänd krets ${k} (${s.b})`);
      const year = Math.max(c.y, s.y0 || 0), until = Math.min(c.u, s.u1 || 2026);
      if (year > until) continue;
      const style = s.st || c.st || 'dual';
      const fans = s.f ?? c.f ?? (style === 'triple' || style === 'astral' ? 3 : style === 'dual' || style === 'fe' ? 2 : style === 'agp-heatsink' ? 0 : 1);
      const pwr = typeof s.pw === 'function' ? s.pw(c) : s.pw === 'up' ? UPPWR[c.p] : s.pw !== undefined ? s.pw : c.p;
      push({
        name: s.n(c), brand: s.b, year, until, cost: kr(c.usd * (s.k ?? 1.05), year), tier: c.tier,
        bus: 'PCIe', std: '3D', vram: c.m, watt: c.w, pwr: canonPwr(pwr, year),
        len: s.len || Math.max(STYLE_LEN[style] || 2, c.len || 1), out: s.out || c.out || out0, rgb: !!s.rgb,
        look: { brand: lb, style, fans, color: s.col, accent: s.acc, pcb: s.pcb || pcbFn(s.b, year) },
      });
    }
  }
}
const S = (b, n, st, f, col, acc, only, x = {}) => ({ b, n, st, f, col, acc, only, ...x });

// ---------- NVIDIA GeForce 6 och 7 (PCIe) ----------
gen('nvidia', ['VGA', 'DVI'], {
  '6200tc': ['GeForce 6200 TurboCache', 2005, 2007, 79, 1, 25, null, 128, { st: 'agp-heatsink' }],
  '6600': ['GeForce 6600', 2004, 2006, 149, 2, 30, null, 256, { st: 'single-fan' }],
  '6600gt': ['GeForce 6600 GT', 2004, 2006, 199, 3, 50, null, 128, { st: 'single-fan', len: 2 }],
  '6800': ['GeForce 6800', 2004, 2006, 299, 4, 60, 'pcie6', 256, { st: 'single-fan', len: 2 }],
  '6800gs': ['GeForce 6800 GS', 2005, 2006, 249, 3, 60, 'pcie6', 256, { st: 'single-fan', len: 2 }],
  '6800gt': ['GeForce 6800 GT', 2004, 2006, 399, 4, 70, 'pcie6', 256, { st: 'single-fan', len: 2 }],
  '6800u': ['GeForce 6800 Ultra', 2004, 2006, 499, 5, 90, 'pcie6', 256, { st: 'blower', len: 3, out: ['DVI'] }],
  '7300gs': ['GeForce 7300 GS', 2006, 2008, 79, 1, 20, null, 256, { st: 'agp-heatsink' }],
  '7300gt': ['GeForce 7300 GT', 2006, 2008, 99, 1, 25, null, 256, { st: 'agp-heatsink' }],
  '7600gs': ['GeForce 7600 GS', 2006, 2008, 129, 2, 30, null, 256, { st: 'agp-heatsink', len: 2 }],
  '7600gt': ['GeForce 7600 GT', 2006, 2008, 179, 3, 40, null, 256, { st: 'single-fan', len: 2 }],
  '7800gt': ['GeForce 7800 GT', 2005, 2006, 449, 4, 60, 'pcie6', 256, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '7800gtx': ['GeForce 7800 GTX', 2005, 2006, 599, 5, 80, 'pcie6', 256, { st: 'single-fan', len: 3, out: ['DVI'] }],
  '7800gtx512': ['GeForce 7800 GTX 512', 2005, 2006, 649, 5, 90, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  '7900gs': ['GeForce 7900 GS', 2006, 2008, 199, 3, 50, null, 256, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '7900gt': ['GeForce 7900 GT', 2006, 2007, 299, 4, 50, null, 256, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '7900gtx': ['GeForce 7900 GTX', 2006, 2007, 499, 5, 85, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  '7950gt': ['GeForce 7950 GT', 2006, 2008, 299, 4, 60, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '7950gx2': ['GeForce 7950 GX2', 2006, 2007, 599, 5, 110, 'pcie6', 1024, { st: 'blower', len: 3, out: ['DVI'] }],
}, [
  S('ASUS', (c) => `ASUS EN${c.code} ${c.mem}`, null, null, '#2a3a5a', '#c0c6cc', '6600 6600gt 6800gt 6800u 7300gt 7600gs 7600gt 7800gt 7800gtx 7900gt 7900gtx 7950gt 7950gx2'),
  S('MSI', (c) => `MSI NX${c.code} ${c.mem}`, null, null, '#3a1f22', '#c9323a', '6200tc 6600 6600gt 6800 6800gt 6800u 7300gs 7600gs 7600gt 7800gt 7800gtx 7900gs 7900gt 7900gtx 7950gt'),
  S('Leadtek', (c) => `Leadtek WinFast PX${c.s} TDH`, null, null, '#2d3a2d', '#e8c030', '6600 6600gt 6800gt 6800u 7600gt 7800gt 7800gtx 7900gt 7900gtx 7950gt'),
  S('Gigabyte', (c) => `Gigabyte GV-NX${c.num.slice(0, 2)}${/GT$/.test(c.s) ? 'T' : /GS$/.test(c.s) ? 'G' : ''}${c.m}D${c.y >= 2006 ? '-RH' : ''}`, 'agp-heatsink', 0, '#1f3f8f', '#e07a2e', '6600 6600gt 7300gt 7600gs 7600gt 7900gt'),
  S('XFX', (c) => `XFX ${c.l} ${c.mem}`, null, null, '#1b1c1f', '#76b900', '6200tc 6600gt 6800gs 6800gt 7300gs 7600gs 7600gt 7800gt 7900gs 7900gt 7900gtx 7950gt 7950gx2'),
  S('XFX', (c) => `XFX ${c.l} XXX Edition`, null, null, '#1b1c1f', '#76b900', '6600gt 7600gt 7800gt 7800gtx 7900gt 7950gt', { k: 1.15 }),
  S('EVGA', (c) => `EVGA e-GeForce ${c.s} ${c.mem}`, null, null, '#1f2023', '#c9323a', '6600gt 6800gt 6800u 7300gt 7600gt 7800gt 7800gtx 7800gtx512 7900gt 7900gtx 7950gt 7950gx2'),
  S('EVGA', (c) => `EVGA e-GeForce ${c.s} KO`, null, null, '#1f2023', '#c9323a', '7600gt 7800gt 7900gt 7950gt', { k: 1.15 }),
  S('BFG', (c) => `BFG ${c.l} OC`, null, null, '#1f2a1f', '#76b900', '6600gt 6800gt 6800u 7600gt 7800gt 7800gtx 7900gt 7900gtx 7950gt 7950gx2', { k: 1.1 }),
  S('PNY', (c) => `PNY Verto ${c.l} ${c.mem}`, null, null, '#2a2c30', '#c0c6cc', '6200tc 6600 6600gt 6800gt 7300gs 7600gs 7600gt 7800gt 7900gt'),
  S('Gainward', (c) => `Gainward BLISS ${c.s} Golden Sample`, null, null, '#3a1f22', '#e8c030', '7600gs 7600gt 7800gt 7900gs 7900gt 7950gt', { k: 1.1 }),
  S('Point of View', (c) => `Point of View ${c.l} ${c.mem}`, null, null, '#2a2c30', '#e07a2e', '6600 6600gt 7300gt 7600gs 7600gt 7900gs 7900gt'),
  S('Club 3D', (c) => `Club 3D ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c9323a', '6600 7300gs 7600gs 7600gt'),
]);

// ---------- ATI Radeon X300–X1950 (PCIe) ----------
gen('ati', ['VGA', 'DVI'], {
  x300: ['Radeon X300', 2004, 2006, 79, 1, 25, null, 128, { st: 'agp-heatsink' }],
  x550: ['Radeon X550', 2005, 2006, 89, 1, 30, null, 256, { st: 'agp-heatsink' }],
  x600pro: ['Radeon X600 PRO', 2004, 2006, 129, 2, 30, null, 128, { st: 'single-fan' }],
  x600xt: ['Radeon X600 XT', 2004, 2006, 179, 2, 40, null, 128, { st: 'single-fan' }],
  x700pro: ['Radeon X700 PRO', 2004, 2006, 199, 3, 45, null, 256, { st: 'single-fan', len: 2 }],
  x800xl: ['Radeon X800 XL', 2005, 2006, 299, 4, 60, null, 256, { st: 'single-fan', len: 2 }],
  x800gto: ['Radeon X800 GTO', 2005, 2006, 249, 4, 60, null, 256, { st: 'single-fan', len: 2 }],
  x800xt: ['Radeon X800 XT', 2004, 2006, 499, 5, 70, 'pcie6', 256, { st: 'single-fan', len: 2 }],
  x850xt: ['Radeon X850 XT', 2005, 2006, 449, 5, 70, 'pcie6', 256, { st: 'blower', len: 2, out: ['DVI'] }],
  x850xtpe: ['Radeon X850 XT Platinum Edition', 2005, 2006, 549, 5, 75, 'pcie6', 256, { st: 'blower', len: 2, out: ['DVI'] }],
  x1300pro: ['Radeon X1300 PRO', 2005, 2007, 129, 2, 30, null, 256, { st: 'agp-heatsink' }],
  x1550: ['Radeon X1550', 2006, 2008, 79, 1, 27, null, 256, { st: 'agp-heatsink' }],
  x1600pro: ['Radeon X1600 PRO', 2005, 2007, 149, 2, 41, null, 256, { st: 'single-fan' }],
  x1600xt: ['Radeon X1600 XT', 2005, 2007, 199, 3, 42, null, 256, { st: 'single-fan', len: 2 }],
  x1650pro: ['Radeon X1650 PRO', 2006, 2008, 119, 2, 44, null, 512, { st: 'single-fan' }],
  x1650xt: ['Radeon X1650 XT', 2006, 2008, 149, 3, 55, 'pcie6', 512, { st: 'single-fan', len: 2 }],
  x1800xl: ['Radeon X1800 XL', 2005, 2006, 449, 4, 70, 'pcie6', 256, { st: 'single-fan', len: 2, out: ['DVI'] }],
  x1800xt: ['Radeon X1800 XT', 2005, 2006, 549, 5, 110, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  x1900xt: ['Radeon X1900 XT', 2006, 2007, 549, 5, 120, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  x1900xtx: ['Radeon X1900 XTX', 2006, 2007, 649, 5, 135, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  x1950pro: ['Radeon X1950 PRO', 2006, 2008, 199, 3, 66, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  x1950gt: ['Radeon X1950 GT', 2007, 2008, 149, 3, 57, 'pcie6', 256, { st: 'single-fan', len: 2, out: ['DVI'] }],
  x1950xt: ['Radeon X1950 XT', 2006, 2007, 299, 4, 110, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  x1950xtx: ['Radeon X1950 XTX', 2006, 2007, 449, 5, 125, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
}, [
  S('ATI', (c) => `ATI ${c.l} ${c.mem}`, null, null, '#8e2a2a', '#c9323a', 'x300 x600pro x600xt x700pro x800xl x800xt x850xt x850xtpe x1300pro x1600pro x1600xt x1800xl x1800xt x1900xt x1900xtx x1950xtx', { k: 1 }),
  S('Sapphire', (c) => `Sapphire ${c.l} ${c.mem}`, null, null, '#1f3f8f', '#3a8fd8', '*', { k: 1 }),
  S('Sapphire', (c) => `Sapphire ${c.s} Ultimate`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', 'x1300pro x1600pro x1650pro x1950pro', { k: 1.1, len: 2 }),
  S('Sapphire', (c) => `Sapphire Toxic ${c.s}`, 'blower', 1, '#1d1e21', '#e8c030', 'x800xl x850xt x1900xt x1950pro', { k: 1.2 }),
  S('HIS', (c) => `HIS Excalibur ${c.l} IceQ II`, 'blower', 1, '#1f3f8f', '#3a8fd8', 'x600xt x700pro x800xl x800gto x850xt', { k: 1.1 }),
  S('HIS', (c) => `HIS ${c.l} IceQ Turbo ${c.mem}`, 'blower', 1, '#1f3f8f', '#3a8fd8', 'x1600pro x1650pro x1650xt x1950pro x1950gt x1950xt', { k: 1.1 }),
  S('PowerColor', (c) => `PowerColor ${c.l} ${c.mem}`, null, null, '#8e2a2a', '#c9323a', 'x300 x550 x600pro x700pro x800gto x1300pro x1550 x1600pro x1650pro x1650xt x1950pro x1950gt'),
  S('Club 3D', (c) => `Club 3D ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c9323a', 'x550 x800gto x1300pro x1650pro x1950pro'),
  S('ASUS', (c) => `ASUS EA${c.code} ${c.mem}`, null, null, '#2a3a5a', '#c0c6cc', 'x300 x600xt x700pro x800xl x850xt x1600xt x1650pro x1800xl x1900xtx x1950pro x1950xtx'),
  S('MSI', (c) => `MSI R${c.code} ${c.mem}`, null, null, '#3a1f22', '#c9323a', 'x700pro x800xl x1300pro x1600pro x1650pro x1950pro'),
]);

// ---------- NVIDIA GeForce 8, 9 och GTX 200 ----------
const GB_NV = { '8800gt': 'GV-NX88T512H-B', '9600gt': 'GV-N96TZL-512I', '9800gt': 'GV-N98TZL-1GH', gts250: 'GV-N250ZL-1GI', gt240: 'GV-N240D5-512I', gt220: 'GV-N220D2-1GI', gtx260: 'GV-N26-896H-B', gtx275: 'GV-N275UD-896I', gtx285: 'GV-N285UD-1GH', '8600gt': 'GV-NX86T256H', '9500gt': 'GV-N95TD2-512I' };
const MSI_NV = { '8400gs': 'NX8400GS', '8500gt': 'NX8500GT', '8600gt': 'NX8600GT', '8600gts': 'NX8600GTS', '8800gt': 'NX8800GT', '8800gts512': 'NX8800GTS', '9400gt': 'N9400GT', '9500gt': 'N9500GT', '9600gt': 'N9600GT', '9800gt': 'N9800GT', '9800gtxp': 'N9800GTX+', gt220: 'N220GT', gt240: 'N240GT', gts250: 'N250GTS', gtx260: 'N260GTX', gtx275: 'N275GTX', gtx285: 'N285GTX' };
gen('nvidia', ['VGA', 'DVI'], {
  '8400gs': ['GeForce 8400 GS', 2007, 2009, 49, 1, 38, null, 256, { st: 'agp-heatsink' }],
  '8500gt': ['GeForce 8500 GT', 2007, 2009, 89, 1, 30, null, 512, { st: 'agp-heatsink' }],
  '8600gt': ['GeForce 8600 GT', 2007, 2009, 149, 2, 47, null, 256, { st: 'single-fan' }],
  '8600gts': ['GeForce 8600 GTS', 2007, 2008, 199, 3, 71, 'pcie6', 256, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '8800gts320': ['GeForce 8800 GTS 320MB', 2007, 2008, 299, 4, 146, 'pcie6', 320, { st: 'blower', len: 3, out: ['DVI'] }],
  '8800gts640': ['GeForce 8800 GTS 640MB', 2006, 2008, 449, 5, 146, 'pcie6', 640, { st: 'blower', len: 3, out: ['DVI'] }],
  '8800gtx': ['GeForce 8800 GTX', 2006, 2008, 599, 5, 177, '2xpcie8', 768, { st: 'blower', len: 3, out: ['DVI'] }],
  '8800ultra': ['GeForce 8800 Ultra', 2007, 2008, 829, 5, 175, '2xpcie8', 768, { st: 'blower', len: 3, out: ['DVI'] }],
  '8800gt': ['GeForce 8800 GT', 2007, 2009, 249, 4, 105, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '8800gts512': ['GeForce 8800 GTS 512', 2007, 2009, 349, 4, 135, 'pcie6', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  '9400gt': ['GeForce 9400 GT', 2008, 2010, 59, 1, 50, null, 512, { st: 'agp-heatsink' }],
  '9500gt': ['GeForce 9500 GT', 2008, 2010, 79, 1, 50, null, 512, { st: 'single-fan' }],
  '9600gso': ['GeForce 9600 GSO', 2008, 2009, 99, 2, 84, 'pcie6', 512, { st: 'single-fan', len: 2 }],
  '9600gt': ['GeForce 9600 GT', 2008, 2010, 169, 3, 95, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '9800gt': ['GeForce 9800 GT', 2008, 2010, 159, 3, 105, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  '9800gtx': ['GeForce 9800 GTX', 2008, 2009, 299, 4, 140, '2xpcie8', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  '9800gtxp': ['GeForce 9800 GTX+', 2008, 2009, 229, 4, 141, '2xpcie8', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  '9800gx2': ['GeForce 9800 GX2', 2008, 2009, 599, 5, 197, '2xpcie8', 1024, { st: 'blower', len: 3, out: ['DVI', 'HDMI'] }],
  gt220: ['GeForce GT 220', 2009, 2011, 79, 1, 58, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  gt240: ['GeForce GT 240', 2009, 2011, 99, 2, 69, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  gts250: ['GeForce GTS 250', 2009, 2010, 149, 3, 150, 'pcie6', 1024, { st: 'single-fan', len: 2, out: ['VGA', 'DVI', 'HDMI'] }],
  gtx260: ['GeForce GTX 260', 2008, 2010, 299, 4, 182, '2xpcie8', 896, { st: 'blower', len: 3, out: ['DVI', 'HDMI'] }],
  gtx275: ['GeForce GTX 275', 2009, 2010, 249, 4, 219, '2xpcie8', 896, { st: 'blower', len: 3, out: ['DVI', 'HDMI'] }],
  gtx280: ['GeForce GTX 280', 2008, 2009, 649, 5, 236, '2xpcie8', 1024, { st: 'blower', len: 3, out: ['DVI'] }],
  gtx285: ['GeForce GTX 285', 2009, 2010, 399, 5, 204, '2xpcie8', 1024, { st: 'blower', len: 3, out: ['DVI'] }],
  gtx295: ['GeForce GTX 295', 2009, 2010, 499, 5, 289, '2xpcie8', 1792, { st: 'blower', len: 3, out: ['DVI', 'HDMI'] }],
}, [
  S('ASUS', (c) => `ASUS EN${c.code} ${c.mem}`, null, null, '#2a3a5a', '#c0c6cc', '8400gs 8500gt 8600gt 8600gts 8800gts640 8800gtx 8800gt 8800gts512 9500gt 9600gt 9800gt 9800gtxp gt220 gt240 gts250 gtx260 gtx275 gtx285 gtx295'),
  S('ASUS', (c) => `ASUS EN${c.code} TOP`, null, null, '#2a3a5a', '#e8c030', '8800gt 9600gt 9800gtx gtx260', { k: 1.15 }),
  S('ASUS', (c) => `ASUS EN${c.code} MATRIX`, 'dual', 2, '#1c1d20', '#c9323a', 'gts250 gtx260 gtx285', { k: 1.2 }),
  S('MSI', (c) => `MSI ${MSI_NV[c.key]} ${c.mem}`, null, null, '#3a1f22', '#c9323a', Object.keys(MSI_NV).join(' ')),
  S('Gigabyte', (c) => `Gigabyte ${GB_NV[c.key]}`, null, null, '#1f3f8f', '#e07a2e', Object.keys(GB_NV).join(' ')),
  S('Leadtek', (c) => `Leadtek WinFast PX${c.s} TDH`, null, null, '#2d3a2d', '#e8c030', '8500gt 8600gt 8600gts 8800gts640 8800gtx 8800gt 8800gts512 9600gt 9800gt 9800gtx', { u1: 2008 }),
  S('Leadtek', (c) => `Leadtek WinFast ${c.s} Extreme+`, null, null, '#2d3a2d', '#e8c030', 'gts250 gtx260 gtx275 gtx285', { k: 1.1 }),
  S('XFX', (c) => `XFX ${c.l} ${c.mem}`, null, null, '#1b1c1f', '#76b900', '8400gs 8500gt 8600gt 8600gts 8800gts320 8800gts640 8800gtx 8800gt 9500gt 9600gso 9600gt 9800gt 9800gtx 9800gx2 gtx260 gtx280 gtx285 gtx295'),
  S('XFX', (c) => `XFX ${c.l} XXX Edition`, null, null, '#1b1c1f', '#76b900', '8600gts 8800gtx 8800gt 9800gtx gtx260 gtx280', { k: 1.15 }),
  S('EVGA', (c) => `EVGA ${c.l} ${c.mem}`, null, null, '#1f2023', '#9aa4ae', '8400gs 8600gt 8800gts640 8800gtx 8800ultra 8800gt 9600gt 9800gt 9800gtx 9800gx2 gt240 gts250 gtx260 gtx275 gtx280 gtx285 gtx295'),
  S('EVGA', (c) => `EVGA ${c.l} SSC`, null, null, '#1f2023', '#c9323a', '8800gt 8800gts512 9800gtx gtx260 gtx275', { k: 1.15 }),
  S('EVGA', (c) => `EVGA ${c.l} FTW`, null, null, '#1f2023', '#c9323a', '9800gtxp gtx260 gtx285', { k: 1.2 }),
  S('BFG', (c) => `BFG ${c.l} OC`, null, null, '#1f2a1f', '#76b900', '8600gt 8600gts 8800gts640 8800gtx 8800gt 9600gt 9800gt 9800gtx gtx260 gtx280 gtx285', { k: 1.1 }),
  S('BFG', (c) => `BFG ${c.l} OCX`, null, null, '#1f2a1f', '#76b900', '8800gt gtx260', { k: 1.2 }),
  S('Zotac', (c) => `Zotac ${c.l} ${c.mem}`, null, null, '#26282c', '#e8c030', '8400gs 8500gt 8600gt 9400gt 9500gt 9600gt 9800gt gt220 gt240 gts250 gtx260 gtx285 gtx295'),
  S('Zotac', (c) => `Zotac ${c.l} AMP! Edition`, null, null, '#26282c', '#e8c030', '8800gt 8800gts512 9600gt 9800gtx 9800gtxp gts250 gtx260 gtx275 gtx285', { k: 1.12 }),
  S('Palit', (c) => `Palit ${c.l} Sonic`, 'dual', 2, '#26282c', '#3a8fd8', '8800gt 9600gt 9800gt gtx260', { k: 1.08 }),
  S('Palit', (c) => `Palit ${c.l} ${c.mem}`, null, null, '#26282c', '#3a8fd8', '8500gt 8600gt 9500gt 9600gso gt220 gt240 gts250'),
  S('Gainward', (c) => `Gainward BLISS ${c.s} ${c.mem}`, null, null, '#3a1f22', '#e8c030', '8600gt 8600gts 8800gts640 8800gt', { u1: 2008 }),
  S('Gainward', (c) => `Gainward ${c.l} Golden Sample`, null, null, '#2a2c30', '#e8c030', '9600gt 9800gt gts250 gtx260 gtx275', { k: 1.1 }),
  S('PNY', (c) => `PNY Verto ${c.l} ${c.mem}`, null, null, '#2a2c30', '#c0c6cc', '8400gs 8500gt 8600gt 8800gts320 8800gt 9500gt 9600gt 9800gt', { u1: 2008 }),
  S('PNY', (c) => `PNY XLR8 ${c.l}`, null, null, '#1f2023', '#76b900', 'gts250 gtx260 gtx275 gtx285', { y0: 2009 }),
  S('Point of View', (c) => `Point of View ${c.l} ${c.mem}`, null, null, '#2a2c30', '#e07a2e', '8500gt 8600gt 8800gt 9500gt 9600gt 9800gt gt220 gt240 gts250 gtx260'),
  S('Sparkle', (c) => `Sparkle ${c.l} ${c.mem}`, null, null, '#2a2c30', '#76b900', '8400gs 8600gt 9400gt 9500gt 9600gt'),
  S('Club 3D', (c) => `Club 3D ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c9323a', '8500gt 8600gt 9500gt 9600gt gt220'),
]);

// ---------- ATI/AMD Radeon HD 2000, 3000 och 4000 ----------
gen('ati', ['VGA', 'DVI'], {
  hd2400pro: ['Radeon HD 2400 PRO', 2007, 2009, 59, 1, 25, null, 256, { st: 'agp-heatsink' }],
  hd2600pro: ['Radeon HD 2600 PRO', 2007, 2009, 89, 1, 35, null, 512, { st: 'single-fan' }],
  hd2600xt: ['Radeon HD 2600 XT', 2007, 2008, 149, 2, 45, null, 512, { st: 'single-fan', out: ['DVI'] }],
  hd2900xt: ['Radeon HD 2900 XT', 2007, 2008, 399, 5, 215, '2xpcie8', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  hd3450: ['Radeon HD 3450', 2008, 2010, 49, 1, 25, null, 256, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  hd3650: ['Radeon HD 3650', 2008, 2010, 79, 2, 65, null, 512, { st: 'single-fan' }],
  hd3850: ['Radeon HD 3850', 2007, 2009, 179, 3, 95, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  hd3870: ['Radeon HD 3870', 2007, 2009, 219, 4, 105, 'pcie6', 512, { st: 'blower', len: 2, out: ['DVI'] }],
  hd3870x2: ['Radeon HD 3870 X2', 2008, 2009, 449, 5, 196, '2xpcie8', 1024, { st: 'blower', len: 3, out: ['DVI'] }],
  hd4350: ['Radeon HD 4350', 2008, 2010, 39, 1, 20, null, 512, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  hd4550: ['Radeon HD 4550', 2008, 2010, 59, 1, 25, null, 512, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  hd4650: ['Radeon HD 4650', 2008, 2010, 69, 2, 48, null, 512, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  hd4670: ['Radeon HD 4670', 2008, 2010, 79, 2, 59, null, 512, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  hd4830: ['Radeon HD 4830', 2008, 2009, 129, 3, 95, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  hd4850: ['Radeon HD 4850', 2008, 2010, 199, 3, 110, 'pcie6', 512, { st: 'single-fan', len: 2, out: ['DVI'] }],
  hd4870: ['Radeon HD 4870', 2008, 2010, 299, 4, 150, '2xpcie8', 512, { st: 'blower', len: 3, out: ['DVI'] }],
  hd4890: ['Radeon HD 4890', 2009, 2010, 249, 4, 190, '2xpcie8', 1024, { st: 'blower', len: 3, out: ['DVI'] }],
  hd4850x2: ['Radeon HD 4850 X2', 2008, 2009, 399, 5, 250, '2xpcie8', 2048, { st: 'dual', len: 3, out: ['DVI', 'HDMI'] }],
  hd4870x2: ['Radeon HD 4870 X2', 2008, 2010, 549, 5, 286, '2xpcie8', 2048, { st: 'blower', len: 3, out: ['DVI'] }],
}, [
  S('Sapphire', (c) => `Sapphire ${c.l} ${c.mem}`, null, null, '#1f3f8f', '#3a8fd8', '*', { k: 1 }),
  S('Sapphire', (c) => `Sapphire ${c.l} Toxic`, 'dual', 1, '#1d1e21', '#e8c030', 'hd3850 hd3870 hd4850 hd4870', { k: 1.2 }),
  S('Sapphire', (c) => `Sapphire Vapor-X ${c.l}`, 'blower', 1, '#2a3a55', '#3a8fd8', 'hd4850 hd4870 hd4890', { k: 1.15, y0: 2009 }),
  S('Sapphire', (c) => `Sapphire ${c.l} Atomic`, 'single-fan', 0, '#1d1e21', '#3a8fd8', 'hd3870', { k: 1.4, len: 2 }),
  S('Sapphire', (c) => `Sapphire ${c.l} Ultimate`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', 'hd2600pro hd3650 hd4670', { k: 1.1, len: 2 }),
  S('HIS', (c) => `HIS ${c.l} IceQ Turbo`, 'blower', 1, '#1f3f8f', '#3a8fd8', 'hd2600xt', { k: 1.1 }),
  S('HIS', (c) => `HIS ${c.l} IceQ3 Turbo`, 'blower', 1, '#1f3f8f', '#3a8fd8', 'hd3650 hd3850 hd3870', { k: 1.1 }),
  S('HIS', (c) => `HIS ${c.l} IceQ 4 Turbo`, 'blower', 1, '#1f3f8f', '#3a8fd8', 'hd4670 hd4830 hd4850 hd4870 hd4890', { k: 1.1 }),
  S('HIS', (c) => `HIS ${c.l} iSilence ${c.mem}`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', 'hd2400pro hd3450 hd4350 hd4550', { k: 1.05 }),
  S('PowerColor', (c) => `PowerColor ${c.l} ${c.mem}`, null, null, '#8e2a2a', '#c9323a', 'hd2400pro hd2600pro hd2600xt hd3450 hd3650 hd3850 hd3870 hd4350 hd4650 hd4670 hd4830 hd4850 hd4870'),
  S('PowerColor', (c) => `PowerColor PCS+ ${c.l}`, 'dual', 1, '#1c1c1f', '#c9323a', 'hd3850 hd3870 hd4850 hd4870 hd4890', { k: 1.1 }),
  S('PowerColor', (c) => `PowerColor SCS3 ${c.l}`, 'agp-heatsink', 0, '#8e2a2a', '#9aa4ae', 'hd4650 hd4670', { k: 1.1, len: 2 }),
  S('ASUS', (c) => `ASUS EAH${c.code.slice(2)} ${c.mem}`, null, null, '#2a3a5a', '#c0c6cc', 'hd2400pro hd2600xt hd2900xt hd3450 hd3650 hd3850 hd3870 hd4350 hd4650 hd4670 hd4850 hd4870 hd4890 hd4870x2'),
  S('ASUS', (c) => `ASUS EAH${c.code.slice(2)} TOP`, null, null, '#2a3a5a', '#e8c030', 'hd3870 hd4850 hd4890', { k: 1.12 }),
  S('ASUS', (c) => `ASUS EAH${c.code.slice(2)} Dark Knight`, 'dual', 1, '#1c1d20', '#c9323a', 'hd4850 hd4870', { k: 1.12 }),
  S('ASUS', (c) => `ASUS EAH${c.code.slice(2)} MATRIX`, 'dual', 2, '#1c1d20', '#c9323a', 'hd4850', { k: 1.2 }),
  S('MSI', (c) => `MSI R${c.code.slice(2)} ${c.mem}`, null, null, '#3a1f22', '#c9323a', 'hd2600xt hd3450 hd3650 hd3850 hd3870 hd4350 hd4650 hd4670 hd4830 hd4850 hd4870'),
  S('MSI', (c) => `MSI R${c.code.slice(2)} Cyclone`, 'single-fan', 1, '#1e1f22', '#c9323a', 'hd4850 hd4870 hd4890', { k: 1.12, len: 2 }),
  S('XFX', (c) => `XFX ${c.l} ${c.mem}`, null, null, '#1b1c1f', '#c9323a', 'hd4350 hd4650 hd4670 hd4850 hd4870 hd4890', { y0: 2009 }),
  S('Diamond', (c) => `Diamond ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c0c6cc', 'hd2600pro hd3650 hd3850 hd3870 hd4650 hd4850 hd4870'),
  S('Club 3D', (c) => `Club 3D ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c9323a', 'hd2400pro hd2600xt hd3650 hd3850 hd4650 hd4670 hd4850'),
  S('VisionTek', (c) => `VisionTek ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c9323a', 'hd2600xt hd3850 hd4650 hd4850'),
]);

// ---------- NVIDIA GeForce 400 och 500 ----------
const MSI_F = { gt430: 'N430GT', gt440: 'N440GT', gts450: 'N450GTS', gtx460: 'N460GTX', gtx465: 'N465GTX', gtx470: 'N470GTX', gtx480: 'N480GTX', gt520: 'N520GT', gtx550ti: 'N550GTX-Ti', gtx560: 'N560GTX', gtx560ti: 'N560GTX-Ti', gtx570: 'N570GTX', gtx580: 'N580GTX' };
gen('nvidia', ['DVI', 'HDMI'], {
  gt430: ['GeForce GT 430', 2010, 2012, 79, 1, 49, null, 1024, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  gt440: ['GeForce GT 440', 2011, 2012, 99, 2, 65, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  gts450: ['GeForce GTS 450', 2010, 2012, 129, 2, 106, 'pcie6', 1024, { st: 'single-fan', len: 2 }],
  gtx460_768: ['GeForce GTX 460', 2010, 2011, 199, 3, 150, '2xpcie8', 768, { tag: ' 768MB', st: 'single-fan', len: 2 }],
  gtx460: ['GeForce GTX 460', 2010, 2012, 229, 3, 160, '2xpcie8', 1024, { st: 'single-fan', len: 2 }],
  gtx465: ['GeForce GTX 465', 2010, 2010, 279, 4, 200, '2xpcie8', 1024, { st: 'blower', len: 3 }],
  gtx470: ['GeForce GTX 470', 2010, 2011, 349, 4, 215, '2xpcie8', 1280, { st: 'blower', len: 3 }],
  gtx480: ['GeForce GTX 480', 2010, 2011, 499, 5, 250, '2xpcie8', 1536, { st: 'blower', len: 3 }],
  gt520: ['GeForce GT 520', 2011, 2013, 59, 1, 29, null, 1024, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  gtx550ti: ['GeForce GTX 550 Ti', 2011, 2012, 149, 2, 116, 'pcie6', 1024, { st: 'single-fan', len: 2 }],
  gtx560: ['GeForce GTX 560', 2011, 2012, 199, 3, 150, '2xpcie8', 1024, { len: 2 }],
  gtx560ti: ['GeForce GTX 560 Ti', 2011, 2012, 249, 3, 170, '2xpcie8', 1024, { st: 'blower', len: 2 }],
  gtx570: ['GeForce GTX 570', 2010, 2012, 349, 4, 219, '2xpcie8', 1280, { st: 'blower', len: 3 }],
  gtx580: ['GeForce GTX 580', 2010, 2012, 499, 5, 244, '2xpcie8', 1536, { st: 'blower', len: 3 }],
  gtx590: ['GeForce GTX 590', 2011, 2012, 699, 5, 365, '2xpcie8', 3072, { st: 'blower', len: 3, out: ['DVI', 'DP'] }],
}, [
  S('ASUS', (c) => `ASUS EN${c.s.replace(' ', '')} ${c.mem}`, null, null, '#2a3a5a', '#c0c6cc', 'gt430 gt440 gts450 gtx460 gtx465 gtx470 gtx480 gt520 gtx550ti gtx570 gtx580 gtx590'),
  S('ASUS', (c) => `ASUS EN${c.s.replace(' ', '')} DirectCU`, 'dual', 2, '#1c1d20', '#c9323a', 'gts450 gtx460 gtx470', { k: 1.1 }),
  S('ASUS', (c) => `ASUS EN${c.s.replace(' ', '')} DirectCU II`, 'dual', 2, '#1c1d20', '#c9323a', 'gtx550ti gtx560 gtx560ti gtx570 gtx580', { k: 1.1 }),
  S('ASUS', (c) => `ASUS ROG MATRIX ${c.s} Platinum`, 'dual', 2, '#1c1d20', '#c9323a', 'gtx580', { k: 1.3 }),
  S('MSI', (c) => `MSI ${MSI_F[c.key]} Twin Frozr II`, 'dual', 2, '#1e1f22', '#9aa4ae', 'gtx460 gtx470 gtx560 gtx560ti gtx570 gtx580', { k: 1.08 }),
  S('MSI', (c) => `MSI ${MSI_F[c.key]} Hawk`, 'dual', 2, '#1e1f22', '#e8c030', 'gtx460 gtx560ti', { k: 1.15 }),
  S('MSI', (c) => `MSI ${MSI_F[c.key]} Lightning`, 'dual', 2, '#1e1f22', '#e8c030', 'gtx480 gtx580', { k: 1.3, pw: 'up' }),
  S('MSI', (c) => `MSI ${MSI_F[c.key]} Cyclone`, 'single-fan', 1, '#1e1f22', '#c9323a', 'gts450 gtx550ti', { k: 1.05, len: 2 }),
  S('MSI', (c) => `MSI ${MSI_F[c.key]} ${c.mem}`, null, null, '#1e1f22', '#c9323a', 'gt430 gt440 gt520'),
  S('Gigabyte', (c) => `Gigabyte ${c.l} OC ${c.mem}`, 'dual', 2, '#1f3f8f', '#e07a2e', 'gts450 gtx460 gtx460_768 gtx470 gtx550ti gtx560 gtx560ti gtx570 gtx580', { k: 1.08 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} Super Overclock`, 'triple', 3, '#1f3f8f', '#e07a2e', 'gtx460 gtx560ti gtx580', { k: 1.25 }),
  S('EVGA', (c) => `EVGA ${c.L} Superclocked`, null, null, '#1f2023', '#9aa4ae', 'gts450 gtx460 gtx460_768 gtx470 gtx480 gtx550ti gtx560 gtx560ti gtx570 gtx580', { k: 1.1 }),
  S('EVGA', (c) => `EVGA ${c.l} FTW`, null, null, '#1f2023', '#c9323a', 'gtx460 gtx560ti gtx580', { k: 1.2 }),
  S('EVGA', (c) => `EVGA ${c.l} Classified`, 'dual', 2, '#1f2023', '#c9323a', 'gtx580', { k: 1.3, pw: 'up' }),
  S('EVGA', (c) => `EVGA ${c.l} ${c.mem}`, null, null, '#1f2023', '#9aa4ae', 'gt430 gt440 gt520 gtx590', { k: 1.03 }),
  S('Zotac', (c) => `Zotac ${c.L} AMP! Edition`, 'dual', 2, '#26282c', '#e8c030', 'gts450 gtx460 gtx460_768 gtx470 gtx480 gtx560 gtx560ti gtx570 gtx580', { k: 1.12 }),
  S('Zotac', (c) => `Zotac ${c.l} ${c.mem}`, null, null, '#26282c', '#e8c030', 'gt430 gt440 gt520 gtx550ti gtx590'),
  S('Palit', (c) => `Palit ${c.L} Sonic Platinum`, 'dual', 2, '#26282c', '#3a8fd8', 'gtx460 gtx460_768 gtx560ti', { k: 1.08 }),
  S('Palit', (c) => `Palit ${c.l} ${c.mem}`, null, null, '#26282c', '#3a8fd8', 'gt430 gt440 gts450 gt520 gtx550ti gtx560'),
  S('Gainward', (c) => `Gainward ${c.l} Phantom`, 'triple', 2, '#1c1d20', '#e8c030', 'gtx560ti gtx570 gtx580', { k: 1.12 }),
  S('Gainward', (c) => `Gainward ${c.L} Golden Sample`, 'dual', 2, '#2a2c30', '#e8c030', 'gts450 gtx460 gtx460_768 gtx560', { k: 1.08 }),
  S('PNY', (c) => `PNY XLR8 ${c.l}`, null, null, '#1f2023', '#76b900', 'gts450 gtx460 gtx470 gtx480 gtx560ti gtx570 gtx580'),
  S('Point of View', (c) => `Point of View ${c.l} TGT Beast`, 'dual', 2, '#1c1d20', '#e07a2e', 'gtx560ti gtx570 gtx580', { k: 1.15 }),
  S('Point of View', (c) => `Point of View ${c.l} ${c.mem}`, null, null, '#2a2c30', '#e07a2e', 'gt430 gt440 gts450 gtx460 gt520 gtx550ti gtx560'),
]);

// ---------- ATI/AMD Radeon HD 5000 och 6000 ----------
const AMD_HD56 = {
  hd5450: ['Radeon HD 5450', 2010, 2012, 49, 1, 19, null, 1024, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  hd5570: ['Radeon HD 5570', 2010, 2012, 79, 1, 39, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  hd5670: ['Radeon HD 5670', 2010, 2012, 99, 2, 61, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  hd5750: ['Radeon HD 5750', 2009, 2011, 129, 2, 86, 'pcie6', 1024, { st: 'single-fan', len: 2 }],
  hd5770: ['Radeon HD 5770', 2009, 2011, 159, 3, 108, 'pcie6', 1024, { st: 'blower', len: 2 }],
  hd5830: ['Radeon HD 5830', 2010, 2011, 239, 3, 175, '2xpcie8', 1024, { st: 'blower', len: 3 }],
  hd5850: ['Radeon HD 5850', 2009, 2011, 259, 4, 151, '2xpcie8', 1024, { st: 'blower', len: 3 }],
  hd5870: ['Radeon HD 5870', 2009, 2011, 379, 5, 188, '2xpcie8', 1024, { st: 'blower', len: 3 }],
  hd5970: ['Radeon HD 5970', 2009, 2011, 599, 5, 294, '2xpcie8', 2048, { st: 'blower', len: 3 }],
};
const AMD_HD6 = {
  hd6450: ['Radeon HD 6450', 2011, 2013, 55, 1, 27, null, 1024, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  hd6570: ['Radeon HD 6570', 2011, 2013, 79, 1, 60, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  hd6670: ['Radeon HD 6670', 2011, 2013, 99, 2, 66, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  hd6750: ['Radeon HD 6750', 2011, 2012, 109, 2, 86, 'pcie6', 1024, { st: 'single-fan', len: 2 }],
  hd6770: ['Radeon HD 6770', 2011, 2012, 119, 2, 108, 'pcie6', 1024, { st: 'blower', len: 2 }],
  hd6790: ['Radeon HD 6790', 2011, 2012, 149, 2, 150, '2xpcie8', 1024, { st: 'blower', len: 2 }],
  hd6850: ['Radeon HD 6850', 2010, 2012, 179, 3, 127, 'pcie6', 1024, { st: 'blower', len: 2 }],
  hd6870: ['Radeon HD 6870', 2010, 2012, 239, 3, 151, '2xpcie8', 1024, { st: 'blower', len: 3 }],
  hd6950: ['Radeon HD 6950', 2010, 2012, 299, 4, 200, '2xpcie8', 2048, { st: 'blower', len: 3 }],
  hd6970: ['Radeon HD 6970', 2010, 2012, 369, 5, 250, '2xpcie8', 2048, { st: 'blower', len: 3 }],
  hd6990: ['Radeon HD 6990', 2011, 2012, 699, 5, 375, '2xpcie8', 4096, { st: 'blower', len: 3, out: ['DVI', 'DP'] }],
};
const HD56_LINES = (six) => [
  S('Sapphire', (c) => `Sapphire ${c.s} ${c.mem}`, null, null, '#1f3f8f', '#3a8fd8', '*', { k: 1 }),
  S('Sapphire', (c) => `Sapphire ${c.s} Vapor-X`, 'dual', 1, '#2a3a55', '#3a8fd8', six ? 'hd6870 hd6950 hd6970' : 'hd5750 hd5770 hd5850 hd5870', { k: 1.12 }),
  S('Sapphire', (c) => `Sapphire ${c.s} Toxic ${c.mem}`, 'dual', 2, '#1d1e21', '#e8c030', six ? 'hd6850 hd6950 hd6970' : 'hd5850 hd5870 hd5970', { k: 1.2, pw: six ? undefined : 'up' }),
  S('Sapphire', (c) => `Sapphire ${c.s} FleX`, 'dual', 2, '#1d1e21', '#3a8fd8', six ? 'hd6950 hd6970' : 'hd5870', { k: 1.12 }),
  S('Sapphire', (c) => `Sapphire ${c.s} Ultimate`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', six ? 'hd6570 hd6670' : 'hd5570 hd5670 hd5750', { k: 1.08, len: 2 }),
  S('HIS', (c) => `HIS ${c.s} ${six ? 'IceQ X Turbo' : 'IceQ 5 Turbo'} ${c.mem}`, 'blower', 1, '#1f3f8f', '#3a8fd8', six ? 'hd6770 hd6790 hd6850 hd6870 hd6950 hd6970' : 'hd5670 hd5750 hd5770 hd5850 hd5870', { k: 1.1 }),
  S('HIS', (c) => `HIS ${c.s} Silence ${c.mem}`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', six ? 'hd6450 hd6570 hd6670' : 'hd5450 hd5570 hd5670', { k: 1.05 }),
  S('PowerColor', (c) => `PowerColor ${c.s} ${c.mem}`, null, null, '#8e2a2a', '#c9323a', six ? 'hd6450 hd6570 hd6670 hd6750 hd6770 hd6790 hd6850 hd6870 hd6950 hd6990' : 'hd5450 hd5570 hd5670 hd5750 hd5770 hd5830 hd5850 hd5870 hd5970'),
  S('PowerColor', (c) => `PowerColor PCS+ ${c.s}`, 'dual', 2, '#1c1c1f', '#c9323a', six ? 'hd6770 hd6850 hd6870 hd6950 hd6970' : 'hd5750 hd5770 hd5850 hd5870', { k: 1.1 }),
  S('PowerColor', (c) => `PowerColor Go! Green ${c.s}`, 'agp-heatsink', 0, '#2a5a2a', '#9aa4ae', six ? 'hd6570 hd6670' : 'hd5570 hd5670', { k: 1.05, len: 2 }),
  S('ASUS', (c) => `ASUS EAH${c.num} ${c.mem}`, null, null, '#2a3a5a', '#c0c6cc', six ? 'hd6450 hd6570 hd6670 hd6750 hd6770 hd6850 hd6870 hd6970 hd6990' : 'hd5450 hd5570 hd5670 hd5750 hd5770 hd5850 hd5870 hd5970'),
  S('ASUS', (c) => `ASUS EAH${c.num} DirectCU${six && c.w >= 200 ? ' II' : ''}`, 'dual', 2, '#1c1d20', '#c9323a', six ? 'hd6850 hd6870 hd6950 hd6970' : 'hd5770 hd5830 hd5850 hd5870', { k: 1.1 }),
  S('ASUS', (c) => `ASUS ROG MATRIX ${c.s} Platinum`, 'dual', 2, '#1c1d20', '#c9323a', six ? '' : 'hd5870', { k: 1.3, pw: 'up' }),
  S('MSI', (c) => `MSI R${c.num} Twin Frozr II`, 'dual', 2, '#1e1f22', '#9aa4ae', six ? 'hd6770 hd6790 hd6850 hd6870 hd6950' : 'hd5750 hd5770 hd5830 hd5850', { k: 1.08 }),
  S('MSI', (c) => `MSI R${c.num} Hawk`, 'dual', 2, '#1e1f22', '#e8c030', six ? 'hd6850 hd6870' : 'hd5770', { k: 1.12 }),
  S('MSI', (c) => `MSI R${c.num} Lightning`, 'dual', 2, '#1e1f22', '#e8c030', six ? 'hd6970' : 'hd5870', { k: 1.3, pw: 'up' }),
  S('MSI', (c) => `MSI R${c.num} ${c.mem}`, null, null, '#1e1f22', '#c9323a', six ? 'hd6450 hd6570 hd6670' : 'hd5450 hd5570 hd5670'),
  S('Gigabyte', (c) => `Gigabyte ${c.s} OC ${c.mem}`, 'dual', 2, '#1f3f8f', '#e07a2e', six ? 'hd6670 hd6770 hd6790 hd6850 hd6870 hd6950 hd6970' : 'hd5670 hd5750 hd5770 hd5850 hd5870', { k: 1.08 }),
  S('Gigabyte', (c) => `Gigabyte ${c.s} Super Overclock`, 'triple', 3, '#1f3f8f', '#e07a2e', six ? 'hd6950' : 'hd5870', { k: 1.2 }),
  S('XFX', (c) => `XFX ${c.s} ${c.mem}`, null, null, '#1b1c1f', '#c9323a', six ? 'hd6450 hd6570 hd6670 hd6750 hd6770 hd6790 hd6850 hd6870 hd6950 hd6970 hd6990' : 'hd5450 hd5570 hd5670 hd5750 hd5770 hd5830 hd5850 hd5870 hd5970'),
  S('XFX', (c) => six ? `XFX ${c.s} Double Dissipation` : `XFX ${c.s} Black Edition`, 'dual', 2, '#1b1c1f', '#c9323a', six ? 'hd6850 hd6870 hd6950 hd6970' : 'hd5770 hd5850 hd5870 hd5970', { k: 1.12 }),
  S('Club 3D', (c) => `Club 3D ${c.s} ${c.mem}`, null, null, '#1c1d20', '#c9323a', six ? 'hd6570 hd6670 hd6770 hd6850 hd6870 hd6950' : 'hd5450 hd5570 hd5670 hd5750 hd5770 hd5850'),
  S('VisionTek', (c) => `VisionTek ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c9323a', six ? 'hd6450 hd6570 hd6850' : 'hd5450 hd5570 hd5770'),
  S('Diamond', (c) => `Diamond ${c.l} ${c.mem}`, null, null, '#1c1d20', '#c0c6cc', six ? 'hd6450 hd6670 hd6850 hd6870' : 'hd5450 hd5670 hd5770 hd5850'),
];
gen('ati', ['DVI', 'HDMI', 'DP'], AMD_HD56, HD56_LINES(false));
gen('amd', ['DVI', 'HDMI', 'DP'], AMD_HD6, HD56_LINES(true));

// ---------- NVIDIA GeForce 600 och 700 ----------
const asusK = (c) => c.s.replace('GeForce ', '').replace(/ /g, '').toUpperCase().replace('BOOST', 'B');
gen('nvidia', ['DVI', 'HDMI', 'DP'], {
  gt630: ['GeForce GT 630', 2012, 2014, 79, 1, 50, null, 2048, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  gt640: ['GeForce GT 640', 2012, 2014, 99, 1, 65, null, 2048, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  gtx650: ['GeForce GTX 650', 2012, 2014, 109, 2, 64, 'pcie6', 1024, { st: 'single-fan', out: ['DVI', 'HDMI'] }],
  gtx650ti: ['GeForce GTX 650 Ti', 2012, 2014, 149, 2, 110, 'pcie6', 1024, { st: 'single-fan', len: 2, out: ['DVI', 'HDMI'] }],
  gtx650tib: ['GeForce GTX 650 Ti BOOST', 2013, 2014, 169, 2, 134, 'pcie6', 2048, { len: 2 }],
  gtx660: ['GeForce GTX 660', 2012, 2014, 229, 3, 140, 'pcie6', 2048, { len: 2 }],
  gtx660ti: ['GeForce GTX 660 Ti', 2012, 2014, 299, 3, 150, '2xpcie8', 2048, { len: 2 }],
  gtx670: ['GeForce GTX 670', 2012, 2013, 399, 4, 170, '2xpcie8', 2048, { len: 2 }],
  gtx680: ['GeForce GTX 680', 2012, 2013, 499, 4, 195, '2xpcie8', 2048, { len: 3 }],
  gtx690: ['GeForce GTX 690', 2012, 2013, 999, 5, 300, '2xpcie8', 4096, { st: 'blower', len: 3 }],
  titan: ['GeForce GTX TITAN', 2013, 2014, 999, 5, 250, '2xpcie8', 6144, { st: 'blower', len: 3 }],
  gt730: ['GeForce GT 730', 2014, 2018, 69, 1, 38, null, 2048, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  gt740: ['GeForce GT 740', 2014, 2016, 89, 1, 64, null, 2048, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  gtx750: ['GeForce GTX 750', 2014, 2016, 119, 2, 55, null, 1024, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  gtx750ti: ['GeForce GTX 750 Ti', 2014, 2016, 149, 2, 60, null, 2048, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  gtx760: ['GeForce GTX 760', 2013, 2015, 249, 3, 170, '2xpcie8', 2048, { len: 2 }],
  gtx770: ['GeForce GTX 770', 2013, 2015, 399, 4, 230, '2xpcie8', 2048, { len: 3 }],
  gtx780: ['GeForce GTX 780', 2013, 2014, 649, 5, 250, '2xpcie8', 3072, { len: 3 }],
  gtx780ti: ['GeForce GTX 780 Ti', 2013, 2015, 699, 5, 250, '2xpcie8', 3072, { len: 3 }],
  titanblack: ['GeForce GTX TITAN Black', 2014, 2015, 999, 5, 250, '2xpcie8', 6144, { st: 'blower', len: 3 }],
}, [
  S('ASUS', (c) => `ASUS ${asusK(c)}-DC2${c.y >= 2013 ? 'OC' : 'T'}-${c.g}GD5`, 'dual', 2, '#1c1d20', '#c9323a', 'gtx650ti gtx650tib gtx660 gtx660ti gtx670 gtx680 gtx760 gtx770 gtx780 gtx780ti', { k: 1.08 }),
  S('ASUS', (c) => `ASUS ${asusK(c)}-${c.g}GD5`, 'blower', 1, '#2a2b2e', '#9aa4ae', 'gtx690 titan titanblack', { k: 1 }),
  S('ASUS', (c) => `ASUS ${asusK(c)}-SL-${c.g}GD3-BRK`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', 'gt630 gt640 gt730', { len: 1 }),
  S('ASUS', (c) => `ASUS STRIX-${asusK(c)}-OC-${c.g}GD5`, 'dual', 2, '#1c1d20', '#e07a2e', 'gtx750ti gtx750 gtx780', { k: 1.12 }),
  S('ASUS', (c) => `ASUS ROG MATRIX-${asusK(c)}-P-${c.g}GD5`, 'dual', 2, '#1c1d20', '#c9323a', 'gtx780ti', { k: 1.25, pw: 'up' }),
  S('MSI', (c) => `MSI N${c.num}${/Ti/.test(c.s) ? 'Ti' : ''} TF ${c.g}GD5/OC`, 'dual', 2, '#1e1f22', '#9aa4ae', 'gtx650ti gtx660 gtx660ti gtx670 gtx680', { k: 1.08 }),
  S('MSI', (c) => `MSI N${c.num}${/Ti/.test(c.s) ? 'Ti' : ''} PE ${c.g}GD5/OC`, 'dual', 2, '#1e1f22', '#c9323a', 'gtx650ti gtx660ti gtx670', { k: 1.12 }),
  S('MSI', (c) => `MSI N${c.num}GTX Lightning`, 'dual', 2, '#1e1f22', '#e8c030', 'gtx680', { k: 1.3, pw: 'up' }),
  S('MSI', (c) => `MSI ${c.s.replace('GeForce ', '')} GAMING ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'gtx650tib gtx750 gtx750ti gtx760 gtx770 gtx780 gtx780ti', { k: 1.1 }),
  S('MSI', (c) => `MSI ${c.s} LIGHTNING`, 'dual', 3, '#1e1f22', '#e8c030', 'gtx780', { k: 1.3, pw: 'up' }),
  S('MSI', (c) => `MSI N${c.num}GT ${c.g}GD3`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', 'gt630 gt640 gt730 gt740'),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WindForce 2X OC ${c.g}GB`, 'dual', 2, '#1f3f8f', '#e07a2e', 'gtx650 gtx650ti gtx650tib gtx660 gtx750ti gtx760', { k: 1.06 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WindForce 3X OC ${c.g}GB`, 'triple', 3, '#1f3f8f', '#e07a2e', 'gtx660ti gtx670 gtx680 gtx770 gtx780 gtx780ti', { k: 1.1 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} Super Overclock`, 'triple', 3, '#1f3f8f', '#e07a2e', 'gtx680 gtx770', { k: 1.2, pw: 'up' }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GHz Edition`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx780 gtx780ti', { k: 1.25, pw: 'up' }),
  S('EVGA', (c) => `EVGA ${c.l} ${c.g}GB`, 'blower', 1, '#1f2023', '#9aa4ae', 'gt640 gtx650 gtx660 gtx660ti gtx670 gtx680 gtx690 titan gtx750ti gtx760 gtx770 gtx780 titanblack', { k: 1 }),
  S('EVGA', (c) => `EVGA ${c.l} Superclocked${c.y >= 2013 ? ' ACX' : ''}`, 'dual', 2, '#1f2023', '#9aa4ae', 'gtx650ti gtx650tib gtx660 gtx660ti gtx670 gtx680 gtx750ti gtx760 gtx770 gtx780 gtx780ti', { k: 1.1 }),
  S('EVGA', (c) => `EVGA ${c.l} FTW${c.y >= 2013 ? ' ACX' : ''}`, 'dual', 2, '#1f2023', '#c9323a', 'gtx660 gtx660ti gtx670 gtx680 gtx760 gtx770', { k: 1.15 }),
  S('EVGA', (c) => `EVGA ${c.l} Classified`, 'dual', 2, '#1f2023', '#c9323a', 'gtx680 gtx770 gtx780 gtx780ti', { k: 1.3, pw: 'up' }),
  S('EVGA', (c) => `EVGA ${c.l} K|NGP|N`, 'dual', 2, '#1f2023', '#e8c030', 'gtx780ti', { k: 1.5, pw: 'up' }),
  S('Zotac', (c) => `Zotac ${c.l} AMP! Edition`, 'dual', 2, '#26282c', '#e8c030', 'gtx650ti gtx650tib gtx660 gtx660ti gtx670 gtx680 gtx760 gtx770 gtx780 gtx780ti', { k: 1.1 }),
  S('Zotac', (c) => `Zotac ${c.l} AMP! Extreme Edition`, 'triple', 3, '#26282c', '#e8c030', 'gtx680 gtx780ti', { k: 1.25 }),
  S('Zotac', (c) => `Zotac ${c.l} Zone Edition`, 'agp-heatsink', 0, '#26282c', '#e8c030', 'gt630 gt640 gt730 gtx750', { len: 2 }),
  S('Zotac', (c) => `Zotac ${c.l} ${c.g}GB`, null, null, '#26282c', '#e8c030', 'gtx650 gtx750ti gt740'),
  S('Palit', (c) => `Palit ${c.l} JetStream`, 'triple', 3, '#26282c', '#3a8fd8', 'gtx660 gtx660ti gtx670 gtx680 gtx760 gtx770 gtx780', { k: 1.06 }),
  S('Palit', (c) => `Palit ${c.l} StormX`, 'single-fan', 1, '#26282c', '#3a8fd8', 'gtx650 gtx650ti gtx750 gtx750ti', { len: 1 }),
  S('Palit', (c) => `Palit ${c.l} ${c.g}GB`, null, null, '#26282c', '#3a8fd8', 'gt630 gt640 gt730 gt740'),
  S('Gainward', (c) => `Gainward ${c.l} Phantom`, 'dual', 2, '#1c1d20', '#e8c030', 'gtx660 gtx660ti gtx670 gtx680 gtx760 gtx770 gtx780', { k: 1.1 }),
  S('Gainward', (c) => `Gainward ${c.l} Golden Sample`, 'dual', 2, '#2a2c30', '#e8c030', 'gtx650ti gtx650tib gtx750ti', { k: 1.06 }),
  S('PNY', (c) => `PNY XLR8 ${c.l} OC`, 'dual', 2, '#1f2023', '#76b900', 'gtx650ti gtx660 gtx660ti gtx670 gtx680 gtx750ti gtx760 gtx770 gtx780', { k: 1.05 }),
  S('Inno3D', (c) => `Inno3D iChill ${c.l} HerculeZ ${c.y >= 2013 ? 'X3 Ultra' : '3000'}`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx660ti gtx670 gtx680 gtx770 gtx780 gtx780ti', { k: 1.12 }),
]);

// ---------- AMD Radeon HD 7000, R7/R9 200, R9 300 och Fury ----------
const asusA = (c) => c.s.replace(/ /g, '').toUpperCase();
gen('amd', ['DVI', 'HDMI', 'DP'], {
  hd7750: ['Radeon HD 7750', 2012, 2014, 109, 2, 55, null, 1024, { st: 'single-fan' }],
  hd7770: ['Radeon HD 7770', 2012, 2014, 159, 2, 80, 'pcie6', 1024, { st: 'blower', len: 2 }],
  hd7790: ['Radeon HD 7790', 2013, 2014, 149, 2, 85, 'pcie6', 1024, { len: 2 }],
  hd7850: ['Radeon HD 7850', 2012, 2014, 249, 3, 130, 'pcie6', 2048, { st: 'blower', len: 2 }],
  hd7870: ['Radeon HD 7870', 2012, 2014, 349, 3, 175, '2xpcie8', 2048, { st: 'blower', len: 2 }],
  hd7950: ['Radeon HD 7950', 2012, 2014, 449, 4, 200, '2xpcie8', 3072, { st: 'blower', len: 3 }],
  hd7970: ['Radeon HD 7970', 2012, 2013, 549, 5, 250, '2xpcie8', 3072, { st: 'blower', len: 3 }],
  hd7970ghz: ['Radeon HD 7970 GHz Edition', 2012, 2014, 499, 5, 300, '2xpcie8', 3072, { len: 3 }],
  hd7990: ['Radeon HD 7990', 2013, 2014, 999, 5, 375, '2xpcie8', 6144, { st: 'triple', len: 3 }],
  r7240: ['Radeon R7 240', 2013, 2015, 69, 1, 30, null, 2048, { st: 'agp-heatsink', out: ['VGA', 'DVI', 'HDMI'] }],
  r7250: ['Radeon R7 250', 2013, 2015, 89, 1, 65, null, 2048, { st: 'single-fan', out: ['VGA', 'DVI', 'HDMI'] }],
  r7260x: ['Radeon R7 260X', 2013, 2015, 139, 2, 95, 'pcie6', 2048, { len: 2 }],
  r7265: ['Radeon R7 265', 2014, 2015, 149, 2, 150, 'pcie6', 2048, { len: 2 }],
  r9270: ['Radeon R9 270', 2014, 2015, 179, 3, 150, 'pcie6', 2048, { len: 2 }],
  r9270x: ['Radeon R9 270X', 2013, 2015, 199, 3, 180, '2xpcie8', 2048, { len: 2 }],
  r9280: ['Radeon R9 280', 2014, 2015, 279, 3, 250, '2xpcie8', 3072, { len: 3 }],
  r9280x: ['Radeon R9 280X', 2013, 2015, 299, 4, 250, '2xpcie8', 3072, { len: 3 }],
  r9290: ['Radeon R9 290', 2013, 2015, 399, 4, 275, '2xpcie8', 4096, { len: 3 }],
  r9290x: ['Radeon R9 290X', 2013, 2015, 549, 5, 290, '2xpcie8', 4096, { len: 3 }],
  r9295x2: ['Radeon R9 295X2', 2014, 2015, 1499, 5, 500, '2xpcie8', 8192, { st: 'blower', len: 3, out: ['DVI', 'DP'] }],
  r7370: ['Radeon R7 370', 2015, 2017, 139, 2, 110, 'pcie6', 2048, { len: 2 }],
  r9380: ['Radeon R9 380', 2015, 2017, 199, 3, 190, '2xpcie8', 4096, { len: 2 }],
  r9380x: ['Radeon R9 380X', 2015, 2017, 229, 3, 190, '2xpcie8', 4096, { len: 2 }],
  r9390: ['Radeon R9 390', 2015, 2016, 329, 4, 275, '2xpcie8', 8192, { len: 3 }],
  r9390x: ['Radeon R9 390X', 2015, 2016, 429, 4, 275, '2xpcie8', 8192, { len: 3 }],
  fury: ['Radeon R9 Fury', 2015, 2017, 549, 5, 275, '2xpcie8', 4096, { st: 'triple', len: 3, out: ['HDMI', 'DP'] }],
  furyx: ['Radeon R9 Fury X', 2015, 2016, 649, 5, 275, '2xpcie8', 4096, { st: 'blower', len: 2, out: ['HDMI', 'DP'] }],
  nano: ['Radeon R9 Nano', 2015, 2016, 649, 5, 175, 'pcie8', 4096, { st: 'single-fan', len: 1, out: ['HDMI', 'DP'] }],
}, [
  S('Sapphire', (c) => `Sapphire ${c.s} ${c.g}GB GDDR5`, null, null, '#1f2023', '#3a8fd8', 'hd7750 hd7770 hd7790 hd7850 hd7870 hd7950 hd7970 r7240 r7250 r7260x r9270x r9280x r9290 r9290x r9295x2 furyx nano', { k: 1 }),
  S('Sapphire', (c) => `Sapphire ${c.s} OC Dual-X`, 'dual', 2, '#1f2023', '#e8c030', 'hd7770 hd7850 hd7870 hd7950 hd7970 r7265 r9270 r9270x r9280 r9280x', { k: 1.06 }),
  S('Sapphire', (c) => `Sapphire Vapor-X ${c.s}`, 'triple', 3, '#2a3a55', '#3a8fd8', 'hd7770 hd7950 hd7970ghz r9270x r9280x r9290 r9290x', { k: 1.15 }),
  S('Sapphire', (c) => `Sapphire TOXIC ${c.s}`, 'triple', 3, '#1d1e21', '#e8c030', 'hd7970ghz r9270x r9280x r9290x', { k: 1.25, pw: 'up' }),
  S('Sapphire', (c) => `Sapphire ${c.s} Tri-X OC`, 'triple', 3, '#1d1e21', '#3a8fd8', 'r9290 r9290x r9390 r9390x fury', { k: 1.08 }),
  S('Sapphire', (c) => `Sapphire NITRO ${c.s}`, 'dual', 2, '#1d1e21', '#3a8fd8', 'r7370 r9380 r9380x r9390 r9390x', { k: 1.06 }),
  S('HIS', (c) => `HIS ${c.s} IceQ X² Turbo ${c.g}GB`, 'dual', 2, '#1f3f8f', '#3a8fd8', 'hd7770 hd7850 hd7870 hd7950 hd7970 r7260x r9270x r9280 r9280x r9290 r9290x r9380 r9390', { k: 1.08 }),
  S('HIS', (c) => `HIS ${c.s} Silence ${c.g}GB`, 'agp-heatsink', 0, '#1f3f8f', '#9aa4ae', 'hd7750 r7240 r7250', { k: 1.05 }),
  S('PowerColor', (c) => `PowerColor ${c.s} PCS+ ${c.g}GB`, 'triple', 3, '#1c1c1f', '#c9323a', 'hd7850 hd7870 hd7950 hd7970 r9270x r9280x r9290 r9290x r9380 r9390 r9390x', { k: 1.08 }),
  S('PowerColor', (c) => `PowerColor Devil ${c.s}`, 'triple', 3, '#1c1c1f', '#c9323a', 'hd7970 r9270x r9290x r9390x', { k: 1.2 }),
  S('PowerColor', (c) => `PowerColor TurboDuo ${c.s} OC`, 'dual', 2, '#2a2b2f', '#c9323a', 'hd7870 hd7950 r9270 r9280 r9280x r9290', { k: 1.04 }),
  S('PowerColor', (c) => `PowerColor ${c.s} ${c.g}GB GDDR5`, null, null, '#8e2a2a', '#c9323a', 'hd7750 hd7770 hd7790 r7240 r7250 r7260x r7370 hd7990 r9295x2 furyx', { k: 1 }),
  S('ASUS', (c) => `ASUS ${asusA(c).replace('GHZEDITION', '')}-DC2${/HD/.test(c.s) ? 'T' : 'OC'}-${c.g}GD5`, 'dual', 2, '#1c1d20', '#c9323a', 'hd7770 hd7850 hd7870 hd7950 hd7970 r7260x r9270 r9270x r9280 r9280x r9290 r9290x', { k: 1.08 }),
  S('ASUS', (c) => `ASUS ROG MATRIX ${c.s} Platinum`, 'dual', 2, '#1c1d20', '#c9323a', 'hd7970 r9280x r9290x', { k: 1.25, pw: 'up' }),
  S('ASUS', (c) => `ASUS STRIX-${asusA(c)}-DC${c.w > 250 ? 3 : 2}OC-${c.g}GD5`, 'triple', 2, '#1c1d20', '#e07a2e', 'r7370 r9380 r9380x r9390 r9390x', { k: 1.1 }),
  S('ASUS', (c) => `ASUS STRIX-R9FURY-DC3-4G-GAMING`, 'triple', 3, '#1c1d20', '#e07a2e', 'fury', { k: 1.05 }),
  S('ASUS', (c) => `ASUS ${asusA(c)}-${c.g}G`, 'blower', 1, '#2a2b2e', '#c9323a', 'furyx nano hd7990 r9295x2', { k: 1 }),
  S('MSI', (c) => `MSI R${c.num} Twin Frozr ${c.g}GD5/OC`, 'dual', 2, '#1e1f22', '#9aa4ae', 'hd7770 hd7850 hd7870 hd7950 hd7970', { k: 1.07 }),
  S('MSI', (c) => `MSI R${c.num} Hawk`, 'dual', 2, '#1e1f22', '#e8c030', 'hd7790 hd7870', { k: 1.12 }),
  S('MSI', (c) => `MSI R${c.num} Lightning`, 'dual', 3, '#1e1f22', '#e8c030', 'hd7970', { k: 1.3, pw: 'up' }),
  S('MSI', (c) => `MSI ${c.s} GAMING ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'r7260x r7265 r9270 r9270x r9280 r9280x r9290 r9290x r7370 r9380 r9380x r9390 r9390x', { k: 1.08 }),
  S('MSI', (c) => `MSI ${c.s} LIGHTNING`, 'dual', 3, '#1e1f22', '#e8c030', 'r9290x', { k: 1.3, pw: 'up' }),
  S('MSI', (c) => `MSI ${c.s} ${c.g}GD3 OC`, 'single-fan', 1, '#1e1f22', '#c9323a', 'r7240 r7250', { k: 1.03 }),
  S('Gigabyte', (c) => `Gigabyte ${c.s} WindForce 2X OC ${c.g}GB`, 'dual', 2, '#1f3f8f', '#e07a2e', 'hd7770 hd7790 hd7850 hd7870 r7260x r9270 r7370 r9380', { k: 1.06 }),
  S('Gigabyte', (c) => `Gigabyte ${c.s} WindForce 3X OC ${c.g}GB`, 'triple', 3, '#1f3f8f', '#e07a2e', 'hd7950 hd7970 hd7970ghz r9270x r9280 r9280x r9290 r9290x', { k: 1.1 }),
  S('Gigabyte', (c) => `Gigabyte ${c.s} G1 Gaming ${c.g}GB`, 'triple', 3, '#1c1d20', '#e07a2e', 'r9380 r9380x r9390 r9390x', { k: 1.1 }),
  S('XFX', (c) => `XFX ${c.s} Double Dissipation ${c.g}GB`, 'dual', 2, '#1b1c1f', '#c9323a', 'hd7770 hd7790 hd7850 hd7870 hd7950 hd7970 r7260x r9270 r9270x r9280 r9280x r9290 r9290x', { k: 1.08 }),
  S('XFX', (c) => `XFX ${c.s} Double Dissipation Black Edition`, 'dual', 2, '#1b1c1f', '#c9323a', 'hd7870 hd7970 r9280x r9290x r9390 r9390x', { k: 1.15 }),
  S('XFX', (c) => `XFX ${c.s} Double Dissipation XXX OC`, 'dual', 2, '#1b1c1f', '#c9323a', 'r7370 r9380 r9380x r9390', { k: 1.08 }),
  S('XFX', (c) => `XFX ${c.l} ${c.g}GB`, null, null, '#1b1c1f', '#c9323a', 'hd7750 r7240 r7250 hd7990 r9295x2 furyx nano', { k: 1 }),
  S('Club 3D', (c) => `Club 3D ${c.s} royalAce`, 'triple', 3, '#1c1d20', '#c9323a', 'hd7870 hd7950 hd7970 r9270x r9280x r9290 r9290x r9380 r9390x', { k: 1.05 }),
  S('VisionTek', (c) => `VisionTek ${c.l} ${c.g}GB`, null, null, '#1c1d20', '#c9323a', 'hd7750 hd7850 r7240 r7250 r9270'),
], () => PCB.black);

// ---------- NVIDIA GeForce GTX 900 ----------
gen('nvidia', ['DVI', 'HDMI', 'DP'], {
  gtx950: ['GeForce GTX 950', 2015, 2017, 159, 2, 90, 'pcie6', 2048, { len: 2 }],
  gtx960: ['GeForce GTX 960', 2015, 2017, 199, 3, 120, 'pcie6', 2048, { len: 2 }],
  gtx960_4: ['GeForce GTX 960', 2015, 2017, 229, 3, 120, 'pcie6', 4096, { tag: ' 4GB', len: 2 }],
  gtx970: ['GeForce GTX 970', 2014, 2017, 329, 4, 145, '2xpcie8', 4096, { len: 2 }],
  gtx980: ['GeForce GTX 980', 2014, 2016, 549, 5, 165, '2xpcie8', 4096, { len: 3 }],
  gtx980ti: ['GeForce GTX 980 Ti', 2015, 2017, 649, 5, 250, '2xpcie8', 6144, { len: 3 }],
  titanx: ['GeForce GTX TITAN X', 2015, 2016, 999, 5, 250, '2xpcie8', 12288, { st: 'blower', len: 3 }],
}, [
  S('ASUS', (c) => `ASUS STRIX-GTX${c.num}${/Ti/.test(c.s) ? 'TI' : ''}-DC${c.w > 200 ? 3 : 2}OC-${c.g}GD5`, 'dual', 2, '#1c1d20', '#e07a2e', 'gtx950 gtx960 gtx960_4 gtx970 gtx980 gtx980ti', { k: 1.1 }),
  S('ASUS', (c) => `ASUS TURBO-GTX${c.num}${/Ti/.test(c.s) ? 'TI' : ''}-OC-${c.g}GD5`, 'blower', 1, '#2a2b2e', '#c9323a', 'gtx960 gtx970 gtx980', { k: 1.03 }),
  S('ASUS', (c) => `ASUS ROG MATRIX-GTX${c.num}TI-P-${c.g}GD5`, 'triple', 3, '#1c1d20', '#c9323a', 'gtx980ti', { k: 1.25, pw: 'up', rgb: true }),
  S('ASUS', (c) => `ASUS GTXTITANX-${c.g}GD5`, 'blower', 1, '#2a2b2e', '#9aa4ae', 'titanx', { k: 1 }),
  S('MSI', (c) => `MSI ${c.s} GAMING ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'gtx950 gtx960 gtx960_4 gtx970 gtx980 gtx980ti', { k: 1.1 }),
  S('MSI', (c) => `MSI ${c.s} LIGHTNING`, 'triple', 3, '#1e1f22', '#e8c030', 'gtx980ti', { k: 1.3, pw: '3xpcie8' }),
  S('MSI', (c) => `MSI ${c.s} ${c.g}GD5T OC`, 'blower', 1, '#2a2b2e', '#c9323a', 'gtx970 gtx980', { k: 1.02 }),
  S('Gigabyte', (c) => `Gigabyte ${c.L} G1 Gaming`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx960 gtx960_4 gtx970 gtx980 gtx980ti', { k: 1.12 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WindForce 2X OC ${c.g}GB`, 'dual', 2, '#26282c', '#e07a2e', 'gtx950 gtx960 gtx960_4', { k: 1.05 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WindForce 3X OC ${c.g}GB`, 'triple', 3, '#26282c', '#e07a2e', 'gtx970 gtx980 gtx980ti', { k: 1.08 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} Xtreme Gaming`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx950 gtx980ti', { k: 1.2, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} Mini ITX OC`, 'single-fan', 1, '#26282c', '#e07a2e', 'gtx960 gtx970', { k: 1.05, len: 1 }),
  S('EVGA', (c) => `EVGA ${c.L} SC GAMING ACX 2.0`, 'dual', 2, '#1f2023', '#9aa4ae', 'gtx950 gtx960 gtx960_4 gtx970 gtx980 gtx980ti', { k: 1.08 }),
  S('EVGA', (c) => `EVGA ${c.L} SSC GAMING ACX 2.0+`, 'dual', 2, '#1f2023', '#c9323a', 'gtx960_4 gtx970 gtx980', { k: 1.12 }),
  S('EVGA', (c) => `EVGA ${c.L} FTW GAMING ACX 2.0+`, 'dual', 2, '#1f2023', '#c9323a', 'gtx960 gtx970 gtx980', { k: 1.15, pw: 'up' }),
  S('EVGA', (c) => `EVGA ${c.l} Classified ACX 2.0+`, 'dual', 2, '#1f2023', '#c9323a', 'gtx980 gtx980ti', { k: 1.3, pw: 'up' }),
  S('EVGA', (c) => `EVGA ${c.l} K|NGP|N`, 'dual', 2, '#1f2023', '#e8c030', 'gtx980ti', { k: 1.5, pw: '3xpcie8' }),
  S('EVGA', (c) => `EVGA ${c.l} SC`, 'blower', 1, '#1f2023', '#9aa4ae', 'titanx', { k: 1.05 }),
  S('Zotac', (c) => `Zotac ${c.L} AMP! Edition`, 'dual', 2, '#26282c', '#e8c030', 'gtx950 gtx960 gtx960_4 gtx970 gtx980 gtx980ti', { k: 1.08 }),
  S('Zotac', (c) => `Zotac ${c.l} AMP! Extreme Edition`, 'triple', 3, '#26282c', '#e8c030', 'gtx970 gtx980 gtx980ti', { k: 1.2 }),
  S('Zotac', (c) => `Zotac ${c.l} AMP! Omega`, 'triple', 3, '#26282c', '#e8c030', 'gtx970 gtx980', { k: 1.18 }),
  S('Palit', (c) => `Palit ${c.l} ${c.w > 150 ? 'Super JetStream' : 'JetStream'}`, 'triple', 3, '#26282c', '#3a8fd8', 'gtx960 gtx970 gtx980 gtx980ti', { k: 1.06 }),
  S('Palit', (c) => `Palit ${c.L} StormX Dual`, 'dual', 2, '#26282c', '#3a8fd8', 'gtx950 gtx960 gtx960_4', { k: 1.02 }),
  S('Gainward', (c) => `Gainward ${c.L} Phantom`, 'dual', 2, '#1c1d20', '#e8c030', 'gtx960 gtx960_4 gtx970 gtx980', { k: 1.08 }),
  S('Gainward', (c) => `Gainward ${c.l} Phantom GLH`, 'dual', 2, '#1c1d20', '#e8c030', 'gtx980ti', { k: 1.12 }),
  S('PNY', (c) => `PNY ${c.L} XLR8 OC`, 'dual', 2, '#1f2023', '#76b900', 'gtx960 gtx970 gtx980', { k: 1.04 }),
  S('Inno3D', (c) => `Inno3D iChill ${c.l} HerculeZ X4 Air Boss Ultra`, 'triple', 4, '#1c1d20', '#e07a2e', 'gtx970 gtx980 gtx980ti', { k: 1.15 }),
  S('Inno3D', (c) => `Inno3D ${c.L} HerculeZ Twin X2`, 'dual', 2, '#1c1d20', '#e07a2e', 'gtx960 gtx960_4 gtx970', { k: 1.03 }),
]);

// ---------- NVIDIA GeForce GTX 10 ----------
gen('nvidia', ['DVI', 'HDMI', 'DP'], {
  gt1030: ['GeForce GT 1030', 2017, 2021, 79, 1, 30, null, 2048, { st: 'agp-heatsink', out: ['DVI', 'HDMI'] }],
  gtx1050: ['GeForce GTX 1050', 2016, 2019, 109, 1, 75, null, 2048, { st: 'single-fan', len: 1 }],
  gtx1050ti: ['GeForce GTX 1050 Ti', 2016, 2020, 139, 2, 75, null, 4096, { st: 'single-fan', len: 1 }],
  gtx1060_3: ['GeForce GTX 1060', 2016, 2019, 199, 3, 120, 'pcie6', 3072, { tag: ' 3GB', len: 2 }],
  gtx1060: ['GeForce GTX 1060', 2016, 2019, 249, 3, 120, 'pcie6', 6144, { tag: ' 6GB', len: 2 }],
  gtx1070: ['GeForce GTX 1070', 2016, 2019, 379, 4, 150, 'pcie8', 8192, { len: 2 }],
  gtx1070ti: ['GeForce GTX 1070 Ti', 2017, 2019, 449, 4, 180, 'pcie8', 8192, { len: 3 }],
  gtx1080: ['GeForce GTX 1080', 2016, 2018, 549, 5, 180, 'pcie8', 8192, { len: 3 }],
  gtx1080ti: ['GeForce GTX 1080 Ti', 2017, 2019, 699, 5, 250, '2xpcie8', 11264, { len: 3 }],
}, [
  S('NVIDIA', (c) => `NVIDIA ${c.L} Founders Edition`, 'blower', 1, '#3a3d42', '#9aa4ae', 'gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.05 }),
  S('ASUS', (c) => `ASUS ROG STRIX ${c.l} OC ${c.g}GB`, 'triple', 3, '#1c1d20', '#c9323a', 'gtx1050ti gtx1060_3 gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.15, rgb: true, pw: (c) => (c.p === 'pcie6' ? 'pcie8' : c.p) }),
  S('ASUS', (c) => `ASUS Dual ${c.l} OC ${c.g}GB`, 'dual', 2, '#2b2d31', '#c0c6cc', 'gtx1050 gtx1050ti gtx1060_3 gtx1060 gtx1070', { k: 1.05 }),
  S('ASUS', (c) => `ASUS Phoenix ${c.l} ${c.g}GB`, 'single-fan', 1, '#2b2d31', '#e07a2e', 'gt1030 gtx1050 gtx1050ti gtx1060_3 gtx1060', { k: 1.02, len: 1 }),
  S('ASUS', (c) => `ASUS Turbo ${c.l} ${c.g}GB`, 'blower', 1, '#2b2d31', '#9aa4ae', 'gtx1060 gtx1070 gtx1080 gtx1080ti', { k: 1.03 }),
  S('ASUS', (c) => `ASUS Expedition ${c.l} OC ${c.g}GB`, 'dual', 2, '#2b2d31', '#c9a227', 'gtx1050ti gtx1060 gtx1070', { k: 1.04 }),
  S('ASUS', (c) => `ASUS Cerberus ${c.l} OC ${c.g}GB`, 'dual', 2, '#1c1d20', '#c9323a', 'gtx1050ti gtx1070ti', { k: 1.05 }),
  S('ASUS', (c) => `ASUS ROG POSEIDON ${c.l} Platinum`, 'dual', 2, '#1c1d20', '#c9323a', 'gtx1080ti', { k: 1.25, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} GAMING X ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'gtx1050ti gtx1060_3 gtx1060 gtx1070 gtx1080 gtx1080ti', { k: 1.12, rgb: true, pw: (c) => (c.p === 'pcie6' ? 'pcie8' : c.p === 'pcie8' ? '2xpcie8' : c.p) }),
  S('MSI', (c) => `MSI ${c.l} ARMOR ${c.g}G OC`, 'dual', 2, '#e9e9e6', '#1e1e1e', 'gtx1060_3 gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.05 }),
  S('MSI', (c) => `MSI ${c.l} AERO ITX ${c.g}G OC`, 'single-fan', 1, '#2a2b2f', '#c9323a', 'gt1030 gtx1050 gtx1050ti gtx1060_3 gtx1060 gtx1070', { k: 1.03, len: 1 }),
  S('MSI', (c) => `MSI ${c.l} DUKE ${c.g}G OC`, 'triple', 3, '#1e1f22', '#c9323a', 'gtx1070ti gtx1080 gtx1080ti', { k: 1.1, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} GAMING X TRIO`, 'triple', 3, '#1e1f22', '#c9323a', 'gtx1080ti', { k: 1.18, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} LIGHTNING Z`, 'triple', 3, '#1e1f22', '#e8c030', 'gtx1080ti', { k: 1.35, rgb: true, pw: '3xpcie8' }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} G1 Gaming ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx1050ti gtx1060 gtx1070 gtx1080', { k: 1.1, rgb: true, pw: (c) => (c.p === 'pcie6' ? 'pcie8' : c.p) }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WINDFORCE OC ${c.g}G`, 'dual', 2, '#26282c', '#e07a2e', 'gtx1050 gtx1050ti gtx1060_3 gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.04 }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx1050ti gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.15, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} Xtreme Edition ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx1080 gtx1080ti', { k: 1.25, rgb: true, pw: 'up' }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} Mini ITX OC ${c.g}G`, 'single-fan', 1, '#26282c', '#e07a2e', 'gtx1060_3 gtx1060 gtx1070 gtx1080', { k: 1.04, len: 1 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} OC Low Profile ${c.g}G`, 'dual', 2, '#26282c', '#e07a2e', 'gt1030 gtx1050 gtx1050ti', { k: 1.05, len: 1 }),
  S('EVGA', (c) => `EVGA ${c.L} SC GAMING`, 'single-fan', 1, '#1f2023', '#9aa4ae', 'gt1030 gtx1050 gtx1050ti gtx1060_3 gtx1060', { k: 1.05, len: 1 }),
  S('EVGA', (c) => `EVGA ${c.L} SSC GAMING ACX 3.0`, 'dual', 2, '#1f2023', '#c9323a', 'gtx1050ti gtx1060 gtx1070', { k: 1.1 }),
  S('EVGA', (c) => `EVGA ${c.L} SC GAMING ACX 3.0`, 'dual', 2, '#1f2023', '#9aa4ae', 'gtx1070 gtx1070ti gtx1080', { k: 1.06 }),
  S('EVGA', (c) => `EVGA ${c.L} FTW GAMING ACX 3.0`, 'dual', 2, '#1f2023', '#c9323a', 'gtx1060 gtx1070 gtx1080', { k: 1.15, rgb: true, pw: (c) => (c.p === 'pcie6' ? 'pcie8' : '2xpcie8') }),
  S('EVGA', (c) => `EVGA ${c.L} FTW2 GAMING iCX`, 'dual', 2, '#1f2023', '#c9323a', 'gtx1070 gtx1070ti gtx1080', { k: 1.18, rgb: true, pw: '2xpcie8' }),
  S('EVGA', (c) => `EVGA ${c.L} SC2 GAMING iCX`, 'dual', 2, '#1f2023', '#9aa4ae', 'gtx1080 gtx1080ti', { k: 1.1, rgb: true }),
  S('EVGA', (c) => `EVGA ${c.L} FTW3 GAMING`, 'dual', 2, '#1f2023', '#c9323a', 'gtx1080ti', { k: 1.18, rgb: true }),
  S('EVGA', (c) => `EVGA ${c.L} K|NGP|N GAMING`, 'triple', 3, '#1f2023', '#e8c030', 'gtx1080ti', { k: 1.45, rgb: true, pw: '3xpcie8' }),
  S('Zotac', (c) => `Zotac ${c.L} AMP! Edition`, 'dual', 2, '#26282c', '#e8c030', 'gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.08, rgb: true }),
  S('Zotac', (c) => `Zotac ${c.L} AMP Extreme`, 'triple', 3, '#26282c', '#e8c030', 'gtx1070 gtx1080 gtx1080ti', { k: 1.18, rgb: true, pw: 'up' }),
  S('Zotac', (c) => `Zotac ${c.L} Mini`, 'dual', 2, '#26282c', '#e8c030', 'gtx1050ti gtx1060_3 gtx1060 gtx1070 gtx1080 gtx1080ti', { k: 1.02 }),
  S('Zotac', (c) => `Zotac ${c.L} OC Edition`, 'single-fan', 1, '#26282c', '#e8c030', 'gt1030 gtx1050 gtx1050ti', { k: 1.03, len: 1 }),
  S('Palit', (c) => `Palit ${c.L} JetStream`, 'dual', 2, '#26282c', '#3a8fd8', 'gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.05 }),
  S('Palit', (c) => `Palit ${c.L} GameRock`, 'dual', 2, '#2b2c30', '#b050d0', 'gtx1070 gtx1080 gtx1080ti', { k: 1.12, rgb: true }),
  S('Palit', (c) => `Palit ${c.L} Dual`, 'dual', 2, '#26282c', '#3a8fd8', 'gtx1060_3 gtx1060 gtx1070', { k: 1.02 }),
  S('Palit', (c) => `Palit ${c.L} StormX`, 'single-fan', 1, '#26282c', '#3a8fd8', 'gtx1050 gtx1050ti gtx1060_3', { len: 1 }),
  S('Gainward', (c) => `Gainward ${c.L} Phoenix`, 'dual', 2, '#2a2c30', '#e8c030', 'gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.05, rgb: true }),
  S('Gainward', (c) => `Gainward ${c.L} Phoenix GS`, 'dual', 2, '#2a2c30', '#e8c030', 'gtx1070 gtx1080 gtx1080ti', { k: 1.1, rgb: true }),
  S('Gainward', (c) => `Gainward ${c.L} Phoenix GLH`, 'dual', 2, '#2a2c30', '#e8c030', 'gtx1080 gtx1080ti', { k: 1.15, rgb: true }),
  S('PNY', (c) => `PNY ${c.L} XLR8 Gaming OC`, 'dual', 2, '#1f2023', '#76b900', 'gtx1060 gtx1070 gtx1070ti gtx1080 gtx1080ti', { k: 1.04 }),
  S('Inno3D', (c) => `Inno3D ${c.L} iChill X3`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx1060 gtx1070 gtx1080', { k: 1.1, rgb: true }),
  S('Inno3D', (c) => `Inno3D ${c.L} iChill X4`, 'triple', 4, '#1c1d20', '#e07a2e', 'gtx1070 gtx1080 gtx1080ti', { k: 1.15, rgb: true }),
  S('Inno3D', (c) => `Inno3D ${c.L} Twin X2`, 'dual', 2, '#1c1d20', '#e07a2e', 'gtx1050ti gtx1060_3 gtx1060 gtx1070 gtx1070ti gtx1080ti', { k: 1.02 }),
], () => PCB.black);
// NVIDIA TITAN Xp säljs bara som Founders-kort
push({ name: 'NVIDIA TITAN Xp', brand: 'NVIDIA', year: 2017, until: 2018, cost: kr(1199, 2017), tier: 5, bus: 'PCIe', std: '3D', vram: 12288, watt: 250, pwr: '2xpcie8', len: 3, out: ['DVI', 'HDMI', 'DP'], rgb: false, look: { brand: 'nvidia', style: 'blower', fans: 1, color: '#2a2b2e', accent: '#c9a227', pcb: PCB.black } });

// ---------- AMD Radeon RX 400 och 500 ----------
gen('amd', ['DVI', 'HDMI', 'DP'], {
  rx460: ['Radeon RX 460', 2016, 2018, 109, 1, 75, null, 4096, { st: 'single-fan', len: 1 }],
  rx470: ['Radeon RX 470', 2016, 2018, 179, 2, 120, 'pcie6', 4096, { len: 2 }],
  rx480_4: ['Radeon RX 480', 2016, 2017, 199, 3, 150, 'pcie6', 4096, { tag: ' 4GB', st: 'blower', len: 2 }],
  rx480: ['Radeon RX 480', 2016, 2017, 239, 3, 150, 'pcie6', 8192, { tag: ' 8GB', st: 'blower', len: 2 }],
  rx550: ['Radeon RX 550', 2017, 2019, 79, 1, 50, null, 2048, { st: 'single-fan', len: 1 }],
  rx560: ['Radeon RX 560', 2017, 2019, 99, 1, 80, null, 4096, { st: 'single-fan', len: 1 }],
  rx570: ['Radeon RX 570', 2017, 2020, 169, 2, 150, 'pcie8', 4096, { len: 2 }],
  rx580_4: ['Radeon RX 580', 2017, 2020, 199, 3, 185, 'pcie8', 4096, { tag: ' 4GB', len: 2 }],
  rx580: ['Radeon RX 580', 2017, 2020, 229, 3, 185, 'pcie8', 8192, { tag: ' 8GB', len: 2 }],
  rx590: ['Radeon RX 590', 2018, 2020, 279, 3, 225, '2xpcie8', 8192, { len: 3 }],
}, [
  S('Sapphire', (c) => `Sapphire Radeon ${c.S}`, 'blower', 1, '#2a2b2e', '#c9323a', 'rx480_4 rx480', { k: 1 }),
  S('Sapphire', (c) => `Sapphire NITRO+ ${c.s} ${c.g}GB`, 'dual', 2, '#1d1e21', '#3a8fd8', 'rx470 rx480_4 rx480 rx570 rx580_4 rx580 rx590', { k: 1.08, rgb: true, pw: 'up' }),
  S('Sapphire', (c) => `Sapphire NITRO ${c.s} ${c.g}GB`, 'dual', 2, '#1d1e21', '#3a8fd8', 'rx460 rx560', { k: 1.05 }),
  S('Sapphire', (c) => `Sapphire PULSE ${c.s} ${c.g}GB`, 'dual', 2, '#2a2c30', '#c9323a', 'rx550 rx560 rx570 rx580_4 rx580', { k: 1.02 }),
  S('Sapphire', (c) => `Sapphire NITRO+ ${c.s} ${c.g}GB Special Edition`, 'dual', 2, '#1d3a6a', '#3a8fd8', 'rx580 rx590', { k: 1.14, rgb: true, pw: 'up' }),
  S('PowerColor', (c) => `PowerColor Red Devil ${c.s} ${c.g}GB`, 'triple', 3, '#1c1c1f', '#c9323a', 'rx470 rx480 rx570 rx580 rx590', { k: 1.1, rgb: true, pw: 'up' }),
  S('PowerColor', (c) => `PowerColor Red Dragon ${c.s} ${c.g}GB`, 'dual', 2, '#1f2023', '#c9323a', 'rx460 rx470 rx480_4 rx480 rx560 rx570 rx580_4 rx580', { k: 1.03 }),
  S('XFX', (c) => `XFX ${c.s} GTR Black Edition ${c.g}GB`, 'dual', 2, '#1b1c1f', '#c9323a', 'rx480 rx580', { k: 1.1, rgb: true, pw: 'up' }),
  S('XFX', (c) => `XFX ${c.s} RS ${c.g}GB`, 'dual', 2, '#1b1c1f', '#9aa4ae', 'rx470 rx480_4 rx480 rx570 rx580_4 rx580', { k: 1.05 }),
  S('XFX', (c) => `XFX ${c.s} Fatboy ${c.g}GB`, 'dual', 2, '#1b1c1f', '#9aa4ae', 'rx590', { k: 1.05 }),
  S('XFX', (c) => `XFX ${c.s} Double Dissipation ${c.g}GB`, 'dual', 2, '#1b1c1f', '#9aa4ae', 'rx460 rx560', { k: 1.02 }),
  S('ASUS', (c) => `ASUS ROG STRIX ${c.s} O${c.g}G GAMING`, 'triple', 3, '#1c1d20', '#c9323a', 'rx460 rx470 rx480 rx560 rx570 rx580 rx590', { k: 1.12, rgb: true, pw: 'up' }),
  S('ASUS', (c) => `ASUS Dual ${c.s} OC ${c.g}GB`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rx470 rx580_4 rx580 rx590', { k: 1.04 }),
  S('ASUS', (c) => `ASUS Expedition ${c.s} OC ${c.g}GB`, 'dual', 2, '#2b2d31', '#c9a227', 'rx570 rx580', { k: 1.03 }),
  S('ASUS', (c) => `ASUS Phoenix ${c.s} ${c.g}GB`, 'single-fan', 1, '#2b2d31', '#e07a2e', 'rx550 rx560', { k: 1.02, len: 1 }),
  S('MSI', (c) => `MSI ${c.l} GAMING X ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'rx470 rx480 rx570 rx580_4 rx580', { k: 1.1, rgb: true, pw: 'up' }),
  S('MSI', (c) => `MSI ${c.l} ARMOR ${c.g}G OC`, 'dual', 2, '#e9e9e6', '#1e1e1e', 'rx470 rx480_4 rx480 rx570 rx580_4 rx580 rx590', { k: 1.03 }),
  S('MSI', (c) => `MSI ${c.l} AERO ITX ${c.g}G OC`, 'single-fan', 1, '#2a2b2f', '#c9323a', 'rx460 rx560 rx570', { k: 1.02, len: 1 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} G1 Gaming ${c.g}G`, 'dual', 2, '#1c1d20', '#e07a2e', 'rx470 rx480', { k: 1.08, rgb: true, pw: 'up' }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ${c.g}G`, 'dual', 2, '#1c1d20', '#e07a2e', 'rx570 rx580', { k: 1.1, rgb: true, pw: 'up' }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} Gaming ${c.g}G`, 'dual', 2, '#26282c', '#e07a2e', 'rx560 rx570 rx580_4 rx580 rx590', { k: 1.04 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WINDFORCE ${c.g}G`, 'dual', 2, '#26282c', '#e07a2e', 'rx460 rx480_4 rx480', { k: 1.03 }),
  S('HIS', (c) => `HIS ${c.s} IceQ X² OC ${c.g}GB`, 'dual', 2, '#1f2023', '#3a8fd8', 'rx470 rx480 rx570 rx580', { k: 1.05 }),
  S('ASRock', (c) => `ASRock Phantom Gaming X ${c.l} ${c.g}G OC`, 'dual', 2, '#1e1f22', '#c9323a', 'rx570 rx580 rx590', { k: 1.03, y0: 2019 }),
], () => PCB.black);

// ---------- AMD Radeon RX Vega, Radeon VII och RX 5000 ----------
gen('amd', ['HDMI', 'DP'], {
  vega56: ['Radeon RX Vega 56', 2017, 2019, 399, 4, 210, '2xpcie8', 8192, { st: 'blower', len: 3 }],
  vega64: ['Radeon RX Vega 64', 2017, 2019, 499, 5, 295, '2xpcie8', 8192, { st: 'blower', len: 3 }],
  radeonvii: ['Radeon VII', 2019, 2019, 699, 5, 300, '2xpcie8', 16384, { st: 'triple', len: 3 }],
  rx5500xt_4: ['Radeon RX 5500 XT', 2019, 2021, 169, 2, 130, 'pcie8', 4096, { tag: ' 4GB', len: 2 }],
  rx5500xt: ['Radeon RX 5500 XT', 2019, 2021, 199, 2, 130, 'pcie8', 8192, { tag: ' 8GB', len: 2 }],
  rx5600xt: ['Radeon RX 5600 XT', 2020, 2021, 279, 3, 150, 'pcie8', 6144, { len: 2 }],
  rx5700: ['Radeon RX 5700', 2019, 2021, 349, 3, 180, '2xpcie8', 8192, { len: 3 }],
  rx5700xt: ['Radeon RX 5700 XT', 2019, 2021, 399, 4, 225, '2xpcie8', 8192, { len: 3 }],
}, [
  S('Sapphire', (c) => `Sapphire ${c.l} 8G HBM`, 'blower', 1, '#2a2b2e', '#c9323a', 'vega56 vega64', { k: 1 }),
  S('Sapphire', (c) => `Sapphire NITRO+ ${c.L}`, 'triple', 3, '#1d1e21', '#3a8fd8', 'vega56 vega64 rx5500xt rx5600xt rx5700 rx5700xt', { k: 1.1, rgb: true }),
  S('Sapphire', (c) => `Sapphire PULSE ${c.L}`, 'dual', 2, '#2a2c30', '#c9323a', 'vega56 rx5500xt_4 rx5500xt rx5600xt rx5700 rx5700xt', { k: 1.03 }),
  S('Sapphire', (c) => `Sapphire ${c.l} 16GB`, 'triple', 3, '#3a3d42', '#c9323a', 'radeonvii', { k: 1 }),
  S('XFX', (c) => `XFX ${c.l} 16GB`, 'triple', 3, '#3a3d42', '#c9323a', 'radeonvii', { k: 1 }),
  S('XFX', (c) => `XFX ${c.L} THICC II Pro`, 'dual', 2, '#1b1c1f', '#9aa4ae', 'rx5600xt rx5700 rx5700xt rx5500xt', { k: 1.05 }),
  S('XFX', (c) => `XFX ${c.L} THICC III Ultra`, 'triple', 3, '#1b1c1f', '#9aa4ae', 'rx5600xt rx5700xt', { k: 1.1 }),
  S('XFX', (c) => `XFX ${c.l}`, 'blower', 1, '#2a2b2e', '#c9323a', 'vega56 vega64', { k: 1 }),
  S('PowerColor', (c) => `PowerColor Red Devil ${c.L}`, 'triple', 3, '#1c1c1f', '#c9323a', 'vega56 rx5500xt rx5600xt rx5700 rx5700xt', { k: 1.1, rgb: true }),
  S('PowerColor', (c) => `PowerColor Red Dragon ${c.L}`, 'dual', 2, '#1f2023', '#c9323a', 'vega56 rx5500xt rx5700 rx5700xt', { k: 1.04 }),
  S('PowerColor', (c) => `PowerColor ${c.l} 16GB`, 'triple', 3, '#3a3d42', '#c9323a', 'radeonvii', { k: 1 }),
  S('ASUS', (c) => `ASUS ROG STRIX ${c.s} O8G GAMING`, 'triple', 3, '#1c1d20', '#c9323a', 'vega56 vega64 rx5500xt rx5700 rx5700xt', { k: 1.12, rgb: true }),
  S('ASUS', (c) => `ASUS TUF Gaming X3 ${c.S} EVO`, 'triple', 3, '#2a2b2e', '#d8b24a', 'rx5500xt rx5600xt rx5700 rx5700xt', { k: 1.05 }),
  S('ASUS', (c) => `ASUS Dual ${c.S} EVO OC`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rx5500xt_4 rx5500xt rx5700 rx5700xt', { k: 1.03 }),
  S('MSI', (c) => `MSI ${c.L} GAMING X`, 'dual', 2, '#1e1f22', '#c9323a', 'rx5500xt rx5700 rx5700xt', { k: 1.1, rgb: true }),
  S('MSI', (c) => `MSI ${c.L} MECH OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx5500xt_4 rx5500xt rx5600xt rx5700 rx5700xt', { k: 1.02 }),
  S('MSI', (c) => `MSI ${c.L} EVOKE OC`, 'dual', 2, '#2a2b2f', '#c9a227', 'rx5700 rx5700xt', { k: 1.05 }),
  S('MSI', (c) => `MSI ${c.l} Air Boost 8G OC`, 'blower', 1, '#1e1f22', '#c9323a', 'vega56 vega64', { k: 1.02 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'vega56 rx5500xt_4 rx5500xt rx5600xt rx5700 rx5700xt', { k: 1.05 }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rx5700xt', { k: 1.12, rgb: true }),
  S('ASRock', (c) => `ASRock ${c.l} Challenger D ${c.g}G OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx5500xt rx5600xt rx5700 rx5700xt', { k: 1.02 }),
  S('ASRock', (c) => `ASRock Phantom Gaming D ${c.l} ${c.g}G OC`, 'dual', 2, '#1e1f22', '#c9323a', 'rx5600xt rx5700 rx5700xt', { k: 1.05 }),
  S('ASRock', (c) => `ASRock ${c.l} Taichi X ${c.g}G OC+`, 'triple', 3, '#26282c', '#d8b24a', 'rx5700xt', { k: 1.12, rgb: true }),
], () => PCB.black);

// ---------- NVIDIA GeForce GTX 16 och RTX 20 ----------
const FE = S('NVIDIA', (c) => `NVIDIA ${c.L} Founders Edition`, 'fe', 2, '#9aa0a6', '#1e1e1e', '', { k: 1 });
gen('nvidia', ['HDMI', 'DP'], {
  gtx1650: ['GeForce GTX 1650', 2019, 2022, 149, 2, 75, null, 4096, { st: 'single-fan', len: 1, out: ['DVI', 'HDMI', 'DP'] }],
  gtx1650s: ['GeForce GTX 1650 SUPER', 2019, 2022, 159, 2, 100, 'pcie6', 4096, { out: ['DVI', 'HDMI', 'DP'] }],
  gtx1660: ['GeForce GTX 1660', 2019, 2022, 219, 2, 120, 'pcie8', 6144, { out: ['DVI', 'HDMI', 'DP'] }],
  gtx1660s: ['GeForce GTX 1660 SUPER', 2019, 2022, 229, 3, 125, 'pcie8', 6144, { out: ['DVI', 'HDMI', 'DP'] }],
  gtx1660ti: ['GeForce GTX 1660 Ti', 2019, 2021, 279, 3, 120, 'pcie8', 6144, { out: ['DVI', 'HDMI', 'DP'] }],
  rtx2060: ['GeForce RTX 2060', 2019, 2021, 349, 3, 160, 'pcie8', 6144, {}],
  rtx2060s: ['GeForce RTX 2060 SUPER', 2019, 2021, 399, 4, 175, 'pcie8', 8192, {}],
  rtx2070: ['GeForce RTX 2070', 2018, 2019, 499, 4, 175, 'pcie8', 8192, {}],
  rtx2070s: ['GeForce RTX 2070 SUPER', 2019, 2021, 499, 4, 215, '2xpcie8', 8192, { len: 3 }],
  rtx2080: ['GeForce RTX 2080', 2018, 2019, 699, 5, 215, '2xpcie8', 8192, { len: 3 }],
  rtx2080s: ['GeForce RTX 2080 SUPER', 2019, 2021, 699, 5, 250, '2xpcie8', 8192, { len: 3 }],
  rtx2080ti: ['GeForce RTX 2080 Ti', 2018, 2021, 1099, 5, 250, '2xpcie8', 11264, { len: 3 }],
}, [
  { ...FE, only: 'rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', k: 1.03 },
  S('ASUS', (c) => `ASUS ROG STRIX ${c.l} OC`, 'triple', 3, '#1c1d20', '#c9323a', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.15, rgb: true, pw: (c) => (c.w >= 160 ? '2xpcie8' : c.p || 'pcie6') }),
  S('ASUS', (c) => `ASUS TUF Gaming ${c.l} OC`, 'dual', 2, '#2a2b2e', '#d8b24a', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060 rtx2070s', { k: 1.04 }),
  S('ASUS', (c) => `ASUS Dual ${c.l} OC${/SUPER/.test(c.l) ? ' EVO' : ''}`, 'dual', 2, '#2b2d31', '#c0c6cc', 'gtx1650 gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s', { k: 1.04 }),
  S('ASUS', (c) => `ASUS Phoenix ${c.l} OC`, 'single-fan', 1, '#2b2d31', '#e07a2e', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060', { k: 1.01, len: 1 }),
  S('ASUS', (c) => `ASUS Turbo ${c.l}`, 'blower', 1, '#2b2d31', '#9aa4ae', 'rtx2060 rtx2070 rtx2080 rtx2080ti', { k: 1.02 }),
  S('ASUS', (c) => `ASUS ROG MATRIX ${c.l} Platinum`, 'triple', 3, '#1c1d20', '#c9323a', 'rtx2080ti', { k: 1.4, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} GAMING X ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060s', { k: 1.1, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} GAMING Z ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'rtx2060 rtx2070', { k: 1.12, rgb: true, pw: 'up' }),
  S('MSI', (c) => `MSI ${c.l} GAMING X TRIO`, 'triple', 3, '#1e1f22', '#c9323a', 'rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.15, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} VENTUS${c.w < 160 ? ' XS' : ''} ${c.g}G OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.02 }),
  S('MSI', (c) => `MSI ${c.l} ARMOR ${c.g}G OC`, 'dual', 2, '#2a2b2f', '#c9a227', 'gtx1660 gtx1660s rtx2060 rtx2070 rtx2080', { k: 1.04 }),
  S('MSI', (c) => `MSI ${c.l} AERO ITX ${c.g}G OC`, 'single-fan', 1, '#2a2b2f', '#c9323a', 'gtx1650 gtx1660 gtx1660ti rtx2060 rtx2070', { k: 1.02, len: 1 }),
  S('MSI', (c) => `MSI ${c.l} LIGHTNING Z`, 'triple', 3, '#1e1f22', '#e8c030', 'rtx2080ti', { k: 1.4, rgb: true, pw: '3xpcie8' }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.08, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WINDFORCE OC ${c.g}G`, 'dual', 2, '#26282c', '#5aa0d0', 'gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.02 }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080s', { k: 1.15, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} XTREME ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx2080 rtx2080s rtx2080ti', { k: 1.25, rgb: true, pw: 'up' }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} OC ${c.g}G`, 'dual', 2, '#26282c', '#e07a2e', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060', { k: 1.03 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} MINI ITX OC ${c.g}G`, 'single-fan', 1, '#26282c', '#e07a2e', 'gtx1650 rtx2060 rtx2070', { k: 1.02, len: 1 }),
  S('EVGA', (c) => `EVGA ${c.l} SC ULTRA GAMING`, 'dual', 2, '#1f2023', '#9aa4ae', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060 rtx2070s', { k: 1.05 }),
  S('EVGA', (c) => `EVGA ${c.l} XC GAMING`, 'single-fan', 1, '#1f2023', '#9aa4ae', 'rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.03, len: 2 }),
  S('EVGA', (c) => `EVGA ${c.l} XC ULTRA GAMING`, 'dual', 2, '#1f2023', '#9aa4ae', 'gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.07 }),
  S('EVGA', (c) => `EVGA ${c.l} FTW3 ULTRA GAMING`, 'triple', 3, '#1f2023', '#c9323a', 'rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.15, rgb: true, pw: 'up' }),
  S('EVGA', (c) => `EVGA ${c.l} KO ULTRA GAMING`, 'dual', 2, '#1f2023', '#9aa4ae', 'rtx2060 rtx2060s', { k: 0.95, y0: 2020 }),
  S('EVGA', (c) => `EVGA ${c.l} K|NGP|N GAMING`, 'triple', 3, '#1f2023', '#e8c030', 'rtx2080ti', { k: 1.6, rgb: true, pw: '3xpcie8' }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} AMP`, 'dual', 2, '#26282c', '#e8c030', 'gtx1660ti gtx1660s rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.05, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} AMP Extreme`, 'triple', 3, '#26282c', '#e8c030', 'rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.15, rgb: true, pw: 'up' }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} Twin Fan`, 'dual', 2, '#26282c', '#e8c030', 'gtx1650 gtx1650s gtx1660 gtx1660s gtx1660ti rtx2060 rtx2060s rtx2070', { k: 1.01 }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} Triple Fan`, 'triple', 3, '#26282c', '#e8c030', 'rtx2080 rtx2080ti', { k: 1.03 }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} OC`, 'single-fan', 1, '#26282c', '#e8c030', 'gtx1650 gtx1650s', { k: 1.02, len: 1 }),
  S('Palit', (c) => `Palit ${c.l} GamingPro OC`, 'dual', 2, '#26282c', '#3a8fd8', 'gtx1650s gtx1660s gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.04, rgb: true }),
  S('Palit', (c) => `Palit ${c.l} Dual`, 'dual', 2, '#26282c', '#3a8fd8', 'gtx1660 gtx1660ti rtx2060 rtx2060s rtx2070', { k: 1.01 }),
  S('Palit', (c) => `Palit ${c.l} StormX`, 'single-fan', 1, '#26282c', '#3a8fd8', 'gtx1650 gtx1650s gtx1660ti', { len: 1 }),
  S('Palit', (c) => `Palit ${c.l} JetStream`, 'triple', 3, '#26282c', '#3a8fd8', 'rtx2060s rtx2070s rtx2080s', { k: 1.05, rgb: true }),
  S('Palit', (c) => `Palit ${c.l} GameRock`, 'triple', 3, '#2b2c30', '#b050d0', 'rtx2070 rtx2080 rtx2080ti', { k: 1.12, rgb: true, pw: 'up' }),
  S('Gainward', (c) => `Gainward ${c.l} Phoenix`, 'dual', 2, '#2a2c30', '#e8c030', 'rtx2060 rtx2060s rtx2070 rtx2070s', { k: 1.04, rgb: true }),
  S('Gainward', (c) => `Gainward ${c.l} Phoenix GS`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.1, rgb: true }),
  S('Gainward', (c) => `Gainward ${c.l} Pegasus`, 'single-fan', 1, '#2a2c30', '#e8c030', 'gtx1650 gtx1660 gtx1660ti gtx1660s rtx2060', { k: 1.0, len: 1 }),
  S('Gainward', (c) => `Gainward ${c.l} Ghost`, 'dual', 2, '#2a2c30', '#e8c030', 'gtx1650s gtx1660s rtx2060 rtx2060s', { k: 1.0 }),
  S('PNY', (c) => `PNY ${c.l} XLR8 Gaming OC`, 'dual', 2, '#1f2023', '#76b900', 'gtx1650 gtx1660 gtx1660ti gtx1660s rtx2060 rtx2060s rtx2070 rtx2070s rtx2080 rtx2080s rtx2080ti', { k: 1.03, rgb: true }),
  S('PNY', (c) => `PNY ${c.l} Blower`, 'blower', 1, '#1f2023', '#76b900', 'rtx2070 rtx2080 rtx2080ti', { k: 1.0 }),
  S('Inno3D', (c) => `Inno3D ${c.l} Twin X2 OC`, 'dual', 2, '#1c1d20', '#e07a2e', 'gtx1650 gtx1660 gtx1660s gtx1660ti rtx2060 rtx2060s rtx2070 rtx2070s rtx2080', { k: 1.02 }),
  S('Inno3D', (c) => `Inno3D ${c.l} iChill X3 Jekyll`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx2070 rtx2080', { k: 1.1, rgb: true }),
  S('Inno3D', (c) => `Inno3D ${c.l} iChill Black`, 'dual', 0, '#1c1d20', '#e07a2e', 'rtx2080s rtx2080ti', { k: 1.25, rgb: true }),
  S('Inno3D', (c) => `Inno3D ${c.l} Compact`, 'single-fan', 1, '#1c1d20', '#e07a2e', 'gtx1650 gtx1660', { len: 1 }),
], () => PCB.black);
push({ name: 'NVIDIA GeForce GTX 1650', brand: 'NVIDIA', year: 2019, until: 2022, cost: 1700, tier: 2, bus: 'PCIe', std: '3D', vram: 4096, watt: 75, pwr: null, len: 1, out: ['DVI', 'HDMI', 'DP'], look: { brand: 'nvidia', style: 'single-fan', fans: 1, color: '#2d2f33', pcb: PCB.black } });
push({ name: 'NVIDIA TITAN RTX', brand: 'NVIDIA', year: 2018, until: 2020, cost: kr(2499, 2018), tier: 5, bus: 'PCIe', std: '3D', vram: 24576, watt: 280, pwr: '2xpcie8', len: 3, out: ['HDMI', 'DP'], look: { brand: 'nvidia', style: 'fe', fans: 2, color: '#c9a227', accent: '#1e1e1e', pcb: PCB.black } });

// ---------- NVIDIA GeForce RTX 30 ----------
const hi30 = (c) => (c.w >= 450 ? '12vhpwr' : c.w >= 320 ? '3xpcie8' : c.w >= 200 ? '2xpcie8' : c.p);
gen('nvidia', ['HDMI', 'DP'], {
  rtx3050: ['GeForce RTX 3050', 2022, 2024, 249, 2, 130, 'pcie8', 8192, {}],
  rtx3060: ['GeForce RTX 3060', 2021, 2024, 329, 3, 170, 'pcie8', 12288, {}],
  rtx3060ti: ['GeForce RTX 3060 Ti', 2020, 2023, 399, 3, 200, 'pcie8', 8192, {}],
  rtx3070: ['GeForce RTX 3070', 2020, 2023, 499, 4, 220, '2xpcie8', 8192, {}],
  rtx3070ti: ['GeForce RTX 3070 Ti', 2021, 2023, 599, 4, 290, '2xpcie8', 8192, { len: 3 }],
  rtx3080: ['GeForce RTX 3080', 2020, 2023, 699, 5, 320, '2xpcie8', 10240, { len: 3 }],
  rtx3080ti: ['GeForce RTX 3080 Ti', 2021, 2023, 1199, 5, 350, '2xpcie8', 12288, { len: 3 }],
  rtx3090: ['GeForce RTX 3090', 2020, 2022, 1499, 5, 350, '2xpcie8', 24576, { len: 3 }],
  rtx3090ti: ['GeForce RTX 3090 Ti', 2022, 2023, 1999, 5, 450, '12vhpwr', 24576, { len: 3 }],
}, [
  { ...FE, only: 'rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', pw: (c) => (c.w >= 450 ? '12vhpwr' : c.w >= 220 ? '2xpcie8' : 'pcie8') },
  S('ASUS', (c) => `ASUS ROG STRIX ${c.l} OC`, 'triple', 3, '#1c1d20', '#c9323a', 'rtx3050 rtx3060 rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.2, rgb: true, pw: hi30 }),
  S('ASUS', (c) => `ASUS TUF Gaming ${c.l} OC`, 'triple', 3, '#2a2b2e', '#d8b24a', 'rtx3060 rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.1, rgb: true }),
  S('ASUS', (c) => `ASUS Dual ${c.l} OC`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rtx3050 rtx3060 rtx3060ti rtx3070', { k: 1.04 }),
  S('ASUS', (c) => `ASUS KO ${c.l} OC`, 'dual', 2, '#1c1d20', '#c9323a', 'rtx3060 rtx3060ti rtx3070', { k: 1.06, rgb: true }),
  S('ASUS', (c) => `ASUS Phoenix ${c.l}`, 'single-fan', 1, '#2b2d31', '#e07a2e', 'rtx3050 rtx3060', { k: 1.02 }),
  S('MSI', (c) => `MSI ${c.l} GAMING X TRIO ${c.g}G`, 'triple', 3, '#1e1f22', '#c9323a', 'rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.15, rgb: true, pw: hi30 }),
  S('MSI', (c) => `MSI ${c.l} GAMING X ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'rtx3050 rtx3060', { k: 1.1, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} VENTUS 2X ${c.g}G OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rtx3050 rtx3060 rtx3060ti rtx3070', { k: 1.03 }),
  S('MSI', (c) => `MSI ${c.l} VENTUS 3X ${c.g}G OC`, 'triple', 3, '#2a2b2f', '#9aa4ae', 'rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090', { k: 1.05 }),
  S('MSI', (c) => `MSI ${c.l} SUPRIM X ${c.g}G`, 'triple', 3, '#3a3b3f', '#b8bcc2', 'rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.22, rgb: true, pw: hi30 }),
  S('MSI', (c) => `MSI ${c.l} AERO ITX ${c.g}G OC`, 'single-fan', 1, '#2a2b2f', '#c9323a', 'rtx3060', { k: 1.02, len: 1 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'rtx3050 rtx3060 rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.08, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} EAGLE OC ${c.g}G`, 'triple', 3, '#2b2e33', '#5aa0d0', 'rtx3050 rtx3060 rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090', { k: 1.03 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} VISION OC ${c.g}G`, 'triple', 3, '#e9e9e6', '#9aa4ae', 'rtx3060 rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3090', { k: 1.08, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} MASTER ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090', { k: 1.2, rgb: true, pw: hi30 }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} XTREME ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx3080 rtx3080ti rtx3090', { k: 1.28, rgb: true, pw: hi30 }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ELITE ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx3060 rtx3060ti', { k: 1.12, rgb: true }),
  S('EVGA', (c) => `EVGA ${c.l} XC GAMING`, 'dual', 2, '#1f2023', '#9aa4ae', 'rtx3050 rtx3060 rtx3060ti', { k: 1.04, u1: 2022 }),
  S('EVGA', (c) => `EVGA ${c.l} XC3 ULTRA GAMING`, 'triple', 3, '#1f2023', '#9aa4ae', 'rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090', { k: 1.06, u1: 2022, rgb: true }),
  S('EVGA', (c) => `EVGA ${c.l} XC3 BLACK GAMING`, 'triple', 3, '#1f2023', '#4a4d52', 'rtx3070 rtx3080 rtx3090', { k: 1.02, u1: 2022 }),
  S('EVGA', (c) => `EVGA ${c.l} FTW3 ULTRA GAMING`, 'triple', 3, '#1f2023', '#c9323a', 'rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.18, u1: 2022, rgb: true, pw: hi30 }),
  S('EVGA', (c) => `EVGA ${c.l} K|NGP|N HYBRID GAMING`, 'triple', 3, '#1f2023', '#e8c030', 'rtx3090 rtx3090ti', { k: 1.4, u1: 2022, rgb: true, pw: (c) => (c.w >= 450 ? '12vhpwr' : '3xpcie8') }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} Twin Edge OC`, 'dual', 2, '#26282c', '#e8c030', 'rtx3050 rtx3060 rtx3060ti rtx3070', { k: 1.02 }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} AMP Holo`, 'triple', 3, '#26282c', '#e8c030', 'rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti', { k: 1.1, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} Trinity OC`, 'triple', 3, '#26282c', '#e8c030', 'rtx3070ti rtx3080 rtx3080ti rtx3090', { k: 1.05, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.l} AMP Extreme Holo`, 'triple', 3, '#26282c', '#e8c030', 'rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.2, rgb: true, pw: hi30 }),
  S('Palit', (c) => `Palit ${c.l} GamingPro OC`, 'triple', 3, '#26282c', '#3a8fd8', 'rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.04, rgb: true }),
  S('Palit', (c) => `Palit ${c.l} GameRock OC`, 'triple', 3, '#2b2c30', '#b050d0', 'rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.12, rgb: true, pw: hi30 }),
  S('Palit', (c) => `Palit ${c.l} Dual OC`, 'dual', 2, '#26282c', '#3a8fd8', 'rtx3050 rtx3060 rtx3060ti', { k: 1.01 }),
  S('Palit', (c) => `Palit ${c.l} StormX`, 'single-fan', 1, '#26282c', '#3a8fd8', 'rtx3050 rtx3060', { len: 1 }),
  S('Gainward', (c) => `Gainward ${c.l} Phoenix`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090', { k: 1.04, rgb: true }),
  S('Gainward', (c) => `Gainward ${c.l} Phantom GS`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.12, rgb: true, pw: hi30 }),
  S('Gainward', (c) => `Gainward ${c.l} Ghost`, 'dual', 2, '#2a2c30', '#e8c030', 'rtx3050 rtx3060 rtx3060ti rtx3070', { k: 1.0 }),
  S('Gainward', (c) => `Gainward ${c.l} Pegasus`, 'single-fan', 1, '#2a2c30', '#e8c030', 'rtx3050 rtx3060', { k: 1.0, len: 1 }),
  S('PNY', (c) => `PNY ${c.l} XLR8 Gaming REVEL EPIC-X RGB`, 'triple', 3, '#1f2023', '#76b900', 'rtx3060 rtx3060ti rtx3070 rtx3070ti rtx3080 rtx3080ti rtx3090', { k: 1.05, rgb: true }),
  S('PNY', (c) => `PNY ${c.l} VERTO Dual Fan`, 'dual', 2, '#1f2023', '#76b900', 'rtx3050 rtx3060 rtx3060ti rtx3070', { k: 1.0 }),
  S('PNY', (c) => `PNY ${c.l} UPRISING Dual Fan`, 'dual', 2, '#1f2023', '#9aa4ae', 'rtx3060 rtx3060ti rtx3070', { k: 1.0 }),
  S('Inno3D', (c) => `Inno3D ${c.l} Twin X2 OC`, 'dual', 2, '#1c1d20', '#e07a2e', 'rtx3050 rtx3060 rtx3060ti rtx3070', { k: 1.01 }),
  S('Inno3D', (c) => `Inno3D ${c.l} iChill X3`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx3060ti rtx3070 rtx3070ti rtx3080', { k: 1.08, rgb: true }),
  S('Inno3D', (c) => `Inno3D ${c.l} iChill X4`, 'triple', 4, '#1c1d20', '#e07a2e', 'rtx3080 rtx3080ti rtx3090 rtx3090ti', { k: 1.15, rgb: true, pw: hi30 }),
], () => PCB.black);

// ---------- NVIDIA GeForce RTX 40 ----------
gen('nvidia', ['HDMI', 'DP'], {
  rtx4060: ['GeForce RTX 4060', 2023, 2026, 299, 2, 115, 'pcie8', 8192, {}],
  rtx4060ti: ['GeForce RTX 4060 Ti', 2023, 2025, 399, 3, 160, 'pcie8', 8192, {}],
  rtx4060ti16: ['GeForce RTX 4060 Ti', 2023, 2025, 499, 3, 165, 'pcie8', 16384, { tag: ' 16GB' }],
  rtx4070: ['GeForce RTX 4070', 2023, 2025, 599, 3, 200, 'pcie8', 12288, {}],
  rtx4070s: ['GeForce RTX 4070 SUPER', 2024, 2025, 599, 4, 220, 'pcie8', 12288, {}],
  rtx4070ti: ['GeForce RTX 4070 Ti', 2023, 2024, 799, 4, 285, '12vhpwr', 12288, { len: 3 }],
  rtx4070tis: ['GeForce RTX 4070 Ti SUPER', 2024, 2025, 799, 4, 285, '12vhpwr', 16384, { len: 3 }],
  rtx4080: ['GeForce RTX 4080', 2022, 2024, 1199, 5, 320, '12vhpwr', 16384, { len: 3 }],
  rtx4080s: ['GeForce RTX 4080 SUPER', 2024, 2025, 999, 5, 320, '12vhpwr', 16384, { len: 3 }],
  rtx4090: ['GeForce RTX 4090', 2022, 2025, 1599, 5, 450, '12vhpwr', 24576, { len: 3 }],
}, [
  { ...FE, only: 'rtx4060ti rtx4070 rtx4070s rtx4080 rtx4080s rtx4090', pw: '12vhpwr' },
  S('ASUS', (c) => `ASUS ROG STRIX ${c.L} OC`, 'triple', 3, '#1c1d20', '#c9323a', 'rtx4060 rtx4060ti rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.2, rgb: true, pw: (c) => (c.w >= 200 ? '12vhpwr' : c.p) }),
  S('ASUS', (c) => `ASUS TUF Gaming ${c.L} OC`, 'triple', 3, '#2a2b2e', '#d8b24a', 'rtx4060ti rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.1, rgb: true }),
  S('ASUS', (c) => `ASUS Dual ${c.L} OC`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s', { k: 1.04 }),
  S('ASUS', (c) => `ASUS ProArt ${c.L} OC`, 'triple', 3, '#2a2a2c', '#b89a6a', 'rtx4060ti16 rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s', { k: 1.12 }),
  S('ASUS', (c) => `ASUS ${c.L} Noctua OC Edition`, 'dual', 2, '#8a4b34', '#d8c7a7', 'rtx4070tis rtx4080 rtx4080s', { k: 1.2 }),
  S('MSI', (c) => `MSI ${c.L} GAMING X TRIO ${c.g}G`, 'triple', 3, '#1e1f22', '#c9323a', 'rtx4060ti rtx4070 rtx4070ti rtx4080 rtx4090', { k: 1.15, rgb: true }),
  S('MSI', (c) => `MSI ${c.L} GAMING X SLIM ${c.g}G`, 'triple', 3, '#1e1f22', '#c9323a', 'rtx4070s rtx4070tis rtx4080s rtx4090', { k: 1.12, rgb: true, pw: '12vhpwr' }),
  S('MSI', (c) => `MSI ${c.l} GAMING X ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'rtx4060 rtx4060ti16', { k: 1.1, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} VENTUS 2X ${c.g}G OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s', { k: 1.02 }),
  S('MSI', (c) => `MSI ${c.l} VENTUS 3X ${c.g}G OC`, 'triple', 3, '#2a2b2f', '#9aa4ae', 'rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.04 }),
  S('MSI', (c) => `MSI ${c.l} SUPRIM X ${c.g}G`, 'triple', 3, '#3a3b3f', '#b8bcc2', 'rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.22, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} AERO ITX ${c.g}G OC`, 'single-fan', 1, '#2a2b2f', '#c9323a', 'rtx4060', { k: 1.02, len: 1 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.08, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} EAGLE OC ${c.g}G`, 'triple', 3, '#2b2e33', '#5aa0d0', 'rtx4060 rtx4060ti rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s', { k: 1.03 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} AERO OC ${c.g}G`, 'triple', 3, '#e9e9e6', '#9aa4ae', 'rtx4060ti rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.1, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WINDFORCE OC ${c.g}G`, 'triple', 3, '#2b2e33', '#9aa4ae', 'rtx4070 rtx4070s rtx4070tis rtx4090', { k: 1.0 }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} MASTER ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.2, rgb: true, pw: '12vhpwr' }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ELITE ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx4060 rtx4060ti', { k: 1.12, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} Twin Edge OC`, 'dual', 2, '#26282c', '#e8c030', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s', { k: 1.02 }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} AMP AIRO`, 'triple', 3, '#26282c', '#e8c030', 'rtx4060ti rtx4070 rtx4070s', { k: 1.08, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} Trinity OC`, 'triple', 3, '#26282c', '#e8c030', 'rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.04, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} AMP Extreme AIRO`, 'triple', 3, '#26282c', '#e8c030', 'rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.15, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} Solo`, 'single-fan', 1, '#26282c', '#e8c030', 'rtx4060', { k: 1.0, len: 1 }),
  S('Palit', (c) => `Palit ${c.L} JetStream OC`, 'triple', 3, '#26282c', '#3a8fd8', 'rtx4070s rtx4070ti rtx4070tis rtx4080s', { k: 1.04, rgb: true }),
  S('Palit', (c) => `Palit ${c.L} GameRock OC`, 'triple', 3, '#2b2c30', '#b050d0', 'rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.1, rgb: true }),
  S('Palit', (c) => `Palit ${c.L} Dual`, 'dual', 2, '#26282c', '#3a8fd8', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s', { k: 1.0 }),
  S('Palit', (c) => `Palit ${c.L} StormX`, 'single-fan', 1, '#26282c', '#3a8fd8', 'rtx4060', { len: 1 }),
  S('Gainward', (c) => `Gainward ${c.L} Ghost`, 'dual', 2, '#2a2c30', '#e8c030', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s', { k: 1.0 }),
  S('Gainward', (c) => `Gainward ${c.L} Phoenix`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx4060ti rtx4070 rtx4070s rtx4070ti rtx4070tis', { k: 1.04, rgb: true }),
  S('Gainward', (c) => `Gainward ${c.L} Phantom GS`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.1, rgb: true }),
  S('PNY', (c) => `PNY ${c.L} XLR8 Gaming VERTO EPIC-X RGB`, 'triple', 3, '#1f2023', '#76b900', 'rtx4060ti rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.05, rgb: true }),
  S('PNY', (c) => `PNY ${c.L} VERTO Dual Fan`, 'dual', 2, '#1f2023', '#76b900', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s', { k: 1.0 }),
  S('PNY', (c) => `PNY ${c.L} VERTO Triple Fan OC`, 'triple', 3, '#1f2023', '#76b900', 'rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.01 }),
  S('Inno3D', (c) => `Inno3D ${c.L} Twin X2 OC`, 'dual', 2, '#1c1d20', '#e07a2e', 'rtx4060 rtx4060ti rtx4060ti16 rtx4070 rtx4070s', { k: 1.0 }),
  S('Inno3D', (c) => `Inno3D ${c.L} X3 OC`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx4070 rtx4070s rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.02 }),
  S('Inno3D', (c) => `Inno3D ${c.L} iChill X3`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx4070ti rtx4070tis rtx4080 rtx4080s rtx4090', { k: 1.1, rgb: true }),
], () => PCB.black);

// ---------- NVIDIA GeForce RTX 50 ----------
gen('nvidia', ['HDMI', 'DP'], {
  rtx5050: ['GeForce RTX 5050', 2025, 2026, 249, 1, 130, 'pcie8', 8192, {}],
  rtx5060: ['GeForce RTX 5060', 2025, 2026, 299, 2, 145, 'pcie8', 8192, {}],
  rtx5060ti: ['GeForce RTX 5060 Ti', 2025, 2026, 379, 3, 180, 'pcie8', 8192, { tag: ' 8GB' }],
  rtx5060ti16: ['GeForce RTX 5060 Ti', 2025, 2026, 429, 3, 180, 'pcie8', 16384, { tag: ' 16GB' }],
  rtx5070: ['GeForce RTX 5070', 2025, 2026, 549, 3, 250, '12vhpwr', 12288, {}],
  rtx5070ti: ['GeForce RTX 5070 Ti', 2025, 2026, 749, 4, 300, '12vhpwr', 16384, { len: 3 }],
  rtx5080: ['GeForce RTX 5080', 2025, 2026, 999, 5, 360, '12vhpwr', 16384, { len: 3 }],
  rtx5090: ['GeForce RTX 5090', 2025, 2026, 1999, 5, 575, '12vhpwr', 32768, { len: 3 }],
}, [
  { ...FE, only: 'rtx5070 rtx5080 rtx5090', col: '#a3a8ad', len: 2 },
  S('ASUS', (c) => `ASUS ROG Astral ${c.L} OC`, 'astral', 4, '#15161a', '#c9323a', 'rtx5070ti rtx5080 rtx5090', { k: 1.4, rgb: true }),
  S('ASUS', (c) => `ASUS TUF Gaming ${c.L} OC`, 'triple', 3, '#2a2b2e', '#d8b24a', 'rtx5060ti16 rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.15, rgb: true }),
  S('ASUS', (c) => `ASUS Prime ${c.L} OC`, 'triple', 3, '#2c2e33', '#b8bcc2', 'rtx5060ti16 rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.06 }),
  S('ASUS', (c) => `ASUS Dual ${c.L} OC`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rtx5050 rtx5060 rtx5060ti rtx5060ti16', { k: 1.04 }),
  S('MSI', (c) => `MSI ${c.L} GAMING TRIO OC`, 'triple', 3, '#26282c', '#b8bcc2', 'rtx5060ti16 rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.12, rgb: true }),
  S('MSI', (c) => `MSI ${c.L} VANGUARD SOC`, 'triple', 3, '#1e1f22', '#c9323a', 'rtx5070ti rtx5080 rtx5090', { k: 1.22, rgb: true }),
  S('MSI', (c) => `MSI ${c.L} SUPRIM SOC`, 'triple', 3, '#3a3b3f', '#b8bcc2', 'rtx5080 rtx5090', { k: 1.28, rgb: true }),
  S('MSI', (c) => `MSI ${c.L} VENTUS 2X OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rtx5050 rtx5060 rtx5060ti rtx5060ti16 rtx5070', { k: 1.02 }),
  S('MSI', (c) => `MSI ${c.L} VENTUS 3X OC`, 'triple', 3, '#2a2b2f', '#9aa4ae', 'rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.04 }),
  S('MSI', (c) => `MSI ${c.L} SHADOW 2X OC`, 'dual', 2, '#1e1f22', '#9aa4ae', 'rtx5060 rtx5060ti16 rtx5070', { k: 1.0 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'rtx5060 rtx5060ti16 rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.08, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} EAGLE OC ${c.g}G`, 'triple', 3, '#2b2e33', '#5aa0d0', 'rtx5060ti rtx5060ti16 rtx5070 rtx5070ti rtx5080', { k: 1.03 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} WINDFORCE OC ${c.g}G`, 'triple', 3, '#2b2e33', '#9aa4ae', 'rtx5050 rtx5060 rtx5060ti rtx5060ti16 rtx5070 rtx5070ti rtx5090', { k: 1.0 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} AERO OC ${c.g}G`, 'triple', 3, '#e9e9e6', '#9aa4ae', 'rtx5060ti16 rtx5070 rtx5070ti rtx5080', { k: 1.1, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} MASTER ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx5070ti rtx5080 rtx5090', { k: 1.25, rgb: true }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} Twin Edge OC`, 'dual', 2, '#26282c', '#e8c030', 'rtx5050 rtx5060 rtx5060ti rtx5060ti16 rtx5070', { k: 1.02 }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} Solid OC`, 'triple', 3, '#26282c', '#b8bcc2', 'rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.05 }),
  S('Zotac', (c) => `Zotac Gaming ${c.L} AMP Extreme INFINITY`, 'triple', 3, '#26282c', '#e8c030', 'rtx5070ti rtx5080 rtx5090', { k: 1.2, rgb: true }),
  S('Palit', (c) => `Palit ${c.L} GamingPro OC`, 'triple', 3, '#26282c', '#3a8fd8', 'rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.04, rgb: true }),
  S('Palit', (c) => `Palit ${c.L} GameRock OC`, 'triple', 3, '#2b2c30', '#b050d0', 'rtx5070ti rtx5080 rtx5090', { k: 1.12, rgb: true }),
  S('Palit', (c) => `Palit ${c.L} Infinity 3`, 'triple', 3, '#26282c', '#3a8fd8', 'rtx5060ti rtx5060ti16 rtx5070', { k: 1.02 }),
  S('Palit', (c) => `Palit ${c.L} Dual`, 'dual', 2, '#26282c', '#3a8fd8', 'rtx5050 rtx5060 rtx5060ti rtx5060ti16', { k: 1.0 }),
  S('Gainward', (c) => `Gainward ${c.L} Python III`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx5060 rtx5060ti rtx5060ti16 rtx5070', { k: 1.0 }),
  S('Gainward', (c) => `Gainward ${c.L} Phoenix`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx5070 rtx5070ti rtx5080', { k: 1.04, rgb: true }),
  S('Gainward', (c) => `Gainward ${c.L} Phantom GS`, 'triple', 3, '#2a2c30', '#e8c030', 'rtx5070ti rtx5080 rtx5090', { k: 1.12, rgb: true }),
  S('PNY', (c) => `PNY ${c.L} OC Triple Fan`, 'triple', 3, '#1f2023', '#76b900', 'rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.02 }),
  S('PNY', (c) => `PNY ${c.L} ARGB OC Triple Fan EPIC-X`, 'triple', 3, '#1f2023', '#76b900', 'rtx5070ti rtx5080 rtx5090', { k: 1.08, rgb: true }),
  S('PNY', (c) => `PNY ${c.L} Dual Fan`, 'dual', 2, '#1f2023', '#76b900', 'rtx5060 rtx5060ti rtx5060ti16', { k: 1.0 }),
  S('Inno3D', (c) => `Inno3D ${c.L} Twin X2`, 'dual', 2, '#1c1d20', '#e07a2e', 'rtx5050 rtx5060 rtx5060ti rtx5060ti16 rtx5070', { k: 1.0 }),
  S('Inno3D', (c) => `Inno3D ${c.L} X3`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx5070 rtx5070ti rtx5080 rtx5090', { k: 1.02 }),
  S('Inno3D', (c) => `Inno3D ${c.L} iChill X3`, 'triple', 3, '#1c1d20', '#e07a2e', 'rtx5070ti rtx5080 rtx5090', { k: 1.1, rgb: true }),
], () => PCB.black);
push({ name: 'NVIDIA GeForce RTX 5060', brand: 'NVIDIA', year: 2025, until: 2026, cost: 3500, tier: 3, bus: 'PCIe', std: '3D', vram: 8192, watt: 145, pwr: 'pcie8', len: 2, out: ['HDMI', 'DP'], look: { brand: 'nvidia', style: 'dual', fans: 2, color: '#2a2c30', pcb: PCB.black } });

// ---------- AMD Radeon RX 6000 ----------
gen('amd', ['HDMI', 'DP'], {
  rx6400: ['Radeon RX 6400', 2022, 2024, 159, 1, 53, null, 4096, { st: 'single-fan', len: 1 }],
  rx6500xt: ['Radeon RX 6500 XT', 2022, 2024, 199, 1, 107, 'pcie6', 4096, {}],
  rx6600: ['Radeon RX 6600', 2021, 2024, 329, 2, 132, 'pcie8', 8192, {}],
  rx6600xt: ['Radeon RX 6600 XT', 2021, 2023, 379, 3, 160, 'pcie8', 8192, {}],
  rx6650xt: ['Radeon RX 6650 XT', 2022, 2024, 399, 3, 180, 'pcie8', 8192, {}],
  rx6700: ['Radeon RX 6700', 2022, 2023, 369, 3, 175, '2xpcie8', 10240, {}],
  rx6700xt: ['Radeon RX 6700 XT', 2021, 2024, 479, 3, 230, '2xpcie8', 12288, { len: 3 }],
  rx6750xt: ['Radeon RX 6750 XT', 2022, 2024, 549, 4, 250, '2xpcie8', 12288, { len: 3 }],
  rx6800: ['Radeon RX 6800', 2020, 2023, 579, 4, 250, '2xpcie8', 16384, { len: 3 }],
  rx6800xt: ['Radeon RX 6800 XT', 2020, 2023, 649, 4, 300, '2xpcie8', 16384, { len: 3 }],
  rx6900xt: ['Radeon RX 6900 XT', 2020, 2023, 999, 5, 300, '2xpcie8', 16384, { len: 3 }],
  rx6950xt: ['Radeon RX 6950 XT', 2022, 2024, 1099, 5, 335, '3xpcie8', 16384, { len: 3 }],
}, [
  S('AMD', (c) => `AMD ${c.l}`, 'triple', 3, '#3a3d42', '#c9323a', 'rx6800 rx6800xt rx6900xt rx6950xt', { k: 1, pw: '2xpcie8' }),
  S('Sapphire', (c) => `Sapphire PULSE AMD ${c.l}`, 'dual', 2, '#2a2c30', '#c9323a', 'rx6400 rx6500xt rx6600 rx6600xt rx6650xt rx6700 rx6700xt rx6750xt rx6800 rx6800xt', { k: 1.03 }),
  S('Sapphire', (c) => `Sapphire NITRO+ AMD ${c.l}`, 'triple', 3, '#1d1e21', '#3a8fd8', 'rx6600xt rx6650xt rx6700xt rx6750xt rx6800 rx6800xt rx6900xt rx6950xt', { k: 1.12, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('Sapphire', (c) => `Sapphire TOXIC AMD ${c.l} Limited Edition`, 'triple', 3, '#1d1e21', '#e8c030', 'rx6900xt rx6950xt', { k: 1.3, rgb: true, pw: '3xpcie8' }),
  S('PowerColor', (c) => `PowerColor Red Devil ${c.l}`, 'triple', 3, '#1c1c1f', '#c9323a', 'rx6600xt rx6650xt rx6700xt rx6750xt rx6800 rx6800xt rx6900xt rx6950xt', { k: 1.12, rgb: true, pw: (c) => (c.w >= 250 ? '3xpcie8' : '2xpcie8') }),
  S('PowerColor', (c) => `PowerColor Hellhound ${c.l}`, 'triple', 3, '#232428', '#3a8fd8', 'rx6600 rx6600xt rx6650xt rx6700xt rx6750xt', { k: 1.04, rgb: true }),
  S('PowerColor', (c) => `PowerColor Fighter ${c.l}`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx6500xt rx6600 rx6600xt rx6650xt rx6700 rx6700xt rx6750xt', { k: 1.0 }),
  S('PowerColor', (c) => `PowerColor Red Dragon ${c.l}`, 'triple', 3, '#1f2023', '#c9323a', 'rx6700xt rx6800 rx6800xt rx6900xt', { k: 1.06 }),
  S('PowerColor', (c) => `PowerColor ITX ${c.l}`, 'single-fan', 1, '#2a2b2f', '#c9323a', 'rx6400 rx6500xt rx6600', { k: 1.02, len: 1 }),
  S('XFX', (c) => `XFX Speedster MERC 319 ${c.l}`, 'triple', 3, '#26282c', '#9aa4ae', 'rx6800 rx6800xt rx6900xt rx6950xt', { k: 1.1, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('XFX', (c) => `XFX Speedster QICK 319 ${c.l}`, 'triple', 3, '#26282c', '#e8c030', 'rx6700xt rx6750xt rx6800', { k: 1.05 }),
  S('XFX', (c) => `XFX Speedster QICK 308 ${c.l}`, 'dual', 2, '#2a2c30', '#9aa4ae', 'rx6600xt rx6650xt', { k: 1.03 }),
  S('XFX', (c) => `XFX Speedster SWFT 210 ${c.l}`, 'dual', 2, '#2e3035', '#b8bcc2', 'rx6600 rx6600xt rx6650xt', { k: 1.0 }),
  S('XFX', (c) => `XFX Speedster SWFT 309 ${c.l}`, 'triple', 3, '#2e3035', '#b8bcc2', 'rx6700 rx6700xt', { k: 1.0 }),
  S('ASUS', (c) => `ASUS ROG STRIX ${c.l} OC`, 'triple', 3, '#1c1d20', '#c9323a', 'rx6700xt rx6750xt', { k: 1.15, rgb: true }),
  S('ASUS', (c) => `ASUS TUF Gaming ${c.l} OC`, 'triple', 3, '#2a2b2e', '#d8b24a', 'rx6700xt rx6750xt rx6800 rx6800xt rx6900xt rx6950xt', { k: 1.08, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('ASUS', (c) => `ASUS Dual ${c.l}`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rx6400 rx6500xt rx6600 rx6600xt rx6650xt rx6700xt rx6750xt', { k: 1.02 }),
  S('MSI', (c) => `MSI ${c.l} GAMING X TRIO ${c.g}G`, 'triple', 3, '#1e1f22', '#c9323a', 'rx6700xt rx6750xt rx6800 rx6800xt rx6900xt rx6950xt', { k: 1.12, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('MSI', (c) => `MSI ${c.l} MECH 2X ${c.g}G OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx6500xt rx6600 rx6600xt rx6650xt rx6700xt rx6750xt', { k: 1.0 }),
  S('MSI', (c) => `MSI ${c.l} GAMING X ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'rx6600 rx6600xt rx6650xt', { k: 1.08, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'rx6500xt rx6600xt rx6650xt rx6700xt rx6750xt rx6800 rx6800xt rx6900xt rx6950xt', { k: 1.06, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} EAGLE ${c.g}G`, 'triple', 3, '#2b2e33', '#5aa0d0', 'rx6500xt rx6600 rx6600xt rx6650xt rx6700xt', { k: 1.02 }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ELITE ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rx6600xt rx6700xt rx6750xt', { k: 1.12, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} MASTER ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rx6800xt rx6900xt', { k: 1.2, rgb: true, pw: '3xpcie8' }),
  S('ASRock', (c) => `ASRock ${c.l} Challenger D ${c.g}GB`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx6600 rx6600xt rx6650xt rx6700 rx6700xt rx6750xt', { k: 1.0 }),
  S('ASRock', (c) => `ASRock ${c.l} Challenger ITX ${c.g}GB`, 'single-fan', 1, '#2a2b2f', '#9aa4ae', 'rx6400 rx6500xt', { k: 1.0, len: 1 }),
  S('ASRock', (c) => `ASRock ${c.l} Phantom Gaming D ${c.g}GB OC`, 'triple', 3, '#1e1f22', '#c9323a', 'rx6600xt rx6700xt rx6800 rx6800xt rx6900xt rx6950xt', { k: 1.05, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('ASRock', (c) => `ASRock ${c.l} Taichi X ${c.g}GB OC`, 'triple', 3, '#26282c', '#d8b24a', 'rx6800xt rx6900xt', { k: 1.15, rgb: true, pw: '3xpcie8' }),
], () => PCB.black);

// ---------- AMD Radeon RX 7000 ----------
gen('amd', ['HDMI', 'DP'], {
  rx7600: ['Radeon RX 7600', 2023, 2026, 269, 2, 165, 'pcie8', 8192, {}],
  rx7600xt: ['Radeon RX 7600 XT', 2024, 2026, 329, 2, 190, 'pcie8', 16384, {}],
  rx7700xt: ['Radeon RX 7700 XT', 2023, 2025, 449, 3, 245, '2xpcie8', 12288, { len: 3 }],
  rx7800xt: ['Radeon RX 7800 XT', 2023, 2025, 499, 3, 263, '2xpcie8', 16384, { len: 3 }],
  rx7900gre: ['Radeon RX 7900 GRE', 2024, 2025, 549, 4, 260, '2xpcie8', 16384, { len: 3 }],
  rx7900xt: ['Radeon RX 7900 XT', 2022, 2025, 799, 4, 315, '2xpcie8', 20480, { len: 3 }],
  rx7900xtx: ['Radeon RX 7900 XTX', 2022, 2025, 999, 5, 355, '2xpcie8', 24576, { len: 3 }],
}, [
  S('AMD', (c) => `AMD ${c.l}`, 'triple', 3, '#3a3d42', '#c9323a', 'rx7600 rx7700xt rx7800xt rx7900xt rx7900xtx', { k: 1 }),
  S('Sapphire', (c) => `Sapphire PULSE AMD ${c.l}`, 'dual', 2, '#2a2c30', '#c9323a', 'rx7600 rx7600xt rx7700xt rx7800xt rx7900gre rx7900xt rx7900xtx', { k: 1.03 }),
  S('Sapphire', (c) => `Sapphire NITRO+ AMD ${c.l}${c.w >= 300 ? ' Vapor-X' : ''}`, 'triple', 3, '#1d1e21', '#3a8fd8', 'rx7600 rx7600xt rx7700xt rx7800xt rx7900gre rx7900xt rx7900xtx', { k: 1.12, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('Sapphire', (c) => `Sapphire PURE AMD ${c.l}`, 'triple', 3, '#e9e9e6', '#9aa4ae', 'rx7700xt rx7800xt rx7900gre', { k: 1.06, rgb: true }),
  S('PowerColor', (c) => `PowerColor Red Devil ${c.l}`, 'triple', 3, '#1c1c1f', '#c9323a', 'rx7700xt rx7800xt rx7900gre rx7900xt rx7900xtx', { k: 1.12, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('PowerColor', (c) => `PowerColor Hellhound ${c.l}`, 'triple', 3, '#232428', '#3a8fd8', 'rx7600 rx7600xt rx7700xt rx7800xt rx7900gre rx7900xt rx7900xtx', { k: 1.04, rgb: true }),
  S('PowerColor', (c) => `PowerColor Hellhound Spectral White ${c.l}`, 'triple', 3, '#e9e9e6', '#3a8fd8', 'rx7800xt rx7900xt rx7900xtx', { k: 1.07, rgb: true, y0: 2024 }),
  S('PowerColor', (c) => `PowerColor Fighter ${c.l}`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx7600 rx7600xt rx7700xt rx7800xt', { k: 1.0 }),
  S('XFX', (c) => `XFX Speedster MERC 310 ${c.l}`, 'triple', 3, '#26282c', '#9aa4ae', 'rx7900xt rx7900xtx', { k: 1.1, pw: '3xpcie8' }),
  S('XFX', (c) => `XFX Speedster MERC 319 ${c.l}`, 'triple', 3, '#26282c', '#9aa4ae', 'rx7800xt rx7900gre', { k: 1.06 }),
  S('XFX', (c) => `XFX Speedster QICK 319 ${c.l}`, 'triple', 3, '#26282c', '#e8c030', 'rx7700xt rx7800xt', { k: 1.03 }),
  S('XFX', (c) => `XFX Speedster SWFT 210 ${c.l}`, 'dual', 2, '#2e3035', '#b8bcc2', 'rx7600 rx7600xt', { k: 1.0 }),
  S('ASUS', (c) => `ASUS TUF Gaming ${c.l} OC`, 'triple', 3, '#2a2b2e', '#d8b24a', 'rx7700xt rx7800xt rx7900gre rx7900xt rx7900xtx', { k: 1.1, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('ASUS', (c) => `ASUS Dual ${c.l} OC`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rx7600 rx7600xt rx7700xt rx7800xt', { k: 1.02 }),
  S('MSI', (c) => `MSI ${c.l} GAMING TRIO CLASSIC ${c.g}G`, 'triple', 3, '#1e1f22', '#c9323a', 'rx7900xt rx7900xtx', { k: 1.08, rgb: true, pw: '3xpcie8' }),
  S('MSI', (c) => `MSI ${c.l} GAMING X ${c.g}G`, 'dual', 2, '#1e1f22', '#c9323a', 'rx7600 rx7600xt', { k: 1.08, rgb: true }),
  S('MSI', (c) => `MSI ${c.l} MECH 2X ${c.g}G OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx7600 rx7600xt', { k: 1.0 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'rx7600 rx7600xt rx7700xt rx7800xt rx7900gre rx7900xt rx7900xtx', { k: 1.06, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ELITE ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rx7900xt rx7900xtx', { k: 1.15, rgb: true, pw: '3xpcie8' }),
  S('ASRock', (c) => `ASRock ${c.l} Challenger ${c.g}GB OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx7600 rx7600xt rx7700xt rx7800xt rx7900gre', { k: 1.0 }),
  S('ASRock', (c) => `ASRock ${c.l} Phantom Gaming ${c.g}GB OC`, 'triple', 3, '#1e1f22', '#c9323a', 'rx7700xt rx7800xt rx7900gre rx7900xt rx7900xtx', { k: 1.05, rgb: true }),
  S('ASRock', (c) => `ASRock ${c.l} Steel Legend ${c.g}GB OC`, 'triple', 3, '#e9e9e6', '#9aa4ae', 'rx7600 rx7600xt rx7700xt rx7800xt rx7900gre', { k: 1.04, rgb: true }),
  S('ASRock', (c) => `ASRock ${c.l} Taichi ${c.g}GB OC`, 'triple', 3, '#26282c', '#d8b24a', 'rx7900xt rx7900xtx', { k: 1.15, rgb: true, pw: '3xpcie8' }),
], () => PCB.black);

// ---------- AMD Radeon RX 9000 ----------
gen('amd', ['HDMI', 'DP'], {
  rx9060xt8: ['Radeon RX 9060 XT', 2025, 2026, 299, 2, 160, 'pcie8', 8192, { tag: ' 8GB' }],
  rx9060xt: ['Radeon RX 9060 XT', 2025, 2026, 349, 3, 180, 'pcie8', 16384, { tag: ' 16GB' }],
  rx9070: ['Radeon RX 9070', 2025, 2026, 549, 4, 220, '2xpcie8', 16384, { len: 3 }],
  rx9070xt: ['Radeon RX 9070 XT', 2025, 2026, 599, 4, 304, '2xpcie8', 16384, { len: 3 }],
}, [
  S('Sapphire', (c) => `Sapphire PULSE AMD ${c.L}`, 'dual', 2, '#2a2c30', '#c9323a', 'rx9060xt8 rx9060xt rx9070 rx9070xt', { k: 1.02 }),
  S('Sapphire', (c) => `Sapphire NITRO+ AMD ${c.L}`, 'triple', 3, '#1d1e21', '#3a8fd8', 'rx9060xt rx9070 rx9070xt', { k: 1.15, rgb: true, pw: (c) => (c.w >= 220 ? '12vhpwr' : c.p) }),
  S('Sapphire', (c) => `Sapphire PURE AMD ${c.L}`, 'triple', 3, '#e9e9e6', '#9aa4ae', 'rx9060xt rx9070 rx9070xt', { k: 1.06, rgb: true }),
  S('PowerColor', (c) => `PowerColor Red Devil ${c.L}`, 'triple', 3, '#1c1c1f', '#c9323a', 'rx9060xt rx9070 rx9070xt', { k: 1.12, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('PowerColor', (c) => `PowerColor Hellhound ${c.L}`, 'triple', 3, '#232428', '#3a8fd8', 'rx9060xt8 rx9060xt rx9070 rx9070xt', { k: 1.04, rgb: true }),
  S('PowerColor', (c) => `PowerColor Reaper ${c.L}`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx9060xt8 rx9060xt rx9070 rx9070xt', { k: 1.0 }),
  S('XFX', (c) => `XFX Swift AMD ${c.L}`, 'triple', 3, '#2e3035', '#b8bcc2', 'rx9060xt8 rx9060xt rx9070 rx9070xt', { k: 1.02 }),
  S('XFX', (c) => `XFX Mercury AMD ${c.L} OC Gaming Edition`, 'triple', 3, '#26282c', '#9aa4ae', 'rx9070 rx9070xt', { k: 1.12, rgb: true, pw: '3xpcie8' }),
  S('ASUS', (c) => `ASUS TUF Gaming ${c.L} OC`, 'triple', 3, '#2a2b2e', '#d8b24a', 'rx9070 rx9070xt', { k: 1.12, rgb: true, pw: (c) => (c.w >= 300 ? '3xpcie8' : c.p) }),
  S('ASUS', (c) => `ASUS Prime ${c.L} OC`, 'triple', 3, '#2c2e33', '#b8bcc2', 'rx9060xt rx9070 rx9070xt', { k: 1.05 }),
  S('ASUS', (c) => `ASUS Dual ${c.L} OC`, 'dual', 2, '#2b2d31', '#c0c6cc', 'rx9060xt8 rx9060xt', { k: 1.02 }),
  S('Gigabyte', (c) => `Gigabyte ${c.l} GAMING OC ${c.g}G`, 'triple', 3, '#26282c', '#e07a2e', 'rx9060xt8 rx9060xt rx9070 rx9070xt', { k: 1.06, rgb: true }),
  S('Gigabyte', (c) => `Gigabyte AORUS ${c.l} ELITE ${c.g}G`, 'triple', 3, '#1c1d20', '#e07a2e', 'rx9070xt', { k: 1.15, rgb: true, pw: '3xpcie8' }),
  S('ASRock', (c) => `ASRock ${c.L} Challenger OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'rx9060xt8 rx9060xt rx9070 rx9070xt', { k: 1.0 }),
  S('ASRock', (c) => `ASRock ${c.L} Steel Legend`, 'triple', 3, '#e9e9e6', '#9aa4ae', 'rx9060xt rx9070 rx9070xt', { k: 1.04, rgb: true }),
  S('ASRock', (c) => `ASRock ${c.L} Taichi OC`, 'triple', 3, '#26282c', '#d8b24a', 'rx9070 rx9070xt', { k: 1.15, rgb: true, pw: '12vhpwr' }),
], () => PCB.black);
push({ name: 'AMD Radeon RX 9060 XT 16GB', brand: 'AMD', year: 2025, until: 2026, cost: 4200, tier: 3, bus: 'PCIe', std: '3D', vram: 16384, watt: 180, pwr: 'pcie8', len: 2, out: ['HDMI', 'DP'], look: { brand: 'amd', style: 'dual', fans: 2, color: '#303236', pcb: PCB.black } });

// ---------- Intel Arc ----------
gen('intel', ['HDMI', 'DP'], {
  a380: ['Intel Arc A380', 2022, 2024, 139, 1, 75, null, 6144, { st: 'single-fan', len: 1 }],
  a580: ['Intel Arc A580', 2023, 2025, 179, 2, 185, '2xpcie8', 8192, {}],
  a750: ['Intel Arc A750', 2022, 2025, 289, 3, 225, '2xpcie8', 8192, {}],
  a770: ['Intel Arc A770', 2022, 2025, 349, 3, 225, '2xpcie8', 16384, { tag: ' 16GB' }],
  b570: ['Intel Arc B570', 2025, 2026, 219, 2, 150, 'pcie8', 10240, {}],
  b580: ['Intel Arc B580', 2024, 2026, 249, 2, 190, 'pcie8', 12288, {}],
}, [
  S('Intel', (c) => `${c.L} Limited Edition`, 'dual', 2, '#1d1e21', '#c0c6cc', 'a750 a770 b580', { k: 1 }),
  S('ASRock', (c) => `ASRock ${c.l} Challenger OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'a380 a580 a750 b570 b580', { k: 1.0 }),
  S('ASRock', (c) => `ASRock ${c.L} Phantom Gaming D OC`, 'triple', 3, '#1e1f22', '#c9323a', 'a750 a770', { k: 1.04, rgb: true }),
  S('ASRock', (c) => `ASRock ${c.l} Steel Legend OC`, 'dual', 2, '#e9e9e6', '#9aa4ae', 'b580', { k: 1.04, rgb: true }),
  S('Sparkle', (c) => `Sparkle ${c.l} ORC OC`, 'dual', 2, '#2a2b2f', '#e8c030', 'a580 a750', { k: 1.0 }),
  S('Sparkle', (c) => `Sparkle ${c.L} TITAN OC`, 'triple', 3, '#2a2b2f', '#3a8fd8', 'a770 b580', { k: 1.05, rgb: true }),
  S('Sparkle', (c) => `Sparkle ${c.l} ELF`, 'single-fan', 1, '#2a2b2f', '#e8c030', 'a380', { k: 1.0, len: 1 }),
  S('Sparkle', (c) => `Sparkle ${c.l} GUARDIAN OC`, 'dual', 2, '#2a2b2f', '#9aa4ae', 'b570', { k: 1.0 }),
  S('Acer', (c) => `Acer Predator BiFrost ${c.L} OC`, 'dual', 2, '#1c1d20', '#3ab0d8', 'a750 a770', { k: 1.05, rgb: true }),
], () => PCB.black);

for (const n of Object.keys(LEG)) if (!legacyUsed.has(n)) throw new Error('gpu.js: saknar befintligt kort ' + n);

export default G;
