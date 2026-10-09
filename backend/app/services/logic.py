"""
logic.py — Conditional Logic and Branching Service

Provides:
  - validate_logic(form, questions): Validates logic rules on bulk save,
    preventing non-existent targets, invalid operators per question type,
    self-jumps, and cycles (using DFS).
  - next_question(question, answers, ordered_questions): Pure evaluation
    function returning the next question id or "end".
  - compute_visited_path(form, answers): Walks from question 1 along the
    evaluated branches and returns the ordered list of questions.

Design Choice regarding backward jumps:
  We permit backward jumps in general (allowing non-cyclic branching/re-routing
  in branching flows), but strictly enforce that all paths are acyclic via full
  DFS cycle detection across all rules, defaults, and sequential fallthroughs.
  Any backward jump that leads back to itself directly or indirectly is caught
  and rejected as a circular path (e.g., "Q2 -> Q5 -> Q2").
"""

import re
from typing import Any, Optional
from fastapi import HTTPException, status

from app.validators.exceptions import ValidationError
from app.validators.registry import _is_empty


class LogicValidationError(HTTPException):
    """Raised when logic rules fail validation (422 Unprocessable Entity)."""
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


# ---------------------------------------------------------------------------
# Helpers for extracting question fields across Models, Schemas, and Dicts
# ---------------------------------------------------------------------------

def _get_q_id(q: Any) -> Any:
    if isinstance(q, dict):
        return q.get("id")
    return getattr(q, "id", None)


def _get_q_type(q: Any) -> str:
    if isinstance(q, dict):
        t = q.get("type")
    else:
        t = getattr(q, "type", None)
    if hasattr(t, "value"):
        return str(t.value)
    return str(t) if t is not None else ""


def _get_q_title(q: Any) -> str:
    if isinstance(q, dict):
        return q.get("title", "") or ""
    return getattr(q, "title", "") or ""


def _get_q_properties(q: Any) -> dict:
    if isinstance(q, dict):
        return q.get("properties") or {}
    props = getattr(q, "properties", None)
    return props if isinstance(props, dict) else {}


def _get_q_position(q: Any, default_idx: int = 0) -> int:
    if isinstance(q, dict):
        pos = q.get("position")
    else:
        pos = getattr(q, "position", None)
    return pos if isinstance(pos, int) else default_idx


# ---------------------------------------------------------------------------
# Allowed Operators per Question Type
# ---------------------------------------------------------------------------

def get_allowed_operators(q_type: str, props: dict) -> set[str]:
    """
    Returns the set of permitted operators for a given question type.
    
    Rules:
      - choice/dropdown/yes_no: equals, not_equals, is_answered, is_empty
      - multi-select (multiple_choice with multiple=True): contains, not contains, not_contains, is_answered, is_empty
      - number/rating: equals, not_equals, greater_than, less_than, is_answered, is_empty
      - text/email: equals, not_equals, contains, is_answered, is_empty
    """
    clean_type = q_type.lower().replace("-", "_")

    if clean_type in ("dropdown", "yes_no", "choice"):
        return {"equals", "not_equals", "is_answered", "is_empty"}
    elif clean_type == "multiple_choice":
        if props.get("multiple") is True:
            return {"contains", "not contains", "not_contains", "is_answered", "is_empty"}
        else:
            return {"equals", "not_equals", "is_answered", "is_empty"}
    elif clean_type in ("multi_select", "multiselect"):
        return {"contains", "not contains", "not_contains", "is_answered", "is_empty"}
    elif clean_type in ("number", "rating"):
        return {"equals", "not_equals", "greater_than", "less_than", "is_answered", "is_empty"}
    elif clean_type in ("short_text", "long_text", "email", "text"):
        return {"equals", "not_equals", "contains", "is_answered", "is_empty"}
    elif clean_type == "file_upload":
        return {"is_answered", "is_empty"}

    return {
        "equals", "not_equals", "contains", "not contains", "not_contains",
        "greater_than", "less_than", "is_answered", "is_empty"
    }


