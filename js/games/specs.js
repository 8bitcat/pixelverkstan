// Systemkrav: vad speldatorn klarar. Datorn räknas om till några få mått ur de riktiga delarna,
// spelet har min- och rekommenderade krav, och resultatet är fps, ett fel eller mjukvaruläge.
// Ingen DOM – körs även i Node (tools/spel.mjs).

const GFX_RANK = { MDA: 0, HGC: 1, CGA: 2, EGA: 3, VGA: 4, SVGA: 5, '3D': 6 };

// Krav för PC-spelen: cpu = MHz-poäng (mhz × (1 + 0,25·(kärnor−1))), ram i MB, vram i MB, gfx = lägsta standard
export const REQ = {
  's-kq':        { min: { cpu: 4, ram: 0.125, gfx: 'CGA' },          rec: { cpu: 8, ram: 0.256, gfx: 'EGA', fps: 20 }, year: 1984 },
  's-pop':       { min: { cpu: 8, ram: 0.5, gfx: 'CGA' },            rec: { cpu: 16, ram: 1, gfx: 'VGA', fps: 30 }, year: 1990 },
  's-wolf3d':    { min: { cpu: 12, ram: 0.625, gfx: 'VGA' },         rec: { cpu: 33, ram: 2, gfx: 'VGA', fps: 35 }, year: 1992 },
  's-doom':      { min: { cpu: 25, ram: 4, gfx: 'VGA' },             rec: { cpu: 66, ram: 8, gfx: 'VGA', fps: 35 }, year: 1993 },
  's-myst':      { min: { cpu: 25, ram: 4, gfx: 'SVGA' },            rec: { cpu: 40, ram: 8, gfx: 'SVGA', fps: 15 }, year: 1993 },
  's-quake':     { min: { cpu: 75, ram: 8, gfx: 'SVGA' },            rec: { cpu: 166, ram: 16, gfx: '3D', vram: 4, fps: 40 }, year: 1996 },
  's-hl':        { min: { cpu: 133, ram: 24, gfx: 'SVGA' },          rec: { cpu: 266, ram: 32, gfx: '3D', vram: 8, fps: 40 }, year: 1998 },
  's-cs':        { min: { cpu: 200, ram: 32, gfx: '3D', vram: 4 },   rec: { cpu: 500, ram: 64, gfx: '3D', vram: 16, fps: 60 }, year: 2000 },
  's-wow':       { min: { cpu: 800, ram: 256, gfx: '3D', vram: 32 }, rec: { cpu: 1500, ram: 512, gfx: '3D', vram: 128, fps: 40 }, year: 2005 },
  's-crysis':    { min: { cpu: 2500, ram: 1024, gfx: '3D', vram: 256 }, rec: { cpu: 3800, ram: 2048, gfx: '3D', vram: 640, fps: 40 }, year: 2007 },
  's-minecraft': { min: { cpu: 1600, ram: 1024, gfx: '3D', vram: 128 }, rec: { cpu: 2600, ram: 2048, gfx: '3D', vram: 512, fps: 60 }, year: 2011 },
  's-witcher3':  { min: { cpu: 4500, ram: 6144, gfx: '3D', vram: 2048 }, rec: { cpu: 7500, ram: 8192, gfx: '3D', vram: 4096, fps: 60 }, year: 2015 },
  's-fortnite':  { min: { cpu: 3000, ram: 4096, gfx: '3D', vram: 1024 }, rec: { cpu: 6000, ram: 8192, gfx: '3D', vram: 4096, fps: 60 }, year: 2017 },
  's-cp2077':    { min: { cpu: 5500, ram: 8192, gfx: '3D', vram: 3072 }, rec: { cpu: 9500, ram: 12288, gfx: '3D', vram: 8192, fps: 60 }, year: 2020 },
};

// datorn på spelbordet → mått. parts = { cat: part }
export function machineOf(parts, year) {
  const cpu = parts.cpu, gpu = parts.gpu, ram = parts.ram, mb = parts.mb, snd = parts.sound;
  const cpuScore = cpu ? cpu.mhz * (1 + 0.25 * ((cpu.cores || 1) - 1)) : 0;
  const gfx = gpu ? gpu.std : (mb?.video ? 'VGA' : 'MDA');
  return {
    year, cpu: cpuScore, cpuName: cpu?.name || '–', ram: ram ? ram.mb : 0, vram: gpu ? gpu.vram : 0, gfx, gfxName: gpu?.name || (mb?.video ? 'inbyggd grafik' : 'ingen'),
    sound: !!(snd || (mb?.audio && year > 1996)), name: cpu ? `${cpu.name} · ${gpu ? gpu.name : 'inbyggd grafik'}` : 'Ingen dator',
  };
}

// hur spelet går på datorn
export function evaluate(gameId, m) {
  const q = REQ[gameId];
  if (!q) return { fps: 60, error: null, software: false };
  const old = q.year < 1995, mid = q.year < 2007;
  const out = { fps: 0, error: null, software: false, hint: '' };
  if (!m.cpu) return { ...out, error: old ? 'No system found' : 'Ingen dator på bordet', hint: 'Sätt ihop en dator på spelbordet först.' };
  if (m.ram < q.min.ram) return { ...out, error: old ? `Not enough memory to run this program. (${Math.round(q.min.ram * 1024)}K required)` : 'OUT OF MEMORY', hint: `Kräver ${fmtMb(q.min.ram)} minne – datorn har ${fmtMb(m.ram)}.` };
  if ((GFX_RANK[m.gfx] ?? 0) < (GFX_RANK[q.min.gfx] ?? 0)) {
    if (q.min.gfx === '3D') return { ...out, error: mid ? 'No 3D accelerator found' : 'DirectX 9 compatible graphics card required', hint: 'Spelet kräver ett 3D-grafikkort.' };
    return { ...out, error: `This game requires ${q.min.gfx}`, hint: `Grafikkortet klarar bara ${m.gfx}.` };
  }
  if (q.min.vram && m.vram < q.min.vram) return { ...out, error: 'Out of video memory', hint: `Kräver ${fmtMb(q.min.vram)} videominne – kortet har ${fmtMb(m.vram)}.` };
  if (m.cpu < q.min.cpu) return { ...out, error: old ? 'This program requires a faster processor' : 'Minimum system requirements not met', hint: `Processorn är för långsam (behöver ${Math.round(q.min.cpu)} MHz-poäng, har ${Math.round(m.cpu)}).` };
  // det går – hur bra?
  const cpuK = m.cpu / q.rec.cpu, vramK = q.rec.vram ? m.vram / q.rec.vram : 1, ramK = m.ram >= q.rec.ram ? 1 : 0.7;
  let fps = q.rec.fps * Math.min(1.25, Math.min(cpuK, vramK)) * ramK;
  if (q.rec.gfx === '3D' && m.gfx !== '3D') { out.software = true; fps *= 0.45; }
  out.fps = Math.round(Math.max(4, Math.min(70, fps)));
  out.smooth = out.fps >= 50 ? 'silkeslent' : out.fps >= 30 ? 'flyter bra' : out.fps >= 18 ? 'hackar' : out.fps >= 8 ? 'diabildsshow' : 'ospelbart';
  return out;
}
export const fmtMb = (mb) => (mb < 1 ? `${Math.round(mb * 1024)} KB` : mb < 1024 ? `${Math.round(mb)} MB` : `${+(mb / 1024).toFixed(1)} GB`);
