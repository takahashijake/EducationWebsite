# CS Fundamentals Roadmap · V0.3

A guided introduction to computer science through explanations, worked Python examples, authored execution traces, prediction practice, and a complete guided project. Learners practice reasoning about state, return values, boundaries, and evidence for a fix.

**46 topics · 8 sections · 9 complete lessons · 37 planned previews.** All seven Programming Fundamentals lessons are published. The wider CS roadmap remains in development.

## Learn and build

The advisory sequence is **Variables and Data Types → Operators and Expressions → Conditionals → Loops → Functions → Recursion → Basic Debugging**. Binary Number Representation and Introduction to Big O Notation are also published in their own sections.

- **Recursion:** reachable base cases, reduction, independent stack frames, descent and return propagation, factorial and sequence summation, three prediction exercises, three knowledge questions, and recursive/iterative time and space comparisons.
- **Basic Debugging:** syntax/runtime/logical errors, tracebacks, print inspection, local breakpoints and stepping, a worked investigation, three diagnostic exercises, boundary cases, and regression testing. The process is Observe → Reproduce → Hypothesize → Inspect → Fix → Verify.
- **Build a Number Guessing Game:** six navigable checkpoints covering requirements, comparison logic, repetition, a broken final-attempt boundary, deterministic tests, and a runnable annotated reference. Five choice exercises provide feedback and retry; checkpoint completion is recorded separately and manually after a correct choice. The final review is a self-reported local-work checkpoint.
- **Integrated assessment:** 12 problems combine expressions, conditions, loops, function calls, recursive frames/returns, debugging, and boundaries. Submit all answers for a score and explanations; missed questions link to relevant lessons. Retry clears the attempt. Results are practice feedback, not verified mastery or certification.

Routes:

| Route                                   | Purpose                                                       |
| --------------------------------------- | ------------------------------------------------------------- |
| `/roadmap#programming`                  | Seven-lesson path, current completion and next recommendation |
| `/lessons/recursion`                    | Recursive execution and prediction practice                   |
| `/lessons/debugging`                    | Systematic debugging and diagnostic practice                  |
| `/projects/number-guessing`             | Guided game with six checkpoints                              |
| `/assessments/programming-fundamentals` | Integrated 12-question assessment                             |

Existing lesson slugs and saved topic IDs remain unchanged. Previous/next navigation follows display order, while prerequisites describe actual dependencies: Basic Debugging depends on conditionals, loops, and functions, **not recursion**. All published pages and project checkpoints can be opened directly; navigation never hard-locks access. Counts derive from curriculum data.

## Run locally

Use Node.js **20.19 or newer**, npm, and **Python 3.10+** for the authoring verification suite:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Production: `npm run build`, then `npm start`. No credentials, accounts, or environment variables are required by the application. Python is used by repository verification only; it is not a runtime dependency of the site.

Learners run Python examples locally: copy a complete example to a `.py` file and run `python3 filename.py` (or the Python 3 launcher on their system). The game reference deliberately supplies guesses as a list and uses a fixed target so failures can be reproduced. Adding terminal input is an optional extension. The input contract is documented: guesses and target are integers from 1 through 10, and the attempt limit is positive. Input validation is future work.

## Architecture

Next.js App Router, React, TypeScript, Tailwind CSS 4, ESLint, Vitest/Testing Library, and Playwright. Instructional data stays separate from reusable rendering. Lesson, project, and assessment routes are statically prerendered; small client components handle interaction and browser progress. No new dependencies were added in V0.3.

```text
src/content/types.ts                Lesson, trace/frame, project, assessment contracts
src/content/curriculum.ts           Sections, topics, prerequisites, seven-lesson path
src/content/lessons.ts              Combined lesson catalog
src/content/programming-lessons.ts  Operators, Conditionals, Loops, Functions
src/content/recursion-lesson.ts      Recursion lesson and authored stack snapshots
src/content/debugging-lesson.ts     Debugging lesson and investigation
src/content/projects.ts             Game source, sample trace, checkpoint data
src/content/assessments.ts          Stable questions and topic relationships
src/components/lesson-layout.tsx    Shared lesson renderer
src/components/code-trace.tsx       Single trace player, optional call-stack display
src/components/practice-exercise.tsx Choice feedback, retry, optional result callback
src/components/guided-project.tsx   Checkpoint renderer, navigation, project persistence
src/components/knowledge-check.tsx  Shared quiz/assessment renderer, score and review links
src/components/learning-path.tsx    Position, completion, recommendation, activity links
src/lib/trace.ts                    Navigation and structural/LIFO validation
src/lib/content-validation.ts       Lesson, prerequisite, question and path checks
src/lib/activity-validation.ts      Project and assessment catalog checks
src/lib/quiz.ts                     Deterministic answer checking and scoring
src/lib/progress.ts                 Unchanged lesson v1 persistence
src/lib/project-progress.ts         Separate defensive project v1 persistence
scripts/verify-python.py            Local authoring checks against actual Python behavior
tests/                             Content, persistence, Python and component tests
e2e/                               Production desktop/mobile journeys
```

