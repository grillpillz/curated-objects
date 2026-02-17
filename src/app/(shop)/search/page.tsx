import { Suspense } from "react";
import { SearchBox } from "@/components/features/search-box";
import { ProductCard } from "@/components/features/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai";

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

type SearchItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  vendorName: string | null;
  sourceUrl: string | null;
  type: "DIRECT" | "AGGREGATED";
  slug: string;
};

async function SearchResults({ query }: { query?: string }) {
  if (!query) {
    return (
      <p className="py-20 text-center text-secondary">
        start typing to discover curated objects...
      </p>
    );
  }

  // attempt hybrid search: vector + keyword
  let embedding: number[] | null = null;
  try {
    embedding = await generateEmbedding(query);
  } catch {
    // fall back to keyword-only
  }

  let items: SearchItem[];

  if (embedding) {
    items = await prisma.$queryRawUnsafe<SearchItem[]>(
      `SELECT i.id, i.title, i.price, i.currency, i.type, i.images, i.tags, i.slug,
              i.source_url as "sourceUrl", i.vendor_name as "vendorName"
       FROM items i
       WHERE i.status = 'AVAILABLE'
         AND (i.embedding IS NOT NULL OR i.title ILIKE $1 OR array_to_string(i.tags, ' ') ILIKE $1)
       ORDER BY
         CASE WHEN i.embedding IS NOT NULL
           THEN (1 - (i.embedding <=> $2::vector))
           ELSE 0
         END * 0.7
         +
         CASE WHEN i.title ILIKE $1 THEN 0.3 ELSE 0 END
         DESC
       LIMIT 40`,
      `%${query}%`,
      JSON.stringify(embedding),
    );
  } else {
    items = await prisma.$queryRawUnsafe<SearchItem[]>(
      `SELECT i.id, i.title, i.price, i.currency, i.type, i.images, i.tags, i.slug,
              i.source_url as "sourceUrl", i.vendor_name as "vendorName"
       FROM items i
       WHERE i.status = 'AVAILABLE'
         AND (i.title ILIKE $1 OR i.description ILIKE $1 OR array_to_string(i.tags, ' ') ILIKE $1)
       ORDER BY i.created_at DESC
       LIMIT 40`,
      `%${query}%`,
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-20 text-center text-secondary">
        no results found for &ldquo;{query}&rdquo;
      </p>
    );
  }

  return (
    <div className="columns-2 gap-6 sm:columns-3 lg:columns-4">
      {items.map((item) => (
        <div key={item.id} className="mb-6 break-inside-avoid">
          <ProductCard
            slug={item.slug}
            title={item.title}
            price={item.price}
            currency={item.currency}
            images={item.images}
            vendorName={item.vendorName}
            sourceUrl={item.sourceUrl}
            type={item.type}
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
