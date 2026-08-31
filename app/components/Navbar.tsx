"use client";

import Link from "next/link";
import { Menu } from "./icons";

export default function Navbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  return (
    <header className="surface-app seam-b shrink-0 w-full py-3 px-4 sm:px-6 flex items-center gap-3 lg:hidden">
      <button
        onClick={onOpenSidebar}
        className="control control--quiet p-2 shrink-0"
        aria-label="নেভিগেশন খুলুন"
      >
        <Menu />
      </button>

      <span className="text-2xl shrink-0">🏛️</span>
      <div className="min-w-0">
        <Link href="/" className="t-title block text-base truncate">
          Legacy & Wisdom
        </Link>
      </div>
    </header>
  );
}
