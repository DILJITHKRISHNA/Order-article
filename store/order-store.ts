import { create } from "zustand";

import { getArticleGroup } from "@/lib/articles-loader";
import { generateOrderNumber } from "@/lib/order-number";
import {
  selectOrderLineItems,
  selectTotalPairs,
  selectUsedArticleNumbers,
} from "@/lib/order-selectors";
import type { ArticleGroup } from "@/types/article";
import type {
  ArticleSection,
  CustomerDetails,
  OrderLineItem,
} from "@/types/order";

interface OrderState {
  customer: CustomerDetails;
  sections: ArticleSection[];
  catalog: ArticleGroup[];
  catalogLoaded: boolean;
  catalogError: string | null;

  setCustomer: (customer: Partial<CustomerDetails>) => void;
  setCatalog: (catalog: ArticleGroup[]) => void;
  setCatalogError: (error: string | null) => void;
  addSection: (articleNumber: string) => boolean;
  removeSection: (sectionId: string) => void;
  updateSectionArticle: (sectionId: string, articleNumber: string) => boolean;
  setQuantity: (sectionId: string, sku: string, qty: number) => void;
  incrementQuantity: (sectionId: string, sku: string) => void;
  decrementQuantity: (sectionId: string, sku: string) => void;
  resetOrder: () => void;
  hydrateOrder: (customer: CustomerDetails, sections: ArticleSection[]) => void;
  getUsedArticleNumbers: () => string[];
  getOrderLineItems: () => OrderLineItem[];
  getTotalPairs: () => number;
}

function createEmptySection(articleNumber: string): ArticleSection {
  return {
    id: crypto.randomUUID(),
    articleNumber,
    quantities: {},
  };
}

function buildInitialCustomer(): CustomerDetails {
  return {
    orderNumber: generateOrderNumber(),
    customerName: "",
    location: "",
    phoneNumber: "",
  };
}

function clampQty(qty: number): number {
  return Math.max(0, qty);
}

export const useOrderStore = create<OrderState>((set, get) => ({
  customer: buildInitialCustomer(),
  sections: [],
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

  addSection: (articleNumber) => {
    const { catalog, sections } = get();
    const article = getArticleGroup(catalog, articleNumber);

    if (!article) return false;
    if (sections.some((section) => section.articleNumber === articleNumber)) {
      return false;
    }

    set((state) => ({
      sections: [...state.sections, createEmptySection(articleNumber)],
    }));

    return true;
  },

  removeSection: (sectionId) =>
    set((state) => ({
      sections: state.sections.filter((section) => section.id !== sectionId),
    })),

  updateSectionArticle: (sectionId, articleNumber) => {
    const { catalog, sections } = get();
    const article = getArticleGroup(catalog, articleNumber);

    if (!article) return false;
    if (
      sections.some(
        (section) =>
          section.articleNumber === articleNumber && section.id !== sectionId
      )
    ) {
      return false;
    }

    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === sectionId
          ? { ...section, articleNumber, quantities: {} }
          : section
      ),
    }));

    return true;
  },

  setQuantity: (sectionId, sku, qty) =>
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              quantities: {
                ...section.quantities,
                [sku]: clampQty(qty),
              },
            }
          : section
      ),
    })),

  incrementQuantity: (sectionId, sku) => {
    const section = get().sections.find((item) => item.id === sectionId);
    const current = section?.quantities[sku] ?? 0;
    get().setQuantity(sectionId, sku, current + 1);
  },

  decrementQuantity: (sectionId, sku) => {
    const section = get().sections.find((item) => item.id === sectionId);
    const current = section?.quantities[sku] ?? 0;
    get().setQuantity(sectionId, sku, current - 1);
  },

  resetOrder: () =>
    set({
      customer: buildInitialCustomer(),
      sections: [],
    }),

  hydrateOrder: (customer, sections) =>
    set({
      customer,
      sections,
    }),

  getUsedArticleNumbers: () => selectUsedArticleNumbers(get().sections),

  getOrderLineItems: () =>
    selectOrderLineItems(get().sections, get().catalog),

  getTotalPairs: () => selectTotalPairs(get().sections, get().catalog),
}));
