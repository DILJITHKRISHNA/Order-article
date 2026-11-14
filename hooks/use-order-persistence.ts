"use client";

import { useEffect } from "react";

import { upsertDraft } from "@/lib/drafts";
import type { Zone } from "@/lib/zones";
import { useOrderStore } from "@/store/order-store";

/** Keeps the unsubmitted order saved in this browser as it changes. */
export function useOrderPersistence(zone: Zone) {
  const customer = useOrderStore((state) => state.customer);
  const rows = useOrderStore((state) => state.rows);

  useEffect(() => {
    upsertDraft(zone, customer, rows);
  }, [zone, customer, rows]);
}
