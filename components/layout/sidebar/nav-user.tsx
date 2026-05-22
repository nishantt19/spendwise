"use client";

import { ChevronSelectorVertical, LogOut01, Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "next-themes";

import { getInitials } from "@/lib/utils";
import { useLogout } from "@/hooks/use-logout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";

interface NavUserProps {
  user: {
    name: string;
    email: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const initials = getInitials(user.name);
  const { logout, isPending } = useLogout();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarFooter className="data-[state=open]:bg-sidebar-accent/70 data-[state=open]:text-sidebar-accent-foreground cursor-pointer group/user p-2 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground rounded-none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="hover:bg-transparent p-0 group-data-[collapsible=icon]:p-0! cursor-pointer">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg shrink-0">
                  <AvatarFallback className="rounded-full bg-sidebar-primary/15 text-sidebar-primary text-11 sm:text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-xs sm:text-13 font-medium">
                    {user.name}
                  </span>
                  <span className="truncate text-11 text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <ChevronSelectorVertical className="ml-auto size-4 text-muted-foreground shrink-0 opacity-60 group-data-[state=open]/user:opacity-100 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--sidebar-user-dropdown-width) min-w-52 rounded-lg"
        side={isMobile ? "bottom" : "top"}
        align="center"
        sideOffset={6}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg shrink-0">
              <AvatarFallback className="rounded-full bg-sidebar-primary/15 text-sidebar-primary text-11 sm:text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid text-left leading-tight">
              <span className="truncate text-xs sm:text-13 font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-11 text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={toggleTheme} className="gap-2 px-3 cursor-pointer">
          {theme === "dark" ? (
            <Sun className="size-3.5 sm:size-4" />
          ) : (
            <Moon01 className="size-3.5 sm:size-4" />
          )}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="gap-2 px-3 cursor-pointer"
          disabled={isPending}
          onSelect={(e) => {
            e.preventDefault();
            logout();
          }}
        >
          {isPending ? (
            <Spinner className="size-3.5 sm:size-4" />
          ) : (
            <LogOut01 className="size-3.5 sm:size-4 text-destructive" />
          )}
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
