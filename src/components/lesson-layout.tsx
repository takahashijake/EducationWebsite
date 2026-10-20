import Link from "next/link";
import type { Lesson, Topic } from "@/content/types";
import { availableTopics, sections, topicHref } from "@/content/curriculum";
import { CodeExample } from "./code-example";
import { KnowledgeCheck } from "./knowledge-check";
import { LessonDemonstration } from "./lesson-demonstration";
import { CompletionButton } from "./completion-button";
import { ProgressIndicator } from "./progress-indicator";
import { Icon } from "./icon";
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
  const next =
    availableTopics[
      availableTopics.findIndex((item) => item.id === topic.id) + 1
    ];
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
          </section>
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
          <section id="knowledge-check">
            <span className="eyebrow">PAUSE & PRACTICE</span>
            <h2>Check your understanding</h2>
            <KnowledgeCheck key={topic.id} questions={lesson.questions} />
          </section>
          <div className="lesson-finish">
            <h2>One more concept, understood.</h2>
            <CompletionButton topicId={topic.id} />
          </div>
          <nav className="lesson-next" aria-label="Continue learning">
            <Link href="/roadmap">← Explore the roadmap</Link>
            {next && (
              <Link href={topicHref(next)}>
                Next sample: {next.title} <Icon name="arrow" size={16} />
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
