"use client";

import Link from "next/link";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { NavLink } from "@/lib/navigation/shell-links";
import { useShellNav } from "@/lib/navigation/use-shell-nav";
import { cn, initials } from "@/lib/utils";

const menuButtonClass = cn(
  "h-9 gap-2.5 rounded-[var(--radius-sm)] px-2.5 font-semibold text-[color:var(--text-muted)]",
  "hover:bg-[var(--surface-2)] hover:text-[color:var(--text)]",
  "data-active:bg-[var(--primary-soft)] data-active:text-[color:var(--primary-strong)]",
  "group-data-[collapsible=icon]:mx-auto"
);

function NavItem({ link, isActive }: { link: NavLink; isActive: boolean }) {
  const Icon = link.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={link.label}
        className={menuButtonClass}
      >
        <Link href={link.href} aria-current={isActive ? "page" : undefined}>
          <Icon className="size-[18px]" />
          <span>{link.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function CollapseButton() {
  const { open, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const label = open ? t.nav.collapse : t.nav.expand;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleSidebar}
      className="grid size-8 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[color:var(--text)]"
    >
      {open ? <PanelLeftClose className="size-[18px]" /> : <PanelLeft className="size-[18px]" />}
    </button>
  );
}

function UserBlock() {
  const { data: session } = useSession();
  const name = session?.user?.name;
  const email = session?.user?.email;
  return (
    <div className="flex items-center gap-2.5 px-2 pt-2 pb-1 whitespace-nowrap group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <span className="bg-primary/10 ring-primary/20 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1">
        {initials(name)}
      </span>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <div className="truncate text-[13.5px] leading-tight font-semibold">{name}</div>
        {email ? (
          <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {email}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Desktop navigation: sectioned, collapsible to icons. Hidden below `md`, where the bottom bar takes over. */
export function AppSidebar() {
  const { sections, utility, isActive } = useShellNav();

  return (
    <Sidebar collapsible="icon" className="border-[color:var(--sidebar-border)]">
      <SidebarHeader className="flex-row items-center justify-between px-3 pt-3.5 pb-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2.5 group-data-[collapsible=icon]:px-0">
        <Logo
          size={25}
          href="/dashboard"
          className="group-data-[collapsible=icon]:[&>span:last-child]:hidden"
        />
        <CollapseButton />
      </SidebarHeader>

      <SidebarContent className="px-1">
        {sections.map((section) => (
          <SidebarGroup key={section.id} className="py-1">
            <SidebarGroupLabel className="h-auto px-2.5 pt-3 pb-1.5 text-[11px] font-bold tracking-[0.08em] text-[color:var(--text-faint)] uppercase group-data-[collapsible=icon]:mx-1.5 group-data-[collapsible=icon]:my-2 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:h-px group-data-[collapsible=icon]:bg-[var(--border)] group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:opacity-100">
              <span className="group-data-[collapsible=icon]:sr-only">{section.label}</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((link) => (
                  <NavItem key={link.href} link={link} isActive={isActive(link.href)} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t px-3 pt-2 pb-3" style={{ borderColor: "var(--border)" }}>
        <SidebarMenu>
          {utility.map((link) => (
            <NavItem key={link.href} link={link} isActive={isActive(link.href)} />
          ))}
        </SidebarMenu>
        <UserBlock />
      </SidebarFooter>
    </Sidebar>
  );
}
