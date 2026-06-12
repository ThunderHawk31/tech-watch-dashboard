<div id="top">
<div align="center">

# TECH-WATCH-DASHBOARD

<em>Dashboard de veille technologique et financière — automatisé avec n8n + Claude AI</em>

<img src="https://img.shields.io/github/last-commit/ThunderHawk31/tech-watch-dashboard?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/badge/n8n-EA4B71?style=flat&logo=n8n&logoColor=white" alt="n8n">
<img src="https://img.shields.io/badge/Claude_API-191919?style=flat&logo=anthropic&logoColor=white" alt="Claude API">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase">
<img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white" alt="Vercel">

</div>

---

## ✨ Ce que ça fait

- **~40 articles analysés par jour** depuis 5+ sources RSS tech/finance/crypto
- **Analyse IA** via Claude API (secteur, importance 1-10, sentiment, tickers)
- **Alertes Gmail** pour les articles importance ≥ 4
- **Dashboard web** avec filtres, statistiques, et modale d'analyse complète
- **Support newsletters** (ex : Zonebourse/Aktionnaire via Gmail)

---

## 🏗️ Stack

| Composant | Technologie | Coût |
|-----------|-------------|------|
| Automatisation | n8n self-hosted | Gratuit (voir étape 3) |
| Analyse IA | Claude API Sonnet | ~$5/mois pour usage personnel |
| Base de données | Supabase | Gratuit |
| Frontend | React sur Vercel | Gratuit |

---

## 🚀 Setup complet (~45 min)

### Étape 1 — Créer la base de données Supabase

