# Butiksplan: bås, sortiment, konsoler och att hänga med i tiden

Plan för nästa steg i Pixelverkstan. I dag köper man **delar** som ställs ut i montrar, och
kunderna beställer det de ser. Nästa lager är butiken som verksamhet:

1. Man köper **inredning** som gör butiken finare och drar in fler kunder.
2. Man köper **bås** – och det är båsen som **låser upp vad man får sälja**. Vill du sälja
   grafikkort behöver du ett Nvidia-bås och ett AMD-bås, med korten på display. Bättre bås =
   dyrare varor = mer pengar per kund.
3. Man börjar sälja **färdiga produkter**: konsoler, spel och arkadmaskiner för sin epok.
4. Man bygger en **egen speldator i butiken** och en **arkadhörna** som går att spela på
   på riktigt – med FPS-räknare, tidstypiska spel och kunder som samlas bakom ryggen.
   Allt det ligger i [SPELA.md](SPELA.md).
5. Och man måste **hänga med i tiden** – annars står kunderna och tittar på gammal skåpmat
   och undrar varför du inte har inne det senaste. (Här snålar vi inte på inspirationen från
   Game Dev Story.)

Filer som berörs: `js/core/game.js` (ekonomi, kundflöde), `js/core/floor*.js` (butiksgolvet),
`js/core/ui.js` (dialoger), `js/core/session.js` (kommandon), ny `js/shops/dator/upgrades.js`
(inredning och bås), ny `js/shops/dator/products.js` (konsoler, spel, arkad), ny
`js/core/shopfit.js` (placering på golvet).

---

## 1. Grundidé och loop

```
köp bås  →  låser upp dyrare sortiment  →  köp in det  →  ställ ut
   ↑                                                        ↓
   └──────── pengar ← bygg, sälj och laga ← kunderna kommer ─┘
```

Tre mätvärden styr kundflödet, alla synliga i HUD:en:

| Mätvärde | Vad det gör | Hur det höjs |
|---|---|---|
| **Dragningskraft** (🪧) | hur ofta kunder kommer in | skyltar, skyltfönster, arkadmaskiner, demodator, annonser |
| **Trivsel** (😊) | hur länge de orkar vänta | soffa, kaffe, tv, musik, växter, rent och fräscht |
| **Rykte** (⭐) | hur dyra saker de vågar köpa | lyckade bygg och lagningar, flaggskeppsmontrar, att ha det senaste |

```js
spawnTimer  = base(år, nivå) / (1 + 0.12 * drag)      // drag 0–20
patienceMax = grund * (1 + 0.05 * trivsel)            // trivsel 0–20
tierChans   = klamp(1 + rykte / 8, 1, 5)              // vilka kundmallar som lottas
maxKö       = 3 + antal extra diskar
```

Värden räknar allt i co-op och skickar det i `econ`-synken.

---

## 2. Båsen: så låser vi upp sortimentet

Det här är kärnan i progressionen. **Du får bara sälja det du har plats att visa.**

### 2.1 Två sorters bås

- **Kategorihylla** – rätten att sälja kategorin alls (grafikkort, processorer, minne,
  diskar, ljud, skärmar, chassin, konsoler, spel). Utan hylla: kategorin finns inte i din
  butik. Med hylla: bara instegsvaror (tier 1–2).
- **Märkesbås** – ett bås per märke inom kategorin: Nvidia, AMD, Intel, 3dfx, Creative,
  Seagate, Nintendo, Sega … Båset har en nivå, och nivån sätter taket för hur dyra varor av
  det märket du får ta hem.

| Bås | Pris (1990 års nivå) | Vad det låser upp |
|---|---|---|
| Kategorihylla | 1 500 | kategorin, tier 1–2 |
| Märkesbås nivå 1 – hylla med märkesskylt | 3 500 | tier 3 av märket, drag +1 |
| Märkesbås nivå 2 – belyst glasmonter med logga | 9 000 | tier 4, drag +2, märkesfans börjar komma |
| Märkesbås nivå 3 – flaggskeppsmonter med demoskärm | 22 000 | tier 5 + årets hero, drag +3, rykte +2 |

I grossisten syns låsta varor **med hänglås och texten "kräver Nvidia-monter nivå 2"** – man
ska aldrig behöva gissa varför något är grått.

### 2.2 Märken per kategori och epok

Båsen är epokanpassade precis som delarna – och märken **dör**, vilket är halva poängen.

