"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isCategory } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/money";
import { createSession, destroySession } from "@/lib/session";

export type ActionState = { error: string } | undefined;

const credentialsSchema = z.object({
  email: z.email("Enter a valid email.").max(200),
  password: z.string().min(8, "Password must be at least 8 characters.").max(100),
});

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formString(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      people: { create: { name: "Me" } },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formString(formData, "email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) return { error: "Email or password is incorrect." };

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "Email or password is incorrect." };

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logOut() {
  await destroySession();
  redirect("/login");
}

export async function addPerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = formString(formData, "name");
  if (name.length < 1 || name.length > 80) {
    return { error: "Give this person a name." };
  }

  const duplicate = await prisma.person.findFirst({
    where: { ownerId: user.id, name },
  });
  if (duplicate) return { error: "That name is already on your list." };

  await prisma.person.create({
    data: { ownerId: user.id, name },
  });
  revalidatePath("/people");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function deletePerson(formData: FormData) {
  const user = await requireUser();
  const id = formString(formData, "id");

  const peopleCount = await prisma.person.count({ where: { ownerId: user.id } });
  if (peopleCount <= 1) {
    return;
  }

  const expenseCount = await prisma.expense.count({
    where: { ownerId: user.id, personId: id },
  });
  if (expenseCount > 0) {
    return;
  }

  await prisma.person.deleteMany({
    where: { id, ownerId: user.id },
  });
  revalidatePath("/people");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
}

export async function addExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const amountRaw = formString(formData, "amount");
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return { error: "Enter a valid amount." };
  }

  const personId = formString(formData, "personId");
  const person = await prisma.person.findFirst({
    where: { id: personId, ownerId: user.id },
  });
  if (!person) return { error: "Choose who spent this." };

  const category = formString(formData, "category");
  if (!isCategory(category)) return { error: "Choose a category." };

  const spentAt = parseDateInput(formString(formData, "spentAt"));
  if (!spentAt) return { error: "Choose a valid date." };

  const note = formString(formData, "note").slice(0, 500);

  await prisma.expense.create({
    data: {
      ownerId: user.id,
      personId: person.id,
      amount,
      category,
      note,
      spentAt,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/people");
}

export async function deleteExpense(formData: FormData) {
  const user = await requireUser();
  const id = formString(formData, "id");
  await prisma.expense.deleteMany({
    where: { id, ownerId: user.id },
  });
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/people");
}
