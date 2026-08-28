# Halcyon Backend (Flask + db.json)

A REST API for the Halcyon Banking Agency data model — accounts, wallets,
beneficiaries, transfers, and the admin dashboard — persisted to a flat
`db.json` file. `Frontend/src/lib/api.js` calls this API directly over
`fetch`. It's a separate service from `Frontend/server/`, which only
handles M-Pesa Daraja payments.

No database server to install or run — `db.json` is created automatically,
empty, the first time the app touches it.

## Setup

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # recommended for local dev — enables debug/auto-reload
```

Run the dev server:

```bash
python run.py            # http://localhost:5000
```

`db.json` is created next to `run.py` on first request as an empty
datastore — no demo users, no sample data. Real accounts come from the
normal `/api/auth/register` flow.

To get an admin account, create one directly (there's no seeded admin —
this asks for a name/email/password interactively):

```bash
export FLASK_APP=run.py
flask create-admin
```

To wipe `db.json` back to empty:

```bash
flask reset-db
```

`db.json` is gitignored — it's local, mutable state, not something to
commit.

## Auth

Stateless bearer tokens, not cookies. `POST /api/auth/login` and
`/register` return `{ token, user, wallet, beneficiaries, transactions }`;
send the token back as `Authorization: Bearer <token>` on every
authenticated request. `GET /api/auth/session` re-resolves a stored token
(for resuming a session on page load).

## Endpoints

| Method | Path                       | Auth  | Description                          |
|--------|----------------------------|-------|---------------------------------------|
| POST   | /api/auth/register         | —     | Create account, returns session       |
| POST   | /api/auth/login            | —     | Returns session                       |
| GET    | /api/auth/session          | user  | Resume session from token             |
| POST   | /api/auth/logout           | user  | Invalidate token                      |
| PATCH  | /api/auth/me               | user  | Update name/email/phone/country       |
| GET    | /api/rates                 | —     | Current FX rates (drifts each call)   |
| POST   | /api/wallet/add-funds      | user  | Top up wallet                         |
| GET    | /api/beneficiaries         | user  | List beneficiaries                    |
| POST   | /api/beneficiaries         | user  | Add beneficiary                       |
| DELETE | /api/beneficiaries/:id     | user  | Remove beneficiary                    |
| GET    | /api/transactions          | user  | List own transactions                 |
| POST   | /api/transfers             | user  | Send money (server computes fee/rate) |
| GET    | /api/admin/data            | admin | Aggregated users/transactions/revenue |
| POST   | /api/admin/users           | admin | Create a user                         |
| PATCH  | /api/admin/users/:id       | admin | Patch role/kyc/status/etc.            |
| DELETE | /api/admin/users/:id       | admin | Delete a user                         |

Pricing (fee + FX spread) is computed server-side in `app/pricing.py` from
the beneficiary's currency and the live rate, then checked against wallet
balance — the client can't dictate its own fee/received amount.

## How storage works

`app/store.py` reads/writes the whole `db.json` document on every request —
`read_db()` for reads, `mutate_db()` as a context manager for writes (loads,
yields the dict for in-place mutation, writes it back on exit). Writes are
serialized with an in-process lock and land via an atomic `os.replace`, so a
crash mid-write can't leave a corrupt file. This is intentionally simple:
fine for local dev and demos, not a substitute for a real database under
concurrent load — there's no per-record locking, and the whole file round-
trips through JSON on every write.

`app/domain.py` holds the plain-dict builders/serializers for users,
beneficiaries, and transactions (the equivalent of what would be ORM models
in a database-backed version).

## Testing

`unittest` (stdlib) — no extra dependencies beyond `requirements.txt`
(tests use Flask's built-in test client). Each test runs against a fresh,
throwaway `db.json` (see `tests/helpers.py`), so nothing touches your real
local data.

```bash
python -m unittest discover -s tests -t .
```

- `tests/test_pricing.py` — fee/spread math (`app/pricing.py`)
- `tests/test_domain.py` — user/beneficiary/transaction dict builders, password hashing
- `tests/test_store.py` — the `db.json` read/write/mutate layer
- `tests/test_routes.py` — end-to-end HTTP tests for every endpoint (auth, wallet,
  beneficiaries, transfers, admin), including that a client can't smuggle its
  own fee/rate into a transfer

## Notes

- CORS is locked to `CORS_ORIGIN` (`.env`, defaults to
  `http://localhost:5173`, Vite's default port). If the frontend runs on a
  different port, update `.env` or requests from it will be rejected.
- The frontend only persists a session token client-side (`localStorage`,
  key `halcyon_token`) — everything else (users, wallets, beneficiaries,
  transactions) is fetched fresh from this API. See `Frontend/src/lib/api.js`
  and `Frontend/src/lib/session.js`.
