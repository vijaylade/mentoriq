from datetime import datetime, timedelta, timezone
import logging
import os
from pathlib import Path
from time import perf_counter
import random
import secrets
import uuid

import bcrypt
import jwt
import razorpay
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, selectinload
from starlette.middleware.cors import CORSMiddleware

from database import Base, SessionLocal, engine, get_db
from models_sql import (
    Blog,
    BlogTag,
    Course,
    CourseDriveVideo,
    CourseSyllabusItem,
    Enrollment,
    LiveClass,
    PasswordResetToken,
    PaymentTransaction,
    Testimonial,
    User,
    Video,
)


STOCK_COURSE_IMAGES = [f"/api/uploads/course_stock_{i}.jpg" for i in range(1, 11)]

ROOT_DIR = Path(__file__).parent
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / ".env")

app = FastAPI()
api_router = APIRouter(prefix="/api")

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "false").strip().lower() == "true"
COOKIE_SAMESITE = os.environ.get("COOKIE_SAMESITE", "lax").strip().lower()
ENABLE_SCHEMA_SYNC = os.environ.get("ENABLE_SCHEMA_SYNC", "true").strip().lower() == "true"
ENABLE_STARTUP_SEED = os.environ.get("ENABLE_STARTUP_SEED", "false").strip().lower() == "true"
PERF_LOG_SLOW_MS = int(os.environ.get("PERF_LOG_SLOW_MS", "400"))

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

razorpay_client = razorpay.Client(
    auth=(os.environ.get("RAZORPAY_KEY_ID"), os.environ.get("RAZORPAY_KEY_SECRET"))
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": utcnow() + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": utcnow() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=900,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=604800,
        path="/",
    )


def set_access_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=900,
        path="/",
    )


def normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def build_pricing(course: Course) -> dict:
    pricing: dict[str, float] = {}
    if course.live_price is not None:
        pricing["live"] = float(course.live_price)
    if course.recorded_price is not None:
        pricing["recorded"] = float(course.recorded_price)
    return pricing


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "created_at": normalize_datetime(user.created_at),
    }


def serialize_course(course: Course, include_video_fields: bool = True) -> dict:
    payload = {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "category": course.category,
        "pricing": build_pricing(course),
        "syllabus": [item.content for item in sorted(course.syllabus_items, key=lambda item: item.position)],
        "instructor": course.instructor,
        "thumbnail": course.thumbnail,
        "duration": course.duration,
        "course_type": course.course_type or ("live" if course.live_price else "recorded"),
        "youtube_playlist": course.youtube_playlist,
        "drive_videos": [
            {"title": item.title or "", "drive_file_id": item.drive_file_id}
            for item in sorted(course.drive_videos, key=lambda item: item.position)
        ],
        "created_at": normalize_datetime(course.created_at),
    }
    if not include_video_fields:
        payload.pop("youtube_playlist", None)
        payload.pop("drive_videos", None)
    return payload


def serialize_live_class(live_class: LiveClass) -> dict:
    return {
        "id": live_class.id,
        "course_id": live_class.course_id,
        "title": live_class.title,
        "scheduled_at": normalize_datetime(live_class.scheduled_at),
        "zoom_link": live_class.zoom_link,
        "duration": live_class.duration,
        "description": live_class.description,
        "created_at": normalize_datetime(live_class.created_at),
    }


def serialize_video(video: Video) -> dict:
    return {
        "id": video.id,
        "course_id": video.course_id,
        "title": video.title,
        "youtube_url": video.youtube_url,
        "duration": video.duration,
        "order": video.order,
        "description": video.description,
        "created_at": normalize_datetime(video.created_at),
    }


def serialize_enrollment(enrollment: Enrollment) -> dict:
    return {
        "id": enrollment.id,
        "user_id": enrollment.user_id,
        "student_id": enrollment.student_id,
        "course_id": enrollment.course_id,
        "enrollment_type": enrollment.enrollment_type,
        "payment_status": enrollment.payment_status,
        "is_subscription": enrollment.is_subscription,
        "subscription_active": enrollment.subscription_active,
        "manually_enrolled": enrollment.manually_enrolled,
        "enrolled_at": normalize_datetime(enrollment.enrolled_at),
        "next_payment_due": normalize_datetime(enrollment.next_payment_due),
    }


def serialize_transaction(transaction: PaymentTransaction) -> dict:
    return {
        "order_id": transaction.order_id,
        "payment_id": transaction.payment_id,
        "user_id": transaction.user_id,
        "course_id": transaction.course_id,
        "enrollment_type": transaction.enrollment_type,
        "amount": float(transaction.amount),
        "currency": transaction.currency,
        "payment_status": transaction.payment_status,
        "is_subscription": transaction.is_subscription,
        "created_at": normalize_datetime(transaction.created_at),
        "updated_at": normalize_datetime(transaction.updated_at),
    }


def serialize_testimonial(testimonial: Testimonial) -> dict:
    return {
        "id": testimonial.id,
        "name": testimonial.name,
        "role": testimonial.role,
        "content": testimonial.content,
        "image_url": testimonial.image_url,
        "rating": testimonial.rating,
    }


def serialize_blog(blog: Blog) -> dict:
    return {
        "id": blog.id,
        "title": blog.title,
        "category": blog.category,
        "excerpt": blog.excerpt,
        "tags": [item.tag for item in sorted(blog.tags, key=lambda item: item.position)],
        "read_time": blog.read_time,
        "pdf_filename": blog.pdf_filename,
        "read_more_link": blog.read_more_link or "",
        "created_at": normalize_datetime(blog.created_at),
    }


