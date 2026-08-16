"""Idempotent DDL — called on app startup."""
from __future__ import annotations

from .db import get_conn


def init_db():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                sso_id TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS friendships (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, friend_id)
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS diaries (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                planet TEXT NOT NULL,
                title TEXT DEFAULT '',
                content TEXT NOT NULL,
                mood TEXT DEFAULT '',
                visibility TEXT NOT NULL DEFAULT 'private',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_diaries_user_planet
            ON diaries(user_id, planet);
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_diaries_created
            ON diaries(created_at DESC);
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS diary_likes (
                id SERIAL PRIMARY KEY,
                diary_id INTEGER NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(diary_id, user_id)
            );
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS diary_comments (
                id SERIAL PRIMARY KEY,
                diary_id INTEGER NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        conn.commit()
    finally:
        conn.close()
