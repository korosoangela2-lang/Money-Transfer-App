import time
from functools import wraps

import jwt
from flask import current_app, g, jsonify, request

from .ids import gen_id
from .store import find_user, read_db

JWT_ALGORITHM = "HS256"


def issue_token(user_id):
    """Start a new server-tracked session and return (session_id, signed JWT).

    The session id is stored as the JWT's `jti` claim and as a key in
    db["sessions"], so logout/password-reset can still revoke a token
    before it expires even though the JWT itself is stateless.
    """
    session_id = gen_id("session")
    now = int(time.time())
    payload = {
        "sub": user_id,
        "jti": session_id,
        "iat": now,
        "exp": now + current_app.config["JWT_EXP_SECONDS"],
    }
    token = jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm=JWT_ALGORITHM)
    return session_id, token


def _bearer_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header[len("Bearer ") :].strip() or None


def _decode_token(token):
    try:
        return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=[JWT_ALGORITHM])
    except jwt.InvalidTokenError:
        return None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _bearer_token()
        payload = _decode_token(token) if token else None
        session_id = payload.get("jti") if payload else None

        db = read_db()
        user_id = db["sessions"].get(session_id) if session_id else None
        user = find_user(db, user_id) if user_id else None
        if not user:
            return jsonify({"error": "Not authenticated."}), 401
        if user["status"] == "suspended":
            return jsonify({"error": "This account has been suspended."}), 403
        g.current_user_id = user["id"]
        g.current_user = user
        g.session_id = session_id
        g.session_token = token
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    @login_required
    def wrapper(*args, **kwargs):
        if g.current_user["role"] != "admin":
            return jsonify({"error": "Admin access required."}), 403
        return fn(*args, **kwargs)

    return wrapper
