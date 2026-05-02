#!/usr/bin/env bash
# Seeds demo data into the marketplace stack.
#
#   - 8 sellers (TechHub, SportZone, KitchenPlus, FreshMarket,
#                FashionX, WatchBox, BeautyShop, HomeStyle)
#   - 5 buyers
#   - 194 products imported via the feed-ingestion service (dummyjson-based XMLs)
#   - ~5-10 orders placed across buyers
#
# NOTE: Legacy picsum-based XMLs (seller-techhub.xml, seller-homestyle.xml)
#       are intentionally skipped. They are kept in docs/seed for reference only.
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

FEED_FILES=(
  seller-techhub-dj.xml
  seller-sportzone.xml
  seller-kitchenplus.xml
  seller-freshmarket.xml
  seller-fashionx.xml
  seller-watchbox.xml
  seller-beautyshop.xml
  seller-homestyle-dj.xml
)
for f in "${FEED_FILES[@]}"; do
  [ -f "$SEED_DIR/$f" ] || fail "Missing $SEED_DIR/$f"
done

# --- wait for gateway -----------------------------------------------------
log "Waiting for gateway at $GATEWAY ..."
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$GATEWAY/api/v1/products/categories" || echo "000")
  if [ "$code" = "200" ]; then
    ok "Gateway ready"
    break
  fi
  if [ "$i" -eq 60 ]; then fail "Gateway did not respond in 120s (last HTTP $code)"; fi
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
# Format: "email|storeName|taxNumber|phone|feedFile"
SELLER_DEFS=(
  "info@techhub.com|TechHub Elektronik|1112223334|+905551112233|seller-techhub-dj.xml"
  "info@sportzone.com|SportZone Spor ve Araclar|2223334445|+905552223344|seller-sportzone.xml"
  "info@kitchenplus.com|KitchenPlus Mutfak|3334445556|+905553334455|seller-kitchenplus.xml"
  "info@freshmarket.com|FreshMarket Gida|4445556667|+905554445566|seller-freshmarket.xml"
  "info@fashionx.com|FashionX Moda|5556667778|+905555556677|seller-fashionx.xml"
  "info@watchbox.com|WatchBox Saat ve Aksesuar|6667778889|+905556667788|seller-watchbox.xml"
  "info@beautyshop.com|BeautyShop Guzellik|7778889990|+905557778899|seller-beautyshop.xml"
  "info@homestyle.com|HomeStyle Ev ve Dekorasyon|9998887776|+905558889900|seller-homestyle-dj.xml"
)

log "Creating sellers ..."
SELLER_IDS=()
SELLER_EMAILS=()
SELLER_FEEDS=()
for entry in "${SELLER_DEFS[@]}"; do
  IFS='|' read -r email store tax phone feed <<< "$entry"
  sid=$(register_or_login_seller "$email" "$store" "$tax" "$phone")
  SELLER_IDS+=("$sid")
  SELLER_EMAILS+=("$email")
  SELLER_FEEDS+=("$feed")
  ok "Seller: $store ($sid)"
done

# --- buyers ---------------------------------------------------------------
log "Creating buyers ..."
BUYER_IDS=()
BUYER_EMAILS=()
BUYERS=(
  "ahmet.yilmaz@gmail.com|Ahmet|Yilmaz"
  "ayse.kara@gmail.com|Ayse|Kara"
  "mehmet.demir@hotmail.com|Mehmet|Demir"
  "elif.sahin@gmail.com|Elif|Sahin"
  "can.ozturk@yahoo.com|Can|Ozturk"
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

for i in "${!SELLER_IDS[@]}"; do
  import_feed "${SELLER_EMAILS[$i]%%@*}" "$SEED_DIR/${SELLER_FEEDS[$i]}" "${SELLER_IDS[$i]}"
done

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
for email in "${SELLER_EMAILS[@]}"; do
  echo "    $email"
done
echo
echo "  Buyers (password: $PASSWORD):"
for entry in "${BUYERS[@]}"; do
  echo "    ${entry%%|*}"
done
echo
echo "  Frontend: http://localhost:5173"
echo "  Swagger:  $GATEWAY/swagger-ui.html"
echo "  Grafana:  http://localhost:3001"
