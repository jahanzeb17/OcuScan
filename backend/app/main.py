from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models import Doctor, Image


app = FastAPI(title="OcuScan API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "OcuScan API is running"
    }


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post("/auth/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form_data.username.strip().lower()

    doctor = db.scalar(
        select(Doctor).where(
            Doctor.email == email
        )
    )

    if doctor is None:
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    if not doctor.is_active:
        return {
            "success": False,
            "message": "Account is inactive",
        }

    if not verify_password(
        form_data.password,
        doctor.password_hash,
    ):
        return {
            "success": False,
            "message": "Invalid email or password",
        }

    access_token = create_access_token(
        doctor_id=doctor.doctor_id,
        role=doctor.role,
    )

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "doctor": {
            "doctor_id": doctor.doctor_id,
            "name": doctor.name,
            "email": doctor.email,
            "role": doctor.role,
            "profile_photo_url": (
                f"/doctors/{doctor.doctor_id}/profile-photo"
                if doctor.profile_photo
                else None
            ),
        },
    }


@app.post("/auth/register")
def register(
    name: str = Form(...),
    hospital: str | None = Form(None),
    city: str | None = Form(None),
    experience: int | None = Form(None),
    qualification: str | None = Form(None),
    designation: str | None = Form(None),
    email: str = Form(...),
    password: str = Form(...),
    profile_photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    clean_name = name.strip()
    clean_email = email.strip().lower()

    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Name is required",
        )

    if not clean_email:
        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    if not password:
        raise HTTPException(
            status_code=400,
            detail="Password is required",
        )

    existing_doctor = db.scalar(
        select(Doctor).where(
            Doctor.email == clean_email
        )
    )

    if existing_doctor is not None:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    profile_photo_data = None
    profile_photo_content_type = None

    if profile_photo is not None:
        profile_photo_data = profile_photo.read()

        if not profile_photo_data:
            raise HTTPException(
                status_code=400,
                detail="Profile photo is empty",
            )

        if not profile_photo.content_type or not profile_photo.content_type.startswith(
            "image/"
        ):
            raise HTTPException(
                status_code=400,
                detail="Profile photo must be an image",
            )

        profile_photo_content_type = profile_photo.content_type

    new_doctor = Doctor(
        name=clean_name,
        hospital=hospital.strip() if hospital else None,
        city=city.strip() if city else None,
        experience=experience,
        qualification=(
            qualification.strip()
            if qualification
            else None
        ),
        designation=(
            designation.strip()
            if designation
            else None
        ),
        email=clean_email,
        password_hash=hash_password(password),
        role="doctor",
        profile_photo=profile_photo_data,
        profile_photo_content_type=profile_photo_content_type,
        is_active=True,
    )

    try:
        db.add(new_doctor)
        db.commit()
        db.refresh(new_doctor)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create account",
        )

    return {
        "success": True,
        "message": "Account created successfully",
        "doctor": {
            "doctor_id": new_doctor.doctor_id,
            "name": new_doctor.name,
            "email": new_doctor.email,
            "role": new_doctor.role,
            "profile_photo_url": (
                f"/doctors/{new_doctor.doctor_id}/profile-photo"
                if new_doctor.profile_photo
                else None
            ),
        },
    }


@app.get("/auth/me")
def get_me(
    current_user: Doctor = Depends(get_current_user),
):
    return {
        "doctor_id": current_user.doctor_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "profile_photo_url": (
            f"/doctors/{current_user.doctor_id}/profile-photo"
            if current_user.profile_photo
            else None
        ),
    }


# ============================================================
# PROFILE PHOTO
# ============================================================

@app.get("/doctors/{doctor_id}/profile-photo")
def get_profile_photo(
    doctor_id: int,
    current_user: Doctor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin" and current_user.doctor_id != doctor_id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to view this profile photo",
        )

    doctor = db.scalar(
        select(Doctor).where(Doctor.doctor_id == doctor_id)
    )

    if doctor is None:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found",
        )

    if not doctor.profile_photo or not doctor.profile_photo_content_type:
        raise HTTPException(
            status_code=404,
            detail="Profile photo not found",
        )

    return Response(
        content=doctor.profile_photo,
        media_type=doctor.profile_photo_content_type,
    )


# ============================================================
# IMAGE UPLOAD
# ============================================================


@app.post("/upload")
async def upload_image(
    image: UploadFile = File(...),
    disease: str = Form(...),
    subtype: str = Form(...),
    filename: str = Form(...),
    width: int = Form(...),
    height: int = Form(...),
    current_user: Doctor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        raise HTTPException(
            status_code=403,
            detail="Admins cannot upload images",
        )

    print("========== UPLOAD RECEIVED ==========")
    print("Doctor ID:", current_user.doctor_id)
    print("Doctor:", current_user.name)
    print("Disease:", disease)
    print("Subtype:", subtype)
    print("Filename:", filename)
    print("Width:", width)
    print("Height:", height)
    print("Content Type:", image.content_type)

    contents = await image.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty",
        )

    if not image.content_type:
        raise HTTPException(
            status_code=400,
            detail="Image content type is missing",
        )

    new_image = Image(
        doctor_id=current_user.doctor_id,
        filename=filename,
        image_data=contents,
        content_type=image.content_type,
        disease=disease,
        subtype=subtype,
        width=width,
        height=height,
    )

    try:
        db.add(new_image)
        db.commit()
        db.refresh(new_image)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to store image in database",
        )

    return {
        "success": True,
        "message": "Image stored successfully in PostgreSQL",
        "image_id": new_image.image_id,
        "doctor_id": current_user.doctor_id,
        "filename": new_image.filename,
        "disease": new_image.disease,
        "subtype": new_image.subtype,
        "width": new_image.width,
        "height": new_image.height,
        "content_type": image.content_type,
        "file_size": len(contents),
    }


