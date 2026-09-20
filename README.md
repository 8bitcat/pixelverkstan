# Pixelverkstan

Ett pixelspel där kunder kommer in i butiken och beställer något som du bygger ihop
i verkstaden. Första verksamheten är **Datorbutiken**: över **12 000 riktiga
komponenter från 1983 till 2026** (IBM, Intel, AMD, 3dfx, NVIDIA, Creative, Corsair,
Samsung …) byggs ihop i en isometrisk vy, och spelet lär ut datorarkitektur
(systembuss, minneshierarki, pipeline, von Neumann) och datorhistoria.
Andra verksamheten är **Hamburgerbaren** (1955–2026): 416 ingredienser och 155 menyer
genom epokerna, burgaren byggs lager för lager på brickan i samma motor.

## Epoker

Välj startår (1983, 1991, 1999, 2008 eller 2021). Varje startår har en egen sparning – ☰ tar dig tillbaka till menyn där du kan fortsätta ett annat år, starta ett nytt eller börja om. Varje byggd dator ger erfarenhet
och åren går framåt (30 XP per år). Grossisten säljer bara det som fanns just det året,
kunderna beställer datorer som passar sin tid (Lotus 1-2-3, DOOM, Quake, Counter-Strike,
Crysis, Minecraft …) och ett nytt år visar årets nyheter.

- **1980-tal:** XT/AT-kort med 8088/286/386, DIP-minne och SIMM, ISA-grafikkort
  (MDA/CGA/Hercules/EGA/VGA), MFM/RLL-diskar med kontrollerkort, 5,25"-disketter,
  AT-nätagg med **P8/P9** (fel håll → det luktar bränt), jumprar/DIP-switchar,
  DIN-tangentbord, bildrörsskärm och DOS.
- **1990-tal:** 486/Pentium/K6, VLB och PCI, IDE-flatkablar, CD-ROM med CD-ljudkabel,
  Sound Blaster, Molex-drivna fläktar, AT → ATX 20-pin, AGP, Slot 1/A, PS/2, Windows 3.1/95/98.
- **2000-tal:** Athlon/Pentium 4/Core 2, 4-pin ATX12V, SATA, PCIe, DVD, 3-pin-fläktar, XP/Vista.
- **2009–2026:** modernt chassi (nätagget i botten), 24-pin + EPS, M.2, 12V-2x6, ARGB.

Chassit ritas i två upplägg: **klassiskt** (nätagget i taket, enhetsbur fram – AT och
ATX t.o.m. 2008) och **modernt** (nätagget under kåpan).

## Köra lokalt

Ingen byggkedja – det är ren HTML + ES-moduler:

```
python -m http.server 8777
```

Öppna http://localhost:8777. Spelet sparas automatiskt i webbläsaren (localStorage).

## Spelloop

1. **Köp in varor.** Butiken börjar tom. Tryck på 🛒 Grossist – Startpaketet innehåller
   delarna till de första kundernas datorer. Allt du köper kommer i en **låda** en stund senare.
2. **Packa upp och ställ ut.** Lådan står vid dörren med en etikett på vad som kommit.
   Gå fram (tryck på lådan) och packa upp: delarna ställs ut i montrarna eller läggs i
   förrådet. **Kunderna beställer det de ser** – 📦 Lager visar vad som står framme.
3. Kunden ställer sig vid disken → tryck på kunden så går din avatar bakom disken och
   tar beställningen. Saknas något kan du beställa det – ta emot när lådan är uppackad.
4. Välj byggläge: **med hjälp** (markeringar, checklista, förklaringar) eller
   **utan hjälp** (proffsläge, +15 % betalt – misstag märks först vid start).
5. **Montering** i det öppna chassit och **kablar** till rätt uttag (se Epoker).
6. **Skrivbordet**: koppla in ström, skärm, tangentbord och mus, slå på och starta.
   Startsekvensen visar vad som är fel – felsök och starta igen.
7. Kunden hämtar vid utlämningen och betalar. Erfarenhet för åren framåt.

De tre första kunderna är guidade.

## Butiken: bås, konsoler och spelande

- **Lokalen** har en egen planlösning per steg (`js/core/floor-plans.js`): *Källarhålan* är
  bara högra halvan av rummet – vänstra delen är förråd bakom en plywoodvägg med kartonger,
  lastpall och rör – med grova trähyllor med glödlampa och 5 platser (3 hyllor från start,
  2 lediga). *Gatuplan* öppnar hela rummet med plåthyllor, en träbänk och en papperskorg
  (7 platser). *Kvartersbutiken* får glasmontrar, stjärnobjektet och soffgruppen (8),
  *Hörnbutiken* ett torn till (9), *Datorhuset* svarta LED-montrar, arkadrum och en REA-skylt
  (10), *Megastore* en ö-monter mitt i rummet, röd matta och mässing (11). Platserna har
  fasta nummer, så inredningen följer med när man byter lokal. Kategoriskyltarna på hyllorna
  är stora och färgade efter kategori. 🏪 Butiken visar platserna med pixelförhandsvisning;
  står det redan något på platsen frågar spelet innan det rivs (40 % tillbaka, avdraget
  från priset – eller välj en annan plats).
