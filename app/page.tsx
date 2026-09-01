import DashboardClient from "./DashboardClient";
import { getStageTasks } from "./lib/content";

export default function Home() {
  return <DashboardClient stageTasks={getStageTasks()} />;
}
