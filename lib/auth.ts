import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSessionUserId } from "@/lib/session";

export async function getCurrentUser() {
  const userId = await readSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      avatarUpdatedAt: true,
      chatBgColor: true,
      chatBgUpdatedAt: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
