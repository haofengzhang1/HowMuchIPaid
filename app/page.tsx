import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="text-sm text-muted">Expense log</p>
      <h1 className="mt-2 text-3xl font-semibold">How Much I Paid</h1>
      <p className="mt-4 max-w-md text-muted">
        Write down what you spend. Add another person and track theirs too.
        Totals and charts stay in your account.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/signup" className="btn-primary inline-flex items-center">
          Create account
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center border border-line bg-surface px-4 py-2 text-sm"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
