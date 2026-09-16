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
3. I verkstaden drar du delarna till rätt plats, stryker kylpasta, kopplar kablar
   och startar datorn. Fel sockel/minnestyp/storlek förklaras direkt.
4. Kunden hämtar vid utlämningen och betalar (delar + montering + dricks).
5. Erfarenhet ger nya butiksnivåer och nya delar hos grossisten.

De tre första kunderna är guidade.

## Struktur

```
js/core/        generisk motor – vet inget om datorer
  game.js       pengar, lager, XP/nivåer, kunder, beställningar, sparning
  floor.js      butiksgolvet (256×192 px) + kundernas vägar
  people.js     procedurgenererade pixelpersoner
  build.js      byggvyn: drag/släpp, regler, guide, uppstart
  build-draw.js markeringar, kablar, etiketter, uppstartsanimation
  raster.js     isometrisk pixelrastrering (skarpa pixlar, klicktest per pixel)
  ui.js         HUD, dialoger, grossist
js/shops/
  index.js      register över verksamheter (meny)
  dator/        Datorbutiken: katalog, grafik, byggregler, beställningar
tools/          Playwright-tester (play, tutorial, choice, logic, mobile)
```

## Lägga till en ny verksamhet (t.ex. hamburgerbar eller bilverkstad)

Skapa `js/shops/<namn>/index.js` som exporterar samma form som
`js/shops/dator/index.js` och koppla in den i `js/shops/index.js`:

- **katalog** – `cats`, `catOrder`, `parts` (id, cat, name, cost, lvl …), `levels`
- **layout** – `VIEW`, `SLOTS` (plats, kategori, `requires`, `hl`-rektangel, `anchor`),
  `ACTIONS` (handgrepp, t.ex. "salta"), `CABLES` (kopplingar), `canPlace`, `canRemove`,
  `bootCheck` (slutkontroll), `fact` (lärotexter), `drawScene` (ritar bygget i rastern),
  `BUS`/`CONCEPTS` (slutanimationen)
- **beställningar** – `start` (pengar + lager), `tutorialOrder`, `generateOrder`, `priceFor`, `feeFor`, `xpFor`
- **utseende** – `sign`, `theme` (färger för butiksgolvet), `icon(part)`

Motorn (kunder, ekonomi, drag/släpp, guide, dialoger) återanvänds oförändrad.

## Tester

Starta servern och kör t.ex.:

```
node tools/tutorial.mjs   # spelar de tre guidade kunderna via klick/drag
node tools/logic.mjs      # 1500 slumpade beställningar ska gå att bygga och starta
node tools/choice.mjs     # valfria delar + misslyckad uppstart
node tools/mobile.mjs     # mobilvy (iPhone 13)
```

Skärmdumpar hamnar i `tools/out/` (ignoreras av git).
