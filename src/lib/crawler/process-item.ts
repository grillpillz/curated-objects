import { prisma } from "@/lib/db";
import { analyzeImage, generateEmbedding } from "@/lib/ai";
import { generateSlug } from "@/lib/slug";
import { geminiQueue } from "./rate-limiter";
import type { ScrapedItem } from "./types";

const CRAWLER_USER_ID =
  process.env.CRAWLER_SYSTEM_USER_ID ?? "00000000-0000-0000-0000-000000000000";

/**
 * Process a single scraped item through the AI pipeline and store it.
 * Returns "created" | "skipped" | "error".
 */
export async function processItem(
  item: ScrapedItem,
): Promise<"created" | "skipped" | "error"> {
  const sourceItemId = `${item.vendorName}:${item.externalId}`;

  try {
    // 1. Dedup check
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM items WHERE source_item_id = $1 LIMIT 1`,
      sourceItemId,
    );
    if (existing.length > 0) return "skipped";

    // 2. Image analysis (rate-limited)
    let description = item.description ?? "";
    let tags: string[] = [];

    if (item.imageUrls[0]) {
      try {
        const analysis = await geminiQueue.add(() =>
          analyzeImage(item.imageUrls[0]),
        );
        if (analysis) {
          description = analysis.description;
          tags = analysis.tags;
        }
      } catch {
        // If image analysis fails, use title as description
        description = description || item.title;
        tags = item.title.toLowerCase().split(/\s+/).filter(Boolean);
      }
    } else {
      description = description || item.title;
      tags = item.title.toLowerCase().split(/\s+/).filter(Boolean);
    }

    // 3. Generate embedding (rate-limited)
    const textForEmbedding = [item.title, description, ...tags].join(" ");
    const embedding = await geminiQueue.add(() =>
      generateEmbedding(textForEmbedding),
    );
    if (!embedding) return "error";

    // 4. Generate slug
    const slug = generateSlug(item.title);

    // 5. Insert with ON CONFLICT safety net
    await prisma.$queryRawUnsafe(
      `INSERT INTO items (
        id, title, description, price, currency, type, status,
        source_url, vendor_name, source_item_id, images, tags,
        embedding, slug, seller_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 'AGGREGATED', 'AVAILABLE',
        $5, $6, $7, $8, $9,
        $10::vector, $11, $12::uuid, NOW(), NOW()
      ) ON CONFLICT (source_item_id) DO NOTHING`,
      item.title,
      description,
      item.price,
      item.currency,
      item.sourceUrl,
      item.vendorName,
      sourceItemId,
      item.imageUrls,
      tags,
      JSON.stringify(embedding),
      slug,
      CRAWLER_USER_ID,
    );

    return "created";
  } catch (error) {
    console.error(`Failed to process item ${sourceItemId}:`, error);
    return "error";
  }
}
