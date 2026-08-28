import secrets
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from ..auth import admin_required
from ..domain import new_user, public_user
from ..pricing import round2
from ..store import find_user, find_user_by_email, mutate_db, read_db

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _year_month_n_ago(n):
    d = datetime.now(timezone.utc)
    month = d.month - n
    year = d.year
    while month <= 0:
        month += 12
        year -= 1
    return (year, month)


@bp.get("/data")
@admin_required
def admin_data():
    db = read_db()
    users = db["users"]

    user_rows = []
    for u in users:
        sends = [t for t in u["transactions"] if t["type"] == "send"]
        volume = sum(t["amount"] for t in sends if t["status"] != "failed")
        user_rows.append({**public_user(u), "balance": u["wallet"]["balance"], "sends": len(sends), "volume": round2(volume)})

    tx_rows = []
    for u in users:
        for t in u["transactions"]:
            if t["type"] != "send":
                continue
            tx_rows.append(
                {
                    "id": t["id"],
                    "user": u["name"],
                    "corridor": f"CAD ▸ {t['currency']}",
                    "amount": t["amount"],
                    "fee": t["fee"],
                    "spreadRevenue": t["spreadRevenue"],
                    "status": t["status"],
                    "createdAt": t["createdAt"],
                }
            )
    tx_rows.sort(key=lambda t: t["createdAt"], reverse=True)

    order = [_year_month_n_ago(i) for i in range(5, -1, -1)]
    buckets = {key: {"fees": 0.0, "spread": 0.0, "volume": 0.0, "transfers": 0} for key in order}

    for t in tx_rows:
        if t["status"] == "failed":
            continue
        created = datetime.fromisoformat(t["createdAt"])
        bucket = buckets.get((created.year, created.month))
        if not bucket:
            continue
        bucket["fees"] = round2(bucket["fees"] + t["fee"])
        bucket["spread"] = round2(bucket["spread"] + t["spreadRevenue"])
        bucket["volume"] = round2(bucket["volume"] + t["amount"])
        bucket["transfers"] += 1

    revenue = [{"month": datetime(year, month, 1, tzinfo=timezone.utc).strftime("%b"), **buckets[(year, month)]} for year, month in order]

    return jsonify({"users": user_rows, "transactions": tx_rows, "revenue": revenue})


@bp.post("/users")
@admin_required
def create_user():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip()
    name = (body.get("name") or "").strip()
    if not email or not name:
        return jsonify({"error": "name and email are required."}), 400

    with mutate_db() as db:
        if find_user_by_email(db, email):
            return jsonify({"error": "An account with that email already exists."}), 409
        user = new_user(
            name=name,
            email=email,
            phone=body.get("phone") or "",
            country=body.get("country") or "Canada",
            role=body.get("role") or "user",
            kyc=body.get("kyc") or "unverified",
            status=body.get("status") or "active",
            password=body.get("password") or secrets.token_urlsafe(12),
        )
        db["users"].append(user)
        result = public_user(user)

    return jsonify(result), 201


@bp.patch("/users/<user_id>")
@admin_required
def update_user(user_id):
    patch = request.get_json(silent=True) or {}
    with mutate_db() as db:
        user = find_user(db, user_id)
        if not user:
            return jsonify({"error": "User not found."}), 404
        for key in ("name", "phone", "country", "role", "kyc", "status"):
            if key in patch and patch[key] is not None:
                user[key] = patch[key]
        if "balance" in patch and patch["balance"] is not None:
            try:
                balance = round2(float(patch["balance"]))
            except (TypeError, ValueError):
                return jsonify({"error": "Balance must be a number."}), 400
            if balance < 0:
                return jsonify({"error": "Balance can't be negative."}), 400
            user["wallet"]["balance"] = balance
            patch["balance"] = balance

    return jsonify({"id": user_id, "patch": patch})


@bp.delete("/users/<user_id>")
@admin_required
def delete_user(user_id):
    with mutate_db() as db:
        user = find_user(db, user_id)
        if not user:
            return jsonify({"error": "User not found."}), 404
        db["users"] = [u for u in db["users"] if u["id"] != user_id]
        db["sessions"] = {tok: uid for tok, uid in db["sessions"].items() if uid != user_id}

    return jsonify({"id": user_id})
