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
  let response: Response;

  try {
    response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer, items }),
    });
  } catch {
    throw new Error("Unable to reach the server. Please try again.");
  }

  let data: SubmitOrderResponse & { error?: string };

  try {
    data = (await response.json()) as SubmitOrderResponse & { error?: string };
  } catch {
    throw new Error("Unexpected server response while submitting the order.");
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to submit order");
  }

  return data;
}
