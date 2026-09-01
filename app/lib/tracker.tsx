"use client";

/**
 * All roadmap state that lives in the browser.
 *
 * The markdown under `docs/` is the source of truth for *what* the roadmap
 * says; nothing here ever writes back to it. This module owns only the answer
 * to "how far have I got", and derives the stage gate from it.
 *
 * The gate: a stage is complete when every one of its parsed criteria is
 * ticked, and stage N+1 unlocks when stage N is complete. Counts come from the
 * parse, never from a hard-coded 10 — the docs already disagree with their own
 * headings.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { StageSummary } from "./content";

/** Ticked task ids. */
export const TASKS_KEY = "lw_tasks_v1";
/** Per-doc free text. Survives from the previous schema. */
export const NOTES_KEY = "lw_doc_notes";
/** Routes flagged for another pass. Survives from the previous schema. */
export const REVISE_KEY = "lw_revise_routes";
/** The retired "I read this ## section" model. Cleared once, on mount. */
const RETIRED_KEYS = ["lw_read_sections"];

export interface DocNote {
  summary?: string;
  unclear?: string;
}

export function hasNote(note?: DocNote): boolean {
  return Boolean(note?.summary?.trim() || note?.unclear?.trim());
}

export type StageState = {
  summary: StageSummary;
  /** Criteria ticked / total. The only numbers the gate reads. */
  done: number;
  total: number;
  percent: number;
  isComplete: boolean;
  isUnlocked: boolean;
  /** Phase work. Zero for the later stages, which are criteria-only. */
  taskDone: number;
  taskTotal: number;
};

type TrackerValue = {
  isChecked: (id: string) => boolean;
  toggle: (id: string) => void;
  reset: () => void;
  stages: StageState[];
  byRoute: Record<string, StageState>;
  /** Lowest unlocked-but-unfinished stage, or the last one once all are done. */
  current: StageState | null;
  overall: {
    done: number;
    total: number;
    percent: number;
    stagesComplete: number;
  };
  notes: Record<string, DocNote>;
  setNote: (route: string, field: keyof DocNote, value: string) => void;
  reviseRoutes: string[];
  toggleRevise: (route: string) => void;
};

const TrackerContext = createContext<TrackerValue | null>(null);

export function TrackerProvider({
  stages,
  children,
}: {
  stages: StageSummary[];
  children: ReactNode;
}) {
  const [checked, setChecked] = useLocalStorage<Record<string, boolean>>(
    TASKS_KEY,
    {}
  );
  const [notes, setNotes] = useLocalStorage<Record<string, DocNote>>(
    NOTES_KEY,
    {}
  );
  const [reviseRoutes, setReviseRoutes] = useLocalStorage<string[]>(
    REVISE_KEY,
    []
  );

  useEffect(() => {
    try {
      for (const key of RETIRED_KEYS) window.localStorage.removeItem(key);
    } catch {
      // A browser with storage blocked has nothing to clean up.
    }
  }, []);

  const isChecked = useCallback((id: string) => checked[id] === true, [checked]);

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = { ...prev };
        if (next[id]) delete next[id];
        else next[id] = true;
        return next;
      });
    },
    [setChecked]
  );

  const reset = useCallback(() => setChecked({}), [setChecked]);

  const setNote = useCallback(
    (route: string, field: keyof DocNote, value: string) => {
      setNotes((prev) => ({ ...prev, [route]: { ...prev[route], [field]: value } }));
    },
    [setNotes]
  );

  const toggleRevise = useCallback(
    (route: string) => {
      setReviseRoutes((prev) =>
        prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
      );
    },
    [setReviseRoutes]
  );

  const stageStates = useMemo<StageState[]>(() => {
    const states: StageState[] = [];
    let previousComplete = true; // stage 1 has nothing in front of it

    for (const summary of stages) {
      const total = summary.criterionIds.length;
      const done = summary.criterionIds.filter((id) => checked[id]).length;
      // No criteria means no way to earn completion — refuse to open the gate.
      const isComplete = total > 0 && done === total;

      states.push({
        summary,
        done,
        total,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
        isComplete,
        isUnlocked: previousComplete,
        taskTotal: summary.taskIds.length,
        taskDone: summary.taskIds.filter((id) => checked[id]).length,
      });

      previousComplete = isComplete;
    }

    return states;
  }, [stages, checked]);

  const value = useMemo<TrackerValue>(() => {
    const byRoute: Record<string, StageState> = {};
    for (const state of stageStates) byRoute[state.summary.route] = state;

    const done = stageStates.reduce((sum, s) => sum + s.done, 0);
    const total = stageStates.reduce((sum, s) => sum + s.total, 0);

    const current =
      stageStates.find((s) => s.isUnlocked && !s.isComplete) ??
      stageStates.at(-1) ??
      null;

    return {
      isChecked,
      toggle,
      reset,
      stages: stageStates,
      byRoute,
      current,
      overall: {
        done,
        total,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
        stagesComplete: stageStates.filter((s) => s.isComplete).length,
      },
      notes,
      setNote,
      reviseRoutes,
      toggleRevise,
    };
  }, [
    stageStates,
    isChecked,
    toggle,
    reset,
    notes,
    setNote,
    reviseRoutes,
    toggleRevise,
  ]);

  return (
    <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
  );
}

export function useTracker(): TrackerValue {
  const value = useContext(TrackerContext);
  if (!value) throw new Error("useTracker must be used inside <TrackerProvider>");
  return value;
}
