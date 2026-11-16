# Prompt: nový vzhled GeoHer („Námořní mapa“)

> Zkopíruj vše pod čarou a předej modelu spolu se zipem projektu.

---

Přikládám zip s hotovou webovou aplikací **GeoHry** (devět zeměpisných her, React + TypeScript + Vite). Všechno funguje. Tvůj úkol je **jen změnit vzhled** podle návrhu níže. Herní logiku neměň.

Jsem začínající programátor. Kroky, které mám udělat já, mi piš přesně.

## Než začneš

1. Rozbal zip, spusť `npm install` a potom `npm test`. Musí projít všech 168 testů. Když neprojdou, zastav se a řekni mi to.
2. Přečti si `HANDOFF.md`, hlavně oddíl **„Průvodce úpravami vzhledu“**. Říká, které soubory smíš měnit a které ne.
3. Otevři si `design/maketa.html` a `design/maketa.png`. **To je cílový vzhled.** Maketa je obyčejná HTML stránka s hotovým CSS. Hodnoty a kusy kódu ber z ní, nevymýšlej vlastní.

## Pravidla, která platí celou dobu

- **Měň jen vzhled:** soubory `.css`, a z `.tsx` jen `Home.tsx`, `src/shared/components/*` a `*Game.tsx` / `*Help.tsx`, a to jen značky a třídy, ne chování.
- **Nesahej** na `logic.ts`, `categories.ts`, `scene.ts`, `shape.ts`, `src/shared/*.ts`, `src/data/`, `scripts/`. Jediná výjimka je krok 9, kde je přesně napsané, co změnit.
- **Postupuj po krocích v daném pořadí.** Po každém kroku spusť `npm run typecheck && npm test && npm run build`. Když něco neprojde, oprav to dřív, než půjdeš dál.
- **Po každém kroku udělej git commit** a zapiš jednu řádku do „Log změn“ v `HANDOFF.md`.
- Žádné nové knihovny, žádná písma ani obrázky z internetu. Všechno musí fungovat offline.
- Neměň atributy `data-id`, `aria-*`, klíče v localStorage ani `id` her v `src/games/registry.ts`.
- Když si nejsi jistý nebo něco nejde podle návodu, **zastav se a zeptej se**, neimprovizuj.
- Na konci mi pošli zip celého projektu (bez `node_modules` a `dist`).

## Návrh: „Námořní mapa“

Aplikace je o mapách a vlajkách, takže má vypadat jako **tištěná námořní mapa**, ne jako běžná webová stránka. Čtyři věci ji dělají rozpoznatelnou:

1. **Barvy námořní mapy.** Hluboká voda je skoro bílá, mělčina světle modrá, pevnina béžová, linky černé. Jediná výrazná barva je **purpurová**: na skutečných námořních mapách se jí tiskne vše, čeho si má navigátor všimnout (majáky, výstrahy, kompasová růžice). Tady značí vše, na co se dá kliknout nebo co je důležité.
2. **Nápis GeoHry vlajkami.** Nad názvem je šest vlajek mezinárodní námořní signální abecedy, které hláskují G, E, O, H, R, Y.
3. **Rám mapy s dílky.** Mapy a herní plochy mají kolem sebe černobílý dílkovaný okraj, stejný jako stupnice zeměpisné šířky na okraji mapy.
4. **Hloubkové údaje v pozadí.** Po stránce jsou rozesetá drobná čísla, jako sondy hloubek na moři.

Všechno ostatní je střídmé: bílé listy s tenkou černou linkou, hranaté rohy, žádné stíny.

### Čemu se vyhnout

- Žádné barevné přechody (jediná výjimka je teplotní škála v Tajemné zemi, ta tam už je).
- Žádné stíny pod kartami. Jediný stín zůstává pod rozbalenou nabídkou našeptávače.
- Žádné zaoblené „pilulky“. Rohy mají poloměr 2 px (kolečka u tipů zůstávají kulatá).
- Žádné emoji jako ozdoba, žádné nové animace kromě té jedné u dlaždic (krok 5).
- Žádné nápisy verzálkami, žádný tmavý režim, žádný efekt skla.
- Purpurovou nepoužívej na velké plochy. Jen tlačítko hlavní akce, podtržení odkazů, obrys fokusu, čísla listů a růžice.

