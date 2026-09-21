import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatForm } from "@/components/chat-form";
import { ChatPoll } from "@/components/chat-poll";
import { requireUser } from "@/lib/auth";
import { canChat, getThread, sentTodayCount } from "@/lib/chat";
import { DAILY_TEXT_LIMIT } from "@/lib/chat-limits";
import { prisma } from "@/lib/prisma";

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await requireUser();
  const { userId: otherId } = await params;
  if (!(await canChat(user.id, otherId))) notFound();

  const [other, messages, sent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: otherId },
      select: { email: true },
    }),
    getThread(user.id, otherId),
    sentTodayCount(user.id),
  ]);
  if (!other) notFound();

  const remaining = Math.max(0, DAILY_TEXT_LIMIT - sent);

  return (
    <main className="grid gap-4">
      <ChatPoll />
      <div>
        <p className="text-sm">
          <Link href="/chat" className="text-accent">
            All chats
          </Link>
        </p>
        <h1 className="mt-1 break-all text-xl font-semibold sm:text-2xl">{other.email}</h1>
        <p className="mt-1 text-sm text-muted">Text only. No photos or videos.</p>
      </div>

      <ol className="grid gap-2">
        {messages.length === 0 ? (
          <li className="panel text-sm text-muted">No messages yet. Send the first text.</li>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === user.id;
            return (
              <li
                key={message.id}
                className={`max-w-[85%] px-3 py-2 text-sm ${
                  mine ? "ml-auto bg-accent text-white" : "mr-auto border border-line bg-surface"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <p className={`mt-1 text-xs ${mine ? "text-white/75" : "text-muted"}`}>
                  {formatTime(message.createdAt)}
                </p>
              </li>
            );
          })
        )}
      </ol>

      <section className="panel">
        <ChatForm recipientId={otherId} remaining={remaining} />
      </section>
    </main>
  );
}
