"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminOrderRow } from "@/types/order";

interface AdminOrdersResponse {
  orders: AdminOrderRow[];
  totalLineItems: number;
  totalOrders: number;
}

function buildStats(orders: AdminOrderRow[]) {
  const uniqueOrderNumbers = new Set(orders.map((order) => order.orderNumber));
  return {
    totalLineItems: orders.length,
    totalOrders: uniqueOrderNumbers.size,
  };
}

export function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [stats, setStats] = useState({ totalLineItems: 0, totalOrders: 0 });
  const [storageProvider, setStorageProvider] = useState("local");
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    message: string;
  }>({ configured: false, connected: false, message: "" });

  const applyOrders = useCallback((nextOrders: AdminOrderRow[]) => {
    setOrders(nextOrders);
    setStats(buildStats(nextOrders));
    setIsAuthenticated(true);
  }, []);

  const loadOrders = useCallback(async () => {
    const response = await fetch("/api/admin/orders", {
      credentials: "include",
      cache: "no-store",
    });

    if (response.status === 401) {
      setIsAuthenticated(false);
      return false;
    }

    if (!response.ok) {
      throw new Error("Failed to load orders");
    }

    const data = (await response.json()) as AdminOrdersResponse;
    applyOrders(data.orders);
    return true;
  }, [applyOrders]);

  useEffect(() => {
    async function init() {
      try {
        const sessionResponse = await fetch("/api/admin/session", {
          credentials: "include",
          cache: "no-store",
        });
        const session = (await sessionResponse.json()) as {
          authenticated: boolean;
        };

        if (session.authenticated) {
          await loadOrders();
          const storageResponse = await fetch("/api/admin/storage", {
            credentials: "include",
            cache: "no-store",
          });
          if (storageResponse.ok) {
            const storage = (await storageResponse.json()) as {
              provider: string;
              supabaseConfigured: boolean;
              supabaseConnected: boolean;
              supabaseMessage: string;
            };
            setStorageProvider(storage.provider);
            setSupabaseStatus({
              configured: storage.supabaseConfigured,
              connected: storage.supabaseConnected,
              message: storage.supabaseMessage,
            });
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, [loadOrders]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: password.trim() }),
      });

      if (!response.ok) {
        toast.error("Invalid admin password");
        return;
      }

      router.refresh();

      const loggedIn = await loadOrders();
      if (!loggedIn) {
        toast.error("Login succeeded but session was not saved. Try again.");
        return;
      }

      const storageResponse = await fetch("/api/admin/storage", {
        credentials: "include",
        cache: "no-store",
      });
      if (storageResponse.ok) {
        const storage = (await storageResponse.json()) as {
          provider: string;
          supabaseConfigured: boolean;
          supabaseConnected: boolean;
          supabaseMessage: string;
        };
        setStorageProvider(storage.provider);
        setSupabaseStatus({
          configured: storage.supabaseConfigured,
          connected: storage.supabaseConnected,
          message: storage.supabaseMessage,
        });
      }

      toast.success("Admin access granted");
      setPassword("");
    } catch {
      toast.error("Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    setOrders([]);
    setStats({ totalLineItems: 0, totalOrders: 0 });
    router.refresh();
    toast.success("Logged out");
  };

  const handleDownload = () => {
    window.location.href = "/api/admin/orders/download";
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-muted/30">
        <AppHeader />
        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-full bg-muted/30">
        <AppHeader />
        <main className="mx-auto flex max-w-md px-4 py-16 sm:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                Admin Access
              </CardTitle>
              <CardDescription>
                Enter the admin password to view all submitted orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(event) => void handleLogin(event)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Admin password"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/30">
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Admin Orders</CardTitle>
              <CardDescription>
                Master list of all submitted customer orders.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleDownload}>
                <Download data-icon="inline-start" />
                Download Excel
              </Button>
              <Button type="button" variant="secondary" onClick={() => void handleLogout()}>
                <LogOut data-icon="inline-start" />
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">{stats.totalOrders} orders</Badge>
            <Badge variant="outline">{stats.totalLineItems} line items</Badge>
            <Badge variant="outline">
              Storage:{" "}
              {storageProvider === "supabase" ? "Supabase" : "Local server"}
            </Badge>
            {supabaseStatus.configured ? (
              <Badge
                variant={supabaseStatus.connected ? "secondary" : "destructive"}
              >
                Supabase:{" "}
                {supabaseStatus.connected ? "Connected" : "Connection failed"}
              </Badge>
            ) : (
              <Badge variant="outline">
                Supabase: Add credentials to .env.local
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Submitted Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No orders submitted yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Executive</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow key={`${order.orderNumber}-${order.article}-${order.color}-${order.size}-${index}`}>
                      <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.shopName || "-"}</TableCell>
                      <TableCell>{order.executiveName || "-"}</TableCell>
                      <TableCell>{order.location}</TableCell>
                      <TableCell>{order.phoneNumber}</TableCell>
                      <TableCell>{order.article}</TableCell>
                      <TableCell>{order.color}</TableCell>
                      <TableCell>{order.size}</TableCell>
                      <TableCell className="text-right tabular-nums">{order.qty}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.submittedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
