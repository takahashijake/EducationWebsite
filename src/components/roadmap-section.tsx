import type { Section } from "@/content/types";
import { topicsForSection } from "@/content/curriculum";
import { Icon } from "./icon";
import { TopicCard } from "./topic-card";
export function RoadmapSection({ section }: { section: Section }) {
  const topics = topicsForSection(section.id);
  return (
    <section
      id={section.id}
      className="roadmap-section"
      aria-labelledby={`${section.id}-title`}
    >
      <div className="section-number">
        {String(section.order).padStart(2, "0")}
      </div>
      <div className="section-content">
        <div className="section-heading">
          <span className="section-icon">
            <Icon name={section.icon} size={22} />
          </span>
          <div>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            <p>{section.description}</p>
          </div>
          <span className="topic-count">{topics.length} topics</span>
        </div>
        <div className="topic-grid">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </section>
  );
}
