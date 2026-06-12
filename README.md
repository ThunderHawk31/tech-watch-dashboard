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
- **Support newsletters** (ex: Zonebourse/Aktionnaire via Gmail)

---

## 🏗️ Stack

| Composant | Technologie |
|-----------|-------------|
| Automatisation | n8n (self-hosted sur Railway ou NAS) |
| Analyse IA | Claude API Sonnet |
| Base de données | Supabase (PostgreSQL) |
| Frontend | React (déployé sur Vercel) |

---

## 🚀 Setup rapide (30 min)

### 1. Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → créer un compte gratuit
2. Nouveau projet → noter l'**URL** et la **anon key** (Settings > API)
3. Ouvrir l'éditeur SQL et exécuter :

```sql
-- Table principale des articles
create table techwatch_articles (
  id uuid default gen_random_uuid() primary key,
  title text,
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

-- Activer l'accès public en lecture (RLS)
alter table techwatch_articles enable row level security;
create policy "Public read" on techwatch_articles for select using (true);

-- Table des sources (optionnelle, pour les badges dynamiques)
create table flux_sources (
  id uuid default gen_random_uuid() primary key,
  name text,
  domain text,
  type text, -- 'rss' ou 'newsletter'
  active boolean default true
);
alter table flux_sources enable row level security;
create policy "Public read" on flux_sources for select using (true);
```

### 2. Déployer le frontend sur Vercel

1. Fork ce repo sur GitHub
2. Aller sur [vercel.com](https://vercel.com) → "Import Project" → sélectionner le fork
3. **Root directory** : `frontend`
4. Ajouter les variables d'environnement :

```
REACT_APP_SUPABASE_URL         = https://votre-projet.supabase.co
REACT_APP_SUPABASE_ANON_KEY    = votre-anon-key
REACT_APP_SUPABASE_BASE_URL    = https://votre-projet.supabase.co
```

5. Deploy → le site est en ligne

### 3. Importer le workflow n8n

**Prérequis** : une instance n8n (gratuit sur [Railway](https://railway.app) ou [n8n.io cloud](https://n8n.io))

1. Dans n8n → **Workflows** → **Import from file**
2. Importer le fichier `n8n-workflow/techwatch-workflow.json`
3. Configurer les credentials dans n8n :
   - **Claude API** : clé API Anthropic ([console.anthropic.com](https://console.anthropic.com))
   - **Gmail** (optionnel, pour les alertes et newsletters)
4. Mettre à jour le node "Mapper Supabase" avec votre URL et service_role key Supabase
5. **Activer** le workflow

### 4. Vérifier

Après la prochaine exécution automatique (ou exécuter manuellement), les articles doivent apparaître dans votre dashboard Vercel.

---

## 📁 Structure du repo

```
tech-watch-dashboard/
├── frontend/          # App React (déployer sur Vercel)
│   ├── src/
│   └── .env.example   # Variables à copier en .env
├── n8n-workflow/      # Workflow n8n à importer
│   └── techwatch-workflow.json
└── README.md
```

---

## 🔧 Personnalisation

- **Ajouter/retirer des sources RSS** : modifier le node "Source RSS" dans n8n
- **Changer les secteurs** : modifier le prompt dans le node "API Claude" (attention : les regex du parser en dépendent)
- **Seuil d'alerte** : modifier la condition `importance ≥ 4` dans le node "If"

---

## 👤 Auteur

Développé par [Nolan](https://github.com/ThunderHawk31)

[⬆ Retour en haut](#top)
