import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { lastMessagesByContact, listChatContacts, sentTodayCount } from "@/lib/chat";
import { DAILY_TEXT_LIMIT } from "@/lib/chat-limits";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { startOfUserDay } from "@/lib/timezone";

function preview(body: string) {
  const oneLine = body.replace(/\s+/g, " ").trim();
  return oneLine.length > 80 ? `${oneLine.slice(0, 77)}…` : oneLine;
}

export default async function ChatPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const [contacts, sent] = await Promise.all([
    listChatContacts(user.id),
    sentTodayCount(user.id, await startOfUserDay()),
  ]);
  const latest = await lastMessagesByContact(
    user.id,
    contacts.map((contact) => contact.id),
  );
  const remaining = Math.max(0, DAILY_TEXT_LIMIT - sent);

  return (
    <main className="grid gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{t(locale, "chat")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t(locale, "chatBlurb", { limit: DAILY_TEXT_LIMIT })}
        </p>
      </div>

      <section className="panel">
        <h2 className="panel-title">{t(locale, "conversations")}</h2>
        {contacts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t(locale, "chatEmpty")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {contacts.map((contact) => {
              const last = latest.get(contact.id);
              return (
                <li key={contact.id}>
                  <Link
                    href={`/chat/${contact.id}`}
                    className="flex min-h-12 items-center justify-between gap-3 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar
                        userId={contact.id}
                        name={contact.email}
                        version={contact.avatarUpdatedAt?.getTime() ?? null}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{contact.email}</span>
                        <span className="block truncate text-sm text-muted">
                          {last
                            ? last.fromMe
                              ? t(locale, "youPrefix", { body: preview(last.body) })
                              : preview(last.body)
                            : t(locale, "noMessages")}
                        </span>
                      </span>
                    </span>
                    <span className="text-sm text-accent">{t(locale, "open")}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          {t(locale, "textsLeft", { remaining, limit: DAILY_TEXT_LIMIT })}
        </p>
      </section>
    </main>
  );
}
