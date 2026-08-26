from functools import wraps

from flask import g, jsonify, request

from .store import find_user, read_db


def _bearer_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header[len("Bearer ") :].strip() or None


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _bearer_token()
        db = read_db()
        user_id = db["sessions"].get(token) if token else None
        user = find_user(db, user_id) if user_id else None
        if not user:
            return jsonify({"error": "Not authenticated."}), 401
        if user["status"] == "suspended":
            return jsonify({"error": "This account has been suspended."}), 403
        g.current_user_id = user["id"]
        g.current_user = user
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
