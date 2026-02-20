import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'film-watchlist';

function getStoredWatchlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredWatchlist(slugs: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // localStorage might be full or disabled
  }
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setWatchlist(getStoredWatchlist());
    setIsLoaded(true);
  }, []);

  // Persist to localStorage whenever watchlist changes
  useEffect(() => {
    if (isLoaded) {
      setStoredWatchlist(watchlist);
    }
  }, [watchlist, isLoaded]);

  const addToWatchlist = useCallback((slug: string) => {
    setWatchlist((prev) => {
      if (prev.includes(slug)) return prev;
      return [...prev, slug];
    });
  }, []);

  const removeFromWatchlist = useCallback((slug: string) => {
    setWatchlist((prev) => prev.filter((s) => s !== slug));
  }, []);

  const toggleWatchlist = useCallback((slug: string) => {
    setWatchlist((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      return [...prev, slug];
    });
  }, []);

  const isInWatchlist = useCallback(
    (slug: string) => watchlist.includes(slug),
    [watchlist]
  );

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
  }, []);

  return {
    watchlist,
    isLoaded,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    clearWatchlist,
  };
}
