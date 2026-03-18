from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import json
from jose import jwt, JWTError
from passlib.context import CryptContext
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

SECRET_KEY = os.environ.get("JWT_SECRET", "stageconnect-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ─── Models ───
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # "candidate" or "recruiter"

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    skills: Optional[List[str]] = None
    education: Optional[List[dict]] = None
    experience: Optional[List[dict]] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    cv_url: Optional[str] = None
    # Recruiter fields
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    company_logo: Optional[str] = None
    company_sector: Optional[str] = None
    company_size: Optional[str] = None
    company_website: Optional[str] = None

class OfferCreate(BaseModel):
    title: str
    type: str  # "stage" or "emploi"
    description: str
    requirements: Optional[List[str]] = []
    location: str
    duration: Optional[str] = None
    domain: str
    contract_type: Optional[str] = None
    deadline: Optional[str] = None
    salary: Optional[str] = None

class OfferUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    location: Optional[str] = None
    duration: Optional[str] = None
    domain: Optional[str] = None
    contract_type: Optional[str] = None
    deadline: Optional[str] = None
    salary: Optional[str] = None
    is_active: Optional[bool] = None

class ApplicationCreate(BaseModel):
    offer_id: str
    cover_letter: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: str  # "envoyee", "en_cours", "entretien", "refusee", "acceptee"

class MessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    recipient_id: str
    content: str

class InterviewCreate(BaseModel):
    application_id: str
    candidate_id: str
    date: str
    time: str
    location: Optional[str] = None
    notes: Optional[str] = None
    type: Optional[str] = "visio"  # visio, presentiel


# ─── Auth helpers ───
def create_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": user_id, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")


