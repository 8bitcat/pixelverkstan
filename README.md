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

1. Kunden går in och ställer sig vid disken → tryck på kunden (❗).
2. Beställningen visar vad som finns i lager ✓ och vad som saknas ✗.
   Saknade delar kan köpas in direkt om du har råd, annars tackar du nej.
3. Välj byggläge: **med hjälp** (markeringar, checklista, förklaringar) eller
   **utan hjälp** (proffsläge, +15 % betalt – misstag märks först vid start).
4. **Montering** i det öppna chassit: sätt i delarna, skruva fast moderkort,
   M.2, grafikkort och nätagg, lås sockelspaken, stryk kylpasta.
5. **Kablar**: dra varje kabel (pixlade kontakter) till rätt uttag – epokens egna:
   P8/P9, ATX 20/24-pin, ATX12V/EPS, Molex, Berg, IDE/diskett/MFM-flatkablar, SATA,
   PCIe/12V-2x6, CPU_FAN/SYS_FAN, ARGB, frontpanel, USB, ljud, CD-ljud.
   Fel form går inte; rätt form i fel uttag (t.ex. P8/P9 omvända) märks vid start.
6. **Skrivbordet**: datorn ställs upp. Koppla in ström, skärm (DE9/VGA/DVI/HDMI –
   till grafikkortet!), skärmens ström, tangentbord (DIN/PS/2/USB) och mus
   (serieport/PS/2/USB) på baksidan, slå på nätagget och tryck på startknappen
   (AT-datorer startar direkt med den röda strömbrytaren).
7. Startsekvensen visar vad som är fel: ingenting händer, svart skärm,
   "Ingen signal", CPU FAN ERROR, ingen startenhet, överhettning … Felsök
   (öppna datorn eller kolla kablarna) och starta igen.
8. Kunden hämtar vid utlämningen och betalar. Erfarenhet ger nya nivåer och delar.

De tre första kunderna är guidade.

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
  ui.js         HUD, dialoger, grossist (sök/filter/sidor), nytt år, museivy
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
node tools/mobile.mjs                    # mobilvy (iPhone 13)
node tools/zoom.mjs                      # renderingstider vid zoom
tools/art-styles.html, tools/art-icons.html  # alla delars stilar och ikoner
```

Webbläsartester kan starta direkt i ett år med `index.html?year=1990`.
Skärmdumpar hamnar i `tools/out/` (ignoreras av git).
