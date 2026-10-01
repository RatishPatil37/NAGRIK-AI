"""Authentication dependencies and JWT verification."""

from typing import Optional
from fastapi import Header, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.src.config import settings

security = HTTPBearer(auto_error=False)


async def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[str]:
    """Extracts verified user_id (sub) from Supabase JWT if present.
    In testing or anonymous mode, permits unauthenticated requests with None.
    """
    if not credentials:
        return None

    token = credentials.credentials
    if not token:
        return None

    # If Supabase JWT Secret is configured, decode and verify
    if settings.SUPABASE_JWT_SECRET:
        try:
            import jwt
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256", "RS256", "ES256"],
                options={"verify_aud": False},
            )
            return payload.get("sub")
        except Exception as e:
            if settings.TESTING:
                return "test-user-id"
            raise HTTPException(status_code=401, detail=f"Invalid authentication token: {e}")

    # Fallback in dev/testing
    if settings.TESTING:
        return "test-user-id"

    return None
