// Färdiga produkter som säljs över disk: konsoler och hemdatorer, spel och arkadmaskiner.
// Årtal och priser följer den svenska/europeiska marknaden (docs/KONSOLER.md).
// hype = [lansering, topp, utfasning]: försäljningen följer kurvan, sedan tappar lagret värde.
// Ingen DOM här – filen körs även i Node.

const K = [];   // konsoler och hemdatorer
const S = [];   // spel
const A = [];   // arkadmaskiner

// id, namn, tillverkare, [lansering, topp, utfasning], inköpspris i kr det året, utseende
const konsol = (id, name, maker, hype, cost, look, opts = {}) => K.push({
  cat: 'konsol', id: 'k-' + id, name, brand: maker, maker, year: hype[0], until: Math.min(2026, hype[2] + 2), hype, cost, tier: opts.tier || 3,
  handheld: !!opts.handheld, computer: !!opts.computer, vr: !!opts.vr, look: { shape: id, ...look }, desc: opts.desc || '',
});

// ---- 80-tal ----
konsol('atari2600', 'Atari 2600', 'atari', [1983, 1983, 1986], 900, { body: '#2a2724', wood: '#8a5a2a', panel: '#1a1816' }, { tier: 2, desc: 'Kassetterna som startade allt. Träpanelen!' });
konsol('c64', 'Commodore 64', 'commodore', [1983, 1986, 1991], 2400, { body: '#c9b891', keys: '#5a4d3a', badge: '#c9323a' }, { computer: true, desc: '"VIC-64" – datorernas folkvagn. Över 200 000 sålda i Sverige.' });
konsol('amiga500', 'Commodore Amiga 500', 'commodore', [1987, 1990, 1993], 3900, { body: '#d8d0b8', keys: '#6a6050', badge: '#c9323a' }, { computer: true, tier: 4, desc: '4096 färger och samplat ljud – tonårsrummens kung.' });
konsol('nes', 'Nintendo NES', 'nintendo', [1986, 1989, 1994], 900, { body: '#b8b4ab', flap: '#4a4744', stripe: '#c9323a' }, { desc: 'Super Mario Bros. Sveriges mest sålda konsol – 420 000 stycken.' });
konsol('sms', 'Sega Master System', 'sega', [1987, 1989, 1992], 1000, { body: '#1c1c20', stripe: '#c9323a', slot: '#2c2c30' }, { tier: 2, desc: 'Bättre färger än NES, men Nintendo vann i Sverige.' });
konsol('gameboy', 'Nintendo Game Boy', 'nintendo', [1990, 1992, 1998], 500, { body: '#9a9c94', screen: '#7a8a5a', btn: '#8a2a6a' }, { handheld: true, tier: 2, desc: 'Tetris i fickan.' });
// ---- 90-tal ----
konsol('megadrive', 'Sega Mega Drive', 'sega', [1990, 1993, 1996], 950, { body: '#1c1c20', ring: '#2c2c30', gold: '#d8b24a' }, { desc: 'Sonic, ishockey och "16-BIT" i guld. 150 000 sålda i Sverige.' });
konsol('gamegear', 'Sega Game Gear', 'sega', [1991, 1993, 1996], 800, { body: '#1c1c20', screen: '#3a5a9a', btn: '#2c2c30' }, { handheld: true, tier: 2, desc: 'Färgskärm i handen – och sex batterier i timmen.' });
konsol('neogeo', 'SNK Neo Geo AES', 'snk', [1991, 1993, 1996], 2000, { body: '#1c1c20', gold: '#d8b24a', stripe: '#c9323a' }, { tier: 5, desc: 'Arkadmaskinen hemma. Ett spel kostade som en halv Mega Drive.' });
konsol('snes', 'Super Nintendo', 'nintendo', [1992, 1994, 1997], 1100, { body: '#b8bcc4', top: '#8a8f9c', btn: '#7a5bc9', btn2: '#c9323a' }, { desc: 'Mode 7, Super Mario World och Street Fighter II hemma.' });
konsol('playstation', 'Sony PlayStation', 'sony', [1995, 1998, 2001], 2300, { body: '#b9b6ae', lid: '#a7a49c', btn: '#2c2c30' }, { tier: 4, desc: 'CD-skivor, 3D och Tekken. Spelen blev vuxna.' });
konsol('saturn', 'Sega Saturn', 'sega', [1995, 1996, 1998], 3200, { body: '#1c1c20', lid: '#2c2c30', btn: '#3a78d8' }, { tier: 4, desc: 'Sega Rally och Virtua Fighter – men PlayStation vann.' });
konsol('n64', 'Nintendo 64', 'nintendo', [1997, 1998, 2001], 1700, { body: '#2c2c34', top: '#3a3a44', btn: '#c9323a' }, { tier: 4, desc: 'Fyra handkontroller och Mario 64. GoldenEye-kvällar.' });
konsol('gbc', 'Game Boy Color', 'nintendo', [1998, 2000, 2002], 550, { body: '#7a3fb8', screen: '#5a8a5a', btn: '#2c2c30' }, { handheld: true, tier: 2, desc: 'Pokémon-vågen.' });
konsol('dreamcast', 'Sega Dreamcast', 'sega', [1999, 2000, 2001], 1700, { body: '#e8e6e0', swirl: '#3a78d8', lid: '#d8d6d0' }, { tier: 4, desc: 'Före sin tid: modem inbyggt. Segas sista.' });
// ---- 2000-tal ----
konsol('ps2', 'Sony PlayStation 2', 'sony', [2000, 2003, 2008], 3000, { body: '#1c1c22', stripe: '#3a3a44', btn: '#3a78d8' }, { tier: 4, desc: 'Världens mest sålda konsol. DVD-spelare på köpet.' });
konsol('gba', 'Game Boy Advance', 'nintendo', [2001, 2002, 2005], 700, { body: '#6a5bd0', screen: '#4a7a9a', btn: '#2c2c30' }, { handheld: true, tier: 2, desc: 'SNES i fickan.' });
konsol('gamecube', 'Nintendo GameCube', 'nintendo', [2002, 2003, 2006], 1600, { body: '#5a3fa8', top: '#6a4fb8', handle: '#4a2f98' }, { desc: 'Lilla lila kuben med handtag.' });
konsol('xbox', 'Microsoft Xbox', 'microsoft', [2002, 2003, 2005], 2800, { body: '#1c1c20', x: '#3fb04a', jewel: '#2a2a30' }, { tier: 4, desc: 'Halo. En PC i konsolkläder.' });
konsol('ds', 'Nintendo DS', 'nintendo', [2005, 2007, 2010], 1000, { body: '#d8d6d0', screen: '#5a8aaa', btn: '#2c2c30' }, { handheld: true, desc: 'Två skärmar och penna.' });
konsol('psp', 'Sony PSP', 'sony', [2005, 2006, 2009], 1700, { body: '#1c1c22', screen: '#3a5a9a', btn: '#2c2c30' }, { handheld: true, tier: 4, desc: 'Widescreen i fickan.' });
konsol('xbox360', 'Xbox 360', 'microsoft', [2005, 2008, 2012], 2600, { body: '#e8e6e0', ring: '#3fb04a', side: '#c8c6c0' }, { tier: 4, desc: 'Xbox Live och Gears of War.' });
konsol('wii', 'Nintendo Wii', 'nintendo', [2006, 2008, 2011], 1800, { body: '#f4f2ec', light: '#3a9ad8', stand: '#c8c6c0' }, { desc: 'Hela familjen viftar med armarna.' });
konsol('ps3', 'Sony PlayStation 3', 'sony', [2007, 2009, 2013], 4000, { body: '#1c1c22', gloss: '#3a3a44', btn: '#3a78d8' }, { tier: 5, desc: 'Blu-ray och Uncharted.' });
// ---- 2010-tal ----
konsol('3ds', 'Nintendo 3DS', 'nintendo', [2011, 2013, 2017], 1500, { body: '#1c4a9a', screen: '#5a8aaa', btn: '#2c2c30' }, { handheld: true, desc: '3D utan glasögon.' });
konsol('wiiu', 'Nintendo Wii U', 'nintendo', [2012, 2013, 2016], 2200, { body: '#1c1c22', pad: '#2c2c30', light: '#3a9ad8' }, { tier: 3, desc: 'Skärmen i handkontrollen.' });
konsol('ps4', 'Sony PlayStation 4', 'sony', [2013, 2016, 2020], 2900, { body: '#1c1c22', light: '#3a78d8', slant: '#2c2c34' }, { tier: 4, desc: 'Snett och svart. 100 miljoner sålda.' });
konsol('xboxone', 'Xbox One', 'microsoft', [2013, 2016, 2020], 3400, { body: '#1c1c20', vent: '#2c2c30', light: '#e8e6e0' }, { tier: 4, desc: 'Stor, svart, TV-hubb.' });
konsol('switch', 'Nintendo Switch', 'nintendo', [2017, 2019, 2024], 2500, { body: '#1c1c22', red: '#e23b5a', blue: '#3a78d8', dock: '#2c2c30' }, { tier: 4, desc: 'TV och handhållen i ett. Zelda.' });
// ---- 2020-tal ----
konsol('quest2', 'Meta Quest 2', 'meta', [2020, 2022, 2024], 2600, { body: '#f4f2ec', lens: '#1c1c22', strap: '#d8d6d0' }, { vr: true, tier: 4, desc: 'VR utan sladd.' });
konsol('ps5', 'Sony PlayStation 5', 'sony', [2020, 2022, 2026], 4400, { body: '#f4f2ec', core: '#1c1c22', light: '#3a78d8' }, { tier: 5, desc: 'Vita vingar. Kön ringlade lång – och bottarna köpte allt.' });
konsol('seriesx', 'Xbox Series X', 'microsoft', [2020, 2022, 2026], 4200, { body: '#1c1c20', top: '#3fb04a', vent: '#2c2c30' }, { tier: 5, desc: 'Ett svart torn.' });
konsol('steamdeck', 'Valve Steam Deck', 'valve', [2022, 2023, 2026], 4000, { body: '#1c1c22', screen: '#2a4a8a', btn: '#2c2c30' }, { handheld: true, tier: 4, desc: 'Hela Steam-biblioteket i handen.' });
konsol('switch2', 'Nintendo Switch 2', 'nintendo', [2025, 2026, 2026], 5000, { body: '#1c1c22', red: '#e23b5a', blue: '#3a78d8', dock: '#2c2c30' }, { tier: 5, desc: 'Större skärm, magnetfästen. 6 795 kr.' });

