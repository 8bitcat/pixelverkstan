# Att spela i butiken: speldatorn, FPS-räknaren och arkadmaskinerna

Butiken ska inte bara säljas i – den ska **spelas i**. Två platser:

- **Speldatorn på spelbordet.** Du köper ett bord, bygger en dator på det av delar du har,
  går dit med gubben och sätter dig. Uppe i hörnet står FPS-räknaren. Kör du något för
  krävande får du *OUT OF MEMORY* eller en bildrutehastighet som kryper.
- **Arkadmaskinerna.** Stora kabinett på golvet med sitt spel skrivet i klartext på
  marquisen. Du (och kunderna) kan gå dit och spela på riktigt.

Att bygga butikens egen speldator är ett eget delmål – den roligaste maskinen du bygger,
för den bygger du åt dig själv.

---

## 1. Spelbordet, steg för steg

1. **Köp spelbordet** (2 golvrutor, 3 500 kr, finns från 1983). Ett bord med stol, mus,
   tangentbord och en tom yta där en dator ska stå.
2. **Bygg datorn** i den vanliga byggvyn – samma delar, samma regler, samma epok. Skillnaden
   är att den här datorn blir din och stannar i butiken.
3. **Gå dit med gubben.** Klicka på bordet: avataren går dit via `floor-walk.js` och sätter
   sig. Kameran zoomar in i skärmen.
4. **Välj spel** ur en tidstypisk lista (§4). Spelet startar – med DOS-prompt, laddskärm och
   allt.
5. **Spela.** Piltangenter eller WASD, knappar på mobil. **FPS-räknaren står uppe i hörnet
   hela tiden.**
6. **Res dig** med Esc. Tiden i butiken har gått under tiden – kunder kan ha ställt sig i kön
   medan du spelade. Att spela kostar något, och det är meningen.

Uppgraderar du datorn – nytt grafikkort, mer minne – ska man **direkt kunna gå och känna
skillnaden** i samma spel. Det är hela poängen med spelet, i miniatyr.

---

## 2. Krav, FPS och det som går fel

Varje spel har krav i två nivåer, precis som på kartongerna förr:

```js
{
  id: 'labyrint3d', namn: '…', år: 1992, motor: 'raycast',
  min: { cpu: 25, ram: 4,  vram: 0.25, gfx: 'vga',  ljud: 'pc',  disk: 8 },
  rek: { cpu: 66, ram: 8,  vram: 0.5,  gfx: 'vga',  ljud: 'sb',  fps: 35 },
}
```

Datorn på bordet räknas om till samma mått (`cpuPoäng`, `ram`, `vram`, `gfx`, `ljud`) ur de
riktiga delarna som sitter i den.

### Hårda stopp (spelet startar inte)

| Vad som saknas | Vad som står på skärmen |
|---|---|
| För lite minne | `Not enough memory to run this program. (640K required)` |
| För lite minne, senare epok | `OUT OF MEMORY` i en blå ruta |
| För lite videominne | `Out of video memory – reduce resolution` |
| För gammalt grafikkort | `This game requires VGA` |
| För svag processor | `This program requires a 386 or better` |
| Ingen 3D-accelerator (1997+) | `No 3D accelerator found – using software renderer` (kör, men fult och långsamt) |
| Fel operativsystem | `DirectX 8.1 required` |
| Disken full | `Insufficient disk space` |

Felen ska vara **tidstypiska och begripliga**: en gul DOS-rad 1993, en blå ruta 2001.

### När det går, men knappt

```js
fps = klamp(rek.fps * min(1, cpuKvot, gpuKvot), 4, 70)
```

| FPS | Hur det känns och ser ut |
|---|---|
| 55+ | silkeslent, full upplösning, alla effekter |
| 30–55 | bra – så här ska det vara |
| 18–30 | **hackigt**, musen släpar efter, ljudet knastrar lite |
| 8–18 | diabildsshow, ljudet stakar sig, rutan hoppar |
| under 8 | ospelbart – kunderna bakom dig fnissar |

Ligger du precis på minimikraven ska det **hacka synligt**: bildrutorna ritas ojämnt, inte
bara långsamt. Skillnaden mellan 12 och 60 fps ska kännas i handen, inte bara läsas i siffran.

Dessutom påverkar delarna hur det *ser ut*:

- **Inget ljudkort** → bara pipljud ur lådans lilla högtalare. Sound Blaster → musik.
- **CGA/EGA** → fyra eller sexton färger, rutig bild. **VGA** → 256 färger. **SVGA** → högre
  upplösning.
- **Ingen 3D-accelerator** → mjukvaruläge: låg upplösning, taggiga kanter, halva fps.
  **3dfx/Nvidia** → jämna ytor, dubbla upplösningen, ljuseffekter.
- **Långsam disk** → längre laddskärm (och laddskärmen är en del av upplevelsen).

---

## 3. Motorerna vi bygger

