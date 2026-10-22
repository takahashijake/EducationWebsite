import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/content/projects";
export const metadata: Metadata = { title: "Guided projects" };
export default function ProjectsPage() {
  return (
    <div className="shell lesson-article project-page">
      <h1>Guided projects</h1>
      <p>
        Connect the lessons by building, testing, and explaining one component
        at a time.
      </p>
      {projects.map((project) => (
        <section key={project.id}>
          <h2>
            <Link href={`/projects/${project.slug}`}>{project.title} →</Link>
          </h2>
          <p>{project.introduction[0]}</p>
          <p>
            {project.milestones.length} stages · Python 3 · Fixed reasoning
            checks and local coding practice
          </p>
        </section>
      ))}
      <Link href="/roadmap">Explore the learning path →</Link>
    </div>
  );
}
