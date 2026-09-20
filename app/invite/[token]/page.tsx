import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { invitePath } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { acceptInvite } from "@/lib/share-actions";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      {children}
    </main>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { owner: { select: { email: true } } },
  });
  const user = await getCurrentUser();

  if (!invite || invite.status === "revoked" || invite.status === "declined") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Invite expired</h1>
        <p className="mt-3 text-sm text-muted">This invite is no longer valid.</p>
        <p className="mt-6">
          <Link href="/login" className="text-sm text-accent underline">
            Log in
          </Link>
        </p>
      </Shell>
    );
  }

  if (!user) {
    const next = invitePath(token);
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Join a log</h1>
        <p className="mt-3 break-words text-sm text-muted">
          {invite.owner.email} invited {invite.email} to share the same spending log and chart.
        </p>
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary w-full">
            Log in
          </Link>
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn-secondary w-full">
            Create account
          </Link>
        </div>
        <p className="mt-4 break-words text-xs text-muted">
          Use {invite.email} so the invite matches.
        </p>
      </Shell>
    );
  }

  if (user.email !== invite.email) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Wrong account</h1>
        <p className="mt-3 break-words text-sm text-muted">
          This invite is for {invite.email}. You are signed in as {user.email}.
        </p>
        <p className="mt-6">
          <Link href="/dashboard" className="text-sm text-accent underline">
            Back to your log
          </Link>
        </p>
      </Shell>
    );
  }

  if (invite.status === "accepted") {
    redirect("/dashboard");
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold">Join a log</h1>
      <p className="mt-3 break-words text-sm text-muted">
        {invite.owner.email} invited you. If you accept, you share the same expenses and chart.
      </p>
      <form action={acceptInvite} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="btn-primary w-full">
          Accept invite
        </button>
      </form>
    </Shell>
  );
}
