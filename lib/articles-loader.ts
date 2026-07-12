import * as XLSX from "xlsx";

import type { ArticleGroup, ParsedSku } from "@/types/article";
import { parseSku } from "@/lib/sku-parser";

const ARTICLES_PATH = "/data/articles.xlsx";

function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase();
}

function findColumn(
  keys: string[],
  candidates: string[]
): string | null {
  for (const candidate of candidates) {
    const match = keys.find(
      (key) => normalizeColumnName(key) === candidate.toLowerCase()
    );
    if (match) return match;
  }
  return null;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseRowFromSkuColumn(rawValue: unknown): ParsedSku | null {
  const skuValue = cellToString(rawValue);
  return parseSku(skuValue);
}

function parseRowFromSeparateColumns(
  row: Record<string, unknown>,
  articleColumn: string,
  colorColumn: string,
  sizeColumn: string
): ParsedSku | null {
  const article = cellToString(row[articleColumn]);
  const color = cellToString(row[colorColumn]);
  const size = cellToString(row[sizeColumn]);

  if (!article || !color || !size) return null;

  const sku = `${article}-${color}-${size}`;
  return { sku, article, color, size };
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

function parseRows(rows: Record<string, unknown>[]): ParsedSku[] {
  if (rows.length === 0) return [];

  const keys = Object.keys(rows[0]);
  const skuColumn = findColumn(keys, ["sku"]);
  const articleColumn = findColumn(keys, ["article", "article number", "articlenumber"]);
  const colorColumn = findColumn(keys, ["color", "colour", "color code"]);
  const sizeColumn = findColumn(keys, ["size"]);

  const parsedVariants: ParsedSku[] = [];
  const seenSkus = new Set<string>();

  for (const row of rows) {
    let parsed: ParsedSku | null = null;

    if (skuColumn) {
      parsed = parseRowFromSkuColumn(row[skuColumn]);
    } else if (articleColumn && colorColumn && sizeColumn) {
      parsed = parseRowFromSeparateColumns(
        row,
        articleColumn,
        colorColumn,
        sizeColumn
      );
    }

    if (parsed && !seenSkus.has(parsed.sku)) {
      seenSkus.add(parsed.sku);
      parsedVariants.push(parsed);
    }
  }

  return parsedVariants;
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

  const parsedVariants = parseRows(rows);

  if (parsedVariants.length === 0) {
    throw new Error(
      "No valid SKUs found in articles file. Expected a SKU column or ARTICLE, COLOR, and SIZE columns."
    );
  }

  return groupByArticle(parsedVariants);
}

export function getArticleGroup(
  catalog: ArticleGroup[],
  articleNumber: string
): ArticleGroup | undefined {
  return catalog.find((group) => group.articleNumber === articleNumber);
}
