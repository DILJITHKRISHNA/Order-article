import type { CustomerDetails, OrderLineItem } from "@/types/order";

interface SubmitOrderResponse {
  success: boolean;
  orderNumber: string;
  submittedAt: string;
}

export async function submitOrderToAdmin(
  customer: CustomerDetails,
  items: OrderLineItem[]
): Promise<SubmitOrderResponse> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, items }),
  });

  const data = (await response.json()) as SubmitOrderResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to submit order");
  }

  return data;
}
