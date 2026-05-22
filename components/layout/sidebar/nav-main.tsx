"use client";

import type { FC, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChartSquare02,
  CreditCard02,
  Grid01,
  RefreshCw04,
  Wallet01,
} from "@untitledui/icons";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type UntitledIcon = FC<
  SVGProps<SVGSVGElement> & { size?: number; color?: string }
>;

type NavItem = {
  name: string;
  icon: UntitledIcon;
  url: string;
};

const navItems: NavItem[] = [
  { name: "Dashboard", url: "/", icon: BarChartSquare02 },
  { name: "Expenses", url: "/transactions", icon: CreditCard02 },
  { name: "Income", url: "/income", icon: Wallet01 },
  { name: "Recurring", url: "/recurring", icon: RefreshCw04 },
  { name: "Categories", url: "/categories", icon: Grid01 },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-10 sm:text-11 uppercase">
        Platform
      </SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton
              asChild
              tooltip={item.name}
              isActive={pathname === item.url}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground data-[active=true]:text-sidebar-primary"
            >
              <Link href={item.url} className="flex items-center gap-2.5">
                {item.icon && <item.icon size={18} />}
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