The unrelated `LLM-Town/` project, if present in the workspace, remains outside this application.

## Authoring lessons and traces

Add a permanent topic ID/slug and valid prerequisites to `curriculum.ts`, then add a typed `Lesson` to the combined catalog. A complete lesson needs at least three measurable objectives, substantial introduction/concept explanations, a demonstration, worked steps, runnable code, misconceptions, takeaways, and three knowledge questions. Supplementary `sections` and `exercises` support deeper practice. Publish only after reviewing instruction and executing examples.

Questions and exercises need globally unique stable IDs, distinct nonempty options, one valid zero-based `correctIndex`, and an explanation of the correct reasoning and tempting mistakes. Prediction exercises also require a Python source. Shared `evaluateAnswer` and `scoreQuestions` reject missing or invalid selections. Retry does not alter lesson progress.

A `CodeTrace` is an authored `demonstration.kind: "trace"` containing source, title/caption, steps, and a final conceptual result. Each step contains one-based nonblank `lines`, an explanation, complete scoped `variables`, and cumulative `output`; optional `detail` names a decision. Snapshots describe state **after the meaningful action explained**, including conditions and calls. Controls move forward/backward or reset; they never execute code.

For recursive traces, add a `stack` array to **every step** (including empty initial/final arrays). Frames are oldest caller first and newest invocation last:

```ts
{
  lines: [4],
  explanation: "The caller waits while a new factorial(2) invocation begins.",
  variables: [],
  output: [],
  stackEvent: { kind: "push", frameId: "factorial-2" },
  stack: [
    { id: "factorial-3", functionName: "factorial",
      arguments: [{ name: "n", value: 3 }],
      locals: [{ name: "n", value: 3 }], status: "waiting" },
    { id: "factorial-2", functionName: "factorial",
      arguments: [{ name: "n", value: 2 }],
      locals: [{ name: "n", value: 2 }], status: "running" },
  ],
}
```

Arguments record call inputs; locals record currently bound names. Do not invent a local before its assignment finishes. Values are strings, finite numbers, booleans, or null. Frame IDs identify invocations and cannot be reused later in the trace. Arguments/function identity remain unchanged for an existing frame; a caller's locals cannot change while suspended. Ordinary steps without a stack event may update the currently running frame's locals while keeping frame identity, depth, and status unchanged.

`stackEvent.kind` distinguishes:

1. `push`: add one new running frame, leaving callers waiting.
2. `base`: identify the stopping branch without adding a call.
3. `return`: keep the top frame visible as `returned` with a required `returnValue`.
4. `pop`: remove that returned frame and show its caller running with the returned value assigned as appropriate.

The retained returning frame is an inspection convention, not an extra Python statement. The call-stack display identifies the current invocation, arguments, local names, depth, and returning value. It shares the original player's semantic controls and live execution status. Existing traces omit stack fields and stay compatible. Validation enforces LIFO changes, frame identity/status, separate return/pop, completed empty stacks, source lines, and valid values. It cannot prove arbitrary semantic correctness: execute the Python and compare evidence. `recursion-lesson.ts` provides a complete example; Python verification matches its actual call/return order and local state.

## Authoring guided projects

`GuidedProject` is a small content contract, not an LMS framework. Add an entry to `projects.ts` with a unique ID/slug, title, introduction, advisory `topicIds`, and ordered checkpoints. Each checkpoint has an ID, title, paragraphs, and an explicit `expected` result; it may include source, an existing `PracticeExercise`, and/or an existing `CodeTrace`. Include problem acceptance examples, construction practice, a diagnosis, deterministic test cases, and a complete runnable reference.

Render it in a dedicated App Router page with `GuidedProject`. `ProjectCheckpoint` reuses the same practice and trace components as lessons. Every checkpoint remains navigable; completing a choice checkpoint requires a correct submitted answer followed by the learner's completion action. Retry is available for wrong answers. A checkpoint without a choice uses self-reported completion after local work. Revisiting a checkpoint resets its transient exercise attempt but preserves its recorded completion. Undo is always available for recorded checkpoints.

