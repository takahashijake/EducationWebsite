# CS Fundamentals Roadmap · V0.2

A guided introduction to computer science that teaches the reasoning behind each topic through explanations, worked examples, Python programs, interactive traces, and practice.

The roadmap has **46 topics in eight sections: seven complete lessons and 39 planned previews**. The wider curriculum is still in development.

## Available lessons and core path

Follow the advisory Programming Fundamentals core sequence:

**Variables and Data Types → Operators and Expressions → Conditionals → Loops → Functions**

**Binary Number Representation** and **Introduction to Big O Notation** are also complete, in their respective sections. Recursion and Basic Debugging remain planned previews. Completing the five-lesson core does not complete the entire Programming Fundamentals section.

The four new programming lessons each include a deterministic interactive Python walkthrough, two prediction exercises, and three knowledge-check questions, alongside objectives, detailed explanations, worked examples, common misconceptions, summaries, and next steps. Completion remains a separate manual action.

## Run locally

Use Node.js **20.19 or newer** and npm:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. For production, run `npm run build` followed by `npm start`. No service credentials or environment variables are needed.

## Architecture

Next.js App Router, React, TypeScript, Tailwind CSS 4, and ESLint; Vitest, Testing Library, and Playwright provide regression coverage. Topic pages remain statically prerendered. Server components render instructional content; small client components handle interaction and browser-local progress.

```text
src/app/                         Routes, metadata, responsive styles
src/content/types.ts             Shared content and interaction contracts
src/content/curriculum.ts        Sections, topics, prerequisites, core path
src/content/lessons.ts           Original lessons and combined lesson catalog
src/content/programming-lessons.ts Four new complete programming lessons
src/components/lesson-layout.tsx Shared lesson renderer
src/components/code-trace.tsx    Generic authored walkthrough player
src/components/practice-exercise.tsx Prediction submission, feedback, retry
src/components/learning-path.tsx Core sequence, position, recommendation, progress
src/lib/trace.ts                 Trace navigation and validation
src/lib/content-validation.ts    Catalog, prerequisite, assessment, path checks
src/lib/quiz.ts                  Shared deterministic answer evaluation
src/lib/progress.ts              Defensive v1 persistence and progress calculations
tests/                          Content, unit, and component regression tests
e2e/                            Production desktop/mobile browser checks
```

The unrelated `LLM-Town/` project, if present in the workspace, is outside this application's scope.

## Authoring lessons

1. Add a `Topic` in `src/content/curriculum.ts` using a unique, permanent ID and slug, a valid section, and an order. Keep saved-completion IDs and public slugs stable. Start with `status: "planned"` for an honest preview.
2. Add a `Lesson` to the combined catalog in `src/content/lessons.ts`, either directly or through an imported content module such as `programming-lessons.ts`. Follow `src/content/types.ts`: objectives, introduction, concept explanation, demonstration, worked example, runnable Python code, misconceptions, takeaways, and three knowledge questions. Optional `sections` provide additional focused explanations and code examples. Add `nextStep` for contextual guidance.
3. Publish by setting the topic to `available` only after its instructional content is complete. Counts and global progress derive from published topics.
4. Use unique question/exercise IDs across the catalog. Options must be distinct, nonempty, and include one valid zero-based `correctIndex`. Explain the reasoning, including why a tempting wrong answer fails.
5. Run the checks below. The catalog tests enforce unique IDs/slugs, complete lessons, valid section/prerequisite references, acyclic prerequisites, valid assessment answers, trace data, and path ordering. Update milestone totals deliberately when publishing additional lessons.

Keep educational content in typed data rather than adding topic-specific rendering branches. The original three diagram kinds remain supported unchanged.

## Authoring code traces

Set `demonstration.kind` to `"trace"`. Supply a title, caption, short Python `source`, nonempty `steps`, and a conceptual final `result`. The four new lessons are complete examples of this contract.

```ts
{
  kind: "trace",
  title: "Follow a value",
  caption: "Assignment first, output second.",
  source: "x = 2\nprint(x)",
  steps: [
    {
      lines: [1],
      explanation: "Assign 2 to x.",
      variables: [{ name: "x", value: 2, scope: "global" }],
      output: [],
    },
    {
      lines: [2],
      explanation: "Display x without changing it.",
      variables: [{ name: "x", value: 2, scope: "global" }],
      output: ["2"],
    },
  ],
  result: "x remains 2 and the output is 2.",
}
```

`lines` contains **one-based source line numbers** for the step just explained. Each snapshot describes the state **after** that meaningful step, including condition evaluation or range exhaustion. `variables` is the complete relevant active state, with explicit scope and primitive values (string, finite number, boolean, or null). Use separate scopes for caller and function locals. `output` is the complete output so far, not an incremental append. Optional `detail` labels branch selection, iteration, arguments, or return values. Represent skipped branches and termination explicitly in explanations.

