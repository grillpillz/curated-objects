import Link from "next/link";
import { SearchBox } from "@/components/features/search-box";

const TRENDING_SEARCHES = [
  "mid century modern furniture",
  "vintage brass lighting",
  "antique ceramic vases",
  "art deco barware",
  "bohemian textiles",
  "scandinavian design",
  "vintage palm tree lamp",
  "rattan peacock chair",
];

const COLLECTIONS = [
  { label: "scandinavian minimal", query: "scandinavian minimal vintage furniture" },
  { label: "art deco revival", query: "art deco vintage home decor" },
  { label: "japanese wabi-sabi", query: "japanese wabi sabi pottery ceramics" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* hero section */}
      <section className="flex flex-col items-center justify-center px-6 py-28 md:py-40">
        <h1 className="mb-4 text-center text-4xl tracking-tight md:text-6xl">
          find the perfect piece
        </h1>
        <p className="mb-10 max-w-lg text-center text-secondary">
          search across thousands of vintage and antique home goods from trusted
          sellers and curated marketplaces.
        </p>
        <SearchBox />
      </section>

      {/* trending searches */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <h2 className="mb-8 text-2xl">popular searches</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TRENDING_SEARCHES.map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="flex items-center rounded-xl border border-border-subtle px-5 py-4 text-sm text-secondary transition-all duration-200 hover:border-primary hover:text-primary"
            >
              {term}
            </Link>
          ))}
        </div>
      </section>

      {/* curated collections */}
      <section className="border-t border-border-subtle py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-8 text-2xl">browse by style</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map((collection) => (
              <Link
                key={collection.label}
                href={`/search?q=${encodeURIComponent(collection.query)}`}
                className="flex aspect-[4/3] items-end rounded-2xl border border-border-subtle bg-border-subtle/50 p-6 transition-all duration-300 hover:shadow-sm hover:border-primary"
              >
                <h3 className="text-xl">{collection.label}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-border-subtle py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-sm text-secondary md:flex-row md:justify-between">
          <p>&copy; 2026 curated objects</p>
        </div>
      </footer>
    </div>
  );
}
