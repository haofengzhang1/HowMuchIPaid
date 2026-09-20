import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-sm px-5 py-16">
      <Link href="/" className="text-sm text-muted">
        How Much I Paid
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Create account</h1>
      <p className="mt-2 text-sm text-muted">
        Email and password are saved in the database.
      </p>
      <div className="panel mt-6">
        <AuthForm mode="signup" />
      </div>
      <p className="mt-5 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
