"""FastAPI main — planet diary API (open-source edition)."""
from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .db import get_conn
from .init_db import init_db
from .auth import parse_user
from .ai import chat_with_guardian

PLANETS = ["mercury", "venus", "mars", "jupiter", "saturn"]

# 五行相生相克
SHENG = {
    "mercury": "jupiter",   # 水生木
    "jupiter": "mars",      # 木生火
    "mars": "saturn",       # 火生土
    "saturn": "venus",      # 土生金
    "venus": "mercury",     # 金生水
}
KE = {
    "mercury": "mars",      # 水克火
    "mars": "venus",        # 火克金
    "venus": "jupiter",     # 金克木
    "jupiter": "saturn",    # 木克土
    "saturn": "mercury",    # 土克水
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as e:
        print(f"[init_db] warning: {e}")
    yield


app = FastAPI(title="Planet Diary", lifespan=lifespan)

# CORS — allow all origins for open-source self-hosted deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_or_create_user(user: dict) -> dict:
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO users (sso_id, email, username)
            VALUES (%s, %s, %s)
            ON CONFLICT (sso_id) DO UPDATE SET
              email = EXCLUDED.email,
              username = EXCLUDED.username
            RETURNING id, sso_id, email, username
            """,
            (user["userId"], user["email"], user["name"]),
        )
        row = cur.fetchone()
        conn.commit()
        return {"id": row[0], "ssoId": row[1], "email": row[2], "username": row[3]}
    finally:
        conn.close()


# ---- Pydantic models ----

class DiaryCreate(BaseModel):
    planet: str
    title: str = ""
    content: str
    mood: str = ""
    visibility: str = "private"


class DiaryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood: Optional[str] = None
    visibility: Optional[str] = None


class CommentCreate(BaseModel):
    content: str


class ChatMessage(BaseModel):
    planet: str
    message: str
    history: list = []


# ---- API routes ----

@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/health")
def api_health():
    return {"ok": True, "service": "planet-diary"}


@app.get("/api/whoami")
def whoami(user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    return JSONResponse(u)


# ---- Diary CRUD ----

@app.get("/api/diaries")
def list_diaries(
    planet: Optional[str] = Query(None),
    user: dict = Depends(parse_user),
):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        if planet and planet in PLANETS:
            cur.execute(
                """
                SELECT id, user_id, planet, title, content, mood, visibility, created_at, updated_at
                FROM diaries WHERE user_id = %s AND planet = %s
                ORDER BY created_at DESC
                """,
                (u["id"], planet),
            )
        else:
            cur.execute(
                """
                SELECT id, user_id, planet, title, content, mood, visibility, created_at, updated_at
                FROM diaries WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (u["id"],),
            )
        rows = cur.fetchall()
        return {
            "diaries": [
                {
                    "id": r[0],
                    "userId": r[1],
                    "planet": r[2],
                    "title": r[3],
                    "content": r[4],
                    "mood": r[5],
                    "visibility": r[6],
                    "createdAt": r[7].isoformat() if r[7] else None,
                    "updatedAt": r[8].isoformat() if r[8] else None,
                }
                for r in rows
            ]
        }
    finally:
        conn.close()


@app.post("/api/diaries")
def create_diary(body: DiaryCreate, user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    if body.planet not in PLANETS:
        raise HTTPException(status_code=400, detail=f"invalid planet: {body.planet}")
    if body.visibility not in ("private", "friends", "public"):
        raise HTTPException(status_code=400, detail="invalid visibility")
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO diaries (user_id, planet, title, content, mood, visibility)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, planet, title, content, mood, visibility, created_at
            """,
            (u["id"], body.planet, body.title, body.content, body.mood, body.visibility),
        )
        r = cur.fetchone()
        conn.commit()
        return {
            "id": r[0],
            "planet": r[1],
            "title": r[2],
            "content": r[3],
            "mood": r[4],
            "visibility": r[5],
            "createdAt": r[6].isoformat() if r[6] else None,
        }
    finally:
        conn.close()


@app.delete("/api/diaries/{diary_id}")
def delete_diary(diary_id: int, user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM diaries WHERE id = %s AND user_id = %s",
            (diary_id, u["id"]),
        )
        conn.commit()
        return {"ok": True, "deleted": cur.rowcount}
    finally:
        conn.close()


# ---- Five Elements Balance ----

@app.get("/api/balance")
def get_balance(user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT planet, COUNT(*) as cnt
            FROM diaries
            WHERE user_id = %s AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY planet
            """,
            (u["id"],),
        )
        counts = {row[0]: row[1] for row in cur.fetchall()}
        for p in PLANETS:
            if p not in counts:
                counts[p] = 0
        total = sum(counts.values()) or 1

        sorted_planets = sorted(counts.items(), key=lambda x: x[1], reverse=True)
        dominant = sorted_planets[0][0] if sorted_planets[0][1] > 0 else None
        weak = None
        for p, c in reversed(sorted_planets):
            if c == 0 and dominant:
                weak = p
                break

        tip = None
        planet_names = {
            "mercury": "水星", "venus": "金星", "mars": "火星",
            "jupiter": "木星", "saturn": "土星",
        }
        if dominant and counts[dominant] > 0:
            max_count = counts[dominant]
            ke_target = KE.get(dominant)
            if ke_target and counts.get(ke_target, 0) < max_count * 0.3:
                ke_target_name = planet_names[ke_target]
                tip = f"{planet_names[dominant]}最近很活跃，{ke_target_name}有点安静——要不要平衡一下？"

        return {
            "counts": counts,
            "total": sum(counts.values()),
            "dominant": dominant,
            "weak": weak,
            "tip": tip,
            "sheng": SHENG,
            "ke": KE,
        }
    finally:
        conn.close()


