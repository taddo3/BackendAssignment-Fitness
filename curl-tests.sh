#!/usr/bin/env bash
set -euo pipefail

# Runs curl requests against all existing endpoints.
#
# Requirements:
# - API running locally (default http://localhost:8000)
# - `jq` installed (used to parse JSON)
#
# Usage:
#   bash curl-tests.sh
#   API_URL="http://localhost:8000" bash curl-tests.sh
#
# THIS IS A GENERATED FILE FOR QUICK TESTING OF THE API !!!!!!!!!!!!!!!!!


API_URL="${API_URL:-http://localhost:8000}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. Install it, then re-run."
  exit 1
fi

ts="$(date +%s)"
ADMIN_EMAIL="admin_${ts}@example.com"
USER_EMAIL="user_${ts}@example.com"
ADMIN_PASSWORD="Password123!"
USER_PASSWORD="Password123!"

ADMIN_NICK="admin_${ts}"
USER_NICK="user_${ts}"

JSON_HEADER=(-H "Content-Type: application/json")

echo "API_URL=$API_URL"
echo "Using ADMIN_EMAIL=$ADMIN_EMAIL, USER_EMAIL=$USER_EMAIL"
echo

curl_json () {
  # curl_json METHOD PATH [extra curl args...]
  local method="$1"
  local path="$2"
  shift 2
  curl -sS -X "$method" "$API_URL$path" "$@"
}

section () {
  echo
  echo "== $1 =="
}

section "Auth: register ADMIN"
curl_json POST "/auth/register" "${JSON_HEADER[@]}" -H "language: en" -d "{
  \"name\": \"Admin\",
  \"surname\": \"Tester\",
  \"nickName\": \"$ADMIN_NICK\",
  \"email\": \"$ADMIN_EMAIL\",
  \"age\": 30,
  \"role\": \"ADMIN\",
  \"password\": \"$ADMIN_PASSWORD\"
}" | jq .

section "Auth: register USER (SK localization header)"
curl_json POST "/auth/register" "${JSON_HEADER[@]}" -H "language: sk" -d "{
  \"name\": \"User\",
  \"surname\": \"Tester\",
  \"nickName\": \"$USER_NICK\",
  \"email\": \"$USER_EMAIL\",
  \"age\": 25,
  \"role\": \"USER\",
  \"password\": \"$USER_PASSWORD\"
}" | jq .

section "Auth: login ADMIN"
ADMIN_TOKEN="$(
  curl_json POST "/auth/login" "${JSON_HEADER[@]}" -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }" | jq -r '.data.token'
)"
test -n "$ADMIN_TOKEN" && test "$ADMIN_TOKEN" != "null"
echo "ADMIN_TOKEN acquired"

section "Auth: login USER"
USER_TOKEN="$(
  curl_json POST "/auth/login" "${JSON_HEADER[@]}" -d "{
    \"email\": \"$USER_EMAIL\",
    \"password\": \"$USER_PASSWORD\"
  }" | jq -r '.data.token'
)"
test -n "$USER_TOKEN" && test "$USER_TOKEN" != "null"
echo "USER_TOKEN acquired"

section "Programs: list"
PROGRAM_ID="$(
  curl_json GET "/programs" -H "language: en" | jq -r '.data[0].id // empty'
)"
if [[ -z "${PROGRAM_ID:-}" ]]; then
  echo "No programs found. Seed the DB (e.g. run src/seed.ts) then re-run."
  exit 1
fi
echo "PROGRAM_ID=$PROGRAM_ID"

section "Exercises: list (default)"
curl_json GET "/exercises" -H "language: en" | jq .

section "Exercises: list (pagination page=1 limit=2)"
curl_json GET "/exercises?page=1&limit=2" -H "language: en" | jq .

section "Exercises: list (filter by programID)"
curl_json GET "/exercises?programID=$PROGRAM_ID" -H "language: en" | jq .

EXERCISE_NAME="Cis-Pushup-${ts}"

section "Exercises: create (ADMIN)"
CREATED_EXERCISE_ID="$(
  curl_json POST "/exercises" "${JSON_HEADER[@]}" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "language: en" \
    -d "{
      \"name\": \"$EXERCISE_NAME\",
      \"difficulty\": \"EASY\",
      \"programID\": $PROGRAM_ID
    }" | jq -r '.data.id'
)"
test -n "$CREATED_EXERCISE_ID" && test "$CREATED_EXERCISE_ID" != "null"
echo "CREATED_EXERCISE_ID=$CREATED_EXERCISE_ID"

section "Exercises: list (search=cis)"
curl_json GET "/exercises?search=cis" -H "language: en" | jq .

section "Programs: add exercise to program (ADMIN)"
curl_json POST "/programs/$PROGRAM_ID/exercises/$CREATED_EXERCISE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "language: en" | jq .

section "Exercises: update (ADMIN)"
curl_json PUT "/exercises/$CREATED_EXERCISE_ID" "${JSON_HEADER[@]}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "language: en" \
  -d "{
    \"name\": \"${EXERCISE_NAME}-Updated\",
    \"difficulty\": \"MEDIUM\"
  }" | jq .

section "Users: list as ADMIN (full data)"
curl_json GET "/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "language: en" | jq .

USER_ID="$(
  curl_json GET "/users" -H "Authorization: Bearer $ADMIN_TOKEN" -H "language: en" \
    | jq -r ".data[] | select(.email==\"$USER_EMAIL\") | .id" | head -n 1
)"
test -n "$USER_ID" && test "$USER_ID" != "null"
echo "USER_ID=$USER_ID"

section "Users: list as USER (id, nickName only)"
curl_json GET "/users" -H "Authorization: Bearer $USER_TOKEN" -H "language: en" | jq .

section "Users: me (USER)"
curl_json GET "/users/me" -H "Authorization: Bearer $USER_TOKEN" -H "language: en" | jq .

section "Users: detail (ADMIN)"
curl_json GET "/users/$USER_ID" -H "Authorization: Bearer $ADMIN_TOKEN" -H "language: en" | jq .

section "Users: update (ADMIN)"
curl_json PUT "/users/$USER_ID" "${JSON_HEADER[@]}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "language: en" \
  -d "{
    \"nickName\": \"${USER_NICK}_updated\",
    \"age\": 26
  }" | jq .

section "User-Exercises: track completed (USER)"
TRACK_ID="$(
  curl_json POST "/user-exercises" "${JSON_HEADER[@]}" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "language: en" \
    -d "{
      \"exerciseId\": $CREATED_EXERCISE_ID,
      \"durationSeconds\": 123,
      \"completedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }" | jq -r '.data.id'
)"
test -n "$TRACK_ID" && test "$TRACK_ID" != "null"
echo "TRACK_ID=$TRACK_ID"

section "User-Exercises: list completed (USER)"
curl_json GET "/user-exercises" -H "Authorization: Bearer $USER_TOKEN" -H "language: en" | jq .

section "User-Exercises: delete tracked item (USER)"
curl_json DELETE "/user-exercises/$TRACK_ID" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "language: en" | jq .

section "Programs: remove exercise from program (ADMIN)"
curl_json DELETE "/programs/$PROGRAM_ID/exercises/$CREATED_EXERCISE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "language: en" | jq .

section "Exercises: delete (ADMIN)"
curl_json DELETE "/exercises/$CREATED_EXERCISE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "language: en" | jq .

echo
echo "All endpoint calls completed."

