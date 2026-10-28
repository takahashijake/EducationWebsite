# CS Fundamentals Roadmap · Adaptive Practice, Interactive DSA, Python and C++

A guided introduction to computer science through explanations, worked Python examples, interactive execution traces, deliberate practice, and a staged project.

**Integrated C++ practice:** open `/practice/cpp` or the C++ programming practice section in Variables, Operators, Conditionals, Loops, or Functions. Eight guided activities introduce C++ syntax, provide a CodeMirror editor, compile real C++17 to WebAssembly on the learner's device, evaluate public test cases, and save drafts and attempt history through the existing progress provider. Reading and project completion retain their existing behavior. No learner code runs on the application server.

See [C++ architecture, security, authoring, and deployment](docs/cpp-playground.md) and [delivery verification](docs/cpp-review.md). The first execution downloads about 95 MB of self-hosted compiler assets. Programs have a 64 MiB linear-memory cap, a two-second deadline per input, bounded output, and WASI capabilities without host files, secrets, storage, or network access. Tests are visible client-side practice evidence, not hidden grading or certification. Python Code Labs also provide editable, executable practice in all seven programming lessons and all five project stages. Python uses a separate disposable Pyodide Worker with explicit deadlines, bounded output, saved drafts, and advisory public checks. See [Python architecture and verification](docs/v0.4-review.md).

The integrated [Programming Fundamentals assessment](/assessments/programming-fundamentals) combines 12 authored Python reasoning problems, deterministic scoring, missed-topic review links, and retry. Its answer form resets on reload; V0.5 concept evidence from submitted answers persists separately from lesson and project progress. Neither a single attempt nor reading completion establishes mastery.

The roadmap contains **46 topics in eight sections: 15 published lessons and 31 planned previews**. All seven Programming Fundamentals topics are published. Graphs now joins Arrays and Strings, Linked Lists, Stacks and Queues, Searching, and Sorting. The wider CS curriculum remains in development; Graph Theory Fundamentals remains planned.

Follow the advisory programming sequence:

**Variables and Data Types → Operators and Expressions → Conditionals → Loops → Functions → Recursion → Basic Debugging → [Python Number Guessing Game](/projects/number-guessing)**

The project is also available from the Projects navigation and the roadmap path panel. **Binary Number Representation** and **Introduction to Big O Notation** remain published in their own sections. Existing topic IDs and URLs are unchanged.

Continue with **Arrays and Strings → Introduction to Big O Notation → Searching → [Sorting](/lessons/sorting)**. These are advisory foundations, not locked assessments. Arrays and Strings covers boundaries and traversal; Searching compares linear scans with binary search on sorted input. Sorting teaches bubble, selection, and insertion sort with shared step-by-step players, a same-input comparison, exact value-comparison/swap/write counts, and five in-place Python Code Labs. The players trace authored algorithms on small predefined inputs; they do not trace learner-submitted Python. Public tests provide feedback rather than secure grading.

Learning Insights now groups evidence by subject and includes 47 focused skills; every graph skill has two independently authored retrieval questions. The existing `cs-fundamentals:evidence:v1` records, reading completion, and workspace keys remain valid. Skill states remain cautious: reading completion and a passing public test do not establish mastery.

[Adaptive practice](/practice/adaptive) adds a five-question, browser-local session alongside the fixed [retrieval questions](/practice/retrieval). Fifty-seven authored question families, including twelve Graphs families, generate deterministic variations for graph representations, traversal, reachability, and costs alongside earlier topics. The next problem reflects focused mistakes, due reviews, relevant prerequisites, and a learner's manual concept choice. Wrong choices receive an authored explanation, progressive hints, lesson links, and a related variation. A correct first answer after using a hint is counted as assisted session practice, not independent positive concept evidence. These bounded templates are not LLM tutoring, secure grading, or proof of mastery.

