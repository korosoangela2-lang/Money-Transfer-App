#!/usr/bin/env bash
# Live presentation script for the Halcyon backend — plain curl, no Postman.
#
# One-time setup before presenting:
#   cd Backend && source venv/bin/activate && python run.py
#   (separate terminal) export FLASK_APP=run.py && flask create-admin
#     -> use ADMIN_EMAIL / ADMIN_PASSWORD below when prompted
#
# Then just run this script and talk over each step; it pauses between
# sections so you control the pace live.
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-demo.admin@halcyon.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-DemoPass123}"
STAMP=$(date +%s)

BOLD=$(tput bold 2>/dev/null || true)
DIM=$(tput dim 2>/dev/null || true)
RESET=$(tput sgr0 2>/dev/null || true)

step() {
  echo
  echo "${BOLD}== $1 ==${RESET}"
  read -rp "${DIM}press enter to run it...${RESET}" _
}

show() {
  # $1 = curl command as a string, already executed with output in $RESP
  echo "${DIM}\$ $1${RESET}"
  echo "$RESP" | jq .
}

# ---------------------------------------------------------------------------
step "Health check"
CMD="curl -s $BASE_URL/api/health"
RESP=$(eval "$CMD")
show "$CMD"

# ---------------------------------------------------------------------------
step "Register primary user"
USER_EMAIL="demo.user.${STAMP}@example.com"
CMD="curl -s -X POST $BASE_URL/api/auth/register \\
  -H 'Content-Type: application/json' \\
  -d '{\"name\":\"Demo User\",\"email\":\"$USER_EMAIL\",\"phone\":\"0712345678\",\"country\":\"Kenya\",\"password\":\"DemoPass123\"}'"
RESP=$(eval "$CMD")
show "$CMD"
TOKEN=$(echo "$RESP" | jq -r .token)
echo "${DIM}token captured for later requests${RESET}"

# ---------------------------------------------------------------------------
step "Register recipient user (for P2P later)"
RECIPIENT_EMAIL="demo.recipient.${STAMP}@example.com"
CMD="curl -s -X POST $BASE_URL/api/auth/register \\
  -H 'Content-Type: application/json' \\
  -d '{\"name\":\"Demo Recipient\",\"email\":\"$RECIPIENT_EMAIL\",\"phone\":\"0798765432\",\"country\":\"Kenya\",\"password\":\"DemoPass123\"}'"
RESP=$(eval "$CMD")
show "$CMD"
RECIPIENT_TOKEN=$(echo "$RESP" | jq -r .token)

# ---------------------------------------------------------------------------
step "Login with wrong password -> 401"
CMD="curl -s -o /dev/null -w '%{http_code}\\n' -X POST $BASE_URL/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{\"email\":\"$USER_EMAIL\",\"password\":\"wrong-password\"}'"
RESP=$(eval "$CMD")
echo "${DIM}\$ $CMD${RESET}"
echo "$RESP"

# ---------------------------------------------------------------------------
step "Admin login — same endpoint, role comes back on the token"
CMD="curl -s -X POST $BASE_URL/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}'"
RESP=$(eval "$CMD")
show "$CMD"
ADMIN_TOKEN=$(echo "$RESP" | jq -r .token)

# ---------------------------------------------------------------------------
step "Add funds to wallet"
CMD="curl -s -X POST $BASE_URL/api/wallet/add-funds \\
  -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' \\
  -d '{\"amount\":500,\"source\":\"Card\"}'"
RESP=$(eval "$CMD")
show "$CMD"

# ---------------------------------------------------------------------------
step "Add a beneficiary to send money to"
CMD="curl -s -X POST $BASE_URL/api/beneficiaries \\
  -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' \\
  -d '{\"name\":\"Jane Doe\",\"relation\":\"Sister\",\"currency\":\"KES\",\"country\":\"Kenya\",\"flag\":\"🇰🇪\",\"method\":\"mobile\",\"account\":\"0700111222\",\"bank\":\"\"}'"
