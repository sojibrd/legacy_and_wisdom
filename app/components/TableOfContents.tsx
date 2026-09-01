"use client";

import { useEffect, useState } from "react";
import type { HeadingItem } from "../lib/content";
import { ListFilter } from "./icons";

export default function TableOfContents({ headings }: { headings: HeadingItem[] }) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0.1 }
    );

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <aside
      aria-label="এই পৃষ্ঠার সূচিপত্র"
      className="hidden xl:block w-64 shrink-0"
    >
      <div className="sticky top-8 flex flex-col gap-3">
        <div className="seam-b flex items-center gap-1.5 pb-2">
          <span className="t-muted flex">
            <ListFilter />
          </span>
          <span className="t-label">এই পৃষ্ঠায়</span>
        </div>

        {/* No gap between rows: the rail down the left edge has to be
            continuous for the active marker to sit on something. */}
        <nav className="flex flex-col max-h-[calc(100vh-10rem)] overflow-y-auto pr-2">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(heading.id);
                if (!target) return;
                target.scrollIntoView({ behavior: "smooth" });
                setActiveId(heading.id);
                window.history.pushState(null, "", `#${heading.id}`);
              }}
              aria-current={activeId === heading.id}
              title={heading.text}
              className={`toc-link block py-0.5 truncate ${
                heading.level === 3 ? "pl-6" : "pl-3"
              }`}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