1. Aller sur **[supabase.com](https://supabase.com)** → "Start your project" → créer un compte (gratuit)
2. Cliquer **"New project"** → choisir un nom → noter le mot de passe → créer
3. Attendre ~2 minutes que le projet soit prêt
4. Dans le menu gauche → **"SQL Editor"** → cliquer le bouton **"New query"**
5. Copier-coller le SQL ci-dessous → cliquer **"Run"** (▶️) :

```sql
-- Table principale des articles
create table techwatch_articles (
  article_id uuid default gen_random_uuid() primary key,
  title text,
  title_en text,
  published_at timestamptz,
  url text unique,
  analysis text,
  importance int,
  sentiment text,
  tickers text,
  sector text,
  tokens int,
  created_at timestamptz default now()
);

-- Autoriser la lecture publique (nécessaire pour le frontend)
alter table techwatch_articles enable row level security;
create policy "Public read" on techwatch_articles for select using (true);

-- Table des sources (pour les badges sur les articles)
create table flux_sources (
  id uuid default gen_random_uuid() primary key,
  name text,
  domain text,
  type text,
  active boolean default true
);
alter table flux_sources enable row level security;
create policy "Public read" on flux_sources for select using (true);
```

6. Aller dans **Settings** (icône engrenage en bas à gauche) → **"Data API"**
7. Noter les deux valeurs suivantes (vous en aurez besoin aux étapes 2 et 3) :
   - **Project URL** : `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** : la clé qui commence par `eyJ...` (ne pas utiliser la `service_role`)
   - **service_role key** : cliquer "Reveal" pour l'afficher — à utiliser dans n8n **uniquement** (ne jamais mettre dans le code frontend)

---

### Étape 2 — Déployer le site web sur Vercel

1. Avoir un compte **[GitHub](https://github.com)** (gratuit)
2. Cliquer **"Fork"** en haut à droite de ce repo pour en faire une copie sur votre compte
3. Aller sur **[vercel.com](https://vercel.com)** → "Log in with GitHub"
4. Cliquer **"Add New… > Project"** → sélectionner votre fork
5. Dans **"Root Directory"**, écrire : `frontend`
6. Ouvrir **"Environment Variables"** et ajouter ces 3 variables :

| Nom | Valeur |
|-----|--------|
| `REACT_APP_SUPABASE_URL` | Votre Project URL (ex : `https://xxxx.supabase.co`) |
| `REACT_APP_SUPABASE_ANON_KEY` | Votre anon key |
| `REACT_APP_SUPABASE_BASE_URL` | Même valeur que `REACT_APP_SUPABASE_URL` |

7. Cliquer **"Deploy"** → dans ~2 minutes votre site est en ligne ✅

> À ce stade le site s'affiche mais il n'y a pas encore d'articles — c'est normal, c'est n8n qui va les injecter.

---

### Étape 3 — Installer et configurer n8n

n8n est l'outil qui va automatiquement récupérer et analyser les articles. Il doit tourner en permanence sur un serveur.

**Option A — Railway (recommandé pour débuter, gratuit jusqu'à 5$/mois de ressources)**

1. Aller sur **[railway.app](https://railway.app)** → créer un compte (via GitHub)
2. Cliquer **"New Project"** → **"Deploy from template"** → chercher **"n8n"** → Deploy
3. Attendre le déploiement (~3 min) → cliquer sur le service → onglet **"Settings"** → copier le domaine public
4. Ouvrir ce domaine dans le navigateur → créer un compte n8n

**Option B — NAS ou serveur personnel** (si vous en avez un, demandez à l'auteur)

---

### Étape 4 — Importer le workflow n8n

> ⚠️ **Le fichier workflow doit être demandé directement à l'auteur** — [Nolan](https://github.com/ThunderHawk31). Envoyez-lui un message pour obtenir le fichier `techwatch-workflow.json`.

1. Dans n8n → menu gauche **"Workflows"** → bouton **"Add workflow"** → icône **"..."** en haut → **"Import from file"**
2. Sélectionner le fichier `techwatch-workflow.json` reçu
3. Configurer les **Credentials** (menu gauche → "Credentials" → "Add credential") :

   **Claude API** (obligatoire)
   - Aller sur **[console.anthropic.com](https://console.anthropic.com)** → créer un compte → ajouter une carte bancaire → "API Keys" → créer une clé
   - Dans n8n : type "Anthropic" → coller la clé

   **Supabase** (obligatoire)
   - Dans n8n : type "Header Auth" → Header Name : `apikey` → Value : votre **service_role key** Supabase
   - Mettre aussi à jour l'URL Supabase dans les nodes "Insert Supabase" du workflow

   **Gmail** (optionnel — pour recevoir les alertes)
   - Dans n8n : type "Google OAuth2" → suivre les instructions d'autorisation

4. Cliquer **"Save"** puis activer le workflow (toggle en haut à droite)

---

### Étape 5 — Vérifier que tout fonctionne

1. Dans n8n → ouvrir le workflow → cliquer **"Execute Workflow"** (test manuel)
2. Vérifier que les nodes s'exécutent sans erreur (icônes vertes)
3. Retourner sur votre site Vercel → actualiser → les articles devraient apparaître

---

## 📁 Structure du repo

```
tech-watch-dashboard/
├── frontend/          # App React → déployer sur Vercel
│   ├── src/
│   └── .env.example   # Variables à configurer
└── README.md
```

---

## ❓ Problèmes fréquents

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| Site blanc / erreur CORS | Variables d'env manquantes | Vérifier les 3 variables dans Vercel → Redeploy |
| Pas d'articles après exécution | Supabase mal configuré | Vérifier que la table `techwatch_articles` existe |
| Erreur dans n8n node "Insert Supabase" | Mauvaise clé (anon au lieu de service_role) | Utiliser la service_role key dans n8n |
| Claude API erreur 401 | Clé API invalide ou pas de crédit | Vérifier sur console.anthropic.com |

---

## 👤 Auteur

Développé par [Nolan](https://github.com/ThunderHawk31) — BTS SIO SISR

Pour obtenir le workflow n8n ou de l'aide pour le setup : contacter l'auteur via GitHub.

[⬆ Retour en haut](#top)