Sorting adds six focused skills and twelve independent retrieval questions to [Learning Insights](/learning). Its three in-place Python references are stable bubble and insertion sort and conventional swap-based selection sort; the five labs include two boundary or stability repairs. The comparison panel derives every count from the same pure step generators as the players. It counts value-ordering comparisons, two indexed writes per non-self swap, and one write per shift or key insertion; counts are not elapsed-time measurements. For ordinary Python programs, use `sorted()` or `.sort()` rather than these educational quadratic sorts. See [the V0.8 review](docs/v0.8-review.md) for contracts and limits.

## V0.9 Linked Lists

[Linked Lists](/lessons/linked-lists) publishes the permanent `linked-lists` topic after Arrays and Strings and Big O as advisory prerequisites. Its authored reference visualizer covers traversal, first-match search, prepend, append, and deletion on empty, singleton, duplicate, head, middle, tail, and absent-target inputs. Each snapshot records stable node IDs, values, `next`, `head`, `current`, `previous`, reachable and detached IDs, and a narrated operation. Node placement does not describe heap layout. The player does not trace learner Python.

Five Pyodide Code Labs use `Node(value, next=None)` and ask learners to traverse, search, prepend, append, and delete the first match. Public Python assertions check boundaries, exact node identity, link preservation, duplicates, and lost-tail errors. Six permanent linked-list skills add twelve focused retrieval questions and ten deterministic adaptive families to the existing Learning Insights and recommendation system. Existing V1 storage keys and all previous activity IDs remain unchanged. Passing public checks remains limited practice evidence. See [V0.9 architecture and QA](docs/v0.9-review.md).

## V1.0 Stacks and Queues

[Stacks and Queues](/lessons/stacks-queues) now follows Arrays and Strings, Linked Lists, and Big O as advisory foundations. Its interactive player shows LIFO and FIFO operations with immutable reference snapshots, stable logical node IDs, empty/singleton transitions, narration, and a learner-composed sequence. Six browser Python Code Labs cover stack and queue simulation, linked implementations, balanced delimiters, and FIFO task processing. Six focused skills, twelve retrieval questions, and twelve seeded adaptive families connect conceptual mistakes to review. See [the V1.0 review](docs/v1.0-review.md).

## V1.1 Graphs and traversal

[Graphs](/lessons/graphs) teaches representation, directed edges, reachability, BFS shortest unweighted paths, DFS backtracking, components, and list versus matrix costs. A bounded player shows deterministic traversal snapshots, the live queue or DFS frames, predecessor and distance data, and a prediction before reveal. Learners can compose a small graph. Six Pyodide Code Labs cover adjacency, BFS, unweighted shortest paths, DFS, components, and dependency scheduling. Six permanent skills, twelve retrieval questions, and twelve seeded adaptive families join the existing learning loop. The player traces its own authored graph, not submitted Python. See [V1.1 review](docs/v1.1-review.md).

## Delivered learning experience

Every lesson begins with objectives, connects explanations to a demonstration and worked examples, and ends with misconceptions, takeaways, and three explanatory knowledge checks. The six lessons after Variables also provide prediction or debugging exercises. Incorrect answers explain the underlying reasoning; retry clears the current attempt.

- **Basic Debugging:** parsing errors, runtime exceptions, and logical errors; error messages and traceback frames; incorrect assumptions; scoped state tracing; inclusive/exclusive boundaries; minimizing inputs; focused repairs and regression tests. Compare buggy and fixed sum traces on n = 3 and n = 1, diagnose a runtime division failure, and test threshold neighbors.
- **Recursion:** recursive definitions, base and recursive cases, decreasing measures, call creation and unwinding, local bindings, termination, missing returns, and recursion-depth limits. The factorial trace offers 3, 0, 1, and 4 as inputs. Additional programs cover recursive versus iterative summation and a recursive sequence search, including empty and missing cases.
- **Guided project:** five stages build comparison, integer conversion/range validation, a bounded game round, an off-by-one regression test, and a terminal adapter. Each includes objectives or goals, prerequisite connections, starter code, expected behavior, incremental hints, a worked solution, deterministic Python assertions, a reasoning check, and a local-work checklist. Reflection questions and a final reference complete the experience.

