"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FolderOpen,
  Plus,
  RotateCcw,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { ArticleCombobox } from "@/components/order/article-combobox";
import { Button } from "@/components/ui/button";
import { exportOrderToExcel } from "@/lib/export-order";
import { submitOrderToAdmin } from "@/lib/submit-order";
import {
  selectOrderLineItems,
  selectUsedArticleNumbers,
} from "@/lib/order-selectors";
import {
  loadOrderFromStorage,
  saveOrderToStorage,
} from "@/lib/storage";
import { customerSchema } from "@/schemas/customer-schema";
import { useOrderStore } from "@/store/order-store";
import type { ArticleGroup } from "@/types/article";

interface OrderToolbarProps {
  catalog: ArticleGroup[];
}

export function OrderToolbar({ catalog }: OrderToolbarProps) {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customer = useOrderStore((state) => state.customer);
  const sections = useOrderStore((state) => state.sections);
  const addSection = useOrderStore((state) => state.addSection);
  const resetOrder = useOrderStore((state) => state.resetOrder);
  const hydrateOrder = useOrderStore((state) => state.hydrateOrder);

  const usedArticleNumbers = useMemo(
    () => selectUsedArticleNumbers(sections),
    [sections]
  );

  const handleAddSection = () => {
    if (!selectedArticle) {
      toast.error("Select an article to add");
      return;
    }

    const added = addSection(selectedArticle);
    if (added) {
      toast.success(`Article ${selectedArticle} added`);
      setSelectedArticle(null);
      return;
    }

    toast.error("This article is already in the order");
  };

  const handleSave = () => {
    const validation = customerSchema.safeParse(customer);
    if (!validation.success) {
      toast.error("Complete customer details before saving");
      return;
    }

    saveOrderToStorage({
      customer,
      sections,
      savedAt: new Date().toISOString(),
    });
    toast.success("Order saved to local storage");
  };

  const handleLoad = () => {
    const saved = loadOrderFromStorage();
    if (!saved) {
      toast.info("No saved order found");
      return;
    }

    hydrateOrder(saved.customer, saved.sections);
    toast.success("Saved order loaded");
  };

  const handleSubmitOrder = async () => {
    const validation = customerSchema.safeParse(customer);
    if (!validation.success) {
      toast.error("Complete customer details before submitting");
      return;
    }

    const items = selectOrderLineItems(sections, catalog);
    if (items.length === 0) {
      toast.error("Add items with quantity before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOrderToAdmin(customer, items);
      toast.success("Order submitted successfully");
      resetOrder();
      setSelectedArticle(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit order"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    const validation = customerSchema.safeParse(customer);
    if (!validation.success) {
      toast.error("Complete customer details before exporting");
      return;
    }

    const items = selectOrderLineItems(sections, catalog);
    if (items.length === 0) {
      toast.error("Add items with quantity before exporting");
      return;
    }

    setIsExporting(true);
    try {
      await exportOrderToExcel(customer, items);
      toast.success("Order exported to Excel");
    } catch {
      toast.error("Failed to export order");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    resetOrder();
    setSelectedArticle(null);
    toast.success("New order started");
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex w-full max-w-md flex-col gap-2">
        <span className="text-sm font-medium">Add Article Section</span>
        <div className="flex gap-2">
          <div className="flex-1">
            <ArticleCombobox
              catalog={catalog}
              value={selectedArticle}
              onSelect={setSelectedArticle}
              disabledArticles={usedArticleNumbers}
              placeholder="Search article number..."
            />
          </div>
          <Button type="button" onClick={handleAddSection}>
            <Plus data-icon="inline-start" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void handleSubmitOrder()}
          disabled={isSubmitting}
        >
          <Send data-icon="inline-start" />
          {isSubmitting ? "Submitting..." : "Submit Order"}
        </Button>
        <Button type="button" variant="outline" onClick={handleLoad}>
          <FolderOpen data-icon="inline-start" />
          Load
        </Button>
        <Button type="button" variant="outline" onClick={handleSave}>
          <Save data-icon="inline-start" />
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleExport()}
          disabled={isExporting}
        >
          <Download data-icon="inline-start" />
          {isExporting ? "Exporting..." : "Export Excel"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleReset}>
          <RotateCcw data-icon="inline-start" />
          New Order
        </Button>
      </div>
    </div>
  );
}