- **Byt delar ur lagret.** Vid disken kan du byta en del i kundens beställning mot en annan
  du har hemma, eller lägga till ett grafikkort (kunden betalar extra). I bygget finns
  📦 Lagret i lådan för samma sak – riggen byggs om och delar som inte längre ingår plockas ur.
- **Bås låser upp sortimentet.** En kategorihylla får bara visa instegsvaror (tier 1–2).
  Ett **märkesbås** (NVIDIA, ATI, 3dfx, Intel, AMD, Kingston, Seagate …) i tre nivåer
  höjer taket för just det märket till tier 3/4/5. Grossisten visar hänglås med kravet i
  klartext; kunder som vill ha finare saker hamnar på **efterfrågantavlan**. Märken dör –
  3dfx-båset är värdelöst år 2001.
- **🪧 Dragningskraft, 😊 trivsel, ⭐ rykte** styr kundflöde, tålamod och dricks. Skyltar,
  kaffeautomat, matta, stereo, växter, extra kassa och lagerhyllans nivå påverkar dem.
- **Konsoler och spel** (C64, Amiga, NES … Switch 2, Steam Deck) säljs över disk – men
  bara om de står i **TV-hörnan** respektive på **spelhyllan**. Kunder ber om årets heta
  maskin; är det nyaste du visar över fyra år gammalt klagar de på grafiken. Gammalt
  lager tappar värde; efter tjugo år blir det samlarobjekt. Alla 34 konsoler har spel i
  grossisten varje år de är heta (158 titlar med pixlade omslag; `tools/konsolspel.mjs` vaktar).
- **Arkadmaskiner** står på de små platserna, drar folk, drar in mynt – och går att
  **spela på riktigt**: klicka på kabinettet, mynt i, tre liv, highscore med initialer.
- **Varje titel är sitt eget spel.** `js/games/variants.js` ger alla 179 titlar (spel +
  arkadmaskiner) en egen variant – motor, hjälte, fiender, palett, bana och känsla: Mario bumpar
  ?-block, Sonic accelererar, rullar och fjädrar, Mega Man skjuter, Kong rullar tunnor, Zelda
  är rum för rum uppifrån, Boulder Dash gräver med fallande stenar, Minecraft gräver och bygger
  i sidovy, NHL 94 är hockey och FIFA fotboll, GTA är stad uppifrån med polis, Final Fight är
  gatuslagsmål, Tetris/Columns/Lumines är tre olika blockspel, SimCity bygger stad. Femton
  motorer i `js/games/`. **Era-filtret** (`era.js`) visar spelet som konsolen skulle: C64:s
  16 färger med dubbelbreda pixlar, Game Boy-grönt, CGA:s fyra färger på en tidig PC,
  NES/16-bit-posterisering – och grafikkortet i speldatorn (CGA/EGA/VGA) styr PC-spelens look.
- **Spelbordet**: sätt ihop butikens egen dator av delar i lagret och spela tidstypiska
  PC-spel med **FPS-räknare** i hörnet. För lite minne ger `Not enough memory`, fel
  grafikkort `This game requires VGA`, inget 3D-kort mjukvaruläge – och på minimikraven
  hackar det synligt. Nio små spelmotorer under `js/games/`.
- **Reparationsuppdrag**: var femte kund lämnar in en trasig dator. Den står på bänken,
  du kopplar in och startar, ser symptomet (rök, pip, `CPU FAN ERROR`, svart skärm …),
  öppnar lådan och lagar. Diagnosavgift direkt, resten när den fungerar. Felkatalogen
  ligger i `js/shops/dator/faults.js`; design i `docs/FELSOKNING.md`.

## Egna modeller och händelser (à la Game Dev Story)

- **🧩 Modeller**: sätt ihop en egen datormodell i tre steg – *användning* (speldator, kontor,
  skola, budget, mediastudio) × *målgrupp* (tonåringar, familjer, studenter, företag,
  pensionärer), delar ur årets grossistkatalog (auto-förslag eller välj själv), pris och
  lanseringskampanj (flygblad → tidningsannons → TV-reklam → nätkampanj). Kombinationerna
  har en **dold kompatibilitet** som man lär sig genom att prova.
- **Datormagazin testar** varje modell: fyra kritiker (teknik, pris, målgrupp, helhet) ger
  1–10 med citat; 32/40 är Hall of Fame och ger rykte. Betyget styr **postorder**-
  försäljningen (delarna dras ur lagret, så köp in till flera datorer) och hur ofta kunder
  kommer in och frågar efter modellen med namn – till fast pris. När delarna går ur tiden gör
  du en **uppföljare** (namnet får II, III …) med årets delar, ett snäpp bättre.
