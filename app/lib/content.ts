import fs from "node:fs";
import path from "node:path";
import { slugify } from "./slug";

const ROOT = process.cwd();

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".github",
  "out",
  "app",
  "public",
  ".agents",
]);

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
    if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
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
  if (normalized === "docs/readme.md" || normalized === "readme.md") return [];

  const withoutExt = normalized.replace(/\.md$/i, "");
  const parts = withoutExt.split("/");

  // Remove leading "docs" if present
  if (parts[0] === "docs") parts.shift();

  return parts;
}

function sectionFor(file: string): string {
  const normalized = file.toLowerCase().replace(/\\/g, "/");
  if (normalized === "docs/readme.md" || normalized === "readme.md") {
    return "Overview";
  }
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
  walk(ROOT, files);

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

  // Sort home first, then stages in sequential order
  docs.sort((a, b) => {
    if (a.route === "/") return -1;
    if (b.route === "/") return 1;
    return a.route.localeCompare(b.route, undefined, { numeric: true, sensitivity: "base" });
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
  const overviewDocs = docs.filter((doc) => doc.route === "/");
  const stageDocs = docs.filter((doc) => doc.route !== "/");

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

export function parseDoc(doc: Doc): {
  title: string;
  body: string;
  headings: HeadingItem[];
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
  return { title: title || doc.title, body, headings: extractHeadings(body) };
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
