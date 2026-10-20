"use client";
import { useProgress } from "./progress-provider";
import { Icon } from "./icon";
export function CompletionButton({ topicId }: { topicId: string }) {
  const { completedIds, toggle, ready, storageError } = useProgress();
  const complete = completedIds.includes(topicId);
  return (
    <div className="completion-control">
      <button
        type="button"
        className={`button ${complete ? "secondary" : ""}`}
        disabled={!ready}
        aria-pressed={complete}
        onClick={() => toggle(topicId)}
      >
        <Icon name="check" size={18} />
        {complete ? "Completed · Undo" : "Mark lesson complete"}
      </button>
      <p role="status">
        {storageError
          ? "Browser storage is unavailable. Progress is kept for this session only."
          : complete
            ? "Lesson completed. Your progress is saved in this browser."
            : "Feel comfortable with the ideas? Save your progress."}
      </p>
    </div>
  );
}