- **📰 Händelser** ur Sveriges datorhistoria dyker upp när åren går – Hemdatorvågen,
  Datormagazin startar, DOOM, Pentium FDIV-buggen, Windows 95-natten, Hem-PC-reformen,
  Y2K, kondensatorpesten, Thailand-översvämningen, kryptobristen, pandemin, chipbristen,
  AI-vågen … 35 stycken. Varje händelse är ett **val** (nattöppet LAN? byta processorer
  gratis? köpa in innan priset sticker? teckna avtal om 12 kontorsdatorer?) som styr
  kundflöde, tålamod, reparationsandel, vilka datorer kunderna vill ha, grossistens priser
  och modellförsäljningen i ett par år. Pågående händelser syns som en 📰-chip i HUD:en.
  Katalog i `js/shops/dator/events.js`, modellogik i `models.js`.

## Personal

- **👥 Personal** (från Gatuplan; fler platser med större lokal): sökande med stats 1–5
  (🔧 bygg, 🩺 service, 🛍️ sälj), lön varje månad (60 s), energi och humör. **Tekniker**
  tar beställningar som du inte rört till verkstaden och bygger/lagar dem själva – fart och
  stjärnor efter stat, halv fart när energin är slut; du kan alltid **ta över** ett bygge.
  **Säljare** tar emot kunden vid disken när delarna finns hemma och säljer på ett
  grafikkort ur lagret. Kurser (MS-DOS, lödkurs, Novell CNE, CompTIA A+, MCSE, CCNA …)
  ger +1 stat; jobb ger XP och nivåer. Obetalda löner sänker humöret – till uppsägning.

## Konkurrenten, bokslutet och galan

- **🏬 Konkurrenten** på andra sidan gatan (skylten syns i fönstret) byter skepnad med eran:
  Datahörnan (lokal butik) → ElektroCity (varuhuskedja, 1992) → Kompletta.se (nätbutik,
  2001) → Amazonas (jättesajt, 2013). Styrkan drar kunder från dig och sjunker med ditt
  rykte, din dragningskraft och din personal. Vartannat år gör den ett drag – priskrig,
  reklam, värvning av din personal – som du svarar på i händelsedialogen. Arga kunder säger
  vart de går i stället.
- **📒 Bokslut** i nyårsdialogen: intäkter, utgifter, resultat, kunder, löner, rykte och
  konkurrentens styrka för året som gick. **🏆 Galan** vid varje decennieskifte (och 2026)
  delar ut medaljer i ekonomi, service, rykte, modeller och butik – guld ger rykte.
  Allt syns under 📰 Händelser.

## Grossister och märkesprogram

- **🤝 Avtal** (knappen i Grossisten): välj grossist – Datagrossisten AB (snabb, ordinarie
  pris), Fjärran Östern Import (−12 %, lådan tar 2,5× så lång tid, 7 % risk att en del är
  trasig och reklameras), Nordisk Datalogistik (−7 %, avgift), Grossist.se (−10 %, avgift,
  från 2001). **Märkesprogram** (Intel, ATI, 3dfx, NVIDIA, AMD) kräver ett märkesbås nivå 2
  under 🏪 Butiken och ger rabatt på märkets delar plus 🪧 +1 – mot en avgift i månaden.
  Säljs båset avslutas programmet; kan avgifterna inte betalas spärras kontona.

## Tjänster och tillval

- **🛠️ Tjänster**: kunder som vill ha hjälp med datorn de har – systeminstallation,
  dataräddning (kräver dataräddningsstation, 1990), virussanering (antivirus-licens, 1996),
  nätverksinstallation (nätverksväska, 1998), vattenkylning (kylstation, 2008). Prylarna köps
  under 🏪 Butiken → Verkstad; utan dem är kunden låst och önskemålet hamnar på
  efterfrågantavlan. Fast pris; utförs från beställningskortet (⏳) eller av en tekniker.
- **⚙️ Tillval** på ett bygge (i kunddialogen): ⚡ överklocka (+12 %, ostabilt utan burn-in),
  🔥 burn-in-test (fast avgift, tar bort risken), 🛡️ 3 års garanti (+8 % och rykte).

## Avatar och co-op

- **👤 Min avatar** i menyn: bygg din figur (frisyr, kläder, glasögon, huvudbonad …),
  välj namn och färg. Avataren går runt i butiken – tryck på golvet för att gå.
- **👥 Spela tillsammans**: starta ett rum (du blir värd och väljer vilket sparat spel)
  eller gå med med en **rumskod på fyra bokstäver** (eller länken `?rum=ABCD`).
  Lobbyn visar alla spelare; värden öppnar butiken.
