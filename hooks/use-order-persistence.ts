"use client";

import { useEffect } from "react";

import { hasCustomerDraft, saveOrderDraft } from "@/lib/storage";
import { useOrderStore } from "@/store/order-store";

export function useOrderPersistence() {
  const customer = useOrderStore((state) => state.customer);
  const rows = useOrderStore((state) => state.rows);

  useEffect(() => {
    if (rows.length > 0 || hasCustomerDraft(customer)) {
      saveOrderDraft(customer, rows);
    }
  }, [customer, rows]);
}
