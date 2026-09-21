"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/actions";
import { switchNotebook } from "@/lib/share-actions";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/expenses", label: "Expenses" },
  { href: "/people", label: "People" },
  { href: "/sharing", label: "Sharing" },
  { href: "/chat", label: "Chat" },
];

type NotebookOption = { ownerId: string; email: string; isOwn: boolean };

export function AppNav({
  email,
  notebooks,
  activeOwnerId,
  isShared,
}: {
  email: string;
  notebooks: NotebookOption[];
  activeOwnerId: string;
  isShared?: boolean;
}) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link href="/dashboard" className="text-base font-semibold">
              How Much I Paid
            </Link>
            <p className="truncate text-xs text-muted">{email}</p>
            {isShared ? <p className="truncate text-xs text-muted">Shared log</p> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {notebooks.length > 1 ? (
              <form action={switchNotebook} key={activeOwnerId}>
                <label className="flex items-center gap-2 text-xs text-muted">
                  Log
                  <select
                    name="ownerId"
                    defaultValue={activeOwnerId}
                    className="field min-h-9 max-w-[11rem] py-1 text-sm"
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                  >
                    {notebooks.map((item) => (
                      <option key={item.ownerId} value={item.ownerId}>
                        {item.isOwn ? "Yours" : item.email}
                      </option>
                    ))}
                  </select>
                </label>
              </form>
            ) : null}
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const isActive =
                  pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 py-1.5 text-sm ${
                      isActive ? "bg-accent text-white" : "text-ink hover:bg-bg"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <form action={logOut}>
                <button type="submit" className="px-2.5 py-1.5 text-sm text-muted hover:text-ink">
                  Log out
                </button>
              </form>
            </nav>
            <form action={logOut} className="md:hidden">
              <button type="submit" className="action-link text-muted">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.map((link) => {
          const isActive =
            pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-h-12 items-center justify-center px-1 text-center text-xs ${
                isActive ? "bg-accent text-white" : "text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
