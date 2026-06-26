# 🍇 Ma Cave Virtuelle

Application web personnelle (mobile + ordinateur) pour gérer une cave à vin :
inventaire filtrable, accords mets-vins, notes de dégustation, reconnaissance
d'étiquette par photo, et synthèses « avis communauté » (La Passion du Vin +
critiques) — le tout propulsé par l'API Claude.

- **Front + back** : Next.js 14 (App Router) + TypeScript + Tailwind
- **Données / Auth / Photos** : Supabase (ou **mode démo** local sans rien installer)
- **IA** : API Claude (`claude-opus-4-8`) — accords, étiquette, fenêtre de garde, LPV/critiques
- **Hébergement** : Vercel (gratuit)

---

## 1. Lancer en local (mode démo)

Aucun compte requis : sans variables d'environnement, l'app démarre en **mode
démo** (données dans le navigateur).

```bash
npm install
npm run dev
# http://localhost:3000
```

Pour activer les fonctions IA en local, crée `.env.local` :

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-opus-4-8     # ou claude-sonnet-4-6 pour réduire le coût
```

> La cave réelle est chargée depuis `public/cellar.local.json` (généré depuis
> l'Excel, **non versionné** par confidentialité). Régénérer :
> `node scripts/genSeed.cjs && node scripts/enrichSeed.cjs`
> (enrichissement région/cépages/occasion par règles ; fenêtres de garde
> raisonnées par l'IA : `node scripts/enrichGarde.cjs`).

---

## 2. Mettre en ligne (Supabase + Vercel)

### Étape A — Projet Supabase

1. Crée un projet sur https://supabase.com (région Europe de préférence).
2. **SQL Editor → New query** → colle le contenu de
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   (crée les tables `bottles` / `storage_units` / `history`, la sécurité RLS,
   et le bucket de stockage `photos`.)
3. **Authentication → Users → Add user** → crée **ton** compte (email + mot de
   passe). Les inscriptions publiques restent fermées : l'app est privée.
4. **Project Settings → API** → note :
   - `Project URL`  → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`  → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Étape B — Déployer sur Vercel

1. Pousse le dépôt sur GitHub (déjà fait : `florian-vergnaud/my-wine-app`).
2. Sur https://vercel.com → **New Project** → importe le dépôt.
3. **Environment Variables** (Production + Preview) :

   | Variable | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase) |
   | `ANTHROPIC_API_KEY` | ta clé Claude |
   | `ANTHROPIC_MODEL` | `claude-opus-4-8` (optionnel) |

4. **Deploy**. Une fois en ligne, ouvre l'URL → écran de **connexion** →
   identifiants créés à l'étape A.3.

> Dès que `NEXT_PUBLIC_SUPABASE_URL` + `…ANON_KEY` sont présents, l'app quitte le
> mode démo : connexion obligatoire, données dans Supabase, et les routes IA
> (payantes) exigent une session valide (anti-abus).

### Étape C — Importer ta cave enrichie

Tes données enrichies vivent en local (mode démo), pas dans Supabase. Pour les
charger en ligne, une fois :

```bash
node scripts/exportLocalCellar.cjs      # crée cellar-export.xlsx
```

Puis dans l'app en ligne (connecté) : **Ma cave → ⬆️ Importer →** choisis
`cellar-export.xlsx` → vérifie l'aperçu → importe. (Les colonnes correspondent
au modèle d'import, round-trip propre.)

---

## 3. Fonctions IA (API Claude)

| Fonction | Où | Route |
|---|---|---|
| Reconnaissance d'étiquette (photo → champs) | Fiche vin → 📷 | `/api/recognize` |
| Accord mets-vin (depuis la cave) | Quoi boire ? | `/api/pairing` |
| Fenêtre de garde d'un vin | Fiche vin → ⏳ | `/api/drink-window` |
| Avis communauté LPV + notes (Vivino/WS/RVF) | Clic sur une ligne → ✨ | `/api/wine-info` |

- Tout passe **côté serveur** : la clé Claude n'est jamais exposée au navigateur.
- `/api/wine-info` utilise la recherche web de Claude, biaisée vers
  lapassionduvin.com (requête `producteur cuvée millésime lpv`), et conserve
  l'échelle d'origine des notes. ~25 s. Si la recherche web est limitée, l'app
  renvoie une réponse honnête sans inventer.
- `maxDuration = 60s` sur les routes (compatible Vercel Hobby). Le plan Hobby
  plafonne à 60 s ; si une recherche dépasse, passe en Pro ou réduis la portée.

---

## 4. Sécurité

- `.env.local`, `public/cellar.local.json`, `cellar-export.xlsx` sont
  **gitignorés** : ni clé ni données personnelles dans le dépôt.

---

## 5. Scripts

| Script | Rôle |
|---|---|
| `scripts/genSeed.cjs` | Excel → `public/cellar.local.json` |
| `scripts/enrichSeed.cjs` | remplit région / cépages / occasion (règles) |
| `scripts/enrichGarde.cjs` | fenêtres de garde raisonnées (API Claude, `.env.local`) |
| `scripts/exportLocalCellar.cjs` | `cellar.local.json` → `cellar-export.xlsx` (import en ligne) |

---

## 6. Commandes

```bash
npm run dev     # développement (http://localhost:3000)
npm run build   # build de production
npm run start   # serveur de production
```
