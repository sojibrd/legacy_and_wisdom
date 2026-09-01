"use client";

import { Children, isValidElement, type ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify } from "../lib/slug";
import { useTracker } from "../lib/tracker";
import Mermaid from "./Mermaid";
import { Check } from "./icons";

type Props = {
  source: string;
  file: string;
  /** This doc's own route — how a stage's lock state is looked up. */
  route: string;
  linkMap: Record<string, string>;
  /** Body line number → task id, built by `parseDoc` from this same string. */
  taskMap: Record<number, string>;
};

const EXTERNAL = /^(https?:|mailto:|tel:)/i;

/**
 * Read a ```mermaid fence off the `pre` node, or null if it is ordinary code.
 *
 * The check happens on `pre` rather than `code` because the diagram replaces
 * the whole block: returning a figure from the `code` renderer would leave it
 * boxed inside the `pre` chrome meant for source.
 */
function mermaidSource(node: unknown): string | null {
  const element = node as
    | {
        children?: Array<{
          type?: string;
          tagName?: string;
          properties?: { className?: unknown };
          children?: Array<{ type?: string; value?: string }>;
        }>;
      }
    | undefined;

  const code = element?.children?.[0];
  if (code?.type !== "element" || code.tagName !== "code") return null;

  const className = code.properties?.className;
  const classes = Array.isArray(className) ? className : [];
  if (!classes.includes("language-mermaid")) return null;

  const text = (code.children ?? [])
    .map((child) => (child.type === "text" ? (child.value ?? "") : ""))
    .join("")
    .trim();

  return text || null;
}

function resolve(from: string, href: string): string {
  const base = from.split("/").slice(0, -1);
  const segments = href.replace(/^\.\//, "").split("/");
  const out = [...base];

  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") out.pop();
    else out.push(segment);
  }

  return out.join("/").toLowerCase();
}

function toRoute(
  href: string | undefined,
  file: string,
  linkMap: Record<string, string>
): string | null {
  if (!href || EXTERNAL.test(href) || href.startsWith("#")) return null;

  const [target, hash = ""] = href.split("#");
  if (!target) return null;

  const key = target.startsWith("/")
    ? target.slice(1).toLowerCase()
    : resolve(file, target);

  const route =
    linkMap[key] ??
    linkMap[key.replace(/\/$/, "")] ??
    linkMap[`docs/${key}`] ??
    linkMap[target.toLowerCase()];

  return route ? `${route}${hash ? `#${hash}` : ""}` : null;
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return Children.toArray(props.children).map(textOf).join("");
  }
  return "";
}

/**
 * One `- [ ]` line, made real.
 *
 * remark-gfm already renders a disabled `<input type="checkbox">` as the first
 * child; we drop it and put a button in its place so the tick is ours to own.
 */
function TaskItem({
  id,
  locked,
  children,
}: {
  id: string;
  locked: boolean;
  children: ReactNode;
}) {
  const { isChecked, toggle } = useTracker();
  const checked = isChecked(id);

  const body = Children.toArray(children).filter(
    (child) => !(isValidElement(child) && child.type === "input")
  );

  return (
    <li className="task-list-item">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={locked}
        onClick={() => toggle(id)}
        className="task-box"
        title={locked ? "আগের stage শেষ হলে খুলবে" : undefined}
      >
        <Check />
      </button>
      <span className={checked ? "task-done" : undefined}>{body}</span>
    </li>
  );
}

export default function Markdown({
  source,
  file,
  route,
  linkMap,
  taskMap,
}: Props) {
  const { byRoute } = useTracker();
  const stage = byRoute[route];
  const locked = stage ? !stage.isUnlocked : false;

  return (
    <div className="doc-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ node, children, ...rest }) {
            const chart = mermaidSource(node);
            if (chart) return <Mermaid chart={chart} />;
            return <pre {...rest}>{children}</pre>;
          },

          li({ node, children, ...rest }) {
            // Both sides read the same body string, so the line number is a
            // reliable join key — and unlike a render counter it survives
            // re-renders and partial hydration.
            const line = node?.position?.start.line;
            const id = line ? taskMap[line] : undefined;

            if (!id) return <li {...rest}>{children}</li>;

            return (
              <TaskItem id={id} locked={locked}>
                {children}
              </TaskItem>
            );
          },
          h2({ children, ...rest }) {
            return (
              <h2 id={slugify(textOf(children))} {...rest}>
                {children}
              </h2>
            );
          },
          h3({ children, ...rest }) {
            return (
              <h3 id={slugify(textOf(children))} {...rest}>
                {children}
              </h3>
            );
          },
          a({ href, children, ...rest }) {
            const route = toRoute(href, file, linkMap);
            if (route) {
              return (
                <Link href={route} {...rest}>
                  {children}
                </Link>
              );
            }
            if (href && EXTERNAL.test(href)) {
              return (
                <a href={href} target="_blank" rel="noreferrer" {...rest}>
                  {children}
                </a>
              );
            }
            return (
              <a href={href} {...rest}>
                {children}
              </a>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
