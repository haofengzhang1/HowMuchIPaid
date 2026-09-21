"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { LanguageSwitch } from "@/components/language-switch";
import { useT } from "@/components/locale-provider";
import { logOut } from "@/lib/actions";
import { switchNotebook } from "@/lib/share-actions";

const links = [
  { href: "/dashboard", key: "overview" as const },
  { href: "/expenses", key: "expenses" as const },
  { href: "/people", key: "people" as const },
  { href: "/sharing", key: "sharing" as const },
  { href: "/chat", key: "chat" as const },
];

type NotebookOption = { ownerId: string; email: string; isOwn: boolean };

export function AppNav({
  userId,
  email,
  avatarVersion,
  notebooks,
  activeOwnerId,
  isShared,
}: {
  userId: string;
  email: string;
  avatarVersion?: string | null;
  notebooks: NotebookOption[];
  activeOwnerId: string;
  isShared?: boolean;
}) {
  const pathname = usePathname();
  const t = useT();

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link href="/dashboard" className="text-base font-semibold">
              {t("appName")}
            </Link>
            <Link href="/account" className="mt-1 flex min-w-0 items-center gap-2">
              <Avatar userId={userId} name={email} version={avatarVersion} size={28} />
              <span className="min-w-0">
                <span className="block truncate text-xs text-muted">{email}</span>
                {isShared ? <span className="block truncate text-xs text-muted">{t("sharedLog")}</span> : null}
              </span>
            </Link>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {notebooks.length > 1 ? (
              <form action={switchNotebook} key={activeOwnerId}>
                <label className="flex items-center gap-2 text-xs text-muted">
                  {t("log")}
                  <select
                    name="ownerId"
                    defaultValue={activeOwnerId}
                    className="field min-h-9 max-w-[11rem] py-1 text-sm"
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                  >
                    {notebooks.map((item) => (
                      <option key={item.ownerId} value={item.ownerId}>
                        {item.isOwn ? t("yours") : item.email}
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
                    {t(link.key)}
                  </Link>
                );
              })}
              <LanguageSwitch />
              <form action={logOut}>
                <button type="submit" className="px-2.5 py-1.5 text-sm text-muted hover:text-ink">
                  {t("logOut")}
                </button>
              </form>
            </nav>
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitch />
              <form action={logOut}>
                <button type="submit" className="action-link text-muted">
                  {t("logOut")}
                </button>
              </form>
            </div>
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
              {t(link.key)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
