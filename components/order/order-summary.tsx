"use client";

import { useMemo } from "react";
import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  selectOrderLineItems,
  selectTotalPairs,
} from "@/lib/order-selectors";
import { useOrderStore } from "@/store/order-store";

export function OrderSummary() {
  const sections = useOrderStore((state) => state.sections);
  const catalog = useOrderStore((state) => state.catalog);

  const lineItems = useMemo(
    () => selectOrderLineItems(sections, catalog),
    [sections, catalog]
  );
  const totalPairs = useMemo(
    () => selectTotalPairs(sections, catalog),
    [sections, catalog]
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
        <CardDescription>
          Live summary of items with quantity greater than zero.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lineItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items added yet. Select articles and set quantities to build your
            order.
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
              {lineItems.map((item) => (
                <TableRow key={item.sku}>
                  <TableCell className="font-medium">{item.article}</TableCell>
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

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm font-medium">Total Pairs</span>
          <span className="text-lg font-semibold tabular-nums">{totalPairs}</span>
        </div>
      </CardContent>
    </Card>
  );
}
