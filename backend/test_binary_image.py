from pathlib import Path

from sqlalchemy import select

from backend.app.database import SessionLocal
from backend.app.models import Doctor, Image


TEST_IMAGE = Path("test_image.jpg")
RESTORED_IMAGE = Path("restored_test_image.jpg")


def main():
    if not TEST_IMAGE.exists():
        print(f"ERROR: {TEST_IMAGE} was not found.")
        return

    image_bytes = TEST_IMAGE.read_bytes()

    print("Original file size:", len(image_bytes), "bytes")

    db = SessionLocal()

    try:
        # Create a temporary doctor
        doctor = Doctor(
            name="Test Doctor",
            email="test.doctor@ocuscan.local",
            password_hash="temporary-test-value",
            role="doctor",
        )

        db.add(doctor)
        db.flush()

        print("Created test doctor ID:", doctor.doctor_id)

        # Store the actual image bytes in PostgreSQL
        image = Image(
            doctor_id=doctor.doctor_id,
            filename=TEST_IMAGE.name,
            image_data=image_bytes,
            content_type="image/jpeg",
            disease="conjunctivitis",
            subtype="Bacterial conjunctivitis",
            width=3072,
            height=4096,
        )

        db.add(image)
        db.commit()

        print("Stored image ID:", image.image_id)

        image_id = image.image_id

        # Retrieve the image from PostgreSQL
        saved_image = db.scalar(
            select(Image).where(Image.image_id == image_id)
        )

        if saved_image is None:
            print("ERROR: Image could not be retrieved.")
            return

        restored_bytes = saved_image.image_data

        print("Retrieved file size:", len(restored_bytes), "bytes")

        # Write the retrieved bytes back to a real image file
        RESTORED_IMAGE.write_bytes(restored_bytes)

        print("Restored image:", RESTORED_IMAGE)

        # Verify byte-for-byte equality
        if image_bytes == restored_bytes:
            print("SUCCESS: Original and retrieved bytes are identical.")
        else:
            print("ERROR: Image bytes are different.")

        # Clean up the temporary database records
        db.delete(saved_image)
        db.delete(doctor)
        db.commit()

        print("Test database records removed.")

    finally:
        db.close()


if __name__ == "__main__":
    main()