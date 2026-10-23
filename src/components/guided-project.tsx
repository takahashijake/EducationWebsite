"use client";
import { CodeLab } from "./code-lab";
import { projectWorkspaceId } from "@/lib/workspace";
import { useState } from "react";
import Link from "next/link";
import type {
  GuidedProject as Project,
  ProjectMilestone,
} from "@/content/project-types";
import { topics, topicHref } from "@/content/curriculum";
import { projectStages, type ProjectProgress } from "@/lib/project-progress";
import { useProgress } from "./progress-provider";
import { useProjectProgress } from "./use-project-progress";
import { PracticeExercise } from "./practice-exercise";

function TopicLink({ id }: { id: string }) {
  const topic = topics.find((topic) => topic.id === id)!;
  return <Link href={topicHref(topic)}>{topic.title}</Link>;
}
function Milestone({
  milestone,
  savedAnswer,
  correct,
  checked,
  ready,
  update,
  projectId,
  previousMilestone,
}: {
  projectId: string;
  previousMilestone?: ProjectMilestone;
  milestone: ProjectMilestone;
  savedAnswer?: number;
  correct: boolean;
  checked: string[];
  ready: boolean;
  update: (change: (current: ProjectProgress) => ProjectProgress) => void;
}) {
  const [hints, setHints] = useState(0);
  return (
    <>
      <p>{milestone.goal}</p>
      <h3>Connect to what you know</h3>
      <ul>
        {milestone.connections.map((connection) => (
          <li key={connection.topicId}>
            <TopicLink id={connection.topicId} />: {connection.explanation}
          </li>
        ))}
      </ul>
      <h3>Expected behavior</h3>
      <p>{milestone.expectedBehavior}</p>
      {milestone.coding && (
        <CodeLab
          exercise={milestone.coding}
          workspaceId={projectWorkspaceId(projectId, milestone.id)}
          carryFrom={
            previousMilestone
              ? {
                  workspaceId: projectWorkspaceId(
                    projectId,
                    previousMilestone.id,
                  ),
                  title: previousMilestone.title,
                }
              : undefined
          }
        />
      )}
      <h3>Starter code and reasoning check</h3>
      <p>
        Implement this component in the Code Lab. Then use the reasoning check
        to explain one decision.
      </p>
      {ready ? (
        <PracticeExercise
          key={`${milestone.id}:${savedAnswer ?? "new"}`}
          exercise={{ ...milestone.question, source: milestone.starter }}
          initialAnswer={savedAnswer}
          submitLabel="Check reasoning"
          completionNote="This choice checks reasoning separately from the executable Code Lab tests. Record your work in the checklist."
          onResult={(_, answer) =>
            update((current) => {
              const answers = { ...current.answers };
              if (answer === undefined) delete answers[milestone.question.id];
              else answers[milestone.question.id] = answer;
              return { ...current, answers };
            })
          }
        />
      ) : (
        <pre tabIndex={0}>
          <code>{milestone.starter}</code>
        </pre>
      )}
      <div className="project-hints">
        <h3>Incremental hints</h3>
        {milestone.hints.slice(0, hints).map((hint, index) => (
          <p key={hint}>
            Hint {index + 1}: {hint}
          </p>
        ))}
        <button
          type="button"
          className="button secondary"
          disabled={hints === milestone.hints.length}
          onClick={() => setHints((count) => count + 1)}
          aria-describedby={`${milestone.id}-hint-status`}
        >
          Reveal next hint
        </button>
        <p role="status" id={`${milestone.id}-hint-status`}>
          {hints} of {milestone.hints.length} hints revealed.
        </p>
      </div>
      <h3>Authored test assertions</h3>
      {milestone.tests.map((test) => (
        <div key={test.label}>
          <p>{test.label}</p>
          <pre tabIndex={0}>
            <code>{test.code}</code>
          </pre>
        </div>
      ))}
      {savedAnswer !== undefined ? (
        <details className="project-solution">
          <summary>Compare with the worked solution</summary>
          <pre tabIndex={0}>
            <code>{milestone.solution}</code>
          </pre>
          <p>{milestone.explanation}</p>
        </details>
      ) : (
        <p>
          Attempt the reasoning check to make the worked solution available.
        </p>
      )}
      <fieldset className="project-checklist">
        <legend>Completion checklist</legend>
        {milestone.checklist.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              disabled={!ready || !correct}
              checked={checked.includes(item.id)}
              onChange={() =>
                update((current) => ({
                  ...current,
                  checked: current.checked.includes(item.id)
                    ? current.checked.filter((id) => id !== item.id)
                    : [...current.checked, item.id],
                }))
              }
            />{" "}
            {item.text}
          </label>
        ))}
      </fieldset>
      {!correct && (
        <p>
          Answer the reasoning check correctly to record your checklist. A
          checked box is your own report of work.
        </p>
      )}
    </>
  );
}
export function GuidedProject({ project }: { project: Project }) {
  const { completedIds } = useProgress();
  const { progress, ready, storageError, update } = useProjectProgress(project);
  const stages = projectStages(project, progress);
  const complete = stages.every((stage) => stage.complete);
  return (
    <article className="shell lesson-article project-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/roadmap">Roadmap</Link>
        <span>/</span>
        <Link href="/projects">Guided projects</Link>
      </nav>
      <span className="eyebrow">APPLY THE FUNDAMENTALS</span>
      <h1>{project.title}</h1>
      {project.introduction.map((text) => (
        <p key={text}>{text}</p>
      ))}
      <section className="objectives-box">
        <h2>Project objectives</h2>
        <ul>
          {project.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>
      <section aria-label="Project prerequisites">
        <h2>Helpful prerequisites</h2>
        <p>
          Review these before starting. Reading completion is advisory; it never
          locks the project.
        </p>
        <ul>
          {project.prerequisites.map((id) => (
            <li key={id}>
              <TopicLink id={id} /> ·{" "}
              {completedIds.includes(id)
                ? "Reading marked complete"
                : "Review recommended"}
            </li>
          ))}
        </ul>
      </section>
      <nav aria-label="Project milestones">
        <h2>Your project stages</h2>
        <ol>
          {project.milestones.map((milestone, index) => (
            <li key={milestone.id}>
              <a href={`#${milestone.id}`}>{milestone.title}</a> ·{" "}
              {stages[index].complete
                ? "Completed"
                : stages[index].unlocked
                  ? "Ready to work"
                  : "Complete the previous stage first"}
            </li>
          ))}
        </ol>
      </nav>
      <p role="status">
        {stages.filter((stage) => stage.complete).length} of {stages.length}{" "}
        milestones complete.{" "}
        {complete
          ? "Guided project completed. Rebuild a small variation without the solution to check your independence."
          : "Complete each reasoning check and work checklist to continue."}
      </p>
      {storageError && (
        <p role="alert">
          Browser storage is unavailable. Project progress is kept for this
          session only.
        </p>
      )}
      {project.milestones.map((milestone, index) => (
        <section
          className="project-milestone"
          id={milestone.id}
          key={milestone.id}
          aria-labelledby={`${milestone.id}-title`}
        >
          <h2 id={`${milestone.id}-title`}>
            {index + 1}. {milestone.title}
          </h2>
          {stages[index].unlocked ? (
            <Milestone
              projectId={project.id}
              previousMilestone={project.milestones[index - 1]}
              milestone={milestone}
              savedAnswer={progress.answers[milestone.question.id]}
              correct={stages[index].correct}
              checked={progress.checked}
              ready={ready}
              update={update}
            />
          ) : (
            <p>
              Complete the preceding milestone’s reasoning check and checklist
              to open this stage.
            </p>
          )}
        </section>
      ))}
      <section>
        <h2>Reflection questions</h2>
        <p>
          Write your answers locally before checking the final reflection box.
        </p>
        <ol>
          {project.reflections.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>
      {complete && (
        <section>
          <h2>Complete reference program</h2>
          <details>
            <summary>Reveal the full reference</summary>
            <pre tabIndex={0}>
              <code>{project.reference}</code>
            </pre>
            <p>{project.referenceExplanation}</p>
          </details>
        </section>
      )}
      <p>
        Project progress is stored separately from lesson reading completion on
        this browser. Reasoning answers and checklist choices persist; hint and
        solution visibility reset on reload. Python executes only in a
        disposable browser Worker; test results never rewrite completion.
      </p>
      <Link className="text-link" href="/roadmap">
        Return to the curriculum →
      </Link>
    </article>
  );
}
