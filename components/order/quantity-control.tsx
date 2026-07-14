"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantityControlProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  className?: string;
}

export function QuantityControl({
  value,
  onIncrement,
  onDecrement,
  min = 1,
  className,
}: QuantityControlProps) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={onDecrement}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus />
      </Button>
      <span
        className="min-w-8 text-center text-sm font-medium tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={onIncrement}
        aria-label="Increase quantity"
      >
        <Plus />
      </Button>
    </div>
  );
}
