"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Calendar,
  CalendarIcon,
  Home,
  Settings,
  Users,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/ModeToggle";
import { UserButton } from "@clerk/nextjs";

const NavigationBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const NavItems = () => (
    <>
      <Link
        className="flex items-center text-sm font-medium hover:underline underline-offset-4"
        href="/dashboard"
      >
        <Home className="h-4 w-4 mr-2" />
        Dashboard
      </Link>
      <Link
        className="flex items-center text-sm font-medium hover:underline underline-offset-4"
        href="/my-calendar"
      >
        <Calendar className="h-4 w-4 mr-2" />
        My Calendar
      </Link>
      <Link
        className="flex items-center text-sm font-medium hover:underline underline-offset-4"
        href="/team"
      >
        <Users className="h-4 w-4 mr-2" />
        Team
      </Link>
      <Link
        className="flex items-center text-sm font-medium hover:underline underline-offset-4"
        href="/settings"
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        <Link className="flex items-center justify-center" href="/dashboard">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold text-primary">Flexi Day</span>
        </Link>
        <nav className="ml-auto hidden md:flex items-center space-x-4 sm:space-x-6">
          <NavItems />
        </nav>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col space-y-4">
              <NavItems />
            </nav>
          </SheetContent>
        </Sheet>
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
};

export default NavigationBar;
