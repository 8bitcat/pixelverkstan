// Testdelar (moderkort, grafikkort, ljudkort) för klassiska byggen innan hela databasen finns.
const mb = (id, name, year, o) => ({ id, cat: 'mb', name, brand: name.split(' ')[0], year, until: year + 4, cost: 2000, tier: 3, rgb: false, lvl: 1, look: { pcb: '#2e6b3c', accent: '#2a2a2a' }, audio: false, video: false, floppy: true, cpuPower: null, ...o });
const gpu = (id, name, year, o) => ({ id, cat: 'gpu', name, brand: name.split(' ')[0], year, until: year + 5, cost: 1500, tier: 3, rgb: false, lvl: 1, watt: 10, pwr: null, len: 2, look: { brand: 'ibm', style: 'isa-full', color: '#2e6b3c', fans: 0, pcb: '#2e6b3c' }, ...o });
export const FIX = [
  mb('fx-xt', 'Taiwan XT Turbo 10MHz', 1983, { socket: 'DIP40', chipset: 'Faraday FE2010', form: 'XT', ram: 'DIP', ramSlots: 4, ramMaxMB: 0.64, slots: { isa8: 8, isa16: 0, vlb: 0, pci: 0, agp: 0, pcie: 0 }, storage: [], floppy: false, power: 'AT' }),
  mb('fx-386', 'Mylex 386 AT', 1987, { socket: 'S386', chipset: 'C&T CS8230', form: 'AT', ram: 'SIMM30', ramSlots: 8, ramMaxMB: 16, slots: { isa8: 1, isa16: 6, vlb: 0, pci: 0, agp: 0, pcie: 0 }, storage: [], floppy: false, power: 'AT' }),
  mb('fx-486', 'Asus VL/I-486SV2GX4', 1992, { socket: 'S486', chipset: 'SiS 85C471', form: 'BabyAT', ram: 'SIMM30', ramSlots: 8, ramMaxMB: 64, slots: { isa8: 0, isa16: 4, vlb: 3, pci: 0, agp: 0, pcie: 0 }, storage: ['IDE'], floppy: true, power: 'AT' }),
  mb('fx-p2', 'Abit BH6', 1998, { socket: 'Slot1', chipset: 'i440BX', form: 'ATX', ram: 'SDR', ramSlots: 3, ramMaxMB: 768, slots: { isa8: 0, isa16: 1, vlb: 0, pci: 5, agp: 1, pcie: 0 }, storage: ['IDE'], floppy: true, power: 'ATX20' }),
  mb('fx-p4', 'ASUS P4P800', 2003, { socket: 'Socket478', chipset: 'i865PE', form: 'ATX', ram: 'DDR', ramSlots: 4, ramMaxMB: 4096, slots: { isa8: 0, isa16: 0, vlb: 0, pci: 5, agp: 1, pcie: 0 }, storage: ['IDE', 'SATA'], floppy: true, power: 'ATX20', cpuPower: 'ATX12V4', audio: true }),
  gpu('fx-cga', 'IBM Color Graphics Adapter', 1983, { bus: 'ISA8', std: 'CGA', vram: 0.016, out: ['DE9'] }),
  gpu('fx-vga', 'Paradise VGA Plus 16', 1987, { bus: 'ISA16', std: 'VGA', vram: 0.256, out: ['VGA'] }),
  gpu('fx-vlb', 'Diamond Stealth 24 VLB', 1992, { bus: 'VLB', std: 'SVGA', vram: 1, out: ['VGA'], look: { brand: 's3', style: 'vlb', color: '#2e6b3c', fans: 0, pcb: '#2e6b3c' } }),
  gpu('fx-tnt', 'Creative Graphics Blaster RIVA TNT2', 1998, { bus: 'AGP', std: '3D', vram: 32, watt: 20, out: ['VGA'], look: { brand: 'nvidia', style: 'agp-heatsink', color: '#2e6b3c', fans: 0, pcb: '#2e6b3c' } }),
  gpu('fx-6600', 'MSI GeForce 6600 GT AGP', 2003, { bus: 'AGP', std: '3D', vram: 128, watt: 60, pwr: 'molex', out: ['VGA', 'DVI'], look: { brand: 'nvidia', style: 'agp-fan', color: '#c9323a', fans: 1, pcb: '#c9323a' } }),
  { id: 'fx-sb', cat: 'sound', name: 'Creative Sound Blaster 16', brand: 'Creative', year: 1992, until: 1999, cost: 1200, tier: 3, rgb: false, lvl: 1, bus: 'ISA16', look: { style: 'isa', pcb: '#2e6b3c', accent: '#d8b24a' } },
];

