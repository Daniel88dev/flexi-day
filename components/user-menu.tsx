"use client";

import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-muted/70 flex h-8 items-center gap-1.5 rounded-full pr-2 pl-1"
        >
          {/* Avatar circle */}
          <span className="bg-primary/10 ring-primary/20 flex h-6 w-6 items-center justify-center rounded-full ring-1">
            <User className="text-primary h-3.5 w-3.5" />
          </span>
          <ChevronDown className="text-muted-foreground h-3 w-3" />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2.5 py-0.5">
            <span className="bg-primary/10 ring-primary/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1">
              <User className="text-primary h-4 w-4" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm leading-tight font-semibold">My Account</span>
              <span className="text-muted-foreground text-xs leading-tight">Auth coming soon</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem disabled className="gap-2 text-sm">
            <User className="h-3.5 w-3.5" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="gap-2 text-sm">
            <Settings className="h-3.5 w-3.5" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled
          className="text-destructive focus:text-destructive gap-2 text-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
