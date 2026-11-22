# Dopis Ježíškovi

Rodinná webová aplikace pro psaní vánočních dopisů, tajné zamlouvání dárků a tisk pohádkových dopisů bez duplicitních dárků a se zachováním stoprocentního kouzla překvapení.

## Hlavní funkce

- **Moje dopisy (vlastní i dětské):** Psaní dopisů pro sebe i za děti (např. *Julinka*, *Šárinka*), přidávání přání s poznámkou a odkazem (*Ukázka dárku*) a šetrná kontrola před uložením.
- **Tisk do PDF (3 šablony):** *Ručně psaný dopis* (`Caveat`), *Pohádkové Vánoce* (`Cormorant Garamond`) a *Čistý minimalismus*.
- **Rodina a blízcí přes tagy a skupiny:** Bezpečné vyhledání přes tag (`Jméno#1234`), oboustranné schválení a sdílené rodinné skupiny.
- **Absolutní překvapení (`claims`):** Majitel dopisu (ani rodič u dětského dopisu) nikdy technicky nevidí rezervace u svých dopisů. Po zamluvení dárek okamžitě zmizí všem ostatním nakupujícím.
- **Nákupní seznam („Co mám koupit“):** Přehled seskupený podle obdarovaných, zaškrtnutí *Koupeno / zabaleno*, možnost uvolnit dárek zpět do dopisu i prostor pro vlastní tajné nápady.

---

## Lokální spuštění

```bash
npm install
npm run dev
```

Pokud ještě nemáš vyplněný soubor `.env`, aplikace nabídne na úvodní obrazovce **Ukázkový režim**, ve kterém si můžeš vyzkoušet celou rodinnou komunikaci přímo v prohlížeči.

---

## Napojení na Firebase

1. Ve [Firebase Console](https://console.firebase.google.com/) založ nový projekt.
2. Zapni **Authentication → Sign-in method → Google**.
3. Založ databázi **Cloud Firestore** (v produkčním režimu).
4. V nastavení projektu přidej webovou aplikaci (`</>`) a zkopíruj konfigurační klíče do nově vytvořeného souboru `.env` podle vzoru `.env.example`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. Nahraj přiložená bezpečnostní pravidla ze souboru `firestore.rules` (přes záložku **Firestore Database → Rules** v konzoli nebo přes Firebase CLI příkazem `firebase deploy --only firestore:rules`).
6. *(Volitelné)* Pokud v nákupním seznamu přibude více dat, můžeš pro složený dotaz na kolekci `claims` (`claimedByUid ==` a `letterOwnerUid !=`) vytvořit doporučený index z konzole (aplikace se však automaticky přepne na záložní dotaz i bez něj).

---

## Nasazení na Vercel

1. Nahraj repozitář na GitHub (`JiriCzech/dopis-jeziskovi`).
2. Ve Vercelu vyber **Add New Project** a připoj repozitář.
3. Framework preset ponech **Vite** (Build Command: `npm run build`, Output Directory: `dist`).
4. V sekci **Environment Variables** přidej všech 6 proměnných `VITE_FIREBASE_*`.
5. Soubor `vercel.json` už obsahuje přesměrování pro SPA routing. Po nasazení nezapomeň přidat výslednou doménu (`.vercel.app`) ve Firebase Console do **Authentication → Settings → Authorized domains**.
