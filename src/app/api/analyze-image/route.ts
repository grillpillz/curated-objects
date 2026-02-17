import { NextRequest, NextResponse } from "next/server";
import { analyzeImage, generateEmbedding } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "image_url is required" },
        { status: 400 },
      );
    }

    // analyze the image with Gemini 2.0 Flash vision
    const analysis = await analyzeImage(imageUrl);

    // generate an embedding from the description for vector search
    const embedding = await generateEmbedding(analysis.description);

    return NextResponse.json({
      description: analysis.description,
      tags: analysis.tags,
      embedding,
    });
  } catch (error) {
    console.error("POST /api/analyze-image error:", error);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
