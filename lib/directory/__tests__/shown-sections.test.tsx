import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { DirectoryProfile } from "@/lib/api/directory";
import { ShownSectionsProvider, useShownSection } from "../shown-sections";

const showMock = vi.fn();
vi.mock("@/lib/api/directory", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/directory")>()),
  showSensitiveSection: (...args: unknown[]) => showMock(...args),
}));

const profile = (employmentId: string, self = false): DirectoryProfile => ({
  employmentId,
  organizationId: "org-1",
  name: "Jana",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: employmentId, name: "Jana", initials: "J", avatarColor: "x" },
  markers: [],
  self,
  ended: false,
  canReadHistory: false,
  sections: { contact: { level: "READ" } },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <ShownSectionsProvider>{children}</ShownSectionsProvider>
);

const shown = { section: "CONTACT", level: "READ", recorded: true, privateEmail: "a@b.test" };

describe("useShownSection", () => {
  beforeEach(() => {
    showMock.mockReset();
    showMock.mockResolvedValue(shown);
  });

  it("fetches only on show, and keeps the values until the person changes", async () => {
    const { result, rerender } = renderHook(({ person }) => useShownSection(person, "contact"), {
      wrapper,
      initialProps: { person: profile("emp-1") },
    });
    expect(result.current.data).toBeUndefined();
    expect(showMock).not.toHaveBeenCalled();

    await act(() => result.current.show());
    expect(result.current.data).toEqual(shown);

    rerender({ person: profile("emp-2") });
    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(showMock).toHaveBeenCalledTimes(1);
  });

  it("opens the person's own Section by itself, once", async () => {
    const { result } = renderHook(() => useShownSection(profile("emp-1", true), "contact"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(shown));
    expect(showMock).toHaveBeenCalledTimes(1);
    expect(showMock).toHaveBeenCalledWith("org-1", "emp-1", "contact", expect.any(String));
  });
});
