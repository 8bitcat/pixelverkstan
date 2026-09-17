// Tidslinjen (kanon) för datorhistorien 1983–2026. All deldata och alla
// kompatibilitetsregler utgår från dessa uppräkningar och årtal.
// År = [första året delar säljs, sista året delar säljs nya].

export const FIRST_YEAR = 1983;
export const LAST_YEAR = 2026;

// Processorsocklar (desktop). brands = vilka tillverkare som gjorde CPU:er till sockeln.
export const SOCKETS = {
  DIP40:      { years: [1983, 1990], brands: ['intel', 'amd', 'nec', 'harris', 'siemens'], note: '8088/8086/V20/V30 – 40 ben i två rader' },
  S286:       { years: [1984, 1992], brands: ['intel', 'amd', 'harris', 'siemens'], note: '80286 (PLCC/PGA)' },
  S386:       { years: [1986, 1995], brands: ['intel', 'amd', 'cyrix', 'ibm'], note: '386DX/SX' },
  S486:       { years: [1989, 1997], brands: ['intel', 'amd', 'cyrix', 'ibm', 'ti', 'umc'], note: 'Socket 1/2/3 – 486' },
  Socket4:    { years: [1993, 1995], brands: ['intel'], note: 'Pentium 60/66' },
  Socket5:    { years: [1994, 1997], brands: ['intel', 'amd', 'cyrix'], note: 'Pentium 75–133' },
  Socket7:    { years: [1995, 2001], brands: ['intel', 'amd', 'cyrix', 'idt', 'rise'], note: 'Pentium MMX, K6, 6x86, WinChip (även Super Socket 7)' },
  Socket8:    { years: [1995, 1998], brands: ['intel'], note: 'Pentium Pro' },
  Slot1:      { years: [1997, 2001], brands: ['intel'], note: 'Pentium II/III, Celeron (kassett)' },
  Socket370:  { years: [1998, 2003], brands: ['intel', 'via'], note: 'Celeron, Pentium III, VIA C3' },
  SlotA:      { years: [1999, 2001], brands: ['amd'], note: 'Athlon (kassett)' },
  SocketA:    { years: [2000, 2006], brands: ['amd'], note: 'Athlon, Duron, Athlon XP, Sempron (Socket 462)' },
  Socket423:  { years: [2000, 2002], brands: ['intel'], note: 'Pentium 4 Willamette' },
  Socket478:  { years: [2001, 2006], brands: ['intel'], note: 'Pentium 4, Celeron' },
  Socket754:  { years: [2003, 2007], brands: ['amd'], note: 'Athlon 64, Sempron' },
  Socket939:  { years: [2004, 2007], brands: ['amd'], note: 'Athlon 64, Athlon 64 X2, FX' },
  LGA775:     { years: [2004, 2011], brands: ['intel'], note: 'Pentium 4/D, Core 2 Duo/Quad (LGA 775)' },
  AM2:        { years: [2006, 2009], brands: ['amd'], note: 'Athlon 64 X2, Phenom (även AM2+)' },
  AM3:        { years: [2009, 2013], brands: ['amd'], note: 'Phenom II, Athlon II' },
  LGA1366:    { years: [2008, 2012], brands: ['intel'], note: 'Core i7 900-serien (X58)' },
  LGA1156:    { years: [2009, 2011], brands: ['intel'], note: 'Core i3/i5/i7 första generationen' },
  LGA1155:    { years: [2011, 2014], brands: ['intel'], note: 'Sandy/Ivy Bridge' },
  FM1:        { years: [2011, 2013], brands: ['amd'], note: 'A-serien Llano' },
  AM3plus:    { years: [2011, 2017], brands: ['amd'], note: 'FX-serien Bulldozer/Piledriver' },
  FM2:        { years: [2012, 2016], brands: ['amd'], note: 'A-serien Trinity/Richland/Kaveri (även FM2+)' },
  LGA2011:    { years: [2011, 2014], brands: ['intel'], note: 'Core i7 Extreme (X79)' },
  LGA1150:    { years: [2013, 2016], brands: ['intel'], note: 'Haswell/Broadwell' },
  LGA2011v3:  { years: [2014, 2017], brands: ['intel'], note: 'Haswell-E/Broadwell-E (X99)' },
  LGA1151:    { years: [2015, 2018], brands: ['intel'], note: 'Skylake/Kaby Lake' },
  LGA1151v2:  { years: [2017, 2020], brands: ['intel'], note: 'Coffee Lake' },
  AM4:        { years: [2017, 2026], brands: ['amd'], note: 'Ryzen 1000–5000' },
  TR4:        { years: [2017, 2020], brands: ['amd'], note: 'Threadripper 1000/2000' },
  LGA2066:    { years: [2017, 2021], brands: ['intel'], note: 'Core X-serien' },
  sTRX4:      { years: [2019, 2022], brands: ['amd'], note: 'Threadripper 3000' },
  LGA1200:    { years: [2020, 2023], brands: ['intel'], note: 'Comet/Rocket Lake' },
  LGA1700:    { years: [2021, 2026], brands: ['intel'], note: 'Alder/Raptor Lake' },
  AM5:        { years: [2022, 2026], brands: ['amd'], note: 'Ryzen 7000–9000' },
  LGA1851:    { years: [2024, 2026], brands: ['intel'], note: 'Core Ultra 200S' },
};

