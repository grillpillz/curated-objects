import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/db";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.item.findUnique({
    where: { slug },
    include: { seller: { select: { id: true, email: true } } },
  });

  if (!product || product.status !== "AVAILABLE") {
    notFound();
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* image gallery */}
      <div className="space-y-4">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-border-subtle">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-secondary">
              no image available
            </div>
          )}
        </div>
      </div>

      {/* product details */}
      <div className="flex flex-col gap-6 lg:py-4">
        <div>
          <h1 className="text-3xl md:text-4xl">{product.title}</h1>
          <p className="mt-2 text-2xl font-medium text-primary">
            {formatCurrency(product.price, product.currency)}
          </p>
        </div>

        {product.description && (
          <p className="leading-relaxed text-secondary">
            {product.description}
          </p>
        )}

        {/* tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-subtle px-3 py-1 text-xs text-secondary lowercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* action buttons */}
        <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
          {product.type === "DIRECT" ? (
            <>
              <Button size="lg" className="flex-1">
                add to cart
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                save to favorites
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" className="flex-1" asChild>
                <a
                  href={product.sourceUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  view on {product.vendorName ?? "source"}
                </a>
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                save to favorites
              </Button>
            </>
          )}
        </div>

        {/* metadata */}
        {product.vendorName && (
          <p className="text-xs text-secondary">
            via {product.vendorName}
          </p>
        )}
      </div>
    </div>
  );
}
