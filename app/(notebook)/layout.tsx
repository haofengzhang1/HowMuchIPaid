import type { ReactNode } from "react";
import { AddExpenseButton } from "@/components/add-expense-button";
import { AppNav } from "@/components/app-nav";
import { getActiveNotebook } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotebookLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const notebook = await getActiveNotebook(user);
  const people = await prisma.person.findMany({
    where: { ownerId: notebook.ownerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="min-h-dvh">
      <AppNav
        email={user.email}
        notebooks={notebook.notebooks}
        activeOwnerId={notebook.ownerId}
      />
      <div className="mx-auto max-w-5xl px-4 py-4 pb-28 md:py-6 md:pb-8">{children}</div>
      <AddExpenseButton people={people} />
    </div>
  );
}
