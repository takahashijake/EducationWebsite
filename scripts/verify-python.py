"""Execute repository-authored Python only. Input is the typed catalog exported by Vitest.

This is an authoring check, never a browser learner-code execution service.
"""
import contextlib
import io
import json
import math
import sys

catalog = json.load(sys.stdin)
programs = 0
checks = 0


def equal(actual, expected, label):
    global checks
    checks += 1
    assert actual == expected, f"{label}: expected {expected!r}, got {actual!r}"


def execute(source, label, expected=None, error=None, prelude=""):
    global programs
    programs += 1
    output = io.StringIO()
    namespace = {}
    raised = None
    with contextlib.redirect_stdout(output):
        try:
            if prelude:
                exec(compile(prelude, "<prelude>", "exec"), namespace)
                output.seek(0)
                output.truncate(0)
            exec(compile(source, label, "exec"), namespace)
        except Exception as exc:
            raised = type(exc).__name__
    equal(raised, error, label + " exception")
    if expected is not None:
        equal(output.getvalue().strip(), expected, label + " output")
    return namespace, output.getvalue().strip()


predictions = {
    "operators-p1": "14", "operators-p2": "2 3",
    "conditionals-p1": "middle", "conditionals-p2": "A\nB",
    "loops-p1": "6", "loops-p2": "1", "functions-p1": "5 6",
    "functions-p2": "6\nNone",
    "recursion-predict-return": "6", "recursion-predict-depth": "6",
    "recursion-predict-empty": "0", "debugging-boundary": "False",
    "debugging-loop-fix": "3", "debugging-function-return": "7\nNone",
}
for lesson in catalog["lessons"].values():
    expected = {"recursion": "6", "debugging": "6\n1\n0"}.get(lesson["topicId"])
    execute(lesson["code"]["source"], lesson["topicId"], expected)
    for section in lesson.get("sections", []):
        if "code" in section:
            error = "ZeroDivisionError" if section["title"] == "Read a traceback from the bottom up" else None
            expected = {
                "Worked example 2: sum a sequence without copying it": "8\n0",
                "Final comparison: recursion and iteration": "6\n1",
            }.get(section["title"])
            execute(section["code"], section["title"], expected, error)
    demo = lesson["demonstration"]
    if demo["kind"] == "trace":
        execute(demo["source"], demo["title"], "\n".join(demo["steps"][-1]["output"]))
    for exercise in lesson.get("exercises", []):
        execute(exercise["source"], exercise["id"], predictions[exercise["id"]])

# Check the actual recursive call/return order AND local state in all authored frames.
trace = catalog["recursionTrace"]
records = []


def inspect_recursion(frame, event, arg):
    if frame.f_code.co_filename != "<recursion-trace>" or frame.f_code.co_name != "factorial":
        return inspect_recursion
    frames = []
    current = frame
    while current and current.f_code.co_name == "factorial":
        frames.append({name: value for name, value in current.f_locals.items() if name in ("n", "smaller")})
        current = current.f_back
    records.append({"event": event, "line": frame.f_lineno, "frames": list(reversed(frames)), "value": arg})
    return inspect_recursion


try:
    sys.settrace(inspect_recursion)
    execute(trace["source"], "<recursion-trace>", "6")
finally:
    sys.settrace(None)
calls = [r["frames"][-1]["n"] for r in records if r["event"] == "call"]
returns = [r["value"] for r in records if r["event"] == "return"]
equal(calls, [3, 2, 1, 0], "Python recursive arguments")
equal(returns, [1, 1, 2, 6], "Python recursive returns")
cursor = 0
for step in trace["steps"]:
    event = step.get("stackEvent")
    if not event:
        continue
    stack = step["stack"]
    if not stack:  # Last pop returns to the external print call.
        continue
    locals_expected = [{v["name"]: v["value"] for v in f["locals"]} for f in stack]
    kind = event["kind"]
    for record_index in range(cursor, len(records)):
        record = records[record_index]
        event_matches = (
            (kind == "push" and record["event"] == "call") or
            (kind == "base" and record["event"] == "line" and record["line"] == 3) or
            (kind == "return" and record["event"] == "return") or
            (kind == "pop" and record["event"] == "line" and record["line"] == 5)
        )
        if event_matches and record["frames"] == locals_expected:
            if kind == "return":
                equal(record["value"], stack[-1]["returnValue"], "frame return value")
            cursor = record_index + 1
            break
    else:
        raise AssertionError(f"No ordered Python state matches authored {event}: {locals_expected}")
    checks += 1

reference = catalog["gameSource"]
namespace, _ = execute(reference, "reference game", "Attempt 1 : Too low\nAttempt 2 : Too high\nAttempt 3 : Correct\nYou won!")
project = catalog["project"]
for checkpoint in project["checkpoints"]:
    if checkpoint.get("source"):
        expected = "exhausted" if checkpoint["id"] == "debug" else None
        execute(checkpoint["source"], "checkpoint " + checkpoint["id"], expected, prelude=reference)
    if checkpoint.get("exercise"):
        exercise = checkpoint["exercise"]
        expected = {"project-state":"", "project-compare":"Correct", "project-attempts":"Attempt 1 : Too low\nAttempt 2 : Correct\nYou won!", "project-debug-order":"", "project-boundary-test":"Attempt 1 : Correct\nYou won!"}[exercise["id"]]
        execute(exercise["source"], exercise["id"], expected, prelude=reference)
    if checkpoint.get("trace"):
        demo = checkpoint["trace"]
        execute(demo["source"], "game trace", "\n".join(demo["steps"][-1]["output"]))

