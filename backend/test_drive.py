from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


SCOPES = [
    "https://www.googleapis.com/auth/drive"
]

BASE_DIR = Path(__file__).resolve().parent

CREDENTIALS_FILE = BASE_DIR / "credentials.json"
TOKEN_FILE = BASE_DIR / "token.json"


def get_drive_service():
    credentials = None

    # Load previously saved OAuth token.
    if TOKEN_FILE.exists():
        credentials = Credentials.from_authorized_user_file(
            str(TOKEN_FILE),
            SCOPES,
        )

    # Refresh an expired token if possible.
    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())

    # First-time authentication.
    if not credentials or not credentials.valid:
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CREDENTIALS_FILE),
            SCOPES,
        )

        credentials = flow.run_local_server(
            port=0
        )

        TOKEN_FILE.write_text(
            credentials.to_json(),
            encoding="utf-8",
        )

    return build(
        "drive",
        "v3",
        credentials=credentials,
    )


def main():
    print("================================")
    print("OcuScan Google Drive Test")
    print("================================")

    print()
    print("Credentials file:")
    print(CREDENTIALS_FILE)

    print()
    print("Token file:")
    print(TOKEN_FILE)

    print()
    print("Connecting to Google Drive...")

    service = get_drive_service()

    print("Google Drive authentication successful.")

    print()
    print("Searching for OcuScan Dataset folder...")

    results = (
        service.files()
        .list(
            q=(
                "name = 'OcuScan Dataset' "
                "and mimeType = "
                "'application/vnd.google-apps.folder' "
                "and trashed = false"
            ),
            spaces="drive",
            fields="files(id, name, mimeType)",
            pageSize=10,
        )
        .execute()
    )

    folders = results.get("files", [])

    if not folders:
        print()
        print("OcuScan Dataset folder was NOT found.")
        print(
            "Create the folder in Google Drive and run this test again."
        )
        return

    print()
    print("OcuScan Dataset folder found!")

    for folder in folders:
        print(
            f"Name: {folder['name']}"
        )

        print(
            f"ID: {folder['id']}"
        )

        print(
            f"Type: {folder['mimeType']}"
        )

    print()
    print("================================")
    print("DRIVE TEST SUCCESSFUL")
    print("================================")


if __name__ == "__main__":
    main()