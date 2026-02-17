import PQueue from "p-queue";

// Gemini free tier: ~15 RPM for embeddings, ~10 RPM for vision
// Use concurrency=2 with 1s interval to stay well within limits
export const geminiQueue = new PQueue({
  concurrency: 2,
  interval: 1000,
  intervalCap: 2,
});

// Marketplace request limiter (1 request per 2s to avoid blocks)
export const marketplaceQueue = new PQueue({
  concurrency: 1,
  interval: 2000,
  intervalCap: 1,
});
