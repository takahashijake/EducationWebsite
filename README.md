# CS Fundamentals Roadmap · V0.3

A guided introduction to computer science through explanations, worked Python examples, interactive execution traces, deliberate practice, and a staged project.

The roadmap contains **46 topics in eight sections: nine published lessons and 37 planned previews**. All seven Programming Fundamentals topics are published. The wider CS curriculum remains in development.

Follow the advisory programming sequence:

**Variables and Data Types → Operators and Expressions → Conditionals → Loops → Functions → Recursion → Basic Debugging → [Python Number Guessing Game](/projects/number-guessing)**

The project is also available from the Projects navigation and the roadmap path panel. **Binary Number Representation** and **Introduction to Big O Notation** remain published in their own sections. Existing topic IDs and URLs are unchanged.

## Delivered learning experience

Every lesson begins with objectives, connects explanations to a demonstration and worked examples, and ends with misconceptions, takeaways, and three explanatory knowledge checks. The six lessons after Variables also provide prediction or debugging exercises. Incorrect answers explain the underlying reasoning; retry clears the current attempt.

- **Basic Debugging:** parsing errors, runtime exceptions, and logical errors; error messages and traceback frames; incorrect assumptions; scoped state tracing; inclusive/exclusive boundaries; minimizing inputs; focused repairs and regression tests. Compare buggy and fixed sum traces on n = 3 and n = 1, diagnose a runtime division failure, and test threshold neighbors.
- **Recursion:** recursive definitions, base and recursive cases, decreasing measures, call creation and unwinding, local bindings, termination, missing returns, and recursion-depth limits. The factorial trace offers 3, 0, 1, and 4 as inputs. Additional programs cover recursive versus iterative summation and a recursive sequence search, including empty and missing cases.
- **Guided project:** five stages build comparison, integer conversion/range validation, a bounded game round, an off-by-one regression test, and a terminal adapter. Each includes objectives or goals, prerequisite connections, starter code, expected behavior, incremental hints, a worked solution, deterministic Python assertions, a reasoning check, and a local-work checklist. Reflection questions and a final reference complete the experience.

The shared **understanding summary** counts checks attempted and correct during the current lesson visit. Reading completion is a separate manual action. Correct fixed-choice answers and checked boxes do **not** establish mastery or independently verify coding skill. Lesson attempts reset on reload; project reasoning answers and checklists persist.

The game fixes the secret at 12, accepts integers from 1 to 20, and allows three valid guesses. Invalid text and out-of-range values do not consume attempts. The finite-input engine accepts supplied strings for reproducible tests; the terminal interface requests input as needed. Students write and run Python locally. **There is no arbitrary-code editor, interpreter, eval, or external execution service in the website.**

## Run locally

Use Node.js **20.19 or newer**, npm, and **Python 3** on PATH for authoring tests. Python is not an application runtime dependency.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Production: `npm run build`, then `npm start`. No credentials or environment variables are required.

## Architecture

Next.js App Router, TypeScript, React, and Tailwind CSS retain the existing architecture and dependencies. All 46 topic routes, the projects index, and catalog project routes are statically prerendered. Server components render lesson instruction; focused client components handle traces, practice, and browser storage. The project renderer also prerenders its initial content, then hydrates browser progress.

```text
src/app/lessons/[slug]/page.tsx    Stable topic routes, published lessons/planned previews
src/app/projects/                 Project index and catalog-driven static routes
src/content/types.ts             Existing typed lesson, assessment, trace contracts
src/content/curriculum.ts        Topics, advisory prerequisites, seven-lesson path
src/content/lessons.ts           Combined lesson catalog
src/content/programming-*.ts     Existing programming lessons and traces
src/content/advanced-lessons.ts  Debugging and Recursion content
src/content/advanced-traces.ts   Finite factorial and boundary-case trace families
src/content/project-types.ts     Reusable project/milestone contracts
src/content/projects.ts          Number guessing curriculum and Python references
src/components/lesson-layout.tsx Shared instructional renderer and navigation
src/components/lesson-practice.tsx Session assessment evidence summary
src/components/code-trace.tsx    Reused generic trace player, including nested frames
src/components/guided-project.tsx Generic staged project presentation
src/components/use-project-progress.ts Browser store, hydration, cross-tab events, fallback
src/lib/project-progress.ts      Defensive versioned project parsing and derived stage states
src/lib/project-validation.ts    Project authoring integrity checks
src/lib/content-validation.ts    Lesson catalog and prerequisite/path validation
src/lib/trace.ts                 Structural trace validation/navigation
src/lib/quiz.ts                  Shared deterministic answer evaluation
src/lib/progress.ts              Existing v1 lesson completion storage, unchanged
```