Vi gör inte tjugo spel. Vi gör **sex små motorer** och klär om dem per epok – det är så vi
får femtio titlar för priset av sex.

| Motor | Vad det är | Används från |
|---|---|---|
| `rymd` | skjuta uppåt/i sidled, vågor av fiender | 1978– |
| `labyrint2d` | äta prickar i en labyrint med jagande spöken | 1980– |
| `plattform` | hoppa, springa, tunnor och plattformar | 1981– |
| `racer` | pseudo-3D-väg som rullar mot en, kurvor och skyltar | 1986– |
| `block` | fallande block som ska passas ihop | 1989– |
| `raycast` | korridorer i förstaperson, dörrar, hemliga rum, fiender | 1992– |

`raycast` får två lägen: **mjukvara** (låg upplösning, dimmiga texturer, 320×200-känsla) och
**accelererat** (1997+, jämnare och ljusare). Samma motor, två utseenden – och det är precis
den skillnaden spelaren ska kunna köpa sig till med ett nytt grafikkort.

Alla spel i spelet är **våra egna pixelversioner** i vår egen stil – små hyllningar, inte
kopior. Namnen skrivs i samma anda: igenkännbara för en förälder, egna nog att vara våra.

---

## 4. Vad som går att spela, år för år

| Epok | På speldatorn | Motor |
|---|---|---|
| 1983–1986 | textäventyr, labyrintjakten, tunnhoppet, rymdvågen | labyrint2d, plattform, rymd |
| 1986–1990 | landsvägsracet, plattformsäventyret, flygsimulatorn (trådgrafik) | racer, plattform |
| 1989–1992 | blockpusslet, prinspusslet, lämmeltåget | block, plattform |
| **1992–1995** | **korridorskjutaren (1992)** och **fängelsehålan (1993)** – de som sålde grafikkort och minne | raycast |
| 1995–1999 | 3D-skjutaren med accelerator (1996), grottäventyret med damen, racingspelet med lackglans | raycast, racer |
| 2000–2005 | lagskjutaren på nätet, gangsterstaden, den mörka fängelsehålan igen (2004) | raycast |
| 2006–2012 | djungeln som ingen dator klarade (2007 – "kan din dator köra den?"), klossvärlden (2009) | raycast |
| 2013–2020 | öppna världen, battle royale | raycast |
| 2020–2026 | den regniga framtidsstaden, VR-demot | raycast |

Kravkurvan ska följa verkligheten: 1993 års fängelsehåla kräver en 486 och 8 MB, och den som
kör den på en 386 med 4 MB får se `Not enough memory`. 2007 års djungel ska vara omöjlig på
tidens mellandator – "kan den köra den?" är ett skämt vi ska kunna göra på riktigt.

---

## 5. Arkadmaskinerna

### 5.1 Man ska se vilket spel det är

- **Marquisen överst på kabinettet** har spelets namn i stora, lästa pixelbokstäver, i
  spelets egna färger. Det är det första man ser.
- **Skärmen kör attract-mode** i loop när ingen spelar: titelbild, demospel, highscore-lista
  som rullar.
- **Sidodekalen** har spelets figurer.
- **Muspekaren över maskinen** visar namn, år och vad det kostar per spel.
- Står två maskiner bredvid varandra ska man kunna se på tre meters håll vilken som är vilken.

### 5.2 Att spela på riktigt

Klicka på maskinen: gubben går dit, stoppar i ett mynt (myntanimation och ett "klink"), och
spelet startar i helskärm med kabinettet runt om. Samma sex motorer som på speldatorn, fast
med arkadinställningar: snabbare, svårare, tre liv och en highscore-lista som sparas per
maskin. **Kunder samlas bakom dig när du spelar** – och medan folk står och tittar höjs
dragningskraften.

### 5.3 Maskinerna per epok

| Epok | Kabinett i butiken |
|---|---|
| 1978–1983 | rymdinvasionen, labyrintjakten, tunnklättraren, myrstacken |
| 1983–1987 | rörmokarbröderna (kabinettversionen 1983, och skolgårdsversionen 1986), landsvägsracet |
| 1987–1991 | gatuslagsmålet, ninjaspelet, bilracet med ratt |
| 1991–1995 | fighting-maskinen (1991) som alla stod i kö till, blodfightern (1992), basketmaskinen (1993) |
| 1994–1999 | racingmaskinen med ratt och växelspak, pistolspelet med ljuspistol |
| 1998–2005 | dansmattan, trummaskinen, bilspelet med sittkabinett |
| 2005–2018 | kortautomater, lyckohjul, stora skärmar |
| 2018– | **retrokabinettet** med femtio gamla spel i – nostalgivågen, och en utmärkt affär |

Kabinetten blir omoderna precis som konsolerna (se [BUTIKSPLAN.md](BUTIKSPLAN.md) §4) – men
ett kabinett du behållit i tjugo år är plötsligt värt en förmögenhet.

