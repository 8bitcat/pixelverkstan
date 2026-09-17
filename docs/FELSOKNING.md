# Felsökningsuppdrag: kunder med trasiga datorer

Vid sidan av "bygg en ny dator" kommer kunder in med en dator som inte funkar. Man vet inte
vad som är fel – man **ställer den på bänken, kopplar in den och startar den, och ser vad som
händer eller inte händer**. Det är symptomet som är ledtråden. Sedan öppnar man, letar,
lagar och testar igen.

Motorn finns redan: `desk.js` gör i dag inkoppling, strömknapp, POST och symptom när man är
klar med ett bygge. Ett reparationsuppdrag är samma sak fast baklänges – datorn är redan
byggd, men något i den är fel.

(Letar du efter buggar i *spelet* – att kunder slutar komma, co-op-spöken och liknande –
ligger det i [BUGGSOKNING.md](BUGGSOKNING.md).)

---

## 1. Flödet, steg för steg

1. **Kunden kommer in** med datorn under armen och säger något vagt i en pratbubbla:
   *"Den bara dog."* Kunder beskriver aldrig felet rätt – det är hela poängen.
2. **Ta emot jobbet.** Diagnosavgift betalas direkt (t.ex. 150 kr) även om det visar sig
   vara något litet. Kunden sätter sig i soffan eller går hem och kommer tillbaka.
3. **Datorn hamnar på bänken** – i skrivbordsvyn, inte i byggvyn. Den står avstängd och
   urkopplad, precis som en kund lämnar den: en sladdhärva och en dammig låda.
4. **Koppla in den.** Ström, skärm, tangentbord, mus – samma moment som vid en leverans.
   Redan här kan man se saker: en trasig kontakt, en omkopplare på baksidan, en skärm som
   inte har någon sladd med sig.
5. **Tryck på strömknappen och titta.** Nu händer något – eller ingenting alls. Lampor,
   fläktljud, pip, bild, lukt, värme.
6. **Öppna datorn** (byggvyn) och leta utifrån det du såg. Byt, koppla om, skruva fast.
7. **Tillbaka till bänken och starta igen.** Rätt gissning = den startar. Fel gissning =
   samma symptom igen, och tiden rinner.
8. **Lämna tillbaka.** Betalt = diagnos + delar + arbete. Snabbt och rätt ger stjärnor.

Man *får* öppna direkt utan att starta – men då har man inga ledtrådar, och det är dyrt att
byta delar på måfå. Den vana spelaren startar alltid först.

---

## 2. Vad bänken kan visa

| Ikon | Sinne | Exempel |
|---|---|---|
| 👁 | Titta | lampor på låda och skärm, bild, färger, grenuttagets lysdiod |
| 👂 | Lyssna | fläktar, hårddiskens klick, pip-mönster, ett kort "tick" och tystnad |
| 🤚 | Känna | het låda, ingen luft ur bakre gallret, kylaren vickar |
| 👃 | Lukta | brända elektronik (nätaggregat, svällda kondensatorer) |

Symptomtabellen som spelet lottar ur:

| Symptom vid start | Vad det brukar betyda |
|---|---|
| Absolut ingenting | ström: uttag, sladd, omkopplare, strömbrytare, frontpanelkabel |
| Ett tick, sedan tyst | nätaggregat som kortsluter eller är för svagt |
| Fläktar snurrar, mörk skärm | minne, grafikkort, bildkabel, skärm |
| Pip-mönster | minne eller grafikkort – mönstret säger vilket |
| Text: "no boot device" | disk, datakabel, byglar, startordning |
| Startar och stänger av efter en stund | kylning: kylare, pasta, fläkt, damm |
| Bild men fel färger / ränder | bildkabel, böjda stift, kortet glappar |
| Startar ibland | glapp, svällda kondensatorer, för svagt nätaggregat |

## 3. Verktyg man kan köpa (hör ihop med [BUTIKSPLAN.md](BUTIKSPLAN.md))

