import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (!dbUser || dbUser.role !== "ADMIN") return null;
  return dbUser;
}

/** POST /api/admin/crawl/trigger — Manually trigger a crawl for a source */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sourceId } = await req.json();

  if (!sourceId) {
    return NextResponse.json(
      { error: "sourceId required" },
      { status: 400 },
    );
  }

  const source = await prisma.crawlSource.findUnique({
    where: { id: sourceId },
  });

  if (!source) {
    return NextResponse.json(
      { error: "source not found" },
      { status: 404 },
    );
  }

  // Create a CrawlRun
  const run = await prisma.crawlRun.create({
    data: {
      sourceId: source.id,
      status: "PENDING",
    },
  });

  // Kick off the process worker
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
    body: JSON.stringify({ runId: run.id }),
  }).catch((err) =>
    console.error(`Failed to kick off process for run ${run.id}:`, err),
  );

  return NextResponse.json({ runId: run.id, status: "triggered" });
}
