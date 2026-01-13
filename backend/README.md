# Backend - Tech Watch Dashboard

Backend FastAPI pour le système d'authentification et les futures fonctionnalités.

## 🚀 Fonctionnalités

### ✅ Implémenté
- **Authentification JWT** avec MongoDB
- Sécurité (bcrypt, CORS, validation des entrées)
- Routes API RESTful

### 🔜 Améliorations futures
- Push notifications pour articles importants
- Gestion des préférences utilisateur
- API analytics pour statistiques avancées
- Intégration directe avec n8n pour déclencher des notifications

## 📦 Installation

```bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configuration
cp .env.example .env
# Configurer les variables d'environnement dans .env
```

## 🏃 Lancer le serveur

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Documentation API disponible sur : `http://localhost:8000/docs`

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt
- Tokens JWT avec expiration
- CORS configuré
- Validation des entrées avec Pydantic

## 📝 Note

Le backend est actuellement préparé pour les futures fonctionnalités d'authentification et de notifications push. Le frontend consomme les articles directement via l'API n8n/Google Sheets.
