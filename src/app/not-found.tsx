import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-32">
      <h1 className="mb-4 text-4xl">page not found</h1>
      <p className="mb-8 text-secondary">
        the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/search"
        className="rounded-full border border-border-subtle px-6 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
      >
        back to search
      </Link>
    </div>
  );
}
