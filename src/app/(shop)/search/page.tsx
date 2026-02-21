import { Suspense } from "react";
import { SearchBox } from "@/components/features/search-box";
import { WebResultCard } from "@/components/features/web-result-card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWebSearchResults } from "@/lib/web-search";

function ResultsSkeleton() {
  return (
    <div className="columns-2 gap-6 sm:columns-3 lg:columns-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="mb-6 break-inside-avoid">
          <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
          <div className="mt-3 space-y-2 px-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function SearchResults({ query }: { query?: string }) {
  if (!query) {
    return (
      <p className="py-20 text-center text-secondary">
        start typing to discover curated objects...
      </p>
    );
  }

  const { results, error } = await fetchWebSearchResults(query);

  if (error === "not_configured") {
    return (
      <p className="py-20 text-center text-secondary">
        search is not configured yet. add GEMINI_API_KEY to your environment.
      </p>
    );
  }

  if (error === "quota_exceeded") {
    return (
      <p className="py-20 text-center text-secondary">
        search is busy right now. please try again in a moment.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="py-20 text-center text-secondary">
        no results found for &ldquo;{query}&rdquo;
      </p>
    );
  }

  // Background-index results for future enrichment
  const baseUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000";

  fetch(`${baseUrl}/api/cron/crawl/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
    },
    body: JSON.stringify({
      items: results.map((r) => ({
        externalId: r.url,
        title: r.title,
        description: r.snippet,
        price: 0,
        currency: "USD",
        imageUrls: r.thumbnail ? [r.thumbnail] : [],
        sourceUrl: r.url,
        vendorName: r.source,
      })),
    }),
  }).catch(() => {
    // fire-and-forget
  });

  return (
    <div className="columns-2 gap-6 sm:columns-3 lg:columns-4">
      {results.map((result) => (
        <div key={result.url} className="mb-6 break-inside-avoid">
          <WebResultCard
            title={result.title}
            url={result.url}
            snippet={result.snippet}
            price={result.price}
            thumbnail={result.thumbnail}
            source={result.source}
          />
        </div>
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="space-y-10">
      <div className="pt-4">
        <SearchBox defaultValue={q} />
      </div>

      {q && (
        <p className="text-sm text-secondary">
          results for &ldquo;{q}&rdquo;
        </p>
      )}

      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults query={q} />
      </Suspense>
    </div>
  );
}
