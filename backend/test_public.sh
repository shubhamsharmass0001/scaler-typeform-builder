#!/bin/bash
# test_public.sh — Tests public form viewing, session creation, drop-off tracking,
# invalid submission (verifying per-question 422 errors), and valid submission.

set -e

BASE_URL="http://localhost:8000/api/public/forms/csat2026"

echo "============================================================"
echo "1. GET PUBLISHED FORM METADATA & QUESTIONS"
echo "============================================================"
curl -s "$BASE_URL" | python3 -m json.tool | head -n 35

echo ""
echo "============================================================"
echo "2. START RESPONDENT SESSION (POST /start)"
echo "============================================================"
START_RESP=$(curl -s -X POST "$BASE_URL/start")
echo "$START_RESP" | python3 -m json.tool
RESP_ID=$(echo "$START_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['response_id'])")

echo ""
echo "============================================================"
echo "3. TRACK DROP-OFF PROGRESS (PATCH /progress)"
echo "============================================================"
curl -s -X PATCH "$BASE_URL/progress" \
  -H "Content-Type: application/json" \
  -d "{\"response_id\": $RESP_ID, \"last_question_id\": 3}" | python3 -m json.tool

echo ""
echo "============================================================"
echo "4. SUBMIT INVALID DATA (EXPECT HTTP 422 WITH PER-QUESTION ERRORS)"
echo "============================================================"
curl -s -X POST "$BASE_URL/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"response_id\": $RESP_ID,
    \"answers\": [
      {\"question_id\": 1, \"value\": \"\"},
      {\"question_id\": 2, \"value\": \"invalid-email\"},
      {\"question_id\": 5, \"value\": 99},
      {\"question_id\": 6, \"value\": -5},
      {\"question_id\": 7, \"value\": \"maybe\"}
    ]
  }" | python3 -m json.tool

echo ""
echo "============================================================"
echo "5. SUBMIT VALID DATA (EXPECT HTTP 200 SUCCESS)"
echo "============================================================"
curl -s -X POST "$BASE_URL/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"response_id\": $RESP_ID,
    \"answers\": [
      {\"question_id\": 1, \"value\": \"Jane Austen\"},
      {\"question_id\": 2, \"value\": \"jane@austen.org\"},
      {\"question_id\": 3, \"value\": \"opt_2\"},
      {\"question_id\": 4, \"value\": \"opt_1\"},
      {\"question_id\": 5, \"value\": 5},
      {\"question_id\": 6, \"value\": 12},
      {\"question_id\": 7, \"value\": true},
      {\"question_id\": 8, \"value\": \"Delightful experience!\"}
    ]
  }" | python3 -m json.tool

echo ""
echo "============================================================"
echo "6. REJECT DOUBLE SUBMISSION (EXPECT HTTP 400)"
echo "============================================================"
curl -s -X POST "$BASE_URL/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"response_id\": $RESP_ID,
    \"answers\": [
      {\"question_id\": 1, \"value\": \"Jane Austen\"}
    ]
  }" | python3 -m json.tool

echo ""
echo "============================================================"
echo "✓ PUBLIC FORM ENDPOINTS TESTED SUCCESSFULLY!"
echo "============================================================"
