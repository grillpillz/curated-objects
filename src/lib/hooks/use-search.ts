"use client";

import { create } from "zustand";

type SearchStore = {
  query: string;
  setQuery: (query: string) => void;
};

export const useSearch = create<SearchStore>()((set) => ({
  query: "",
  setQuery: (query) => set({ query }),
}));