// Arbetsminne
export const MEMORY = {
  DIP:    { years: [1983, 1991], note: 'lösa DRAM-kretsar i socklar på moderkortet (t.ex. 41256)' },
  SIMM30: { years: [1987, 1996], note: '30-pin SIMM' },
  SIMM72: { years: [1993, 1999], note: '72-pin SIMM (FPM/EDO)' },
  SDR:    { years: [1997, 2003], note: 'SDRAM DIMM 168-pin (PC66/100/133)' },
  DDR:    { years: [2001, 2007], note: 'DDR SDRAM 184-pin' },
  DDR2:   { years: [2004, 2011], note: 'DDR2 240-pin' },
  DDR3:   { years: [2007, 2017], note: 'DDR3 240-pin' },
  DDR4:   { years: [2014, 2025], note: 'DDR4 288-pin' },
  DDR5:   { years: [2021, 2026], note: 'DDR5 288-pin' },
};

// Instickskortsbussar
export const BUSES = {
  ISA8:  { years: [1983, 1996], note: '8-bit ISA (XT-buss)' },
  ISA16: { years: [1984, 2000], note: '16-bit ISA (AT-buss)' },
  VLB:   { years: [1992, 1996], note: 'VESA Local Bus' },
  PCI:   { years: [1993, 2012], note: 'PCI' },
  AGP:   { years: [1997, 2007], note: 'AGP' },
  PCIe:  { years: [2004, 2026], note: 'PCI Express' },
};

// Hårddiskgränssnitt
export const STORAGE_IF = {
  MFM:  { years: [1983, 1991], note: 'ST-506 MFM/RLL, kräver kontrollerkort' },
  IDE:  { years: [1988, 2009], note: 'IDE/ATA/PATA, 40-pin flatkabel' },
  SATA: { years: [2003, 2026], note: 'SATA' },
  NVMe: { years: [2014, 2026], note: 'M.2 NVMe' },
};

// Moderkortsformat → byggprofil
export const BOARD_FORMS = {
  XT:     { years: [1983, 1988], profile: 'AT' },
  AT:     { years: [1984, 1994], profile: 'AT' },
  BabyAT: { years: [1986, 1999], profile: 'AT' },
  ATX:    { years: [1996, 2026], profile: 'ATX' },
  mATX:   { years: [1998, 2026], profile: 'ATX' },
  ITX:    { years: [2004, 2026], profile: 'ATX' },
};

// Strömkontakter
export const PSU_MAIN = { AT: [1983, 1999], ATX20: [1996, 2005], ATX24: [2004, 2026] };
export const CPU_POWER = { ATX12V4: [2000, 2009], EPS8: [2007, 2026] };
export const GPU_POWER = { molex: [1999, 2006], pcie6: [2004, 2014], pcie8: [2007, 2026], '2xpcie8': [2009, 2026], '3xpcie8': [2016, 2026], '12vhpwr': [2022, 2026] };

// Grafikstandarder och bildutgångar
export const GPU_STD = {
  MDA: [1983, 1987], HGC: [1983, 1990], CGA: [1983, 1989], EGA: [1984, 1991],
  VGA: [1987, 1995], SVGA: [1990, 1998], '3D': [1996, 2026],
};
export const VIDEO_OUT = { DE9: [1983, 1991], VGA: [1987, 2014], DVI: [1999, 2018], HDMI: [2006, 2026], DP: [2008, 2026] };

// Disketter och optiska enheter
export const MEDIA = {
  floppy525: { years: [1983, 1996], iface: 'floppy' },
  floppy35:  { years: [1987, 2007], iface: 'floppy' },
  cdrom:     { years: [1991, 2002], iface: 'IDE' },
  cdrw:      { years: [1998, 2006], iface: 'IDE' },
  dvd:       { years: [1998, 2009], iface: 'IDE|SATA' },
  dvdrw:     { years: [2002, 2016], iface: 'IDE|SATA' },
  bd:        { years: [2008, 2020], iface: 'SATA' },
};

// Ungefärlig växelkurs SEK/USD per år (för att räkna fram svenska priser inkl. moms ×1,25)
export const SEK_PER_USD = {
  1983: 7.7, 1984: 8.3, 1985: 8.6, 1986: 7.1, 1987: 6.3, 1988: 6.1, 1989: 6.4, 1990: 5.9, 1991: 6.0,
  1992: 5.8, 1993: 7.8, 1994: 7.7, 1995: 7.1, 1996: 6.7, 1997: 7.6, 1998: 8.0, 1999: 8.3, 2000: 9.2,
  2001: 10.3, 2002: 9.7, 2003: 8.1, 2004: 7.3, 2005: 7.5, 2006: 7.4, 2007: 6.8, 2008: 6.6, 2009: 7.6,
  2010: 7.2, 2011: 6.5, 2012: 6.8, 2013: 6.5, 2014: 6.9, 2015: 8.4, 2016: 8.6, 2017: 8.5, 2018: 8.7,
  2019: 9.5, 2020: 9.2, 2021: 8.6, 2022: 10.1, 2023: 10.6, 2024: 10.6, 2025: 10.2, 2026: 10.0,
};

// Hur länge en del normalt säljs ny om `until` saknas
export const DEFAULT_LIFESPAN = { cpu: 5, mb: 4, ram: 6, gpu: 4, sound: 6, storage: 5, media: 6, psu: 8, case: 8, cooler: 8, fans: 10 };

// Tillåtna kategorier
export const CATEGORIES = ['case', 'mb', 'cpu', 'cooler', 'ram', 'storage', 'media', 'gpu', 'sound', 'psu', 'fans'];

export const yearsOverlap = (a, b) => a[0] <= b[1] && b[0] <= a[1];
