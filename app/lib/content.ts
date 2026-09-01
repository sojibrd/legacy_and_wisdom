import fs from "node:fs";
import path from "node:path";
import { slugify } from "./slug";

const ROOT = process.cwd();

/**
 * The site's content boundary.
 *
 * Only `docs/` is the roadmap. Scanning the whole repo also swept up the
 * project README — developer instructions, not content — which collided with
 * `docs/README.md` on the same route and showed up twice in the nav.
 */
const CONTENT_DIR = path.join(ROOT, "docs");

export type Doc = {
  /** Repo-relative path, forward slashes, e.g. "docs/stages/stage-01-foundation.md" */
  file: string;
  /** Route segments, e.g. ["stages", "stage-01-foundation"]. Empty for home doc. */
  slug: string[];
  /** Route path with leading and trailing slash, e.g. "/stages/stage-01-foundation/" */
  route: string;
  /** First `# heading` in the file, falling back to the file name. */
  title: string;
  /** Immediate section name, e.g. "Overview" or "Stages". */
  section: string;
};

export type HeadingItem = {
  id: string;
  text: string;
  level: number;
};

/**
 * What a `- [ ]` line in the source means to the tracker.
 *
 * - `criterion` — lives under the stage's `## Exit Criteria` heading and is
 *   NOT under a `### … Stretch …` sub-heading. These, and only these, decide
 *   whether a stage is complete and therefore whether the next one unlocks.
 * - `recurring` — lives under a "চলমান" heading. A habit, not an errand:
 *   tickable, but deliberately kept out of every percentage.
 * - `task` — everything else. Phase work; drives sub-progress only.
 */
export type TaskKind = "criterion" | "recurring" | "task";

export type TaskItem = {
  /** Stable across edits elsewhere in the file: `<route>#<headingSlug>#<n>`. */
  id: string;
  text: string;
  kind: TaskKind;
  /** Whether the markdown source itself ships it ticked. */
  checkedInSource: boolean;
  /** Display text of the nearest heading above it. */
  heading: string;
  /** 1-based line number **within the parsed body**, not the raw file. */
  line: number;
};

export type StageSummary = {
  /** e.g. "stage-01-foundation" */
  slug: string;
  /** 1–10, read from the filename, never from array position. */
  order: number;
  route: string;
  title: string;
  criterionIds: string[];
  taskIds: string[];
  recurringIds: string[];
};

export type NavDoc = {
  route: string;
  title: string;
  headings: HeadingItem[];
};

export type NavSection = {
  name: string;
  docs: NavDoc[];
};

function walk(dir: string, acc: string[]) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      acc.push(path.relative(ROOT, full).split(path.sep).join("/"));
    }
  }
}

