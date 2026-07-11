"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ArticleCombobox } from "@/components/order/article-combobox";
import { VariantTable } from "@/components/order/variant-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getArticleGroup } from "@/lib/articles-loader";
import { selectUsedArticleNumbers } from "@/lib/order-selectors";
import { useOrderStore } from "@/store/order-store";
import type { ArticleGroup } from "@/types/article";
import type { ArticleSection } from "@/types/order";

interface ArticleSectionCardProps {
  section: ArticleSection;
  catalog: ArticleGroup[];
  index: number;
}

export function ArticleSectionCard({
  section,
  catalog,
  index,
}: ArticleSectionCardProps) {
  const removeSection = useOrderStore((state) => state.removeSection);
  const updateSectionArticle = useOrderStore(
    (state) => state.updateSectionArticle
  );
  const incrementQuantity = useOrderStore((state) => state.incrementQuantity);
  const decrementQuantity = useOrderStore((state) => state.decrementQuantity);
  const sections = useOrderStore((state) => state.sections);

  const article = getArticleGroup(catalog, section.articleNumber);
  const usedArticles = useMemo(
    () =>
      selectUsedArticleNumbers(sections).filter(
        (articleNumber) => articleNumber !== section.articleNumber
      ),
    [sections, section.articleNumber]
  );

  const handleArticleSelect = (articleNumber: string) => {
    const updated = updateSectionArticle(section.id, articleNumber);
    if (!updated) {
      toast.error("This article is already added to the order");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            Article Section {index + 1}
            {article && (
              <Badge variant="secondary">{article.variants.length} SKUs</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Select an article to view all color and size combinations.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => removeSection(section.id)}
          aria-label={`Remove article section ${index + 1}`}
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm">
          <ArticleCombobox
            catalog={catalog}
            value={section.articleNumber}
            onSelect={handleArticleSelect}
            disabledArticles={usedArticles}
          />
        </div>

        {article ? (
          <VariantTable
            variants={article.variants}
            quantities={section.quantities}
            onIncrement={(sku) => incrementQuantity(section.id, sku)}
            onDecrement={(sku) => decrementQuantity(section.id, sku)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Choose an article to load variants.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
