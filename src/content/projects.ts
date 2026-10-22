import type { CodeTrace, GuidedProject } from "./types";

export const guessLogic = `def evaluate_guess(guess, target):
    if guess < target:
        return "Too low"
    if guess > target:
        return "Too high"
    return "Correct"`;

export const guessingGameSource = `${guessLogic}

def play_game(guesses, target=7, max_attempts=3):
    attempts = 0
    for guess in guesses:
        if attempts == max_attempts:
            break
        attempts = attempts + 1
        feedback = evaluate_guess(guess, target)
        print("Attempt", attempts, ":", feedback)
        if feedback == "Correct":
            print("You won!")
            return "won"
    if attempts == max_attempts:
        print("No attempts left.")
        return "exhausted"
    print("No more guesses supplied.")
    return "incomplete"

play_game([3, 9, 7])`;

const state = (attempts: number, guess?: number, feedback?: string) => [
  { name: "target", value: 7, scope: "play_game" },
  { name: "max_attempts", value: 3, scope: "play_game" },
  { name: "attempts", value: attempts, scope: "play_game" },
  ...(guess === undefined
    ? []
    : [{ name: "guess", value: guess, scope: "play_game" }]),
  ...(feedback === undefined
    ? []
    : [{ name: "feedback", value: feedback, scope: "play_game" }]),
];
export const guessingGameTrace: CodeTrace = {
  kind: "trace",
  title: "A three-attempt game",
  caption:
    "A fixed target of 7 and supplied guesses [3, 9, 7] make every state reproducible. Feedback from the previous attempt stays bound until reassigned.",
  source: guessingGameSource,
  steps: [
    {
      lines: [9],
      explanation:
        "Call play_game with the sample guesses. Initialize attempts = 0.",
      variables: state(0),
      output: [],
    },
    {
      lines: [10, 11, 13],
      explanation:
        "First guess is 3. The limit check is False, so increment attempts to 1.",
      variables: state(1, 3),
      output: [],
    },
    {
      lines: [2, 3, 14, 15],
      explanation:
        "evaluate_guess(3, 7) returns Too low. Store feedback and print it.",
      variables: state(1, 3, "Too low"),
      output: ["Attempt 1 : Too low"],
    },
    {
      lines: [16, 10, 11, 13],
      explanation:
        "The guess was not correct. Get 9 and increment attempts to 2. Previous feedback is still Too low until line 14 reassigns it.",
      variables: state(2, 9, "Too low"),
      output: ["Attempt 1 : Too low"],
    },
    {
      lines: [4, 5, 14, 15],
      explanation:
        "evaluate_guess(9, 7) returns Too high. Replace feedback and print it.",
      variables: state(2, 9, "Too high"),
      output: ["Attempt 1 : Too low", "Attempt 2 : Too high"],
    },
    {
      lines: [16, 10, 11, 13],
      explanation:
        "The guess was not correct. Get 7; attempts was 2 so another guess is allowed. Increment to 3. The old feedback remains until reassignment.",
      variables: state(3, 7, "Too high"),
      output: ["Attempt 1 : Too low", "Attempt 2 : Too high"],
    },
    {
      lines: [2, 4, 6, 14, 15],
      explanation:
        "Both comparisons are False for equality. evaluate_guess returns Correct; print the feedback for attempt 3.",
      variables: state(3, 7, "Correct"),
      output: [
        "Attempt 1 : Too low",
        "Attempt 2 : Too high",
        "Attempt 3 : Correct",
      ],
    },
    {
      lines: [16, 17, 18],
      explanation:
        "Success is checked before the exhausted result after the loop. Print You won! and return won. There is no fourth attempt and no No attempts left message.",
      variables: [],
      output: [
        "Attempt 1 : Too low",
        "Attempt 2 : Too high",
        "Attempt 3 : Correct",
        "You won!",
      ],
    },
  ],
  result:
    "The final allowed guess succeeds: three attempts, then immediate termination with won.",
};

