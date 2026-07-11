"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuantityControl } from "@/components/order/quantity-control";
import type { ParsedSku } from "@/types/article";

interface VariantTableProps {
  variants: ParsedSku[];
  quantities: Record<string, number>;
  onIncrement: (sku: string) => void;
  onDecrement: (sku: string) => void;
}

export function VariantTable({
  variants,
  quantities,
  onIncrement,
  onDecrement,
}: VariantTableProps) {
  return (
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
        {variants.map((variant) => {
          const qty = quantities[variant.sku] ?? 0;

          return (
            <TableRow key={variant.sku}>
              <TableCell className="font-medium">{variant.article}</TableCell>
              <TableCell>{variant.color}</TableCell>
              <TableCell>{variant.size}</TableCell>
              <TableCell className="text-right">
                <QuantityControl
                  value={qty}
                  onIncrement={() => onIncrement(variant.sku)}
                  onDecrement={() => onDecrement(variant.sku)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
