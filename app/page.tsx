import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <p className="text-sm text-muted">Expense log</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-3xl">
        How Much I Paid
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Write down what you spend. Add another person and track theirs too.
        Totals and charts stay in your account.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
        <Link href="/signup" className="btn-primary w-full sm:w-auto">
          Create account
        </Link>
        <Link href="/login" className="btn-secondary w-full sm:w-auto">
          Log in
        </Link>
      </div>
    </main>
  );
}
