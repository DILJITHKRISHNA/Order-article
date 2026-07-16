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
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="orderNumber">Order Number</Label>
        <Input
          id="orderNumber"
          readOnly
          className="bg-muted/50 font-mono text-sm"
          {...register("orderNumber")}
        />
        {errors.orderNumber && (
          <p className="text-xs font-normal text-destructive">
            {errors.orderNumber.message}
          </p>
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
          <p className="text-xs font-normal text-destructive">
            {errors.customerName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shopName">Shop Name</Label>
        <Input
          id="shopName"
          placeholder="Shop name (optional)"
          {...register("shopName", {
            onChange: (event) => setCustomer({ shopName: event.target.value }),
          })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="executiveName">Executive Name</Label>
        <Input
          id="executiveName"
          placeholder="Executive name (optional)"
          {...register("executiveName", {
            onChange: (event) =>
              setCustomer({ executiveName: event.target.value }),
          })}
        />
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
          <p className="text-xs font-normal text-destructive">
            {errors.location.message}
          </p>
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
          <p className="text-xs font-normal text-destructive">
            {errors.phoneNumber.message}
          </p>
        )}
      </div>
    </div>
  );
}
