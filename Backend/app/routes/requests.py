from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..domain import new_money_request
from ..store import find_money_request, find_user, find_user_by_email, mutate_db, read_db
from .transactions import move_wallet_funds

bp = Blueprint("requests", __name__, url_prefix="/api/requests")


@bp.get("")
@login_required
def list_requests():
    db = read_db()
    all_requests = db.setdefault("moneyRequests", [])
    incoming = [r for r in all_requests if r["payerId"] == g.current_user_id]
    outgoing = [r for r in all_requests if r["requesterId"] == g.current_user_id]
    return jsonify({"incoming": incoming, "outgoing": outgoing})


@bp.post("")
@login_required
def create_request():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip()
    try:
        amount = float(body.get("amount") or 0)
    except (TypeError, ValueError):
        return jsonify({"error": "Enter an amount greater than zero."}), 400
    note = (body.get("note") or "").strip()

    if amount <= 0:
        return jsonify({"error": "Enter an amount greater than zero."}), 400
    if not email:
        return jsonify({"error": "Enter their Pay ID (email)."}), 400

    with mutate_db() as db:
        requester = find_user(db, g.current_user_id)
        if email.lower() == requester["email"].lower():
            return jsonify({"error": "You can't request money from yourself."}), 400

        payer = find_user_by_email(db, email)
        if not payer:
            return jsonify({"error": "No Heha account found with that Pay ID."}), 404

        req = new_money_request(
            requester_id=requester["id"], requester_name=requester["name"],
            payer_id=payer["id"], payer_name=payer["name"],
            amount=amount, note=note,
        )
        db.setdefault("moneyRequests", []).insert(0, req)

    return jsonify(req), 201


@bp.post("/<request_id>/pay")
@login_required
def pay_request(request_id):
    with mutate_db() as db:
        req = find_money_request(db, request_id)
        if not req or req["payerId"] != g.current_user_id:
            return jsonify({"error": "Request not found."}), 404
        if req["status"] != "pending":
            return jsonify({"error": "This request has already been settled."}), 400

        payer = find_user(db, req["payerId"])
        requester = find_user(db, req["requesterId"])
        if req["amount"] > payer["wallet"]["balance"]:
            return jsonify({"error": "That's more than your wallet balance."}), 400

        payer_tx, _ = move_wallet_funds(payer, requester, req["amount"])
        req["status"] = "paid"
        req["transactionId"] = payer_tx["id"]

    return jsonify({**req, "transaction": payer_tx})


@bp.post("/<request_id>/decline")
@login_required
def decline_request(request_id):
    with mutate_db() as db:
        req = find_money_request(db, request_id)
        if not req or req["payerId"] != g.current_user_id:
            return jsonify({"error": "Request not found."}), 404
        if req["status"] != "pending":
            return jsonify({"error": "This request has already been settled."}), 400

        req["status"] = "declined"

    return jsonify(req)
