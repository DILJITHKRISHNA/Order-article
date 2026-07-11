import type { ParsedSku } from "@/types/article";

export function parseSku(rawSku: string): ParsedSku | null {
  const sku = rawSku.trim();
  if (!sku) return null;

  const parts = sku.split("-");
  if (parts.length < 3) return null;

  const [article, color, ...sizeParts] = parts;
  const size = sizeParts.join("-");

  if (!article || !color || !size) return null;

  return { sku, article, color, size };
}