## Kroky

### Krok 1: barvy a základ (`src/styles/base.css`)

Blok `:root { … }` nahraď tímto. **Názvy proměnných zůstávají**, mění se hodnoty a tři přibývají, takže zbytek aplikace se přebarví sám.

```css
:root {
  --ink: #14171c; /* tisková čerň: text a linky */
  --ink-dim: #56616c; /* druhotný text */
  --sea-deep: #f3f8fa; /* hluboká voda, skoro bílá: pozadí stránky */
  --sea: #cde6f0; /* mělčina: moře na mapách */
  --sea-line: #8fbdd3; /* poledníky a rovnoběžky */
  --land: #f3e3b0; /* pevnina, béžová jako na námořních mapách */
  --land-other: #ebe5cc; /* nehratelná území */
  --paper: #fdfdf9; /* list mapy: panely */
  --paper-dim: #eef1ee;
  --red: #d62828;
  --yellow: #ffd23f;
  --green: #1f8a4c;
  --magenta: #b5127a; /* purpurová: vše důležité a klikací */
  --magenta-soft: #f7dcec;
  --on-sea: #14171c; /* text přímo na pozadí stránky (dřív bílý na tmavém, teď tmavý na světlém) */
  --on-sea-dim: #56616c;

  --line: 1.5px; /* tloušťka linek */
  --radius: 2px;
  --font: 'Bricolage Grotesque Variable', 'Segoe UI', system-ui, sans-serif;
}
```

V pravidle `body` nahraď `background-image` a `background-size` (jemnou bílou síť) pozadím se sondami. Zkopíruj celou hodnotu `background-image: url("data:image/svg+xml,…")` z `design/maketa.html` (pravidlo `body`) a řádek `background-size` smaž.

V `h1, h2, h3` změň `font-stretch: 82%` na `font-stretch: 80%`.

V `:focus-visible` změň barvu obrysu ze žluté na `var(--magenta)`.

**Kontrola:** stránka je světlá, text tmavý, v pozadí jsou vidět drobná šedomodrá čísla.

### Krok 2: místa, která počítala s tmavým pozadím

Původní vzhled byl tmavý, takže na několika místech jsou průhledné bílé linky nebo žlutý text, které na světlém pozadí nejsou vidět. Oprav je takto:

| Soubor | Selektor | Změna |
|---|---|---|
| `base.css` | `.wordmark` | `color: var(--ink)` |
| `base.css` | `.button--ghost:hover` | `background: rgb(20 23 28 / 0.08)` |
| `base.css` | `.emblem--small` | `border-color: var(--ink)` |
| `base.css` | `.tile--soon` | `border-color: var(--ink-dim)`, `color: var(--ink)` |
| `base.css` | `.tile--soon .emblem` | `border-color: var(--ink-dim)` |
| `base.css` | `.tile--soon .tile__status` | `background: var(--paper-dim)`, `color: var(--ink)` |
| `base.css` | `.chip` | `border: var(--line) solid var(--ink)`, `border-radius: var(--radius)`, `background: var(--paper)` |
| `base.css` | `.chip:hover` | `border-color: var(--magenta)` |
| `base.css` | `.chip[aria-pressed='true']` | `border-color: var(--ink)`, `background: var(--ink)`, `color: var(--paper)` |
| `components.css` | `.shell__header` | `border-bottom: var(--line) solid var(--ink)`, přidej `background: var(--paper)` |
| `components.css` | `.map__country--ghost` | `fill: rgb(20 23 28 / 0.06)`, `stroke: var(--ink)` |
| `components.css` | `.map__country` | `stroke: #7a6f4a` |
| `components.css` | `.map__marker` | `stroke: #7a6f4a` |
| `components.css` | `.map__territory` | `stroke: #b9b08c` |
| `components.css` | `.stats__bar` | `background: var(--ink)` |
| `components.css` | `.route-legend .guess__chip` | `border-color: var(--ink)` |
| `mystery/mystery.css` | `.heat-legend__bar` | `border: 1px solid var(--ink)` |
| `flagclues/flagclues.css` | `.flagclues__clue--hidden` | `background: transparent`, přidej `border: 1px dashed var(--ink-dim)` |
| `higherlower/higherlower.css` | `.hl__daily-param strong` a `.hl__streak strong` | `color: var(--magenta)` |

