import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai";
import { searchSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const params = {
      query: url.searchParams.get("query") || undefined,
      imageUrl: url.searchParams.get("image_url") || undefined,
      type: url.searchParams.get("type") || "ALL",
      priceMin: url.searchParams.get("price_min")
        ? Number(url.searchParams.get("price_min"))
        : undefined,
      priceMax: url.searchParams.get("price_max")
        ? Number(url.searchParams.get("price_max"))
        : undefined,
      sortBy: url.searchParams.get("sort") || "relevance",
      page: Number(url.searchParams.get("page")) || 1,
      limit: Number(url.searchParams.get("limit")) || 20,
    };

    const parsed = searchSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid search params", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { query, type, priceMin, priceMax, sortBy, page, limit } = parsed.data;

    if (!query) {
      return NextResponse.json({ items: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    // build WHERE conditions
    const conditions: string[] = [`i.status = 'AVAILABLE'`];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (type !== "ALL") {
      conditions.push(`i.type = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }

    if (priceMin !== undefined) {
      conditions.push(`i.price >= $${paramIndex}`);
      values.push(priceMin);
      paramIndex++;
    }

    if (priceMax !== undefined) {
      conditions.push(`i.price <= $${paramIndex}`);
      values.push(priceMax);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // ── Hybrid Search: Vector similarity + keyword match ──
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(query);
    } catch {
      // fall back to keyword-only if embedding fails
      console.warn("Embedding generation failed, falling back to keyword search");
    }

    let orderClause: string;
    if (embedding && sortBy === "relevance") {
      // hybrid: combine vector cosine similarity with keyword matching
      const embeddingParam = `$${paramIndex}`;
      values.push(JSON.stringify(embedding));
      paramIndex++;

      const queryParam = `$${paramIndex}`;
      values.push(`%${query}%`);
      paramIndex++;

      // add keyword match as a bonus
      conditions.push(
        `(i.embedding IS NOT NULL OR i.title ILIKE ${queryParam} OR array_to_string(i.tags, ' ') ILIKE ${queryParam})`,
      );

      orderClause = `ORDER BY
        CASE WHEN i.embedding IS NOT NULL
          THEN (1 - (i.embedding <=> ${embeddingParam}::vector))
          ELSE 0
        END * 0.7
        +
        CASE WHEN i.title ILIKE ${queryParam} THEN 0.3 ELSE 0 END
        DESC`;
    } else {
      // fallback: keyword search only
      const queryParam = `$${paramIndex}`;
      values.push(`%${query}%`);
      paramIndex++;

      conditions.push(
        `(i.title ILIKE ${queryParam} OR i.description ILIKE ${queryParam} OR array_to_string(i.tags, ' ') ILIKE ${queryParam})`,
      );

      switch (sortBy) {
        case "price_asc":
          orderClause = "ORDER BY i.price ASC";
          break;
        case "price_desc":
          orderClause = "ORDER BY i.price DESC";
          break;
        case "newest":
          orderClause = "ORDER BY i.created_at DESC";
          break;
        default:
          orderClause = "ORDER BY i.created_at DESC";
      }
    }

    const finalWhere = conditions.join(" AND ");
    const offset = (page - 1) * limit;

    // count query
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM items i WHERE ${finalWhere}`,
      ...values.slice(0, values.length - (embedding ? 2 : 1)),
    );
    const total = Number(countResult[0]?.count ?? 0);

    // main query
    const items = await prisma.$queryRawUnsafe(
      `SELECT i.id, i.title, i.description, i.price, i.currency, i.type, i.status,
              i.source_url as "sourceUrl", i.vendor_name as "vendorName",
              i.images, i.tags, i.slug, i.created_at as "createdAt"
       FROM items i
       WHERE ${finalWhere}
       ${orderClause}
       LIMIT ${limit} OFFSET ${offset}`,
      ...values,
    );

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
