"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { GenreFilter } from "@/lib/genova-genre";

type GenreFilterContextValue = {
  selectedGenre: GenreFilter;
  setSelectedGenre: (g: GenreFilter) => void;
};

const GenreFilterContext = createContext<GenreFilterContextValue | null>(null);

export function GenreFilterProvider({ children }: { children: ReactNode }) {
  const [selectedGenre, setSelectedGenreState] = useState<GenreFilter>("All");
  const setSelectedGenre = useCallback((g: GenreFilter) => {
    setSelectedGenreState(g);
  }, []);

  const value = useMemo(
    () => ({
      selectedGenre,
      setSelectedGenre,
    }),
    [selectedGenre, setSelectedGenre],
  );

  return <GenreFilterContext.Provider value={value}>{children}</GenreFilterContext.Provider>;
}

export function useGenreFilter(): GenreFilterContextValue {
  const ctx = useContext(GenreFilterContext);
  if (!ctx) {
    throw new Error("useGenreFilter must be used within GenreFilterProvider");
  }
  return ctx;
}
