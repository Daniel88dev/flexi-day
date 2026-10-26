import type { ReactNode } from "react";
import { ShownSectionsProvider } from "@/lib/directory/shown-sections";

/** Keeps opened Sensitive sections while the viewer moves between one person's profile and edit page. */
export default function DirectoryPersonLayout({ children }: { children: ReactNode }) {
  return <ShownSectionsProvider>{children}</ShownSectionsProvider>;
}
