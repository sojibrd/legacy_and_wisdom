"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocalStorage } from "../hooks/useLocalStorage";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { PanelLeftOpen } from "./icons";
import type { NavSection } from "../lib/content";

export default function Shell({
  nav,
  children,
}: {
  nav: NavSection[];
  children: React.ReactNode;
}) {
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useLocalStorage("lw_nav_collapsed", false);
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const open = openPath === pathname;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      const slash = event.key === "/" && !typing;
      const ctrlK =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (!slash && !ctrlK) return;

      event.preventDefault();
      setCollapsed(false);
      searchRef.current?.focus();
      searchRef.current?.select();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setCollapsed]);

  return (
    <div className="surface-app h-screen flex flex-col overflow-hidden">
      <Navbar onOpenSidebar={() => setOpenPath(pathname)} />

      <div className="flex flex-1 min-h-0">
        {collapsed && (
          <div className="surface-panel hidden lg:flex shrink-0 flex-col items-center px-2 py-3">
            <button
              onClick={() => setCollapsed(false)}
              className="control control--quiet p-1.5"
              aria-label="সূচিপত্র খুলুন"
              aria-expanded={false}
              aria-controls="site-sidebar"
            >
              <PanelLeftOpen />
            </button>
          </div>
        )}

        <aside
          id="site-sidebar"
          className={`surface-panel hidden w-80 shrink-0 min-h-0 ${
            collapsed ? "" : "lg:block"
          }`}
        >
          <Sidebar
            nav={nav}
            onCollapse={() => setCollapsed(true)}
            searchRef={searchRef}
          />
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true">
          <div
            className="overlay absolute inset-0"
            onClick={() => setOpenPath(null)}
          />
          <aside className="drawer-enter surface-panel absolute left-0 top-0 h-full w-[300px] sm:w-[360px]">
            <Sidebar
              nav={nav}
              onClose={() => setOpenPath(null)}
              onNavigate={() => setOpenPath(null)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
