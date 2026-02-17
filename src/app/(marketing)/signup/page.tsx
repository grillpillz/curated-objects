"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl">check your email</h1>
          <p className="text-sm text-secondary">
            we sent a confirmation link to <strong>{email}</strong>.
            click the link to activate your account.
          </p>
          <Button variant="outline" onClick={() => router.push("/login")}>
            back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl">create an account</h1>
          <p className="mt-2 text-sm text-secondary">
            join curated objects
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-secondary">
              email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-secondary">
              password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-secondary">i want to</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("BUYER")}
                className={`flex-1 rounded-full border px-4 py-2.5 text-sm transition-colors ${
                  role === "BUYER"
                    ? "border-primary bg-primary text-canvas"
                    : "border-border-subtle text-secondary hover:border-primary"
                }`}
              >
                buy
              </button>
              <button
                type="button"
                onClick={() => setRole("SELLER")}
                className={`flex-1 rounded-full border px-4 py-2.5 text-sm transition-colors ${
                  role === "SELLER"
                    ? "border-primary bg-primary text-canvas"
                    : "border-border-subtle text-secondary hover:border-primary"
                }`}
              >
                sell
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "creating account..." : "sign up"}
          </Button>
        </form>

        <p className="text-center text-sm text-secondary">
          already have an account?{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
