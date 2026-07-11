"use client";

import { VariantTable } from "@/components/order/variant-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getArticleGroup } from "@/lib/articles-loader";
import { useOrderStore } from "@/store/order-store";
import type { ArticleGroup } from "@/types/article";

interface ActiveArticlePanelProps {
  catalog: ArticleGroup[];
}

export function ActiveArticlePanel({ catalog }: ActiveArticlePanelProps) {
  const sections = useOrderStore((state) => state.sections);
  const activeSectionId = useOrderStore((state) => state.activeSectionId);
  const incrementQuantity = useOrderStore((state) => state.incrementQuantity);
  const decrementQuantity = useOrderStore((state) => state.decrementQuantity);

  const activeSection =
    sections.find((section) => section.id === activeSectionId) ??
    sections.at(-1) ??
    null;

  if (!activeSection) return null;

  const article = getArticleGroup(catalog, activeSection.articleNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Article {activeSection.articleNumber}
          {article && (
            <Badge variant="secondary">{article.variants.length} SKUs</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Set quantities for each color and size. Previously selected articles
          remain in the order summary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {article ? (
          <VariantTable
            variants={article.variants}
            quantities={activeSection.quantities}
            onIncrement={(sku) => incrementQuantity(activeSection.id, sku)}
            onDecrement={(sku) => decrementQuantity(activeSection.id, sku)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Article data not found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
