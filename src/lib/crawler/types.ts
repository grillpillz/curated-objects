export type ScrapedItem = {
  externalId: string;
  title: string;
  description?: string;
  price: number; // cents USD
  currency: string;
  imageUrls: string[];
  sourceUrl: string;
  vendorName: string;
};

export type ScraperResult = {
  items: ScrapedItem[];
  nextCursor?: string;
};

export type ScraperConfig = {
  searchTerms: string[];
  baseUrl: string;
  vendorConfig?: Record<string, unknown>;
  cursor?: string;
};

export type ScraperFunction = (config: ScraperConfig) => Promise<ScraperResult>;
