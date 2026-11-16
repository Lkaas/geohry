# Prompt: navrhni další funkce a easter eggy pro web GeoHry

Zkopíruj celý text od řádku „Jsi…“ do jiného jazykového modelu.

---

Jsi zkušený designér her a webový vývojář. Navrhni **další funkce a easter eggy** pro hotový webový projekt GeoHry. Níže je popis toho, co už existuje. Odpovídej česky.

## Pro koho a proč

GeoHry je dárek pro 16letého bratra autora. Brácha miluje **vlajky a zeměpis**, hraje na **počítači** (myš a klávesnice), občas na telefonu. Autor je začínající programátor (základy Pythonu, webový vývoj teprve zkouší), takže návrhy musí být realizovatelné po malých krocích. Web má být hlavně zábavný a trochu „objevitelský“, ne školní.

## Technické mantinely (musí platit u každého návrhu)

- Statická aplikace: **žádný backend, databáze, účty ani přihlašování**. Hostuje se na GitHub Pages.
- **Žádné cizí API za běhu**, všechna data jsou lokálně v projektu (JSON, SVG). Po načtení funguje offline.
- Stack: Vite + React 19 + TypeScript, testy Vitest. Žádný vlastní server.
- Stav hráče je jen v `localStorage` (klíče s prefixem `geohry:`), **nesynchronizuje se mezi zařízeními**. Návrhy typu „žebříček“ nebo „hrát proti kamarádovi online“ proto neplatí. Výjimka: sdílení výsledku jako text s emoji do schránky nebo odkaz s daty v adrese.
- Texty v češtině, bez verzálek v nadpisech, bez emoji v rozhraní (emoji jen ve sdíleném textu výsledku).
- Hotové věci by měly jít přidat bez přepisování existujícího kódu (jedna hra = jedna složka, hry se zapisují do jednoho seznamu).
- Musí fungovat `prefers-reduced-motion` (animace se vypínají) a ovládání klávesnicí.

## Struktura stránky

**Adresování:** hash routing (`#tajemna-zeme`, `#cesta`, …). Domovská stránka je `#` bez adresy.

### Domovská stránka
- Nahoře vpravo tlačítko **Tmavý režim / Světlý režim** (volba se pamatuje, nepřepíná se podle systému).
- Hlavička: nápis „GeoHry“ složený **ze šesti námořních signálních vlajek G-E-O-H-R-Y** (po kliknutí na vlajku se ukáže, co znamená), vedle **kompasová růžice** (klik ji roztočí).
- Věta o hře, dnešní datum, „ve sbírce máš X z 197 zemí“.
- Mřížka 3×3 dlaždic her. Každá dlaždice vypadá jako vlajka na stožáru s číslem „list N“, vlastní vymyšlenou vlajkou, názvem, popisem a stavem dnešní výzvy (čeká / rozehraná / splněna / nevyšlo).
- Seznam „Další hry v plánu“ (zatím nenaprogramované nápady: Vlajkový kvíz, Flagle, Klikni na mapu, Vyjmenuj všechny, Hlavní města, Album vlajek).
- Patička „Zdroje dat“ (licence).

### Společný rámec každé hry (`GameShell`)
- Hlavička: malé signální vlajky, vlajka-ikona hry, název, přepínač **Denní výzva / Volná hra**, tlačítka Tmavý režim, **Statistiky**, **Jak hrát**.
- Při prvním spuštění se ukáže okno s nápovědou.
- **Denní výzva:** stejná pro všechny podle data (seed z data), jedna za den na hru. **Volná hra:** náhodně a neomezeně.
- Po konci se ukáže výsledek a tlačítko **Sdílet** (text s emoji do schránky).
- **Statistiky** (okno): odehráno, úspěšnost, aktuální a nejdelší série, rozložení počtu pokusů. Pro hry s hvězdičkami skóre.

### Sdílené součásti
- **Našeptávač zemí:** psaní bez diakritiky a bez ohledu na velikost písmen, zná alternativní názvy (Česko / Česká republika / ČR), nenabízí už použité země, šipky + Enter. Je ve většině her; používá se i pro easter eggy.
- **Mapa světa** (zoom, posun, obarvení zemí, malé státy značené kroužkem), vzhled jako tištěná námořní mapa s dílkovaným rámem.
- **Zpráva dole na obrazovce** (toast) pro drobné hlášky.
- **Sbírka zemí:** každá uhodnutá země se započítá do sbírky (jen počet, zatím žádné album).

### Devět her (všechny mají denní i volnou hru)
1. **Tajemná země** (typ Globle): tipuješ země, mapa je barví podle vzdálenosti hranic od hledané země (modrá daleko → červená blízko), ukáže se km a „přihořívá/chladne“, sousedství se oznámí.
2. **Cesta mezi zeměmi** (typ Travle): zadaná země A a B spojené po souši, vypisuješ státy cesty; zelená = na nejkratší cestě, žlutá = odbočka, červená = mimo. Limit pokusů.
3. **Countryle:** tabulka srovnání tipu s hledanou zemí: kontinent, polokoule, populace, rozloha, teplota (barva + šipka víc/míň), směr a vzdálenost. 8 pokusů.
4. **GeoGrid:** mřížka 3×3, podmínky u řádků a sloupců (73 kategorií, 22 o vlajkách), do každého políčka země splňující obě; skóre podle vzácnosti odpovědi.
5. **Nakresli hranici:** z mapy je vymazaná země, myší nakreslíš její obrys, vyhodnotí se překryv (procenta, hvězdičky) a ukáže skutečný tvar. Dvě obtížnosti (s mapou okolí / z paměti).
6. **Tajemná vlajka:** postupně se odkrývá 7 slovních nápověd o vlajce (barvy, symboly, podíly barev); počet zbývajících vlajek se zužuje. Tip se zobrazuje bez vlajek v nabídce.
7. **Sousedé:** vyjmenuj všechny země, které sousedí se zadanou.
8. **Silueta:** poznej zemi jen podle obrysu.
9. **Víc, nebo míň?:** porovnej dvě země podle šesti témat (obyvatelé, rozloha, HDP, HDP na obyvatele, hustota zalidnění, teplota), cílem je co nejdelší série.

