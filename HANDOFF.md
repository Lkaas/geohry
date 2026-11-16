# HANDOFF: GeoHry (zeměpisné minihry)

> Tento soubor je jediný zdroj pravdy o stavu projektu. Kdo pokračuje v práci (člověk nebo jiný model), přečte si nejdřív tohle. Aktualizuje se po každém dokončeném kroku.

## Cíl projektu

Statická webová aplikace se sbírkou zeměpisných miniher (styl Globle, Travle, Countryle, GeoGrid, Draw the border) pro bratra autora (16 let, baví ho vlajky a zeměpis, hraje na počítači). Celé rozhraní i názvy zemí jsou česky. Bez backendu, data jsou součástí projektu, nasazení zdarma na GitHub Pages.

## Zadání (zkrácené, bez ztráty podstaty)

**Autor:** začínající programátor (základy Pythonu, pár příkazů v terminálu, webový vývoj nezná). Kroky, které má dělat on, psát přesně a vysvětlovat.

**Pravidla dokumentace a předávání**
1. `HANDOFF.md` vzniká před prvním řádkem kódu a aktualizuje se po každém kroku (ne až na konci fáze).
2. Povinné sekce: Cíl projektu, Jak projekt spustit, Stack a klíčová rozhodnutí, Struktura projektu, Stav her (tabulka), Aktuálně rozpracováno, Další kroky, Známé chyby a dluhy, Zdroje dat a licence, Log změn.
3. Když dochází kapacita: nejdřív aktualizovat `HANDOFF.md`, pak pokračovat.
4. Psát tak, aby pokračovat mohl model, který původní chat neviděl.
5. Po každém hotovém kroku git commit.
6. Na konci každé fáze zabalit projekt do zipu (s `HANDOFF.md`, bez `node_modules`) a poslat autorovi. Při docházející kapacitě poslat zip hned.
7. Když na začátku přijde zip s rozpracovaným projektem: rozbalit, přečíst `HANDOFF.md`, pokračovat tam, kde práce skončila.

**Technické požadavky**
- Statická aplikace, žádný backend, databáze ani přihlašování. Nasaditelná na GitHub Pages / Netlify, po načtení funguje offline.
- Všechna data lokálně v projektu (JSON), nic se za běhu nenačítá z cizích API.
- Responzivní (primárně počítač, ale musí jít hrát i na mobilu).
- Postup, statistiky a série v `localStorage`.
- Každá hra: režim **Denní výzva** (deterministický seed z data, stejná pro všechny) a **Volná hra** (náhodně, neomezeně).
- Sdílení výsledku jako text s emoji do schránky.
- U každé hry nejdřív herní logika jako čisté funkce + testy (Vitest), potom UI.
- Kód v menších modulech, jedna hra = jedna složka.

**Data**
- Hranice: Natural Earth (public domain). Vyřešit malé státy chybějící v hrubším rozlišení.
- Údaje o zemích: české názvy vč. alternativních, hlavní město, kontinent, populace, rozloha, střed, ISO kódy, pozemní sousedé.
- Vlajky: lokální SVG.
- Předpočítaná matice vzdáleností mezi **hranicemi** všech dvojic zemí + vzdálenosti a směry mezi středy. Počítá se při přípravě dat, ne v prohlížeči.
- Atributy vlajek (barvy, hvězda, kříž, zvíře, text, kruh, vzor): v samostatném snadno opravitelném souboru, označené jako „potřeba ověřit“.
- Seznam zemí: 193 členů OSN + Kosovo, Tchaj-wan, Palestina, Vatikán. Stejný ve všech hrách.

**Sdílené komponenty (před hrami)**
- Našeptávač zemí: bez diakritiky, bez ohledu na velikost písmen, zná alternativní názvy, nenabízí použité tipy.
- Mapa: svět nebo výřez, obarvení zemí, zoom a posun.
- Domovská obrazovka: dlaždice her s ikonou, popisem a stavem dnešní výzvy.
- Statistiky: odehráno, úspěšnost, aktuální a nejdelší série, rozložení pokusů.
- Nápověda u každé hry při prvním spuštění.

**Hry (bez hvězdičky = povinné, pořadí je závazné)**
1. **Tajemná země** (Globle): tipy se barví podle vzdálenosti hranic od hledané země (studená → teplá), vypíše se vzdálenost v km, sousedství se výslovně oznámí („Sousedí!“), tipy řazené od nejbližšího, neomezeně pokusů (počítají se).
2. **Cesta mezi zeměmi** (Travle): start A, cíl B spojené po souši. Hráč vypisuje země cesty; na mapě jsou vidět jen A, B a uhodnuté. Zelená = leží na některé nejkratší cestě, žlutá = odbočka o jednu zemi, červená = mimo. Konec, když uhodnuté země tvoří souvislou cestu. Limit pokusů = délka nejkratší cesty + 4. BFS přes graf sousedů, jen dvojice s cestou délky 2–6, bez ostrovních států. Volitelně nápověda (obrys jedné země cesty).
3. **Countryle**: tabulka srovnání tipu s hledanou zemí: kontinent, polokoule (S/J, V/Z), populace (šipka + barva podle rozdílu), rozloha (totéž), průměrná teplota / klima (jen při spolehlivých datech, jinak nahradit a zapsat proč), směr a vzdálenost. Limit 8 pokusů.
4. **GeoGrid**: mřížka 3×3, řádky a sloupce mají kategorie, do políčka země splňující obě. Země jen jednou. Limit tipů 9 + pár navíc. Bonus: vzácnost odpovědi. Generátor zaručí aspoň 3 platné odpovědi na políčko. Kategorie jako data (název + filtr). Velká část kategorií o vlajkách.
5. **Nakresli hranici**: výřez mapy se sousedy, hledaná země vymazaná, hráč nakreslí obrys myší. Hodnocení IoU (turf.js) → procenta / hvězdičky, pak se ukáže skutečný tvar přes hráčův. Těžší varianta: bez okolí. Dělat až po hrách 1–4.

**Hry navíc (\*)**, až po hlavních a podle výběru autora:
6. Vlajkový kvíz\* (4 možnosti nebo psaní; obtížnosti: známé / celý svět / podobné vlajky)
7. Flagle\* (vlajka zakrytá dlaždicemi, odkrývá se po špatných tipech)
8. Silueta\* (Worldle: obrys země, po tipu vzdálenost a směr)
9. Klikni na mapu\* (Seterra: na čas, po kontinentech)
10. Víc, nebo míň?\* (populace / rozloha / severněji, série)
11. Vyjmenuj všechny\* (na čas, kontinent nebo svět)
12. Hlavní města\* (obousměrně)
13. Album vlajek\* (sbírka: vlajka se „nalepí“ při prvním uhodnutí země v jakékoli hře)

**Komunikace:** max 3 otázky, jinak rozhodnout sám a zapsat sem. Problémy s daty nezamlčovat, zapsat do „Známé chyby a dluhy“ a upozornit autora. Na konci fáze říct, co si má vyzkoušet.

## Jak projekt spustit

