"use client";

import { create } from "zustand";

type SearchFilters = {
  priceMin?: number;
  priceMax?: number;
  type?: "DIRECT" | "AGGREGATED" | "ALL";
  vendor?: string;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "newest";
};

type SearchStore = {
  query: string;
  filters: SearchFilters;
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
};

const defaultFilters: SearchFilters = {
  type: "ALL",
  sortBy: "relevance",
};

export const useSearch = create<SearchStore>()((set) => ({
  query: "",
  filters: defaultFilters,

  setQuery: (query) => set({ query }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
