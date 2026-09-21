import { CopyButton } from "@/components/copy-button";
import { InviteForm } from "@/components/invite-form";
import { getInviteOrigin, invitePath } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import {
  acceptInvite,
  declineInvite,
  leaveNotebook,
  removeMember,
  revokeInvite,
} from "@/lib/share-actions";

export default async function SharingPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const origin = await getInviteOrigin();

  const [pendingSent, pendingReceived, members, joined] = await Promise.all([
    prisma.invite.findMany({
      where: { ownerId: user.id, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invite.findMany({
      where: { email: user.email, status: "pending" },
      include: { owner: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notebookShare.findMany({
      where: { ownerId: user.id },
      include: { member: { select: { id: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.notebookShare.findMany({
      where: { memberId: user.id },
      include: { owner: { select: { id: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <main className="grid gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{t(locale, "sharing")}</h1>
        <p className="mt-1 text-sm text-muted">{t(locale, "sharingBlurb")}</p>
      </div>

      {pendingReceived.length > 0 ? (
        <section className="panel">
          <h2 className="panel-title">{t(locale, "invitesForYou")}</h2>
          <ul className="mt-3 divide-y divide-line">
            {pendingReceived.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="break-all text-sm">
                  {t(locale, "invitedYou", { email: invite.owner.email })}
                </p>
                <div className="flex min-h-10 items-center gap-4">
                  <form action={acceptInvite}>
                    <input type="hidden" name="token" value={invite.token} />
                    <button type="submit" className="action-link text-accent">
                      {t(locale, "accept")}
                    </button>
                  </form>
                  <form action={declineInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <button type="submit" className="action-link text-muted hover:text-danger">
                      {t(locale, "decline")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="panel-title">{t(locale, "invite")}</h2>
        <div className="mt-3">
          <InviteForm />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">{t(locale, "waiting")}</h2>
        {pendingSent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t(locale, "noOpenInvites")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {pendingSent.map((invite) => {
              const url = `${origin}${invitePath(invite.token)}`;
              return (
                <li key={invite.id} className="grid gap-2 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="break-all text-sm">{invite.email}</p>
                    <form action={revokeInvite}>
                      <input type="hidden" name="id" value={invite.id} />
                      <button type="submit" className="action-link text-muted hover:text-danger">
                        {t(locale, "cancel")}
                      </button>
                    </form>
                  </div>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="min-w-0 break-all">{url}</span>
                    <CopyButton value={url} />
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">{t(locale, "peopleWithAccess")}</h2>
        {members.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t(locale, "onlyYou")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {members.map((share) => (
              <li
                key={share.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <p className="break-all text-sm">{share.member.email}</p>
                <form action={removeMember}>
                  <input type="hidden" name="memberId" value={share.member.id} />
                  <button type="submit" className="action-link text-muted hover:text-danger">
                    {t(locale, "remove")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">{t(locale, "sharedLogs")}</h2>
        {joined.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t(locale, "notJoined")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {joined.map((share) => (
              <li
                key={share.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <p className="break-all text-sm">{share.owner.email}</p>
                <form action={leaveNotebook}>
                  <input type="hidden" name="ownerId" value={share.owner.id} />
                  <button type="submit" className="action-link text-muted hover:text-danger">
                    {t(locale, "leave")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
