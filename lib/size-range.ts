export function parseSizeRange(range: string): number[] {
  const normalized = range.trim().toUpperCase().replace(",", ".");

  const rangeMatch = normalized.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);

    if (Number.isNaN(start) || Number.isNaN(end)) return [];

    if (start > end) return [start];

    const sizes: number[] = [];
    for (let value = start; value <= end; value += 1) {
      sizes.push(value);
    }
    return sizes;
  }

  const single = Number(normalized);
  if (!Number.isNaN(single)) return [single];

  return [];
}

export function sizeMatchesRange(size: string, sizeRange: string): boolean {
  const numericSize = Number(size);
  if (Number.isNaN(numericSize)) return false;

  return parseSizeRange(sizeRange).includes(numericSize);
}
