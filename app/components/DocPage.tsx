import Markdown from "./Markdown";
import TableOfContents from "./TableOfContents";
import { StagePanel, StageStatus } from "./StageTracker";
import { getDoc, getLinkMap, parseDoc } from "../lib/content";

export default function DocPage({ slug }: { slug: string[] }) {
  const doc = getDoc(slug);
  if (!doc) return null;

  const { title, body, headings, taskMap } = parseDoc(doc);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12 flex justify-center gap-8 xl:gap-12">
      <article className="w-full max-w-3xl min-w-0">
        <header className="seam-b mb-8 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip t-mono">{doc.section}</span>
            <span className="chip t-caption">{doc.file}</span>
          </div>
          <h1 className="t-title text-2xl sm:text-3xl">{title}</h1>
          <StageStatus route={doc.route} />
        </header>

        <Markdown
          source={body}
          file={doc.file}
          route={doc.route}
          linkMap={getLinkMap()}
          taskMap={taskMap}
        />

        <StagePanel route={doc.route} />
      </article>

      <TableOfContents headings={headings} />
    </div>
  );
}