- **POST-kort** – visar en felkod i stället för bara pip.
- **Multimeter** – mäter om nätaggregatet ger spänning alls.
- **Reservdelslåda** – ett minne och ett nätaggregat som funkar, att testa med.
- **Tryckluft** – dammjobben på ett klick.
- **Servicepärmen** – en ledtråd per uppdrag. Bra när barnet fastnar.

---

## 4. Scenarierna

Varje scenario: vad kunden säger, vad som händer på bänken, ledtrådstrappan (visas en i taget
om man fastnar), felet, åtgärden, villospåret som kostar pengar, och vad man lär sig.

### 1980-tal

**R1 – "Den bara dog i natt"** · 1983– · ★
- **På bänken:** ingenting. Ingen lampa, inget fläktljud, helt dött.
- **Ledtrådar:** (1) grenuttagets röda lampa är släckt · (2) grenuttaget har en egen
  strömbrytare · (3) någon har stängt av hela härligheten med foten.
- **Felet:** grenuttaget avslaget (eller strömsladden ur väggen).
- **Åtgärd:** slå på det. Klart.
- **Villospår:** byta nätaggregat (dyrt, ändrar ingenting).
- **Lärdom:** börja alltid ytterst i kedjan. Det första uppdraget i spelet bör vara det här.

**R2 – "Skärmen är svart, datorn är trasig"** · 1983– · ★
- **På bänken:** lådan startar, fläkten går, hårddisken jobbar – men skärmen är mörk.
  Skärmens lampa lyser gult.
- **Ledtrådar:** (1) gul lampa = skärmen får ström men ingen bild · (2) bildkabeln hänger
  lös bakom bordet · (3) den satt aldrig i.
- **Felet:** bildkabeln lös (eller skärmens ljusstyrka nervriden till noll av ett barn).
- **Lärdom:** "datorn" och "skärmen" är två olika saker.

**R3 – "Diskettlampan lyser hela tiden"** · 1983–1995 · ★★
- **På bänken:** startar, men floppylampan lyser konstant och den hittar aldrig disketten.
- **Ledtrådar:** (1) lampan lyser redan innan man satt i en diskett · (2) flatkabeln har en
  röd rand i kanten · (3) den röda randen ska ligga mot stift 1.
- **Felet:** floppykabeln isatt bakvänd.
- **Lärdom:** flatkablar har en riktning, och den röda randen visar den.

**R4 – "Efter minnesuppgraderingen tutar den"** · 1986–1996 · ★★★
- **På bänken:** pip-pip-pip, ingen bild.
- **Ledtrådar:** (1) grannen "hjälpte till" med minnet i förra veckan · (2) moderkortet har
  en rad byglar märkta med en tabell · (3) tabellen på moderkortet säger hur byglarna ska
  stå för den mängd minne som sitter i.
- **Felet:** byglarna står kvar för den gamla minnesmängden.
- **Villospår:** byta ut minnet (som är helt.)
- **Lärdom:** förr fick man tala om för datorn vad man stoppat i den.

**R5 – "Tangentbordet svarar inte"** · 1983–1992 · ★
- **På bänken:** startar fint, men inget händer när man skriver. Ibland "keyboard error".
- **Ledtrådar:** (1) det finns två runda uttag på baksidan · (2) det ena är till mus,
  det andra till tangentbord · (3) på lådans framsida sitter en nyckel i låsläge.
- **Felet:** tangentbordet i fel uttag – eller lådans nyckellås pålåst.
- **Lärdom:** gamla datorer hade nyckel som låste tangentbordet.

**R6 – "Den funkade innan vi flyttade"** · 1983–1997 · ★★
- **På bänken:** startar, men nätverket/ljudet/disken saknas (beror på vilket kort det gäller).
- **Ledtrådar:** (1) datorn har åkt bil · (2) korten sitter bara fast med en skruv ·
  (3) ett av korten står lite snett i sin plats.
- **Felet:** ISA-kort har glappat ur under transporten.
- **Lärdom:** tryck ner kortet ordentligt och skruva fast det.

### 1990-tal

