"use client";

import { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { HeadingItem } from "../lib/content";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  NotebookPen,
  RotateCcw,
} from "./icons";

export interface DocNote {
  summary?: string;
  unclear?: string;
}

export const READ_KEY = "lw_read_sections";
export const REVISE_KEY = "lw_revise_routes";
export const NOTES_KEY = "lw_doc_notes";

export function sectionKey(route: string, id: string): string {
  return `${route}#${id}`;
}

export function hasNote(note?: DocNote): boolean {
  return Boolean(note?.summary?.trim() || note?.unclear?.trim());
}

export default function DocTracker({
  route,
  headings,
}: {
  route: string;
  headings: HeadingItem[];
}) {
  const [readSections, setReadSections] = useLocalStorage<string[]>(READ_KEY, []);
  const [reviseRoutes, setReviseRoutes] = useLocalStorage<string[]>(REVISE_KEY, []);
  const [notesMap, setNotesMap] = useLocalStorage<Record<string, DocNote>>(
    NOTES_KEY,
    {}
  );

  const [notesOpen, setNotesOpen] = useState(false);

  const sections = headings.filter((heading) => heading.level === 2);
  const isRevise = reviseRoutes.includes(route);
  const note = notesMap[route] || {};
  const done = sections.filter((section) =>
    readSections.includes(sectionKey(route, section.id))
  ).length;

  function toggleSection(id: string) {
    const key = sectionKey(route, id);
    setReadSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function updateNote(field: keyof DocNote, value: string) {
    setNotesMap((prev) => ({
      ...prev,
      [route]: { ...prev[route], [field]: value },
    }));
  }

  return (
    <div className="surface-panel mt-12 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="t-title text-sm">অগ্রগতি ও ব্যক্তিগত নোট</h3>
          <p className="t-caption mt-1">
            {sections.length > 0
              ? `${sections.length}টির মধ্যে ${done}টি সেকশন পর্যালোচনা সম্পন্ন`
              : "এই পেজে আলাদা কোনো সেকশন নেই"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setReviseRoutes((prev) =>
                prev.includes(route)
                  ? prev.filter((r) => r !== route)
                  : [...prev, route]
              )
            }
            aria-pressed={isRevise}
            className={`control px-3.5 py-2 text-xs ${
              isRevise ? "control--alert" : ""
            }`}
          >
            <RotateCcw />
            {isRevise ? "রিভিশন তালিকায় আছে" : "পুনর্বিবেচনা প্রয়োজন"}
          </button>

          <button
            type="button"
            onClick={() => setNotesOpen((open) => !open)}
            aria-expanded={notesOpen}
            className="control px-3.5 py-2 text-xs"
          >
            <NotebookPen />
            {hasNote(note) ? "নোট সংরক্ষিত" : "নোট যোগ করুন"}
            {notesOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>

      {sections.length > 0 && (
        <div className="seam-t mt-5 flex flex-col gap-1.5 pt-5">
          {sections.map((section) => {
            const isRead = readSections.includes(sectionKey(route, section.id));
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-pressed={isRead}
                className={`control w-full justify-start px-3 py-2 text-xs ${
                  isRead ? "control--primary" : ""
                }`}
              >
                {isRead ? <Check /> : <Circle />}
                <span className="min-w-0 truncate">{section.text}</span>
              </button>
            );
          })}
        </div>
      )}

      {notesOpen && (
        <div className="seam-t mt-5 flex flex-col gap-4 pt-5">
          <div>
            <label htmlFor="doc-summary" className="t-label mb-1.5 block">
              মূল সিদ্ধান্ত ও প্রতিফলন
            </label>
            <textarea
              id="doc-summary"
              rows={3}
              value={note.summary || ""}
              onChange={(event) => updateNote("summary", event.target.value)}
              placeholder="এই স্টেজ থেকে আপনার ব্যক্তিগত উপলব্ধি ও সিদ্ধান্ত..."
              className="surface-well t-body w-full px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="doc-unclear" className="t-label mb-1.5 block">
              করণীয় বা প্রশ্ন
            </label>
            <textarea
              id="doc-unclear"
              rows={2}
              value={note.unclear || ""}
              onChange={(event) => updateNote("unclear", event.target.value)}
              placeholder="পরবর্তী পদক্ষেপ বা যে বিষয়টি আরও যাচাই করতে হবে..."
              className="surface-well t-body w-full px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
