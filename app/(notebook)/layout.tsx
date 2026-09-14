import type { ReactNode } from "react";
import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/auth";

export default async function NotebookLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-full">
      <AppNav email={user.email} />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
