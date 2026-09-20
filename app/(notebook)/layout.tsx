import type { ReactNode } from "react";
import { AddExpenseButton } from "@/components/add-expense-button";
import { AppNav } from "@/components/app-nav";
import { getActiveNotebook } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { ensureNotebookPeople, personLabel } from "@/lib/participants";
import { prisma } from "@/lib/prisma";

export default async function NotebookLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const notebook = await getActiveNotebook(user);
  await ensureNotebookPeople(notebook.ownerId);
  const people = await prisma.person.findMany({
    where: { ownerId: notebook.ownerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, userId: true },
  });
  const options = people.map((person) => ({
    id: person.id,
    name: personLabel(person, user.id),
  }));
  const defaultPersonId =
    people.find((person) => person.userId === user.id)?.id ?? people[0]?.id ?? "";

  return (
    <div className="min-h-dvh">
      <AppNav
        email={user.email}
        notebooks={notebook.notebooks}
        activeOwnerId={notebook.ownerId}
        isShared={notebook.isShared}
      />
      <div className="mx-auto max-w-5xl px-4 py-4 pb-28 md:py-6 md:pb-8">{children}</div>
      <AddExpenseButton people={options} defaultPersonId={defaultPersonId} />
    </div>
  );
}
