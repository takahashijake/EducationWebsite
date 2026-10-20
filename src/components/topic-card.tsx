"use client";
import Link from "next/link";
import type { Topic } from "@/content/types";
import { topicHref } from "@/content/curriculum";
import { useProgress } from "./progress-provider";
import { Icon } from "./icon";
export function TopicCard({ topic }: { topic: Topic }) {
  const { completedIds } = useProgress();
  const completed =
    topic.status === "available" && completedIds.includes(topic.id);
  return (
    <Link
      href={topicHref(topic)}
      className={`topic-card ${topic.status}${completed ? " completed" : ""}`}
    >
      <div className="topic-topline">
        <span className={`status ${completed ? "is-complete" : topic.status}`}>
          {completed ? (
            <>
              <Icon name="check" size={12} />
              Completed
            </>
          ) : topic.status === "available" ? (
            <>
              <span className="status-dot" />
              Available
            </>
          ) : (
            "Planned"
          )}
        </span>
        {topic.status === "available" && <Icon name="arrow" size={16} />}
      </div>
      <h3>{topic.title}</h3>
      <p>{topic.description}</p>
    </Link>
  );
}
