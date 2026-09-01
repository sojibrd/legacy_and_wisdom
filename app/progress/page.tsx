import type { Metadata } from "next";
import ProgressClient from "./ProgressClient";

export const metadata: Metadata = { title: "Roadmap Tracker" };

export default function ProgressPage() {
  return <ProgressClient />;
}
