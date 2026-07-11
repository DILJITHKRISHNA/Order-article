import { z } from "zod";

import { customerSchema } from "@/schemas/customer-schema";

export const orderLineItemSchema = z.object({
  article: z.string().min(1),
  color: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().positive(),
  sku: z.string().min(1),
});

export const submitOrderSchema = z.object({
  customer: customerSchema,
  items: z.array(orderLineItemSchema).min(1, "Order must include at least one item"),
});

export type SubmitOrderPayload = z.infer<typeof submitOrderSchema>;
