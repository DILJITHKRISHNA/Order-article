"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookUser } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  customerSchema,
  type CustomerFormValues,
} from "@/schemas/customer-schema";
import { dealerSchema } from "@/schemas/dealer-schema";
import { useOrderStore } from "@/store/order-store";
import type { Dealer } from "@/types/order";

const MAX_SUGGESTIONS = 6;

/** Suggestions are optional: any failure just means no suggestions. */
async function fetchDealers(): Promise<Dealer[] | null> {
  try {
    const response = await fetch("/api/dealers", { credentials: "include" });
    if (!response.ok) return null;
    return ((await response.json()) as { dealers: Dealer[] }).dealers;
  } catch {
    return null;
  }
}

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

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSavingDealer, setIsSavingDealer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchDealers().then((list) => {
      if (!cancelled && list) setDealers(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const query = customer.shopName.trim().toLowerCase();
    if (!query) return [];
    return dealers
      .filter(
        (dealer) =>
          dealer.customerName.toLowerCase().includes(query) ||
          dealer.shopName.toLowerCase().includes(query)
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [dealers, customer.shopName]);

  const applyDealer = (dealer: Dealer) => {
    setCustomer({
      customerName: dealer.customerName,
      shopName: dealer.shopName,
      location: dealer.location,
      phoneNumber: dealer.phoneNumber,
      // Executive can differ per order: only overwrite when the dealer has one saved.
      ...(dealer.executiveName ? { executiveName: dealer.executiveName } : {}),
    });
    setShowSuggestions(false);
  };

  const handleSaveDealer = async () => {
    const parsed = dealerSchema.safeParse({
      customerName: customer.customerName,
      shopName: customer.shopName,
      executiveName: customer.executiveName,
      location: customer.location,
      phoneNumber: customer.phoneNumber,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Fill in the dealer details first");
      return;
    }

    setIsSavingDealer(true);
    try {
      const response = await fetch("/api/dealers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Failed to save dealer");
        return;
      }
      toast.success(`${parsed.data.shopName} saved as a dealer`);
      const list = await fetchDealers();
      if (list) setDealers(list);
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setIsSavingDealer(false);
    }
  };

  const shopNameField = register("shopName", {
    onChange: (event) => {
      setCustomer({ shopName: event.target.value });
      setShowSuggestions(true);
    },
    // Delay so a click on a suggestion registers before the list closes.
    onBlur: () => setTimeout(() => setShowSuggestions(false), 150),
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

      <div className="relative space-y-2">
        <Label htmlFor="shopName">Shop Name</Label>
        <Input
          id="shopName"
          placeholder="Enter shop name"
          autoComplete="off"
          {...shopNameField}
          onFocus={() => setShowSuggestions(true)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {suggestions.map((dealer) => (
              <li key={dealer.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  // mousedown fires before the input's blur, so the pick isn't lost.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyDealer(dealer);
                  }}
                  className="flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent"
                >
                  <span className="font-medium">{dealer.shopName}</span>
                  <span className="text-xs text-muted-foreground">
                    {[dealer.customerName, dealer.location, dealer.phoneNumber]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {errors.shopName && (
          <p className="text-xs font-normal text-destructive">
            {errors.shopName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          placeholder="Customer name (optional)"
          {...register("customerName", {
            onChange: (event) =>
              setCustomer({ customerName: event.target.value }),
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

      <div className="flex items-end sm:col-span-2 lg:col-span-3 lg:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSaveDealer()}
          disabled={isSavingDealer}
        >
          <BookUser data-icon="inline-start" />
          {isSavingDealer ? "Saving..." : "Add Dealer"}
        </Button>
      </div>
    </div>
  );
}
