<div id="top">

<div align="center">

# TECH-WATCH-DASHBOARD

<em>Veille technologique automatisée par IA — analyses en temps réel</em>

<img src="https://img.shields.io/github/last-commit/ThunderHawk31/tech-watch-dashboard?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/ThunderHawk31/tech-watch-dashboard?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/ThunderHawk31/tech-watch-dashboard?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/n8n-EA4B71?style=flat&logo=n8n&logoColor=white" alt="n8n">
<img src="https://img.shields.io/badge/Claude_API-191919?style=flat&logo=anthropic&logoColor=white" alt="Claude API">
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/FastAPI-009688.svg?style=flat&logo=FastAPI&logoColor=white" alt="FastAPI">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind">

</div>
<br>

---

## ✨ Highlights

- 📊 **~40 articles analysés par jour** depuis 5+ sources tech de référence
- ⚡ **Gain de 2h+/jour** grâce à la curation et l'analyse automatisées
- 🤖 **Analyses IA** via Claude 4 Sonnet pour extraire secteur, importance, sentiment et résumé
- 🔄 **Entièrement automatisé** avec n8n Cloud — 2 exécutions par jour (10h30 et 18h30)
- 🔗 **Partage par lien direct** — chaque article a son URL unique (`?article=ID`)
- 📱 **PWA-ready** — installable sur mobile et desktop

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
- [Tech Stack](#tech-stack)

---

## 🎯 The Problem

Des dizaines d'articles tech sont publiés chaque jour. Les lire tous, trier, extraire les informations utiles et les organiser prend un temps considérable. Sans système automatisé, on finit soit à tout lire (épuisant), soit à rater l'essentiel.

## 💡 The Solution

**tech-watch-dashboard** automatise entièrement ce travail.

Deux fois par jour, n8n récupère les nouveaux articles depuis des flux RSS de sources tech sélectionnées. Chaque article est nettoyé puis envoyé à Claude via API avec un prompt structuré. Claude extrait les points clés, évalue l'importance (1-5⭐), détermine le sentiment et le secteur. Les résultats sont stockés dans Supabase (PostgreSQL) et exposés directement au frontend React.

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Sources["📰 Sources"]
        RSS["RSS Feeds\n(TechCrunch, HackerNews,\nCoinDesk, HuggingFace...)"]
    end

    subgraph Automation["⚙️ Automatisation (n8n Cloud)"]
        Collect["Collecte\n2×/jour"]
        Clean["Nettoyage HTML"]
        Analyze["Analyse Claude API"]
    end

    subgraph Storage["💾 Stockage (Supabase)"]
        DB["PostgreSQL\ntechwatch_articles"]
        Heat["sector_heat"]
    end

    subgraph Backend["🔧 Backend (FastAPI / Railway)"]
        API["REST API"]
        RSS_Feed["GET /rss.xml"]
        Auth["JWT Auth"]
    end

    subgraph Frontend["🎨 Frontend (React / Vercel)"]
        Site["Dashboard PWA"]
        Filters["Filtres multi-secteurs\n+ URL sync"]
        Share["Partage ?article=ID"]
        Favorites["Favoris"]
        Stats["Stats & Tendances"]
    end

    RSS --> Collect
    Collect --> Clean
    Clean --> Analyze
    Analyze --> DB
    DB --> Site
    DB --> RSS_Feed
    Heat --> Stats
    Site --> Filters
    Site --> Share
    Site --> Favorites
    Site --> Stats
    API --> Auth
```

---

## 🎯 Key Features

- 🧠 **Analyse IA** — Claude 4 Sonnet extrait secteur, importance, sentiment, actions boursières et résumé structuré
- 🔗 **Deep linking** — chaque article est accessible via `techwatch.fr/?article=UUID`, partageable et indexable
- 🗂️ **Filtres multi-secteurs** — sélection multiple avec sync URL (`?categories=IA,Cybersécurité`)
- 📊 **Stats & Tendances** — visualisation Recharts, heat map des secteurs actifs
- ⭐ **Favoris** — sauvegarde locale via localStorage
- 🔃 **Tri** — par date, score d'importance, ou A–Z
- 📡 **Flux RSS** — endpoint public `/rss.xml` consommable par Perplexity, lecteurs RSS, crawlers IA
- 🌍 **Bilingue** — bascule FR/EN sur les titres d'articles
- 📱 **PWA** — installable, offline indicator, prompt d'installation iOS
- 🟡 **Indicateur top articles** — bordure amber sur les articles importance 5

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+, npm ou yarn
- Python 3.11+, pip
- Instance n8n (cloud ou self-hosted)
- Clé API Anthropic (Claude)
- Projet Supabase avec la table `techwatch_articles`

### Installation

1. **Cloner le repo :**

```sh
git clone https://github.com/ThunderHawk31/tech-watch-dashboard
cd tech-watch-dashboard
```

2. **Frontend :**

```sh
cd frontend
yarn install
```

3. **Backend :**

```sh
cd backend
pip install -r requirements.txt
```

4. **Variables d'environnement :**

Frontend — les constantes Supabase sont dans `src/api.js` (clé anon publique).

Backend — créer un fichier `.env` dans `/backend` :

```env
DB_NAME=your_db_name
JWT_SECRET_KEY=your_secret
CORS_ORIGINS=https://techwatch.fr
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### Usage

**Frontend :**
```sh
cd frontend
yarn start
```

**Backend :**
```sh
cd backend
uvicorn server:app --reload
```

**n8n :** importer les workflows depuis `/n8n workflow` dans votre instance et configurer les triggers horaires.

---

## 🛠️ Tech Stack

### ⚙️ Automatisation
| Technologie | Usage |
|------------|-------|
| n8n Cloud | Orchestration des workflows |
| Claude 4 Sonnet API | Analyse et structuration des articles |

### 💾 Stockage
| Technologie | Usage |
|------------|-------|
| Supabase (PostgreSQL) | Base de données principale |

### 🎨 Frontend
| Technologie | Usage |
|------------|-------|
| React 18 | Framework JavaScript |
| React Router v6 | Navigation et deep linking |
| Tailwind CSS | Styling |
| shadcn/ui (Radix UI) | Composants UI |
| Recharts | Graphiques et statistiques |
| Lucide Icons | Icônes |

### 🔧 Backend
| Technologie | Usage |
|------------|-------|
| FastAPI | API Python |
| httpx | Requêtes HTTP async (flux RSS) |
| JWT | Authentification |

### 🚀 Déploiement
| Technologie | Usage |
|------------|-------|
| Vercel | Frontend |
| Railway | Backend FastAPI |
| GitHub | Version control |

---

## 👤 Author

Projet développé par [Nolan](https://github.com/ThunderHawk31) dans le cadre du BTS SIO SISR — projet de veille technologique.

---

<div align="center">

Made with ❤️ for efficient tech intelligence gathering

[⬆ Return to top](#top)

</div>
