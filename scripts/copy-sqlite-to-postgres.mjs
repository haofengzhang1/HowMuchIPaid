import { DatabaseSync } from "node:sqlite";
import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";

const sqlitePath = resolve(import.meta.dirname, "../prisma/dev.db");
const sqlite = new DatabaseSync(sqlitePath);
const prisma = new PrismaClient();

function rows(sql) {
  return sqlite.prepare(sql).all();
}

async function main() {
  const users = rows("SELECT id, email, passwordHash, createdAt FROM User");
  const people = rows("SELECT id, ownerId, name, createdAt FROM Person");
  const expenses = rows(
    "SELECT id, ownerId, personId, amount, currency, category, note, spentAt, createdAt FROM Expense",
  );

  if (users.length === 0) {
    console.log("No local SQLite rows to copy.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      await tx.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
          createdAt: new Date(user.createdAt),
        },
      });
    }

    for (const person of people) {
      await tx.person.upsert({
        where: { id: person.id },
        update: {},
        create: {
          id: person.id,
          ownerId: person.ownerId,
          name: person.name,
          createdAt: new Date(person.createdAt),
        },
      });
    }

    for (const expense of expenses) {
      await tx.expense.upsert({
        where: { id: expense.id },
        update: {},
        create: {
          id: expense.id,
          ownerId: expense.ownerId,
          personId: expense.personId,
          amount: expense.amount,
          currency: expense.currency,
          category: expense.category,
          note: expense.note,
          spentAt: new Date(expense.spentAt),
          createdAt: new Date(expense.createdAt),
        },
      });
    }
  });

  console.log(
    `Copied ${users.length} users, ${people.length} people, ${expenses.length} expenses to Supabase.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