**R7 – "Den pep och pep och gav upp"** · 1990– · ★★
- **På bänken:** fläktar går, mörk skärm, en lång och två korta pip.
- **Ledtrådar:** (1) pipen är ett meddelande, inte ett larm · (2) en lång + två korta =
  bild/minne beroende på BIOS · (3) minnesstickan ligger snett, låsklackarna är uppe.
- **Felet:** RAM sitter inte i botten.
- **Åtgärd:** ta ut, sätt i rakt tills båda klackarna klickar.
- **Villospår:** köpa nytt minne.

**R8 – "Den stänger av sig själv efter en stund"** · 1994– · ★★
- **På bänken:** startar normalt, allt ser bra ut – och efter ~20 sekunder släcks allt.
  Lådan är het, luften ur bakgallret är ljummen.
- **Ledtrådar:** (1) den hinner alltid lika långt · (2) det luktar varmt · (3) kylaren
  vickar när man tar i den / kylpastan är intorkad till grus.
- **Felet:** kylaren lös eller kylpastan slut.
- **Lärdom:** värme är det enda felet som beror på hur *länge* den varit igång.

**R9 – "Min andra hårddisk har försvunnit"** · 1994–2003 · ★★★
- **På bänken:** startar fint, men bara en disk syns.
- **Ledtrådar:** (1) båda diskarna sitter på samma platta kabel · (2) på baksidan av varje
  disk sitter en liten bygel · (3) två diskar på samma kabel måste vara master och slave.
- **Felet:** båda diskarna står som master.
- **Lärdom:** klassikern som förklarar varför SATA blev populärt.

**R10 – "Den tror att det är 1980 varje morgon"** · 1987– · ★★
- **På bänken:** startar, men klockan är fel och BIOS-inställningarna är borta.
  Ibland "CMOS checksum error".
- **Ledtrådar:** (1) felet kommer bara efter att den stått avstängd · (2) något måste hålla
  minnet vid liv när strömmen är av · (3) ett platt silverbatteri på moderkortet.
- **Felet:** CR2032 slut.
- **Lärdom:** ett batteri för 30 kr löser ett fel som ser dramatiskt ut.

**R11 – "Inget ljud i spelen, men Windows plingar"** · 1993–1999 · ★★★★
- **På bänken:** startar, Windows-ljud funkar, DOS-spelen är tysta.
- **Ledtrådar:** (1) ljudkortet delar avbrott med nätverkskortet · (2) spelen vill ha
  IRQ 5 eller 7 · (3) flytta kortet till en annan plats eller ställ om bygeln.
- **Felet:** avbrottskrock.
- **Lärdom:** därför fanns "Sound Blaster-kompatibel, IRQ 5, DMA 1" i varje spelmanual.

### 2000-tal

**R12 – "Den startar men dör i spel"** · 2004– · ★★
- **På bänken:** startar, bild finns, allt lugnt – tills man belastar den, då slocknar den.
- **Ledtrådar:** (1) den klarar skrivbordet men inte spel · (2) grafikkortet har ett extra
  strömuttag · (3) kontakten hänger lös bredvid kortet.
- **Felet:** grafikkortets PCIe-strömkabel isatt slarvigt (eller nätaggregatet för svagt –
  räkna watt!).
- **Lärdom:** moderna grafikkort äter mer ström än hela 90-talsdatorn gjorde.

**R13 – "Ingen bild, fast grafikkortet är nytt"** · 1999– · ★★
- **På bänken:** fläktar går, skärmen säger "no signal".
- **Ledtrådar:** (1) det finns två ställen att sätta bildkabeln på baksidan · (2) det ena
  sitter i moderkortet, det andra i kortet · (3) följ kabeln med fingret.
- **Felet:** bildkabeln i moderkortets uttag när det finns ett grafikkort.
- **Lärdom:** kabeln ska i kortet, alltid.

**R14 – "Ingenting händer när jag trycker på knappen"** · 1996– · ★★★
- **På bänken:** helt dött vid knapptryck – men nätaggregatets fläkt rycker till om man
  kortsluter stiften med en skruvmejsel.
