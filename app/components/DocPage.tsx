import Markdown from "./Markdown";
import DocTracker from "./DocTracker";
import TableOfContents from "./TableOfContents";
import { getDoc, getLinkMap, parseDoc } from "../lib/content";

export default function DocPage({ slug }: { slug: string[] }) {
  const doc = getDoc(slug);
  if (!doc) return null;

  const { title, body, headings } = parseDoc(doc);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-12 flex justify-center gap-8 xl:gap-12">
      <article className="w-full max-w-3xl min-w-0">
        <header className="seam-b mb-8 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip t-mono">{doc.section}</span>
            <span className="chip t-caption">{doc.file}</span>
          </div>
          <h1 className="t-title text-2xl sm:text-3xl">{title}</h1>
        </header>

        <Markdown source={body} file={doc.file} linkMap={getLinkMap()} />

        <DocTracker route={doc.route} headings={headings} />
      </article>

      <TableOfContents headings={headings} />
    </div>
  );
}
