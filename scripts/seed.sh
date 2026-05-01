#!/usr/bin/env bash
# Seeds demo data into the marketplace stack.
#
#   - 2 sellers (TechHub, HomeStyle)
#   - 5 buyers
#   - 50 products imported via the feed-ingestion service
#   - ~5-10 orders placed across buyers
#
# Idempotent at the user level: re-running falls back to login when an account
# already exists. Re-running, however, will create duplicate products and orders
# (each feed import is a fresh batch). For a clean reset:
#
#   make clean && make up && make seed
#
# Requires: bash, curl, jq, uuidgen.

set -euo pipefail

GATEWAY="${GATEWAY_URL:-http://localhost:8080}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SEED_DIR="$ROOT/docs/seed"
PASSWORD="Demo1234"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# --- helpers --------------------------------------------------------------
log()  { echo "→ $*"; }
ok()   { echo "✓ $*"; }
fail() { echo "✗ $*" >&2; exit 1; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"; }

http_post_json() {
  local url=$1 body=$2
  curl -sS -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$body" \
    -o "$TMP/last" -w "%{http_code}"
}

http_post_multipart() {
  local url=$1 file=$2; shift 2
  local args=()
  for h in "$@"; do args+=(-H "$h"); done
  curl -sS -X POST "$url" \
    "${args[@]}" \
    -F "file=@$file" \
    -o "$TMP/last" -w "%{http_code}"
}

# --- preflight ------------------------------------------------------------
require_cmd curl
require_cmd jq
require_cmd uuidgen

[ -f "$SEED_DIR/seller-techhub.xml" ]   || fail "Missing $SEED_DIR/seller-techhub.xml"
[ -f "$SEED_DIR/seller-homestyle.xml" ] || fail "Missing $SEED_DIR/seller-homestyle.xml"

# --- wait for gateway -----------------------------------------------------
log "Waiting for gateway at $GATEWAY ..."
for i in $(seq 1 60); do
  if curl -sf "$GATEWAY/actuator/health" >/dev/null 2>&1; then
    ok "Gateway ready"
    break
  fi
  if [ "$i" -eq 60 ]; then fail "Gateway did not respond in 120s"; fi
  sleep 2
done

# --- auth -----------------------------------------------------------------
register_or_login_seller() {
  local email=$1 storeName=$2 taxNumber=$3 phone=$4
  local body code
  body=$(jq -nc \
    --arg e "$email" --arg p "$PASSWORD" --arg s "$storeName" \
    --arg t "$taxNumber" --arg ph "$phone" \
    '{email:$e, password:$p, storeName:$s, taxNumber:$t, phone:$ph}')
  code=$(http_post_json "$GATEWAY/api/v1/auth/seller/register" "$body")
  if [ "$code" != "201" ]; then
    body=$(jq -nc --arg e "$email" --arg p "$PASSWORD" '{email:$e, password:$p}')
    code=$(http_post_json "$GATEWAY/api/v1/auth/login" "$body")
    [ "$code" = "200" ] || { cat "$TMP/last" >&2; fail "Could not register/login seller $email (HTTP $code)"; }
  fi
  jq -r '.userId' "$TMP/last"
}

register_or_login_buyer() {
  local email=$1 first=$2 last=$3
  local body code
  body=$(jq -nc --arg e "$email" --arg p "$PASSWORD" --arg f "$first" --arg l "$last" \
    '{email:$e, password:$p, firstName:$f, lastName:$l}')
  code=$(http_post_json "$GATEWAY/api/v1/auth/buyer/register" "$body")
  if [ "$code" != "201" ]; then
    body=$(jq -nc --arg e "$email" --arg p "$PASSWORD" '{email:$e, password:$p}')
    code=$(http_post_json "$GATEWAY/api/v1/auth/login" "$body")
    [ "$code" = "200" ] || { cat "$TMP/last" >&2; fail "Could not register/login buyer $email (HTTP $code)"; }
  fi
  jq -r '.userId' "$TMP/last"
}

# --- sellers --------------------------------------------------------------
log "Creating sellers ..."
SELLER1_ID=$(register_or_login_seller "techhub@demo.marketplace.com" "TechHub Electronics" "1112223334" "+905551112233")
ok "Seller: TechHub Electronics ($SELLER1_ID)"

SELLER2_ID=$(register_or_login_seller "homestyle@demo.marketplace.com" "HomeStyle Marketplace" "9998887776" "+905554445566")
ok "Seller: HomeStyle Marketplace ($SELLER2_ID)"

# --- buyers ---------------------------------------------------------------
log "Creating buyers ..."
BUYER_IDS=()
BUYER_EMAILS=()
BUYERS=(
  "ahmet@demo.marketplace.com|Ahmet|Yilmaz"
  "ayse@demo.marketplace.com|Ayse|Kara"
  "mehmet@demo.marketplace.com|Mehmet|Demir"
  "elif@demo.marketplace.com|Elif|Sahin"
  "can@demo.marketplace.com|Can|Ozturk"
)
for entry in "${BUYERS[@]}"; do
  IFS='|' read -r email first last <<< "$entry"
  uid=$(register_or_login_buyer "$email" "$first" "$last")
  BUYER_IDS+=("$uid")
  BUYER_EMAILS+=("$email")
  ok "Buyer: $first $last ($uid)"
done

# --- import feeds ---------------------------------------------------------
import_feed() {
  local label=$1 file=$2 seller=$3
  log "Importing $label catalog ..."
  local code
  code=$(http_post_multipart "$GATEWAY/api/v1/feeds/import" "$file" "X-Seller-Id: $seller")
  [ "$code" = "201" ] || { cat "$TMP/last" >&2; fail "$label feed import failed (HTTP $code)"; }
  local s f
  s=$(jq -r '.successCount' "$TMP/last")
  f=$(jq -r '.failureCount' "$TMP/last")
  ok "$label: $s products imported, $f failed"
}

import_feed "TechHub"   "$SEED_DIR/seller-techhub.xml"   "$SELLER1_ID"
import_feed "HomeStyle" "$SEED_DIR/seller-homestyle.xml" "$SELLER2_ID"

# --- orders ---------------------------------------------------------------
log "Fetching product catalog ..."
curl -sS "$GATEWAY/api/v1/products?size=100" -o "$TMP/products"
TOTAL=$(jq -r '.content | length' "$TMP/products")
ok "Catalog has $TOTAL products"
[ "$TOTAL" -ge 5 ] || fail "Not enough products in catalog to place orders"

PRODUCT_IDS=()
while IFS= read -r pid; do PRODUCT_IDS+=("$pid"); done < <(jq -r '.content[] | select(.stock > 0) | .id' "$TMP/products")
[ "${#PRODUCT_IDS[@]}" -ge 5 ] || fail "Not enough in-stock products to place orders"

place_payment() {
  local order_id=$1 buyer_id=$2
  local idem
  idem=$(uuidgen)
  local body
  body=$(jq -nc \
    --arg oid "$order_id" --arg key "pay-$idem" \
    '{orderId:$oid, idempotencyKey:$key, cardHolderName:"Test User",
      cardNumber:"5528790000000008", expireMonth:"12", expireYear:"2030", cvc:"123"}')
  local code
  code=$(curl -sS -X POST "$GATEWAY/api/v1/payments" \
    -H "Content-Type: application/json" \
    -H "X-User-Id: $buyer_id" \
    -d "$body" \
    -o "$TMP/last" -w "%{http_code}")
  if [ "$code" = "201" ]; then
    ok "  Payment confirmed for order $order_id"
  else
    echo "  ! Payment failed for order $order_id (HTTP $code): $(cat "$TMP/last")" >&2
  fi
}

place_order() {
  local buyer_id=$1 buyer_email=$2 num_items=$3
  local items='[]' picked=()
  local attempt=0
  while [ "${#picked[@]}" -lt "$num_items" ] && [ "$attempt" -lt 20 ]; do
    attempt=$((attempt + 1))
    local idx=$((RANDOM % ${#PRODUCT_IDS[@]}))
    local pid=${PRODUCT_IDS[$idx]}
    case " ${picked[*]} " in *" $pid "*) continue;; esac
    picked+=("$pid")
    local qty=$((1 + RANDOM % 2))
    items=$(echo "$items" | jq --arg id "$pid" --argjson q "$qty" '. += [{productId:$id, quantity:$q}]')
  done

  local idem
  idem=$(uuidgen)
  local body
  body=$(jq -nc --argjson items "$items" \
    --arg addr "Demo Sokak No:1, Kadikoy/Istanbul - $buyer_email" \
    --arg key "$idem" \
    '{items:$items, shippingAddress:$addr, idempotencyKey:$key}')

  local code
  code=$(curl -sS -X POST "$GATEWAY/api/v1/orders" \
    -H "Content-Type: application/json" \
    -H "X-User-Id: $buyer_id" \
    -d "$body" \
    -o "$TMP/last" -w "%{http_code}")
  if [ "$code" = "201" ]; then
    local oid
    oid=$(jq -r '.id' "$TMP/last")
    ok "Order $oid by $buyer_email (${#picked[@]} items)"
    place_payment "$oid" "$buyer_id"
  else
    echo "  ! Order failed for $buyer_email (HTTP $code): $(cat "$TMP/last")" >&2
  fi
}

log "Placing demo orders ..."
for i in "${!BUYER_IDS[@]}"; do
  bid=${BUYER_IDS[$i]}
  bmail=${BUYER_EMAILS[$i]}
  orders_per_buyer=$((1 + RANDOM % 2))
  for k in $(seq 1 "$orders_per_buyer"); do
    items_per_order=$((1 + RANDOM % 3))
    place_order "$bid" "$bmail" "$items_per_order"
  done
done

# --- summary --------------------------------------------------------------
echo
ok "Seed complete."
echo
echo "  Sellers (password: $PASSWORD):"
echo "    techhub@demo.marketplace.com"
echo "    homestyle@demo.marketplace.com"
echo
echo "  Buyers (password: $PASSWORD):"
for entry in "${BUYERS[@]}"; do
  echo "    ${entry%%|*}"
done
echo
echo "  Frontend: http://localhost:5173"
echo "  Swagger:  $GATEWAY/swagger-ui.html"
echo "  Grafana:  http://localhost:3001"