- **Ledtrådar:** (1) strömmen finns, knappen når inte fram · (2) en bunt tunna sladdar från
  fronten till moderkortet · (3) PWR_SW sitter på fel stift.
- **Felet:** frontpanelkabeln fel isatt (efter någon annans "service").
- **Lärdom:** de där små sladdarna är de knepigaste i hela datorn.

**R15 – "Den låter som en dammsugare och är seg"** · 2000– · ★
- **På bänken:** startar, men bullrar, blir het och saktar ner.
- **Ledtrådar:** (1) luften bak är varm och svag · (2) gallret är en grå matta · (3) damm.
- **Felet:** igendammad, en fläkt har lagt av.
- **Åtgärd:** blås rent, byt fläkt. Snabbt och lönsamt jobb.

**R16 – "Den startar ibland, ibland inte"** · 2002–2008 · ★★★★★
- **På bänken:** ibland startar den, ibland ett tick och tyst. Ingen ordning på det.
- **Ledtrådar:** (1) felet är slumpmässigt – det pekar på ström eller glapp · (2) titta
  noga på moderkortet i ljuset · (3) kondensatorernas toppar buktar, någon har läckt brunt.
- **Felet:** svällda kondensatorer (kondensatorpesten).
- **Åtgärd:** moderkortet måste bytas – dyrt besked att ge kunden.
- **Lärdom:** ibland är svaret "den går inte att laga billigt", och det är också ett svar.

**R17 – "No boot device"** · 2004– · ★★
- **På bänken:** bild finns, text på svart botten, ingen Windows.
- **Ledtrådar:** (1) BIOS ser inte disken · (2) SATA-kabeln sitter löst i ena änden ·
  (3) disken sitter i port 4 och startordningen pekar på port 0.
- **Felet:** lös datakabel eller fel startordning.

**R18 – "Det small och luktade"** · 1983–2005 · ★★★
- **På bänken:** dött, och det luktar bränt.
- **Ledtrådar:** (1) lukten kommer från nätaggregatet · (2) på baksidan sitter en röd
  omkopplare: 230 / 115 · (3) den står på 115.
- **Felet:** spänningsomkopplaren omställd – nätaggregatet är förstört och måste bytas.
- **Lärdom:** den där lilla röda brytaren var livsfarlig för datorer.

### 2010- och 2020-tal

**R19 – "Den nya disken syns inte"** · 2016– · ★★★
- **På bänken:** startar, men bara den gamla disken finns.
- **Ledtrådar:** (1) M.2-disken sitter i sin plats men lutar upp · (2) den lilla skruven
  saknas · (3) vissa M.2-platser stänger av SATA-portar – läs moderkortets manual.
- **Felet:** M.2 ej fastskruvad / fel plats.

**R20 – "Ingen bild fast allt är nytt"** · 2017– · ★★★
- **På bänken:** fläktar snurrar, lampor lyser, "no signal".
- **Ledtrådar:** (1) bildkabeln sitter i moderkortet · (2) processorn i den här maskinen är
  en F-modell · (3) F betyder ingen inbyggd grafik.
- **Felet:** skärmen inkopplad i moderkortet på en dator vars processor saknar grafik.
- **Lärdom:** samma fel som R13, men av en helt annan anledning – bra som "återfall" senare
  i spelet.

**R21 – "Den startar inte efter att jag satt i mer minne"** · 2016– · ★★★
- **På bänken:** fläktar går, inget mer. Lysdiod "DRAM" lyser rött på moderkortet.
- **Ledtrådar:** (1) felet kom direkt efter uppgraderingen · (2) fyra platser, två stickor,
  de sitter bredvid varandra · (3) manualen säger plats 2 och 4.
- **Felet:** minnena i fel kanaler (eller XMP-profil som moderkortet inte klarar).

**R22 – "Den funkar, men det ser konstigt ut"** · 2020– · ★★
- **På bänken:** bild finns men hackar och artefaktar; grafikkortet hänger snett i chassit.
- **Ledtrådar:** (1) kortet väger nästan ett kilo · (2) bakkanten dras neråt av sin egen
  tyngd · (3) PCIe-låset har hoppat ur.
