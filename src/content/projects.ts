import type { GuidedProject } from "./project-types";

const comparison = `def compare_guess(guess, secret):
    if guess < secret:
        return 'Too low'
    if guess > secret:
        return 'Too high'
    return 'Correct'`;
const validation = `def parse_guess(text):
    try:
        guess = int(text)
    except ValueError:
        return None
    if 1 <= guess <= 20:
        return guess
    return None`;
const game = `def play_round(entries, secret, max_attempts=3):
    attempts = 0
    messages = []
    for text in entries:
        if attempts >= max_attempts:
            break
        guess = parse_guess(text)
        if guess is None:
            messages.append('Invalid input')
            continue
        attempts += 1
        message = compare_guess(guess, secret)
        messages.append(message)
        if message == 'Correct':
            return messages, attempts, True
    return messages, attempts, False`;
const helpers = `${comparison}\n\n${validation}`;
const engine = `${helpers}\n\n${game}`;
const terminal = `def main():
    # A fixed secret keeps the first version reproducible.
    secret = 12
    attempts = 0
    while attempts < 3:
        try:
            text = input('Guess an integer from 1 to 20: ')
        except EOFError:
            print('Input ended')
            return
        guess = parse_guess(text)
        if guess is None:
            print('Invalid input')
            continue
        attempts += 1
        message = compare_guess(guess, secret)
        print(message)
        if message == 'Correct':
            return
    print('Out of attempts')`;

