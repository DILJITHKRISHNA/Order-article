import { z } from "zod";

export const customerSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  location: z.string().min(1, "Location is required"),
  phoneNumber: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d\s+\-()]+$/, "Phone number contains invalid characters"),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
