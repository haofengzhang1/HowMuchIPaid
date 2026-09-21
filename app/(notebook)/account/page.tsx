import { AccountForm } from "@/components/account-form";
import { requireUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      avatarUpdatedAt: true,
      chatBgColor: true,
      chatBgUpdatedAt: true,
    },
  });

  return (
    <main className="grid gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{t(locale, "account")}</h1>
        <p className="mt-1 text-sm text-muted">{t(locale, "accountBlurb")}</p>
      </div>
      <AccountForm
        userId={user.id}
        email={user.email}
        avatarVersion={profile?.avatarUpdatedAt?.getTime().toString() ?? null}
        chatBgColor={profile?.chatBgColor ?? ""}
        chatBgVersion={profile?.chatBgUpdatedAt?.getTime().toString() ?? null}
      />
    </main>
  );
}
