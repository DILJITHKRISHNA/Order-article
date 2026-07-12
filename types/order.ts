export interface CustomerDetails {
  orderNumber: string;
  customerName: string;
  shopName: string;
  executiveName: string;
  location: string;
  phoneNumber: string;
}

export interface ArticleSection {
  id: string;
  articleNumber: string;
  /** SKU -> quantity */
  quantities: Record<string, number>;
}

export interface OrderLineItem {
  article: string;
  color: string;
  size: string;
  qty: number;
  sku: string;
}

export interface SavedOrder {
  customer: CustomerDetails;
  sections: ArticleSection[];
  savedAt: string;
}

export interface SubmittedOrderRecord {
  customer: CustomerDetails;
  items: OrderLineItem[];
  submittedAt: string;
}

export interface AdminOrderRow {
  orderNumber: string;
  customerName: string;
  shopName: string;
  executiveName: string;
  location: string;
  phoneNumber: string;
  article: string;
  color: string;
  size: string;
  qty: number;
  submittedAt: string;
}