The shared **understanding summary** counts checks attempted and correct during the current lesson visit. Reading completion is a separate manual action. Submitted knowledge checks also add concept observations to Learning Insights; the quiz form itself resets on reload. Correct fixed-choice answers and checked boxes do **not** establish mastery or independently verify coding skill. Project reasoning answers and checklists persist separately.

The game fixes the secret at 12, accepts integers from 1 to 20, and allows three valid guesses. Invalid text and out-of-range values do not consume attempts. The finite-input engine accepts supplied strings for reproducible tests; the terminal interface requests input as needed. Students can write and run Python locally or in the browser Code Lab. The Python Code Lab can also run learner implementations in the browser; no learner code runs on the application server.

## Run locally

Use Node.js **20.19 or newer**, npm, and **Python 3** on PATH for authoring tests. Python is not an application runtime dependency.

```bash
npm ci --include=dev
npm run dev
```

Open `http://localhost:3000`. Production: `npm run build`, then `npm start`. No credentials or environment variables are required.

## Architecture

Next.js App Router, TypeScript, React, and Tailwind CSS retain the existing architecture. All 46 topic routes, the projects index, and catalog project routes are statically prerendered. Server components render lesson instruction; focused client components handle traces, practice, and browser storage. The project renderer also prerenders its initial content, then hydrates browser progress.

