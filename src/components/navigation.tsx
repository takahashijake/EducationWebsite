"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";
export function Navigation() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="CS Fundamentals home">
          <span className="brand-icon">
            <Icon name="route" size={21} />
          </span>
          <span>
            CS Fundamentals
            <span className="brand-subtitle">A ROADMAP TO UNDERSTANDING</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link
            href="/roadmap"
            className={
              path.startsWith("/roadmap") || path.startsWith("/lessons")
                ? "nav-link active"
                : "nav-link"
            }
            aria-current={path === "/roadmap" ? "page" : undefined}
          >
            The roadmap
          </Link>
          <Link href="/#how-it-works" className="nav-link how-link">
            How it works
          </Link>
          <Link href="/lessons/variables-data-types" className="button small">
            First lesson <Icon name="arrow" size={15} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
