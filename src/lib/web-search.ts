export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
  thumbnail?: string;
  source: string; // extracted domain
};

/**
 * Fetch real-time web search results from Google Custom Search API.
 * Scoped to vintage marketplace domains via the Custom Search Engine config.
 * Returns empty array if not configured or on error.
 */
export async function fetchWebSearchResults(
  query: string,
): Promise<WebSearchResult[]> {
  const key = process.env.GOOGLE_CUSTOM_SEARCH_KEY;
  const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;

  if (!key || !cx) return [];

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", key);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", `vintage ${query} for sale`);
    url.searchParams.set("num", "10");

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) return [];

    const data = await res.json();

    return (
      data.items?.map(
        (item: {
          title: string;
          link: string;
          snippet: string;
          pagemap?: {
            cse_thumbnail?: { src: string }[];
            cse_image?: { src: string }[];
          };
        }) => {
          const domain = new URL(item.link).hostname.replace("www.", "");
          const thumbnail =
            item.pagemap?.cse_thumbnail?.[0]?.src ??
            item.pagemap?.cse_image?.[0]?.src;

          return {
            title: item.title,
            url: item.link,
            snippet: item.snippet,
            thumbnail,
            source: domain,
          };
        },
      ) ?? []
    );
  } catch (error) {
    console.error("Web search error:", error);
    return [];
  }
}
