# Code Explanation: `jwt_handler.py`

## Matching Source File
`backend/app/auth/jwt_handler.py`

---

## 1. Purpose
Encapsulates cryptographic JSON Web Token (JWT) generation, claims validation, and signature decoding for access and refresh tokens.

---

## 2. Responsibilities
- Creating short-lived `access` tokens with user ID subjects.
- Creating long-lived `refresh` tokens with distinct type claims.
- Decoding token strings and verifying cryptographic signatures against `settings.JWT_SECRET_KEY`.
- Validating token expiration timestamps.

---

## 3. Main Functions
- `create_access_token(subject: str | Any, expires_delta: Optional[timedelta]) -> str`: Issues access JWT with `type="access"` claim.
- `create_refresh_token(subject: str | Any, expires_delta: Optional[timedelta]) -> str`: Issues refresh JWT with `type="refresh"` claim.
- `decode_token(token: str) -> Optional[TokenPayload]`: Validates signature and maps payload to typed `TokenPayload` model.

---

## 4. Execution Flow
1. Computes UTC expiration timestamp (`datetime.now(timezone.utc) + timedelta(...)`).
2. Constructs payload dictionary: `{"sub": str(subject), "exp": expire, "type": token_type}`.
3. Encodes token using `jwt.encode(payload, secret_key, algorithm="HS256")`.
4. In `decode_token`, catches `jwt.PyJWTError` and returns `None` for invalid or expired tokens.

---

## 5. Dependencies
- `pyjwt`: Python JWT library.
- `app.core.config.settings`: Secret keys and expiration intervals.
- `app.schemas.auth.TokenPayload`: Typed claims model.

---

## 6. Interview Explanation
> *"The jwt_handler enforces strict token segregation via explicit `type` claims. This prevents a critical security loophole where an attacker might attempt to use a long-lived refresh token directly as a bearer access token against protected resource endpoints."*

---

## 7. Common Modifications
- Switching from symmetric HMAC-SHA256 (`HS256`) to asymmetric RSA (`RS256`) for public-key signature verification across multiple services.