Potom v celé složce `src/` vyhledej text `255 255 255` (příkaz `grep -rn "255 255 255" src/`). Každý zbylý výskyt je průhledná bílá, která už nedává smysl. Nahraď ji `var(--ink-dim)` u linek, nebo `var(--paper-dim)` u pozadí.

**Kontrola:** projdi domovskou stránku a všech devět her. Nikde nesmí být bílý nebo žlutý text na světlém pozadí ani neviditelná linka.

### Krok 3: linky, rohy, tlačítka

Ve všech `.css` souborech:

- `border: 2px solid var(--ink)` nahraď `border: var(--line) solid var(--ink)`. **Výjimka:** políčko `.country-input__field` a vybrané políčko GeoGridu zůstávají tlustší.
- `border-radius: 99px` nahraď `border-radius: var(--radius)` (týká se `.segmented`, `.tile__status`, `.geogrid__rarity`). Kolečka s `border-radius: 50%` nech.

Tlačítka v `base.css`:

```css
.button--primary {
  border-color: var(--magenta);
  background: var(--magenta);
  color: #fff;
}

.button--primary:hover {
  border-color: #8f0e60;
  background: #8f0e60;
}
```

Přepínač Denní výzva / Volná hra (`.segmented` v `components.css`) má vypadat jako dvě záložky, viz `.tabs` v maketě: pozadí `var(--paper)`, rámeček `var(--line) solid var(--ink)`, bez vnitřního odsazení, mezi tlačítky svislá linka, vybrané tlačítko `background: var(--ink); color: var(--paper)`. Varianta `.segmented--light` v `border/border.css` pak může zmizet (smaž ji i z `BorderGame.tsx`, nech jen `segmented`).

Tlačítka „Statistiky“ a „Jak hrát“ v hlavičce (`.button--ghost`) změň na podtržené odkazy podle `.link` v maketě (purpurové podtržení tloušťky 2 px).

### Krok 4: nápis vlajkami a kompasová růžice

Vytvoř soubor `src/shared/components/SignalFlags.tsx`:

```tsx
// Nápis G-E-O-H-R-Y vlajkami mezinárodní námořní signální abecedy.
const BLUE = '#0b3d91'
const RED = '#d62828'
const YELLOW = '#ffd23f'

/** Šest signálních vlajek. `small` = malá verze do hlavičky hry. */
export function SignalFlags({ small = false }: { small?: boolean }) {
  return (
    <div className={'signal' + (small ? ' signal--small' : '')} role="img" aria-label="GeoHry vlajkami signální abecedy">
      {/* G: svislé žluté a modré pruhy */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={YELLOW} />
        <rect x="10" width="10" height="60" fill={BLUE} />
        <rect x="30" width="10" height="60" fill={BLUE} />
        <rect x="50" width="10" height="60" fill={BLUE} />
      </svg>
      {/* E: nahoře modrá, dole červená */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="30" fill={BLUE} />
        <rect y="30" width="60" height="30" fill={RED} />
      </svg>
      {/* O: úhlopříčně dělená, žlutá u žerdi dole, červená nahoře */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={RED} />
        <path d="M0 0 L60 60 L0 60 Z" fill={YELLOW} />
      </svg>
      {/* H: svisle dělená, bílá a červená */}
      <svg viewBox="0 0 60 60">
        <rect width="30" height="60" fill="#ffffff" />
        <rect x="30" width="30" height="60" fill={RED} />
      </svg>
      {/* R: červená se žlutým křížem */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={RED} />
        <rect x="24" width="12" height="60" fill={YELLOW} />
        <rect y="24" width="60" height="12" fill={YELLOW} />
      </svg>
      {/* Y: šikmé žluté a červené pruhy */}
      <svg viewBox="0 0 60 60">
        <rect width="60" height="60" fill={YELLOW} />
        <g transform="rotate(-45 30 30)" fill={RED}>
          {[-3.94, 13.03, 30, 46.97, 63.94].map((y) => (
            <rect key={y} x="-30" y={y} width="120" height="8.485" />
          ))}
        </g>
      </svg>
    </div>
  )
}
```

