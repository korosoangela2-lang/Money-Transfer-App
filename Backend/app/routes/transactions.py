from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..constants import BASE_RATES, PAYOUT_METHODS
from ..domain import new_transaction
from ..pricing import quote, round2
from ..rates_store import current_pairs
from ..store import find_beneficiary, find_user, find_user_by_email, mutate_db, read_db

bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")
transfers_bp = Blueprint("transfers", __name__, url_prefix="/api/transfers")


def move_wallet_funds(sender, recipient, amount, *, sender_name=None, recipient_name=None):
    """Debits `sender`, credits `recipient` by `amount` (same currency, no fee/FX), and
    records a completed transaction on each side. Shared by direct P2P sends and paying
    a money request. Caller is responsible for balance/status checks beforehand."""
    sender_tx = new_transaction(type="p2p_out", status="completed", name=f"To {recipient_name or recipient['name']}",
                                 amount=amount, currency=sender["wallet"]["currency"])
    recipient_tx = new_transaction(type="p2p_in", status="completed", name=f"From {sender_name or sender['name']}",
                                    amount=amount, currency=recipient["wallet"]["currency"])

    sender["wallet"]["balance"] = round2(sender["wallet"]["balance"] - amount)
    recipient["wallet"]["balance"] = round2(recipient["wallet"]["balance"] + amount)
    sender["transactions"].insert(0, sender_tx)
    recipient["transactions"].insert(0, recipient_tx)
    return sender_tx, recipient_tx


@bp.get("")
@login_required
def list_transactions():
    db = read_db()
    user = find_user(db, g.current_user_id)
    return jsonify(user["transactions"])


@transfers_bp.post("")
@login_required
def send_money():
    body = request.get_json(silent=True) or {}
    beneficiary_id = body.get("beneficiaryId")
    try:
        amount = float(body.get("amount") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Enter an amount greater than zero."}), 400
    method = body.get("method") or "mobile"

    if method not in PAYOUT_METHODS:
        return jsonify({"error": "Unknown payout method."}), 400
    if amount <= 0:
        return jsonify({"error": "Enter an amount greater than zero."}), 400

    with mutate_db() as db:
        user = find_user(db, g.current_user_id)
        beneficiary = find_beneficiary(user, beneficiary_id)
        if not beneficiary:
            return jsonify({"error": "Beneficiary not found."}), 404

        pairs = current_pairs()
        rate = pairs.get(beneficiary["currency"]) or BASE_RATES.get(beneficiary["currency"], 1.0)

        q = quote(amount, rate)
        if q["total"] > user["wallet"]["balance"]:
            return jsonify({"error": "That's more than your wallet balance."}), 400

        tx = new_transaction(
            type="send",
            status="pending",
            beneficiary_id=beneficiary["id"],
            name=beneficiary["name"],
            amount=q["send"],
            currency=beneficiary["currency"],
            rate=q["rate"],
            fee=q["fee"],
            spread_revenue=q["spreadRevenue"],
            received=q["received"],
            method=method,
        )
        user["wallet"]["balance"] = round2(user["wallet"]["balance"] - q["total"])
        user["transactions"].insert(0, tx)

    return jsonify(tx), 201


@transfers_bp.post("/to-user")
@login_required
def send_to_user():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip()
    try:
        amount = round2(float(body.get("amount") or 0))
    except (TypeError, ValueError):
        return jsonify({"error": "Enter an amount greater than zero."}), 400

    if amount <= 0:
        return jsonify({"error": "Enter an amount greater than zero."}), 400
    if not email:
        return jsonify({"error": "Enter the recipient's Pay ID (email)."}), 400

    with mutate_db() as db:
        sender = find_user(db, g.current_user_id)
        if email.lower() == sender["email"].lower():
            return jsonify({"error": "You can't send money to yourself."}), 400

        recipient = find_user_by_email(db, email)
        if not recipient:
            return jsonify({"error": "No Halcyon account found with that Pay ID."}), 404
        if recipient["status"] == "suspended":
            return jsonify({"error": "That account can't receive money right now."}), 400
        if amount > sender["wallet"]["balance"]:
            return jsonify({"error": "That's more than your wallet balance."}), 400

        sender_tx, _ = move_wallet_funds(sender, recipient, amount)

    return jsonify(sender_tx), 201
