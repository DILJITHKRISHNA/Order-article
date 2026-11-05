import type { ArticleGroup } from "@/types/article";

/** Loads the article catalog for the logged-in user's zone. */
export async function loadArticles(): Promise<ArticleGroup[]> {
  const response = await fetch("/api/articles", { cache: "no-store" });

  let data: { articles?: ArticleGroup[]; error?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("Unexpected server response while loading articles.");
  }

  if (!response.ok || !data.articles) {
    throw new Error(data.error ?? `Failed to load articles: ${response.statusText}`);
  }

  return data.articles;
}

export function getArticleGroup(
  catalog: ArticleGroup[],
  articleNumber: string
): ArticleGroup | undefined {
  return catalog.find((group) => group.articleNumber === articleNumber);
}