### 5.4 Arkadhallen i baksidan

Förebilden är de **amerikanska arkadhallarna** på 80- och tidiga 90-talet, inte en blygsam
svensk kiosk med en maskin. Det är dit vi ska: mörkt rum, mönstrad neonmatta, rader av
kabinett med lysande marquiser, en växlingsautomat på väggen och ett ständigt sorl av
attract-ljud.

Butiken kan byggas ut med ett **arkadrum** när den växer:

| Steg | Kostnad | Vad du får |
|---|---|---|
| Arkadhörna (2 maskiner) | – | maskinerna står i butiken, drag +2 |
| Bakre rummet (6 maskiner) | 25 000 | eget rum med matta och neon, myntintäkt varje dag |
| Arkadhall (12 maskiner + prisdisk) | 90 000 | egen inkomstkälla, turneringar, ungarna kommer varje dag efter skolan |

Detaljer som ska med, för att det ska kännas rätt:

- **Växlingsautomaten** på väggen – sedlar in, mynt ut, med ett klirr.
- **Myntpriset följer tiden**: ett spel kostade 25 cent i början och kröp uppåt genom åren.
  I vår butik: 1 krona → 2 → 5 → 10.
- **Highscore-listan** med tre bokstäver. Din avatar skriver in sina initialer, listan sparas
  per maskin, och kompisen i co-op kan slå ditt rekord. Toppnoteringen syns på marquisen.
- **Kabinettyperna ska variera i siluett**: stående skåp, cocktailbord man sitter vid,
  sittkabinett med ratt och växelspak, ljuspistolspel med pistolen i hållare, dansmatta.
  Man ska se på håll vilken sorts maskin det är.
- **Ljuset:** marquiserna lyser i mörkret och färgar golvet. Det är den enda platsen i spelet
  där det är mörkt – och det ska kännas.
- **Turneringar** en gång i månaden: annonsera, fyll hallen, sälj läsk.
- **Nedgången:** mot slutet av 90-talet tunnas kunderna ut när hemkonsolerna blir lika bra –
  då får hallen antingen moderniseras eller bli **retrobar** (2015–), vilket är en egen och
  mycket lönsam vändning.

Underlaget för vilka kabinett som faktiskt stod i hallarna, hur mattorna såg ut och hur
priset per spel utvecklades samlas i [KONSOLER.md](KONSOLER.md).

---

## 6. Vad det gör för butiken

- **Kunder som ser ett spel köper spelet.** Har du korridorskjutaren igång på speldatorn
  säljer grafikkort bättre samma dag. Står fightingmaskinen i hörnet och SNES-versionen på
  hyllan säljer den dubbelt.
- **Prova-innan-du-köper:** en kund kan be att få prova en dator du byggt. Går spelet fint →
  hen köper en likadan. Hackar det → hen går därifrån.
- **Folksamling:** medan någon spelar står det kunder runt omkring. Drag +2 så länge det
  pågår.
- **Priset:** tiden. Butiken rullar vidare medan du spelar.

## 7. I co-op

Perfekt för två: **en spelar medan den andra sköter butiken** – och den som står vid disken
kan skicka "ta kunden nu!" i chatten. Två arkadmaskiner bredvid varandra betyder att båda kan
spela samtidigt, och highscore-listan sparar båda namnen. Värden äger spelets tillstånd;
spelarens knapptryck skickas som ops precis som byggsteg, och FPS-räknaren räknas lokalt.

## 8. Vad som behövs i koden

| Vad | Var |
|---|---|
| Sex minispelsmotorer med gemensamt gränssnitt (`start/tick/rita/knapp`) | ny `js/games/<motor>.js` |
| Speltitlar med år, krav, motorinställningar och skinn | ny `js/games/index.js` |
| Kravberäkning ur en riktig maskin (`cpuPoäng`, `ram`, `vram`, `gfx`, `ljud`) | `js/shops/dator/catalog.js` (poängen finns delvis redan) |
| FPS-räknare, hack-simulering (ojämna bildrutor), mjukvaruläge | ny `js/games/runtime.js` |
| Spelbordet: möbel, byggplats, "sätt dig"-interaktion | `shopfit` + `floor-walk.js` + `build.js` |
| Arkadkabinett: marquis, attract-mode, myntanimation, highscore | `floor-props.js` + `js/games/` |
| Feltexter per epok (DOS-rad, blå ruta) | `js/games/runtime.js` |
| Test: kör varje titel mot en minimimaskin, en rekommenderad och en för svag; kolla att rätt fel/fps kommer | ny `tools/spel.mjs` |

**Bygg i den här ordningen:** `raycast` först (den bär hela 90-talet och är den som visar
skillnaden mellan datorer tydligast), sedan `plattform` och `rymd` till arkadmaskinerna,
sedan `racer`, `block` och `labyrint2d`.
