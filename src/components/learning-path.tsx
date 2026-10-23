"use client";
import Link from "next/link";
import { programmingPath, topics, topicHref } from "@/content/curriculum";
import { pathProgress } from "@/lib/progress";
import { useProgress } from "./progress-provider";
import { practiceSummary } from "@/lib/practice-progress";
export function LearningPath({ currentId }: { currentId?: string }) {
  const { completedIds, practice } = useProgress();
  const coding = practiceSummary(practice);
  const progress = pathProgress(completedIds);
  return (
    <nav className="learning-path" aria-label="Programming core learning path">
      <h2>Programming core path</h2>
      {currentId && (
        <p>
          Lesson {programmingPath.indexOf(currentId) + 1} of{" "}
          {programmingPath.length}
        </p>
      )}
      <p>
        {progress.completed} of {progress.available} core lessons completed ·
        Global progress is tracked separately.
      </p>
      <ol>
        {programmingPath.map((id) => {
          const topic = topics.find((t) => t.id === id)!;
          return (
            <li key={id}>
              <Link
                href={topicHref(topic)}
                aria-current={currentId === id ? "page" : undefined}
              >
                {topic.title}
              </Link>{" "}
              <span>
                {completedIds.includes(id) ? "Completed" : "Available"}
                {id === progress.recommendedId
                  ? " · Recommended next step"
                  : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p>
        <Link href="/projects/number-guessing">
          Guided project: Python Number Guessing Game →
        </Link>
      </p>
      <p>
        <Link href="/practice/cpp">
          C++ practice: {coding.completed} of {coding.total} exercises passed
          public tests
        </Link>
      </p>
      <p>
        <Link href="/assessments/programming-fundamentals">
          Take the integrated fundamentals assessment
        </Link>
      </p>
      {!progress.recommendedId && (
        <p>
          Programming path reading completed. Apply these concepts in the guided
          project; completion alone does not establish understanding.
        </p>
      )}
    </nav>
  );
}
