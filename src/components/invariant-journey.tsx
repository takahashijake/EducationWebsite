"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CodingExercise } from "@/content/coding-types";
import {
  evaluateTransfer,
  initialTransferCase,
  predictionCase,
  predictionState,
  REVISIT_INTERVAL_MS,
  revisitTransferCase,
  type TransferCase,
} from "@/content/invariant-journey";
import {
  appendJourneyAttempt,
  newInvariantJourney,
  revisitEligible,
} from "@/lib/invariant-journey-state";
import { lessonWorkspaceId } from "@/lib/workspace";
import { CodeLab } from "./code-lab";
import { useInvariantJourney } from "./use-invariant-journey";
import { useWorkspace } from "./use-workspace";

const stages = [
  "Predict",
  "Explain",
  "Implement",
  "Transfer",
  "Revisit",
] as const;
const systemNow = () => Date.now();
type LabCheck = { source: string; passed: boolean; assisted: boolean };

export function InvariantJourney({
  exercise,
  clock = systemNow,
}: {
  exercise: CodingExercise;
  clock?: () => number;
}) {
  const { store, ready, storageError, update, restart } = useInvariantJourney();
  const [stage, setStage] = useState(0);
  const [now, setNow] = useState(0);
  const [choice, setChoice] = useState("");
  const [reasonChoice, setReasonChoice] = useState("");
  const [explanation, setExplanation] = useState("");
  const [revisedExplanation, setRevisedExplanation] = useState<string | null>(
    null,
  );
  const [path, setPath] = useState("");
  const [cost, setCost] = useState("");
  const [suitable, setSuitable] = useState("");
  const [justification, setJustification] = useState("");
  const [feedback, setFeedback] = useState("");
  const [labCheck, setLabCheck] = useState<LabCheck | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const workspaceId = lessonWorkspaceId("weighted-shortest-paths", exercise.id);
  const workspace = useWorkspace(workspaceId, exercise.starter);
  const currentLabPass =
    labCheck?.passed && labCheck.source === workspace.source ? labCheck : null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const current = clock();
      setNow(current);
      if (ready && !store) update(() => newInvariantJourney(current), current);
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, store, update, clock]);
  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  if (!ready || !store)
    return <p role="status">Loading your local invariant journey…</p>;
  const prediction = predictionCase(store.seed);
  const predictionTrace = predictionState(prediction);
  const transfer = initialTransferCase(store.seed);
  const canRevisit = revisitEligible(store, now);
  const revisitDue = store.transfer[0]
    ? new Date(
        Date.parse(store.transfer[0].at) + REVISIT_INTERVAL_MS,
      ).toLocaleString()
    : null;
  const stageDone = [
    !!store.prediction,
    !!store.explanation,
    !!currentLabPass,
    store.transfer.length > 0,
    store.revisit.length > 0,
  ];
  const clockTime = () => {
    const value = clock();
    if (!Number.isFinite(value) || value < 0 || value > 8.64e15) {
      setFeedback(
        "The device clock is invalid. Correct it before saving an attempt.",
      );
      return null;
    }
    return value;
  };

  const move = (index: number) => {
    setStage(index);
    setFeedback("");
    setNow(clock());
    requestAnimationFrame(() => heading.current?.focus());
  };
  const assist = (target: "prediction" | "transfer" | "revisit") => {
    update(
      (current) => ({
        ...current,
        assistance: { ...current.assistance, [target]: true },
      }),
      clock(),
    );
  };
  const submitTransfer = (
    item: TransferCase,
    target: "transfer" | "revisit",
  ) => {
    if (!justification.trim()) {
      setFeedback("Explain your action before checking the authored answer.");
      return;
    }
    if (item.kind === "suitability" && !suitable) {
      setFeedback("Choose whether Dijkstra is suitable.");
      return;
    }
    const result = evaluateTransfer(item, { path, cost, suitable });
    const timestamp = clockTime();
    if (timestamp === null) return;
    const next = update(
      (current) =>
        appendJourneyAttempt(
          current,
          {
            caseId: item.id,
            correct: result.correct,
            assisted: current.assistance[target],
            at: new Date(timestamp).toISOString(),
          },
          target,
          timestamp,
        ),
      timestamp,
    );
    if (next[target].at(-1)?.at !== new Date(timestamp).toISOString()) {
      setFeedback(
        "This attempt could not be saved. Check your device clock and try again.",
      );
      return;
    }
    setFeedback(
      `${result.correct ? "Your action matches the authored case." : "Review this case and try again."} ${result.feedback} Your written explanation is for self-review; the site has not graded it.`,
    );
    setNow(timestamp);
  };

  return (
    <section
      className="invariant-journey"
      id="invariant-journey"
      aria-label="Dijkstra invariant transfer journey"
    >
      <header>
        <p className="eyebrow">GUIDED INVARIANT JOURNEY</p>
        <h2>Dijkstra: why settled distances stay final</h2>
        <p>
          Predict a trace, explain the proof, test your Python, apply it in a
          new network, and return for a later case. These are formative checks,
          not a mastery certificate.
        </p>
      </header>
      <nav className="journey-steps" aria-label="Invariant journey stages">
        {stages.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={stage === index ? "step" : undefined}
            onClick={() => move(index)}
          >
            {index + 1}. {label}
            {stageDone[index] ? " · visited" : ""}
          </button>
        ))}
      </nav>
      {stage === 0 && (
        <section aria-label="Predict the next state">
          <h3 ref={heading} tabIndex={-1}>
            1. Predict the next valid settlement
          </h3>
          <p>
            All edges below are directed and nonnegative. A is the start.
            Dijkstra has just finished relaxing edges from C. The table shows
            current tentative distances; older queue entries may still exist.
          </p>
          <GraphDescription graph={prediction.graph} />
          <p>
            <strong>Settled:</strong>{" "}
            {predictionTrace.before.settled.join(", ")}.{" "}
            <strong>Tentative:</strong>{" "}
            {Object.entries(predictionTrace.before.distances)
              .filter(
                ([vertex]) => !predictionTrace.before.settled.includes(vertex),
              )
              .map(([vertex, distance]) => `${vertex}=${distance ?? "∞"}`)
              .join(", ")}
            .
          </p>
          <fieldset disabled={!!store.prediction}>
            <legend>Which valid vertex settles next?</legend>
            {prediction.choices.map((option) => (
              <label className="journey-choice" key={option.id}>
                <input
                  type="radio"
                  name="invariant-prediction"
                  checked={choice === option.id}
                  onChange={() => setChoice(option.id)}
                />{" "}
                {option.label}
              </label>
            ))}
          </fieldset>
          <fieldset disabled={!!store.prediction}>
            <legend>Which reasoning supports your choice?</legend>
            {[
              "The smallest valid tentative entry is removed; nonnegative future edges cannot lower it.",
              "The first entry inserted into the queue is always settled next.",
              "The route with the fewest edges must be cheapest.",
            ].map((text, index) => (
              <label className="journey-choice" key={text}>
                <input
                  type="radio"
                  name="invariant-reason"
                  checked={reasonChoice === String(index)}
                  onChange={() => setReasonChoice(String(index))}
                />{" "}
                {text}
              </label>
            ))}
          </fieldset>
          {!store.prediction && (
            <div className="playground-actions">
              <button
                className="button"
                type="button"
                disabled={!choice || !reasonChoice}
                onClick={() => {
                  const timestamp = clockTime();
                  if (timestamp === null) return;
                  update(
                    (current) => ({
                      ...current,
                      prediction: {
                        caseId: prediction.id,
                        choiceId: choice,
                        reasonId: reasonChoice as "0" | "1" | "2",
                        correct:
                          choice === predictionTrace.correctId &&
                          reasonChoice === "0",
                        assisted: current.assistance.prediction,
                        at: new Date(timestamp).toISOString(),
                      },
                    }),
                    timestamp,
                  );
                  setFeedback(
                    choice === predictionTrace.correctId && reasonChoice === "0"
                      ? "Your prediction and reason match the invariant."
                      : "This choice may reflect a different rule. Compare it with the valid queue minimum below.",
                  );
                }}
              >
                Check prediction
              </button>
              <button type="button" onClick={() => assist("prediction")}>
                Show a hint
              </button>
            </div>
          )}
          {store.assistance.prediction && !store.prediction && (
            <p>
              The queue may contain an older entry for B. Compare each entry
              with the current tentative distance before settling.
            </p>
          )}
          {store.prediction && (
            <div className="journey-feedback">
              <p>
                <strong>Actual next transition:</strong>{" "}
                {predictionTrace.next.narration}
              </p>
              <p>
                {
                  prediction.choices.find(
                    (item) => item.id === store.prediction?.choiceId,
                  )?.why
                }
              </p>
              <p>
                Only the minimum valid entry can be settled. A nonnegative path
                through another unsettled vertex cannot later beat it.{" "}
                {store.prediction.correct
                  ? "Your choice and reason matched this authored case. "
                  : "Compare your choice and reason with the minimum valid entry. "}
                {store.prediction.assisted
                  ? "You used a hint, so this was assisted practice."
                  : "This was an independent prediction, but one answer does not establish mastery."}
              </p>
              <Link href="/lessons/weighted-shortest-paths#understanding">
                Review the settled-distance explanation →
              </Link>
            </div>
          )}
          <button
            className="button secondary"
            type="button"
            onClick={() => move(1)}
          >
            Continue to explanation →
          </button>
        </section>
      )}
      {stage === 1 && (
        <section aria-label="Explain the invariant">
          <h3 ref={heading} tabIndex={-1}>
            2. Explain why settling is safe
          </h3>
          <p>
            Why is the current valid minimum distance final when every edge
            weight is nonnegative? Explain what breaks with a negative edge.
            Write your own reasoning before opening the rubric.
          </p>
          {!store.explanation ? (
            <>
              <label htmlFor="invariant-explanation">Your explanation</label>
              <textarea
                id="invariant-explanation"
                value={explanation}
                maxLength={2000}
                rows={6}
                onChange={(event) => setExplanation(event.target.value)}
              />
              <button
                className="button"
                type="button"
                disabled={!explanation.trim()}
                onClick={() => {
                  const timestamp = clockTime();
                  if (timestamp === null) return;
                  update(
                    (current) => ({
                      ...current,
                      explanation: {
                        text: explanation.trim(),
                        at: new Date(timestamp).toISOString(),
                      },
                    }),
                    timestamp,
                  );
                  setFeedback(
                    "Explanation saved. Use the rubric to review your reasoning; the website has not graded your writing.",
                  );
                }}
              >
                Reveal rubric after submitting
              </button>
            </>
          ) : (
            <div className="journey-feedback">
              <p>
                <strong>Your explanation:</strong> {store.explanation.text}
              </p>
              <h4>Self-review rubric</h4>
              <ol>
                <li>The queue removes the minimum valid tentative distance.</li>
                <li>
                  Settling means this distance is final, not merely an estimate.
                </li>
                <li>Every remaining edge has nonnegative weight.</li>
                <li>
                  A later route through an unsettled vertex already costs at
                  least the selected minimum and cannot become cheaper by adding
                  nonnegative edges.
                </li>
                <li>
                  A negative edge could reduce a route later, so the proof and
                  Dijkstra’s guarantee fail.
                </li>
              </ol>
              <p>
                <strong>Model explanation:</strong> Once the smallest valid
                entry for u is removed, any competing route that reaches u later
                must first cross an unsettled vertex whose tentative distance is
                no smaller. Nonnegative remaining edges cannot reduce that route
                below u’s current distance. A negative edge could, so Dijkstra
                must reject that case.
              </p>
              <fieldset>
                <legend>How complete is your explanation?</legend>
                <label className="journey-choice">
                  <input
                    type="radio"
                    name="explanation-review"
                    checked={store.explanation.selfReview === "complete"}
                    onChange={() =>
                      update(
                        (current) =>
                          current.explanation
                            ? {
                                ...current,
                                explanation: {
                                  ...current.explanation,
                                  selfReview: "complete",
                                },
                              }
                            : current,
                        clock(),
                      )
                    }
                  />{" "}
                  I covered all five points
                </label>
                <label className="journey-choice">
                  <input
                    type="radio"
                    name="explanation-review"
                    checked={store.explanation.selfReview === "developing"}
                    onChange={() =>
                      update(
                        (current) =>
                          current.explanation
                            ? {
                                ...current,
                                explanation: {
                                  ...current.explanation,
                                  selfReview: "developing",
                                },
                              }
                            : current,
                        clock(),
                      )
                    }
                  />{" "}
                  I want to revise my reasoning
                </label>
              </fieldset>
              <p>
                Self-review is reflection, not graded evidence. You can keep
                learning regardless of your choice.
              </p>
              {revisedExplanation === null ? (
                <button
                  type="button"
                  onClick={() => setRevisedExplanation(store.explanation!.text)}
                >
                  Revise my explanation
                </button>
              ) : (
                <div>
                  <label htmlFor="revised-invariant-explanation">
                    Revised explanation
                  </label>
                  <textarea
                    id="revised-invariant-explanation"
                    rows={6}
                    maxLength={2000}
                    value={revisedExplanation}
                    onChange={(event) =>
                      setRevisedExplanation(event.target.value)
                    }
                  />
                  <button
                    type="button"
                    disabled={!revisedExplanation.trim()}
                    onClick={() => {
                      const timestamp = clockTime();
                      if (timestamp === null) return;
                      update(
                        (current) => ({
                          ...current,
                          explanation: {
                            text: revisedExplanation.trim(),
                            at: new Date(timestamp).toISOString(),
                          },
                        }),
                        timestamp,
                      );
                      setRevisedExplanation(null);
                      setFeedback(
                        "Revised explanation saved for self-review. The website has not graded your writing.",
                      );
                    }}
                  >
                    Save revised explanation
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            className="button secondary"
            type="button"
            onClick={() => move(2)}
          >
            Continue to Python implementation →
          </button>
        </section>
      )}
      {stage === 2 && (
        <section aria-label="Implement the invariant">
          <h3 ref={heading} tabIndex={-1}>
            3. Implement the same decisions in Python
          </h3>
          <p>
            Use the existing saved <strong>{exercise.id}</strong> Code Lab
            below. One active editor writes to its established workspace. The
            player above traces its authored graph, not your code.
          </p>
          <ul>
            <li>
              <strong>Heap order:</strong> pop the smallest tentative distance
              and reject stale entries.
            </li>
            <li>
              <strong>Settlement:</strong> never revise a settled vertex;
              require nonnegative weights.
            </li>
            <li>
              <strong>Strict relaxation:</strong> update only on a cheaper
              candidate, preserving a valid predecessor on ties.
            </li>
            <li>
              <strong>Boundaries:</strong> keep zero-weight edges, unreachable
              vertices, and invalid negative weights distinct.
            </li>
          </ul>
          <p role="status">
            {currentLabPass
              ? `Current source passed all public checks${currentLabPass.assisted ? " with assistance" : " independently"}. This is formative evidence, not proof of the invariant.`
              : "Run Tests on your current source to check the public cases. Editing, stopping, failed execution, or a different tab’s edit withdraws this visit’s pass display."}
          </p>
          <a className="button secondary" href="#code-lab">
            Open the existing Python editor ↓
          </a>{" "}
          <button
            className="button secondary"
            type="button"
            onClick={() => move(3)}
          >
            Continue to unfamiliar network →
          </button>
        </section>
      )}
      {stage === 3 && (
        <section aria-label="Transfer the invariant">
          <h3 ref={heading} tabIndex={-1}>
            4. Apply the invariant in a new network
          </h3>
          <p>
            {transfer.network} This network is separate from the earlier
            prediction and the Python public checks. Give a route and explain
            why its cost is final.
          </p>
          <TransferForm
            item={transfer}
            path={path}
            setPath={setPath}
            cost={cost}
            setCost={setCost}
            suitable={suitable}
            setSuitable={setSuitable}
            justification={justification}
            setJustification={setJustification}
          />
          <div className="playground-actions">
            <button
              className="button"
              type="button"
              onClick={() => submitTransfer(transfer, "transfer")}
            >
              Check transfer action
            </button>
            <button type="button" onClick={() => assist("transfer")}>
              Show a hint
            </button>
          </div>
          {store.assistance.transfer && (
            <p>
              Settle only valid minimum entries. Sum actual edge weights,
              including zero; a direct route need not be cheapest.
            </p>
          )}
          {!!store.transfer.length && (
            <div className="journey-feedback">
              <p>
                Attempts recorded: {store.transfer.length}. Latest action:{" "}
                {store.transfer.at(-1)?.correct ? "matched" : "needs review"};{" "}
                {store.transfer.at(-1)?.assisted ? "assisted" : "independent"}.
                Your written explanation was not automatically graded.
              </p>
              <p>
                <strong>Authored reasoning:</strong> {transfer.reasoning}
              </p>
            </div>
          )}
          <button
            className="button secondary"
            type="button"
            onClick={() => move(4)}
          >
            View delayed revisit →
          </button>
        </section>
      )}
      {stage === 4 && (
        <section aria-label="Delayed invariant revisit">
          <h3 ref={heading} tabIndex={-1}>
            5. Revisit with a different case
          </h3>
          {!store.transfer.length ? (
            <p>
              First submit an initial transfer attempt. The later case opens 24
              hours after that attempt.
            </p>
          ) : !canRevisit ? (
            <>
              <p>
                A different case becomes available after 24 hours, around{" "}
                {revisitDue}. Returning to retrieve the idea may expose gaps
                that immediate repetition misses. This site does not send
                reminders.
              </p>
              <button type="button" onClick={() => setNow(clock())}>
                Check availability now
              </button>
            </>
          ) : (
            <>
              <p>
                {revisitTransferCase.network} This case tests the nonnegative
                assumption rather than another route calculation.
              </p>
              <TransferForm
                item={revisitTransferCase}
                path={path}
                setPath={setPath}
                cost={cost}
                setCost={setCost}
                suitable={suitable}
                setSuitable={setSuitable}
                justification={justification}
                setJustification={setJustification}
              />
              <div className="playground-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => submitTransfer(revisitTransferCase, "revisit")}
                >
                  Check revisit action
                </button>
                <button type="button" onClick={() => assist("revisit")}>
                  Show a hint
                </button>
              </div>
              {store.assistance.revisit && (
                <p>
                  Ask whether a later edge can lower a distance after its vertex
                  was settled.
                </p>
              )}
              {!!store.revisit.length && (
                <div className="journey-feedback">
                  <p>
                    Revisit recorded as{" "}
                    {store.revisit.at(-1)?.assisted
                      ? "assisted"
                      : "independent"}{" "}
                    formative practice. It does not establish mastery.
                  </p>
                  <p>
                    <strong>Authored reasoning:</strong>{" "}
                    {revisitTransferCase.reasoning}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      )}
      {feedback && (
        <div
          ref={feedbackRef}
          tabIndex={-1}
          role="status"
          className="journey-feedback"
        >
          {feedback}
        </div>
      )}
      <div id="code-lab">
        <CodeLab
          exercise={exercise}
          workspaceId={workspaceId}
          onPublicCheck={setLabCheck}
        />
      </div>
      {storageError && (
        <p role="alert">
          Browser storage is unavailable. Your journey remains usable in this
          tab; copy any writing you want to keep.
        </p>
      )}
      <div className="playground-actions">
        <button
          type="button"
          onClick={() => {
            restart(clock());
            setStage(0);
            setChoice("");
            setReasonChoice("");
            setExplanation("");
            setRevisedExplanation(null);
            setPath("");
            setCost("");
            setSuitable("");
            setJustification("");
            setFeedback("");
            setLabCheck(null);
          }}
        >
          Start a new journey
        </button>
        <Link href="/lessons/graphs">Review Graphs prerequisite →</Link>
        <Link href="/lessons/bellman-ford">
          Review negative edges in Bellman–Ford →
        </Link>
      </div>
    </section>
  );
}

function GraphDescription({ graph }: { graph: TransferCase["graph"] }) {
  return (
    <div className="journey-graph">
      <strong>Directed edges:</strong>
      <ul>
        {graph.edges.map(([from, to, weight], index) => (
          <li key={`${from}-${to}-${index}`}>
            {from} → {to}: {weight}
          </li>
        ))}
      </ul>
    </div>
  );
}
function TransferForm({
  item,
  path,
  setPath,
  cost,
  setCost,
  suitable,
  setSuitable,
  justification,
  setJustification,
}: {
  item: TransferCase;
  path: string;
  setPath: (value: string) => void;
  cost: string;
  setCost: (value: string) => void;
  suitable: string;
  setSuitable: (value: string) => void;
  justification: string;
  setJustification: (value: string) => void;
}) {
  return (
    <div className="journey-transfer">
      <h4>{item.title}</h4>
      <GraphDescription graph={item.graph} />
      <p>{item.prompt}</p>
      {item.kind === "route" ? (
        <>
          <label htmlFor="transfer-path">Route (for example A → B → D)</label>
          <input
            id="transfer-path"
            value={path}
            maxLength={40}
            onChange={(event) => setPath(event.target.value)}
          />
          <label htmlFor="transfer-cost">Total cost</label>
          <input
            id="transfer-cost"
            inputMode="numeric"
            value={cost}
            maxLength={8}
            onChange={(event) => setCost(event.target.value)}
          />
        </>
      ) : (
        <fieldset>
          <legend>Is Dijkstra suitable for this graph?</legend>
          <label className="journey-choice">
            <input
              type="radio"
              name="transfer-suitability"
              checked={suitable === "yes"}
              onChange={() => setSuitable("yes")}
            />{" "}
            Yes, settle B at 2
          </label>
          <label className="journey-choice">
            <input
              type="radio"
              name="transfer-suitability"
              checked={suitable === "no"}
              onChange={() => setSuitable("no")}
            />{" "}
            No, use a method that handles negative edges
          </label>
        </fieldset>
      )}
      <label htmlFor="transfer-justification">
        Why is this action justified? (self-review, not automatically graded)
      </label>
      <textarea
        id="transfer-justification"
        value={justification}
        maxLength={1000}
        rows={4}
        onChange={(event) => setJustification(event.target.value)}
      />
    </div>
  );
}