| Kategori | Märken (och deras tid) |
|---|---|
| Grafik | Hercules/Trident (1983–1995) · S3 (1991–2000) · Matrox (1992–2003) · **3dfx (1996–2000)** · ATI (1985–2006) · **Nvidia (1995–)** · **AMD (2006–)** · Intel Arc (2022–) |
| Processorer | **Intel (1983–)** · **AMD (1983–)** · Cyrix (1988–1999) · IBM (1983–1996) |
| Ljud | AdLib (1987–1992) · **Creative / Sound Blaster (1989–)** · Gravis (1991–1997) · Roland (1988–1996) |
| Lagring | Seagate · Western Digital · Maxtor (–2006) · IBM/Hitachi · Samsung (SSD 2008–) · Crucial · Kingston |
| Skärmar | Philips · NEC · Eizo · Samsung · LG · Asus · Acer |
| Chassi & nätagg | Antec · Corsair (2006–) · **Fractal Design (2010–, svenskt)** · be quiet! |
| Konsoler | **Commodore · Atari · Nintendo · Sega · Sony (1995–) · Microsoft (2002–) · Valve (2022–)** |

När 3dfx går under år 2000 står du där med ett dyrt bås som ingen vill ha: riv det (få
tillbaka en del av pengarna) och sätt Nvidia där i stället. Det är ett **beslut**, och det är
precis den sortens beslut som gör ett butiksspel roligt.

### 2.3 Återförsäljaravtal

För nivå 2 och uppåt krävs ett **avtal** med märket: en årsavgift eller ett minsta inköp per
år. I gengäld får du **8–15 % rabatt** på märkets varor, rätt att använda loggan i skyltningen,
och ibland **förhandsinformation** om nästa lansering (se §4). Avtal med två konkurrerande
märken samtidigt går bra – men det kostar dubbelt, och du har bara så mycket golvyta.

### 2.4 Plats och lokal

Båsen tar golvrutor. Butiken har en storlek, och den kan byggas ut:

| Lokal | Hyra/år | Golvplatser |
|---|---|---|
| Liten butik (start) | 0 | 6 |
| Butik med lagerrum | 12 000 | 10 |
| Hörnlokal med skyltfönster åt två håll | 30 000 | 16 |
| Butikshus | 70 000 | 24 + eget verkstadsrum |

Plats är den verkliga bristvaran: en arkadmaskin tar fyra rutor, en flaggskeppsmonter två.

---

## 3. Konsoler, spel och arkadmaskiner

Datorbyggena är hantverket – konsolerna är den snabba kassan. En konsol säljs över disk,
utan bygge, men **bara om den står på display**.

### 3.1 TV-hörnan

| Bås | Pris | Rymmer |
|---|---|---|
| TV-bord med en TV | 4 000 | 1 konsol, spelbar |
| TV-vägg | 12 000 | 3 konsoler sida vid sida |
| Demorum med soffa | 28 000 | 5 konsoler, kunder sitter kvar länge (trivsel +4) |

En konsol på display gör tre saker: den går att sälja, den drar kunder som vill **prova**
(de spelar en stund på riktigt, med pixlad attract-mode på TV:n), och den öppnar
**spelförsäljningen** för den konsolen.

### 3.2 Spelhyllan – och att man ska se vilket spel det är

Spelen är billiga att köpa in, har hög marginal och ger **återkommande kunder**: den som
köpte en NES av dig i höstas kommer tillbaka efter spel, om och om igen. Det är butikens
jämnaste inkomst.

| Bås | Pris | Rymmer |
|---|---|---|
| Liten spelhylla | 2 000 | 12 titlar, ryggarna utåt |
| Vägghylla | 6 500 | 30 titlar, varav 6 med framsidan utåt |
| Spelvägg med demo-TV | 16 000 | 60 titlar, 12 framsidor, demo-TV som drar kunder |

**Grafiken är kravet här.** Man ska kunna gå förbi hyllan och se *vilka* spel som står där –
inte bara att det står färgade rektanglar. Därför:

- **Varje titel har ett eget pixlat omslag** i tre detaljnivåer: i hyllan (ca 12×16 px, tydlig
  bakgrundsfärg + ett enda igenkännbart motiv), i handen när man plockar upp den (24×32 px,
  med titeln läsbar), och i zoomvyn (48×64 px, med baksidestext och systemkrav).
