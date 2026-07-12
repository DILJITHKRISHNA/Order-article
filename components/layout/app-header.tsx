import Image from "next/image";

import { Separator } from "@/components/ui/separator";

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Image
          src="/JoggerLogo.jpeg"
          alt="Jogger logo"
          width={48}
          height={48}
          className="size-12 rounded-lg object-contain"
          priority
        />
        <div>
          <h1 className="text-lg font-bold tracking-tight">Order Management</h1>
          <p className="text-sm text-muted-foreground">
            ERP-style order entry for footwear articles
          </p>
        </div>
      </div>
      <Separator />
    </header>
  );
}
