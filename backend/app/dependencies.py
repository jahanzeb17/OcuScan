from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt

from app.auth import JWT_ALGORITHM, JWT_SECRET_KEY
from app.database import get_db
from app.models import Doctor

from sqlalchemy import select
from sqlalchemy.orm import Session


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Doctor:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        doctor_id = payload.get("sub")

        if doctor_id is None:
            raise credentials_exception

        doctor_id = int(doctor_id)

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
    ):
        raise credentials_exception

    doctor = db.scalar(
        select(Doctor).where(
            Doctor.doctor_id == doctor_id
        )
    )

    if doctor is None:
        raise credentials_exception

    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    return doctor