"use client";

import { AlertCircle, PackageSearch } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { ArticleSectionCard } from "@/components/order/article-section-card";
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
  const sections = useOrderStore((state) => state.sections);

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
                <CardTitle>Customer Details</CardTitle>
                <CardDescription>
                  Order number is generated automatically. Fill in customer
                  information before saving.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Articles</CardTitle>
                <CardDescription>
                  Search by article number, add sections, and set quantities
                  for each color and size combination.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <OrderToolbar catalog={catalog} />

                {sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-background px-6 py-16 text-center">
                    <PackageSearch className="mb-3 size-10 text-muted-foreground" />
                    <h3 className="text-sm font-medium">No articles added</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Use the search box above to find an article number and
                      add it to your order.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                    <div className="space-y-4">
                      {sections.map((section, index) => (
                        <ArticleSectionCard
                          key={section.id}
                          section={section}
                          catalog={catalog}
                          index={index}
                        />
                      ))}
                    </div>
                    <OrderSummary />
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
