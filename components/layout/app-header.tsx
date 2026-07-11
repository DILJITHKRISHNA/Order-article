import { ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <Badge variant="outline" className="hidden sm:inline-flex">
              Order Management
            </Badge>
          </div>
        </div>
      </div>
      <Separator />
    </header>
  );
}
