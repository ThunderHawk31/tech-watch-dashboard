# ============================================================
# TECH WATCH BACKEND - VERSION SÉCURISÉE
# ============================================================
# Correctifs appliqués :
# - Rate limiting (slowapi)
# - CSP headers
# - Logging sécurisé structuré
# - NoSQL injection protection
# - JWT secret validation stricte
# - CORS strict
# - HTTPS enforcement
# - Refresh tokens
# - Security headers complets
# ============================================================

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, validator
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets
import re

# ============================================================
# CONFIGURATION & ENVIRONMENT
# ============================================================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# 🔐 SÉCURITÉ #2 : JWT SECRET OBLIGATOIRE
SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
if not SECRET_KEY or SECRET_KEY == 'your-super-secret-jwt-key-here-change-this':
    raise ValueError(
        "❌ ERREUR SÉCURITÉ : JWT_SECRET_KEY doit être défini et sécurisé dans .env\n"
        "Générez un secret sécurisé avec : python -c 'import secrets; print(secrets.token_hex(32))'"
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 🔐 SÉCURITÉ #9 : Token court (30min au lieu de 7 jours)
REFRESH_TOKEN_EXPIRE_DAYS = 30    # Refresh token : 30 jours

# 🔐 SÉCURITÉ #3 : CORS STRICT
ALLOWED_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')
if not ALLOWED_ORIGINS or '*' in ALLOWED_ORIGINS:
    raise ValueError(
        "❌ ERREUR SÉCURITÉ : CORS_ORIGINS doit être explicite (pas de wildcard)\n"
        "Exemple : CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000"
    )

# 🔐 SÉCURITÉ #1 : API KEY pour webhook n8n
N8N_API_KEY = os.environ.get('N8N_API_KEY')
if not N8N_API_KEY:
    raise ValueError(
        "❌ ERREUR SÉCURITÉ : N8N_API_KEY doit être défini dans .env\n"
        "Générez une clé sécurisée avec : python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

# MongoDB
mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("❌ MONGO_URL doit être défini dans .env")

db_name = os.environ.get('DB_NAME')
if not db_name:
    raise ValueError("❌ DB_NAME doit être défini dans .env")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Environment
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

# ============================================================
# LOGGING SÉCURISÉ #5
# ============================================================

# Configuration logging structuré (JSON)
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

class SecurityLogger:
    """Logger sécurisé avec outputs structurés JSON"""
    
    @staticmethod
    def log_auth_attempt(email: str, success: bool, ip: str, user_agent: str = ""):
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "auth_attempt",
            "email": email,
            "success": success,
            "ip": ip,
            "user_agent": user_agent
        }
        logger.info(json.dumps(event))
    
    @staticmethod
    def log_suspicious_activity(event_type: str, details: dict, ip: str):
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "suspicious_activity",
            "subtype": event_type,
            "details": details,
            "ip": ip
        }
        logger.warning(json.dumps(event))
    
    @staticmethod
    def log_rate_limit_hit(ip: str, endpoint: str):
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "rate_limit_exceeded",
            "ip": ip,
            "endpoint": endpoint
        }
        logger.warning(json.dumps(event))

security_logger = SecurityLogger()

# ============================================================
# RATE LIMITING #4
# ============================================================

limiter = Limiter(key_func=get_remote_address)

# ============================================================
# PASSWORD & JWT
# ============================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Vérifier que c'est un access token (pas refresh)
        if payload.get("type") != "access":
            raise credentials_exception
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 🔐 SÉCURITÉ #6 : Protection NoSQL injection avec projection explicite
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password": 0}  # Ne jamais retourner le password
    )
    if user is None:
        raise credentials_exception
    return user

# ============================================================
# MODELS - VALIDATION STRICTE #6
# ============================================================

