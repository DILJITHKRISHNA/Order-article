export interface ParsedSku {
  sku: string;
  article: string;
  color: string;
  size: string;
}

export interface ArticleGroup {
  articleNumber: string;
  variants: ParsedSku[];
}
