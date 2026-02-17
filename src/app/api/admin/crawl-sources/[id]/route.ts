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

/** PATCH /api/admin/crawl-sources/[id] — Update a crawl source */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const source = await prisma.crawlSource.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(source);
}

/** DELETE /api/admin/crawl-sources/[id] — Delete a crawl source */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.crawlSource.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
