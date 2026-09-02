import re
import secrets
import time

from flask import Blueprint, current_app, g, jsonify, request

from ..auth import issue_token, login_required
from ..domain import check_password, new_user, public_user, set_password
from ..login_throttle import record_failure, record_success, seconds_locked
from ..store import find_user, find_user_by_email, mutate_db, read_db

RESET_TOKEN_TTL_SECONDS = 30 * 60

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _session_payload(user, token):
    return {
        "token": token,
        "user": public_user(user),
        "wallet": user["wallet"],
        "beneficiaries": user["beneficiaries"],
        "transactions": user["transactions"],
    }


@bp.post("/register")
def register():
    """Register a new user.
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [name, email, phone, password]
          properties:
            name:
              type: string
              example: Jane Doe
            email:
              type: string
              example: jane@example.com
            phone:
              type: string
              example: "+15145550123"
            country:
              type: string
              example: Canada
            password:
              type: string
              format: password
              example: correct-horse-battery-staple
    responses:
      201:
        description: Account created; returns a session token plus the new user's wallet, beneficiaries, and transactions.
        schema:
          $ref: '#/definitions/Session'
      400:
        description: Missing or invalid fields.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: An account with that email already exists.
        schema:
          $ref: '#/definitions/Error'
    """
    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip()
    phone = (body.get("phone") or "").strip()
    country = (body.get("country") or "Canada").strip()
    password = body.get("password") or ""

    if not phone or len(re.sub(r"\D", "", phone)) < 9:
        return jsonify({"error": "Enter a phone number with at least 9 digits."}), 400
    if not email:
        return jsonify({"error": "Enter an email address."}), 400
    if not password or len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if not name:
        return jsonify({"error": "Enter your name."}), 400

    with mutate_db() as db:
        if find_user_by_email(db, email):
            return jsonify({"error": "An account with that email already exists."}), 409
        user = new_user(name=name, email=email, phone=phone, country=country or "Canada", password=password)
        db["users"].append(user)
        session_id, token = issue_token(user["id"])
        db["sessions"][session_id] = user["id"]
        payload = _session_payload(user, token)

    return jsonify(payload), 201


