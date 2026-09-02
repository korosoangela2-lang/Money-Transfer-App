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
    """Admin console data: users, send transactions, and monthly revenue.

    Revenue covers the trailing 6 months (oldest to newest).
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: Aggregated console data.
        schema:
          type: object
          properties:
            users:
              type: array
              items:
                allOf:
                  - $ref: '#/definitions/User'
                  - type: object
                    properties:
                      balance:
                        type: number
                        format: float
                      sends:
                        type: integer
                      volume:
                        type: number
                        format: float
            transactions:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                  user:
                    type: string
                  corridor:
                    type: string
                    example: "CAD ▸ KES"
                  amount:
                    type: number
                    format: float
                  fee:
                    type: number
                    format: float
                  spreadRevenue:
                    type: number
                    format: float
                  status:
                    type: string
                  createdAt:
                    type: string
                    format: date-time
            revenue:
              type: array
              items:
                type: object
                properties:
                  month:
                    type: string
                    example: Aug
                  fees:
                    type: number
                    format: float
                  spread:
                    type: number
                    format: float
                  volume:
                    type: number
                    format: float
                  transfers:
                    type: integer
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Admin access required.
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Create a user account (admin only).

    If `password` is omitted, a random one is generated.
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, email]
          properties:
            name:
              type: string
            email:
              type: string
            phone:
              type: string
            country:
              type: string
              default: Canada
            role:
              type: string
              enum: [user, admin]
              default: user
            kyc:
              type: string
              enum: [unverified, pending, verified]
              default: unverified
            status:
              type: string
              enum: [active, suspended]
              default: active
            password:
              type: string
              format: password
    responses:
      201:
        description: The newly created user's public profile.
        schema:
          $ref: '#/definitions/User'
      400:
        description: name and email are required.
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Admin access required.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: An account with that email already exists.
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Update a user account (admin only).

    Any of `name`, `phone`, `country`, `role`, `kyc`, `status`, `balance`
    may be included; only the provided fields are changed.
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: string
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            phone:
              type: string
            country:
              type: string
            role:
              type: string
              enum: [user, admin]
            kyc:
              type: string
              enum: [unverified, pending, verified]
            status:
              type: string
              enum: [active, suspended]
            balance:
              type: number
              format: float
    responses:
      200:
        description: The user id and the patch that was applied.
        schema:
          type: object
          properties:
            id:
              type: string
            patch:
              type: object
      400:
        description: Balance must be a non-negative number.
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Admin access required.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: User not found.
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Delete a user account (admin only).

    Also invalidates any active sessions for that user.
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: string
        required: true
    responses:
      200:
        description: The id of the deleted user.
        schema:
          type: object
          properties:
            id:
              type: string
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Admin access required.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: User not found.
        schema:
          $ref: '#/definitions/Error'
    """
    with mutate_db() as db:
        user = find_user(db, user_id)
        if not user:
            return jsonify({"error": "User not found."}), 404
        db["users"] = [u for u in db["users"] if u["id"] != user_id]
        db["sessions"] = {tok: uid for tok, uid in db["sessions"].items() if uid != user_id}

    return jsonify({"id": user_id})
