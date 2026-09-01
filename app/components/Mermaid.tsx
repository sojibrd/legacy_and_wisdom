"use client";

/**
 * A ```mermaid fence, drawn.
 *
 * mermaid is by far the heaviest thing this site could load, and only the
 * stage pages carry a diagram — so it is imported dynamically, inside the
 * effect, and never reaches a page without one.
 *
 * Colours are read off the live `--t-*` custom properties rather than written
 * here. mermaid needs literal values (it cannot take `var(...)`), so this is
 * the one place that resolves tokens at runtime; the theme still owns them.
 */

import { useEffect, useRef, useState } from "react";

let diagramCount = 0;

export default function Mermaid({ chart }: { chart: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      const host = hostRef.current;
      if (!host) return;

      try {
        const mermaid = (await import("mermaid")).default;
        if (cancelled) return;

        const root = getComputedStyle(document.documentElement);
        const token = (name: string, fallback: string) =>
          root.getPropertyValue(name).trim() || fallback;

        const line = token("--t-seam-heavy", "#4a4136");
        const ink = token("--t-text-body", "#e8e0d4");

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: token("--t-font-sans", "sans-serif"),
          themeVariables: {
            darkMode: true,
            background: token("--t-well-bg", "#141210"),
            primaryColor: token("--t-raised-bg", "#221e19"),
            primaryBorderColor: token("--t-accent", "#e0a33e"),
            primaryTextColor: token("--t-text-title", "#f5eee2"),
            secondaryColor: token("--t-panel-bg", "#1a1714"),
            secondaryBorderColor: line,
            secondaryTextColor: ink,
            tertiaryColor: token("--t-app-bg", "#17140f"),
            tertiaryBorderColor: line,
            tertiaryTextColor: ink,
            lineColor: line,
            textColor: ink,
            mainBkg: token("--t-raised-bg", "#221e19"),
            nodeBorder: line,
          },
        });

        const { svg } = await mermaid.render(
          `mermaid-${++diagramCount}`,
          chart
        );
        if (cancelled) return;

        host.innerHTML = svg;
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    draw();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  // The host stays mounted even when hidden, so a later redraw still has a
  // ref to draw into. A diagram that will not parse falls back to its source —
  // losing the content to a blank box would be worse than the raw fence was.
  return (
    <>
      <div ref={hostRef} className="mermaid-figure" hidden={failed} />
      {failed && (
        <pre>
          <code>{chart}</code>
        </pre>
      )}
    </>
  );
}
