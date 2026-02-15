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

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