# ---------------------------------------------------------------------------
# Condition Evaluation
# ---------------------------------------------------------------------------

def _to_bool(val: Any) -> bool:
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val != 0
    if isinstance(val, str):
        return val.strip().lower() in ("true", "yes", "y", "1")
    return bool(val)


def _extract_choice_tokens(val: Any, options: list) -> set[str]:
    """Extract IDs and labels associated with a choice value for robust matching."""
    tokens = set()
    if val is None:
        return tokens
    if isinstance(val, dict):
        if "id" in val and val["id"] is not None:
            tokens.add(str(val["id"]).strip().lower())
        if "label" in val and val["label"] is not None:
            tokens.add(str(val["label"]).strip().lower())
    else:
        v_str = str(val).strip().lower()
        tokens.add(v_str)
        for opt in options:
            if isinstance(opt, dict):
                opt_id = str(opt.get("id", "")).strip().lower()
                opt_lbl = str(opt.get("label", "")).strip().lower()
                if v_str in (opt_id, opt_lbl):
                    if opt_id:
                        tokens.add(opt_id)
                    if opt_lbl:
                        tokens.add(opt_lbl)
    return tokens


def evaluate_condition(
    op: str,
    ans_val: Any,
    expected: Any,
    q_type: str,
    props: dict,
) -> bool:
    """Evaluates a single rule condition against the respondent's answer."""
    clean_op = (op or "").strip().lower()

    if clean_op == "is_answered":
        return not _is_empty(ans_val)
    if clean_op == "is_empty":
        return _is_empty(ans_val)

    # If the question was not answered, other operators evaluate as follows
    if _is_empty(ans_val):
        if clean_op == "not_equals":
            return not _is_empty(expected)
        if clean_op in ("not contains", "not_contains"):
            return True
        return False

    clean_type = q_type.lower().replace("-", "_")

    if clean_op == "equals":
        # Yes / No boolean equality
        if clean_type == "yes_no" or isinstance(ans_val, bool) or isinstance(expected, bool):
            return _to_bool(ans_val) == _to_bool(expected)

        # Number / rating numeric equality
        if clean_type in ("number", "rating"):
            try:
                return float(ans_val) == float(expected)
            except (ValueError, TypeError):
                pass

        # Choice / Dropdown matching (matches either option ID or label)
        options = props.get("options", [])
        act_tokens = _extract_choice_tokens(ans_val, options)
        exp_tokens = _extract_choice_tokens(expected, options)
        if act_tokens and exp_tokens and (act_tokens & exp_tokens):
            return True

        return str(ans_val).strip().lower() == str(expected).strip().lower()

    if clean_op == "not_equals":
        return not evaluate_condition("equals", ans_val, expected, q_type, props)

    if clean_op == "greater_than":
        try:
            return float(ans_val) > float(expected)
        except (ValueError, TypeError):
            return False

    if clean_op == "less_than":
        try:
            return float(ans_val) < float(expected)
        except (ValueError, TypeError):
            return False

    if clean_op == "contains":
        options = props.get("options", [])
        exp_tokens = _extract_choice_tokens(expected, options)

        # Multi-select: answer is a list of choices
        if isinstance(ans_val, (list, tuple)):
            for item in ans_val:
                item_tokens = _extract_choice_tokens(item, options)
                if exp_tokens and (item_tokens & exp_tokens):
                    return True
                if str(expected).strip().lower() in [str(x).strip().lower() for x in item_tokens]:
                    return True
            return False

        # Text / email substring match
        return str(expected).strip().lower() in str(ans_val).strip().lower()

    if clean_op in ("not contains", "not_contains"):
        return not evaluate_condition("contains", ans_val, expected, q_type, props)

    return False


# ---------------------------------------------------------------------------
# Normalization Helper
# ---------------------------------------------------------------------------

