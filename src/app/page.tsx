import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  availableTopics,
  programmingPath,
  sections,
  topics,
  topicHref,
} from "@/content/curriculum";
import { lessons } from "@/content/lessons";
export default function Home() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <div className="release-tag">
            <span />A FOUNDATION FOR YOUR NEXT CHAPTER
          </div>
          <h1>
            Don’t just learn to code.
            <br />
            <span>
              Understand how
              <br className="desktop-break" /> it all works.
            </span>
          </h1>
          <p>
            Connect the dots of computer science. A thoughtful path from your
            first variable to the systems behind the software you use every day.
          </p>
          <div className="hero-actions">
            <Link href="/roadmap" className="button">
              Start learning <Icon name="arrow" size={18} />
            </Link>
            <a href="#how-it-works" className="text-link">
              Take a look around <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="hero-note">
            <span className="mini-check">
              <Icon name="check" size={12} />
            </span>
            Free to explore <span>·</span> No account needed <span>·</span> At
            your own pace
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Illustration of a learning path from programming to computer systems"
          role="img"
        >
          <div className="visual-label">
            <span className="status-dot" />
            YOUR UNDERSTANDING, CONNECTED
          </div>
          <div className="mini-path">
            <div className="mini-node main-node">
              <span className="mini-icon">
                <Icon name="code" size={22} />
              </span>
              <div>
                <span>START WITH THE BASICS</span>
                <strong>Programming Fundamentals</strong>
              </div>
              <span className="node-check">
                <Icon name="check" size={15} />
              </span>
            </div>
            <div className="path-line" />
            <div className="mini-branches">
              <div className="mini-node">
                <Icon name="layers" size={20} />
                <strong>Data Structures</strong>
              </div>
              <div className="mini-node">
                <Icon name="route" size={20} />
                <strong>Algorithms</strong>
              </div>
            </div>
            <div className="path-line" />
            <div className="mini-node bottom-node">
              <Icon name="cpu" size={23} />
              <div>
                <span>SEE THE BIGGER PICTURE</span>
                <strong>Computer Systems</strong>
              </div>
            </div>
          </div>
          <div className="visual-caption">
            <span>From “how do I write this?”</span>
            <strong>
              to “why does this work?” <span aria-hidden="true">↗</span>
            </strong>
          </div>
          <div className="visual-corner">01 → ∞</div>
        </div>
      </section>
      <div className="stats-bar">
        <div className="shell stats-inner">
          <p>
            A clearer path.
            <br />
            <strong>A stronger foundation.</strong>
          </p>
          <div>
            <strong>{sections.length}</strong>
            <span>connected sections</span>
          </div>
          <div>
            <strong>{topics.length}</strong>
            <span>foundational topics</span>
          </div>
          <div>
            <strong>{availableTopics.length}</strong>
            <span>lessons to start with</span>
          </div>
          <span className="stats-caption">
            Built for understanding,
            <br />
            one concept at a time.
          </span>
        </div>
      </div>
      <section className="shell home-section" id="how-it-works">
        <div className="section-intro">
          <div>
            <span className="eyebrow">A PATH, NOT A CHECKLIST</span>
            <h2>
              Know where you’re going.
              <br />
              Understand each step.
            </h2>
          </div>
          <p>
            Start with the fundamentals, follow your curiosity,
            <br className="desktop-break" /> and build knowledge that connects.
          </p>
        </div>
        <div className="how-grid">
          {[
            {
              icon: "route" as const,
              number: "01",
              title: "See the whole picture",
              text: "Explore an organized roadmap across eight areas of computer science. Know what’s ready to learn and what’s coming next.",
            },
            {
              icon: "book" as const,
              number: "02",
              title: "Go beyond the definition",
              text: "Learn with clear explanations, worked examples, and code. Build an intuition for the idea, then check your understanding.",
            },
            {
              icon: "check" as const,
              number: "03",
              title: "Make steady progress",
              text: "Mark lessons complete as you learn. Your progress stays in your browser, ready for you to pick up where you left off.",
            },
          ].map((item) => (
            <div className="how-card" key={item.number}>
              <div className="how-top">
                <span className="section-icon">
                  <Icon name={item.icon} size={23} />
                </span>
                <span>{item.number}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="sample-section">
        <div className="shell">
          <div className="section-intro">
            <div>
              <span className="eyebrow">YOUR FIRST FEW STEPS</span>
              <h2>Small lessons. Lasting understanding.</h2>
            </div>
            <Link href="/roadmap" className="text-link">
              View the full roadmap <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="sample-grid">
            {availableTopics.map((topic) => {
              const section = sections.find(
                (section) => section.id === topic.sectionId,
              )!;
              return (
                <Link
                  className="sample-card"
                  href={topicHref(topic)}
                  key={topic.id}
                >
                  <div className="sample-top">
                    <span className="section-icon">
                      <Icon name={section.icon} size={23} />
                    </span>
                    <span className="status available">
                      <span className="status-dot" />
                      Available
                    </span>
                  </div>
                  <div className="sample-category">{section.title}</div>
                  <h3>{topic.title}</h3>
                  <p>{topic.description}</p>
                  <div className="sample-bottom">
                    <span>
                      <Icon name="clock" size={14} />
                      {lessons[topic.id].minutes} min · Beginner
                    </span>
                    <Icon name="arrow" size={20} />
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="scope-note">
            <Icon name="book" size={16} />
            {availableTopics.length} complete lessons, including a{" "}
            {programmingPath.length}-lesson programming path.{" "}
            {topics.length - availableTopics.length} topics remain planned.
          </p>
        </div>
      </section>
      <section className="shell home-cta">
        <div>
          <span className="eyebrow">START WHERE YOU ARE</span>
          <h2>Every big idea starts with a fundamental.</h2>
          <p>You don’t need to know everything. Just take the next step.</p>
        </div>
        <Link href="/roadmap" className="button">
          Explore the roadmap <Icon name="arrow" size={18} />
        </Link>
      </section>
    </>
  );
}
