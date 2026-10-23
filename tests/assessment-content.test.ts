import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { topics } from "@/content/curriculum";
import { lessons } from "@/content/lessons";
import { projects } from "@/content/projects";
import {
  assessments,
  fundamentalsAssessment as assessment,
} from "@/content/assessments";
import { validateActivities } from "@/lib/activity-validation";
import { scoreQuestions } from "@/lib/quiz";

describe("integrated assessment authoring", () => {
  it("validates global identities, answers, published references and coverage", () => {
    expect(validateActivities(topics, lessons, projects, assessments)).toEqual(
      [],
    );
    const invalid = structuredClone(assessment);
    invalid.questions[0].id = lessons.functions.questions[0].id;
    invalid.questions[0].correctIndex = 99;
    invalid.questions[0].explanation = "";
    invalid.questions.forEach((q) => {
      q.topicIds = ["unknown"];
    });
    const errors = validateActivities(topics, lessons, projects, [
      invalid,
    ]).join(" ");
    expect(errors).toMatch(/Duplicate/);
    expect(errors).toMatch(/Invalid activity answer/);
    expect(errors).toMatch(/Invalid activity topic references/);
    expect(errors).toMatch(/Missing assessment topic coverage/);
  });
  it("scores incomplete, invalid, mixed and perfect attempts deterministically", () => {
    const qs = assessment.questions;
    expect(scoreQuestions(qs, {})).toBe(0);
    expect(
      scoreQuestions(qs, { [qs[0].id]: NaN, [qs[1].id]: -1, [qs[2].id]: 0.5 }),
    ).toBe(0);
    expect(scoreQuestions(qs, { [qs[0].id]: qs[0].correctIndex })).toBe(1);
    expect(
      scoreQuestions(
        qs,
        Object.fromEntries(qs.map((q) => [q.id, q.correctIndex])),
      ),
    ).toBe(12);
  });
  it("checks all authored Python outcomes and recursive frames with native Python", () => {
    const script = `import contextlib, io, json, sys
questions = json.load(sys.stdin)
expected = ['14', 'False', 'A', '5', '3', '4 5', '4', '6', '0', '6\\nNone', '', 'lost']
for q, output in zip(questions, expected):
    stream = io.StringIO()
    events = []
    def trace(frame, event, arg):
        if frame.f_code.co_name in ('sum_down', 'count_down'):
            if event == 'return': events.append(arg)
            if frame.f_code.co_name == 'count_down' and event == 'call' and frame.f_locals.get('n') == 0:
                frames = []
                while frame and frame.f_code.co_name == 'count_down':
                    frames.append(frame.f_locals['n'])
                    frame = frame.f_back
                assert frames == [0, 1, 2]
        return trace
    sys.settrace(trace)
    try:
        with contextlib.redirect_stdout(stream): exec(compile(q['source'], q['id'], 'exec'), {})
    finally: sys.settrace(None)
    assert stream.getvalue().strip() == output, q['id']
    if q['id'] == 'fundamentals-recursive-return': assert events == [0, 1, 3, 6]
print('12 assessment programs verified')`;
    const result = spawnSync("python3", ["-c", script], {
      input: JSON.stringify(assessment.questions),
      encoding: "utf8",
      timeout: 10000,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("12 assessment programs verified");
  });
});
