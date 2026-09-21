import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitch } from "@/components/language-switch";
import { getCurrentUser } from "@/lib/auth";
import { invitePath } from "@/lib/access";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { acceptInvite } from "@/lib/share-actions";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="mb-4 flex justify-end">
        <LanguageSwitch />
      </div>
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
  const locale = await getLocale();
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { owner: { select: { email: true } } },
  });
  const user = await getCurrentUser();

  if (!invite || invite.status === "revoked" || invite.status === "declined") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">{t(locale, "inviteExpired")}</h1>
        <p className="mt-3 text-sm text-muted">{t(locale, "inviteInvalid")}</p>
        <p className="mt-6">
          <Link href="/login" className="text-sm text-accent underline">
            {t(locale, "logIn")}
          </Link>
        </p>
      </Shell>
    );
  }

  if (!user) {
    const next = invitePath(token);
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">{t(locale, "joinLog")}</h1>
        <p className="mt-3 break-words text-sm text-muted">
          {t(locale, "inviteGuest", { owner: invite.owner.email, email: invite.email })}
        </p>
        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary w-full">
            {t(locale, "logIn")}
          </Link>
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn-secondary w-full">
            {t(locale, "createAccount")}
          </Link>
        </div>
        <p className="mt-4 break-words text-xs text-muted">
          {t(locale, "useInviteEmail", { email: invite.email })}
        </p>
      </Shell>
    );
  }

  if (user.email !== invite.email) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">{t(locale, "wrongAccount")}</h1>
        <p className="mt-3 break-words text-sm text-muted">
          {t(locale, "inviteWrongUser", { email: invite.email, you: user.email })}
        </p>
        <p className="mt-6">
          <Link href="/dashboard" className="text-sm text-accent underline">
            {t(locale, "backToLog")}
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
      <h1 className="text-2xl font-semibold">{t(locale, "joinLog")}</h1>
      <p className="mt-3 break-words text-sm text-muted">
        {t(locale, "inviteAcceptBlurb", { email: invite.owner.email })}
      </p>
      <form action={acceptInvite} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="btn-primary w-full">
          {t(locale, "acceptInvite")}
        </button>
      </form>
    </Shell>
  );
}
