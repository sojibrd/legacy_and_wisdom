"use client";

import Link from "next/link";
import { useTracker } from "./lib/tracker";
import type { StageTask } from "./lib/content";
import { ArrowRight, Check, Lock } from "./components/icons";

/** How many open items the current stage puts in front of you. */
const NEXT_ACTION_COUNT = 3;

export default function DashboardClient({
  stageTasks,
}: {
  stageTasks: Record<string, StageTask[]>;
}) {
  const { stages, overall, current, isChecked, toggle } = useTracker();

  // Criteria first — they are what actually opens the next stage — then phase
  // work. Recurring habits are never "next actions"; they are always due.
  const nextActions = current
    ? (stageTasks[current.summary.route] ?? [])
        .filter((task) => task.kind !== "recurring" && !isChecked(task.id))
        .sort((a, b) => Number(b.kind === "criterion") - Number(a.kind === "criterion"))
        .slice(0, NEXT_ACTION_COUNT)
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12 flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="t-title text-2xl sm:text-3xl">Legacy &amp; Wisdom</h1>
        <p className="t-body text-sm">
          ১০টা stage, ক্রমিক। আগেরটার সব exit criteria পূর্ণ হলেই পরেরটা খোলে।
        </p>
      </header>

      <section className="surface-panel flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="t-label">সার্বিক অগ্রগতি</span>
          <span className="t-mono t-accent text-sm">
            {overall.stagesComplete}/{stages.length} stage · {overall.done}/
            {overall.total} criteria ({overall.percent}%)
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
      </section>

      {current && (
        <section className="surface-panel flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex flex-col gap-1">
              <span className="t-label">এখন চলছে · Stage {current.summary.order}</span>
              <Link
                href={current.summary.route}
                className="t-strong flex items-center gap-1.5 text-base min-w-0"
              >
                <span className="truncate">{current.summary.title}</span>
                <ArrowRight />
              </Link>
            </div>
            <span className="t-mono t-caption shrink-0">
              {current.done}/{current.total} criteria
            </span>
          </div>

          <div className="seam-t pt-5 flex flex-col gap-3">
            <span className="t-label">পরবর্তী করণীয়</span>

            {nextActions.length === 0 ? (
              <p className="t-caption">
                এই stage-এর সব কিছু টিক দেওয়া — পরের stage খুলে গেছে।
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {nextActions.map((task) => (
                  <li key={task.id} className="flex items-start gap-2.5">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={false}
                      aria-label={task.text}
                      onClick={() => toggle(task.id)}
                      className="task-box"
                    >
                      <Check />
                    </button>
                    <span className="t-body text-sm min-w-0">
                      {task.text}
                      {task.kind === "criterion" && (
                        <>
                          {" "}
                          <span className="chip chip--accent">criterion</span>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <span className="t-label">১০টা stage</span>

        <ul className="grid gap-3 sm:grid-cols-2">
          {stages.map((stage) => {
            const { summary, done, total, percent, isComplete, isUnlocked } = stage;
            const isCurrent = current?.summary.route === summary.route;

            return (
              <li key={summary.route} className="surface-raised flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex flex-col gap-1">
                    <span className="t-label">Stage {summary.order}</span>
                    <Link
                      href={summary.route}
                      className="t-strong flex items-center gap-1.5 text-sm min-w-0"
                    >
                      <span className="truncate">{summary.title}</span>
                      <ArrowRight />
                    </Link>
                  </div>

                  <span className="shrink-0">
                    {!isUnlocked ? (
                      <span className="chip chip--alert">
                        <Lock />
                        লক
                      </span>
                    ) : isComplete ? (
                      <span className="chip chip--ok">
                        <Check />
                        সম্পন্ন
                      </span>
                    ) : isCurrent ? (
                      <span className="chip chip--accent">চলছে</span>
                    ) : (
                      <span className="chip">খোলা</span>
                    )}
                  </span>
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

                <span className="t-mono t-caption">
                  {done}/{total} criteria
                  {stage.taskTotal > 0 && ` · ${stage.taskDone}/${stage.taskTotal} কাজ`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <Link href="/progress/" className="control px-4 py-2.5 text-xs self-start">
        পূর্ণ Tracker
        <ArrowRight />
      </Link>
    </div>
  );
}