def _normalize_target(target: Any, ordered_questions: list[Any]) -> Any:
    if target is None:
        return None
    if str(target).strip().lower() == "end":
        return "end"
    for q in ordered_questions:
        qid = _get_q_id(q)
        if qid is not None and str(qid) == str(target):
            return qid
    return target


def _format_question_label(q_key: Any, id_to_q: dict[Any, Any], default_idx: int = 0) -> str:
    """Format question identifier as 'Q2', 'Q5', etc."""
    if q_key == "end":
        return "end"
    q = id_to_q.get(q_key)
    if not q:
        # Check by string key
        q = id_to_q.get(str(q_key))
    if q:
        title = _get_q_title(q).strip()
        # If title matches Q1, Q2, etc., prioritize title
        if re.match(r"^Q\d+$", title):
            return title
        pos = _get_q_position(q, default_idx)
        return f"Q{pos + 1}"
    if isinstance(q_key, int):
        return f"Q{q_key}"
    if str(q_key).isdigit():
        return f"Q{q_key}"
    return f"Q{default_idx + 1}"


# ---------------------------------------------------------------------------
# Logic Validation & Cycle Detection (validate_logic)
# ---------------------------------------------------------------------------

def validate_logic(form: Any = None, questions: Optional[list[Any]] = None) -> None:
    """
    Validates conditional logic rules on bulk save:
      1. All target questions must exist in this form.
      2. Operators must be valid for the question's type.
      3. Rules cannot jump to the same question (self-jump).
      4. Graph of all rules + defaults + sequential fallthrough must be acyclic.
         Cycles are detected via DFS and reported as 'Q2 -> Q5 -> Q2'.
    """
    if questions is None:
        if form is not None and hasattr(form, "questions"):
            questions = list(form.questions)
        elif isinstance(form, dict) and "questions" in form:
            questions = list(form["questions"])
        elif isinstance(form, (list, tuple)):
            questions = list(form)
        else:
            questions = []

    if not questions:
        return

    # Order questions by position
    ordered_questions = sorted(
        questions,
        key=lambda q: _get_q_position(q, 0)
    )

    # Build lookup maps
    valid_targets: set[Any] = {"end", "END"}
    id_to_q: dict[Any, Any] = {}
    node_keys: list[Any] = []

    for idx, q in enumerate(ordered_questions):
        qid = _get_q_id(q)
        key = qid if qid is not None else idx
        node_keys.append(key)
        id_to_q[key] = q
        id_to_q[str(key)] = q

        if qid is not None:
            valid_targets.add(qid)
            valid_targets.add(str(qid))
            id_to_q[qid] = q
            id_to_q[str(qid)] = q

        # Also support indexing by position (1-based e.g. "Q1", "1")
        valid_targets.add(idx + 1)
        valid_targets.add(str(idx + 1))
        valid_targets.add(f"Q{idx + 1}")

        title = _get_q_title(q).strip()
        if title:
            valid_targets.add(title)

    def resolve_node_key(target: Any) -> Any:
        if target is None:
            return None
        if str(target).strip().lower() == "end":
            return "end"
        for idx, q in enumerate(ordered_questions):
            qid = _get_q_id(q)
            q_key = qid if qid is not None else idx
            if qid is not None and (qid == target or str(qid) == str(target)):
                return q_key
            if str(target) in (str(idx + 1), f"Q{idx + 1}"):
                return q_key
            if _get_q_title(q).strip() == str(target).strip():
                return q_key
        return None

    # Step 1: Validate operators, targets, and self-jumps per question
    for idx, q in enumerate(ordered_questions):
        q_key = node_keys[idx]
        q_label = _format_question_label(q_key, id_to_q, idx)
        q_type = _get_q_type(q)
        props = _get_q_properties(q)
        allowed_ops = get_allowed_operators(q_type, props)

        rules = props.get("logic", []) or []
        for r_idx, rule in enumerate(rules):
            conditions = rule.get("conditions", []) or []
            for cond in conditions:
                op = cond.get("operator")
                clean_op = (op or "").strip().lower()
                if clean_op not in allowed_ops:
                    raise LogicValidationError(
                        f"Operator '{op}' is invalid for question type '{q_type}' on {q_label}"
                    )

            action = rule.get("action", {}) or {}
            target = action.get("target_question_id")
            if target is not None:
                if target not in valid_targets and resolve_node_key(target) is None:
                    raise LogicValidationError(
                        f"Target question '{target}' does not exist in this form"
                    )
                resolved = resolve_node_key(target)
                if resolved == q_key:
                    raise LogicValidationError(
                        f"Question '{q_label}' has a logic rule that jumps to itself"
                    )

        logic_default = props.get("logicDefault")
        if logic_default is not None:
            if logic_default not in valid_targets and resolve_node_key(logic_default) is None:
                raise LogicValidationError(
                    f"Default target question '{logic_default}' does not exist in this form"
                )
            resolved_def = resolve_node_key(logic_default)
            if resolved_def == q_key:
                raise LogicValidationError(
                    f"Question '{q_label}' cannot have default target to itself"
                )

    # Step 2: Build graph of all rules + defaults + sequential fallthrough
    graph: dict[Any, list[Any]] = {k: [] for k in node_keys}

    for idx, q in enumerate(ordered_questions):
        q_key = node_keys[idx]
        props = _get_q_properties(q)
        rules = props.get("logic", []) or []
        logic_default = props.get("logicDefault")

        # 1. Add edges from rules
        for rule in rules:
            target = rule.get("action", {}).get("target_question_id")
            if target is not None:
                resolved = resolve_node_key(target)
                if resolved and resolved != "end" and resolved not in graph[q_key]:
                    graph[q_key].append(resolved)

        # 2. Add edge from logicDefault
        if logic_default is not None:
            resolved_def = resolve_node_key(logic_default)
            if resolved_def and resolved_def != "end" and resolved_def not in graph[q_key]:
                graph[q_key].append(resolved_def)
        else:
            # 3. Sequential fallthrough if logicDefault is None
            if idx + 1 < len(ordered_questions):
                next_key = node_keys[idx + 1]
                if next_key not in graph[q_key]:
                    graph[q_key].append(next_key)

    # Step 3: DFS cycle detection over the graph
    visited: set[Any] = set()
    rec_stack_set: set[Any] = set()
    rec_stack_list: list[Any] = []

    def dfs(node: Any) -> Optional[list[Any]]:
        visited.add(node)
        rec_stack_set.add(node)
        rec_stack_list.append(node)

        for neighbor in graph.get(node, []):
            if neighbor == "end":
                continue
            if neighbor in rec_stack_set:
                # Cycle found! Extract cycle path from neighbor back to neighbor
                idx_start = rec_stack_list.index(neighbor)
                cycle = rec_stack_list[idx_start:] + [neighbor]
                return cycle
            if neighbor not in visited:
                found = dfs(neighbor)
                if found:
                    return found

        rec_stack_list.pop()
        rec_stack_set.remove(node)
        return None

    # Check for cycles starting from all nodes in the form
    for node in node_keys:
        if node not in visited:
            cycle_found = dfs(node)
            if cycle_found:
                labels = [
                    _format_question_label(
                        k,
                        id_to_q,
                        node_keys.index(k) if k in node_keys else 0
                    )
                    for k in cycle_found
                ]
                cycle_str = " -> ".join(labels)
                raise LogicValidationError(f"Circular logic path detected: {cycle_str}")