export const projects: GuidedProject[] = [
  {
    id: "number-guessing",
    slug: "number-guessing",
    title: "Python Number Guessing Game",
    introduction: [
      "Build a game whose rules you can explain and test. The secret is 12, guesses are integers from 1 to 20 inclusive, and the player has three valid attempts. Invalid entries produce feedback and do not consume an attempt. A correct guess ends the game immediately.",
      "Work one component at a time: comparison, validation, a deterministic round, regression tests, and a terminal interface. Write your implementation in a local Python file before comparing it with the reference. Each stage opens after the preceding stage's check and checklist; hints reveal one step at a time.",
      "The browser checks fixed reasoning questions and saves your checklist. It does not execute or grade your Python. Copy the assertions into your own Python 3 environment to test your implementation. Passing the questions and checking the boxes records guided-project completion, not independent coding mastery.",
    ],
    objectives: [
      "Decompose a specification into small functions with clear contracts.",
      "Validate text before comparisons and count only valid attempts.",
      "Test boundaries and reproduce bugs with fixed inputs.",
      "Connect a tested game engine to a terminal interaction.",
    ],
    prerequisites: [
      "variables-data-types",
      "operators-expressions",
      "conditionals",
      "loops",
      "functions",
      "debugging",
    ],
    milestones: [
      {
        id: "compare",
        title: "Compare a guess with the secret",
        goal: "Implement compare_guess(guess, secret) for integers. Keep input and printing outside this function.",
        connections: [
          {
            topicId: "conditionals",
            explanation:
              "Mutually exclusive comparisons select exactly one message.",
          },
          {
            topicId: "functions",
            explanation:
              "A returned string is testable without capturing printed output.",
          },
        ],
        starter:
          "def compare_guess(guess, secret):\n    # TODO: return Too low, Too high, or Correct\n    pass",
        expectedBehavior:
          "For secret 12: 11 returns 'Too low', 12 returns 'Correct', and 13 returns 'Too high'.",
        hints: [
          "List the three relationships between two integers: less than, greater than, equal.",
          "Return immediately for the two unequal cases. If neither applies, the values are equal.",
        ],
        solution: comparison,
        explanation:
          "Each return ends the function. No branch changes the secret or the guess; the caller decides how to display the result.",
        tests: [
          {
            label: "Below, equal, and above the secret",
            code: "assert compare_guess(11, 12) == 'Too low'\nassert compare_guess(12, 12) == 'Correct'\nassert compare_guess(13, 12) == 'Too high'",
          },
        ],
        question: {
          id: "project-compare-check",
          prompt:
            "Which boundary set distinguishes all three comparison branches for secret 12?",
          options: ["1, 2, 3", "11, 12, 13", "Only 12"],
          correctIndex: 1,
          explanation:
            "11, 12, and 13 exercise below, equal, and above. Testing only the winning input leaves the direction messages unverified.",
        },
        checklist: [
          {
            id: "compare-written",
            text: "I implemented and tested the three comparison outcomes locally.",
          },
        ],
      },
      {
        id: "validate",
        title: "Convert text and validate the range",
        goal: "Implement parse_guess(text). Return an integer in 1..20 or None for invalid text or out-of-range values.",
        connections: [
          {
            topicId: "variables-data-types",
            explanation:
              "input returns text; comparisons require explicit conversion to an integer.",
          },
          {
            topicId: "debugging",
            explanation:
              "Catch the expected ValueError at the conversion boundary and test both range endpoints.",
          },
        ],
        starter:
          "def parse_guess(text):\n    # TODO: convert text, handle conversion failure, check range\n    return None",
        expectedBehavior:
          "'1' and '20' are valid. '0', '21', '', 'cat', and '3.5' return None. int accepts surrounding whitespace and an optional sign, so ' 12 ' and '+12' are valid. This contract accepts Python integer text rather than digits only.",
        hints: [
          "int(text) may raise ValueError. Put only the conversion in try and handle ValueError with return None.",
          "Use 1 <= guess <= 20 after conversion. None is a sentinel; later check guess is None explicitly.",
        ],
        solution: validation,
        explanation:
          "try executes the conversion. except ValueError handles non-integer text; unrelated errors stay visible. The chained comparison includes both endpoints. None distinguishes invalid input from a legitimate integer.",
        tests: [
          {
            label:
              "Endpoints, invalid text, and neighboring out-of-range values",
            code: "assert parse_guess('1') == 1\nassert parse_guess('20') == 20\nassert parse_guess(' 12 ') == 12\nassert parse_guess('+12') == 12\nfor text in ['0', '21', '', 'cat', '3.5']:\n    assert parse_guess(text) is None",
          },
        ],
        question: {
          id: "project-validate-check",
          prompt:
            "A player enters 'cat'. What should happen before any comparison with the secret?",
          options: [
            "Catch ValueError and return None",
            "Convert it to zero and count an attempt",
            "Compare 'cat' with 12",
          ],
          correctIndex: 0,
          explanation:
            "int('cat') raises ValueError. Returning None lets the game reject the entry without a comparison or an attempt. Zero would introduce a value outside the valid contract.",
        },
        checklist: [
          {
            id: "validation-tested",
            text: "I tested empty text, nonnumeric text, both endpoints, and the neighboring invalid values.",
          },
        ],
      },
      {
        id: "round",
        title: "Build a bounded, deterministic round",
        goal: "Implement play_round(entries, secret, max_attempts=3). entries is a finite list of strings. Return (messages, attempts, won). Assume secret is in 1..20 and max_attempts is a nonnegative integer.",
        connections: [
          {
            topicId: "loops",
            explanation:
              "continue skips invalid attempts; break stops when the budget is already exhausted.",
          },
          {
            topicId: "operators-expressions",
            explanation:
              "Increment the counter only after a valid conversion; compare the budget before consuming an entry.",
          },
        ],
        starter: `${helpers}\n\ndef play_round(entries, secret, max_attempts=3):\n    attempts = 0\n    messages = []\n    # TODO: process entries, stop on a win or attempt limit\n    return messages, attempts, False`,
        expectedBehavior:
          "['cat', '8', '12', '19'] with secret 12 returns (['Invalid input', 'Too low', 'Correct'], 2, True). Ignore entries after a win or three valid attempts. Empty entries or a zero attempt budget returns ([], 0, False). Exhausted input can end an unfinished round before the budget runs out.",
        hints: [
          "A list stores messages in order; messages.append(text) adds one. A tuple such as (messages, attempts, False) returns three values together.",
          "Check the attempt budget first. On invalid input append feedback and continue before incrementing attempts.",
          "After a valid guess increment once, append compare_guess's message, and return immediately on Correct. Return False after the loop.",
        ],
        solution: engine,
        explanation:
          "The finite entries keep tests deterministic. Invalid entries use iterations but not valid attempts. The early return prevents a second outcome after a win. This engine accepts supplied strings so tests need no random numbers or keyboard input.",
        tests: [
          {
            label: "Mixed input, a win, exhaustion, and zero work",
            code: "assert play_round(['cat', '8', '12', '19'], 12) == (['Invalid input', 'Too low', 'Correct'], 2, True)\nassert play_round(['1', '2', '3', '12'], 12) == (['Too low', 'Too low', 'Too low'], 3, False)\nassert play_round([], 12) == ([], 0, False)\nassert play_round(['12'], 12, 0) == ([], 0, False)\nassert play_round(['bad'], 12) == (['Invalid input'], 0, False)",
          },
        ],
        question: {
          id: "project-round-check",
          prompt:
            "For entries ['cat', '8', '12', '19'] and secret 12, how many valid attempts are used?",
          options: ["4", "3", "2"],
          correctIndex: 2,
          explanation:
            "cat is invalid and does not increment attempts. 8 uses attempt 1, 12 uses attempt 2 and wins, and 19 is never processed.",
        },
        checklist: [
          {
            id: "round-tested",
            text: "I checked that invalid input costs no attempt and that no entry is processed after a win or the limit.",
          },
        ],
      },
      {
        id: "regression",
        title: "Catch an off-by-one regression",
        goal: "Design a test that fails if attempts >= max_attempts is mistakenly changed to attempts > max_attempts.",
        connections: [
          {
            topicId: "debugging",
            explanation:
              "A smallest failing case isolates the boundary; rerunning it protects a focused repair.",
          },
          {
            topicId: "loops",
            explanation:
              "Check state before starting another iteration, not after consuming the extra guess.",
          },
        ],
        starter:
          "# A bug allows a fourth valid guess.\n# TODO: choose entries where guess four would win.\n# Assert that the game stops after guess three.",
        expectedBehavior:
          "With secret 12 and budget 3, guesses 1, 2, 3, 12 must lose after three guesses; the final 12 must be ignored. With a budget of 1, ['1', '12'] is the smaller version of the same regression.",
        hints: [
          "If every guess is far below the secret, an extra iteration might be easy to miss. Put the winning guess just outside the budget.",
          "Assert the full returned tuple, including messages, count, and won; then reduce max_attempts to 1 for a smaller failing example.",
        ],
        solution: `${engine}\n\nassert play_round(['1', '12'], 12, 1) == (['Too low'], 1, False)`,
        explanation:
          "With the bug, attempts == 1 does not stop the second entry, so 12 wins incorrectly. >= prevents that extra iteration. Retain this test alongside empty, invalid, and success cases.",
        tests: [
          {
            label: "A win immediately outside the valid-attempt budget",
            code: "assert play_round(['1', '12'], 12, 1) == (['Too low'], 1, False)\nassert play_round(['1', '2', '3', '12'], 12, 3) == (['Too low', 'Too low', 'Too low'], 3, False)",
          },
        ],
        question: {
          id: "project-regression-check",
          prompt:
            "Which test best exposes an extra valid attempt when the budget is 1?",
          options: [
            "['12'] should win",
            "['1', '12'] must lose after the first guess",
            "[] should produce no messages",
          ],
          correctIndex: 1,
          explanation:
            "A winning guess immediately beyond the budget distinguishes >= from >. A first-guess win and empty input both behave the same under those two conditions.",
        },
        checklist: [
          {
            id: "regression-kept",
            text: "I tried the > mutation, observed the regression fail, restored >=, and reran the tests.",
          },
        ],
      },
      {
        id: "terminal",
        title: "Connect a terminal interface and reflect",
        goal: "Create main() using the tested helpers. Request one guess at a time with input, show feedback, and stop on a win or three valid attempts.",
        connections: [
          {
            topicId: "functions",
            explanation:
              "Reuse pure comparison and validation functions at an input/output boundary.",
          },
          {
            topicId: "loops",
            explanation:
              "A while loop waits for human input; invalid entries do not advance the valid-attempt counter.",
          },
        ],
        starter: `${helpers}\n\ndef main():\n    secret = 12\n    attempts = 0\n    # TODO: while budget remains, read, validate, count, compare\n\nif __name__ == '__main__':\n    main()`,
        expectedBehavior:
          "Typing cat, 8, then 12 prints Invalid input, Too low, Correct. Three incorrect valid guesses print Out of attempts after their direction messages. End-of-file prints Input ended and exits. The terminal can keep asking after invalid entries; unlike finite test entries, an interactive session depends on a person supplying input.",
        hints: [
          "input(prompt) returns a string. Use parse_guess before comparing and handle EOFError if input closes.",
          "The same order applies: validate, count, compare, return on a win. Put Out of attempts after the while loop; early returns bypass it.",
        ],
        solution: `${engine}\n\n${terminal}`,
        explanation:
          "The terminal adapter reuses the same helpers and rules as the deterministic engine. It is intentionally simple; tests below substitute a known input function and collect prints without requiring a terminal. The __name__ guard in the final reference runs main only when the file is executed directly, so importing it for tests does not prompt.",
        tests: [
          {
            label: "Script the terminal with fake input and capture messages",
            code: "from unittest.mock import patch\nwith patch('builtins.input', side_effect=['cat', '8', '12']), patch('builtins.print') as display:\n    main()\n    assert [call.args[0] for call in display.call_args_list] == ['Invalid input', 'Too low', 'Correct']\nwith patch('builtins.input', side_effect=['1', '2', '3']), patch('builtins.print') as display:\n    main()\n    assert [call.args[0] for call in display.call_args_list] == ['Too low', 'Too low', 'Too low', 'Out of attempts']\nwith patch('builtins.input', side_effect=EOFError), patch('builtins.print') as display:\n    main()\n    display.assert_called_once_with('Input ended')",
          },
        ],
        question: {
          id: "project-terminal-check",
          prompt:
            "Where should Out of attempts be printed so that it does not appear after a win?",
          options: [
            "After the while loop, with an early return on Correct",
            "Before reading every guess",
            "Inside parse_guess",
          ],
          correctIndex: 0,
          explanation:
            "A winning guess returns from main before reaching the final print. Falling out of the while loop means the valid-attempt budget was used. Parsing should not decide game outcomes.",
        },
        checklist: [
          {
            id: "terminal-tested",
            text: "I ran a win, a loss, invalid input, and end-of-file through the terminal adapter.",
          },
          {
            id: "reflection-done",
            text: "I answered the reflection questions and can explain the counter and boundary decisions.",
          },
        ],
      },
    ],
    reference: `${engine}\n\n${terminal}\n\nif __name__ == '__main__':\n    main()`,
    referenceExplanation:
      "Save as guessing_game.py and run python3 guessing_game.py. The fixed secret 12 keeps behavior reproducible. The finite-input engine is testable independently; the terminal adapter requests input as needed. Random secrets and replay are extensions after these rules work, with the secret still supplied explicitly to tests.",
    reflections: [
      "Why does invalid input use an iteration without using an attempt?",
      "Which boundary test would fail if >= became >?",
      "Why return None for invalid text instead of zero?",
      "Which functions can you test without keyboard input, and why?",
      "What evidence would you collect if the terminal and finite-input engine disagreed?",
    ],
  },
];
export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
