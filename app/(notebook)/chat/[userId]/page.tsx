import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { ChatForm } from "@/components/chat-form";
import { ChatPoll } from "@/components/chat-poll";
import { LocalTime } from "@/components/local-time";
import { requireUser } from "@/lib/auth";
import { canChat, getThread, sentTodayCount } from "@/lib/chat";
import { DAILY_TEXT_LIMIT } from "@/lib/chat-limits";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { startOfUserDay } from "@/lib/timezone";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const user = await requireUser();
  const locale = await getLocale();
  const { userId: otherId } = await params;
  if (!(await canChat(user.id, otherId))) notFound();

  const [other, messages, sent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: otherId },
      select: { email: true, avatarUpdatedAt: true },
    }),
    getThread(user.id, otherId),
    sentTodayCount(user.id, await startOfUserDay()),
  ]);
  if (!other) notFound();

  const remaining = Math.max(0, DAILY_TEXT_LIMIT - sent);
  const wallpaper = user.chatBgUpdatedAt
    ? `url(/api/chat-bg?v=${user.chatBgUpdatedAt.getTime()})`
    : undefined;

  return (
    <main className="grid gap-4">
      <ChatPoll />
      <div className="flex items-center gap-3">
        <Avatar
          userId={otherId}
          name={other.email}
          version={other.avatarUpdatedAt?.getTime() ?? null}
          size={40}
        />
        <div className="min-w-0">
          <p className="text-sm">
            <Link href="/chat" className="text-accent">
              {t(locale, "allChats")}
            </Link>
          </p>
          <h1 className="mt-1 break-all text-xl font-semibold sm:text-2xl">{other.email}</h1>
          <p className="mt-1 text-sm text-muted">{t(locale, "textOnly")}</p>
        </div>
      </div>

      <ol
        className="grid gap-2 rounded-none border border-line p-3"
        style={{
          backgroundColor: user.chatBgColor || undefined,
          backgroundImage: wallpaper,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {messages.length === 0 ? (
          <li className="panel text-sm text-muted">{t(locale, "noMessagesYet")}</li>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === user.id;
            return (
              <li
                key={message.id}
                className={`flex max-w-[85%] items-end gap-2 ${mine ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <Avatar
                  userId={mine ? user.id : otherId}
                  name={mine ? user.email : other.email}
                  version={
                    mine
                      ? user.avatarUpdatedAt?.getTime() ?? null
                      : other.avatarUpdatedAt?.getTime() ?? null
                  }
                  size={28}
                />
                <div
                  className={`px-3 py-2 text-sm ${
                    mine ? "bg-accent text-white" : "border border-line bg-surface"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  <p className={`mt-1 text-xs ${mine ? "text-white/75" : "text-muted"}`}>
                    <LocalTime iso={message.createdAt.toISOString()} locale={locale} />
                  </p>
                </div>
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
