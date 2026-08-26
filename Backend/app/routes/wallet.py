from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..domain import new_transaction
from ..pricing import round2
from ..store import find_user, mutate_db

bp = Blueprint("wallet", __name__, url_prefix="/api/wallet")


@bp.post("/add-funds")
@login_required
def add_funds():
    body = request.get_json(silent=True) or {}
    try:
        amount = float(body.get("amount") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Enter an amount greater than zero."}), 400
    source = body.get("source") or "Card"

    if amount <= 0:
        return jsonify({"error": "Enter an amount greater than zero."}), 400

    with mutate_db() as db:
        user = find_user(db, g.current_user_id)
        tx = new_transaction(type="topup", status="completed", name=f"Top up · {source}", amount=amount, fee=0, spread_revenue=0)
        user["wallet"]["balance"] = round2(user["wallet"]["balance"] + amount)
        user["transactions"].insert(0, tx)

    return jsonify(tx), 201


@bp.post("/withdraw")
@login_required
def withdraw():
    body = request.get_json(silent=True) or {}
    try:
        amount = float(body.get("amount") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Enter an amount greater than zero."}), 400
    destination = body.get("destination") or "Card"

    if amount <= 0:
        return jsonify({"error": "Enter an amount greater than zero."}), 400

    with mutate_db() as db:
        user = find_user(db, g.current_user_id)
        if amount > user["wallet"]["balance"]:
            return jsonify({"error": "That's more than your wallet balance."}), 400
        tx = new_transaction(type="withdrawal", status="completed", name=f"Withdraw · {destination}", amount=amount, fee=0, spread_revenue=0)
        user["wallet"]["balance"] = round2(user["wallet"]["balance"] - amount)
        user["transactions"].insert(0, tx)

    return jsonify(tx), 201
