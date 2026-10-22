import { LearningPath } from "@/components/learning-path";
import type { Metadata } from "next";
import Link from "next/link";
import { availableTopics, sections, topics } from "@/content/curriculum";
import { RoadmapSection } from "@/components/roadmap-section";
import { ProgressIndicator } from "@/components/progress-indicator";
import { Icon } from "@/components/icon";
export const metadata: Metadata = { title: "The Roadmap" };
export default function RoadmapPage() {
  return (
    <div className="shell roadmap-shell">
      <div className="breadcrumbs">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>The roadmap</span>
      </div>
      <div className="roadmap-intro">
        <div>
          <span className="eyebrow">YOUR LEARNING PATH</span>
          <h1>The foundations, connected.</h1>
          <p>
            Build your understanding of computer science, one concept at a time.
            <br className="desktop-break" />
            Start at the beginning or explore what sparks your curiosity.
          </p>
          <div className="roadmap-metadata">
            <span>
              <Icon name="layers" size={15} />
              {sections.length} sections
            </span>
            <span>{topics.length} topics</span>
            <span className="status available">
              <span className="status-dot" />
              {availableTopics.length} lessons available
            </span>
          </div>
        </div>
        <ProgressIndicator />
      </div>
      <LearningPath />
      <div className="roadmap-columns">
        <aside className="roadmap-sidebar">
          <div className="eyebrow">ON THIS ROADMAP</div>
          <nav aria-label="Curriculum sections">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                <span>{String(section.order).padStart(2, "0")}</span>
                {section.title}
              </a>
            ))}
          </nav>
          <div className="sidebar-note">
            <Icon name="book" size={20} />
            <strong>A growing curriculum</strong>
            <p>
              Available topics include full lessons and knowledge checks.
              Planned topics offer a preview of what you’ll learn.
            </p>
          </div>
        </aside>
        <div className="roadmap-content">
          <div className="roadmap-legend">
            <span>
              <span className="legend-dot available" />
              Available to learn
            </span>
            <span>
              <span className="legend-dot planned" />
              Planned
            </span>
            <span>
              <Icon name="check" size={14} />
              Completed
            </span>
          </div>
          <div className="roadmap-timeline">
            {sections.map((section) => (
              <RoadmapSection key={section.id} section={section} />
            ))}
          </div>
          <div className="roadmap-end">
            <span>THE LEARNING CONTINUES</span>
            <p>A foundation to build on, not a finish line.</p>
            <Link href="/lessons/variables-data-types" className="text-link">
              Begin with variables and data types{" "}
              <Icon name="arrow" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
