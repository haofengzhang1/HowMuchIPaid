"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { clearActiveNotebook, isSafeInvitePath, requireEditableOwner } from "@/lib/access";
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

function nextPath(formData: FormData) {
  const next = formString(formData, "next");
  return isSafeInvitePath(next) ? next : "/dashboard";
}

function refreshNotebook() {
  revalidatePath("/people");
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/sharing");
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
    },
  });
  await prisma.person.create({
    data: { ownerId: user.id, name: user.email, userId: user.id },
  });

  await createSession(user.id);
  redirect(nextPath(formData));
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
  redirect(nextPath(formData));
}

export async function logOut() {
  await destroySession();
  await clearActiveNotebook();
  redirect("/login");
}

export async function deletePerson(formData: FormData) {
  const user = await requireUser();
  const ownerId = await requireEditableOwner(user.id);
  const id = formString(formData, "id");

  const person = await prisma.person.findFirst({
    where: { id, ownerId, userId: null },
  });
  if (!person) return;

  const expenseCount = await prisma.expense.count({
    where: { ownerId, personId: id },
  });
  if (expenseCount > 0) return;

  await prisma.person.deleteMany({
    where: { id, ownerId, userId: null },
  });
  refreshNotebook();
}

export async function addExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const ownerId = await requireEditableOwner(user.id);
  const amountRaw = formString(formData, "amount");
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return { error: "Enter a valid amount." };
  }

  const personId = formString(formData, "personId");
  const person = await prisma.person.findFirst({
    where: { id: personId, ownerId },
  });
  if (!person) return { error: "Choose who spent this." };

  const category = formString(formData, "category");
  if (!isCategory(category)) return { error: "Choose a category." };

  const spentAt = parseDateInput(formString(formData, "spentAt"));
  if (!spentAt) return { error: "Choose a valid date." };

  const note = formString(formData, "note").slice(0, 500);

  await prisma.expense.create({
    data: {
      ownerId,
      personId: person.id,
      amount,
      category,
      note,
      spentAt,
    },
  });

  refreshNotebook();
}

export async function deleteExpense(formData: FormData) {
  const user = await requireUser();
  const ownerId = await requireEditableOwner(user.id);
  const id = formString(formData, "id");
  await prisma.expense.deleteMany({
    where: { id, ownerId },
  });
  refreshNotebook();
}
