# Buggsökning i Pixelverkstan — när spelet krånglar

Färdiga scenarier med symptom → trolig orsak → hur man återskapar → var i koden felet
sitter. Säg bara "läs docs/BUGGSOKNING.md och kolla A3" så vet jag var jag ska börja.

Letar du efter *reparationsuppdragen i spelet* (kund kommer med en trasig dator) ligger de
i [FELSOKNING.md](FELSOKNING.md).

---

## Snabbstart för varje felsökning

```bash
cd /d/GamesProjects/pixelverkstan
python -m http.server 8777 --bind 127.0.0.1        # servern (kör redan i sessionen ibland)

node tools/customers.mjs fast                      # kundflöde, alla startår, årsskiften
node tools/shopflow.mjs                            # hela butiksloopen i webbläsare
node tools/era-logic.mjs                           # 88 genererade bygg 1983–2026
node tools/era-faults.mjs                          # felsymptom vid skrivbordstestet
node tools/coop.mjs && node tools/coop5.mjs        # 2 och 5 spelare
node tools/slots.mjs && node tools/validate-parts.mjs
```

Användbara adresser:

| URL | Vad |
|---|---|
| `http://127.0.0.1:8777/?year=1995` | starta direkt på ett år (hoppar över menyn) |
| `http://127.0.0.1:8777/?rum=ABCD` | gå med i ett rum direkt |
| `https://8bitcat.github.io/pixelverkstan/` | skarpa versionen |

Allt tillstånd ligger i `localStorage`: `pixelverkstan_save_<butik>_<år>`, `pixelverkstan_avatar`,
`pixelverkstan_avatars`. Tömmer man dem börjar allt om.

---

## A1. "Det kommer inga nya kunder"

**Symptom:** butiken står tom, ingen går in genom dörren, ofta efter ett årsskifte.

**Troliga orsaker (i tur och ordning):**
1. Guidade kunden (`tutorialStep`) väntar på att något särskilt ska stå utställt, men delen
   är redan såld → `tutorialReady(o)` blir aldrig sant. *Fixat: bara första kunden väntar,
   90 s säkerhetsventil.*
2. Inget står utställt (`hasShown()` falskt) och spawnspärren stänger av kunder helt.
   *Fixat: kunder kommer ändå, med 1,6× längre intervall.*
3. Kön är full (`queue().length >= MAX`) för att en kund fastnat i `phase` som aldrig byts.
4. `spawnTimer` räknas inte ner för att `tick` stannat (fliken i bakgrunden, fel i `update`).

**Återskapa:**
```bash
node tools/customers.mjs fast     # hoppar ett år efter varje kund, alla startår
```
Räknar ut "kunder per år" och skriver `inga kunder på N s` om det står still.

**Var i koden:** `js/core/game.js` – `tick()`, `spawnTimer`, `spawn()`, `tutorialReady()`,
`hasShown()`, `queue()`.

---

## A2. "Det står *säljs inte längre* och jag kan inte tacka nej"

**Symptom:** en beställning innehåller en del som gått ur tiden; knappen för att köpa in är
död och kunden går inte att bli av med.

**Trolig orsak:** beställningen skapades ett år, delen slutade säljas ett senare år.
`toBuyFor` filtrerar bort delen, men beställningen ligger kvar.

**Så ska det fungera nu:** `game.refreshOrder(order)` körs i `spawn()` och vid varje årsskifte
och byter delen mot något likvärdigt som passar resten (mb + cpu byts i par). Går det inte
att hitta någon ersättare markeras raden `gone`, dialogen visar "🛑 Går inte att bygga" och
**Tacka nej** finns alltid.

**Återskapa:**
```bash
node tools/customers.mjs fast     # skriver "0 omöjliga, 0 köpfel" när det är rätt
```

**Var i koden:** `js/shops/dator/orders.js` – `fixOrder`, `replacementFor`, `fitsWith`,
`sellable`; `js/core/game.js` – `refreshOrder`, `hasGone`, `toBuyFor`; `js/core/ui.js` –
orderdialogen (`gone` / `waiting`).

---

## A3. "Alla spelare heter Du" / "Jag ser inte min kompis"

**Symptom:** flera figurer med samma namn, eller en spelare som inte syns fast hen är inne.

**Troliga orsaker:**
1. Spelaren har ingen avatar → namnet blir "Du". *Fixat: avatarväljare tvingas fram vid join.*
2. Två flikar med samma `pid` (omladdning) → dubbletter. *Fixat: dedupe på `pid`.*
3. Gamla spöken från tappade anslutningar (PeerJS `close` kommer ofta aldrig).
   *Fixat: hjärtslag var 12:e sekund, `bye` vid `beforeunload`.*
4. Anslutningen gick aldrig igenom (NAT) → TURN-servern behövs.

**Återskapa:**
```bash
node tools/coop.mjs               # två spelare
node tools/coop5.mjs              # fem spelare, chatt, join-bygge, spöken, omladdning
node tools/avatar.mjs             # avatarval och sparade profiler
```

