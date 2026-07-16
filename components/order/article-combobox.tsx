"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
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

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");

    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

interface ArticleCommandListProps {
  catalog: ArticleGroup[];
  value: string | null;
  disabledSet: Set<string>;
  onSelect: (articleNumber: string) => void;
}

function ArticleCommandList({
  catalog,
  value,
  disabledSet,
  onSelect,
}: ArticleCommandListProps) {
  return (
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
  );
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
  const isMobile = useIsMobile();

  const disabledSet = React.useMemo(
    () => new Set(disabledArticles),
    [disabledArticles]
  );

  const handleSelect = (articleNumber: string) => {
    onSelect(articleNumber);
    setOpen(false);
  };

  React.useEffect(() => {
    if (!open || isMobile) return;

    const closeOnScroll = () => setOpen(false);

    window.addEventListener("scroll", closeOnScroll, true);
    return () => window.removeEventListener("scroll", closeOnScroll, true);
  }, [open, isMobile]);

  const triggerLabel = (
    <>
      {value ?? placeholder}
      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
          onClick={() => setOpen(true)}
        >
          {triggerLabel}
        </Button>
        <CommandDialog
          open={open}
          onOpenChange={setOpen}
          title="Select Article"
          description="Search by article number"
        >
          <ArticleCommandList
            catalog={catalog}
            value={value}
            disabledSet={disabledSet}
            onSelect={handleSelect}
          />
        </CommandDialog>
      </>
    );
  }

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
          >
            {triggerLabel}
          </Button>
        }
      />
      <PopoverContent className="w-[var(--anchor-width)] p-0" align="start">
        <ArticleCommandList
          catalog={catalog}
          value={value}
          disabledSet={disabledSet}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
