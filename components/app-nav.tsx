"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/actions";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/expenses", label: "Expenses" },
  { href: "/people", label: "People" },
];

export function AppNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-base font-semibold">
            How Much I Paid
          </Link>
          <p className="text-xs text-muted">{email}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 text-sm ${
                  active ? "bg-accent text-white" : "text-ink hover:bg-bg"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <form action={logOut}>
            <button type="submit" className="px-2.5 py-1 text-sm text-muted hover:text-ink">
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