- Ni delar kassa, lager, lådor och kunder: en tar emot kunder, en packar upp, båda kan
  gå in i verkstaden och **bygga samma dator samtidigt** – ni ser varandras muspekare
  och vad kompisen håller i. Signaleringen går via offentliga MQTT-mäklare (EMQX, HiveMQ,
  Mosquitto – första som svarar), spelet går direkt via en WebRTC-datakanal när den öppnas och
  annars via mäklaren med kvittens och omsändning (lobbyn visar vilket). Värden kör spelet och
  sparar det.

## 3D-läget (🧊 3D i HUD:en)

Butiken går att gå runt i som ett riktigt 3D-rum – samma simulering (kunder, kö, personal,
lådor, montrar) som 2D-golvet, bara renderat på nytt sätt. Knappen **🧊 3D** i HUD:en växlar;
valet sparas (`pixelverkstan_3d`). 2D-läget finns kvar orört.

- **Rendering:** three.js 0.170 (import map → jsdelivr) med PBR-material och normal-/ARM-kartor
  från Poly Haven (CC0), HDRI-himmel utanför fönstren, sol med mjuka skuggor, takarmaturer
  (RectAreaLight), spotar, rummets egna reflektioner (kubkamera → miljökarta), GTAO, bloom,
  ACES-tonemapping och SMAA. Neon, LED-lister i montrarna och skärmar glöder.
- **Rummet** byggs ur samma planlösning som 2D (`floor-plans.js`/`floor-layout.js`):
  `js/3d/coords.js` mappar golvpixlar → meter (2 cm/px, zonen kring disken sträcks till 3 cm/px,
  rummet är en meter djupare med en gång längs bakväggen). Montrar/torn/TV-hörna/spelhylla/
  spelbord/arkadskåp/automater/lediga platser byggs i `units.js`, väggar/fönster/skjutdörr/
  disk/kassa/skåp/ljus/gata i `room.js`. Produkter är tryckta kartonger (`textures.js`:
  canvas-tryck med märke, namn, pixelikon, streckkod; spel/konsoler får sina pixelomslag).
- **Styrning:** klicka i bilden → muslås; W A S D går, musen tittar, klick/E använder det i
  siktet (kund, monter, låda, stjärnobjekt), Esc släpper musen, Q byter grafikkvalitet
  (hög/medel/låg; sänks automatiskt om bilden hackar). Pekskärm: dra för att titta, knappar
  för att gå. Kollision via 2D-gångnätet (`floor-walk.walkable`).
- **Människor:** `people.js` – tio riktiga **Mixamo-figurer** (`assets/3d/chars/*.glb`, 1,7–6 MB,
  laddas vid behov och byts in mot Xbot-platshållaren när de är klara; samma kund får alltid
  samma figur) med gå/stå/spring-animation från three.js-mannekängen Xbot, som läggs på
  Mixamo-skeletten (`retarget`: benprefix + höftens lägesspår skalas). Namnlapp och `!`-markör
  på kunden som står först. Kunder, personal, kompisar i co-op och folk på trottoaren följer
  simuleringens positioner. Nya figurer: exportera FBX från Mixamo (valfri animation, "with
  skin") till `assets/3d/mixamo/`, kör `python tools/fbx-textures.py` (plockar ut de inbäddade
  4096²-texturerna och skalar till 512) och `node tools/mixamo-convert.mjs` (FBX → glb utan
  morph targets/animationer, indexerad geometri, PBR-material; skriver `manifest.json`).
- **Byggläget i 3D (`js/3d/bench.js`):** datorn byggs på **arbetsbänken bakom disken** (under
  högra fönstret: bänk, antistatmatta, verktygstavla, bänklampa med spot). Klicka på bänken
  (eller 🔧 Bygg i listan) så låses kameran ovanför bänken i **samma vinkel som 2D-byggvyn**:
  en perspektivkamera (32°) i 30° lutning med riktiga höjder. Byggvyns `P.proj` byts ut mot
  projektion genom 3D-kameran medan bänken är aktiv, så hela pekarlogiken – platser,
  handgrepp, uttag, kablar, zoom/panorering, kompisars pekare – fungerar oförändrad. Scenen ritas av samma kod
  som i 2D (`rig.drawScene`) men varje låda blir en riktig 3D-låda med pixelgrafiken som
  textur på de tre synliga sidorna, packad i en texturatlas (två draw calls), belyst av rummet,
  lampan och skuggor. `#board` ritar bara kablar och markeringar ovanpå; klick i scenen
  raycastas mot lådorna (genomskinliga pixlar räknas inte). **Finalen** (datorn står på
  skrivbordet) ritas på samma sätt: skrivbordsscenen ligger rakt längs bänken i verklig skala
  (kameran vrids till 2D-vinkeln i stället; skrivbordslådan filtreras bort – bänken är bordet),
  skärmen, chassits sidofönster och **datorns baksida** är levande texturer på chassit, sladdarna
  3D-rör som ligger på bordet. Knappen **🔌 Baksidan** (eller att man tar en kontakt som hör
  dit) flyttar kameran bakom datorn, där uttagen träffas via projektion; en gul ring och texten
  "börja här" visar var man börjar. Efter bygget står du kvar vid bänken. **Dra i bilden**
  (eller ⟲ ⟳ ⤒ ⤓ bredvid zoomen) så snurrar kameran runt bygget inom ett fast intervall –
  ±100° i sidled och 7–70° elevation – så att man ser datorns front och sidor; Passa in
  återställer vinkeln. Nyp/＋/－ zoomar som förut.
