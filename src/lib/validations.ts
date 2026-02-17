import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().int().positive(),
  currency: z.string().default("USD"),
  type: z.enum(["DIRECT", "AGGREGATED"]),
  sourceUrl: z.string().url().optional().nullable(),
  vendorName: z.string().max(100).optional().nullable(),
  images: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string()).max(20).default([]),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(500).optional(),
  imageUrl: z.string().url().optional(),
  type: z.enum(["DIRECT", "AGGREGATED", "ALL"]).default("ALL"),
  priceMin: z.number().int().nonnegative().optional(),
  priceMax: z.number().int().positive().optional(),
  sortBy: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export const createCrawlSourceSchema = z.object({
  vendorName: z.string().min(1).max(100),
  baseUrl: z.string().url(),
  searchTerms: z.array(z.string().min(1)).min(1).max(50),
  strategy: z.enum(["api", "html"]).default("api"),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateCrawlSourceSchema = createCrawlSourceSchema.partial().extend({
  status: z.enum(["ACTIVE", "PAUSED", "ERROR"]).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type CreateCrawlSourceInput = z.infer<typeof createCrawlSourceSchema>;
export type UpdateCrawlSourceInput = z.infer<typeof updateCrawlSourceSchema>;