RESP=$(eval "$CMD")
show "$CMD"
BENEFICIARY_ID=$(echo "$RESP" | jq -r .id)

# ---------------------------------------------------------------------------
step "Send money — server computes fee/rate, not the client"
CMD="curl -s -X POST $BASE_URL/api/transfers \\
  -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' \\
  -d '{\"beneficiaryId\":\"$BENEFICIARY_ID\",\"amount\":20,\"method\":\"mobile\"}'"
RESP=$(eval "$CMD")
show "$CMD"
echo "${BOLD}fee / rate / received above came from app/pricing.py, not the request body${RESET}"

# ---------------------------------------------------------------------------
step "Now try to smuggle in our own fee — watch it get ignored"
CMD="curl -s -X POST $BASE_URL/api/transfers \\
  -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' \\
  -d '{\"beneficiaryId\":\"$BENEFICIARY_ID\",\"amount\":20,\"method\":\"mobile\",\"fee\":0,\"rate\":9999}'"
RESP=$(eval "$CMD")
show "$CMD"
echo "${BOLD}same fee as before — the extra fields were silently ignored${RESET}"

# ---------------------------------------------------------------------------
step "Send to user directly (P2P, no beneficiary needed)"
CMD="curl -s -X POST $BASE_URL/api/transfers/to-user \\
  -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' \\
  -d '{\"email\":\"$RECIPIENT_EMAIL\",\"amount\":10}'"
RESP=$(eval "$CMD")
show "$CMD"

# ---------------------------------------------------------------------------
step "List all transactions — one ledger for topup/send/p2p"
CMD="curl -s $BASE_URL/api/transactions -H 'Authorization: Bearer $TOKEN'"
RESP=$(eval "$CMD")
show "$CMD"

# ---------------------------------------------------------------------------
step "Withdraw more than the balance -> 400"
CMD="curl -s -X POST $BASE_URL/api/wallet/withdraw \\
  -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' \\
  -d '{\"amount\":999999,\"destination\":\"Card\"}'"
RESP=$(eval "$CMD")
show "$CMD"

# ---------------------------------------------------------------------------
step "Money request: recipient asks primary user for cash"
CMD="curl -s -X POST $BASE_URL/api/requests \\
  -H 'Authorization: Bearer $RECIPIENT_TOKEN' -H 'Content-Type: application/json' \\
  -d '{\"email\":\"$USER_EMAIL\",\"amount\":15,\"note\":\"demo request\"}'"
RESP=$(eval "$CMD")
show "$CMD"
REQUEST_ID=$(echo "$RESP" | jq -r .id)

step "Pay the request"
CMD="curl -s -X POST $BASE_URL/api/requests/$REQUEST_ID/pay -H 'Authorization: Bearer $TOKEN'"
RESP=$(eval "$CMD")
show "$CMD"

step "Try to decline a request that's already paid -> 400"
CMD="curl -s -X POST $BASE_URL/api/requests/$REQUEST_ID/decline -H 'Authorization: Bearer $TOKEN'"
RESP=$(eval "$CMD")
show "$CMD"

# ---------------------------------------------------------------------------
step "Regular user hits the admin endpoint -> 403"
CMD="curl -s -o /dev/null -w '%{http_code}\\n' $BASE_URL/api/admin/data -H 'Authorization: Bearer $TOKEN'"
RESP=$(eval "$CMD")
echo "${DIM}\$ $CMD${RESET}"
echo "$RESP"

step "Admin token hits the same endpoint -> 200"
CMD="curl -s $BASE_URL/api/admin/data -H 'Authorization: Bearer $ADMIN_TOKEN'"
RESP=$(eval "$CMD")
show "$CMD"

# ---------------------------------------------------------------------------
step "Close: run the automated test suite — same assertions, as CI"
(cd "$(dirname "$0")" && python -m unittest discover -s tests -t .)

echo
echo "${BOLD}done.${RESET}"