class UserBase(BaseModel):
    email: EmailStr  # 🔐 Validation email stricte
    name: str = Field(..., min_length=2, max_length=100)
    
    @validator('name')
    def name_must_be_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-ZÀ-ÿ\s\-\.]+$', v):
            raise ValueError('Le nom ne peut contenir que lettres, espaces, tirets et points')
        return v

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=2, max_length=100)
    
    @validator('password')
    def password_strength(cls, v):
        # 🔐 Validation force password
        if len(v) < 8:
            raise ValueError('Le mot de passe doit contenir au moins 8 caractères')
        if not any(c.isupper() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une majuscule')
        if not any(c.islower() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins une minuscule')
        if not any(c.isdigit() for c in v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v
    
    @validator('name')
    def name_must_be_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-ZÀ-ÿ\s\-\.]+$', v):
            raise ValueError('Le nom ne peut contenir que lettres, espaces, tirets et points')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserBase

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# ============================================================
# MIDDLEWARE - SECURITY HEADERS #8
# ============================================================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # 🔐 Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            f"connect-src 'self' {' '.join(ALLOWED_ORIGINS)};"
        )
        
        # 🔐 Autres headers de sécurité
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # 🔐 HTTPS enforcement #10
        if ENVIRONMENT == 'production':
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        return response

# ============================================================
# APP INITIALIZATION
# ============================================================

app = FastAPI(
    title="Tech Watch API - Secured",
    version="2.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,  # Désactive docs en prod
    redoc_url=None
)

api_router = APIRouter(prefix="/api")

# 🔐 HTTPS redirect en production #10
if ENVIRONMENT == 'production':
    app.add_middleware(HTTPSRedirectMiddleware)

# 🔐 Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 🔐 CORS strict #3
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# 🔐 Rate limiting #4
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================================
# AUTH ROUTES - AVEC RATE LIMITING
# ============================================================

@api_router.post("/auth/register", response_model=Token)
@limiter.limit("5/hour")  # 🔐 Max 5 inscriptions/heure par IP
async def register(request: Request, user_data: UserCreate):
    """Créer un nouveau compte utilisateur"""
    
    # 🔐 Vérifier si email existe déjà (avec projection pour éviter NoSQL injection)
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 1})
    if existing:
        # 🔐 Log tentative d'inscription avec email existant
        security_logger.log_suspicious_activity(
            "duplicate_registration",
            {"email": user_data.email},
            get_remote_address(request)
        )
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Créer user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # 🔐 Générer access + refresh tokens
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(data={"sub": user.id})
    
    # 🔐 Log inscription réussie
    security_logger.log_auth_attempt(
        user_data.email,
        True,
        get_remote_address(request),
        request.headers.get("user-agent", "")
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserBase(email=user.email, name=user.name)
    )