// ---------- Spel ----------
// id, titel, plattform (konsol-id eller 'pc'), [lansering, topp, utfasning], inköp, omslag { bg, fg, motif }, motor
const spel = (id, name, platform, hype, cost, cover, engine, opts = {}) => S.push({
  cat: 'spel', id: 's-' + id, name, brand: opts.maker || '', platform, year: hype[0], until: Math.min(2026, hype[2] + 1), hype, cost, tier: opts.tier || 2,
  engine, look: { cover }, desc: opts.desc || '',
});
// 80-tal hemdatorer och NES
spel('pitfall', 'Pitfall!', 'atari2600', [1983, 1983, 1985], 200, { bg: '#2f6f3a', fg: '#e8c26a', motif: 'jungle' }, 'plattform', { maker: 'Activision' });
spel('boulder', 'Boulder Dash', 'c64', [1984, 1985, 1988], 180, { bg: '#2a2a40', fg: '#e8c26a', motif: 'gem' }, 'labyrint2d', { maker: 'First Star' });
spel('lastninja', 'The Last Ninja', 'c64', [1987, 1988, 1990], 220, { bg: '#1a1a24', fg: '#e23b5a', motif: 'ninja' }, 'plattform', { maker: 'System 3' });
spel('smb', 'Super Mario Bros.', 'nes', [1986, 1988, 1993], 350, { bg: '#3a78d8', fg: '#e23b5a', motif: 'plumber' }, 'plattform', { maker: 'Nintendo', tier: 3 });
spel('zelda', 'The Legend of Zelda', 'nes', [1987, 1989, 1993], 380, { bg: '#c8a24a', fg: '#2f8f46', motif: 'sword' }, 'labyrint2d', { maker: 'Nintendo', tier: 3 });
spel('smb3', 'Super Mario Bros. 3', 'nes', [1991, 1991, 1994], 420, { bg: '#e8c26a', fg: '#e23b5a', motif: 'plumber' }, 'plattform', { maker: 'Nintendo', tier: 3 });
spel('tetris', 'Tetris', 'gameboy', [1990, 1992, 1997], 250, { bg: '#1a1a24', fg: '#e8c26a', motif: 'blocks' }, 'block', { maker: 'Nintendo' });
spel('sonic', 'Sonic the Hedgehog', 'megadrive', [1991, 1992, 1995], 380, { bg: '#3a78d8', fg: '#f0b429', motif: 'hedgehog' }, 'plattform', { maker: 'Sega', tier: 3 });
spel('sonic2', 'Sonic the Hedgehog 2', 'megadrive', [1992, 1993, 1996], 420, { bg: '#3a78d8', fg: '#e8c26a', motif: 'hedgehog' }, 'plattform', { maker: 'Sega', tier: 3 });
spel('nhl94', 'NHL 94', 'megadrive', [1993, 1994, 1996], 400, { bg: '#f4f2ec', fg: '#c9323a', motif: 'hockey' }, 'sport', { maker: 'EA', desc: 'Svenskarnas Mega Drive-spel.' });
spel('smw', 'Super Mario World', 'snes', [1992, 1993, 1996], 450, { bg: '#f0b429', fg: '#e23b5a', motif: 'plumber' }, 'plattform', { maker: 'Nintendo', tier: 3 });
spel('sf2snes', 'Street Fighter II', 'snes', [1992, 1993, 1996], 520, { bg: '#c9323a', fg: '#f0b429', motif: 'fighter' }, 'fight', { maker: 'Capcom', tier: 3 });
spel('mk', 'Mortal Kombat', 'megadrive', [1993, 1994, 1996], 480, { bg: '#1a1a24', fg: '#e8c26a', motif: 'dragon' }, 'fight', { maker: 'Acclaim', tier: 3 });
spel('dkc', 'Donkey Kong Country', 'snes', [1994, 1995, 1997], 500, { bg: '#2f6f3a', fg: '#c98a4a', motif: 'ape' }, 'plattform', { maker: 'Nintendo', tier: 3 });
// PC-spel (stora kartonger!)
spel('kq', "King's Quest", 'pc', [1984, 1986, 1990], 350, { bg: '#7a5bc9', fg: '#f0b429', motif: 'castle' }, 'aventyr', { maker: 'Sierra' });
spel('pop', 'Prince of Persia', 'pc', [1990, 1991, 1994], 380, { bg: '#1a1a24', fg: '#e8c26a', motif: 'prince' }, 'plattform', { maker: 'Brøderbund' });
spel('wolf3d', 'Wolfenstein 3D', 'pc', [1992, 1993, 1995], 300, { bg: '#2c2c34', fg: '#3a78d8', motif: 'soldier' }, 'raycast', { maker: 'id Software', tier: 3 });
spel('doom', 'DOOM', 'pc', [1993, 1995, 1998], 420, { bg: '#7a1a10', fg: '#f0b429', motif: 'marine' }, 'raycast', { maker: 'id Software', tier: 3, desc: 'Sålde grafikkort och minne som inget annat.' });
spel('myst', 'Myst', 'pc', [1993, 1995, 1998], 450, { bg: '#2a4a5a', fg: '#e8e6e0', motif: 'island' }, 'aventyr', { maker: 'Brøderbund' });
spel('quake', 'Quake', 'pc', [1996, 1997, 1999], 480, { bg: '#4a3a2a', fg: '#c98a4a', motif: 'quake' }, 'raycast', { maker: 'id Software', tier: 3 });
spel('hl', 'Half-Life', 'pc', [1998, 1999, 2002], 500, { bg: '#f0b429', fg: '#1a1a24', motif: 'lambda' }, 'raycast', { maker: 'Valve', tier: 3 });
spel('cs', 'Counter-Strike', 'pc', [2000, 2003, 2008], 350, { bg: '#2c2c34', fg: '#e8e6e0', motif: 'soldier' }, 'raycast', { maker: 'Valve', tier: 3 });
spel('wow', 'World of Warcraft', 'pc', [2005, 2007, 2012], 500, { bg: '#1a2a4a', fg: '#e8c26a', motif: 'sword' }, 'rpg', { maker: 'Blizzard', tier: 3 });
spel('crysis', 'Crysis', 'pc', [2007, 2008, 2011], 520, { bg: '#2f6f3a', fg: '#e8e6e0', motif: 'soldier' }, 'raycast', { maker: 'Crytek', tier: 3, desc: '"Kan din dator köra den?"' });
spel('minecraft', 'Minecraft', 'pc', [2011, 2014, 2026], 250, { bg: '#5a8a3a', fg: '#7a5a3a', motif: 'blocks' }, 'block', { maker: 'Mojang', tier: 2 });
// Fler titlar så att varje konsol har något i hyllan varje år den är het (tools/konsolspel.mjs vaktar det)
spel('jumpman', 'Jumpman', 'c64', [1983, 1984, 1986], 160, { bg: '#1a1a44', fg: '#f0e030', motif: 'prince' }, 'plattform', { maker: 'Epyx' });
spel('intsoccer', 'International Soccer', 'c64', [1983, 1985, 1988], 180, { bg: '#2f6f3a', fg: '#f4f2ec', motif: 'ball' }, 'sport', { maker: 'Commodore' });
spel('loderunner', 'Lode Runner', 'c64', [1983, 1984, 1987], 180, { bg: '#1a1a24', fg: '#e8c26a', motif: 'gem' }, 'plattform', { maker: 'Brøderbund' });
spel('impmission', 'Impossible Mission', 'c64', [1984, 1985, 1988], 200, { bg: '#2c2c34', fg: '#3fd0e0', motif: 'soldier' }, 'plattform', { maker: 'Epyx', desc: '"Another visitor. Stay a while… stay forever!"' });
spel('summergames', 'Summer Games', 'c64', [1984, 1985, 1988], 200, { bg: '#3a78d8', fg: '#f0e030', motif: 'ball' }, 'sport', { maker: 'Epyx' });
spel('ghostbusters', 'Ghostbusters', 'c64', [1984, 1985, 1987], 200, { bg: '#f4f2ec', fg: '#e23b5a', motif: 'skull' }, 'racer', { maker: 'Activision' });
spel('giana', 'The Great Giana Sisters', 'c64', [1987, 1988, 1990], 220, { bg: '#3a78d8', fg: '#f0b429', motif: 'plumber' }, 'plattform', { maker: 'Rainbow Arts', desc: 'Så likt Mario att Nintendo fick det stoppat.' });
spel('bubble', 'Bubble Bobble', 'c64', [1987, 1988, 1991], 220, { bg: '#3fd0e0', fg: '#3fb04a', motif: 'dragon' }, 'plattform', { maker: 'Firebird' });
spel('turrican', 'Turrican', 'c64', [1990, 1990, 1992], 240, { bg: '#1a1a24', fg: '#e07a2e', motif: 'marine' }, 'plattform', { maker: 'Rainbow Arts' });
spel('riverraid', 'River Raid', 'atari2600', [1983, 1983, 1985], 200, { bg: '#2f6f3a', fg: '#3a78d8', motif: 'jungle' }, 'rymd', { maker: 'Activision' });
spel('pacman2600', 'Pac-Man', 'atari2600', [1983, 1983, 1985], 200, { bg: '#f0e030', fg: '#1a1a24', motif: 'ball' }, 'labyrint2d', { maker: 'Atari' });
spel('doc', 'Defender of the Crown', 'amiga500', [1987, 1988, 1990], 320, { bg: '#7a1a10', fg: '#e8c26a', motif: 'castle' }, 'aventyr', { maker: 'Cinemaware' });
spel('beast', 'Shadow of the Beast', 'amiga500', [1989, 1990, 1992], 340, { bg: '#4a1a5a', fg: '#e07a2e', motif: 'dragon' }, 'plattform', { maker: 'Psygnosis' });
spel('lemmings', 'Lemmings', 'amiga500', [1991, 1992, 1994], 320, { bg: '#3fb04a', fg: '#e8c26a', motif: 'dog' }, 'labyrint2d', { maker: 'Psygnosis', tier: 3 });
spel('sensi', 'Sensible Soccer', 'amiga500', [1992, 1993, 1995], 300, { bg: '#2f6f3a', fg: '#f4f2ec', motif: 'ball' }, 'sport', { maker: 'Sensible Software' });
spel('pinball', 'Pinball Dreams', 'amiga500', [1992, 1993, 1995], 300, { bg: '#1a1a44', fg: '#e23b5a', motif: 'ball' }, 'block', { maker: 'DICE', desc: 'Svenskt – gjort av Digital Illusions.' });
spel('alexkidd', 'Alex Kidd in Miracle World', 'sms', [1987, 1988, 1991], 320, { bg: '#e23b5a', fg: '#f0b429', motif: 'prince' }, 'plattform', { maker: 'Sega' });
spel('wonderboy', 'Wonder Boy', 'sms', [1987, 1988, 1991], 320, { bg: '#3fd0e0', fg: '#e07a2e', motif: 'jungle' }, 'plattform', { maker: 'Sega' });
spel('sonicms', 'Sonic the Hedgehog', 'sms', [1991, 1992, 1993], 340, { bg: '#3a78d8', fg: '#f0b429', motif: 'hedgehog' }, 'plattform', { maker: 'Sega' });
spel('duckhunt', 'Duck Hunt', 'nes', [1987, 1988, 1992], 320, { bg: '#7ab0e0', fg: '#5a3d2b', motif: 'gun' }, 'gun', { maker: 'Nintendo' });
spel('megaman2', 'Mega Man 2', 'nes', [1990, 1991, 1993], 380, { bg: '#3a78d8', fg: '#7ab0e0', motif: 'marine' }, 'plattform', { maker: 'Capcom' });
spel('tmnt', 'Turtles', 'nes', [1990, 1991, 1993], 380, { bg: '#3fb04a', fg: '#e23b5a', motif: 'ninja' }, 'fight', { maker: 'Konami' });
spel('smland', 'Super Mario Land', 'gameboy', [1990, 1991, 1995], 250, { bg: '#f0e030', fg: '#e23b5a', motif: 'plumber' }, 'plattform', { maker: 'Nintendo' });
spel('alteredbeast', 'Altered Beast', 'megadrive', [1990, 1990, 1992], 380, { bg: '#4a1a5a', fg: '#e8c26a', motif: 'fighter' }, 'fight', { maker: 'Sega', desc: 'Följde med konsolen. "Rise from your grave!"' });
spel('goldenaxemd', 'Golden Axe', 'megadrive', [1990, 1991, 1993], 380, { bg: '#c98a4a', fg: '#7a1a10', motif: 'bigsword' }, 'fight', { maker: 'Sega' });
spel('sor2', 'Streets of Rage 2', 'megadrive', [1992, 1993, 1995], 420, { bg: '#1a1a24', fg: '#e23b5a', motif: 'fighter' }, 'fight', { maker: 'Sega', tier: 3 });
spel('fifa', 'FIFA International Soccer', 'megadrive', [1993, 1994, 1996], 420, { bg: '#2f6f3a', fg: '#f4f2ec', motif: 'ball' }, 'sport', { maker: 'EA', tier: 3 });
spel('columns', 'Columns', 'gamegear', [1991, 1992, 1994], 250, { bg: '#1a1a24', fg: '#3fd0e0', motif: 'gem' }, 'block', { maker: 'Sega' });
spel('sonicgg', 'Sonic the Hedgehog 2', 'gamegear', [1992, 1993, 1995], 300, { bg: '#3a78d8', fg: '#f0b429', motif: 'hedgehog' }, 'plattform', { maker: 'Sega' });
spel('fatalfury', 'Fatal Fury', 'neogeo', [1991, 1992, 1994], 1200, { bg: '#c9323a', fg: '#f0e030', motif: 'fighter' }, 'fight', { maker: 'SNK', tier: 5 });
spel('metalslug', 'Metal Slug', 'neogeo', [1996, 1996, 1998], 1400, { bg: '#5a3d2b', fg: '#e8c26a', motif: 'soldier' }, 'plattform', { maker: 'SNK', tier: 5 });
spel('lttp', 'Zelda: A Link to the Past', 'snes', [1992, 1993, 1996], 520, { bg: '#c8a24a', fg: '#2f8f46', motif: 'sword' }, 'aventyr', { maker: 'Nintendo', tier: 3 });
spel('smk', 'Super Mario Kart', 'snes', [1993, 1994, 1996], 500, { bg: '#3a78d8', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('crash', 'Crash Bandicoot', 'playstation', [1996, 1997, 1999], 520, { bg: '#e07a2e', fg: '#3fb04a', motif: 'ape' }, 'plattform', { maker: 'Sony', tier: 3 });
spel('tombraider', 'Tomb Raider', 'playstation', [1996, 1997, 1999], 520, { bg: '#5a3d2b', fg: '#3fd0e0', motif: 'jungle' }, 'aventyr', { maker: 'Eidos', tier: 3 });
spel('tekken3', 'Tekken 3', 'playstation', [1998, 1999, 2001], 560, { bg: '#1a1a24', fg: '#f0e030', motif: 'fighter' }, 'fight', { maker: 'Namco', tier: 3 });
spel('mgs', 'Metal Gear Solid', 'playstation', [1999, 1999, 2001], 560, { bg: '#2a2a34', fg: '#f4f2ec', motif: 'soldier' }, 'aventyr', { maker: 'Konami', tier: 3 });
spel('segarallysat', 'Sega Rally Championship', 'saturn', [1995, 1996, 1998], 560, { bg: '#3a9ad8', fg: '#f4f2ec', motif: 'car' }, 'racer', { maker: 'Sega', tier: 3 });
spel('vf2', 'Virtua Fighter 2', 'saturn', [1995, 1996, 1998], 560, { bg: '#1a2a4a', fg: '#e23b5a', motif: 'fighter' }, 'fight', { maker: 'Sega', tier: 3 });
spel('nights', 'NiGHTS into Dreams', 'saturn', [1996, 1997, 1998], 560, { bg: '#4a1a5a', fg: '#f0e030', motif: 'dragon' }, 'plattform', { maker: 'Sega', tier: 3 });
spel('oot', 'Zelda: Ocarina of Time', 'n64', [1998, 1999, 2001], 620, { bg: '#c8a24a', fg: '#2f8f46', motif: 'sword' }, 'aventyr', { maker: 'Nintendo', tier: 3 });
spel('tetrisdx', 'Tetris DX', 'gbc', [1998, 1999, 2001], 250, { bg: '#1a1a24', fg: '#3fd0e0', motif: 'blocks' }, 'block', { maker: 'Nintendo' });
spel('ladx', "Zelda: Link's Awakening DX", 'gbc', [1998, 1999, 2002], 320, { bg: '#c8a24a', fg: '#2f8f46', motif: 'sword' }, 'labyrint2d', { maker: 'Nintendo' });
spel('sonicadv', 'Sonic Adventure', 'dreamcast', [1999, 2000, 2001], 560, { bg: '#3a78d8', fg: '#f0b429', motif: 'hedgehog' }, 'plattform', { maker: 'Sega', tier: 3 });
spel('crazytaxi', 'Crazy Taxi', 'dreamcast', [2000, 2000, 2001], 520, { bg: '#f0e030', fg: '#1a1a24', motif: 'car' }, 'racer', { maker: 'Sega', tier: 3 });
spel('shenmue', 'Shenmue', 'dreamcast', [2000, 2000, 2001], 580, { bg: '#5a5a66', fg: '#e8c26a', motif: 'city' }, 'aventyr', { maker: 'Sega', tier: 3 });
spel('tekkentag', 'Tekken Tag Tournament', 'ps2', [2000, 2001, 2003], 520, { bg: '#1a1a24', fg: '#e23b5a', motif: 'fighter' }, 'fight', { maker: 'Namco', tier: 3 });
spel('gt3', 'Gran Turismo 3', 'ps2', [2001, 2002, 2004], 560, { bg: '#1a1a24', fg: '#f4f2ec', motif: 'car' }, 'racer', { maker: 'Sony', tier: 3 });
spel('gtasa', 'GTA San Andreas', 'ps2', [2004, 2005, 2007], 560, { bg: '#1a1a24', fg: '#f0b429', motif: 'city' }, 'city', { maker: 'Rockstar', tier: 3 });
spel('gow', 'God of War', 'ps2', [2005, 2006, 2008], 560, { bg: '#7a1a10', fg: '#e8c26a', motif: 'bigsword' }, 'fight', { maker: 'Sony', tier: 3 });
spel('mksc', 'Mario Kart Super Circuit', 'gba', [2001, 2002, 2004], 420, { bg: '#f0b429', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo' });
spel('pokemonrs', 'Pokémon Rubin/Safir', 'gba', [2003, 2004, 2005], 420, { bg: '#c9323a', fg: '#3a78d8', motif: 'ball' }, 'rpg', { maker: 'Nintendo', tier: 3 });
spel('mkdd', 'Mario Kart: Double Dash', 'gamecube', [2003, 2004, 2006], 560, { bg: '#3a78d8', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('windwaker', 'Zelda: The Wind Waker', 'gamecube', [2003, 2003, 2006], 560, { bg: '#3fd0e0', fg: '#2f8f46', motif: 'sword' }, 'aventyr', { maker: 'Nintendo', tier: 3 });
spel('halo2', 'Halo 2', 'xbox', [2004, 2005, 2005], 560, { bg: '#2a4a8a', fg: '#3fb04a', motif: 'soldier' }, 'raycast', { maker: 'Microsoft', tier: 3 });
spel('forza', 'Forza Motorsport', 'xbox', [2005, 2005, 2005], 520, { bg: '#1a1a24', fg: '#3fb04a', motif: 'car' }, 'racer', { maker: 'Microsoft', tier: 3 });
spel('mkds', 'Mario Kart DS', 'ds', [2005, 2006, 2009], 420, { bg: '#e23b5a', fg: '#f0b429', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('braintrain', 'Dr Kawashimas hjärngympa', 'ds', [2006, 2007, 2009], 380, { bg: '#f4f2ec', fg: '#3a78d8', motif: 'blocks' }, 'block', { maker: 'Nintendo' });
spel('nsmb', 'New Super Mario Bros.', 'ds', [2006, 2007, 2010], 420, { bg: '#3a78d8', fg: '#e23b5a', motif: 'plumber' }, 'plattform', { maker: 'Nintendo', tier: 3 });
spel('lumines', 'Lumines', 'psp', [2005, 2005, 2007], 450, { bg: '#1a1a24', fg: '#e83fb8', motif: 'blocks' }, 'block', { maker: 'Sony' });
spel('gtalcs', 'GTA Liberty City Stories', 'psp', [2005, 2006, 2008], 520, { bg: '#1a1a24', fg: '#f0b429', motif: 'city' }, 'city', { maker: 'Rockstar', tier: 3 });
spel('pgr3', 'Project Gotham Racing 3', 'xbox360', [2005, 2006, 2008], 560, { bg: '#1a1a24', fg: '#3fd0e0', motif: 'car' }, 'racer', { maker: 'Microsoft', tier: 3 });
spel('halo3', 'Halo 3', 'xbox360', [2007, 2008, 2010], 560, { bg: '#2a4a8a', fg: '#3fb04a', motif: 'soldier' }, 'raycast', { maker: 'Microsoft', tier: 3 });
spel('forza3', 'Forza Motorsport 3', 'xbox360', [2009, 2010, 2012], 560, { bg: '#1a1a24', fg: '#3fb04a', motif: 'car' }, 'racer', { maker: 'Microsoft', tier: 3 });
spel('mkwii', 'Mario Kart Wii', 'wii', [2008, 2009, 2011], 520, { bg: '#f4f2ec', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('wiifit', 'Wii Fit', 'wii', [2008, 2009, 2011], 800, { bg: '#f4f2ec', fg: '#3fb04a', motif: 'ball' }, 'sport', { maker: 'Nintendo', tier: 3, desc: 'Med balansbräda.' });
spel('motorstorm', 'MotorStorm', 'ps3', [2007, 2007, 2009], 560, { bg: '#c98a4a', fg: '#1a1a24', motif: 'car' }, 'racer', { maker: 'Sony', tier: 3 });
spel('lbp', 'LittleBigPlanet', 'ps3', [2008, 2009, 2011], 520, { bg: '#5a3d2b', fg: '#f0e030', motif: 'dog' }, 'plattform', { maker: 'Sony', tier: 3 });
spel('gow3', 'God of War III', 'ps3', [2010, 2010, 2013], 560, { bg: '#7a1a10', fg: '#e8c26a', motif: 'bigsword' }, 'fight', { maker: 'Sony', tier: 3 });
spel('gt5', 'Gran Turismo 5', 'ps3', [2010, 2011, 2013], 560, { bg: '#1a1a24', fg: '#f4f2ec', motif: 'car' }, 'racer', { maker: 'Sony', tier: 3 });
spel('mk7', 'Mario Kart 7', '3ds', [2011, 2012, 2016], 450, { bg: '#3a78d8', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('pokemonxy', 'Pokémon X/Y', '3ds', [2013, 2014, 2017], 450, { bg: '#3a78d8', fg: '#e23b5a', motif: 'ball' }, 'rpg', { maker: 'Nintendo', tier: 3 });
spel('nsmbu', 'New Super Mario Bros. U', 'wiiu', [2012, 2013, 2015], 560, { bg: '#3a78d8', fg: '#e23b5a', motif: 'plumber' }, 'plattform', { maker: 'Nintendo', tier: 3 });
spel('mk8', 'Mario Kart 8', 'wiiu', [2014, 2014, 2016], 560, { bg: '#3a78d8', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('splatoon', 'Splatoon', 'wiiu', [2015, 2015, 2016], 520, { bg: '#e83fb8', fg: '#3fb04a', motif: 'gun' }, 'gun', { maker: 'Nintendo', tier: 3 });
spel('killzone', 'Killzone Shadow Fall', 'ps4', [2013, 2014, 2015], 560, { bg: '#2a2a34', fg: '#e07a2e', motif: 'soldier' }, 'raycast', { maker: 'Sony', tier: 3 });
spel('uncharted4', 'Uncharted 4', 'ps4', [2016, 2016, 2019], 600, { bg: '#c98a4a', fg: '#e8e6e0', motif: 'jungle' }, 'aventyr', { maker: 'Sony', tier: 3 });
spel('spiderman', "Marvel's Spider-Man", 'ps4', [2018, 2018, 2020], 620, { bg: '#e23b5a', fg: '#3a78d8', motif: 'city' }, 'city', { maker: 'Sony', tier: 3 });
spel('gow2018', 'God of War', 'ps4', [2018, 2018, 2020], 620, { bg: '#2a2a34', fg: '#e8c26a', motif: 'bigsword' }, 'fight', { maker: 'Sony', tier: 3 });
spel('forza5', 'Forza Motorsport 5', 'xboxone', [2013, 2014, 2016], 560, { bg: '#1a1a24', fg: '#3fb04a', motif: 'car' }, 'racer', { maker: 'Microsoft', tier: 3 });
spel('halo5', 'Halo 5', 'xboxone', [2015, 2016, 2018], 600, { bg: '#2a4a8a', fg: '#3fb04a', motif: 'soldier' }, 'raycast', { maker: 'Microsoft', tier: 3 });
spel('fh3', 'Forza Horizon 3', 'xboxone', [2016, 2017, 2019], 600, { bg: '#3fd0e0', fg: '#f0e030', motif: 'car' }, 'racer', { maker: 'Microsoft', tier: 3 });
spel('fh4', 'Forza Horizon 4', 'xboxone', [2018, 2019, 2020], 620, { bg: '#5a8aaa', fg: '#f0e030', motif: 'car' }, 'racer', { maker: 'Microsoft', tier: 3 });
spel('odyssey', 'Super Mario Odyssey', 'switch', [2017, 2018, 2022], 600, { bg: '#e23b5a', fg: '#f4f2ec', motif: 'plumber' }, 'plattform', { maker: 'Nintendo', tier: 3 });
spel('smashult', 'Super Smash Bros. Ultimate', 'switch', [2018, 2019, 2023], 620, { bg: '#1a1a24', fg: '#f0b429', motif: 'fighter' }, 'fight', { maker: 'Nintendo', tier: 3 });
spel('acnh', 'Animal Crossing: New Horizons', 'switch', [2020, 2020, 2024], 600, { bg: '#7de83a', fg: '#3fd0e0', motif: 'island' }, 'sim', { maker: 'Nintendo', tier: 3, desc: 'Pandemins spel.' });
spel('beatsaber', 'Beat Saber', 'quest2', [2020, 2021, 2024], 320, { bg: '#1a1a24', fg: '#e23b5a', motif: 'bigsword' }, 'dance', { maker: 'Beat Games', tier: 2 });
spel('milesmorales', 'Spider-Man: Miles Morales', 'ps5', [2020, 2021, 2023], 700, { bg: '#1a1a24', fg: '#e23b5a', motif: 'city' }, 'city', { maker: 'Sony', tier: 3 });
spel('gt7', 'Gran Turismo 7', 'ps5', [2022, 2022, 2025], 720, { bg: '#1a1a24', fg: '#f4f2ec', motif: 'car' }, 'racer', { maker: 'Sony', tier: 3 });
spel('astrobot', 'Astro Bot', 'ps5', [2024, 2024, 2026], 700, { bg: '#3a78d8', fg: '#f4f2ec', motif: 'ball' }, 'plattform', { maker: 'Sony', tier: 3 });
spel('acvalhalla', "Assassin's Creed Valhalla", 'seriesx', [2020, 2021, 2023], 700, { bg: '#2a4a5a', fg: '#e8c26a', motif: 'sword' }, 'rpg', { maker: 'Ubisoft', tier: 3 });
spel('fh5', 'Forza Horizon 5', 'seriesx', [2021, 2022, 2025], 700, { bg: '#e07a2e', fg: '#f0e030', motif: 'car' }, 'racer', { maker: 'Microsoft', tier: 3 });
spel('haloinf', 'Halo Infinite', 'seriesx', [2021, 2022, 2024], 700, { bg: '#2a4a8a', fg: '#3fb04a', motif: 'soldier' }, 'raycast', { maker: 'Microsoft', tier: 3 });
spel('hades', 'Hades', 'steamdeck', [2022, 2022, 2024], 250, { bg: '#7a1a10', fg: '#e8c26a', motif: 'bigsword' }, 'rpg', { maker: 'Supergiant', tier: 2 });
spel('vampsurv', 'Vampire Survivors', 'steamdeck', [2022, 2023, 2026], 60, { bg: '#1a1a24', fg: '#e23b5a', motif: 'skull' }, 'rymd', { maker: 'poncle', tier: 1 });
spel('bananza', 'Donkey Kong Bananza', 'switch2', [2025, 2026, 2026], 700, { bg: '#f0b429', fg: '#c98a4a', motif: 'ape' }, 'plattform', { maker: 'Nintendo', tier: 3 });
// fler PC-spel genom åren (systemkrav i js/games/specs.js)
spel('simcity2000', 'SimCity 2000', 'pc', [1994, 1995, 1998], 450, { bg: '#3a78d8', fg: '#8a8f9c', motif: 'city' }, 'sim', { maker: 'Maxis' });
spel('warcraft2', 'Warcraft II', 'pc', [1995, 1996, 1998], 450, { bg: '#2f6f3a', fg: '#e8c26a', motif: 'sword' }, 'rpg', { maker: 'Blizzard', tier: 3 });
spel('aoe', 'Age of Empires', 'pc', [1997, 1998, 2000], 480, { bg: '#c8a24a', fg: '#7a1a10', motif: 'castle' }, 'rpg', { maker: 'Microsoft', tier: 3 });
spel('starcraft', 'StarCraft', 'pc', [1998, 1999, 2002], 480, { bg: '#1a1a44', fg: '#3fd0e0', motif: 'marine' }, 'rymd', { maker: 'Blizzard', tier: 3 });
spel('thesims', 'The Sims', 'pc', [2000, 2001, 2004], 480, { bg: '#3fb04a', fg: '#f4f2ec', motif: 'dog' }, 'sim', { maker: 'Maxis', tier: 2 });
spel('bf1942', 'Battlefield 1942', 'pc', [2002, 2003, 2005], 500, { bg: '#5a5a3a', fg: '#e8c26a', motif: 'soldier' }, 'raycast', { maker: 'DICE', tier: 3, desc: 'Svenskt – DICE i Stockholm.' });
spel('hl2', 'Half-Life 2', 'pc', [2004, 2005, 2008], 500, { bg: '#e07a2e', fg: '#1a1a24', motif: 'lambda' }, 'raycast', { maker: 'Valve', tier: 3 });
spel('portal', 'Portal', 'pc', [2007, 2008, 2011], 250, { bg: '#f4f2ec', fg: '#3a78d8', motif: 'gun' }, 'raycast', { maker: 'Valve', tier: 2 });
spel('skyrim', 'The Elder Scrolls V: Skyrim', 'pc', [2011, 2012, 2016], 500, { bg: '#2a2a34', fg: '#e8e6e0', motif: 'dragon' }, 'rpg', { maker: 'Bethesda', tier: 3 });
spel('csgo', 'Counter-Strike: Global Offensive', 'pc', [2012, 2015, 2023], 150, { bg: '#2c2c34', fg: '#f0b429', motif: 'soldier' }, 'raycast', { maker: 'Valve', tier: 3 });
spel('overwatch', 'Overwatch', 'pc', [2016, 2017, 2021], 400, { bg: '#f0b429', fg: '#3a78d8', motif: 'gun' }, 'raycast', { maker: 'Blizzard', tier: 3 });
spel('valheim', 'Valheim', 'pc', [2021, 2021, 2024], 200, { bg: '#2a4a5a', fg: '#e8c26a', motif: 'sword' }, 'rpg', { maker: 'Iron Gate', tier: 2, desc: 'Svenskt – fem personer i Skövde.' });
spel('bg3', "Baldur's Gate 3", 'pc', [2023, 2023, 2026], 600, { bg: '#7a1a10', fg: '#e8c26a', motif: 'bigsword' }, 'rpg', { maker: 'Larian', tier: 3 });
// PlayStation-eran
spel('tekken', 'Tekken', 'playstation', [1995, 1996, 1998], 520, { bg: '#1a1a24', fg: '#e23b5a', motif: 'fighter' }, 'fight', { maker: 'Namco', tier: 3 });
spel('ff7', 'Final Fantasy VII', 'playstation', [1997, 1998, 2000], 560, { bg: '#e8e6e0', fg: '#3a78d8', motif: 'bigsword' }, 'rpg', { maker: 'Square', tier: 3 });
spel('gt', 'Gran Turismo', 'playstation', [1998, 1999, 2001], 520, { bg: '#1a1a24', fg: '#e8e6e0', motif: 'car' }, 'racer', { maker: 'Sony', tier: 3 });
spel('mario64', 'Super Mario 64', 'n64', [1997, 1998, 2000], 600, { bg: '#3a78d8', fg: '#e23b5a', motif: 'plumber' }, 'plattform', { maker: 'Nintendo', tier: 3 });
spel('goldeneye', 'GoldenEye 007', 'n64', [1997, 1998, 2000], 600, { bg: '#1a1a24', fg: '#e8c26a', motif: 'gun' }, 'raycast', { maker: 'Rare', tier: 3 });
spel('mariokart64', 'Mario Kart 64', 'n64', [1997, 1998, 2001], 580, { bg: '#f0b429', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('pokemon', 'Pokémon Röd/Blå', 'gbc', [1999, 2000, 2002], 380, { bg: '#c9323a', fg: '#f0b429', motif: 'ball' }, 'rpg', { maker: 'Nintendo', tier: 3 });
spel('soulcalibur', 'Soulcalibur', 'dreamcast', [1999, 2000, 2001], 560, { bg: '#2a4a8a', fg: '#e8e6e0', motif: 'bigsword' }, 'fight', { maker: 'Namco', tier: 3 });
// 2000-tal
spel('gta3', 'GTA III', 'ps2', [2001, 2002, 2005], 520, { bg: '#1a1a24', fg: '#f0b429', motif: 'city' }, 'city', { maker: 'Rockstar', tier: 3 });
spel('halo', 'Halo', 'xbox', [2002, 2003, 2005], 560, { bg: '#2a4a8a', fg: '#3fb04a', motif: 'soldier' }, 'raycast', { maker: 'Microsoft', tier: 3 });
spel('smashmelee', 'Super Smash Bros. Melee', 'gamecube', [2002, 2003, 2006], 580, { bg: '#e23b5a', fg: '#f0b429', motif: 'fighter' }, 'fight', { maker: 'Nintendo', tier: 3 });
spel('wiisports', 'Wii Sports', 'wii', [2006, 2008, 2011], 350, { bg: '#f4f2ec', fg: '#3a9ad8', motif: 'ball' }, 'sport', { maker: 'Nintendo', tier: 2 });
spel('gears', 'Gears of War', 'xbox360', [2006, 2007, 2010], 560, { bg: '#2c2c34', fg: '#c9323a', motif: 'skull' }, 'raycast', { maker: 'Microsoft', tier: 3 });
spel('uncharted2', 'Uncharted 2', 'ps3', [2009, 2010, 2012], 560, { bg: '#c98a4a', fg: '#e8e6e0', motif: 'jungle' }, 'aventyr', { maker: 'Sony', tier: 3 });
spel('nintendogs', 'Nintendogs', 'ds', [2005, 2006, 2009], 380, { bg: '#f4f2ec', fg: '#c98a4a', motif: 'dog' }, 'sim', { maker: 'Nintendo', tier: 2 });
// 2010-tal
spel('gtav', 'GTA V', 'ps4', [2014, 2016, 2022], 560, { bg: '#1a1a24', fg: '#f0b429', motif: 'city' }, 'city', { maker: 'Rockstar', tier: 3 });
spel('witcher3', 'The Witcher 3', 'pc', [2015, 2016, 2020], 500, { bg: '#4a3a2a', fg: '#e8e6e0', motif: 'bigsword' }, 'rpg', { maker: 'CD Projekt', tier: 3 });
spel('botw', 'Zelda: Breath of the Wild', 'switch', [2017, 2018, 2022], 600, { bg: '#5a8aaa', fg: '#e8c26a', motif: 'sword' }, 'aventyr', { maker: 'Nintendo', tier: 3 });
spel('fortnite', 'Fortnite', 'pc', [2017, 2019, 2026], 0, { bg: '#3a78d8', fg: '#f0b429', motif: 'bus' }, 'raycast', { maker: 'Epic', tier: 1, desc: 'Gratis – men de köper V-bucks-kort.' });
spel('mariokart8', 'Mario Kart 8 Deluxe', 'switch', [2017, 2019, 2026], 560, { bg: '#e23b5a', fg: '#f0b429', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });
spel('halflifealyx', 'Half-Life: Alyx', 'quest2', [2020, 2021, 2023], 500, { bg: '#f0b429', fg: '#1a1a24', motif: 'lambda' }, 'raycast', { maker: 'Valve', tier: 3 });
spel('eldenring', 'Elden Ring', 'ps5', [2022, 2022, 2025], 620, { bg: '#e8c26a', fg: '#1a1a24', motif: 'bigsword' }, 'rpg', { maker: 'FromSoftware', tier: 3 });
spel('cp2077', 'Cyberpunk 2077', 'pc', [2020, 2023, 2026], 560, { bg: '#f0e030', fg: '#1a1a24', motif: 'city' }, 'city', { maker: 'CD Projekt', tier: 3 });
spel('mkworld', 'Mario Kart World', 'switch2', [2025, 2026, 2026], 700, { bg: '#3a78d8', fg: '#e23b5a', motif: 'kart' }, 'racer', { maker: 'Nintendo', tier: 3 });

// ---------- Arkadmaskiner ----------
// id, namn, [lansering, topp, utfasning], inköp (kabinett), kr per spel, drag, kabinett, utseende, attract-läge
const arkad = (id, name, hype, cost, coin, drag, cab, look, attract, opts = {}) => A.push({
  cat: 'arkad', id: 'a-' + id, name, brand: opts.maker || '', year: hype[0], until: Math.min(2026, hype[2] + 3), hype, cost, coin, drag, cab, tier: opts.tier || 3,
  look, attract, desc: opts.desc || '',
});
arkad('invaders', 'Space Invaders', [1983, 1983, 1985], 9000, 1, 2, 'upright', { marquee: '#1a1a24', text: '#3fb04a', side: '#2a2a40' }, 'invaders', { maker: 'Taito', tier: 2, desc: 'Spelet som startade high score-jakten.' });
arkad('pacman', 'Pac-Man', [1983, 1984, 1987], 10000, 1, 3, 'upright', { marquee: '#f0e030', text: '#1a1a24', side: '#f0e030' }, 'maze', { maker: 'Namco', desc: 'Drog även tjejerna till hallen.' });
arkad('galaga', 'Galaga', [1983, 1985, 1988], 10000, 1, 2, 'upright', { marquee: '#1a1a44', text: '#f0b429', side: '#2a2a60' }, 'invaders', { maker: 'Namco' });
arkad('dkong', 'Donkey Kong', [1983, 1984, 1987], 11000, 1, 3, 'upright', { marquee: '#c9323a', text: '#f0b429', side: '#3a78d8' }, 'kong', { maker: 'Nintendo', desc: 'Första plattformsspelet med en berättelse.' });
arkad('mariobros', 'Mario Bros.', [1984, 1985, 1988], 11000, 1, 2, 'upright', { marquee: '#3a78d8', text: '#f0b429', side: '#c9323a' }, 'kong', { maker: 'Nintendo' });
arkad('outrun', 'Out Run', [1987, 1988, 1991], 26000, 2, 4, 'sitdown', { marquee: '#e23b5a', text: '#f0e030', side: '#3a9ad8' }, 'road', { maker: 'Sega', tier: 4, desc: 'Sittkabinett som vrider sig. Valbar musik.' });
arkad('ddragon', 'Double Dragon', [1987, 1989, 1991], 14000, 2, 3, 'upright', { marquee: '#1a1a24', text: '#e23b5a', side: '#2a2a40' }, 'fight', { maker: 'Technos', desc: 'Två spelare sida vid sida.' });
arkad('opwolf', 'Operation Wolf', [1988, 1989, 1991], 20000, 2, 3, 'gun', { marquee: '#2c2c34', text: '#f0b429', side: '#5a5a3a' }, 'gun', { maker: 'Taito', desc: 'Uzi med rekyl.' });
arkad('goldenaxe', 'Golden Axe', [1989, 1990, 1993], 15000, 2, 3, 'upright', { marquee: '#c98a4a', text: '#1a1a24', side: '#7a1a10' }, 'fight', { maker: 'Sega' });
arkad('finalfight', 'Final Fight', [1990, 1991, 1993], 16000, 2, 3, 'upright', { marquee: '#1a1a24', text: '#e23b5a', side: '#3a3a44' }, 'fight', { maker: 'Capcom' });
arkad('sf2', 'Street Fighter II', [1991, 1993, 1996], 28000, 3, 5, 'upright', { marquee: '#c9323a', text: '#f0e030', side: '#3a78d8' }, 'fight', { maker: 'Capcom', tier: 5, desc: 'Drog in tolv gånger mer än en vanlig maskin. Vinnaren står kvar.' });
arkad('mk', 'Mortal Kombat', [1993, 1994, 1996], 26000, 3, 4, 'upright', { marquee: '#1a1a24', text: '#f0b429', side: '#7a1a10' }, 'fight', { maker: 'Midway', tier: 4 });
arkad('nbajam', 'NBA Jam', [1993, 1994, 1997], 30000, 3, 4, 'upright', { marquee: '#1a1a24', text: '#e8c26a', side: '#e23b5a' }, 'basket', { maker: 'Midway', tier: 4, desc: 'Fyra spelare. "He\'s on fire!"' });
arkad('daytona', 'Daytona USA', [1994, 1995, 2000], 60000, 5, 5, 'sitdown', { marquee: '#3a78d8', text: '#f0e030', side: '#e23b5a' }, 'road', { maker: 'Sega', tier: 5, desc: 'Länkade sittkabinett. Dyrt – och kön är lång.' });
arkad('segarally', 'Sega Rally', [1995, 1996, 2000], 55000, 5, 4, 'sitdown', { marquee: '#3a9ad8', text: '#f4f2ec', side: '#3fb04a' }, 'road', { maker: 'Sega', tier: 5, desc: 'Populärare än Daytona i Europa.' });
arkad('timecrisis', 'Time Crisis', [1996, 1997, 2000], 32000, 5, 4, 'gun', { marquee: '#c9323a', text: '#f4f2ec', side: '#2c2c34' }, 'gun', { maker: 'Namco', tier: 4, desc: 'Trampa på pedalen för att ta skydd.' });
arkad('hotd', 'House of the Dead', [1997, 1998, 2002], 34000, 5, 4, 'gun', { marquee: '#1a1a24', text: '#3fb04a', side: '#4a1a1a' }, 'gun', { maker: 'Sega', tier: 4 });
arkad('ddr', 'Dancing Stage', [1999, 2001, 2006], 45000, 10, 5, 'dance', { marquee: '#e23b5a', text: '#f4f2ec', side: '#3a9ad8' }, 'dance', { maker: 'Konami', tier: 4, desc: 'Spelaren blir underhållningen.' });
arkad('initiald', 'Initial D Arcade Stage', [2002, 2004, 2007], 60000, 10, 4, 'sitdown', { marquee: '#1a1a24', text: '#f0e030', side: '#e8e6e0' }, 'road', { maker: 'Sega', tier: 5, desc: 'Kort som sparar din bil.' });
arkad('retro', 'Arcade1Up retrokabinett', [2018, 2020, 2026], 5000, 0, 3, 'upright', { marquee: '#f0e030', text: '#1a1a24', side: '#3a78d8' }, 'maze', { maker: 'Arcade1Up', tier: 2, desc: 'Nostalgi till möbelpris. Ingen myntinkast – men folk står ändå och spelar.' });
arkad('neogeomini', 'Neo Geo MVS', [1991, 1994, 1999], 30000, 3, 4, 'upright', { marquee: '#1a1a24', text: '#d8b24a', side: '#c9323a' }, 'fight', { maker: 'SNK', tier: 4, desc: 'Fyra spel i samma skåp.' });

export const KONSOLER = K, SPEL = S, ARKAD = A;
export const PRODUCTS = [...K, ...S, ...A];
export const PRODUCT_CATS = ['konsol', 'spel', 'arkad'];
export const isProduct = (p) => !!p && PRODUCT_CATS.includes(p.cat);

// hur het en produkt är ett visst år: 0–1 (stiger till toppen, faller efter utfasning)
export function hypeAt(p, year) {
  const [y0, peak, y1] = p.hype || [p.year, p.year + 1, p.until];
  if (year < y0) return 0;
  if (year <= peak) return 0.55 + 0.45 * (year - y0) / Math.max(1, peak - y0);
  if (year <= y1) return 1 - 0.5 * (year - peak) / Math.max(1, y1 - peak);
  return Math.max(0.08, 0.5 - 0.15 * (year - y1));
}
// Lagret tappar värde efter toppen: butikspris = inköp × påslag × värdefaktor
export function valueAt(p, year) {
  const [, peak, y1] = p.hype || [p.year, p.year + 1, p.until];
  if (year <= peak + 1) return 1;
  if (year <= y1) return 0.9;
  // retro: efter tjugo år blir det samlarobjekt igen
  if (year - y1 >= 20) return 2.5;
  return Math.max(0.3, 0.9 - 0.2 * (year - y1));
}
export const PLATFORM_NAME = Object.fromEntries(K.map((k) => [k.look.shape, k.name]));
PLATFORM_NAME.pc = 'PC';
export const gamesFor = (platform) => S.filter((s) => s.platform === platform);
