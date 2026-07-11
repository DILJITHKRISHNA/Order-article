import * as XLSX from "xlsx";

import type { ArticleGroup, ParsedSku } from "@/types/article";
import { parseSku } from "@/lib/sku-parser";

const ARTICLES_PATH = "/data/articles.xlsx";

function findSkuColumn(rows: Record<string, unknown>[]): string | null {
  if (rows.length === 0) return null;

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  const skuKey = keys.find((key) => key.trim().toLowerCase() === "sku");
  if (skuKey) return skuKey;

  return keys[0] ?? null;
}

function groupByArticle(variants: ParsedSku[]): ArticleGroup[] {
  const map = new Map<string, ParsedSku[]>();

  for (const variant of variants) {
    const existing = map.get(variant.article) ?? [];
    existing.push(variant);
    map.set(variant.article, existing);
  }

  return Array.from(map.entries())
    .map(([articleNumber, articleVariants]) => ({
      articleNumber,
      variants: articleVariants.sort((a, b) =>
        `${a.color}-${a.size}`.localeCompare(`${b.color}-${b.size}`)
      ),
    }))
    .sort((a, b) => a.articleNumber.localeCompare(b.articleNumber));
}

export async function loadArticlesFromExcel(): Promise<ArticleGroup[]> {
  const response = await fetch(ARTICLES_PATH);

  if (!response.ok) {
    throw new Error(`Failed to load articles: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Articles workbook contains no sheets");
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const skuColumn = findSkuColumn(rows);

  if (!skuColumn) {
    throw new Error("Could not find SKU column in articles file");
  }

  const parsedVariants: ParsedSku[] = [];

  for (const row of rows) {
    const rawValue = row[skuColumn];
    const skuValue =
      typeof rawValue === "number" ? String(rawValue) : String(rawValue ?? "");
    const parsed = parseSku(skuValue);

    if (parsed) {
      parsedVariants.push(parsed);
    }
  }

  if (parsedVariants.length === 0) {
    throw new Error("No valid SKUs found in articles file");
  }

  return groupByArticle(parsedVariants);
}

export function getArticleGroup(
  catalog: ArticleGroup[],
  articleNumber: string
): ArticleGroup | undefined {
  return catalog.find((group) => group.articleNumber === articleNumber);
}
