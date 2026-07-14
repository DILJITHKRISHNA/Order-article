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

  const checkedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const row of rows) {
      keys.add(buildOrderRowKey(row.article, row.color, row.sizeRange));
    }
    return keys;
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
          Select the colors and sizes you need. You can add the same article in
          multiple sizes.
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
                  const isChecked = checkedKeys.has(rowKey);

                  return (
                    <Button
                      key={rowKey}
                      type="button"
                      variant={isChecked ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        toggleOrderRow(selectedArticleNumber, color, size)
                      }
                      aria-pressed={isChecked}
                    >
                      <Check
                        className={isChecked ? "opacity-100" : "opacity-0"}
                      />
                      {size}
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
