---
name: ui-ux-simplicity
description: >-
  Product and UI/UX design rules for Dopis Ježíškovi balancing calm, tactile Christmas warmth
  with Things 3 / Apple Notes clarity and multi-generational usability. Activate this skill
  before designing, refactoring, or auditing any page, layout, navigation, modal, animation,
  or interactive component in src/.
---

# UI/UX Simplicity & Calm Tactile Utility (Dopis Ježíškovi)

Pravidla syntetizují standardy z **Vercel Labs `web-design-guidelines`**, **Anthropic `frontend-design`**, **Refactoring UI**, **Don't Make Me Think** (Steve Krug), **Laws of UX** (Hickův zákon, Fittsův zákon, Progressive Disclosure) a **WCAG 2.2 AA/AAA** pro vícegenerační rodinné použití (děti, rodiče i prarodiče).

---

## 1. Redukce tření a informační architektura

### Rozpočet kliknutí (Click-Depth Budget)
- **Přidání vlastního přání:** max. **1–2 interakce** (inline vstup přímo na stránce + `Enter`, bez povinného otevírání modálu pro každý řádek).
- **Zjištění přání člena rodiny a zamluvení dárku:** max. **2 kliknutí** z přehledu rodiny (1. vybrat člověka → okamžitě vidět seznam přání, 2. `Tohle koupím`). Žádné povinné mezikroky (žádná zavřená obálka blokující každé otevření).
- **Kontrola a odškrtnutí dárku v obchodě:** **1 klik** na záložku `Nákup` → **1 klik** na velký řádek/checkbox; zbývající (nekoupené) položky vždy nahoře, koupené oddělené nebo sbalitelné.