- **Tillgångar:** `assets/3d/` (modeller, texturer, HDRI, Xbot), hämtade med
  `python tools/ph-fetch.py`; licenser i `assets/3d/LICENSES.md`.

## Hamburgerbaren

Andra verksamheten i menyn. Samma motor som datorbutiken (kunder, lager, grossist, lådor,
inredning, co-op) men med ett kök i stället för en verkstad:

- **Epoker 1955–2026:** femtiotalsdinern (pannbiff, rödbetssallad, patty melt, Oklahoma
  onion burger), sextiotalets bacon och milkshake, grillkiosken (korv i bröd, räksallad,
  bostongurka, tunnbrödsrullen), kycklingburgarens intåg, kedjan (kebab, chili cheese,
  bearnaise), vego och aioli, gourmetburgaren (brioche, chuck & brisket, tryffel) och
  smash/plantbaserat (wagyu, dry aged, chili crisp, vegansk fisk). Startår 1955, 1965,
  1975, 1985, 1996, 2005, 2016, 2022.
- **416 ingredienser** i nio kategorier (`js/shops/restaurang/menu.js`): 33 bröd (från
  formbröd och kaiser till bao, ramen, donut och våffla), 67 biffar (nöt i alla storlekar,
  kalv, fläsk, korv, kebab, älg, ren, vildsvin, bison, kyckling i sju varianter, fisk och
  skaldjur, lamm, 17 vegoalternativ), 33 ostar, 46 toppings, 40 grönsaker, 61 såser,
  40 tillbehör, 58 drycker (Cuba Cola, Trocadero, Pommac, milkshakes, slush, bubble tea …)
  och 38 efterrätter. Varje ingrediens har ett år, en nivå och ett eget utseende.
- **155 menyer** (`orders.js`): recept lager för lager med tillåtna ingredienser per lager,
  år, nivå, pris, kundrepliker och brödkrav. Kunden beställer det som finns i kylen (helst),
  ibland något som saknas, ibland får du välja drycken.
- **Köket** (`rig.js`): rosta brödet i brödrosten → underbrödet → lägg biffen på grillen,
  vänd, salta och peppra → lager i rätt ordning → toppbrödet (samma sort som under) →
  **fritösen** (sänk ner korgen, lyft upp) innan pommes, nuggets och lökringar läggs i fickan →
  **dryckesmaskinen** (tappa upp) innan muggen ställs på brickan (flaskor och burkar tas ur
  kylen under) → efterrätten sist. Råvaran kan **släppas direkt på stationen** (brödet på
  brödrosten, biffen på grillen, pommesen i fritösen, muggen vid maskinen) – det utför
  handgreppet, i hjälpläget likaväl som i proffsläget. Bara nästa lager i stapeln markeras, med
  en ring i stället för en fylld ruta så att burgaren syns. **Det som ligger färdigt på en station
  tas med handen**: tryck på eller dra från det rostade brödet på brödrosten, biffen på grillen,
  pommesen i korgen och muggen vid maskinen – inte via lådan. En hand guppar över det som går att
  ta, och stationen minns vilken råvara som lades på (`b.station`, följer med i co-op). Inget säljs över disk och det finns inga hyllor eller montrar
  i restaurangen: allt görs i köket. Köksutrustningen följer epoken (krom på femtiotalet,
  rostfritt i kedjan, svart stål 2016). Fakta om Maillard, kärntemperaturer, dubbelfritering
  m.m. i guiden.
- **Köket i 3D**: ingen låst byggbild som i datorbutiken. Du står vid disken, vänder dig om
  (dra i bilden) och jobbar vid köksbänken bakom dig med din egen kamera: klicka på brödrosten,
  grillen, fritösen, dryckesmaskinen och brickan, gå runt med W A S D. Lådan med råvaror och
  checklistan ligger ovanpå bilden (`shop.kitchen3d`, `view3d.enterKitchen`, bänken med
  `free`-kamera). Bänk, underskåp och stänkskydd är i rostfritt stål.
