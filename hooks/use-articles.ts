"use client";

import { useEffect, useState } from "react";

import { loadArticlesFromExcel } from "@/lib/articles-loader";
import { useOrderStore } from "@/store/order-store";

export function useArticles() {
  const setCatalog = useOrderStore((state) => state.setCatalog);
  const setCatalogError = useOrderStore((state) => state.setCatalogError);
  const catalogLoaded = useOrderStore((state) => state.catalogLoaded);
  const catalogError = useOrderStore((state) => state.catalogError);
  const catalog = useOrderStore((state) => state.catalog);
  const [isLoading, setIsLoading] = useState(!catalogLoaded);

  useEffect(() => {
    if (catalogLoaded) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const articles = await loadArticlesFromExcel();
        if (!cancelled) {
          setCatalog(articles);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(
            error instanceof Error ? error.message : "Failed to load articles"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [catalogLoaded, setCatalog, setCatalogError]);

  return { catalog, isLoading, error: catalogError };
}
