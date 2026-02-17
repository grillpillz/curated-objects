import { NextRequest, NextResponse } from "next/server";
import { processItem } from "@/lib/crawler/process-item";
import type { ScrapedItem } from "@/lib/crawler/types";

/**
 * One-off ingest: accepts an array of ScrapedItem objects and processes them
 * through the AI pipeline. Used by live web search to cache results.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { items } = (await req.json()) as { items: ScrapedItem[] };
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "items array required" },
        { status: 400 },
      );
    }

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items.slice(0, 20)) {
      const outcome = await processItem(item);
      if (outcome === "created") created++;
      else if (outcome === "skipped") skipped++;
      else errors++;
    }

    return NextResponse.json({ created, skipped, errors });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
