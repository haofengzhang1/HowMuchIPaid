import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const viewer = await getCurrentUser();
  if (!viewer) return new Response("Unauthorized", { status: 401 });

  const { userId } = await params;
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true, avatarMime: true },
  });
  if (!row?.avatar || !row.avatarMime) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Uint8Array.from(row.avatar), {
    headers: {
      "Content-Type": row.avatarMime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
