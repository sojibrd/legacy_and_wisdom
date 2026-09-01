"use client";

import { useState } from "react";
import Link from "next/link";
import { useTracker, hasNote } from "../lib/tracker";
import { ArrowRight, Check, Lock, RotateCcw } from "../components/icons";

type Filter = "all" | "current" | "locked" | "done" | "revise";

export default function ProgressClient() {
  const { stages, overall, current, notes, reviseRoutes, toggleRevise, reset } =
    useTracker();
  const [filter, setFilter] = useState<Filter>("all");

  const visible = stages.filter((stage) => {
    if (filter === "current") return stage.isUnlocked && !stage.isComplete;
    if (filter === "locked") return !stage.isUnlocked;
    if (filter === "done") return stage.isComplete;
    if (filter === "revise") return reviseRoutes.includes(stage.summary.route);
    return true;
  });

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "সব stage", count: stages.length },
    {
      id: "current",
      label: "চলছে",
      count: stages.filter((s) => s.isUnlocked && !s.isComplete).length,
    },
    { id: "done", label: "সম্পন্ন", count: overall.stagesComplete },
    { id: "locked", label: "লক", count: stages.filter((s) => !s.isUnlocked).length },
    { id: "revise", label: "রিভিশন", count: reviseRoutes.length },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="t-title text-2xl sm:text-3xl">Roadmap Tracker</h1>
        <p className="t-body text-sm">
          ১০টা stage ক্রমিক — আগেরটার সব exit criteria পূর্ণ হলেই পরেরটা খোলে।
        </p>
      </header>

      <div className="surface-panel flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="t-label">সার্বিক exit criteria</span>
          <span className="t-mono t-accent text-sm">
            {overall.done}/{overall.total} ({overall.percent}%) ·{" "}
            {overall.stagesComplete}/{stages.length} stage সম্পন্ন
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={overall.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="সার্বিক অগ্রগতি"
          className="gauge h-2 w-full"
        >
          <div className="gauge-fill" style={{ width: `${overall.percent}%` }} />
        </div>
        {current && (
          <p className="t-caption">
            এখন চলছে —{" "}
            <Link href={current.summary.route} className="t-accent">
              {current.summary.title}
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <button
          type="button"
          onClick={() => {
            if (window.confirm("সব টিক মুছে ফেলা হবে। নিশ্চিত?")) reset();
          }}
          className="control px-3 py-1.5 text-xs"
        >
          <RotateCcw />
          সব রিসেট
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="surface-well t-caption p-8 text-center">
          এই ফিল্টারে কোনো stage নেই।
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((stage) => {
            const { summary, done, total, percent, isComplete, isUnlocked } = stage;
            const isRevise = reviseRoutes.includes(summary.route);

            return (
              <li key={summary.route} className="surface-raised flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex flex-col gap-1">
                    <span className="t-label truncate">Stage {summary.order}</span>
                    <Link
                      href={summary.route}
                      className="t-strong flex items-center gap-1.5 text-sm min-w-0"
                    >
                      <span className="truncate">{summary.title}</span>
                      <ArrowRight />
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isUnlocked && (
                      <span className="chip chip--alert">
                        <Lock />
                        লক
                      </span>
                    )}
                    {isComplete && (
                      <span className="chip chip--ok">
                        <Check />
                        সম্পন্ন
                      </span>
                    )}
                    {hasNote(notes[summary.route]) && <span className="chip">নোট</span>}
                    <span className="t-mono t-caption">
                      {done}/{total}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleRevise(summary.route)}
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
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${summary.title} — অগ্রগতি`}
                  className="gauge h-1.5 w-full"
                >
                  <div className="gauge-fill" style={{ width: `${percent}%` }} />
                </div>

                <p className="t-caption">
                  {stage.taskTotal > 0
                    ? `Phase-এর কাজ ${stage.taskDone}/${stage.taskTotal}`
                    : "এই stage-এ আলাদা phase চেকলিস্ট নেই — criteria-ই একমাত্র ট্র্যাক"}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
