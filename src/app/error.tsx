"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32">
      <h1 className="mb-4 text-4xl">something went wrong</h1>
      <p className="mb-8 text-secondary">
        an unexpected error occurred. please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-full border border-border-subtle px-6 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
      >
        try again
      </button>
    </div>
  );
}
