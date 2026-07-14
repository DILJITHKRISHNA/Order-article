"use client";

import { Check } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { QuantityControl } from "@/components/order/quantity-control";
import type { ParsedSku } from "@/types/article";

interface VariantTableProps {
  variants: ParsedSku[];
  quantities?: Record<string, number>;
  onIncrement?: (sku: string) => void;
  onDecrement?: (sku: string) => void;
  readOnly?: boolean;
  checkedKeys?: Set<string>;
  onToggle?: (variant: ParsedSku) => void;
}

export function VariantTable({
  variants,
  quantities = {},
  onIncrement,
  onDecrement,
  readOnly = false,
  checkedKeys,
  onToggle,
}: VariantTableProps) {
  const selectable = Boolean(onToggle);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && <TableHead className="w-10">Add</TableHead>}
          <TableHead>Article</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>Size</TableHead>
          {!readOnly && !selectable && (
            <TableHead className="text-right">Qty</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((variant) => {
          const qty = quantities[variant.sku] ?? 0;
          const isChecked = checkedKeys?.has(variant.sku) ?? false;

          return (
            <TableRow key={variant.sku}>
              {selectable && (
                <TableCell>
                  <Button
                    type="button"
                    variant={isChecked ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => onToggle?.(variant)}
                    aria-label={`Add ${variant.article} ${variant.color} ${variant.size} to order`}
                    aria-pressed={isChecked}
                  >
                    <Check className={isChecked ? "opacity-100" : "opacity-0"} />
                  </Button>
                </TableCell>
              )}
              <TableCell className="font-medium">{variant.article}</TableCell>
              <TableCell>{variant.color}</TableCell>
              <TableCell>{variant.size}</TableCell>
              {!readOnly && !selectable && (
                <TableCell className="text-right">
                  <QuantityControl
                    value={qty}
                    onIncrement={() => onIncrement?.(variant.sku)}
                    onDecrement={() => onDecrement?.(variant.sku)}
                  />
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