# Cross-check both recursive examples against independent standard-library operations.
factorial, _ = execute(catalog["lessons"]["recursion"]["code"]["source"], "factorial cross-check")
iterative_section = next(section for section in catalog["lessons"]["recursion"]["sections"] if section["title"] == "Final comparison: recursion and iteration")
iterative, _ = execute(iterative_section["code"], "iterative cross-check")
for n in range(9):
    equal(factorial["factorial"](n), math.factorial(n), f"recursive factorial {n}")
    equal(iterative["factorial_iterative"](n), math.factorial(n), f"iterative factorial {n}")
sum_section = next(section for section in catalog["lessons"]["recursion"]["sections"] if section["title"].startswith("Worked example 2"))
summation, _ = execute(sum_section["code"], "sequence sum cross-check")
for values in [[], [0], [4, 1, 3], [-2, 5]]:
    before = list(values)
    equal(summation["sum_from"](values), sum(values), f"recursive sequence sum {values}")
    equal(values, before, "recursive sum preserves input")

# Return status and exact output catch extra attempts, hidden loss, and stale state.
cases = [
    ([7], 7, 3, "won", ["Attempt 1 : Correct", "You won!"]),
    ([3], 7, 3, "incomplete", ["Attempt 1 : Too low", "No more guesses supplied."]),
    ([9], 7, 3, "incomplete", ["Attempt 1 : Too high", "No more guesses supplied."]),
    ([3, 9, 7], 7, 3, "won", ["Attempt 1 : Too low", "Attempt 2 : Too high", "Attempt 3 : Correct", "You won!"]),
    ([3, 9, 9, 7], 7, 3, "exhausted", ["Attempt 1 : Too low", "Attempt 2 : Too high", "Attempt 3 : Too high", "No attempts left."]),
    ([1], 1, 3, "won", ["Attempt 1 : Correct", "You won!"]),
    ([10], 10, 3, "won", ["Attempt 1 : Correct", "You won!"]),
    ([], 7, 3, "incomplete", ["No more guesses supplied."]),
    ([7, 3], 7, 1, "won", ["Attempt 1 : Correct", "You won!"]),
    ([3, 7], 7, 1, "exhausted", ["Attempt 1 : Too low", "No attempts left."]),
]
for guesses, target, limit, status, expected in cases:
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        actual = namespace["play_game"](guesses, target, limit)
    equal(actual, status, f"game status {guesses}")
    equal(output.getvalue().strip().splitlines(), expected, f"game output {guesses}")

# Independently verify the corrections taught in debugging; do not just test the buggy output.
source = catalog["lessons"]["debugging"]["code"]["source"]
fixed, _ = execute(source, "fixed inclusive sum")
for limit, expected in [(0, 0), (1, 1), (3, 6), (4, 10)]:
    equal(fixed["sum_through"](limit), expected, f"inclusive sum {limit}")
corrected_age = catalog["lessons"]["debugging"]["exercises"][0]["source"].replace("age > 18", "age >= 18")
fixed, _ = execute(corrected_age, "corrected age", "True")
for age, expected in [(17, False), (18, True), (19, True)]:
    equal(fixed["can_enter"](age), expected, f"age {age}")
corrected_return = catalog["lessons"]["debugging"]["exercises"][2]["source"].replace("    print(total)", "    return total")
fixed, _ = execute(corrected_return, "corrected function return", "7")
equal(fixed["add_fee"](0), 2, "fee zero")

expected_outputs = ["14", "False", "A", "5", "3", "4 5", "4", "6", "0", "6\nNone", "", "lost"]
for question, expected in zip(catalog["assessment"]["questions"], expected_outputs, strict=True):
    execute(question["source"], question["id"], expected)
# Reconstruct the recursive return sequence for the assessment, rather than only its print.
assessment_sum = catalog["assessment"]["questions"][7]["source"]
observed = []


def record_sum(frame, event, value):
    if frame.f_code.co_name == "sum_down" and event == "return":
        observed.append(value)
    return record_sum


try:
    sys.settrace(record_sum)
    execute(assessment_sum, "assessment recursive returns", "6")
finally:
    sys.settrace(None)
equal(observed, [0, 1, 3, 6], "assessment unwinding")

# Verify the assessment's independent count_down frames and proposed boundary correction.
countdown_frames = []
def record_countdown(frame, event, value):
    if frame.f_code.co_name == "count_down" and event == "call":
        countdown_frames.append(frame.f_locals["n"])
    return record_countdown
try:
    sys.settrace(record_countdown)
    execute(catalog["assessment"]["questions"][8]["source"], "assessment recursive depth", "0")
finally:
    sys.settrace(None)
equal(countdown_frames, [2, 1, 0], "assessment independent arguments and depth")
last_source = catalog["assessment"]["questions"][11]["source"]
last_source = last_source.replace('    if attempts == limit:\n        return "lost"\n    if guess == target:\n        return "won"', '    if guess == target:\n        return "won"\n    if attempts == limit:\n        return "lost"')
last_fixed, _ = execute(last_source, "assessment final-attempt correction", "won")
for guess, attempts, expected in [(7, 3, "won"), (3, 3, "lost"), (3, 2, "continue"), (7, 1, "won")]:
    equal(last_fixed["last_attempt"](guess, 7, attempts, 3), expected, "last-attempt helper")

print(json.dumps({"programs": programs, "checks": checks, "game_cases": len(cases), "recursive_frames_verified": len(calls)}))
