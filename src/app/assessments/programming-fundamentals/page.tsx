import type { Metadata } from "next";
import Link from "next/link";
import { fundamentalsAssessment as assessment } from "@/content/assessments";
import { KnowledgeCheck } from "@/components/knowledge-check";
export const metadata: Metadata = {
  title: "Programming Fundamentals Assessment",
};
export default function AssessmentPage() {
  return (
    <article className="shell activity-shell lesson-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/roadmap#programming">Programming Fundamentals</Link>
        <span>/</span>
        <span>Assessment</span>
      </nav>
      <span className="eyebrow">REASON ACROSS CONCEPTS</span>
      <h1>{assessment.title}</h1>
      <p>
        Work through {assessment.questions.length} problems without an answer
        key. Trace values on paper and explain your prediction before selecting
        it. Submit all answers to see your score, individual explanations, and
        lesson links for missed topics.
      </p>
      <p>
        This is a practice assessment, not certification or verified mastery.
        Results stay in this page session and disappear on reload. It does not
        change manual lesson completion or project progress. The choices are
        checked deterministically; Python is not executed here.
      </p>
      <KnowledgeCheck
        questions={assessment.questions}
        reviewTopics={Object.fromEntries(
          assessment.questions.map((q) => [q.id, q.topicIds]),
        )}
        submitLabel="Submit assessment"
        retryLabel="Retry assessment"
      />
      <nav className="trace-controls" aria-label="After the assessment">
        <Link className="button secondary" href="/roadmap#programming">
          Return to the roadmap
        </Link>
        <Link className="button secondary" href="/projects/number-guessing">
          Practice with the guided project
        </Link>
      </nav>
    </article>
  );
}