```text
src/app/lessons/[slug]/page.tsx    Stable topic routes, published lessons/planned previews
src/app/projects/                 Project index and catalog-driven static routes
src/content/types.ts             Existing typed lesson, assessment, trace contracts
src/content/curriculum.ts        Topics, advisory prerequisites, seven-lesson path
src/content/lessons.ts           Combined lesson catalog
src/content/programming-*.ts     Existing programming lessons and traces
src/content/advanced-lessons.ts  Debugging and Recursion content
src/content/advanced-traces.ts   Finite factorial and boundary-case trace families
src/content/dsa-lessons.ts       Arrays and Strings and Searching lessons
src/content/dsa-coding-exercises.ts Seven Python DSA challenges
src/content/dsa-catalog.ts       Focused retrieval and activity mappings
src/content/sorting-lesson.ts    Bubble, selection, insertion, and comparison lesson
src/content/sorting-coding-exercises.ts Five Python sorting labs
src/content/stack-queue-lesson.ts Complete LIFO/FIFO lesson and transfer problems
src/content/stack-queue-coding-exercises.ts Six browser Python labs
src/lib/stack-queue-steps.ts Pure bounded stack/queue snapshots
src/components/stack-queue-visualizer.tsx Accessible operation player
src/content/sorting-catalog.ts   Focused Sorting retrieval and activity mappings
src/content/adaptive-families.ts  Authored deterministic question families and answer evaluation
src/content/sorting-adaptive-families.ts Parameterized Sorting question families
src/lib/adaptive-selection.ts     Pure evidence-aware next-problem policy
src/lib/adaptive-session.ts       Bounded local session and recent-instance parsing
src/components/adaptive-practice.tsx Guided five-question interface
src/lib/algorithm-steps.ts       Pure traversal, search, and sorting step generation
src/components/algorithm-visualizer.tsx Accessible stepper and scenario controls
src/components/sorting-comparison.tsx Same-input operation comparison
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

The guided project uses the original dependencies and generic renderer. C++ practice adds exact-pinned CodeMirror packages, browsercc, the WASI shim, and esbuild for asset preparation. Python practice adds exact-pinned Pyodide 0.29.3 assets; both runtime preparation scripts run during installation, development startup, and production builds. The unrelated `LLM-Town/` project, if present, is outside this application's scope.

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

Global reading progress is completed published lessons / **15**; the programming path separately counts its **7** members. The original three completions yield 3/15 globally (20%) and 1/7 on the programming path (14%). Projects do not change either denominator. The existing `ProgressProvider` retains its deterministic server snapshot, cross-tab events, and session fallback on denied writes.

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

Build before the production browser suite. Coverage includes adaptive sessions and remediation, all 15 published lessons, all 46 topic routes, project routes, unknown/planned routes, prerequisite/content integrity, answer feedback and retry, trace boundaries and nested calls, array, search, sorting, linked-list, stack/queue, and graph visualizations, Python examples and recursion boundaries, project references, Code Labs, reveal behavior, progress isolation, malformed/denied storage, reloads, and cross-tab changes. Desktop Chromium and a mobile viewport run the browser flows, including keyboard interactions and horizontal containment checks.

This container's Chromium requires extracted system libraries. Its environment-specific invocation is:

```bash
LD_LIBRARY_PATH=/tmp/education-apt/libs/usr/lib/x86_64-linux-gnu npm run test:e2e
```

This path is not an application dependency. See [the V0.3 review](docs/v0.3-review.md) for original delivery results, [the post-merge acceptance audit](docs/v0.3-acceptance-audit.md) for fresh verification against merged main, and [the previous review](docs/v0.2-review.md) for historical V0.2 results.

## Current limitations and next direction

- 15 published lessons and one project; 31 broader CS topics remain planned.
- Existing Python traces/questions are authored demonstrations. C++ activities execute learner code and evaluate public I/O cases; client-side grading does not verify technique, all possible behavior, or mastery.
- The visit-level understanding summary resets on reload, while V0.5 concept evidence persists in the browser. Project evidence combines fixed questions and self-reported coding/checklists; revealing a solution does not establish independent skill.
- Desktop/mobile Chromium coverage does not certify cross-browser, screen-reader, or educational effectiveness. Independent human accessibility and teaching review remain valuable.
- No authentication, payments, external AI APIs, backend, CMS, credentials, or cloud sync.

**Recommended next direction:** add weighted-path algorithms and arrange human educational and accessibility review before making stronger learning-effectiveness claims. See [the V1.1 review](docs/v1.1-review.md) for current scope and risks.

Python language references used during authoring: [Errors and Exceptions](https://docs.python.org/3/tutorial/errors.html), [Defining Functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions), and [RecursionError](https://docs.python.org/3/library/exceptions.html#RecursionError). Actual examples are checked with the local Python version recorded in the review.

Python and C++ retain separate typed execution contracts in `src/lib/execution/python-types.ts` and `types.ts`, sharing source/input/output limits. Their grading and workspace records are independent of reading and project completion. Python can access same-origin browser capabilities through its JavaScript bridge; its Worker/deadlines are not a hostile-code security or total-memory boundary. The application has no authenticated data or server execution endpoint. Run only trusted Python; adding sensitive data requires a separate reviewed execution origin.

## V0.5 learning insights and retrieval practice

`/learning` keeps reading completion separate from answers to authored checks. Complete a lesson knowledge check, the `/assessments/programming-fundamentals`, `/practice/retrieval`, `/practice/adaptive`, or `/practice/transfer` to add local learning evidence. The dashboard explains each skill state, shows recent observations and due reviews, and links to the next activity. Evidence is stored only in this browser and can be cleared independently of reading progress and code drafts.

The schedule is deliberately simple: a focused successful practice attempt schedules review after one day; successful delayed retrieval extends the interval to three, seven, then fourteen days. A focused mistake makes review due now and restarts the short interval after a correct recovery. Combined questions are clues, not definitive skill judgments. Repeated correct work, including a later retrieval attempt on a different day, is required for the strongest status. Public code checks give practice feedback on their stated cases, not proof of general correctness. See [the V0.5 review](docs/v0.5-review.md) for the data contracts, authoring rules, limits, and verification.
