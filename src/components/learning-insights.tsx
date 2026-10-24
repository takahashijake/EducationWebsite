"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { activityById, skills } from "@/content/learning-catalog";
import { availableTopics, topics, sections } from "@/content/curriculum";
import { diagnose, recommend } from "@/lib/learning-evidence";
import { useProgress } from "./progress-provider";
import { useLearningEvidence } from "./use-learning-evidence";
export function LearningInsights() {
  const { completedIds, ready: progressReady } = useProgress();
  const { evidence, ready, storageError, clear } = useLearningEvidence();
  const [confirmClear, setConfirmClear] = useState(false);
  const keepButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmClear) keepButton.current?.focus();
  }, [confirmClear]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const summaries = useMemo(() => diagnose(evidence, now), [evidence, now]);
  const recommendations = useMemo(
    () => recommend(evidence, now),
    [evidence, now],
  );
  if (!ready || !progressReady)
    return <p role="status">Loading your local learning profile…</p>;
  const next = recommendations[0];
  const due = summaries.filter(
    (entry) => entry.dueAt && Date.parse(entry.dueAt) <= now,
  );
  const publishedTopics = availableTopics;
  return (
    <div className="insights-grid">
      <section className="insight-panel">
        <h2>What have I studied?</h2>
        <p>Reading completion is separate from assessed understanding.</p>
        {sections
          .filter((section) =>
            publishedTopics.some((topic) => topic.sectionId === section.id),
          )
          .map((section) => {
            const members = publishedTopics.filter(
              (topic) => topic.sectionId === section.id,
            );
            return (
              <p key={section.id}>
                {
                  members.filter((topic) => completedIds.includes(topic.id))
                    .length
                }{" "}
                of {members.length} {section.title} lessons marked read
              </p>
            );
          })}
        <ul>
          {publishedTopics.map((topic) => (
            <li key={topic.id}>
              <Link href={`/lessons/${topic.slug}`}>{topic.title}</Link>:{" "}
              {completedIds.includes(topic.id)
                ? "marked read"
                : "available to read"}
            </li>
          ))}
        </ul>
      </section>
      <section className="insight-panel">
        <h2>What do I appear to understand?</h2>
        <p>
          {evidence.length} recorded activity observations. A correct answer is
          practice evidence, not mastery.
        </p>
        {evidence.length === 0 && (
          <p>
            Start with the{" "}
            <Link href="/assessments/programming-fundamentals">
              integrated assessment
            </Link>{" "}
            or a <Link href="/practice/retrieval">retrieval question</Link> to
            create a useful profile.
          </p>
        )}
        <h3>Recent observations</h3>
        <ol>
          {[...evidence]
            .reverse()
            .slice(0, 8)
            .map((entry) => (
              <li key={entry.attemptId}>
                {activityById[entry.activityId]?.title} ({entry.source}):{" "}
                {entry.correct
                  ? "correct on authored checks"
                  : "needs another look"}{" "}
                ·{" "}
                <time dateTime={entry.at}>
                  {new Date(entry.at).toLocaleDateString()}
                </time>
              </li>
            ))}
        </ol>
        <h3>Skill summaries</h3>
        {sections
          .filter((section) =>
            skills.some(
              (skill) =>
                topics.find((topic) => topic.id === skill.topicId)
                  ?.sectionId === section.id,
            ),
          )
          .map((section) => (
            <div key={section.id}>
              <h4>{section.title}</h4>
              <ul>
                {summaries
                  .filter(
                    (entry) =>
                      topics.find(
                        (topic) =>
                          topic.id ===
                          skills.find((skill) => skill.id === entry.skillId)
                            ?.topicId,
                      )?.sectionId === section.id,
                  )
                  .map((entry) => {
                    const skill = skills.find(
                      (item) => item.id === entry.skillId,
                    )!;
                    return (
                      <li key={entry.skillId}>
                        <strong>
                          {skill.title}: {entry.state}
                        </strong>
                        <p>{entry.reason}</p>
                        <small>
                          {entry.directCorrect} focused correct ·{" "}
                          {entry.directIncorrect} focused incorrect ·{" "}
                          {entry.partialCorrect} combined correct ·{" "}
                          {entry.partialIncorrect} combined incorrect
                        </small>
                        {entry.lastReviewedAt && (
                          <p>
                            Delayed retrieval completed{" "}
                            <time dateTime={entry.lastReviewedAt}>
                              {new Date(
                                entry.lastReviewedAt,
                              ).toLocaleDateString()}
                            </time>
                            .
                          </p>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
      </section>
      <section className="insight-panel">
        <h2>Where am I struggling?</h2>
        {summaries.every(
          (entry) =>
            entry.state !== "Needs review" && !entry.recentCombinedMiss,
        ) ? (
          <p>
            No focused recent mistake is recorded. Combined questions may still
            reveal areas worth checking.
          </p>
        ) : (
          <ul>
            {summaries
              .filter(
                (entry) =>
                  entry.state === "Needs review" || entry.recentCombinedMiss,
              )
              .map((entry) => {
                const skill = skills.find((item) => item.id === entry.skillId)!;
                return (
                  <li key={entry.skillId}>
                    <strong>{skill.title}</strong>
                    <p>{entry.reason}</p>
                    {skill.prerequisites.length > 0 && (
                      <p>
                        Helpful prerequisite:{" "}
                        {skill.prerequisites
                          .map(
                            (id) =>
                              skills.find((item) => item.id === id)?.title,
                          )
                          .join(", ")}
                        .
                      </p>
                    )}
                    <Link href={skill.reviewHref}>
                      Review the lesson explanation →
                    </Link>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
      <section className="insight-panel">
        <h2>What should I work on next?</h2>
        {next && (
          <div>
            <strong>
              {skills.find((skill) => skill.id === next.skillId)?.title}
            </strong>
            <p>{next.reason}</p>
            <Link className="button" href={next.href}>
              Start recommended practice →
            </Link>
          </div>
        )}
        <h3>Due for review</h3>
        {due.length ? (
          <ul>
            {due.map((entry) => {
              const recommendation = recommendations.find(
                (item) => item.skillId === entry.skillId,
              )!;
              return (
                <li key={entry.skillId}>
                  {skills.find((skill) => skill.id === entry.skillId)?.title}:{" "}
                  {entry.dueReason} ·{" "}
                  <Link href={recommendation.href}>Try review activity</Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>
            No review is due yet. After successful practice, the first review is
            scheduled about one day later.
          </p>
        )}
        <p>
          <Link href="/practice/retrieval">Browse retrieval questions</Link> ·{" "}
          <Link href="/practice/transfer">
            Try the Python transfer challenge
          </Link>
        </p>
      </section>
      <section className="insight-panel">
        <h2>Your data</h2>
        <p>
          Evidence stays in this browser. You can clear it without removing
          lesson completion or code drafts.
        </p>
        {confirmClear ? (
          <div role="group" aria-label="Confirm evidence clearing">
            <button ref={keepButton} onClick={() => setConfirmClear(false)}>
              Keep evidence
            </button>
            <button
              onClick={() => {
                clear();
                setConfirmClear(false);
              }}
            >
              Clear learning evidence
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmClear(true)}>
            Clear learning evidence…
          </button>
        )}
        {storageError && (
          <p role="alert">
            Browser storage is unavailable. Evidence is kept for this session
            only.
          </p>
        )}
      </section>
    </div>
  );
}
