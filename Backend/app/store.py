import json
import os
import threading
from contextlib import contextmanager

from flask import current_app

_lock = threading.Lock()


def _path():
    return current_app.config["DB_FILE"]


def write_db(db):
    path = _path()
    tmp = f"{path}.tmp"
    with open(tmp, "w") as f:
        json.dump(db, f, indent=2)
    os.replace(tmp, path)  


def read_db():
    path = _path()
    if not os.path.exists(path):
        from .seed import build_seed_db

        db = build_seed_db()
        write_db(db)
        return db
    with open(path) as f:
        return json.load(f)


@contextmanager
def mutate_db():
    """Load, yield for in-place mutation, then persist — serialized across requests."""
    with _lock:
        db = read_db()
        yield db
        write_db(db)


def find_user(db, user_id):
    return next((u for u in db["users"] if u["id"] == user_id), None)


def find_user_by_email(db, email):
    email = (email or "").lower()
    return next((u for u in db["users"] if u["email"].lower() == email), None)


def find_beneficiary(user, beneficiary_id):
    return next((b for b in user["beneficiaries"] if b["id"] == beneficiary_id), None)

def find_money_request(db, request_id):
    return next((r for r in db.setdefault("moneyRequests", []) if r["id"] == request_id), None)
