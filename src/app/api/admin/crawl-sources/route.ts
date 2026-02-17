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

/** GET /api/admin/crawl-sources — List all crawl sources */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sources = await prisma.crawlSource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { runs: true } },
    },
  });

  return NextResponse.json(sources);
}

/** POST /api/admin/crawl-sources — Create a new crawl source */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { vendorName, baseUrl, searchTerms, strategy, config } = body;

  if (!vendorName || !baseUrl || !searchTerms?.length) {
    return NextResponse.json(
      { error: "vendorName, baseUrl, and searchTerms are required" },
      { status: 400 },
    );
  }

  const source = await prisma.crawlSource.create({
    data: {
      vendorName,
      baseUrl,
      searchTerms,
      strategy: strategy ?? "api",
      config: config ?? undefined,
    },
  });

  return NextResponse.json(source, { status: 201 });
}
