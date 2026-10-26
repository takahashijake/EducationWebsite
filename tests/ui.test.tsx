import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KnowledgeCheck } from "@/components/knowledge-check";
import { ProgressProvider } from "@/components/progress-provider";
import { CompletionButton } from "@/components/completion-button";
import { ProgressIndicator } from "@/components/progress-indicator";
import { TopicCard } from "@/components/topic-card";
import { LessonLayout } from "@/components/lesson-layout";
import { Navigation } from "@/components/navigation";
import { lessons } from "@/content/lessons";
import { availableTopics, topics } from "@/content/curriculum";
import { PROGRESS_KEY, serializeProgress } from "@/lib/progress";
import Home from "@/app/page";
import RoadmapPage from "@/app/roadmap/page";
import TopicPage, { generateStaticParams } from "@/app/lessons/[slug]/page";
vi.mock("next/navigation", () => ({
  usePathname: () => "/roadmap",
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

describe("knowledge check", () => {
  const questions = lessons["variables-data-types"].questions;
  it("requires all answers and explains both correct and incorrect answers", async () => {
    const user = userEvent.setup();
    render(<KnowledgeCheck questions={questions} />);
    expect(
      screen.getByRole("button", { name: /check answers/i }),
    ).toBeDisabled();
    const groups = screen.getAllByRole("group");
    await user.click(within(groups[0]).getByLabelText("str"));
    await user.click(within(groups[1]).getByLabelText("13"));
    await user.click(within(groups[2]).getByLabelText('"32"'));
    await user.click(screen.getByRole("button", { name: /check answers/i }));
    expect(screen.getByRole("status")).toHaveTextContent("2 of 3 correct");
    expect(screen.getAllByText("Correct.")).toHaveLength(2);
    expect(screen.getByText("Not quite.")).toBeInTheDocument();
    expect(
      screen.getByText(questions[1].explanation, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("radio")
        .every((radio) => (radio as HTMLInputElement).disabled),
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(
      screen.getByRole("button", { name: /check answers/i }),
    ).toBeDisabled();
    expect(
      screen
        .getAllByRole("radio")
        .every((radio) => !(radio as HTMLInputElement).checked),
    ).toBe(true);
  });
});
describe("progress interface", () => {
  it("updates progress and the roadmap, persists, restores on remount, and supports undo", async () => {
    const user = userEvent.setup();
    const topic = topics[0];
    const ui = (
      <ProgressProvider>
        <CompletionButton topicId={topic.id} />
        <ProgressIndicator />
        <TopicCard topic={topic} />
      </ProgressProvider>
    );
    const first = render(ui);
    await user.click(
      screen.getByRole("button", { name: /mark lesson complete/i }),
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(Math.round(100 / availableTopics.length)),
    );
    expect(
      screen.getByRole("link", { name: /completed/i }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_KEY)).toContain(topic.id);
    first.unmount();
    render(ui);
    expect(
      screen.getByRole("button", { name: /completed · undo/i }),
    ).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /completed · undo/i }));
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
  it("updates when another tab changes saved progress", () => {
    render(
      <ProgressProvider>
        <ProgressIndicator />
      </ProgressProvider>,
    );
    localStorage.setItem(PROGRESS_KEY, serializeProgress(["big-o-notation"]));
    fireEvent(window, new StorageEvent("storage", { key: PROGRESS_KEY }));
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(Math.round(100 / availableTopics.length)),
    );
  });
});
describe("navigation and pages", () => {
  it("renders the landing page and working primary navigation", () => {
    render(
      <>
        <Navigation />
        <Home />
      </>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Don’t just learn to code.",
    );
    expect(screen.getByRole("link", { name: "The roadmap" })).toHaveAttribute(
      "href",
      "/roadmap",
    );
    expect(
      screen.getByRole("link", { name: /^Start learning$/ }),
    ).toHaveAttribute("href", "/roadmap");
    expect(screen.getAllByRole("link", { name: /available/i })).toHaveLength(availableTopics.length);
  });
  it("renders every roadmap section and topic link with truthful status", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ version: 1, completed: ["propositional-logic"] }),
    );
    render(
      <ProgressProvider>
        <RoadmapPage />
      </ProgressProvider>,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(9);
    const topicLinks = screen
      .getAllByRole("link")
      .filter((link) => link.classList.contains("topic-card"));
    expect(topicLinks).toHaveLength(46);
    expect(screen.getAllByText("Planned", { exact: true })).toHaveLength(topics.filter((topic) => topic.status === "planned").length + 1); // Topics plus legend
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
  for (const topic of availableTopics)
    it(`renders the complete ${topic.slug} lesson`, () => {
      render(
        <ProgressProvider>
          <LessonLayout topic={topic} lesson={lessons[topic.id]} />
        </ProgressProvider>,
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        topic.title,
      );
      expect(
        screen.getByRole("heading", { name: "Learning objectives" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Key takeaways" }),
      ).toBeInTheDocument();
      expect(
        screen
          .getAllByRole("group")
          .filter((element) => element.tagName === "FIELDSET"),
      ).toHaveLength(3 + (lessons[topic.id].exercises?.length ?? 0));
      expect(
        screen.getByRole("button", { name: /mark lesson complete/i }),
      ).toBeInTheDocument();
    });
  it("builds route parameters for all topics", () => {
    expect(generateStaticParams()).toEqual(
      topics.map((topic) => ({ slug: topic.slug })),
    );
  });
  it("renders planned overviews without a quiz or completion action", async () => {
    render(
      await TopicPage({
        params: Promise.resolve({ slug: "propositional-logic" }),
      }),
    );
    expect(screen.getByText("Planned topic")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mark lesson complete/i }),
    ).not.toBeInTheDocument();
  });
  it("rejects an unknown topic URL", async () => {
    await expect(
      TopicPage({ params: Promise.resolve({ slug: "unknown" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
