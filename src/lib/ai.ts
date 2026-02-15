const OPENAI_API_URL = "https://api.openai.com/v1";

/**
 * Generate a text embedding using OpenAI text-embedding-3-small (1536 dimensions).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OPENAI_API_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI embedding error: ${res.status}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * Analyze an image using GPT-4o-mini and return descriptive keywords/tags.
 */
export async function analyzeImage(imageUrl: string): Promise<{
  description: string;
  tags: string[];
}> {
  const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a vintage furniture and home goods expert. Analyze the image and return a JSON object with: 'description' (a short, descriptive sentence about the item) and 'tags' (an array of 5-10 relevant keywords for search).",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: "Describe this item for a vintage home goods marketplace.",
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI vision error: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}