- **Servering** (`serve.js`): burgaren byggs på en tallrik; med 🍽️ Ställ på disken glider
  tallriken (med pommes, dryck och efterrätt) bort till luckan med värmelamporna. Kunden
  hämtar den där, säger sitt omdöme (beror på tid och kladd) och betalar, bär tallriken till
  ett bord, sätter sig och äter: burgaren lyfts mot munnen vid varje tugga, käkarna går, och
  burgaren blir mindre tills bara smulor och servetten är kvar. **Måltiden du byggde följer
  med fysiskt** (`shop.mealOf`): samma lager i samma ordning, pommes, mugg i dryckens färg och
  efterrätt ritas på tallriken vid luckan, i händerna på vägen till bordet och på bordet, och
  äts upp bit för bit. Pixelfigurerna har egna poser för att bära tallriken (armarna fram) och
  äta (händerna vid munnen). I 3D sjunker gästen ner på stolen och tuggar, tallrikarna byggs av
  samma lager, och gästerna spelar riktiga Mixamo-klipp: Stand To Sit, Sitting Idle, Sitting
  Talking (tuggorna), Sitting Drinking, Sit To Stand och Carrying (tallriken). Klippen exporteras
  från Mixamo på X Bot (Without Skin, FBX Binary, 30 fps) till `assets/3d/mixamo/anim/` och
  konverteras med `node tools/mixamo-anim.mjs` till små glb-filer i `assets/3d/anim/` (manifest med
  nycklar sit/sitIdle/eat/drink/stand/carry); `people.js` lägger dem på alla figurer med samma
  retargeting som idle/walk och tar bort höftens x/z-rörelse ur gångklipp som inte är In Place.
- **Inredning** (`upgrades.js`): läskkyl och dessertdisk som montrar, jukebox, godishylla,
  såsbar, lekhörna, kaffemaskin; lokaler Gatuköket → Megaburger; dubbelgrill, fritös,
  milkshakemaskin, menytavla; kylrum 2–4 för dyrare kött.
- **Grafik** (`art.js`): allt ritas som isometriska voxlar – runda lager (trappstegsrunda
  cylindrar), smält ost som droppar, delad korv, hyvlad parmesan, ringlade såser, pommes med
  topping, slushkupol, tapiokapärlor, mjukglass i strut, dammsugare, banana split.
  `tools/restaurang-ikoner.mjs` ritar alla ikoner i ett ark per kategori (`tools/out/rest-ikoner-*.png`).
- **Lokalen** (`floor-art.js`, `floor-plans.js`): helt egen inredning. Disken har två ytor: till
  vänster en **kyldisk med glasfront ut mot kunderna** där råvarorna i lagret ligger i skålar (bröd,
  biffar, ost, grönt, extra, såser i sina egna färger; högen växer med antalet och ritas om när
  lagret ändras) med **luckan (utlämning) ovanpå** – tallrikarna ställs fram på kyldiskens rostfria
  skiva och kunden hämtar dem där; till höger kassan (BESTÄLL) med kortterminal, menyställ, sugrör
  och servetter. Kön står alltså till höger och luckan till vänster (`plan.pickupLeft` speglar
  `QUEUE`/`PICKUP` i `floor-layout.js`; datorbutiken är oförändrad). Samma i 3D: glasdisk med
  brickor på diskens vänstra yta och tallrikarna ovanpå. På köksväggen där lagerhyllan satt sitter
  fläktkåpa, kakel och bongskenan. Dessutom menytavla med årets priser, rostfri köksbänk med läskmaskin, milkshakemaskin,
  fritös och grill, kassa efter epok, bricka och sugrör på disken, läskkyl och dessertdisk som
  montrar, jukebox, såsbar och lekhörna. **Epoken bestämmer stilen:** femtiotalsdiner (turkos,
  svartvitt golv, kromborden med röda stolar, konlampor), sextiotal, grillkiosk (brunt trä,
  orange globlampor), åttiotal (rosa/svart), snabbmatskedja (gult/rött, lysrör), 2005 (grönt
  och ljust trä), gourmet 2016 (tegel, betong, mörkt trä, Edison-lampor, kritmeny) och 2022
  (ljust nordiskt, digital meny). Matbord med stolar (sittbås i större lokaler) står i stället
  för stjärnmonter och soffa: kunderna sätter sig när de hämtat brickan, äter (burgaren blir
  mindre för varje tugga) och går sedan hem. I 3D-läget står samma bord med stolar och lampor i
  epokens stil i rummet, köksbänken bakom disken har läskmaskin, brickor, fritös och grill,
  montrarna är vita kylar med kallt ljus och dörren heter KÖKET.


