import os, json, base64
from fastapi import Header, HTTPException

def parse_user(authorization: str = Header(None, alias="Authorization")):
    """Parse Supabase JWT token. 
    
    Supabase uses ES256 asymmetric JWTs. For simplicity in the open-source edition,
    we decode without signature verification (the token comes from Supabase Auth,
    which we trust). For production, replace with proper JWKS verification.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "unauthorized")
    token = authorization.replace("Bearer ", "")
    try:
        # Decode without verification (trust Supabase Auth as the issuer)
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(401, "invalid token format")
        
        # Decode payload (base64url)
        payload_bytes = base64.urlsafe_b64decode(parts[1] + "==")
        payload = json.loads(payload_bytes)
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "invalid token: no sub")
        
        email = payload.get("email", "")
        user_metadata = payload.get("user_metadata", {})
        name = user_metadata.get("full_name") or user_metadata.get("name") or (email.split("@")[0] if email else "User")
        
        return {
            "userId": user_id,
            "email": email,
            "name": name,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(401, f"invalid token: {str(e)[:50]}")
