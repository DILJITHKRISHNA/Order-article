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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAvailableSizesForRow,
  selectOrderLineItems,
  selectTotalPairs,
} from "@/lib/order-selectors";
import { useOrderStore } from "@/store/order-store";

export function OrderSummary() {
  const rows = useOrderStore((state) => state.rows);
  const catalog = useOrderStore((state) => state.catalog);
  const removeOrderRow = useOrderStore((state) => state.removeOrderRow);
  const setRowSize = useOrderStore((state) => state.setRowSize);
  const incrementRowQty = useOrderStore((state) => state.incrementRowQty);
  const decrementRowQty = useOrderStore((state) => state.decrementRowQty);

  const lineItems = useMemo(
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
        <CardDescription>
          Choose the exact size from the dropdown and set the quantity for each
          line.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No items added yet. Select sizes above to add lines here.
          </p>
        ) : (
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
              {rows.map((row) => {
                const availableSizes = getAvailableSizesForRow(row, catalog);

                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.article}</TableCell>
                    <TableCell>{row.color}</TableCell>
                    <TableCell>
                      {availableSizes.length > 0 ? (
                        <Select
                          value={row.selectedSize}
                          onValueChange={(value) => {
                            if (value) setRowSize(row.id, value);
                          }}
                        >
                          <SelectTrigger size="sm" className="w-full min-w-20">
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSizes.map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
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
        )}

        {lineItems.length > 0 && (
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm font-medium">Total Pairs</span>
            <span className="text-lg font-semibold tabular-nums">
              {totalPairs}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
