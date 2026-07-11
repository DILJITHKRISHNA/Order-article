"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  customerSchema,
  type CustomerFormValues,
} from "@/schemas/customer-schema";
import { useOrderStore } from "@/store/order-store";

export function CustomerForm() {
  const customer = useOrderStore((state) => state.customer);
  const setCustomer = useOrderStore((state) => state.setCustomer);

  const {
    register,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    values: customer,
    mode: "onBlur",
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2">
        <Label htmlFor="orderNumber">Order Number</Label>
        <Input
          id="orderNumber"
          readOnly
          className="bg-muted/50 font-mono text-sm"
          {...register("orderNumber")}
        />
        {errors.orderNumber && (
          <p className="text-xs text-destructive">{errors.orderNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          placeholder="Enter customer name"
          {...register("customerName", {
            onChange: (event) =>
              setCustomer({ customerName: event.target.value }),
          })}
        />
        {errors.customerName && (
          <p className="text-xs text-destructive">
            {errors.customerName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="City or region"
          {...register("location", {
            onChange: (event) => setCustomer({ location: event.target.value }),
          })}
        />
        {errors.location && (
          <p className="text-xs text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="+1 555 000 0000"
          {...register("phoneNumber", {
            onChange: (event) =>
              setCustomer({ phoneNumber: event.target.value }),
          })}
        />
        {errors.phoneNumber && (
          <p className="text-xs text-destructive">
            {errors.phoneNumber.message}
          </p>
        )}
      </div>
    </div>
  );
}
