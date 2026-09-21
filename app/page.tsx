import Link from "next/link";
import { redirect } from "next/navigation";
import { LanguageSwitch } from "@/components/language-switch";
import { getCurrentUser } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const locale = await getLocale();

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="flex justify-end">
        <LanguageSwitch />
      </div>
      <p className="text-sm text-muted">{t(locale, "expenseLog")}</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-3xl">
        {t(locale, "appName")}
      </h1>
      <p className="mt-4 max-w-md text-muted">{t(locale, "homeBlurb")}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Link href="/signup" className="btn-primary w-full sm:w-auto">
          {t(locale, "createAccount")}
        </Link>
        <Link href="/login" className="btn-secondary w-full sm:w-auto">
          {t(locale, "logIn")}
        </Link>
      </div>
    </main>
  );
}
