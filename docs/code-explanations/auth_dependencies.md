# Code Explanation: `auth_dependencies.py`

## Matching Source File
`backend/app/auth/dependencies.py`

---

## 1. Purpose
Provides FastAPI dependency injection functions for extracting JWT tokens from Authorization headers or HttpOnly cookies, validating user identity, and enforcing role-based permissions.

---

## 2. Responsibilities
- Inspecting HTTP request headers for `Authorization: Bearer <token>`.
- Falling back to `access_token` cookie if the Bearer header is missing.
- Decoding the token and querying the database for the active `User` record.
- Raising HTTP 401 Unauthorized for missing, malformed, or expired tokens.
- Verifying user account activation (`is_active`) and admin rights (`is_superuser`).

---

## 3. Main Functions
- `get_token_from_request(request, bearer_header) -> Optional[str]`: Dual-resolution token extractor.
- `get_current_user(token, db) -> User`: Core dependency resolving the authenticated user.
- `get_current_active_user(current_user) -> User`: Ensures account is active.
- `get_current_superuser(current_user) -> User`: Enforces administrator role.

---

## 4. Execution Flow
1. FastAPI injects `get_current_active_user` on protected routes.
2. `get_token_from_request` checks `Authorization` header first; if none, checks `request.cookies.get("access_token")`.
3. If no token found, raises `HTTPException(401)`.
4. Decodes token via `decode_token()`; checks `sub` and `type == "access"`.
5. Queries database: `SELECT * FROM users WHERE id = user_id`.
6. Checks `user.is_active`; returns user entity.

---

## 5. Dependencies
- `fastapi`: `Depends`, `HTTPException`, `status`, `Request`, `HTTPBearer`.
- `sqlalchemy.ext.asyncio.AsyncSession`: Database session dependency.
- `app.models.user.User`: ORM model.
- `app.auth.jwt_handler.decode_token`: JWT validation.

---

## 6. Interview Explanation
> *"FastAPI's dependency injection system allows clean composition. By chaining `get_current_active_user` $\rightarrow$ `get_current_user` $\rightarrow$ `get_token_from_request`, endpoint handlers receive a fully validated, type-safe User entity in one line (`current_user: User = Depends(get_current_active_user)`), keeping endpoint code clean and declarative."*

---

## 7. Common Modifications
- Adding IP rate-limiting or user session revocation blacklist checks against Redis.
