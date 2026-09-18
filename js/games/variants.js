// Vilket spel varje titel i hyllan faktiskt är: motor, hjälte, fiender, palett, bana och känsla –
// plus era-utseendet efter konsolen. Titlar utan egen rad får en variant ur genre och omslag.
// Ingen DOM här (tools/spelvarianter.mjs kör alla titlar i Node).

export const PLATFORM_ERA = { atari2600: 'atari', c64: 'c64', amiga500: '16bit', nes: '8bit', sms: '8bit', gameboy: 'gb', megadrive: '16bit', gamegear: '8bit', neogeo: '16bit', snes: '16bit', playstation: '32bit', saturn: '32bit', n64: '32bit', gbc: '8bit', dreamcast: '32bit', ps2: '32bit', gba: '16bit', gamecube: '32bit', xbox: '32bit', ds: '16bit', psp: '32bit', xbox360: 'hd', wii: '32bit', ps3: 'hd', '3ds': '32bit', wiiu: 'hd', ps4: 'hd', xboxone: 'hd', switch: 'hd', quest2: 'hd', ps5: 'hd', seriesx: 'hd', steamdeck: 'hd', switch2: 'hd' };
const GFX_ERA = { MDA: 'cga', HGC: 'cga', CGA: 'cga', EGA: 'ega', VGA: '16bit', SVGA: '32bit' };
export function eraFor(product, machine = null) {
  if (!product) return 'hd';
  if (product.cat === 'arkad') return product.year < 1988 ? '8bit' : product.year < 1995 ? '16bit' : 'hd';
  if (product.platform === 'pc') {
    if (machine?.gfx && GFX_ERA[machine.gfx]) return GFX_ERA[machine.gfx];
    return product.year < 1988 ? 'cga' : product.year < 1991 ? 'ega' : product.year < 1996 ? '16bit' : 'hd';
  }
  return PLATFORM_ERA[product.platform] || 'hd';
}

// ---- färdiga paletter per bana ----
const SKY = { hills: '#5c94fc', city: '#2a2a44', castle: '#1a1a24', jungle: '#2f6f3a', cave: '#0a0a12', space: '#05060a', desert: '#f0c060', lab: '#3a3a44', snow: '#c8d8e8', toy: '#ffd0e0' };
const GROUND = { hills: '#c84c0c', city: '#5a5a66', castle: '#5a5a66', jungle: '#5a3d2b', cave: '#3a2a2a', space: '#3a3a44', desert: '#e0a02a', lab: '#8a8f9c', snow: '#e8f0f8', toy: '#c98a4a' };
const P = (engine, o = {}) => ({ engine, ...o });
const plat = (hero, foe, item, bg, o = {}) => P('plattform', { hero, foe, item, bg, sky: SKY[bg], ground: GROUND[bg], ...o });
const adv = (hero, foeKind, tile, o = {}) => P('aventyr', { hero, foeKind, tile, ...o });
const ray = (wall, wall2, ceil, floor, foe, foeKind, o = {}) => P('raycast', { wall, wall2, ceil, floor, foe, foeKind, ...o });

