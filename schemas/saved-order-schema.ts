import { z } from "zod";

const customerDraftSchema = z.object({
  orderNumber: z.string(),
  customerName: z.string(),
  shopName: z.string(),
  executiveName: z.string(),
  location: z.string(),
  phoneNumber: z.string(),
});

const orderRowSchema = z.object({
  id: z.string().min(1),
  article: z.string().min(1),
  color: z.string().min(1),
  sizeRange: z.string().min(1),
  size: z.string().min(1),
  qty: z.number().int().min(1),
});

export const savedOrderSchema = z.object({
  customer: customerDraftSchema,
  rows: z.array(orderRowSchema),
  savedAt: z.string().min(1),
});

export type SavedOrderPayload = z.infer<typeof savedOrderSchema>;
