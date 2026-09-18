# Pixelverkstan

Ett pixelspel där kunder kommer in i butiken och beställer något som du bygger ihop
i verkstaden. Första verksamheten är **Datorbutiken**: över **12 000 riktiga
komponenter från 1983 till 2026** (IBM, Intel, AMD, 3dfx, NVIDIA, Creative, Corsair,
Samsung …) byggs ihop i en isometrisk vy, och spelet lär ut datorarkitektur
(systembuss, minneshierarki, pipeline, von Neumann) och datorhistoria.

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

- **Lokalen** börjar som *Källarhålan*: plywood för fönstret, spindelväv, sprickor och tre
  platser. Sex lokaler att jobba sig upp genom – Gatuplan (4 platser), Kvartersbutiken (5),
  Hörnbutiken (6), Datorhuset (8 + arkadrum) och Megastore (röd matta, mässing, extra
  spotlights). 🏪 Butiken visar platserna med pixelförhandsvisning av allt som går att köpa;
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
- **Spelbordet**: sätt ihop butikens egen dator av delar i lagret och spela tidstypiska
  PC-spel med **FPS-räknare** i hörnet. För lite minne ger `Not enough memory`, fel
  grafikkort `This game requires VGA`, inget 3D-kort mjukvaruläge – och på minimikraven
  hackar det synligt. Nio små spelmotorer under `js/games/`.
- **Reparationsuppdrag**: var femte kund lämnar in en trasig dator. Den står på bänken,
  du kopplar in och startar, ser symptomet (rök, pip, `CPU FAN ERROR`, svart skärm …),
  öppnar lådan och lagar. Diagnosavgift direkt, resten när den fungerar. Felkatalogen
  ligger i `js/shops/dator/faults.js`; design i `docs/FELSOKNING.md`.

## Avatar och co-op

- **👤 Min avatar** i menyn: bygg din figur (frisyr, kläder, glasögon, huvudbonad …),
  välj namn och färg. Avataren går runt i butiken – tryck på golvet för att gå.
- **👥 Spela tillsammans**: starta ett rum (du blir värd och väljer vilket sparat spel)
  eller gå med med en **rumskod på fyra bokstäver** (eller länken `?rum=ABCD`).
  Lobbyn visar alla spelare; värden öppnar butiken.
- Ni delar kassa, lager, lådor och kunder: en tar emot kunder, en packar upp, båda kan
  gå in i verkstaden och **bygga samma dator samtidigt** – ni ser varandras muspekare
  och vad kompisen håller i. Nätverket är WebRTC via PeerJS; värden kör spelet och
  sparar det.

## Struktur

```
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
  net.js        PeerJS-rum med fyrbokstavskod
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
node tools/coop.mjs                      # två webbläsare: lobby, delad butik, bygga ihop, muspekare
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
tools/art-styles.html, tools/art-icons.html  # alla delars stilar och ikoner
```

Webbläsartester kan starta direkt i ett år med `index.html?year=1990`.
Skärmdumpar hamnar i `tools/out/` (ignoreras av git).
