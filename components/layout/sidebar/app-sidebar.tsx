import * as React from "react";

import { getUserSession } from "@/actions/auth";
import { getStatCardData } from "@/actions/dashboard";
import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { TeamSwitcher } from "@/components/layout/sidebar/team-switcher";
import { SidebarBudgetCard } from "@/components/layout/sidebar/sidebar-budget-card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export async function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [session, stats] = await Promise.all([
    getUserSession(),
    getStatCardData(),
  ]);
  const user = session?.user;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel className="text-10 sm:text-11 uppercase">
            This month
          </SidebarGroupLabel>
          <SidebarBudgetCard
            spent={stats.monthlyExpenses}
            expected={stats.monthlyIncomeExpected}
          />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-0">
        <NavUser
          user={{
            name: user?.user_metadata?.name ?? user?.email ?? "User",
            email: user?.email ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
