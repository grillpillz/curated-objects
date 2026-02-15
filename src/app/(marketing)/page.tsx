import { SearchBox } from "@/components/features/search-box";
import { ProductCard } from "@/components/features/product-card";

const PLACEHOLDER_ITEMS = [
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
  {
    id: "3",
    title: "hand-thrown ceramic vase",
    price: 8500,
    images: [],
    type: "DIRECT" as const,
  },
  {
    id: "4",
    title: "vintage kilim pillow set",
    price: 12000,
    images: [],
    vendorName: "chairish",
    type: "AGGREGATED" as const,
  },
  {
    id: "5",
    title: "teak nesting tables",
    price: 34000,
    images: [],
    type: "DIRECT" as const,
  },
  {
    id: "6",
    title: "art deco vanity mirror",
    price: 22500,
    images: [],
    vendorName: "1stdibs",
    type: "AGGREGATED" as const,
  },
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

      {/* trending section */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <h2 className="mb-8 text-2xl">trending now</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {PLACEHOLDER_ITEMS.map((item) => (
            <ProductCard key={item.id} {...item} />
          ))}
        </div>
      </section>

      {/* collections preview */}
      <section className="border-t border-border-subtle py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-8 text-2xl">curated collections</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {["scandinavian minimal", "art deco revival", "japanese wabi-sabi"].map(
              (collection) => (
                <div
                  key={collection}
                  className="flex aspect-[4/3] items-end rounded-2xl border border-border-subtle bg-border-subtle/50 p-6 transition-all duration-300 hover:shadow-sm"
                >
                  <h3 className="text-xl">{collection}</h3>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-border-subtle py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-sm text-secondary md:flex-row md:justify-between">
          <p>&copy; 2026 curated objects</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary">terms</a>
            <a href="#" className="hover:text-primary">privacy</a>
            <a href="#" className="hover:text-primary">contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
