# C++ playground delivery review

## What existed

Fetched main `c6eba93a66087a0dd5a51bb6cbf003333c13963e` includes the merged programming-path, guided-project, and acceptance-audit work in PRs #3-5. It has nine published lessons, 37 planned topics, authored Python examples/traces, knowledge checks, a staged project, and browser-local reading/project records. There is no C++ lesson catalog, authentication, database, or execution backend. The separately open Python Code Lab PR #6 was inspected and preserved on its original branch; this feature is based directly on main.

## Delivered slice

The new `/practice/cpp` collection links eight C++ activities into the existing Variables, Operators, Conditionals, Loops, and Functions lessons. Related worked examples and syntax introductions make the exercises usable without pretending that the original Python explanations teach C++ syntax. Existing lesson navigation, prediction exercises, quizzes, traces, projects, and completion controls remain available.

CodeMirror provides highlighting, line numbers, automatic indentation, normal editing shortcuts, and keyboard execution without trapping Tab. Run captures real compiler diagnostics, stdout/stderr, and exit status. Submit executes deterministic public I/O cases in fresh Workers and compares results outside learner code. Hints, common mistakes, expected/observed output, reset confirmation, attempt history, and saved drafts support correction and retry. Passing all cases records local practice completion, while reading completion retains its original semantics.

The compiler is pinned browsercc 0.1.1 with self-hosted WASM assets. No submitted code executes on Next.js or is posted to a compiler endpoint. Compiled programs receive only selected WASI imports, in-memory stdin, and bounded output, without filesystem directories, environment secrets, networking, DOM, or browser storage capabilities. Compiler/program memory maxima, request/output bounds, compilation/execution deadlines, cancellation, and stale-response handling constrain execution. The architecture guide documents exact limits and the distinction between bounded WASM memory and total browser process memory.

Practice persistence extends the existing `ProgressProvider`; versioned records retain the current draft/stdin, last 20 attempt summaries, and historical completion timestamp. Defensive parsing, no hydration writes, cross-tab changes, and session fallback follow the platform's existing browser-local approach. Unknown or obsolete exercise revisions do not receive credit. The reading and project record formats are unchanged.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 111 tests passed across 12 files, including the full existing suite, native C++ solution/starter checks, worker orchestration, deterministic grading, reset/draft state, and malformed/denied/cross-tab progress handling.
- `npm run build`: passed; 54 statically generated pages, including all original topic/project routes and the C++ collection.
- Final production browser suite: all 34 tests passed in one run (17 desktop Chromium, 17 mobile Chromium viewport), in 5.8 minutes. This includes every existing browser regression plus the new C++ flows.
- `npm audit --omit=dev`: zero vulnerabilities. Full audit reports five high-severity findings in the existing ESLint dependency chain (`braces`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next`, `eslint-config-next`). Their lockfile entries are unchanged; no unrelated forced downgrade/upgrade was applied.
- `git diff --check`: passed.

Browser execution uses the existing container-only Chromium library path from README. Manual viewport checks at 320, 360, 390, 600, 800, 1050, and 1440 pixels found no page-level horizontal overflow with the editor open. Earlier exploratory runs identified the need to scope broad group selectors to quiz fieldsets/knowledge-check containers after adding native exercise disclosures. One resource-check run overlapped local asset regeneration and received a temporary loading error; a stable-asset rerun passed. Final verification runs against fixed generated runtime assets and a fresh production build.

The browser tests cover a complete lesson/practice/correction/completion/pathway flow; every example/public case for all eight real WASM solutions; compiler diagnostics; stdin and stderr; nonzero exits; traps; infinite loops; output overflow; allocation failure above the memory cap; unavailable host filesystem/environment; rejection of a custom JavaScript import bridge; no learner-code POST requests; static-endpoint method restrictions; and every existing learning journey. Native fixtures reject every shipped starter and check all correct solutions, including empty/zero/unit/endpoint and whitespace-sensitive cases. Simulated workers test orchestration only; they are not presented as evidence of C++ compilation or runtime behavior.

## Pre-merge QA

The follow-up review reproduced a feedback bug: flushed stdout/stderr smaller than the Worker's batching threshold disappeared when an infinite loop caused termination. The Worker now emits decoded output immediately, ignores empty writes, and retains the bounded prefix of an overflowing write. The real-browser resource test now requires both streams to survive a timeout and verifies the complete 20,000-byte output prefix. The regression failed on the original implementation before the fix.

The external Rubber Duck check reported three high-severity findings on the original head. Manual review found all three to be false positives: `public/cpp/worker.js` used `TextDecoder.decode()` for UTF-8 console bytes, not JWT verification; `tests/cpp-content.test.ts` wrote a fixed `main.cpp` filename inside its own `mkdtempSync()` directory, with no user-controlled path. The app contains no JWT authentication, and the fixture writer is not application/server code. No scanner suppressions, check-status overrides, or branch-protection changes were introduced.

Fresh validation of the corrected implementation passed lint, type checking, all 111 unit/content tests, the production build, and all 34 desktop/mobile browser tests in one full run. The production dependency audit reported zero vulnerabilities.

## Limits and recommended next work

All tests are public and results are client-side practice evidence. They do not certify technique, memory safety, independent understanding, or mastery; the browser owner can alter local progress. There is no trusted hidden grading, account/cloud synchronization, C++ exception/thread support, interactive terminal, host OS access, or third-party package installation. First-run compiler transfer is about 95 MB and compilation can be costly on mobile hardware. Browser process memory includes compiler/runtime overhead beyond the stated program linear-memory cap.

The implementation supplies C++ practice within existing lessons, rather than claiming a complete standalone C++ course. Introductory arrays/string activities do not publish the planned full data structures lesson. The unmerged Python Code Lab still requires a deliberate integration decision if both branches are retained.

Next priorities are independent security/accessibility/educational review, physical low-memory mobile and Firefox/WebKit validation, smaller compiler delivery, and concept-level follow-up/independent practice. Add authenticated, isolated backend grading only if authoritative hidden tests become a concrete product requirement. Full contracts, security boundaries, exercise authoring, language-extension steps, and deployment instructions are in [the architecture guide](cpp-playground.md).

## Screenshots

These capture the production application's real all-tests-passed state after executing the corrected loop solution. They are not mockups.

[Desktop playground](images/cpp-playground-desktop.png) | [Mobile playground](images/cpp-playground-mobile.png)
