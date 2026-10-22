import type { Metadata } from "next";
import Link from "next/link";
import { numberGuessingProject as project } from "@/content/projects";
import { topics, topicHref } from "@/content/curriculum";
import { GuidedProject } from "@/components/guided-project";
export const metadata: Metadata = { title: "Build a Number Guessing Game" };
export default function ProjectPage() {
  return (
    <article className="shell activity-shell lesson-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/roadmap#programming">Programming Fundamentals</Link>
        <span>/</span>
        <span>Guided project</span>
      </nav>
      <span className="eyebrow">COMBINE WHAT YOU KNOW</span>
      <h1>{project.title}</h1>
      <p>{project.introduction}</p>
      <p>
        Helpful lessons (advisory):{" "}
        {project.topicIds.map((id) => {
          const topic = topics.find((t) => t.id === id)!;
          return (
            <Link className="review-link" key={id} href={topicHref(topic)}>
              {topic.title}
            </Link>
          );
        })}
      </p>
      <GuidedProject project={project} />
    </article>
  );
}
