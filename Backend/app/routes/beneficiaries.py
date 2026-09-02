from flask import Blueprint, g, jsonify, request

from ..auth import login_required
from ..domain import new_beneficiary
from ..store import find_beneficiary, find_user, mutate_db, read_db

bp = Blueprint("beneficiaries", __name__, url_prefix="/api/beneficiaries")


@bp.get("")
@login_required
def list_beneficiaries():
    """List the current user's saved beneficiaries.
    ---
    tags:
      - Beneficiaries
    security:
      - Bearer: []
    responses:
      200:
        description: The current user's beneficiaries.
        schema:
          type: array
          items:
            $ref: '#/definitions/Beneficiary'
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
    """
    db = read_db()
    user = find_user(db, g.current_user_id)
    return jsonify(user["beneficiaries"])


@bp.post("")
@login_required
def add_beneficiary():
    """Add a new beneficiary.
    ---
    tags:
      - Beneficiaries
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, currency, method]
          properties:
            name:
              type: string
              example: John Smith
            relation:
              type: string
              example: Brother
            currency:
              type: string
              example: KES
            country:
              type: string
              example: Kenya
            flag:
              type: string
              example: 🇰🇪
            method:
              type: string
              enum: [mobile, bank, cash]
            account:
              type: string
              example: "0712345678"
            bank:
              type: string
    responses:
      201:
        description: The newly created beneficiary.
        schema:
          $ref: '#/definitions/Beneficiary'
      400:
        description: name, currency, and method are required.
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Remove a beneficiary.

    Past transactions referencing this beneficiary are kept, with their
    `beneficiaryId` cleared.
    ---
    tags:
      - Beneficiaries
    security:
      - Bearer: []
    parameters:
      - in: path
        name: beneficiary_id
        type: string
        required: true
    responses:
      200:
        description: The id of the removed beneficiary.
        schema:
          type: object
          properties:
            id:
              type: string
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Beneficiary not found.
        schema:
          $ref: '#/definitions/Error'
    """
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
