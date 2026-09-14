import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          How Much I Paid
        </Link>
      </p>
      <h1 className="mt-4 font-serif text-4xl tracking-tight">Sign in</h1>
      <p className="mt-2 text-muted">Open your notebook.</p>
      <div className="panel mt-8">
        <AuthForm mode="login" />
      </div>
      <p className="mt-6 text-sm text-muted">
        No account yet?{" "}
        <Link href="/signup" className="text-ink underline decoration-line underline-offset-4">
          Create one
        </Link>
      </p>
    </main>
  );
}
