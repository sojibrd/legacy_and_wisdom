import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DocPage from "../components/DocPage";
import { getDoc, getDocs } from "../lib/content";

type Props = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return getDocs()
    .filter((doc) => doc.slug.length > 0)
    .map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  return { title: doc ? doc.title : "Not found" };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!getDoc(slug)) notFound();
  return <DocPage slug={slug} />;
}
