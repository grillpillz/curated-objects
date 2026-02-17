import type { ScraperFunction, ScrapedItem } from "../types";
import { marketplaceQueue } from "../rate-limiter";

/**
 * Etsy Open API v3 scraper.
 * Requires ETSY_API_KEY environment variable.
 * Docs: https://developer.etsy.com/documentation/
 */
export const etsyScraper: ScraperFunction = async ({
  searchTerms,
  vendorConfig,
  cursor,
}) => {
  const apiKey =
    (vendorConfig?.apiKey as string) ?? process.env.ETSY_API_KEY;
  if (!apiKey) throw new Error("ETSY_API_KEY is not configured");

  const offset = cursor ? parseInt(cursor) : 0;
  const limit = 20;
  const items: ScrapedItem[] = [];

  for (const term of searchTerms) {
    const result = await marketplaceQueue.add(async () => {
      const url = new URL(
        "https://openapi.etsy.com/v3/application/listings/active",
      );
      url.searchParams.set("keywords", term);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      url.searchParams.set("sort_on", "created");
      url.searchParams.set("sort_order", "desc");
      // Home & Living taxonomy
      url.searchParams.set("taxonomy_id", "891");
      url.searchParams.set("includes", "images");

      const res = await fetch(url.toString(), {
        headers: { "x-api-key": apiKey },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Etsy API error ${res.status}: ${body}`);
      }

      return res.json();
    });

    if (!result) continue;

    const listings = result.results ?? [];
    for (const listing of listings) {
      const images =
        listing.images?.map(
          (img: { url_fullxfull: string }) => img.url_fullxfull,
        ) ?? [];

      items.push({
        externalId: String(listing.listing_id),
        title: listing.title,
        description: listing.description,
        price: Math.round(
          parseFloat(listing.price?.amount ?? "0") /
            parseFloat(listing.price?.divisor ?? "1") *
            100,
        ),
        currency: listing.price?.currency_code ?? "USD",
        imageUrls: images.slice(0, 5),
        sourceUrl: listing.url ?? `https://www.etsy.com/listing/${listing.listing_id}`,
        vendorName: "etsy",
      });
    }

    // Only paginate the first search term to stay within timeout
    if (searchTerms.indexOf(term) === 0 && listings.length === limit) {
      return {
        items,
        nextCursor: String(offset + limit),
      };
    }
  }

  return { items };
};
