"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ArticleGroup } from "@/types/article";

interface ArticleComboboxProps {
  catalog: ArticleGroup[];
  value: string | null;
  onSelect: (articleNumber: string) => void;
  disabledArticles?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function ArticleCombobox({
  catalog,
  value,
  onSelect,
  disabledArticles = [],
  placeholder = "Search article number...",
  disabled = false,
}: ArticleComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const disabledSet = React.useMemo(
    () => new Set(disabledArticles),
    [disabledArticles]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        {value ?? placeholder}
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by article number..." />
          <CommandList>
            <CommandEmpty>No article found.</CommandEmpty>
            <CommandGroup>
              {catalog.map((article) => {
                const isDisabled = disabledSet.has(article.articleNumber);
                const isSelected = value === article.articleNumber;

                return (
                  <CommandItem
                    key={article.articleNumber}
                    value={article.articleNumber}
                    disabled={isDisabled}
                    onSelect={() => {
                      if (isDisabled) return;
                      onSelect(article.articleNumber);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{article.articleNumber}</span>
                    <span className="text-muted-foreground">
                      {article.sizeVariants.length} size ranges
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
