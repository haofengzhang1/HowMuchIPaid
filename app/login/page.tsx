import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <Link href="/" className="text-sm text-muted">
        How Much I Paid
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Log in</h1>
      <div className="panel mt-6">
        <AuthForm mode="login" />
      </div>
      <p className="mt-5 text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="text-accent underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
