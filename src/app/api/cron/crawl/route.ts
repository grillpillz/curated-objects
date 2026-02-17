import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Cron orchestrator: creates CrawlRun records for each active source
 * and kicks off the first /process call.
 * Triggered by Vercel Cron every 6 hours.
 */
export async function POST(req: NextRequest) {
  // Validate cron secret
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Get all active crawl sources
    const sources = await prisma.crawlSource.findMany({
      where: { status: "ACTIVE" },
    });

    if (sources.length === 0) {
      return NextResponse.json({ message: "no active sources" });
    }

    const runs = [];

    for (const source of sources) {
      // Create a CrawlRun
      const run = await prisma.crawlRun.create({
        data: {
          sourceId: source.id,
          status: "PENDING",
        },
      });
      runs.push(run);

      // Kick off the process worker (fire and forget)
      const baseUrl =
        process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : process.env.NEXT_PUBLIC_SUPABASE_URL
            ? "http://localhost:3000"
            : "http://localhost:3000";

      fetch(`${baseUrl}/api/cron/crawl/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
        },
        body: JSON.stringify({ runId: run.id }),
      }).catch((err) =>
        console.error(`Failed to kick off process for run ${run.id}:`, err),
      );
    }

    return NextResponse.json({
      message: `started ${runs.length} crawl runs`,
      runIds: runs.map((r) => r.id),
    });
  } catch (error) {
    console.error("Cron orchestrator error:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