Vytvoř soubor `src/shared/components/CompassRose.tsx`:

```tsx
// Kompasová růžice, ozdoba domovské stránky. Barvu bere z CSS (color), na námořních mapách je purpurová.
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const angle = (i * 5 * Math.PI) / 180
  const inner = i % 3 === 0 ? 84 : 87
  const point = (r: number) => `${(Math.sin(angle) * r).toFixed(1)} ${(-Math.cos(angle) * r).toFixed(1)}`
  return `M${point(inner)}L${point(92)}`
}).join('')

export function CompassRose({ className = '' }: { className?: string }) {
  return (
    <svg className={'rose ' + className} viewBox="-100 -100 200 200" fill="none" stroke="currentColor" aria-hidden="true">
      <circle r="92" strokeWidth="1.2" />
      <circle r="80" strokeWidth="0.8" />
      <circle r="52" strokeWidth="0.8" />
      <path d={TICKS} strokeWidth="0.7" />
      <path d="M0-78 9-9 78 0 9 9 0 78-9 9-78 0-9-9Z" strokeWidth="1.2" />
      <path d="M0-78 0 0 9-9ZM78 0 0 0 9 9ZM0 78 0 0-9 9ZM-78 0 0 0-9-9Z" fill="currentColor" stroke="none" />
      <path d="M36-36 12 0 36 36 0 12-36 36-12 0-36-36 0-12Z" strokeWidth="0.9" />
      <text y="-58" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Georgia, serif" fontSize="15" fontStyle="italic">
        S
      </text>
    </svg>
  )
}
```

Do `base.css` přidej styly `.signal`, `.signal svg`, `.signal--small`, `.signal--small svg` a `.rose` (zkopíruj z makety) a uprav `.wordmark` podle makety.

**Domovská stránka (`src/Home.tsx`):** v hlavičce dej nad `<h1 className="wordmark">GeoHry</h1>` komponentu `<SignalFlags />` a vpravo `<CompassRose />`. Hlavičku udělej jako mřížku o dvou sloupcích s linkou dole, viz `.head` v maketě. Pod 700 px šířky růžici schovej.

**Hlavička hry (`src/shared/components/GameShell.tsx`):** v odkazu domů nahraď `<span className="wordmark wordmark--small">GeoHry</span>` za `<SignalFlags small />`. `aria-label` odkazu nech.

### Krok 5: dlaždice her jako vlajky na stožáru (`Home.tsx`, `base.css`)

Dlaždice má vlevo svislou černou čáru (stožár) s kuličkou nahoře a na ní visí vymyšlená vlajka hry (komponenta `Emblem`, ta už existuje). Vpravo nahoře je purpurově „list 1“, „list 2“ atd. podle pořadí hry v seznamu. Stav denní výzvy je dole za čárkovanou linkou s barevným kolečkem.

Styly `.tile`, `.tile::before`, `.tile::after`, `.tile .emblem`, `.tile:hover .emblem`, `.tile .no`, `.status` a varianty zkopíruj z makety a přizpůsob názvům tříd v `Home.tsx` (`tile__status--none` a `--playing` = žluté kolečko, `--won` = zelené, `--lost` = černé).

Jediná animace v celém návrhu: po najetí myší se vlajka na dlaždici lehce zkosí, jako by se pohnula ve větru (`transform: skewY(-4deg)`, 160 ms). Původní posun dlaždice nahoru (`translateY(-3px)`) odstraň.

### Krok 6: rám s dílky kolem map a herních ploch

Zkopíruj z makety blok `.chart-frame` a použij stejná pravidla (`padding: 8px`, `outline`, čtyři `repeating-linear-gradient` v `background`) na tyto existující třídy. Jejich dosavadní `border` odstraň:

- `.map` v `components.css` (mapa světa v Tajemné zemi, Cestě, Sousedech),
- `.border__canvas` v `border/border.css`,
- `.silhouette__canvas` v `silhouette/silhouette.css`.

Uvnitř rámu musí zůstat tenká černá linka kolem obsahu: přidej `border: var(--line) solid var(--ink)` na `.map__svg`, na `svg` uvnitř `.border__canvas` a na `svg` uvnitř `.silhouette__canvas`.

