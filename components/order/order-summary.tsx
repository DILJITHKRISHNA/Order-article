"use client";

import { useMemo } from "react";
import { Package, Trash2 } from "lucide-react";

import { QuantityControl } from "@/components/order/quantity-control";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { selectOrderLineItems, selectTotalPairs } from "@/lib/order-selectors";
import { useOrderStore } from "@/store/order-store";

export function OrderSummary() {
  const rows = useOrderStore((state) => state.rows);
  const catalog = useOrderStore((state) => state.catalog);
  const removeOrderRow = useOrderStore((state) => state.removeOrderRow);
  const incrementRowQty = useOrderStore((state) => state.incrementRowQty);
  const decrementRowQty = useOrderStore((state) => state.decrementRowQty);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const articleCompare = a.article.localeCompare(b.article, undefined, {
          numeric: true,
        });
        if (articleCompare !== 0) return articleCompare;

        const colorCompare = a.color.localeCompare(b.color);
        if (colorCompare !== 0) return colorCompare;

        return Number(a.size) - Number(b.size);
      }),
    [rows]
  );

  const orderedItems = useMemo(
    () => selectOrderLineItems(rows, catalog),
    [rows, catalog]
  );
  const totalPairs = useMemo(
    () => selectTotalPairs(rows, catalog),
    [rows, catalog]
  );

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Package className="size-4" />
            Order Summary
          </span>
          <Badge variant="secondary">{totalPairs} pairs</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items added yet. Select sizes above to add lines here.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.map((row) => {
                  const isOrdered = row.qty > 0;

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(!isOrdered && "text-muted-foreground")}
                    >
                      <TableCell className="font-medium">{row.article}</TableCell>
                      <TableCell>{row.color}</TableCell>
                      <TableCell>{row.size}</TableCell>
                      <TableCell className="text-right">
                        <QuantityControl
                          value={row.qty}
                          onIncrement={() => incrementRowQty(row.id)}
                          onDecrement={() => decrementRowQty(row.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeOrderRow(row.id)}
                          aria-label="Remove line"
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Items in order</h3>
              {orderedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No items ordered yet. Increase quantity above to include sizes
                  in your order.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedItems.map((item) => (
                      <TableRow key={item.sku}>
                        <TableCell className="font-medium">
                          {item.article}
                        </TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {item.qty}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium">Total Pairs</span>
                <span className="text-lg font-semibold tabular-nums">
                  {totalPairs}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
