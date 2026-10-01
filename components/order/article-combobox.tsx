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

function rankArticleMatch(articleNumber: string, query: string): number {
  const normalizedArticle = articleNumber.toLowerCase();

  if (normalizedArticle === query) return 3;
  if (normalizedArticle.startsWith(query)) return 2;
  if (normalizedArticle.includes(query)) return 1;
  return 0;
}

function sortArticlesForSearch(
  catalog: ArticleGroup[],
  query: string,
  selected: string | null
): ArticleGroup[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    if (!selected) return catalog;

    const selectedArticle = catalog.find(
      (article) => article.articleNumber === selected
    );
    if (!selectedArticle) return catalog;

    return [
      selectedArticle,
      ...catalog.filter((article) => article.articleNumber !== selected),
    ];
  }

  return catalog
    .map((article) => ({
      article,
      rank: rankArticleMatch(article.articleNumber, normalizedQuery),
    }))
    .filter((item) => item.rank > 0)
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.article.articleNumber.localeCompare(
        b.article.articleNumber,
        undefined,
        { numeric: true }
      );
    })
    .map((item) => item.article);
}

function ArticleCommandList({
  catalog,
  value,
  disabledSet,
  onSelect,
}: ArticleCommandListProps) {
  const [search, setSearch] = React.useState("");
  const articles = React.useMemo(
    () => sortArticlesForSearch(catalog, search, value),
    [catalog, search, value]
  );

  return (
    <Command shouldFilter={false} filter={() => 1}>
      <CommandInput
        placeholder="Search by article number..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No article found.</CommandEmpty>
        <CommandGroup>
          {articles.map((article) => {
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
  const popoverContentRef = React.useRef<HTMLDivElement>(null);
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

    const closeOnScroll = (event: Event) => {
      const target = event.target;
      const popover = popoverContentRef.current;

      // cmdk scrolls the results list as you type; that must not dismiss the popover.
      if (
        popover &&
        target instanceof Node &&
        popover.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

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
      <PopoverContent
        ref={popoverContentRef}
        className="w-[var(--anchor-width)] p-0"
        align="start"
      >
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
