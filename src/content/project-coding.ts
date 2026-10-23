import type { GuidedProject } from "./project-types";
import type { CodingExercise, CodingTest } from "./coding-types";

/** Enrich the existing Number Guessing Game content without changing its V1 progress contract. */
export function withNumberGuessingLabs(project: GuidedProject): GuidedProject {
  const round = project.milestones.find((m) => m.id === "round")!;
  const referenceEngine = round.solution;
  const mutation = referenceEngine.replace(
    "attempts >= max_attempts",
    "attempts > max_attempts",
  );
  const starters: Record<string, string> = {
    compare: project.milestones[0].starter,
    validate:
      "def parse_guess(text):\n    # TODO: return a valid integer or None\n    pass",
    round:
      "# Carry forward your compare_guess and parse_guess implementations.\ndef play_round(entries, secret, max_attempts=3):\n    # TODO: count valid attempts, collect messages, stop on a win\n    pass",
    regression:
      "# Carry forward your game, then write a test accepting a game function.\ndef test_attempt_limit(play):\n    # TODO: assert the winning guess outside the budget is ignored\n    pass",
    terminal:
      "# Carry forward your tested helpers and engine.\ndef main():\n    # TODO: request input, validate, count, compare, and handle EOF\n    pass\n\nif __name__ == '__main__':\n    main()",
  };
  const extra: Record<string, CodingTest[]> = {
    round: [
      {
        id: "round-valid-budget",
        label: "Winning guess just outside the attempt limit",
        code: "actual = play_round(['1', '2', '3', '12'], 12)\nexpected = (['Too low', 'Too low', 'Too low'], 3, False)\nassert actual == expected, f'Expected {expected!r}, observed {actual!r}'",
        expectedBehavior:
          "Stop after three valid guesses; the fourth input must not win.",
        guidance:
          "Inspect the attempt-limit condition before processing another entry. At equality the budget is already exhausted; invalid input must skip the counter update.",
        conceptIds: ["loops", "debugging"],
      },
      {
        id: "round-zero-budget",
        label: "Zero permitted attempts and empty input",
        code: "for entries, budget in [(['12'], 0), ([], 3)]:\n    actual = play_round(entries, 12, budget)\n    assert actual == ([], 0, False), f'Expected no work, observed {actual!r}'",
        expectedBehavior:
          "Neither a zero budget nor empty entries consumes an attempt.",
        guidance:
          "Check the stopping rule before comparing a guess; initialize state so an empty loop has a defined result.",
        conceptIds: ["loops", "conditionals"],
      },
    ],
    regression: [
      {
        id: "regression-own-game",
        label: "Your test accepts your own game",
        code: "test_attempt_limit(play_round)",
        expectedBehavior:
          "Your boundary assertion passes for your correctly bounded game.",
        guidance:
          "Carry your game forward and write an assertion about a winning guess immediately beyond a one-attempt budget. The test takes the game function as its argument.",
        conceptIds: ["functions", "debugging"],
      },
      {
        id: "regression-correct-fixture",
        label: "Your test accepts the provided correct fixture",
        code: `fixture = {}\nexec(${JSON.stringify(referenceEngine)}, fixture)\ntest_attempt_limit(fixture['play_round'])`,
        expectedBehavior:
          "The authored correct fixture is accepted by your test.",
        guidance:
          "A test that raises unconditionally is not useful. Specify the expected one-attempt behavior precisely.",
        conceptIds: ["debugging", "functions"],
      },
      {
        id: "regression-rejects-mutation",
        label: "Your test rejects the provided extra-attempt fixture",
        code: `fixture = {}\nexec(${JSON.stringify(mutation)}, fixture)\ntry:\n    test_attempt_limit(fixture['play_round'])\nexcept AssertionError:\n    pass\nelse:\n    raise AssertionError('Your test accepted an extra attempt; place a winning guess just beyond the budget')`,
        expectedBehavior:
          "Your assertion fails for the explicit > mutation that permits an extra guess.",
        guidance:
          "A test with only a first-guess win or no assertions cannot distinguish the bug. Put the winning guess just outside the permitted budget, and use the supplied play parameter.",
        conceptIds: ["debugging", "loops"],
      },
    ],
  };
  return {
    ...project,
    milestones: project.milestones.map((milestone) => {
      const originalChecks: CodingTest[] = milestone.tests.map(
        (test, index) => ({
          id: `${milestone.id}-contract-${index + 1}`,
          label: test.label,
          code: test.code,
          expectedBehavior: milestone.expectedBehavior,
          guidance:
            milestone.id === "terminal"
              ? "Use the carried helpers. Tests call main with scripted input and unittest.mock: check win, loss, and EOF separately in the traceback. Avoid printing after an early return."
              : milestone.explanation,
          conceptIds: milestone.connections.map((c) => c.topicId),
        }),
      );
      const tests =
        milestone.id === "regression"
          ? [...originalChecks, ...extra.regression]
          : [...originalChecks, ...(extra[milestone.id] ?? [])];
      const coding: CodingExercise = {
        id: `number-guessing-${milestone.id}`,
        topicId: milestone.connections[0].topicId,
        title: `Code Lab: ${milestone.title}`,
        starter: starters[milestone.id],
        tests,
        instructions: [
          milestone.goal,
          "Use your own implementation. Carry forward deliberately copies the previous stage's saved code and appends this stage's starter; it never inserts a reference solution.",
          ...(milestone.id === "regression"
            ? [
                "Here you are writing a test, not another engine. Define test_attempt_limit(play). The harness explicitly evaluates it against your game, an authored correct fixture, and an authored faulty fixture with > instead of >=. Fixture engines evaluate the quality of your assertion; they do not count as your implemented game.",
              ]
            : []),
        ],
        expectedBehavior: milestone.expectedBehavior,
        demonstrationInput:
          milestone.id === "terminal" ? "cat\n8\n12\n" : undefined,
        explanation:
          "Run executes your code. Run Tests checks the authored groups in fresh namespaces. Passing is advisory local evidence, not mastery or tamper-resistant grading; existing reasoning and completion checklists remain separate.",
        reflection:
          milestone.id === "regression"
            ? "Why does your assertion distinguish >= from >, rather than merely run both versions?"
            : "Which boundary did your implementation initially miss, and what changed after reading the feedback?",
        conceptIds: milestone.connections.map((c) => c.topicId),
      };
      return { ...milestone, coding };
    }),
  };
}