```
js/3d/          3D-läget: shop3d.js (renderare, kamera, styrning, sikte), room.js, units.js,
                people.js, textures.js, assets.js, coords.js, bench.js (byggläget vid arbetsbänken)
js/core/        generisk motor – vet inget om datorer
  game.js       pengar, lager, årtal/XP, kunder, beställningar, sparning
  floor*.js     butiksgolvet med museimontrar + stjärnobjekt (årets finaste grafikkort)
  people.js     procedurgenererade pixelpersoner
  build.js      byggvyn: delar, handgrepp, kablar, lägen, kamera/zoom, final
  build-ui.js   lådan, checklistan, guiden, lägesval
  build-draw.js markeringar, uttagsetiketter, etikettrutor
  raster.js     isometrisk pixelrastrering (skarpa pixlar, klicktest per pixel)
  pixfont.js    3×5-pixelfont + textstämplar i texturer
  ui.js         HUD, dialoger, grossist (sök/filter/sidor, startpaket), lådor, lager, nytt år, museivy
  session.js    kommandon som ändrar spelet (körs hos värden i co-op)
  net.js        rum med fyrbokstavskod: MQTT-signalering (tre mäklare), WebRTC-datakanal, reserv via mäklaren
  coop.js       synk mellan värd och klienter (läge, kunder, avatarer, byggen, muspekare)
  build-ops.js  byggoperationer som delas mellan spelare
  floor-walk.js gångnät (A*) för avatarerna
  avatar.js     avatarredigeraren
js/shops/
  index.js      register över verksamheter (meny)
  dator/        Datorbutiken
    parts/          deldatabasen: en fil per kategori (12 000+ delar), canon.js (tidslinjen),
                    SCHEMA.md (fältbeskrivning), index.js (laddning + index per år)
    catalog.js      kategorier, epoker, specifikationsrader
    compat.js       kompatibilitet för alla epoker (sockel, minne, bussar, gränssnitt, nätagg)
    orders.js       kundmallar per epok, generator, startlager, guidade kunder
    rig.js          byggriggen per beställning: platser, handgrepp, kablar, uttag, regler, fakta
    rig-geo.js      chassi-/moderkortsgeometri (classic/modern), kortplatser, uttag på kortet
    rig-art.js      ritar byggscenen för riggen
    layout.js       ingång för motorn (rigFor)
    art-base.js     arbetsbänk, öppet chassi, moderkort per epok, kontrollerkort
    art-parts.js    alla delar i alla stilar (DIP-CPU … RTX 50), art-case.js stående chassin
    connectors.js   kontakttyper, pixlade kontaktikoner, kabelritning
    desk.js         finalen: skrivbord, inkoppling, startsekvens/felsökning
    desk-era.js     epokens skärm/tangentbord/mus/OS och baksidans uttag
    desk-props.js   skärm, tangentbord, mus; desk-art.js skärminnehåll, baksidan, insidan
  restaurang/   Hamburgerbaren
    menu.js         416 ingredienser (bröd, biff, ost, extra, grönt, sås, tillbehör, dryck, efterrätt), epoker, höjder
    orders.js       155 menyer med recept per lager, generator, start, guidade kunder, priser
    rig.js          köket: brödrost, grill (lägg på/vänd/salta), lagren på brickan, ficka och dryck
    art.js          isometrisk grafik för alla former + ikoner
    serve.js        finalen: servera brickan, kunden smakar och betalar
    upgrades.js     läskkyl/dessertdisk, jukebox m.m., lokaler Gatuköket → Megaburger, kylrum
    products.js     drycker och efterrätter över disk (hype per år)
    index.js        modulens kontrakt + texter för byggvyn (shop.text)
tools/          tester och verktyg
```

## Lägga till en ny verksamhet (t.ex. hamburgerbar eller bilverkstad)

Skapa `js/shops/<namn>/index.js` som exporterar samma form som
`js/shops/dator/index.js` och koppla in den i `js/shops/index.js`:

- **katalog** – `cats`, `catOrder`, `parts` (id, cat, name, cost, lvl …), `levels`
- **layout** – `VIEW`, `SLOTS` (plats, kategori, `requires`, `hl`, `anchor`), `ACTIONS`
  (handgrepp med punkter, t.ex. "salta" eller skruvar), `CABLES` + uttag (`availablePorts`,
  `portPos`, `canConnect`), `STEPS` (hjälpens ordning), `canPlace`, `canRemove`, `onRemove`,
  `standCheck`, `fact`, `drawScene`, `drawCables`, `connectorIcon`
- **Finale** – klass som testar produkten (datorn: skrivbordet; restaurang: servera och smaka)
- **beställningar** – `start` (pengar + lager), `tutorialOrder`, `generateOrder`, `priceFor`, `feeFor`, `xpFor`
- **utseende** – `sign`, `theme` (färger för butiksgolvet), `icon(part)`

Motorn (kunder, ekonomi, drag/släpp, guide, dialoger) återanvänds oförändrad.

## Tester

Starta servern och kör t.ex.:

