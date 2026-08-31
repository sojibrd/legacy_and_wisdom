import type { Metadata } from "next";
import { getNav } from "../lib/content";
import ProgressClient from "./ProgressClient";

export const metadata: Metadata = { title: "Roadmap Tracker" };

export default function ProgressPage() {
  return <ProgressClient nav={getNav()} />;
}
