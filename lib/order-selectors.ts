import { getArticleGroup } from "@/lib/articles-loader";
import { sizeMatchesRange } from "@/lib/size-range";
import type { ArticleGroup } from "@/types/article";
import type { OrderLineItem, OrderRow } from "@/types/order";

export function getSplitSizesForRange(
  article: string,
  color: string,
  sizeRange: string,
  catalog: ArticleGroup[]
): string[] {
  const articleGroup = getArticleGroup(catalog, article);
  if (!articleGroup) return [];

  return articleGroup.splitVariants
    .filter(
      (variant) =>
        variant.color === color && sizeMatchesRange(variant.size, sizeRange)
    )
    .map((variant) => variant.size)
    .filter((size, index, sizes) => sizes.indexOf(size) === index)
    .sort((a, b) => Number(a) - Number(b));
}

export function selectOrderLineItems(
  rows: OrderRow[],
  catalog: ArticleGroup[]
): OrderLineItem[] {
  const items: OrderLineItem[] = [];

  for (const row of rows) {
    if (!row.size || row.qty < 1) continue;

    const availableSizes = getSplitSizesForRange(
      row.article,
      row.color,
      row.sizeRange,
      catalog
    );
    if (!availableSizes.includes(row.size)) continue;

    items.push({
      article: row.article,
      color: row.color,
      size: row.size,
      qty: row.qty,
      sku: `${row.article}-${row.color}-${row.size}`,
    });
  }

  return items;
}

export function selectTotalPairs(
  rows: OrderRow[],
  catalog: ArticleGroup[]
): number {
  return selectOrderLineItems(rows, catalog).reduce(
    (total, item) => total + item.qty,
    0
  );
}

export function buildOrderRowKey(
  article: string,
  color: string,
  sizeRange: string
): string {
  return `${article}-${color}-${sizeRange}`;
}

export function groupSizeVariantsByColor(
  variants: { article: string; color: string; size: string; sku: string }[]
): { color: string; sizes: string[] }[] {
  const map = new Map<string, Set<string>>();

  for (const variant of variants) {
    const sizes = map.get(variant.color) ?? new Set<string>();
    sizes.add(variant.size);
    map.set(variant.color, sizes);
  }

  return Array.from(map.entries())
    .map(([color, sizes]) => ({
      color,
      sizes: Array.from(sizes).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
    }))
    .sort((a, b) => a.color.localeCompare(b.color));
}
