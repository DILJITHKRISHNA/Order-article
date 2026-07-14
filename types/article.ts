export interface ParsedSku {
  sku: string;
  article: string;
  color: string;
  size: string;
}

export interface ArticleGroup {
  articleNumber: string;
  /** Size ranges from the "size" sheet (e.g. 6X10). */
  sizeVariants: ParsedSku[];
  /** Individual sizes from the "split" sheet (e.g. 6, 7, 8). */
  splitVariants: ParsedSku[];
}