# ============================================================
# DOCTOR / USER DATA
# ============================================================

@app.get("/my/stats")
def get_my_stats(
    current_user: Doctor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_images = db.scalar(
        select(func.count(Image.image_id)).where(
            Image.doctor_id == current_user.doctor_id
        )
    ) or 0

    disease_counts = {}

    for disease in [
        "conjunctivitis",
        "pterygium",
        "strabismus",
    ]:
        count = db.scalar(
            select(func.count(Image.image_id)).where(
                Image.doctor_id == current_user.doctor_id,
                Image.disease == disease,
            )
        ) or 0

        disease_counts[disease] = count

    return {
        "total_images": total_images,
        "disease_counts": disease_counts,
    }


@app.get("/my/images")
def get_my_images(
    current_user: Doctor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    images = db.scalars(
        select(Image)
        .where(
            Image.doctor_id == current_user.doctor_id
        )
        .order_by(
            Image.created_at.desc()
        )
    ).all()

    return {
        "images": [
            {
                "image_id": image.image_id,
                "filename": image.filename,
                "disease": image.disease,
                "subtype": image.subtype,
                "width": image.width,
                "height": image.height,
                "content_type": image.content_type,
                "created_at": image.created_at,
            }
            for image in images
        ]
    }


# ============================================================
# ADMIN DATA
# ============================================================

@app.get("/admin/dashboard")
def get_admin_dashboard(
    current_user: Doctor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    total_doctors = db.scalar(
        select(func.count(Doctor.doctor_id)).where(
            Doctor.role == "doctor"
        )
    ) or 0

    total_images = db.scalar(
        select(func.count(Image.image_id))
    ) or 0

    disease_counts = {}

    for disease in [
        "conjunctivitis",
        "pterygium",
        "strabismus",
    ]:
        count = db.scalar(
            select(func.count(Image.image_id)).where(
                Image.disease == disease
            )
        ) or 0

        disease_counts[disease] = count

    subtype_rows = db.execute(
        select(
            Image.subtype,
            func.count(Image.image_id),
        )
        .group_by(Image.subtype)
        .order_by(Image.subtype)
    ).all()

    subtype_counts = {
        subtype: count
        for subtype, count in subtype_rows
    }

    doctors = db.scalars(
        select(Doctor)
        .where(
            Doctor.role == "doctor"
        )
        .order_by(
            Doctor.created_at.desc()
        )
    ).all()

    doctor_data = []

    for doctor in doctors:
        total_doctor_images = db.scalar(
            select(func.count(Image.image_id)).where(
                Image.doctor_id == doctor.doctor_id
            )
        ) or 0

        doctor_disease_counts = {}

        for disease in [
            "conjunctivitis",
            "pterygium",
            "strabismus",
        ]:
            count = db.scalar(
                select(func.count(Image.image_id)).where(
                    Image.doctor_id == doctor.doctor_id,
                    Image.disease == disease,
                )
            ) or 0

            doctor_disease_counts[disease] = count

        doctor_subtype_rows = db.execute(
            select(
                Image.subtype,
                func.count(Image.image_id),
            )
            .where(
                Image.doctor_id == doctor.doctor_id
            )
            .group_by(Image.subtype)
            .order_by(Image.subtype)
        ).all()

        doctor_subtype_counts = {
            subtype: count
            for subtype, count in doctor_subtype_rows
        }

        doctor_data.append({
            "doctor_id": doctor.doctor_id,
            "name": doctor.name,
            "email": doctor.email,
            "hospital": doctor.hospital,
            "city": doctor.city,
            "experience": doctor.experience,
            "qualification": doctor.qualification,
            "designation": doctor.designation,
            "profile_photo_url": (
                f"/doctors/{doctor.doctor_id}/profile-photo"
                if doctor.profile_photo
                else None
            ),
            "created_at": doctor.created_at,
            "is_active": doctor.is_active,
            "total_images": total_doctor_images,
            "disease_counts": doctor_disease_counts,
            "subtype_counts": doctor_subtype_counts,
        })

    return {
        "admin": {
            "doctor_id": current_user.doctor_id,
            "name": current_user.name,
            "email": current_user.email,
        },
        "total_doctors": total_doctors,
        "total_images": total_images,
        "disease_counts": disease_counts,
        "subtype_counts": subtype_counts,
        "doctors": doctor_data,
    }


# ============================================================
# IMAGE VIEW
# ============================================================

@app.get("/images/{image_id}")
def get_image(
    image_id: int,
    current_user: Doctor = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        image = db.scalar(
            select(Image).where(
                Image.image_id == image_id
            )
        )
    else:
        image = db.scalar(
            select(Image).where(
                Image.image_id == image_id,
                Image.doctor_id == current_user.doctor_id,
            )
        )

    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found",
        )

    return Response(
        content=image.image_data,
        media_type=image.content_type,
    )
