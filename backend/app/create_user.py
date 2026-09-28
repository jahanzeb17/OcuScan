from getpass import getpass

from sqlalchemy import select

from app.auth import hash_password
from app.database import SessionLocal
from app.models import Doctor


def create_user():
    print("========== CREATE OCUSCAN USER ==========")

    name = input("Name: ").strip()
    email = input("Email: ").strip().lower()

    role = input("Role (doctor/admin): ").strip().lower()

    if role not in {"doctor", "admin"}:
        print("ERROR: Role must be doctor or admin.")
        return

    password = getpass("Password: ")
    confirm_password = getpass("Confirm password: ")

    if password != confirm_password:
        print("ERROR: Passwords do not match.")
        return

    if not password:
        print("ERROR: Password cannot be empty.")
        return

    db = SessionLocal()

    try:
        existing_user = db.scalar(
            select(Doctor).where(
                Doctor.email == email
            )
        )

        if existing_user:
            print("ERROR: A user with this email already exists.")
            return

        user = Doctor(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print()
        print("User created successfully.")
        print("Doctor ID:", user.doctor_id)
        print("Name:", user.name)
        print("Email:", user.email)
        print("Role:", user.role)

    except Exception as error:
        db.rollback()
        print("ERROR:", error)

    finally:
        db.close()


if __name__ == "__main__":
    create_user()