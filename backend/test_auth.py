from backend.app.auth import hash_password, verify_password


def main():
    password = "TestPassword123!"

    hashed_password = hash_password(password)

    print("Original password:")
    print(password)

    print("\nGenerated hash:")
    print(hashed_password)

    print("\nCorrect password:")
    print(verify_password(password, hashed_password))

    print("\nIncorrect password:")
    print(verify_password("WrongPassword123!", hashed_password))


if __name__ == "__main__":
    main()