"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  LogOut,
  PackageSearch,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { LOGIN_MODES } from "@/lib/auth/config";
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
import { deleteDraft, listDrafts } from "@/lib/drafts";
import { getZoneLabel, isZone, type Zone } from "@/lib/zones";
import { useOrderStore } from "@/store/order-store";

type OrderStep = "customer" | "articles";

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
  useOrderPersistence(zone);
  const selectedArticleNumber = useOrderStore(
    (state) => state.selectedArticleNumber
  );
  const rows = useOrderStore((state) => state.rows);
  const customer = useOrderStore((state) => state.customer);
  const hydrateOrder = useOrderStore((state) => state.hydrateOrder);
  const showWorkspace = Boolean(selectedArticleNumber) || rows.length > 0;

  const [step, setStep] = useState<OrderStep>("customer");

  // The most recent saved order other than the one being edited.
  // Re-read whenever the order changes so the Load button stays current.
  const previousDraft = useMemo(
    () =>
      listDrafts(zone).find(
        (draft) => draft.customer.orderNumber !== customer.orderNumber
      ) ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zone, customer.orderNumber, rows]
  );

  const handleLoad = () => {
    if (!previousDraft) {
      toast.error("No saved order found on this device");
      return;
    }
    // Drop the current order only if it is empty; a started order stays saved.
    if (rows.length === 0) deleteDraft(zone, customer.orderNumber);
    hydrateOrder(previousDraft.customer, previousDraft.rows);
    setStep(previousDraft.rows.length > 0 ? "articles" : "customer");
    toast.success(
      `Restored order${
        previousDraft.customer.shopName
          ? ` for ${previousDraft.customer.shopName}`
          : ""
      }`
    );
  };

  const handleResumeDraft = (hasItems: boolean) => {
    if (hasItems) setStep("articles");
  };

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
            <nav
              aria-label="Order steps"
              className="flex items-center gap-1 text-sm"
            >
              {step === "articles" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Back to customer details"
                  onClick={() => setStep("customer")}
                >
                  <ArrowLeft />
                </Button>
              ) : null}
              {step === "articles" ? (
                <button
                  type="button"
                  onClick={() => setStep("customer")}
                  className="font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  Customer Details
                </button>
              ) : (
                <span aria-current="step" className="font-semibold">
                  Customer Details
                </span>
              )}
              <ChevronRight className="size-4 text-muted-foreground" />
              <span
                aria-current={step === "articles" ? "step" : undefined}
                className={
                  step === "articles"
                    ? "font-semibold"
                    : "text-muted-foreground"
                }
              >
                Articles
              </span>
            </nav>

            {step === "customer" ? (
              <Card className="pb-2 sm:pb-0">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    Customer Details
                  </CardTitle>
                  <CardDescription>
                    Order number is generated automatically. Fill in customer
                    information, then continue to add articles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6 sm:pb-4">
                  <CustomerForm
                    zone={zone}
                    onNext={() => setStep("articles")}
                    onResume={handleResumeDraft}
                    canLoad={Boolean(previousDraft)}
                    onLoad={handleLoad}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Articles</CardTitle>
                  <CardDescription>
                    {customer.shopName ? `${customer.shopName} · ` : ""}
                    {customer.orderNumber}. Search an article, pick colors and
                    sizes like 6X10 or 11X12, then set quantities in the order
                    summary.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2 sm:pt-0">
                  <OrderToolbar
                    catalog={catalog}
                    zone={zone}
                    canLoad={Boolean(previousDraft)}
                    onLoad={handleLoad}
                    onOrderReset={() => setStep("customer")}
                  />

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
                        Search for an article number above to start building
                        your order.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
      // Drafts are saved per zone and picked up again by the workspace.
      resetOrder();
      resetCatalog();
      setZone(nextZone);
    },
    [resetCatalog, resetOrder]
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    resetOrder();
    resetCatalog();
    setZone(null);
    toast.success("Logged out");
  }, [resetCatalog, resetOrder]);

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
            mode={LOGIN_MODES.user}
            onSuccess={handleLogin}
          />
        </main>
      </div>
    );
  }

  return <OrderWorkspace zone={zone} onLogout={() => void handleLogout()} />;
}
