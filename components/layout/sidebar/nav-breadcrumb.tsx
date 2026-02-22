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
  "/expenses": "Expenses",
  "/budget": "Budget",
  "/categories": "Categories",
  "/recurring": "Recurring",
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
