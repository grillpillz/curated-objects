"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function NewListingPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const priceStr = form.get("price") as string;
    const priceInCents = Math.round(parseFloat(priceStr) * 100);

    if (isNaN(priceInCents) || priceInCents <= 0) {
      setError("please enter a valid price");
      setIsSubmitting(false);
      return;
    }

    const tagsRaw = (form.get("tags") as string) || "";
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const body = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      price: priceInCents,
      type: "DIRECT",
      tags,
      images: [],
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "failed to create listing");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="mb-4 text-3xl">listing created</h1>
        <p className="mb-8 text-secondary">
          your item is now live on curated objects.
        </p>
        <Button asChild>
          <a href="/seller/new">create another</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-8 text-3xl">create a listing</h1>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm text-secondary">
                title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="mid-century walnut credenza"
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            {/* description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm text-secondary">
                description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="describe the item's condition, dimensions, history..."
                rows={4}
                maxLength={2000}
                className="flex w-full rounded-2xl border border-border-subtle bg-canvas px-5 py-3 text-sm text-primary placeholder:text-secondary transition-colors duration-200 focus:border-accent-hover focus:outline-none focus:ring-1 focus:ring-accent-hover"
              />
            </div>

            {/* price */}
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm text-secondary">
                price (usd)
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="250.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            {/* tags */}
            <div className="space-y-2">
              <label htmlFor="tags" className="text-sm text-secondary">
                tags (comma-separated)
              </label>
              <Input
                id="tags"
                name="tags"
                placeholder="mid-century, walnut, credenza, storage"
              />
            </div>

            {/* image upload placeholder */}
            <div className="space-y-2">
              <label className="text-sm text-secondary">images</label>
              <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-border-subtle text-sm text-secondary">
                drag & drop images here (coming soon)
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "publishing..." : "publish listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
