"use client";

import Link from "next/link";

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32">
      <h1 className="mb-4 text-4xl">search unavailable</h1>
      <p className="mb-8 text-secondary">
        we couldn&apos;t complete your search. please try again.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="rounded-full border border-border-subtle px-6 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
        >
          try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-border-subtle px-6 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
        >
          go home
        </Link>
      </div>
    </div>
  );
}
