# Guided C++ practice

## Baseline and scope

This feature starts from fetched `origin/main` at `c6eba93a66087a0dd5a51bb6cbf003333c13963e`. Reviewed merged PRs #3 (programming path and traces), #4 (recursion/debugging and guided projects), and #5 (acceptance audit), plus their commits. Main has Next.js App Router, React, TypeScript, Tailwind, 46 stable topic routes, nine published lessons, typed content catalogs, authored trace demonstrations, prediction exercises, knowledge checks, and a staged Python project. It has no authentication, API execution service, database, CMS, or C++ lessons. Reading progress and project progress use defensive, versioned browser storage.

The checkout originally pointed to `feat/v0.4-python-code-lab`, commit `1144c00`, with an unmerged Python Code Lab (PR #6). That branch remains intact. Its content and code were inspected; they were not merged into this branch. The C++ feature follows main's architecture and does not claim to ship the Python lab.

The implementation plan was to reuse lesson rendering, navigation, typed catalogs, and the existing progress provider; add a small C++ content catalog, CodeMirror editor, browser WASM execution adapter, and practice records; keep expected results outside the executing program; then validate content and a full browser learning flow. There is no backend infrastructure to justify adding an untrusted native compiler service. Browser compilation preserves the existing deployment model.

## Learner experience

Open **Practice** (`/practice/cpp`) or **C++ programming practice** in a supported lesson. Exercises are associated with Variables, Operators, Conditionals, Loops, and Functions. All existing conceptual explanations remain available and continue to use Python. The optional C++ activities introduce their own syntax before expecting learners to use it. Arrays and strings have introductory practice in Loops; their separate full lesson remains planned.

Each disclosure contains objectives, a syntax introduction, related worked code, the problem, example input/output, and an editable starter. CodeMirror supplies C++ coloring, line numbers, automatic indentation, bracket matching, undo/redo, and standard editing shortcuts. Ctrl+Enter/Cmd+Enter runs; Tab continues browser navigation. Run uses the editable stdin field. Submit compiles the current source and evaluates all public inputs. Output includes authentic compiler diagnostics, stdout/stderr, exit code, and distinct compilation/runtime/timeout/output-limit/wrong-output feedback. Stop disposes the active Worker. Reset asks inline before replacing a draft and focuses the safe action.

Hints reveal one at a time. Failure details show the public input, expected output, and observed output. After all public cases pass, the activity records a completion timestamp and the pathway displays the count. Learners can explain their reasoning, try additional inputs with Run, inspect history, close the disclosure, and continue reading or follow the existing next-lesson links.

The eight activities cover variables/output, arithmetic, conditionals, for loops, while loops, functions, fixed arrays, and ASCII strings. Passing I/O checks establishes behavior on those cases, not use of a required technique, memory safety, independent understanding, or mastery. For example, tests cannot establish that the square was computed inside the requested function. There is no secure certification claim.

## Source layout

| File | Responsibility |
| --- | --- |
| `src/content/cpp-exercises.ts` | Typed exercise/case contracts and eight authored activities |
| `src/components/cpp-practice.tsx` | Catalog-driven collection and lesson disclosures |
| `src/components/code-editor.tsx` | Controlled CodeMirror editing and accessible keyboard behavior |
| `src/components/cpp-playground.tsx` | Run/Submit/Stop/reset, feedback, hints, attempt presentation |
| `src/lib/execution/types.ts` | UI-independent request, event, result, and adapter contracts |
| `src/lib/execution/cpp-executor.ts` | Disposable Workers, deadlines, cancellation, message validation, bounds |
| `public/cpp/worker.js` | Real compilation and capability-limited WASI execution |
| `scripts/prepare-cpp.mjs` | Prepare pinned compiler assets, lower memory maxima, bound diagnostics, bundle WASI |
| `src/lib/coding-evaluation.ts` | Deterministic parent-side output comparison |
| `src/lib/practice-progress.ts` | Bounded, revision-aware browser record parsing and summaries |
| `src/components/progress-provider.tsx` | Existing provider, extended with practice subscriptions and updates |

## Execution and trust boundaries

The compiler is exact-pinned `browsercc@0.1.1`, an actual Clang/LLD toolchain compiled to WebAssembly with C/C++ headers and libraries. The WASI implementation is exact-pinned `@bjorn3/browser_wasi_shim@0.4.2`. Dependencies are integrity-locked in `package-lock.json`. Assets are self-hosted under `/cpp/`; runtime requests require no third-party CDN, credentials, API keys, or online compiler. The compiler, linker, and sysroot total 94,377,250 bytes before HTTP compression, excluding small JS files. They load on the first Run/Submit, not ordinary lesson reading. HTTP caching may reuse the asset bytes; compiler instances are fresh for each request.

1. The page validates source/input sizes and starts a module Worker for compilation.
2. Trusted JavaScript calls Clang/LLD with fixed C++17 flags, no exceptions, a 1 MiB program stack, and `--max-memory=67108864`. Learners cannot set compiler/linker options. C++ preprocessor file access sees only the compiler's temporary in-memory filesystem, containing its sysroot and submitted source.
3. The compiler Worker returns a `WebAssembly.Module` and bounded diagnostics, then terminates.
4. Each input gets a separate Worker and WASI instance. Expected output is never supplied to that Worker. The parent page compares observed output with catalog data after execution.
5. Every Worker is terminated on completion, failure, deadline, cancellation, replacement by another lab, or disposal. Editing source/stdin, including cross-tab changes, cancels work and withdraws stale feedback. Late messages cannot credit a replaced request.

The program's WASM imports must be functions from an explicit `wasi_snapshot_preview1` allowlist. The adapter supplies only three file descriptors: read-only in-memory stdin and bounded stdout/stderr. There are no preopened directories, host filesystem bindings, inherited environment values, sockets, JavaScript evaluation, DOM, browser storage, or fetch imports. `path_open` cannot resolve a host file because there are no directories. Unknown imports (including custom JavaScript bridges, clock/random APIs, and sockets) are rejected. Programs therefore cannot call the Worker's own JavaScript APIs. The Worker code itself is trusted infrastructure and can fetch its local compiler assets. CSP on `/cpp/*` restricts scripts and connections to the same origin and forbids child Workers; it supplements the WASM import boundary.

| Resource | Limit |
| --- | --- |
| Source | 24,000 JavaScript string characters |
| stdin per input | 4,000 JavaScript string characters; EOF when exhausted |
| Inputs per request | 1-12; shipped submissions use 3-5 |
| Compiler loading + compilation | 60 seconds, then Worker termination |
| Each program execution | 2 seconds, then Worker termination |
| Program linear memory | 64 MiB maximum; 1 MiB reserved stack |
| Each Clang/LLD linear memory | 256 MiB maximum after preparation |
| stdout + stderr per program | 20,000 UTF-8 bytes, then failure |
| Diagnostic collection/display | 20,000 characters |
| Attempt history | Latest 20 attempts per activity |

The preparation script changes the compiler binaries' declared memory maxima and verifies that the resulting modules validate. It also bounds all three diagnostic collectors in the pinned browsercc wrapper. Both transformations fail closed if their expected format changes. No third-party generated code is checked into Git; preparation is repeatable from npm assets and retains the toolchain license. Output is decoded as streaming UTF-8 and sent in bounded batches.

These limits bound the program's linear memory and common accidental resource abuse. They are not a strict limit on total browser process memory: compiler instances (up to three during compilation), source/sysroot copies, JIT code, Worker and JavaScript overhead also consume memory. A low-memory device may terminate a tab before the deadline. No whole-browser availability guarantee or independent security audit is claimed. Review and update compiler/runtime dependencies before deploying into a higher-trust environment.

One execution request is active per page. Run/Submit are disabled while active, starting another lab cancels the older one, and requests/output/cases have explicit bounds. Compilation uses the learner's device; there is no server compilation quota or API abuse surface. Ordinary static-asset rate limits and caching belong at the deployment edge. A learner using developer tools controls their own client and local progress. There is no account authorization boundary or secret-bearing execution endpoint to bypass.

All tests and grading logic are visible and client-side. Learner C++ cannot modify parent expected outputs through the supplied WASI capabilities, but the browser owner can edit the page, storage, or tests. **There are no hidden tests and no authoritative grading.** Trusted hidden evaluation would require a separately isolated backend, authentication/authorization, server-owned tests, quotas, and a reviewed deployment architecture.

## Exercise schema and authoring

`CodingExercise` declares `id`, `revision`, `language`, associated `topicId`, `title`, `difficulty`, learning `objectives`, a syntax `introduction`, related `workedExample`, problem `statement`, `starter`, `expectedBehavior`, `examples`, public `tests`, progressive `hints`, and `commonMistakes`. Each example/case has a stable `id`, readable `label`, `stdin`, and expected `stdout`. Completion means every current public case passes with exit 0.

To add an activity:

1. Add a catalog entry with a permanent unique exercise ID and an existing published lesson's topic ID. The shared lesson renderer and collection derive their contents from the catalog.
2. Teach any language syntax absent from the lesson in the introduction and use a related worked example. State input ranges and output formatting exactly. Avoid undefined behavior and nondeterminism. Include ordinary inputs and boundaries that expose plausible mistakes.
3. Keep inputs/cases within the limits above. Use only supported C++17 facilities and headers. Add incremental hints and concept-specific mistakes. Do not put exercise-specific logic in UI components.
4. Add a reference solution to `tests/cpp-solutions.ts`. Content tests compile the solution and starter with trusted local `g++`, check every example/case, and require a meaningful starter failure. Browser tests compile all solutions with the actual shipped WASM toolchain too.
5. Run all verification. Increase `revision` when the starter, task, or expected semantics change enough to invalidate saved evidence. The parser discards obsolete revisions without silently crediting the new exercise. Changing a display title alone does not require a new ID.

Output comparison converts CRLF to LF and removes at most one final newline. Other spaces and line breaks remain significant, including leading/trailing spaces in string tasks. Each test starts a fresh program, with no inherited files or state. Nonzero exit, trap, timeout, missing result, or output-limit failure never passes, even if stdout contains an expected value.

## Persistence and compatibility

The existing `cs-fundamentals:progress:v1` reading format and `cs-fundamentals:project:v1:<projectId>` records retain their semantics. Practice updates use the same `ProgressProvider` and browser-local/session fallback model, with a separate schema for the new data:

```json
{
  "version": 1,
  "exercises": {
    "cpp-inclusive-sum": {
      "revision": 1,
      "source": "...",
      "stdin": "3\n",
      "attempts": [
        {"at": "2026-10-23T01:00:00.000Z", "mode": "submit", "kind": "success", "passed": 4, "total": 4}
      ],
      "completedAt": "2026-10-23T01:00:00.000Z"
    }
  }
}
```

The key is `cs-fundamentals:practice:v1`. Source/stdin save on edit, and Run/Submit append bounded summaries. Last attempted time is the final attempt's `at`. Current feedback is temporary; reloading restores the draft and historical summaries, not an assertion that an edited draft currently passes. Historical completion remains visible as previously passed public tests. No source/output history is retained beyond the current draft. Reset preserves history. Foreign IDs, obsolete revisions, malformed records, invalid counts, and oversized entries are filtered. Hydration never writes. Storage events synchronize tabs; denied writes keep a session draft and show a notice. Same-instant cross-tab writes are last-write-wins, matching the existing local-only architecture. Clearing browser storage deletes drafts and progress. There is no cloud synchronization or identity-based privacy guarantee for shared browsers.

## Adding another language

Implement `ExecutionEngine` with the same cancellation/disposal, request/result, stream, exit-status, and error semantics. Extend the language discriminator only after providing a real runtime. Supply a CodeMirror language extension in `code-editor.tsx` and language-specific content. Generalize the playground's language label and engine selection at that point; keep grading and progress parsing shared. Do not route a new language through the C++ adapter or claim support based only on syntax highlighting. New runtimes need their own security review; arbitrary Python/JavaScript execution has different capabilities from this restricted WASI boundary.

## Build and deployment

Use Node >=20.19, npm, and a build environment that includes development dependencies:

```sh
npm ci --include=dev
npm run build
npm start
```

`postinstall`, `predev`, and `prebuild` call `prepare:cpp`. Preparation copies npm's compiler/sysroot files locally and bundles the WASI shim with esbuild; it does not download toolchains from unpinned runtime URLs. `public/cpp/runtime/` and `public/cpp/wasi.js` are generated and ignored. Keep those files in the deployed `public` directory alongside the built application. Do not omit build dependencies until after preparing/building. A production-only runtime install may use `--ignore-scripts` if the already prepared assets and `.next` build are copied from the build stage. No configuration values, secrets, native compiler service, database, special network access, or COOP/COEP are required by learners.

Use HTTPS outside localhost. Preserve module-JavaScript MIME types and `application/wasm` for compiler WASM, CSP response headers from `next.config.ts`, and the `/cpp/*` paths. With a separate static host or reverse proxy, reproduce these headers and test execution there; a Next.js build does not certify an arbitrary hosting configuration. `basePath` deployments are not currently supported because asset paths are origin-root relative. Cache the pinned assets at the deployment edge; invalidate when upgrading the package/preparation script. Normal app asset delivery remains necessary for first-run download.

## Verification and remaining work

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, then `npm run test:e2e`. Content authoring tests require local `g++` and Python 3 for the existing Python examples; learners do not need either compiler/interpreter installed. The existing production Playwright configuration covers desktop Chromium and an iPhone-sized Chromium viewport. In the development container, use the existing library workaround documented in README:

```sh
LD_LIBRARY_PATH=/tmp/cs-roadmap-browser-libs/extracted/usr/lib/x86_64-linux-gnu npm run test:e2e
```

Tests cover real WASM compilation, all eight solutions, incorrect output and correction, authentic diagnostics, stdin/stderr/nonzero exits, traps, loops/timeouts, output limits, memory allocation failure, unavailable filesystem/environment, worker cancellation/protocol handling, state/reset, drafts and attempts, malformed/denied/cross-tab storage, lesson/path integration, and all previous journeys. Exact final run results are recorded in the delivery review.

Remaining priorities: independent security and accessibility review; testing on physical low-memory mobile devices and Firefox/WebKit; smaller/faster compiler delivery; concept-level diagnosis and delayed retrieval; technique-aware assessment where educationally useful; and a separately reviewed trusted execution service only if hidden grading/cloud persistence becomes necessary. C++ exceptions, threads, arbitrary OS access, third-party libraries, interactive terminals, and Unicode-aware string reversal are outside this slice.