function readTitle(file: string): string {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  for (const line of source.split("\n")) {
    const match = /^#\s+(.+?)\s*$/.exec(line);
    if (match) return match[1].replace(/[*_`]/g, "").trim();
  }
  return path.basename(file, ".md");
}

function slugFor(file: string): string[] {
  const normalized = file.toLowerCase().replace(/\\/g, "/");
  // `/` belongs to the dashboard now, so the roadmap overview gets its own
  // route rather than being the landing page.
  if (normalized === "docs/readme.md") return ["about"];

  const withoutExt = normalized.replace(/\.md$/i, "");
  const parts = withoutExt.split("/");

  // Remove leading "docs" if present
  if (parts[0] === "docs") parts.shift();

  return parts;
}

function sectionFor(file: string): string {
  const normalized = file.toLowerCase().replace(/\\/g, "/");
  if (normalized === "docs/readme.md") return "Overview";
  const parts = file.split("/");
  if (parts.includes("stages")) {
    return "Stages (১–১০)";
  }
  return parts.length > 1 ? parts[parts.length - 2] : "General";
}

let cache: Doc[] | null = null;

export function getDocs(): Doc[] {
  if (cache) return cache;

  const files: string[] = [];
  walk(CONTENT_DIR, files);

  const docs = files.map<Doc>((file) => {
    const slug = slugFor(file);
    return {
      file,
      slug,
      route: slug.length ? `/${slug.join("/")}/` : "/",
      title: readTitle(file),
      section: sectionFor(file),
    };
  });

  // Overview docs first, then the stages in sequential order.
  docs.sort((a, b) => {
    const stageA = a.slug[0] === "stages";
    const stageB = b.slug[0] === "stages";
    if (stageA !== stageB) return stageA ? 1 : -1;
    return a.route.localeCompare(b.route, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  cache = docs;
  return docs;
}

export function getDoc(slug: string[] = []): Doc | undefined {
  const wanted = slug.join("/");
  return getDocs().find((doc) => doc.slug.join("/") === wanted);
}

export function readDoc(doc: Doc): string {
  return fs.readFileSync(path.join(ROOT, doc.file), "utf8");
}

export function getNav(): NavSection[] {
  const docs = getDocs();
  const overviewDocs = docs.filter((doc) => doc.slug[0] !== "stages");
  const stageDocs = docs.filter((doc) => doc.slug[0] === "stages");

  const sections: NavSection[] = [];

  if (overviewDocs.length > 0) {
    sections.push({
      name: "Overview",
      docs: overviewDocs.map(toNavDoc),
    });
  }

  if (stageDocs.length > 0) {
    sections.push({
      name: "Roadmap Stages",
      docs: stageDocs.map(toNavDoc),
    });
  }

  return sections;
}

function toNavDoc(doc: Doc): NavDoc {
  return {
    route: doc.route,
    title: doc.title,
    headings: extractHeadings(readDoc(doc)),
  };
}

export function extractHeadings(markdown: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;
    const text = match[2].trim().replace(/[*_`]/g, "");
    headings.push({ id: slugify(text), text, level: match[1].length });
  }

  return headings;
}

const TASK_RE = /^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/;
const HEADING_RE = /^(#{2,3})\s+(.+)$/;
const EXIT_HEADING_RE = /^exit\s+criteria/i;
const STRETCH_RE = /stretch/i;
const RECURRING_RE = /চলমান/;

function clean(text: string): string {
  return text.trim().replace(/[*_`]/g, "").trim();
}

/**
 * Pull every task-list item out of a rendered body, in document order.
 *
 * `body` must be the exact string handed to `<Markdown source={…} />` — the
 * line numbers recorded here are what the client renderer looks items up by,
 * and `parseDoc` trims the title off the top, so raw-file lines would be off.
 *
 * Fenced code is skipped for the same reason `extractHeadings` skips it: a
 * checkbox inside a sample is text, not a task.
 */
export function parseTasks(body: string, routePrefix: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const slugSeen = new Map<string, number>();

  let inFence = false;
  let h2 = "";
  let h3 = "";
  let headingText = "";
  let headingSlug = "intro";
  let indexInHeading = 0;
  let inExitCriteria = false;
  let inStretch = false;

  const lines = body.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = clean(heading[2]);

      if (level === 2) {
        h2 = text;
        h3 = "";
        // Only an h2 opens or closes the criteria block; the h3s inside it
        // (### Technical, ### Financial, …) carry the criteria themselves.
        inExitCriteria = EXIT_HEADING_RE.test(text);
        inStretch = false;
      } else {
        h3 = text;
        inStretch = STRETCH_RE.test(text);
      }

      headingText = h3 || h2;
      const base = slugify(headingText) || "section";
      const seen = (slugSeen.get(base) ?? 0) + 1;
      slugSeen.set(base, seen);
      headingSlug = seen === 1 ? base : `${base}-${seen}`;
      indexInHeading = 0;
      continue;
    }

    const task = TASK_RE.exec(line);
    if (!task) continue;

    const kind: TaskKind =
      inExitCriteria && !inStretch
        ? "criterion"
        : RECURRING_RE.test(h2) || RECURRING_RE.test(h3)
          ? "recurring"
          : "task";

    tasks.push({
      id: `${routePrefix}#${headingSlug}#${indexInHeading}`,
      text: clean(task[2]),
      kind,
      checkedInSource: task[1].toLowerCase() === "x",
      heading: headingText,
      line: i + 1,
    });
    indexInHeading++;
  }

  return tasks;
}

