import { CopyButton } from "@/components/copy-button";
import { InviteForm } from "@/components/invite-form";
import { getInviteOrigin, invitePath } from "@/lib/access";
import { requireUser } from "@/lib/auth";
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
        <h1 className="text-xl font-semibold sm:text-2xl">Sharing</h1>
        <p className="mt-1 text-sm text-muted">
          Invite someone to this log. They appear under Who right away. After they accept, they can see and change expenses.
        </p>
      </div>

      {pendingReceived.length > 0 ? (
        <section className="panel">
          <h2 className="panel-title">Invites for you</h2>
          <ul className="mt-3 divide-y divide-line">
            {pendingReceived.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="break-all text-sm">{invite.owner.email} invited you.</p>
                <div className="flex min-h-10 items-center gap-4">
                  <form action={acceptInvite}>
                    <input type="hidden" name="token" value={invite.token} />
                    <button type="submit" className="action-link text-accent">
                      Accept
                    </button>
                  </form>
                  <form action={declineInvite}>
                    <input type="hidden" name="id" value={invite.id} />
                    <button type="submit" className="action-link text-muted hover:text-danger">
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="panel-title">Invite</h2>
        <div className="mt-3">
          <InviteForm />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Waiting</h2>
        {pendingSent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No open invites.</p>
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
                        Cancel
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
        <h2 className="panel-title">People with access</h2>
        {members.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Only you can edit this log right now.</p>
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
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title">Logs you can edit</h2>
        {joined.length === 0 ? (
          <p className="mt-3 text-sm text-muted">You have not joined anyone else&apos;s log.</p>
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
                    Leave
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
