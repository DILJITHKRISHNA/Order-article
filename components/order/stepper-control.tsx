"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepperControlProps {
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  className?: string;
}

export function StepperControl({
  value,
  onIncrement,
  onDecrement,
  disabled = false,
  className,
}: StepperControlProps) {
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={onDecrement}
        disabled={disabled}
        aria-label="Previous size"
      >
        <Minus />
      </Button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums">
        {value || "—"}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={onIncrement}
        disabled={disabled}
        aria-label="Next size"
      >
        <Plus />
      </Button>
    </div>
  );
}
