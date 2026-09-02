"""flasgger (Swagger/OpenAPI) configuration for the Heha Banking Agency API.

Route handlers document themselves with YAML docstrings (flasgger's
docstring convention); this module only holds the shared template
(info, security scheme, reusable model definitions) and the UI config.
"""

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Heha Banking Agency API",
        "description": (
            "REST API for the Heha Banking Agency wallet: authentication, wallet "
            "top-ups/withdrawals, P2P and cross-border transfers, beneficiaries, "
            "money requests, live FX rates, and the admin console.\n\n"
            "Authenticate with `POST /api/auth/login` or `/api/auth/register`, "
            "then send the returned `token` (a signed JWT) as "
            "`Authorization: Bearer <token>` on subsequent requests."
        ),
        "version": "1.0.0",
    },
    "basePath": "/",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT issued by login/register, sent as: Bearer <token>",
        }
    },
    "tags": [
        {"name": "Auth", "description": "Registration, login, session, and password reset."},
        {"name": "Wallet", "description": "Wallet top-ups and withdrawals."},
        {"name": "Transactions", "description": "Reading the current user's transaction history."},
        {"name": "Transfers", "description": "Sending money to a beneficiary or another user."},
        {"name": "Beneficiaries", "description": "Managing saved payout beneficiaries."},
        {"name": "Requests", "description": "Peer-to-peer money requests."},
        {"name": "Rates", "description": "Live FX rates for supported corridors."},
        {"name": "Admin", "description": "Admin-only console: users, transactions, and revenue."},
        {"name": "Health", "description": "Service liveness check."},
    ],
    "definitions": {
        "Error": {
            "type": "object",
            "properties": {"error": {"type": "string", "example": "Something went wrong."}},
        },
        "Wallet": {
            "type": "object",
            "properties": {
                "balance": {"type": "number", "format": "float", "example": 250.0},
                "currency": {"type": "string", "example": "CAD"},
            },
        },
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "example": "usr_abc123"},
                "name": {"type": "string", "example": "Jane Doe"},
                "email": {"type": "string", "example": "jane@example.com"},
                "phone": {"type": "string", "example": "+15145550123"},
                "country": {"type": "string", "example": "Canada"},
                "role": {"type": "string", "enum": ["user", "admin"], "example": "user"},
                "kyc": {"type": "string", "enum": ["unverified", "pending", "verified"], "example": "unverified"},
                "status": {"type": "string", "enum": ["active", "suspended"], "example": "active"},
                "joined": {"type": "string", "format": "date-time"},
            },
        },
        "Beneficiary": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "example": "ben_abc123"},
                "name": {"type": "string", "example": "John Smith"},
                "relation": {"type": "string", "example": "Brother"},
                "currency": {"type": "string", "example": "KES"},
                "country": {"type": "string", "example": "Kenya"},
                "flag": {"type": "string", "example": "🇰🇪"},
                "method": {"type": "string", "enum": ["mobile", "bank", "cash"], "example": "mobile"},
                "account": {"type": "string", "example": "0712345678"},
                "bank": {"type": "string", "example": ""},
            },
        },
        "Transaction": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "example": "TX_abc123"},
                "type": {
                    "type": "string",
                    "enum": ["topup", "withdrawal", "send", "p2p_out", "p2p_in"],
                    "example": "send",
                },
                "status": {"type": "string", "enum": ["pending", "completed", "failed"], "example": "pending"},
                "beneficiaryId": {"type": "string", "x-nullable": True},
                "name": {"type": "string", "example": "John Smith"},
                "amount": {"type": "number", "format": "float", "example": 100.0},
                "currency": {"type": "string", "x-nullable": True, "example": "KES"},
                "rate": {"type": "number", "format": "float", "x-nullable": True},
                "fee": {"type": "number", "format": "float", "example": 1.2},
                "spreadRevenue": {"type": "number", "format": "float", "example": 0.35},
                "received": {"type": "number", "format": "float", "x-nullable": True},
                "method": {"type": "string", "x-nullable": True, "example": "mobile"},
                "createdAt": {"type": "string", "format": "date-time"},
            },
        },
        "MoneyRequest": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "example": "REQ_abc123"},
                "requesterId": {"type": "string"},
                "requesterName": {"type": "string"},
                "payerId": {"type": "string"},
                "payerName": {"type": "string"},
                "amount": {"type": "number", "format": "float", "example": 50.0},
                "note": {"type": "string", "example": "Rent split"},
                "status": {"type": "string", "enum": ["pending", "paid", "declined"], "example": "pending"},
                "createdAt": {"type": "string", "format": "date-time"},
            },
        },
        "Session": {
            "type": "object",
            "properties": {
                "token": {"type": "string", "example": "session_abc123"},
                "user": {"$ref": "#/definitions/User"},
                "wallet": {"$ref": "#/definitions/Wallet"},
                "beneficiaries": {"type": "array", "items": {"$ref": "#/definitions/Beneficiary"}},
                "transactions": {"type": "array", "items": {"$ref": "#/definitions/Transaction"}},
            },
        },
    },
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/api/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs/",
}
