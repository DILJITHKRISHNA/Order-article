import { getArticleGroup } from "@/lib/articles-loader";
import type { ArticleGroup } from "@/types/article";
import type { ArticleSection, OrderLineItem } from "@/types/order";

export function selectOrderLineItems(
  sections: ArticleSection[],
  catalog: ArticleGroup[]
): OrderLineItem[] {
  const items: OrderLineItem[] = [];

  for (const section of sections) {
    const article = getArticleGroup(catalog, section.articleNumber);
    if (!article) continue;

    for (const variant of article.variants) {
      const qty = section.quantities[variant.sku] ?? 0;
      if (qty > 0) {
        items.push({
          article: variant.article,
          color: variant.color,
          size: variant.size,
          qty,
          sku: variant.sku,
        });
      }
    }
  }

  return items;
}

export function selectTotalPairs(
  sections: ArticleSection[],
  catalog: ArticleGroup[]
): number {
  return selectOrderLineItems(sections, catalog).reduce(
    (total, item) => total + item.qty,
    0
  );
}

export function selectUsedArticleNumbers(sections: ArticleSection[]): string[] {
  return sections.map((section) => section.articleNumber);
}
