import Link from "next/link";
import { redirect } from "next/navigation";
import { isSafeInvitePath } from "@/lib/access";
import { AuthForm } from "@/components/auth-form";
import { LanguageSwitch } from "@/components/language-switch";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next: nextRaw } = await searchParams;
  const next = nextRaw && isSafeInvitePath(nextRaw) ? nextRaw : undefined;
  if (user) redirect(next ?? "/dashboard");
  const locale = await getLocale();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-sm text-muted">
          {t(locale, "appName")}
        </Link>
        <LanguageSwitch />
      </div>
      <h1 className="mt-3 text-2xl font-semibold">{t(locale, "logIn")}</h1>
      <div className="panel mt-6">
        <AuthForm mode="login" next={next} />
      </div>
      <p className="mt-5 text-sm text-muted">
        {t(locale, "noAccount")}{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="text-accent underline"
        >
          {t(locale, "createAccount")}
        </Link>
      </p>
    </main>
  );
}
