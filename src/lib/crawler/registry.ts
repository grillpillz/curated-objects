import type { ScraperFunction } from "./types";
import { etsyScraper } from "./scrapers/etsy";
import { chairishScraper } from "./scrapers/chairish";

const scrapers: Record<string, ScraperFunction> = {
  etsy: etsyScraper,
  chairish: chairishScraper,
};

export function getScraper(vendorName: string): ScraperFunction | undefined {
  return scrapers[vendorName.toLowerCase()];
}

export function getAvailableVendors(): string[] {
  return Object.keys(scrapers);
}