- **Ett motiv, en färg.** Omslaget ska kännas igen på tre meters håll: den gula hjälmen, den
  röda drakhuvudet, den blå bilen. Inga plottriga omslag – silhuett och färg bär.
- **Framsidan utåt för det heta**, ryggarna utåt för resten. Ryggen får titeln i minifont och
  samma färg som omslaget, så raden blir en färgkod man lär sig.
- **Förpackningen följer epoken** – det är halva charmen:

| Epok | Hur spelen ser ut i hyllan |
|---|---|
| 1983–1990 | kassettkartonger, PC-spel i stora kartonger med manual |
| 1990–1995 | SNES/Mega Drive-kartonger, PC-spel i **jättekartonger** (de bästa att pixla) |
| 1995–2000 | juvelfodral och CD-boxar, PC fortfarande i stora lådor |
| 2000–2006 | DVD-fodral: blå för PS2, grön för Xbox, svart för PC |
| 2006–2013 | Blu-ray-fodral, vita Wii-fodral |
| 2013– | fysiken dör ut: hyllan ställs om till **kodkort och presentkort**, och den som inte hänger med står med osäljbara fodral |

- **Hyllan är sorterad per system** med en liten skylt över varje sektion (NES, Mega Drive,
  PC). Har du Mega Drive-spel men ingen Mega Drive på display frågar kunderna varför.
- **Hittitlar tar slut.** När en storsäljare kommer töms hyllan på en dag om du inte
  förbeställt – och kunderna som inte fick något hamnar på efterfrågantavlan.
- **Demo-TV:n** bredvid spelväggen kör en av titlarna; det spelet säljer dubbelt så bra den
  dagen. Samma motorer som i [SPELA.md](SPELA.md).

### 3.3 Arkadmaskinerna

Arkadmaskinen är den dyraste möbeln i butiken och den bästa affären:

- **4 golvrutor**, kostar som en hel speldator.
- **Drag +2 till +5** – ungar hänger utanför fönstret och drar in föräldrar.
- Ger **myntintäkter** varje dag, lite men jämnt.
- Visar sitt spel i attract-mode på skärmen – tydligt pixlat, så man känner igen det.
- **Kopplingen till hyllan:** står Street Fighter II i hörnet och SNES-versionen ligger på
  hyllan säljer den dubbelt. Kunden spelar, blir såld, vill ha det hemma. Det är precis så
  det gick till på riktigt.
- Gamla kabinett blir omoderna (se §4) – men efter tjugo år blir de **samlarobjekt**.
- **Man ska se vilket spel det är**: namnet i stora bokstäver på marquisen, attract-mode
  på skärmen, figurerna på sidodekalen. Att spela på dem beskrivs i [SPELA.md](SPELA.md) §5.

### 3.4 Maskinerna per epok

Detaljerad katalog med svenska lanseringsår, priser och hypefönster ligger i
[KONSOLER.md](KONSOLER.md). Grovt:

| Epok | Det kunderna frågar efter |
|---|---|
| 1983–1986 | C64, ZX Spectrum, Atari 2600 · arkad: Pac-Man, Donkey Kong, Galaga |
| 1986–1990 | NES, Sega Master System, Amiga 500 · arkad: Out Run, Double Dragon |
| 1990–1994 | Mega Drive, SNES, Game Boy, Neo Geo · arkad: Street Fighter II, Mortal Kombat |
| 1995–1999 | PlayStation, Saturn, Nintendo 64 · arkad: Daytona USA, Tekken, Time Crisis |
| 1999–2005 | Dreamcast, PS2, Xbox, GameCube, Game Boy Advance · arkad: House of the Dead, DDR |
| 2005–2012 | Xbox 360, PS3, Wii, DS, PSP |
| 2012–2017 | PS4, Xbox One, Wii U, 3DS · retro-kabinett börjar komma tillbaka |
| 2017–2026 | Switch, PS5, Xbox Series X, Steam Deck, VR |

---

## 4. Att hänga med i tiden

Det här är det som ger djupet, och det är här vi lånar mest från Game Dev Story.

### 4.1 Hypekurvan

Varje produkt har `hype: [lansering, topp, utfasning]`. Försäljningstakten följer kurvan:
en konsol säljer trögt första månaderna, exploderar när spelen kommer, och dör långsamt när
efterträdaren annonseras.

### 4.2 Nyheter och lanseringar

En **tidningsnotis** dyker upp i hörnet när något händer i branschen:
*"Sony lanserar PlayStation – köerna ringlar långa i Tokyo."* Har du avtal med märket får du
veta det ett kvartal i förväg och kan **förbeställa**. Gör du det står det kö utanför dörren
på lanseringsdagen – en av spelets roligaste dagar. Gör du det inte får du vänta på
leveranser som alla andra, med utsålda lådor och sura kunder.

### 4.3 Kunderna säger ifrån

- **Saknas årets heta maskin?** Kunden frågar i en pratbubbla: *"Har ni ingen N64?"*, går
  därifrån, och frågan hamnar på **efterfrågantavlan** bakom disken med en räknare:
  "N64 ×7 den här månaden". Tavlan är din att-göra-lista.
- **Är det nyaste du har mer än fyra år gammalt?** Då kommer kommentarerna: *"Dålig grafik."*
  *"Har ni inget nyare?"* Trivsel och rykte sjunker långsamt.
- **Kritiken är alltid konkret** – aldrig bara ett surt ansikte, utan namnet på det de ville ha.

### 4.4 Lagret ruttnar

Osålda maskiner tappar ~20 % i värde per år efter toppen. Därför finns **REA-skylten**: ta
förlusten, töm hyllan och gör plats. Eller – och det är fällan – behåll allt, fyll butiken
med skräp och se kunderna gå därifrån.

### 4.5 Retrohörnan (2010–)

Det du ändå sparade blir guld värt. En NES i kartong 2015 säljs för mångdubbla priset i en
**retrohörna**, till samlarkunder som bara dyker upp om du har den. Det belönar spelaren som
tänkte långsiktigt – och det knyter ihop hela spelet, från 1983 till i dag.

---

## 5. Inredning och trivsel

| Sak | År | Pris | Effekt |
|---|---|---|---|
| Trottoarskylt (A-skylt) | 1983– | 400 | drag +1 |
| Skyltfönsteraffisch ("REA!") | 1983– | 300 | drag +1, fler fyndkunder |
| Neonskylt i fönstret | 1985– | 1 800 | drag +2 |
| Lysande logoskylt på taket | 1996– | 6 000 | drag +4 |
| Annons i datortidning | 1985– | 2 500/år | drag +3, rykte +1 |
| Hemsida | 1997– | 4 000 | drag +3 |
| Sociala medier | 2010– | 1 500/år | drag +5 om rykte ≥ 10, annars +1 |
| Kaffeautomat | 1983– | 2 200 | trivsel +3, 5 % dricks |
| Tidningar och kataloger | 1983– | 200 | trivsel +1 |
| Krukväxter | 1983– | 400 | trivsel +1 |
| Stereo/musik | 1985– | 1 200 | trivsel +2 |
| Golvmatta / kaklat golv | 1983– | 1 800 | trivsel +2 |
| Luftkonditionering | 2000– | 5 000 | trivsel +2, svalare verkstad |
| Extra kassadisk | 1990– | 4 000 | +1 i kön, två kan expediera i co-op |

## 6. Verkstaden

| Sak | År | Pris | Effekt |
|---|---|---|---|
| Bättre arbetslampa | 1983– | 600 | markeringar syns även i proffsläget |
| Antistatmatta + armband | 1983– | 900 | 20 % mindre risk för statiska skador |
| Elektrisk skruvdragare | 1990– | 1 400 | skruvsteg på ett klick |
| Verktygsvagn | 1996– | 2 600 | kabelsteg 25 % snabbare |
| Extra arbetsbänk | 1996– | 9 000 | två datorer samtidigt (viktigt i co-op) |
| Testbänk / POST-kort | 1996– | 3 000 | felkod direkt i byggvyn |
| Multimeter | 1983– | 700 | mäter nätaggregat vid felsökning |
| Reservdelslåda | 1983– | 2 000 | testdelar att utesluta med |
| Tryckluft och dammsugare | 2000– | 1 200 | dammjobb på ett klick |

Verktygen hör ihop med reparationsuppdragen i [FELSOKNING.md](FELSOKNING.md).

## 7. Demodatorn

Bygg en dator **åt butiken** och ställ den i skyltfönstret eller på disken:

- drag +3 och rykte +1 medan den står framme,
- kunderna börjar beställa **liknande** datorer – en gamingmaskin i fönstret ger gamingkunder,
- en kund kan köpa den direkt (snabba pengar, bonusen försvinner).

