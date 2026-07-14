"use client";

import { AlertCircle, PackageSearch } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { ActiveArticlePanel } from "@/components/order/active-article-panel";
import { CustomerForm } from "@/components/order/customer-form";
import { OrderSummary } from "@/components/order/order-summary";
import { OrderToolbar } from "@/components/order/order-toolbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles } from "@/hooks/use-articles";
import { useOrderStore } from "@/store/order-store";

function LoadingState() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-5" />
          Failed to load articles
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function OrderPage() {
  const { catalog, isLoading, error } = useArticles();
  const selectedArticleNumber = useOrderStore(
    (state) => state.selectedArticleNumber
  );
  const rows = useOrderStore((state) => state.rows);
  const showWorkspace = Boolean(selectedArticleNumber) || rows.length > 0;

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Customer Details</CardTitle>
                <CardDescription>
                  Order number is generated automatically. Fill in customer
                  information before submitting your order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Articles</CardTitle>
                <CardDescription>
                  Search an article, pick colors and sizes like 6X10 or 11X12,
                  then set quantities in the order summary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <OrderToolbar catalog={catalog} />

                {showWorkspace ? (
                  <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                    <ActiveArticlePanel catalog={catalog} />
                    <OrderSummary />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-background px-6 py-16 text-center">
                    <PackageSearch className="mb-3 size-10 text-muted-foreground" />
                    <h3 className="text-sm font-medium">No articles added</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Search for an article number above to start building your
                      order.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
