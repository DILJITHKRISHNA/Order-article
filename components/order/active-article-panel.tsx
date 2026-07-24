"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";

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
import {
  buildOrderRowKey,
  groupSizeVariantsByColor,
} from "@/lib/order-selectors";
import { useOrderStore } from "@/store/order-store";
import type { ArticleGroup } from "@/types/article";

interface ActiveArticlePanelProps {
  catalog: ArticleGroup[];
}

export function ActiveArticlePanel({ catalog }: ActiveArticlePanelProps) {
  const selectedArticleNumber = useOrderStore(
    (state) => state.selectedArticleNumber
  );
  const rows = useOrderStore((state) => state.rows);
  const toggleOrderRow = useOrderStore((state) => state.toggleOrderRow);

  const article = selectedArticleNumber
    ? getArticleGroup(catalog, selectedArticleNumber)
    : undefined;

  const colorsWithSizes = useMemo(
    () => (article ? groupSizeVariantsByColor(article.sizeVariants) : []),
    [article]
  );

  const rangeQuantities = useMemo(() => {
    const quantities = new Map<string, number>();
    for (const row of rows) {
      const key = buildOrderRowKey(row.article, row.color, row.sizeRange);
      quantities.set(key, row.qty);
    }
    return quantities;
  }, [rows]);

  if (!selectedArticleNumber) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Article {selectedArticleNumber}
          {article && (
            <Badge variant="secondary">
              {colorsWithSizes.length} colors
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Select the colors and sizes you need. Click the same size again to add
          more quantity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {article ? (
          colorsWithSizes.map(({ color, sizes }) => (
            <div
              key={color}
              className="rounded-lg border bg-background p-4 space-y-3"
            >
              <p className="text-sm font-semibold">{color}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const rowKey = buildOrderRowKey(
                    selectedArticleNumber,
                    color,
                    size
                  );
                  const qty = rangeQuantities.get(rowKey);
                  const isSelected = qty !== undefined;

                  return (
                    <Button
                      key={rowKey}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        toggleOrderRow(selectedArticleNumber, color, size)
                      }
                      aria-pressed={isSelected}
                    >
                      <Check
                        className={isSelected ? "opacity-100" : "opacity-0"}
                      />
                      {size}
                      {isSelected && qty > 1 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 min-w-5 justify-center px-1.5 tabular-nums"
                        >
                          {qty}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Article data not found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
