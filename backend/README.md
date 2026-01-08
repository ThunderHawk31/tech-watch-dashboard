# Backend - Tech Watch Dashboard

Backend FastAPI pour le système d'authentification et les futures push notifications.

## 🚀 Fonctionnalités

### ✅ Implémenté
- **Authentification JWT** (bcrypt + MongoDB)
  - Inscription (`POST /api/auth/register`)
  - Connexion (`POST /api/auth/login`)
  - Profil utilisateur (`GET /api/auth/me`)

### 🔜 À venir
- **Push Notifications**
  - Abonnement aux notifications
  - Notification aux utilisateurs inactifs
  - Trigger depuis n8n pour articles importants

## 📦 Installation

```bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Installer les dépendances
pip install -r requirements.txt

# Copier .env.example vers .env et remplir les valeurs
cp .env.example .env
```

## ⚙️ Configuration

Créer un fichier `.env` avec :

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=techwatch_db
JWT_SECRET_KEY=your-super-secret-key
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

## 🏃 Lancer le serveur

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

API disponible sur : `http://localhost:8000`
Documentation : `http://localhost:8000/docs`

## 📚 Routes disponibles

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Profil (protégé)

### Root
- `GET /api/` - Informations API

## 🗄️ Base de données

MongoDB avec collection `users` :
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "password": "hashed_with_bcrypt",
  "created_at": "ISO8601"
}
```

## 🔐 Sécurité

- Mots de passe hashés avec **bcrypt**
- Tokens JWT avec expiration **7 jours**
- CORS configuré pour Vercel

## 📝 Notes

Le backend n'est **pas encore connecté au frontend**. L'authentification est prête pour les futures fonctionnalités (push notifications).

Frontend lit actuellement les articles directement depuis Google Sheets via n8n Railway.
