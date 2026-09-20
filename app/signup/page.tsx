import Link from "next/link";
import { redirect } from "next/navigation";
import { isSafeInvitePath } from "@/lib/access";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next: nextRaw } = await searchParams;
  const next = nextRaw && isSafeInvitePath(nextRaw) ? nextRaw : undefined;
  if (user) redirect(next ?? "/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-5 py-12 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <Link href="/" className="text-sm text-muted">
        How Much I Paid
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-muted">
        Email and password are saved in the database.
      </p>
      <div className="panel mt-6">
        <AuthForm mode="signup" next={next} />
      </div>
      <p className="mt-5 text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="text-accent underline"
        >
          Log in
        </Link>
      </p>
    </main>
  );
}
