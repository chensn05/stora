import jwt, os
from fastapi import Header, HTTPException

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

def parse_user(authorization: str = Header(None, alias="Authorization")):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "unauthorized")
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "invalid token")
    return {
        "userId": payload["sub"],
        "email": payload.get("email", ""),
        "name": payload.get("user_metadata", {}).get("full_name", payload.get("email", "").split("@")[0]),
    }