### Data, která jsou k dispozici (nové nápady se mohou opřít jen o ně)
Pro každou ze **197 zemí** (193 členů OSN + Kosovo, Tchaj-wan, Palestina, Vatikán):
- český název a alternativní názvy, ISO kódy, hlavní město (i alternativní), kontinent
- populace, rozloha, HDP (USD), průměrná roční teplota, zeměpisná poloha středu, příznaky (vnitrozemská, člen OSN)
- **pozemní sousedé** (a několik zámořských hranic, např. Francie–Brazílie)
- **hranice** (polygony z Natural Earth) a předpočítané vzdálenosti mezi hranicemi dvojic zemí
- **vlajka** jako SVG + atributy: barvy a podíly barev v %, pruhy, hvězda, slunce, půlměsíc, kříž, zvíře, text, trojúhelník u žerdi
- **Nejsou** k dispozici: hymny, měny, jazyky, náboženství, zvířata, fotky, vlajkové dějiny, nadmořské výšky, časová pásma.

### Už existující easter eggy (nenavrhuj je znovu)
- napsat „Československo“ do políčka → šedá smuteční obrazovka, vlajka sjede na půl žerdi, hraje „Kde domov můj“, data vzniku a zániku (28. 10. 1918 – 31. 12. 1992)
- tajná slova v políčku pro zemi (po Enteru hláška dole, tip se nepočítá): Wakanda, Narnie, Mordor, Atlantida, Kocourkov, Země/Svět, Měsíc, Antarktida, a věcné poznámky o zaniklých státech (SSSR, Jugoslávie, NDR, Rakousko-Uhersko)
- **Konami kód** (↑ ↑ ↓ ↓ ← → ← → B A): déšť signálních vlajek
- klik na jednotlivé signální vlajky v nápisu: výklad (G potřebuji lodivoda, E měním kurz doprava, O člověk přes palubu, H mám lodivoda, R dnes bez významu, Y vleče se mi kotva)
- klik na kompas: roztočí se, sedmý klik přidá hlášku
- věty ve státní svátky (28. 10., 17. 11., 1. 1.) a na Den Země
- titulek karty se změní, když hráč přepne na jinou kartu
- pozdrav v konzoli prohlížeče (F12)

## Vzhled a tón (návrhy se musí vejít)

Motiv **„Námořní mapa“**: tištěná námořní mapa. Světlý režim = papír a mělčina, tmavý režim = „noční mapa“. Jediná výrazná barva je **purpurová**. Linky 1,5 px, rohy 2 px, žádné stíny, nadpisy zúženým řezem písma Bricolage Grotesque. Humor je spíš suchý a znalecký než křiklavý. Žádné vtipy na účet skutečných lidí ani citlivých událostí; u zaniklých států a historie jen věcně.

## Co chci od tebe

Navrhni **dvě skupiny nápadů**, každou seřazenou od nejlepšího po nejslabší:

### A) 12 nových funkcí
Mohou to být nové hry, režimy existujících her, odměny a sbírky, pomůcky nebo drobná vylepšení. Hledej hlavně to, co **vlajkový nadšenec** ocení (vlajky jsou nejsilnější téma) a co se dá postavit z dostupných dat.

### B) 20 nových easter eggů
Rozděl je do tří typů:
- **psaní do políčka** (tajná slova, zkratky, historické názvy, přezdívky zemí),
- **klikání a skrytá místa** (loga, vlajky, kompas, patička, dlaždice, mapa),
- **okolnosti** (datum, počet odehraných her, série, čas, velikost okna, náhodná příležitost).

### Pro každý nápad uveď
1. **Název** (jedna fráze).
2. **Co se stane** (1–3 věty, přesně co hráč uvidí / uslyší, včetně navrženého textu v češtině, ať je to vtipné).
3. **Jak se k tomu hráč dostane** (spouštěč).
4. **Data a části webu, které potřebuje** (jen z toho, co je popsané výše).
5. **Náročnost** (malá = do hodiny, střední = odpoledne, velká = několik dní) a hlavní riziko.
6. **Ověřitelnost faktů:** pokud nápad obsahuje fakt (datum, název, historii), napiš, **odkud ho lze ověřit**, nebo označ jako „neověřeno“. Žádné vymyšlené údaje.

### Na závěr
- **Pět nápadů, které bys udělal jako první**, a proč.
- Které nápady se nehodí a proč (např. kvůli chybějícím datům nebo nutnosti serveru).
- Pokud by se dalo něco zjednodušit nebo spojit, navrhni to.

Nepiš žádný kód, jen návrhy. Nevymýšlej funkce vyžadující účty, server nebo cizí API.
