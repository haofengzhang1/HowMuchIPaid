import Link from "next/link";
import { lastMessagesByContact, listChatContacts, sentTodayCount } from "@/lib/chat";
import { DAILY_TEXT_LIMIT } from "@/lib/chat-limits";
import { requireUser } from "@/lib/auth";

function preview(body: string) {
  const oneLine = body.replace(/\s+/g, " ").trim();
  return oneLine.length > 80 ? `${oneLine.slice(0, 77)}…` : oneLine;
}

export default async function ChatPage() {
  const user = await requireUser();
  const [contacts, sent] = await Promise.all([
    listChatContacts(user.id),
    sentTodayCount(user.id),
  ]);
  const latest = await lastMessagesByContact(
    user.id,
    contacts.map((contact) => contact.id),
  );
  const remaining = Math.max(0, DAILY_TEXT_LIMIT - sent);

  return (
    <main className="grid gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Chat</h1>
        <p className="mt-1 text-sm text-muted">
          Text people who share a log with you. Text only, {DAILY_TEXT_LIMIT} messages per day.
        </p>
      </div>

      <section className="panel">
        <h2 className="panel-title">Conversations</h2>
        {contacts.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Invite someone from Sharing. After they accept, you can text each other here.
          </p>
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
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{contact.email}</span>
                      <span className="block truncate text-sm text-muted">
                        {last
                          ? `${last.fromMe ? "You: " : ""}${preview(last.body)}`
                          : "No messages yet"}
                      </span>
                    </span>
                    <span className="text-sm text-accent">Open</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          {remaining} of {DAILY_TEXT_LIMIT} texts left today
        </p>
      </section>
    </main>
  );
}
