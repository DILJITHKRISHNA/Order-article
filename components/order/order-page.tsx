"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, LogOut, PackageSearch, UserRound } from "lucide-react";
import { toast } from "sonner";

import { LoginCard } from "@/components/auth/login-card";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles } from "@/hooks/use-articles";
import { useOrderPersistence } from "@/hooks/use-order-persistence";
import { clearOrderFromStorage } from "@/lib/storage";
import { getZoneLabel, isZone, type Zone } from "@/lib/zones";
import { useOrderStore } from "@/store/order-store";

const LAST_ZONE_KEY = "order-management:last-zone";

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

function OrderWorkspace({
  zone,
  onLogout,
}: {
  zone: Zone;
  onLogout: () => void;
}) {
  const { catalog, isLoading, error } = useArticles();
  useOrderPersistence();
  const selectedArticleNumber = useOrderStore(
    (state) => state.selectedArticleNumber
  );
  const rows = useOrderStore((state) => state.rows);
  const showWorkspace = Boolean(selectedArticleNumber) || rows.length > 0;

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader
        actions={
          <>
            <Badge variant="secondary">{getZoneLabel(zone)}</Badge>
            <Button type="button" variant="secondary" onClick={onLogout}>
              <LogOut data-icon="inline-start" />
              Logout
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:space-y-8 sm:px-6 lg:space-y-6 lg:px-8">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            <Card className="pb-2 sm:pb-0">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Customer Details</CardTitle>
                <CardDescription>
                  Order number is generated automatically. Fill in customer
                  information before submitting your order.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6 sm:pb-4">
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
              <CardContent className="space-y-6 pt-2 sm:pt-0">
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

export function OrderPage() {
  const [zone, setZone] = useState<Zone | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const resetOrder = useOrderStore((state) => state.resetOrder);
  const resetCatalog = useOrderStore((state) => state.resetCatalog);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as { zone: unknown };
        if (!cancelled && isZone(data.zone)) setZone(data.zone);
      } catch {
        // Treated as logged out.
      } finally {
        if (!cancelled) setIsCheckingSession(false);
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = useCallback(
    (nextZone: Zone) => {
      // A draft from another zone would reference articles this zone doesn't have.
      if (localStorage.getItem(LAST_ZONE_KEY) !== nextZone) {
        clearOrderFromStorage();
        resetOrder();
      }
      localStorage.setItem(LAST_ZONE_KEY, nextZone);
      resetCatalog();
      setZone(nextZone);
    },
    [resetCatalog, resetOrder]
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    resetCatalog();
    setZone(null);
    toast.success("Logged out");
  }, [resetCatalog]);

  if (isCheckingSession) {
    return (
      <div className="min-h-full bg-muted/30">
        <AppHeader />
        <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <Skeleton className="h-72 w-full" />
        </main>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="min-h-full bg-muted/30">
        <AppHeader />
        <main className="mx-auto flex max-w-md px-4 py-16 sm:px-6">
          <LoginCard
            title="Sign In"
            description="Choose your zone to place orders."
            icon={UserRound}
            endpoint="/api/auth/login"
            onSuccess={handleLogin}
          />
        </main>
      </div>
    );
  }

  return <OrderWorkspace zone={zone} onLogout={() => void handleLogout()} />;
}
