"use client";

import { useMemo, useState } from "react";
import { Download, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

import { ArticleCombobox } from "@/components/order/article-combobox";
import { Button } from "@/components/ui/button";
import { exportOrderToExcel } from "@/lib/export-order";
import { submitOrderToAdmin } from "@/lib/submit-order";
import { selectOrderLineItems } from "@/lib/order-selectors";
import { saveSubmittedOrderToStorage } from "@/lib/storage";
import { customerSchema } from "@/schemas/customer-schema";
import { useOrderStore } from "@/store/order-store";
import type { ArticleGroup } from "@/types/article";

interface OrderToolbarProps {
  catalog: ArticleGroup[];
}

export function OrderToolbar({ catalog }: OrderToolbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customer = useOrderStore((state) => state.customer);
  const sections = useOrderStore((state) => state.sections);
  const activeSectionId = useOrderStore((state) => state.activeSectionId);
  const selectArticle = useOrderStore((state) => state.selectArticle);
  const resetOrder = useOrderStore((state) => state.resetOrder);

  const activeArticleNumber = useMemo(() => {
    const activeSection =
      sections.find((section) => section.id === activeSectionId) ??
      sections.at(-1);
    return activeSection?.articleNumber ?? null;
  }, [sections, activeSectionId]);

  const handleArticleSelect = (articleNumber: string) => {
    const selected = selectArticle(articleNumber);
    if (!selected) {
      toast.error("Unable to select article");
    }
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

    const submittedAt = new Date().toISOString();

    saveSubmittedOrderToStorage({
      customer,
      items,
      submittedAt,
    });

    setIsSubmitting(true);
    try {
      await submitOrderToAdmin(customer, items);
      toast.success("Order submitted successfully");
      resetOrder();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `${error.message} A local backup was saved on this device.`
          : "Failed to submit order. A local backup was saved on this device."
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
    toast.success("New order started");
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex w-full max-w-md flex-col gap-2">
        <span className="text-base font-bold">Select Article</span>
        <ArticleCombobox
          catalog={catalog}
          value={activeArticleNumber}
          onSelect={handleArticleSelect}
          placeholder="Search article number..."
        />
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