The player highlights lines and provides Next, Previous, and Reset buttons, an announced execution state, scoped variables, cumulative output, and a final result. Code panes scroll within their container; controls wrap on small screens. There is no animation. **No Python interpreter, arbitrary code editor, eval, or external execution service is involved.** Authors must verify semantic correctness; structural validation alone cannot prove that a trace matches Python.

## Authoring prediction exercises

Add `exercises` to a lesson. Each exercise extends `Question` with a Python `source` string:

```ts
{
  id: "example-prediction",
  source: "total = 2 + 3 * 4\nprint(total)",
  prompt: "What does this print?",
  options: ["14", "20", "10"],
  correctIndex: 0,
  explanation: "Multiplication yields 12 first; then 2 + 12 is 14.",
}
```

`evaluateAnswer` checks fixed choice indices deterministically. Submission reveals correctness and reasoning; Retry clears the attempt without reloading. Exercises do not write to progress storage. Use problems that require tracing or explaining a decision rather than guessing syntax. The separate three-question knowledge check retains its existing feedback and retry behavior.

## Prerequisites and navigation

Topic `prerequisites` reference stable topic IDs and display advisory links. They never lock a published lesson. The explicit `programmingPath` defines the five core topics in order; `lessonNeighbors` resolves previous and next lessons using that sequence. Other published topics navigate within their own section. Functions ends the core path without sending the learner to unrelated binary or Big O lessons. Planned topics retain direct preview routes.

The path panel shows position, completed/available states, a completed count, and the first incomplete core lesson as the recommended next step. After finishing the core it explicitly identifies the remaining planned programming topics. The same panel on the roadmap helps learners resume.

## Progress and compatibility

The unchanged localStorage key **`cs-fundamentals:progress:v1`** contains:

```json
{ "version": 1, "completed": ["variables-data-types"] }
```

Existing completions survive this release. There is no migration or automatic overwrite on load. Unknown IDs, planned IDs, duplicates, and malformed data cannot inflate progress. Manual completion and undo use the same IDs as before. Neither prediction exercises nor knowledge checks automatically mark completion.

Global progress is completed published lessons / **seven** available lessons, rounded to a percentage. Core path progress separately counts completed members / **five**, using the same stored IDs. For example, all three original lessons yield 3/7 global and 1/5 core completion. Publishing lessons increases the global denominator without deleting earned completions.

`ProgressProvider` retains `useSyncExternalStore`, a deterministic server snapshot, cross-tab storage events, and an in-memory session fallback for denied writes. A failed write displays a persistence notice. Storage is browser- and origin-specific; clearing it clears progress. No accounts, database, cloud sync, or personal information collection are introduced.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium # once per environment
npm run test:e2e
```

`test:e2e` starts a production server, so build first. It covers desktop Chromium and a mobile viewport using Chromium. Tests include all seven published pages, all 46 routes, unknown routes, planned previews, malformed/denied storage, persistence, manual completion and undo, trace boundaries/state/reset, prediction correctness/retry, prerequisite cycles, path ordering, and the Variables → Operators → Conditionals learning flow. Loop and function traces have dedicated browser checks. `npm run test:watch` supports local iteration.

V0.2 verification: lint and type checking passed; 51 unit/component tests passed across four files; the production build prerendered all 46 topic routes; all 16 desktop/mobile browser checks passed using the library-path workaround below. Desktop/mobile screenshots were visually inspected, and six representative tablet routes had no horizontal overflow. Python 3 verification executed 26 authored programs (lesson examples, supplementary sections, and prediction exercises); all exited successfully, all eight predictions matched their authored correct choices, and all four trace outputs matched their Python program output.

In this container, a plain Playwright run initially failed because Chromium could not load `libnspr4.so`. The existing extracted browser libraries allow execution without system installation:

```bash
LD_LIBRARY_PATH=/tmp/cs-roadmap-browser-libs/extracted/usr/lib/x86_64-linux-gnu npm run test:e2e
```

That directory is environment-specific, not an application dependency. On a normal development machine use Playwright's installation command above.

## Known limitations and V0.3

- Seven published lessons; 39 topics remain planned. No claim of a complete CS curriculum.
- Fixed authored traces and answer choices. No arbitrary code execution or open-ended grading; attempts are not persisted.
- Browser-local completion is a learning aid, not a credential or assessment score.
- Chromium desktop/mobile checks do not establish cross-browser or assistive-technology certification. No independent human educational review or accessibility certification has been performed.
- No authentication, backend database, CMS, AI tutor, payments, or unrelated gamification.

**Recommended V0.3:** complete Basic Debugging and Recursion, then build a small guided project that combines the core concepts. Add boundary-case exercises and targeted human educational/accessibility review before expanding the roadmap into more sections.
