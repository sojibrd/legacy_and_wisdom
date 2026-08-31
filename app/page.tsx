import { notFound } from "next/navigation";
import DocPage from "./components/DocPage";
import { getDoc } from "./lib/content";

export default function Home() {
  if (!getDoc([])) notFound();
  return <DocPage slug={[]} />;
}
