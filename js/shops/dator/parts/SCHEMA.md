# Deldatabasen – schema (v2, 1983–2026)

Varje kategori ligger i en egen fil `js/shops/dator/parts/<kategori>.js` som
exporterar `export default [ ... ]` (en array med delar). Filen får innehålla
tabeller och loopar som genererar varianter, men **inga DOM-anrop** och **inga
importer utöver `./canon.js`**. Filen körs både i webbläsaren och i Node.

Tidslinjen, alla socklar, minnestyper, bussar och kontakter med årtal finns i
[`canon.js`](canon.js) – använd exakt de nycklarna.

Validera alltid: `node tools/validate-parts.mjs <kategori>` (utan argument = allt).
Skriptet måste gå igenom utan fel.

## Grundregler

- **Riktiga produkter.** Använd riktiga tillverkare, produktserier och modellnamn
  från sin tid (t.ex. "Seagate ST-225 20MB", "Diamond Viper V550", "ASUS P5K Deluxe",
  "Corsair Vengeance LPX 16GB DDR4-3200"). Varianter (kapacitet, färg, OC-version)
  ska följa hur serien faktiskt såldes. Hitta aldrig på märken eller serier.
- **Årtal** `year` = året delen kom ut. `until` = sista året den säljs ny
  (valfritt, standard = year + typisk livslängd i `DEFAULT_LIFESPAN`). 1983 ≤ year ≤ until ≤ 2026.
- **Pris** `cost` = ungefärligt svenskt butikspris i kronor *det året* (nominella kronor,
  inkl. moms). Tips: USD-lanseringspris × `SEK_PER_USD[year]` × 1,25. Heltal.
- **Segment** `tier` 1–5 = marknadssegment *för sin tid* (1 = budget, 3 = mellan, 5 = toppmodell).
- **id** gemener, siffror, bindestreck och punkt, unikt i hela databasen. Prefixa med
  kategorin för nya delar (t.ex. `gpu-diamond-viper-v550`). Befintliga delar i
  `js/shops/dator/catalog.js` ska finnas med **med samma id, namn och look** – lägg till
  de nya fälten.
- `brand` = tillverkaren som står på lådan (t.ex. "ASUS", "Intel", "Corsair").
- `look` styr pixelgrafiken. Färger som `'#rrggbb'`.

## Gemensamma fält (alla kategorier)

| fält | typ | |
|---|---|---|
| id | string | unikt |
| cat | string | kategorinamnet |
| name | string | fullständigt produktnamn |
| brand | string | tillverkare |
| year | int | lanseringsår |
| until | int? | sista försäljningsår |
| cost | int | kronor det året |
| tier | 1–5 | segment för sin tid |
| rgb | bool? | har RGB-belysning (standard false) |
| look | object | se per kategori |

## Per kategori

### cpu
`socket` (SOCKETS-nyckel), `fits` (valfri array av socklar den också passar i, t.ex. AM2-CPU i AM2),
`mhz` (klockfrekvens i MHz, t.ex. 4.77 för 8088 → 4.77; 3700 för 3,7 GHz),
`cores` (int), `watt` (TDP, uppskatta för gamla), `igpu` (bool),
`needs`: `'none' | 'heatsink' | 'fan'` (kylning som krävs; 8088–386 = none, 486DX2 ≈ heatsink, Pentium och senare = fan),
`look`: `{ brand: 'intel'|'amd'|'cyrix'|'nec'|'harris'|'siemens'|'ibm'|'ti'|'umc'|'idt'|'via'|'rise', pkg: 'dip'|'plcc'|'pga'|'slot'|'lga'|'am-pga'|'am-lga' }`
(Intel LGA → `lga`, AMD AM4 och äldre → `am-pga`, AM5 → `am-lga`, Slot 1/A → `slot`).

### cooler
`sockets` (array SOCKETS-nycklar den passar), `maxW` (klarar TDP),
`look`: `{ type: 'heatsink'|'heatsink-fan'|'low'|'tower'|'aio', fan: '#', blade: '#', fin: '#', screen?: bool }`.

### mb
`socket`, `chipset` (t.ex. "i440BX", "nForce2 Ultra 400", "Z690"),
`form` (BOARD_FORMS-nyckel), `ram` (MEMORY-nyckel), `ramSlots` (int), `ramMaxMB` (int),
`slots`: `{ isa8, isa16, vlb, pci, agp, pcie }` (antal, 0 om inga),
`storage`: array av inbyggda gränssnitt `'IDE'|'SATA'|'NVMe'` (MFM är aldrig inbyggt → tom array på XT/AT-kort),
`floppy` (bool, inbyggd diskettkontroller), `power`: `'AT'|'ATX20'|'ATX24'`,
`cpuPower`: `null|'ATX12V4'|'EPS8'`, `video` (bool inbyggd grafik), `audio` (bool inbyggt ljud),
`look`: `{ pcb: '#', accent: '#' }`.

