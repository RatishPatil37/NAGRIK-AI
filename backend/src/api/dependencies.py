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


async def require_admin_role(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
) -> str:
    """Enforces Admin RBAC.
    Accepts:
    1. Valid X-Admin-Key matching settings.ADMIN_API_KEY
    2. Supabase JWT containing role == 'admin' in user/app metadata
    3. Testing mode bypass
    """
    if settings.TESTING:
        return "admin-test-user"

    # Option 1: Direct Admin API Key Header
    if x_admin_key and settings.ADMIN_API_KEY and x_admin_key == settings.ADMIN_API_KEY:
        return "admin-api-key"

    # Option 2: JWT role claim verification
    if credentials and credentials.credentials:
        token = credentials.credentials
        if settings.SUPABASE_JWT_SECRET:
            try:
                import jwt
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256", "RS256", "ES256"],
                    options={"verify_aud": False},
                )
                role = payload.get("role") or payload.get("user_metadata", {}).get("role") or payload.get("app_metadata", {}).get("role")
                if role == "admin":
                    return payload.get("sub", "admin-user")
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Invalid authentication token: {e}")

    raise HTTPException(
        status_code=403,
        detail="Forbidden: Administrative privileges required. Please provide a valid admin token or X-Admin-Key.",
    )

