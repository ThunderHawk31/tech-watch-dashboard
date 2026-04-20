from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import asyncio
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase config (pour le flux RSS)
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://bdhggllidtuwtcygsupk.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration — H3: fail hard if secret missing
SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY est obligatoire. Générez-en un avec: python -c \"import secrets; print(secrets.token_hex(64))\"")
if len(SECRET_KEY) < 32:
    raise RuntimeError("JWT_SECRET_KEY doit faire au moins 32 caractères (64 recommandés)")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Tech Watch API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# H1: Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============================================================
# MODELS
# ============================================================

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # 72 = limite bcrypt
    name: str = Field(min_length=1, max_length=100, strip_whitespace=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)  # bloquer les payloads DoS bcrypt

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserBase

# ============================================================
# HELPER FUNCTIONS - AUTHENTICATION
# ============================================================

def verify_password(plain_password, hashed_password):
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get the current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if user is None:
        raise credentials_exception
    return user

# ============================================================
# AUTH ROUTES
# ============================================================

@api_router.post("/auth/register", response_model=Token)
@limiter.limit("3/hour")
async def register(request: Request, user_data: UserCreate):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        name=user_data.name
    )
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()

    await db.users.insert_one(user_dict)

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserBase(email=user.email, name=user.name)
    )

@api_router.post("/auth/login", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, user_data: UserLogin):
    """Login with email and password"""
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        await asyncio.sleep(0.5)  # délai anti-timing attack
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(
        data={"sub": user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserBase(email=user["email"], name=user["name"])
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user

# ============================================================
# PUSH NOTIFICATIONS ROUTES (TODO - À implémenter)
# ============================================================

# TODO: Ajouter les routes suivantes pour les push notifications:
#
# @api_router.post("/push/subscribe")
# async def subscribe_to_push(subscription_data: dict, current_user: dict = Depends(get_current_user)):
#     """Subscribe a user to push notifications"""
#     pass
#
# @api_router.post("/push/notify")
# async def send_push_notification(message: str):
#     """Send push notification to all subscribers (triggered by n8n)"""
#     pass
#
# @api_router.post("/push/notify-inactive")
# async def notify_inactive_users():
#     """Send push notification to inactive users (not seen in 7 days)"""
#     pass

# ============================================================
# RSS FEED
# ============================================================

@app.get("/rss.xml", include_in_schema=False)
async def rss_feed():
    """Flux RSS public des 50 derniers articles TechWatch"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/techwatch_articles"
                "?select=title,published_at,url,analysis,sector,importance,sentiment"
                "&order=published_at.desc&limit=50",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}"
                },
                timeout=10.0
            )
        resp.raise_for_status()
        articles = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Erreur Supabase : {e}")

    def ex(s):
        return (str(s or "").replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;"))

    # Construction du XML RSS 2.0
    items_xml = ""
    for a in articles:
        try:
            pub_date = datetime.fromisoformat(
                a["published_at"].replace("Z", "+00:00")
            ).strftime("%a, %d %b %Y %H:%M:%S +0000")
        except Exception:
            pub_date = ""

        title  = ex(a.get("title") or "")
        desc   = ex((a.get("analysis") or "")[:300])
        url    = ex(a.get("url") or "")
        sector = ex(a.get("sector") or "")

        items_xml += f"""
    <item>
      <title>{title}</title>
      <link>{url}</link>
      <guid isPermaLink="true">{url}</guid>
      <description>{desc}</description>
      <pubDate>{pub_date}</pubDate>
      <category>{sector}</category>
    </item>"""

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>TechWatch — Veille IA &amp; Tech</title>
    <link>https://techwatch.fr</link>
    <description>Veille technologique automatisée — IA, Crypto, Cybersécurité, Marchés</description>
    <language>fr</language>
    <atom:link href="https://api.techwatch.fr/rss.xml" rel="self" type="application/rss+xml"/>
    {items_xml}
  </channel>
</rss>"""

    return Response(content=xml, media_type="application/rss+xml; charset=utf-8")


# ============================================================
# ROOT ENDPOINT
# ============================================================

@api_router.get("/")
async def root():
    return {"status": "ok"}

# ============================================================
# APP CONFIGURATION
# ============================================================

app.include_router(api_router)

# M3: Security headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# H2: CORS — fail hard si non configuré en production
_cors_raw = os.environ.get('CORS_ORIGINS', '').strip()
if not _cors_raw or _cors_raw == '*':
    if os.environ.get('ENV', 'production') != 'development':
        raise RuntimeError("CORS_ORIGINS est obligatoire en production (ex: https://techwatch.fr)")
    _cors_origins = ['http://localhost:3000']
else:
    _cors_origins = [o.strip() for o in _cors_raw.split(',') if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    client.close()