- **Felet:** grafikkortet har sjunkit ur porten. Åtgärd: sätt i det ordentligt och montera
  en stötta.

### Fler fel att lotta ur (kortform)

| Fel | Symptom | Epok |
|---|---|---|
| Strömkabeln lös i nätaggregatet | dött | alla |
| Moderkortets strömkontakt halvt isatt | rycker till, dör | alla |
| Fel RAM-typ isatt av förra ägaren | ingen POST | alla |
| Grafikkortet inte i botten | ingen bild, fläktar går | alla |
| Skärmen på fel ingång | "no signal" | 1998– |
| Kylarfläktens kontakt lossnad | "fan error", stänger av | 1993– |
| Böjda stift i bildkontakten | rosa eller grön bild | 1983–2010 |
| Statiskt skadat minne | slumpvis krasch efter en stund | alla |
| Fel klockbygel på moderkortet | startar långsamt eller inte alls | 1983–1998 |

---

## 5. Svårighet, ledtrådar och misstag

- **★** syns utifrån innan man ens öppnat (R1, R2, R15). Lär ut "titta först".
- **★★–★★★** kräver att man kopplar symptom till en del och öppnar (de flesta).
- **★★★★–★★★★★** kräver uteslutning: prova ett minne i taget ur reservdelslådan, mäta
  med multimetern, eller inse att lagningen inte är värd pengarna (R16).
- **Ledtrådstrappan** ger en ledtråd åt gången, med servicepärmen köpt. Barn ska aldrig
  kunna köra fast helt.
- **Fel gissning kostar:** byter man ut en hel del som var hel får man betala den själv.
  Därför lönar det sig att testa och titta innan man köper.
- **Återfall:** åtgärdar man symptomet men inte orsaken (byter minne när moderkortet är
  trasigt) kommer kunden tillbaka efter några dagar, arg – minus rykte.

## 6. Betalt

```
lön = diagnosavgift + delar (med påslag) + arbete per steg + snabbhetsbonus
```
Ett dammjobb ger lite men går på en halv minut; ett moderkortsbyte ger mycket men tar tid
och kräver delar i lager. Lyckade reparationer ger **stjärnor → rykte** (se BUTIKSPLAN.md),
vilket gör att fler och rikare kunder kommer in.

## 7. I co-op

Reparationer är det bästa vi har för två spelare: **en sitter vid bänken och startar om,
den andra har händerna i lådan.** "Prova nu!" i chatten, och man ser direkt om det blev
någon skillnad. Värden äger tillståndet; bänktestet är en op precis som ett byggsteg.

---

## 8. Vad som behövs i koden

| Vad | Var |
|---|---|
| Felkatalogen: `{ id, år, nivå, apply(build), symptom(state), löstAv(build), ledtrådar }` | ny `js/shops/dator/faults.js` |
| Uppdragstyp `repair` med diagnosavgift och kundcitat | `js/shops/dator/orders.js` |
| Trasig maskin = giltigt bygge för året + en felmutation | `tools/`-generatorn som `era-logic` redan använder |
| Bänktest utan föregående bygge (datorn börjar hopbyggd och urkopplad) | `js/shops/dator/desk.js` – ny ingång `openRepair(build, fault)` |
| Nya symptom: värme över tid, slumpkrasch, "no boot device", lukt, lampor på moderkortet | `desk.js` – `info()` och POST-koderna finns redan att bygga vidare på |
| Sinnesknapparna 👁👂🤚👃 på bänken | `desk.js` + `ui.js` |
| Verktyg (POST-kort, multimeter, reservdelslåda, pärm) | hör ihop med `shopfit` i BUTIKSPLAN.md |
| Test: kör alla fel, kolla att symptomet stämmer och att åtgärden gör datorn hel | ny `tools/repair.mjs` |

Bra ordning att bygga i: **R1, R2, R15** (syns utifrån) → **R7, R13, R17** (öppna och titta)
→ **R8, R12, R14** (kräver resonemang) → resten. Då finns en spelbar loop efter första
etappen, och felkatalogen kan växa i lugn och ro.
