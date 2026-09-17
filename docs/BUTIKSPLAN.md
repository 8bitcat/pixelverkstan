# Butiksplan: köp in, inred och locka kunder

Plan för nästa steg i Pixelverkstan. Idag köper man **delar** som ställs ut i montrar,
och kunderna beställer det de ser. Nästa lager är att man köper **saker till butiken**:
inredning, skyltning och verkstadsutrustning som ger konkreta fördelar och gör att fler
(och bättre) kunder kommer in. Allt ska gå att bygga ut per epok och fungera i co-op.

Filer som berörs: `js/core/game.js` (ekonomi, kundflöde), `js/core/floor*.js` (butiksgolvet),
`js/core/ui.js` (dialoger), `js/core/session.js` (kommandon), `js/shops/dator/index.js`
(butiksspecifik lista), ny `js/shops/dator/upgrades.js` (själva sakerna), ny `js/core/shopfit.js`
(placering på golvet).

---

## 1. Grundidé och ny loop

```
köp delar  →  ställ ut i montrar  →  kunder beställer
   ↑                                        ↓
köp inredning ← pengar ← bygg och leverera ←┘
```

Tre nya mätvärden som styr kundflödet, alla synliga i HUD:en:

| Mätvärde | Vad det gör | Hur det höjs |
|---|---|---|
| **Dragningskraft** (🪧) | hur ofta kunder kommer in | skyltar, skyltfönster, demodator, öppettider |
| **Trivsel** (😊) | hur länge kunder orkar vänta (tålamod ×) | soffa, kaffe, tv, musik, växter, ren butik |
| **Rykte** (⭐) | hur dyra datorer kunderna beställer (tier) | stjärnor på levererade datorer, demodator, recensioner |

Formler (utgångsläge, justeras vid balansering):

```js
spawnTimer = base(år, nivå) / (1 + 0.12 * drag)        // drag 0–20
patienceMax = grund * (1 + 0.05 * trivsel)             // trivsel 0–20
tierChans   = klamp(1 + rykte / 8, 1, 5)               // styr vilka kundmallar som lottas
maxKö       = 3 + antal extra diskar
```

Allt räknas i `game.js` av **värden** i co-op och skickas med i `econ`-synken.

---

## 2. Vad man kan köpa (förslag med effekt och pris)

Priserna är i kronor för startåret 1991 och skalas med `SEK_PER_USD`-liknande faktor per epok
(en enkel `prisFörÅr(bas, år)`). Varje sak har `year`/`until` precis som delarna, så en
LED-skylt inte går att köpa 1985.

### 2.1 Skyltning och fönster (dragningskraft)
| Sak | År | Pris | Effekt |
|---|---|---|---|
| Trottoarskylt (A-skylt) | 1983– | 400 | drag +1 |
| Skyltfönsteraffisch ("REA!") | 1983– | 300 | drag +1, +10 % chans till fyndkunder |
| Neonskylt i fönstret | 1985– | 1 800 | drag +2, syns på gatan (redan ritad – gör den köpbar) |
| Skyltfönster med **demodator** | 1983– | 1 200 + datorn | drag +3 och kunderna beställer liknande datorer (se 2.5) |
| Lysande logoskylt på taket | 1996– | 6 000 | drag +4 |
| Hemsida / annons i datortidning | 1997– | 2 500/år | drag +3, +1 rykte |
| Sociala medier-konto | 2010– | 1 500/år | drag +5 om rykte ≥ 10, annars +1 |

### 2.2 Montrar och hyllor (plats att skylta med)
| Sak | År | Pris | Effekt |
|---|---|---|---|
| Extra glasmonter | 1983– | 2 500 | +1 monter (fler kategorier syns, +6 utställda delar) |
| Väggkrokar/hylla | 1983– | 900 | +3 platser på vägghyllan |
| Stjärnmonter med sammet + spot | 1990– | 4 500 | 1 "stjärnplats": delen ger drag +2 och rykte +1 |
| Roterande skyltdisplay | 2000– | 3 200 | montern visar 8 delar i stället för 6 |
| Glasdisk vid kassan | 1996– | 2 000 | +4 platser för små delar (RAM, CPU) |
| Lagerhylla i förrådet | 1983– | 1 500 | förrådet rymmer fler delar innan man måste ställa ut |

### 2.3 Trivsel (kunderna väntar längre och blir gladare)
| Sak | År | Pris | Effekt |
|---|---|---|---|
| Soffa och bord (finns redan) | – | – | grund |
| Kaffeautomat | 1983– | 2 200 | trivsel +3, 5 % dricks |
| Tidningar och kataloger | 1983– | 200 | trivsel +1 |
| Krukväxter | 1983– | 400 | trivsel +1 |
| TV med demo/spel | 1991– | 3 500 | trivsel +3, barnkunder stannar dubbelt så länge |
| Arkadmaskin | 1991– | 7 000 | trivsel +5, drar barnkunder (drag +2) |
| Stereo/musik | 1985– | 1 200 | trivsel +2 |
| Luftkonditionering | 2000– | 5 000 | trivsel +2, verkstaden blir 3 °C svalare (se 2.4) |
| Ny golvmatta / kaklat golv | 1983– | 1 800 | trivsel +2, butiken ser fräschare ut |

