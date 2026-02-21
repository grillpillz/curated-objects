export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  price?: string;
  thumbnail?: string;
  source: string; // site name like "etsy.com"
};

type SearchResponse = {
  results: WebSearchResult[];
  fromCache: boolean;
  error?: "not_configured" | "quota_exceeded" | "network_error";
};

// In-memory cache: normalized query → { results, timestamp }
const cache = new Map<
  string,
  { results: WebSearchResult[]; timestamp: number }
>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 500;

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

type GeminiChunk = {
  web?: { uri: string; title: string };
};

type GroundingSupport = {
  segment: { startIndex?: number; endIndex?: number; text?: string };
  groundingChunkIndices?: number[];
};

type GeminiCandidate = {
  content: { parts: { text: string }[] };
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: GeminiChunk[];
    groundingSupports?: GroundingSupport[];
  };
};

type ParsedProduct = {
  title: string;
  price?: string | null;
  description: string;
};

/**
 * Fetch product images via Google Custom Search Image API.
 * Makes a single call for the query, returns a map of lowercase title → image URL.
 */
async function fetchImageResults(
  query: string,
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;

  if (!apiKey || !cx) return imageMap;

  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&searchType=image&num=10`,
    );

    if (!res.ok) return imageMap;

    const data = await res.json();
    const items = data.items as
      | { title?: string; link?: string; image?: { contextLink?: string } }[]
      | undefined;

    if (!items) return imageMap;

    for (const item of items) {
      if (item.link && item.title) {
        imageMap.set(item.title.toLowerCase().trim(), item.link);
      }
    }
  } catch {
    // Image enrichment is best-effort
  }

  return imageMap;
}

/**
 * Match a product title to an image from the image search results.
 * Uses fuzzy word overlap matching.
 */
function findBestImage(
  productTitle: string,
  imageMap: Map<string, string>,
): string | undefined {
  const titleWords = new Set(
    productTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2),
  );

  let bestMatch: string | undefined;
  let bestScore = 0;

  for (const [imageTitle, imageUrl] of imageMap) {
    const imageWords = imageTitle.toLowerCase().split(/\s+/);
    let score = 0;
    for (const word of imageWords) {
      if (titleWords.has(word)) score++;
    }
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestMatch = imageUrl;
    }
  }

  return bestMatch;
}

function cacheResults(cacheKey: string, results: WebSearchResult[]) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(cacheKey, { results, timestamp: Date.now() });
}

/**
 * Process the raw Gemini API response into WebSearchResults.
 */
function processGeminiResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  imageMap: Map<string, string>,
  cacheKey: string,
): SearchResponse {
  const candidate: GeminiCandidate | undefined = data.candidates?.[0];

  if (!candidate) {
    return { results: [], fromCache: false, error: "network_error" };
  }

  const chunks = candidate.groundingMetadata?.groundingChunks ?? [];
  const supports = candidate.groundingMetadata?.groundingSupports ?? [];
  const responseText = candidate.content?.parts?.[0]?.text ?? "";

  // Try to parse structured product data from Gemini's response
  let parsedProducts: ParsedProduct[] = [];
  try {
    const jsonText = responseText
      .replace(/^```json?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      parsedProducts = parsed;
    }
  } catch {
    // Fallback: couldn't parse JSON
  }

  // Build a mapping: for each character offset in the response, which chunk index applies
  const offsetToChunkIndex = new Map<number, number>();
  for (const support of supports) {
    const start = support.segment.startIndex ?? 0;
    const chunkIdx = support.groundingChunkIndices?.[0];
    if (chunkIdx !== undefined) {
      offsetToChunkIndex.set(start, chunkIdx);
    }
  }

  if (parsedProducts.length > 0) {
    const results: WebSearchResult[] = [];
    const sortedOffsets = Array.from(offsetToChunkIndex.keys()).sort(
      (a, b) => a - b,
    );

    for (let i = 0; i < parsedProducts.length; i++) {
      const product = parsedProducts[i];
      if (!product.title) continue;

      // Find this product's title in the response to determine its offset
      const titleInJson = `"title": "${product.title.replace(/"/g, '\\"')}"`;
      const altTitleInJson = `"title":"${product.title.replace(/"/g, '\\"')}"`;
      let productOffset = responseText.indexOf(titleInJson);
      if (productOffset === -1) {
        productOffset = responseText.indexOf(altTitleInJson);
      }
      if (productOffset === -1) {
        productOffset = responseText.indexOf(product.title.substring(0, 30));
      }

      // Find the grounding chunk whose offset range covers this product
      let chunkIdx: number | undefined;
      if (productOffset !== -1) {
        for (let j = sortedOffsets.length - 1; j >= 0; j--) {
          if (sortedOffsets[j] <= productOffset) {
            chunkIdx = offsetToChunkIndex.get(sortedOffsets[j]);
            break;
          }
        }
      }

      // Fall back to round-robin distribution if offset matching fails
      if (chunkIdx === undefined && chunks.length > 0) {
        chunkIdx = i % chunks.length;
      }

      const chunk = chunkIdx !== undefined ? chunks[chunkIdx] : undefined;
      const url = chunk?.web?.uri ?? "";
      const source = chunk?.web?.title ?? "web";

      if (!url) continue;

      // Try to find a matching image from CSE image search
      const thumbnail = findBestImage(product.title, imageMap);

      results.push({
        title: product.title,
        url,
        snippet: product.description || "",
        price: product.price || undefined,
        thumbnail,
        source,
      });
    }

    // Deduplicate by title
    const seen = new Set<string>();
    const deduped = results.filter((r) => {
      const key = r.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    cacheResults(cacheKey, deduped);
    return { results: deduped, fromCache: false };
  }

  // Fallback: no parsed JSON — use grounding chunks directly
  const results: WebSearchResult[] = chunks
    .filter(
      (chunk): chunk is { web: { uri: string; title: string } } =>
        Boolean(chunk.web?.uri),
    )
    .map((chunk) => ({
      title: chunk.web.title,
      url: chunk.web.uri,
      snippet: "",
      source: chunk.web.title,
    }));

  cacheResults(cacheKey, results);
  return { results, fromCache: false };
}

/**
 * Search the web using Gemini's Google Search grounding tool.
 * Uses the existing GEMINI_API_KEY — no separate Google Custom Search setup needed.
 */
export async function fetchWebSearchResults(
  query: string,
): Promise<SearchResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { results: [], fromCache: false, error: "not_configured" };
  }

  // Check in-memory cache
  const cacheKey = normalizeQuery(query);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { results: cached.results, fromCache: true };
  }

  try {
    const geminiBody = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Search for "${query}" currently for sale online. Return ONLY a JSON array (no markdown, no explanation) where each element has: {"title": "product name", "price": "$XX" or null, "description": "one sentence about the item"}. Focus on actual product listings from marketplaces like Etsy, eBay, 1stDibs, Chairish, etc. Return 10-15 results.`,
            },
          ],
        },
      ],
      tools: [{ google_search: {} }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    const fetchOpts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: geminiBody,
    };

    // Run Gemini search and image search in parallel
    const [geminiRes, imageMap] = await Promise.all([
      fetch(geminiUrl, fetchOpts),
      fetchImageResults(query),
    ]);

    // On 429, wait 2s and retry once — per-minute quotas often reset quickly
    if (geminiRes.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      const retryRes = await fetch(geminiUrl, fetchOpts);
      if (retryRes.status === 429) {
        return { results: [], fromCache: false, error: "quota_exceeded" };
      }
      if (!retryRes.ok) {
        return { results: [], fromCache: false, error: "network_error" };
      }
      const data = await retryRes.json();
      return processGeminiResponse(data, imageMap, cacheKey);
    }

    if (!geminiRes.ok) {
      console.error(`Gemini Search error: ${geminiRes.status}`);
      return { results: [], fromCache: false, error: "network_error" };
    }

    const data = await geminiRes.json();
    return processGeminiResponse(data, imageMap, cacheKey);
  } catch (error) {
    console.error("Web search error:", error);
    return { results: [], fromCache: false, error: "network_error" };
  }
}