The current persistence contract intentionally supports the first game project. To publish a second project, extend `project-progress.ts` and the store to key state by project ID, add tests ensuring projects cannot overwrite one another, then add its route and path link. Do not reuse game checkpoint IDs in another project without a namespace. Add Python authoring checks with an explicit expected outcome for every new snippet; tests that reference earlier functions need a documented setup.

## Assessment content contracts

Add an `Assessment` to `assessments.ts` with a permanent ID and 10–12 `AssessmentQuestion` entries. Each extends a source-bearing exercise with nonempty, valid published `topicIds`. The catalog validator enforces global question/activity uniqueness, valid answers, distinct options, references, and coverage of all published programming topics. Source is displayed as a readable problem; fixed-choice checking is never described as Python execution.

Use `KnowledgeCheck` with `reviewTopics`, `submitLabel`, and `retryLabel`. Its original three-question lesson interface is preserved. It withholds explanations and answer styling until all questions are answered and submitted, shows a score plus individual explanations, and suggests review links for missed topics. Assessment results are **not saved**: reload/navigation clears the attempt. There is no assessment storage schema or automatic completion/migration.

## Progress persistence and compatibility

The unchanged key **`cs-fundamentals:progress:v1`** contains:

```json
{ "version": 1, "completed": ["variables-data-types"] }
```

Only manual lesson completion/undo changes it. Unknown IDs, planned IDs, duplicates, and malformed values cannot inflate counts. No automatic rewrite happens on load. Existing earned completions survive; publishing lessons changes denominators to **9 available lessons** globally and **7 programming lessons** in the path. For example, the three original lessons give 3/9 global and 1/7 path progress. Recursion/debugging IDs are now valid published completions.

The distinct key **`cs-fundamentals:project-progress:v1`** contains:

```json
{
  "version": 1,
  "projectId": "number-guessing",
  "completed": ["understand", "logic"]
}
```

Project parsing rejects malformed/unsupported versions and other project IDs, filters unknown checkpoint IDs, and removes duplicates. Both progress interfaces support cross-tab storage notifications and a session fallback when writes are denied, with a visible persistence notice. A storage read failure yields a usable empty state. Browser-local progress is origin-specific; clearing browser data clears saved records. There is no cloud sync. Neither exercises nor assessments overwrite manual lesson completion, and project progress never shares its key.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run verify:python
npm run build
npx playwright install --with-deps chromium # once per environment
npm run test:e2e
git diff --check
```

Build before browser testing; Playwright starts the production server. `npm test` includes Python verification, so Python 3.10+ must be on PATH. `verify:python` runs just that check and prints counts. It executes repository-authored snippets, verifies expected outputs and intentional exceptions, compares factorial stack locals/call/return order to Python tracing, checks debugging corrections, and runs exact-output/status tests for ten game cases. It does not accept learner code.

The tests preserve V0.2 coverage, updating only changed publication totals, planned-topic fixtures, and the extended path boundary. New tests cover stack transitions and invalid states, separate project storage and denied/malformed storage, debugging feedback, checkpoint navigation/focus/retry, assessment submission/score/review/retry, and the integrated journey through both lessons and activities. Browser checks run desktop Chromium and a mobile Chromium viewport and assert no horizontal page overflow, including code panes and long answer choices.

In this container plain Chromium cannot launch because `libnspr4.so` is absent. The existing extracted system libraries allow the same browser suite to run:

```bash
LD_LIBRARY_PATH=/tmp/cs-roadmap-browser-libs/extracted/usr/lib/x86_64-linux-gnu npm run test:e2e
```

This directory is environment-specific, not an application dependency. See [the V0.3 review record](docs/v0.3-review.md) for the base inspection, actual check results, and review limitations.

## Known limitations and next milestone

- 37 roadmap topics remain planned. This is a complete Programming Fundamentals section, not a complete CS curriculum.
- Traces and choices are deterministic authored examples. No arbitrary Python execution, open-ended grading, or runtime debugger is embedded. The game uses supplied guesses; terminal input and invalid-input handling are optional local extensions.
- The first project's storage is scoped to that project. A second project needs an explicit keyed persistence extension. Assessment attempts are transient.
- Browser-local completion and assessment scores are learning aids, not credentials. There is no authentication, backend, database, AI API, payment system, or remote execution service.
- Automated checks and agent instructional review do not establish human educational review or accessibility certification. Human beginner testing, screen-reader/keyboard review, and Firefox/WebKit coverage remain recommended.

**Recommended V0.4:** teach a focused first Data Structures sequence (lists/arrays, indexing, traversal, and linear search), followed by a small data-processing project. Obtain beginner and assistive-technology feedback on V0.3 before expanding interaction types; use that feedback to improve prompts, pacing, and explanations.
