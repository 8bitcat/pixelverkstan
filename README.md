# Pixelverkstan

Ett pixelspel där kunder kommer in i butiken och beställer något som du bygger ihop
i verkstaden. Första verksamheten är **Datorbutiken**: riktiga komponenter
(Intel, AMD, NVIDIA, Corsair, Samsung …) byggs ihop i en isometrisk vy, och
spelet lär ut datorarkitektur (systembuss, minneshierarki, pipeline, von Neumann).

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
5. **Kablar**: dra varje kabel (pixlade kontakter) till rätt uttag – 24-pin,
   8-pin CPU, PCIe/12V-2x6, SATA, CPU_FAN/SYS_FAN, ARGB, frontpanel, USB 3.0, ljud.
   Fel form går inte; rätt form i fel uttag (t.ex. kylaren i SYS_FAN) märks vid start.
6. **Skrivbordet**: datorn ställs upp (glassida med RGB). Koppla in ström,
   skärm (HDMI – till grafikkortet!), skärmens ström, tangentbord och mus på
   baksidan, slå på nätagget och tryck på startknappen.
7. Startsekvensen visar vad som är fel: ingenting händer, svart skärm,
   "Ingen signal", CPU FAN ERROR, ingen startenhet, överhettning … Felsök
   (öppna datorn eller kolla kablarna) och starta igen.
8. Kunden hämtar vid utlämningen och betalar. Erfarenhet ger nya nivåer och delar.

De tre första kunderna är guidade.

## Struktur

```
js/core/        generisk motor – vet inget om datorer
  game.js       pengar, lager, XP/nivåer, kunder, beställningar, sparning
  floor.js      butiksgolvet med montrar + kundernas vägar
  people.js     procedurgenererade pixelpersoner
  build.js      byggvyn: delar, handgrepp, kablar, lägen, final
  build-ui.js   lådan, checklistan, guiden, lägesval
  build-draw.js markeringar, uttagsetiketter, etikettrutor
  raster.js     isometrisk pixelrastrering (skarpa pixlar, klicktest per pixel)
  pixfont.js    3×5-pixelfont + textstämplar i texturer
  ui.js         HUD, dialoger, grossist
js/shops/
  index.js      register över verksamheter (meny)
  dator/        Datorbutiken
    catalog.js      riktiga delar (RTX 5080, Ryzen 9800X3D, Core Ultra …)
    geom.js         byggvyns geometri, uttag, skruvhål, fläktplatser
    art-*.js        pixelgrafik (chassi, moderkort, delar, stående chassi)
    connectors.js   kontakttyper, pixlade kontaktikoner, kabelritning
    layout.js       regler: platser, handgrepp, kablar, kontroller, fakta
    desk.js         finalen: skrivbord, inkoppling, startsekvens/felsökning
    desk-art.js     insidan bakom glaset, skärminnehåll, baksidan
    orders.js       kunder, guidade beställningar, generator
tools/          Playwright-tester
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
node tools/fullbuild.mjs 0 f help   # hel kund via klick/drag: montering → kablar → skrivbord → start
node tools/fullbuild.mjs 2 p pro    # samma i proffsläge
node tools/faults.mjs               # varje glömd sak ger rätt symptom vid start
node tools/logic.mjs                # 1500 slumpade beställningar: delar + kablar går ihop
node tools/mobile.mjs               # mobilvy (iPhone 13)
tools/art.html                      # förhandsvisning av all pixelgrafik
```

Skärmdumpar hamnar i `tools/out/` (ignoreras av git).
