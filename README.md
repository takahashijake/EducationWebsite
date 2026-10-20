# CS Fundamentals Roadmap · V0.1

A guided introduction to computer science, inspired by the clarity of roadmap.sh. The goal is to teach the concepts behind each stop with explanations, illustrations, code, practice, and eventually deeper assessments—not simply list what to study.

This MVP includes the broad curriculum outline and three complete lessons. It is not a complete curriculum.

## What works

- Responsive landing page, curriculum roadmap, lesson pages, and planned-topic previews.
- All **46 topics in eight sections**, each with a stable ID, section, slug, description, order, status, and optional prerequisites.
- Complete lessons for **Variables and Data Types**, **Binary Number Representation**, and **Introduction to Big O Notation**.
- Each lesson has objectives, original explanations, a conceptual illustration, a worked example, Python 3 code, common mistakes, takeaways, and three multiple-choice questions with explanations and retry.
- Manual completion with browser-local persistence, undo, completion states, and completed/available counts. Planned topics cannot count toward progress.
- Keyboard-accessible controls, visible focus states, native quiz radio groups, breadcrumb links, skip link, reduced-motion support, and responsive CSS layouts.
- No accounts, database, backend service, analytics, paid APIs, or external font requests.

## Stack and layout

Next.js App Router, React, TypeScript, Tailwind CSS 4, and ESLint. Vitest, Testing Library, and Playwright provide regression coverage. Server components render the curriculum and instructional content; small client components handle quizzes and local progress. Topic routes are prerendered at build time.

```text
src/app/                     Pages, metadata, layout, and responsive styles
src/app/lessons/[slug]/       Available lesson or honest planned-topic overview
src/content/types.ts         Content contracts
src/content/curriculum.ts    Ordered sections and all topic metadata
src/content/lessons.ts       Complete instructional content and quizzes
src/components/               Reusable UI, lessons, quiz, and progress components
src/lib/progress.ts          Defensive serialization, completion, and counts
src/lib/quiz.ts              Answer evaluation
tests/                      Content, persistence, and component regression tests
e2e/                        Desktop/mobile production smoke tests
```

The pre-existing `LLM-Town/` directory is an unrelated Python simulation and remains untouched. Its uncommitted files are not part of this application. Application tools exclude that directory.

## Run locally

Use Node.js **20.19 or newer** (Node 22 LTS is a suitable default) and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production server:

```bash
npm run build
npm start
```

The application has no environment variables or service credentials. Dependencies are locked in `package-lock.json`.

## Add a topic or lesson

1. Add a `Topic` record to `src/content/curriculum.ts`. Choose a unique, permanent kebab-case `id` and `slug`, reference an existing `sectionId`, and set its order within that section. IDs are used for saved completion; slugs are public URLs. Keep both stable when editing titles.
2. Supply a specific description and initially use `status: 'planned'`. The roadmap and `/lessons/<slug>` overview will appear automatically. Optional `prerequisites` reference topic IDs; prerequisites are advisory and do not gate access.
3. To publish a full lesson, add a matching entry in `src/content/lessons.ts` and change its topic status to `available`. Include every field from `Lesson`: objectives, introductory explanation, concept paragraphs, demonstration, worked steps, code and its explanation, misconceptions, takeaways, and three questions.
4. Each question needs a stable ID, distinct options, one valid zero-based `correctIndex`, and an explanation. The shared quiz displays feedback for both correct and incorrect choices. Quiz attempts do not mark completion automatically.
5. Reuse one of the three demonstration types or extend the small union and `LessonDemonstration` when a new illustration is actually needed. Add a new section by inserting an ordered `Section` record with a stable ID.
6. Run all verification commands. The content tests intentionally assert V0.1’s topic/lesson totals; update those expectations when deliberately expanding the curriculum. Rebuild to generate routes for new topics.

Content is typed independently from presentation; no CMS or framework-specific markup is needed to add prose. This deliberately small structure can grow into multiple roadmaps and richer assessment models later.

## Progress storage

The key `cs-fundamentals:progress:v1` contains JSON:

```json
{ "version": 1, "completed": ["variables-data-types"] }
```

