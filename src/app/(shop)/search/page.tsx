import { Suspense } from "react";
import { SearchBox } from "@/components/features/search-box";
import { ProductCard } from "@/components/features/product-card";
import { Skeleton } from "@/components/ui/skeleton";

function ResultsSkeleton() {
  return (
    <div className="columns-2 gap-6 sm:columns-3 lg:columns-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="mb-6 break-inside-avoid">
          <Skeleton className="aspect-[3/4] w-full" />
          <div className="mt-3 space-y-2 px-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResults({ query }: { query?: string }) {
  // placeholder — will be replaced with real API call + React Query
  const results = query
    ? [
        {
          id: "1",
          title: "mid-century walnut credenza",
          price: 185000,
          images: [],
          type: "DIRECT" as const,
        },
        {
          id: "2",
          title: "brass arc floor lamp",
          price: 42000,
          images: [],
          vendorName: "etsy",
          type: "AGGREGATED" as const,
        },
      ]
    : [];

  if (!query) {
    return (
      <p className="py-20 text-center text-secondary">
        start typing to discover curated objects...
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

  return (
    <div className="columns-2 gap-6 sm:columns-3 lg:columns-4">
      {results.map((item) => (
        <div key={item.id} className="mb-6 break-inside-avoid">
          <ProductCard {...item} />
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
        <SearchBox />
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
