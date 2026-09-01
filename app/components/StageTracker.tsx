"use client";

/**
 * The two tracker surfaces a doc page carries.
 *
 * Neither repeats the criteria as a list — those are already interactive where
 * they belong, inline in the prose. These only summarise, gate, and annotate.
 */

import { useState } from "react";
import { useTracker } from "../lib/tracker";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  NotebookPen,
  RotateCcw,
} from "./icons";

/** Status strip under the page title. Renders nothing for non-stage docs. */
export function StageStatus({ route }: { route: string }) {
  const { byRoute } = useTracker();
  const stage = byRoute[route];
  if (!stage) return null;

  const { done, total, percent, isComplete, isUnlocked, summary } = stage;

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip t-mono">Stage {summary.order} / 10</span>

        {!isUnlocked && (
          <span className="chip chip--alert">
            <Lock />
            লক — আগের stage শেষ হলে খুলবে
          </span>
        )}
        {isUnlocked && isComplete && <span className="chip chip--ok">সম্পন্ন</span>}
        {isUnlocked && !isComplete && (
          <span className="chip chip--accent">চলছে</span>
        )}

        <span className="t-mono t-caption">
          {done}/{total} criteria
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${summary.title} — criteria অগ্রগতি`}
        className="gauge h-1.5 w-full"
      >
        <div className="gauge-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** Sub-progress, revision flag and notes. Shown on every doc page. */
export function StagePanel({ route }: { route: string }) {
  const { byRoute, notes, setNote, reviseRoutes, toggleRevise } = useTracker();
  const [notesOpen, setNotesOpen] = useState(false);

  const stage = byRoute[route];
  const note = notes[route] ?? {};
  const isRevise = reviseRoutes.includes(route);
  const noteSaved = Boolean(note.summary?.trim() || note.unclear?.trim());

  return (
    <div className="surface-panel mt-12 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="t-title text-sm">অগ্রগতি ও ব্যক্তিগত নোট</h3>
          <p className="t-caption mt-1">
            {!stage
              ? "এই পেজ কোনো stage নয় — শুধু নোট রাখা যাবে।"
              : stage.taskTotal > 0
                ? `Exit criteria ${stage.done}/${stage.total} · Phase-এর কাজ ${stage.taskDone}/${stage.taskTotal}`
                : `Exit criteria ${stage.done}/${stage.total} · এই stage-এ আলাদা phase চেকলিস্ট নেই`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleRevise(route)}
            aria-pressed={isRevise}
            className={`control px-3.5 py-2 text-xs ${isRevise ? "control--alert" : ""}`}
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
            {noteSaved ? "নোট সংরক্ষিত" : "নোট যোগ করুন"}
            {notesOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>

      {stage && stage.taskTotal > 0 && (
        <div className="seam-t mt-5 pt-5 flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <span className="t-label">Phase-এর কাজ</span>
            <span className="t-mono t-caption">
              {stage.taskDone}/{stage.taskTotal}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={stage.taskDone}
            aria-valuemin={0}
            aria-valuemax={stage.taskTotal}
            aria-label="Phase-এর কাজের অগ্রগতি"
            className="gauge h-1.5 w-full"
          >
            <div
              className="gauge-fill"
              style={{
                width: `${Math.round((stage.taskDone / stage.taskTotal) * 100)}%`,
              }}
            />
          </div>
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
              onChange={(event) => setNote(route, "summary", event.target.value)}
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
              onChange={(event) => setNote(route, "unclear", event.target.value)}
              placeholder="পরবর্তী পদক্ষেপ বা যে বিষয়টি আরও যাচাই করতে হবে..."
              className="surface-well t-body w-full px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
