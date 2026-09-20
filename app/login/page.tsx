import Link from "next/link";
import { redirect } from "next/navigation";
import { isSafeInvitePath } from "@/lib/access";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
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
      <h1 className="mt-3 text-2xl font-semibold">Log in</h1>
      <div className="panel mt-6">
        <AuthForm mode="login" next={next} />
      </div>
      <p className="mt-5 text-sm text-muted">
        No account?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="text-accent underline"
        >
          Create one
        </Link>
      </p>
    </main>
  );
}
