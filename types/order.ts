export interface CustomerDetails {
  orderNumber: string;
  customerName: string;
  shopName: string;
  executiveName: string;
  location: string;
  phoneNumber: string;
}

export interface OrderRow {
  id: string;
  article: string;
  color: string;
  sizeRange: string;
  size: string;
  qty: number;
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
  rows: OrderRow[];
  savedAt: string;
}

export interface SubmittedOrderRecord {
  customer: CustomerDetails;
  items: OrderLineItem[];
  submittedAt: string;
}

export interface AdminOrderRow {
  id?: string;
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
  sku: string;
  submittedAt: string;
}
