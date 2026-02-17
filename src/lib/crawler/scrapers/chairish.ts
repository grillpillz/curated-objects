import * as cheerio from "cheerio";
import type { ScraperFunction, ScrapedItem } from "../types";
import { marketplaceQueue } from "../rate-limiter";

/**
 * Chairish HTML scraper using Cheerio.
 * Parses server-rendered product listing pages.
 */
export const chairishScraper: ScraperFunction = async ({
  searchTerms,
  cursor,
}) => {
  const page = cursor ? parseInt(cursor) : 1;
  const items: ScrapedItem[] = [];

  for (const term of searchTerms) {
    const html = await marketplaceQueue.add(async () => {
      const url = `https://www.chairish.com/shop/search?q=${encodeURIComponent(term)}&page=${page}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
      });

      if (!res.ok) {
        throw new Error(`Chairish fetch error: ${res.status}`);
      }

      return res.text();
    });

    if (!html) continue;

    const $ = cheerio.load(html);

    // Chairish product cards are in a grid with product data
    $("[data-product-id]").each((_, el) => {
      const $el = $(el);
      const externalId = $el.attr("data-product-id");
      const title = $el.find("[data-testid='product-title'], .product-title, h3, h2")
        .first()
        .text()
        .trim();
      const priceText = $el.find("[data-testid='product-price'], .product-price, .price")
        .first()
        .text()
        .trim();
      const imageUrl = $el.find("img").first().attr("src") ?? "";
      const linkPath = $el.find("a").first().attr("href") ?? "";

      if (!externalId || !title) return;

      // Parse price: "$1,850" -> 185000 (cents)
      const priceMatch = priceText.replace(/[^0-9.]/g, "");
      const priceCents = Math.round(parseFloat(priceMatch || "0") * 100);

      const sourceUrl = linkPath.startsWith("http")
        ? linkPath
        : `https://www.chairish.com${linkPath}`;

      items.push({
        externalId,
        title,
        price: priceCents,
        currency: "USD",
        imageUrls: imageUrl ? [imageUrl] : [],
        sourceUrl,
        vendorName: "chairish",
      });
    });

    // Only paginate first search term
    if (searchTerms.indexOf(term) === 0 && items.length >= 20) {
      return { items, nextCursor: String(page + 1) };
    }
  }

  return { items };
};
