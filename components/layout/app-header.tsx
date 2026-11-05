import Image from "next/image";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  /** Optional right-aligned content (zone badge, logout button, ...). */
  actions?: ReactNode;
}

export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/JoggerLogo.jpeg"
            alt="Jogger logo"
            width={64}
            height={64}
            className="size-16 rounded-lg object-contain"
            priority
          />
          <Badge variant="outline" className="px-3 py-1 text-sm font-bold">
            Order Management
          </Badge>
        </div>
        {actions ? (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <Separator />
    </header>
  );
}