Pozor: `.map` má `overflow: hidden` a uvnitř jsou tlačítka zoomu a popisek. Zkontroluj, že po přidání `padding` jsou pořád vidět a tlačítka sedí v pravém dolním rohu mapy.

Mřížku GeoGridu a tabulku Countryle nerámuj.

### Krok 7: panely a drobnosti

- `.game__panel`, `.countryle__top`, `.hl__card`, `.hl__result`, `.modal`: pozadí `var(--paper)`, linka `var(--line) solid var(--ink)`, rohy `var(--radius)`, žádný stín.
- Řádky seznamu tipů `.guess`: místo podbarvení nejnovějšího tipu dej každému řádku dole `border-bottom: 1px dashed #b6c0c8` a nejnovější zvýrazni tučným písmem.
- `.country-input__option--active`: místo žlutého pozadí `background: var(--magenta-soft)`.
- `.geogrid__cell--selected`: obrys `4px solid var(--magenta)`.
- `.flagclues__clue--new`: obrys `3px solid var(--magenta)`.
- `.map__controls button:hover`: `background: var(--magenta-soft)`.

### Krok 8: vymyšlené vlajky her (`src/shared/components/Emblem.tsx`)

Nahoře v souboru jsou konstanty barev. Slaď je s novou paletou: `NAVY = '#14171c'`, `RED = '#d62828'`, `YELLOW = '#ffd23f'`, `WHITE = '#fdfdf9'`, `BLUE = '#0b3d91'`. Tvary neměň.

### Krok 9: jediná povolená změna mimo vzhled (teplotní škála Tajemné země)

Moře je teď světle modré a „studené“ barvy tipů by s ním splývaly. Proto ztmav dva nejstudenější body škály. Jsou to přesně tyto tři úpravy:

1. `src/games/mystery/logic.ts`, pole `HEAT_STOPS`: řádek `[7500, '#B9D4EC']` změň na `[7500, '#8FB3E0']` a řádek `[12000, '#7FA6DC']` na `[12000, '#4F7DC4']`.
2. `src/games/mystery/logic.test.ts`: `expect(heatColor(20000)).toBe('#7FA6DC')` změň na `expect(heatColor(20000)).toBe('#4F7DC4')`.
3. `src/games/mystery/mystery.css`, přechod v `.heat-legend__bar`: první dvě barvy `#7fa6dc, #b9d4ec` změň na `#4f7dc4, #8fb3e0`.

Stejné dvě barvy jsou i v nápovědě hry přes funkci `heatColor`, ta se přebarví sama. Nic jiného v `logic.ts` neměň.

### Krok 10: závěrečná kontrola

Spusť `npm run dev` a projdi tento seznam. U každé položky se podívej, jestli je všechno čitelné a nic nepřetéká:

- Domovská stránka: vlajky nad nápisem, růžice vpravo, devět dlaždic se stožáry, seznam „Další hry v plánu“.
- U každé z devíti her: nápověda (okno „Jak hrát“), rozehraná hra, dohraná hra (výhra i prohra), okno Statistiky.
- Tajemná země: studené tipy (daleké země) jsou na mapě jasně odlišené od moře.
- Cesta mezi zeměmi a Sousedé: čárkovaný obrys napovězené země je vidět.
- Nakresli hranici: bílé místo, červený tah, po vyhodnocení zelený tvar a žlutý tah.
- Easter egg: napiš do políčka „Československo“ a dej Enter. Šedá obrazovka má zůstat tak, jak je.
- Zúž okno prohlížeče pod 900 px: panel se přesune pod mapu, nic se nerozsype.

Potom:

1. `npm run typecheck && npm test && npm run build` musí projít.
2. V `HANDOFF.md` přepiš pododdíl „Vzhled“ (popiš nový motiv a kde jsou barvy), uprav „Průvodce úpravami vzhledu“ tam, kde už neplatí, a doplň „Log změn“.
3. Commit, zip projektu bez `node_modules` a `dist`, pošli mi ho.
4. Napiš mi, co jsi udělal jinak než v zadání a proč, a co se ti nepodařilo.
