# Halcyon Banking Agency

Halcyon Banking Agency is a React frontend for a cross-border money transfer product, backed by a
Flask API, plus a small Node backend that handles one real integration: M-Pesa top-ups via
Safaricom's Daraja API.

This is a template — a starting point for a fintech/remittance product, not a
licensed money-transfer service. See "Rebranding" and `LICENSE` below before
you ship it as your own product.

## Architecture

- **Frontend** (`Frontend/src/`) — React + Vite, routed with `react-router-dom`. All
  application data (users, wallets, beneficiaries, transactions) lives in
  `Backend/` via a REST API (see `src/lib/api.js`); the browser only holds a
  session token in `localStorage` so a refresh doesn't log you out.
- **`Backend/`** — a Flask REST API covering accounts, wallets,
  beneficiaries, transfers, and admin aggregation, persisted to a flat
  `db.json` file — no database server to install. Passwords are hashed
  (Werkzeug's salted PBKDF2) server-side, never in plaintext. See
  `Backend/README.md` for setup, endpoints, and how to bootstrap an admin
  account.
- **`Frontend/server/`** — a minimal Express server that exists solely to
  talk to Safaricom's Daraja API for M-Pesa STK Push payments. This has to be
  a separate real backend: the Daraja consumer secret can't live in browser
  code, and Safaricom confirms payments via a server-to-server callback that
  only a publicly reachable backend can receive. It doesn't hold the ledger —
  once a payment is confirmed, the frontend calls `Backend/`'s add-funds
  endpoint, same as any other funding source.

There's no real cross-border payout rail yet — beneficiary payouts, FX
rates, and KYC are still simulated. Wiring those up for real would mean a
payment processor, a live FX feed, a KYC provider, and (for real payouts)
money-transmitter licensing.

## Quick start

Two terminals — the API has to be running before the frontend can do
anything useful.

```bash
# Terminal 1 — the API
cd Backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # enables debug/auto-reload for local dev
python run.py                     # http://localhost:5000
```

```bash
# Terminal 2 — the app
cd Frontend
npm install
npm run dev                       # http://localhost:5173
```

Open http://localhost:5173 and register a real account — there's no seeded
demo/admin login; every account is a genuine signup against `Backend/`'s
`db.json`. To get an **admin** account, run `flask create-admin` in the
`Backend/` terminal instead of registering through the UI (see
`Backend/README.md`).

## Testing

- **Frontend** — Jest + Testing Library.
  ```bash
  cd Frontend
  npm test
  ```
- **Backend** — Python's stdlib `unittest`, via Flask's test client. See
  `Backend/README.md` for details.
  ```bash
  cd Backend
  python -m unittest discover -s tests -t .
  ```

## M-Pesa (Daraja) setup — optional

Add funds with **M-Pesa** in the app requires the backend in `Frontend/server/`
to be running and configured with your own Safaricom sandbox credentials.

1. Create a free sandbox app at https://developer.safaricom.co.ke, under the
   "Lipa Na M-Pesa Online" product, to get a consumer key and secret.
2. In a third terminal:
   ```bash
   cd Frontend/server
   npm install
   cp .env.example .env
   # edit .env: paste in DARAJA_CONSUMER_KEY / DARAJA_CONSUMER_SECRET
   npm run dev
   ```
3. Safaricom's sandbox needs a publicly reachable HTTPS URL to POST the
   payment result back to. Tunnel the server (e.g. `ngrok http 4000`) and set
   `DARAJA_CALLBACK_URL` in `Frontend/server/.env` to
   `https://<your-tunnel>/api/mpesa/callback`.
4. In the app, choose "M-Pesa" as the funding source on Add Funds and enter a
   Safaricom test MSISDN to trigger an STK push.

Without this configured, every other funding source (card, Interac) still
works — only the M-Pesa option needs that backend.

## Rebranding

Most of the product name/wordmark is centralized in
`Frontend/src/lib/brand.js` — change `BRAND_NAME`, `BRAND_FULL`, and
`BRAND_LETTER` there and it propagates through the logo, nav, and in-app
copy. A handful of spots are static and can't import a JS constant, so
update these by hand too:

- `Frontend/index.html` — `<title>` and `og:title`/`og:description`
- `Frontend/package.json` and `Frontend/server/package.json` — `description`
- This file and `Backend/README.md` — headings and prose
- `Frontend/public/` — favicon, manifest icons, `manifest.webmanifest`
- The color palette and fonts live in `Frontend/src/lib/theme.jsx` (`T`,
  `SANS`, `DISPLAY`) if you want a different look, not just a different name.
