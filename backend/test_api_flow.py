"""
test_api_flow.py — Test script exercising all creator endpoints end-to-end
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
        return e.code, error_body


def run_tests():
    print("=" * 60)
    print("STEP 1: POST /api/forms (Create Form)")
    code, form = make_request("POST", "/forms", {"title": "Customer Feedback Survey"})
    print(f"Status: {code}")
    print(f"Created Form ID: {form['id']}, Title: {form['title']}, Status: {form['status']}")
    print(f"Questions count: {len(form['questions'])} (Auto-created starter: '{form['questions'][0]['title']}')")
    assert code == 201
    form_id = form["id"]

    print("\n" + "=" * 60)
    print("STEP 2: PUT /api/forms/{id}/questions (Bulk-save 3 questions)")
    bulk_payload = [
        {
            "type": "short_text",
            "title": "What is your full name?",
            "description": "Please enter first and last name",
            "required": True,
            "properties": {"placeholder": "e.g. Jane Doe"},
        },
        {
            "type": "multiple_choice",
            "title": "How did you hear about us?",
            "required": True,
            "properties": {
                "options": [
                    {"id": "opt_1", "label": "Social Media"},
                    {"id": "opt_2", "label": "Friend / Colleague"},
                    {"id": "opt_3", "label": "Search Engine"},
                ],
                "allowOther": True,
            },
        },
        {
            "type": "rating",
            "title": "How likely are you to recommend us?",
            "required": False,
            "properties": {"steps": 10, "shape": "star"},
        },
    ]
    code, saved_questions = make_request("PUT", f"/forms/{form_id}/questions", bulk_payload)
    print(f"Status: {code}")
    print(f"Saved {len(saved_questions)} questions:")
    for q in saved_questions:
        print(f"  - Position {q['position']}: [{q['type']}] '{q['title']}' (ID: {q['id']})")
    assert code == 200
    assert len(saved_questions) == 3
    assert saved_questions[0]["position"] == 0
    assert saved_questions[1]["position"] == 1
    assert saved_questions[2]["position"] == 2

    print("\n" + "=" * 60)
    print("STEP 3: POST /api/forms/{id}/publish (Publish Form)")
    code, pub_result = make_request("POST", f"/forms/{form_id}/publish")
    print(f"Status: {code}")
    print(f"Publish Result: {pub_result}")
    assert code == 200
    assert pub_result["status"] == "published"
    assert len(pub_result["slug"]) == 8

    print("\n" + "=" * 60)
    print("STEP 4: POST /api/forms/{id}/duplicate (Duplicate Form)")
    code, dup_form = make_request("POST", f"/forms/{form_id}/duplicate")
    print(f"Status: {code}")
    print(f"Duplicated Form ID: {dup_form['id']}, Title: {dup_form['title']}, Status: {dup_form['status']}")
    print(f"Questions count: {len(dup_form['questions'])}")
    assert code == 201
    assert dup_form["title"] == "Copy of Customer Feedback Survey"
    assert dup_form["status"] == "draft"
    assert dup_form["slug"] is None
    assert len(dup_form["questions"]) == 3
    dup_id = dup_form["id"]

    print("\n" + "=" * 60)
    print("STEP 5: GET /api/forms (List Forms)")
    code, forms_list = make_request("GET", "/forms")
    print(f"Status: {code}, Found {len(forms_list)} forms")
    for f in forms_list:
        print(f"  - ID {f['id']}: '{f['title']}', status: {f['status']}, questions: {f['question_count']}, responses: {f['response_count']}")
    assert code == 200
    assert any(f["id"] == form_id for f in forms_list)
    assert any(f["id"] == dup_id for f in forms_list)

    print("\n" + "=" * 60)
    print("STEP 6: GET /api/forms/{id}/summary (Analytics Summary)")
    code, summary = make_request("GET", f"/forms/{form_id}/summary")
    print(f"Status: {code}")
    print(f"Summary for form {form_id}: Total Responses={summary['total_responses']}, Questions={len(summary['questions'])}")
    assert code == 200

    print("\n" + "=" * 60)
    print("STEP 7: GET /api/forms/{id}/export.csv (CSV Export)")
    code, csv_text = make_request("GET", f"/forms/{form_id}/export.csv")
    print(f"Status: {code}")
    print("CSV Headers:")
    print(csv_text.splitlines()[0])
    assert code == 200
    assert "Response ID" in csv_text
    assert "What is your full name?" in csv_text

    print("\n" + "=" * 60)
    print("STEP 8: DELETE /api/forms/{id} (Delete Duplicated Form)")
    code, del_result = make_request("DELETE", f"/forms/{dup_id}")
    print(f"Status: {code}, Detail: {del_result}")
    assert code == 200

    print("\n" + "=" * 60)
    print("STEP 9: DELETE /api/forms/{id} (Delete Original Form)")
    code, del_result = make_request("DELETE", f"/forms/{form_id}")
    print(f"Status: {code}, Detail: {del_result}")
    assert code == 200

    # Verify 404 after deletion
    code, _ = make_request("GET", f"/forms/{form_id}")
    print(f"Verify GET deleted form returns 404: Status {code}")
    assert code == 404

    print("\n" + "=" * 60)
    print("✓ ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
