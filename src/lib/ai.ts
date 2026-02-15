const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Generate a text embedding using Gemini gemini-embedding-001 (768 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const res = await fetch(
    `${GEMINI_API_URL}/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini embedding error: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

/**
 * Analyze an image using Gemini 2.0 Flash and return descriptive keywords/tags.
 */
export async function analyzeImage(imageUrl: string): Promise<{
  description: string;
  tags: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // Gemini requires base64-encoded image data (no direct URL support)
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    throw new Error(`Failed to fetch image: ${imageRes.status}`);
  }
  const imageBuffer = await imageRes.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const mimeType = imageRes.headers.get("content-type") || "image/jpeg";

  const res = await fetch(
    `${GEMINI_API_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'You are a vintage furniture and home goods expert. Analyze the image and return a JSON object with: "description" (a short, descriptive sentence about the item) and "tags" (an array of 5-10 relevant keywords for search).',
              },
              {
                inlineData: { mimeType, data: base64Image },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 300,
        },
      }),
    },
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini vision error: ${res.status} - ${errorBody}`);
  }

  const data = await res.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content);
}