export function parseDoc(doc: Doc): {
  title: string;
  body: string;
  headings: HeadingItem[];
  tasks: TaskItem[];
  /** body line number → task id, for the interactive `li` renderer. */
  taskMap: Record<number, string>;
} {
  const lines = readDoc(doc).split(/\r?\n/);
  const bodyLines: string[] = [];
  let title = "";

  for (const line of lines) {
    const match = /^#\s+(.+)$/.exec(line);
    if (!title && match) {
      title = match[1].replace(/[*_`]/g, "").trim();
      continue;
    }
    bodyLines.push(line);
  }

  const body = bodyLines.join("\n").trim();
  const tasks = parseTasks(body, doc.route);

  const taskMap: Record<number, string> = {};
  for (const task of tasks) taskMap[task.line] = task.id;

  return {
    title: title || doc.title,
    body,
    headings: extractHeadings(body),
    tasks,
    taskMap,
  };
}

export function isStageDoc(doc: Doc): boolean {
  return doc.slug[0] === "stages";
}

let stageCache: StageSummary[] | null = null;

/**
 * The ten stages, in filename order, with their task ids split by kind.
 *
 * Serializable on purpose: this crosses into client components, which need
 * the criterion ids to derive completion and unlocking from localStorage.
 */
export function getStageSummaries(): StageSummary[] {
  if (stageCache) return stageCache;

  const summaries = getDocs()
    .filter(isStageDoc)
    .map<StageSummary>((doc) => {
      const { title, tasks } = parseDoc(doc);
      const order = Number(/stage-(\d+)/.exec(doc.slug.at(-1) ?? "")?.[1] ?? 0);
      const ids = (kind: TaskKind) =>
        tasks.filter((task) => task.kind === kind).map((task) => task.id);

      return {
        slug: doc.slug.at(-1) ?? doc.route,
        order,
        route: doc.route,
        title,
        criterionIds: ids("criterion"),
        taskIds: ids("task"),
        recurringIds: ids("recurring"),
      };
    })
    .sort((a, b) => a.order - b.order);

  for (const stage of summaries) {
    // A stage with no criteria would count as trivially complete and unlock
    // everything behind it, so the tracker refuses to auto-complete it. Say so
    // at build time rather than letting the gate quietly fall open.
    if (stage.criterionIds.length === 0) {
      console.warn(
        `[content] ${stage.slug}: no "## Exit Criteria" task items found — this stage can never auto-complete.`
      );
    } else if (stage.criterionIds.length !== 10) {
      console.warn(
        `[content] ${stage.slug}: ${stage.criterionIds.length} exit criteria (the heading usually claims 10).`
      );
    }
  }

  stageCache = summaries;
  return summaries;
}

export type StageTask = { id: string; text: string; kind: TaskKind };

/**
 * Task text for every stage, keyed by route.
 *
 * Only the dashboard needs the prose (to name the next few things to do), and
 * it is a single page — so this stays out of the layout-level provider, which
 * would otherwise ship every stage's wording to every route.
 */
export function getStageTasks(): Record<string, StageTask[]> {
  const map: Record<string, StageTask[]> = {};

  for (const doc of getDocs().filter(isStageDoc)) {
    map[doc.route] = parseDoc(doc).tasks.map(({ id, text, kind }) => ({
      id,
      text,
      kind,
    }));
  }

  return map;
}

export function getLinkMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const doc of getDocs()) {
    const fullFile = doc.file.toLowerCase();
    map[fullFile] = doc.route;

    // Handle path without "docs/" prefix e.g. "stages/stage-01-foundation.md"
    if (fullFile.startsWith("docs/")) {
      const stripped = fullFile.slice(5);
      map[stripped] = doc.route;
    }

    // Handle bare filenames
    const baseName = path.basename(fullFile);
    map[baseName] = doc.route;
  }
  return map;
}
