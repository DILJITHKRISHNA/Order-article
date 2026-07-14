import * as XLSX from "xlsx";

import type { ArticleGroup, ParsedSku } from "@/types/article";

const ARTICLES_PATH = "/data/size12.xlsx";

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

function buildSku(article: string, color: string, size: string): string {
  return `${article}-${color}-${size}`;
}

function parseSheetRows(
  rows: Record<string, unknown>[],
  articleCandidates: string[],
  colorCandidates: string[],
  sizeCandidates: string[]
): ParsedSku[] {
  if (rows.length === 0) return [];

  const keys = Object.keys(rows[0]);
  const articleColumn = findColumn(keys, articleCandidates);
  const colorColumn = findColumn(keys, colorCandidates);
  const sizeColumn = findColumn(keys, sizeCandidates);

  if (!articleColumn || !colorColumn || !sizeColumn) {
    return [];
  }

  const parsedVariants: ParsedSku[] = [];
  const seenSkus = new Set<string>();

  for (const row of rows) {
    const article = cellToString(row[articleColumn]);
    const color = cellToString(row[colorColumn]);
    const size = cellToString(row[sizeColumn]);

    if (!article || !color || !size) continue;

    const sku = buildSku(article, color, size);
    if (seenSkus.has(sku)) continue;

    seenSkus.add(sku);
    parsedVariants.push({ sku, article, color, size });
  }

  return parsedVariants;
}

function sortVariants(variants: ParsedSku[]): ParsedSku[] {
  return variants.sort((a, b) =>
    `${a.color}-${a.size}`.localeCompare(`${b.color}-${b.size}`, undefined, {
      numeric: true,
    })
  );
}

function groupByArticle(
  sizeVariants: ParsedSku[],
  splitVariants: ParsedSku[]
): ArticleGroup[] {
  const articleNumbers = new Set<string>();

  for (const variant of sizeVariants) {
    articleNumbers.add(variant.article);
  }
  for (const variant of splitVariants) {
    articleNumbers.add(variant.article);
  }

  return Array.from(articleNumbers)
    .map((articleNumber) => ({
      articleNumber,
      sizeVariants: sortVariants(
        sizeVariants.filter((variant) => variant.article === articleNumber)
      ),
      splitVariants: sortVariants(
        splitVariants.filter((variant) => variant.article === articleNumber)
      ),
    }))
    .sort((a, b) =>
      a.articleNumber.localeCompare(b.articleNumber, undefined, {
        numeric: true,
      })
    );
}

function readSheetRows(
  workbook: XLSX.WorkBook,
  sheetName: string
): Record<string, unknown>[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
}

export async function loadArticlesFromExcel(): Promise<ArticleGroup[]> {
  const response = await fetch(ARTICLES_PATH);

  if (!response.ok) {
    throw new Error(`Failed to load articles: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sizeSheetName = workbook.SheetNames.find(
    (name) => normalizeColumnName(name) === "size"
  );
  const splitSheetName = workbook.SheetNames.find(
    (name) => normalizeColumnName(name) === "split"
  );

  if (!sizeSheetName || !splitSheetName) {
    throw new Error(
      'Articles workbook must contain "size" and "split" sheets.'
    );
  }

  const sizeRows = readSheetRows(workbook, sizeSheetName);
  const splitRows = readSheetRows(workbook, splitSheetName);

  const sizeVariants = parseSheetRows(
    sizeRows,
    ["article", "article number", "articlenumber"],
    ["color", "colour", "color code"],
    ["size"]
  );

  const splitVariants = parseSheetRows(
    splitRows,
    ["article", "article number", "articlenumber"],
    ["color", "colour", "color code"],
    ["size"]
  );

  if (sizeVariants.length === 0) {
    throw new Error(
      'No valid rows found in the "size" sheet. Expected ARTICLE, COLOR, and SIZE columns.'
    );
  }

  if (splitVariants.length === 0) {
    throw new Error(
      'No valid rows found in the "split" sheet. Expected Article, Color, and Size columns.'
    );
  }

  return groupByArticle(sizeVariants, splitVariants);
}

export function getArticleGroup(
  catalog: ArticleGroup[],
  articleNumber: string
): ArticleGroup | undefined {
  return catalog.find((group) => group.articleNumber === articleNumber);
}
