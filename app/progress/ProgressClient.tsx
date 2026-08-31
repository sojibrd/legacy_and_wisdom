"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { ArrowRight, Check, Circle, RotateCcw } from "../components/icons";
import {
  hasNote,
  sectionKey,
  NOTES_KEY,
  READ_KEY,
  REVISE_KEY,
  type DocNote,
} from "../components/DocTracker";
import type { NavSection } from "../lib/content";

type Filter = "all" | "revise" | "unread" | "notes";

export default function ProgressClient({ nav }: { nav: NavSection[] }) {
  const [readSections, setReadSections] = useLocalStorage<string[]>(READ_KEY, []);
  const [reviseRoutes, setReviseRoutes] = useLocalStorage<string[]>(REVISE_KEY, []);
  const [notesMap] = useLocalStorage<Record<string, DocNote>>(NOTES_KEY, {});

  const [filter, setFilter] = useState<Filter>("all");

  const docs = useMemo(
    () =>
      nav.flatMap((section) =>
        section.docs.map((doc) => ({
          route: doc.route,
          title: doc.title,
          section: section.name,
          sections: doc.headings.filter((heading) => heading.level === 2),
        }))
      ),
    [nav]
  );

  useEffect(() => {
    const liveRoutes = new Set(docs.map((doc) => doc.route));
    const liveKeys = new Set(
      docs.flatMap((doc) =>
        doc.sections.map((section) => sectionKey(doc.route, section.id))
      )
    );

    if (readSections.some((key) => !liveKeys.has(key))) {
      setReadSections((prev) => prev.filter((key) => liveKeys.has(key)));
    }
    if (reviseRoutes.some((route) => !liveRoutes.has(route))) {
      setReviseRoutes((prev) => prev.filter((route) => liveRoutes.has(route)));
    }
  }, [docs, readSections, reviseRoutes, setReadSections, setReviseRoutes]);

  const readOf = (doc: (typeof docs)[number]) =>
    doc.sections.filter((section) =>
      readSections.includes(sectionKey(doc.route, section.id))
    ).length;

  const total = docs.reduce((sum, doc) => sum + doc.sections.length, 0);
  const readCount = docs.reduce((sum, doc) => sum + readOf(doc), 0);
  const reviseCount = docs.filter((doc) =>
    reviseRoutes.includes(doc.route)
  ).length;
  const notesCount = docs.filter((doc) => hasNote(notesMap[doc.route])).length;
  const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;

  function toggleSection(route: string, id: string) {
    const key = sectionKey(route, id);
    setReadSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function toggleRevise(route: string) {
    setReviseRoutes((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
    );
  }

  const visible = docs.filter((doc) => {
    if (filter === "revise") return reviseRoutes.includes(doc.route);
    if (filter === "unread") return readOf(doc) < doc.sections.length;
    if (filter === "notes") return hasNote(notesMap[doc.route]);
    return true;
  });

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "সব স্টেজ ও ওভারভিউ", count: docs.length },
    { id: "revise", label: "রিভিশন দরকার", count: reviseCount },
    { id: "unread", label: "অসম্পূর্ণ", count: total - readCount },
    { id: "notes", label: "নোটযুক্ত", count: notesCount },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="t-title text-2xl sm:text-3xl">Roadmap Tracker</h1>
        <p className="t-body text-sm">
          ১০টি স্টেজের কতটুকু পর্যালোচনা করা হয়েছে, কোনগুলো পুনর্বিবেচনা দরকার এবং ব্যক্তিগত নোটসমূহ এক নজরে।
        </p>
      </header>

      <div className="surface-panel flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="t-label">পর্যালোচিত সেকশন</span>
          <span className="t-mono t-accent text-sm">
            {readCount}/{total} ({percent}%)
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="সার্বিক অগ্রগতি"
          className="gauge h-2 w-full"
        >
          <div className="gauge-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div role="tablist" aria-label="ফিল্টার" className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            onClick={() => setFilter(item.id)}
            aria-selected={filter === item.id}
            className="tab px-3.5 py-2 text-xs"
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="surface-well t-caption p-8 text-center">
          এই ফিল্টারে কোনো আইটেম নেই।
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((doc) => {
            const done = readOf(doc);
            const docPercent =
              doc.sections.length > 0
                ? Math.round((done / doc.sections.length) * 100)
                : 0;
            const isRevise = reviseRoutes.includes(doc.route);

            return (
              <li
                key={doc.route}
                className="surface-raised flex flex-col gap-4 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex flex-col gap-1">
                    <span className="t-label truncate">{doc.section}</span>
                    <Link
                      href={doc.route}
                      className="t-strong flex items-center gap-1.5 text-sm min-w-0"
                    >
                      <span className="truncate">{doc.title}</span>
                      <ArrowRight />
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {hasNote(notesMap[doc.route]) && (
                      <span className="chip">নোট</span>
                    )}
                    <span className="t-mono t-caption">
                      {done}/{doc.sections.length}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleRevise(doc.route)}
                      aria-pressed={isRevise}
                      className={`control px-3 py-1.5 text-xs ${
                        isRevise ? "control--alert" : ""
                      }`}
                    >
                      <RotateCcw />
                      রিভিশন
                    </button>
                  </div>
                </div>

                <div
                  role="progressbar"
                  aria-valuenow={docPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${doc.title} — অগ্রগতি`}
                  className="gauge h-1.5 w-full"
                >
                  <div
                    className="gauge-fill"
                    style={{ width: `${docPercent}%` }}
                  />
                </div>

                {doc.sections.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {doc.sections.map((section) => {
                      const isRead = readSections.includes(
                        sectionKey(doc.route, section.id)
                      );
                      return (
                        <div
                          key={section.id}
                          className="flex items-center gap-2 min-w-0"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSection(doc.route, section.id)}
                            aria-pressed={isRead}
                            aria-label={`${section.text} — সম্পন্ন`}
                            className={`control p-1.5 shrink-0 ${
                              isRead ? "control--primary" : ""
                            }`}
                          >
                            {isRead ? <Check /> : <Circle />}
                          </button>
                          <Link
                            href={`${doc.route}#${section.id}`}
                            className="row block min-w-0 flex-1 px-2.5 py-1 text-xs leading-snug truncate"
                          >
                            {section.text}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
