import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Home, UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

const HomePage = async () => {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <Calendar className="h-6 w-6 text-primary" />
          <span className="ml-2 text-2xl font-bold text-primary">
            Flexi Day
          </span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to Flexi Day
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Simplify your work-life balance. Manage vacations, home office
                  days, and other types of absences with ease.
                </p>
              </div>
              <div className="space-y-2 md:space-y-0 md:space-x-4 md:flex">
                <Button className="w-full md:w-auto">
                  <SignUpButton mode={"modal"}>Register</SignUpButton>
                </Button>
                <Button variant="outline" className="w-full md:w-auto">
                  <SignInButton mode={"modal"}>Login</SignInButton>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 items-center justify-center">
              <div className="flex flex-col items-center space-y-4 text-center">
                <Calendar className="h-12 w-12 text-primary" />
                <h2 className="text-2xl font-bold">Vacation Planning</h2>
                <p className="text-muted-foreground">
                  Easily request and manage your vacation days with our
                  intuitive calendar interface.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <Home className="h-12 w-12 text-primary" />
                <h2 className="text-2xl font-bold">Home Office</h2>
                <p className="text-muted-foreground">
                  Schedule and track your remote work days to maintain
                  transparency with your team.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <UserPlus className="h-12 w-12 text-primary" />
                <h2 className="text-2xl font-bold">Team Coordination</h2>
                <p className="text-muted-foreground">
                  Coordinate absences with your team members to ensure smooth
                  workflow and coverage.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2023 Flexi Day. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
};

export default HomePage;