def log_duration(label: str, started_at: float) -> None:
    elapsed_ms = (perf_counter() - started_at) * 1000
    level = logging.WARNING if elapsed_ms >= PERF_LOG_SLOW_MS else logging.INFO
    logger.log(level, "%s took %.1f ms", label, elapsed_ms)


def upsert_course_children(db: Session, course: Course, syllabus: list[str], drive_videos: list[dict] | None) -> None:
    db.query(CourseSyllabusItem).filter(CourseSyllabusItem.course_id == course.id).delete()
    for index, entry in enumerate(syllabus, start=1):
        db.add(CourseSyllabusItem(course_id=course.id, position=index, content=entry))

    db.query(CourseDriveVideo).filter(CourseDriveVideo.course_id == course.id).delete()
    for index, entry in enumerate(drive_videos or [], start=1):
        db.add(
            CourseDriveVideo(
                course_id=course.id,
                position=index,
                title=entry.get("title"),
                drive_file_id=entry.get("drive_file_id"),
            )
        )


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = db.get(User, payload["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return serialize_user(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    email: str
    name: str
    role: str
    created_at: datetime


class CourseCreate(BaseModel):
    title: str
    description: str
    category: str
    pricing: dict[str, float]
    syllabus: list[str]
    instructor: str
    thumbnail: str | None = None
    duration: str | None = None
    course_type: str | None = None
    youtube_playlist: str | None = None
    drive_videos: list[dict[str, str]] | None = None


class CourseResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    title: str
    description: str
    category: str
    pricing: dict[str, float]
    syllabus: list[str]
    instructor: str
    thumbnail: str
    duration: str | None = None
    course_type: str | None = None
    youtube_playlist: str | None = None
    drive_videos: list[dict[str, str]] | None = None
    created_at: datetime


class LiveClassCreate(BaseModel):
    course_id: str
    title: str
    scheduled_at: datetime
    zoom_link: str
    duration: int
    description: str | None = None


class LiveClassResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    course_id: str
    title: str
    scheduled_at: datetime
    zoom_link: str
    duration: int
    description: str | None = None
    created_at: datetime


class VideoCreate(BaseModel):
    course_id: str
    title: str
    youtube_url: str
    duration: int | None = None
    order: int
    description: str | None = None


class VideoResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    id: str
    course_id: str
    title: str
    youtube_url: str
    duration: int | None = None
    order: int
    description: str | None = None
    created_at: datetime


class EnrollmentCreate(BaseModel):
    course_id: str
    enrollment_type: str


class CheckoutRequest(BaseModel):
    course_id: str
    enrollment_type: str
    origin_url: str
    is_subscription: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class AdminCreateUser(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str


class AdminEnrollRequest(BaseModel):
    user_id: str
    course_id: str
    enrollment_type: str = "recorded"


@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response, db: Session = Depends(get_db)):
    email = user_data.email.lower()
    existing = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        role=user_data.role if user_data.role in ["student", "teacher"] else "student",
        created_at=utcnow(),
    )
    db.add(user)
    db.commit()

    access_token = create_access_token(user.id, email)
    refresh_token = create_refresh_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)
    return serialize_user(user)


