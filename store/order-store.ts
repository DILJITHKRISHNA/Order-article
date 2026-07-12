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
  activeSectionId: string | null;
  catalog: ArticleGroup[];
  catalogLoaded: boolean;
  catalogError: string | null;

  setCustomer: (customer: Partial<CustomerDetails>) => void;
  setCatalog: (catalog: ArticleGroup[]) => void;
  setCatalogError: (error: string | null) => void;
  selectArticle: (articleNumber: string) => boolean;
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
    shopName: "",
    executiveName: "",
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
  activeSectionId: null,
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

    const newSection = createEmptySection(articleNumber);

    set((state) => ({
      sections: [...state.sections, newSection],
      activeSectionId: newSection.id,
    }));

    return true;
  },

  selectArticle: (articleNumber) => {
    const { catalog, sections } = get();
    const article = getArticleGroup(catalog, articleNumber);

    if (!article) return false;

    const existing = sections.find(
      (section) => section.articleNumber === articleNumber
    );

    if (existing) {
      set({ activeSectionId: existing.id });
      return true;
    }

    const newSection = createEmptySection(articleNumber);

    set((state) => ({
      sections: [...state.sections, newSection],
      activeSectionId: newSection.id,
    }));

    return true;
  },

  removeSection: (sectionId) =>
    set((state) => {
      const sections = state.sections.filter(
        (section) => section.id !== sectionId
      );
      const activeSectionId =
        state.activeSectionId === sectionId
          ? (sections.at(-1)?.id ?? null)
          : state.activeSectionId;

      return { sections, activeSectionId };
    }),

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
      activeSectionId: sectionId,
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
      activeSectionId: null,
    }),

  hydrateOrder: (customer, sections) =>
    set({
      customer,
      sections,
      activeSectionId: sections.at(-1)?.id ?? null,
    }),

  getUsedArticleNumbers: () => selectUsedArticleNumbers(get().sections),

  getOrderLineItems: () =>
    selectOrderLineItems(get().sections, get().catalog),

  getTotalPairs: () => selectTotalPairs(get().sections, get().catalog),
}));
