import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getScraper } from "@/lib/crawler/registry";
import { processItem } from "@/lib/crawler/process-item";

/**
 * Cron worker: processes one page of results for a CrawlRun.
 * Self-chains if more pages remain.
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
    const { runId, cursor } = await req.json();
    if (!runId) {
      return NextResponse.json({ error: "runId required" }, { status: 400 });
    }

    // Load the run + source
    const run = await prisma.crawlRun.findUnique({
      where: { id: runId },
      include: { source: true },
    });

    if (!run || !run.source) {
      return NextResponse.json({ error: "run not found" }, { status: 404 });
    }

    // Mark as running
    if (run.status === "PENDING") {
      await prisma.crawlRun.update({
        where: { id: runId },
        data: { status: "RUNNING", startedAt: new Date() },
      });
    }

    // Get the scraper for this vendor
    const scraper = getScraper(run.source.vendorName);
    if (!scraper) {
      await prisma.crawlRun.update({
        where: { id: runId },
        data: {
          status: "FAILED",
          errorMessage: `No scraper for vendor: ${run.source.vendorName}`,
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ error: "no scraper for vendor" });
    }

    // Scrape one page
    const result = await scraper({
      searchTerms: run.source.searchTerms,
      baseUrl: run.source.baseUrl,
      vendorConfig: (run.source.config as Record<string, unknown>) ?? {},
      cursor,
    });

    // Process each item through the AI pipeline
    let created = 0;
    let skipped = 0;

    for (const item of result.items) {
      const outcome = await processItem(item);
      if (outcome === "created") created++;
      else if (outcome === "skipped") skipped++;
    }

    // Update run stats
    await prisma.crawlRun.update({
      where: { id: runId },
      data: {
        itemsFound: { increment: result.items.length },
        itemsCreated: { increment: created },
        itemsSkipped: { increment: skipped },
      },
    });

    // Self-chain if more pages
    if (result.nextCursor) {
      const baseUrl =
        process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : "http://localhost:3000";

      fetch(`${baseUrl}/api/cron/crawl/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
        },
        body: JSON.stringify({ runId, cursor: result.nextCursor }),
      }).catch((err) =>
        console.error(`Failed to chain next page for run ${runId}:`, err),
      );

      return NextResponse.json({
        status: "processing",
        page: cursor ?? "0",
        created,
        skipped,
        nextCursor: result.nextCursor,
      });
    }

    // No more pages — mark as completed, update source
    await prisma.crawlRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await prisma.crawlSource.update({
      where: { id: run.source.id },
      data: { lastCrawlAt: new Date() },
    });

    return NextResponse.json({
      status: "completed",
      created,
      skipped,
      totalItems: result.items.length,
    });
  } catch (error) {
    console.error("Cron worker error:", error);

    // Try to mark run as failed
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body.runId) {
        await prisma.crawlRun.update({
          where: { id: body.runId },
          data: {
            status: "FAILED",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            completedAt: new Date(),
          },
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