No project-specific rendering branches or new dependencies were added. The unrelated `LLM-Town/` project, if present, is outside this application's scope.

## Authoring lessons and traces

1. Add a topic with a permanent unique ID and slug in `curriculum.ts`, initially `planned`. Never rename a stored ID or public slug to change a display title.
2. Add a `Lesson` to the combined catalog. Supply objectives, introduction, concepts, demonstration, worked example, Python code with explanation, misconceptions, takeaways, and three knowledge questions. Optional `sections`, prediction/debugging `exercises`, and `nextStep` extend the shared renderer.
3. Give every question/exercise a globally unique ID, distinct nonempty choices, a valid zero-based `correctIndex`, and explanatory feedback. Explain a tempting wrong assumption. Use the existing `PracticeExercise` and `KnowledgeCheck` components; their optional result callbacks feed the visit summary without writing lesson progress.
4. Publish only when content is complete. Add published programming topics to `programmingPath` in curriculum order. Prerequisites must occur earlier in that path, but need not be the immediately preceding topic. Debugging requires Functions; Recursion is its suggested previous lesson rather than a hard prerequisite.
5. Extend the content and Python fixtures and run the checks below. Tests validate complete content, identities, references, acyclic prerequisites, path ordering, and answer validity.

For traces, use `demonstration.kind: "trace"` with a title, caption, source, nonempty steps, and final result. Each step contains one-based nonblank source `lines`, an explanation, the full relevant scoped `variables`, and cumulative `output`. Values are finite numbers, strings, booleans, or null. A snapshot describes state after the explained action, including partial expression evaluation. Never assign a result before its right-hand call returns.

Selectable `scenarios` each contain a stable ID, visible label, source, steps, and result. Provide top-level `defaultLabel` and `inputLabel`. Selecting another input resets to step one; Reset rewinds the currently selected example.

For calls, put `frames` on every step, oldest caller first. Each invocation needs a unique `id` and `scope`; repeated calls to the same function must have separate identities and local bindings. All callers below the top frame are `suspended`, optionally with `resumeLine`. The top is `active` or `returning`; returning frames include `returnValue`. Keep a returning frame for inspection, then pop it and restore its immediate caller. These pauses explain execution; they are not additional Python instructions.

`advanced-traces.ts` generates immutable snapshots for a small, fixed input family using this existing contract. The factorial demonstration is restricted to nonnegative integers; the runnable lesson example additionally guards negative input. Frame primitives and the player already support arbitrary stack depth within authored content, so this milestone extends the content rather than adding a second recursion UI.

`validateTrace` checks lines, primitive values, scopes, cumulative output, scenario identities, and basic frame transitions. It does not establish Python semantics. Authoring tests execute every trace source and compare factorial call/return events and debugging accumulator updates with real Python instrumentation.

## Authoring guided projects

Add a `GuidedProject` to `projects.ts`; it receives an index link and static `/projects/[slug]` route automatically. Keep IDs/slugs stable. A project contains introduction, objectives, published prerequisite IDs, ordered milestones, a final reference with explanation, and reflection questions.

Each `ProjectMilestone` defines:

- Permanent milestone ID, title, goal, expected behavior, and starter code.
- Explicit topic connections with conceptual explanations.
- Ordered hints, a worked solution, and an explanation.
- Labeled deterministic Python assertion programs, suitable to append to that milestone's solution.
- A globally unique reasoning question and permanent checklist IDs with local-work statements.

Stage one opens immediately. Each subsequent stage requires the previous stages' correct reasoning answers and checked local-work items. All stages and their status appear in the outline. Prerequisites are advisory and never block starting. A reasoning attempt, including an incorrect one, makes that stage's worked solution available in a closed disclosure. Hints reveal one at a time. The complete reference becomes available in a closed disclosure after all stages complete.

