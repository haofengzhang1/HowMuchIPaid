import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">Spending notebook</p>
      <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight">
        How much I paid.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
        Log what you spend. Add the people around you. The notebook keeps the
        totals and turns them into charts.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup" className="btn-primary inline-flex items-center">
          Create an account
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center rounded-md border border-line px-4 py-2 text-sm hover:bg-paper-raised"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
