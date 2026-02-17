import Image from "next/image";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  slug: string;
  title: string;
  price: number;
  currency?: string;
  images: string[];
  vendorName?: string | null;
  sourceUrl?: string | null;
  type: "DIRECT" | "AGGREGATED";
  className?: string;
};

export function ProductCard({
  slug,
  title,
  price,
  currency = "USD",
  images,
  vendorName,
  type,
  className,
}: ProductCardProps) {
  const href = type === "DIRECT" ? `/product/${slug}` : undefined;

  const content = (
    <div
      className={cn(
        "group cursor-pointer space-y-3 transition-transform duration-300 hover:scale-[1.02]",
        className,
      )}
    >
      {/* image — takes ~85% of visual space */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-border-subtle">
        {images[0] ? (
          <Image
            src={images[0]}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-secondary text-sm">
            no image
          </div>
        )}
      </div>

      {/* info line */}
      <div className="flex items-baseline justify-between gap-2 px-1">
        <p className="truncate text-sm font-medium text-primary lowercase">
          {title}
        </p>
        <p className="shrink-0 text-sm text-primary">
          {formatCurrency(price, currency)}
        </p>
      </div>

      {/* vendor source tag */}
      {vendorName && (
        <p className="px-1 text-xs text-secondary lowercase">
          via {vendorName}
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
