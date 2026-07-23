"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown, Users } from "lucide-react";
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
import { useSession, authClient } from "@/lib/auth-client";

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const { data: session } = useSession();
  const name = session?.user?.name;
  const email = session?.user?.email;

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-muted/70 flex h-8 items-center gap-1.5 rounded-full pr-2 pl-1"
        >
          <span className="bg-primary/10 ring-primary/20 text-primary flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1">
            {name ? getInitials(name) : <User className="h-3.5 w-3.5" />}
          </span>
          <ChevronDown className="text-muted-foreground h-3 w-3" />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2.5 py-0.5">
            <span className="bg-primary/10 ring-primary/20 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1">
              {getInitials(name)}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm leading-tight font-semibold">
                {name ?? "Signed in"}
              </span>
              {email ? (
                <span className="text-muted-foreground truncate text-xs leading-tight">
                  {email}
                </span>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="gap-2 text-sm">
            <Link href="/groups">
              <Users className="h-3.5 w-3.5" />
              My groups
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-2 text-sm">
            <Link href="/settings">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive gap-2 text-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