export const numberGuessingProject: GuidedProject = {
  id: "number-guessing",
  slug: "number-guessing",
  title: "Build a Number Guessing Game",
  introduction:
    "Turn separate programming concepts into one small program. Plan its behavior, build a comparison function, add repetition, investigate a failure, and test the boundaries. The browser checks authored choices; run your Python locally to test your own code.",
  topicIds: [
    "variables-data-types",
    "operators-expressions",
    "conditionals",
    "loops",
    "functions",
    "debugging",
  ],
  checkpoints: [
    {
      id: "understand",
      title: "Understand the problem",
      paragraphs: [
        "Build a game with a defined target 7, guesses from 1 through 10, and at most three attempts. Each guess gets Too low, Too high, or Correct. A correct guess ends the game immediately, including on the third attempt. After three incorrect guesses, report No attempts left. Do not process extra guesses after termination.",
        "We will supply guesses as a Python list so you can reproduce tests without typing or randomness. Inputs are integers from 1 through 10; max_attempts is a positive integer. Input parsing and invalid-input recovery are optional extensions. If the supplied list ends before success or the limit, report No more guesses supplied and return incomplete. The reference is a complete deterministic game driver, not an interactive terminal input prompt.",
        "Acceptance examples: [7] → Correct then You won!, one attempt; [3, 7] → Too low then Correct, two attempts; [9, 9, 9, 7] → three Too high messages then No attempts left, ignoring the fourth guess. Return statuses won, exhausted, and incomplete let tests distinguish outcomes without guessing from a screenshot.",
        "Before reading more, sketch state and control flow: remember target, attempts, max_attempts, the current guess, and feedback. For each supplied guess, check remaining capacity, count it once, compare it, print feedback, then return on success. After the loop decide whether attempts ran out or input ran out.",
      ],
      expected:
        "A written plan distinguishes state (values we remember) from decisions and repetition (control flow).",
      exercise: {
        id: "project-state",
        source: "target = 7\nmax_attempts = 3\nattempts = 0",
        prompt: "Which value must change after each processed guess?",
        options: ["target", "attempts", "max_attempts"],
        correctIndex: 1,
        explanation:
          "attempts counts processed guesses and increases once each time. target stays 7, and max_attempts stays 3. Changing the target moves the goal; changing the limit fails to count work already done.",
      },
    },
    {
      id: "logic",
      title: "Implement the logic",
      paragraphs: [
        "Write evaluate_guess(guess, target). It has one job: compare two numbers and return feedback. It should not print, increment attempts, or run the whole game. Returning a string lets the caller decide what to do next.",
        "The first return runs only for a smaller guess. If that condition is false, check whether the guess is larger. If both comparisons are false, the integers must be equal. return ends this call immediately, so these separate if statements cannot return two answers for one call. Equality belongs to neither the low nor the high branch.",
        "Try predicting evaluate_guess(3, 7), evaluate_guess(9, 7), and evaluate_guess(7, 7) on paper. Then save the function in guessing_game.py and add print(evaluate_guess(7, 7)) temporarily to run it with python3 guessing_game.py. Remove that temporary print when assembling the complete program.",
      ],
      source: guessLogic,
      expected:
        "The function returns Too low for 3, Too high for 9, and Correct for 7 when the target is 7.",
      exercise: {
        id: "project-compare",
        source: guessLogic + "\n\nprint(evaluate_guess(7, 7))",
        prompt: "What does the equality case print?",
        options: ["Too low", "Correct", "Too high"],
        correctIndex: 1,
        explanation:
          "7 < 7 and 7 > 7 are both False, so the final return supplies Correct. Low and high are strict comparisons; neither includes equality.",
      },
    },
    {
      id: "iteration",
      title: "Add iteration",
      paragraphs: [
        "Keep the comparison function separate from play_game. The loop processes a list one guess at a time. Check the limit before processing the next guess, increment attempts once, then call evaluate_guess and inspect its return. Returning won ends the function and its loop; break only exits the loop so the code after it can report exhaustion.",
        "Follow the trace before opening the full solution in the final checkpoint. Notice the third guess is legal: before it starts, attempts is 2, not 3. After counting it, attempts is 3, but the guess must still be evaluated. Also notice feedback retains its previous value until assignment replaces it.",
        "Implement the loop locally using the trace source as guidance. Default parameters target=7 and max_attempts=3 allow play_game([3, 9, 7]) to omit those arguments. A list is an ordered collection of guesses; the loop variable guess receives one element per iteration.",
      ],
      trace: guessingGameTrace,
      expected:
        "For [3, 9, 7], print three attempt messages followed by You won! and return won.",
      exercise: {
        id: "project-attempts",
        source: "# target = 7, max_attempts = 3\nplay_game([3, 7, 9])",
        prompt: "How many guesses should be processed before termination?",
        options: [
          "3 because the list has three items",
          "1 because the target is defined",
          "2 because the second guess succeeds",
        ],
        correctIndex: 2,
        explanation:
          "Process 3, then 7. The second guess is correct, so return immediately and never process 9. List length is only a maximum supply; a defined target alone does not end a game.",
      },
    },
    {
      id: "debug",
      title: "Debug a broken version",
      paragraphs: [
        "Observe: with target 7 and guesses [3, 9, 7], this version reports exhaustion although the final permitted guess is correct. Reproduce it with those fixed values. Hypothesize that the limit check runs too early. Inspect attempts and guess when the failure occurs: they are 3 and 7, but evaluate_guess has not run for 7.",
        "The cause is statement order. Reaching the allowed count does not invalidate the guess you just counted. Evaluate it and check success before declaring exhaustion. The reference checks capacity before beginning a new attempt, then checks success for the current guess. Do not increase the limit: that hides this example by granting an unintended fourth attempt.",
        "Verify the fix with [3, 9, 7] → won and [3, 9, 9] → exhausted. Keep [7] → won and [3, 7] → won as regression tests. Boundary equality belongs both in comparison tests and in tests of the final allowed attempt.",
      ],
      source: `# Broken: evaluate_guess is defined as above.
def broken_game(guesses, target=7, max_attempts=3):
    attempts = 0
    for guess in guesses:
        attempts = attempts + 1
        if attempts == max_attempts:
            return "exhausted"
        if evaluate_guess(guess, target) == "Correct":
            return "won"
    return "incomplete"

print(broken_game([3, 9, 7]))  # exhausted (wrong)`,
      expected:
        "A focused correction accepts a correct final attempt without allowing a fourth guess.",
      exercise: {
        id: "project-debug-order",
        source:
          'attempts = 2\nguess = 7\nattempts = attempts + 1\nif attempts == 3:\n    result = "exhausted"\n# The guess has not been compared yet.',
        prompt:
          "Which correction addresses the cause under the original three-attempt rule?",
        options: [
          "Set max_attempts to 4",
          "Skip evaluating any guess when attempts is 3",
          "Check capacity before starting a guess, then evaluate success before the exhausted outcome",
        ],
        correctIndex: 2,
        explanation:
          "The third guess is still allowed and must be compared. Check capacity before another attempt and success after comparison; only report exhaustion after no permitted success. A fourth attempt changes the rules. Skipping the third guess reproduces the bug rather than fixing it.",
      },
    },
    {
      id: "test",
      title: "Test the program",
      paragraphs: [
        "Use the full reference in the next checkpoint, or your own implementation, and run the test script below after the function definitions. assert checks a condition and raises AssertionError if it is False; no assertion failure means these cases passed. The game's printed output appears before the final All cases passed message. This is local Python execution, separate from the browser choice check.",
        "[7] verifies first-try success. Direct evaluate_guess checks isolate below, above, and equality behavior. [3, 9, 7] verifies repeated attempts and last-attempt success. [3, 9, 9, 7] verifies exhaustion and that an extra supplied correct guess cannot bypass the limit. Target 1 with guess 1 verifies the lower domain boundary. [] verifies early input exhaustion with no processed guesses.",
        "A passing suite is evidence for these requirements, not proof for every input. Add tests whenever a new failure is found, then rerun the old suite after each change. Invalid strings, out-of-range guesses, and a nonpositive limit are outside this version's input contract. Define their intended behavior before extending the program to accept them.",
      ],
      source: `assert evaluate_guess(3, 7) == "Too low"
assert evaluate_guess(9, 7) == "Too high"
assert evaluate_guess(7, 7) == "Correct"
assert play_game([7]) == "won"
assert play_game([3, 9, 7]) == "won"
assert play_game([3, 9, 9, 7]) == "exhausted"
assert play_game([1], target=1) == "won"
assert play_game([]) == "incomplete"
print("All cases passed")`,
      expected:
        "All assertions pass, and no fourth attempt appears in the exhausted case.",
      exercise: {
        id: "project-boundary-test",
        source: '# Existing test:\nassert play_game([7]) == "won"',
        prompt:
          "Which additional case most directly catches the last-attempt bug?",
        options: [
          "assert play_game([3, 9, 7]) == 'won'",
          "assert play_game([7]) == 'won' again",
          "Only test evaluate_guess(3, 7)",
        ],
        correctIndex: 0,
        explanation:
          "[3, 9, 7] succeeds exactly at the limit, where the broken order fails. Repeating the first-try test never reaches that boundary. Testing the comparison alone cannot catch a defect in the game's control flow.",
      },
    },
    {
      id: "review",
      title: "Review and extend",
      paragraphs: [
        "Copy this entire reference into guessing_game.py and run python3 guessing_game.py. Expected output: Attempt 1 : Too low, Attempt 2 : Too high, Attempt 3 : Correct, and You won!, each on its own line. The returned status is won; the final call does not print that return value. Replace the supplied list to try another deterministic game.",
        "Annotations: evaluate_guess owns the comparisons; play_game owns state and repetition. attempts = 0 resets state for each call. The capacity check prevents a fourth processed guess. Assignment captures the comparison's return value. The success return exits immediately; the post-loop branch distinguishes exhausted capacity from exhausted input. Print messages describe behavior, while return statuses make tests precise.",
        "Review aloud: where is state initialized, where does it change, which branches end the game, and why is the final permitted guess still evaluated? After running your tests locally, mark this checkpoint complete. Checkpoint completion is your learning record, not automatic execution or verified mastery.",
        "Optional extensions: prompt with input locally, convert text with int, and define how invalid input affects attempts before writing recovery code; make a random target but keep a way to provide a fixed target for tests; report guesses remaining; or separate output formatting from game rules. Recursion is optional exploration: a loop suits repeated guesses and avoids growing a call stack. Do not add recursion just to use every topic.",
      ],
      source: guessingGameSource,
      expected:
        "Explain the program's decisions and run the reference and deterministic tests locally. Then choose an extension and write its acceptance examples before coding.",
    },
  ],
};
export const projects = [numberGuessingProject];