Potřebuješ [Node.js](https://nodejs.org) verze 20 nebo novější (stáhni „LTS“ a nainstaluj).

```bash
# v terminálu, ve složce projektu (tam, kde je tento soubor)
npm install        # jen poprvé: stáhne knihovny (pár minut)
npm run dev        # spustí vývojový server, vypíše adresu (http://localhost:5173)
```

Další příkazy:

```bash
npm test           # spustí testy herní logiky
npm run build      # vytvoří hotový web do složky dist/
npm run preview    # ukáže sestavený web z dist/
npm run data       # znovu vygeneruje data v src/data/ (jen když měníš skripty ve scripts/)
```

### Náhled bez instalace

Sestavený web (obsah `dist/`) je publikovaný jako soukromá stránka na claude.ai: https://claude.ai/artifact/JkTGHUYzqcBTn1VQMSruQ1 (slug `8fbc8659-2876-4551-87a1-25190ee758fe`). Vidí ji jen autor, dokud ji sám nenasdílí. Aktualizuje se ručně po `npm run build` (nahrát `dist/index.html` a změněné soubory z `dist/assets/`, staré odstranit; vlajky se nemění). Kdo k té stránce nemá přístup, tento odstavec ignoruje. Konečné nasazení je GitHub Pages (fáze 6).

## Stack a klíčová rozhodnutí

- **Vite + React + TypeScript.** React kvůli stavovému UI (tipy, tabulky, mřížky) a proto, že ho každý další model dobře zná.
- **d3-geo + topojson-client** na vykreslení map do SVG, **d3-zoom** na zoom a posun.
- **@turf/turf** až pro hru 5 (IoU nakresleného tvaru).
- **Vitest** na testy herní logiky.
- **Směrování:** hash router (`#/hra/...`), aby web fungoval na GitHub Pages bez nastavování serveru.
- **Bez UI knihovny**, vlastní CSS: `src/styles/base.css` (barvy, písmo, tlačítka, domovská obrazovka), `src/styles/components.css` (rám hry, mapa, našeptávač, modální okno, statistiky), a každá hra má vlastní CSS ve své složce.
- **Směrování jen prostým jménem za `#`** (`#tajemna-zeme`), bez lomítek. Vlastní mini-router v `src/shared/router.ts`, žádná knihovna.
- **Mapa se načítá líně** (`import('…world.topo.json?raw')` ve `src/shared/world.ts`), aby se domovská obrazovka načetla rychle. Hry se načítají přes `React.lazy`.
- **Mapa:** projekce Natural Earth, SVG s viewBoxem 2000×1010, zoom a posun přes d3-zoom přímo nad DOM (bez překreslování Reactu). Tvary zemí se počítají jednou při načtení.
- **Písmo:** Bricolage Grotesque (variabilní, balíček `@fontsource-variable/bricolage-grotesque`, součást buildu, žádné načítání z internetu).

### Vzhled

- Motiv **„Námořní mapa“** (hotový 16. 11. 2026 podle `DESIGN-PROMPT.md`, maketa v `design/maketa.html`): tištěná námořní mapa. Stránka je „hluboká voda“ (skoro bílá) s drobnými hloubkovými údaji v pozadí (SVG v `body` v `base.css`), mapy mají modrou „mělčinu“ a béžovou pevninu, panely jsou bílé „listy“ s tenkou černou linkou (`--line: 1.5px`), rohy 2 px, žádné stíny. Jediná výrazná barva je **purpurová** (`--magenta`): hlavní tlačítko, podtržení odkazů, obrys fokusu, čísla listů, kompasová růžice, výběr v GeoGridu a novém tipu v Tajemné vlajce.
- Barvy jsou jako CSS proměnné v `:root` nahoře v `src/styles/base.css`. Mimo ně: `HEAT_STOPS` v `mystery/logic.ts` (+ přechod v `mystery.css`), `KIND_COLOR` v `RouteGame.tsx`, `COLORS` v `NeighborsGame.tsx`, barvy vlajek her v `Emblem.tsx`.
- Nápis GeoHry tvoří šest signálních vlajek G-E-O-H-R-Y (`SignalFlags.tsx`, malá verze v hlavičce her), na domovské stránce vpravo `CompassRose.tsx`. Dlaždice her jsou vlajky na stožáru s číslem „list N“. Mapy, plocha Nakresli hranici a Siluety mají dílkovaný rám jako stupnici na okraji mapy (jedno společné pravidlo ve `components.css`, třídy `.map`, `.border__canvas`, `.silhouette__canvas`).
- Každá hra má místo ikony vlastní vymyšlenou vlajku 4:3 (`src/shared/components/Emblem.tsx`).
- Nadpisy zúženým řezem (`font-stretch: 80%`), žádné verzálky. Animace: zkosení vlajky na dlaždici po najetí myší a easter eggy (níže); `prefers-reduced-motion` všechny animace vypíná.
- **Tmavý režim („noční mapa“)** se přepíná **tlačítkem** (ne automaticky podle systému) v hlavičce her i vpravo nahoře na domovské stránce (`ThemeToggle.tsx`). Volba se pamatuje v `geohry:theme` (`"dark"`/`"light"`). `src/shared/theme.ts` nastavuje atribut `data-theme` na `<html>`, `index.html` ho nastaví hned při načtení (bez bliknutí). Barvy tmavého režimu jsou v bloku `:root[data-theme='dark']` v `base.css`; v CSS tedy nikdy nepiš pevné barvy, ber proměnné (kromě záměrných: barvy vlajek, tipy v hrách s pevnými jasnými barvami, smuteční easter egg). Při přidání nové barvy ji přidej do obou bloků.
- Easter egg má vlastní šedý smuteční vzhled (vlajka na půl žerdi), nepatří do palety výše.

### Jak přidat novou hru

1. Vytvoř složku `src/games/<nazev>/` se soubory `logic.ts` (čisté funkce), `logic.test.ts`, `<Nazev>Game.tsx` (výchozí export = komponenta hry), `<Nazev>Help.tsx`, `<nazev>.css`.
2. Komponentu obal do `<GameShell game={…} mode onModeChange help={…}>`. Shell dodá hlavičku, přepínač Denní výzva / Volná hra, nápovědu (při prvním spuštění se otevře sama) a statistiky.
3. V `src/games/registry.ts` doplň u hry `component: lazy(() => import('./<nazev>/<Nazev>Game'))`. Tím se dlaždice na domovské obrazovce přepne z „Připravuje se“ na hratelnou.
4. Denní výzva: cíl vyber přes `dailyPick(GAME_ID, dateKey(), …)` nebo `dailyRandom(…)` z `src/shared/random.ts`. Rozehraný stav ukládej přes `saveDaily` / `loadDaily` (stav musí obsahovat pole `status: 'playing' | 'won' | 'lost'`).
5. Po dohrání zavolej `recordResult(GAME_ID, mode, { won, attempts, date })` a při výhře `collectCountry(id, date)` (plní budoucí Album vlajek). Volej to v obsluze události, ne v `useEffect` (jinak se v dev režimu započítá dvakrát).
6. Vzorem je `src/games/mystery/`.

### Pravidla her, jak jsou naprogramovaná

**Tajemná země** (`mystery`): barva podle vzdálenosti hranic (zlomové body `HEAT_STOPS` v `logic.ts`, stejné barvy má legenda v `mystery.css`), „přihořívá / chladne“ se porovnává s předchozím tipem, neomezeně tipů, vzdání = prohra.

**Cesta mezi zeměmi** (`route`):
- „between“ = počet zemí na nejkratší cestě **mezi** startem a cílem (bez nich). Hádanky mají between 2–6, takových dvojic je 4 708.
- Limit tipů = between + 4.
- Zelená = země leží na některé nejkratší cestě, oranžová = cesta přes ni je o jednu zemi delší, červená = jinak (i nedosažitelné a ostrovní země).
- Výhra = start a cíl jsou propojené přes uhodnuté země (jakkoli dlouhou cestou). Start a cíl nejdou tipovat.
- Nápověda ukáže čárkovaný obrys jedné netipované země z nejkratší cesty (tu nejblíž startu). Počet tipů nesnižuje, jen se ukáže ve sdíleném textu (💡).
- Po prohře se ukáže jedna nejkratší cesta. Na mapě jsou vidět jen start, cíl, tipy a napovězené obrysy (`onlyIds` + `ghostIds` ve `WorldMap`).

**Countryle** (`countryle`): 8 pokusů. Kontinent a polokoule (podle `lat`/`lon` středu): shoda / neshoda. Obyvatelé a rozloha se porovnávají poměrem větší/menší: do 1,3× zelená, do 3× žlutá, jinak šedá. Teplota rozdílem: do 2 °C zelená, do 6 °C žlutá, jinak šedá; když údaj chybí (Tchaj-wan), buňka je „údaj chybí“. Šipka ▲/▼ říká, jestli má hledaná země víc/míň. Směr = šipka natočená podle azimutu + vzdálenost středů. Hranice jsou konstanty nahoře v `logic.ts`.

**GeoGrid** (`geogrid`):
- Mřížka 3×3, políčka se číslují 0–8 po řádcích. 12 tipů na 9 políček, počítá se každý tip. Výhra = všech 9 vyplněno. Země jde použít jen jednou.
- **Kategorie jsou data** v `categories.ts`: `{ id, label, group, test(country) }`. Nová kategorie = nový záznam v poli `CATEGORIES`. `id` po vydání neměnit (ukládá se do rozehraných denních her). Písmenné kategorie („Název začíná na S“) se generují samy pro písmena, na která začíná aspoň 9 zemí; Ch, Č, Š, Ř, Ž jsou samostatná písmena.
- **Generátor** (`generateGrid`): náhodně 3 řádky, k nim sloupce, které s každým řádkem dají aspoň 3 odpovědi. Pravidla (`isPlayableGrid`): každé políčko má aspoň 3 odpovědi, existuje vyplnění devíti různými zeměmi, aspoň 2 kategorie jsou o vlajkách, z jedné skupiny (`group`) nejvýš 1 kategorie (`GROUP_LIMIT` povoluje 2 u barev vlajek, symbolů a kontinentů).
- Po špatném tipu hra řekne, kterou podmínku země nesplnila. Našeptávač v této hře **neukazuje vlajky** (napovídaly by).
- **Vzácnost** 0–100 je náhradní měřítko (nemáme data o tom, co hráči odpovídají): správné odpovědi políčka se seřadí podle počtu obyvatel, nejlidnatější = 0, nejmenší = 100. Celkové skóre je průměr přes 9 políček.
- Po dohrání jde kliknout na políčko a zobrazí se všechny správné odpovědi.

**Nakresli hranici** (`border`):
- **Které země:** jen `drawable: true` (154 zemí): rozloha aspoň 6 500 km² a největší souvislý kus území tvoří aspoň 75 % rozlohy. Vypadnou ministáty a souostroví (Indonésie, Filipíny, Japonsko, Nový Zéland, Dánsko, ...). Počítá se v `scripts/build-data.mjs`.
- **Kreslí se jen největší souvislý kus** (Itálie bez Sicílie a Sardinie, USA bez Aljašky). Ostatní části se po vyhodnocení ukážou světle zeleně čárkovaně.
- **Výřez** (`scene.ts`): pro každou zemi vlastní plochojevná azimutální projekce se středem v zemi, viewBox 900×640, země zabírá zhruba prostřední polovinu.
- **Obtížnost „S mapou okolí“:** je vidět okolní pevnina, hledaná země je zakrytá „bílým místem“ = obdélník kolem jejího obrysu zvětšený o 9 %. (Díra přesně ve tvaru země by z hry udělala obkreslování, proto obdélník.) Hodnotí se překryv přesně tam, kde hráč kreslil.
- **Obtížnost „Z paměti“:** prázdný papír. Před hodnocením se tah posune a zvětší tak, aby měl stejné těžiště a plochu jako skutečný tvar (bez otáčení).
- **Hodnocení:** překryv IoU (průnik / sjednocení). Tvary se rastrují vlastní funkcí `rasterize` na mřížku 240×240 (bez canvasu a bez turf.js, takže jde testovat v Node; tah rukou pravidlem nonzero, skutečný tvar evenodd). `@turf/turf` se nakonec nepoužívá.
- **Hvězdičky:** 1 až 5, hranice 35 / 50 / 65 / 80 %. Od 3 hvězdiček se kolo počítá jako výhra. Do statistik se jako „počet pokusů“ ukládá počet hvězdiček (`formatAttempts` v `GameShell`).
- Jeden tah, konec se spojí se začátkem, nový tah nahradí starý, odevzdává se tlačítkem. Denní výzva jde odevzdat jen jednou; tah se ukládá, aby šel po návratu znovu ukázat.

**Tajemná vlajka** (`flag-clues`, adresa `#tajemna-vlajka`):
- Hra popisuje vlajku nápovědami od mlhavých po přesné. První je vidět hned, další se odkryje po každém tipu nebo po tlačítku „Další nápověda bez tipu“ (i to se počítá jako pokus). Po poslední nápovědě zbývá jeden tip.
- **Nápovědy se generují samy** (`candidateClues`): počet barev, přítomnost / nepřítomnost barvy, podíl barvy na ploše („asi 35 %“, zaokrouhleno na 5, tolerance ±5 bodů; pod 3 % „nepatrná část“), převládající barva (jen když vede aspoň o 5 bodů, jinak „žádná nepřevládá“), symboly, klín, jen pruhy.
- **Pořadí** (`selectClues`): v každém kroku se vezme nápověda, po které zbude počet vyhovujících vlajek nejblíž plánu `TARGET_REMAINING = [100, 50, 22, 9, 4, 1]`. Nejvýš 6 nápověd o vlajce, pak kontinent, a když ani to nestačí (Nizozemsko × Lucembursko), ještě první písmeno názvu. Nejvýš tedy 8 nápověd.
- Hra ukazuje, kolika vlajkám všechny odkryté nápovědy odpovídají, a u špatného tipu, na kolik nápověd seděl.

**Sousedé** (`neighbors`, `#sousede`): zadaná země s aspoň 2 sousedy, hráč vyjmenuje všechny. Počítají se i zámořské hranice (Francie má 11 sousedů včetně Nizozemska, Brazílie a Surinamu); u takového souseda hra napíše „soused přes zámořské území“. Hra říká, kolik jich je. Třetí chyba = konec. Do statistik se jako „počet pokusů“ ukládá počet chyb. Mapa ukazuje jen zadanou zemi, nalezené sousedy a špatné tipy; po prohře čárkovaně chybějící.

**Silueta** (`silhouette`, `#silueta`): obrys celé země (i s ostrovy) ve vlastní projekci (`shape.ts`), 6 pokusů, po špatném tipu vzdálenost středů, směr a blízkost v procentech (100 − vzdálenost / 20 000 km). Jen země s `marker: false` (164).

**Víc, nebo míň?** (`higher-lower`, `#vic-nebo-min`):
- Šest témat v poli `PARAMS` v `logic.ts`: obyvatelé, rozloha, HDP, HDP na obyvatele, hustota zalidnění, průměrná teplota. **Jedno kolo = jedno téma**, nemíchají se. Nové téma = nový záznam v `PARAMS`.
- Vlevo země se známou hodnotou, vpravo se hádá víc / míň. Správně → pravá se posune doleva a přijde nová. Hraje se do první chyby.
- Sousední dvojice se liší aspoň o 15 % (teplota o 1,5 °C), žádná země se v kole neopakuje, země bez údaje se v tématu neobjeví.
- Denní výzva: téma podle dne (střídá se dokola), nejvýš 15 dvojic, splněná od série 5. Volná hra: téma si hráč vybírá, série až 150.
- Do statistik se jako „počet pokusů“ ukládá délka série.

**Easter egg Československo:** když hráč v kterémkoli políčku pro zemi napíše celé „Československo“ (i bez diakritiky) a dá Enter, `CountryInput` vyšle událost `geohry:ceskoslovensko`, políčko se vymaže a tip se nepočítá. Komponenta `EasterEgg` (připojená jednou v `App.tsx`) ukáže šedou smuteční obrazovku: vlajka (shodná s českou) pomalu sjede na půl žerdi, vedle je datum vzniku (28. 10. 1918) a zániku (31. 12. 1992). Hraje dokola **„Kde domov můj“**, česká část československé hymny (hudba František Škroup 1834, volné dílo), syntetizovaná přes Web Audio (bez zvukového souboru, tichý varhanní zvuk s ozvěnou, tempo 0,9 s na dobu). Noty (`MELODY` v `src/shared/easterEgg.ts`, názvy not + délky v dobách, 17 taktů) jsou přepsané z LilyPond zápisu hymny na Wikimedia Commons, test hlídá součet 68 dob a první/poslední notu. **Slovenská část hymny („Nad Tatrou sa blýska“) chybí**, její noty se nepodařilo ověřit; kdo dodá ověřený zápis, může ji přidat za českou část do `MELODY`. Zavírá se klávesou Esc, tlačítkem nebo kliknutím. Při `prefers-reduced-motion` vlajka rovnou stojí na půl žerdi.

Společné styly seznamu tipů (`.guess-list`, `.guess`) a výsledku kola (`.result`) jsou v `src/styles/components.css`.

### Katalog easter eggů (aby je autor mohl případně prozradit nebo zakázat)

Nic se neukazuje samo, všechno se musí najít. Zprávy dole na obrazovce (`Toast`, mizí po 5,5 s nebo klikem) posílá `showToast` ze `src/shared/toast.ts`.

- **Československo** (slovo v políčku pro zemi): smuteční obrazovka a hymna (popsáno výše).
- **Tajná slova v políčku pro zemi** (`SECRET_WORDS` v `src/shared/secrets.ts`, po Enteru hláška, tip se nepočítá): Wakanda, Narnie, Mordor, Atlantida, Kocourkov, Země/Svět/Zeměkoule, Měsíc, Antarktida a věcné poznámky o zaniklých státech (Sovětský svaz/SSSR, Jugoslávie, NDR, Rakousko-Uhersko). Nové slovo = nový záznam v poli; test hlídá, že nepatří skutečné zemi.
- **Konami kód** (↑ ↑ ↓ ↓ ← → ← → B A, kdekoli): déšť signálních vlajek (`FlagRain.tsx`), při `prefers-reduced-motion` jen hláška.
- **Klik na signální vlajky nad nápisem GeoHry** (domovská stránka): hláška, co vlajka znamená (`FLAG_MEANINGS`; G potřebuji lodivoda, E měním kurz doprava, O člověk přes palubu, H mám lodivoda na palubě, R dnes bez významu, Y vleče se mi kotva). Významy jsem ověřil vyhledáním, **kresby vlajek ne**.
- **Klik na kompasovou růžici** (domovská stránka): roztočí se, sedmý klik v řadě přidá hlášku.
- **Svátky a výročí** (`specialDayNote` v `secrets.ts`): věta pod datem na domovské stránce 28. 10., 17. 11., 1. 1., 22. 4. (Den Země), 30. 3. (výročí zákona č. 252/1920 Sb. o státní vlajce, počítá počet let) a 1. 4. (apríl: vymyšlené vlajky na dlaždicích visí vzhůru nohama, třída `home--april`; věta o Filipínách).
- **Další tajná slova** (`SECRET_WORDS`): Sealand, Bir Tawil, Liberland, Pobřeží Čech / České moře / Bohemia (pozor: „Čechy“ je alias Česka, takže je to normální tip), Nemo / Bod Nemo.
- **Národní domény v políčku pro zemi** (`trivia.ts`, `CountryInput`): `.tv` vybere Tuvalu jako normální tip, `.fm` Mikronésii, `.uk` Spojené království (výjimka) atd. K `.tv`, `.fm`, `.cz`, `.ai`, `.su` přijde poznámka (`DOMAIN_NOTES`). `.ai` a `.su` nepatří žádné zemi v seznamu, tak jen ukážou poznámku.
- **Perličky o zemích** (`COUNTRY_TRIVIA` v `trivia.ts`): při zadání Lichtenštejnska, Uzbekistánu, Nepálu, Vatikánu, Švýcarska, Čadu, Rumunska, Indonésie, Monaka, Haiti, Irska, Pobřeží slonoviny a Filipín se jednou (klíč `geohry:trivia-seen`) ukáže věcná poznámka o vlajce nebo poloze. Ve hrách s `showFlags={false}` (vlajkové hry) se nezobrazují, aby nenapovídaly. Test porovnává část tvrzení s daty (dvojnásobně vnitrozemské jsou právě LIE a UZB, nejmenší stát je VAT, barvy vlajek párů).
- **Tajný plán**: pět kliknutí na nadpis „Další hry v plánu“ přidá přeškrtnutou položku „Ušít vlajku Nepálu“.
- **197. odehraná hra** (`milestones.ts`): při načtení domovské stránky, když součet odehraných her (denních i volných, všechny hry) dosáhne počtu zemí; ukáže se jednou.

Zdroje faktů pro easter eggy (ověřeno vyhledáním 16. 11. 2026): Wikipedie (Bir Tawil, Sealand/HM Fort Roughs, Liberland, Flag of Liechtenstein, Flag of Nepal, Flag of the Philippines, Point Nemo), Britannica a Worldatlas (dvojnásobně vnitrozemské státy, podobné vlajky, čtvercové vlajky), Project Gutenberg (Zimní pohádka, 3. dějství, 3. scéna), psp.cz a Česká televize (zákon z 30. 3. 1920), vexi.info (číslo 252/1920 Sb.), IANA/AFNIC/ICANN wiki (domény). Čísla: Sealand asi 12 km od Suffolku (zdroje uvádějí 11 až 13 km), Bir Tawil 2 060 km², Liberland 7 km², Point Nemo 2 688 km. Z paměti, bez vyhledání: Irsko a Pobřeží slonoviny mají stejné barvy v opačném pořadí (test kontroluje jen shodu sady barev).

### Sbírka zemí a Vlajka dne

- **Sbírka** (`#sbirka`, `CollectionPage.tsx`, líně načítaná v `App.tsx`; odkaz je slovo „sbírce“ ve větě pod nadpisem domovské stránky): mapa světa s obarvenými uhodnutými zeměmi (z klíče `geohry:album`, který plní `collectCountry` při výhře ve hrách Tajemná země, Countryle, Tajemná vlajka, Sousedé a Nakresli hranici). Klik na obarvenou zemi otevře kartu (vlajka, kontinent, hlavní město, obyvatelé a rozloha s pořadím ze 197, datum uhodnutí, sousedé, které už hráč má, jako tlačítka). Neuhodnuté země zůstávají bez jména a bez karty. Výpočty pořadí a postupu po kontinentech jsou v `collection.ts` (testy). Plánovaná hra „Album vlajek“ byla z přehledu odstraněna, Sbírka ji nahrazuje.
- **Vlajka dne** (`FlagOfDay.tsx`, `flagOfDay.ts`): rámeček pod nadpisem domovské stránky. Země se bere z `dailyPick` jen mezi těmi, o kterých jde říct něco zajímavého (`flagFacts`: podíl barvy v první desítce, vzácný symbol na vlajce, pořadí v obyvatelích a rozloze), a nikdy to není země, která je dnes hledaná v některé hře (`dailyAnswers.ts` bere `pickTarget` šesti her). Věty o symbolech začínají „Podle dat v GeoHrách“, protože atributy vlajek jsou psané ručně a mohou být nepřesné.
- **Přepnutí na jinou kartu**: titulek karty se změní na „Mapa na tebe čeká…“, po návratu se vrátí.
- **Konzole prohlížeče** (F12): pozdrav s nápovědou (`main.tsx`).

## Průvodce úpravami vzhledu

Pro toho, kdo bude ladit vzhled (redesign „Námořní mapa“ je hotový, viz oddíl „Vzhled“). Pravidla:

1. **Měň jen soubory `.css` a JSX v komponentách `*Game.tsx`, `*Help.tsx`, `Home.tsx` a `src/shared/components/`.** Nesahej na `logic.ts`, `categories.ts`, `scene.ts`, `shape.ts`, `src/shared/*.ts`, `src/data/` ani `scripts/`. Tam je herní logika a data, vzhled se jich netýká.
0. **Zadání vzhledu, podle kterého je aplikace přestavěná, je v `DESIGN-PROMPT.md`** (motiv „Námořní mapa“), maketa v `design/maketa.html`. Slouží jako vzor, kdyby se vzhled ladil dál; body níže jsou obecná pravidla.
2. **Po každé změně spusť** `npm run typecheck && npm test && npm run build`. Všech 198 testů musí projít. Testy vzhled nehlídají, jen logiku, takže výsledek si vždy prohlédni v prohlížeči (`npm run dev`).
3. **Barvy a písmo se mění na jednom místě:** proměnné `--ink`, `--sea-deep`, `--sea`, `--land`, `--paper`, `--red`, `--yellow`, `--green`, ... nahoře v `src/styles/base.css`. Většina aplikace je bere odtud.
   Výjimky, kde jsou barvy napsané přímo: barevná škála Tajemné země (`HEAT_STOPS` v `src/games/mystery/logic.ts` + přechod v `mystery.css`, musí zůstat stejné; studené body ztmavené kvůli světlému moři), barvy tipů v `RouteGame.tsx` (`KIND_COLOR`), `NeighborsGame.tsx` (`COLORS`), vymyšlené vlajky her v `src/shared/components/Emblem.tsx`.
4. **Kde co je:**
   - `src/styles/base.css`: proměnné, písmo, tlačítka (`.button`, `.button--primary`, `.button--ghost`, `.chip`), vlajky (`.flag--small/medium/large`), domovská obrazovka (`.home`, `.tiles`, `.tile`).
   - `src/styles/components.css`: hlavička hry (`.shell__*`), přepínač (`.segmented`), rozložení hry (`.game`, `.game__map`, `.game__panel`), mapa (`.map__*`), našeptávač (`.country-input__*`), modální okno (`.modal`), statistiky (`.stats__*`), seznam tipů (`.guess-list`, `.guess`), výsledek (`.result`), legenda (`.route-legend`), easter egg (`.easter-egg`).
   - Každá hra má vlastní CSS ve své složce (`src/games/<hra>/<hra>.css`) s třídami začínajícími názvem hry (`.geogrid__*`, `.hl__*`, `.border__*`, ...).
5. **Pozor na sdílené třídy.** `.guess`, `.result`, `.game__panel`, `.route-legend`, `.border__task`, `.geogrid__feedback` používá víc her (poslední dvě mají historický název, ale jsou v `components.css` a používají je i Sousedé). Když je změníš, změní se všude.
6. **Neměň:** atributy `data-id` na mapě, `aria-*` atributy, texty v `id` her v `registry.ts`, názvy klíčů v localStorage. Texty nápověd a popisků měnit jde.
7. Rozložení her: většina má mapu vlevo a panel 380 px vpravo (`.game`), pod 900 px se skládá pod sebe. Countryle, Víc nebo míň a GeoGrid mají vlastní rozložení.
8. Písmo je Bricolage Grotesque (variabilní, v balíčku). Jiné písmo: nainstalovat balíček `@fontsource-variable/<název>`, importovat v `src/main.tsx` a přepsat `--font` v `base.css`.

### Klíče v localStorage (prefix `geohry:`)

`stats:<hra>:<daily|free>` statistiky, `daily:<hra>:<datum>` stav denní výzvy, `help-seen:<hra>` nápověda už byla zobrazena, `album` sbírka uhodnutých zemí `{ CZE: '2026-11-16' }`.

### Rozhodnutí o datech (fáze 1)

- **Seznam zemí: 197** = 193 členů OSN + Vatikán, Kosovo, Tchaj-wan, Palestina. Identifikátor země je všude kód ISO alpha-3 (`CZE`), Kosovo má `UNK`. Pole `iso2` (malými písmeny) slouží jen pro název souboru vlajky.
- **Údaje o zemích** z npm balíčku `world-countries` (= dataset mledoze/countries): české názvy, rozloha, střed (`lat`, `lon`), vnitrozemskost, sousedé. V datasetu je Vatikán chybně veden jako člen OSN, skript to opravuje.
- **České názvy:** základ z `world-countries`, ruční úpravy a aliasy v `scripts/sources/names-cs.mjs`. Oficiální dlouhý název se přidává jako alias automaticky. Kontrola hlídá, že žádný název ani alias nepatří dvěma zemím.
- **Hlavní města česky:** ručně v `scripts/sources/capitals-cs.mjs` (první název se zobrazuje, další se přijímají jako správná odpověď).
- **Kontinenty** (6): Evropa, Asie, Afrika, Severní Amerika (včetně Střední Ameriky a Karibiku), Jižní Amerika, Austrálie a Oceánie. Země na dvou kontinentech jsou zařazené podle `world-countries`: Rusko = Evropa, Turecko, Kazachstán, Gruzie, Arménie, Ázerbájdžán a Kypr = viz `countries.json` (Kypr = Evropa, ostatní Asie).
- **Populace:** Světová banka (ukazatel SP.POP.TOTL, poslední dostupný rok 2025) přes zrcadlo `datasets/population` na GitHubu. Tchaj-wan a Vatikán Světová banka nevede, ty jsou z Natural Earth (2019–2020). Uloženo v `scripts/sources/population.json`, obnovuje se ručně skriptem `scripts/fetch-population.mjs` (potřebuje internet, postup je v hlavičce skriptu).
- **Mapa:** Natural Earth 1:50m z balíčku `world-atlas`, s těmito úpravami (vše v `scripts/build-data.mjs`):
  - **Krym** přesunut z Ruska k Ukrajině (Natural Earth ho ve výchozí verzi kreslí k Rusku).
  - **Somaliland** sloučen se Somálskem, **Severní Kypr** s Kyprem.
  - **Zámořské části Francie** (Francouzská Guyana, Réunion, Mayotte, Martinik, Guadeloupe), **Karibské Nizozemsko** a **Tokelau** jsou odpojené jako nehratelná území. Důvod: jinak by Francie měla nulovou vzdálenost k Brazílii.
  - **Tuvalu** v rozlišení 50m chybí, bere se z 10m.
  - **Západní Sahara** zůstává samostatné nehratelné území (Maroko tedy nesousedí s Mauritánií).
  - Ostatní území (Grónsko, Portoriko, Hongkong, ...) jsou na mapě jako nehratelná „territories“ s českým názvem.
- **Malé země:** 33 zemí s rozlohou pod 6 500 km² má `marker: true`. Mapa jim má kreslit navíc kroužek na `centroid`, aby byly vidět a šly trefit.
- **Sousedé:** z `world-countries`, jen mezi hratelnými zeměmi, ruční opravy v `scripts/sources/borders-fix.mjs` (odstraněna Srí Lanka–Indie). 40 zemí nemá žádného pozemního souseda.
- **Zámořské hranice** (`overseasNeighbors`): hranice, které existují jen přes zámořská území, jež jsou součástí státu. Seznam je v `OVERSEAS_BORDERS` ve `scripts/sources/borders-fix.mjs`: Francie–Nizozemsko (ostrov Svatý Martin), Francie–Brazílie a Francie–Surinam (Francouzská Guyana). Na mapě se tyto země nedotýkají, proto **nejsou v `neighbors`**: Cesta mezi zeměmi a vzdálenosti v Tajemné zemi s nimi nepočítají. **Počítají s nimi hry Sousedé a GeoGrid** (funkce `allNeighbors` ve `src/shared/data.ts`). Přidáno 16. 11. 2026 na přání autora. Nepřidáno (autor o ně nežádal, jsou sporné): Spojené království–Španělsko přes Gibraltar, Spojené království–Kypr přes vojenské základny, Dánsko–Kanada na Hansově ostrově.
- **Vzdálenosti mezi hranicemi:** `src/data/distances.json` = `{ ids, km }`, plná symetrická matice 197×197 v celých km, pořadí stejné jako v `countries.json`. Počítá se z obrysů zahuštěných na body po max. 8 km (chyba do pár km). **Platí: vzdálenost 0 právě tehdy, když země sousedí** (sousedé mají vynucenou 0, nesousedé minimálně 1 km).
- **Vzdálenost a směr mezi středy** se nepředpočítává, je to levný výpočet z `lat`/`lon` za běhu (funkce ve `src/shared/geo.ts`). Odchylka od zadání, které chtělo předpočítat vše; matice by jen zvětšila data.
- **Vlajky:** SVG 4:3 z balíčku `flag-icons`, zkopírované do `public/flags/<iso2>.svg` (197 souborů, 1,3 MB).
- **Průměrná roční teplota** (`avgTemp`, °C, průměr 1991–2020): tabulka „List of countries by average yearly temperature“ z Wikipedie (data Světové banky / CRU) ve strojově čitelné podobě z `samayo/country-json`. Uloženo v `scripts/sources/temperature.json`, obnovuje se ručně skriptem `scripts/fetch-temperature.mjs`. Dataset je o něco starší otisk tabulky: ze 14 namátkou ověřených hodnot jich 11 sedělo přesně a 3 se lišily do 1,2 °C (opraveny ručně ve skriptu spolu s doplněním Kosova a Černé Hory). **Tchaj-wan hodnotu nemá (`null`)**, v tabulce není; Countryle s tím musí počítat (ukázat „údaj chybí“).
- **HDP** (`gdp` v USD v běžných cenách, `gdpYear`): Světová banka, ukazatel NY.GDP.MKTP.CD, přes zrcadlo `datasets/gdp` na GitHubu; uloženo v `scripts/sources/gdp.json`, obnova skriptem `scripts/fetch-gdp.mjs`. Bere se poslední rok, většinou 2023. Údaje starší než 2020 se zahazují. **Bez HDP (`null`) je 7 zemí:** Eritrea, Severní Korea, Jižní Súdán, Tchaj-wan, Vatikán, Venezuela, Jemen.
- **Podíly barev na vlajce** (`flag.shares`): procenta plochy změřená z obrázku, přepočtená tak, aby barvy vlajky dávaly dohromady 100 (detaily znaků se rozpustí). Používá je hra Tajemná vlajka.
- **Köppenovo klimatické pásmo zatím není.** Zdroje (Beck et al. na Figshare / gloh2o.org) nejsou z pracovního prostředí dostupné (síť povoluje jen GitHub a registry balíčků) a hotový CSV „pásmo podle země“ na GitHubu se nenašel. Pro Countryle stačí teplota. Pásmo by se hodilo jako kategorie do GeoGridu („tropické podnebí“); jde doplnit, když autor soubor s mapou přiloží nebo povolí doménu.
- **Atributy vlajek** (`flag` u každé země) — **POTŘEBA OVĚŘIT, hlavně symboly:**
  - **Barvy** (`flag.colors`, hodnoty `red, white, blue, green, yellow, black, orange`) se počítají automaticky: `scripts/analyze-flags.mjs` (`npm run flags`) vykreslí každé SVG bez vyhlazování a změří podíl plochy každé barvy; výsledek je v `scripts/sources/flag-colors.json`. Barva se počítá od 1 % plochy. Světle modrá = modrá, vínová = červená, zlatá = žlutá. Ruční opravy (detaily státních znaků pryč, Arménie oranžová místo žluté, Džibutsko + červená) jsou v `COLOR_REMOVE` / `COLOR_ADD` v `scripts/sources/flags-manual.mjs`.
  - **Jen pruhy** (`flag.stripes`: `horizontal` / `vertical` / `null`) automaticky: skoro každý řádek, resp. sloupec obrázku je jednobarevný. Vyšlo 24 vodorovných a 11 svislých, seznam odpovídá realitě.
  - **Symboly** (`star, sun, crescent, cross, animal, text, hoistTriangle`) jsou ruční seznamy ve `flags-manual.mjs`, sepsané z hlavy a zkontrolované jen pohledem na zmenšené náhledy všech 197 vlajek. Sporné případy, kde jsem se musel rozhodnout: hvězdy uvnitř znaků (Slovinsko, Paraguay, Rovníková Guinea započítány; Bolívie, Chorvatsko, Ekvádor ne), kříž u Srbska (ve znaku, započítán), Marshallovy ostrovy a Nauru jako hvězda (ne slunce), nápis u Malty (drobný text na kříži), „slunce“ jen s paprsky (Japonsko, Bangladéš, Palau, Niger ne).
  - Vlajky v balíčku `flag-icons` 7.6: Afghánistán = trikolóra republiky se znakem, Sýrie = nová vlajka z roku 2025 (tři červené hvězdy), Kostarika, Peru a Venezuela bez státního znaku.

## Struktura projektu

```
HANDOFF.md                      tento soubor
DESIGN-PROMPT.md                zadání pro přepracování vzhledu („Námořní mapa“), určené pro jiný model
design/maketa.html, maketa.png  maketa cílového vzhledu (obyčejná stránka, aplikace ji nenačítá)
package.json, vite.config.ts    nastavení projektu
index.html                      vstupní stránka
scripts/
  build-data.mjs                hlavní skript: sestaví src/data/* a zkopíruje vlajky
  check-data.mjs                kontrola dat (počet zemí, názvy, symetrie sousedů, matice)
  fetch-population.mjs          ruční obnova populací (potřebuje internet)
  fetch-temperature.mjs         ruční obnova průměrných teplot (potřebuje internet)
  fetch-gdp.mjs                 ruční obnova HDP (potřebuje internet)
  analyze-flags.mjs             automatický rozbor barev a pruhů vlajek (`npm run flags`)
  sources/
    names-cs.mjs                ruční úpravy českých názvů + aliasy + názvy území
    capitals-cs.mjs             česká hlavní města
    borders-fix.mjs             ruční opravy sousedů
    population.json             populace (Světová banka + Natural Earth)
    temperature.json            průměrné roční teploty
    gdp.json                    HDP zemí (Světová banka)
    flag-colors.json            podíly barev na vlajkách (výstup analyze-flags.mjs)
    flags-manual.mjs            ruční opravy barev + seznamy symbolů na vlajkách (POTŘEBA OVĚŘIT)
src/
  data/                         VYGENEROVANÉ, needitovat ručně (změny dělej ve scripts/ a spusť `npm run data`)
    countries.json              197 zemí
    world.topo.json             mapa (TopoJSON: objects.countries = hratelné, objects.territories = ostatní)
    distances.json              matice vzdáleností mezi hranicemi
  main.tsx, App.tsx             vstup aplikace a přepínání obrazovek podle adresy
  Home.tsx                      domovská obrazovka (dlaždice her)
  styles/base.css, components.css
  shared/
    types.ts                    typ Country, GameMode
    data.ts                     COUNTRIES, getCountry, borderDistanceKm, areNeighbors, flagUrl
    normalize.ts                normalize, searchCountries (našeptávač), findCountryExact
    geo.ts                      centerDistanceKm, bearingDeg, compass (8 směrů), formatKm, formatNumber
    random.ts                   seededRandom, shuffled, dateKey, dailyPick, dailyRandom
    text.ts                     plural (české skloňování podle počtu)
    format.ts                   formatPopulation, formatArea, formatTemperature, formatUsd, formatRounded
    easterEgg.ts                easter egg Československo: rozpoznání slova, melodie (Web Audio)
    secrets.ts, toast.ts        další easter eggy: tajná slova, výklad signálních vlajek, svátky, Konami kód; zprávy dole (showToast)
    theme.ts                    tmavý režim (useTheme, setTheme, initTheme)
    trivia.ts, collection.ts    perličky o zemích a domény; pořadí a postup po kontinentech pro Sbírku
    flagOfDay.ts, dailyAnswers.ts   vlajka dne a seznam dnešních hledaných zemí
    milestones.ts               197. odehraná hra
    storage.ts                  loadJson / saveJson (bezpečný localStorage)
    stats.ts                    statistiky (applyResult, recordResult), denní stav, album
    world.ts, useWorld.ts       líné načtení mapy a příprava SVG tvarů
    router.ts                   useRoute (část adresy za #)
    components/                 WorldMap, CountryInput, GameShell, Modal, StatsView, ShareButton, Flag, Emblem, EasterEgg, Toast, FlagRain, ThemeToggle, SignalFlags, CompassRose, CompassButton, CollectionPage, FlagOfDay
    *.test.ts                   testy sdílené logiky
  games/
    registry.ts                 seznam všech her (názvy, adresy, popisy, komponenty)
    mystery/                    hra 1 Tajemná země (logic.ts, logic.test.ts, MysteryGame.tsx, MysteryHelp.tsx, mystery.css)
    route/                      hra 2 Cesta mezi zeměmi (logic.ts, logic.test.ts, RouteGame.tsx, RouteHelp.tsx, route.css)
    countryle/                  hra 3 Countryle (logic.ts, logic.test.ts, CountryleGame.tsx, CountryleHelp.tsx, countryle.css)
    flagclues/                  Tajemná vlajka (logic.ts, logic.test.ts, FlagCluesGame.tsx, FlagCluesHelp.tsx, flagclues.css)
    neighbors/                  Sousedé (logic.ts, logic.test.ts, NeighborsGame.tsx, NeighborsHelp.tsx)
    silhouette/                 Silueta (logic.ts, logic.test.ts, shape.ts = obrys, SilhouetteGame.tsx, SilhouetteHelp.tsx, silhouette.css)
    higherlower/                Víc, nebo míň? (logic.ts, logic.test.ts, HigherLowerGame.tsx, HigherLowerHelp.tsx, higherlower.css)
    border/                     hra 5 Nakresli hranici (logic.ts = hodnocení překryvu, scene.ts = výřez mapy, logic.test.ts, BorderGame.tsx, BorderHelp.tsx, border.css)
    geogrid/                    hra 4 GeoGrid (categories.ts = seznam kategorií, logic.ts, logic.test.ts, GeoGridGame.tsx, GeoGridHelp.tsx, geogrid.css)
public/flags/<iso2>.svg         vlajky
```

### Tvar záznamu země (`countries.json`)

```
id "CZE" | iso2 "cz" | name "Česko" | aliases ["Česká republika","ČR",...] | capital "Praha" | capitalAlt [] |
continent "Evropa" | subregion "Central Europe" (anglicky, zatím nepoužito) | population | populationYear | avgTemp (°C nebo null) |
gdp (USD nebo null) | gdpYear |
area (km²) | lat, lon (střed podle world-countries, pro směr a vzdálenost středů) |
centroid [lon, lat] (geometrický střed, pro značku na mapě) | landlocked | unMember | marker | drawable | neighbors ["AUT",...] | overseasNeighbors [] |
flag { colors ["red","white","blue"], shares { red: 36, white: 36, blue: 28 } (procenta plochy), stripes, star, sun, crescent, cross, animal, text, hoistTriangle }
```

## Plán práce

- [x] **Fáze 0:** HANDOFF.md, založení projektu, „hello world“ jde spustit
- [x] **Fáze 1:** Data
  - [x] seznam 197 zemí s českými názvy a aliasy
  - [x] populace, rozloha, hlavní města, kontinenty, středy
  - [x] geometrie hranic (TopoJSON), vyřešené malé státy
  - [x] graf pozemních sousedů + kontrola symetrie
  - [x] matice vzdáleností mezi hranicemi
  - [x] vlajky SVG
  - [x] atributy vlajek (hotovo, ale potřeba ověřit)
  - [x] průměrná roční teplota pro hru 3 Countryle (`avgTemp`; Tchaj-wan bez hodnoty)
  - [x] kontrolní skript dat
- [x] **Fáze 2:** Sdílené komponenty
  - [x] načítání dat a typy
  - [x] našeptávač zemí
  - [x] komponenta mapy (zoom, posun, obarvení, kroužky malých zemí, popisky)
  - [x] denní seed + náhodný generátor
  - [x] ukládání a statistiky (localStorage)
  - [x] domovská obrazovka
  - [x] nápověda (modální okno) a sdílení výsledku
- [x] **Fáze 3:** Hry 1–4
  - [x] 1 Tajemná země
  - [x] 2 Cesta mezi zeměmi
  - [x] 3 Countryle
  - [x] 4 GeoGrid
- [x] **Fáze 4:** 5 Nakresli hranici
- [x] **Fáze 5:** Hry navíc podle výběru autora (16. 11. 2026 si vybral tyto čtyři + easter egg)
  - [x] Tajemná vlajka (nová hra podle zadání autora: nápovědy o vlajce od mlhavých po přesné)
  - [x] Sousedé (nová hra: vyjmenovat sousedy země)
  - [x] Silueta
  - [x] Víc, nebo míň? (šest témat, nemíchají se)
  - [x] Easter egg Československo
- [x] **Úpravy vzhledu:** redesign „Námořní mapa“ hotový 16. 11. 2026 (viz „Vzhled“)
- [x] **Fáze 6:** Nasazení na GitHub Pages: workflow `.github/workflows/deploy.yml` + návod `NASAZENI.md` (hotovo 16. 11. 2026, samotné nasazení zatím neproběhlo)

## Stav her

| # | Hra | Stav | Poznámka |
|---|-----|------|----------|
| 1 | Tajemná země | **hotovo** | logika + 20 testů + UI + nápověda + sdílení; denní i volná hra |
| 2 | Cesta mezi zeměmi | **hotovo** | logika + 22 testů + UI + nápověda + sdílení; nápověda obrysem země |
| 3 | Countryle | **hotovo** | logika + 14 testů + UI (tabulka) + nápověda + sdílení; bez mapy |
| 4 | GeoGrid | **hotovo** | 73 kategorií (22 o vlajkách) + generátor + 17 testů + UI + nápověda + sdílení |
| 5 | Nakresli hranici | **hotovo** | logika + 17 testů + UI + nápověda + sdílení; dvě obtížnosti (s mapou okolí / z paměti) |
| 6 | Tajemná vlajka* | **hotovo** | logika + 11 testů + UI + nápověda + sdílení |
| 7 | Sousedé* | **hotovo** | logika + 8 testů + UI + nápověda + sdílení |
| 8 | Silueta* | **hotovo** | logika + 7 testů + UI + nápověda + sdílení |
| 9 | Víc, nebo míň?* | **hotovo** | 6 témat; logika + 15 testů + UI + nápověda + sdílení |
| – | Easter egg Československo | **hotovo** | funguje v každém políčku pro zadání země |
| – | Tmavý režim | **hotovo** | tlačítko, pamatuje si volbu |
| – | Další easter eggy | **hotovo** | viz „Katalog easter eggů“ |
| – | Sbírka zemí a Vlajka dne | **hotovo** | `#sbirka`, rámeček na domovské stránce |
| 10 | Vlajkový kvíz* | nezačato | jen nápad, autor ho zatím nechtěl |
| 11 | Flagle* | nezačato | jen nápad |
| 12 | Klikni na mapu* | nezačato | jen nápad |
| 13 | Vyjmenuj všechny* | nezačato | jen nápad |
| 14 | Hlavní města* | nezačato | jen nápad |
| 15 | Album vlajek* | nezačato | data se už sbírají (`collectCountry`), chybí obrazovka |

## Aktuálně rozpracováno

Nic rozdělaného. Fáze 0–5 jsou hotové a commitnuté: devět her a easter egg. Redesign „Námořní mapa“ i příprava nasazení jsou hotové. Zbývá, aby autor web skutečně nasadil podle `NASAZENI.md`.

## Další kroky

1. **Autor nasadí web** podle `NASAZENI.md` (nový repozitář na GitHubu, `git push`, Settings > Pages > Source = GitHub Actions). Workflow `.github/workflows/deploy.yml` spustí testy, sestaví a zveřejní složku `dist`. Ověřeno: sestavený web funguje v podsložce (`base: './'`, hash routing), samotné nasazení na GitHub nezkoušeno.
2. Zbylé nápady na hry (Album vlajek, Vlajkový kvíz, Flagle, Klikni na mapu, Vyjmenuj všechny, Hlavní města), jen pokud o ně autor požádá.
3. Průběžně: nechat autora / jeho bratra projít seznamy symbolů ve `scripts/sources/flags-manual.mjs`.

### Otázky na autora (nezodpovězené)

- (zodpovězeno 16. 11. 2026: Tajemná vlajka, Sousedé, Silueta, Víc nebo míň, pak easter egg; vzhled doladí sám)

## Známé chyby a dluhy

- **Mobil není odladěný.** Rozložení se pod 900 px skládá pod sebe a mapa reaguje na dotyk, ale nikdo to na telefonu nezkoušel. Autor hraje na počítači, takže nízká priorita.
- **Vizuální kontrola** proběhla jen v Chrome (headless, 1440×900). Firefox a Safari nezkoušeny.
- **Cesta mezi zeměmi: výhra nebyla proklikána v prohlížeči**, jen prohra a nápověda. Výhru pokrývají testy logiky (`isConnected`, `roundStatus`) a UI větev je stejná jako u ostatních her.
- **Countryle nemá mapu.** Po dohrání by se hodilo ukázat hledanou zemi na mapě; zatím jen vlajka a údaje.
- **Cesta mezi zeměmi: start nebo cíl může být ministát** (Andorra, Vatikán, ...), na mapě je pak jen malý kroužek. Kdyby to vadilo, vyřadit země s `marker: true` v `allPuzzlePairs`.
- **Vzdálenosti v Tajemné zemi** jsou mezi hranicemi podle mapy 1:50m, drobné ostrovy tam chybí, takže u ostrovních států se čísla mohou od reality lišit o desítky km.
- **Vlajky signální abecedy v návrhu vzhledu** (G, E, O, H, R, Y v `DESIGN-PROMPT.md` a maketě) jsou nakreslené z paměti a neověřené proti oficiálnímu zdroji. Před nasazením nechat zkontrolovat (autorův bratr se ve vlajkách vyzná).
- **Easter egg: zvuk jsem neslyšel.** V headless prohlížeči šlo ověřit jen vzhled obrazovky, že se otevře, tip se nepočítá a nic nespadne. Hlasitost, tempo a to, jak syntetizovaná „Kde domov můj“ zní, musí posoudit člověk (`master.gain`, `BEAT_SECONDS`, tón v `playMelody` v `src/shared/easterEgg.ts`). Slovenská část hymny chybí.
- **Tajemná vlajka stojí na ručních seznamech symbolů a měřených podílech barev.** Chyba v datech = zavádějící nápověda. U pár dvojic téměř stejných vlajek (Slovensko × Slovinsko při vyčerpání šesti nápověd, Indonésie × Monako) rozhoduje až kontinent nebo první písmeno.
- **Víc, nebo míň: 7 zemí nemá HDP** a v tématech HDP se neobjeví; Tchaj-wan chybí i u teploty.
- **Sousedé: počítají se jen hranice mezi 197 zeměmi hry** (bez Západní Sahary, Francie bez zámořských území). Je to vysvětlené v nápovědě hry.
- **Nakresli hranici: kreslení vyzkoušeno jen simulovanou myší** (elipsa) v headless Chrome, ne skutečnou rukou a ne dotykem. Hranice hvězdiček (35/50/65/80 %) jsou odhad: elipsa do bílého místa dala u Řecka 43 %, u Papuy Nové Guineje z paměti 56 %. Jestli budou moc přísné nebo mírné, změnit `STAR_THRESHOLDS` v `src/games/border/logic.ts`.
- **Nakresli hranici: bílé místo prozrazuje rozměry země** (je to obdélník těsně kolem ní). Je to záměr, jinak by hráč nevěděl, kam kreslit.
- `@turf/turf` je v devDependencies, ale nic ho nepoužívá. Jde odebrat (`npm uninstall @turf/turf`).
- **Symboly na vlajkách nejsou ověřené z nezávislého zdroje** (viz Rozhodnutí o datech). Chyba v seznamu = GeoGrid uzná nebo neuzná odpověď špatně. Oprava: `scripts/sources/flags-manual.mjs` + `npm run data`.
- **GeoGrid: vzácnost je jen odhad** podle počtu obyvatel, ne podle skutečných odpovědí hráčů.
- **GeoGrid: kategorie o barvách vlajek vycházejí často** (jsou široké, takže se snadno kombinují). Kdyby mřížky působily jednotvárně, snížit `GROUP_LIMIT['flag-color']` na 1.
- **Průměrná teplota u Tchaj-wanu chybí** (`avgTemp: null`). U ostatních jde o průměr přes celé území země, takže u velkých zemí (Rusko, Kanada, Čína) číslo neodpovídá místům, kde žije většina lidí.
- **Hlavní města jsou psaná ručně z hlavy**, stojí za namátkovou kontrolu. Sporné případy: Rovníková Guinea (Malabo, uváděno i Ciudad de la Paz), Bolívie (Sucre / La Paz), Srí Lanka (Kotte / Kolombo), JAR (tři hlavní města), Indonésie (zatím Jakarta).
- **Španělsko–Maroko** jsou vedené jako sousedé (Ceuta, Melilla), ale na mapě 1:50m tyto enklávy nejsou vidět, takže se země na mapě nedotýkají.
- **Populace jsou odhad Světové banky pro rok 2025**, u Tchaj-wanu a Vatikánu starší údaj z Natural Earth.
- **Zařazení zemí na dvou kontinentech** (Rusko, Turecko, Kazachstán, ...) je podle `world-countries` a může být sporné. Jde změnit ve funkci `continentOf` v `scripts/build-data.mjs`.

## Zdroje dat a licence

| Data | Zdroj | Licence |
|------|-------|---------|
| Hranice zemí | Natural Earth 1:50m (a 1:10m pro Tuvalu) přes npm `world-atlas` | public domain (balíček ISC) |
| Údaje o zemích, české názvy, sousedé | npm `world-countries` (mledoze/countries) | ODbL 1.0 |
| Populace | Světová banka SP.POP.TOTL přes github.com/datasets/population | CC BY 4.0 (data), PDDL (balíček) |
| Populace Tchaj-wan, Vatikán | Natural Earth (POP_EST) | public domain |
| Vlajky | npm `flag-icons` | MIT |
| Průměrná roční teplota | Wikipedie „List of countries by average yearly temperature“ (Světová banka / CRU, 1991–2020) přes github.com/samayo/country-json | CC BY-SA 4.0 (Wikipedie), MIT (balíček) |
| HDP | Světová banka NY.GDP.MKTP.CD přes github.com/datasets/gdp | CC BY 4.0 (data), PDDL (balíček) |
| Hlavní města česky, aliasy názvů | sestaveno ručně | – |
| Písmo Bricolage Grotesque | npm `@fontsource-variable/bricolage-grotesque` | OFL 1.1 |

## Log změn

- 2026-11-16: Založen HANDOFF.md se zadáním a plánem.
- 2026-11-16: Fáze 0 hotová (Vite + React + TS, build i typecheck projdou).
- 2026-11-16: Fáze 1: datové skripty, 197 zemí, mapa s úpravami (Krym, Somaliland, zámořská území), sousedé, matice vzdáleností, vlajky, kontrola dat. Zbývají atributy vlajek a klima.
- 2026-11-16: Fáze 2: sdílené knihovny (hledání zemí, náhoda a denní výběr, statistiky, úložiště) s testy, komponenty (mapa, našeptávač, rám hry, modální okno, statistiky, sdílení), domovská obrazovka.
- 2026-11-16: Hra 1 Tajemná země hotová. 50 testů prochází, build i typecheck v pořádku, proklikáno v prohlížeči (tipy, popisky na mapě, zoom, vzdání, statistiky, obnovení rozehrané denní výzvy po znovunačtení).
- 2026-11-16: Náhled publikován na claude.ai, autorovi poslán zip `geohry-faze2.zip`.
- 2026-11-16: Autor potvrdil, že hra 1 funguje. Přidána průměrná roční teplota (`avgTemp`) pro Countryle. Do plánu zapsán easter egg Československo (až nakonec).
- 2026-11-16: Hra 2 Cesta mezi zeměmi a hra 3 Countryle hotové. 86 testů prochází. `WorldMap` umí nově `ghostIds` (čárkovaný obrys) a `focusFill`. Náhled aktualizován.
- 2026-11-16: Atributy vlajek (barvy automaticky, symboly ručně) a hra 4 GeoGrid. 103 testů prochází, proklikáno v prohlížeči (správné i špatné tipy, výhra, seznam odpovědí, obnovení po znovunačtení). Fáze 1 a 3 uzavřené.
- 2026-11-16: Hra 5 Nakresli hranici (fáze 4). 120 testů prochází, proklikáno v prohlížeči se simulovaným tahem myši (obě obtížnosti, vyhodnocení, obnovení po znovunačtení, statistiky s hvězdičkami).
- 2026-11-16: Na přání autora čtyři hry navíc: Tajemná vlajka, Sousedé, Silueta, Víc, nebo míň? (šest témat včetně HDP). Přidána data o HDP a podíly barev na vlajkách. Easter egg Československo. 164 testů prochází, vše proklikáno v prohlížeči. Do HANDOFF přidán Průvodce úpravami vzhledu.
- 2026-11-16: Zámořské hranice (Francie–Nizozemsko na Svatém Martinu, Francie–Brazílie, Francie–Surinam) pro hry Sousedé a GeoGrid. 168 testů. Přidán `DESIGN-PROMPT.md` a maketa nového vzhledu v `design/`.
- 2026-11-16: Redesign „Námořní mapa“, kroky 1–3 (paleta v :root, pozadí se sondami, opravy míst po tmavém motivu, linky 1,5 px, rohy 2 px, purpurové hlavní tlačítko, přepínač jako záložky, odkazy Statistiky/Jak hrát podtržené). Zatím bez signálních vlajek, růžice, stožárů a rámů map (kroky 4–9). 168 testů prochází.
- 2026-11-16: Redesign kroky 4–5: komponenty `SignalFlags` (nápis vlajkami G-E-O-H-R-Y, malá verze v hlavičce her) a `CompassRose` (domovská stránka, pod 700 px skrytá), hlavička domů jako mřížka s linkou, dlaždice her jako vlajky na stožáru s číslem listu a stavem za čárkovanou linkou. 168 testů prochází.
- 2026-11-16: Redesign kroky 6–9: dílkovaný rám (`.map`, `.border__canvas`, `.silhouette__canvas`, pravidlo je jedno ve `components.css`), tlačítka zoomu posunutá do rámu, seznam tipů s čárkovanými linkami a tučným nejnovějším, purpurové zvýraznění (našeptávač, GeoGrid, Tajemná vlajka), barvy vymyšlených vlajek v `Emblem.tsx`, tmavší studená část `HEAT_STOPS` v Tajemné zemi (jediná změna logiky, test a CSS upraveny). 168 testů prochází.
- 2026-11-16: Redesign „Námořní mapa“ dokončen (krok 10): proklikány všechny hry (nápověda, rozehraná, dohraná, statistiky, úzké okno), HANDOFF přepsán. Easter egg přepracován: smuteční obrazovka s vlajkou na půl žerdi a melodie „Kde domov můj“ (česká část hymny) podle notového zápisu místo vlastní fráze; 170 testů prochází.
- 2026-11-16: Fáze 6: `.github/workflows/deploy.yml` (GitHub Pages přes Actions), `NASAZENI.md` (návod pro začátečníka), na domovské stránce odstavec „Zdroje dat“ (licence CC BY, ODbL a CC BY-SA vyžadují uvedení zdroje). Build ověřen v podsložce `/moje-hry/` (dlaždice, mapa, vlajky, obnovení stránky). 170 testů prochází.
- 2026-11-16: Tmavý režim „noční mapa“ s tlačítkem (proměnné `:root[data-theme='dark']`, `theme.ts`, test) a sada dalších easter eggů (tajná slova, Konami kód, klikací vlajky a kompas, svátky, titulek karty, pozdrav v konzoli; komponenty `Toast`, `FlagRain`, `CompassButton`). Vitest nově spouští i `*.test.tsx`. 183 testů prochází, tmavý režim prohlédnut ve všech hrách.
- 2026-11-16: Z návrhů jiného modelu (`PROMPT-NAPADY.md`) vybráno jen to, co sedí k zeměpisu a vlajkám a nejsou to hry: Sbírka zemí s mapou a kartou, Vlajka dne, domény, tajná slova (Sealand, Bir Tawil, Liberland, Pobřeží Čech, Bod Nemo), perličky o vlajkách, tajný plán, 197. hra, výročí zákona o vlajce a apríl. Vynecháno: všechny nové hry, nápady kolem námořnictví (signální šifra, hodnosti, maják, loď, SOS), nápady vyžadující zápis historie po dnech (Lodní deník, Tři ztroskotání), narozeniny (chybí datum) a nápady vázané na zoom mapy nebo konec hry. 198 testů prochází.
