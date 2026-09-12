"use client";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { BottomBar } from "@/components/shell/bottom-bar";
import { TopBar } from "@/components/shell/top-bar";
import { GraceBanner } from "@/components/billing/grace-banner";
import { Footer } from "@/components/footer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          { "--sidebar-width": "248px", "--sidebar-width-icon": "68px" } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="min-w-0 max-md:pb-[72px]">
          <TopBar />
          <GraceBanner />
          <div className="mx-auto w-full max-w-[1340px] flex-1 px-7 py-8 max-md:px-4">
            {children}
          </div>
          <Footer containerClassName="max-w-[1340px] max-md:px-4" />
        </SidebarInset>
        <BottomBar />
      </SidebarProvider>
    </TooltipProvider>
  );
}
