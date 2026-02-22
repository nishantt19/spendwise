"use client";

import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/income": "Income",
  "/recurring": "Recurring",
  "/categories": "Categories",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function NavBreadcrumb() {
  const pathname = usePathname();
  const label = routeLabels[pathname] ?? pathname.split("/").pop();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium text-foreground">
            {label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