Only known, available IDs survive loading, saving, and counting. Duplicate IDs, planned IDs, and unknown IDs are ignored. Malformed JSON or unsupported schemas start at zero. Percentages are rounded from completed / available lessons (**three** in V0.1), never from all 46 topics.

`ProgressProvider` uses `useSyncExternalStore` with a deterministic server snapshot, so server rendering never reads `window` or localStorage. Client hydration reads browser storage and storage events keep other tabs current. A failed write preserves an in-memory session value and displays a persistence notice. Completion is manual and independent of quiz scores. Undo removes a completion. There is no cross-device sync. Clearing site storage clears progress. No personal data is collected.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium   # once per machine; browser and OS libraries
npm run test:e2e
```

`test:e2e` starts the production server, so build first. It covers desktop Chromium and a narrow mobile viewport using Chromium; it does not claim Safari coverage. A pre-existing server on port 3000 can be reused locally. In CI the test runner always owns its server.

Tests cover IDs and references, ordering and URL resolution, complete lesson structures, valid answer keys and quiz evaluation, malformed storage, denied storage, available-only completion, correct percentage calculations, quiz interaction and retry, persistence and undo across remounts, cross-tab updates, navigation, full lesson rendering, planned-state behavior, and unknown routes. Browser smoke checks cover the learning flow, quiz feedback, completion after reload, planned topics, page errors, mobile overflow, and real 404 responses.

For repeatable type checking from a clean checkout, `npm run typecheck` works without generated route types; Next.js generates those during development/build. Run tests in watch mode with `npm run test:watch`.

## Verified for this delivery

Executed on 2026-10-17 with Node 20.20.2:

| Check                               | Result                                         |
| ----------------------------------- | ---------------------------------------------- |
| `npm run lint`                      | Passed, no warnings                            |
| `npm run typecheck`                 | Passed                                         |
| `npm test`                          | 30 tests passed across three files             |
| `npm run build`                     | Passed; all 46 topic routes prerendered        |
| `npm run test:e2e`                  | 10 passed: five desktop and five mobile checks |
| `npm ci --dry-run --ignore-scripts` | Passed; lockfile resolves                      |
| `npm audit --omit=dev`              | No runtime vulnerabilities reported            |

Desktop landing/roadmap and mobile lesson screenshots were also visually inspected.

The environment initially lacked Chromium libraries and did not allow sudo. Browser tests were successfully executed after downloading the Ubuntu `libnspr4`, `libnss3`, `libatk-bridge2.0-0t64`, and `libatspi2.0-0t64` packages into `/tmp`, extracting them without installing system packages, and running:

```bash
LD_LIBRARY_PATH=/tmp/cs-roadmap-browser-libs/extracted/usr/lib/x86_64-linux-gnu npm run test:e2e
```

That temporary directory is environment-specific and is not an application dependency. On a normal development machine, the standard `playwright install --with-deps chromium` command above provides the required libraries. Browser verification covers Chromium, including a mobile viewport, rather than every browser or assistive technology.

## Dependency audit

`npm audit --omit=dev` reports no runtime advisories. The full audit reports five high-severity development-only findings in the Next.js ESLint dependency chain (`fast-glob` → `micromatch` → `braces`). The installed lint stack has no patched compatible release in the registry used for this build. Do not downgrade the application framework using `npm audit fix --force`; update the lint tooling when a compatible fix is available. The test runner is updated to Vitest 4.1.12.

## Deliberate limits

- Three complete lessons; the other 43 topics are clearly labeled Planned.
- Static authored material, fixed multiple-choice questions, and conceptual diagrams. No code execution or grading of open-ended work.
- Progress is specific to the browser and origin; it is not a credential, score, or certification.
- Prerequisites are metadata and selected preview links, not a dependency engine or enforced learning sequence.
- No authentication, persistence server, CMS, search, gamification, or publishing integration.
- Educational and accessibility review by additional human reviewers remains valuable; automated checks are not a substitute for either.

## Most valuable V0.2 milestone

Complete a coherent **Programming Fundamentals** learning path rather than adding isolated topics: deeper lessons for operators, conditionals, loops, and functions, with richer exercises and human content review. Then add lightweight interactive visualizations, more useful prerequisite guidance, and assessments that connect concepts across a more complete learning path. Introduce these as concrete learning needs emerge.
# EducationWebsite
