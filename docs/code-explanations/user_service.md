# Code Explanation: `user_service.py`

## Matching Source File
`backend/app/services/user_service.py`

---

## 1. Purpose
Provides user registration, credential verification, and account lookups for authentication.

---

## 2. Responsibilities
- Querying users by primary key `id`.
- Querying users by normalized lowercase `email`.
- Creating new `User` records with bcrypt-salted password hashes.
- Authenticating login credentials using constant-time password verification.

---

## 3. Main Classes
- `UserService`: Static service for user identity management.

---

## 4. Main Functions
- `get_by_id(db: AsyncSession, user_id: int) -> Optional[User]`
- `get_by_email(db: AsyncSession, email: str) -> Optional[User]`
- `create(db: AsyncSession, user_in: UserCreate) -> User`: Hashes password and commits new `User`.
- `authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]`: Verifies email and password hash.

---

## 5. Execution Flow
1. `create` receives `UserCreate` schema.
2. Hashes `password` via `get_password_hash()`.
3. Normalizes email to lowercase.
4. Inserts and commits `User` record.
5. In `authenticate`, checks user existence, verifies password via `verify_password()`, and returns user entity or `None`.

---

## 6. Dependencies
- `app.models.user.User`: ORM entity.
- `app.auth.security`: `get_password_hash`, `verify_password`.
- `app.schemas.user.UserCreate`: Validation schema.

---

## 7. Interview Explanation
> *"UserService encapsulates user lifecycle and credential security. By enforcing password hashing at the service boundary, raw passwords never touch the database model layer unhashed."*

---

## 8. Common Modifications
- Integrating OAuth2 / Social login (GitHub, Google) account linking.
- Adding two-factor authentication (TOTP) verification.
