import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/features/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* logo / wordmark */}
        <Link href="/" className="font-heading text-xl tracking-tight text-primary">
          curated objects
        </Link>

        {/* navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/search"
            className="text-sm text-secondary hover:text-primary"
          >
            browse
          </Link>
        </nav>

        {/* actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <SignOutButton />
              <Button variant="default" size="sm" asChild>
                <Link href="/seller/new">sell</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">sign in</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/signup">sell</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
