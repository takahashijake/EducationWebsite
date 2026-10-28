import { CodeLab } from "./code-lab";
import { lessonWorkspaceId } from "@/lib/workspace";
import Link from "next/link";
import type { Lesson, Topic } from "@/content/types";
import {
  lessonNeighbors,
  programmingPath,
  topics,
  sections,
  topicHref,
} from "@/content/curriculum";
import { CodeExample } from "./code-example";
import { LessonPractice } from "./lesson-practice";
import { LessonDemonstration } from "./lesson-demonstration";
import { CompletionButton } from "./completion-button";
import { ProgressIndicator } from "./progress-indicator";
import { Icon } from "./icon";
import { LearningPath } from "./learning-path";
import { CppPractice } from "./cpp-practice";
import { exercisesForTopic } from "@/content/cpp-exercises";
const anchors = [
  ["objectives", "Learning objectives"],
  ["understanding", "The idea"],
  ["worked-example", "Worked example"],
  ["in-code", "See it in code"],
  ["misconceptions", "Common mistakes"],
  ["takeaways", "Key takeaways"],
  ["knowledge-check", "Knowledge check"],
];
export function LessonLayout({
  topic,
  lesson,
}: {
  topic: Topic;
  lesson: Lesson;
}) {
  const section = sections.find((section) => section.id === topic.sectionId)!;
  const { previous, next } = lessonNeighbors(topic);
  return (
    <div className="shell lesson-shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/roadmap">Roadmap</Link>
        <span>/</span>
        <Link href={`/roadmap#${section.id}`}>{section.title}</Link>
        <span>/</span>
        <span aria-current="page">{topic.title}</span>
      </nav>
      <div className="lesson-columns">
        <aside className="lesson-sidebar">
          <Link className="back-link" href={`/roadmap#${section.id}`}>
            ← Back to roadmap
          </Link>
          <div className="eyebrow">IN THIS LESSON</div>
          <nav aria-label="Lesson contents">
            {anchors.map(([id, label]) => (
              <a href={`#${id}`} key={id}>
                {label}
              </a>
            ))}
            {!!lesson.codingExercises?.length && (
              <a href="#coding-practice">Write and test Python</a>
            )}
            {lesson.exercises?.length ? (
              <a href="#practice">Prediction practice</a>
            ) : null}
            {exercisesForTopic(topic.id).length > 0 && (
              <a href="#cpp-practice">C++ programming practice</a>
            )}
          </nav>
          <ProgressIndicator compact />
        </aside>
        <article className="lesson-article">
          <div className="lesson-meta">
            <span className="status available">
              <span className="status-dot" />
              Available lesson
            </span>
            <span>
              <Icon name="clock" size={15} />
              {lesson.minutes} min read
            </span>
            <span>Beginner</span>
          </div>
          <h1>{topic.title}</h1>
          <p className="lesson-deck">{topic.description}</p>
          {programmingPath.includes(topic.id) && (
            <LearningPath currentId={topic.id} />
          )}
          {!!topic.prerequisites?.length && (
            <div className="prerequisite-links">
              <strong>Helpful foundations: </strong>
              {topic.prerequisites.map((id) => {
                const prerequisite = topics.find((item) => item.id === id)!;
                return (
                  <Link key={id} href={topicHref(prerequisite)}>
                    {prerequisite.title} ({prerequisite.status})
                  </Link>
                );
              })}
            </div>
          )}
          <section className="objectives-box" id="objectives">
            <div className="eyebrow">
              <Icon name="book" size={16} />
              WHAT YOU’LL LEARN
            </div>
            <h2>Learning objectives</h2>
            <ul>
              {lesson.objectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section id="understanding">
            <h2>Start with the idea</h2>
            {lesson.introduction.map((text) => (
              <p key={text}>{text}</p>
            ))}
            <h3>{lesson.concept.title}</h3>
            {lesson.concept.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
            <LessonDemonstration demonstration={lesson.demonstration} />
            {lesson.demonstrations?.map((demonstration, index) => (
              <LessonDemonstration key={index} demonstration={demonstration} />
            ))}
          </section>
          {lesson.sections?.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              {section.code && (
                <pre tabIndex={0}>
                  <code>{section.code}</code>
                </pre>
              )}
            </section>
          ))}
          {lesson.relatedTopicIds && (
            <section aria-label="Related lessons">
              <h2>Related lessons</h2>
              <ul>
                {lesson.relatedTopicIds.map((id) => {
                  const related = topics.find((item) => item.id === id)!;
                  return (
                    <li key={id}>
                      <Link href={topicHref(related)}>{related.title}</Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <section id="worked-example">
            <span className="eyebrow">LET’S WORK THROUGH IT</span>
            <h2>{lesson.workedExample.title}</h2>
            <p>{lesson.workedExample.introduction}</p>
            <ol className="worked-steps">
              {lesson.workedExample.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          <section id="in-code">
            <h2>See it in code</h2>
            <CodeExample code={lesson.code} />
          </section>
          <CppPractice topicId={topic.id} />
          <section id="misconceptions">
            <h2>Common mistakes</h2>
            <div className="misconceptions">
              {lesson.misconceptions.map((item) => (
                <div key={item.belief}>
                  <h3>{item.belief}</h3>
                  <p>{item.correction}</p>
                </div>
              ))}
            </div>
          </section>
          <section id="takeaways" className="takeaways">
            <h2>Key takeaways</h2>
            <ul>
              {lesson.takeaways.map((item) => (
                <li key={item}>
                  <Icon name="check" size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <LessonPractice key={topic.id} lesson={lesson} />
          {!!lesson.codingExercises?.length && (
            <div id="coding-practice">
              <div id="code-lab">
                {lesson.codingExercises.map((exercise) => (
                  <CodeLab
                    key={exercise.id}
                    exercise={exercise}
                    workspaceId={lessonWorkspaceId(topic.id, exercise.id)}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="lesson-finish">
            <h2>Record your reading progress.</h2>
            <CompletionButton topicId={topic.id} />
          </div>
          {lesson.nextStep && (
            <p className="next-guidance">{lesson.nextStep}</p>
          )}
          <nav className="lesson-next" aria-label="Continue learning">
            {previous ? (
              <Link href={topicHref(previous)}>
                Previous Lesson: {previous.title}
              </Link>
            ) : (
              <Link href="/roadmap">← Explore the roadmap</Link>
            )}
            {next && (
              <Link href={topicHref(next)}>
                Next Lesson: {next.title} <Icon name="arrow" size={16} />
              </Link>
            )}
            {topic.id === programmingPath.at(-1) && (
              <Link href="/projects/number-guessing">
                Apply it: Number Guessing Game →
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