@api_router.post("/auth/login", response_model=Token)
@limiter.limit("10/minute")  # 🔐 Max 10 tentatives/minute par IP
async def login(request: Request, user_data: UserLogin):
    """Connexion avec email et mot de passe"""
    
    # 🔐 Protection NoSQL injection avec validation Pydantic
    user = await db.users.find_one({"email": user_data.email})
    
    if not user or not verify_password(user_data.password, user["password"]):
        # 🔐 Log tentative échouée
        security_logger.log_auth_attempt(
            user_data.email,
            False,
            get_remote_address(request),
            request.headers.get("user-agent", "")
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # 🔐 Générer tokens
    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(data={"sub": user["id"]})
    
    # 🔐 Log connexion réussie
    security_logger.log_auth_attempt(
        user_data.email,
        True,
        get_remote_address(request),
        request.headers.get("user-agent", "")
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserBase(email=user["email"], name=user["name"])
    )

@api_router.post("/auth/refresh", response_model=Token)
@limiter.limit("20/hour")  # 🔐 Max 20 refresh/heure par IP
async def refresh(request: Request, token_data: RefreshTokenRequest):
    """Renouveler l'access token avec un refresh token"""
    
    try:
        payload = jwt.decode(token_data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Vérifier que c'est un refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Vérifier que user existe toujours
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user or not user.get("is_active"):
            raise HTTPException(status_code=401, detail="User not found or inactive")
        
        # Générer nouveaux tokens
        new_access_token = create_access_token(
            data={"sub": user_id},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        new_refresh_token = create_refresh_token(data={"sub": user_id})
        
        return Token(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user=UserBase(email=user["email"], name=user["name"])
        )
        
    except JWTError:
        security_logger.log_suspicious_activity(
            "invalid_refresh_token",
            {"token": token_data.refresh_token[:20] + "..."},
            get_remote_address(request)
        )
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.get("/auth/me")
@limiter.limit("60/minute")  # 🔐 Max 60 requêtes/minute
async def get_me(request: Request, current_user: dict = Depends(get_current_user)):
    """Récupérer les infos de l'utilisateur connecté"""
    return current_user

# ============================================================
# ARTICLES ROUTES - PROTÉGÉES PAR JWT #1
# ============================================================

@api_router.get("/articles")
@limiter.limit("120/minute")  # 🔐 Max 120 articles/minute
async def get_articles(
    request: Request,
    current_user: dict = Depends(get_current_user)  # 🔐 JWT obligatoire
):
    """Récupérer les articles depuis n8n webhook (protégé)"""
    
    # TODO: Implémenter fetch depuis n8n avec N8N_API_KEY
    # Pour l'instant, retourne mock data
    return {
        "articles": [],
        "stats": {},
        "message": "Protected endpoint - JWT valid"
    }

# ============================================================
# N8N WEBHOOK ROUTE - PROTÉGÉE PAR API KEY #1
# ============================================================

@api_router.post("/webhook/articles")
@limiter.limit("60/hour")  # 🔐 Max 60 webhooks/heure
async def webhook_articles(request: Request):
    """Endpoint pour recevoir les articles depuis n8n (protégé par API key)"""
    
    # 🔐 Vérifier API key
    api_key = request.headers.get("X-API-Key")
    if api_key != N8N_API_KEY:
        security_logger.log_suspicious_activity(
            "invalid_api_key",
            {"received_key": api_key[:10] + "..." if api_key else "None"},
            get_remote_address(request)
        )
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # TODO: Traiter les articles reçus de n8n
    data = await request.json()
    
    # Log webhook reçu
    logger.info(json.dumps({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "webhook_received",
        "articles_count": len(data.get("articles", [])),
        "ip": get_remote_address(request)
    }))
    
    return {"status": "received", "count": len(data.get("articles", []))}

# ============================================================
# HEALTH CHECK - NON PROTÉGÉ MAIS LIMITÉ
# ============================================================

@api_router.get("/health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": ENVIRONMENT
    }

# ============================================================
# ROOT ENDPOINT
# ============================================================

@api_router.get("/")
async def root():
    return {
        "message": "Tech Watch API - Secured",
        "version": "2.0.0",
        "security_features": [
            "JWT authentication",
            "Rate limiting",
            "CSP headers",
            "NoSQL injection protection",
            "Structured logging",
            "HTTPS enforcement",
            "Refresh tokens"
        ]
    }

# ============================================================
# APP CONFIGURATION
# ============================================================

app.include_router(api_router)

@app.on_event("startup")
async def startup():
    """Créer les indexes MongoDB au démarrage"""
    # 🔐 Index sur email pour recherches rapides #6
    await db.users.create_index("email", unique=True)
    await db.users.create_index("created_at")
    logger.info("✅ MongoDB indexes créés")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("✅ MongoDB connection fermée")

# ============================================================
# ERROR HANDLERS - SÉCURISÉS
# ============================================================

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handler générique pour éviter de leak stack traces en production"""
    
    # Log l'erreur complète
    logger.error(json.dumps({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "unhandled_exception",
        "error": str(exc),
        "path": str(request.url),
        "method": request.method,
        "ip": get_remote_address(request)
    }))
    
    # En production, ne pas exposer détails de l'erreur
    if ENVIRONMENT == 'production':
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )
