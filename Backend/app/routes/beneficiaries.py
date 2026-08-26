from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..domain import new_beneficiary
from ..store import find_beneficiary, find_user, mutate_db, read_db

bp = Blueprint("beneficiaries", __name__, url_prefix="/api/beneficiaries")


@bp.get("")
@login_required
def list_beneficiaries():
    db = read_db()
    user = find_user(db, g.current_user_id)
    return jsonify(user["beneficiaries"])


@bp.post("")
@login_required
def add_beneficiary():
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    currency = (body.get("currency") or "").strip()
    method = (body.get("method") or "").strip()
    if not name or not currency or not method:
        return jsonify({"error": "name, currency and method are required."}), 400

    with mutate_db() as db:
        user = find_user(db, g.current_user_id)
        beneficiary = new_beneficiary(
            name=name,
            relation=body.get("relation") or "",
            currency=currency,
            country=body.get("country") or "",
            flag=body.get("flag") or "",
            method=method,
            account=body.get("account") or "",
            bank=body.get("bank") or "",
        )
        user["beneficiaries"].insert(0, beneficiary)

    return jsonify(beneficiary), 201


@bp.delete("/<beneficiary_id>")
@login_required
def remove_beneficiary(beneficiary_id):
    with mutate_db() as db:
        user = find_user(db, g.current_user_id)
        beneficiary = find_beneficiary(user, beneficiary_id)
        if not beneficiary:
            return jsonify({"error": "Beneficiary not found."}), 404
        user["beneficiaries"] = [b for b in user["beneficiaries"] if b["id"] != beneficiary_id]
        # leave past transactions intact, just drop the dangling reference
        for t in user["transactions"]:
            if t.get("beneficiaryId") == beneficiary_id:
                t["beneficiaryId"] = None

    return jsonify({"id": beneficiary_id})
