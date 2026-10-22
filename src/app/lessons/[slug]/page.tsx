import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTopicBySlug,
  sections,
  topics,
  topicHref,
} from "@/content/curriculum";
import { lessons } from "@/content/lessons";
import { LessonLayout } from "@/components/lesson-layout";
import { Icon } from "@/components/icon";
export function generateStaticParams() {
  return topics.map((topic) => ({ slug: topic.slug }));
}
export const dynamicParams = false;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  return {
    title: topic?.title ?? "Topic not found",
    description: topic?.description,
  };
}
export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const section = sections.find((section) => section.id === topic.sectionId)!;
  if (topic.status === "available") {
    const lesson = lessons[topic.id];
    if (!lesson)
      throw new Error(`Available topic ${topic.id} is missing its lesson`);
    return <LessonLayout topic={topic} lesson={lesson} />;
  }
  const prerequisites = (topic.prerequisites ?? []).map((id) =>
    topics.find((item) => item.id === id)!,
  );
  return (
    <div className="shell planned-shell">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link href="/roadmap">Roadmap</Link>
        <span>/</span>
        <Link href={`/roadmap#${section.id}`}>{section.title}</Link>
        <span>/</span>
        <span aria-current="page">{topic.title}</span>
      </nav>
      <article className="planned-overview">
        <span className="section-icon large">
          <Icon name={section.icon} size={30} />
        </span>
        <span className="status planned">Planned topic</span>
        <h1>{topic.title}</h1>
        <p className="lesson-deck">{topic.description}</p>
        <div className="planned-message">
          <h2>A place on the path. A lesson still to come.</h2>
          <p>
            This topic is part of the {section.title.toLowerCase()} curriculum.
            The complete lesson, worked examples, and knowledge check aren’t
            available yet.
          </p>
          <p>
            Planned topics don’t count toward your completion progress. In the
            meantime, you can explore an available lesson.
          </p>
        </div>
        {prerequisites.length > 0 && (
          <div className="planned-prerequisites">
            <h2>Helpful foundations</h2>
            {prerequisites.map((item) => (
              <Link key={item.id} href={topicHref(item)}>
                {item.title} <span>({item.status})</span> →
              </Link>
            ))}
          </div>
        )}
        <div className="hero-actions">
          <Link href="/lessons/variables-data-types" className="button">
            Try an available lesson <Icon name="arrow" size={16} />
          </Link>
          <Link href={`/roadmap#${section.id}`} className="text-link">
            Back to roadmap
          </Link>
        </div>
      </article>
    </div>
  );
}