```
node tools/validate-parts.mjs            # deldatabasen: schema, årtal, täckning per år, korskontroller
node tools/era-logic.mjs 1983 2026 6     # kundbyggen varje år byggs via riggen och startar felfritt
node tools/era-faults.mjs 1985 1998 2024 # varje glömd kabel/kontakt/jumper ger rätt symptom
node tools/erabuild.mjs 1990 c90 help    # hel kund via klick/drag i webbläsaren från valfritt år
node tools/e2e.mjs                       # butik → bygge → skrivbord → leverans → betalt
node tools/era-start.mjs                 # startårsval, laddtid, butik och grossist 1983
node tools/slots.mjs                     # sparningar per startår: byta år, fortsätta, börja om
node tools/shopflow.mjs                  # tom butik → startpaket → låda → packa upp → kund
node tools/coop.mjs [url]                # två webbläsare: lobby, delad butik, bygga ihop, muspekare (url?nortc=1 = allt via mäklaren)
node tools/avatar.mjs                    # avatarredigeraren
node tools/mobile.mjs                    # mobilvy (iPhone 13)
node tools/zoom.mjs                      # renderingstider vid zoom
node tools/customers.mjs 1991 fast       # kundflöde i Node över flera år (0 omöjliga, 0 köpfel)
node tools/shopfit.mjs                   # sliten lokal → bås → hänglås → renovering → Datorhuset
node tools/produkter.mjs                 # TV-hörna, spelhylla, arkad, köp in, sälj över disk
node tools/spel.mjs                      # spela på arkadmaskin, sätt ihop speldatorn, FPS
node tools/repair.mjs 3                  # reparationer i Node: alla fel läggs in och går att laga
node tools/laga.mjs [url] 1999           # reparation i webbläsaren: bänk → symptom → laga → betalt
node tools/byt.mjs                       # sunkig start, grafikkort tidigt, byt/lägg till delar ur lagret, lokal 2–6
node tools/konsolspel.mjs                # Node: varje konsol har spel varje år den är het, PC-spel har systemkrav
node tools/modeller.mjs                  # egna modeller: guiden, recensionen, postorder, uppföljare, händelse med val, avtal
node tools/handelser.mjs                 # Node: alla händelser giltiga, auto-förslag byggbara varje år, betyg 1–10
node tools/personal.mjs                  # personal: anställ, säljaren tar emot, teknikern bygger, ta över, kurs, lön, sparka
node tools/rival.mjs                     # konkurrenten: skylt, styrka, drag med val, arg kund, bokslut + gala 2000
node tools/avtal.mjs                     # grossister och märkesprogram: rabatt, leveranstid, bås-krav, avgifter
node tools/tjanster.mjs                  # tjänster (låst utan pryl, utför från kortet, teknikern) och tillval på bygget
node tools/spelvarianter.mjs             # Node: alla 179 titlar kör 600 steg i sin motor, varianter skiljer sig, eran följer konsolen
node tools/spel2.mjs                     # nio titlar spelas i webbläsaren – olika motorer och era-look, skärmdumpar titel-*.png
node tools/lokaler.mjs                   # sex lokaler: egen planlösning, fler platser, alla väntplatser nåbara, inredningen följer med
node tools/3d.mjs [--snabb]              # 3D-läget: laddar, bygger Källarhålan + Kvartersbutiken, skärmdumpar 3d-*.png, sikte + klick på kund
node tools/bygg3d.mjs                    # byggläget i 3D: bänken, kameran matchar 2D-projektionen, delar i, klicktest, zoom, ut igen
node tools/restaurang-rig.mjs            # Node: hamburgerbarens katalog, alla 155 menyer görbara varje år, köksreglerna steg för steg, alla former ritar
node tools/restaurang.mjs                # hamburgerbaren i webbläsaren: meny → grossist → guidad kund → kök → servera → betalt
node tools/restaurang3d.mjs              # hamburgerbaren i 3D: stor burgare i 2D-köket, köket på bänken, servering i 3D
node tools/restaurang-ikoner.mjs         # ritar alla ingrediensers ikoner i ark per kategori (rest-ikoner-*.png)
node tools/restaurang-golv.mjs           # restaurangens golv genom epokerna med fyllda montrar, automater och gäster som äter (rest-golv-<år>.png)
node tools/restaurang-anim.mjs           # 3D: Mixamo-klippen laddas, gäster som sitter spelar sitt-/ätklipp, den som bär spelar bärklippet (rest-anim-*.png)
node tools/mixamo-anim.mjs [filter]      # konverterar Mixamo-animationer (Without Skin) i assets/3d/mixamo/anim/ till assets/3d/anim/*.glb + manifest
tools/art-styles.html, tools/art-icons.html  # alla delars stilar och ikoner
```

Webbläsartester kan starta direkt i ett år med `index.html?year=1990`.
Skärmdumpar hamnar i `tools/out/` (ignoreras av git).