@bp.post("/login")
def login():
    """Log in with email and password.
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [email, password]
          properties:
            email:
              type: string
              example: jane@example.com
            password:
              type: string
              format: password
    responses:
      200:
        description: Session token plus the user's wallet, beneficiaries, and transactions.
        schema:
          $ref: '#/definitions/Session'
      400:
        description: Missing email or password.
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Incorrect password.
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Account is suspended.
        schema:
          $ref: '#/definitions/Error'
      404:
        description: No account found with that email.
        schema:
          $ref: '#/definitions/Error'
      429:
        description: Too many failed attempts; account temporarily throttled.
        schema:
          $ref: '#/definitions/Error'
    """
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Enter both your email and password."}), 400

    throttle_key = email.lower()
    wait = seconds_locked(throttle_key)
    if wait:
        minutes = max(1, (wait + 59) // 60)
        return jsonify({"error": f"Too many failed attempts. Try again in {minutes} minute(s)."}), 429

    with mutate_db() as db:
        user = find_user_by_email(db, email)
        if not user:
            record_failure(throttle_key)
            return jsonify({"error": "No account found with that email."}), 404
        if not check_password(user, password):
            record_failure(throttle_key)
            return jsonify({"error": "Incorrect password."}), 401
        if user["status"] == "suspended":
            return jsonify({"error": "This account has been suspended."}), 403
        session_id, token = issue_token(user["id"])
        db["sessions"][session_id] = user["id"]
        payload = _session_payload(user, token)

    record_success(throttle_key)
    return jsonify(payload)


@bp.post("/forgot-password")
def forgot_password():
    """Request a password reset link.

    Always responds with the same generic message, whether or not the
    email is registered, so this endpoint can't be used to enumerate accounts.
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
              example: jane@example.com
    responses:
      200:
        description: Generic confirmation message (sent regardless of whether the account exists).
        schema:
          type: object
          properties:
            message:
              type: string
              example: If an account exists for that email, a reset link has been sent.
    """
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip()
    generic = {"message": "If an account exists for that email, a reset link has been sent."}

    if not email:
        return jsonify(generic)

    with mutate_db() as db:
        user = find_user_by_email(db, email)
        if user:
            token = secrets.token_urlsafe(32)
            db.setdefault("passwordResets", {})[token] = {
                "userId": user["id"],
                "expiresAt": time.time() + RESET_TOKEN_TTL_SECONDS,
            }
            reset_link = f"{current_app.config['CORS_ORIGIN']}/reset-password?token={token}"
            # No email provider configured for local dev — log the link instead,
            # the same way Frontend/server/'s M-Pesa setup requires you to bring
            # your own credentials in production.
            current_app.logger.warning("Password reset link for %s: %s", user["email"], reset_link)

    return jsonify(generic)


@bp.post("/reset-password")
def reset_password():
    """Reset a password using a reset token.
    ---
    tags:
      - Auth
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [token, password]
          properties:
            token:
              type: string
            password:
              type: string
              format: password
    responses:
      200:
        description: Password reset; any existing sessions for the account are invalidated.
        schema:
          type: object
          properties:
            message:
              type: string
      400:
        description: Password too short, or the reset link is invalid/expired.
        schema:
          $ref: '#/definitions/Error'
    """
    body = request.get_json(silent=True) or {}
    token = body.get("token") or ""
    password = body.get("password") or ""

    if not password or len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400

    with mutate_db() as db:
        resets = db.setdefault("passwordResets", {})
        entry = resets.get(token)
        if not entry or entry["expiresAt"] < time.time():
            resets.pop(token, None)
            return jsonify({"error": "That reset link is invalid or has expired."}), 400

        user = find_user(db, entry["userId"])
        resets.pop(token, None)
        if not user:
            return jsonify({"error": "That reset link is invalid or has expired."}), 400

        set_password(user, password)
        db["sessions"] = {tok: uid for tok, uid in db["sessions"].items() if uid != user["id"]}

    return jsonify({"message": "Your password has been reset. Log in with your new password."})


@bp.get("/session")
@login_required
def restore_session():
    """Restore the current session from a bearer token.
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    responses:
      200:
        description: The current session's user, wallet, beneficiaries, and transactions.
        schema:
          $ref: '#/definitions/Session'
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
      403:
        description: Account is suspended.
        schema:
          $ref: '#/definitions/Error'
    """
    db = read_db()
    user = find_user(db, g.current_user_id)
    return jsonify(_session_payload(user, g.session_token))


@bp.post("/logout")
@login_required
def logout():
    """Log out and invalidate the current session token.
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    responses:
      200:
        description: Session invalidated.
        schema:
          type: object
          properties:
            ok:
              type: boolean
              example: true
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
    """
    with mutate_db() as db:
        db["sessions"].pop(g.session_id, None)
    return jsonify({"ok": True})


@bp.patch("/me")
@login_required
def update_profile():
    """Update the current user's profile.

    `name`, `phone`, and `country` are updated in place when present and
    truthy; `email` is updated only if it differs and isn't already taken.
    ---
    tags:
      - Auth
    security:
      - Bearer: []
    parameters:
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
            email:
              type: string
    responses:
      200:
        description: The updated public profile.
        schema:
          $ref: '#/definitions/User'
      401:
        description: Not authenticated.
        schema:
          $ref: '#/definitions/Error'
      409:
        description: An account with that email already exists.
        schema:
          $ref: '#/definitions/Error'
    """
    patch = request.get_json(silent=True) or {}
    allowed = {"name", "phone", "country"}
    with mutate_db() as db:
        user = find_user(db, g.current_user_id)
        email = (patch.get("email") or "").strip()
        if email and email.lower() != user["email"].lower():
            existing = find_user_by_email(db, email)
            if existing and existing["id"] != user["id"]:
                return jsonify({"error": "An account with that email already exists."}), 409
            user["email"] = email
        for key in allowed:
            if key in patch and patch[key]:
                user[key] = patch[key]
        result = public_user(user)
    return jsonify(result)