export const V = {
  // ---- plattform ----
  's-smb': plat('plumber', 'goomba', 'coin', 'hills', { hill: '#3fb04a', blocks: true, speed: 70, jump: 200 }),
  's-smb3': plat('plumber', 'goomba', 'coin', 'hills', { sky: '#7ab0e0', hill: '#3fb04a', blocks: true, speed: 78, jump: 205 }),
  's-smw': plat('plumber', 'goomba', 'coin', 'hills', { sky: '#4a8ae0', hill: '#2f8f46', plat: '#e0a02a', blocks: true, speed: 80, jump: 210, heroCol: '#e23b5a' }),
  's-smland': plat('plumber', 'goomba', 'coin', 'desert', { blocks: true, speed: 65, jump: 190 }),
  's-mario64': plat('plumber', 'goomba', 'star', 'castle', { sky: '#5c94fc', ground: '#3fb04a', speed: 90, jump: 225 }),
  's-odyssey': plat('plumber', 'goomba', 'coin', 'city', { sky: '#f0c060', speed: 95, jump: 230, blocks: true }),
  's-nsmb': plat('plumber', 'goomba', 'coin', 'hills', { blocks: true, speed: 75, jump: 200 }),
  's-nsmbu': plat('plumber', 'goomba', 'coin', 'hills', { sky: '#7ab0e0', blocks: true, speed: 78, jump: 205 }),
  's-sonic': plat('hedgehog', 'crab', 'ring', 'hills', { sky: '#2c9cf0', ground: '#c88a3a', hill: '#3fb04a', plat: '#c88a3a', springs: true, roll: true, speed: 135, jump: 215, heroCol: '#2a4ad8' }),
  's-sonic2': plat('hedgehog', 'crab', 'ring', 'hills', { sky: '#2c9cf0', ground: '#c88a3a', hill: '#3fb04a', springs: true, roll: true, speed: 145, jump: 215, heroCol: '#2a4ad8' }),
  's-sonicms': plat('hedgehog', 'crab', 'ring', 'hills', { sky: '#3a9ad8', ground: '#c88a3a', springs: true, roll: true, speed: 110, jump: 205, heroCol: '#2a4ad8' }),
  's-sonicgg': plat('hedgehog', 'crab', 'ring', 'hills', { sky: '#3a9ad8', springs: true, roll: true, speed: 115, jump: 205, heroCol: '#2a4ad8' }),
  's-sonicadv': plat('hedgehog', 'robot', 'ring', 'city', { sky: '#3a78d8', springs: true, roll: true, speed: 150, jump: 220, heroCol: '#2a4ad8' }),
  's-giana': plat('girl', 'bat', 'gem', 'hills', { sky: '#3a78d8', blocks: true, speed: 70, jump: 195, heroCol: '#e23b5a' }),
  's-alexkidd': plat('kid', 'crab', 'star', 'hills', { sky: '#7ab0e0', blocks: true, speed: 75, jump: 190, heroCol: '#e23b5a' }),
  's-wonderboy': plat('kid', 'snail', 'fruit', 'jungle', { sky: '#7ab0e0', speed: 85, jump: 190, heroCol: '#3fb04a' }),
  's-lastninja': plat('ninja', 'thug', 'star', 'castle', { sky: '#1a1a44', ground: '#3a3a44', speed: 70, jump: 185, heroCol: '#e23b5a', foeCol: '#1a1a1e' }),
  's-jumpman': plat('kid', 'robot', 'bolt', 'cave', { speed: 75, jump: 180, heroCol: '#f0e030' }),
  's-impmission': plat('soldier', 'robot', 'gem', 'lab', { stomp: false, speed: 80, jump: 190, heroCol: '#2a2a34' }),
  's-pitfall': plat('kid', 'croc', 'gem', 'jungle', { speed: 65, jump: 180, heroCol: '#3fb04a', holes: 0.4 }),
  's-turrican': plat('marine', 'robot', 'gem', 'cave', { shoot: true, speed: 85, jump: 195, heroCol: '#e07a2e' }),
  's-megaman2': plat('robot', 'robot', 'bolt', 'city', { shoot: true, speed: 75, jump: 200, heroCol: '#3a78d8', foeCol: '#c98a4a' }),
  's-metalslug': plat('soldier', 'soldier', 'coin', 'desert', { shoot: true, speed: 90, jump: 200, heroCol: '#c8a24a', foeCol: '#8a8f9c' }),
  's-pop': plat('kid', 'orc', 'heart', 'castle', { stomp: false, speed: 70, jump: 170, heroCol: '#f4f2ec', foeCol: '#3a3a44' }),
  's-crash': plat('crash', 'crab', 'fruit', 'jungle', { speed: 95, jump: 205, heroCol: '#e07a2e' }),
  's-dkc': plat('ape', 'snail', 'banana', 'jungle', { speed: 85, jump: 200, heroCol: '#8a5a3a' }),
  's-lbp': plat('kid', 'slime', 'star', 'toy', { speed: 70, jump: 195, heroCol: '#8a5a3a' }),
  's-astrobot': plat('astro', 'robot', 'bolt', 'space', { speed: 90, jump: 215, heroCol: '#3fd0e0' }),
  's-beast': plat('bat', 'skull', 'gem', 'desert', { sky: '#4a1a5a', ground: '#8a5a3a', stomp: false, speed: 80, jump: 190 }),
  's-nights': plat('astro', 'bat', 'star', 'space', { sky: '#4a1a5a', jump: 260, gravity: 300, speed: 100, heroCol: '#b58cff' }),
  's-bubble': plat('kid', 'bat', 'fruit', 'cave', { sky: '#3fd0e0', ground: '#3fb04a', speed: 70, jump: 200, heroCol: '#3fb04a' }),
  'a-dkong': plat('plumber', 'barrel', 'star', 'castle', { kong: true, sky: '#05060a', ground: '#e23b5a', plat: '#e23b5a', speed: 60, jump: 175 }),
  'a-mariobros': plat('plumber', 'crab', 'coin', 'castle', { sky: '#05060a', ground: '#3fb04a', plat: '#3fb04a', speed: 65, jump: 185 }),
  // ---- gräv ----
  's-boulder': P('dig', { mode: 'boulder', hero: 'kid', heroCol: '#3fb04a', dirt: '#8a5a3a', rock: '#8a8f9c', gem: '#3fd0e0' }),
  's-loderunner': P('dig', { mode: 'lode', hero: 'kid', heroCol: '#f4f2ec', dirt: '#c98a4a', rock: '#5a5a66', gem: '#f0e030' }),
  's-lemmings': P('dig', { mode: 'boulder', hero: 'kid', heroCol: '#3fb04a', dirt: '#5a3d2b', rock: '#5a5a66', gem: '#3fb04a' }),
  's-minecraft': P('dig', { mode: 'mine', hero: 'kid', heroCol: '#3fd0e0', dirt: '#6a4a2a', rock: '#7a7a7a', gem: '#3fd0e0', foeKind: 'creeper' }),
  's-bananza': P('dig', { mode: 'mine', hero: 'ape', heroCol: '#8a5a3a', dirt: '#c98a4a', rock: '#8a8f9c', gem: '#f0e030', foeKind: 'snail' }),
  // ---- labyrint ----
  'a-pacman': P('labyrint2d', { wall: '#2a4ad8', heroCol: '#f0e030' }),
  'a-retro': P('labyrint2d', { wall: '#2a4ad8', heroCol: '#f0e030' }),
  's-pacman2600': P('labyrint2d', { wall: '#3a78d8', heroCol: '#f0e030' }),
  // ---- rymd ----
  'a-invaders': P('rymd', { mode: 'march', foeCol: '#3fb04a' }),
  'a-galaga': P('rymd', { mode: 'dive' }),
  's-riverraid': P('rymd', { mode: 'river' }),
  's-starcraft': P('rymd', { mode: 'horde', hero: 'marine', foeKind: 'crab', foeCol: '#b58cff', bg: '#1a1a44' }),
  's-vampsurv': P('rymd', { mode: 'horde', hero: 'knight', foeKind: 'skull', foeCol: '#f4f2ec', bg: '#0a0a12' }),
  // ---- äventyr / rollspel ----
  's-zelda': adv('link', 'orc', 'grass', { heroCol: '#3fb04a' }),
  's-ladx': adv('link', 'orc', 'grass', { heroCol: '#3fb04a' }),
  's-lttp': adv('link', 'orc', 'grass', { heroCol: '#3fb04a', foeCol: '#3a78d8' }),
  's-oot': adv('link', 'orc', 'dungeon', { heroCol: '#3fb04a' }),
  's-windwaker': adv('link', 'slime', 'water', { heroCol: '#3fb04a' }),
  's-botw': adv('link', 'orc', 'snow', { heroCol: '#3a78d8' }),
  's-kq': adv('knight', 'orc', 'grass', { heroCol: '#e23b5a' }),
  's-myst': adv('kid', 'ghost', 'water', { heroCol: '#5a5a66', calm: true }),
  's-ff7': adv('knight', 'robot', 'lab', { heroCol: '#3a78d8', weapon: 'bigsword' }),
  's-pokemon': adv('kid', 'slime', 'grass', { heroCol: '#e23b5a', weapon: 'ball' }),
  's-pokemonrs': adv('kid', 'slime', 'grass', { heroCol: '#3a78d8', weapon: 'ball' }),
  's-pokemonxy': adv('kid', 'slime', 'grass', { heroCol: '#e23b5a', weapon: 'ball' }),
  's-wow': adv('viking', 'orc', 'grass', { heroCol: '#b58cff' }),
  's-warcraft2': adv('knight', 'orc', 'grass', { heroCol: '#3a78d8' }),
  's-aoe': adv('knight', 'soldier', 'desert', { heroCol: '#c8a24a' }),
  's-doc': adv('knight', 'soldier', 'grass', { heroCol: '#7a1a10' }),
  's-mgs': adv('soldier', 'soldier', 'lab', { heroCol: '#2a2a34', weapon: 'gun' }),
  's-tombraider': adv('girl', 'bat', 'dungeon', { heroCol: '#3fd0e0', weapon: 'gun' }),
  's-uncharted2': adv('soldier', 'soldier', 'snow', { heroCol: '#c98a4a', weapon: 'gun' }),
  's-uncharted4': adv('soldier', 'soldier', 'jungle', { heroCol: '#c98a4a', weapon: 'gun' }),
  's-shenmue': adv('kid', 'thug', 'city', { heroCol: '#5a3d2b' }),
  's-skyrim': adv('viking', 'skull', 'snow', { heroCol: '#8a8f9c' }),
  's-witcher3': adv('knight', 'ghost', 'grass', { heroCol: '#e8e6e0' }),
  's-eldenring': adv('knight', 'skull', 'lava', { heroCol: '#c8a24a' }),
  's-bg3': adv('viking', 'skull', 'dungeon', { heroCol: '#7a1a10' }),
  's-hades': adv('knight', 'skull', 'lava', { heroCol: '#e23b5a', weapon: 'bigsword' }),
  's-valheim': adv('viking', 'orc', 'snow', { heroCol: '#5a3d2b' }),
  's-acvalhalla': adv('viking', 'soldier', 'grass', { heroCol: '#3a78d8' }),
  's-gow': adv('knight', 'skull', 'lava', { heroCol: '#f4f2ec', weapon: 'bigsword' }),
  's-gow3': adv('knight', 'skull', 'lava', { heroCol: '#f4f2ec', weapon: 'bigsword' }),
  's-gow2018': adv('viking', 'skull', 'snow', { heroCol: '#7a1a10', weapon: 'bigsword' }),
  's-halflifealyx': ray('#8a8f9c', '#5a5a66', '#3a3a44', '#5a5a66', '#8a3a3a', 'zombie', { outdoor: false }),
  // ---- stad ----
  's-gta3': P('city', { mode: 'gta', night: true }),
  's-gtasa': P('city', { mode: 'gta', sun: true }),
  's-gtalcs': P('city', { mode: 'gta', night: true }),
  's-gtav': P('city', { mode: 'gta', sun: true }),
  's-crazytaxi': P('city', { mode: 'taxi', sun: true, carCol: '#f0e030' }),
  's-cp2077': P('city', { mode: 'gta', neon: true }),
  's-spiderman': P('city', { mode: 'taxi', carCol: '#e23b5a', hero: 'swing' }),
  's-milesmorales': P('city', { mode: 'taxi', night: true, carCol: '#e23b5a', hero: 'swing' }),
  // ---- racer ----
  'a-outrun': P('racer', { mode: 'road', car: '#e23b5a', sky: '#3a9ad8', hill: '#5a8aaa' }),
  'a-daytona': P('racer', { mode: 'gt', car: '#3a78d8', sky: '#3a9ad8' }),
  'a-segarally': P('racer', { mode: 'gt', car: '#3fb04a', grass: '#c98a4a', sky: '#7ab0e0', hill: '#5a8a3a', dirt: true }),
  's-segarallysat': P('racer', { mode: 'gt', car: '#3fb04a', grass: '#c98a4a', dirt: true }),
  'a-initiald': P('racer', { mode: 'drift', car: '#f4f2ec', night: true }),
  's-gt': P('racer', { mode: 'gt', car: '#f4f2ec' }), 's-gt3': P('racer', { mode: 'gt', car: '#e23b5a' }), 's-gt5': P('racer', { mode: 'gt', car: '#3a78d8' }), 's-gt7': P('racer', { mode: 'gt', car: '#f0e030' }),
  's-forza': P('racer', { mode: 'gt', car: '#3fb04a' }), 's-forza3': P('racer', { mode: 'gt', car: '#e07a2e' }), 's-forza5': P('racer', { mode: 'gt', car: '#3fd0e0' }),
  's-fh3': P('racer', { mode: 'road', car: '#3fd0e0', grass: '#e0a02a', sky: '#7ab0e0' }), 's-fh4': P('racer', { mode: 'road', car: '#f0e030', grass: '#5a8a3a', sky: '#5a8aaa' }), 's-fh5': P('racer', { mode: 'road', car: '#e07a2e', grass: '#c98a4a', sky: '#f0c060' }),
  's-smk': P('racer', { mode: 'kart', car: '#e23b5a', sky: '#5c94fc' }), 's-mariokart64': P('racer', { mode: 'kart', car: '#e23b5a' }), 's-mksc': P('racer', { mode: 'kart', car: '#e23b5a' }), 's-mkdd': P('racer', { mode: 'kart', car: '#3fb04a' }),
  's-mkds': P('racer', { mode: 'kart', car: '#e23b5a' }), 's-mkwii': P('racer', { mode: 'kart', car: '#3a78d8' }), 's-mk7': P('racer', { mode: 'kart', car: '#e23b5a' }), 's-mk8': P('racer', { mode: 'kart', car: '#e23b5a' }), 's-mariokart8': P('racer', { mode: 'kart', car: '#e23b5a' }), 's-mkworld': P('racer', { mode: 'kart', car: '#e23b5a', sky: '#f0c060' }),
  // ---- fight ----
  'a-sf2': P('fight', { mode: 'sf', p1: '#e8e6e0', p2: '#e23b5a', p1name: 'RYU', p2name: 'KEN' }),
  's-sf2snes': P('fight', { mode: 'sf', p1: '#e8e6e0', p2: '#e23b5a', p1name: 'RYU', p2name: 'KEN' }),
  's-fatalfury': P('fight', { mode: 'sf', p1: '#e23b5a', p2: '#3a78d8', p1name: 'TERRY', p2name: 'ANDY' }),
  'a-neogeomini': P('fight', { mode: 'sf', p1: '#e23b5a', p2: '#3a78d8', p1name: 'TERRY', p2name: 'GEESE' }),
  'a-mk': P('fight', { mode: 'mk', p1: '#3a78d8', p2: '#f0e030', p1name: 'SUB-ZERO', p2name: 'SCORPION', sky: '#1a1a24', bg: '#3a2a2a', floor: '#3a3a44' }),
  's-mk': P('fight', { mode: 'mk', p1: '#3a78d8', p2: '#f0e030', p1name: 'SUB-ZERO', p2name: 'SCORPION', sky: '#1a1a24', bg: '#3a2a2a', floor: '#3a3a44' }),
  's-tekken': P('fight', { mode: '3d', p1: '#e8e6e0', p2: '#e23b5a', p1name: 'KAZUYA', p2name: 'PAUL' }),
  's-tekken3': P('fight', { mode: '3d', p1: '#e8e6e0', p2: '#e23b5a', p1name: 'JIN', p2name: 'HWOARANG' }),
  's-tekkentag': P('fight', { mode: '3d', p1: '#e8e6e0', p2: '#e23b5a', p1name: 'JIN', p2name: 'KAZUYA' }),
  's-vf2': P('fight', { mode: '3d', p1: '#3a78d8', p2: '#f4f2ec', p1name: 'AKIRA', p2name: 'KAGE' }),
  's-soulcalibur': P('fight', { mode: '3d', p1: '#c8a24a', p2: '#8a8f9c', p1name: 'MITSURUGI', p2name: 'SIEGFRIED', swords: true }),
  's-smashmelee': P('fight', { mode: 'smash', p1: '#e23b5a', p2: '#3fb04a', p1name: 'MARIO', p2name: 'LINK', sky: '#5c94fc' }),
  's-smashult': P('fight', { mode: 'smash', p1: '#e23b5a', p2: '#2a4ad8', p1name: 'MARIO', p2name: 'SONIC', sky: '#5c94fc' }),
  // ---- gatuslagsmål ----
  'a-ddragon': P('brawl', { hero: 'brawler', heroCol: '#3a78d8', foeKind: 'thug', street: 'city' }),
  'a-finalfight': P('brawl', { hero: 'brawler', heroCol: '#f4f2ec', foeKind: 'thug', street: 'city' }),
  'a-goldenaxe': P('brawl', { hero: 'barbarian', heroCol: '#c8a24a', foeKind: 'orc', street: 'castle', weapon: 'axe' }),
  's-goldenaxemd': P('brawl', { hero: 'barbarian', heroCol: '#c8a24a', foeKind: 'orc', street: 'castle', weapon: 'axe' }),
  's-sor2': P('brawl', { hero: 'brawler', heroCol: '#3a78d8', foeKind: 'thug', street: 'night' }),
  's-tmnt': P('brawl', { hero: 'turtle', heroCol: '#e23b5a', foeKind: 'robot', foeCol: '#b58cff', street: 'sewer' }),
  's-alteredbeast': P('brawl', { hero: 'beast', heroCol: '#8a5a3a', foeKind: 'zombie', street: 'grave' }),
  // ---- raycast ----
  's-wolf3d': ray('#7a7a8a', '#5a5a6a', '#3a3a44', '#5a5a66', '#8a6a3a', 'nazi'),
  's-doom': ray('#8a4a2a', '#6a3a1a', '#3a1a1a', '#5a3a2a', '#8a3a3a', 'imp'),
  's-quake': ray('#6a5a4a', '#4a3a2a', '#2a2a24', '#4a4a3a', '#8a7a5a', 'ogre'),
  's-goldeneye': ray('#8a8f9c', '#6a6f7c', '#3a3a44', '#4a4a56', '#2a2a34', 'soldier'),
  's-hl': ray('#8aa06a', '#6a804a', '#3a4a3a', '#5a5a66', '#c98a4a', 'headcrab'),
  's-hl2': ray('#7a7a7a', '#5a5a5a', '#5a8aaa', '#4a4a4a', '#e8e6e0', 'soldier', { outdoor: true }),
  's-cs': ray('#c8b88a', '#a8986a', '#7ab0e0', '#8a7a5a', '#3a3a44', 'soldier', { outdoor: true }),
  's-csgo': ray('#c8b88a', '#a8986a', '#7ab0e0', '#8a7a5a', '#3a3a44', 'soldier', { outdoor: true }),
  's-bf1942': ray('#8a8a6a', '#6a6a4a', '#7ab0e0', '#6a6a4a', '#5a5a3a', 'soldier', { outdoor: true }),
  's-halo': ray('#5a5a8a', '#3a3a6a', '#3a78d8', '#6a6a7a', '#b58cff', 'covenant', { outdoor: true }),
  's-halo2': ray('#5a5a8a', '#3a3a6a', '#3a78d8', '#6a6a7a', '#b58cff', 'covenant', { outdoor: true }),
  's-halo3': ray('#5a6a5a', '#3a4a3a', '#7ab0e0', '#5a6a4a', '#b58cff', 'covenant', { outdoor: true }),
  's-halo5': ray('#5a5a8a', '#3a3a6a', '#3a78d8', '#6a6a7a', '#e07a2e', 'covenant', { outdoor: true }),
  's-haloinf': ray('#5a6a5a', '#3a4a3a', '#7ab0e0', '#5a6a4a', '#e07a2e', 'covenant', { outdoor: true }),
  's-crysis': ray('#3a6a3a', '#2a4a2a', '#7ab0e0', '#4a6a3a', '#8a8f9c', 'soldier', { outdoor: true }),
  's-fortnite': ray('#c98a4a', '#a06a2a', '#7ab0e0', '#5a8a3a', '#b58cff', 'thug', { outdoor: true, cartoon: true }),
  's-overwatch': ray('#e8e6e0', '#c8c6c0', '#7ab0e0', '#8a8f9c', '#3a78d8', 'robot', { outdoor: true, cartoon: true }),
  's-gears': ray('#5a5a5a', '#3a3a3a', '#3a3a44', '#4a4a4a', '#8a6a5a', 'ogre'),
  's-killzone': ray('#5a5a6a', '#3a3a4a', '#3a3a44', '#4a4a56', '#e23b5a', 'soldier'),
  's-portal': ray('#f4f2ec', '#c8c6c0', '#e8e6e0', '#8a8f9c', '#3a78d8', 'drone', { portal: true }),
  // ---- ljuspistol ----
  's-duckhunt': P('gun', { mode: 'ducks' }),
  'a-opwolf': P('gun', { mode: 'jungle', foe: '#3a4a2a' }),
  'a-timecrisis': P('gun', { mode: 'city', foe: '#e23b5a' }),
  'a-hotd': P('gun', { mode: 'zombies' }),
  's-splatoon': P('gun', { mode: 'ink' }),
  // ---- block ----
  's-tetris': P('block', { mode: 'tetris' }), 's-tetrisdx': P('block', { mode: 'tetris' }),
  's-columns': P('block', { mode: 'columns' }),
  's-lumines': P('block', { mode: 'lumines' }),
  's-braintrain': P('block', { mode: 'tetris', bg: '#f4f2ec' }),
  's-pinball': P('sport', { mode: 'pinball' }),
  // ---- dans ----
  'a-ddr': P('dance', { mode: 'ddr' }), 's-beatsaber': P('dance', { mode: 'saber' }), 's-wiifit': P('dance', { mode: 'ddr', bg: '#f4f2ec' }),
  // ---- sport ----
  's-nhl94': P('sport', { mode: 'hockey' }), 's-fifa': P('sport', { mode: 'soccer' }), 's-sensi': P('sport', { mode: 'soccer' }), 's-intsoccer': P('sport', { mode: 'soccer' }),
  'a-nbajam': P('sport', { mode: 'basket' }), 's-wiisports': P('sport', { mode: 'tennis' }), 's-summergames': P('sport', { mode: 'track' }),
  // ---- sim ----
  's-simcity2000': P('sim', { mode: 'city' }), 's-thesims': P('sim', { mode: 'pet', pet: 'person' }), 's-nintendogs': P('sim', { mode: 'pet', pet: 'dog' }), 's-acnh': P('sim', { mode: 'farm' }),
  's-ghostbusters': P('city', { mode: 'taxi', carCol: '#f4f2ec', night: true }),
  's-intsoccer': P('sport', { mode: 'soccer' }),
};

