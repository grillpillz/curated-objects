import { NextRequest, NextResponse } from "next/server";
import { fetchWebSearchResults } from "@/lib/web-search";
import { searchSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "";

    const parsed = searchSchema.safeParse({ query });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid search params", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { results, error } = await fetchWebSearchResults(parsed.data.query);

    if (error) {
      return NextResponse.json({ results: [], error });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 },
    );
  }
}