Use finite supplied inputs and explicit contracts to keep test behavior deterministic. Never run learner-supplied Python on the server. Extend `validateProjects` checks and the Python test suite when adding content. Update schema versions deliberately if stored meaning or interpretation changes; do not reuse old checklist/question IDs for different tasks.

## Progress and compatibility

The unchanged **`cs-fundamentals:progress:v1`** key retains its format:

```json
{ "version": 1, "completed": ["variables-data-types"] }
```

No migration or write occurs on load. Existing valid V1 completion data survives. Unknown IDs, still-planned IDs, invalid values, and duplicates do not inflate progress. Completing/undoing a lesson uses its existing permanent ID. Publishing more lessons changes the denominator without deleting earned completions.

Global reading progress is completed published lessons / **9**; the programming path separately counts its **7** members. The original three completions yield 3/9 globally (33%) and 1/7 on the programming path (14%). Projects do not change either denominator. The existing `ProgressProvider` retains its deterministic server snapshot, cross-tab events, and session fallback on denied writes.

Projects use a separate, explicitly versioned key per project:

```text
cs-fundamentals:project:v1:number-guessing
```

```json
{
  "version": 1,
  "projectId": "number-guessing",
  "answers": { "project-compare-check": 1 },
  "checked": ["compare-written"]
}
```

The parser rejects malformed or unsupported top-level data and foreign project IDs. It filters unknown question/checklist IDs, invalid answer indices, and duplicate checks. Stage completion is derived from current authored answers, checklist membership, and sequential prerequisites; stored completion claims are never trusted. Updates read the latest snapshot and never touch lesson progress. Initial hydration does not write storage, including malformed values. Real cross-tab events update the project view; clearing storage updates it too. A denied write keeps project changes in memory for the session and displays a notice. Hint count and disclosure visibility reset on reload.

Browser progress is local to the browser and origin. Clearing storage removes saved work; no account, backend database, or cloud sync is provided. Same-instant writes from different tabs are not transactional.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium # once per environment
npm run test:e2e
```

Build before the production browser suite. Coverage includes all nine lessons, all 46 topic routes, project routes, unknown/planned routes, prerequisite/content integrity, answer feedback and retry, trace boundaries and nested calls, Python examples and recursion boundaries, every project milestone's reference/tests, an intentionally broken off-by-one mutation, reveal behavior, lesson/project progress isolation, malformed/denied storage, reloads, and real cross-tab changes. Desktop Chromium and a mobile viewport run the same browser flows, including keyboard interactions and horizontal containment checks.

This container's Chromium requires extracted system libraries. Its environment-specific invocation is:

```bash
LD_LIBRARY_PATH=/tmp/cs-roadmap-browser-libs/extracted/usr/lib/x86_64-linux-gnu npm run test:e2e
```

This path is not an application dependency. See [the V0.3 review](docs/v0.3-review.md) for actual delivery results, and [the previous review](docs/v0.2-review.md) for historical V0.2 results.

## Limitations and recommended V0.4

- Nine published lessons and one project; 37 broader CS topics remain planned.
- Authored traces and fixed questions, without arbitrary input execution or open-ended grading. Structural validation alone cannot establish intermediate execution correctness.
- Lesson evidence lasts only for the current visit. Project evidence combines fixed questions and self-reported coding/checklists; revealing a solution does not establish independent skill.
- Desktop/mobile Chromium coverage does not certify cross-browser, screen-reader, or educational effectiveness. Independent human accessibility and teaching review remain valuable.
- No authentication, payments, external AI APIs, backend, CMS, credentials, or cloud sync.

**Recommended V0.4:** add concept-tagged assessment evidence and transparent knowledge-gap diagnosis, with short delayed retrieval checks and targeted review links. Include an independently completed project variation with rubric-based self-assessment. Arrange human educational/accessibility review before expanding into data structures or building a larger adaptive system.

Python language references used during authoring: [Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html), [Defining Functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions), and [RecursionError](https://docs.python.org/3/library/exceptions.html#RecursionError). Actual examples are checked with the local Python version recorded in the review.