// motivet på omslaget säger vilken hjälte man får när titeln saknar egen rad
const MOTIF_HERO = { plumber: 'plumber', hedgehog: 'hedgehog', ninja: 'ninja', prince: 'kid', sword: 'link', bigsword: 'knight', marine: 'marine', soldier: 'soldier', ape: 'ape', dragon: 'knight', castle: 'knight', gun: 'soldier', kart: 'plumber', ball: 'kid', dog: 'kid', blocks: 'kid', jungle: 'kid', island: 'kid', city: 'kid', skull: 'knight', lambda: 'soldier', quake: 'marine', bus: 'soldier', car: 'soldier', gem: 'kid', hockey: 'kid', fighter: 'kid' };
const ENGINE_MAP = { rpg: 'aventyr', aventyr: 'aventyr', city: 'city', sport: 'sport', sim: 'sim', kong: 'plattform', maze: 'labyrint2d', invaders: 'rymd', road: 'racer', basket: 'sport', corridor: 'raycast', blocks: 'block', platform: 'plattform', fight: 'fight', gun: 'gun', dance: 'dance' };

// varianten för en titel: egen rad, annars härledd ur genre, omslag och era
export function variantFor(product, engineHint = null) {
  const base = product ? V[product.id] : null;
  const raw = base?.engine || product?.engine || product?.attract || engineHint || 'plattform';
  const engine = ENGINE_MAP[raw] || raw;
  const cover = product?.look?.cover || {};
  const v = { engine, era: eraFor(product), title: product?.name || '', ...(base || {}) };
  if (!base) {
    if (engine === 'plattform') { v.hero = MOTIF_HERO[cover.motif] || 'kid'; v.foe = ['goomba', 'crab', 'snail', 'bat', 'robot'][(product?.name?.length || 0) % 5]; v.item = 'coin'; v.bg = 'hills'; v.heroCol = cover.fg || '#e23b5a'; }
    else if (engine === 'aventyr') { v.hero = MOTIF_HERO[cover.motif] || 'knight'; v.foeKind = 'orc'; v.tile = 'grass'; v.heroCol = cover.fg || '#3fb04a'; }
    else if (engine === 'raycast') { v.wall = cover.bg || '#7a7a8a'; v.wall2 = '#5a5a6a'; v.foe = cover.fg || '#8a3a3a'; v.foeKind = 'soldier'; }
    else if (engine === 'racer') { v.mode = 'road'; v.car = cover.fg || '#e23b5a'; }
    else if (engine === 'fight') { v.mode = 'sf'; v.p1 = '#e8e6e0'; v.p2 = cover.fg || '#e23b5a'; }
    else if (engine === 'rymd') { v.mode = 'march'; v.bg = cover.bg || '#05060a'; }
    else if (engine === 'sport') { v.mode = 'soccer'; }
    else if (engine === 'sim') { v.mode = 'city'; }
    else if (engine === 'city') { v.mode = 'gta'; }
    else if (engine === 'block') { v.mode = 'tetris'; }
    else if (engine === 'dance') { v.mode = 'ddr'; }
    else if (engine === 'gun') { v.mode = 'city'; }
    else if (engine === 'brawl') { v.hero = 'brawler'; v.foeKind = 'thug'; v.street = 'city'; }
    else if (engine === 'dig') { v.mode = 'boulder'; v.hero = 'kid'; }
  }
  return v;
}
// en kort beskrivning av varianten (för menyer och tester)
export function describe(v) {
  return [v.engine, v.mode, v.hero, v.foe || v.foeKind, v.bg || v.tile || v.street, v.era].filter(Boolean).join(' · ');
}