# ---------------------------------------------------------------------------
# next_question: Pure logic jump evaluator
# ---------------------------------------------------------------------------

def next_question(
    question: Any,
    answers: Any,
    ordered_questions: list[Any],
) -> Any:
    """
    Pure function returning the next question id or 'end'.
    
    Evaluates logic rules in order (multi-rule priority: first match wins).
    If no rule matches, evaluates logicDefault.
    If logicDefault is None, falls through to the next question in ordered_questions,
    or 'end' if it was the last question.
    """
    # Normalize answers map: question_id (int & str) -> value
    answers_map: dict[Any, Any] = {}
    if isinstance(answers, dict):
        for k, v in answers.items():
            answers_map[k] = v
            answers_map[str(k)] = v
    elif isinstance(answers, (list, tuple)):
        for a in answers:
            if isinstance(a, dict):
                qid = a.get("question_id")
                val = a.get("value")
            else:
                qid = getattr(a, "question_id", None)
                val = getattr(a, "value", None)
            if qid is not None:
                answers_map[qid] = val
                answers_map[str(qid)] = val

    qid = _get_q_id(question)
    q_type = _get_q_type(question)
    props = _get_q_properties(question)

    ans_val = answers_map.get(qid)
    if ans_val is None and qid is not None and str(qid) in answers_map:
        ans_val = answers_map.get(str(qid))

    rules = props.get("logic", []) or []

    # 1. Multi-rule evaluation in order: first match wins!
    for rule in rules:
        conditions = rule.get("conditions", []) or []
        match_type = (rule.get("match") or "all").strip().lower()

        if not conditions:
            # Unconditional rule
            target = rule.get("action", {}).get("target_question_id")
            if target is not None:
                return _normalize_target(target, ordered_questions)
            continue

        results = []
        for cond in conditions:
            op = cond.get("operator")
            exp = cond.get("value")
            matched = evaluate_condition(op, ans_val, exp, q_type, props)
            results.append(matched)

        rule_matches = any(results) if match_type == "any" else all(results)
        if rule_matches:
            target = rule.get("action", {}).get("target_question_id")
            if target is not None:
                return _normalize_target(target, ordered_questions)

    # 2. If no rule matches: check logicDefault
    logic_default = props.get("logicDefault")
    if logic_default is not None:
        return _normalize_target(logic_default, ordered_questions)

    # 3. Fall through to next question in order
    curr_idx = -1
    for i, q in enumerate(ordered_questions):
        if (_get_q_id(q) is not None and _get_q_id(q) == qid) or q is question:
            curr_idx = i
            break

    if curr_idx != -1 and curr_idx + 1 < len(ordered_questions):
        next_q = ordered_questions[curr_idx + 1]
        next_qid = _get_q_id(next_q)
        return next_qid if next_qid is not None else curr_idx + 1

    return "end"


