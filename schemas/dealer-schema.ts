import { z } from "zod";

import { customerSchema } from "@/schemas/customer-schema";

/** Order number is per-order, so it is not part of a saved dealer. */
export const dealerSchema = customerSchema.omit({ orderNumber: true });

export type DealerPayload = z.infer<typeof dealerSchema>;
