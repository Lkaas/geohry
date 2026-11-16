# Jak dát GeoHry na internet (GitHub Pages)

Výsledek: web na adrese `https://TVOJE-JMENO.github.io/geohry/`, kterou pošleš bratrovi. Je zdarma. Po každé další úpravě stačí jedna dvojice příkazů a web se sám přestaví.

Co potřebuješ: účet na GitHubu (github.com, zdarma), nainstalovaný **Git** (git-scm.com) a **Node.js** (nodejs.org, verze 22). Příkazy píšeš do terminálu ve složce projektu (ve Windows třeba „Git Bash“ nebo PowerShell).

## Než začneš: zkus, že to jede u tebe

```
npm install
npm test
npm run build
```

Všechno musí skončit bez chyby. Kdyby ne, nasazení nepůjde, nejdřív vyřeš to.

## Krok 1: vytvoř prázdný repozitář na GitHubu

1. Na github.com klikni vpravo nahoře na **+** a **New repository**.
2. **Repository name:** `geohry` (název se objeví v adrese webu).
3. Nech **Public**. U soukromých repozitářů je Pages jen v placených plánech.
4. **Nezaškrtávej** „Add a README“, „.gitignore“ ani licenci. Repozitář má být úplně prázdný.
5. Klikni **Create repository**. GitHub ti ukáže stránku s adresou repozitáře, třeba `https://github.com/TVOJE-JMENO/geohry.git`. Tu si zkopíruj.

## Krok 2: nahraj projekt

Ve složce projektu (tam, kde je `package.json`) postupně spusť. Za `TVOJE-JMENO` dosaď své uživatelské jméno z GitHubu.

```
git init
git branch -M main
git add .
git commit -m "První verze GeoHer"
git remote add origin https://github.com/TVOJE-JMENO/geohry.git
git push -u origin main
```

Složky `node_modules` a `dist` se nenahrají samy, hlídá je soubor `.gitignore`. GitHub se při `git push` zeptá na přihlášení. Dnes už nejde heslo, použij přihlášení přes prohlížeč nebo „personal access token“, který ti GitHub nabídne.

Pokud už ve složce `.git` je (třeba jsi projekt už jednou nahrával), vynech `git init` a `git branch -M main` a rovnou přidej `remote`. Když příkaz `git remote add` hlásí, že `origin` už existuje, použij `git remote set-url origin https://github.com/TVOJE-JMENO/geohry.git`.

## Krok 3: zapni Pages

1. Na stránce repozitáře otevři **Settings** (ozubené kolo úplně vpravo v horní liště).
2. V levém menu klikni na **Pages**.
3. U **Source** vyber **GitHub Actions**. Nic víc nastavovat nemusíš.

Soubor `.github/workflows/deploy.yml` už v projektu je. Říká GitHubu: „při každém nahrání spusť testy, sestav web a zveřejni ho“.

## Krok 4: počkej a otevři web

1. Na stránce repozitáře klikni na záložku **Actions**. Uvidíš běžící úlohu „Nasazení na GitHub Pages“. Trvá asi minutu až dvě.
2. Když se u ní objeví zelená fajfka, otevři `https://TVOJE-JMENO.github.io/geohry/`.
3. Kdyby po prvním nahrání úloha neběžela, protože Pages jsi zapnul až po něm, klikni v **Actions** na úlohu a **Run workflow**, nebo nahraj prázdný commit: `git commit --allow-empty -m "znovu" && git push`.

## Jak nahrát další úpravy

```
git add .
git commit -m "Popis, co jsi změnil"
git push
```

Za chvíli je nová verze na webu. Když je u úlohy v Actions červený křížek, rozklikni ji: nejspíš nějaký test neprošel (web se pak nezveřejní, takže bratr pořád vidí poslední funkční verzi).

## Co když něco nejde

| Příznak | Co zkusit |
|---|---|
| Bílá stránka na adrese webu | Zkontroluj, že v **Settings > Pages** je u Source „GitHub Actions“ a že úloha v Actions doběhla zeleně. Pak stránku obnov přes Ctrl+F5. |
| 404 | Adresa musí končit názvem repozitáře: `…github.io/geohry/` (s lomítkem na konci). |
| Úloha v Actions je červená | Rozklikni ji a přečti poslední červený řádek. Nejčastěji nějaký test nebo chyba typů, spusť `npm test` a `npm run build` lokálně. |
| Ve hře chybí vlajky nebo mapa | Obnov přes Ctrl+F5, prohlížeč mohl mít v paměti starou verzi. |

## Co víš, že funguje

Ověřil jsem, že sestavený web (složka `dist`) funguje, když leží v podsložce, tedy stejně jako na GitHub Pages: načtou se dlaždice, mapa i vlajky a po obnovení stránky se hra neztratí. Samotné nasazení na GitHub jsem ale nezkoušel, nemám k němu přístup.

## Poznámky

- Hry si pamatují statistiky a rozehranou denní výzvu v prohlížeči (localStorage). Bratr tedy uvidí jen své výsledky a po vymazání dat prohlížeče o ně přijde.
- Web je jen statický, nic za tebe nestahuje z internetu ani nic neukládá na server.
- Adresu jde později změnit na vlastní doménu (Settings > Pages > Custom domain), ale to je nepovinné.
- Alternativa bez GitHubu: služba Netlify nabízí nahrání hotové složky `dist` přetažením do okna prohlížeče (hledej „Netlify Drop“). Složku `dist` vytvoří `npm run build`. Nemám ověřeno, jak vypadá nabídka dnes.
