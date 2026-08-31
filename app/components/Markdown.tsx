"use client";

import { Children, isValidElement, type ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugify } from "../lib/slug";

type Props = {
  source: string;
  file: string;
  linkMap: Record<string, string>;
};

const EXTERNAL = /^(https?:|mailto:|tel:)/i;

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

export default function Markdown({ source, file, linkMap }: Props) {
  return (
    <div className="doc-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
