"use client";

import { useMemo, useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavSection } from "../lib/content";
import { useTracker } from "../lib/tracker";
import { Check, Lock, PanelLeftClose, Search, X } from "./icons";

interface SidebarProps {
  nav: NavSection[];
  onClose?: () => void;
  onCollapse?: () => void;
  onNavigate?: () => void;
  searchRef?: RefObject<HTMLInputElement | null>;
}

type Match = {
  target: string;
  label: string;
  parent?: string;
};

export default function Sidebar({
  nav,
  onClose,
  onCollapse,
  onNavigate,
  searchRef,
}: SidebarProps) {
  const pathname = usePathname();
  const current = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const [search, setSearch] = useState("");
  const { byRoute } = useTracker();

  const query = search.trim().toLowerCase();
  const searching = query.length > 0;

  const matches = useMemo<Match[]>(() => {
    if (!searching) return [];

    const found: Match[] = [];
    for (const section of nav) {
      for (const doc of section.docs) {
        if (doc.title.toLowerCase().includes(query)) {
          found.push({ target: doc.route, label: doc.title });
        }
        for (const heading of doc.headings) {
          if (!heading.text.toLowerCase().includes(query)) continue;
          found.push({
            target: `${doc.route}#${heading.id}`,
            label: heading.text,
            parent: doc.title,
          });
        }
      }
    }
    return found;
  }, [nav, query, searching]);

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 min-w-0"
        >
          <span className="text-xl shrink-0">🏛️</span>
          <span className="t-title text-sm truncate">Legacy & Wisdom</span>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/progress/"
            onClick={onNavigate}
            className={`control px-2.5 py-1 text-[11px] ${
              current === "/progress/" ? "control--primary" : ""
            }`}
          >
            Tracker
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="control control--quiet p-1.5"
              aria-label="সাইডবার বন্ধ করুন"
            >
              <X />
            </button>
          )}

          {onCollapse && (
            <button
              onClick={onCollapse}
              className="control control--quiet p-1.5"
              aria-label="সূচিপত্র লুকান"
              aria-expanded
              aria-controls="site-sidebar"
            >
              <PanelLeftClose />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <span className="t-muted absolute left-2.5 top-2.5 flex pointer-events-none">
          <Search />
        </span>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            if (search) setSearch("");
            else event.currentTarget.blur();
          }}
          placeholder="স্টেজ বা বিষয় খুঁজুন..."
          aria-label="স্টেজ বা বিষয় খুঁজুন (শর্টকাট: / বা Ctrl+K)"
          className="surface-well t-body w-full pl-8 pr-8 py-2 text-sm"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="control control--quiet absolute right-1.5 top-1.5 px-1.5 py-1"
            aria-label="খোঁজা বাতিল"
          >
            <X />
          </button>
        ) : (
          <span
            className="t-caption t-mono hidden lg:inline absolute right-2.5 top-2 pointer-events-none select-none text-[11px]"
            title="শর্টকাট: / অথবা Ctrl+K"
          >
            /
          </span>
        )}
      </div>

      {searching ? (
        <nav className="flex flex-col gap-1.5">
          {matches.length === 0 ? (
            <div className="surface-well t-caption p-4 text-center">
              &ldquo;{search}&rdquo; দিয়ে কিছু পাওয়া যায়নি।
            </div>
          ) : (
            matches.map((match) => (
              <Link
                key={match.target}
                href={match.target}
                onClick={onNavigate}
                className="row block px-2.5 py-1.5 text-xs leading-snug"
              >
                <span className="block truncate">{match.label}</span>
                {match.parent && (
                  <span className="t-caption block truncate">
                    {match.parent}
                  </span>
                )}
              </Link>
            ))
          )}
        </nav>
      ) : (
        <nav className="flex flex-col gap-4">
          {nav.map((section) => (
            <div
              key={section.name}
              className="topic-group pb-4 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="t-label truncate px-2.5">{section.name}</span>
                <span className="chip shrink-0">{section.docs.length}</span>
              </div>

              {section.docs.map((doc) => {
                const stage = byRoute[doc.route];

                return (
                  <Link
                    key={doc.route}
                    href={doc.route}
                    onClick={onNavigate}
                    aria-current={current === doc.route}
                    className="row flex items-center gap-1.5 px-2.5 py-1.5 text-xs leading-snug"
                  >
                    {stage && (
                      <span className="shrink-0 flex">
                        {!stage.isUnlocked ? (
                          <span className="t-muted flex" title="লক">
                            <Lock />
                          </span>
                        ) : stage.isComplete ? (
                          <span className="t-ok flex" title="সম্পন্ন">
                            <Check />
                          </span>
                        ) : null}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{doc.title}</span>
                    {stage && stage.isUnlocked && !stage.isComplete && (
                      <span className="t-caption t-mono shrink-0">
                        {stage.done}/{stage.total}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