# ---- Friends ----

@app.get("/api/friends")
def list_friends(user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT u.id, u.username, u.email
            FROM friendships f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = %s
            """,
            (u["id"],),
        )
        rows = cur.fetchall()
        return {
            "friends": [
                {"id": r[0], "username": r[1], "email": r[2]} for r in rows
            ]
        }
    finally:
        conn.close()


@app.post("/api/friends/{friend_email}")
def add_friend(friend_email: str, user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (friend_email,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="user not found")
        friend_id = row[0]
        if friend_id == u["id"]:
            raise HTTPException(status_code=400, detail="cannot friend yourself")
        cur.execute(
            """
            INSERT INTO friendships (user_id, friend_id) VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (u["id"], friend_id),
        )
        cur.execute(
            """
            INSERT INTO friendships (user_id, friend_id) VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            """,
            (friend_id, u["id"]),
        )
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()


# ---- Community Feed (friend circle) ----

@app.get("/api/feed")
def get_feed(user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT d.id, d.user_id, d.planet, d.title, d.content, d.mood,
                   d.visibility, d.created_at, u.username
            FROM diaries d
            JOIN users u ON d.user_id = u.id
            WHERE (
                d.user_id = %s
                AND d.visibility IN ('friends', 'public')
            )
            OR (
                d.user_id IN (SELECT friend_id FROM friendships WHERE user_id = %s)
                AND d.visibility IN ('friends', 'public')
            )
            ORDER BY d.created_at DESC
            LIMIT 50
            """,
            (u["id"], u["id"]),
        )
        rows = cur.fetchall()
        result = []
        for r in rows:
            diary_id = r[0]
            cur.execute(
                "SELECT COUNT(*) FROM diary_likes WHERE diary_id = %s",
                (diary_id,),
            )
            like_count = cur.fetchone()[0]
            cur.execute(
                "SELECT COUNT(*) FROM diary_comments WHERE diary_id = %s",
                (diary_id,),
            )
            comment_count = cur.fetchone()[0]
            cur.execute(
                "SELECT 1 FROM diary_likes WHERE diary_id = %s AND user_id = %s",
                (diary_id, u["id"]),
            )
            liked = cur.fetchone() is not None
            result.append({
                "id": diary_id,
                "userId": r[1],
                "planet": r[2],
                "title": r[3],
                "content": r[4],
                "mood": r[5],
                "visibility": r[6],
                "createdAt": r[7].isoformat() if r[7] else None,
                "authorName": r[8],
                "likeCount": like_count,
                "commentCount": comment_count,
                "liked": liked,
            })
        return {"feed": result}
    finally:
        conn.close()


@app.post("/api/diaries/{diary_id}/like")
def toggle_like(diary_id: int, user: dict = Depends(parse_user)):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM diary_likes WHERE diary_id = %s AND user_id = %s",
            (diary_id, u["id"]),
        )
        if cur.fetchone():
            cur.execute(
                "DELETE FROM diary_likes WHERE diary_id = %s AND user_id = %s",
                (diary_id, u["id"]),
            )
            liked = False
        else:
            cur.execute(
                "INSERT INTO diary_likes (diary_id, user_id) VALUES (%s, %s)",
                (diary_id, u["id"]),
            )
            liked = True
        conn.commit()
        return {"ok": True, "liked": liked}
    finally:
        conn.close()


@app.get("/api/diaries/{diary_id}/comments")
def list_comments(diary_id: int, user: dict = Depends(parse_user)):
    _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT c.id, c.diary_id, c.user_id, c.content, c.created_at, u.username
            FROM diary_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.diary_id = %s
            ORDER BY c.created_at ASC
            """,
            (diary_id,),
        )
        rows = cur.fetchall()
        return {
            "comments": [
                {
                    "id": r[0],
                    "diaryId": r[1],
                    "userId": r[2],
                    "content": r[3],
                    "createdAt": r[4].isoformat() if r[4] else None,
                    "authorName": r[5],
                }
                for r in rows
            ]
        }
    finally:
        conn.close()


@app.post("/api/diaries/{diary_id}/comments")
def add_comment(
    diary_id: int,
    body: CommentCreate,
    user: dict = Depends(parse_user),
):
    u = _get_or_create_user(user)
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO diary_comments (diary_id, user_id, content)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
            """,
            (diary_id, u["id"], body.content),
        )
        r = cur.fetchone()
        conn.commit()
        return {
            "id": r[0],
            "diaryId": diary_id,
            "userId": u["id"],
            "content": body.content,
            "createdAt": r[1].isoformat() if r[1] else None,
            "authorName": u["username"],
        }
    finally:
        conn.close()


# ---- AI Chat with Guardian ----

@app.post("/api/chat")
def chat(body: ChatMessage, user: dict = Depends(parse_user)):
    _get_or_create_user(user)
    if body.planet not in PLANETS and body.planet != "earth":
        raise HTTPException(status_code=400, detail="invalid planet")
    reply = chat_with_guardian(body.planet, body.message, body.history)
    return {"reply": reply}
