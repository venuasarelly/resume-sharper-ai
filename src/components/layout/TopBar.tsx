import { Bell, ChevronDown } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resumeProfile } from "@/lib/mock-data";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full border border-border/70 py-1 pl-1 pr-2 transition-colors hover:bg-accent">
            <Avatar className="size-7">
              <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                AM
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{resumeProfile.fullName}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{resumeProfile.fullName}</p>
            <p className="text-xs text-muted-foreground">{resumeProfile.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