# ─── Auth Routes ───
@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "password": pwd_context.hash(data.password),
        "full_name": data.full_name,
        "role": data.role,
        "bio": "",
        "photo_url": "",
        "skills": [],
        "education": [],
        "experience": [],
        "location": "",
        "phone": "",
        "cv_url": "",
        "company_name": "",
        "company_description": "",
        "company_logo": "",
        "company_sector": "",
        "company_size": "",
        "company_website": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_token(user_id, data.role)
    return {
        "token": token,
        "user": {k: v for k, v in user.items() if k not in ["_id", "password"]}
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not pwd_context.verify(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = create_token(user["id"], user["role"])
    user_data = {k: v for k, v in user.items() if k not in ["_id", "password"]}
    return {"token": token, "user": user_data}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user


# ─── Profile Routes ───
@api_router.put("/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated

@api_router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user


# ─── File Upload ───
@api_router.post("/upload/cv")
async def upload_cv(file: UploadFile = File(...), user=Depends(get_current_user)):
    file_ext = file.filename.split(".")[-1] if file.filename else "pdf"
    filename = f"{user['id']}_{uuid.uuid4().hex[:8]}.{file_ext}"
    filepath = UPLOAD_DIR / filename
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    cv_url = f"/api/uploads/{filename}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"cv_url": cv_url}})
    return {"cv_url": cv_url, "filename": file.filename}

@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    from fastapi.responses import FileResponse
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    return FileResponse(filepath)


# ─── Offers Routes ───
@api_router.post("/offers")
async def create_offer(data: OfferCreate, user=Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs")
    offer_id = str(uuid.uuid4())
    offer = {
        "id": offer_id,
        **data.model_dump(),
        "recruiter_id": user["id"],
        "company_name": user.get("company_name", ""),
        "company_logo": user.get("company_logo", ""),
        "is_active": True,
        "applicant_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.offers.insert_one(offer)
    offer.pop("_id", None)
    return offer

@api_router.get("/offers")
async def list_offers(
    domain: Optional[str] = None,
    location: Optional[str] = None,
    type: Optional[str] = None,
    search: Optional[str] = None
):
    query = {"is_active": True}
    if domain and domain != "all":
        query["domain"] = domain
    if location and location != "all":
        query["location"] = {"$regex": location, "$options": "i"}
    if type and type != "all":
        query["type"] = type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}}
        ]
    offers = await db.offers.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return offers

@api_router.get("/offers/mine")
async def my_offers(user=Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs")
    offers = await db.offers.find({"recruiter_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return offers

@api_router.get("/offers/{offer_id}")
async def get_offer(offer_id: str):
    offer = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    return offer

@api_router.put("/offers/{offer_id}")
async def update_offer(offer_id: str, data: OfferUpdate, user=Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer or offer["recruiter_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.offers.update_one({"id": offer_id}, {"$set": update_data})
    updated = await db.offers.find_one({"id": offer_id}, {"_id": 0})
    return updated

@api_router.delete("/offers/{offer_id}")
async def delete_offer(offer_id: str, user=Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer or offer["recruiter_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    await db.offers.delete_one({"id": offer_id})
    return {"message": "Offre supprimée"}


# ─── Applications Routes ───
@api_router.post("/applications")
async def create_application(data: ApplicationCreate, user=Depends(get_current_user)):
    if user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Réservé aux candidats")
    existing = await db.applications.find_one({"offer_id": data.offer_id, "candidate_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà postulé à cette offre")
    offer = await db.offers.find_one({"id": data.offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    app_id = str(uuid.uuid4())
    application = {
        "id": app_id,
        "offer_id": data.offer_id,
        "candidate_id": user["id"],
        "candidate_name": user["full_name"],
        "candidate_email": user["email"],
        "cover_letter": data.cover_letter or "",
        "status": "envoyee",
        "offer_title": offer.get("title", ""),
        "company_name": offer.get("company_name", ""),
        "recruiter_id": offer.get("recruiter_id", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.applications.insert_one(application)
    await db.offers.update_one({"id": data.offer_id}, {"$inc": {"applicant_count": 1}})
    application.pop("_id", None)
    return application

@api_router.get("/applications")
async def list_applications(user=Depends(get_current_user)):
    if user["role"] == "candidate":
        apps = await db.applications.find({"candidate_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        apps = await db.applications.find({"recruiter_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return apps

@api_router.get("/applications/offer/{offer_id}")
async def list_offer_applications(offer_id: str, user=Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs")
    apps = await db.applications.find({"offer_id": offer_id, "recruiter_id": user["id"]}, {"_id": 0}).to_list(100)
    # Enrich with candidate profiles
    for a in apps:
        candidate = await db.users.find_one({"id": a["candidate_id"]}, {"_id": 0, "password": 0})
        if candidate:
            a["candidate_profile"] = candidate
    return apps

@api_router.put("/applications/{app_id}/status")
async def update_application_status(app_id: str, data: ApplicationStatusUpdate, user=Depends(get_current_user)):
    application = await db.applications.find_one({"id": app_id})
    if not application:
        raise HTTPException(status_code=404, detail="Candidature non trouvée")
    if user["role"] == "recruiter" and application["recruiter_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    await db.applications.update_one({"id": app_id}, {"$set": {"status": data.status}})
    updated = await db.applications.find_one({"id": app_id}, {"_id": 0})
    return updated


# ─── Conversations & Messages ───
@api_router.get("/conversations")
async def list_conversations(user=Depends(get_current_user)):
    convos = await db.conversations.find(
        {"participants": user["id"]}, {"_id": 0}
    ).sort("updated_at", -1).to_list(50)
    # Enrich with other participant info
    for c in convos:
        other_id = [p for p in c["participants"] if p != user["id"]]
        if other_id:
            other = await db.users.find_one({"id": other_id[0]}, {"_id": 0, "password": 0})
            if other:
                c["other_user"] = {"id": other["id"], "full_name": other["full_name"], "photo_url": other.get("photo_url", ""), "role": other["role"], "company_name": other.get("company_name", "")}
    return convos

@api_router.post("/messages")
async def send_message(data: MessageCreate, user=Depends(get_current_user)):
    convo_id = data.conversation_id
    if not convo_id:
        existing = await db.conversations.find_one({
            "participants": {"$all": [user["id"], data.recipient_id]}
        })
        if existing:
            convo_id = existing["id"]
        else:
            convo_id = str(uuid.uuid4())
            await db.conversations.insert_one({
                "id": convo_id,
                "participants": [user["id"], data.recipient_id],
                "last_message": data.content,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
    msg_id = str(uuid.uuid4())
    message = {
        "id": msg_id,
        "conversation_id": convo_id,
        "sender_id": user["id"],
        "sender_name": user["full_name"],
        "content": data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message)
    await db.conversations.update_one(
        {"id": convo_id},
        {"$set": {"last_message": data.content, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    message.pop("_id", None)
    # Notify via WebSocket
    if data.recipient_id in connected_clients:
        try:
            await connected_clients[data.recipient_id].send_json({"type": "new_message", "message": message})
        except Exception:
            pass
    return {"message": message, "conversation_id": convo_id}

@api_router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: str, user=Depends(get_current_user)):
    convo = await db.conversations.find_one({"id": conversation_id})
    if not convo or user["id"] not in convo.get("participants", []):
        raise HTTPException(status_code=403, detail="Non autorisé")
    messages = await db.messages.find(
        {"conversation_id": conversation_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return messages


# ─── Interviews ───
@api_router.post("/interviews")
async def create_interview(data: InterviewCreate, user=Depends(get_current_user)):
    if user["role"] != "recruiter":
        raise HTTPException(status_code=403, detail="Réservé aux recruteurs")
    interview_id = str(uuid.uuid4())
    interview = {
        "id": interview_id,
        "application_id": data.application_id,
        "candidate_id": data.candidate_id,
        "recruiter_id": user["id"],
        "date": data.date,
        "time": data.time,
        "location": data.location or "",
        "notes": data.notes or "",
        "type": data.type or "visio",
        "status": "planifie",
        "feedback": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.interviews.insert_one(interview)
    await db.applications.update_one({"id": data.application_id}, {"$set": {"status": "entretien"}})
    interview.pop("_id", None)
    return interview

@api_router.get("/interviews")
async def list_interviews(user=Depends(get_current_user)):
    if user["role"] == "candidate":
        interviews = await db.interviews.find({"candidate_id": user["id"]}, {"_id": 0}).sort("date", 1).to_list(50)
    else:
        interviews = await db.interviews.find({"recruiter_id": user["id"]}, {"_id": 0}).sort("date", 1).to_list(50)
    # Enrich
    for i in interviews:
        app = await db.applications.find_one({"id": i["application_id"]}, {"_id": 0})
        if app:
            i["offer_title"] = app.get("offer_title", "")
            i["company_name"] = app.get("company_name", "")
            i["candidate_name"] = app.get("candidate_name", "")
    return interviews

@api_router.put("/interviews/{interview_id}")
async def update_interview(interview_id: str, data: dict, user=Depends(get_current_user)):
    interview = await db.interviews.find_one({"id": interview_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Entretien non trouvé")
    allowed = ["date", "time", "location", "notes", "type", "status", "feedback"]
    update_data = {k: v for k, v in data.items() if k in allowed}
    if update_data:
        await db.interviews.update_one({"id": interview_id}, {"$set": update_data})
    updated = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    return updated


# ─── Recommendations ───
@api_router.get("/recommendations")
async def get_recommendations(user=Depends(get_current_user)):
    if user["role"] != "candidate":
        return []
    skills = user.get("skills", [])
    if not skills:
        offers = await db.offers.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(6)
        return offers
    regex_patterns = [{"title": {"$regex": s, "$options": "i"}} for s in skills]
    regex_patterns += [{"description": {"$regex": s, "$options": "i"}} for s in skills]
    regex_patterns += [{"domain": {"$regex": s, "$options": "i"}} for s in skills]
    offers = await db.offers.find(
        {"is_active": True, "$or": regex_patterns}, {"_id": 0}
    ).sort("created_at", -1).to_list(6)
    if len(offers) < 3:
        extra = await db.offers.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).to_list(6)
        seen = {o["id"] for o in offers}
        for e in extra:
            if e["id"] not in seen:
                offers.append(e)
            if len(offers) >= 6:
                break
    return offers


# ─── Stats ───
@api_router.get("/stats")
async def get_stats(user=Depends(get_current_user)):
    if user["role"] == "candidate":
        total_apps = await db.applications.count_documents({"candidate_id": user["id"]})
        pending = await db.applications.count_documents({"candidate_id": user["id"], "status": "envoyee"})
        interviews = await db.applications.count_documents({"candidate_id": user["id"], "status": "entretien"})
        accepted = await db.applications.count_documents({"candidate_id": user["id"], "status": "acceptee"})
        return {"total_applications": total_apps, "pending": pending, "interviews": interviews, "accepted": accepted}
    else:
        total_offers = await db.offers.count_documents({"recruiter_id": user["id"]})
        total_apps = await db.applications.count_documents({"recruiter_id": user["id"]})
        interviews = await db.interviews.count_documents({"recruiter_id": user["id"]})
        active_offers = await db.offers.count_documents({"recruiter_id": user["id"], "is_active": True})
        return {"total_offers": total_offers, "total_applications": total_apps, "interviews": interviews, "active_offers": active_offers}


# ─── Seed Data ───
@api_router.post("/seed")
async def seed_data():
    # Clear existing
    await db.users.delete_many({})
    await db.offers.delete_many({})
    await db.applications.delete_many({})
    await db.conversations.delete_many({})
    await db.messages.delete_many({})
    await db.interviews.delete_many({})

    # Create demo candidates
    candidates = [
        {"id": "c1", "email": "marie@demo.com", "password": pwd_context.hash("demo123"), "full_name": "Marie Dupont", "role": "candidate",
         "bio": "Étudiante en informatique passionnée par le développement web et l'IA", "photo_url": "", "skills": ["React", "Python", "Machine Learning", "Node.js"],
         "education": [{"school": "Université Paris-Saclay", "degree": "Master Informatique", "year": "2024-2026"}],
         "experience": [{"company": "StartupTech", "role": "Stagiaire Développeuse", "period": "2024", "description": "Développement d'une application React"}],
         "location": "Paris", "phone": "06 12 34 56 78", "cv_url": "", "company_name": "", "company_description": "", "company_logo": "", "company_sector": "", "company_size": "", "company_website": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "c2", "email": "lucas@demo.com", "password": pwd_context.hash("demo123"), "full_name": "Lucas Martin", "role": "candidate",
         "bio": "Diplômé en finance, à la recherche d'un stage en analyse financière", "photo_url": "", "skills": ["Excel", "Python", "SQL", "Finance", "Analyse de données"],
         "education": [{"school": "HEC Paris", "degree": "Master Finance", "year": "2023-2025"}],
         "experience": [{"company": "BNP Paribas", "role": "Assistant Analyste", "period": "2024", "description": "Analyse de portefeuilles clients"}],
         "location": "Lyon", "phone": "06 98 76 54 32", "cv_url": "", "company_name": "", "company_description": "", "company_logo": "", "company_sector": "", "company_size": "", "company_website": "", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "c3", "email": "sophie@demo.com", "password": pwd_context.hash("demo123"), "full_name": "Sophie Bernard", "role": "candidate",
         "bio": "Passionnée par le marketing digital et la communication", "photo_url": "", "skills": ["Marketing Digital", "SEO", "Google Ads", "Réseaux sociaux", "Canva"],
         "education": [{"school": "ESSEC", "degree": "Master Marketing", "year": "2024-2026"}],
         "experience": [{"company": "Agence Digitale XYZ", "role": "Stagiaire Marketing", "period": "2024", "description": "Gestion des campagnes publicitaires"}],
         "location": "Bordeaux", "phone": "06 55 44 33 22", "cv_url": "", "company_name": "", "company_description": "", "company_logo": "", "company_sector": "", "company_size": "", "company_website": "", "created_at": datetime.now(timezone.utc).isoformat()},
    ]

    # Create demo recruiters
    recruiters = [
        {"id": "r1", "email": "recruteur@techcorp.com", "password": pwd_context.hash("demo123"), "full_name": "Jean Leclerc", "role": "recruiter",
         "bio": "", "photo_url": "", "skills": [], "education": [], "experience": [], "location": "Paris", "phone": "01 23 45 67 89", "cv_url": "",
         "company_name": "TechCorp France", "company_description": "Entreprise leader dans le développement de solutions SaaS innovantes", "company_logo": "", "company_sector": "Technologie", "company_size": "200-500", "company_website": "https://techcorp.fr", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "r2", "email": "rh@financeplus.com", "password": pwd_context.hash("demo123"), "full_name": "Claire Moreau", "role": "recruiter",
         "bio": "", "photo_url": "", "skills": [], "education": [], "experience": [], "location": "Lyon", "phone": "04 56 78 90 12", "cv_url": "",
         "company_name": "FinancePlus", "company_description": "Cabinet de conseil en gestion financière et investissement", "company_logo": "", "company_sector": "Finance", "company_size": "50-200", "company_website": "https://financeplus.fr", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "r3", "email": "talent@santeinno.com", "password": pwd_context.hash("demo123"), "full_name": "Pierre Duval", "role": "recruiter",
         "bio": "", "photo_url": "", "skills": [], "education": [], "experience": [], "location": "Toulouse", "phone": "05 34 56 78 90", "cv_url": "",
         "company_name": "SantéInno", "company_description": "Start-up spécialisée dans la santé numérique et les dispositifs médicaux connectés", "company_logo": "", "company_sector": "Santé", "company_size": "10-50", "company_website": "https://santeinno.fr", "created_at": datetime.now(timezone.utc).isoformat()},
    ]

    for u in candidates + recruiters:
        await db.users.insert_one(u)

    # Create demo offers
    offers = [
        {"id": "o1", "title": "Développeur Full-Stack React/Node.js", "type": "stage", "description": "Rejoignez notre équipe technique pour développer des applications web modernes. Vous travaillerez sur notre plateforme SaaS principale avec React, Node.js et MongoDB.", "requirements": ["React", "Node.js", "MongoDB", "Git"], "location": "Paris", "duration": "6 mois", "domain": "Technologie", "contract_type": "Stage", "deadline": "2026-04-30", "salary": "1200€/mois", "recruiter_id": "r1", "company_name": "TechCorp France", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "o2", "title": "Data Scientist Junior", "type": "emploi", "description": "Nous recherchons un Data Scientist pour analyser nos données clients et créer des modèles prédictifs. Environnement Python/TensorFlow.", "requirements": ["Python", "Machine Learning", "TensorFlow", "SQL"], "location": "Paris", "duration": "CDI", "domain": "Technologie", "contract_type": "CDI", "deadline": "2026-05-15", "salary": "38-42k€/an", "recruiter_id": "r1", "company_name": "TechCorp France", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "o3", "title": "Analyste Financier Junior", "type": "stage", "description": "Stage en analyse financière au sein de notre département investissement. Modélisation financière et analyse de marché.", "requirements": ["Excel", "Finance", "Analyse de données", "VBA"], "location": "Lyon", "duration": "6 mois", "domain": "Finance", "contract_type": "Stage", "deadline": "2026-03-31", "salary": "1000€/mois", "recruiter_id": "r2", "company_name": "FinancePlus", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "o4", "title": "Consultant en Gestion de Patrimoine", "type": "emploi", "description": "Accompagnez nos clients dans la gestion de leur patrimoine financier. Poste avec formation complète.", "requirements": ["Finance", "Relation client", "Droit fiscal", "Excel"], "location": "Lyon", "duration": "CDI", "domain": "Finance", "contract_type": "CDI", "deadline": "2026-04-15", "salary": "35-40k€/an", "recruiter_id": "r2", "company_name": "FinancePlus", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "o5", "title": "Chef de Projet Santé Numérique", "type": "emploi", "description": "Pilotez le développement de nos solutions de santé connectée. Coordination entre les équipes techniques et médicales.", "requirements": ["Gestion de projet", "Santé", "Agile", "Communication"], "location": "Toulouse", "duration": "CDI", "domain": "Santé", "contract_type": "CDI", "deadline": "2026-05-01", "salary": "40-45k€/an", "recruiter_id": "r3", "company_name": "SantéInno", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "o6", "title": "Stagiaire Marketing Digital", "type": "stage", "description": "Participez à la stratégie marketing digitale de notre start-up santé. Création de contenu, SEO et gestion des réseaux sociaux.", "requirements": ["Marketing Digital", "SEO", "Réseaux sociaux", "Créativité"], "location": "Toulouse", "duration": "4 mois", "domain": "Marketing", "contract_type": "Stage", "deadline": "2026-04-20", "salary": "800€/mois", "recruiter_id": "r3", "company_name": "SantéInno", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "o7", "title": "Ingénieur DevOps", "type": "emploi", "description": "Mettez en place et maintenez notre infrastructure cloud. Automatisation CI/CD, Docker, Kubernetes.", "requirements": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux"], "location": "Paris", "duration": "CDI", "domain": "Technologie", "contract_type": "CDI", "deadline": "2026-05-30", "salary": "45-55k€/an", "recruiter_id": "r1", "company_name": "TechCorp France", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "o8", "title": "UX/UI Designer", "type": "stage", "description": "Concevez des interfaces utilisateur élégantes et intuitives pour nos applications mobiles et web.", "requirements": ["Figma", "Design System", "Prototypage", "User Research"], "location": "Bordeaux", "duration": "6 mois", "domain": "Design", "contract_type": "Stage", "deadline": "2026-04-10", "salary": "1100€/mois", "recruiter_id": "r1", "company_name": "TechCorp France", "company_logo": "", "is_active": True, "applicant_count": 0, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    for o in offers:
        await db.offers.insert_one(o)

    # Create demo applications
    applications = [
        {"id": "a1", "offer_id": "o1", "candidate_id": "c1", "candidate_name": "Marie Dupont", "candidate_email": "marie@demo.com", "cover_letter": "Passionnée par le développement web, je serais ravie de rejoindre votre équipe.", "status": "en_cours", "offer_title": "Développeur Full-Stack React/Node.js", "company_name": "TechCorp France", "recruiter_id": "r1", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "a2", "offer_id": "o3", "candidate_id": "c2", "candidate_name": "Lucas Martin", "candidate_email": "lucas@demo.com", "cover_letter": "Mon expérience en analyse financière correspond parfaitement à ce poste.", "status": "entretien", "offer_title": "Analyste Financier Junior", "company_name": "FinancePlus", "recruiter_id": "r2", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": "a3", "offer_id": "o6", "candidate_id": "c3", "candidate_name": "Sophie Bernard", "candidate_email": "sophie@demo.com", "cover_letter": "Le marketing digital est ma passion, et votre mission santé me motive énormément.", "status": "envoyee", "offer_title": "Stagiaire Marketing Digital", "company_name": "SantéInno", "recruiter_id": "r3", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    for a in applications:
        await db.applications.insert_one(a)

    await db.offers.update_one({"id": "o1"}, {"$set": {"applicant_count": 1}})
    await db.offers.update_one({"id": "o3"}, {"$set": {"applicant_count": 1}})
    await db.offers.update_one({"id": "o6"}, {"$set": {"applicant_count": 1}})

    # Create demo conversation
    await db.conversations.insert_one({
        "id": "conv1", "participants": ["c1", "r1"],
        "last_message": "Merci pour votre candidature, nous reviendrons vers vous rapidement.",
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    await db.messages.insert_one({
        "id": "m1", "conversation_id": "conv1", "sender_id": "c1", "sender_name": "Marie Dupont",
        "content": "Bonjour, je suis très intéressée par le poste de développeur full-stack.",
        "created_at": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    })
    await db.messages.insert_one({
        "id": "m2", "conversation_id": "conv1", "sender_id": "r1", "sender_name": "Jean Leclerc",
        "content": "Merci pour votre candidature, nous reviendrons vers vous rapidement.",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"message": "Données de démonstration créées avec succès", "candidates": 3, "recruiters": 3, "offers": 8, "applications": 3}


# ─── WebSocket ───
connected_clients: Dict[str, WebSocket] = {}

@app.websocket("/api/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    connected_clients[user_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        connected_clients.pop(user_id, None)
    except Exception:
        connected_clients.pop(user_id, None)


# ─── App Setup ───
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