### Hickův zákon (méně voleb na obrazovce)
- Na každé obrazovce smí být **1 jasná primární akce** (např. `Přidat přání`, `Tohle koupím`, `Sdílet odkaz`).
- Vedlejší funkce (tisk, fotka papírového dopisu, společná správa, hudební koleda, přepnutí na „pohled dopisu“) odsuň do sekundárního ovládání nebo pod kontextový přepínač — nikdy nesmí konkurovat primární akci.
- Omez počet položek hlavní navigace na max. **4** s krátkými jednoznačnými popisky.
- Odstraň „happy talk“ (zbytečné vysvětlovací odstavce a opakující se instrukce); rozhraní musí být srozumitelné ze štítků a rozvržení během **3 sekund** (*Don't Make Me Think*).

### Progressive Disclosure (nejdřív podstatné, detail na 1 klik)
- **Výchozí pohled = čistý akční seznam** (jméno, název dárku, stručná poznámka, odkaz, tlačítko akce).
- **Volitelný „pohled dopisu“** (ručně psané oslovení, závěr, fotka papírového dopisu, pečeť, tisk) zpřístupni dobrovolně na **1 klik** (přepínač nebo rozbalení), nikoliv jako povinnou překážku před samotným seznamem přání.
- Při přidávání položky zobraz hned jen povinný **název**; poznámku a odkaz na obchod rozbal až na vyžádání nebo jako tiché sekundární vstupy.

### Fittsův zákon (velikost a dosah cílů)
- Primární akce umísti do přirozené zóny palce na mobilu (spodní třetina / horní akční řádek pod hlavičkou) a dej jim plnou šířku na malých obrazovkách (`w-full sm:w-auto`).
- Rozšiř klikatelnou plochu (hit area) pomocí paddingu — u zaškrtávání v nákupním seznamu musí být spolehlivě klikatelný celý checkbox (`>= 44×44 px`) i název položky.

---

## 2. Calm & Tactile Utility (Hřejivost bez zbytečné parády)

Cílem je pocit hřejivého papírnictví (teplá paleta `#F7F2E7` / `#FFFDF8` / `#EFE5D1`, jedlová `#1B4332`, karmínová `#8E1C1C`, zlatá `#C9963B`, známky, maskot Kapřík), ale s rychlostí a čistotou nástrojů typu **Things 3** nebo **Apple Notes**.

### Pravidlo „Rituál vs. Každodenní nástroj“
| Kontext | Povoleno | Zakázáno |
| :--- | :--- | :--- |
| **Jednorázový emoční rituál** (první přihlášení, volitelné zapečetění dopisu, tisk za okno) | Jemná textura papíru, poštovní známka, vosková pečeť, krátký přechod (přeskočitelný) | Blokování obrazovky na 2–3 s bez tlačítka přeskočit |
| **Opakovaná denní práce** (přidávání 5+ přání, kontrola rodiny, nakupování v obchodě) | Okamžité zobrazení (`0 ms` zpoždění), rychlý 150 ms funkční přechod, čistý řádkový seznam | Zavřené obálky před každým čtením, `setTimeout` umělé prodlevy, neustálý pohyb v pozadí |

### Typografické rozdělení (čitelnost nad dekorací)
- **Datový obsah (názvy přání, poznámky, odkazy, nákupní seznam, tlačítka, navigace):** vždy čistý bezpatkový **`Plus Jakarta Sans`** (`font-sans`), min. `16px` (`text-base`), `leading-normal` (`1.5`), zarovnaný **vlevo** (nikdy do bloku).
- **Nadpisy sekcí a jména obdarovaných:** `Cormorant Garamond` (`font-fairytale`) pro lidský, ne-korporátní tón — čitelné velikosti, ne přehnaně velké na úkor obsahu.
- **Ruční písmo `Caveat` (`font-handwritten`):** používat **výhradně** pro krátké dekorativní prvky a volitelný „pohled dopisu“ (`Milý Ježíšku,`, osobní vzkaz, podpis, tisk). **Nikdy** pro seznamy dárků, nákupní seznam ani formuláře.

### Disciplína animací a maskota
- **Funkční animace max. `150–200 ms`** (otevření panelu, stav checkboxu, toast). Zakázány jsou dekorativní nekonečné animace rušící čtení (padající sníh, hýbající se bokeh, neustále skákající maskot) v pracovních pohledech.
- **Plné respektování `prefers-reduced-motion: reduce`:** musí vypnout *všechny* animace a přechody, ne jen vybrané třídy.
- **Optimistické UI bez umělých brzd:** po kliknutí se stav změní okamžitě; nikdy nevkládej umělé `setTimeout(...)` před zápisem do databáze.
- **Maskot Kapřík:** patří na uvítací obrazovku, prázdné stavy (empty states) nebo jako pasivní tlačítko nápovědy na vyžádání — nikdy nesmí sám automaticky vyskakovat s bublinou při každé změně stránky ani ubírat šířku hlavního obsahu.

---

## 3. Vícegenerační UX a přístupnost (rodiče a prarodiče)

- **Dotykové cíle (WCAG 2.5.5 AAA):** každý klikatelný prvek (včetně ikon `Upravit`, `Smazat`, `Uvolnit`, `×`, checkboxů) musí mít aktivní plochu minimálně **`44×44 px`** (`min-h-[44px] min-w-[44px]`) a rozestup alespoň **`8 px`** (`gap-2`) od sousedního tlačítka.
- **Kontrast (WCAG 1.4.3 / AAA cíl):** primární text min. `7:1` (`#1E2421` na `#FFFDF8` / `#F7F2E7`), sekundární text a popisky min. `4.5:1` (`#4A544E`+, nepoužívat příliš světlé šedé ani průsvitné popisky pod 75 % opacity).
- **Žádná nejednoznačnost ovládacích prvků:**
  - Klíčové akce nesmí být jen holá ikona bez textu — vždy páruj ikonu s jasným českým štítkem (např. `Upravit`, `Smazat`, `Uvolnit`, `Zobrazit dopis`).
  - Stavy (`koupeno` vs `zbývá`, `aktivní záložka`, `uloženo`, `ukládám`) se nesmí spoléhat jen na barvu (WCAG 1.4.1) — kombinuj barvu, ikonu/odškrtnutí a text nebo přeškrtnutí.
- **Odpouštějící design (Safe Undo & Formuláře — Vercel Web Design Guidelines):**
  - Reverzibilní akce (zamluvení dárku, uvolnění dárku, smazání přání, smazání tajného nápadu) proveď okamžitě s výraznou **`6–8s` lištou `Vrátit zpět` (Undo toast)** místo zbytečného blokujícího dialogu; nevratné destruktivní akce (`Smazat účet`, `Smazat celý dopis`, `Odebrat propojení`) chraň potvrzovacím dialogem.
  - **Formuláře:** nikdy nepřed-deaktivuj tlačítko `Odeslat` před interakcí uživatele, pokud chybí vysvětlení proč — nech ho kliknutelné a při chybě zobraz konkrétní instrukci, jak chybu opravit. Během odesílání tlačítko zamkni (`disabled`), zobraz stav (`Ukládám...`) a zabraň dvojitému odeslání. Nikdy neblokuj psaní znaků na klávesnici.
  - Všechny formulářové prvky musí mít explicitní `<label htmlFor>`, viditelný `:focus-visible` ring a klávesnicovou ovladatelnost (`Enter`, `Escape`).

---

## 4. React + Tailwind UI architektura

- **Zákaz „krabic v krabicích“ (Refactoring UI):** nepoužívej vnořené karty s okraji uvnitř karet (`border` uvnitř `border`, vnitřní dekorativní rámečky v modálech, 3 stohované SVG-filtrované papíry pod sebou).
- **Seskuponání prostorem a jemným tónem povrchu:**
  - Plátno aplikace: `#F7F2E7` (`bg-paper`).
  - Aktivní povrch / řádek / karta: `#FFFDF8` (`bg-sheet`) s jemným oddělením (`border-paper-warm` nebo `divide-y divide-paper-warm/70`), místo těžkých tmavých `1.5px` rámečků kolem každého řádku.
  - Zvýrazněný nebo sekundární povrch: `#EFE5D1` (`bg-kraft`) / `#E6EFEA` (`bg-fir-soft`).
- **Konzistentní 8pt rytmus rozestupů:** používej kroky `gap-2` (8 px), `gap-3` (12 px), `gap-4` (16 px), `gap-6` (24 px), `space-y-6` / `space-y-8` mezi sekcemi.
- **3úrovňová vizuální hierarchie bez chaosu velikostí:**
  1. **Primární:** `text-slate-text font-semibold/bold` (název dárku, jméno člověka).
  2. **Sekundární:** `text-slate-text-muted text-sm/base font-normal` (poznámka, skupina, stav).
  3. **Akční / metadata:** `text-fir font-semibold` (odkaz, počítadlo, tlačítko).
- **Skenovatelné řádky místo obřích dekorativních karet:** v přehledech rodiny a nákupního seznamu preferuj kompaktní řádky/karty, kde je na jedné obrazovce mobilu vidět alespoň **4–6 položek** najednou bez scrollování přes 350px dekorace.
- **Čistý repozitář bez duplicit:** nenechávej v `src/components/` nepoužívané modály ani duplicitní zobrazení téhož seznamu na dvou stránkách bez jasné akce.

---

## 5. Kontrolní checklist před každou UI úpravou

Před dokončením jakékoliv změny rozhraní ověř všechny body:
- [ ] **Pravidlo 3 sekund:** Pozná i prarodič na první pohled, kde je a na co kliknout?
- [ ] **Click-depth:** Přidání přání <= 2 kroky, zamluvení dárku z `/rodina` <= 2 kliky, odškrtnutí v `/nakupni-seznam` = 1 klik?
- [ ] **Žádné blokující překážky:** Nečeká uživatel na žádnou zbytečnou animaci (`> 200 ms`) nebo zbytečný mezikrok při opakované akci?
- [ ] **Čitelná typografie:** Jsou všechna přání a nákupní položky v `Plus Jakarta Sans` (`>= 16 px`), zarovnané vlevo, bez kurzivního `Caveat` v datových řádcích?
- [ ] **Dotykové cíle:** Mají *všechna* tlačítka, checkboxy a ikony klikatelnou plochu min. `44×44 px` s mezerou alespoň `8 px`?
- [ ] **Bezpečné vrácení (Undo):** Má každá smazací/uvolňovací/rezervační akce buď 6–8s `Vrátit zpět` toast, nebo potvrzovací dialog u nevratných akcí?
- [ ] **Bez krabic v krabicích:** Není žádná karta zbytečně orámována dvojitým rámečkem ani vnořena do další ohraničené karty?
- [ ] **Mobil (`390×844`) i Desktop (`1440×900`):** Nic se nepřekrývá, spodní lišta ani maskot nezakrývají obsah a `prefers-reduced-motion` vypíná pohyb.
