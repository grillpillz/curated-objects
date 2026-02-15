import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { createListingSchema } from "@/lib/validations";
import { generateSlug } from "@/lib/slug";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // find the internal user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user || (user.role !== "SELLER" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "forbidden — seller role required" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const slug = generateSlug(data.title);

    const item = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        type: data.type,
        sourceUrl: data.sourceUrl,
        vendorName: data.vendorName,
        images: data.images,
        tags: data.tags,
        slug,
        sellerId: user.id,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const type = url.searchParams.get("type");

    const where: Record<string, unknown> = { status: "AVAILABLE" };
    if (type === "DIRECT" || type === "AGGREGATED") {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, email: true } },
        },
      }),
      prisma.item.count({ where }),
    ]);

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
    console.error("GET /api/listings error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
