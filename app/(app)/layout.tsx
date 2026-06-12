import { NavBar } from "@/components/nav-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="container mx-auto max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