**Var i koden:** `js/core/coop.js` (CoopHost/CoopClient, `seen`, `drop`, unika namn),
`js/core/net.js` (ICE-servrar), `js/main.js` (`requireName`, `PID`, `?rum=`),
`js/core/avatar.js` (`openAvatarPicker`, `listAvatars`).

---

## A4. "Muspekaren/bygget synkar inte"

**Symptom:** kompisens pekare står still, eller en del man satt i syns inte hos den andre.

**Troliga orsaker:**
1. `bop`-meddelandet kom fram men operationen var inte idempotent → olika tillstånd.
2. Klienten gick med mitt i ett bygge och fick aldrig `bsnap` (hela bygget).
3. Värden startade om byggvyn och gamla lyssnare låg kvar (`canvas._buildOff`).

**Återskapa:** `node tools/coop.mjs` (bygger ihop), eller två flikar mot `?rum=`.
Jämför `serializeBuild()` i båda konsolerna – de ska vara identiska strängar.

**Var i koden:** `js/core/build-ops.js` (alla op-typer + `serializeBuild`/`deserializeBuild`),
`js/core/build.js` (`op`, `remoteOp`, `sendCursor`, `drawCursors`), `js/core/coop.js`.

---

## A5. "Lådan från grossisten kommer aldrig / går inte att packa upp"

**Symptom:** beställda delar dyker aldrig upp, eller lådan står kvar vid dörren.

**Troliga orsaker:**
1. `delivery.state` fastnade i `coming` för att `eta` aldrig räknades ner (samma orsak som A1:4).
2. Klienten försökte packa upp själv i stället för att skicka kommando till värden.
3. Delen hamnade i `stock` men inte i `shown` – då ser kunderna den inte (det är meningen,
   men det förklarar "jag har ju köpt den!").

**Återskapa:** `node tools/shopflow.mjs` kör hela kedjan köp → låda → packa upp → ställ ut → sälj.

**Var i koden:** `js/core/game.js` (`deliveries`, `incoming`, `stockFree`, `shownFree`),
`js/core/floor.js` (`drawBox`, `drawBoxTip`), `js/core/session.js` (kommandon), `js/core/ui.js`
(`openDelivery`, `openStock`).

---

## A6. "Mitt sparade spel är borta / det står Nytt spel"

**Symptom:** årväljaren visar "Nytt spel" fast man spelat, eller pengarna är tillbaka på start.

**Troliga orsaker:**
1. Sparfilens version känns inte igen av `readSave` (hände när v3 infördes – `readSave`
   accepterar nu `[1, 2, 3]`).
2. Fel slot: ett sparat spel per **startår**, `saveKeyFor(shop, year)`.
3. Webbläsaren rensade `localStorage`, eller spelet öppnades på annan adress
   (127.0.0.1 ≠ localhost ≠ github.io – olika lagring).

**Var i koden:** `js/core/game.js` – `saveKeyFor`, `readSave`, `save()`, `this.slot`.

---

## A7. "Den skarpa sajten visar gamla versionen"

**Symptom:** fixen syns lokalt men inte på `8bitcat.github.io/pixelverkstan/`.

**Checklista:**
1. Pushad? `git log origin/main -1 --oneline`
2. GitHub Pages bygger i ~40 s. Vänta, ladda om med Ctrl+F5.
3. Absoluta sökvägar (`/js/...`) fungerar lokalt men **inte** under `/pixelverkstan/` –
   använd `new URL('js/...', location.href)`.
4. `.nojekyll` måste ligga kvar i roten.

**Publicering:** `gh auth switch --user 8bitcat` → `git push` → `gh auth switch --user carlpalsson`.

---

## A8. "Bygget går inte att slutföra / knappen är grå"

**Symptom:** ett steg kan inte klaras, eller datorn startar inte fast allt ser rätt ut.

**Troliga orsaker:**
1. Regeln finns men epoken saknar delen (t.ex. kylare före 1990) – `rigFor(order)` bygger
   olika `STEPS` för `classic` och `modern` chassin.
2. En kabel är dragen till fel uttag; `canConnect` säger nej tyst.
3. Strömsteget kräver `psu`-op som klienten inte fick.

**Återskapa:**
```bash
node tools/era-logic.mjs      # bygger och startar 88 datorer 1983–2026
node tools/erabuild.mjs 1995  # ett enskilt år, steg för steg i konsolen
node tools/slots.mjs          # kortplatser och kompatibilitet
```

**Var i koden:** `js/shops/dator/rig.js` (`rigFor`, `STEPS`, `canPlace`, `canConnect`,
`standCheck`), `js/shops/dator/desk.js` (POST och felkoder).

---

## Rapportmall när Samos hittar något

Skriv (eller be mig skriva) så här, så går felsökningen fort:

```
Vad hände:        "det stod säljs inte längre när jag skulle köpa"
Startår + år nu:  1991, spelade till 1994
Ensam eller co-op: co-op, 3 spelare, värd = pappa
Vad jag gjorde precis innan: klickade på kunden i kön
Skärmbild:        ja/nej
```

---
