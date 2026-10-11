from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import io
import jwt
import requests
from datetime import datetime, timezone, timedelta
from PIL import Image

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Auth config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ADMIN_USERNAME = os.environ['ADMIN_USERNAME']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

# Object storage config
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "rapat-kaltim")

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "pdf": "application/pdf",
}

storage_key = None

def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

def compress_image(data: bytes) -> bytes:
    """Compress image to low quality JPEG, max 1600px, still readable."""
    img = Image.open(io.BytesIO(data))
    if img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    max_dim = 1600
    if max(img.size) > max_dim:
        ratio = max_dim / max(img.size)
        img = img.resize((int(img.size[0] * ratio), int(img.size[1] * ratio)))
    out = io.BytesIO()
    img.save(out, format="JPEG", quality=40, optimize=True)
    return out.getvalue()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Models ----------------
class LoginInput(BaseModel):
    username: str
    password: str

class SuratFile(BaseModel):
    id: str
    storage_path: str
    original_filename: str
    content_type: str

class ScheduleInput(BaseModel):
    tanggal: str
    ruangan: str
    jam_mulai: str
    jam_selesai: str
    pengguna: str
    kegiatan: str
    zoom: bool = False
    susunan: Optional[str] = None
    nama_peminjam: str = ""
    no_wa: str = ""
    petugas_pencatat: str = ""
    surat_files: List[SuratFile] = []

class Schedule(ScheduleInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Settings(BaseModel):
    footer1: str
    footer2: str
    rooms: List[str]
    petugas: List[str]
    login_bg_path: Optional[str] = None
    login_bg_darkness: int = 40
    favicon_path: Optional[str] = None

# ---------------- Auth ----------------
def create_token(username: str) -> str:
    payload = {"sub": username, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def require_auth(request: Request):
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if not token:
        raise HTTPException(status_code=401, detail="Tidak terautentikasi")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesi berakhir, silakan login kembali")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid")

@api_router.post("/auth/login")
async def login(data: LoginInput):
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        return {"token": create_token(data.username), "username": data.username}
    raise HTTPException(status_code=401, detail="Username atau password salah")

@api_router.get("/auth/me")
async def me(user: str = Depends(require_auth)):
    return {"username": user}

# ---------------- Settings ----------------
DEFAULT_SETTINGS = {
    "footer1": "SELAMAT DATANG DI KANTOR GUBERNUR KALIMANTAN TIMUR, KALTIM SUKSES MENUJU GENERASI EMAS",
    "footer2": "Mohon dapat menghubungi petugas terlebih dahulu untuk memastikan kesiapan perangkat Sound System sebelum pelaksanaan kegiatan. Hadi: 0823-5305-7536 atau Rifqi: 0822-5255-2136",
    "rooms": [
        "Olah Bebaya", "Odah Etam", "Halaman Kantor", "Ruang Rapat Gub", "Ruang Rapat Wagub",
        "Ruang Rapat Sekda", "Ruhui Rahayu", "Pandurata", "Tepian 1", "Tepian 2",
        "Heart Of Borneo", "Daya Taka", "Tenguyun", "Batiwakal", "Tuah Himba",
    ],
    "petugas": ["Susi", "Nurul", "Bella", "Anhar", "Adit", "Faris", "Ali"],
    "login_bg_path": None,
    "login_bg_darkness": 40,
    "favicon_path": None,
}

async def get_settings_doc():
    doc = await db.settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not doc:
        doc = {"id": "app_settings", **DEFAULT_SETTINGS}
        await db.settings.insert_one(dict(doc))
    doc.pop("_id", None)
    merged = {**DEFAULT_SETTINGS, **{k: v for k, v in doc.items() if k != "id"}}
    return merged

@api_router.get("/settings")
async def read_settings():
    return await get_settings_doc()

@api_router.put("/settings")
async def update_settings(data: Settings, user: str = Depends(require_auth)):
    await db.settings.update_one(
        {"id": "app_settings"}, {"$set": data.model_dump()}, upsert=True
    )
    return await get_settings_doc()

# ---------------- Files ----------------
@api_router.post("/upload")
async def upload(file: UploadFile = File(...), user: str = Depends(require_auth)):
    ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin").lower()
    if ext not in MIME_TYPES:
        raise HTTPException(status_code=400, detail="Format tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.")
    data = await file.read()
    if ext == "pdf":
        content_type = "application/pdf"
        store_ext = "pdf"
    else:
        data = compress_image(data)
        content_type = "image/jpeg"
        store_ext = "jpg"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/surat/{file_id}.{store_ext}"
    result = put_object(path, data, content_type)
    record = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.files.insert_one(dict(record))
    return {"id": file_id, "storage_path": result["path"], "original_filename": file.filename, "content_type": content_type}

@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    data, content_type = get_object(path)
    return Response(content=data, media_type=(record or {}).get("content_type", content_type))

# ---------------- Schedules ----------------
def times_overlap(s1, e1, s2, e2):
    return s1 < e2 and s2 < e1

async def check_conflict(tanggal, ruangan, jam_mulai, jam_selesai, exclude_id=None):
    cursor = db.schedules.find({"tanggal": tanggal, "ruangan": ruangan}, {"_id": 0})
    async for doc in cursor:
        if exclude_id and doc["id"] == exclude_id:
            continue
        if times_overlap(jam_mulai, jam_selesai, doc["jam_mulai"], doc["jam_selesai"]):
            return doc
    return None

def strip_public(doc):
    d = dict(doc)
    d.pop("no_wa", None)
    return d

@api_router.get("/schedules")
async def list_schedules(public: bool = False):
    docs = await db.schedules.find({}, {"_id": 0}).to_list(2000)
    docs.sort(key=lambda d: (d["tanggal"], d["jam_mulai"]))
    if public:
        docs = [strip_public(d) for d in docs]
    return docs

@api_router.post("/schedules")
async def create_schedule(data: ScheduleInput, user: str = Depends(require_auth)):
    if data.jam_selesai <= data.jam_mulai:
        raise HTTPException(status_code=400, detail="Jam selesai harus setelah jam mulai")
    conflict = await check_conflict(data.tanggal, data.ruangan, data.jam_mulai, data.jam_selesai)
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Bentrok jadwal! Ruangan {data.ruangan} sudah dipakai {conflict['jam_mulai']}-{conflict['jam_selesai']} ({conflict['kegiatan']})",
        )
    obj = Schedule(**data.model_dump())
    await db.schedules.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.put("/schedules/{schedule_id}")
async def update_schedule(schedule_id: str, data: ScheduleInput, user: str = Depends(require_auth)):
    existing = await db.schedules.find_one({"id": schedule_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    if data.jam_selesai <= data.jam_mulai:
        raise HTTPException(status_code=400, detail="Jam selesai harus setelah jam mulai")
    conflict = await check_conflict(data.tanggal, data.ruangan, data.jam_mulai, data.jam_selesai, exclude_id=schedule_id)
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Bentrok jadwal! Ruangan {data.ruangan} sudah dipakai {conflict['jam_mulai']}-{conflict['jam_selesai']} ({conflict['kegiatan']})",
        )
    await db.schedules.update_one({"id": schedule_id}, {"$set": data.model_dump()})
    updated = await db.schedules.find_one({"id": schedule_id}, {"_id": 0})
    return updated

@api_router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: str, user: str = Depends(require_auth)):
    result = await db.schedules.delete_one({"id": schedule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    return {"status": "deleted"}

@api_router.get("/")
async def root():
    return {"message": "Sistem Penjadwalan Ruang Rapat Kaltim"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    await get_settings_doc()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
