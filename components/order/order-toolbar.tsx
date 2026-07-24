"use client";

import { useEffect, useState } from "react";
import { Download, FolderOpen, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

import { ArticleCombobox } from "@/components/order/article-combobox";
import { Button } from "@/components/ui/button";
import { exportOrderToPdf } from "@/lib/export-order";
import { submitOrderToAdmin } from "@/lib/submit-order";
import { selectOrderLineItems } from "@/lib/order-selectors";
import {
  clearOrderFromStorage,
  hasSavedOrderInStorage,
  loadOrderFromStorage,
  saveSubmittedOrderToStorage,
} from "@/lib/storage";
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
  const rows = useOrderStore((state) => state.rows);
  const selectedArticleNumber = useOrderStore(
    (state) => state.selectedArticleNumber
  );
  const selectArticle = useOrderStore((state) => state.selectArticle);
  const resetOrder = useOrderStore((state) => state.resetOrder);
  const hydrateOrder = useOrderStore((state) => state.hydrateOrder);
  const [canLoadSavedOrder, setCanLoadSavedOrder] = useState(false);

  useEffect(() => {
    setCanLoadSavedOrder(hasSavedOrderInStorage());
  }, [customer, rows]);

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

    const items = selectOrderLineItems(rows, catalog);
    if (items.length === 0) {
      toast.error("Add items with quantity before submitting");
      return;
    }

    const submittedAt = new Date().toISOString();

    setIsSubmitting(true);
    try {
      await submitOrderToAdmin(customer, items);
      clearOrderFromStorage();
      resetOrder();
      setCanLoadSavedOrder(false);
      toast.success("Order submitted successfully");
    } catch (error) {
      saveSubmittedOrderToStorage({
        customer,
        items,
        submittedAt,
      });
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

    const items = selectOrderLineItems(rows, catalog);
    if (items.length === 0) {
      toast.error("Add items with quantity before exporting");
      return;
    }

    setIsExporting(true);
    try {
      await exportOrderToPdf(customer, items);
      toast.success("Order exported to PDF");
    } catch {
      toast.error("Failed to export order");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoad = () => {
    const savedOrder = loadOrderFromStorage();
    if (!savedOrder) {
      setCanLoadSavedOrder(false);
      toast.error("No saved order found on this device");
      return;
    }

    hydrateOrder(savedOrder.customer, savedOrder.rows);
    toast.success("Saved order restored");
  };

  const handleReset = () => {
    clearOrderFromStorage();
    resetOrder();
    setCanLoadSavedOrder(false);
    toast.success("New order started");
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex w-full max-w-md flex-col gap-3">
        <span className="text-base font-bold">Select Article</span>
        <ArticleCombobox
          catalog={catalog}
          value={selectedArticleNumber}
          onSelect={handleArticleSelect}
          placeholder="Search article number..."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleLoad}
          disabled={!canLoadSavedOrder}
        >
          <FolderOpen data-icon="inline-start" />
          Load
        </Button>
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
          {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleReset}>
          <RotateCcw data-icon="inline-start" />
          New Order
        </Button>
      </div>
    </div>
  );
}
