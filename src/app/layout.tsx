import type { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { ProgressProvider } from "@/components/progress-provider";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "CS Fundamentals Roadmap — Build your understanding",
    template: "%s | CS Fundamentals",
  },
  description:
    "A clear path through computer science. Explore 46 foundational topics and learn through worked examples, concise lessons, and knowledge checks.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ProgressProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <Navigation />
          <main id="main-content">{children}</main>
          <footer className="site-footer">
            <div className="shell footer-inner">
              <Link href="/" className="footer-brand">
                CS Fundamentals
                <span>Understand the foundations. Build what comes next.</span>
              </Link>
              <p>
                An open learning journey.
                <span className="footer-version">
                  V1.6 · Learn, practice, review
                </span>
              </p>
              <Link href="/roadmap">
                Explore the roadmap <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </footer>
        </ProgressProvider>
      </body>
    </html>
  );
}