@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    started_at = perf_counter()
    email = credentials.email.lower()
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.password_hash):
        log_duration(f"POST /api/auth/login ({email})", started_at)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(user.id, email)
    refresh_token = create_refresh_token(user.id)
    set_auth_cookies(response, access_token, refresh_token)
    log_duration(f"POST /api/auth/login ({email})", started_at)
    return serialize_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    started_at = perf_counter()
    log_duration("GET /api/auth/me", started_at)
    return current_user


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = db.get(User, payload["sub"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user.id, user.email)
        set_access_cookie(response, access_token)
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = req.email.lower()
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if not user:
        return {"message": "If email exists, reset link sent"}

    token = secrets.token_urlsafe(32)
    db.add(PasswordResetToken(token=token, user_id=user.id, expires_at=utcnow() + timedelta(hours=1), used=False))
    db.commit()

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    print(f"Password reset link: {frontend_url}/reset-password?token={token}")
    return {"message": "If email exists, reset link sent"}


@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_doc = db.execute(select(PasswordResetToken).where(PasswordResetToken.token == req.token)).scalar_one_or_none()
    if not token_doc or token_doc.used:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if utcnow() > normalize_datetime(token_doc.expires_at):
        raise HTTPException(status_code=400, detail="Token expired")

    user = db.get(User, token_doc.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.password_hash = hash_password(req.new_password)
    token_doc.used = True
    db.commit()
    return {"message": "Password reset successful"}


@api_router.get("/courses")
async def get_courses(db: Session = Depends(get_db)):
    started_at = perf_counter()
    courses = db.execute(
        select(Course).options(selectinload(Course.syllabus_items), selectinload(Course.drive_videos)).limit(100)
    ).scalars().all()
    log_duration("GET /api/courses", started_at)
    return [serialize_course(course, include_video_fields=False) for course in courses]


@api_router.get("/courses/{course_id}")
async def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.execute(
        select(Course)
        .options(selectinload(Course.syllabus_items), selectinload(Course.drive_videos))
        .where(Course.id == course_id)
    ).scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    payload = serialize_course(course, include_video_fields=False)
    payload["has_videos"] = bool(course.drive_videos) or bool(course.youtube_playlist and "list=" in course.youtube_playlist)
    return payload


@api_router.get("/courses/{course_id}/videos", dependencies=[Depends(get_current_user)])
async def get_course_videos(course_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    enrollment = db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            or_(Enrollment.user_id == current_user["id"], Enrollment.student_id == current_user["id"]),
        )
    ).scalar_one_or_none()
    if not enrollment and current_user.get("role") not in {"admin", "teacher"}:
        raise HTTPException(status_code=403, detail="Not enrolled")

    course = db.execute(
        select(Course).options(selectinload(Course.drive_videos)).where(Course.id == course_id)
    ).scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    result = [
        {
            "title": item.title or "",
            "embed_url": f"https://drive.google.com/file/d/{item.drive_file_id}/preview" if item.drive_file_id else None,
        }
        for item in sorted(course.drive_videos, key=lambda entry: entry.position)
    ]

    yt_embed = None
    if course.youtube_playlist and "list=" in course.youtube_playlist:
        list_id = course.youtube_playlist.split("list=")[1].split("&")[0]
        yt_embed = f"https://www.youtube.com/embed/?listType=playlist&list={list_id}"
    return {"drive_videos": result, "youtube_embed": yt_embed}


@api_router.post("/courses", dependencies=[Depends(get_current_user)])
async def create_course(course: CourseCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    course_row = Course(
        id=str(uuid.uuid4()),
        title=course.title,
        description=course.description,
        category=course.category,
        instructor=course.instructor,
        instructor_id=current_user["id"],
        thumbnail=course.thumbnail or random.choice(STOCK_COURSE_IMAGES),
        duration=course.duration,
        course_type=course.course_type,
        youtube_playlist=course.youtube_playlist,
        live_price=course.pricing.get("live"),
        recorded_price=course.pricing.get("recorded"),
        created_at=utcnow(),
    )
    db.add(course_row)
    db.flush()
    upsert_course_children(db, course_row, course.syllabus, course.drive_videos)
    db.commit()
    db.refresh(course_row)
    return serialize_course(course_row)


@api_router.put("/courses/{course_id}", dependencies=[Depends(get_current_user)])
async def update_course(course_id: str, course: CourseCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    course_row = db.execute(select(Course).where(Course.id == course_id)).scalar_one_or_none()
    if not course_row:
        raise HTTPException(status_code=404, detail="Course not found")

    course_row.title = course.title
    course_row.description = course.description
    course_row.category = course.category
    course_row.instructor = course.instructor
    course_row.thumbnail = course.thumbnail or course_row.thumbnail or random.choice(STOCK_COURSE_IMAGES)
    course_row.duration = course.duration
    course_row.course_type = course.course_type
    course_row.youtube_playlist = course.youtube_playlist
    course_row.live_price = course.pricing.get("live")
    course_row.recorded_price = course.pricing.get("recorded")
    upsert_course_children(db, course_row, course.syllabus, course.drive_videos)
    db.commit()
    return {"message": "Course updated"}


@api_router.delete("/courses/{course_id}", dependencies=[Depends(get_current_user)])
async def delete_course(course_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    course_row = db.execute(select(Course).where(Course.id == course_id)).scalar_one_or_none()
    if not course_row:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course_row)
    db.commit()
    return {"message": "Course deleted"}


@api_router.get("/live-classes")
async def get_live_classes(course_id: str | None = None, db: Session = Depends(get_db)):
    stmt = select(LiveClass)
    if course_id:
        stmt = stmt.where(LiveClass.course_id == course_id)
    classes = db.execute(stmt.limit(100)).scalars().all()
    return [serialize_live_class(entry) for entry in classes]


@api_router.post("/live-classes", dependencies=[Depends(get_current_user)])
async def create_live_class(live_class: LiveClassCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    class_row = LiveClass(
        id=str(uuid.uuid4()),
        course_id=live_class.course_id,
        title=live_class.title,
        scheduled_at=live_class.scheduled_at,
        zoom_link=live_class.zoom_link,
        duration=live_class.duration,
        description=live_class.description,
        created_at=utcnow(),
    )
    db.add(class_row)
    db.commit()
    return serialize_live_class(class_row)


@api_router.get("/videos")
async def get_videos(course_id: str | None = None, db: Session = Depends(get_db)):
    stmt = select(Video)
    if course_id:
        stmt = stmt.where(Video.course_id == course_id)
    videos = db.execute(stmt.order_by(Video.order).limit(100)).scalars().all()
    return [serialize_video(video) for video in videos]


@api_router.post("/videos", dependencies=[Depends(get_current_user)])
async def create_video(video: VideoCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    video_row = Video(
        id=str(uuid.uuid4()),
        course_id=video.course_id,
        title=video.title,
        youtube_url=video.youtube_url,
        duration=video.duration,
        order=video.order,
        description=video.description,
        created_at=utcnow(),
    )
    db.add(video_row)
    db.commit()
    return serialize_video(video_row)


@api_router.get("/enrollments", dependencies=[Depends(get_current_user)])
async def get_enrollments(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Enrollment).where(or_(Enrollment.user_id == current_user["id"], Enrollment.student_id == current_user["id"])).limit(100)
    ).scalars().all()
    return [serialize_enrollment(entry) for entry in rows]


@api_router.get("/enrollments/check/{course_id}", dependencies=[Depends(get_current_user)])
async def check_enrollment(course_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    enrollment = db.execute(
        select(Enrollment).where(
            Enrollment.course_id == course_id,
            or_(Enrollment.user_id == current_user["id"], Enrollment.student_id == current_user["id"]),
        )
    ).scalar_one_or_none()
    if enrollment:
        return {"enrolled": True, "subscription": bool(enrollment.is_subscription)}
    return {"enrolled": False, "subscription": False}


@api_router.get("/enrollments/my-courses", dependencies=[Depends(get_current_user)])
async def get_my_enrolled_course_ids(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Enrollment.course_id).where(
            or_(Enrollment.user_id == current_user["id"], Enrollment.student_id == current_user["id"])
        ).limit(100)
    ).all()
    return [row[0] for row in rows]


@api_router.post("/payments/create-order")
async def create_payment_order(req: CheckoutRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        course = db.execute(select(Course).where(Course.id == req.course_id)).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        effective_type = course.course_type or ("live" if course.live_price else "recorded")
        if effective_type == "live":
            amount = float(course.live_price or 0)
            enrollment_type = "live"
        else:
            amount = float(course.recorded_price or 0)
            enrollment_type = "recorded"

        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid course pricing")

        amount_paise = int(amount * 100)

        try:
            razorpay_order = razorpay_client.order.create(
                {
                    "amount": amount_paise,
                    "currency": "INR",
                    "payment_capture": 1,
                    "notes": {
                        "user_id": current_user["id"],
                        "course_id": req.course_id,
                        "enrollment_type": enrollment_type,
                        "is_subscription": req.is_subscription,
                    },
                }
            )
        except Exception as exc:
            logger.exception("Razorpay order creation failed")
            raise HTTPException(status_code=500, detail=f"Razorpay create-order failed: {str(exc)}")

        try:
            db.add(
                PaymentTransaction(
                    order_id=razorpay_order["id"],
                    user_id=current_user["id"],
                    course_id=req.course_id,
                    enrollment_type=enrollment_type,
                    amount=amount,
                    currency="INR",
                    payment_status="created",
                    is_subscription=req.is_subscription,
                    created_at=utcnow(),
                )
            )
            db.commit()
        except Exception as exc:
            db.rollback()
            logger.exception("PaymentTransaction insert failed")
            raise HTTPException(status_code=500, detail=f"PaymentTransaction insert failed: {str(exc)}")

        return {
            "order_id": razorpay_order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": os.environ.get("RAZORPAY_KEY_ID"),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected create-order error")
        raise HTTPException(status_code=500, detail=f"Unexpected create-order error: {str(exc)}")


@api_router.post("/payments/verify")
async def verify_payment(request: Request, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    body = await request.json()
    razorpay_order_id = body.get("razorpay_order_id")
    razorpay_payment_id = body.get("razorpay_payment_id")
    razorpay_signature = body.get("razorpay_signature")

    try:
        razorpay_client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid payment signature") from exc

    transaction = db.execute(
        select(PaymentTransaction).where(PaymentTransaction.order_id == razorpay_order_id)
    ).scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    transaction.payment_id = razorpay_payment_id
    transaction.payment_status = "paid"
    transaction.updated_at = utcnow()
    db.add(
        Enrollment(
            id=str(uuid.uuid4()),
            user_id=transaction.user_id,
            course_id=transaction.course_id,
            enrollment_type=transaction.enrollment_type,
            payment_status="paid",
            is_subscription=transaction.is_subscription,
            enrolled_at=utcnow(),
            next_payment_due=utcnow() + timedelta(days=30) if transaction.is_subscription else None,
        )
    )
    db.commit()
    return {"status": "success", "message": "Payment verified and enrollment created"}


@api_router.get("/admin/users", dependencies=[Depends(get_current_user)])
async def get_users(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.execute(select(User).limit(100)).scalars().all()
    return [serialize_user(user) for user in users]


@api_router.post("/admin/users", dependencies=[Depends(get_current_user)])
async def admin_create_user(user_data: AdminCreateUser, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    email = user_data.email.lower()
    if db.execute(select(User).where(User.email == email)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_data.role not in ["student", "teacher", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        role=user_data.role,
        created_at=utcnow(),
    )
    db.add(user)
    db.commit()
    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role}


@api_router.delete("/admin/users/{user_id}", dependencies=[Depends(get_current_user)])
async def admin_delete_user(user_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    paid_transactions = db.execute(
        select(func.count()).select_from(PaymentTransaction).where(PaymentTransaction.user_id == user_id)
    ).scalar_one()
    if paid_transactions:
        raise HTTPException(status_code=400, detail="Cannot delete a user with payment history")

    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete()
    db.query(Enrollment).filter(
        or_(Enrollment.user_id == user_id, Enrollment.student_id == user_id)
    ).delete(synchronize_session=False)
    db.query(Course).filter(Course.instructor_id == user_id).update(
        {Course.instructor_id: None},
        synchronize_session=False,
    )
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@api_router.post("/admin/enroll", dependencies=[Depends(get_current_user)])
async def admin_manual_enroll(data: AdminEnrollRequest, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.get(User, data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    course = db.get(Course, data.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.execute(
        select(Enrollment).where(
            Enrollment.course_id == data.course_id,
            or_(Enrollment.student_id == data.user_id, Enrollment.user_id == data.user_id),
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this course")

    db.add(
        Enrollment(
            id=str(uuid.uuid4()),
            student_id=data.user_id,
            course_id=data.course_id,
            enrollment_type=data.enrollment_type,
            payment_status="paid",
            subscription_active=True,
            enrolled_at=utcnow(),
            manually_enrolled=True,
        )
    )
    db.commit()
    return {"message": f"Successfully enrolled {user.name or user.email} in {course.title}"}


@api_router.get("/admin/enrollments", dependencies=[Depends(get_current_user)])
async def get_admin_enrollments(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    enrollments = db.execute(select(Enrollment).order_by(Enrollment.enrolled_at.desc()).limit(500)).scalars().all()
    results = []
    for enrollment in enrollments:
        payload = serialize_enrollment(enrollment)
        uid = enrollment.student_id or enrollment.user_id
        user = db.get(User, uid) if uid else None
        course = db.get(Course, enrollment.course_id)
        payload["student_name"] = user.name if user else "Deleted User" if uid else "Unknown"
        payload["student_email"] = user.email if user else ""
        payload["course_title"] = course.title if course else "Deleted Course"
        results.append(payload)
    return results


@api_router.get("/admin/purchases", dependencies=[Depends(get_current_user)])
async def get_purchases(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    transactions = db.execute(
        select(PaymentTransaction).where(PaymentTransaction.payment_status == "paid").order_by(PaymentTransaction.created_at.desc()).limit(500)
    ).scalars().all()
    results = []
    for transaction in transactions:
        payload = serialize_transaction(transaction)
        user = db.get(User, transaction.user_id)
        course = db.get(Course, transaction.course_id)
        payload["user_name"] = user.name if user else "Deleted User"
        payload["user_email"] = user.email if user else ""
        payload["course_title"] = course.title if course else "Deleted Course"
        results.append(payload)
    return results


@api_router.get("/admin/stats", dependencies=[Depends(get_current_user)])
async def get_stats(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    total_users = db.execute(select(func.count()).select_from(User)).scalar_one()
    total_courses = db.execute(select(func.count()).select_from(Course)).scalar_one()
    total_enrollments = db.execute(select(func.count()).select_from(Enrollment)).scalar_one()
    total_revenue = db.execute(
        select(func.coalesce(func.sum(PaymentTransaction.amount), 0)).where(PaymentTransaction.payment_status == "paid")
    ).scalar_one()
    return {
        "total_users": total_users,
        "total_courses": total_courses,
        "total_enrollments": total_enrollments,
        "total_revenue": float(total_revenue or 0),
    }


@api_router.get("/teacher/students", dependencies=[Depends(get_current_user)])
async def get_teacher_students(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized")
    course_ids = db.execute(select(Course.id).where(Course.instructor_id == current_user["id"])).all()
    ids = [row[0] for row in course_ids]
    if not ids:
        return []
    rows = db.execute(select(Enrollment).where(Enrollment.course_id.in_(ids)).limit(100)).scalars().all()
    return [serialize_enrollment(entry) for entry in rows]


@api_router.get("/testimonials")
async def get_testimonials(db: Session = Depends(get_db)):
    testimonials = db.execute(select(Testimonial).limit(100)).scalars().all()
    return [serialize_testimonial(entry) for entry in testimonials]


@api_router.post("/admin/testimonials", dependencies=[Depends(get_current_user)])
async def create_testimonial(testimonial: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    entry = Testimonial(
        id=str(uuid.uuid4()),
        name=testimonial.get("name", ""),
        role=testimonial.get("role", ""),
        content=testimonial.get("content", ""),
        image_url=testimonial.get("image_url"),
        rating=testimonial.get("rating"),
    )
    db.add(entry)
    db.commit()
    return {"message": "Testimonial created", "id": entry.id}


@api_router.put("/admin/testimonials/{testimonial_id}", dependencies=[Depends(get_current_user)])
async def update_testimonial(testimonial_id: str, testimonial: dict, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    entry = db.get(Testimonial, testimonial_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    entry.name = testimonial.get("name", entry.name)
    entry.role = testimonial.get("role", entry.role)
    entry.content = testimonial.get("content", entry.content)
    entry.image_url = testimonial.get("image_url", entry.image_url)
    entry.rating = testimonial.get("rating", entry.rating)
    db.commit()
    return {"message": "Testimonial updated"}


@api_router.delete("/admin/testimonials/{testimonial_id}", dependencies=[Depends(get_current_user)])
async def delete_testimonial(testimonial_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    entry = db.get(Testimonial, testimonial_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    db.delete(entry)
    db.commit()
    return {"message": "Testimonial deleted"}


@api_router.post("/upload/image", dependencies=[Depends(get_current_user)])
async def upload_image(image: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    ext = Path(image.filename).suffix.lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Only image files allowed: {', '.join(allowed_exts)}")

    filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOADS_DIR / filename
    with open(file_path, "wb") as handle:
        handle.write(await image.read())
    return {"image_url": f"/api/uploads/{filename}", "filename": filename}


@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
    }
    return FileResponse(path=str(file_path), media_type=media_types.get(Path(filename).suffix.lower(), "application/octet-stream"))


@api_router.get("/stock-images")
async def get_stock_images():
    return {"images": STOCK_COURSE_IMAGES}


@api_router.get("/blogs")
async def get_blogs(db: Session = Depends(get_db)):
    blogs = db.execute(select(Blog).options(selectinload(Blog.tags)).order_by(Blog.created_at.desc()).limit(100)).scalars().all()
    return [serialize_blog(blog) for blog in blogs]


@api_router.get("/blogs/{blog_id}")
async def get_blog(blog_id: str, db: Session = Depends(get_db)):
    blog = db.execute(select(Blog).options(selectinload(Blog.tags)).where(Blog.id == blog_id)).scalar_one_or_none()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return serialize_blog(blog)


@api_router.post("/admin/blogs", dependencies=[Depends(get_current_user)])
async def create_blog(
    title: str = Form(...),
    category: str = Form(...),
    excerpt: str = Form(...),
    tags: str = Form(""),
    read_time: str = Form("5 min read"),
    read_more_link: str = Form(""),
    pdf_file: UploadFile | None = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    blog_id = str(uuid.uuid4())
    pdf_filename = None
    if pdf_file and pdf_file.filename:
        ext = Path(pdf_file.filename).suffix.lower()
        if ext != ".pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        pdf_filename = f"{blog_id}{ext}"
        with open(UPLOADS_DIR / pdf_filename, "wb") as handle:
            handle.write(await pdf_file.read())

    blog = Blog(
        id=blog_id,
        title=title,
        category=category,
        excerpt=excerpt,
        read_time=read_time,
        pdf_filename=pdf_filename,
        read_more_link=read_more_link.strip() if read_more_link else "",
        created_at=utcnow(),
    )
    db.add(blog)
    db.flush()
    for index, tag in enumerate([value.strip() for value in tags.split(",") if value.strip()], start=1):
        db.add(BlogTag(blog_id=blog_id, position=index, tag=tag))
    db.commit()
    db.refresh(blog)
    return serialize_blog(db.execute(select(Blog).options(selectinload(Blog.tags)).where(Blog.id == blog_id)).scalar_one())


@api_router.put("/admin/blogs/{blog_id}", dependencies=[Depends(get_current_user)])
async def update_blog(
    blog_id: str,
    title: str = Form(...),
    category: str = Form(...),
    excerpt: str = Form(...),
    tags: str = Form(""),
    read_time: str = Form("5 min read"),
    read_more_link: str = Form(""),
    pdf_file: UploadFile | None = File(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    blog = db.execute(select(Blog).options(selectinload(Blog.tags)).where(Blog.id == blog_id)).scalar_one_or_none()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    pdf_filename = blog.pdf_filename
    if pdf_file and pdf_file.filename:
        ext = Path(pdf_file.filename).suffix.lower()
        if ext != ".pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        if pdf_filename:
            old_path = UPLOADS_DIR / pdf_filename
            if old_path.exists():
                old_path.unlink()
        pdf_filename = f"{blog_id}{ext}"
        with open(UPLOADS_DIR / pdf_filename, "wb") as handle:
            handle.write(await pdf_file.read())

    blog.title = title
    blog.category = category
    blog.excerpt = excerpt
    blog.read_time = read_time
    blog.pdf_filename = pdf_filename
    blog.read_more_link = read_more_link.strip() if read_more_link else ""
    db.query(BlogTag).filter(BlogTag.blog_id == blog_id).delete()
    for index, tag in enumerate([value.strip() for value in tags.split(",") if value.strip()], start=1):
        db.add(BlogTag(blog_id=blog_id, position=index, tag=tag))
    db.commit()
    return {"message": "Blog updated"}


@api_router.delete("/admin/blogs/{blog_id}", dependencies=[Depends(get_current_user)])
async def delete_blog(blog_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    blog = db.get(Blog, blog_id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog.pdf_filename:
        file_path = UPLOADS_DIR / blog.pdf_filename
        if file_path.exists():
            file_path.unlink()
    db.delete(blog)
    db.commit()
    return {"message": "Blog deleted"}


@api_router.get("/blogs/{blog_id}/pdf")
async def get_blog_pdf(blog_id: str, db: Session = Depends(get_db)):
    blog = db.get(Blog, blog_id)
    if not blog or not blog.pdf_filename:
        raise HTTPException(status_code=404, detail="PDF not found")
    file_path = UPLOADS_DIR / blog.pdf_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    return FileResponse(path=str(file_path), media_type="application/pdf", filename=f"{blog.title}.pdf")


app.include_router(api_router)

configured_cors_origins = os.environ.get("CORS_ORIGINS", "*").strip()
if configured_cors_origins == "*":
    cors_origins = DEFAULT_CORS_ORIGINS
else:
    cors_origins = [origin.strip() for origin in configured_cors_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.middleware("http")
async def log_slow_requests(request: Request, call_next):
    started_at = perf_counter()
    response = await call_next(request)
    elapsed_ms = (perf_counter() - started_at) * 1000
    if elapsed_ms >= PERF_LOG_SLOW_MS:
        logger.warning("%s %s completed in %.1f ms with status %s", request.method, request.url.path, elapsed_ms, response.status_code)
    return response


def seed_data() -> None:
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@mentoriq.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")

    with SessionLocal() as db:
        existing_admin = db.execute(select(User).where(User.email == admin_email)).scalar_one_or_none()
        if existing_admin is None:
            db.add(
                User(
                    id=str(uuid.uuid4()),
                    email=admin_email,
                    password_hash=hash_password(admin_password),
                    name="Admin",
                    role="admin",
                    created_at=utcnow(),
                )
            )
            db.commit()
            logger.info("Admin user created: %s", admin_email)
        elif not verify_password(admin_password, existing_admin.password_hash):
            existing_admin.password_hash = hash_password(admin_password)
            db.commit()

        teacher_email = "teacher@mentoriq.com"
        if not db.execute(select(User).where(User.email == teacher_email)).scalar_one_or_none():
            db.add(
                User(
                    id=str(uuid.uuid4()),
                    email=teacher_email,
                    password_hash=hash_password("Teacher@123"),
                    name="John Doe",
                    role="teacher",
                    created_at=utcnow(),
                )
            )
            db.commit()

        # Ensure a test student exists for iteration tests
        student_email = "student@test.com"
        student = db.execute(select(User).where(User.email == student_email)).scalar_one_or_none()
        if not student:
            student = User(
                id=str(uuid.uuid4()),
                email=student_email,
                password_hash=hash_password("Test@123"),
                name="Test Student",
                role="student",
                created_at=utcnow(),
            )
            db.add(student)
            db.commit()
            student = db.execute(select(User).where(User.email == student_email)).scalar_one()

        # Ensure the known test course exists for API integration tests
        agentic_id = "0079725e-780a-4bf3-9a7c-4dd4dbeb3f82"
        course = db.get(Course, agentic_id)
        if not course:
            course = Course(
                id=agentic_id,
                title="Mastering Agentic AI Systems",
                description="Learn to build intelligent agentic AI systems that can make autonomous decisions and take actions. Master AWS Lex, Lambda, and real-world implementations.",
                category="Agentic AI",
                instructor="Dr. Sarah Mitchell",
                instructor_id=None,
                thumbnail="https://static.prod-images.emergentagent.com/jobs/05a74d16-175f-43a6-8928-ef1b5d8f44ff/images/921bd9e62af4128a6d1c5df7ace8bfbc6ea444f1b1e77043625cd78092b9db3c.png",
                duration="8 weeks",
                course_type=None,
                youtube_playlist=None,
                live_price=99.99,
                recorded_price=49.99,
                created_at=utcnow(),
            )
            db.add(course)
            db.flush()
            upsert_course_children(
                db,
                course,
                [
                    "Introduction to Agentic AI",
                    "AWS Lex Fundamentals",
                    "Lambda Integration",
                    "Building Conversational Flows",
                    "Real-world Use Cases",
                    "Deployment & Monitoring",
                ],
                [
                    {"title": "Day 1 - Introduction to Agentic AI", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-1"},
                    {"title": "Day 2 - Setting Up Your Environment", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-2"},
                    {"title": "Day 3 - Building Your First Agent", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-3"},
                ],
            )
            db.commit()
        else:
            updated = False
            if not course.drive_videos:
                upsert_course_children(
                    db,
                    course,
                    [
                        "Introduction to Agentic AI",
                        "AWS Lex Fundamentals",
                        "Lambda Integration",
                        "Building Conversational Flows",
                        "Real-world Use Cases",
                        "Deployment & Monitoring",
                    ],
                    [
                        {"title": "Day 1 - Introduction to Agentic AI", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-1"},
                        {"title": "Day 2 - Setting Up Your Environment", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-2"},
                        {"title": "Day 3 - Building Your First Agent", "drive_file_id": "1BxiMVs0XTw9CfC7NbC_1a-demo-file-3"},
                    ],
                )
                updated = True
            if updated:
                db.commit()

        # Ensure the test student is enrolled in the known course
        enrollment = db.execute(
            select(Enrollment)
            .where(
                Enrollment.course_id == agentic_id,
                or_(Enrollment.student_id == student.id, Enrollment.user_id == student.id),
            )
        ).scalar_one_or_none()
        if not enrollment:
            db.add(
                Enrollment(
                    id=str(uuid.uuid4()),
                    course_id=agentic_id,
                    user_id=None,
                    student_id=student.id,
                    enrollment_type="recorded",
                    payment_status="paid",
                    subscription_active=True,
                    manually_enrolled=True,
                    enrolled_at=utcnow(),
                )
            )
            db.commit()

        if db.execute(select(func.count()).select_from(Course)).scalar_one() == 0:
            sample_courses = [
                {
                    "title": "Mastering Agentic AI Systems",
                    "description": "Learn to build intelligent agentic AI systems that can make autonomous decisions and take actions. Master AWS Lex, Lambda, and real-world implementations.",
                    "category": "Agentic AI",
                    "pricing": {"live": 99.99, "recorded": 49.99},
                    "syllabus": [
                        "Introduction to Agentic AI",
                        "AWS Lex Fundamentals",
                        "Lambda Integration",
                        "Building Conversational Flows",
                        "Real-world Use Cases",
                        "Deployment & Monitoring",
                    ],
                    "instructor": "Dr. Sarah Mitchell",
                    "thumbnail": "https://static.prod-images.emergentagent.com/jobs/05a74d16-175f-43a6-8928-ef1b5d8f44ff/images/921bd9e62af4128a6d1c5df7ace8bfbc6ea444f1b1e77043625cd78092b9db3c.png",
                    "duration": "8 weeks",
                },
                {
                    "title": "Conversational AI with Dialogflow",
                    "description": "Build sophisticated conversational AI solutions using Google Dialogflow CX. Learn NLP, intent recognition, and multi-turn conversations.",
                    "category": "Conversational AI",
                    "pricing": {"live": 89.99, "recorded": 44.99},
                    "syllabus": [
                        "Dialogflow CX Overview",
                        "Intent & Entity Design",
                        "Context Management",
                        "Webhook Integration",
                        "Multi-language Support",
                        "Production Deployment",
                    ],
                    "instructor": "Michael Chen",
                    "thumbnail": "https://static.prod-images.emergentagent.com/jobs/05a74d16-175f-43a6-8928-ef1b5d8f44ff/images/6f467a57b308b88344d008fbfcaccfe6f5efccb750a45990bc39355af6698486.png",
                    "duration": "6 weeks",
                },
                {
                    "title": "Contact Center AI Solutions",
                    "description": "Transform contact centers with AI. Learn Amazon Connect, NICE CX integration, sentiment analysis, and automation strategies.",
                    "category": "Contact Center AI",
                    "pricing": {"live": 119.99, "recorded": 59.99},
                    "syllabus": [
                        "Contact Center Fundamentals",
                        "Amazon Connect Setup",
                        "AI-powered Routing",
                        "Sentiment Analysis",
                        "Performance Analytics",
                        "Case Studies",
                    ],
                    "instructor": "Emily Rodriguez",
                    "thumbnail": "https://static.prod-images.emergentagent.com/jobs/05a74d16-175f-43a6-8928-ef1b5d8f44ff/images/8c2754e043e204f44e5ade9de134e34b6a26c894513572f5ad4fca59fa4aea57.png",
                    "duration": "10 weeks",
                },
            ]
            for sample in sample_courses:
                course = Course(
                    id=str(uuid.uuid4()),
                    title=sample["title"],
                    description=sample["description"],
                    category=sample["category"],
                    instructor=sample["instructor"],
                    instructor_id=None,
                    thumbnail=sample["thumbnail"],
                    duration=sample["duration"],
                    course_type=None,
                    youtube_playlist=None,
                    live_price=sample["pricing"]["live"],
                    recorded_price=sample["pricing"]["recorded"],
                    created_at=utcnow(),
                )
                db.add(course)
                db.flush()
                upsert_course_children(db, course, sample["syllabus"], [])
            db.commit()

        if db.execute(select(func.count()).select_from(Testimonial)).scalar_one() == 0:
            db.add_all(
                [
                    Testimonial(
                        id=str(uuid.uuid4()),
                        name="Alex Johnson",
                        role="AI Engineer at TechCorp",
                        content="Altanon Learn transformed my career. The hands-on projects and real-world use cases helped me land my dream job in AI.",
                        image_url="https://images.unsplash.com/photo-1725473824966-b21a2ff3fda4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHw0fHxzdHVkZW50JTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDB8fHx8MTc3NDY4MTUyMHww&ixlib=rb-4.1.0&q=85",
                        rating=5,
                    ),
                    Testimonial(
                        id=str(uuid.uuid4()),
                        name="Priya Sharma",
                        role="Conversational AI Specialist",
                        content="The instructors are industry experts. I learned more in 8 weeks than I did in a year of self-study. Highly recommended!",
                        image_url="https://images.unsplash.com/photo-1657446969218-499fb1599584?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDB8fHx8MTc3NDY4MTUyMHww&ixlib=rb-4.1.0&q=85",
                        rating=5,
                    ),
                ]
            )
            db.commit()

        if db.execute(select(func.count()).select_from(Blog)).scalar_one() == 0:
            default_blogs = [
                ("What is Agentic AI?", "Fundamentals", "Agentic AI represents autonomous systems that can make decisions, take actions, and interact with environments independently. Learn how these intelligent agents are transforming business automation across industries.", ["AI Basics", "Automation"], "5 min read", "https://aws.amazon.com/what-is/artificial-intelligence/"),
                ("Salesforce Agentforce: The Future of CRM", "Salesforce", "Agentforce brings AI-powered autonomous agents to Salesforce, enabling intelligent customer service, sales automation, and predictive analytics. Discover how it revolutionizes customer relationship management.", ["Salesforce", "CRM"], "7 min read", "https://www.salesforce.com/agentforce/"),
                ("Amazon Connect: Cloud Contact Center Platform", "AWS", "Amazon Connect is a cloud-based contact center solution that uses AI for intelligent routing, real-time analytics, and seamless customer experiences. Learn to build scalable contact centers.", ["AWS", "Contact Center"], "6 min read", "https://docs.aws.amazon.com/connect/latest/adminguide/what-is-amazon-connect.html"),
                ("Google Dialogflow CX: Advanced Conversational AI", "Google Cloud", "Dialogflow CX powers sophisticated chatbots and voice assistants with natural language processing, multi-turn conversations, and enterprise-grade scalability. Master conversational design.", ["Google", "NLP"], "8 min read", "https://cloud.google.com/dialogflow/cx/docs"),
                ("Real-World Use Cases of Agentic AI", "Applications", "From customer service automation to intelligent workflows, explore how companies are deploying Agentic AI to reduce costs, improve efficiency, and enhance customer satisfaction.", ["Use Cases", "ROI"], "6 min read", "https://aws.amazon.com/ai/generative-ai/"),
                ("Building AI Agents with AWS Lex & Lambda", "Technical", "Step-by-step guide to creating intelligent conversational agents using AWS Lex for natural language understanding and Lambda for backend processing. Includes best practices.", ["AWS Lex", "Tutorial"], "10 min read", "https://docs.aws.amazon.com/lexv2/latest/dg/what-is.html"),
            ]
            for title, category, excerpt, tags, read_time, link in default_blogs:
                blog = Blog(
                    id=str(uuid.uuid4()),
                    title=title,
                    category=category,
                    excerpt=excerpt,
                    read_time=read_time,
                    pdf_filename=None,
                    read_more_link=link,
                    created_at=utcnow(),
                )
                db.add(blog)
                db.flush()
                for index, tag in enumerate(tags, start=1):
                    db.add(BlogTag(blog_id=blog.id, position=index, tag=tag))
            db.commit()


@app.on_event("startup")
async def startup_event():
    startup_started_at = perf_counter()
    if ENABLE_SCHEMA_SYNC:
        schema_started_at = perf_counter()
        Base.metadata.create_all(bind=engine)
        log_duration("startup schema sync", schema_started_at)
    if ENABLE_STARTUP_SEED:
        seed_started_at = perf_counter()
        seed_data()
        log_duration("startup seed", seed_started_at)
    memory_dir = ROOT_DIR.parent / "memory"
    memory_dir.mkdir(exist_ok=True)
    with open(memory_dir / "test_credentials.md", "w", encoding="utf-8") as handle:
        handle.write("# Altanon Learn Test Credentials\n\n")
        handle.write("## Admin Account\n")
        handle.write(f"Email: {os.environ.get('ADMIN_EMAIL', 'admin@mentoriq.com')}\n")
        handle.write(f"Password: {os.environ.get('ADMIN_PASSWORD', 'Admin@123')}\n")
        handle.write("Role: admin\n\n")
        handle.write("## Teacher Account\n")
        handle.write("Email: teacher@mentoriq.com\n")
        handle.write("Password: Teacher@123\n")
        handle.write("Role: teacher\n\n")
        handle.write("## Auth Endpoints\n")
        handle.write("- POST /api/auth/register\n")
        handle.write("- POST /api/auth/login\n")
        handle.write("- POST /api/auth/logout\n")
        handle.write("- GET /api/auth/me\n")
        handle.write("- POST /api/auth/refresh\n")
        handle.write("- POST /api/auth/forgot-password\n")
        handle.write("- POST /api/auth/reset-password\n")
    log_duration("startup total", startup_started_at)
