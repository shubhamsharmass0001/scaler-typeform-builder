"""
test_public_and_seed.py — Comprehensive test for validation, public API, and seed data
"""

import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api"


def make_request(method: str, path: str, data: dict = None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"} if data is not None else {}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            status_code = resp.status
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return status_code, json.loads(content)
            return status_code, content
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(error_body)
        except Exception:
            return e.code, error_body


def test_public_and_seed():
    print("=" * 60)
    print("TEST 1: Verify Seed Data (GET /api/forms)")
    code, forms = make_request("GET", "/forms")
    assert code == 200
    assert len(forms) >= 3
    print(f"✓ Found {len(forms)} forms from seed")
    for f in forms:
        print(f"  - '{f['title']}' (status: {f['status']}, questions: {f['question_count']}, responses: {f['response_count']})")

    print("\n" + "=" * 60)
    print("TEST 2: GET /api/public/forms/csat2026")
    code, pub_form = make_request("GET", "/public/forms/csat2026")
    assert code == 200
    assert pub_form["title"] == "Customer Satisfaction Survey"
    assert len(pub_form["questions"]) == 8
    print(f"✓ Form '{pub_form['title']}' fetched successfully with 8 questions (all 8 types)")

    print("\n" + "=" * 60)
    print("TEST 3: GET /api/public/forms/eventreg")
    code, pub_form_2 = make_request("GET", "/public/forms/eventreg")
    assert code == 200
    assert pub_form_2["title"] == "Event Registration"
    assert len(pub_form_2["questions"]) == 6
    print(f"✓ Form '{pub_form_2['title']}' fetched successfully with 6 questions")

    print("\n" + "=" * 60)
    print("TEST 4: POST /api/public/forms/csat2026/start (Start Session)")
    code, start_res = make_request("POST", "/public/forms/csat2026/start")
    assert code == 201
    assert "response_id" in start_res
    resp_id = start_res["response_id"]
    print(f"✓ Started session: response_id={resp_id}")

    print("\n" + "=" * 60)
    print("TEST 5: PATCH /api/public/forms/csat2026/progress (Drop-off tracking)")
    code, prog_res = make_request("PATCH", "/public/forms/csat2026/progress", {
        "response_id": resp_id,
        "last_question_id": pub_form["questions"][2]["id"],
    })
    assert code == 200
    assert prog_res["last_question_id"] == pub_form["questions"][2]["id"]
    print(f"✓ Recorded drop-off progress: last_question_id={prog_res['last_question_id']}")

    print("\n" + "=" * 60)
    print("TEST 6: POST /api/public/forms/csat2026/submit with INVALID data (Expect 422)")
    bad_payload = {
        "response_id": resp_id,
        "answers": [
            {"question_id": pub_form["questions"][0]["id"], "value": ""},              # Required short text empty
            {"question_id": pub_form["questions"][1]["id"], "value": "not-an-email"},  # Invalid email
            {"question_id": pub_form["questions"][4]["id"], "value": 10},              # Rating > 5
            {"question_id": pub_form["questions"][5]["id"], "value": -10},             # Number < min (1)
            {"question_id": pub_form["questions"][6]["id"], "value": "maybe"},         # Invalid yes/no
        ]
    }
    code, err_res = make_request("POST", "/public/forms/csat2026/submit", bad_payload)
    print(f"Status Code: {code}")
    print(f"Validation Errors: {json.dumps(err_res, indent=2)}")
    assert code == 422
    assert "errors" in err_res
    errors = err_res["errors"]
    # Verify expected question errors
    assert str(pub_form["questions"][0]["id"]) in errors
    assert str(pub_form["questions"][1]["id"]) in errors
    assert str(pub_form["questions"][4]["id"]) in errors
    assert str(pub_form["questions"][5]["id"]) in errors
    assert str(pub_form["questions"][6]["id"]) in errors
    print("✓ Successfully caught 422 with per-question error mapping!")

    print("\n" + "=" * 60)
    print("TEST 7: POST /api/public/forms/csat2026/submit with VALID data (Expect 200)")
    good_payload = {
        "response_id": resp_id,
        "answers": [
            {"question_id": pub_form["questions"][0]["id"], "value": "Alex Morgan"},
            {"question_id": pub_form["questions"][1]["id"], "value": "alex.morgan@test.com"},
            {"question_id": pub_form["questions"][2]["id"], "value": "opt_2"},
            {"question_id": pub_form["questions"][3]["id"], "value": "opt_1"},
            {"question_id": pub_form["questions"][4]["id"], "value": 5},
            {"question_id": pub_form["questions"][5]["id"], "value": 15},
            {"question_id": pub_form["questions"][6]["id"], "value": True},
            {"question_id": pub_form["questions"][7]["id"], "value": "Everything works smoothly."},
        ]
    }
    code, submit_res = make_request("POST", "/public/forms/csat2026/submit", good_payload)
    assert code == 200
    assert submit_res["status"] == "success"
    assert submit_res["response_id"] == resp_id
    print(f"✓ Successfully submitted valid answers: {submit_res}")

    print("\n" + "=" * 60)
    print("TEST 8: Double submission rejection (Expect 400)")
    code, double_res = make_request("POST", "/public/forms/csat2026/submit", good_payload)
    print(f"Status Code: {code}, Detail: {double_res}")
    assert code == 400
    print("✓ Successfully rejected duplicate submission of completed response!")

    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    test_public_and_seed()
