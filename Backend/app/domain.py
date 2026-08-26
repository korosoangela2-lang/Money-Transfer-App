"""Plain-dict builders/serializers for the JSON store — the equivalent of
what were SQLAlchemy models when this backend used Postgres.
"""

from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from .ids import gen_id
from .pricing import round2


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_user(*, name, email, phone, password, country="Canada", role="user", kyc="unverified",
             status="active", balance=0, currency="CAD", joined=None):
    return {
        "id": gen_id("usr"),
        "name": name,
        "email": email,
        "phone": phone,
        "country": country,
        "role": role,
        "kyc": kyc,
        "status": status,
        "joined": joined or now_iso(),
        "passwordHash": generate_password_hash(password),
        "wallet": {"balance": round2(float(balance)), "currency": currency},
        "beneficiaries": [],
        "transactions": [],
    }


def check_password(user, password):
    return check_password_hash(user["passwordHash"], password)


def set_password(user, password):
    user["passwordHash"] = generate_password_hash(password)


def public_user(user):
    return {k: user[k] for k in ("id", "name", "email", "phone", "country", "role", "kyc", "status", "joined")}


def new_beneficiary(*, name, currency, method, relation="", country="", flag="", account="", bank=""):
    return {
        "id": gen_id("ben"),
        "name": name,
        "relation": relation,
        "currency": currency,
        "country": country,
        "flag": flag,
        "method": method,
        "account": account,
        "bank": bank,
    }


def new_transaction(*, type, status, name, amount, beneficiary_id=None, currency=None, rate=None,
                     fee=0, spread_revenue=0, received=None, method=None, created_at=None):
    return {
        "id": gen_id("TX"),
        "type": type,
        "status": status,
        "beneficiaryId": beneficiary_id,
        "name": name,
        "amount": round2(float(amount)),
        "currency": currency,
        "rate": rate,
        "fee": round2(float(fee)),
        "spreadRevenue": round2(float(spread_revenue)),
        "received": received,
        "method": method,
        "createdAt": created_at or now_iso(),
    }


def new_money_request(*, requester_id, requester_name, payer_id, payer_name, amount, note="", created_at=None):
    return {
        "id": gen_id("REQ"),
        "requesterId": requester_id,
        "requesterName": requester_name,
        "payerId": payer_id,
        "payerName": payer_name,
        "amount": round2(float(amount)),
        "note": note or "",
        "status": "pending",
        "createdAt": created_at or now_iso(),
    }
