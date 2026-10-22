import { describe, expect, it } from "vitest";
import {
  availableTopics,
  getTopicBySlug,
  sections,
  topics,
  topicHref,
  topicsForSection,
} from "@/content/curriculum";
import { lessons } from "@/content/lessons";
import { evaluateAnswer } from "@/lib/quiz";

describe("curriculum contracts", () => {
  it("has eight sections and all 46 requested topics, with unique stable IDs and slugs", () => {
    expect(sections).toHaveLength(8);
    expect(topics).toHaveLength(46);
    expect(new Set(sections.map((section) => section.id)).size).toBe(
      sections.length,
    );
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(topics.length);
    expect(new Set(topics.map((topic) => topic.slug)).size).toBe(topics.length);
    expect(availableTopics.map((topic) => topic.id).sort()).toEqual([
      "big-o-notation",
      "binary-number-representation",
      "conditionals",
      "functions",
      "loops",
      "operators-expressions",
      "variables-data-types",
    ]);
  });
  it("resolves all section and prerequisite references and maintains ordering", () => {
    for (const topic of topics) {
      expect(sections.some((section) => section.id === topic.sectionId)).toBe(
        true,
      );
      expect(topic.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(topic.title.length).toBeGreaterThan(2);
      expect(topic.description.length).toBeGreaterThan(30);
      for (const prerequisite of topic.prerequisites ?? []) {
        expect(topics.some((candidate) => candidate.id === prerequisite)).toBe(
          true,
        );
        expect(prerequisite).not.toBe(topic.id);
      }
    }
    for (const section of sections) {
      const members = topicsForSection(section.id);
      expect(members.length).toBeGreaterThan(0);
      expect(members.map((topic) => topic.order)).toEqual(
        members.map((_, i) => i + 1),
      );
    }
    expect(sections.map((section) => section.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });
  it("round-trips every URL to the correct topic and rejects unknown slugs", () => {
    for (const topic of topics) {
      expect(topicHref(topic)).toBe(`/lessons/${topic.slug}`);
      expect(getTopicBySlug(topic.slug)).toBe(topic);
    }
    expect(getTopicBySlug("not-a-real-lesson")).toBeUndefined();
  });
  it("requires complete instructional content and valid quizzes for each available lesson", () => {
    expect(Object.keys(lessons).sort()).toEqual(
      availableTopics.map((topic) => topic.id).sort(),
    );
    for (const topic of availableTopics) {
      const lesson = lessons[topic.id];
      expect(lesson.topicId).toBe(topic.id);
      expect(lesson.minutes).toBeGreaterThan(0);
      expect(lesson.objectives.length).toBeGreaterThanOrEqual(3);
      expect(lesson.introduction.join(" ").length).toBeGreaterThan(250);
      expect(lesson.concept.paragraphs.join(" ").length).toBeGreaterThan(500);
      expect(lesson.workedExample.title).toBeTruthy();
      expect(lesson.workedExample.introduction).toBeTruthy();
      expect(lesson.workedExample.steps.length).toBeGreaterThanOrEqual(3);
      expect(lesson.code.source.length).toBeGreaterThan(50);
      expect(lesson.code.explanation).toBeTruthy();
      expect(lesson.demonstration.caption).toBeTruthy();
      expect(lesson.misconceptions.length).toBeGreaterThanOrEqual(2);
      expect(lesson.takeaways.length).toBeGreaterThanOrEqual(3);
      expect(lesson.questions).toHaveLength(3);
      expect(new Set(lesson.questions.map((q) => q.id)).size).toBe(3);
      for (const q of lesson.questions) {
        expect(q.options.length).toBeGreaterThanOrEqual(3);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(Number.isInteger(q.correctIndex)).toBe(true);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.explanation.length).toBeGreaterThan(30);
        q.options.forEach((_, index) =>
          expect(evaluateAnswer(q, index)).toBe(index === q.correctIndex),
        );
        expect(evaluateAnswer(q, -1)).toBe(false);
        expect(evaluateAnswer(q, NaN)).toBe(false);
        expect(evaluateAnswer(q, q.options.length)).toBe(false);
      }
    }
  });
});