### ram
`type` (MEMORY-nyckel), `mb` (total storlek i MB för satsen), `sticks` (int),
`speed` (t.ex. "150ns", "70ns", "PC133", "DDR-400", "DDR4-3200"),
`look`: `{ color: '#', accent: '#', style: 'bare'|'spreader'|'fury'|'lpx'|'rgbbar'|'trident'|'dominator'|'ballistix'|'hyperx'|'ripjaws'|'ecc' }`.
DIP-minne säljs som satser av kretsar (t.ex. "Texas Instruments TMS4256 256K DRAM (9 st)").

### gpu
`bus` (BUSES-nyckel), `std` (GPU_STD-nyckel), `vram` (MB, t.ex. 0.064 för 64 KB), `watt`,
`pwr`: `null|'molex'|'pcie6'|'pcie8'|'2xpcie8'|'3xpcie8'|'12vhpwr'`, `len`: 1–3 (kortlängd),
`out`: array av VIDEO_OUT-nycklar (`'DE9'|'VGA'|'DVI'|'HDMI'|'DP'`),
`look`: `{ brand: 'nvidia'|'amd'|'ati'|'3dfx'|'matrox'|'s3'|'tseng'|'cirrus'|'trident'|'ibm'|'hercules'|'paradise'|'intel'|'rendition'|'powervr', style: 'isa-short'|'isa-full'|'vlb'|'pci-bare'|'agp-bare'|'agp-heatsink'|'agp-fan'|'single-fan'|'blower'|'dual'|'triple'|'fe'|'astral', color: '#', accent?: '#', fans: 0–4, pcb: '#' }`.
(`look.brand` = grafikkretsens tillverkare, `brand` = kortets tillverkare.)

### sound
`bus`: `'ISA8'|'ISA16'|'PCI'|'PCIe'`, `look`: `{ style: 'isa'|'pci'|'pcie', pcb: '#', accent: '#' }`.

### storage
`iface`: `'MFM'|'IDE'|'SATA'|'NVMe'`, `kind`: `'hdd'|'ssd'|'nvme'`, `mb` (kapacitet i MB),
`form`: `'5.25'|'3.5'|'2.5'|'M.2'`,
`look`: `{ label: '#', style: 'mfm-fh'|'hdd-hh'|'hdd35'|'ssd25'|'m2'|'m2-heatsink' }`.
MFM-diskar säljs **med kontrollerkort** (skriv det i namnet, t.ex. "Seagate ST-225 20MB + WD1002-WX2").

### media
`kind`: MEDIA-nyckel, `iface`: `'floppy'|'IDE'|'SATA'`,
`look`: `{ color: 'beige'|'black'|'white'|'grey', style: 'floppy525'|'floppy35'|'optical' }`.

### psu
`form`: `'AT'|'ATX'|'SFX'`, `watt`, `main`: `'AT'|'ATX20'|'ATX24'`, `cpu`: `null|'ATX12V4'|'EPS8'`,
`pcie`: array av `'pcie6'|'pcie8'` (en post per kontakt), `v12vhpwr` (bool), `sata` (int), `molex` (int), `berg` (int, diskettkontakter),
`modular` (bool), `eff`: `'none'|'80plus'|'bronze'|'silver'|'gold'|'platinum'|'titanium'`,
`look`: `{ color: '#', accent: '#', style: 'at-silver'|'at-beige'|'atx-silver'|'atx-black'|'modular' }`.

### case
`forms` (array BOARD_FORMS-nycklar), `style`: `'desktop'|'minitower'|'tower'|'midi'|'full'|'sff'`,
`bays`: `{ ext525, ext35, int35, int25 }`, `fans`: array av `'front1'|'front2'|'front3'|'rear'|'top1'|'top2'|'top3'`,
`look`: `{ color: '#', inner: '#', front: 'beige-xt'|'beige-at'|'beige-tower'|'beige-atx'|'black-atx'|'silver-atx'|'solid'|'mesh'|'glass'|'honeycomb'|'triangles'|'perforated', window: bool }`.

### fans
`count`, `size`: 80|92|120|140, `look`: `{ frame: '#', blade: '#' }`.

## Täckning (kontrolleras av validatorn)

Varje år i en sockels/minnestyps/buss livslängd ska ha minst några delar till salu,
t.ex. minst 2 moderkort och 2 processorer per sockel och år, 2 RAM-satser per minnestyp
och år, 2 grafikkort per buss och år osv. Kör validatorn för att se luckor.
