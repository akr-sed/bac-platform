#!/usr/bin/env bash
# Manual end-to-end curl test for the Sessions API.
# Run with the dev/prod server already running on $HOST.
set -u
HOST="${HOST:-http://localhost:3789}"
TS=$(date +%s)
TEACHER_EMAIL="curl-teacher-${TS}@example.com"
STUDENT_EMAIL="curl-student-${TS}@example.com"
PASSWORD="testpass123"

TEACHER_COOKIES=$(mktemp)
STUDENT_COOKIES=$(mktemp)
ANON_COOKIES=$(mktemp)
trap 'rm -f $TEACHER_COOKIES $STUDENT_COOKIES $ANON_COOKIES' EXIT

step() { echo; echo "=== $* ==="; }

step "1. Register teacher"
curl -s -c "$TEACHER_COOKIES" -X POST "$HOST/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Curl Teacher\",\"email\":\"$TEACHER_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"teacher\"}" | head -c 400
echo

step "2. Register student"
curl -s -c "$STUDENT_COOKIES" -X POST "$HOST/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Curl Student\",\"email\":\"$STUDENT_EMAIL\",\"password\":\"$PASSWORD\",\"role\":\"student\"}" | head -c 400
echo

step "3. Teacher creates session (expect 201)"
SCHEDULED=$(date -u -d '+2 hours' +%Y-%m-%dT%H:%M:%S.000Z)
SESSION_RESPONSE=$(curl -s -b "$TEACHER_COOKIES" -X POST "$HOST/api/sessions" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\":\"Curl test session\",
    \"description\":\"Integration test\",
    \"subject\":\"math\",
    \"scheduledAt\":\"$SCHEDULED\",
    \"durationMinutes\":60,
    \"meetingUrl\":\"https://meet.example.com/curl-test\",
    \"capacity\":2,
    \"priceDA\":0,
    \"topics\":[\"functions\",\"limits\"]
  }")
echo "$SESSION_RESPONSE" | head -c 600
echo
# Extract the FIRST _id which is the session's own _id (appears before teacher object).
SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -oP '"_id":"[^"]+"' | head -1 | sed 's/"_id":"\(.*\)"/\1/')
# Sanity check: cross-check against the teacher field (last _id should differ).
TEACHER_ID=$(echo "$SESSION_RESPONSE" | grep -oP '"_id":"[^"]+"' | tail -1 | sed 's/"_id":"\(.*\)"/\1/')
echo "SESSION_ID=$SESSION_ID"
echo "TEACHER_ID(returned)=$TEACHER_ID"

step "4. Anonymous GET — meetingUrl MUST be hidden"
curl -s -b "$ANON_COOKIES" "$HOST/api/sessions/$SESSION_ID" | head -c 600
echo

step "5. Student GET (not enrolled) — meetingUrl MUST still be hidden"
curl -s -b "$STUDENT_COOKIES" "$HOST/api/sessions/$SESSION_ID" | head -c 600
echo

step "6. Student enrolls (expect 201, isEnrolled=true)"
curl -s -b "$STUDENT_COOKIES" -X POST "$HOST/api/sessions/$SESSION_ID/enroll" \
  -w "\nHTTP %{http_code}\n"
echo

step "7. Student GET again — meetingUrl MUST now be visible, enrolledCount=1"
curl -s -b "$STUDENT_COOKIES" "$HOST/api/sessions/$SESSION_ID" | head -c 700
echo

step "8. Student tries to enroll again (expect 409 Already enrolled)"
curl -s -b "$STUDENT_COOKIES" -X POST "$HOST/api/sessions/$SESSION_ID/enroll" \
  -w "\nHTTP %{http_code}\n"
echo

step "9. Student tries to POST /api/sessions (expect 403)"
curl -s -b "$STUDENT_COOKIES" -X POST "$HOST/api/sessions" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"x\",\"subject\":\"math\",\"scheduledAt\":\"$SCHEDULED\",\"durationMinutes\":60,\"meetingUrl\":\"https://example.com\"}" \
  -w "\nHTTP %{http_code}\n"
echo

step "10. Student unenrolls (expect 200, enrolledCount back to 0)"
curl -s -b "$STUDENT_COOKIES" -X DELETE "$HOST/api/sessions/$SESSION_ID/enroll" \
  -w "\nHTTP %{http_code}\n"
echo

step "11. GET upcoming list (anonymous, no meetingUrl)"
curl -s -b "$ANON_COOKIES" "$HOST/api/sessions?upcoming=true&limit=5" | head -c 700
echo

step "12. Teacher cancels session (DELETE → status=cancelled)"
curl -s -b "$TEACHER_COOKIES" -X DELETE "$HOST/api/sessions/$SESSION_ID" \
  -w "\nHTTP %{http_code}\n"
echo

step "13. Verify status is cancelled"
curl -s -b "$TEACHER_COOKIES" "$HOST/api/sessions/$SESSION_ID" | head -c 600
echo

step "14. Student tries to enroll in cancelled session (expect 400)"
curl -s -b "$STUDENT_COOKIES" -X POST "$HOST/api/sessions/$SESSION_ID/enroll" \
  -w "\nHTTP %{http_code}\n"
echo

echo
echo "=== Done ==="
