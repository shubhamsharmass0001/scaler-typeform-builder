#!/bin/bash
# verify_flow.sh — Demonstrates the complete form lifecycle using curl:
# create -> bulk-save 3 questions -> publish -> duplicate -> delete

set -e

BASE_URL="http://localhost:8000/api"

echo "============================================================"
echo "1. CREATE FORM (POST /api/forms)"
echo "============================================================"
CREATE_RESP=$(curl -s -X POST "$BASE_URL/forms" \
  -H "Content-Type: application/json" \
  -d '{"title": "Product Feedback Form", "welcome_title": "Welcome!", "welcome_description": "Takes 2 mins"}')

echo "$CREATE_RESP" | python3 -m json.tool

FORM_ID=$(echo "$CREATE_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Created Form ID: $FORM_ID"

echo ""
echo "============================================================"
echo "2. BULK-SAVE 3 QUESTIONS (PUT /api/forms/$FORM_ID/questions)"
echo "============================================================"
QUESTIONS_RESP=$(curl -s -X PUT "$BASE_URL/forms/$FORM_ID/questions" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "short_text",
      "title": "What is your email address?",
      "required": true,
      "properties": {"placeholder": "name@example.com"}
    },
    {
      "type": "multiple_choice",
      "title": "Which feature do you use most?",
      "required": true,
      "properties": {
        "options": [
          {"id": "opt_1", "label": "Form Builder"},
          {"id": "opt_2", "label": "Analytics"},
          {"id": "opt_3", "label": "Integrations"}
        ]
      }
    },
    {
      "type": "rating",
      "title": "How satisfied are you with the platform?",
      "required": false,
      "properties": {"steps": 5, "shape": "star"}
    }
  ]')

echo "$QUESTIONS_RESP" | python3 -m json.tool

echo ""
echo "============================================================"
echo "3. PUBLISH FORM (POST /api/forms/$FORM_ID/publish)"
echo "============================================================"
PUB_RESP=$(curl -s -X POST "$BASE_URL/forms/$FORM_ID/publish")
echo "$PUB_RESP" | python3 -m json.tool

echo ""
echo "============================================================"
echo "4. DUPLICATE FORM (POST /api/forms/$FORM_ID/duplicate)"
echo "============================================================"
DUP_RESP=$(curl -s -X POST "$BASE_URL/forms/$FORM_ID/duplicate")
echo "$DUP_RESP" | python3 -m json.tool

DUP_ID=$(echo "$DUP_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo "Duplicated Form ID: $DUP_ID"

echo ""
echo "============================================================"
echo "5. LIST FORMS (GET /api/forms)"
echo "============================================================"
curl -s "$BASE_URL/forms" | python3 -m json.tool

echo ""
echo "============================================================"
echo "6. DELETE DUPLICATED FORM (DELETE /api/forms/$DUP_ID)"
echo "============================================================"
curl -s -X DELETE "$BASE_URL/forms/$DUP_ID" | python3 -m json.tool

echo ""
echo "============================================================"
echo "7. DELETE ORIGINAL FORM (DELETE /api/forms/$FORM_ID)"
echo "============================================================"
curl -s -X DELETE "$BASE_URL/forms/$FORM_ID" | python3 -m json.tool

echo ""
echo "============================================================"
echo "✓ LIFECYCLE COMPLETE: Form created, questions saved, published, duplicated, and deleted!"
echo "============================================================"