### 2.4 Verkstaden (bygget går bättre)
| Sak | År | Pris | Effekt |
|---|---|---|---|
| Bättre arbetslampa | 1983– | 600 | markeringar syns även i proffsläget (svag glöd) |
| Antistatmatta + armband | 1983– | 900 | 20 % mindre risk för "statiskt" fel (se felsökningsscenarierna) |
| Elektrisk skruvdragare | 1990– | 1 400 | skruvsteg går på ett klick i stället för per hål |
| Verktygsvagn | 1996– | 2 600 | kablarna sorterade: kabelsteg tar 25 % kortare tid |
| Extra arbetsbänk | 1996– | 9 000 | två datorer kan byggas samtidigt (viktigt i co-op) |
| Testbänk (POST-kort) | 1996– | 3 000 | visar felkod direkt i byggvyn i stället för bara vid start |
| Tryckluft och dammsugare | 2000– | 1 200 | reparationsuppdrag går snabbare (se FELSOKNING.md) |

### 2.5 Demodator och utställda datorer (djupet)
- Man bygger en dator **åt butiken** (inte åt en kund) och ställer den i skyltfönstret
  eller på disken. Den kostar delarna men ger:
  - **drag +3** och **rykte +1** medan den står framme,
  - kunderna börjar beställa **liknande datorer**: generatorn viktar kundmallar mot
    demodatorns nivå (`tier`) och epok (t.ex. en gamingdator i fönstret ger fler
    gamingkunder),
  - en kund kan **köpa demodatorn direkt** (snabb inkomst, då försvinner bonusen).
- Flera platser: skyltfönster (1), disk (1), stjärnmonter (1 del, inte hel dator).
- Naturlig fortsättning på det som redan finns: `shop.heroFor(game)` visar årets finaste
  grafikkort i stjärnmontern – nu blir montern en plats man själv fyller.

### 2.6 Personal (senare etapp)
| Sak | År | Pris | Effekt |
|---|---|---|---|
| Deltidshjälp (pixelfigur) | – | 300/dag | packar upp lådor automatiskt |
| Säljare | – | 500/dag | tar emot kunder i kön när ingen spelare är vid disken |
| Tekniker | – | 800/dag | bygger enkla datorer långsamt själv |

Personal är också ett bra sätt att göra ensamspel mindre stressigt när butiken växer.

---

## 3. Placering på golvet

- Varje sak har `spots: ['fönster' | 'vägg' | 'golv-vänster' | 'hörn' | 'disk' | 'verkstad']`
  och en pixelritning (samma stil som `floor-props.js`).
- Nytt läge **"🏪 Inred butiken"**: golvet visas med rutor där saker får stå; valda saker
  kan flyttas med drag (samma mönster som byggvyn). Kunder går runt möblerna via
  `floor-layout.js` (hinderlistan byggs om när något placeras) och avatarerna via
  `floor-walk.js` (rutnätet räknas om).
- Allt sparas i `game.shopfit = { köpta: [id], placering: { id: [x, y] } }` och skickas i
  `econ`-synken så kompisarna ser samma butik.

---

## 4. Ordning att bygga i (etapper)

1. **Etapp 1 – ramverket**: `upgrades.js` med 8–10 saker (skylt, kaffe, extra monter,
   antistatmatta, skruvdragare, växt, matta, affisch), köpdialog "🏪 Butiken" som en flik
   i grossisten, `game.shopfit`, effekter på `spawnTimer` och `patienceMax`, ikoner i HUD.
   Saker dyker upp på fasta platser (ingen fri placering än).
2. **Etapp 2 – demodator**: bygga åt butiken, ställa i fönstret/disken, viktad
   kundgenerering, kund kan köpa demodatorn.
3. **Etapp 3 – fri placering**: inredningsläge med rutnät, drag och flytt, hinder räknas om.
4. **Etapp 4 – rykte**: stjärnor ger rykte, rykte styr kundmallar och dricks; recensioner
   som små pratbubblor ("4 av 5 – snabb service!").
5. **Etapp 5 – personal**: en anställd avatar som gör en syssla, styrd av värden i co-op.

Varje etapp ska ha ett eget testverktyg i `tools/` (t.ex. `tools/shopfit.mjs`) och en
simulering som visar att kundflödet ökar rimligt (som `tools/customers.mjs`).

---

## 5. Balans och fällor att undvika

- **Inte pay-to-win:** dragningskraft ökar antalet kunder men inte betalningen direkt;
  det är fortfarande bygget som ger pengar.
- **Tak:** drag och trivsel toppar vid 20 (spawn max ~3,4× snabbare, tålamod max +100 %).
- **Kö och plats:** fler kunder kräver fler väntplatser, annars går de hem arga –
  därför ska soffor/stolar också höja `MAX_QUEUE`.
- **Epok:** allt måste gå att köpa i sin tid; en arkadmaskin 1983 är fel, en hemsida 1985 likaså.
- **Co-op:** alla köp går via kommandon i `session.js` så att värden räknar, och `econ`
  skickar `shopfit` vidare. Placering ska ha en enkel låsning (den som drar äger saken
  tills den släpps).
- **Sparning:** `shopfit` in i sparfilen (version 4) med migrering från v3.
