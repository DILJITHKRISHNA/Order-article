"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

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
import { REQUIRE_LOGIN_CREDENTIALS } from "@/lib/auth/config";
import { DEFAULT_ZONE, isZone, ZONES, type Zone } from "@/lib/zones";

interface LoginCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  endpoint: string;
  onSuccess: (zone: Zone) => void | Promise<void>;
}

export function LoginCard({
  title,
  description,
  icon: Icon,
  endpoint,
  onSuccess,
}: LoginCardProps) {
  const [zone, setZone] = useState<Zone>(DEFAULT_ZONE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ zone, email: email.trim(), password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Login failed");
        return;
      }

      setPassword("");
      await onSuccess(zone);
    } catch {
      toast.error("Unable to reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-zone">Zone</Label>
            <select
              id="login-zone"
              value={zone}
              onChange={(event) => {
                if (isZone(event.target.value)) setZone(event.target.value);
              }}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {ZONES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          {REQUIRE_LOGIN_CREDENTIALS ? (
            <>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </div>
            </>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