# ---------------------------------------------------------------------------
# compute_visited_path: Walks from question 1 along evaluated logic
# ---------------------------------------------------------------------------

def compute_visited_path(form: Any, answers: Any) -> list[Any]:
    """
    Walks from question 1 using next_question and returns the ordered list
    of questions the respondent should have seen based on submitted answers.
    """
    if hasattr(form, "questions") and form.questions:
        questions = list(form.questions)
    elif isinstance(form, dict) and "questions" in form:
        questions = list(form["questions"])
    elif isinstance(form, (list, tuple)):
        questions = list(form)
    else:
        questions = []

    if not questions:
        return []

    ordered = sorted(
        questions,
        key=lambda q: _get_q_position(q, 0)
    )

    path = []
    visited_keys = set()
    current = ordered[0]

    while current is not None:
        cid = _get_q_id(current)
        c_key = cid if cid is not None else id(current)
        if c_key in visited_keys:
            # Prevent infinite loop in case of circular runtime graph
            break
        path.append(current)
        visited_keys.add(c_key)
        if cid is not None:
            visited_keys.add(cid)
            visited_keys.add(str(cid))

        nxt_id = next_question(current, answers, ordered)
        if nxt_id == "end" or nxt_id is None:
            break

        next_q = None
        for q in ordered:
            qid = _get_q_id(q)
            if qid is not None and (qid == nxt_id or str(qid) == str(nxt_id)):
                next_q = q
                break

        current = next_q

    return path
