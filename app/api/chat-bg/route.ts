import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { chatBg: true, chatBgMime: true },
  });
  if (!row?.chatBg || !row.chatBgMime) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Uint8Array.from(row.chatBg), {
    headers: {
      "Content-Type": row.chatBgMime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
