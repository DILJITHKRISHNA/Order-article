import { create } from "zustand";

import { getArticleGroup } from "@/lib/articles-loader";
import { generateOrderNumber } from "@/lib/order-number";
import {
  buildOrderRowKey,
  getSplitSizesForRange,
  selectOrderLineItems,
  selectTotalPairs,
} from "@/lib/order-selectors";
import type { ArticleGroup } from "@/types/article";
import type { CustomerDetails, OrderLineItem, OrderRow } from "@/types/order";

interface OrderState {
  customer: CustomerDetails;
  selectedArticleNumber: string | null;
  rows: OrderRow[];
  catalog: ArticleGroup[];
  catalogLoaded: boolean;
  catalogError: string | null;

  setCustomer: (customer: Partial<CustomerDetails>) => void;
  setCatalog: (catalog: ArticleGroup[]) => void;
  setCatalogError: (error: string | null) => void;
  selectArticle: (articleNumber: string) => boolean;
  toggleOrderRow: (article: string, color: string, sizeRange: string) => void;
  removeOrderRow: (rowId: string) => void;
  setRowQty: (rowId: string, qty: number) => void;
  incrementRowQty: (rowId: string) => void;
  decrementRowQty: (rowId: string) => void;
  resetOrder: () => void;
  hydrateOrder: (customer: CustomerDetails, rows: OrderRow[]) => void;
  getOrderLineItems: () => OrderLineItem[];
  getTotalPairs: () => number;
  isRowChecked: (article: string, color: string, sizeRange: string) => boolean;
}

function buildInitialCustomer(): CustomerDetails {
  return {
    orderNumber: generateOrderNumber(),
    customerName: "",
    shopName: "",
    executiveName: "",
    location: "",
    phoneNumber: "",
  };
}

const MIN_ORDER_QTY = 1;

function clampQty(qty: number): number {
  return Math.max(MIN_ORDER_QTY, qty);
}

function createOrderRowsForRange(
  article: string,
  color: string,
  sizeRange: string,
  catalog: ArticleGroup[]
): OrderRow[] {
  const splitSizes = getSplitSizesForRange(article, color, sizeRange, catalog);

  return splitSizes.map((size) => ({
    id: crypto.randomUUID(),
    article,
    color,
    sizeRange,
    size,
    qty: MIN_ORDER_QTY,
  }));
}

export const useOrderStore = create<OrderState>((set, get) => ({
  customer: buildInitialCustomer(),
  selectedArticleNumber: null,
  rows: [],
  catalog: [],
  catalogLoaded: false,
  catalogError: null,

  setCustomer: (customer) =>
    set((state) => ({
      customer: { ...state.customer, ...customer },
    })),

  setCatalog: (catalog) =>
    set({
      catalog,
      catalogLoaded: true,
      catalogError: null,
    }),

  setCatalogError: (error) =>
    set({
      catalogError: error,
      catalogLoaded: true,
    }),

  selectArticle: (articleNumber) => {
    const { catalog } = get();
    const article = getArticleGroup(catalog, articleNumber);

    if (!article) return false;

    set({ selectedArticleNumber: articleNumber });
    return true;
  },

  toggleOrderRow: (article, color, sizeRange) => {
    const { rows, catalog } = get();
    const rowKey = buildOrderRowKey(article, color, sizeRange);
    const hasRows = rows.some(
      (row) =>
        buildOrderRowKey(row.article, row.color, row.sizeRange) === rowKey
    );

    if (hasRows) {
      set({
        rows: rows.filter(
          (row) =>
            buildOrderRowKey(row.article, row.color, row.sizeRange) !== rowKey
        ),
      });
      return;
    }

    set({
      rows: [
        ...rows,
        ...createOrderRowsForRange(article, color, sizeRange, catalog),
      ],
    });
  },

  removeOrderRow: (rowId) =>
    set((state) => ({
      rows: state.rows.filter((row) => row.id !== rowId),
    })),

  setRowQty: (rowId, qty) =>
    set((state) => ({
      rows: state.rows.map((row) =>
        row.id === rowId ? { ...row, qty: clampQty(qty) } : row
      ),
    })),

  incrementRowQty: (rowId) => {
    const row = get().rows.find((item) => item.id === rowId);
    const current = row?.qty ?? MIN_ORDER_QTY;
    get().setRowQty(rowId, current + 1);
  },

  decrementRowQty: (rowId) => {
    const row = get().rows.find((item) => item.id === rowId);
    const current = row?.qty ?? MIN_ORDER_QTY;
    if (current <= MIN_ORDER_QTY) return;
    get().setRowQty(rowId, current - 1);
  },

  resetOrder: () =>
    set({
      customer: buildInitialCustomer(),
      selectedArticleNumber: null,
      rows: [],
    }),

  hydrateOrder: (customer, rows) =>
    set({
      customer,
      rows,
      selectedArticleNumber: rows.at(-1)?.article ?? null,
    }),

  isRowChecked: (article, color, sizeRange) => {
    const rowKey = buildOrderRowKey(article, color, sizeRange);
    return get().rows.some(
      (row) =>
        buildOrderRowKey(row.article, row.color, row.sizeRange) === rowKey
    );
  },

  getOrderLineItems: () => selectOrderLineItems(get().rows, get().catalog),

  getTotalPairs: () => selectTotalPairs(get().rows, get().catalog),
}));