## 8. Personal (senare etapp)

| Roll | Lön | Gör |
|---|---|---|
| Deltidshjälp | 300/dag | packar upp lådor |
| Säljare | 500/dag | tar emot kunder i kön |
| Tekniker | 800/dag | bygger enkla datorer, gör dammjobb |

---

## 9. Grafiken ska vara övertydlig

Carls krav, och det viktigaste av allt om en tioåring ska förstå butiken på tre sekunder:

- **Varje bås har en stor läsbar skylt** i märkets färg – grön för Nvidia, röd för AMD, blå
  för Intel, blått för Sega, rött för Nintendo. Egna pixeltolkningar, inte kopierade loggor.
- **Konsolerna ritas på silhuett**: en NES är grå och kantig, en Mega Drive svart och rund,
  en PlayStation grå med lucka. Man ska känna igen dem på håll, med en namnskylt under.
- **Arkadmaskinen visar sitt spel** i attract-mode, i vår egen pixelversion.
- **Låst vara = hänglås + kravet i klartext** ("kräver Nvidia-monter nivå 2").
- **Ikonspråk på varje vara:** 🔥 hett just nu · 🕸 gammalt lager · 🏷 rea · 🔒 låst · ⭐ flaggskepp.
- **Kundernas pratbubblor visar bilden** på det de vill ha, inte bara namnet.
- **Efterfrågantavlan** bakom disken: en rad per sak kunderna frågat efter, med antal.

---

## 10. Placering på golvet

- Varje sak har `spots: ['fönster' | 'vägg' | 'golv' | 'hörn' | 'disk' | 'verkstad']`, en
  storlek i rutor och en pixelritning i samma stil som `floor-props.js`.
- Läget **"🏪 Inred butiken"** visar golvrutnätet; saker dras på plats. Kunder går runt
  möblerna via `floor-layout.js` och avatarerna via `floor-walk.js` (båda räknas om vid
  ändring).
- Sparas i `game.shopfit = { köpta: [id], placering: { id: [x, y] }, lokal: 2 }` och skickas
  i `econ`-synken.

## 11. Ordning att bygga i

1. **Bås och lås.** `upgrades.js` med kategorihyllor + märkesbås i tre nivåer, `game.shopfit`,
   tier-taket i grossisten med hänglås och krav i klartext. Fasta platser, ingen fri placering.
2. **Drag, trivsel, rykte.** Inredningen från §5, effekter på `spawnTimer` och `patienceMax`,
   ikoner i HUD:en.
3. **Konsoler och spel.** `products.js`, TV-hörnan, försäljning över disk, spelhyllan.
4. **Hänga med i tiden.** Hypekurvor, tidningsnotiser, efterfrågantavlan, "dålig grafik",
   REA, värdeminskning.
5. **Arkadmaskiner** med attract-mode och kopplingen till spelhyllan.
6. **Fri placering** på rutnätet, större lokaler och hyra.
7. **Speldatorn och minispelen** ([SPELA.md](SPELA.md)) – börja med raycast-motorn.
8. **Retrohörnan**, demodatorn, personal.

Varje etapp får ett testverktyg i `tools/` (t.ex. `tools/shopfit.mjs`, `tools/konsol.mjs`)
och en simulering som visar att ekonomin håller, i stil med `tools/customers.mjs`.

## 12. Balans och fällor

- **Låsen ska kännas som mål, inte som spärrar.** Man ska alltid se nästa bås och ungefär
  vad det kostar. Ett bås ska tjäna in sig på ungefär ett halvår speltid.
- **Plats > pengar** i mitten av spelet: det är golvytan som tvingar fram valen.
- **Inte pay-to-win:** drag ger fler kunder, inte mer betalt per kund. Bygget och lagningen
  är fortfarande det som drar in pengarna.
- **Tak:** drag och trivsel toppar på 20.
- **Epok:** allt måste gå att köpa i sin tid – ingen arkadmaskin 1983, ingen hemsida 1985,
  ingen Nvidia-monter 1990.
- **Co-op:** alla köp går via kommandon i `session.js` så att värden räknar; `econ` skickar
  `shopfit` vidare; den som drar en möbel äger den tills hen släpper.
- **Sparning:** `shopfit`, lager av färdiga produkter och hypeläge in i sparfilen (v4) med
  migrering från v3.
