// Händelser ur Sveriges datorhistoria som styr efterfrågan, priser och kundflöde – och
// ställer spelaren inför ett val, som i Game Dev Story. Effekterna gäller i `dur` år.
// Ingen DOM här – körs även i Node (tools/handelser.mjs).
//
// effect-nycklar (game.eventMul / game.eventVal):
//   spawn, patience, products, hi, lo, diag  – faktorer (fler kunder, tålamod, produktkunder,
//                                              dyra/billiga mallar, diagnosavgift)
//   cats: { gpu: 2 }     – kundmallar som kräver kategorin blir vanligare
//   price: { gpu: 1.8 }  – grossistens pris per kategori ('all' = allt)
//   sales: { gamer: 1.5 } – modellförsäljning per användning ('all' = alla)
//   repair: 0.4          – andel kunder med trasig dator (normalt 0,2)
//   bonus: 300           – extra kronor per färdig beställning
//   direkt vid valet: money, stars (rykte), hype { use: +0.3 }, stock { partId: n },
//   stockCat { cat: n } (n av årets billigaste tillåtna), bulk { n, use, name, mul }
export const EVENTS = [
  { id: 'hemdator83', year: 1983, dur: 2, icon: '🏠', title: 'Hemdatorvågen', text: 'Commodore 64 säljer som smör i solsken – varenda unge vill ha en, och föräldrarna tror att de ska lära sig programmera. Grossisten erbjuder ett parti.',
    effect: { products: 2 }, choices: [
      { id: 'parti', label: 'Ta partiet: 6 st C64 för 12 000 kr', cost: 12000, effect: { stock: { 'k-c64': 6 } }, text: 'Sex Commodore 64 kommer i en låda. Du behöver en TV-hörna för att sälja dem.' },
      { id: 'nej', label: 'Nej tack, jag säljer PC', text: 'Du håller dig till PC-klonerna. Ungarna går till leksaksaffären.' }] },
  { id: 'compis85', year: 1985, dur: 2, icon: '🏫', title: 'Datorn i skolan', text: 'Skolstyrelsen köper in datorer till klassrummen. Anbud tas emot från lokala butiker – om man har en färdig skolmodell att visa upp.',
    effect: { lo: 1.4 }, choices: [
      { id: 'anbud', label: 'Lägg anbud: 6 skoldatorer', need: 'model:skola', effect: { bulk: { n: 6, use: 'skola', name: 'Skolstyrelsen', mul: 0.9 } }, text: 'Anbudet gick igenom! Sex datorer ska levereras – se till att delarna finns i lagret.' },
      { id: 'nej', label: 'Låt bli', text: 'Skolan köper från stan i stället.' }] },
  { id: 'dmz86', year: 1986, dur: 1, icon: '📰', title: 'Datormagazin startar', text: 'Sveriges nya datortidning testar allt som säljs – även småbutikernas egna modeller. Ett bra betyg där märks i kassan.',
    effect: {}, choices: [
      { id: 'prenumerera', label: 'Prenumerera och skicka in en modell (400 kr)', cost: 400, effect: { hype: { all: 0.25 }, stars: 3 }, text: 'Redaktionen nämner butiken i nästa nummer.' },
      { id: 'nej', label: 'Tidningar, pyttsan', text: 'Du läser den i kiosken i stället.' }] },
  { id: 'amiga87', year: 1987, dur: 2, icon: '🎨', title: 'Amiga 500 – tonårsrummens kung', text: '4096 färger och samplat ljud. Alla vill se den i skyltfönstret – och sedan köpa en PC ändå, säger du hoppfullt.',
    effect: { products: 1.8 }, choices: [
      { id: 'demo', label: 'Ställ en demo i skyltfönstret (1 500 kr)', cost: 1500, effect: { spawn: 1.3 }, text: 'Folk stannar utanför och tittar på Juggler-demon. Fler kommer in.' },
      { id: 'nej', label: 'Bara sälja', text: 'Skyltfönstret förblir som det är.' }] },
  { id: 'nes88', year: 1988, dur: 2, icon: '🍄', title: 'Nintendomanin', text: 'Super Mario Bros. har nått Sverige. Barnen tjatar, Bergsala levererar, och TV-hörnan är butikens bästa hörn.',
    effect: { products: 2 }, choices: [
      { id: 'turnering', label: 'Ordna Mario-turnering i butiken (1 500 kr)', cost: 1500, effect: { spawn: 1.3, stars: 3 }, text: 'Kön ringlade ut på gatan. Vinnaren fick en kassett.' },
      { id: 'nej', label: 'Låt Nintendo vara Nintendo', text: 'Du säljer datorer, inte leksaker.' }] },
  { id: 'sb89', year: 1989, dur: 2, icon: '🔊', title: 'Sound Blaster', text: 'Ett ljudkort som spelen faktiskt stöder. Plötsligt vill alla ha ljud i PC:n. Grossisten har ett parti till bra pris.',
    effect: { cats: { sound: 3 } }, choices: [
      { id: 'parti', label: 'Ta partiet: ljudkort −30 % i år (3 000 kr)', cost: 3000, effect: { price: { sound: 0.7 } }, text: 'Ljudkorten kostar 30 % mindre hos grossisten resten av året.' },
      { id: 'nej', label: 'Köp vid behov', text: 'Du köper in ljudkort som vanligt.' }] },
  { id: 'win30', year: 1990, dur: 2, icon: '🪟', title: 'Windows 3.0', text: 'Fönster, mus och Solitaire. Kunderna vill ha mer minne och en VGA-skärm – och undrar vad en "mus" är.',
    effect: { cats: { ram: 2, gpu: 1.4 }, hi: 1.2 }, choices: [
      { id: 'kurs', label: 'Håll Windows-kurs för kunderna (800 kr)', cost: 800, effect: { patience: 1.3, stars: 3 }, text: 'Kunderna litar på dig. De väntar hellre än går.' },
      { id: 'nej', label: 'Låt dem klicka själva', text: 'Musen får de lära sig hemma.' }] },
  { id: 'sonic91', year: 1991, dur: 2, icon: '💨', title: 'Sonic mot Mario', text: 'Mega Drive mot Super Nintendo på skolgården. TV-hörnan blir slagfält.',
    effect: { products: 1.6 }, choices: [
      { id: 'bada', label: 'Ställ ut båda i TV-hörnan', effect: { hype: { all: 0.1 }, spawn: 1.15 }, text: 'Diplomatiskt. Alla är nöjda – och stannar längre.' },
      { id: 'nej', label: 'Håll dig utanför', text: 'Du låter skolgården avgöra.' }] },
  { id: 'doom93', year: 1993, dur: 2, icon: '👹', title: 'DOOM', text: 'Ett shareware-spel får hela landet att uppgradera. 486:or, ljudkort och minne flyger ur hyllorna. Killarna vill spela mot varandra över nätverk – i din butik.',
    effect: { cats: { gpu: 2, sound: 2 }, hi: 1.5, sales: { gamer: 1.5 } }, choices: [
      { id: 'lan', label: 'Nattöppet DOOM-LAN i butiken (2 000 kr)', cost: 2000, effect: { spawn: 1.4, stars: 3 }, text: 'Fyra datorer, en nullmodemkabel och pizza. Alla vill ha en likadan dator.' },
      { id: 'nej', label: 'Bara sälja', text: 'Du säljer delarna och går hem i tid.' }] },
  { id: 'fdiv94', year: 1994, dur: 1, icon: '🐛', title: 'Pentium FDIV-buggen', text: 'Intels nya processor räknar fel på vissa divisioner. Kunderna som köpt Pentium hos dig kommer tillbaka och undrar.',
    effect: { repair: 0.35 }, choices: [
      { id: 'byt', label: 'Byt processor gratis åt kunderna (4 000 kr)', cost: 4000, effect: { stars: 9 }, text: 'Dyrt – men alla berättar om butiken som stod för sitt.' },
      { id: 'intel', label: 'Hänvisa till Intel', effect: { stars: -6 }, text: 'Kunderna får ringa Intel själva. Några kommer inte tillbaka.' }] },
  { id: 'win95', year: 1995, dur: 1, icon: '🚀', title: 'Windows 95-natten', text: 'Start-knappen kommer till Sverige vid midnatt. Butiker håller öppet, kön står på gatan. Alla behöver mer minne och större hårddisk.',
    effect: { spawn: 1.5, cats: { ram: 1.5, storage: 1.5 } }, choices: [
      { id: 'natt', label: 'Håll öppet till midnatt (1 000 kr)', cost: 1000, effect: { spawn: 1.35, stars: 3 }, text: 'Kaffe, kö och Rolling Stones i högtalarna. En natt att minnas.' },
      { id: 'nej', label: 'Stäng som vanligt', text: 'Du sover gott. Konkurrenten fick nattens kunder.' }] },
  { id: 'voodoo96', year: 1996, dur: 2, icon: '🔺', title: '3dfx Voodoo', text: 'Ett tilläggskort som gör Quake mjukt som smör. "3D-accelerator" blir det nya ordet i annonserna.',
    effect: { cats: { gpu: 2.5 }, hi: 1.3, sales: { gamer: 1.3 } }, choices: [
      { id: 'demo', label: 'Demodator med Voodoo i butiken (2 500 kr)', cost: 2500, effect: { spawn: 1.25, hype: { gamer: 0.3 } }, text: 'GLQuake i skyltfönstret. Folk står och gapar.' },
      { id: 'nej', label: 'Avvakta', text: '3D-kort? Det går nog över.' }] },
  { id: 'dreamhack97', year: 1997, dur: 2, icon: '🏟️', title: 'Dreamhack växer', text: 'LAN-partyt i Malung blir störst i Sverige. Killarna släpar sina datorer i bilen – och vill ha snabbare inför nästa.',
    effect: { sales: { gamer: 1.4 }, cats: { gpu: 1.5 } }, choices: [
      { id: 'sponsra', label: 'Sponsra LAN-partyt (3 000 kr)', cost: 3000, effect: { spawn: 1.3, stars: 3, hype: { gamer: 0.3 } }, text: 'Butikens namn på bannern. Gamers minns.' },
      { id: 'nej', label: 'Låt bli', text: 'Du stannar hemma.' }] },
  { id: 'hempc98', year: 1998, dur: 3, icon: '🏢', title: 'Hem-PC-reformen', text: 'Anställda får hyra en dator av jobbet skattefritt. Företag beställer datorer i klump – till den butik som har en färdig kontorsmodell.',
    effect: { spawn: 1.3, sales: { kontor: 1.6 } }, choices: [
      { id: 'avtal', label: 'Teckna avtal: 12 kontorsdatorer', need: 'model:kontor', effect: { bulk: { n: 12, use: 'kontor', name: 'Verkstadsbolaget', mul: 0.92 } }, text: 'Verkstadsbolaget beställer tolv av din kontorsmodell. Fyll lagret!' },
      { id: 'nej', label: 'Sälj styckvis', text: 'Företagen går till kedjorna. Privatkunderna kommer ändå.' }] },
  { id: 'y2k99', year: 1999, dur: 1, icon: '⏰', title: 'Y2K-paniken', text: 'Ska datorerna stanna vid tolvslaget? Kunderna kommer med gamla burkar och vill ha dem "kontrollerade". Tidningarna eldar på.',
    effect: { repair: 0.4, spawn: 1.2 }, choices: [
      { id: 'kontroll', label: 'Sälj Y2K-kontroll (+300 kr per jobb)', effect: { bonus: 300 }, text: 'En klisterlapp och en BIOS-titt. Kunderna sover gott.' },
      { id: 'lugna', label: 'Lugna kunderna gratis', effect: { stars: 6 }, text: 'Ärligt – och ryktet växer.' }] },
  { id: 'dotcom00', year: 2000, dur: 1, icon: '📉', title: 'Dotcom-kraschen', text: 'IT-bolagen går omkull och dumpar sina lager. Grossisten säljer billigt – men kunderna håller i plånboken.',
    effect: { spawn: 0.75 }, choices: [
      { id: 'kop', label: 'Passa på: allt −30 % hos grossisten i år', effect: { price: { all: 0.7 } }, text: 'Du fyller lagret medan andra räds.' },
      { id: 'spara', label: 'Håll i pengarna', effect: { stars: 3 }, text: 'Försiktigt. Kassan står kvar.' }] },
  { id: 'xp01', year: 2001, dur: 2, icon: '🟦', title: 'Windows XP', text: 'Grönt gräs och blå himmel. XP vill ha minne, och kunderna vill ha XP.',
    effect: { cats: { ram: 1.6, storage: 1.4 } }, choices: [
      { id: 'ok', label: 'Uppgraderingspaket: minne + XP', effect: { spawn: 1.15, hype: { kontor: 0.2 } }, text: 'Ett färdigt erbjudande i fönstret. Det bet.' },
      { id: 'nej', label: 'Bara sälja', text: 'Delarna säljer sig själva.' }] },
  { id: 'kondensator02', year: 2002, dur: 3, icon: '💥', title: 'Kondensatorpesten', text: 'Dåligt elektrolyt i asiatiska kondensatorer: moderkort svullnar och dör över hela landet. Reparationskunderna står i kö.',
    effect: { repair: 0.45 }, choices: [
      { id: 'lod', label: 'Köp lödstation (2 500 kr): diagnosavgift ×2', cost: 2500, effect: { diag: 2 }, text: 'Du byter kondensatorer på löpande band – och tar betalt.' },
      { id: 'nej', label: 'Laga som vanligt', text: 'Du byter hela kort. Det går också.' }] },
  { id: 'cs03', year: 2003, dur: 2, icon: '💣', title: 'LAN i varje källare', text: 'Counter-Strike 1.6. Gymnasieklasser bär ner datorer i källare och spelar tills gryningen. De vill ha mer fps.',
    effect: { hi: 1.3, cats: { gpu: 1.5 }, sales: { gamer: 1.3 } }, choices: [
      { id: 'lanhyra', label: 'Hyr ut LAN-utrustning (1 500 kr)', cost: 1500, effect: { spawn: 1.2, stars: 3 }, text: 'Switchar och kablar i utlåning. Killarna kommer tillbaka och köper.' },
      { id: 'nej', label: 'Låt bli', text: 'Du säljer, de bär.' }] },
  { id: 'wow04', year: 2004, dur: 2, icon: '⚔️', title: 'World of Warcraft och Half-Life 2', text: 'Två spel samma höst som får alla att uppgradera grafikkortet. Azeroth väntar inte.',
    effect: { cats: { gpu: 2 }, sales: { gamer: 1.4 } }, choices: [
      { id: 'bundle', label: 'Sälj spel + grafikkort i paket', effect: { hype: { gamer: 0.3 }, products: 1.3 }, text: 'Paketet står vid kassan. Det försvinner.' },
      { id: 'nej', label: 'Bara sälja', text: 'Grafikkorten går ändå.' }] },
  { id: 'core06', year: 2006, dur: 2, icon: '🧠', title: 'Core 2 Duo', text: 'Intel slår tillbaka mot Athlon 64 med två kärnor som faktiskt är svala. Alla vill byta processor.',
    effect: { cats: { cpu: 2 }, hi: 1.3 }, choices: [
      { id: 'ok', label: 'Uppgraderingskampanj (1 000 kr)', cost: 1000, effect: { spawn: 1.2 }, text: '"Byt hjärna på datorn" står det i fönstret.' },
      { id: 'nej', label: 'Bara sälja', text: 'Processorerna säljer sig själva.' }] },
  { id: 'crysis07', year: 2007, dur: 2, icon: '🌴', title: '"Can it run Crysis?"', text: 'Ett spel som ingen dator klarar på max. Kunderna kommer in med frågan – och stora plånböcker.',
    effect: { hi: 1.6, cats: { gpu: 2.5 }, sales: { gamer: 1.3 } }, choices: [
      { id: 'demo', label: 'Demodator som kör Crysis (6 000 kr)', cost: 6000, effect: { spawn: 1.3, hype: { gamer: 0.4 }, stars: 3 }, text: 'Djungeln på 30 fps i fönstret. Folk stannar.' },
      { id: 'nej', label: 'Avvakta', text: 'Det får de köra hemma.' }] },
  { id: 'kris08', year: 2008, dur: 2, icon: '📉', title: 'Finanskrisen', text: 'Bankerna vacklar och kunderna håller i pengarna. Billigt går, dyrt står kvar.',
    effect: { spawn: 0.7, patience: 0.85, lo: 1.5, sales: { budget: 1.5, gamer: 0.7 } }, choices: [
      { id: 'rea', label: 'Rea på hela lagret', effect: { spawn: 1.3, hype: { budget: 0.3 } }, text: 'Marginalerna krymper men kunderna kommer.' },
      { id: 'hall', label: 'Håll ut', effect: { stars: 3 }, text: 'Du väntar ut stormen.' }] },
  { id: 'ssd10', year: 2010, dur: 2, icon: '⚡', title: 'SSD-vågen', text: 'Windows startar på tio sekunder. Den som provat en SSD går aldrig tillbaka.',
    effect: { cats: { storage: 2 } }, choices: [
      { id: 'demo', label: 'Demo: "starta på 10 sekunder"', effect: { spawn: 1.2, hype: { kontor: 0.2 } }, text: 'Stoppuret vid kassan säljer SSD:er.' },
      { id: 'nej', label: 'Bara sälja', text: 'Diskarna säljer sig själva.' }] },
  { id: 'thailand11', year: 2011, dur: 1, icon: '🌊', title: 'Översvämningen i Thailand', text: 'Fabrikerna som gör halva världens hårddiskar står under vatten. Priserna dubblas på några veckor.',
    effect: { price: { storage: 2.2 } }, choices: [
      { id: 'kop', label: 'Köp in hårddiskar innan priset sticker (6 st)', need: 'money:6000', effect: { stockCat: { storage: 6 } }, text: 'Sex diskar i lagret till gamla priset.' },
      { id: 'nej', label: 'Avvakta', text: 'Du betalar dubbelt när du behöver.' }] },
  { id: 'nextgen13', year: 2013, dur: 2, icon: '🎮', title: 'PS4 och Xbox One', text: 'Två nya konsoler samma november. TV-hörnan har aldrig varit viktigare.',
    effect: { products: 1.8 }, choices: [
      { id: 'midnatt', label: 'Midnattsöppet vid lanseringen (1 500 kr)', cost: 1500, effect: { spawn: 1.25, stars: 3 }, text: 'Kön, förköpen, kaffet. Klassiskt.' },
      { id: 'nej', label: 'Öppna som vanligt', text: 'De som vill ha en hittar hit ändå.' }] },
  { id: 'minecraft14', year: 2014, dur: 3, icon: '🧱', title: 'Minecraft överallt', text: 'Varje tioåring vill ha en dator som klarar shaders. Föräldrarna vill ha en som klarar läxor.',
    effect: { lo: 1.4, sales: { skola: 1.4, budget: 1.3 } }, choices: [
      { id: 'kids', label: 'Barnhörna med Minecraft i butiken (1 000 kr)', cost: 1000, effect: { spawn: 1.2, patience: 1.2 }, text: 'Barnen spelar, föräldrarna handlar i lugn och ro.' },
      { id: 'nej', label: 'Låt bli', text: 'Föräldrarna får hålla i barnen själva.' }] },
  { id: 'vr16', year: 2016, dur: 2, icon: '🥽', title: 'VR-året', text: 'Oculus Rift och HTC Vive kräver GTX 1060 eller bättre. Kunderna vill veta om deras dator "är VR-ready".',
    effect: { hi: 1.5, cats: { gpu: 2 } }, choices: [
      { id: 'demo', label: 'VR-demo i butiken (8 000 kr)', cost: 8000, effect: { spawn: 1.35, hype: { gamer: 0.4 }, stars: 3 }, text: 'Folk viftar med armarna i skyltfönstret. Alla vill prova.' },
      { id: 'nej', label: 'Avvakta', text: 'VR? Det går nog över. Igen.' }] },
  { id: 'krypto17', year: 2017, dur: 2, icon: '⛏️', title: 'Kryptobristen', text: 'Bitcoin och Ethereum får gruvarbetare att köpa varje grafikkort som finns. Priserna dubblas. Spelarna står utan.',
    effect: { price: { gpu: 1.8 }, cats: { gpu: 2 } }, choices: [
      { id: 'salj', label: 'Sälj lagret till gruvarbetarna (+8 000 kr)', effect: { money: 8000, stars: -6 }, text: 'Kontanter i handen – och tomma hyllor. Spelarna muttrar.' },
      { id: 'hall', label: 'Håll korten åt spelarna', effect: { stars: 6, hype: { gamer: 0.3 } }, text: 'Ett kort per kund. Ryktet växer.' }] },
  { id: 'fortnite18', year: 2018, dur: 2, icon: '🪂', title: 'Fortnite-febern', text: 'Gratis, på allt, överallt. Barnen vill ha 144 fps och en RGB-tangentbord.',
    effect: { spawn: 1.3, sales: { gamer: 1.3 } }, choices: [
      { id: 'bygg', label: 'Färdigbyggd "Fortnite-dator" i fönstret', effect: { hype: { gamer: 0.3 }, lo: 1.2 }, text: 'Ett fast pris, ett namn barnen känner igen.' },
      { id: 'nej', label: 'Bara sälja', text: 'Delarna går ändå.' }] },
  { id: 'pandemi20', year: 2020, dur: 2, icon: '😷', title: 'Pandemin – alla jobbar hemma', text: 'Kontoren stänger och köksborden blir arbetsplatser. Webbkameror, skärmar och kontorsdatorer tar slut. Ingen vågar lämna in något på reparation.',
    effect: { spawn: 1.4, sales: { kontor: 1.8 }, repair: 0.08, patience: 1.2 }, choices: [
      { id: 'hem', label: 'Starta hemleverans (3 000 kr)', cost: 3000, effect: { spawn: 1.3, stars: 6 }, text: 'Du kör ut datorerna själv. Kunderna vinkar från fönstret.' },
      { id: 'nej', label: 'Håll butiken öppen som vanligt', text: 'Handsprit vid dörren. Folk kommer ändå.' }] },
  { id: 'chip21', year: 2021, dur: 2, icon: '🔌', title: 'Chipbristen', text: 'Fabrikerna hinner inte. Grafikkort och processorer kostar dubbelt – om de finns alls.',
    effect: { price: { gpu: 2, cpu: 1.4 } }, choices: [
      { id: 'kop', label: 'Köp in grafikkort medan de finns (4 st)', need: 'money:12000', effect: { stockCat: { gpu: 4 } }, text: 'Fyra kort i lagret innan priset sticker.' },
      { id: 'nej', label: 'Avvakta', text: 'Kunderna får vänta – eller betala.' }] },
  { id: 'el22', year: 2022, dur: 1, icon: '💡', title: 'Elpriserna skenar', text: 'Kunderna räknar på watt. Strömsnåla datorer och budgetbyggen är plötsligt moderna.',
    effect: { sales: { budget: 1.5, gamer: 0.8 }, lo: 1.5, hi: 0.7 }, choices: [
      { id: 'eco', label: 'Marknadsför "strömsnåla" byggen', effect: { hype: { budget: 0.3, kontor: 0.2 } }, text: 'Watt-mätaren står på disken.' },
      { id: 'nej', label: 'Bara sälja', text: 'Elräkningen får kunderna ta.' }] },
  { id: 'ai23', year: 2023, dur: 3, icon: '🤖', title: 'AI-vågen', text: 'Alla vill träna modeller och rendera med ray tracing. RTX 4090 säljer slut trots priset.',
    effect: { hi: 1.6, cats: { gpu: 2 }, sales: { media: 1.5 } }, choices: [
      { id: 'ws', label: 'Profilera butiken mot AI-arbetsstationer (5 000 kr)', cost: 5000, effect: { spawn: 1.25, hype: { media: 0.4 }, stars: 3 }, text: 'Företagen ringer.' },
      { id: 'nej', label: 'Bara sälja', text: 'Korten går ändå.' }] },
  { id: 'switch2', year: 2025, dur: 2, icon: '🔴', title: 'Switch 2 – köerna ringlar', text: 'Nintendos nya konsol lanseras med Mario Kart World. Förbeställningarna tar slut på minuter.',
    effect: { products: 2 }, choices: [
      { id: 'midnatt', label: 'Midnattsöppet med förköp (2 000 kr)', cost: 2000, effect: { spawn: 1.3, stars: 3 }, text: 'Kön, kaffet, jublet. Sista gången?' },
      { id: 'nej', label: 'Öppna som vanligt', text: 'De som vill ha en hittar hit ändå.' }] },
];
export const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
export const MUL_KEYS = ['spawn', 'patience', 'products', 'hi', 'lo', 'diag'];
export const MAP_KEYS = ['cats', 'price', 'sales'];
export const NOW_KEYS = ['money', 'stars', 'hype', 'stock', 'stockCat', 'bulk'];
export const EFFECT_KEYS = [...MUL_KEYS, ...MAP_KEYS, ...NOW_KEYS, 'repair', 'bonus'];
// nästa händelse som inte setts, i årsordning
export const nextEvent = (year, seen) => EVENTS.filter((e) => e.year <= year && !seen.includes(e.id)).sort((a, b) => a.year - b.year)[0] || null;
// vad ett val kräver: 'model:kontor' = en kontorsmodell som säljs, 'money:6000' = pengar
export function needText(need, game) {
  if (!need) return '';
  const [k, v] = need.split(':');
  if (k === 'model') return (game.models || []).some((m) => m.use === v && m.state === 'sale') ? '' : `kräver en ${v === 'kontor' ? 'kontorsmodell' : v === 'skola' ? 'skolmodell' : v + '-modell'} som säljs`;
  if (k === 'money') return game.money >= +v ? '' : `kräver ${v} kr`;
  return '';
}
