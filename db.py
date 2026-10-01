#!/usr/bin/env python3
"""
VirtualStage AI - Database Engine
Uses SQLite3 for zero-dependency, production-grade persistent data storage:
- User Authentication (password hashing with salt)
- Credit Balances & Subscription Tier Tracking
- Real-time Usage Events & Analytics
- Staged Photos Render History
- Payment Transactions
"""

import sqlite3
import os
import hashlib
import secrets
import time
import json

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "virtualstage.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    conn = get_connection()
    with conn:
        # 1. Users Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                name TEXT NOT NULL,
                brokerage TEXT DEFAULT '',
                plan TEXT DEFAULT 'free_trial',
                credits_balance INTEGER DEFAULT 3,
                session_token TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Staged Renders History
        conn.execute("""
            CREATE TABLE IF NOT EXISTS staged_renders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                room_type TEXT NOT NULL,
                style TEXT NOT NULL,
                prompt TEXT DEFAULT '',
                image_url TEXT NOT NULL,
                before_url TEXT DEFAULT '',
                mls_compliant INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 3. Usage & Analytics Events
        conn.execute("""
            CREATE TABLE IF NOT EXISTS usage_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                event_type TEXT NOT NULL,
                property_address TEXT DEFAULT '',
                metadata TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 4. Transactions Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                plan TEXT NOT NULL,
                amount REAL NOT NULL,
                credits_added INTEGER NOT NULL,
                status TEXT DEFAULT 'completed',
                stripe_session_id TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # Pre-seed demo user if empty
        cur = conn.execute("SELECT COUNT(*) as count FROM users;")
        if cur.fetchone()["count"] == 0:
            create_user("demo@virtualstage.ai", "demo1234", "Sarah Jenkins", "Keller Williams Beverly Hills", initial_credits=15, plan="power_monthly")
    conn.close()
    seed_demo_data_if_needed()

def seed_demo_data_if_needed():
    conn = get_connection()
    try:
        user = conn.execute("SELECT id FROM users WHERE email = 'demo@virtualstage.ai';").fetchone()
        if not user:
            return
        uid = user["id"]
        cur = conn.execute("SELECT COUNT(*) as count FROM staged_renders WHERE user_id = ?", (uid,))
        if cur.fetchone()["count"] < 3:
            sample_renders = [
                (uid, "living", "modern", "High-ceiling open-concept living room with low sofa and neutral rug", "assets/hero_staged.jpg", "assets/hero_empty.jpg"),
                (uid, "bedroom", "modern", "Primary suite with king platform bed and organic linen duvet", "assets/bedroom_staged.jpg", "assets/bedroom_empty.jpg"),
                (uid, "dining", "scandi", "Executive dining room with 8 Scandinavian oak chairs", "assets/dining_staged.jpg", "assets/dining_empty.jpg"),
                (uid, "office", "industrial", "WFH executive office with walnut desk and matte black task lamp", "assets/office_staged.jpg", "assets/office_empty.jpg"),
                (uid, "twilight", "warm", "Luxury day-to-dusk twilight exterior with golden glowing windows", "assets/twilight_dusk.jpg", "assets/twilight_day.jpg")
            ]
            with conn:
                for r in sample_renders:
                    conn.execute("""
                        INSERT INTO staged_renders (user_id, room_type, style, prompt, image_url, before_url)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, r)
                events = [
                    (uid, "download_4k", "9444 Wilshire Blvd, Beverly Hills", json.dumps({"resolution": "4K", "file": "living_modern.jpg"})),
                    (uid, "download_4k", "10280 Sunset Blvd, Bel Air", json.dumps({"resolution": "4K", "file": "bedroom_modern.jpg"})),
                    (uid, "cert_generate", "9444 Wilshire Blvd, Beverly Hills", json.dumps({"cert_id": "MLS-9444-NAR12", "standard": "NAR 12-10"})),
                    (uid, "cert_generate", "10280 Sunset Blvd, Bel Air", json.dumps({"cert_id": "MLS-1028-NAR12", "standard": "NAR 12-10"})),
                    (uid, "zillow_snipe", "312 Elm Dr, Beverly Hills", json.dumps({"dom": "47", "agent": "Compass Team"})),
                    (uid, "zillow_snipe", "855 Ocean Ave, Santa Monica", json.dumps({"dom": "62", "agent": "Coldwell Banker"}))
                ]
                for e in events:
                    conn.execute("""
                        INSERT INTO usage_events (user_id, event_type, property_address, metadata)
                        VALUES (?, ?, ?, ?)
                    """, e)
                txs = [
                    (uid, "power_monthly", 79.00, 60, "completed", "sub_1Qk49xL"),
                    (uid, "starter", 29.00, 10, "completed", "ch_3Nk99aP")
                ]
                for t in txs:
                    conn.execute("""
                        INSERT INTO transactions (user_id, plan, amount, credits_added, status, stripe_session_id)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, t)
    finally:
        conn.close()

def hash_password(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return hashed, salt

def create_user(email, password, name, brokerage="", initial_credits=3, plan="free_trial"):
    email = email.strip().lower()
    name = name.strip()
    pwd_hash, salt = hash_password(password)
    session_token = secrets.token_hex(32)

    conn = get_connection()
    try:
        with conn:
            cur = conn.execute("""
                INSERT INTO users (email, password_hash, salt, name, brokerage, plan, credits_balance, session_token)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (email, pwd_hash, salt, name, brokerage, plan, initial_credits, session_token))
            user_id = cur.lastrowid
            # Track signup event
            conn.execute("""
                INSERT INTO usage_events (user_id, event_type, metadata)
                VALUES (?, 'signup', ?)
            """, (user_id, json.dumps({"initial_credits": initial_credits, "plan": plan})))
            return get_user_by_id(user_id)
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def authenticate_user(email, password):
    email = email.strip().lower()
    conn = get_connection()
    try:
        cur = conn.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cur.fetchone()
        if not user:
            return None
        computed_hash, _ = hash_password(password, user["salt"])
        if computed_hash == user["password_hash"]:
            new_token = secrets.token_hex(32)
            with conn:
                conn.execute("UPDATE users SET session_token = ? WHERE id = ?", (new_token, user["id"]))
            return get_user_by_id(user["id"])
        return None
    finally:
        conn.close()

def get_user_by_token(token):
    if not token:
        return None
    conn = get_connection()
    try:
        cur = conn.execute("SELECT id, email, name, brokerage, plan, credits_balance, session_token, created_at FROM users WHERE session_token = ?", (token,))
        row = cur.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()

def get_user_by_id(user_id):
    conn = get_connection()
    try:
        cur = conn.execute("SELECT id, email, name, brokerage, plan, credits_balance, session_token, created_at FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def invalidate_token(token):
    if not token:
        return
    conn = get_connection()
    try:
        with conn:
            conn.execute("UPDATE users SET session_token = NULL WHERE session_token = ?", (token,))
    finally:
        conn.close()

def add_user_credits(user_id, amount, plan_name=None):
    conn = get_connection()
    try:
        with conn:
            if plan_name:
                conn.execute("""
                    UPDATE users 
                    SET credits_balance = MAX(0, credits_balance + ?),
                        plan = ?
                    WHERE id = ?
                """, (amount, plan_name, user_id))
            else:
                conn.execute("""
                    UPDATE users 
                    SET credits_balance = MAX(0, credits_balance + ?)
                    WHERE id = ?
                """, (amount, user_id))
        return get_user_by_id(user_id)
    finally:
        conn.close()

def log_staged_render(user_id, room_type, style, prompt, image_url, before_url=""):
    conn = get_connection()
    try:
        with conn:
            cur = conn.execute("""
                INSERT INTO staged_renders (user_id, room_type, style, prompt, image_url, before_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, room_type, style, prompt, image_url, before_url))
            render_id = cur.lastrowid
            if user_id:
                # Deduct 1 credit for staged render
                conn.execute("UPDATE users SET credits_balance = MAX(0, credits_balance - 1) WHERE id = ?", (user_id,))
                # Log usage event
                conn.execute("""
                    INSERT INTO usage_events (user_id, event_type, metadata)
                    VALUES (?, 'stage_render', ?)
                """, (user_id, json.dumps({"render_id": render_id, "room": room_type, "style": style})))
            return render_id
    finally:
        conn.close()

def log_usage_event(user_id, event_type, property_address="", metadata=None):
    conn = get_connection()
    try:
        meta_str = json.dumps(metadata or {})
        with conn:
            conn.execute("""
                INSERT INTO usage_events (user_id, event_type, property_address, metadata)
                VALUES (?, ?, ?, ?)
            """, (user_id, event_type, property_address, meta_str))
    finally:
        conn.close()

def log_transaction(user_id, plan, amount, credits_added, status="completed", stripe_session_id=""):
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                INSERT INTO transactions (user_id, plan, amount, credits_added, status, stripe_session_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, plan, amount, credits_added, status, stripe_session_id))
            if user_id and credits_added > 0:
                conn.execute("""
                    UPDATE users SET credits_balance = credits_balance + ?, plan = ? WHERE id = ?
                """, (credits_added, plan, user_id))
    finally:
        conn.close()

def get_user_dashboard_data(user_id):
    conn = get_connection()
    try:
        user = get_user_by_id(user_id)
        if not user:
            return None

        # Stats
        cur = conn.execute("SELECT COUNT(*) as total_renders FROM staged_renders WHERE user_id = ?", (user_id,))
        total_renders = cur.fetchone()["total_renders"]

        cur = conn.execute("SELECT COUNT(*) as certs_generated FROM usage_events WHERE user_id = ? AND event_type = 'cert_generate'", (user_id,))
        certs_generated = cur.fetchone()["certs_generated"]

        cur = conn.execute("SELECT COUNT(*) as downloads_4k FROM usage_events WHERE user_id = ? AND event_type = 'download_4k'", (user_id,))
        downloads_4k = cur.fetchone()["downloads_4k"]

        cur = conn.execute("SELECT COUNT(*) as zillow_snipes FROM usage_events WHERE user_id = ? AND event_type = 'zillow_snipe'", (user_id,))
        zillow_snipes = cur.fetchone()["zillow_snipes"]

        # Renders History (Last 12)
        cur = conn.execute("""
            SELECT id, room_type, style, image_url, before_url, created_at 
            FROM staged_renders 
            WHERE user_id = ? 
            ORDER BY id DESC LIMIT 12
        """, (user_id,))
        renders = [dict(r) for r in cur.fetchall()]

        # Recent Transactions
        cur = conn.execute("""
            SELECT id, plan, amount, credits_added, status, created_at 
            FROM transactions 
            WHERE user_id = ? 
            ORDER BY id DESC LIMIT 5
        """, (user_id,))
        transactions = [dict(t) for t in cur.fetchall()]

        return {
            "user": user,
            "stats": {
                "total_renders": total_renders,
                "credits_balance": user["credits_balance"],
                "certs_generated": certs_generated,
                "downloads_4k": downloads_4k,
                "zillow_snipes": zillow_snipes
            },
            "recent_renders": renders,
            "recent_transactions": transactions
        }
    finally:
        conn.close()

# Auto-initialize database schema on module load
init_db()
